# Pricing — Cloud Monitoring & Logging

Dokumentasi lengkap **komponen biaya** Cloud Monitoring dan Cloud Logging.

**Console:** Navigation menu → **Billing** → Reports (filter by Monitoring / Logging)

---

## Cloud Monitoring — Pricing

### Komponen Biaya

| Komponen | Gratis | Berbayar |
|----------|--------|----------|
| **GCP metrics** (built-in) | Selalu gratis (semua GCP metrics) | — |
| **Custom metrics** | 150 MB ingestion/bulan | $0.258 per MB setelah free tier |
| **Prometheus metrics** | 150 MB ingestion/bulan | $0.258 per MB setelah free tier |
| **Alerting policies** | 500 metric-based policies | — |
| **Uptime check executions** | 1.000.000 executions/bulan | $0.30 per 1.000 executions setelahnya |
| **Notification channels** | Semua gratis | — |
| **API calls** | 1 juta calls/bulan | $0.01 per 1.000 calls setelahnya |
| **Dashboard** | Unlimited | — |
| **Metrics retention** | 24 bulan (GCP), 6 minggu (custom) | — |

### Apa yang GRATIS?

```
GRATIS:
  ✅ Semua GCP built-in metrics (CPU, RAM, Disk, Network, dll)
  ✅ Dashboard (buat berapa pun)
  ✅ 500 alerting policies
  ✅ 1.000.000 uptime check executions/bulan (bukan dihitung per jumlah check)
  ✅ Semua notification channels (email, Slack, dll)
  ✅ Metrics Explorer (ad-hoc query)
  ✅ GKE system metrics
  ✅ 150 MB custom/Prometheus metrics

BAYAR:
  💰 Custom metrics > 150 MB
  💰 Prometheus metrics > 150 MB
  💰 Uptime check executions > 1.000.000/bulan ($0.30 per 1.000 executions)
  💰 API calls > 1 juta/bulan
```

### Estimasi Biaya

**Catatan penting:** biaya uptime check dihitung dari **jumlah executions/bulan** (frequency × jumlah region × 30 hari), bukan dari jumlah check yang dibuat. Satu check saja dengan frequency 1 menit di 6 region sudah menghasilkan ~259.200 executions/bulan. Tabel di bawah mencantumkan asumsi frequency & region agar angka bisa direproduksi — sesuaikan dengan setup Anda sendiri.

| Skenario | Custom Metrics | Uptime Checks (asumsi) | Executions/bulan | Estimasi/bulan |
|----------|---------------|-------------------------|-------------------|----------------|
| **Kecil** (5 VM, standard monitoring) | 0 MB (built-in saja) | 3 checks, 5 menit, 1 region | ~25.920 | **$0** (masih dalam 1.000.000 free) |
| **Medium** (20 VM, 10 custom metrics) | ~50 MB | 8 checks, 5 menit, 1 region | ~69.120 | **$0** (masih free tier) |
| **Besar** (100 VM, 50 custom + Prometheus) | ~500 MB | 20 checks, 1 menit, 6 region | ~5.184.000 | Custom: ~$90 + Uptime: ~$1.255 (4.184.000 exec di atas free tier × $0.30/1.000) = **~$1.345** |
| **Enterprise** (500 VM, heavy custom) | ~2 GB | 50 checks, 1 menit, 6 region | ~12.960.000 | Custom: ~$475 + Uptime: ~$3.588 (11.960.000 exec di atas free tier × $0.30/1.000) = **~$4.063** |

---

## Cloud Logging — Pricing

### Komponen Biaya

| Komponen | Gratis | Berbayar |
|----------|--------|----------|
| **Log ingestion** | 50 GB/bulan pertama | $0.50 per GB setelahnya |
| **_Default bucket** retention | 30 hari | $0.01/GB/bulan jika extend |
| **_Required bucket** | 400 hari (gratis, wajib) | — |
| **Custom bucket** | Sesuai retention yang diset | $0.01/GB/bulan storage |
| **Log-based metrics (counter)** | Gratis | — |
| **Log-based metrics (distribution)** | — | $0.258 per MB (same as custom metrics) |
| **Admin Activity audit** | Selalu gratis | — |
| **Data Access audit** | Bayar per GB ingested | $0.50/GB |

### Apa yang GRATIS?

```
GRATIS:
  ✅ 50 GB log ingestion per bulan
  ✅ Admin Activity audit logs (always on)
  ✅ System event logs
  ✅ _Required bucket (400 hari retention)
  ✅ _Default bucket (30 hari retention)
  ✅ Logs Explorer (search/query)
  ✅ Log-based metrics (counter type)
  ✅ Log Router configuration

BAYAR:
  💰 Log ingestion > 50 GB/bulan ($0.50/GB)
  💰 Extended retention > 30 hari
  💰 Data Access audit logs
  💰 Distribution log-based metrics
  💰 Log routing to BigQuery/GCS/Pub/Sub (destinasi cost)
```

### Estimasi Biaya Logging

| Skenario | Log Volume | Retention | Sinks | Estimasi/bulan |
|----------|-----------|-----------|-------|----------------|
| **Kecil** (5 VM, basic logs) | ~10 GB | Default 30d | Tidak ada | **$0** |
| **Medium** (20 VM, app logs) | ~80 GB | Default 30d | GCS archive | **$15 + GCS cost** |
| **Besar** (100 VM + GKE) | ~500 GB | 30d + 90d custom | BigQuery + GCS | **$225 + dest cost** |
| **Enterprise** (500 VM, verbose) | ~5 TB | Custom 365d | BQ + GCS + Pub/Sub | **$2,475 + dest cost** |

---

## Tips Hemat Biaya

### Monitoring

| Tips | Hemat |
|------|-------|
| Gunakan built-in GCP metrics (jangan buat custom jika sudah ada) | 100% gratis |
| Batasi custom metrics ke yang benar-benar dibutuhkan | Kurangi MB ingestion |
| Sampling interval yang lebih lama untuk non-critical metrics | Kurangi data points |
| Review uptime checks — hapus yang tidak terpakai, kurangi frequency/region jika tidak perlu | Kurangi total executions, tetap di free tier (1.000.000 executions/bulan) |

### Logging

| Tips | Hemat |
|------|-------|
| **Exclusion filter** untuk debug/verbose logs | 30-70% biaya ingestion |
| Jangan enable Data Access audit kecuali compliance wajib | $0.50/GB saved |
| Route ke Cloud Storage (Nearline) untuk archive, bukan simpan di Logging | 10x lebih murah |
| Set log level di aplikasi (WARN+) untuk production | Kurangi volume drastis |
| Review _Default sink — exclude noise (health check logs, dll) | Biaya turun signifikan |
| Gunakan log sampling untuk high-volume service | 50-90% hemat |

### Contoh Exclusion Filter

```
Console: Logging → Log Router → _Default → Edit → Exclusion filters

  Exclusion 1: "Exclude debug logs"
  Filter: severity=DEBUG

  Exclusion 2: "Exclude health check logs"
  Filter: resource.type="http_load_balancer"
          AND httpRequest.requestUrl="/health"

  Exclusion 3: "Exclude GKE kube-system verbose"
  Filter: resource.type="k8s_container"
          AND resource.labels.namespace_name="kube-system"
          AND severity<WARNING

  Estimasi hemat: 40-60% log volume
```

---

## Perbandingan Cost: Monitoring vs Logging

| Aspek | Monitoring | Logging |
|-------|-----------|---------|
| **Free tier** | Sangat generous (built-in gratis) | 50 GB/bulan |
| **Cost driver utama** | Custom/Prometheus metrics | Log volume (GB ingested) |
| **Cara hemat** | Minimize custom metrics | Exclusion filters, log level |
| **Typical cost (medium)** | $0-50/bulan | $15-100/bulan |
| **Typical cost (large)** | $50-500/bulan | $200-2.500/bulan |
| **Yang mahal** | Prometheus at scale | Verbose app logs + Data Access audit |

---

## Billing Alert untuk Monitoring & Logging

**Console:** Billing → Budgets & alerts → Create budget

```
Rekomendasi:
  Budget: $100/bulan untuk Monitoring + Logging
  Alert thresholds:
    50% ($50)  → Email
    80% ($80)  → Email + Slack
    100% ($100) → Email + Slack + PagerDuty

  Ini mencegah surprise cost jika log volume meledak
```
