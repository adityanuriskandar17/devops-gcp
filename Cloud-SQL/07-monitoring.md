# Monitoring & Logging

Panduan monitoring, logging, dan alerting untuk **Cloud SQL**, berorientasi pada **GCP Console**.

---

## Console path utama

| Fitur | Console path |
|-------|-------------|
| Instance metrics | `SQL` → instance → **Overview** (grafik) |
| System Insights | `SQL` → instance → **System Insights** |
| Query Insights | `SQL` → instance → **Query Insights** |
| Operations log | `SQL` → instance → **Operations** |
| Cloud Monitoring | `Monitoring` → **Dashboards** / **Metrics Explorer** |
| Cloud Logging | `Logging` → **Logs Explorer** |

---

## Instance Overview Metrics

**Console path:** `SQL` → instance → **Overview**

Dashboard default menampilkan:

| Metric | Deskripsi | Kapan perlu perhatian |
|--------|-----------|----------------------|
| **CPU utilization** | Persentase CPU terpakai | > 80% sustained → scale up |
| **Memory utilization** | RAM terpakai | > 85% → scale up atau optimize query |
| **Storage usage** | Disk terpakai vs kapasitas | > 85% → pastikan auto-increase ON |
| **Read/Write operations** | IOPS | Spike abnormal → investigate |
| **Active connections** | Koneksi aktif | Mendekati max_connections → naikkan atau optimize pooling |
| **Network bytes** | Traffic in/out | Abnormal spike → cek query atau serangan |

---

## System Insights

**Console path:** `SQL` → instance → **System Insights**

Menampilkan rekomendasi dan anomali otomatis:

| Insight | Deskripsi |
|---------|-----------|
| **Out of memory events** | Instance pernah kehabisan RAM |
| **High CPU events** | CPU sustained di atas threshold |
| **Storage approaching limit** | Disk hampir penuh |
| **Replication lag** | Lag replica tinggi |
| **Connection count** | Koneksi mendekati limit |

---

## Query Insights

**Console path:** `SQL` → instance → **Query Insights**

Fitur untuk analisis performa query — tampilkan query mana yang paling lambat, paling sering, dan paling membebani.

### Yang ditampilkan

| Tab | Deskripsi |
|-----|-----------|
| **Top queries by load** | Query yang paling membebani CPU |
| **Top queries by duration** | Query paling lambat |
| **Top queries by calls** | Query paling sering dipanggil |
| **Query plan** | Execution plan (EXPLAIN) untuk query tertentu |
| **Active queries** | Query yang sedang berjalan |

### Cara enable Query Insights

**Console:** `SQL` → instance → **Edit** → **Query Insights** → **Enable**

| Setting | Default | Rekomendasi |
|---------|---------|-------------|
| **Enable Query Insights** | OFF | **ON** untuk production |
| **Store query text** | OFF | **ON** (untuk lihat query lengkap) |
| **Query string length** | 1024 | 4096 (tangkap query panjang) |
| **Sample rate** | 1 per menit | 5-10 per menit untuk production |
| **Query plans per minute** | 5 | 20 untuk investigasi performa |

### Query Insights — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Identifikasi slow query tanpa tool external | Sedikit overhead CPU (~1-3%) |
| Execution plan langsung di Console | Data retention terbatas (7 hari free, 30 hari paid) |
| Filter by user, database, query tag | Tidak se-detail tool seperti PMM atau pgBadger |
| **Wajib enable untuk production** | — |

---

## Slow Query Log

### MySQL

Enable via database flags:

| Flag | Value | Fungsi |
|------|-------|--------|
| `slow_query_log` | ON | Aktifkan slow query log |
| `long_query_time` | 1 | Query > 1 detik masuk log |
| `log_output` | FILE | Output ke Cloud Logging |

**Console:** `SQL` → instance → **Edit** → **Flags** → tambah flags di atas

**Lihat log:** `Logging` → **Logs Explorer** → filter: `resource.type="cloudsql_database"` → `textPayload:"slow_query"`

### PostgreSQL

Enable via flags:

| Flag | Value | Fungsi |
|------|-------|--------|
| `log_min_duration_statement` | 1000 | Log query > 1000ms (1 detik) |
| `log_statement` | none | `none` / `ddl` / `mod` / `all` |

---

## Cloud Monitoring — Dashboards

**Console path:** `Monitoring` → **Dashboards**

### Cloud SQL default dashboard

GCP menyediakan dashboard default untuk Cloud SQL. Jika tidak ada, buat custom:

**Monitoring** → **Dashboards** → **Create dashboard** → tambah widget dengan metric Cloud SQL.

### Metric penting untuk monitoring

| Metric | Nama di Monitoring | Alert threshold |
|--------|--------------------|-----------------|
| CPU usage | `database/cpu/utilization` | > 80% selama 5 menit |
| Memory usage | `database/memory/utilization` | > 85% selama 5 menit |
| Disk usage | `database/disk/utilization` | > 85% |
| Connections | `database/network/connections` | > 80% dari max_connections |
| Replication lag | `database/replication/replica_lag` | > 10 detik |
| Read IOPS | `database/disk/read_ops_count` | Baseline + 3x standar deviasi |
| Write IOPS | `database/disk/write_ops_count` | Baseline + 3x standar deviasi |

---

## Alerting Policies

**Console path:** `Monitoring` → **Alerting** → **Create policy**

### Contoh: Alert CPU > 80%

1. **Monitoring** → **Alerting** → **Create policy**
2. **Select metric:** `Cloud SQL Database` → `CPU utilization`
3. **Configure trigger:** Threshold > 0.8 (80%) selama 5 menit
4. **Notification channel:** Email / Slack / PagerDuty / SMS
5. **Documentation:** Tulis runbook (langkah apa yang harus dilakukan)
6. **Save**

### Alert yang wajib untuk production

| Alert | Threshold | Severity |
|-------|-----------|----------|
| CPU > 80% (5 min) | 0.8 | Warning |
| CPU > 95% (2 min) | 0.95 | Critical |
| Memory > 85% (5 min) | 0.85 | Warning |
| Disk > 85% | 0.85 | Warning |
| Disk > 95% | 0.95 | Critical |
| Connections > 80% max | Dynamic | Warning |
| Replication lag > 30s | 30 | Warning |
| Instance down | Up/down check | Critical |

---

## Cloud Logging

**Console path:** `Logging` → **Logs Explorer**

### Query berguna

```
# Semua log Cloud SQL instance tertentu
resource.type="cloudsql_database"
resource.labels.database_id="PROJECT:INSTANCE_NAME"

# Error saja
resource.type="cloudsql_database"
severity>=ERROR

# Slow queries (MySQL)
resource.type="cloudsql_database"
textPayload:"Query_time"

# Connection errors
resource.type="cloudsql_database"
textPayload:"too many connections"

# Failover events
resource.type="cloudsql_database"
protoPayload.methodName="cloudsql.instances.failover"
```

### Log-based metrics

Buat metric dari log pattern untuk alerting:

**Logging** → **Logs-based metrics** → **Create metric** → isi filter → save

Contoh: count "too many connections" errors → alert jika > 5 per menit.

---

## Operations Log

**Console path:** `SQL` → instance → **Operations**

Menampilkan operasi administratif:

| Operasi | Contoh |
|---------|--------|
| Create / Delete | Instance dibuat atau dihapus |
| Restart | Restart manual atau automatic |
| Backup | Backup dibuat atau gagal |
| Failover | Failover event |
| Maintenance | Patch atau upgrade |
| Config change | Flag atau setting diubah |

---

## Troubleshooting Umum

| Gejala | Penyebab umum | Solusi |
|--------|---------------|--------|
| CPU 100% sustained | Query tanpa index, full table scan | Query Insights → optimize query, tambah index |
| Memory 100% → OOM restart | Buffer pool terlalu besar, memory leak | Scale up machine, optimize `innodb_buffer_pool_size` |
| Disk penuh | Data growth, binary log, temp tables | Enable auto-increase, cleanup data lama |
| "Too many connections" | App tidak pakai connection pooling | Implementasi connection pooling (PgBouncer / ProxySQL) |
| Replication lag tinggi | Write-heavy + replica kecil | Scale up replica, optimize write pattern |
| Instance tidak bisa diakses | Network/firewall, instance stopped | Cek VPC peering, authorized networks, instance status |
