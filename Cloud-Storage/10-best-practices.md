# Best Practices — Cloud Storage (GCP Console)

Rekomendasi mengelola Cloud Storage secara aman, terlindungi, hemat biaya, dan terpantau. Panduan ini mengacu ke **GCP Console**; istilah teknis (misalnya *Uniform bucket-level access*, *CMEK*) tetap dalam bahasa Inggris seperti di produk Google Cloud.

---

## Konvensi penamaan (singkat)

| Sumber | Pola |
|--------|------|
| **Bucket** | `{project}-{type}-{env}` — contoh: `ftlgym-images-prod` |
| **Prefix folder** | Pisahkan *user uploads*, *assets*, *temp*; *temp* cocok dibersihkan lewat *Lifecycle* |

---

## 1. Security

### Access control: Uniform vs Fine-grained

- **Console:** `Buckets` → `Create` → bagian **Access control** (saat membuat bucket), atau bucket yang sudah ada: `Buckets` → pilih bucket → **Permissions** / pengaturan akses terkait.
- **Rekomendasi:** aktifkan **Uniform bucket-level access**. Akses lewat **IAM** di level bucket lebih mudah diaudit daripada **ACL** per objek (*Fine-grained*).
- **Catatan:** mengubah dari *Fine-grained* ke *Uniform* bisa mengunci perilaku ACL lama; rencanakan sebelum production.

### Public Access Prevention

- **Console:** `Buckets` → pilih bucket → **Permissions** → **Public access** (atau setara “Block public access” / *Public access prevention*).
- **Rekomendasi:** aktifkan untuk bucket internal. Jangan mengandalkan bucket publik untuk distribusi file; pertimbangkan **Signed URL** atau layanan di depan bucket.

### Service Account dan least privilege

- Buat **Service Account** khusus per aplikasi; beri role minimal (misalnya `roles/storage.objectViewer` hanya jika perlu baca).
- Pengaturan binding **IAM** dilakukan di **Console:** `Buckets` → bucket → **Permissions** → **Grant access**.

### Encryption (CMEK)

- **Default:** data tetap terenkripsi *at rest* dengan enkripsi yang dikelola Google; tidak wajib konfigurasi tambahan.
- **Customer-Managed Encryption Keys (CMEK):** jika compliance memerlukan kunci Anda sendiri:
  - **Console:** `Buckets` → `Create` → **Advanced** → **Encryption** → pilih **Customer-managed key** dan Cloud KMS key yang sesuai.
- **Kapan CMEK:** requirement compliance (misalnya SOC2, HIPAA, ISO 27001), kontrol rotasi kunci, atau kebutuhan *revoke* akses ke data lewat kunci.

---

## 2. Data Protection

### Versioning

- **Console:** `Buckets` → pilih bucket → tab **Protection** → **Object versioning**.
- **Manfaat:** pemulihan dari *overwrite* atau *delete* tidak sengaja; kombinasikan dengan *Lifecycle* agar versi lama tidak menumpuk biaya.

### Soft Delete

- **Console:** `Buckets` → pilih bucket → tab **Protection** → **Soft delete** (*retention period* untuk objek yang terhapus).
- **Rekomendasi:** sesuaikan durasi dengan kebutuhan recovery (produksi vs backup vs *temp*).

### Lifecycle rules

- **Console:** `Buckets` → pilih bucket → tab **Lifecycle**.
- **Contoh kebijakan:** hapus objek *backup* harian > 30 hari; hapus *temp* > 7 hari; transisi ke storage class lebih murah atau hapus *noncurrent versions* jika *versioning* aktif.

### Matriks singkat (referensi)

| Tipe bucket | Versioning | Soft delete | Lifecycle |
|-------------|------------|-------------|-----------|
| Production | Ya | Sesuai RTO/RPO | Batasi versi / umur objek |
| Backup | Ya | Lebih panjang jika perlu | Hapus setelah retensi |
| Temp / cache | Tidak | Off | Hapus otomatis singkat |
| Compliance / arsip | Ya | Panjang | Jangan hapus sembarangan |

---

## 3. Cost Optimization

### Autoclass

- **Console:** `Buckets` → pilih bucket → **Configuration** → **Autoclass**.
- **Manfaat:** Google mengelola perpindahan *storage class* otomatis sesuai pola akses, mengurangi pekerjaan manual.

### Lifecycle (biaya)

- **Console:** `Buckets` → pilih bucket → **Lifecycle** (sama seperti *Data Protection* — satu fitur, dua tujuan: retensi vs efisiensi biaya).
- Gunakan untuk menghapus atau mengubah class objek/usia versi agar biaya tidak membengkak.

### Billing reports

- **Console:** `Billing` → **Reports**.
- Saring atau kelompokkan layanan **Cloud Storage**, per *project* atau *label*, untuk melihat tren dan anomali pengeluaran.

### Praktik tambahan

- **Location:** *Regional* jika akses terkonsentrasi satu wilayah; *Multi-region* biasanya lebih mahal.
- **Cloud CDN** di depan bucket dapat membantu mengurangi egress langsung ke *origin* (sesuaikan dengan arsitektur Anda).

---

## 4. Monitoring

### Bucket monitoring (metrik dasar)

- **Console:** `Buckets` → pilih bucket — ringkasan bucket menampilkan indikator seperti **ukuran** (*size*) dan **jumlah objek** (*object count*) (posisi pasti mengikuti UI terbaru; biasanya di halaman detail bucket atau tab **Monitoring**).
- Gunakan angka ini untuk baseline pertumbuhan dan deteksi dini pemakaian tidak normal.

### Cloud Monitoring

- **Console:** `Monitoring` → **Dashboards** — buat atau gunakan *dashboard* yang memuat metrik **Cloud Storage** (request, error, byte, dll.).
- **Alerting:** set *alert* untuk lonjakan **bucket size**, **request count**, atau **error rate** (4xx/5xx) sesuai SLA tim Anda.

### Cloud Audit Logs

- Aktifkan/ manfaatkan **Cloud Audit Logs** untuk jejak siapa mengubah konfigurasi bucket atau mengakses data (sesuai kebijakan organisasi). Tinjau lewat **Logging** di Console atau export ke *sink* yang Anda pakai.

---

## 5. Checklist — bucket baru (semua dari Console)

Centang setiap poin saat **Create bucket** atau segera setelah bucket dibuat:

- [ ] **Location** dan **location type** (regional / dual-region / multi-region) sesuai latensi dan compliance.
- [ ] **Storage class** atau aktifkan **Autoclass** (`Buckets` → bucket → **Configuration** → **Autoclass**).
- [ ] **Access control:** **Uniform bucket-level access** (`Buckets` → `Create` → **Access control**).
- [ ] **Public access:** **Public Access Prevention** sesuai kebutuhan (`Buckets` → bucket → **Permissions** → **Public access**).
- [ ] **Encryption:** default Google-managed atau **CMEK** (`Buckets` → `Create` → **Advanced** → **Encryption**).
- [ ] **Versioning** (`Buckets` → bucket → **Protection**).
- [ ] **Soft delete** — durasi retention (`Buckets` → bucket → **Protection**).
- [ ] **Lifecycle rules** (`Buckets` → bucket → **Lifecycle**).
- [ ] **IAM** — hanya **Service Account** / principal yang perlu, role minimal (`Buckets` → bucket → **Permissions**).
- [ ] **Monitoring** — *dashboard* dan *alert* di **Cloud Monitoring** (`Monitoring` → **Dashboards**).
- [ ] **Billing** — pastikan *project* terhubung ke *billing account*; tinjau **Reports** (`Billing` → **Reports**).
- [ ] Dokumentasikan nama bucket, tujuan, dan pemilik di catatan tim.

---

*UI GCP Console dapat diperbarui oleh Google; jika label tab sedikit berbeda, gunakan pencarian di bar atas Console dengan kata kunci seperti “lifecycle”, “soft delete”, atau “public access”.*
