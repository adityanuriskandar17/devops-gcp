# Best Practices

Panduan dan rekomendasi dasar untuk mengelola server Linux secara aman, rapi, dan production-ready — mencakup security hardening dasar, file permission hygiene, log rotation, monitoring disk/inode, dan checklist kesiapan production.

---

## 1. Security Hardening Dasar

### SSH & Akses Remote

| Practice | Cara |
|----------|------|
| Disable root login via SSH | Edit `/etc/ssh/sshd_config` → `PermitRootLogin no` |
| Pakai SSH key, bukan password | `PasswordAuthentication no` di `sshd_config` |
| Ganti port SSH default (opsional, defense-in-depth) | `Port 2222` di `sshd_config` — bukan pengganti hardening lain, hanya kurangi noise scan otomatis |
| Batasi user yang boleh SSH | `AllowUsers alice bob` di `sshd_config` |
| Restart SSH setelah edit config | `sudo systemctl restart sshd` |
| Verifikasi config sebelum restart | `sshd -t` (test syntax, hindari lockout diri sendiri) |

```bash
# Setelah edit sshd_config, SELALU test syntax dulu
sudo sshd -t
sudo systemctl restart sshd
```

**Penting:** Sebelum restart `sshd` setelah mengubah config, pastikan test syntax dengan `sshd -t` dan **jangan tutup session SSH yang sedang aktif** sampai kamu berhasil login dengan session baru di terminal lain. Kesalahan config SSH bisa mengunci kamu keluar dari server tanpa akses console lain.

### fail2ban — Proteksi Brute Force

```
Konsep fail2ban:

  Attacker mencoba login SSH berkali-kali (brute force)
              │
              ▼
  fail2ban memonitor log auth (/var/log/auth.log atau journalctl)
              │
              ▼
  Deteksi N kali gagal login dalam periode waktu tertentu
              │
              ▼
  Otomatis BAN IP attacker via firewall (iptables/nftables)
  untuk durasi tertentu (default beberapa menit - jam)
```

```bash
sudo apt install fail2ban        # Debian/Ubuntu
sudo dnf install fail2ban         # RHEL family

sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd    # cek status jail untuk SSH
sudo fail2ban-client set sshd unbanip 1.2.3.4   # unban IP tertentu
```

### Update & Minimal Install

| Practice | Alasan |
|----------|--------|
| Aktifkan automated security update (`unattended-upgrades`/`dnf-automatic`) | Patch vulnerability tanpa delay manual |
| Install hanya paket yang benar-benar dibutuhkan | Setiap paket terinstall = potential attack surface tambahan |
| Uninstall service yang tidak dipakai | Kurangi port terbuka & proses yang bisa dieksploitasi |
| Review package terinstall secara berkala | `apt list --installed` / `dnf list installed` |
| Gunakan firewall (`ufw`/`firewalld`) untuk batasi port terbuka | Default deny, hanya allow port yang benar-benar dipakai |

```bash
# Cek port yang listening — pastikan hanya yang memang dibutuhkan
sudo ss -tulnp

# ufw (Debian/Ubuntu) — contoh setup dasar
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# firewalld (RHEL family) — contoh setup dasar
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**Best practice:** Prinsip **minimal install** — server production sebaiknya hanya menjalankan service yang benar-benar diperlukan. Setiap package/service tambahan adalah potential attack surface. Gunakan image/base minimal (misal Ubuntu Server minimal install, bukan desktop) untuk server.

---

## 2. File Permission Hygiene

| Practice | Cara |
|----------|------|
| Set umask restrictive untuk service account | `umask 077` di service startup / systemd unit |
| File credential/secret selalu `600` | `chmod 600 .env credentials.json *.pem` |
| Direktori privat selalu `700` | `chmod 700 ~/.ssh` |
| Jangan pernah `777` di production | Cari & audit: `find / -perm -777 -type f 2>/dev/null` |
| Audit binary setuid secara berkala | `find / -perm -4000 -type f 2>/dev/null` |
| Pisahkan owner per aplikasi (jangan semua jalan sebagai root) | 1 service account per aplikasi |
| Jangan simpan credential di file world-readable | Pakai secret manager kalau tersedia, atau minimal `600` + owner yang tepat |

```bash
# Audit cepat: cari file dengan permission terlalu terbuka
find /etc /var/www /opt -perm -o+w -type f 2>/dev/null    # world-writable files
find / -perm -4000 -type f 2>/dev/null                     # setuid binaries
find / -nouser -o -nogroup 2>/dev/null                      # file tanpa owner valid
```

**Catatan:** Lihat dokumentasi [02 - User, Group & Permission](02-file-permissions.md) untuk penjelasan lengkap model permission, special bits, dan skenario insiden permission misconfiguration.

---

## 3. Log Rotation (logrotate)

```
Kenapa perlu logrotate:

  Tanpa log rotation:                Dengan logrotate:
  ┌───────────────────────┐          ┌───────────────────────┐
  │  app.log tumbuh terus    │          │  app.log (current)     │
  │  tanpa batas              │          │  app.log.1 (kemarin)   │
  │  → bisa habiskan          │          │  app.log.2.gz          │
  │    seluruh disk           │          │  app.log.3.gz          │
  │  → disk penuh → service   │          │  (lama otomatis        │
  │    crash                   │          │   di-compress/dihapus) │
  └───────────────────────┘          └───────────────────────┘
```

```
# /etc/logrotate.d/myapp — contoh konfigurasi
/var/log/myapp/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 appuser appgroup
    sharedscripts
    postrotate
        systemctl reload myapp > /dev/null 2>&1 || true
    endscript
}
```

| Directive | Fungsi |
|-----------|--------|
| `daily` / `weekly` / `monthly` | Frekuensi rotasi |
| `rotate N` | Simpan N file log lama sebelum dihapus |
| `compress` | Compress log lama jadi `.gz` |
| `delaycompress` | Jangan compress file rotasi paling baru (masih mungkin dibaca aplikasi) |
| `missingok` | Jangan error kalau file log tidak ada |
| `notifempty` | Jangan rotate kalau file log kosong |
| `create MODE OWNER GROUP` | Buat file log baru dengan permission & owner spesifik |
| `postrotate ... endscript` | Command yang dijalankan setelah rotasi (misal reload service agar menulis ke file baru) |

```bash
sudo logrotate -d /etc/logrotate.d/myapp     # dry-run, lihat apa yang akan terjadi
sudo logrotate -f /etc/logrotate.d/myapp      # force rotate sekarang (testing)
cat /var/lib/logrotate/status                   # cek kapan terakhir tiap config di-rotate
```

**Best practice:** Selalu pakai `postrotate` untuk reload/signal aplikasi setelah rotasi kalau aplikasi tidak otomatis "reopen" file log (banyak aplikasi tetap menulis ke file descriptor lama yang sudah di-rename, sehingga log baru tidak pernah terisi tanpa reload).

---

## 4. Monitoring Disk & Inode Usage

| Practice | Cara |
|----------|------|
| Cek disk usage rutin | `df -h` |
| Cek inode usage rutin (sering terlewat!) | `df -i` |
| Cari direktori terbesar penyebab disk penuh | `du -h --max-depth=1 /var \| sort -rh` |
| Set alert threshold disk usage | Monitoring tool (Cloud Monitoring, Prometheus, Zabbix, dll) — alert di >80-85% |
| Bersihkan cache package manager berkala | `apt clean` / `dnf clean all` |
| Bersihkan journal systemd yang menumpuk | `journalctl --vacuum-time=14d` |

```bash
# Quick health check disk & inode
df -h
df -i

# Cari 10 direktori terbesar di /var
du -h --max-depth=2 /var 2>/dev/null | sort -rh | head -10

# Cek berapa besar journal systemd memakai disk
journalctl --disk-usage
```

```
⚠ Kasus umum yang sering terlewat:

  df -h → /var 60% used   (terlihat AMAN)
  df -i → /var 98% inode used   (SEBENARNYA KRITIS!)

  Penyebab umum: jutaan file kecil menumpuk
  (session file, cache file, email queue, log per-request)

  Fix: identifikasi & hapus/rotate file kecil yang menumpuk,
       bukan hanya lihat total ukuran byte
```

**Penting:** Selalu cek **kedua** metric — `df -h` (space) dan `df -i` (inode). Sebuah filesystem bisa kehabisan inode (gagal buat file baru) meski space-nya masih longgar, terutama di filesystem yang menyimpan sangat banyak file kecil.

---

## 5. Checklist Production Readiness

```
Access & Authentication:
  [ ] Root login via SSH di-disable (PermitRootLogin no)
  [ ] Password authentication di-disable, pakai SSH key
  [ ] fail2ban aktif untuk SSH (atau service exposed lainnya)
  [ ] sudo dikonfigurasi per-user, bukan share password root
  [ ] Firewall aktif (ufw/firewalld), default deny, hanya allow port yang dipakai

Package & Update:
  [ ] Automated security update aktif (unattended-upgrades / dnf-automatic)
  [ ] Hanya paket yang dibutuhkan terinstall (minimal install)
  [ ] Repository pihak ketiga sudah diverifikasi GPG signing-nya

Permission & File System:
  [ ] File credential/secret permission 600, owner tepat
  [ ] Tidak ada file/direktori permission 777 di production
  [ ] Audit binary setuid sudah dilakukan
  [ ] umask default sudah sesuai (restrictive untuk service account)

Process & Service:
  [ ] Aplikasi jalan sebagai service account, BUKAN root
  [ ] Systemd unit dikonfigurasi Restart=on-failure untuk auto-recovery
  [ ] Service yang tidak dipakai sudah di-disable/uninstall

Logging & Monitoring:
  [ ] logrotate dikonfigurasi untuk semua log aplikasi
  [ ] Monitoring disk usage (df -h) DAN inode usage (df -i) aktif
  [ ] Alert threshold disk/inode terpasang (misal >85%)
  [ ] journalctl vacuum policy dikonfigurasi (hindari journal membesar tanpa batas)

Backup & Recovery:
  [ ] Ada strategi backup untuk data penting
  [ ] Backup pernah ditest untuk di-restore (bukan cuma dibuat)

Dokumentasi & Konsistensi:
  [ ] Naming convention hostname/user/service konsisten
  [ ] Konfigurasi kritikal (sshd_config, firewall rules) sudah didokumentasikan
  [ ] Ada runbook dasar untuk insiden umum (disk penuh, service down, dll)
```

---

*Dokumen ini berdasarkan Linux (kernel, distro, dan tooling) yang stabil dan didukung luas per 2026.*
