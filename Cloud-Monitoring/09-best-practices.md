# Best Practices — Cloud Monitoring & Logging

Checklist dan strategi untuk monitoring & logging yang efektif di production.

---

## Monitoring Strategy

### Golden Signals

Empat metric utama yang **wajib** dimonitor (dari Google SRE book):

| Signal | Metric | Contoh | Widget |
|--------|--------|--------|--------|
| **Latency** | Waktu respons request | HTTP response time p50, p95, p99 | Line chart + Heatmap |
| **Traffic** | Volume request | Requests per second (RPS) | Line chart |
| **Errors** | Persentase error | 5xx error rate, failed requests | Line chart + Scorecard |
| **Saturation** | Seberapa penuh resource | CPU %, Memory %, Disk %, Connection pool | Line chart + Gauge |

```
Dashboard Production wajib punya 4 Golden Signals:

  ┌──────────────────┐  ┌──────────────────┐
  │ Latency (p95)    │  │ Traffic (RPS)    │
  │ ───╱╲───╱╲───── │  │ ────────╱──────  │
  │ Target: < 200ms  │  │ Current: 450 RPS │
  └──────────────────┘  └──────────────────┘
  ┌──────────────────┐  ┌──────────────────┐
  │ Error Rate       │  │ Saturation       │
  │ ──────╱──────── │  │ CPU: 45%  RAM:62%│
  │ Target: < 1%     │  │ Disk: 34%        │
  └──────────────────┘  └──────────────────┘
```

---

## Dashboard Best Practices

| Practice | Penjelasan |
|----------|-----------|
| **1 dashboard per service** | Jangan campur semua service di 1 dashboard |
| **Overview + Detail** | Buat "Overview" dashboard (ringkasan) + "Deep-dive" per service |
| **Golden Signals di atas** | Letakkan 4 golden signals di baris pertama |
| **Consistent time range** | Semua widget pakai time range yang sama |
| **Compare to past** | Aktifkan "Compare to past: 1 week" untuk detect anomaly |
| **Threshold lines** | Tambahkan garis merah di 80% CPU, 90% disk, dll |
| **Nama widget jelas** | "CPU per VM" bukan "Metric 1" |
| **Group by yang tepat** | Group by instance_name untuk VM, pod_name untuk GKE |
| **Jangan terlalu banyak widget** | Max 10-15 widget per dashboard — fokus yang penting |
| **Variable/filter** | Tambahkan dashboard variable agar bisa filter per environment |

---

## Alerting Best Practices

| Practice | Penjelasan |
|----------|-----------|
| **Alert pada symptom, bukan cause** | Alert "error rate > 2%" bukan "CPU > 80%" (CPU tinggi belum tentu masalah) |
| **Duration yang cukup** | Min 5 menit — hindari alert dari spike sesaat |
| **Severity yang tepat** | Critical hanya untuk user-facing impact, Warning untuk internal |
| **Runbook di documentation** | Setiap alert harus punya langkah troubleshooting |
| **Route berdasarkan severity** | Critical → PagerDuty, Error → Slack, Warning → Email |
| **Review alert bulanan** | Hapus alert yang noisy atau tidak actionable |
| **Test alert** | Buat test condition untuk pastikan notification sampai |
| **Snooze saat maintenance** | Mute alert selama maintenance window |
| **Jangan terlalu banyak** | 10-20 alert policies sudah cukup untuk medium infra |

### Alert yang Wajib Ada

| Alert | Metric | Threshold | Severity |
|-------|--------|-----------|----------|
| **CPU tinggi** | CPU utilization | > 85% for 10m | Warning |
| **Memory tinggi** | Memory utilization | > 90% for 5m | Error |
| **Disk hampir penuh** | Disk percent used | > 90% for 5m | Critical |
| **Website down** | Uptime check | Fail from 2+ regions | Critical |
| **Error rate tinggi** | HTTP 5xx rate | > 2% for 5m | Error |
| **SSL expiring** | SSL cert days remaining | < 30 days | Warning |
| **Database connections** | Active connections | > 80% max connections | Warning |
| **Agent offline** | Agent uptime metric absent | 5 min absence | Error |

---

## Logging Best Practices

| Practice | Penjelasan |
|----------|-----------|
| **Log level yang tepat** | Production: WARN+ saja. DEBUG hanya untuk dev/staging |
| **Structured logging (JSON)** | Output log sebagai JSON agar mudah di-query di Log Explorer |
| **Exclude health check logs** | Exclusion filter untuk `/health`, `/ping`, `/ready` |
| **Exclude debug di production** | Exclusion filter: `severity=DEBUG` |
| **Archive ke Cloud Storage** | Buat sink ke GCS bucket untuk compliance (murah) |
| **BigQuery untuk analysis** | Sink ke BQ untuk query SQL pada log data |
| **Set retention sesuai kebutuhan** | 30 hari cukup untuk operational, 365 hari untuk compliance |
| **Log-based metrics** | Buat counter metric dari error logs → alert di Monitoring |
| **Jangan log sensitive data** | Jangan log password, token, PII di log message |
| **Monitor log volume** | Set billing alert untuk logging cost |

### Structured Logging Example

```json
// ❌ BAD: Unstructured
console.log("User login failed for user@email.com from 180.x.x.x")

// ✅ GOOD: Structured JSON
console.log(JSON.stringify({
  "severity": "WARNING",
  "message": "User login failed",
  "user": "user@email.com",
  "source_ip": "180.x.x.x",
  "timestamp": "2026-03-23T10:30:00Z"
}))
```

```
Query di Log Explorer:

  Unstructured: textPayload:"login failed"     ← fuzzy, bisa miss
  Structured:   jsonPayload.message="User login failed"  ← exact match
```

---

## Ops Agent Best Practices

| Practice | Penjelasan |
|----------|-----------|
| **Install di semua production VM** | Tanpa agent, hanya dapat basic GCP metrics |
| **Auto-install via startup script** | Tambahkan di instance template / startup script |
| **Monitor agent health** | Buat alert "metric absence" untuk detect agent crash |
| **Custom log collection** | Konfigurasi agent untuk collect app-specific logs |
| **Update secara berkala** | Agent diupdate untuk bug fix dan fitur baru |

### Install Script (untuk startup script)

```bash
#!/bin/bash
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install
```

---

## Cost Optimization Checklist

| # | Action | Impact |
|---|--------|--------|
| 1 | Gunakan built-in GCP metrics (jangan custom jika ada) | Gratis vs bayar |
| 2 | Exclusion filter untuk debug + health check logs | 30-60% log cost turun |
| 3 | Set log level WARN+ di production | 50-80% log volume turun |
| 4 | Archive log ke Cloud Storage (bukan simpan di Logging) | 10x lebih murah |
| 5 | Review uptime checks — stay dalam 10 free tier | $0 vs $0.30/check |
| 6 | Jangan enable Data Access audit kecuali wajib | Bisa sangat mahal |
| 7 | Set billing alert untuk Monitoring + Logging | Prevent surprise bill |
| 8 | Review custom metrics bulanan — hapus yang tidak terpakai | Kurangi ingestion |

---

## Production Readiness Checklist

```
Monitoring:
  ☐ Dashboard per service dengan Golden Signals
  ☐ Alert: CPU, Memory, Disk, Error rate
  ☐ Uptime checks untuk semua public endpoints
  ☐ Notification channels configured (Slack + Email minimal)
  ☐ Ops Agent installed di semua VM
  ☐ Compare to past enabled di dashboard

Logging:
  ☐ Structured logging (JSON) di semua aplikasi
  ☐ Exclusion filter untuk debug + health check
  ☐ Log-based metric untuk critical errors
  ☐ Archive sink ke Cloud Storage
  ☐ Audit logs reviewed
  ☐ Retention policy sesuai compliance

Cost:
  ☐ Billing alert untuk Monitoring + Logging
  ☐ Log volume di-review bulanan
  ☐ Custom metrics minimal (pakai built-in jika bisa)
  ☐ Uptime checks dalam free tier
```
