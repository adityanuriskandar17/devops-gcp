
![Screenshot from 2026-03-26 15-31-58.png](/images/Cloud-Storage/1774514044214-Screenshot_from_2026-03-26_15-31-58.png)

# Access Control

**Access control** di **Cloud Storage** mengatur **siapa** yang boleh **melakukan apa** terhadap **bucket** dan **objek**. Dokumen ini berorientasi pada **Google Cloud Console**; istilah teknis (**IAM**, **ACL**, **Uniform bucket-level access**, dll.) tetap dalam bahasa Inggris sesuai UI dan dokumentasi GCP.

---

## Console path: Access control saat membuat bucket

**Console path:**

`Google Cloud Console` → **Cloud Storage** → **Buckets** → **Create** → scroll ke bagian **Access control** (sering berdekatan dengan **Protection tools** / **Data encryption** tergantung layout wizard)

Di wizard **Create bucket**, bagian **Access control** menentukan apakah bucket baru memakai **Uniform bucket-level access** atau **Fine-grained access** (**ACL** per objek).

### Dropdown / pilihan: Uniform vs Fine-grained

| Opsi di Console | Deskripsi singkat |
|-----------------|-------------------|
| **Uniform** | Semua akses objek mengikuti **IAM** di level bucket; tidak mengandalkan **ACL** per objek. |
| **Fine-grained** | **ACL** per objek diizinkan; bisa dikombinasikan dengan **IAM**. |

#### Uniform bucket-level access — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Model keamanan lebih sederhana: satu sumber kebenaran (**IAM policy**) | Tidak bisa memberi permission berbeda per objek lewat **ACL** |
| Cocok untuk **least privilege** dan audit **IAM** | Migrasi dari sistem lama yang bergantung pada **ACL** per objek butuh perencanaan |
| Direkomendasikan GCP untuk bucket baru | Perlu desain **prefix** / bucket terpisah jika butuh isolasi kasar per "folder" |

#### Fine-grained — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Fleksibel: objek berbeda bisa punya **reader** / **owner** berbeda | Kompleks: dua sistem (**IAM** + **ACL**) bisa saling override — rawan kebingungan |
| Berguna untuk skenario legacy atau sharing per file | Lebih sulit diaudit dan lebih mudah salah konfigurasi |
| Mendukung grant ke user/email spesifik per objek | Tidak direkomendasikan untuk greenfield; tim sering migrasi ke **Uniform** |

**Setelah bucket ada:** Anda bisa mengubah ke **Uniform** lewat detail bucket (lihat bagian berikut). Mengaktifkan **Uniform** biasanya **irreversible** (tidak bisa kembali ke **Fine-grained**).

---

## Console path: Permissions (IAM) pada bucket

**Console path:**

`Cloud Storage` → **Buckets** → klik **nama bucket** → tab **Permissions**

Di tab **Permissions** Anda mengelola:

- **Principal** (user, group, **service account**, domain) dan **role** (**IAM**)
- Tombol **Grant access** untuk menambah binding baru
- **View by principals** / **View by roles** (toggle tampilan jika tersedia)

**Praktik umum:** untuk bucket internal, gunakan **Uniform** + hanya **IAM** di tab **Permissions**. Hindari memberi role luas ke `allUsers` / `allAuthenticatedUsers` kecuali memang untuk konten publik terkontrol.

---

## IAM Roles untuk Cloud Storage

Tabel berikut mempertahankan referensi role seperti versi sebelumnya; nama role persis seperti di **IAM** / **Console**.

| Role | Keterangan | Bisa apa |
|------|------------|----------|
| `roles/storage.admin` | Full admin | Semua operasi |
| `roles/storage.objectAdmin` | Admin objek | CRUD objek, tapi tidak bisa manage bucket |
| `roles/storage.objectCreator` | Hanya buat | Upload saja, tidak bisa baca/hapus |
| `roles/storage.objectViewer` | Hanya baca | Download/lihat objek saja |
| `roles/storage.hmacKeyAdmin` | HMAC admin | Manage **HMAC keys** untuk interoperability |

**Console path menambah binding:** `Buckets` → klik **bucket** → **Permissions** → **Grant access** → isi **New principals** → pilih **Role** dari dropdown (misalnya **Cloud Storage** → **Storage Object Viewer**) → **Save**.

### Contoh via gcloud (setara dengan Grant access)

```bash
gcloud storage buckets add-iam-policy-binding gs://BUCKET_NAME \
    --member=serviceAccount:SA_EMAIL \
    --role=roles/storage.objectViewer
```

---

## Public Access Prevention

**Public Access Prevention** mencegah bucket (dan objeknya) menjadi publik secara tidak sengaja sesuai kebijakan organisasi.

### Console path

**Console path (disarankan):**

`Cloud Storage` → **Buckets** → klik **nama bucket** → tab **Permissions** → kartu **Public access** → **Edit public access prevention** (atau tautan serupa) → pilih **Enforced** / **Inherited** / **Disabled** sesuai kebutuhan dan kebijakan **Organization Policy**

Versi UI bisa menampilkan status di ringkasan bucket; intinya pengaturan berada di area **Public access** pada **Permissions** untuk bucket tersebut.

### Nilai umum

| Setting | Arti singkat |
|---------|----------------|
| **Enforced** | Bucket tidak bisa dibuat publik (`allUsers` / `allAuthenticatedUsers` untuk data akan dicegah sesuai aturan) |
| **Inherited** | Mengikuti **organization** / **folder** / **project** |
| **Disabled** | Tidak ada pencegahan di level bucket ini (hati-hati) |

### Kapan pakai?

* Bucket berisi data sensitif (**backup**, dokumen internal)
* Mencegah kesalahan **IAM** yang membuat data bocor ke publik

### Kapan TIDAK pakai (atau perlu kebijakan berbeda)?

* Bucket untuk **website** static assets yang memang harus publik
* Konten yang di-serve via **Cloud CDN** dengan model akses publik terkontrol

---

## Signed URLs (akses sementara) — CLI / API, bukan tombol di Console

**Signed URL** memberi akses **sementara** ke objek tanpa menambahkan **principal** permanen ke **IAM**. URL punya **expiry**.

**Penting:** Di **Google Cloud Console** **tidak** ada wizard "Generate signed URL" terpusat untuk semua skenario seperti di **gcloud**. Pembuatan **signed URL** pada praktiknya dilakukan lewat:

- **Google Cloud CLI** (`gcloud storage sign-url` atau perintah terkait generasi URL bertanda tangan)
- **Client libraries** (misalnya **Python**, **Go**, **Node.js**)
- Aplikasi Anda yang memakai **service account** dan library penandatanganan

Jadi untuk bagian ini, anggap sebagai **CLI-only** / **API-only** dari sudut pandang operator yang hanya mengandalkan **Console** untuk klik — Anda tetap perlu **terminal** atau kode.

```
╔═══════════════════════════════════════════════════╗
║  Signed URL Flow                                 ║
║                                                   ║
║  1. Server generate signed URL (ada expiry)       ║
║  2. Kirim URL ke user                             ║
║  3. User akses objek langsung via URL             ║
║  4. URL expired → akses ditolak                   ║
╚═══════════════════════════════════════════════════╝
```

### Kapan pakai Signed URL?

* User perlu **download** file tanpa **Google account**
* Akses **upload** sementara (**signed URL** untuk **PUT** / **POST** tergantung implementasi)
* **Share link** yang **auto-expire**

### Generate Signed URL (CLI)

```bash
# Signed URL berlaku 1 jam
gcloud storage sign-url gs://BUCKET/file.pdf \
    --duration=1h \
    --private-key-file=service-account-key.json
```

Output: URL panjang yang bisa diakses siapa saja selama belum **expired** (sesuai scope **signing**).

**Console:** Anda tetap bisa memverifikasi objek ada di **Buckets** → **Objects**, tetapi **signing** dilakukan di luar **Console** seperti di atas.

---

## Uniform: mengaktifkan dari bucket yang sudah ada

Jika bucket dibuat sebagai **Fine-grained**, migrasi ke **Uniform** dilakukan di detail bucket.

**Console path (umum):**

`Buckets` → klik **bucket** → tab **Permissions** (atau **Configuration** / **Settings** tergantung versi) → cari **Uniform bucket-level access** → **Edit** → **Enable** → konfirmasi

**gcloud setara:**

```bash
gcloud storage buckets update gs://BUCKET_NAME \
    --uniform-bucket-level-access
```

---

## Ringkasan pilihan (dengan referensi Console)

```
Data sensitif / internal?
  ──► Uniform access + Public access prevention
      (Create → Access control: Uniform; Permissions → Public access)

Website assets (gambar, CSS, JS)?
  ──► Uniform access + IAM allow allUsers (atau via CDN)
      (Permissions → Grant access — hati-hati dengan scope publik)

Perlu share file sementara?
  ──► Signed URL (CLI / library; bukan tombol utama di Console)

Per-objek permission berbeda?
  ──► Fine-grained saat Create (hindari kalau bisa); kelola via ACL tools/CLI
```

---

## Diagram: Uniform Bucket-Level Access (konsep tetap)

```
╔════════════════════════════════════════════════════╗
║  Uniform Bucket-Level Access                      ║
║                                                    ║
║  Bucket: ftl-images                                ║
║  ┌──────────────────────────────────────────────┐  ║
║  │  IAM Policy (berlaku ke semua objek):        │  ║
║  │                                              │  ║
║  │  admin@ftlgym.com  → Storage Admin           │  ║
║  │  app@project.iam   → Storage Object Viewer   │  ║
║  │  cdn@project.iam   → Storage Object Viewer   │  ║
║  └──────────────────────────────────────────────┘  ║
║                                                    ║
║  Tidak ada ACL per-objek                           ║
║  Semua akses dikontrol lewat IAM                   ║
╚════════════════════════════════════════════════════╝
```

**Console:** model ini dipilih di **Create bucket** → **Access control** → **Uniform**, lalu diisi di **Permissions** dengan **Grant access**.
