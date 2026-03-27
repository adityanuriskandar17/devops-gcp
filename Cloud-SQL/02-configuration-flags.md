# Cloud SQL: Database Flags & Konfigurasi (GCP Console)

Dokumen ini menjelaskan **database flags**, **maintenance window**, dan **customization instance** Cloud SQL dari sudut pandang **Google Cloud Console**, dengan referensi **gcloud CLI** untuk otomasi dan dokumentasi.

---

## 1. Database Flags — Overview

**Fungsi:** Database flags mengubah perilaku engine database (MySQL, PostgreSQL, atau SQL Server) pada level instance, setara dengan parameter server di lingkungan self-managed.

**Console path:** `Google Cloud Console` → `SQL` → pilih **instance** → **Edit** → tab/section **Flags** (atau **Database flags** tergantung UI).

**Kelebihan & kekurangan — penggunaan Flags secara umum**

| Kelebihan | Kekurangan |
|-----------|------------|
| Kontrol perilaku engine tanpa SSH ke VM | Perubahan beberapa flag memerlukan **restart instance** |
| Konsisten dengan praktik tuning DB di production | Salah set bisa menurunkan stabilitas atau performa |
| Dapat diotomasi via IaC / CLI | Batasan flag tergantung **edition** dan **versi engine** |

**Referensi CLI:**

```bash
gcloud sql instances describe INSTANCE_NAME --format="yaml(settings.databaseFlags)"
gcloud sql instances patch INSTANCE_NAME \
  --database-flags=max_connections=200,slow_query_log=on
```

> **Catatan:** `gcloud sql instances patch` menggabungkan/mengganti flags; ambil state saat ini sebelum patch massal.

---

## 2. MySQL — Flags Penting

**Contoh CLI (gabung beberapa flag):** `gcloud sql instances patch INSTANCE_NAME --database-flags=FLAG1=VAL1,FLAG2=VAL2`

### 2.1 `max_connections`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Jumlah maksimum koneksi client bersamaan ke server. |
| **Default** | Bergantung **tier machine type** dan versi MySQL; Cloud SQL menetapkan batas aman untuk resource. |
| **Rekomendasi production** | Set dari **connection pool** aplikasi; hindari nilai ekstrem; monitor `Threads_connected`. |
| **Setting tinggi** | Lebih banyak session paralel sebelum penolakan koneksi. |
| **Setting rendah** | Mengurangi risiko kehabisan memori per thread; resource lebih terprediksi. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Tinggi | Menahan burst koneksi singkat | Memori & context switch naik; risiko OOM |
| Rendah | Footprint memori per koneksi terkendali | Error "Too many connections" saat traffic naik |

### 2.2 `slow_query_log`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Mengaktifkan pencatatan query lambat ke slow query log. |
| **Default** | Umumnya `OFF`. |
| **Rekomendasi production** | `ON` untuk troubleshooting periodik; retensi log wajar; padukan dengan `long_query_time`. |
| **ON / OFF** | ON = visibilitas query buruk; OFF = kurang I/O log. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| ON | Dasar optimasi indeks & query | Volume log, biaya penyimpanan/I/O |
| OFF | Overhead minimal | Diagnosa tanpa alat lain lebih sulit |

### 2.3 `long_query_time`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Ambang waktu (detik) agar query masuk slow query log. |
| **Default** | Biasanya `10` detik. |
| **Rekomendasi production** | `1`–`2` detik untuk OLTP; sesuaikan agar log tidak banjir. |
| **Rendah / tinggi** | Rendah = lebih banyak query tercatat; tinggi = hanya query sangat lambat. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Rendah | Insight lebih granular | Log besar, biaya & noise |
| Tinggi | Log ringkas | Query bermasalah menengah bisa terlewat |

### 2.4 `innodb_buffer_pool_size`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Memori cache data & indeks InnoDB. |
| **Default** | Cloud SQL menyesuaikan dengan **RAM instance**. |
| **Rekomendasi production** | Ikuti panduan Cloud SQL untuk tier; jangan mendekati 100% RAM sistem. |
| **Tinggi / rendah** | Tinggi = hit rate buffer pool baik untuk read-heavy; rendah = headroom OS & buffer lain. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Tinggi | Mengurangi disk I/O | Memory pressure untuk komponen lain |
| Rendah | Headroom non-InnoDB / OS | Lebih banyak read dari disk |

### 2.5 `character_set_server`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Character set default server untuk objek baru. |
| **Default** | `utf8mb4` umumnya direkomendasikan (Unicode penuh termasuk emoji). |
| **Rekomendasi production** | `utf8mb4` + collation selaras aplikasi. |

| Kelebihan utf8mb4 | Kekurangan utf8mb4 |
|-------------------|-------------------|
| Karakter penuh & internasional | Sedikit overhead vs latin1 (biasanya layak) |

### 2.6 `default_time_zone`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Zona waktu default sesi server. |
| **Default** | Sering `SYSTEM` atau UTC. |
| **Rekomendasi production** | **UTC** untuk konsistensi antar region dan DST. |

| Kelebihan UTC | Kekurangan UTC |
|---------------|----------------|
| Prediktabil untuk log & replikasi | App harus konversi untuk tampilan user |

### 2.7 `sql_mode`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Aturan SQL (strictness, zero date, dll.). |
| **Default** | Bervariasi per versi MySQL. |
| **Rekomendasi production** | **Strict** selaras app; hindari silent truncation data. |

| Kelebihan strict | Kekurangan strict |
|------------------|-------------------|
| Integritas data lebih baik | App legacy bisa error |

### 2.8 `innodb_log_file_size`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Ukuran redo log InnoDB (checkpoint & write throughput). |
| **Default** | Dikelola Cloud SQL; perubahan sensitif. |
| **Rekomendasi production** | Ubah hanya setelah benchmark + dokumentasi Google; sering memicu **restart**. |
| **Besar / kecil** | Besar = potensi throughput write tertentu; kecil = trade-off recovery & disk. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Besar | Throughput write tertentu membaik | Recovery time & disk footprint |

### 2.9 `wait_timeout` & `interactive_timeout`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | `wait_timeout`: detik idle **non-interactive** sebelum koneksi ditutup. `interactive_timeout`: sama untuk sesi **interactive** (flag client). |
| **Default** | Nilai MySQL standar (sering besar untuk `wait_timeout`). |
| **Rekomendasi production** | Set konservatif untuk mengurangi slot connection sia-sia; selaraskan keduanya kecuali kebutuhan admin khusus. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Timeout rendah | Kurangi dampak connection leak | Report/session panjang bisa terputus jika salah desain |
| Timeout tinggi | Koneksi idle bertahan lama | Slot & resource terikat lebih lama |

### 2.10 `log_bin_trust_function_creators`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Mengizinkan pembuatan function/procedure tertentu terkait **binary logging** tanpa privilege tradisional `SUPER`. |
| **Default** | Umumnya `OFF`. |
| **Rekomendasi production** | `ON` hanya jika perlu + review determinisme; default `OFF` lebih aman untuk replikasi. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| ON | Deploy stored routine lebih mudah | Risiko replikasi jika routine tidak deterministik |
| OFF | Kurangi risiko replikasi rusak | Beberapa deploy routine terhambat |

---

## 3. PostgreSQL — Flags Penting

**Contoh CLI:** `gcloud sql instances patch INSTANCE_NAME --database-flags=max_connections=100,log_statement=ddl`

### 3.1 `max_connections`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Batas backend concurrent. |
| **Default** | Default PostgreSQL yang disesuaikan Cloud SQL. |
| **Rekomendasi production** | Rendahkan + **connection pooling** (PgBouncer / pool app); nilai tinggi = overhead memori per koneksi. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Tinggi | Banyak client langsung | Overhead memori & context switch |
| Rendah + pool | Efisiensi resource | Butuh arsitektur pool |

### 3.2 `shared_buffers`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Cache shared memory halaman data PostgreSQL. |
| **Default** | Proporsional RAM (~25% sering dijadikan acuan; ikuti panduan versi). |
| **Rekomendasi production** | Ikuti dokumentasi Cloud SQL untuk machine type; uji workload nyata. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Tinggi | Cache hit lebih baik | Kurang RAM untuk `work_mem`, OS cache |

### 3.3 `work_mem`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Memori per operasi sort/hash (**per operation**, bukan total query). |
| **Default** | Konservatif. |
| **Rekomendasi production** | Naikkan bertahap untuk analitik; waspada `work_mem × concurrent operations`. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Tinggi | Sort/hash di memori | Risiko OOM saat paralel tinggi |
| Rendah | Aman untuk concurrency tinggi | Spill ke disk pada sort besar |

### 3.4 `maintenance_work_mem`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Memori untuk VACUUM, CREATE INDEX, dll. |
| **Default** | Moderat. |
| **Rekomendasi production** | Naikkan di jendela maintenance besar; turunkan jika tekanan memori. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Tinggi | Maintenance lebih cepat | Puncak penggunaan memori |

### 3.5 `log_min_duration_statement`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Log statement dengan durasi ≥ ambang (ms); `0` = semua. |
| **Default** | `-1` (off). |
| **Rekomendasi production** | Ratusan ms–detik; hindari `0` permanen kecuali debug singkat. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Ambang positif kecil | Menemukan query lambat | Volume log & biaya |

### 3.6 `effective_cache_size`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Petunjuk **planner** ukuran cache efektif (bukan alokasi nyata). |
| **Default** | Estimasi berbasis instance. |
| **Rekomendasi production** | Realistis (~50–75% RAM sering dipakai; sesuaikan workload). |

| Kelebihan | Kekurangan |
|-----------|------------|
| Nilai realistis → planner index vs seq scan lebih baik | Nilai tidak realistis → rencana query suboptimal |

### 3.7 `random_page_cost`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Biaya estimasi akses halaman acak vs sequential (SSD vs HDD). |
| **Default** | Klasik spin disk; SSD sering diturunkan. |
| **Rekomendasi production** | Untuk SSD Cloud SQL, nilai lebih rendah sering masuk akal — uji `EXPLAIN`. |

| Kelebihan (turunkan untuk SSD) | Kekurangan (terlalu rendah) |
|-------------------------------|----------------------------|
| Planner lebih agresif memilih index | Plan bisa salah jika pola I/O tidak sesuai asumsi |

### 3.8 `default_statistics_target`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Detail sampling statistik untuk planner. |
| **Default** | `100`. |
| **Rekomendasi production** | Naikkan untuk kolom kritis dengan skew; ANALYZE lebih lama. |

| Kelebihan (nilai tinggi) | Kekurangan (nilai tinggi) |
|--------------------------|---------------------------|
| Rencana lebih baik untuk data skew | Waktu ANALYZE & storage statistik |

### 3.9 `idle_in_transaction_session_timeout`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Putus sesi **idle in transaction** melewati ambang (ms). |
| **Default** | `0` = disabled. |
| **Rekomendasi production** | Non-nol untuk kurangi lock bloat (menit–jam). |

| Kelebihan (timeout aktif) | Kekurangan (timeout aktif) |
|---------------------------|----------------------------|
| Kurangi lock panjang | Transaksi sah bisa terputus jika user diam |

### 3.10 `log_statement`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Level log: `none`, `ddl`, `mod`, `all`. |
| **Default** | `none`. |
| **Rekomendasi production** | `ddl` atau `mod` untuk audit; hindari `all` kecuali audit ketat + retensi terkontrol. |

| Kelebihan (ddl/mod) | Kekurangan |
|---------------------|------------|
| Audit skema/perubahan data | Volume log |

---

## 4. SQL Server — Flags Penting

> Cloud SQL for SQL Server mengekspos parameter sebagai **database flags** dengan nama UI tertentu — verifikasi di **Edit → Flags**.

### 4.1 `max degree of parallelism` (MAXDOP)

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Maksimum thread paralel per operator query. |
| **Default** | Bergantung konfigurasi SQL Server / tier. |
| **Rekomendasi production** | OLTP: batasi (mis. 1–4 atau setengah core); OLAP: lebih tinggi — ukur workload. |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Tinggi | Query besar lebih cepat | Overhead & contention untuk query kecil |
| Rendah | Stabil untuk OLTP | Query besar lambat |

### 4.2 `cost threshold for parallelism`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Ambang biaya query agar paralelisasi dipertimbangkan. |
| **Default** | Legacy SQL Server (sering 5). |
| **Rekomendasi production** | Naikkan jika banyak query kecil tidak perlu paralel (kurangi CXPACKET). |

| Kelebihan (threshold tinggi) | Kekurangan (threshold tinggi) |
|------------------------------|-------------------------------|
| Kurangi paralel tidak perlu | Query menengah bisa tidak paralel saat seharusnya perlu |

### 4.3 `remote access`

| Aspek | Penjelasan |
|--------|------------|
| **Fungsi** | Mengizinkan eksekusi remote (linked server / RPC — tergantung versi). |
| **Default** | Cek instance; sering enabled untuk skenario integrasi. |
| **Rekomendasi production** | **Disable** bila tidak dipakai (least privilege). |

| Variasi | Kelebihan | Kekurangan |
|---------|-----------|------------|
| ON | Integrasi antar server | Permukaan serangan lebih luas |
| OFF | Lebih aman | Fitur remote tidak tersedia |

Nama flag SQL Server di `gcloud` mengikuti dokumentasi resmi; patch sama: `gcloud sql instances patch INSTANCE_NAME --database-flags=...`

---

## 5. Maintenance Window — Pengaturan

**Fungsi:** Menentukan **kapan** Google boleh menerapkan **patch**, **update**, atau **restart** terjadwal.

**Console path:** `SQL` → **instance** → **Edit** → section **Maintenance** (Maintenance window / timing).

| Kelebihan | Kekurangan |
|-----------|------------|
| Kontrol jam rendah traffic | Risiko downtime singkat saat restart |
| Selaras change management | Perlu koordinasi multi-region |

```bash
gcloud sql instances patch INSTANCE_NAME \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=3
```

---

## 6. Maintenance Timing: Canary vs Stable

**Konteks:** Saluran pembaruan Cloud SQL — patch lebih awal (**Canary**) vs lebih konservatif (**Stable**); detail mengikuti UI terkini.

| Aspek | Canary | Stable |
|--------|--------|--------|
| **Kelebihan** | Perbaikan/fitur lebih cepat | Perubahan lebih teruji di populasi luas |
| **Kekurangan** | Risiko edge case lebih tinggi | Patch bisa lebih lambat |

**Rekomendasi production:** production kritis → **Stable** + maintenance window jam sepi; staging/QA → **Canary** untuk deteksi regresi.

---

## 7. Instance Customization Setelah Dibuat (Alur Edit)

**Console path:** `SQL` → **instance** → **Edit**.

**Umumnya dapat diubah (tergantung engine/edition):** machine type (vCPU/RAM), storage & autoresize, **HA regional**, backup/PITR, **flags**, maintenance & timing channel, connectivity (authorized networks, Private IP, SSL), labels.

| Kelebihan | Kekurangan |
|-----------|------------|
| Tidak perlu reprovision penuh untuk banyak perubahan | Beberapa edit = **downtime** atau failover |
| Mengikuti evolusi workload | Perlu change plan jika flags + resize bersamaan |

```bash
gcloud sql instances patch INSTANCE_NAME \
  --tier=db-custom-4-16384 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=2
```

---

## Ringkasan Operasional

Cek **restart** di Console; dokumentasikan nilai & bandingkan dengan `gcloud sql instances describe`; uji di non-production; pantau CPU, memory, connections, replication lag, disk I/O.

---

*Panduan umum. Flag, default, dan ketersediaan bervariasi per versi engine dan edition — rujuk Edit instance dan dokumentasi Google Cloud terbaru.*
