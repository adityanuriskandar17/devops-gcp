# Cloud SQL

**Cloud SQL** adalah layanan **managed relational database** di Google Cloud. GCP mengelola provisioning, patching, backup, dan replication — Anda fokus ke **data dan aplikasi**.

---

## Database Engine yang Didukung

| Engine | Versi yang tersedia | Keterangan |
|--------|-------------------|------------|
| **MySQL** | 5.7, 8.0, 8.4 | Engine paling populer, ekosistem luas |
| **PostgreSQL** | 12, 13, 14, 15, 16, 17 | Fitur advanced (JSONB, CTE, partitioning) |
| **SQL Server** | 2017, 2019, 2022 | Untuk workload .NET / Microsoft stack |

**Console path:** `Google Cloud Console` → **SQL** → **Create Instance** → pilih engine

---

## Daftar Dokumentasi

| No | Topik | File | Deskripsi |
|----|-------|------|-----------|
| 01 | Create Instance | [01-create-instance.md](01-create-instance.md) | Semua opsi saat membuat instance (Edition, Preset, Region, Machine, Storage, dll) |
| 02 | Configuration & Flags | [02-configuration-flags.md](02-configuration-flags.md) | Database flags, parameter tuning, maintenance window |
| 03 | Networking & Security | [03-networking-security.md](03-networking-security.md) | Private IP, Public IP, SSL/TLS, Authorized Networks |
| 04 | Backups & Recovery | [04-backups-recovery.md](04-backups-recovery.md) | Automated backup, PITR, on-demand backup, restore |
| 05 | Replicas & HA | [05-replicas-ha.md](05-replicas-ha.md) | High Availability, Read Replicas, Failover, Cross-region |
| 06 | Migration | [06-migration.md](06-migration.md) | Database Migration Service (DMS), import/export |
| 07 | Monitoring | [07-monitoring.md](07-monitoring.md) | Metrics, Query Insights, slow query log, alerting |
| 08 | Pricing | [08-pricing.md](08-pricing.md) | Komponen biaya, estimasi, tips hemat |
| 09 | CLI Cheatsheet | [09-commands-cheatsheet.md](09-commands-cheatsheet.md) | Perintah gcloud sql side-by-side dengan Console |
| 10 | Best Practices | [10-best-practices.md](10-best-practices.md) | Checklist production, security, performance |

---

## Arsitektur Umum Cloud SQL

```
                        Internet / VPC
                            │
                    ┌───────┴───────┐
                    │  Cloud SQL    │
                    │  Proxy /      │
                    │  Private IP   │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        ┌─────┴─────┐ ┌────┴────┐ ┌──────┴──────┐
        │  Primary   │ │ Standby │ │ Read Replica│
        │  Instance  │ │  (HA)   │ │ (optional)  │
        │            │ │         │ │             │
        │ MySQL /    │ │ Auto-   │ │ Scale read  │
        │ PostgreSQL/│ │failover │ │ traffic     │
        │ SQL Server │ │         │ │             │
        └─────┬──────┘ └─────────┘ └─────────────┘
              │
        ┌─────┴─────┐
        │ Automated  │
        │ Backups    │
        │ + PITR     │
        └────────────┘
```

---

## Quick Start: Create Instance via Console

1. Buka **Google Cloud Console** → **SQL**
2. Klik **Create Instance**
3. Pilih engine (**MySQL** / **PostgreSQL** / **SQL Server**)
4. Pilih **Edition** (Enterprise Plus / Enterprise)
5. Pilih **Preset** (Production / Development)
6. Isi **Instance ID** dan **Password**
7. Pilih **Region** dan **Zonal Availability**
8. Konfigurasi **Machine type**, **Storage**, **Connections**
9. Klik **Create Instance**

Detail setiap langkah: [01-create-instance.md](01-create-instance.md)
