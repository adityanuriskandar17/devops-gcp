# Cloud Monitoring & Logging

Dokumentasi lengkap **Google Cloud Monitoring** dan **Cloud Logging** — platform observability untuk memonitor semua aktivitas infrastruktur GCP.

**Console:** Navigation menu → **Monitoring** (atau **Logging**)

---

## Apa itu Cloud Monitoring?

Cloud Monitoring adalah **managed observability platform** dari Google Cloud yang mengumpulkan **metrics, logs, dan traces** dari seluruh resource GCP (VM, GKE, Cloud SQL, Cloud Run, dll) untuk memberikan visibilitas penuh terhadap kesehatan infrastruktur.

```
┌──────────────────────────────────────────────────────────────┐
│                  Google Cloud Monitoring                       │
│                                                               │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │ Compute  │  │  GKE     │  │ Cloud SQL│  │ Cloud Run│   │
│   │ Engine   │  │ Cluster  │  │ Instance │  │ Service  │   │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│        │             │              │              │          │
│        └──────┬──────┴──────┬───────┘──────┬───────┘          │
│               ▼             ▼              ▼                  │
│         ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│         │ Metrics  │  │  Logs    │  │ Traces   │            │
│         └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│              │             │              │                   │
│              └──────┬──────┘──────┬───────┘                   │
│                     ▼             ▼                            │
│              ┌────────────────────────┐                       │
│              │   Dashboard & Alerts   │                       │
│              │   Uptime Checks        │                       │
│              │   SLO Monitoring       │                       │
│              └────────────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Daftar Dokumentasi

| # | File | Isi |
|---|------|-----|
| 01 | [Konsep & Overview](01-concepts.md) | Apa itu Cloud Monitoring, fitur Console, flow pakai/tidak pakai |
| 02 | [Dashboard & Create](02-dashboard-create.md) | Cara membuat dashboard di Console, layout, konfigurasi |
| 03 | [Widgets Overview](03-widgets-overview.md) | Semua tipe widget, fungsi, kapan digunakan |
| 04 | [Metrics Widget Detail](04-metrics-widget.md) | Line chart, analysis mode, compare to past, aggregation, filter |
| 05 | [Alerting Policies](05-alerting.md) | Membuat alert, notification channel, severity, incident |
| 06 | [Uptime Checks](06-uptime-checks.md) | HTTP/TCP/SSL uptime monitoring, global probing |
| 07 | [Cloud Logging](07-logging.md) | Log Explorer, query, log-based metrics, log routing |
| 08 | [Pricing](08-pricing.md) | Komponen biaya monitoring & logging, free tier |
| 09 | [Best Practices](09-best-practices.md) | Strategy, checklist, tips hemat |
| 10 | [Synthetic Monitoring](10-synthetic-monitoring.md) | Custom script, broken link checker, Mocha template, Cloud Function |

---

## Quick Start

```
1. Buka Console → Navigation menu → Monitoring
2. Klik "Dashboards" → "+ Create Dashboard"
3. Klik "Add Widget" → pilih widget (Line chart, Table, dll)
4. Pilih metrics (CPU, Memory, Disk, Network, dll)
5. Konfigurasi filter, aggregation, analysis mode
6. Save dashboard
```
