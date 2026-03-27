# Pricing (Cloud Storage)

Estimasi harga **Cloud Storage** per **storage class**. Harga bisa berubah; selalu cek [pricing page resmi](https://cloud.google.com/storage/pricing) untuk angka terbaru.

> Angka di bawah berorientasi region **asia-southeast2 (Jakarta)** sebagai contoh.

---

## Melihat biaya di GCP Console

### Laporan billing (service Cloud Storage)

**Console:** **Billing** → **Reports** → filter **Service: Cloud Storage**

Di sini Anda melihat agregat biaya **Cloud Storage** (dan bisa drill-down ke **SKU** / **region** sesaui filter).

### Penggunaan per bucket (monitoring data)

**Console:** **Cloud Storage** → **Buckets** → klik **bucket** → lihat **monitoring data** / metrik pada halaman bucket (grafik request, storage, dll. sesuai tab yang tersedia di UI).

### Harga saat membuat bucket (referensi cepat)

Saat **Create bucket**, form **GCP Console** biasanya menampilkan **ringkasan pricing** atau tautan ke dokumentasi harga untuk **storage class** dan **region** yang Anda pilih. Gunakan itu sebagai **referensi cepat** saat memilih **Standard** vs **Nearline** / **Coldline** / **Archive**; untuk estimasi project penuh, gabungkan dengan **Billing → Reports**.

### Budget alert

**Console:** **Billing** → **Budgets & alerts** → buat **budget** dan **threshold** notifikasi agar biaya **Cloud Storage** (atau seluruh project) tidak melewati ekspektasi.

---

## Storage cost per GB per bulan

```
╔══════════════╦═══════════════╦═══════════════╗
║  Class       ║  Per GB/bulan ║  100 GB/bulan ║
╠══════════════╬═══════════════╬═══════════════╣
║  Standard    ║  ~$0.023      ║  ~$2.30       ║
║  Nearline    ║  ~$0.016      ║  ~$1.60       ║
║  Coldline    ║  ~$0.006      ║  ~$0.60       ║
║  Archive     ║  ~$0.0025     ║  ~$0.25       ║
╚══════════════╩═══════════════╩═══════════════╝
```

---

## Retrieval cost (biaya akses) per GB

```
╔══════════════╦═══════════════╗
║  Class       ║  Per GB read  ║
╠══════════════╬═══════════════╣
║  Standard    ║  $0 (gratis)  ║
║  Nearline    ║  ~$0.01       ║
║  Coldline    ║  ~$0.02       ║
║  Archive     ║  ~$0.05       ║
╚══════════════╩═══════════════╝
```

---

## Operation cost (per 10.000 operasi)

```
╔══════════════╦═══════════════╦═══════════════╗
║  Class       ║  Class A ops  ║  Class B ops  ║
║              ║  (write/list) ║  (read/get)   ║
╠══════════════╬═══════════════╬═══════════════╣
║  Standard    ║  ~$0.05       ║  ~$0.004      ║
║  Nearline    ║  ~$0.10       ║  ~$0.01       ║
║  Coldline    ║  ~$0.10       ║  ~$0.05       ║
║  Archive     ║  ~$0.50       ║  ~$0.50       ║
╚══════════════╩═══════════════╩═══════════════╝

Class A operations: insert, update, list, watch
Class B operations: get, read metadata
```

---

## Minimum storage duration

Kalau objek dihapus sebelum **minimum storage duration**, tetap dikenakan charge sampai durasi minimum tercapai.

```
╔══════════════╦══════════════════╦══════════════════════════════╗
║  Class       ║  Min durasi      ║  Artinya                     ║
╠══════════════╬══════════════════╬══════════════════════════════╣
║  Standard    ║  Tidak ada       ║  Hapus kapan saja, no charge ║
║  Nearline    ║  30 hari         ║  Hapus di hari ke-10 = tetap ║
║              ║                  ║  bayar 30 hari               ║
║  Coldline    ║  90 hari         ║  Hapus di hari ke-30 = tetap ║
║              ║                  ║  bayar 90 hari               ║
║  Archive     ║  365 hari        ║  Hapus di hari ke-100 = tetap║
║              ║                  ║  bayar 365 hari              ║
╚══════════════╩══════════════════╩══════════════════════════════╝
```

---

## Network egress (biaya transfer keluar)

```
╔═══════════════════════════════════╦═══════════════╗
║  Tujuan                          ║  Per GB        ║
╠═══════════════════════════════════╬═══════════════╣
║  Dalam region yang sama           ║  $0 (gratis)   ║
║  Antar region (Indonesia→SG)     ║  ~$0.01        ║
║  Ke internet (download user)     ║  ~$0.12        ║
║  Ke Google services (BigQuery)   ║  $0 (gratis)   ║
╚═══════════════════════════════════╩═══════════════╝
```

---

## Simulasi biaya

### Skenario 1: Website assets (100 GB, sering diakses)

```
Storage: 100 GB x $0.023        = $2.30/bulan
Read:    50 GB  x $0 (standard) = $0
Egress:  50 GB  x $0.12         = $6.00/bulan
─────────────────────────────────────────
Total:                           ~$8.30/bulan

Dengan CDN di depannya:
Egress via CDN: 50 GB x $0.08   = $4.00/bulan (lebih murah)
Total:                           ~$6.30/bulan
```

### Skenario 2: Backup (500 GB, jarang diakses)

```
Nearline:
Storage: 500 GB x $0.016        = $8.00/bulan
Read:    5 GB   x $0.01         = $0.05/bulan (jarang baca)
─────────────────────────────────────────
Total:                           ~$8.05/bulan

Kalau pakai Standard:
Storage: 500 GB x $0.023        = $11.50/bulan
                                  (lebih mahal $3.45!)
```

### Skenario 3: Arsip (1 TB, hampir tidak diakses)

```
Archive:
Storage: 1000 GB x $0.0025      = $2.50/bulan
Read:    0 GB                    = $0 (tidak pernah baca)
─────────────────────────────────────────
Total:                           ~$2.50/bulan

Kalau pakai Standard:
Storage: 1000 GB x $0.023       = $23.00/bulan
                                  (hemat $20.50/bulan!)
```

---

## Tips hemat

1. Pakai **Autoclass** untuk bucket yang campuran (file aktif & jarang diakses).
2. **Lifecycle rules** untuk auto-delete backup lama.
3. **Cloud CDN** di depan bucket untuk mengurangi **egress cost**.
4. **Regional bucket** jika audiens utama dari satu wilayah.
5. Jangan pakai **Standard** untuk data yang jarang diakses.
6. Jangan pakai **Nearline**/**Coldline** untuk data yang sangat sering diakses (biaya **retrieval** bisa melebihi hemat **storage**).
