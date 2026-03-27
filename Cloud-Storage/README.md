# Google Cloud Storage

Catatan lengkap tentang **Google Cloud Storage** di GCP, dengan fokus **Google Cloud Console** (UI web).

## Navigasi Console (umum)

**Akses layanan bucket:**

`Console: Cloud Storage → Buckets`

- Dari menu hamburger (☰) GCP Console: **Cloud Storage** → **Buckets**.
- Atau gunakan **Search bar** di atas: ketik `Cloud Storage` → pilih **Cloud Storage**.

---

## Daftar Isi

| # | Topik | File |
|---|-------|------|
| 01 | Storage Classes (Standard, Nearline, Coldline, Archive) | [01-storage-classes.md](01-storage-classes.md) |
| 02 | Autoclass (recommended) | [02-autoclass.md](02-autoclass.md) |
| 03 | Object Lifecycle Management | [03-lifecycle-management.md](03-lifecycle-management.md) |
| 04 | Access Control (IAM, Signed URL) | [04-access-control.md](04-access-control.md) |
| 05 | Location Types (Regional, Multi-region) | [05-location-types.md](05-location-types.md) |
| 06 | Data Protection | [06-data-protection.md](06-data-protection.md) |
| 07 | Commands Cheatsheet (gsutil/gcloud) | [07-commands-cheatsheet.md](07-commands-cheatsheet.md) |
| 08 | Pricing | [08-pricing.md](08-pricing.md) |
| 09 | Arsitektur & Strategi | [09-architecture.md](09-architecture.md) |
| 10 | Best Practices | [10-best-practices.md](10-best-practices.md) |

---

## Quick start via Console: bucket pertama

Langkah singkat membuat **bucket** pertama lewat UI (tanpa CLI):

| Langkah | Di Console |
|--------|------------|
| 1 | Buka `Cloud Storage → Buckets`. |
| 2 | Klik **CREATE** (atau **CREATE BUCKET**). |
| 3 | Isi **Name** (harus unik global). |
| 4 | Pilih **Location type** dan **Location** (mis. region terdekat). |
| 5 | **Default storage class**: pilih class atau aktifkan **Autoclass** (disarankan untuk banyak use case). |
| 6 | **Access control**: pilih Uniform / Fine-grained sesuai kebutuhan IAM. |
| 7 | Klik **CREATE**. |

**Catatan UI:** nama field bisa sedikit berbeda antar versi Console; intinya mengikuti wizard **Create bucket** dari halaman **Buckets**.

---

## Overview Flow

```
╔═══════════════════════════════════════════════════════╗
║              GOOGLE CLOUD STORAGE                     ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  Biaya Storage:  MAHAL ◄─────────────────► MURAH     ║
║  Biaya Akses:    MURAH ◄─────────────────► MAHAL     ║
║  Kecepatan:      CEPAT ◄─────────────────► LAMBAT    ║
║                                                       ║
║  ┌────────────┐  ┌────────────┐  ┌──────────────┐   ║
║  │  STANDARD  │  │  NEARLINE  │  │   COLDLINE   │   ║
║  │            │  │            │  │              │   ║
║  │  Sering    │  │  Jarang    │  │  Sangat      │   ║
║  │  diakses   │  │  diakses   │  │  jarang      │   ║
║  │            │  │  min 30    │  │  min 90      │   ║
║  │  Storage:  │  │  hari      │  │  hari        │   ║
║  │  $$$$ mahal│  │            │  │              │   ║
║  │  Akses:    │  │  Storage:  │  │  Storage:    │   ║
║  │  $ murah   │  │  $$$ sedang│  │  $$ murah    │   ║
║  │            │  │  Akses:    │  │  Akses:      │   ║
║  │            │  │  $$ sedang │  │  $$$ mahal   │   ║
║  └──────┬─────┘  └──────┬─────┘  └──────┬───────┘   ║
║         │               │               │            ║
║         │               │               │            ║
║  ┌──────┴───────────────┴───────────────┴─────────┐  ║
║  │                                                │  ║
║  │  ┌────────────┐                                │  ║
║  │  │  ARCHIVE   │  min 365 hari                  │  ║
║  │  │            │  Storage: $ paling murah       │  ║
║  │  │            │  Akses:   $$$$ paling mahal    │  ║
║  │  └────────────┘                                │  ║
║  │                                                │  ║
║  └────────────────────────┬───────────────────────┘  ║
║                           │                          ║
║                           ▼                          ║
║  ╔════════════════════════════════════════════════╗   ║
║  ║           AUTOCLASS (recommended)             ║   ║
║  ║                                               ║   ║
║  ║  GCP otomatis pindahkan data antar class      ║   ║
║  ║  berdasarkan pola akses:                      ║   ║
║  ║                                               ║   ║
║  ║  Sering diakses ──► naik ke Standard          ║   ║
║  ║  Jarang diakses ──► turun ke Nearline         ║   ║
║  ║  Makin jarang   ──► turun ke Coldline         ║   ║
║  ║  Tidak pernah   ──► turun ke Archive          ║   ║
║  ╚════════════════════════════════════════════════╝   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

**Di Console:** class default dan **Autoclass** diatur saat **Create bucket** atau di tab **Configuration** bucket yang sudah ada (lihat [01-storage-classes.md](01-storage-classes.md) dan [02-autoclass.md](02-autoclass.md)).

---

## Decision Tree: Pilih Storage Class

```
╔══════════════════════════╗
║    Data baru masuk       ║
╚════════════╤═════════════╝
             │
             ▼
╔══════════════════════════╗
║   Pakai Autoclass?       ║
╚═════╤════════════╤═══════╝
      │            │
     YES          NO
      │            │
      ▼            ▼
╔═══════════╗  ╔═════════════════════════════╗
║ Selesai!  ║  ║ Seberapa sering diakses?    ║
║ GCP yang  ║  ╚═════════════╤═══════════════╝
║ atur      ║                │
║ semua     ║      ┌─────────┼─────────┬──────────┐
╚═══════════╝      │         │         │          │
                   ▼         ▼         ▼          ▼
             ┌──────────┐┌────────┐┌────────┐┌─────────┐
             │ Setiap   ││ Tiap   ││ Tiap   ││Setahun+ │
             │ hari     ││ bulan  ││ 3-12   ││         │
             │          ││        ││ bulan  ││         │
             └─────┬────┘└───┬────┘└───┬────┘└────┬────┘
                   │         │         │          │
                   ▼         ▼         ▼          ▼
             ╔══════════╗╔════════╗╔════════╗╔═════════╗
             ║ STANDARD ║║NEARLINE║║COLDLINE║║ ARCHIVE ║
             ║          ║║        ║║        ║║         ║
             ║ Cepat,   ║║ Hemat, ║║ Lebih  ║║ Paling  ║
             ║ mahal    ║║ agak   ║║ hemat, ║║ murah,  ║
             ║ storage  ║║ lambat ║║ lambat ║║ paling  ║
             ║          ║║        ║║        ║║ lambat  ║
             ╚══════════╝╚════════╝╚════════╝╚═════════╝
```

---

## Kesimpulan Cepat

* Kalau bingung: di wizard **Create bucket**, aktifkan **Autoclass** (recommended).
* Kalau **tanpa** Autoclass, pilih **Default storage class** di dropdown sesuai pola akses:
  * Sering akses → **Standard**
  * Jarang → **Nearline**
  * Sangat jarang → **Coldline**
  * Arsip → **Archive**
