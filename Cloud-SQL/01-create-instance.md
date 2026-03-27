# Create Instance (Console)

Panduan lengkap setiap opsi yang muncul di **Google Cloud Console** saat membuat **Cloud SQL instance**. Setiap pilihan dijelaskan dengan **kelebihan, kekurangan, dan contoh kasus**.

**Console path:** `Google Cloud Console` → **SQL** → **Create Instance**

---

## Langkah 1: Pilih Database Engine

Halaman pertama menampilkan 3 pilihan engine:

| Engine | Keterangan | Kapan pilih |
|--------|------------|-------------|
| **MySQL** | RDBMS paling populer, ekosistem besar, banyak tools/library | Aplikasi web (Laravel, WordPress, Django), microservices, general purpose |
| **PostgreSQL** | Fitur advanced (JSONB, window functions, CTE recursive, partitioning) | Aplikasi yang butuh query kompleks, GIS (PostGIS), analytics |
| **SQL Server** | Microsoft stack, integrasi dengan .NET, SSRS, SSIS | Aplikasi enterprise .NET, migrasi dari on-premise SQL Server |

### Engine — kelebihan & kekurangan

**MySQL**

| Kelebihan | Kekurangan |
|-----------|------------|
| Performa tinggi untuk read-heavy workload | Fitur SQL kurang lengkap dibanding PostgreSQL (misal: tidak ada native JSONB query, partial index) |
| Komunitas dan dokumentasi sangat luas | Replication kadang lebih rumit untuk kasus edge |
| Biaya Cloud SQL sedikit lebih rendah di beberapa tier | Kurang cocok untuk workload analytics berat |

**PostgreSQL**

| Kelebihan | Kekurangan |
|-----------|------------|
| SQL compliance paling lengkap, fitur query sangat kaya | Sedikit lebih lambat di simple read dibanding MySQL (marginal) |
| Extension ecosystem (PostGIS, pg_trgm, pgvector untuk AI) | Komunitas lebih kecil dari MySQL (tapi berkembang pesat) |
| MVCC yang mature, cocok untuk concurrent write | Memory usage bisa lebih tinggi |

**SQL Server**

| Kelebihan | Kekurangan |
|-----------|------------|
| Integrasi native dengan ecosystem Microsoft (.NET, Azure AD, SSRS) | **Biaya license** signifikan lebih mahal dari MySQL/PostgreSQL |
| Fitur enterprise (Always Encrypted, Columnstore Index) | Komunitas open-source lebih kecil |
| Familiar untuk tim yang sudah pakai SQL Server on-premise | Beberapa fitur on-premise tidak tersedia di Cloud SQL |

---

## Langkah 2: Choose a Cloud SQL Edition

**Console path:** Setelah pilih engine → halaman **Create Instance** → section **Choose a Cloud SQL edition**

| Edition | Deskripsi singkat di Console |
|---------|------------------------------|
| **Enterprise Plus** | "For applications that require the highest availability and performance" |
| **Enterprise** | "Cost-effective edition for applications with standard availability and performance" |

### Enterprise Plus — fitur utama & penjelasan

| Fitur Enterprise Plus | Apa artinya | Contoh kasus |
|-----------------------|-------------|--------------|
| **Advanced disaster recovery with easy switchback** | Bisa failover ke replica di region lain, lalu **switchback** (kembali ke primary asli) tanpa rebuild manual. Pada Enterprise biasa, promote replica = instance baru, primary lama harus di-setup ulang | Database production e-commerce: Jakarta down → failover ke Singapore dalam hitungan menit → Jakarta pulih → switchback ke Jakarta tanpa downtime besar dan tanpa kehilangan data |
| **Up to 3x higher read throughput with data cache** | Instance punya **local SSD cache** untuk menyimpan data yang sering diakses (hot data). Read tidak selalu ke persistent disk — bisa dari cache lokal yang jauh lebih cepat | Aplikasi dengan dashboard real-time: query SELECT yang sama berulang-ulang → data cache mengurangi latency dari ~5ms jadi ~1ms |
| **Up to 99.99% availability SLA** | SLA lebih tinggi dari Enterprise (99.95%). Dengan HA configuration, downtime maksimal ~4.3 menit/bulan vs ~21.9 menit/bulan | Sistem pembayaran, banking, healthcare yang tidak boleh down |
| **Data cache (local SSD)** | SSD lokal di host VM sebagai caching layer antara memory dan persistent disk | Database 500GB tapi hot data hanya 50GB → 50GB di-cache di local SSD, performa mendekati in-memory |
| **Advanced machine types** | Akses ke machine type yang lebih besar (sampai 128 vCPU, 864GB RAM) | Data warehouse kecil-menengah, database dengan tabel sangat besar |
| **Parallel replication** | Replica bisa memproses transaction secara paralel (bukan sequential), lag lebih rendah | Write-heavy workload: primary menulis 10.000 TPS → replica dengan parallel replication bisa keep up tanpa lag |

### Enterprise — fitur utama & penjelasan

| Fitur Enterprise | Apa artinya | Contoh kasus |
|------------------|-------------|--------------|
| **Standard High Availability** | Failover otomatis ke standby di zone lain, tapi **tanpa switchback** — promote = instance baru | Aplikasi internal, CMS, staging environment |
| **Up to 99.95% availability SLA** | Dengan HA, downtime maksimal ~21.9 menit/bulan | Aplikasi bisnis yang bisa toleransi beberapa menit downtime per bulan |
| **Standard machine types** | Sampai 96 vCPU, 624GB RAM | Kebanyakan workload production standar |
| **Standard replication** | Sequential replication, lag bisa lebih tinggi saat write-heavy | Read replica untuk reporting yang tidak real-time sensitive |

### Perbandingan Edition

| Aspek | Enterprise Plus | Enterprise |
|-------|----------------|------------|
| **SLA (dengan HA)** | 99.99% | 99.95% |
| **Data cache** | Ya (local SSD) | Tidak |
| **Disaster recovery** | Advanced (switchback) | Standard (promote only) |
| **Max machine** | 128 vCPU / 864GB RAM | 96 vCPU / 624GB RAM |
| **Parallel replication** | Ya | Tidak |
| **Harga** | ~30-50% lebih mahal | Standar |
| **Rekomendasi** | Mission-critical production | Development, staging, production non-critical |

### Edition — kelebihan & kekurangan

**Enterprise Plus**

| Kelebihan | Kekurangan |
|-----------|------------|
| SLA tertinggi (99.99%), downtime minimal | Biaya signifikan lebih mahal (~30-50% dari Enterprise) |
| Data cache meningkatkan read performance drastis | Overkill untuk development/staging |
| Switchback setelah failover — operasional lebih mudah | Tidak semua region mendukung Enterprise Plus |
| Parallel replication menjaga read replica tetap up-to-date | Perlu evaluasi apakah benefit sepadan dengan cost |

**Enterprise**

| Kelebihan | Kekurangan |
|-----------|------------|
| Harga lebih terjangkau | Tidak ada data cache (read dari persistent disk saja) |
| Cukup untuk 90%+ workload | Failover tanpa switchback — recovery lebih manual |
| Tersedia di semua region | SLA "hanya" 99.95% (masih bagus untuk kebanyakan aplikasi) |
| Cocok untuk development + staging + production standar | Max machine type lebih kecil |

---

## Langkah 3: Edition Preset

**Console path:** Setelah pilih Edition → section **Edition preset**

| Preset | Deskripsi | Default config |
|--------|-----------|----------------|
| **Production** | "Optimized for production workloads" | HA aktif, backup otomatis, storage lebih besar |
| **Development** | "Lower cost for development and testing" | Single zone, backup mungkin off, storage minimal |

**Penting:** Preset hanya mengatur **default value** — semua setting bisa diubah manual setelahnya. Preset = starting point.

### Production preset — default settings

- **Zonal availability:** Multiple zones (HA)
- **Machine type:** 4 vCPU / 26GB RAM (bisa diubah)
- **Storage:** 100GB SSD (bisa diubah)
- **Automated backups:** Enabled
- **Point-in-time recovery:** Enabled
- **Deletion protection:** Enabled

### Development preset — default settings

- **Zonal availability:** Single zone
- **Machine type:** Shared core (1 vCPU / 1.7GB RAM)
- **Storage:** 10GB SSD
- **Automated backups:** Disabled
- **Point-in-time recovery:** Disabled
- **Deletion protection:** Disabled

### Preset — kelebihan & kekurangan

**Production**

| Kelebihan | Kekurangan |
|-----------|------------|
| Langsung siap production (HA, backup, PITR aktif) | Biaya langsung tinggi dari awal |
| Mengurangi risiko lupa enable fitur penting | Mungkin over-spec untuk small workload |
| Deletion protection mencegah penghapusan tidak sengaja | — |

**Development**

| Kelebihan | Kekurangan |
|-----------|------------|
| Biaya sangat rendah (shared core, minimal storage) | **Tidak ada HA** — kalau mati, downtime sampai dipulihkan |
| Cocok untuk testing, prototyping, learning | **Tidak ada backup otomatis** — data bisa hilang |
| Cepat di-create dan di-delete | **Jangan pakai untuk production** |

---

## Langkah 4: Instance Info

### Database version

Dropdown versi database sesuai engine yang dipilih.

**MySQL versions:**

| Versi | Keterangan |
|-------|------------|
| **MySQL 8.4** | Versi terbaru, LTS, fitur terlengkap (disarankan untuk instance baru) |
| **MySQL 8.0** | Stabil, mature, paling banyak dipakai saat ini |
| **MySQL 5.7** | Legacy — **end of life**, hindari untuk instance baru |

**PostgreSQL versions:**

| Versi | Keterangan |
|-------|------------|
| **PostgreSQL 17** | Terbaru, performance improvements, JSON_TABLE |
| **PostgreSQL 16** | Logical replication improvements |
| **PostgreSQL 15** | MERGE command, performance improvements |
| **PostgreSQL 14** | Multirange types, JSON subscripting |
| **PostgreSQL 13** | Incremental sorting, parallel vacuum |
| **PostgreSQL 12** | Mature, stabil |

**SQL Server versions:**

| Versi | Keterangan |
|-------|------------|
| **SQL Server 2022** | Terbaru, Ledger, Query Store improvements |
| **SQL Server 2019** | Intelligent Query Processing, Accelerated Database Recovery |
| **SQL Server 2017** | Stabil, Linux support pertama kali |

**Rekomendasi:** Selalu pilih versi **terbaru** untuk instance baru kecuali ada dependency spesifik ke versi lama.

### Instance ID

- **Nama unik** untuk instance di project (contoh: `myapp-db-prod`, `ftlgym-mysql-prod`)
- Harus lowercase, huruf, angka, dan dash
- **Tidak bisa diubah** setelah instance dibuat
- **Tidak bisa di-reuse** setelah instance dihapus (dalam beberapa hari)

**Naming convention yang disarankan:**

```
{project/app}-{engine}-{environment}
Contoh: ftlgym-mysql-prod, myapp-pg-staging, hr-sqlserver-dev
```

### Password

- Password untuk **root** (MySQL), **postgres** (PostgreSQL), atau **sqlserver** (SQL Server)
- Bisa di-generate otomatis atau isi manual
- **Simpan dengan aman** — setelah create, password bisa di-reset tapi tidak bisa dilihat lagi
- Disarankan gunakan **Secret Manager** untuk menyimpan password di production

---

## Langkah 5: Choose Region and Zonal Availability

### Region

Dropdown lokasi data center tempat instance akan berjalan.

| Region (Indonesia terdekat) | Lokasi | Latency ke Jakarta |
|-----------------------------|--------|--------------------|
| **asia-southeast2** | Jakarta, Indonesia | ~1-5ms |
| **asia-southeast1** | Singapore | ~15-25ms |
| **asia-east1** | Taiwan | ~50-70ms |
| **australia-southeast1** | Sydney | ~100-150ms |

**Pilih region yang:**
- Paling dekat dengan **aplikasi / user**
- Sesuai dengan **data residency** requirement
- Mendukung **Edition** yang dipilih (Enterprise Plus tidak tersedia di semua region)
- Sama region dengan **Compute Engine** VM / Cloud Run / GKE yang mengakses database

### Region — kelebihan & kekurangan

**Region dekat user (asia-southeast2 Jakarta)**

| Kelebihan | Kekurangan |
|-----------|------------|
| Latency paling rendah | Data residency terpenuhi untuk Indonesia |
| Compliance data lokal Indonesia | Tidak ada backup cross-region otomatis (perlu setup manual) |

**Region Singapore (asia-southeast1)**

| Kelebihan | Kekurangan |
|-----------|------------|
| Lebih banyak layanan GCP tersedia | Latency sedikit lebih tinggi (~15-25ms) |
| Sering jadi hub Asia Tenggara | Data secara teknis di luar Indonesia |
| Biasanya lebih stabil (data center lebih mature) | — |

### Zonal Availability

| Opsi | Deskripsi |
|------|-----------|
| **Single zone** | Instance hanya di 1 zona. Kalau zona down, instance **tidak tersedia** sampai zona pulih |
| **Multiple zones (Highly available)** | Instance punya **standby** di zona lain. Kalau primary zone down, **otomatis failover** ke standby (~60 detik) |

### Zonal Availability — kelebihan & kekurangan

**Single zone**

| Kelebihan | Kekurangan |
|-----------|------------|
| Biaya ~50% lebih murah (tidak bayar standby) | **Tidak ada failover otomatis** — downtime bisa berjam-jam |
| Cukup untuk development, testing, staging | Data bisa hilang jika zona mengalami kegagalan hardware |
| Lebih sederhana | Tidak memenuhi SLA production |

**Multiple zones (Highly available)**

| Kelebihan | Kekurangan |
|-----------|------------|
| **Failover otomatis** dalam ~60 detik | Biaya ~2x karena bayar standby instance |
| SLA 99.95% (Enterprise) atau 99.99% (Enterprise Plus) | Failover bukan instan — aplikasi harus handle reconnect |
| Data disinkronkan secara **synchronous** ke standby | Sedikit overhead write latency karena synchronous replication |
| **Wajib untuk production** | — |

### Failover flow (Multiple zones)

```
Normal operation:
  App ──► Primary (Zone A) ◄──sync──► Standby (Zone B)

Zone A failure:
  App ──X── Primary (Zone A) DOWN
                                      Standby (Zone B) PROMOTE
  App ──────────────────────────────► New Primary (Zone B)
                                      (~60 detik failover)

Zone A recovered:
  App ──► Primary (Zone B) ◄──sync──► New Standby (Zone A)
```

---

## Langkah 6: Customize Your Instance — Machine Configuration

### Machine shapes

| Shape di Console | Deskripsi |
|------------------|-----------|
| **Shared core** | vCPU yang di-share dengan tenant lain. Murah tapi performa tidak konsisten |
| **Lightweight** | 1-2 vCPU dedicated, RAM minimal |
| **Standard** | Balanced vCPU:RAM ratio |
| **High memory** | RAM lebih banyak per vCPU |
| **Custom** | Pilih sendiri vCPU dan RAM |

### Shared core — detail

| Tipe | vCPU | RAM | Kapan pakai |
|------|------|-----|-------------|
| **db-f1-micro** | 0.6 (shared) | 0.6 GB | Testing, prototype, sangat kecil |
| **db-g1-small** | 0.5 (shared) | 1.7 GB | Development, small staging |

**Kelebihan:** Sangat murah (~$7-15/bulan)
**Kekurangan:** Performa tidak konsisten, **tidak cocok untuk production**, connection limit rendah

### Standard / High memory / Custom — detail

| Contoh tipe | vCPU | RAM | Use case |
|-------------|------|-----|----------|
| **db-n1-standard-1** | 1 | 3.75 GB | Kecil, single microservice |
| **db-n1-standard-4** | 4 | 15 GB | Medium production |
| **db-n1-standard-16** | 16 | 60 GB | Large production |
| **db-n1-standard-64** | 64 | 240 GB | Very large workload |
| **db-n1-highmem-4** | 4 | 26 GB | Workload dengan banyak data di memory |
| **db-n1-highmem-16** | 16 | 104 GB | Large in-memory workload |
| **Custom** | N | M GB | Sesuaikan sendiri |

### Machine shape — kelebihan & kekurangan

**Shared core**

| Kelebihan | Kekurangan |
|-----------|------------|
| Biaya paling rendah | CPU throttling — performa bisa turun tiba-tiba |
| Cocok buat testing | Connection limit sangat rendah (sekitar 25-250) |
| Quick start | **Jangan untuk production** |

**Standard**

| Kelebihan | Kekurangan |
|-----------|------------|
| Balance antara compute dan memory | Mungkin kurang RAM untuk database besar |
| Cocok untuk kebanyakan workload | — |

**High memory**

| Kelebihan | Kekurangan |
|-----------|------------|
| Buffer pool / shared_buffers besar — lebih banyak data di RAM | Lebih mahal per vCPU |
| Mengurangi disk I/O | Overkill kalau data set kecil |
| Cocok untuk query-heavy workload | — |

---

## Langkah 7: Storage

### Storage type

| Opsi | Deskripsi |
|------|-----------|
| **SSD** | Persistent disk SSD — IOPS tinggi, latency rendah |
| **HDD** | Persistent disk HDD — IOPS rendah, lebih murah |

**SSD vs HDD**

| Aspek | SSD | HDD |
|-------|-----|-----|
| **IOPS** | Sampai 60.000+ | Sampai 7.500 |
| **Latency** | ~1ms | ~5-10ms |
| **Harga** | ~$0.17/GB/bulan | ~$0.09/GB/bulan |
| **Rekomendasi** | **Production** (wajib) | Development (hemat biaya) |

### Storage capacity

- Tentukan ukuran disk awal (10GB - 64TB)
- Bisa diperbesar kapan saja (**tidak bisa dikecilkan**)

### Enable automatic storage increases

Checkbox yang memungkinkan Cloud SQL otomatis menambah storage saat hampir penuh.

| Opsi | Deskripsi |
|------|-----------|
| **Enabled** (default Production) | Storage otomatis naik saat disk usage mencapai threshold (~85-90%) |
| **Disabled** | Disk penuh = **database bisa freeze** (read-only atau error) |

**Enable automatic storage increases — kelebihan & kekurangan**

| Kelebihan | Kekurangan |
|-----------|------------|
| Mencegah downtime karena disk penuh | Biaya naik tanpa peringatan eksplisit |
| Set-and-forget, operasional lebih mudah | Storage **tidak bisa turun** setelah naik |
| Wajib untuk production | Bisa "kebablasan" jika ada bug yang menulis data berlebih |

**Automatic storage increase limit:** Bisa set batas maksimal agar tidak naik tanpa batas.

---

## Langkah 8: Connections

### Private IP

| Opsi | Deskripsi |
|------|-----------|
| **Enable Private IP** | Instance dapat IP dari VPC internal (10.x.x.x). Komunikasi tanpa melewati internet |
| **Disable Private IP** | Hanya bisa diakses via Public IP atau Cloud SQL Proxy |

### Public IP

| Opsi | Deskripsi |
|------|-----------|
| **Enable Public IP** | Instance punya IP publik. Harus konfigurasi **Authorized Networks** |
| **Disable Public IP** | Hanya bisa diakses dari VPC via Private IP |

### Private IP vs Public IP

| Aspek | Private IP | Public IP |
|-------|-----------|-----------|
| **Keamanan** | Lebih aman — tidak terexpose ke internet | Perlu firewall (Authorized Networks + SSL) |
| **Latency** | Lebih rendah (internal network) | Sedikit lebih tinggi (melalui internet stack) |
| **Setup** | Perlu VPC peering (one-time setup) | Lebih mudah setup awal |
| **Akses dari luar GCP** | Butuh VPN / Cloud SQL Proxy | Langsung (dengan authorized networks) |
| **Rekomendasi** | **Production** | Development + akses dari lokal |

### Authorized networks (untuk Public IP)

Daftar IP/CIDR yang diizinkan koneksi ke instance:

```
Contoh:
  Nama: office-ip
  Network: 103.x.x.x/32    (IP kantor)

  Nama: developer-home
  Network: 180.x.x.x/32    (IP developer)
```

**Jangan pernah set `0.0.0.0/0`** — artinya semua IP di internet bisa coba koneksi.

---

## Langkah 9: Data Protection

### Automated backups

| Opsi | Deskripsi |
|------|-----------|
| **Enable** | Backup otomatis harian pada waktu yang ditentukan |
| **Disable** | Tidak ada backup otomatis |

### Point-in-time recovery (PITR)

| Opsi | Deskripsi |
|------|-----------|
| **Enable** | Bisa restore database ke **detik tertentu** menggunakan binary log / WAL |
| **Disable** | Hanya bisa restore ke snapshot backup harian |

### PITR — cara kerja

```
Backup harian: setiap jam 02:00
Binary log / WAL: merekam setiap perubahan

Timeline:
  02:00 ──── backup ────────────────────── 14:00 (sekarang)
    │                                        │
    └── binary log merekam semua ────────────┘
        perubahan dari 02:00-14:00

Mau restore ke jam 10:30?
  ──► Restore backup 02:00 + replay binary log sampai 10:30
  ──► Database persis seperti keadaan jam 10:30
```

### Data Protection — kelebihan & kekurangan

**Automated backup + PITR enabled**

| Kelebihan | Kekurangan |
|-----------|------------|
| Bisa recover dari human error (DELETE tanpa WHERE) ke detik tertentu | Biaya storage untuk backup + binary log |
| **Wajib untuk production** | Binary log / WAL menambah sedikit write overhead |
| Retention: 1-365 hari (configurable) | — |

**Disabled (development preset default)**

| Kelebihan | Kekurangan |
|-----------|------------|
| Tidak ada biaya backup | **Data hilang = hilang selamanya** |
| — | Jangan pakai untuk data yang penting |

### Backup retention

Dropdown jumlah hari backup disimpan:
- **1 hari** — hanya backup terakhir (hemat storage)
- **7 hari** — standar development
- **30 hari** — standar production
- Sampai **365 hari** — compliance requirement

### Backup location

| Opsi | Deskripsi |
|------|-----------|
| **Multi-region** (default) | Backup disimpan di lokasi multi-region terdekat |
| **Specific region** | Backup hanya disimpan di region tertentu (data residency compliance) |

---

## Langkah 10: Maintenance

### Maintenance window

Jadwal kapan GCP boleh melakukan maintenance (patching, upgrade minor):

| Opsi | Deskripsi |
|------|-----------|
| **Any window** | GCP tentukan sendiri kapan maintenance |
| **Day and time** | Anda pilih hari dan jam (contoh: Minggu 02:00 - 03:00) |

**Rekomendasi:** Pilih waktu **traffic paling rendah** (misal: Minggu dini hari WIB).

### Maintenance timing

| Opsi | Deskripsi |
|------|-----------|
| **Canary** | Dapat update lebih awal (1 minggu sebelum GA) — untuk testing |
| **Stable** | Dapat update setelah stabil (setelah Canary) — lebih aman |

---

## Langkah 11: Flags (Database Configuration)

Database flags mengatur parameter internal engine:

**Contoh MySQL flags:**

| Flag | Fungsi | Default | Rekomendasi production |
|------|--------|---------|------------------------|
| `max_connections` | Jumlah koneksi maksimal | ~150 (tergantung RAM) | Sesuaikan dengan app pool size |
| `slow_query_log` | Log query lambat | OFF | **ON** |
| `long_query_time` | Threshold query lambat (detik) | 10 | **1-2** |
| `innodb_buffer_pool_size` | Cache data di RAM | ~75% RAM | Biarkan default Cloud SQL |

**Contoh PostgreSQL flags:**

| Flag | Fungsi | Default | Rekomendasi production |
|------|--------|---------|------------------------|
| `max_connections` | Koneksi maksimal | ~100 | Sesuaikan dengan app |
| `log_min_duration_statement` | Log query lebih lambat dari N ms | -1 (off) | **1000** (1 detik) |
| `shared_buffers` | Shared memory untuk cache | 25% RAM | Biarkan default Cloud SQL |

Detail lengkap: [02-configuration-flags.md](02-configuration-flags.md)

---

## Langkah 12: Labels

**Labels** = key-value pairs untuk organisasi dan billing reporting:

```
Contoh:
  environment: production
  team: backend
  app: ftlgym
  cost-center: engineering
```

**Gunakan untuk:**
- Filter billing reports per project/team
- Grouping di monitoring dashboards
- Automation (script yang bertindak berdasarkan label)

---

## Langkah 13: Deletion Protection

| Opsi | Deskripsi |
|------|-----------|
| **Enable deletion protection** | Instance tidak bisa dihapus sampai protection di-disable manual |
| **Disable** | Instance bisa langsung dihapus |

**Rekomendasi:** **Selalu enable** untuk production. Mencegah penghapusan tidak sengaja (misalnya salah klik, salah script).

---

## Summary: Checklist Sebelum Create Instance Production

```
☐ Engine: sesuai kebutuhan (MySQL / PostgreSQL / SQL Server)
☐ Edition: Enterprise Plus (mission-critical) atau Enterprise (standar)
☐ Preset: Production (sebagai starting point)
☐ Database version: versi terbaru
☐ Instance ID: nama deskriptif (app-engine-env)
☐ Password: kuat, simpan di Secret Manager
☐ Region: dekat user (asia-southeast2 untuk Indonesia)
☐ Zonal: Multiple zones (HA) — WAJIB
☐ Machine: sesuai workload (jangan shared core!)
☐ Storage: SSD, auto-increase ON, set limit
☐ Private IP: enable (lebih aman)
☐ Public IP: disable (kecuali perlu akses dari luar)
☐ Automated backup: ON
☐ PITR: ON
☐ Backup retention: minimal 30 hari
☐ Maintenance window: waktu traffic rendah
☐ Deletion protection: ON
☐ Labels: environment, team, app
```
