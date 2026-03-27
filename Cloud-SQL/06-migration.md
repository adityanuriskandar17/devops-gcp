# Database Migration

Panduan migrasi database ke **Cloud SQL** menggunakan **Database Migration Service (DMS)** dan metode manual, berorientasi pada **GCP Console**.

---

## Metode Migrasi

| Metode | Deskripsi | Downtime |
|--------|-----------|----------|
| **Database Migration Service (DMS)** | Managed service dari GCP untuk continuous migration | **Minimal** (near-zero downtime) |
| **SQL dump import** | Export SQL file → import ke Cloud SQL | **Ada downtime** (tergantung ukuran) |
| **CSV import** | Import data per tabel dari CSV | **Ada downtime** |
| **External replica** | Cloud SQL sebagai replica dari source, lalu promote | **Minimal** |

---

## Database Migration Service (DMS)

**Console path:** `Google Cloud Console` → **Database Migration** → **Migration jobs** → **Create migration job**

### Apa itu DMS?

DMS mengelola migrasi database secara **continuous** — data disinkronkan dari source ke Cloud SQL secara real-time sampai Anda siap cutover.

### Flow DMS

```
Step 1: Create connection profile (source)
  ──► Isi detail koneksi ke database sumber
      (IP, port, username, password)

Step 2: Create connection profile (destination)
  ──► Cloud SQL instance (bisa buat baru atau pakai existing)

Step 3: Create migration job
  ──► Pilih source → destination
  ──► Pilih tipe migration (one-time atau continuous)
  ──► Test koneksi

Step 4: Start migration
  ──► Initial full dump
  ──► Continuous replication (CDC - Change Data Capture)

Step 5: Cutover (saat siap)
  ──► Stop write ke source
  ──► Tunggu replication catch up
  ──► Promote Cloud SQL sebagai primary
  ──► Arahkan aplikasi ke Cloud SQL
```

### DMS — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Near-zero downtime (continuous replication) | Setup lebih kompleks dari SQL dump |
| Managed — GCP handle replication | Source harus accessible dari GCP (firewall/VPN) |
| Progress monitoring di Console | Tidak semua versi/engine didukung |
| Validasi otomatis (schema, data integrity) | DMS free tapi Cloud SQL instance tetap bayar |

### DMS — database yang didukung

| Source | Destination | Engine |
|--------|-------------|--------|
| MySQL on-premise / AWS RDS / Azure | Cloud SQL for MySQL | MySQL |
| PostgreSQL on-premise / AWS RDS / Azure / AlloyDB | Cloud SQL for PostgreSQL | PostgreSQL |
| SQL Server on-premise / AWS RDS | Cloud SQL for SQL Server | SQL Server |
| Amazon Aurora MySQL | Cloud SQL for MySQL | MySQL |
| Amazon Aurora PostgreSQL | Cloud SQL for PostgreSQL | PostgreSQL |

### Langkah detail di Console

#### 1. Create Source Connection Profile

**Console:** `Database Migration` → **Connection profiles** → **Create profile**

| Field | Deskripsi |
|-------|-----------|
| **Database engine** | MySQL / PostgreSQL / SQL Server |
| **Connection profile name** | Nama deskriptif (contoh: `prod-mysql-source`) |
| **Hostname or IP** | IP/hostname database sumber |
| **Port** | Port database (3306, 5432, 1433) |
| **Username** | User dengan permission replication |
| **Password** | Password user |
| **SSL** | Upload CA cert jika pakai SSL |
| **Connectivity method** | IP allowlist / VPN / Cloud Interconnect / Reverse SSH tunnel |

#### 2. Create Destination (Cloud SQL instance)

Pilih **existing instance** atau **create new instance** langsung dari wizard DMS.

#### 3. Create Migration Job

**Console:** `Database Migration` → **Migration jobs** → **Create migration job**

| Setting | Opsi |
|---------|------|
| **Migration job name** | Nama deskriptif |
| **Source** | Connection profile yang sudah dibuat |
| **Destination** | Cloud SQL instance |
| **Migration type** | **One-time** (full dump saja) atau **Continuous** (full dump + CDC) |

#### 4. Test & Start

- **Test job**: validasi koneksi, permission, kompatibilitas
- **Start job**: mulai initial dump → continuous replication
- **Monitor**: lihat progress, lag, errors di Console

#### 5. Promote / Cutover

Saat data sudah sinkron dan siap cutover:

**Console:** `Database Migration` → **Migration jobs** → klik job → **Promote**

---

## SQL Dump Import (Manual)

Metode sederhana untuk database kecil-menengah.

### Flow

```
Source DB ──mysqldump/pg_dump──► file.sql ──► Cloud Storage
                                                    │
Cloud SQL ◄──── import dari Cloud Storage ──────────┘
```

### Langkah

1. **Export dari source:**

```bash
# MySQL
mysqldump -h SOURCE_HOST -u USER -p --databases DB_NAME \
    --single-transaction --routines --triggers > export.sql

# PostgreSQL
pg_dump -h SOURCE_HOST -U USER -d DB_NAME -F p > export.sql
```

2. **Upload ke Cloud Storage:**

```bash
gcloud storage cp export.sql gs://BUCKET_NAME/
```

3. **Import ke Cloud SQL:**

**Console:** `SQL` → instance → **Import** → pilih file dari Cloud Storage → pilih database

```bash
# CLI
gcloud sql import sql INSTANCE_NAME gs://BUCKET_NAME/export.sql \
    --database=DB_NAME
```

### SQL Dump — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Sederhana, tidak perlu setup tambahan | **Downtime** selama export + import |
| Cocok untuk database kecil (<10GB) | Lambat untuk database besar |
| Standard format, bisa dipakai di mana saja | Tidak ada continuous sync |

---

## External Replica Method

Cloud SQL bertindak sebagai **replica** dari database external, lalu di-**promote** setelah sinkron.

### Flow

```
External DB (on-premise/cloud)
        │
        │ replication
        ▼
Cloud SQL (external replica)
        │
        │ data sinkron ──► PROMOTE
        ▼
Cloud SQL (standalone primary)
```

**Console path:** `SQL` → **Create Instance** → configure sebagai **external replica**

### Kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Near-zero downtime | Setup replication lebih kompleks |
| Bisa verifikasi data sebelum cutover | Source harus support binlog/WAL shipping |
| Rollback mudah (belum promote = masih di source) | Butuh network connectivity yang stabil |

---

## Connectivity untuk Migrasi

| Source location | Metode koneksi |
|----------------|----------------|
| **On-premise** | VPN / Cloud Interconnect / Reverse SSH tunnel |
| **AWS / Azure** | IP allowlist (public) atau VPN |
| **GCP (Compute Engine)** | Private IP (same VPC) |
| **Hosting provider** | IP allowlist |

### Reverse SSH Tunnel (DMS)

Jika source tidak punya public IP:

```
Cloud SQL ──SSH tunnel──► GCP VM (bastion) ──► Source DB (private)
```

DMS bisa setup SSH tunnel otomatis via wizard.

---

## Pre-Migration Checklist

```
☐ Verifikasi versi engine source kompatibel dengan Cloud SQL
☐ Estimasi ukuran database (untuk sizing Cloud SQL instance)
☐ Test koneksi dari GCP ke source database
☐ Buat user khusus replication di source (dengan permission yang sesuai)
☐ Disable triggers/constraints yang bisa menghambat migration (jika perlu)
☐ Plan maintenance window untuk cutover
☐ Notify stakeholders tentang jadwal migration
☐ Siapkan rollback plan
☐ Test di staging dulu sebelum production
```

## Post-Migration Checklist

```
☐ Verifikasi data integrity (row count, checksum)
☐ Test semua query/aplikasi terhadap Cloud SQL
☐ Update connection string di semua aplikasi
☐ Enable automated backups + PITR
☐ Setup monitoring dan alerting
☐ Hapus source database setelah yakin (tunggu minimal 1 minggu)
```
