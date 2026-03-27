# Cloud Logging

Dokumentasi lengkap **Cloud Logging** — managed log management service untuk mengumpulkan, mencari, dan menganalisis log dari seluruh resource GCP.

**Console:** Navigation menu → **Logging**

---

## Apa itu Cloud Logging?

Cloud Logging mengumpulkan **log** (teks/event) dari semua GCP resource secara otomatis ke satu tempat terpusat — berbeda dengan Cloud Monitoring yang mengumpulkan **metrics** (angka).

```
Sumber Log:

  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Compute  │  │   GKE    │  │ Cloud SQL│  │ Cloud Run│
  │ Engine   │  │ Pods/Logs│  │ Slow Log │  │ Req Logs │
  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
       │             │              │              │
       └──────┬──────┴──────┬───────┘──────┬───────┘
              ▼             ▼              ▼
       ┌────────────────────────────────────────┐
       │          Cloud Logging                  │
       │                                        │
       │   ┌────────────┐  ┌────────────┐       │
       │   │ Log Storage │  │ Log Router │       │
       │   │ (30 hari)  │  │  (Sinks)   │       │
       │   └────────────┘  └─────┬──────┘       │
       │                         │               │
       │              ┌──────────┼──────────┐    │
       │              ▼          ▼          ▼    │
       │        Cloud Storage  BigQuery  Pub/Sub │
       │        (archive)     (analysis)(stream) │
       └────────────────────────────────────────┘
```

---

## Log Explorer

**Console:** Logging → **Logs Explorer**

Interface utama untuk mencari dan menganalisis log.

```
Console UI:

  ┌─────────────────────────────────────────────────────────┐
  │  Logs Explorer                                           │
  │                                                         │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │ 🔍 Query:                                         │  │
  │  │ resource.type="gce_instance"                      │  │
  │  │ AND severity>=ERROR                               │  │
  │  │                                                   │  │
  │  │ [ Run query ]  [ Clear ]  [ Stream logs ]         │  │
  │  └───────────────────────────────────────────────────┘  │
  │                                                         │
  │  Time range: ┌──────────────────┐                       │
  │              │ Last 1 hour     ▼│                       │
  │              └──────────────────┘                       │
  │                                                         │
  │  ┌─────────────┐  ┌─────────────────────────────────┐  │
  │  │ Log fields  │  │ Log entries                      │  │
  │  │             │  │                                  │  │
  │  │ Resource:   │  │ 14:23:01 ERROR Connection refused│  │
  │  │  gce_inst.. │  │ 14:22:55 ERROR Timeout reached  │  │
  │  │  gke_cont.. │  │ 14:22:50 WARNING High latency   │  │
  │  │             │  │ 14:22:45 INFO  Request completed │  │
  │  │ Severity:   │  │ 14:22:40 INFO  Server started   │  │
  │  │  ERROR (23) │  │ ...                              │  │
  │  │  WARNING(5) │  │                                  │  │
  │  │  INFO (142) │  │                                  │  │
  │  └─────────────┘  └─────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────┘
```

### Panel Utama

| Panel | Deskripsi |
|-------|-----------|
| **Query bar** | Tempat menulis query — bisa teks bebas atau structured query |
| **Time range** | Filter waktu (last 1h, 6h, 24h, 7d, custom range) |
| **Log fields** (kiri) | Summary jumlah log per resource type, severity, label |
| **Log entries** (kanan) | Daftar log entry dengan timestamp, severity, dan pesan |
| **Stream logs** | Mode real-time — log muncul otomatis saat masuk |

---

## Severity Levels

| Level | Warna | Arti | Contoh |
|-------|-------|------|--------|
| **Emergency** | Merah gelap | Sistem unusable | Kernel panic |
| **Alert** | Merah | Perlu tindakan segera | Database corruption |
| **Critical** | Merah | Kondisi kritis | SSL cert expired, service crash |
| **Error** | Merah muda | Error terjadi | 500 Internal Server Error, connection refused |
| **Warning** | Kuning | Potensi masalah | High memory usage, deprecated API call |
| **Notice** | Biru | Normal tapi signifikan | Config change, user login |
| **Info** | Putih/abu | Informasional | Request completed, server started |
| **Debug** | Abu-abu | Detail debugging | Variable values, query execution plan |
| **Default** | Abu-abu | Tidak ada severity | Log tanpa severity label |

---

## Query Language

### Basic Queries

```
-- Cari text di semua log
"connection refused"

-- Filter by resource type
resource.type="gce_instance"

-- Filter by severity
severity>=ERROR

-- Filter by instance name
resource.labels.instance_id="1234567890"

-- Filter by project
resource.labels.project_id="my-project"
```

### Advanced Queries

```
-- Combine dengan AND
resource.type="gce_instance"
AND severity>=ERROR
AND textPayload:"OOMKilled"

-- Combine dengan OR
severity=ERROR OR severity=CRITICAL

-- NOT (exclude)
resource.type="gce_instance"
AND NOT textPayload:"health check"

-- Timestamp range
timestamp>="2026-03-23T00:00:00Z"
AND timestamp<="2026-03-23T23:59:59Z"

-- JSON payload field
jsonPayload.status="failed"
jsonPayload.responseCode>=500

-- Regex match
textPayload=~"error|fail|timeout"

-- Specific log name
logName="projects/my-project/logs/syslog"
```

### Contoh Query per Skenario

| Skenario | Query |
|----------|-------|
| Semua error di VM | `resource.type="gce_instance" AND severity>=ERROR` |
| 500 errors di Load Balancer | `resource.type="http_load_balancer" AND httpRequest.status>=500` |
| GKE pod crash | `resource.type="k8s_container" AND severity>=ERROR AND textPayload:"CrashLoopBackOff"` |
| Cloud SQL slow query | `resource.type="cloudsql_database" AND textPayload:"slow query"` |
| Siapa hapus VM (audit) | `resource.type="gce_instance" AND protoPayload.methodName="v1.compute.instances.delete"` |
| SSH login ke VM | `resource.type="gce_instance" AND textPayload:"Accepted publickey"` |
| App deploy di Cloud Run | `resource.type="cloud_run_revision" AND textPayload:"deploying"` |

---

## Log Types

### 1. Platform Logs

Log yang otomatis dikirim oleh GCP services.

| Service | Log Name | Isi |
|---------|----------|-----|
| Compute Engine | `syslog`, `kern.log` | System log, kernel messages |
| GKE | `stdout`, `stderr` | Container output/error |
| Cloud SQL | `mysql.err`, `postgres.log` | Database error, slow query |
| Cloud Run | `requests`, `stderr` | HTTP request log, app errors |
| Load Balancer | `requests` | HTTP request/response log |

### 2. User Logs (via Ops Agent)

Log dari aplikasi yang dikirim via **Ops Agent** (diinstall di VM).

```
Install Ops Agent:
  curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
  sudo bash add-google-cloud-ops-agent-repo.sh --also-install
```

### 3. Audit Logs

**Siapa melakukan apa** di GCP Console/API.

| Tipe | Deskripsi | Contoh |
|------|-----------|--------|
| **Admin Activity** | Perubahan konfigurasi resource (always on, gratis) | Create VM, delete bucket, change IAM |
| **Data Access** | Akses data (bisa diaktifkan, bayar) | Read GCS object, query BigQuery |
| **System Event** | Event sistem otomatis | Live migration, auto-scaling |
| **Policy Denied** | Request yang ditolak oleh IAM/policy | Unauthorized access attempt |

---

## Log-Based Metrics

**Console:** Logging → **Log-based metrics**

Membuat **metric** dari log entries — bisa dipakai di Dashboard dan Alerting.

### Counter Metric

Menghitung berapa kali log entry tertentu muncul.

```
Contoh: Hitung jumlah 500 errors per menit

  Metric name:  http_500_errors
  Filter:       resource.type="http_load_balancer"
                AND httpRequest.status=500
  Type:         Counter

  Hasil: metric yang bisa di-chart di Dashboard
         dan di-alert di Alerting
```

### Distribution Metric

Mengekstrak nilai numerik dari log (misal latency).

```
Contoh: Distribusi latency dari request log

  Metric name:  request_latency
  Filter:       resource.type="http_load_balancer"
  Field:        httpRequest.latency
  Type:         Distribution

  Hasil: histogram latency (p50, p95, p99)
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Buat metric tanpa ubah kode aplikasi | Counter gratis, distribution bayar |
| Bisa di-alert sama seperti metrics biasa | Query filter harus tepat |
| Menghubungkan logs ↔ metrics | Delay 1-2 menit dari log masuk ke metric |

---

## Log Router (Sinks)

**Console:** Logging → **Log Router**

Mengirim (routing) log ke destinasi lain selain default storage.

```
Default flow:

  Logs masuk → _Default sink → Cloud Logging Storage (30 hari)

Custom sinks:

  Logs masuk ──┬──► _Default → Logging Storage (30 hari)
               ├──► Sink 1 → Cloud Storage bucket (archive, murah)
               ├──► Sink 2 → BigQuery dataset (SQL analysis)
               └──► Sink 3 → Pub/Sub topic (real-time processing)
```

### Destinasi Sink

| Destinasi | Kegunaan | Kelebihan | Kekurangan |
|-----------|----------|-----------|------------|
| **Cloud Storage** | Archive log untuk compliance | Murah, long-term | Tidak bisa query real-time |
| **BigQuery** | Analisis log dengan SQL | SQL query powerful, join data | Cost per GB stored + query |
| **Pub/Sub** | Streaming ke SIEM/external | Real-time, flexible | Butuh consumer (Cloud Function, dll) |
| **Logging bucket** | Custom retention | Beda retention per bucket | Setup lebih rumit |

### Exclusion Filters

Mengurangi cost dengan **exclude** log yang tidak perlu.

```
Console: Log Router → _Default sink → Edit → Exclusion filters

  Filter: resource.type="k8s_container"
          AND severity=DEBUG

  Efek: Debug logs dari GKE TIDAK disimpan
        → Hemat storage cost
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Hemat biaya storage signifikan | Log yang di-exclude HILANG permanen |
| Kurangi noise di Log Explorer | Bisa kehilangan info penting jika filter terlalu agresif |

---

## Cloud Logging vs Cloud Monitoring

| Aspek | Cloud Logging | Cloud Monitoring |
|-------|---------------|------------------|
| **Data type** | **Log** (teks/event) | **Metric** (angka/time series) |
| **Pertanyaan** | "Apa yang terjadi?" "Error apa?" | "Berapa CPU?" "Trend RAM?" |
| **Console** | Logging → Logs Explorer | Monitoring → Dashboards |
| **Visualisasi** | List of log entries | Charts, gauges, tables |
| **Alert** | Log-based alert (event) | Metric-based alert (threshold) |
| **Retention default** | 30 hari | Metric: gratis selamanya (GCP metrics) |
| **Query** | Log query language | MQL / PromQL / Builder |
| **Cost** | Per GB ingested (setelah free tier) | Per metric data point (setelah free tier) |

**Keduanya saling melengkapi:**

```
Skenario: Website return 500 error

  Cloud Monitoring:
    → Dashboard: Error rate naik dari 0.1% ke 5%  (ANGKA)
    → Alert fires: "Error rate > 2%"

  Cloud Logging:
    → Log Explorer: Cari error detail
    → "NullPointerException at UserService.java:142"  (TEKS)
    → Root cause found!

  Monitoring = "ADA masalah"
  Logging    = "APA masalahnya"
```

---

## Skenario Logging

### 1. Cari 500 Errors

```
Query: resource.type="http_load_balancer"
       AND httpRequest.status>=500

Time range: Last 1 hour

Hasil: List semua request yang return 500+
       dengan detail URL, latency, client IP
```

### 2. Tracking Siapa Hapus VM (Audit)

```
Query: resource.type="gce_instance"
       AND protoPayload.methodName="v1.compute.instances.delete"

Hasil: 
  Who:  user@company.com
  What: Deleted instance "web-prod-1"
  When: 2026-03-23 14:30:00
  From: Console (sourceIP: 180.x.x.x)
```

### 3. Alert dari Error Log → Metric

```
Step 1: Buat log-based metric
  Name: app_critical_errors
  Filter: severity=CRITICAL AND resource.type="gce_instance"

Step 2: Buat alerting policy
  Metric: logging/user/app_critical_errors
  Threshold: > 5 per 5 menit
  Notify: Slack + PagerDuty
```

### 4. Archive Log ke Cloud Storage

```
Step 1: Buat Cloud Storage bucket
  Name: my-project-logs-archive
  Class: Nearline (akses jarang)
  Location: asia-southeast2

Step 2: Buat Log Sink
  Console: Logging → Log Router → Create Sink
  Name: archive-all-logs
  Destination: Cloud Storage → my-project-logs-archive
  Filter: (kosong = semua log)

Step 3: Set exclusion di _Default
  Exclude debug logs: severity=DEBUG
  → Hemat biaya default storage
```

---

## Kelebihan & Kekurangan Cloud Logging

| Kelebihan | Kekurangan |
|-----------|------------|
| Centralized — semua GCP logs di 1 tempat | Cost per GB bisa tinggi jika banyak log |
| Audit logs (admin activity) gratis | Default retention 30 hari |
| Powerful query language | Log-based alert min interval 5 menit |
| Integrasi native semua GCP services | Debug/verbose logs bisa sangat mahal |
| Bisa route ke BigQuery untuk analysis | Exclusion filter bisa kehilangan data |
| Real-time streaming via Pub/Sub | Query lambat jika volume sangat besar |
| Log-based metrics tanpa ubah kode | — |

---

## Free Tier

| Item | Gratis |
|------|--------|
| Log ingestion | **50 GB/bulan pertama** |
| Admin Activity audit logs | Selalu gratis |
| System event logs | Selalu gratis |
| Retention (_Default) | 30 hari gratis |
| _Required bucket | 400 hari (gratis, tidak bisa dihapus) |
| Log-based metrics (counter) | Gratis |
| Log-based metrics (distribution) | Bayar per metric |
