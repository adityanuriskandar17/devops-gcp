# Object Lifecycle Management

**Object Lifecycle Management** adalah **rules berbasis waktu** untuk otomatis mengelola objek di bucket. Berbeda dari **Autoclass** yang berbasis pola akses, **Lifecycle** berbasis **usia objek** (dan kondisi lain yang Anda set di **Console** atau **JSON**).

Dokumen ini berorientasi pada **Google Cloud Console**. Path UI mengacu ke menu **Cloud Storage** di **Google Cloud Console**.

---

## Navigasi Console: membuka Lifecycle

**Console path (lihat & kelola rules):**

`Google Cloud Console` → **Cloud Storage** → **Buckets** → klik **nama bucket** → tab **Lifecycle**

Di tab **Lifecycle** Anda melihat daftar **rules** yang aktif, tombol **Add a rule** (atau **Add rule**), dan opsi untuk mengedit atau menghapus rule.

**Console path (menambah rule baru):**

`Cloud Storage` → **Buckets** → klik **bucket** → tab **Lifecycle** → **Add a rule**

Form **Add a rule** di **Console** biasanya terstruktur seperti ini (istilah bisa sedikit berbeda antar versi UI, tetapi konsepnya sama):

1. **Action** — pilih dari dropdown **Action** (misalnya **Delete object** atau **Set storage class**).
2. Jika **Set storage class** — muncul dropdown **Storage class** tujuan (**Standard**, **Nearline**, **Coldline**, **Archive**).
3. **Conditions** — bagian kondisi: isi **Age (days)**, **Created before**, **Storage class matches**, **Matches prefix** / **Matches suffix**, atau (untuk **versioned bucket**) opsi seperti **Number of newer versions**, **Days since becoming noncurrent**, dll.
4. Simpan dengan **Create** / **Save** (tergantung versi form).

Setelah disimpan, **Lifecycle engine** GCP mengevaluasi rules secara periodik (perilaku sama seperti saat Anda apply via **API** / **gcloud**).

---

## Beda dengan Autoclass

```
╔══════════════════════════════╦══════════════════════════════╗
║        AUTOCLASS             ║     LIFECYCLE MANAGEMENT     ║
╠══════════════════════════════╬══════════════════════════════╣
║ Pindah class berdasarkan     ║ Pindah class / hapus         ║
║ pola AKSES                   ║ berdasarkan USIA objek       ║
║                              ║                              ║
║ Bisa naik (Archive→Standard) ║ Hanya turun / hapus          ║
║ Tidak bisa hapus objek       ║ Bisa hapus objek otomatis    ║
║ Enable saat buat bucket      ║ Tulis rules manual (JSON)    ║
╚══════════════════════════════╩══════════════════════════════╝
```

**Catatan Console:** **Autoclass** diaktifkan saat **Create bucket** (atau di detail bucket). **Lifecycle** dikelola di tab **Lifecycle** seperti di atas — keduanya bisa dipakai bersamaan dengan perencanaan yang jelas.

---

## Form "Add a rule": dropdown Action

**Console path:** `Buckets` → klik **bucket** → **Lifecycle** → **Add a rule** → bagian **Action** → dropdown **Action**

### Opsi 1: Set storage class (SetStorageClass)

Di **API** / **JSON**: `SetStorageClass` dengan field `storageClass`.

| Aspek | Kelebihan | Kekurangan |
|--------|-----------|------------|
| Biaya | Menurunkan **storage class** ke **Nearline** / **Coldline** / **Archive** mengurangi biaya penyimpanan untuk data dingin | **Retrieval cost** dan **minimum storage duration** bisa membuat akses mendadak lebih mahal |
| Kontrol | Cocok untuk kebijakan "data harus aging ke tier murah setelah N hari" | Tidak menggantikan **Autoclass** jika Anda ingin transisi berbasis pola **access** |
| Irreversibility (via Lifecycle) | Rule hanya "turun" tier; naik tier otomatis via Lifecycle tidak didukung seperti **Autoclass** | Salah kondisi bisa memindahkan data terlalu cepat ke class yang lambat |

### Opsi 2: Delete object (Delete)

Di **API** / **JSON**: `Delete`.

| Aspek | Kelebihan | Kekurangan |
|--------|-----------|------------|
| Cleanup | Otomatis menghapus **backup** lama, **logs**, **temporary files** | Penghapusan permanen (perlu **Object Versioning** + rule terpisah jika Anda mengandalkan versi) |
| Compliance | Membantu retensi "data tidak boleh lebih dari X hari" | Salah **prefix** / kondisi bisa menghapus data produksi |
| Biaya | Mengurangi storage yang tidak terpakai | Tidak ada "undo" dari Lifecycle; recovery hanya lewat **backup** / **versioning** jika ada |

---

## Conditions di Console: dropdown & field

**Console path:** `Lifecycle` → **Add a rule** → bagian **Conditions** (nama pasti bisa bervariasi: **Condition**, **Apply rule to objects that match**, dll.)

Berikut mapping umum **Console** ↔ konsep **JSON** beserta **kelebihan** dan **kekurangan** memakai opsi tersebut.

### Age (days) — `age`

| Kelebihan | Kekurangan |
|-----------|------------|
| Mudah dipahami: "hapus/pindahkan setelah N hari sejak dibuat" | Tidak membedakan objek yang masih sering diakses vs tidak (beda dengan **Autoclass**) |
| Cocok untuk **retention** sederhana | Perubahan kebutuhan bisnis memerlukan edit rule di **Console** |

### Created before — `createdBefore`

| Kelebihan | Kekurangan |
|-----------|------------|
| Berguna untuk **one-time cleanup** (misalnya hapus semua objek lebih tua dari tanggal migrasi) | Kurang ideal sebagai kebijakan jangka panjang berulang (lebih statis) |
| Eksplisit per tanggal | Perlu update manual rule jika Anda ingin "jendela" baru |

### Storage class matches — `matchesStorageClass`

| Kelebihan | Kekurangan |
|-----------|------------|
| Mencegah **transition** ganda yang tidak perlu; rule hanya jalan untuk objek di class tertentu | Harus konsisten dengan **storage class** yang dipakai aplikasi |
| Membantu rantai Standard → Nearline → Coldline → Archive | Salah urutan rule bisa membuat objek "terjebak" di class yang salah |

### Matches prefix / Matches suffix — `matchesPrefix` / `matchesSuffix`

| Kelebihan | Kekurangan |
|-----------|------------|
| Membatasi rule ke folder logis (`backup/`, `tmp/`) | Typo di **prefix** berarti rule tidak jalan atau mengenai path salah |
| Satu bucket bisa punya kebijakan berbeda per "folder" | Banyak prefix memerlukan banyak rule (manajemen di **Console** bisa panjang) |

### Number of newer versions / Days since noncurrent (versioned bucket) — `numNewerVersions`, `isLive`, dll.

**Console path (biasanya):** kondisi terkait **noncurrent versions** / **newer versions** saat **Object Versioning** aktif.

| Kelebihan | Kekurangan |
|-----------|------------|
| Menghemat biaya dengan menghapus versi lawas | Perlu paham model **versioning** |
| Tetap mempertahankan beberapa versi terbaru | Konfigurasi salah bisa menghapus versi yang masih dibutuhkan untuk **audit** |

---

## Lifecycle Actions (ringkas)

### 1. SetStorageClass (pindah class)

Pindahkan objek ke **storage class** yang lebih murah setelah X hari.

```
Objek umur 30 hari  ──► pindah ke Nearline
Objek umur 90 hari  ──► pindah ke Coldline
Objek umur 365 hari ──► pindah ke Archive
```

**Console:** **Action** = **Set storage class** → pilih class di dropdown.

### 2. Delete (hapus objek)

Hapus objek otomatis setelah X hari.

```
Backup harian umur > 30 hari   ──► hapus
Log files umur > 90 hari       ──► hapus
Temporary files umur > 7 hari  ──► hapus
```

**Console:** **Action** = **Delete object**.

---

## Lifecycle Conditions (tabel referensi)

| Condition (API / JSON) | Di Console (biasanya) | Keterangan singkat |
|------------------------|------------------------|-------------------|
| `age` | **Age (days)** | Umur objek dalam hari sejak dibuat |
| `createdBefore` | **Created before** (date) | Objek dibuat sebelum tanggal tertentu |
| `numNewerVersions` | **Number of newer versions** (versioned) | Jumlah versi lebih baru |
| `isLive` | Terkait versi **live** / **noncurrent** | Versi terbaru vs bukan |
| `matchesStorageClass` | **Storage class matches** | Hanya untuk class tertentu |
| `matchesPrefix` | **Matches prefix** | Hanya objek dengan prefix tertentu |
| `matchesSuffix` | **Matches suffix** | Hanya objek dengan suffix tertentu |

---

## Contoh Rules (JSON)

Contoh berikut tetap valid untuk **API**, **gcloud**, atau saat Anda memverifikasi perilaku setelah set equivalent di **Console**.

### Contoh 1: Auto-delete backup lama

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 90,
          "matchesPrefix": ["backup/daily/"]
        }
      }
    ]
  }
}
```

Artinya: hapus semua file di `backup/daily/` yang umurnya lebih dari 90 hari.

**Ekuivalen di Console:** **Add a rule** → **Delete object** → **Conditions:** **Age** = 90, **Matches prefix** = `backup/daily/`.

### Contoh 2: Auto-transition class

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {"age": 30, "matchesStorageClass": ["STANDARD"]}
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "COLDLINE"},
        "condition": {"age": 90, "matchesStorageClass": ["NEARLINE"]}
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "ARCHIVE"},
        "condition": {"age": 365, "matchesStorageClass": ["COLDLINE"]}
      }
    ]
  }
}
```

Artinya: Standard → Nearline (30 hari) → Coldline (90 hari) → Archive (365 hari).

**Ekuivalen di Console:** tiga **rules** terpisah, masing-masing **Set storage class** + **Age** + **Storage class matches** sesuai rantai di atas.

### Contoh 3: Cleanup old versions

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"numNewerVersions": 3, "isLive": false}
      }
    ]
  }
}
```

Artinya: kalau ada lebih dari 3 versi baru, hapus versi lama.

**Ekuivalen di Console:** **Delete object** + kondisi **noncurrent** / **newer versions** (pastikan **Object Versioning** aktif di bucket).

---

## Flow Lifecycle Management

```
Objek masuk ke bucket
        │
        ▼
╔═══════════════════════╗
║  Lifecycle Engine     ║
║  (cek rules tiap     ║
║   hari otomatis)      ║
╚═══════╤═══════════════╝
        │
        ├── Umur > 30 hari?  ──► SetStorageClass: NEARLINE
        ├── Umur > 90 hari?  ──► SetStorageClass: COLDLINE
        ├── Umur > 365 hari? ──► SetStorageClass: ARCHIVE
        ├── Umur > 90 hari + prefix "backup/daily/"? ──► DELETE
        └── Ada > 3 versi baru? ──► DELETE versi lama
```

---

## Console vs baris perintah (opsional)

Jika Anda lebih nyaman **Infrastructure as Code**, lifecycle yang sama bisa di-apply lewat **gcloud** atau **Terraform**. Di **Console**, hasil akhirnya adalah **lifecycle configuration** yang sama di bucket.

```bash
# Set lifecycle rules dari file JSON
gcloud storage buckets update gs://BUCKET_NAME \
    --lifecycle-file=lifecycle.json

# Lihat lifecycle rules yang aktif
gcloud storage buckets describe gs://BUCKET_NAME \
    --format="yaml(lifecycle)"

# Hapus semua lifecycle rules
gcloud storage buckets update gs://BUCKET_NAME \
    --clear-lifecycle
```

**Verifikasi setelah edit di Console:** jalankan perintah **describe** di atas — output **YAML** harus selaras dengan apa yang Anda lihat di tab **Lifecycle**.

---

## Kapan Pakai Lifecycle vs Autoclass?

```
Mau otomatis pindah class berdasarkan akses?  ──► Autoclass
Mau otomatis HAPUS objek lama?                 ──► Lifecycle
Mau pindah class berdasarkan UMUR (bukan akses)? ──► Lifecycle
Mau keduanya?                                  ──► Pakai dua-duanya
```

**Console:** **Autoclass** di pengaturan bucket; **Lifecycle** di tab **Lifecycle** seperti pada **Console path** di awal dokumen.
