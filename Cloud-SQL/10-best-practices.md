# Best Practices

Checklist dan rekomendasi untuk **Cloud SQL** production, berorientasi pada **GCP Console**.

---

## Security

| Praktik | Console path | Detail |
|---------|-------------|--------|
| Gunakan **Private IP** | `SQL` → instance → **Connections** → **Networking** | Hindari expose database ke internet |
| **Disable Public IP** jika tidak diperlukan | `SQL` → instance → **Connections** → **Networking** | Kurangi attack surface |
| **Enforce SSL** | `SQL` → instance → **Connections** → **Security** | Enkripsi data in transit |
| **Authorized Networks** hanya IP spesifik | `SQL` → instance → **Connections** → **Networking** | Jangan pernah `0.0.0.0/0` |
| Password kuat + **Secret Manager** | `SQL` → instance → **Users** | Jangan hardcode password di code |
| **Principle of least privilege** — user per aplikasi | `SQL` → instance → **Users** | Jangan pakai root/admin untuk aplikasi |
| **IAM database authentication** | `SQL` → instance → **Users** → **Add IAM** | Centralized identity management |
| **Deletion protection** ON | `SQL` → instance → **Edit** → **Data protection** | Mencegah delete tidak sengaja |

---

## Availability & Reliability

| Praktik | Console path | Detail |
|---------|-------------|--------|
| **HA (Multiple zones)** untuk production | `SQL` → instance → **Edit** → **Availability** | Failover otomatis jika zona down |
| **Test failover** secara berkala | `SQL` → instance → **Failover** | Pastikan aplikasi handle reconnect |
| **Maintenance window** di jam sepi | `SQL` → instance → **Edit** → **Maintenance** | Minimize impact ke user |
| **Stable** maintenance timing | `SQL` → instance → **Edit** → **Maintenance** | Jangan Canary di production |
| **Cross-region DR replica** untuk mission-critical | `SQL` → instance → **Replicas** | Proteksi dari regional failure |
| **Connection pooling** di aplikasi | (aplikasi layer) | PgBouncer / ProxySQL / app-level pool |
| Retry logic + exponential backoff | (aplikasi layer) | Handle transient connection errors |

### Connection pooling — kenapa penting?

```
Tanpa pooling:
  100 requests ──► 100 koneksi ke database
  ──► max_connections cepat habis
  ──► "Too many connections" error

Dengan pooling:
  100 requests ──► 10 koneksi di pool ──► database
  ──► koneksi di-reuse
  ──► stabil meskipun traffic tinggi
```

---

## Performance

| Praktik | Caranya | Impact |
|---------|---------|--------|
| **Right-size machine type** | Monitor CPU/RAM → scale up/down | Cost + performance |
| **SSD storage** untuk production | `SQL` → Create → Storage type: SSD | Read/write speed |
| **Index yang tepat** | Analisis slow query → buat index | Query speed 10-100x |
| **Query Insights** aktif | `SQL` → instance → **Edit** → Query Insights | Identifikasi bottleneck |
| **Slow query log** aktif | `SQL` → instance → **Edit** → Flags | Tangkap query lambat |
| **Avoid SELECT \*** | (kode aplikasi) | Kurangi data transfer |
| **Connection pooling** | (aplikasi layer) | Kurangi connection overhead |
| **Read replicas** untuk reporting | `SQL` → instance → **Replicas** | Offload primary |
| **Enterprise Plus data cache** | Pilih Enterprise Plus edition | 3x read throughput |

### Cara identifikasi query lambat

```
1. Enable Query Insights
   Console: SQL → instance → Edit → Query Insights → ON

2. Buka Query Insights
   Console: SQL → instance → Query Insights

3. Sort by "Database load by query" atau "Top queries by duration"

4. Klik query lambat → lihat Execution Plan

5. Optimize:
   - Tambah index yang sesuai
   - Rewrite query (hindari subquery, gunakan JOIN)
   - Kurangi data yang di-retrieve
```

---

## Data Protection

| Praktik | Console path | Detail |
|---------|-------------|--------|
| **Automated backups** ON | `SQL` → instance → **Edit** → **Data protection** | Backup harian otomatis |
| **PITR** ON | `SQL` → instance → **Edit** → **Data protection** | Recovery ke detik tertentu |
| **Backup retention** minimal 30 hari | `SQL` → instance → **Edit** → **Data protection** | Cukup window untuk recovery |
| **On-demand backup** sebelum perubahan besar | `SQL` → instance → **Backups** → **Create** | Safety net sebelum deploy |
| **Test restore** secara berkala | `SQL` → instance → **Backups** → **Restore to different instance** | Pastikan backup berfungsi |
| **Binary log / WAL retention** 7 hari | `SQL` → instance → **Edit** → **Data protection** | Maximalkan PITR window |

---

## Cost Optimization

| Praktik | Caranya | Penghematan |
|---------|---------|-------------|
| **Stop instance** dev/staging di luar jam kerja | `SQL` → instance → **Stop** | ~60-70% non-prod |
| **Right-size** — monitor lalu adjust | `Monitoring` → CPU/RAM metrics | 20-50% |
| **HDD untuk development** | `SQL` → Create → Storage: HDD | ~47% storage |
| **CUD** untuk production long-term | `Billing` → **Commitments** | 25-52% |
| **Hapus replica** yang idle | `SQL` → replica → **Delete** | 100% biaya replica |
| **Kurangi backup retention** jika tidak perlu | `SQL` → instance → **Edit** | Variable |
| **Review billing labels** | `Billing` → **Reports** → filter label | Visibility |

---

## Monitoring & Alerting

| Praktik | Console path | Detail |
|---------|-------------|--------|
| **Dashboard** Cloud SQL di Monitoring | `Monitoring` → **Dashboards** | Visibility realtime |
| **Alert: CPU > 80%** | `Monitoring` → **Alerting** → **Create** | Sebelum jadi masalah |
| **Alert: Disk > 85%** | `Monitoring` → **Alerting** → **Create** | Sebelum disk penuh |
| **Alert: Connections > 80% max** | `Monitoring` → **Alerting** → **Create** | Sebelum "too many connections" |
| **Alert: Replication lag > 30s** | `Monitoring` → **Alerting** → **Create** | Jika punya replica |
| **Alert: Instance down** | `Monitoring` → **Uptime checks** | Deteksi downtime |
| **Budget alert** | `Billing` → **Budgets & alerts** | Cost control |

---

## Naming Convention

| Resource | Format | Contoh |
|----------|--------|--------|
| Instance | `{app}-{engine}-{env}` | `ftlgym-mysql-prod` |
| Database | `{app}_{module}` | `ftlgym_main`, `ftlgym_auth` |
| User | `{app}_{role}` | `ftlgym_app`, `ftlgym_readonly` |
| Replica | `{instance}-replica-{n}` | `ftlgym-mysql-prod-replica-1` |
| Backup (on-demand) | Deskriptif | "Before migration 2026-03-23" |

---

## Checklist Sebelum Go Production

```
SECURITY
☐ Private IP enabled
☐ Public IP disabled (atau authorized networks ketat)
☐ SSL enforced
☐ User per aplikasi (bukan root)
☐ Password di Secret Manager
☐ Deletion protection ON

AVAILABILITY
☐ HA enabled (Multiple zones)
☐ Failover tested
☐ Maintenance window di jam sepi
☐ Connection pooling di aplikasi
☐ Retry logic di aplikasi

DATA PROTECTION
☐ Automated backups ON
☐ PITR ON
☐ Backup retention ≥ 30 hari
☐ Test restore berhasil

PERFORMANCE
☐ Machine type sesuai workload
☐ SSD storage
☐ Query Insights enabled
☐ Slow query log enabled
☐ Index di query utama sudah ada

MONITORING
☐ CPU alert > 80%
☐ Memory alert > 85%
☐ Disk alert > 85%
☐ Connection alert > 80% max
☐ Budget alert configured

DOCUMENTATION
☐ Connection string didokumentasikan
☐ Runbook untuk failover
☐ Runbook untuk restore
☐ Emergency contacts
```
