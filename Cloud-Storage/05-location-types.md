# Location Types

Saat membuat **bucket**, Anda harus memilih **location type** dan lokasi data. Ini menentukan di mana data disimpan secara fisik, yang mempengaruhi **latency**, **availability**, dan **harga**.

Dokumen ini berorientasi pada **Google Cloud Console**.

---

## Console path: Location type saat Create bucket

**Console path:**

`Google Cloud Console` → **Cloud Storage** → **Buckets** → **Create** → langkah **Choose where to store your data** (atau judul serupa)

Di langkah tersebut Anda akan menemukan:

- Dropdown atau pilihan **Location type** (**Region** / **Dual-region** / **Multi-region**)
- Setelah memilih tipe, dropdown **Location** (nama **region**, pasangan **dual-region**, atau **multi-region** seperti `asia`, `us`, `eu`)

**Catatan:** **Location** bucket **tidak bisa diubah** setelah dibuat. Pilih dengan hati-hati di wizard **Create**.

---

## Dropdown Location type: Region / Dual-region / Multi-region

### Opsi 1: Region

**Di Console:** **Location type** = **Region** → pilih satu **region** di dropdown **Location** (misalnya `asia-southeast2`).

Data disimpan di **satu region** (redundansi di dalam **region** via **zones**).

```
╔═══════════════════════════════════════╗
║  Regional: asia-southeast2 (Jakarta)  ║
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │  Data disimpan di sini saja     │  ║
║  │  (multiple zones dalam 1 region)│  ║
║  └─────────────────────────────────┘  ║
║                                       ║
║  Latency:      Paling rendah         ║
║  Availability: 99.9% (standard)      ║
║  Harga:        Paling murah          ║
╚═══════════════════════════════════════╝
```

| Aspek | Kelebihan | Kekurangan |
|--------|-----------|------------|
| **Latency** | Terendah untuk workload di **region** yang sama | User jauh dari **region** bisa mengalami **latency** lebih tinggi |
| **Biaya** | **Storage** dan seringkali **egress** dalam **region** sama paling ekonomis | Tidak ada replika otomatis ke **region** lain |
| **Availability** | Cukup untuk banyak aplikasi single-region | Kejadian besar per **region** mempengaruhi seluruh data |
| **Compliance** | Mudah menjelaskan "data di **region** X" | DR lintas **region** harus di desain terpisah (**backup** / bucket lain) |

---

### Opsi 2: Dual-region

**Di Console:** **Location type** = **Dual-region** → pilih pasangan yang diizinkan GCP di dropdown **Location** (contoh populer di Asia: **Singapore + Jakarta** jika tersedia sebagai pasangan resmi di picker).

Data di-replicate ke **dua region** yang Anda pilih (model replikasi **dual-region** GCP).

```
╔═══════════════════════════════════════════════════╗
║  Dual-Region                                     ║
║                                                   ║
║  ┌─────────────────┐    ┌─────────────────┐      ║
║  │ asia-southeast1 │◄──►│ asia-southeast2 │      ║
║  │ (Singapore)     │    │ (Jakarta)       │      ║
║  └─────────────────┘    └─────────────────┘      ║
║         Region A             Region B             ║
║                                                   ║
║  Latency:      Rendah (dari kedua region)        ║
║  Availability: 99.95%                            ║
║  Harga:        Sedang                            ║
║  Replika:      Otomatis antar 2 region           ║
╚═══════════════════════════════════════════════════╝
```

| Aspek | Kelebihan | Kekurangan |
|--------|-----------|------------|
| **Redundansi** | Replikasi otomatis antar dua **region** | Hanya pasangan tertentu yang didukung (cek dropdown **Console**) |
| **DR** | Lebih baik dari **Region** tunggal untuk skenario **region** outage | Biaya lebih tinggi dari **Region** |
| **Latency** | Baik untuk user di sekitar dua **region** tersebut | Tidak seluas **Multi-region** untuk audience di seluruh benua |
| **Biaya** | Di bawah **Multi-region** untuk cakupan geografis serupa | **Egress** / pola akses lintas **region** perlu diperhitungkan |

---

### Opsi 3: Multi-region

**Di Console:** **Location type** = **Multi-region** → pilih **continent** di dropdown **Location** (**asia**, **us**, **eu**, dll.).

Data di-replicate ke **beberapa region** dalam **multi-region** tersebut.

```
╔═══════════════════════════════════════════════════╗
║  Multi-Region: asia                              ║
║                                                   ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐         ║
║  │ Tokyo    │ │Singapore │ │ Jakarta  │  ...     ║
║  │          │ │          │ │          │         ║
║  └──────────┘ └──────────┘ └──────────┘         ║
║                                                   ║
║  GCP otomatis replicate ke region-region          ║
║  dalam continent "asia"                           ║
║                                                   ║
║  Latency:      Rendah (dari mana saja di Asia)   ║
║  Availability: 99.95%                            ║
║  Harga:        Paling mahal                      ║
║  Replika:      Otomatis ke banyak region         ║
╚═══════════════════════════════════════════════════╝
```

| Aspek | Kelebihan | Kekurangan |
|--------|-----------|------------|
| **Availability** | **SLA** tinggi, tahan gangguan satu **region** | **Harga storage** dan pola **network** paling mahal di antara tiga opsi |
| **Audience** | Cocok untuk konten yang diakses dari banyak negara di benua yang sama | Kurang presisi jika Anda *hanya* ingin data di satu negara |
| **Latency** | Umumnya baik untuk user tersebar di **multi-region** | Bukan substitusi **CDN** untuk edge global |
| **Compliance** | "Data di **multi-region** X" lebih luas dari satu **region** | Beberapa regulasi mensyaratkan **region** spesifik — pilih **Region** / **Dual-region** jika perlu |

---

## Ringkasan kelebihan/kekurangan (tabel gabungan)

| Location type (Console) | Kelebihan utama | Kekurangan utama |
|-------------------------|-----------------|------------------|
| **Region** | **Latency** terbaik untuk satu lokasi; biaya terendah | Tanpa replika lintas **region** |
| **Dual-region** | Redundansi dua **region**; **DR** lebih kuat | Pasangan terbatas; biaya menengah |
| **Multi-region** | **Availability** tinggi; cocok audience luas di satu benua | Biaya tertinggi; kurang spesifik untuk satu negara |

---

## Region yang relevan untuk Indonesia (dropdown Location saat tipe Region)

Saat **Location type** = **Region**, di dropdown **Location** cari nama berikut (ID resmi GCP). Ketersediaan tepat mengikuti **Console** terbaru.

| Region (ID) | Lokasi umum | Catatan penggunaan |
|-------------|-------------|-------------------|
| `asia-southeast2` | Jakarta (Indonesia) | Pilihan utama untuk workload utama di Indonesia |
| `asia-southeast1` | Singapore | **Latency** rendah dari Indonesia; sering dipakai untuk DR pair dengan Jakarta |
| `asia-south1` | Mumbai (India) | Alternatif Asia Selatan bila ada kebutuhan bisnis/regulasi terkait |
| `asia-south2` | Delhi (India) | Opsi tambahan di India |
| `asia-east1` | Taiwan | Opsi Asia Timur |
| `asia-east2` | Hong Kong | Opsi Asia Timur |
| `asia-northeast1` | Tokyo | Opsi Asia Timur Laut |
| `asia-northeast2` | Osaka | Opsi Asia Timur Laut |
| `australia-southeast1` | Sydney | Jika ada cabang / user di Australia |

Untuk **Dual-region** dan **Multi-region**, daftar di **Console** hanya menampilkan **pasangan** / **multi-region** yang didukung — tidak semua kombinasi manual diizinkan.

---

## Perbandingan (tabel ASCII dipertahankan)

```
╔═══════════════╦═══════════════╦══════════════╦═══════════════╗
║               ║   Regional    ║  Dual-Region ║ Multi-Region  ║
╠═══════════════╬═══════════════╬══════════════╬═══════════════╣
║ Redundansi    ║ 1 region      ║ 2 region     ║ 2+ region     ║
║ Availability  ║ 99.9%         ║ 99.95%       ║ 99.95%        ║
║ Latency       ║ Tercepat      ║ Cepat        ║ Cepat         ║
║               ║ (1 lokasi)    ║ (2 lokasi)   ║ (banyak)      ║
║ Harga storage ║ $             ║ $$           ║ $$$           ║
║ Harga network ║ $             ║ $$           ║ $$$           ║
║ DR capable    ║ Tidak         ║ Ya           ║ Ya            ║
╚═══════════════╩═══════════════╩══════════════╩═══════════════╝
```

**Mapping ke Console:** baris pertama tabel = pilihan **Location type** di **Create bucket**.

---

## Pilih berdasarkan use case (dengan referensi Console)

```
Aplikasi & user di Indonesia saja?
  ──► Create → Location type: Region → Location: asia-southeast2 (Jakarta)

Butuh DR ke Singapore?
  ──► Create → Location type: Dual-region → pilih pasangan yang tersedia
      (sering melibatkan asia-southeast1 + asia-southeast2 jika ditawarkan)

User tersebar di Asia?
  ──► Create → Location type: Multi-region → Location: asia

Content global (semua negara)?
  ──► Multi-region: asia / us / eu (sesuai audience)
      atau Region + Cloud CDN di depannya
```

---

## Contoh gcloud (setara dengan pilihan di Console)

```bash
# Buat bucket regional di Jakarta
gcloud storage buckets create gs://ftl-images \
    --location=asia-southeast2

# Buat bucket dual-region (Jakarta + Singapore)
gcloud storage buckets create gs://ftl-backups \
    --location=ASIA \
    --placement=asia-southeast1,asia-southeast2

# Buat bucket multi-region Asia
gcloud storage buckets create gs://ftl-global-assets \
    --location=asia
```

**Verifikasi di Console:** `Buckets` → klik **bucket** → tab **Configuration** / **Overview** — field **Location** harus cocok dengan yang Anda pilih di wizard **Create**.

**Pengingat:** **Location** bucket **tidak bisa diubah** setelah dibuat. Jika salah, Anda perlu **bucket** baru + **migrate** data.
