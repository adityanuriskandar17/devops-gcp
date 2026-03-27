# Commands Cheatsheet (Console + CLI)

Mapping antara aksi di **GCP Console** dan perintah **`gcloud storage`** / **`gsutil`**. Setiap aksi menunjukkan cara di **Console** dan **CLI**.

> **Note:** `gcloud storage` adalah pengganti modern dari `gsutil`. Keduanya bisa dipakai; untuk pekerjaan baru, **`gcloud storage`** lebih direkomendasikan.

---

## Bucket operations

### List buckets

| | Cara |
|-|------|
| **Console** | **Cloud Storage** → **Buckets** (tabel semua bucket di project) |
| **CLI** | `gcloud storage ls` |

```bash
gcloud storage ls
```

### Create bucket

| | Cara |
|-|------|
| **Console** | **Cloud Storage** → **Buckets** → **Create** → isi nama, **Location type**, **Location**, **Default storage class**, opsi **Autoclass** → **Create** |
| **CLI** | `gcloud storage buckets create gs://BUCKET_NAME --location=REGION` |

```bash
gcloud storage buckets create gs://BUCKET_NAME \
    --location=asia-southeast2

gcloud storage buckets create gs://BUCKET_NAME \
    --location=asia-southeast2 \
    --enable-autoclass
```

### Describe bucket (detail konfigurasi)

| | Cara |
|-|------|
| **Console** | **Buckets** → klik nama **bucket** → tab **Configuration** / **Overview** |
| **CLI** | `gcloud storage buckets describe gs://BUCKET_NAME` |

```bash
gcloud storage buckets describe gs://BUCKET_NAME
gcloud storage buckets describe gs://BUCKET_NAME --format=json
```

### Delete bucket (kosongkan dulu)

| | Cara |
|-|------|
| **Console** | **Buckets** → centang bucket → **Delete** (bucket harus kosong) |
| **CLI** | `gcloud storage rm --recursive gs://BUCKET_NAME` |

```bash
gcloud storage rm --recursive gs://BUCKET_NAME
```

---

## Upload & download

### Upload satu file

| | Cara |
|-|------|
| **Console** | **Buckets** → klik **bucket** → **Objects** → **Upload files** → pilih file |
| **CLI** | `gcloud storage cp LOCAL gs://BUCKET/PREFIX/` |

```bash
gcloud storage cp file.jpg gs://BUCKET_NAME/
gcloud storage cp file.jpg gs://BUCKET_NAME/images/
```

### Upload folder (rekursif)

| | Cara |
|-|------|
| **Console** | **Objects** → **Upload folder** (jika tersedia) atau upload banyak file; untuk skala besar gunakan **CLI** / **Transfer** |
| **CLI** | `gcloud storage cp -r LOCAL/ gs://BUCKET/PREFIX/` |

```bash
gcloud storage cp -r ./local-folder/ gs://BUCKET_NAME/remote-folder/
```

### Download satu file / folder

| | Cara |
|-|------|
| **Console** | **Objects** → klik objek → **Download** |
| **CLI** | `gcloud storage cp gs://BUCKET/OBJECT ./` |

```bash
gcloud storage cp gs://BUCKET_NAME/file.jpg ./
gcloud storage cp -r gs://BUCKET_NAME/images/ ./local-folder/
```

### Sync (mirror perubahan)

| | Cara |
|-|------|
| **Console** | Tidak ada setara penuh; gunakan **Transfer Service** untuk migrasi besar |
| **CLI** | `gcloud storage rsync` |

```bash
gcloud storage rsync ./local-folder/ gs://BUCKET_NAME/remote-folder/ \
    --recursive

gcloud storage rsync gs://BUCKET_NAME/remote-folder/ ./local-folder/ \
    --recursive
```

---

## List & info

### List objects di bucket

| | Cara |
|-|------|
| **Console** | **Buckets** → klik **bucket** → **Objects** (navigasi prefix seperti folder) |
| **CLI** | `gcloud storage ls gs://BUCKET/` |

```bash
gcloud storage ls gs://BUCKET_NAME/
gcloud storage ls --recursive gs://BUCKET_NAME/
gcloud storage ls -l gs://BUCKET_NAME/
```

### Object metadata

| | Cara |
|-|------|
| **Console** | **Objects** → klik objek → panel **Details** |
| **CLI** | `gcloud storage objects describe gs://BUCKET/OBJECT` |

```bash
gcloud storage objects describe gs://BUCKET_NAME/file.jpg
```

### Ukuran bucket / penggunaan

| | Cara |
|-|------|
| **Console** | **Buckets** → klik **bucket** → lihat **Monitoring** / metrik di halaman bucket |
| **CLI** | `gcloud storage du` |

```bash
gcloud storage du -s gs://BUCKET_NAME
gcloud storage du gs://BUCKET_NAME/images/
gcloud storage ls --long
```

---

## Delete

### Hapus satu objek

| | Cara |
|-|------|
| **Console** | **Objects** → centang objek → **Delete** |
| **CLI** | `gcloud storage rm gs://BUCKET/OBJECT` |

```bash
gcloud storage rm gs://BUCKET_NAME/file.jpg
```

### Hapus banyak objek / prefix

| | Cara |
|-|------|
| **Console** | **Objects** → pilih banyak objek → **Delete** |
| **CLI** | `gcloud storage rm` dengan wildcard |

```bash
gcloud storage rm gs://BUCKET_NAME/old-folder/**
```

---

## Access control

### Lihat IAM policy bucket

| | Cara |
|-|------|
| **Console** | **Buckets** → klik **bucket** → tab **Permissions** |
| **CLI** | `gcloud storage buckets get-iam-policy` |

```bash
gcloud storage buckets get-iam-policy gs://BUCKET_NAME
```

### Tambah binding IAM (misalnya service account read)

| | Cara |
|-|------|
| **Console** | Tab **Permissions** → **Grant access** → **Principal** + **Role** (mis. **Storage Object Viewer**) |
| **CLI** | `gcloud storage buckets add-iam-policy-binding` |

```bash
gcloud storage buckets add-iam-policy-binding gs://BUCKET_NAME \
    --member=serviceAccount:SA@PROJECT.iam.gserviceaccount.com \
    --role=roles/storage.objectViewer
```

### Uniform bucket-level access & public access prevention

| | Cara |
|-|------|
| **Console** | **Buckets** → klik **bucket** → tab **Permissions** → **Uniform bucket-level access**; tab **Protection** / **Configuration** untuk **Public access prevention** (sesuai penempatan UI) |
| **CLI** | `gcloud storage buckets update` |

```bash
gcloud storage buckets update gs://BUCKET_NAME \
    --uniform-bucket-level-access

gcloud storage buckets update gs://BUCKET_NAME \
    --public-access-prevention
```

### Signed URL

| | Cara |
|-|------|
| **Console** | Untuk objek tertentu: **Objects** → klik objek → **Generate signed URL** (jika tersedia di project Anda) |
| **CLI** | `gcloud storage sign-url` |

```bash
gcloud storage sign-url gs://BUCKET_NAME/file.pdf \
    --duration=1h \
    --private-key-file=key.json
```

---

## Versioning & soft delete

### Enable / disable object versioning

| | Cara |
|-|------|
| **Console** | **Buckets** → klik **bucket** → tab **Protection** → **Object versioning** |
| **CLI** | `gcloud storage buckets update --versioning` / `--no-versioning` |

```bash
gcloud storage buckets update gs://BUCKET_NAME --versioning
gcloud storage buckets update gs://BUCKET_NAME --no-versioning
```

### List semua versi

| | Cara |
|-|------|
| **Console** | **Objects** → **Show deleted data** / tampilan versi per objek |
| **CLI** | `gcloud storage ls --all-versions` |

```bash
gcloud storage ls --all-versions gs://BUCKET_NAME/file.jpg
```

### Soft delete retention

| | Cara |
|-|------|
| **Console** | **Buckets** → klik **bucket** → tab **Protection** → **Soft delete policy** |
| **CLI** | `gcloud storage buckets update --soft-delete-duration` |

```bash
gcloud storage buckets update gs://BUCKET_NAME --soft-delete-duration=30d
gcloud storage ls --soft-deleted gs://BUCKET_NAME/
gcloud storage restore gs://BUCKET_NAME/file.jpg --generation=GENERATION_NUMBER
```

---

## Lifecycle management

| | Cara |
|-|------|
| **Console** | **Buckets** → klik **bucket** → tab **Lifecycle** → **Add a rule** / edit rules |
| **CLI** | `gcloud storage buckets update --lifecycle-file` |

```bash
gcloud storage buckets update gs://BUCKET_NAME \
    --lifecycle-file=lifecycle.json

gcloud storage buckets describe gs://BUCKET_NAME \
    --format="yaml(lifecycle)"

gcloud storage buckets update gs://BUCKET_NAME --clear-lifecycle
```

---

## Storage class

### Default storage class bucket

| | Cara |
|-|------|
| **Console** | **Buckets** → klik **bucket** → **Configuration** → **Default storage class** |
| **CLI** | `gcloud storage buckets update --default-storage-class` |

```bash
gcloud storage buckets update gs://BUCKET_NAME \
    --default-storage-class=NEARLINE
```

### Ubah class per objek

| | Cara |
|-|------|
| **Console** | **Objects** → klik objek → **Edit** / ubah **Storage class** (jika UI menyediakan) |
| **CLI** | `gcloud storage objects update --storage-class` |

```bash
gcloud storage objects update gs://BUCKET_NAME/file.jpg \
    --storage-class=COLDLINE
```

### Autoclass

| | Cara |
|-|------|
| **Console** | Saat **Create bucket** atau di **Configuration** bucket → aktifkan **Autoclass** |
| **CLI** | `gcloud storage buckets update --enable-autoclass` |

```bash
gcloud storage buckets update gs://BUCKET_NAME --enable-autoclass
```

---

## Transfer & sync

| Aksi | Console | CLI |
|------|---------|-----|
| Sync lokal → bucket | **Transfer** / skrip; mirror penuh via **CLI** | `gcloud storage rsync ./local/ gs://BUCKET/remote/ --recursive` |
| Sync + hapus tujuan yang tidak ada di source | — | `gcloud storage rsync ... --delete-unmatched-destination-objects` |
| Copy antar bucket | **Objects** → copy antar bucket di UI atau **Transfer** | `gcloud storage cp -r gs://A/** gs://B/` |
| Move / rename objek | **Objects** → **Rename** / pindahkan | `gcloud storage mv gs://BUCKET/old gs://BUCKET/new` |

```bash
gcloud storage rsync ./local/ gs://BUCKET_NAME/remote/ \
    --recursive \
    --delete-unmatched-destination-objects

gcloud storage cp -r gs://BUCKET_A/** gs://BUCKET_B/
gcloud storage mv gs://BUCKET/old-name.jpg gs://BUCKET/new-name.jpg
gcloud storage mv gs://BUCKET_A/file.jpg gs://BUCKET_B/file.jpg
```

---

## Monitoring & debug (CLI)

| | Cara |
|-|------|
| **Console** | **Bucket** → tab terkait **monitoring** / **metrics** |
| **CLI** | `describe`, `du`, `ls --long` |

```bash
gcloud storage du -s gs://BUCKET_NAME
gcloud storage buckets describe gs://BUCKET_NAME --format=json
```

---

## Tabel setara: gcloud storage vs gsutil

| gcloud storage | gsutil |
|----------------|--------|
| `gcloud storage cp` | `gsutil cp` |
| `gcloud storage ls` | `gsutil ls` |
| `gcloud storage rm` | `gsutil rm` |
| `gcloud storage rsync` | `gsutil rsync` |
| `gcloud storage mv` | `gsutil mv` |
| `gcloud storage du` | `gsutil du` |
| `gcloud storage buckets create` | `gsutil mb` |
| `gcloud storage buckets describe` | `gsutil ls -L -b` |
