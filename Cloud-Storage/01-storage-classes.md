
# Storage Classes (Console)


**Google Cloud Storage** punya 4 **storage class**. Pilihan class mempengaruhi **biaya storage**, **biaya akses (operations)**, dan **latency**. Dokumen ini mengutamakan pengaturan lewat **Google Cloud Console**.

---

## Navigasi Console: pilih class saat buat bucket

**Path umum:**

`Console: Cloud Storage → Buckets → CREATE → Default storage class`

Di wizard **Create bucket**, langkah yang berisi **Default storage class** biasanya setelah **Location**. Dropdown menampilkan opsi class (kecuali jika **Autoclass** dipilih—lihat [02-autoclass.md](02-autoclass.md)).

| Opsi di dropdown (contoh UI) | Arti singkat |
|------------------------------|--------------|
| **Standard** | Hot data, akses sering |
| **Nearline** | Akses jarang (~minimal 30 hari sekali) |
| **Coldline** | Akses sangat jarang (~90 hari+) |
| **Archive** | Arsip, hampir tidak pernah diakses (~365 hari+) |

---

## Navigasi Console: ubah default class bucket yang sudah ada

**Path umum:**

`Console: Cloud Storage → Buckets → klik nama bucket → tab Configuration → Default storage class → EDIT`

- Buka detail bucket, lalu tab **Configuration** (nama bisa **CONFIGURATION**).
- Pada bagian **Default storage class**, gunakan **EDIT** / ikon pensil untuk mengganti class **default** untuk objek baru.
- **Catatan:** objek yang sudah ada tidak otomatis berubah class hanya karena default bucket berubah; untuk objek lama perlu **rewrite class** (Console: object **Edit metadata** / re-upload) atau **Object Lifecycle** / tool lain.

---

## Standard
* Data **sering diakses** (hot data).
* **Latency** rendah; biaya **operations** relatif murah dibanding class dingin.

| Kelebihan | Kekurangan |
|-----------|------------|
| Akses paling cepat; cocok aplikasi real-time | Biaya **storage** paling tinggi |
| Biaya baca/tulis (operations) paling ramah untuk traffic tinggi | Tidak optimal untuk data “dingin” yang jarang dibuka |
| Tidak ada minimum retention khusus class | — |

**Use case (Console mindset):** aset website, API, upload user, workload aktif.

| Aspek | Nilai |
|-------|-------|
| Min durasi simpan | Tidak ada (khusus class) |
| Biaya storage | Paling mahal |
| Biaya akses | Paling murah (relatif) |
| Latency | Paling rendah |

---

## Nearline

* Data **jarang diakses**; disarankan pola akses minimal sekitar **30 hari** sekali agar ekonomis.
* **Storage** lebih murah dari Standard; **operations** dan sedikit **latency** lebih besar dari Standard.

| Kelebihan | Kekurangan |
|-----------|------------|
| Hemat **storage** vs Standard | Minimum storage duration ~30 hari (biaya early delete jika dihapus lebih cepat) |
| Masih relatif cepat saat diakses | Biaya **operations** lebih tinggi dari Standard |
| Cocok backup yang kadang di-restore | Kurang cocok untuk file yang dibuka hampir setiap hari |

**Use case:** backup bulanan, snapshot, data cadangan yang masih mungkin diambil.

| Aspek | Nilai |
|-------|-------|
| Min durasi simpan | 30 hari |
| Biaya storage | Sedang |
| Biaya akses | Sedang |
| Latency | Rendah–sedang |

---

## Coldline

* Data **sangat jarang** diakses; pola ~**90 hari** atau lebih antar akses umumnya masuk akal.
* **Storage** lebih murah dari Nearline; **operations** saat akses lebih mahal.

| Kelebihan | Kekurangan |
|-----------|------------|
| **Storage** murah untuk data dingin | Minimum storage duration ~90 hari |
| Cocok DR / backup jangka menengah–panjang | Retrieval dan operations lebih mahal saat benar-benar perlu data |
| Bisa dipadukan multi-region lewat pilihan **Location** di wizard bucket | Latency lebih tinggi dari Standard/Nearline |

**Use case:** backup kuartalan, DR, salinan di region lain.

| Aspek | Nilai |
|-------|-------|
| Min durasi simpan | 90 hari |
| Biaya storage | Murah |
| Biaya akses | Mahal |
| Latency | Sedang |

---

## Archive

* **Paling murah** untuk **storage**; untuk data yang **hampir tidak pernah** diakses (~**365 hari**+ antar akses ideal).
* **Operations** dan waktu akses paling “mahal” / lambat dibanding class lain.

| Kelebihan | Kekurangan |
|-----------|------------|
| Biaya **storage** terendah | Minimum storage duration ~365 hari |
| Cocok compliance & arsip jangka panjang | Biaya dan latency retrieval tertinggi |
| Mengurangi biaya untuk log/dokumen lama | Sangat tidak cocok untuk workload interaktif |

**Use case:** log lama, dokumen audit, arsip historis.

| Aspek | Nilai |
|-------|-------|
| Min durasi simpan | 365 hari |
| Biaya storage | Paling murah |
| Biaya akses | Paling mahal |
| Latency | Paling tinggi |

---

## Ringkasan opsi dropdown (per class)

| Class | Kelebihan utama | Kekurangan utama |
|-------|-----------------|------------------|
| **Standard** | Cepat, murah operations untuk traffic tinggi | Storage mahal |
| **Nearline** | Storage lebih hemat, akses masih wajar | Min 30 hari; operations lebih mahal |
| **Coldline** | Storage hemat untuk data sangat dingin | Min 90 hari; akses mahal |
| **Archive** | Storage paling murah | Min 365 hari; akses paling mahal & lambat |

---

## Perbandingan Ringkas

```
╔══════════════════╦═══════════════╦══════════════════╦═══════════╗
║    STANDARD      ║   NEARLINE    ║    COLDLINE       ║  ARCHIVE  ║
╠══════════════════╬═══════════════╬══════════════════╬═══════════╣
║                  ║               ║                  ║           ║
║  Data aktif      ║  Backup       ║  Backup          ║  Arsip    ║
║  harian          ║  bulanan      ║  quarterly       ║  tahunan  ║
║                  ║               ║                  ║           ║
╠══════════════════╬═══════════════╬══════════════════╬═══════════╣
║ Contoh:          ║ Contoh:       ║ Contoh:          ║ Contoh:   ║
║                  ║               ║                  ║           ║
║ - Website assets ║ - Backup DB   ║ - DR backup      ║ - Log     ║
║ - Image/video    ║   bulanan     ║   quarterly      ║   lama    ║
║ - API data       ║ - Snapshot VM ║ - Multi-region   ║ - Audit   ║
║ - User uploads   ║ - Export data ║   backup         ║   docs    ║
║                  ║               ║                  ║ - Comply  ║
╠══════════════════╬═══════════════╬══════════════════╬═══════════╣
║ Storage: $$$$    ║ Storage: $$$  ║ Storage: $$      ║ Storage:$ ║
║ Akses:   $       ║ Akses:   $$  ║ Akses:   $$$     ║ Akses:$$$$║
╚══════════════════╩═══════════════╩══════════════════╩═══════════╝
```

---

## Data Lifecycle: Perjalanan data dari waktu ke waktu

```
  Hari ke-0             Hari ke-30            Hari ke-90           Hari ke-365+
     │                     │                     │                     │
     ▼                     ▼                     ▼                     ▼

╔════════════╗       ╔════════════╗       ╔════════════╗       ╔════════════╗
║  STANDARD  ║       ║  NEARLINE  ║       ║  COLDLINE  ║       ║  ARCHIVE   ║
║            ║       ║            ║       ║            ║       ║            ║
║  Data baru ║ ────► ║  30 hari   ║ ────► ║  90 hari   ║ ────► ║  365 hari  ║
║  masuk     ║       ║  tidak     ║       ║  tidak     ║       ║  tidak     ║
║  disini    ║       ║  diakses   ║       ║  diakses   ║       ║  diakses   ║
║            ║       ║            ║       ║            ║       ║            ║
║  Aktif     ║       ║  Mulai     ║       ║  Jarang    ║       ║  Hampir    ║
║  terus     ║       ║  jarang    ║       ║  banget    ║       ║  ga pernah ║
╚════════════╝       ╚════════════╝       ╚════════════╝       ╚════════════╝

  Biaya storage         Makin murah ──────────────────────────►
  Biaya akses           Makin mahal ──────────────────────────►
  Kecepatan             Makin lambat ─────────────────────────►
```

**Hubungan dengan Console:** alur di atas menggambarkan pola manual atau hasil **Autoclass**. Tanpa Autoclass, class awal = pilihan **Default storage class** di **CREATE**; transisi antar class untuk objek sama biasanya via **lifecycle rules** atau perubahan per objek, bukan hanya mengganti default bucket.

---

## Lihat juga

* **Autoclass** (otomatis antar class berdasarkan akses): [02-autoclass.md](02-autoclass.md)
* Indeks modul: [README.md](README.md)
