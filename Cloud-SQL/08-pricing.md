# Pricing

Komponen biaya **Cloud SQL** dan cara estimasi di **GCP Console**.

---

## Komponen Biaya

| Komponen | Deskripsi | Dihitung per |
|----------|-----------|-------------|
| **Instance (vCPU + Memory)** | Biaya compute berdasarkan machine type | Per jam instance running |
| **Storage** | Persistent disk (SSD atau HDD) | Per GB/bulan |
| **Backup storage** | Automated + on-demand backups | Per GB/bulan |
| **Network egress** | Traffic keluar dari instance | Per GB |
| **HA standby** | Standby instance untuk failover | ~sama dengan primary |
| **IP address** | Public IP jika tidak dipakai 24/7 | Per jam idle |
| **License** (SQL Server) | License fee di atas compute cost | Per jam |

---

## Estimasi Biaya di Console

### Saat Create Instance

**Console path:** `SQL` → **Create Instance** → panel kanan menampilkan **Monthly estimate**

Panel ini menampilkan estimasi bulanan berdasarkan konfigurasi yang dipilih (machine, storage, HA, backup).

### Pricing Calculator

**Console path:** Buka [cloud.google.com/products/calculator](https://cloud.google.com/products/calculator) → **Cloud SQL**

Isi parameter: engine, region, machine type, storage, HA, backup → lihat estimasi.

### Billing Reports

**Console path:** `Billing` → **Reports** → filter **Cloud SQL**

Lihat biaya aktual per instance, per project, per label.

---

## Harga per Komponen (Perkiraan, region asia-southeast2)

**Catatan:** Harga bisa berubah. Selalu cek [cloud.google.com/sql/pricing](https://cloud.google.com/sql/pricing) untuk harga terkini.

### Instance (Compute)

| Machine type | vCPU | RAM | ~Harga/bulan | Keterangan |
|-------------|------|-----|-------------|------------|
| db-f1-micro | Shared | 0.6 GB | ~$8 | Testing saja |
| db-g1-small | Shared | 1.7 GB | ~$27 | Development |
| db-n1-standard-1 | 1 | 3.75 GB | ~$50 | Small production |
| db-n1-standard-4 | 4 | 15 GB | ~$200 | Medium production |
| db-n1-standard-8 | 8 | 30 GB | ~$400 | Large production |
| db-n1-standard-16 | 16 | 60 GB | ~$800 | Very large |
| db-n1-highmem-4 | 4 | 26 GB | ~$260 | Memory-intensive |
| db-n1-highmem-16 | 16 | 104 GB | ~$1050 | Heavy workload |

**Enterprise Plus:** Tambah ~30-50% dari harga Enterprise.

### Storage

| Tipe | Harga/GB/bulan |
|------|---------------|
| **SSD** | ~$0.17 |
| **HDD** | ~$0.09 |

### Backup Storage

| Tipe | Harga/GB/bulan |
|------|---------------|
| Backup storage | ~$0.08 |

### Network Egress

| Tujuan | Harga/GB |
|--------|---------|
| Same region | Free |
| Antar region (Asia) | ~$0.01 |
| Ke internet | ~$0.12 |

### HA (High Availability)

HA menambah **standby instance** yang ukurannya sama dengan primary:

```
Biaya HA = biaya primary (compute + storage) × ~2
```

### SQL Server License

| Edition | Tambahan per vCPU/jam |
|---------|---------------------|
| SQL Server Express | Gratis (terbatas) |
| SQL Server Web | ~$0.011 |
| SQL Server Standard | ~$0.179 |
| SQL Server Enterprise | ~$0.349 |

---

## Contoh Kalkulasi

### Skenario: Production MySQL

```
Machine:        db-n1-standard-4 (4 vCPU, 15GB RAM)     = ~$200/bulan
Storage:        100GB SSD                                  = ~$17/bulan
HA:             Ya (standby)                               = ~$200/bulan
Backup:         30 hari × ~50GB avg                        = ~$4/bulan
Read replica:   1× db-n1-standard-2                        = ~$100/bulan
──────────────────────────────────────────────────────────────────────
Total perkiraan                                            ≈ $521/bulan
```

### Skenario: Development MySQL

```
Machine:        db-g1-small (shared, 1.7GB RAM)           = ~$27/bulan
Storage:        10GB SSD                                    = ~$1.7/bulan
HA:             Tidak                                       = $0
Backup:         Tidak                                       = $0
──────────────────────────────────────────────────────────────────────
Total perkiraan                                            ≈ $29/bulan
```

### Skenario: Production PostgreSQL + Enterprise Plus

```
Machine:        Enterprise Plus, 8 vCPU, 52GB RAM         = ~$600/bulan
Data cache:     Local SSD 375GB                             = included
Storage:        500GB SSD                                   = ~$85/bulan
HA:             Ya                                          = ~$600/bulan
Backup:         365 hari × ~200GB avg                       = ~$16/bulan
DR replica:     Cross-region Singapore                      = ~$600/bulan
──────────────────────────────────────────────────────────────────────
Total perkiraan                                            ≈ $1,901/bulan
```

---

## Committed Use Discounts (CUD)

Komitmen penggunaan 1 atau 3 tahun untuk diskon.

**Console path:** `Billing` → **Commitments** (atau melalui halaman Cloud SQL pricing)

| Durasi | Diskon |
|--------|--------|
| 1 tahun | ~25% |
| 3 tahun | ~52% |

### CUD — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Hemat signifikan (25-52%) | Komitmen — bayar meskipun tidak pakai |
| Predictable cost | Tidak bisa downgrade di bawah committed level |
| Otomatis berlaku ke instance yang sesuai | Harus yakin dengan sizing untuk 1-3 tahun |

---

## Sustained Use Discounts (SUD)

Diskon otomatis jika instance berjalan >25% waktu dalam sebulan.

| Penggunaan | Diskon |
|------------|--------|
| 25-50% bulan | ~20% |
| 50-75% bulan | ~40% |
| 75-100% bulan | ~60% |

SUD otomatis — tidak perlu konfigurasi apapun.

---

## Tips Hemat Biaya

| Tips | Estimasi penghematan |
|------|---------------------|
| **Right-size instance** — jangan over-provision vCPU/RAM | 20-50% |
| **Matikan instance dev/staging** di luar jam kerja | 60-70% untuk non-prod |
| **Gunakan HDD** untuk development (bukan SSD) | ~47% storage cost |
| **Kurangi backup retention** yang tidak perlu | Variable |
| **CUD 1 tahun** untuk production yang stabil | 25% |
| **CUD 3 tahun** untuk database yang pasti long-term | 52% |
| **Hapus read replica** yang tidak terpakai | 100% biaya replica |
| **Review labels** di Billing Reports | Visibility = optimization |

### Cara matikan instance (stop)

**Console:** `SQL` → instance → **Stop** (tombol)

Instance stopped **tidak dikenakan biaya compute**, hanya **storage**.

```bash
# CLI
gcloud sql instances patch INSTANCE_NAME --activation-policy=NEVER
# Start kembali
gcloud sql instances patch INSTANCE_NAME --activation-policy=ALWAYS
```

---

## Billing Alerts

**Console path:** `Billing` → **Budgets & alerts** → **Create budget**

Setup alert agar tidak kaget dengan tagihan:

| Threshold | Aksi |
|-----------|------|
| 50% budget | Email notification |
| 80% budget | Email + Slack |
| 100% budget | Email + Slack + PagerDuty |
| 120% budget | Investigate immediately |
