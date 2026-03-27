# Replicas & High Availability

Panduan **High Availability (HA)**, **Read Replicas**, dan **Disaster Recovery** di Cloud SQL, berorientasi pada **GCP Console**.

---

## High Availability (HA)

**Console path:** `SQL` → **Create Instance** → **Choose region and zonal availability** → **Multiple zones (Highly available)**

Atau untuk instance yang sudah ada: `SQL` → instance → **Edit** → **Zonal availability** → ubah ke **Multiple zones**

### Cara kerja HA

```
Normal:
  App ──► Primary (Zone A) ◄──synchronous replication──► Standby (Zone B)
                │                                              │
                └── Data ditulis ──► langsung sync ────────────┘

Failure Zone A:
  1. GCP deteksi Primary down
  2. Standby (Zone B) di-promote jadi Primary (~60 detik)
  3. IP tetap sama — app reconnect otomatis
  4. Zone A pulih → jadi Standby baru

  App ──► New Primary (Zone B) ◄──sync──► New Standby (Zone A)
```

### HA — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Failover otomatis tanpa intervensi manual | Biaya ~2x (bayar standby instance yang idle) |
| IP address tidak berubah saat failover | Failover butuh ~60 detik — aplikasi harus handle reconnect |
| Data **zero loss** (synchronous replication) | Sedikit overhead write latency karena sync replication |
| SLA 99.95% (Enterprise) / 99.99% (Enterprise Plus) | Standby tidak bisa dipakai untuk read (bukan read replica) |

### Manual failover (testing)

**Console path:** `SQL` → instance → **Overview** → **Failover** (tombol)

**CLI:**

```bash
gcloud sql instances failover INSTANCE_NAME
```

**Rekomendasi:** Test failover secara berkala di staging untuk memastikan aplikasi bisa handle reconnect.

---

## Read Replicas

**Console path:** `SQL` → instance → **Replicas** → **Create read replica**

Read replica = salinan database yang menerima perubahan dari primary secara **asynchronous** dan hanya bisa digunakan untuk **SELECT** (read-only).

### Cara kerja Read Replica

```
                    ┌──────────────────┐
                    │    Primary       │
  Write (INSERT,    │    Instance      │
  UPDATE, DELETE)──►│                  │
                    └───────┬──────────┘
                            │ async replication
                    ┌───────┼───────────┐
                    │       │           │
              ┌─────▼───┐ ┌▼────────┐ ┌▼────────┐
              │Replica 1│ │Replica 2│ │Replica 3│
              │(read)   │ │(read)   │ │(read)   │
              └─────────┘ └─────────┘ └─────────┘
                    ▲           ▲           ▲
                    │           │           │
               Read traffic didistribusikan
```

### Read replica settings di Console

| Setting | Opsi |
|---------|------|
| **Region** | Same-region atau **cross-region** |
| **Zone** | Zona spesifik dalam region |
| **Machine type** | Bisa berbeda dari primary (bisa lebih kecil atau lebih besar) |
| **Storage** | Otomatis mengikuti primary |
| **Database flags** | Bisa berbeda dari primary |

### Read Replica — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Scale read traffic horizontal (tambah replica) | **Replication lag** — data mungkin tidak 100% real-time |
| Offload reporting/analytics dari primary | Biaya per replica (machine + storage) |
| Bisa cross-region untuk user global | Hanya untuk read — write tetap ke primary |
| Bisa di-promote jadi standalone (disaster recovery) | Promote = putus replication, bukan switchback |

### Jumlah read replica

| Engine | Max replicas |
|--------|-------------|
| MySQL | 10 |
| PostgreSQL | 10 |
| SQL Server | Tidak didukung (gunakan Always On di SQL Server Enterprise) |

---

## Cross-Region Read Replicas

**Console path:** `SQL` → instance → **Replicas** → **Create read replica** → pilih **region berbeda**

```
Primary (asia-southeast2 / Jakarta)
        │
        │ async replication
        │
  ┌─────▼──────────────────┐
  │ Cross-region Replica    │
  │ (asia-southeast1 /     │
  │  Singapore)             │
  └─────────────────────────┘
```

### Cross-region replica — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Disaster recovery: jika region primary down, promote replica | Replication lag lebih tinggi (cross-region network latency) |
| User di region lain bisa read dari replica terdekat | Biaya network egress cross-region |
| Bisa dijadikan DR plan | Promote = irreversible (kecuali Enterprise Plus switchback) |

---

## Cascade Replicas

**Cascade replica** = replica dari replica (bukan langsung dari primary).

```
Primary ──► Replica 1 ──► Cascade Replica 1a
                     └──► Cascade Replica 1b
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Mengurangi beban replication pada primary | Lag lebih tinggi (double hop) |
| Bisa buat banyak replica tanpa membebani primary | Lebih kompleks untuk dikelola |
| Cocok untuk distribusi read ke banyak region | — |

---

## Promote Replica

**Console path:** `SQL` → klik **replica** → **Promote replica** (tombol di Overview)

Promote mengubah read replica menjadi **standalone instance** (bisa read + write). Replication ke primary **putus permanen**.

### Kapan promote?

```
Skenario disaster recovery:

1. Primary (Jakarta) DOWN — region failure
2. Cross-region replica (Singapore) masih jalan
3. Promote replica Singapore ──► jadi Primary baru
4. Arahkan aplikasi ke instance baru
5. Primary Jakarta pulih? ──► Bisa dijadikan replica dari Singapore
                               (setup manual) ATAU dihapus
```

### Promote — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| DR terakhir jika primary down total | **Irreversible** — tidak bisa kembali jadi replica |
| Replica langsung bisa write | Data sejak lag terakhir bisa hilang (RPO = replication lag) |
| Proses cepat (~beberapa menit) | Perlu reconfigure semua connection string |

**CLI:**

```bash
gcloud sql instances promote-replica REPLICA_NAME
```

---

## Enterprise Plus: Advanced Disaster Recovery (Switchback)

**Hanya tersedia di Enterprise Plus.**

Fitur utama: setelah failover ke DR replica, bisa **switchback** (kembali ke primary asli) tanpa rebuild.

### Flow Advanced DR

```
Normal:
  App ──► Primary (Jakarta) ◄──designated DR──► DR Replica (Singapore)

Step 1 — Switchover ke DR (planned atau karena failure):
  App ──► DR Replica (Singapore) menjadi Primary
          Primary lama (Jakarta) menjadi DR Replica

Step 2 — Switchback setelah Jakarta pulih:
  App ──► Primary (Jakarta) kembali aktif
          Singapore kembali jadi DR Replica

  ──► Tidak perlu rebuild, replication otomatis re-establish
```

### Perbedaan dengan Enterprise (promote biasa)

| Aspek | Enterprise (Promote) | Enterprise Plus (Switchover) |
|-------|---------------------|------------------------------|
| Proses | Promote = permanent, putus replication | Switchover = reversible |
| Switchback | Tidak bisa — harus setup manual | **Otomatis**, tinggal switchback |
| Data loss | RPO = replication lag | RPO mendekati 0 (designated DR) |
| Downtime | Perlu reconfigure connection | Minimal — IP bisa tetap |
| Kompleksitas ops | Tinggi (rebuild replication manual) | Rendah (1 tombol switchover/switchback) |

### Console path

`SQL` → instance → **Replicas** → pilih **designated DR replica** → **Switchover** / **Switchback**

---

## Replication Lag Monitoring

**Console path:** `SQL` → instance → **Overview** → panel **Replication lag** (untuk replica)

Atau: **Monitoring** → **Metrics Explorer** → metric `database/replication/replica_lag`

### Apa itu replication lag?

Waktu keterlambatan antara write di primary dan data tersedia di replica.

| Lag | Artinya |
|-----|---------|
| **0-1 detik** | Normal, excellent |
| **1-5 detik** | Acceptable untuk kebanyakan use case |
| **5-30 detik** | Perlu investigasi — primary terlalu sibuk atau replica under-provisioned |
| **>30 detik** | Masalah serius — scale up replica atau periksa long-running transactions |

### Penyebab lag tinggi & solusi

| Penyebab | Solusi |
|----------|--------|
| Primary write-heavy | Scale up replica machine type |
| Long-running transaction di primary | Optimize query, hindari transaksi besar |
| Replica under-provisioned (CPU/RAM kecil) | Scale up replica |
| DDL besar (ALTER TABLE) | Jalankan di maintenance window |
| Network issue (cross-region) | Monitor network metrics |

---

## Perbandingan: HA vs Read Replica

| Aspek | HA (Standby) | Read Replica |
|-------|-------------|--------------|
| **Tujuan** | Failover otomatis | Scale read traffic |
| **Replication** | Synchronous | Asynchronous |
| **Bisa read?** | Tidak (idle standby) | Ya (read-only) |
| **Failover** | Otomatis (~60 detik) | Manual (promote) |
| **Data loss** | Zero (sync) | Mungkin ada (async lag) |
| **Biaya** | ~2x primary | Per replica |
| **Lintas region** | Tidak (same region, different zone) | Ya |

---

## Ringkasan Rekomendasi

| Skenario | HA | Read Replica | Cross-region DR |
|----------|----|--------------|-----------------| 
| Development | Tidak perlu | Tidak perlu | Tidak perlu |
| Production kecil | Ya | Opsional | Opsional |
| Production besar | Ya | Ya (1-3 replica) | Ya (1 cross-region) |
| Mission-critical | Ya + Enterprise Plus | Ya | Ya + Enterprise Plus switchover |
| Global users | Ya | Ya (per region) | Ya |
