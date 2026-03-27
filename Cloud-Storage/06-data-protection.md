
![image.png](/images/Cloud-Storage/1774515779465-image.png)

# Data Protection: Versioning, Soft Delete & Retention

Proteksi data dari **penghapusan tidak sengaja**, kemampuan **rollback** ke versi sebelumnya, dan **compliance lock** agar data tidak bisa dihapus/diubah. Dokumen ini berorientasi pada **GCP Console**; perintah **CLI** disertakan sebagai referensi singkat.

---

## Console: "Choose how to protect object data" (saat Create Bucket)

**Console path:** `Cloud Storage` → **Buckets** → **Create** → langkah **Choose how to protect object data**

Saat membuat bucket baru, GCP Console menampilkan section **"Choose how to protect object data"** dengan sub-bagian **Data protection** yang berisi 3 checkbox:

| Checkbox di Console | Fungsi |
|---------------------|--------|
| **Soft delete policy (For data recovery)** | Objek yang dihapus masih bisa di-restore selama retention duration |
| **Object versioning (For version control)** | Setiap overwrite/delete menyimpan versi lama sebagai noncurrent |
| **Retention (For compliance)** | Mencegah penghapusan dan modifikasi objek selama periode tertentu (Bucket Lock) |

### Soft delete policy — pilihan saat Create Bucket

Jika checkbox **Soft delete policy** dicentang, muncul 2 radio button:

| Opsi di Console | Deskripsi |
|-----------------|-----------|
| **Use default retention duration** | Semua bucket memiliki **soft delete 7 hari** secara default (kecuali diubah oleh organization administrator) |
| **Set custom retention duration** | Tentukan sendiri berapa lama objek yang dihapus disimpan sebelum benar-benar hilang. Set "0" berarti soft delete dinonaktifkan — objek yang dihapus langsung hilang permanen |

#### Use default retention duration — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Tidak perlu konfigurasi manual — langsung aktif 7 hari | Mungkin terlalu singkat untuk data kritikal (7 hari saja) |
| Konsisten di seluruh organisasi jika admin sudah set default | Tidak bisa recover jika baru sadar setelah 7 hari |
| Cocok untuk kebanyakan use case standar | Biaya soft-deleted storage tetap dihitung selama retention |

#### Set custom retention duration — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Fleksibel: bisa set 1 hari sampai 90 hari sesuai kebutuhan | Perlu pertimbangan matang — terlalu lama = biaya storage naik |
| Bisa set 0 untuk bucket temporary agar tidak ada biaya soft-delete | Set 0 berarti **tidak ada jaring pengaman** — delete = hilang permanen |
| Cocok untuk bucket dengan kebutuhan recovery yang berbeda-beda | Harus dikelola per bucket, tidak otomatis ikut policy organisasi |

### Object versioning — pilihan saat Create Bucket

Checkbox **Object versioning (For version control)**:
- **Dicentang**: setiap overwrite atau delete menyimpan versi lama
- **Tidak dicentang**: hanya versi terbaru yang disimpan, overwrite menghilangkan data lama

*(Detail lengkap di section Object Versioning di bawah)*

### Retention — pilihan saat Create Bucket

Checkbox **Retention (For compliance)**:
- **Dicentang**: bucket menerapkan **Retention policy** — objek tidak bisa dihapus atau diubah selama retention period
- **Tidak dicentang**: tidak ada pembatasan compliance

*(Detail lengkap di section Retention Policy di bawah)*

---

## Lokasi pengaturan pada bucket yang sudah ada

**Console:** **Cloud Storage** → **Buckets** → klik nama **bucket** → tab **Protection**

Di tab **Protection** Anda mengatur:

- **Soft delete policy** (retention duration)
- **Object versioning** (toggle ON/OFF)
- **Retention policy** (duration + lock)

---

## Object Versioning

Saat **Object versioning** aktif, setiap kali objek di-**overwrite** atau dihapus, **Cloud Storage** menyimpan **versi lama** sebagai **noncurrent version**.

### Cara kerja (alur)

```
Upload file.jpg (v1)
        │
        ▼
Upload file.jpg (v2)   ──► v1 jadi "noncurrent" (tersimpan)
        │
        ▼
Upload file.jpg (v3)   ──► v2 noncurrent, v1 tetap tersimpan
        │
        ▼
Hapus file.jpg          ──► v3 noncurrent
                            file.jpg terlihat "terhapus"
                            semua versi tetap ada di bucket
```

### Object versioning di Console (toggle ON/OFF)

| | Cara |
|-|------|
| **Console** | **Cloud Storage** → **Buckets** → klik **bucket** → tab **Protection** → **Object versioning** → aktifkan atau nonaktifkan toggle |
| **CLI** | `gcloud storage buckets update gs://BUCKET_NAME --versioning` / `--no-versioning` |

**Kelebihan Object versioning ON**

- Bisa **rollback** setelah **overwrite** (bukan hanya setelah delete).
- Riwayat versi jelas per **generation**.
- Cocok untuk **audit** dan data yang sering berubah.

**Kekurangan Object versioning ON**

- **Storage cost** naik karena versi lama ikut terhitung.
- Perlu **lifecycle rules** atau kebijakan pembersihan agar tidak menumpuk tanpa batas.

**Kelebihan Object versioning OFF**

- Biaya **storage** lebih mudah diprediksi (tidak ada versi noncurrent tambahan).
- Konfigurasi lebih sederhana untuk bucket **temporary** atau **cache**.

**Kekurangan Object versioning OFF**

- Tidak ada cadangan otomatis dari isi file sebelum **overwrite**.
- Pemulihan bergantung pada fitur lain (misalnya **Soft delete** hanya untuk objek yang dihapus, bukan untuk overwrite).

### Melihat versi objek di Console

**Console:** **Cloud Storage** → **Buckets** → klik **bucket** → **Objects** → aktifkan toggle **Show deleted data** (dan untuk melihat versi noncurrent, gunakan opsi tampilan versi sesuai UI—objek dengan beberapa **generation** akan terlihat di daftar atau detail objek).

Untuk daftar lengkap via **CLI**:

```bash
gcloud storage ls --all-versions gs://BUCKET_NAME/PATH/file.jpg
```

### Restore versi via Console

1. Buka **Cloud Storage** → **Buckets** → klik **bucket** → **Objects**.
2. Pastikan **Show deleted data** aktif jika objek terlihat terhapus.
3. Klik nama objek → di panel detail, buka bagian **Versions** / daftar **generation** (jika **Object versioning** aktif).
4. Pilih versi yang ingin dijadikan **current**: gunakan aksi seperti **Promote** (jika ada), atau **Download** lalu **Upload** ulang dengan nama sama, atau **Copy** ke URI yang sama—sesuai opsi yang ditampilkan Console saat ini.
5. Tujuan akhir: objek **live** memakai isi dari **generation** yang Anda pilih.

**Alternatif CLI** (salin generation lama menjadi versi baru/current):

```bash
gcloud storage cp \
    gs://BUCKET_NAME/file.jpg#GENERATION_NUMBER \
    gs://BUCKET_NAME/file.jpg
```

### Cleanup versi lama dengan Lifecycle

Versi **noncurrent** tetap memakai **storage** dan kena biaya. Atur **lifecycle** di tab **Lifecycle** bucket atau lewat **CLI**:

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "numNewerVersions": 3,
          "isLive": false
        }
      }
    ]
  }
}
```

Artinya: simpan maksimal 3 versi terakhir untuk objek noncurrent, hapus yang lebih lama.

**Console (umum):** **Buckets** → klik **bucket** → tab **Lifecycle** → tambah **rule** sesuai kebutuhan.

---

## Soft Delete

**Soft delete** memberi **recovery window**: setelah objek dihapus, objek masih bisa di-**restore** selama **retention duration** berlaku.

### Soft delete policy di Console (bucket yang sudah ada)

| | Cara |
|-|------|
| **Console** | **Cloud Storage** → **Buckets** → klik **bucket** → tab **Protection** → **Soft delete policy** → **Edit** → pilih **Use default retention duration** atau **Set custom retention duration** |
| **CLI** | `gcloud storage buckets update gs://BUCKET_NAME --soft-delete-duration=30d` |

### Pilihan retention duration

| Opsi | Nilai | Kapan pakai |
|------|-------|-------------|
| **Use default retention duration** | 7 hari (default GCP) | Bucket standar yang tidak punya kebutuhan khusus |
| **Set custom retention duration** | 1–90 hari | Data penting yang butuh window recovery lebih lama |
| **Set custom = 0** | 0 (nonaktif) | Bucket temporary / cache — **hati-hati, tidak ada recovery** |

### Cara kerja Soft Delete

```
Objek dihapus oleh user
        │
        ▼
Status: "soft-deleted"
(tidak terlihat di listing normal)
        │
        ├── Dalam retention period ──► Bisa di-RESTORE
        │
        └── Setelah retention habis ──► Dihapus permanen
                                        (tidak bisa recover)
```

### Biaya Soft Delete

- Objek **soft-deleted** tetap menempati **storage** dan **dikenakan biaya** selama retention period
- Biaya dihitung dengan **rate storage class** yang sama dengan objek aslinya
- Semakin lama retention → semakin tinggi potensi biaya soft-delete storage

### Menonaktifkan Soft Delete (hati-hati)

```bash
gcloud storage buckets update gs://BUCKET_NAME --soft-delete-duration=0
```

Cek konfigurasi saat ini:

```bash
gcloud storage buckets describe gs://BUCKET_NAME \
    --format="get(softDeletePolicy)"
```

### Restore objek soft-deleted via Console

1. **Cloud Storage** → **Buckets** → klik **bucket** → **Objects**.
2. Aktifkan **Show deleted data**.
3. Pilih objek yang statusnya **soft-deleted** → gunakan aksi **Restore** (atau setara di menu tiga titik).

**CLI:**

```bash
gcloud storage ls --soft-deleted gs://BUCKET_NAME/
gcloud storage restore gs://BUCKET_NAME/file.jpg --generation=GENERATION_NUMBER
```

---

## Retention Policy (For Compliance)

**Retention policy** mencegah objek dalam bucket dihapus atau di-**overwrite** selama **retention period** yang ditentukan. Fitur ini ditujukan untuk kepatuhan (**compliance**) terhadap regulasi seperti penyimpanan data keuangan, log audit, rekam medis, dll.

### Console: Retention saat Create Bucket

**Console path:** `Cloud Storage` → **Buckets** → **Create** → **Choose how to protect object data** → centang **Retention (For compliance)**

Saat dicentang, muncul input untuk menentukan **retention period** (dalam hari, bulan, atau tahun).

### Console: Retention pada bucket yang sudah ada

**Console path:** `Cloud Storage` → **Buckets** → klik **bucket** → tab **Protection** → bagian **Retention policy** → **Set retention policy** / **Edit**

### Cara kerja Retention

```
Objek di-upload ke bucket dengan retention policy 365 hari
        │
        ▼
Objek tidak bisa dihapus / diubah selama 365 hari
        │
        ├── Coba delete? ──► ERROR: Object is under retention
        ├── Coba overwrite? ──► ERROR: Object is under retention
        │
        └── Setelah 365 hari ──► Objek bisa dihapus/diubah normal
```

### Retention Policy — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Memenuhi **compliance** (regulasi keuangan, kesehatan, legal) | Objek **tidak bisa dihapus** bahkan oleh admin selama retention period |
| Melindungi dari penghapusan sengaja maupun tidak sengaja | Salah set retention terlalu lama = storage cost yang tidak bisa dikurangi |
| Bisa dikombinasikan dengan **Bucket Lock** untuk **immutability** permanen | Bucket Lock bersifat **irreversible** — sekali di-lock, tidak bisa diubah atau dihapus |
| Audit-friendly: bukti bahwa data tidak dimodifikasi | Tidak cocok untuk bucket yang butuh update/delete rutin |

### Bucket Lock

**Bucket Lock** mengunci **retention policy** secara permanen — setelah di-lock:
- Retention period **tidak bisa dikurangi** (hanya bisa ditambah)
- Policy **tidak bisa dihapus**
- **Bucket tidak bisa dihapus** sampai semua objek melewati retention period

| | Cara |
|-|------|
| **Console** | **Buckets** → klik **bucket** → tab **Protection** → **Retention policy** → **Lock** (akan muncul konfirmasi peringatan) |
| **CLI** | `gcloud storage buckets update gs://BUCKET_NAME --lock-retention-period` |

**Peringatan:** Bucket Lock bersifat **IRREVERSIBLE**. Setelah di-lock, tidak ada cara untuk membatalkannya. Pastikan retention period sudah benar sebelum mengunci.

### Set retention policy via CLI

```bash
# Set retention 365 hari
gcloud storage buckets update gs://BUCKET_NAME \
    --retention-period=365d

# Hapus retention policy (hanya jika BELUM di-lock)
gcloud storage buckets update gs://BUCKET_NAME \
    --clear-retention-period

# Lock retention (IRREVERSIBLE!)
gcloud storage buckets update gs://BUCKET_NAME \
    --lock-retention-period

# Cek status retention
gcloud storage buckets describe gs://BUCKET_NAME \
    --format="get(retentionPolicy)"
```

### Kapan pakai Retention Policy?

```
Data keuangan yang harus disimpan minimal 7 tahun?
  ──► Retention 2555d + Bucket Lock

Log audit yang harus tersedia 1 tahun?
  ──► Retention 365d (lock opsional)

Backup database harian?
  ──► JANGAN pakai Retention — gunakan Soft Delete + Versioning saja
      (backup perlu bisa di-rotate/hapus)

Bucket development / staging?
  ──► JANGAN pakai Retention — terlalu membatasi
```

---

## Perbandingan: Versioning vs Soft Delete vs Retention

| | **Object Versioning** | **Soft Delete** | **Retention Policy** |
|-|----------------------|-----------------|---------------------|
| **Tujuan** | Rollback ke versi sebelumnya | Recovery objek yang dihapus | Mencegah hapus/ubah (compliance) |
| **Melindungi dari** | Overwrite + Delete | Delete saja | Delete + Overwrite (enforce) |
| **Cara kerja** | Versi lama disimpan sebagai noncurrent | Objek dihapus masuk status soft-deleted | Objek di-lock, tidak bisa diubah/hapus |
| **Durasi** | Sampai di-cleanup manual/lifecycle | 1–90 hari (default 7) | Bebas (hari/bulan/tahun) |
| **Bisa dinonaktifkan?** | Ya, kapan saja | Ya (set 0) | Ya, kecuali sudah **Bucket Lock** |
| **Biaya tambahan** | Versi noncurrent = storage cost | Soft-deleted objects = storage cost | Tidak ada biaya tambahan, tapi objek tidak bisa dihapus |
| **Default** | OFF | ON (7 hari) | OFF |

---

## Kapan pakai apa?

```
Butuh rollback ke versi sebelumnya (overwrite)?
  ──► Object versioning

Butuh proteksi dari penghapusan tidak sengaja?
  ──► Soft delete (minimal)
  ──► Object versioning + Soft delete (lebih aman)

Bucket berisi data kritikal (backup, dokumen)?
  ──► Keduanya aktif + lifecycle cleanup untuk versi lama

Data harus disimpan untuk compliance / regulasi?
  ──► Retention policy + Bucket Lock
  ──► Jangan lupa: Bucket Lock = IRREVERSIBLE

Bucket temporary / cache?
  ──► Biasanya tidak perlu ketiganya
  ──► Soft delete = 0, Versioning = off, Retention = off
```

---

## Rekomendasi ringkas

| Tipe bucket | Object versioning | Soft delete | Retention policy | Lifecycle cleanup |
|-------------|-------------------|-------------|------------------|-------------------|
| Production assets | Ya | 30 hari | Tidak | Simpan 5 versi terakhir |
| Backup | Ya | 7 hari | Tidak | Simpan 3 versi terakhir |
| Temporary / cache | Tidak | 0 (off) | Tidak | Auto-delete umur > 7 hari |
| Arsip compliance | Ya | 90 hari | Ya + Bucket Lock | Jangan hapus (sesuai kebijakan) |
| Log audit | Tidak | 7 hari | Ya (365 hari) | Delete setelah retention habis |
| Data keuangan | Ya | 30 hari | Ya (7 tahun) + Lock | Jangan hapus |

---

## Referensi CLI singkat

### Object Versioning

```bash
gcloud storage buckets update gs://BUCKET_NAME --versioning
gcloud storage buckets update gs://BUCKET_NAME --no-versioning
gcloud storage buckets describe gs://BUCKET_NAME --format="get(versioning)"
```

### Soft Delete

```bash
gcloud storage buckets update gs://BUCKET_NAME --soft-delete-duration=30d
gcloud storage buckets update gs://BUCKET_NAME --soft-delete-duration=0
gcloud storage buckets describe gs://BUCKET_NAME --format="get(softDeletePolicy)"
gcloud storage ls --soft-deleted gs://BUCKET_NAME/
gcloud storage restore gs://BUCKET_NAME/file.jpg --generation=GENERATION_NUMBER
```

### Retention Policy

```bash
gcloud storage buckets update gs://BUCKET_NAME --retention-period=365d
gcloud storage buckets update gs://BUCKET_NAME --clear-retention-period
gcloud storage buckets update gs://BUCKET_NAME --lock-retention-period
gcloud storage buckets describe gs://BUCKET_NAME --format="get(retentionPolicy)"
```
