# Incident Report: "No Healthy Upstream" — All Domains Down

**Tanggal Kejadian:** 2 April 2026  
**Tanggal Resolved:** 2 April 2026  
**Durasi Downtime:** ~8 jam (00:08 - 08:47 WIB)  
**Severity:** Critical — Semua domain tidak bisa diakses  

---

## Domain yang Terdampak

- ftlgym.com
- esign.ftlgym.com
- dc.ftlgym.com
- hold.ftlgym.com
- padel.ftlgym.com
- schedules.ftlgym.com
- epicultura.com
- recruitment.epicultura.com
- ftluniverse.com
- lulusan.akademipilatesindonesia.com

---

## Gejala

Semua domain menampilkan error **"no healthy upstream"** saat diakses via browser. Error ini berasal dari GCP Load Balancer (Envoy) yang menganggap backend VM tidak merespons.

---

## Root Cause

### VM `ftlgymweb` (10.0.1.3) — Network Interface Mati

Network service (`systemd-networkd`) di dalam VM crash dan gagal restart, menyebabkan VM kehilangan konektivitas jaringan meskipun status VM di GCP Console tetap **RUNNING**.

### Penyebab: Cron Job Storm di Midnight

Pada jam **00:00 WIB**, **15+ cron job** dieksekusi secara bersamaan:

| Cron Job | Deskripsi |
|---|---|
| IncScheduler.py (6 instance) | Backup dengan interval berbeda (30min, 1hr, 6hr, 12hr, Daily, Weekly) |
| renew.py | SSL certificate renewal (tiap Kamis) |
| findBWUsage.py | Bandwidth usage check (baca semua access log) |
| postfixSenderPolicy cleanup | Email policy cleanup |
| htaccess check | Cek .htaccess + restart LiteSpeed |
| logrotate | Log rotation (gagal karena MySQL access denied) |
| man-db regeneration | Man page rebuild |
| cleansessions | Session cleanup |
| acme.sh (00:07) | SSL cert renewal via ACME |

Semua job ini spawn banyak child process (Python, cat, find, wget) secara bersamaan, menyebabkan **CPU dan I/O saturation**.

### Timeline Detail

```
00:00:01  15+ cron job dieksekusi bersamaan
00:00:02  logrotate gagal (MySQL access denied)
00:00:02  findBWUsage.py membaca semua access log via sudo cat
          ...system under heavy load...
00:08:07  systemd-networkd kena Watchdog timeout (limit 3min)
          → proses frozen selama 3+ menit, tidak respond ke watchdog ping
00:08:07  systemd kill systemd-networkd dengan SIGABRT (status=6/ABRT)
00:09:37  systemd mencoba restart systemd-networkd
00:09:38  restart GAGAL berulang (status=203/EXEC) — system masih overloaded
00:09:38  systemd menyerah: "Start request repeated too quickly"
          → systemd-resolved juga gagal restart dengan error yang sama
          → NETWORK MATI PERMANEN
~01:36    Tim mencoba SSH via GCP Console — gagal
~01:43    VM di-stop
~01:47    VM di-start
~02:00    VM di-reset (setelah start pertama masih bermasalah)
~09:00    VM fully operational, semua service berjalan normal
```

### Bukti dari Journal Log

**Watchdog Timeout (penyebab awal):**
```
Apr 02 00:08:07 systemd-networkd.service: Watchdog timeout (limit 3min)!
Apr 02 00:08:07 systemd-networkd.service: Killing process 918 (systemd-network) with signal SIGABRT
Apr 02 00:08:07 systemd-networkd.service: Failed with result 'watchdog'
```

**Restart Gagal (network mati permanen):**
```
Apr 02 00:09:38 systemd-networkd.service: Main process exited, code=exited, status=203/EXEC
Apr 02 00:09:38 Failed to start Network Service
Apr 02 00:09:38 Start request repeated too quickly
```

### Yang Bukan Penyebab

- **Bukan OOM (Out of Memory)** — tidak ada OOM kill event di log
- **Bukan Disk I/O Error** — tidak ada disk error di kernel log
- **Bukan GCP Live Migration** — tidak ada system_event migration di audit log
- **Bukan Package Update** — dpkg log dan apt history kosong
- **Bukan Kernel Panic** — tidak ada kernel error di dmesg

---

## VM `ftlhorizon1` (10.0.1.7) — Issue Terpisah

VM ini mengalami masalah berbeda: **PM2 process list kosong** sehingga Next.js app (pilates-presentation) di port 3000 tidak berjalan. LiteSpeed proxy ke `127.0.0.1:3000` gagal → "no healthy upstream".

Penyebab: PM2 tidak di-setup dengan `pm2 save` dan `pm2 startup`, sehingga setiap VM restart, PM2 start tanpa app.

---

## Resolusi

### Langkah yang Dilakukan

1. **VM `ftlgymweb`**: Stop → Start via GCP Console
2. **VM `ftlgymweb`**: Verifikasi network OK (`ping google.com` berhasil)
3. **VM `ftlgymweb`**: Verifikasi semua service berjalan (LiteSpeed, Redis, RabbitMQ, dll)
4. **VM `ftlhorizon1`**: Start pilates-presentation via PM2
   ```bash
   cd /var/www/pilates-presentation && pm2 start npm --name "pilates-presentation" -- start
   ```
5. **Verifikasi** semua domain bisa diakses normal

---

## Pencegahan

### 1. Stagger Cron Jobs (Prioritas Tinggi)

Ubah jadwal cron agar tidak semua jalan di menit yang sama:

```cron
# BACKUP - sebarkan jadwalnya
2 0 * * * /usr/local/CyberCP/bin/python /usr/local/CyberCP/IncBackups/IncScheduler.py Daily
5 0 * * 0 /usr/local/CyberCP/bin/python /usr/local/CyberCP/IncBackups/IncScheduler.py Weekly
*/30 * * * * /usr/local/CyberCP/bin/python /usr/local/CyberCP/IncBackups/IncScheduler.py '30 Minutes'
10 * * * * /usr/local/CyberCP/bin/python /usr/local/CyberCP/IncBackups/IncScheduler.py '1 Hour'
15 */6 * * * /usr/local/CyberCP/bin/python /usr/local/CyberCP/IncBackups/IncScheduler.py '6 Hours'
20 */12 * * * /usr/local/CyberCP/bin/python /usr/local/CyberCP/IncBackups/IncScheduler.py '12 Hours'
25 1 * * * /usr/local/CyberCP/bin/python /usr/local/CyberCP/IncBackups/IncScheduler.py '1 Day'
30 0 */3 * * /usr/local/CyberCP/bin/python /usr/local/CyberCP/IncBackups/IncScheduler.py '3 Days'
35 0 * * 0 /usr/local/CyberCP/bin/python /usr/local/CyberCP/IncBackups/IncScheduler.py '1 Week'

# MAINTENANCE - pindah ke jam berbeda
40 0 * * * /usr/local/CyberCP/bin/python /usr/local/CyberCP/plogical/findBWUsage.py >/dev/null 2>&1
45 0 * * * /usr/local/CyberCP/bin/python /usr/local/CyberCP/postfixSenderPolicy/client.py hourlyCleanup >/dev/null 2>&1
50 0 * * 4 /usr/local/CyberCP/bin/python /usr/local/CyberCP/plogical/renew.py >/dev/null 2>&1
0 3 * * * /usr/local/CyberCP/bin/python /usr/local/CyberCP/plogical/upgradeCritical.py >/dev/null 2>&1
```

### 2. Network Watchdog Script (Prioritas Tinggi)

Auto-detect dan auto-restart networking jika mati:

```bash
# /usr/local/bin/network-watchdog.sh
#!/bin/bash
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
PING=$(ping -c 1 -W 3 169.254.169.254 2>&1)
if [ $? -ne 0 ]; then
    echo "$TIMESTAMP NETWORK_DOWN: $PING" >> /var/log/network-watchdog.log
    systemctl restart systemd-networkd
    systemctl restart systemd-resolved
    echo "$TIMESTAMP NETWORK_RESTART_ATTEMPTED" >> /var/log/network-watchdog.log
else
    echo "$TIMESTAMP OK" >> /var/log/network-watchdog.log
fi
```

Cron: `*/5 * * * * /usr/local/bin/network-watchdog.sh`

### 3. PM2 Auto-Start (Prioritas Tinggi)

Di semua VM yang menjalankan Node.js app:

```bash
pm2 save
pm2 startup
# Jalankan command sudo yang muncul dari output pm2 startup
```

### 4. Fix LogRotate MySQL Error (Prioritas Rendah)

LogRotate gagal karena MySQL access denied. Perlu fix konfigurasi:
```
error: 'Access denied for user 'root'@'localhost' (using password: NO)'
```

### 5. GCP Monitoring (Opsional)

Setup Uptime Checks di GCP Monitoring untuk alert otomatis jika domain down.

---

## Informasi Teknis

| Item | Detail |
|---|---|
| VM | ftlgymweb (n2-highcpu-16) |
| Zone | asia-southeast2-a |
| Internal IP | 10.0.1.3 |
| Instance ID | 5090093623958960526 |
| OS | Ubuntu 20.04 (Focal) |
| Kernel | 5.15.0-1083-gcp |
| Web Server | OpenLiteSpeed (CyberPanel) |
| Panel | CyberPanel |
| Network | virtio-net via systemd-networkd |
