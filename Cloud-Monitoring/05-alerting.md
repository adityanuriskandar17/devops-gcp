# Alerting Policies

Dokumentasi lengkap **Alerting** di Google Cloud Monitoring — notifikasi otomatis saat metrics melebihi batas yang ditentukan.

**Console:** Monitoring → **Alerting**

---

## Apa itu Alerting?

Alerting adalah sistem **notifikasi otomatis** yang memantau metrics secara real-time dan mengirim pemberitahuan ketika kondisi tertentu terpenuhi (misal CPU > 80% selama 5 menit).

```
Alur Alerting:

  Metrics (CPU, RAM, Disk, dll)
       │
       ▼
  ┌─────────────────────────┐
  │   Alerting Policy        │
  │                         │
  │   Condition:            │
  │   "CPU > 80% for 5m"   │
  │                         │
  │   ┌─────┐   ┌───────┐  │
  │   │ OK  │──►│ FIRING│  │  ← threshold tercapai
  │   └─────┘   └───┬───┘  │
  └──────────────────┼──────┘
                     │
                     ▼
  ┌─────────────────────────┐
  │   Notification Channels  │
  │                         │
  │   📧 Email              │
  │   💬 Slack              │
  │   📱 PagerDuty          │
  │   📨 Pub/Sub            │
  └─────────────────────────┘
                     │
                     ▼
  ┌─────────────────────────┐
  │   Incident Created       │
  │   → Tim on-call respond  │
  │   → Acknowledge          │
  │   → Resolve              │
  └─────────────────────────┘
```

---

## Membuat Alerting Policy

**Console:** Monitoring → Alerting → **+ Create Policy**

### Step 1: Select a Metric and Configure Trigger

```
Console UI:

  ┌─────────────────────────────────────────────────┐
  │  Add condition                                   │
  │                                                 │
  │  Select a metric:                               │
  │  ┌─────────────────────────────────────────┐    │
  │  │ VM Instance > cpu > CPU utilization    ▼│    │
  │  └─────────────────────────────────────────┘    │
  │                                                 │
  │  Add filter: (optional)                         │
  │  ┌──────────────┐  ┌──────┐  ┌──────────┐      │
  │  │ instance_name│  │  =   │  │ web-server│      │
  │  └──────────────┘  └──────┘  └──────────┘      │
  │                                                 │
  │  Transform data:                                │
  │  Rolling window:  ┌──────┐                      │
  │                   │ 5 min│                      │
  │                   └──────┘                      │
  │  Rolling window function: ┌──────┐              │
  │                           │ mean │              │
  │                           └──────┘              │
  └─────────────────────────────────────────────────┘
```

### Step 2: Configure Alert Trigger

```
  ┌─────────────────────────────────────────────────┐
  │  Configure alert trigger                         │
  │                                                 │
  │  Condition type:                                │
  │  ● Threshold    ○ Absence                       │
  │                                                 │
  │  Alert trigger:                                 │
  │  ● Any time series violates                     │
  │  ○ Percent of time series violates              │
  │                                                 │
  │  Threshold position:  ┌────────────────┐        │
  │                       │ Above threshold│        │
  │                       └────────────────┘        │
  │                                                 │
  │  Threshold value:  ┌──────┐                     │
  │                    │  80  │  %                   │
  │                    └──────┘                     │
  └─────────────────────────────────────────────────┘
```

| Field | Pilihan | Deskripsi |
|-------|---------|-----------|
| **Condition type** | Threshold | Alert saat metric **melebihi** nilai tertentu |
| | Absence | Alert saat **tidak ada data** selama durasi tertentu |
| **Alert trigger** | Any time series violates | Alert jika **salah satu** resource melanggar |
| | % of time series | Alert jika **X%** resource melanggar |
| **Threshold position** | Above threshold | Metric **di atas** nilai (misal CPU > 80%) |
| | Below threshold | Metric **di bawah** nilai (misal disk space < 10%) |
| **Threshold value** | Angka | Nilai batas — misal `80` (untuk 80%) |
| **Rolling window** | 1m, 5m, 10m, 15m, 30m, 1h | Berapa lama kondisi harus terjadi sebelum alert |

### Step 3: Configure Notifications

```
  ┌─────────────────────────────────────────────────┐
  │  Notification channels                           │
  │                                                 │
  │  ☑ ops-team-slack (#alerts)                     │
  │  ☑ ops-team-email (ops@company.com)             │
  │  ☐ pagerduty-critical                           │
  │                                                 │
  │  + Manage notification channels                 │
  └─────────────────────────────────────────────────┘
```

### Step 4: Name & Documentation

```
  ┌─────────────────────────────────────────────────┐
  │  Alert name:                                     │
  │  ┌─────────────────────────────────────────┐    │
  │  │ High CPU on production VMs              │    │
  │  └─────────────────────────────────────────┘    │
  │                                                 │
  │  Severity: ┌──────────┐                         │
  │            │ Critical ▼│                         │
  │            └──────────┘                         │
  │                                                 │
  │  Documentation: (markdown — muncul di notif)    │
  │  ┌─────────────────────────────────────────┐    │
  │  │ CPU melebihi 80%.                       │    │
  │  │ Cek: ssh ke VM → htop                   │    │
  │  │ Runbook: go/cpu-high-runbook            │    │
  │  └─────────────────────────────────────────┘    │
  │                                                 │
  │           [ Save Policy ]                       │
  └─────────────────────────────────────────────────┘
```

---

## Condition Types

### 1. Metric Threshold

Paling umum — alert saat metric melewati batas.

```
Contoh: CPU > 80% selama 5 menit

  100%|                    ╱──╲
   80%|· · · · · · · ·╱─ ─ ─ ─╲─ · · ← THRESHOLD
   60%|           ╱──╱           ╲──
   40%|      ╱───╱                  ╲───
   20%|─────╱
      └────────────────────────────────── time
                     ↑
                  ALERT FIRES (above 80% for 5min)
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Paling intuitif dan mudah dikonfigurasi | Threshold statis — tidak menyesuaikan pola normal |
| Mendukung semua jenis metrics | Butuh tuning agar tidak terlalu sensitif (noisy) |
| Bisa combine duration (5m, 10m) | Alert storm jika banyak resource kena sekaligus |

### 2. Metric Absence

Alert saat **tidak ada data** — biasanya artinya resource down atau agent mati.

| Kelebihan | Kekurangan |
|-----------|------------|
| Deteksi resource mati/offline | False positive jika resource memang dimatikan |
| Deteksi Ops Agent crash | Harus set duration yang pas (terlalu pendek = noisy) |

### 3. Log-Based Alert

Alert berdasarkan **log entry** — bukan metric.

**Console:** Monitoring → Alerting → Create Policy → Select condition → **Log match condition**

```
Contoh: Alert saat log mengandung "ERROR" atau "OOMKilled"

  Query: resource.type="gce_instance"
         AND severity="ERROR"
         AND textPayload:"OOMKilled"
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Alert berbasis event spesifik (error message) | Butuh Cloud Logging aktif |
| Tidak perlu custom metric | Query yang kompleks bisa lambat |
| Deteksi pattern yang tidak bisa via metric | Rate limiting: min 5 menit antar notifikasi |

### 4. Forecast-Based (Preview)

Alert berdasarkan **prediksi** — misal "disk akan penuh dalam 24 jam".

| Kelebihan | Kekurangan |
|-----------|------------|
| Proaktif — alert sebelum masalah terjadi | Masih preview, belum GA |
| Cocok untuk disk/storage yang tumbuh gradual | Prediksi bisa salah jika pola berubah |

---

## Notification Channels

**Console:** Monitoring → Alerting → **Edit notification channels**

| Channel | Konfigurasi | Cocok Untuk | Kelebihan | Kekurangan |
|---------|------------|-------------|-----------|------------|
| **Email** | Alamat email | Semua level alert | Simple, semua orang punya | Bisa masuk spam, lambat dibaca |
| **Slack** | Webhook URL / Slack app | Tim engineering | Real-time, bisa thread | Butuh setup webhook/app |
| **PagerDuty** | Integration key | Critical/on-call | Auto-escalation, scheduling | Berbayar, setup lebih kompleks |
| **Pub/Sub** | Topic name | Custom integration | Flexible, bisa trigger Cloud Function | Butuh coding untuk consume |
| **Webhooks** | URL endpoint | Custom system | Sangat flexible | Harus maintain endpoint |
| **SMS** | Phone number | Critical emergency | Pasti dibaca | Mahal, terbatas karakter |
| **Google Chat** | Space webhook | Tim yang pakai Google Workspace | Integrasi native | Terbatas ke Google Chat |
| **Mobile App** | Cloud Console app | Ops on-the-go | Push notification | Butuh install app |

**Rekomendasi kombinasi:**

```
Severity Critical:  PagerDuty + Slack + SMS
Severity Error:     Slack + Email
Severity Warning:   Email saja (atau Slack low-priority channel)
```

---

## Severity Levels

| Severity | Kapan Digunakan | Contoh | Response Time |
|----------|----------------|--------|---------------|
| **Critical** | Sistem down / sangat terdampak | VM unreachable, DB crash, uptime check fail | Segera (< 15 menit) |
| **Error** | Degradasi performa signifikan | CPU > 90%, memory > 95%, error rate tinggi | < 1 jam |
| **Warning** | Potensi masalah di masa depan | Disk > 80%, slow query meningkat | < 4 jam / next business day |

---

## Incidents

**Console:** Monitoring → Alerting → **Incidents**

Saat alert firing, otomatis terbuat **Incident** — record dari alert event.

```
Incident Lifecycle:

  OPEN → ACKNOWLEDGED → RESOLVED
    │         │              │
    │    Tim melihat &       │
    │    mulai investigate   │
    │                        │
    └── Bisa auto-resolve ───┘
        jika metric kembali normal
```

| Field | Deskripsi |
|-------|-----------|
| **Status** | Open / Acknowledged / Resolved |
| **Started** | Kapan alert pertama kali fire |
| **Duration** | Berapa lama incident berlangsung |
| **Policy** | Alert policy mana yang trigger |
| **Resource** | Resource mana yang terdampak |
| **Annotations** | Catatan dari tim yang handle |

---

## Contoh Alerting Production

### 1. High CPU Alert

```
Policy name:    High CPU - Production VMs
Metric:         compute.googleapis.com/instance/cpu/utilization
Filter:         metadata.system_labels.state = "ACTIVE"
Threshold:      > 0.8 (80%)
Duration:       5 minutes
Severity:       Error
Notifications:  Slack (#ops-alerts) + Email
Documentation:  "CPU tinggi pada VM production. Cek htop, kemungkinan traffic spike."
```

### 2. Disk Almost Full (Critical)

```
Policy name:    Disk Almost Full
Metric:         compute.googleapis.com/instance/disk/percent_used
Threshold:      > 0.9 (90%)
Duration:       5 minutes
Severity:       Critical
Notifications:  PagerDuty + Slack + SMS
Documentation:  "Disk > 90%. Segera bersihkan log/tmp atau resize disk."
```

### 3. Cloud SQL Connections Warning

```
Policy name:    Cloud SQL High Connections
Metric:         cloudsql.googleapis.com/database/network/connections
Threshold:      > 100
Duration:       10 minutes
Severity:       Warning
Notifications:  Email
Documentation:  "Connection pool tinggi. Cek apakah ada connection leak di app."
```

### 4. Uptime Check Failed

```
Policy name:    Website Down
Condition:      Uptime check "website-prod" fails from 2+ regions
Duration:       1 minute
Severity:       Critical
Notifications:  PagerDuty + Slack + SMS
Documentation:  "Website down. Cek load balancer, backend health, DNS."
```

### 5. No Data (Agent Down)

```
Policy name:    Monitoring Agent Offline
Condition:      Metric absence — agent.googleapis.com/agent/uptime
Duration:       5 minutes
Severity:       Error
Notifications:  Slack + Email
Documentation:  "Ops Agent tidak mengirim data. SSH ke VM → systemctl status google-cloud-ops-agent"
```

---

## Kelebihan & Kekurangan Alerting

| Kelebihan | Kekurangan |
|-----------|------------|
| Deteksi otomatis 24/7 — tidak perlu manual monitor | Alert terlalu banyak = **alert fatigue** (diabaikan) |
| Multi-channel notifikasi (email, Slack, PagerDuty) | Butuh **tuning** threshold yang tepat |
| Incident tracking built-in | Log-based alert: min interval 5 menit |
| Documentation di alert = runbook untuk tim | Alert storm saat outage besar (banyak alert sekaligus) |
| Severity levels untuk prioritas | Forecast-based masih preview |
| Free tier: 500 metric-based policies | Custom metrics bisa tambah cost |
| Integrasi native dengan semua GCP service | — |

---

## Tips Menghindari Alert Fatigue

| Strategi | Penjelasan |
|----------|-----------|
| **Duration yang cukup** | Jangan alert saat spike sesaat — gunakan rolling window 5-10m |
| **Severity yang tepat** | Tidak semua alert harus Critical |
| **Routing yang benar** | Critical → PagerDuty, Warning → email saja |
| **Grouping** | Group alert per resource untuk hindari alert storm |
| **Snooze** | Mute alert sementara saat maintenance |
| **Review rutin** | Evaluasi apakah alert masih relevan setiap bulan |
