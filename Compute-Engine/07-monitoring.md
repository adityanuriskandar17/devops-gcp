# Monitoring & Logging

Halaman-halaman di GCP Console untuk memantau kesehatan VM.

---

## 1. VM Detail Monitoring

> **Console:** Compute Engine → VM instances → klik VM → tab **Monitoring**

Halaman ini menampilkan grafik built-in untuk VM tertentu:

| Grafik | Apa yang ditampilkan | Kapan perlu perhatian |
|--------|---------------------|----------------------|
| **CPU utilization** | % penggunaan CPU | > 80% sustained = perlu scale up |
| **Network bytes** | Traffic masuk/keluar | Spike tidak biasa = potensi attack/bug |
| **Disk bytes** | Read/write ke disk | Tinggi terus = disk bottleneck |
| **Disk operations** | IOPS disk | Kalau mendekati limit disk type |

**Catatan:** Grafik ini hanya monitoring dasar. Untuk monitoring lebih detail (RAM, per-process, custom), butuh **Ops Agent**.

---

## 2. Ops Agent

> **Console:** Compute Engine → VM instances → klik VM → tab **Observability** → **Install Ops Agent**

### Apa itu Ops Agent?

Agent yang di-install di dalam VM untuk mengirim metrics dan logs ke Cloud Monitoring & Cloud Logging.

```
╔══════════════════════════════════════════════════════╗
║  Tanpa Ops Agent         ║  Dengan Ops Agent        ║
╠══════════════════════════╬═══════════════════════════╣
║  CPU utilization         ║  CPU utilization          ║
║  Network bytes           ║  Network bytes            ║
║  Disk bytes              ║  Disk bytes               ║
║                          ║  + Memory utilization     ║
║                          ║  + Disk usage (%)         ║
║                          ║  + Process monitoring     ║
║                          ║  + Custom app metrics     ║
║                          ║  + Syslog                 ║
║                          ║  + App logs (nginx, etc)  ║
╚══════════════════════════╩═══════════════════════════╝
```

### Install via Console

> **Console:** VM → Observability → **Install agent** (tombol)

Console akan guide kamu menjalankan install script di SSH.

### Install via SSH (manual)

```bash
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install

# Cek status
sudo systemctl status google-cloud-ops-agent
```

### Install via OS Config Policy (otomatis ke semua VM)

> **Console:** Compute Engine → VM instances → klik VM → Observability → **Install policy**

Atau CLI:

```bash
gcloud compute instances ops-agents policies create ops-agent-policy \
    --agent-rules="type=ops-agent,version=current-major,package-state=installed" \
    --os-types="short-name=ubuntu,version=20.04" \
    --zone=asia-southeast2-a
```

| Method | Kelebihan | Kekurangan |
|--------|-----------|------------|
| **Manual install per VM** | Kontrol penuh | Harus SSH ke setiap VM |
| **OS Config Policy** | Otomatis ke semua VM yang cocok | Setup awal lebih rumit |

---

## 3. Cloud Monitoring - Dashboards

> **Console:** Monitoring → **Dashboards**

### Default Dashboards

GCP otomatis buat beberapa dashboard:

| Dashboard | Isi |
|-----------|-----|
| **GCE VM Instances** | Overview semua VM (CPU, network, disk) |
| **Disks** | Status dan performa semua disk |
| **Firewall Insights** | Statistik firewall rules |

### Create Custom Dashboard

> **Console:** Monitoring → Dashboards → **Create Dashboard**

#### Widget Types

```
Add widget:
┌────────────────────────────┐
│  Line chart                │  ← Trend over time
│  Stacked area chart        │  ← Stacked metric comparison
│  Bar chart                 │  ← Point-in-time comparison
│  Scorecard                 │  ← Single number (current value)
│  Table                     │  ← Multi-resource overview
│  Gauge                     │  ← Speedometer style
│  Heatmap                   │  ← Density visualization
│  Logs panel                │  ← Log entries
│  Alert chart               │  ← Alert incidents
│  Text                      │  ← Notes/description
└────────────────────────────┘
```

#### Recommended Widgets untuk VM

| Widget | Metric | Keterangan |
|--------|--------|------------|
| **Line chart** | `compute.googleapis.com/instance/cpu/utilization` | CPU per VM |
| **Line chart** | `agent.googleapis.com/memory/percent_used` | RAM per VM (butuh Ops Agent) |
| **Scorecard** | `agent.googleapis.com/disk/percent_used` | Disk usage current |
| **Line chart** | `compute.googleapis.com/instance/network/received_bytes_count` | Network in |
| **Table** | Multiple VM metrics | Overview semua VM sekaligus |

---

## 4. Uptime Checks

> **Console:** Monitoring → **Uptime checks**

Cek apakah endpoint (website/API) masih hidup dari luar Google's network.

### Create Uptime Check

> **Console:** Monitoring → Uptime checks → **Create Uptime Check**

#### Protocol

| Pilihan | Kapan pakai |
|---------|-------------|
| **HTTP** | Website non-SSL |
| **HTTPS** | Website SSL (recommended) |
| **TCP** | Non-HTTP service (database, custom port) |

#### Resource Type

| Pilihan | Keterangan |
|---------|------------|
| **URL** | Cek domain/URL spesifik (contoh: `https://ftlgym.com`) |
| **Instance** | Cek VM langsung (via internal/external IP) |
| **App Engine / Cloud Run** | Cek managed service |

#### Check Frequency

| Frequency | Kelebihan | Kekurangan |
|-----------|-----------|------------|
| **1 minute** | Deteksi downtime cepat | Banyak request, bisa trigger rate limit |
| **5 minutes** (default) | Balance | Max 5 menit baru terdeteksi |
| **10 minutes** | Hemat resource | Lambat deteksi |
| **15 minutes** | Minimal | Sangat lambat |

#### Response Validation

| Setting | Keterangan |
|---------|------------|
| **Response code** | Expect 200 OK (atau code lain) |
| **Content match** | Cek apakah response body mengandung text tertentu |
| **Response timeout** | Berapa lama tunggu sebelum dianggap gagal (default 10s) |

#### Contoh Uptime Checks untuk Project ftlgym

| Check | Protocol | Target | Frequency |
|-------|----------|--------|-----------|
| ftlgym.com | HTTPS | https://ftlgym.com | 5 min |
| dc.ftlgym.com | HTTPS | https://dc.ftlgym.com | 5 min |
| esign.ftlgym.com | HTTPS | https://esign.ftlgym.com | 5 min |
| API Health | HTTPS | https://api1.ftlgym.com/health | 5 min |

---

## 5. Alerting Policies

> **Console:** Monitoring → **Alerting**

### Create Alert Policy

> **Console:** Monitoring → Alerting → **Create Policy**

#### Step 1: Select Metric

> **Console:** Create Policy → **Add Condition** → **Select a metric**

Metric browser untuk pilih apa yang mau di-monitor:

| Metric | Path di Console | Butuh Ops Agent? |
|--------|----------------|------------------|
| CPU utilization | `VM Instance → Cpu → Utilization` | Tidak |
| Memory usage | `VM Instance → Memory → Percent used` | Ya |
| Disk usage | `VM Instance → Disk → Percent used` | Ya |
| Network received | `VM Instance → Network → Received bytes` | Tidak |
| Uptime check | `Uptime Check URL → Check passed` | Tidak |

#### Step 2: Configure Trigger

> **Console:** Condition → **Configure trigger**

| Setting | Pilihan | Keterangan |
|---------|---------|------------|
| **Condition type** | Threshold / Absence | Threshold: nilai > X. Absence: metric hilang (VM mati) |
| **Threshold** | Angka target | Contoh: CPU > 80% |
| **Duration** | 1 min - 24 hours | Berapa lama metric harus di atas threshold baru trigger alert |

##### Recommended Alert Thresholds

| Alert | Metric | Threshold | Duration | Severity |
|-------|--------|-----------|----------|----------|
| CPU tinggi | CPU utilization | > 80% | 5 menit | Warning |
| CPU critical | CPU utilization | > 95% | 5 menit | Critical |
| RAM tinggi | Memory percent_used | > 85% | 5 menit | Warning |
| RAM critical | Memory percent_used | > 95% | 5 menit | Critical |
| Disk hampir penuh | Disk percent_used | > 85% | 10 menit | Warning |
| Disk penuh | Disk percent_used | > 95% | 5 menit | Critical |
| VM down | Uptime check | Failed | 1 menit | Critical |

#### Step 3: Notification Channel

> **Console:** Create Policy → **Notification channels**

| Channel | Kelebihan | Kekurangan |
|---------|-----------|------------|
| **Email** | Simple, semua orang punya | Bisa terlewat, lambat response |
| **SMS** | Langsung terlihat | Terbatas karakter |
| **Slack** | Team notification, bisa action | Butuh Slack integration |
| **PagerDuty** | On-call management | Bayar, enterprise-grade |
| **Webhook** | Bisa trigger custom automation | Harus develop endpoint sendiri |
| **Mobile App (Cloud Console)** | Push notification ke HP | Butuh install app |

**Setup Notification Channel:**

> **Console:** Monitoring → Alerting → **Edit notification channels** (link di atas halaman)

#### Step 4: Documentation

Tambahkan instruksi apa yang harus dilakukan saat alert triggered.

```
Contoh documentation:
1. SSH ke VM yang affected
2. Cek top/htop untuk proses yang makan resource
3. Cek log: sudo journalctl -u nginx --since "30 min ago"
4. Kalau disk penuh: df -h, cari file besar
5. Eskalasi ke team lead kalau tidak bisa resolve dalam 15 menit
```

---

## 6. Cloud Logging

> **Console:** Logging → **Logs Explorer**

### Logs Explorer

> **Console:** Logging → Logs Explorer

Query field untuk filter log:

```
# Log dari VM tertentu
resource.type="gce_instance"
resource.labels.instance_id="5090093623958960526"

# Log severity ERROR ke atas
resource.type="gce_instance" AND severity>=ERROR

# Log syslog
resource.type="gce_instance" AND log_name="projects/webserver-435507/logs/syslog"

# Log dari semua VM di project
resource.type="gce_instance"
```

### Log dari VM (butuh Ops Agent)

| Log | Path di VM | Dikirim ke Cloud Logging? |
|-----|-----------|--------------------------|
| Syslog | `/var/log/syslog` | Ya (dengan Ops Agent) |
| Auth log | `/var/log/auth.log` | Ya (dengan Ops Agent) |
| Nginx access | `/var/log/nginx/access.log` | Ya (kalau dikonfigurasi) |
| Nginx error | `/var/log/nginx/error.log` | Ya (kalau dikonfigurasi) |
| Docker logs | `docker logs` | Ya (kalau dikonfigurasi) |
| Serial console | N/A | Ya (otomatis) |

### Log-based Alerts

> **Console:** Logging → Logs Explorer → **Create alert** (tombol di atas)

Buat alert berdasarkan kemunculan log tertentu.

| Contoh | Query | Alert saat |
|--------|-------|------------|
| SSH brute force | `jsonPayload.message=~"Failed password"` | Ada banyak failed SSH login |
| OOM kill | `textPayload=~"Out of memory"` | VM kehabisan RAM |
| Disk error | `textPayload=~"I/O error"` | Ada masalah disk |
| App error | `textPayload=~"ERROR"` | Ada error di application log |

---

## 7. VM Serial Port Logs

> **Console:** Compute Engine → VM instances → klik VM → **Logs** → **Serial port 1 (console)**

Serial port log menampilkan boot messages, kernel messages, dan systemd output. Sangat berguna saat VM tidak bisa SSH.

**Yang bisa dilihat:**
- Boot sequence
- Service startup (nginx, docker, sshd)
- Kernel errors (OOM, disk errors)
- Shutdown messages

---

## 8. Health Check Monitoring

> **Console:** Compute Engine → **Health checks**

List semua health check dan statusnya.

> **Console:** Network services → Load balancing → klik LB → **Backend** → lihat health status

Health status per backend:

| Status | Artinya | Aksi |
|--------|---------|------|
| ✅ Healthy | VM respond OK | Tidak perlu aksi |
| ❌ Unhealthy | VM tidak respond | Cek VM, cek app, cek firewall |
| ⚠️ Unknown | Belum bisa cek | Tunggu atau cek firewall health check |

**Debugging "No Healthy Upstream":**

```
1. Console: LB → Backend → health status
   → Kalau unhealthy, lanjut step 2

2. Console: VM → cek Status RUNNING
   → Kalau STOPPED/TERMINATED, start VM

3. Console: VM → Serial port log
   → Cek apakah app (nginx/lsws) start normal

4. Console: VPC → Firewall
   → Cek rule untuk 35.191.0.0/16 dan 130.211.0.0/22 (health check ranges)

5. SSH ke VM → cek app
   → sudo systemctl status lsws (atau nginx)
   → ss -tlnp | grep :80
```
