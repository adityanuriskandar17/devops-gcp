# Create Key Ring & Key — Console Walkthrough

Dokumentasi langkah-langkah membuat **Key Ring** dan **Key** di Google Cloud Console.

**Console:** Security → Key Management → **Create Key Ring** / **Create Key**

**Prasyarat:**
- Cloud KMS API harus **enabled** di project
- Role minimal: **Cloud KMS Admin** (`roles/cloudkms.admin`)

---

## Step 1: Buka Key Management

```
Console → Navigation menu → Security → Key Management

  ATAU langsung: console.cloud.google.com/security/kms
```

### Halaman Key Management (Pertama Kali)

```
┌───────────────────────────────────────────────────────────────────────┐
│  Key Management                                                       │
│                                                                       │
│  ⓘ To use this feature, you need to enable the                       │
│    Cloud KMS API for this project.                                    │
│                                                                       │
│    [ENABLE CLOUD KMS API]                                             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

Jika pertama kali, klik **ENABLE CLOUD KMS API** → tunggu beberapa detik.

### Halaman Key Management (Sudah Aktif)

```
┌───────────────────────────────────────────────────────────────────────┐
│  Key Management                                            [+ CREATE KEY RING] │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  🔍 Filter key rings                                          │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────┬────────────────┬──────────┬─────────────────┐  │
│  │ Name             │ Location       │ Keys     │ Created          │  │
│  ├──────────────────┼────────────────┼──────────┼─────────────────┤  │
│  │ my-key-ring      │ asia-southeast2│ 3 keys   │ Mar 15, 2026    │  │
│  │ global-ring      │ global         │ 1 key    │ Mar 10, 2026    │  │
│  └──────────────────┴────────────────┴──────────┴─────────────────┘  │
│                                                                       │
│  (Jika belum ada key ring):                                           │
│  "No key rings found. Create a key ring to get started."              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Step 2: Create Key Ring

Klik **+ CREATE KEY RING** di kanan atas.

### Console Form: Create Key Ring

```
┌───────────────────────────────────────────────────────────────────────┐
│  Create key ring                                                      │
│                                                                       │
│  Key ring name *                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ my-app-keyring                                               │     │
│  └─────────────────────────────────────────────────────────────┘     │
│  The key ring name can contain letters, numbers, underscores (_),    │
│  and hyphens (-).                                                     │
│                                                                       │
│  Key ring location *                                                  │
│  ┌──────────────────────────────────────────────┐                    │
│  │  Location type:                               │                    │
│  │  ● Region                                     │                    │
│  │  ○ Multi-region                               │                    │
│  │                                               │                    │
│  │  Region:                                      │                    │
│  │  ┌─────────────────────────────────────────┐  │                    │
│  │  │ asia-southeast2 (Jakarta)             ▼ │  │                    │
│  │  └─────────────────────────────────────────┘  │                    │
│  └──────────────────────────────────────────────┘                    │
│                                                                       │
│                              [CREATE]  [CANCEL]                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Penjelasan Field

| Field | Fungsi | Aturan |
|-------|--------|--------|
| **Key ring name** | Nama unik untuk key ring | Huruf, angka, underscore, hyphen. **Tidak bisa diubah atau dihapus** setelah dibuat |
| **Location type** | Region atau Multi-region | Menentukan di mana key material disimpan |
| **Region** | Lokasi spesifik | Muncul saat pilih "Region". Pilih sesuai resource yang akan dienkripsi |

### Naming Convention yang Baik

```
Pattern: {project/app}-{environment}-{purpose}

Contoh:
  myapp-prod-encryption        ← untuk encryption keys production
  myapp-staging-signing        ← untuk signing keys staging
  shared-global-secrets        ← untuk secrets management
  payment-prod-compliance      ← untuk compliance-related keys
```

| Kelebihan Naming yang Baik | Kekurangan Naming Buruk |
|---------------------------|------------------------|
| Mudah identifikasi purpose | Bingung key ring mana untuk apa |
| Auditing jelas | Bisa salah pilih key ring |
| Organisasi rapi | Sulit maintenance jangka panjang |

**Peringatan:** Key Ring **TIDAK BISA DIHAPUS**. Pastikan nama sudah benar sebelum create.

---

## Step 3: Create Key

Setelah Key Ring dibuat, muncul **toast notification** di bawah:

```
┌──────────────────────────────────────────────────────────────────┐
│  Key ring db-password has been created                        ✕  │
└──────────────────────────────────────────────────────────────────┘
```

Console langsung membuka halaman **Create key** di dalam key ring tersebut.

### Console: Halaman Create Key — Layout Lengkap (Stepper)

Console menggunakan **stepper/wizard** — halaman dibagi menjadi **section-section** yang di-expand satu per satu dengan tombol [CONTINUE].

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ← Create key                                                             │
│                                                                           │
│  A cryptographic key is a resource that is used for encrypting and        │
│  decrypting data or for producing and verifying digital signatures.       │
│  A key can have multiple versions.                                        │
│  Learn more ↗                                                             │
│                                                                           │
│  ┌───────────────────────────────────┐    ┌────────────────────────────┐  │
│  │                                   │    │ Key creation details       │  │
│  │  ● Name and protection level      │    │                            │  │
│  │  │                                │    │ Project name  fc-1-434201  │  │
│  │  │  Key name *                    │    │ Location  asia-southeast2  │  │
│  │  │  ┌──────────────────────────┐  │    │ Key ring  db-password      │  │
│  │  │  │ Enter key name           │  │    │                            │  │
│  │  │  └──────────────────────────┘  │    └────────────────────────────┘  │
│  │  │                                │                                    │
│  │  │  Protection Level ⓘ           │                                    │
│  │  │                                │                                    │
│  │  │  ● Software                    │                                    │
│  │  │    Cryptographic operations    │                                    │
│  │  │    are performed on software   │                                    │
│  │  │                                │                                    │
│  │  │  ○ HSM                         │                                    │
│  │  │    Cryptographic operations    │                                    │
│  │  │    are performed on a Hardware │                                    │
│  │  │    Security Module (HSM)       │                                    │
│  │  │                                │                                    │
│  │  │  ○ External                    │                                    │
│  │  │    Cryptographic operations    │                                    │
│  │  │    are performed using a key   │                                    │
│  │  │    stored in an external key   │                                    │
│  │  │    manager. Learn more ↗       │                                    │
│  │  │                                │                                    │
│  │  │  [CONTINUE]                    │                                    │
│  │  │                                │                                    │
│  │  ● Key material                   │                                    │
│  │  │  Key material    Generated     │                                    │
│  │  │                                │                                    │
│  │  ● Purpose and algorithm          │                                    │
│  │  │  Purpose    Symmetric          │                                    │
│  │  │             encrypt/decrypt    │                                    │
│  │  │  Algorithm  Google symmetric   │                                    │
│  │  │             key                │                                    │
│  │  │                                │                                    │
│  │  ● Versions                       │                                    │
│  │  │  Key rotation period  90 days  │                                    │
│  │  │  Starting on          12/6/24  │                                    │
│  │  │                                │                                    │
│  │  ● Additional settings (optional) │                                    │
│  │     Duration of 'scheduled        │                                    │
│  │     destruction' state            │                                    │
│  │     30 days (default)             │                                    │
│  │                                   │                                    │
│  └───────────────────────────────────┘                                    │
│                                                                           │
│  [CREATE]  [CANCEL]                                                       │
└───────────────────────────────────────────────────────────────────────────┘
```

### Penjelasan Layout

| Area | Fungsi |
|------|--------|
| **← Create key** | Back button + judul halaman |
| **Deskripsi di atas** | Penjelasan singkat apa itu cryptographic key |
| **Key creation details** (sidebar kanan) | Menampilkan **Project name**, **Location**, dan **Key ring** tempat key akan dibuat |
| **Stepper (● section-section)** | Wizard dengan expand/collapse — section aktif ditandai **blue dot** dan expanded |
| **[CONTINUE]** | Tombol di setiap section untuk lanjut ke section berikutnya |
| **[CREATE] [CANCEL]** | Tombol di bawah untuk create key atau cancel |

---

### Section 1: Name and Protection Level

Section pertama — **active by default** (expanded, blue dot).

```
  ● Name and protection level                    ← section header (blue dot)
  │
  │  Key name *
  │  ┌──────────────────────────────────────┐
  │  │ Enter key name                        │
  │  └──────────────────────────────────────┘
  │
  │  Protection Level ⓘ
  │
  │  ● Software
  │    Cryptographic operations are performed on software
  │
  │  ○ HSM
  │    Cryptographic operations are performed on a
  │    Hardware Security Module (HSM)
  │
  │  ○ External
  │    Cryptographic operations are performed using a key
  │    stored in an external key manager. Learn more ↗
  │
  │  [CONTINUE]
```

#### Key Name

| Aturan | Detail |
|--------|--------|
| Karakter | Huruf, angka, underscore (`_`), hyphen (`-`) |
| Unik | Harus unik **dalam key ring yang sama** |
| Immutable | Nama **tidak bisa diubah** setelah dibuat |

**Contoh naming:**

```
{service}-{purpose}-{detail}

  disk-encryption-prod          ← encrypt Compute Engine disks
  storage-cmek-media            ← CMEK untuk media bucket
  api-signing-jwt               ← sign JWT tokens
  db-encryption-cloud-sql       ← encrypt Cloud SQL
  backup-encryption-archive     ← encrypt backups
```

#### Protection Level

Di Console terlihat **3 pilihan utama** dengan deskripsi langsung di bawahnya:

| Pilihan | Deskripsi di Console | Arti |
|---------|---------------------|------|
| **● Software** (default) | "Cryptographic operations are performed on software" | Operasi crypto dilakukan di software (BoringCrypto, FIPS 140-2). **Paling murah** ~$0.06/key/bulan |
| **○ HSM** | "Cryptographic operations are performed on a Hardware Security Module (HSM)" | Operasi crypto di hardware fisik (FIPS 140-2 Level 3). ~$1.00/key/bulan |
| **○ External** | "Cryptographic operations are performed using a key stored in an external key manager" | Key material disimpan di **luar Google** (Thales, Fortanix, dll). ~$3.00/key/bulan |

**Catatan:** Pilihan **External via VPC** muncul di beberapa konfigurasi tertentu (region tertentu/enterprise setup). Pada Console default, terlihat 3 pilihan seperti di atas.

| Kelebihan Software | Kekurangan Software |
|--------------------|--------------------|
| Paling murah & cepat | Tidak memenuhi compliance yang mensyaratkan HSM |
| Default — cukup untuk 90% use case | Key material di Google infrastructure |
| Low latency | — |

| Kelebihan HSM | Kekurangan HSM |
|---------------|---------------|
| Hardware-backed, tamper resistant | ~17x lebih mahal dari Software |
| FIPS 140-2 Level 3 certified | Sedikit lebih lambat |
| Wajib untuk PCI-DSS, HIPAA | — |

| Kelebihan External | Kekurangan External |
|--------------------|---------------------|
| Key TIDAK PERNAH di Google | Paling mahal |
| Full control — bisa revoke akses Google | Jika external KM down = data inaccessible |
| Ultimate trust model | Setup & maintenance complex |

**Protection level TIDAK BISA DIUBAH** setelah key dibuat.

Klik **[CONTINUE]** untuk lanjut ke section berikutnya.

---

### Section 2: Key Material

Setelah klik CONTINUE, section ini ter-expand:

```
  ● Key material                                 ← section header
  │
  │  What type of key do you want to create?
  │  ● Generated key
  │  ○ Imported key
  │
  │  [CONTINUE]
```

Setelah selesai dan klik CONTINUE, section ter-collapse menampilkan summary:

```
  ● Key material
  │  Key material    Generated
```

| Tipe | Fungsi | Kapan Digunakan |
|------|--------|----------------|
| **Generated key** (default) | Google KMS generate key material secara aman | **Default — 99% kasus** |
| **Imported key** | Upload key material yang sudah ada dari luar | Migrasi dari on-premise HSM, regulatory requirement |

| Kelebihan Generated | Kekurangan Generated |
|---------------------|----------------------|
| Otomatis & aman | Tidak bisa export key material keluar |
| Tidak perlu manage key material sendiri | Key material sepenuhnya di Google |

| Kelebihan Imported | Kekurangan Imported |
|--------------------|--------------------|
| Full control atas key material | Tanggung jawab generate key sendiri |
| Bisa migrasi dari on-premise | Setup lebih complex |
| Compliance tertentu mengharuskan ini | — |

---

### Section 3: Purpose and Algorithm

```
  ● Purpose and algorithm                        ← section header
  │
  │  Purpose
  │  ┌─────────────────────────────────────────────┐
  │  │ Symmetric encrypt/decrypt                  ▼│
  │  └─────────────────────────────────────────────┘
  │
  │  (Jika Symmetric → Algorithm otomatis, tidak perlu pilih)
  │  Algorithm: Google symmetric key
  │
  │  (Jika Asymmetric sign/decrypt/MAC → muncul dropdown Algorithm)
  │  Algorithm
  │  ┌─────────────────────────────────────────────┐
  │  │ (pilihan tergantung purpose)               ▼│
  │  └─────────────────────────────────────────────┘
  │
  │  [CONTINUE]
```

Setelah CONTINUE, section ter-collapse menampilkan summary:

```
  ● Purpose and algorithm
  │  Purpose    Symmetric encrypt/decrypt
  │  Algorithm  Google symmetric key
```

#### Dropdown Purpose

| Purpose | Algorithm Muncul? | Default Algorithm |
|---------|-------------------|-------------------|
| **Symmetric encrypt/decrypt** | Tidak — otomatis | `Google symmetric key` (AES-256-GCM) |
| **Asymmetric sign** | Ya — dropdown pilihan | RSA / EC / Ed25519 variants |
| **Asymmetric decrypt** | Ya — dropdown pilihan | RSA OAEP variants |
| **MAC signing/verification** | Ya — dropdown pilihan | HMAC-SHA256 |

**Purpose dan Algorithm TIDAK BISA DIUBAH** setelah key dibuat.

#### Algorithm Options (Jika Asymmetric/MAC)

**Asymmetric Sign:**

| Algorithm | Key Size | Kecepatan | Use Case |
|-----------|----------|-----------|----------|
| `RSA_SIGN_PKCS1_2048_SHA256` | 2048-bit | Cepat | General purpose signing |
| `RSA_SIGN_PKCS1_4096_SHA256` | 4096-bit | Lebih lambat | Higher security |
| `RSA_SIGN_PSS_2048_SHA256` | 2048-bit | Cepat | Modern signing (PSS padding) |
| `RSA_SIGN_PSS_4096_SHA512` | 4096-bit | Lebih lambat | Maximum security |
| `EC_SIGN_P256_SHA256` | 256-bit | Sangat cepat | Compact signatures, IoT |
| `EC_SIGN_P384_SHA384` | 384-bit | Cepat | Higher security EC |
| `EC_SIGN_SECP256K1_SHA256` | 256-bit | Sangat cepat | Blockchain, cryptocurrency |
| `ECDSA_ED25519` | 255-bit | Sangat cepat | Modern, compact, SSH keys |

**Asymmetric Decrypt:**

| Algorithm | Key Size | Use Case |
|-----------|----------|----------|
| `RSA_DECRYPT_OAEP_2048_SHA256` | 2048-bit | Key wrapping, small data |
| `RSA_DECRYPT_OAEP_3072_SHA256` | 3072-bit | Higher security |
| `RSA_DECRYPT_OAEP_4096_SHA256` | 4096-bit | Maximum security |
| `RSA_DECRYPT_OAEP_4096_SHA512` | 4096-bit | Maximum security + SHA512 |

**MAC:**

| Algorithm | Use Case |
|-----------|----------|
| `HMAC_SHA256` | API authentication, data integrity (paling umum) |
| `HMAC_SHA1` | Legacy compatibility |
| `HMAC_SHA384` | Higher security |
| `HMAC_SHA512` | Maximum security MAC |

---

### Section 4: Versions

```
  ● Versions                                     ← section header
  │
  │  Key rotation period
  │  ┌─────────────────────────────────────────────┐
  │  │ 90 days                                    ▼│
  │  └─────────────────────────────────────────────┘
  │
  │  Starting on
  │  ┌─────────────────────────────────────────────┐
  │  │ 12/6/24                                     │
  │  └─────────────────────────────────────────────┘
  │
  │  [CONTINUE]
```

Setelah CONTINUE, section ter-collapse menampilkan summary:

```
  ● Versions
  │  Key rotation period    90 days
  │  Starting on            12/6/24
```

Hanya tersedia untuk **Symmetric encrypt/decrypt**. Asymmetric dan MAC keys **tidak support** auto-rotation.

| Pilihan Rotation Period | Arti | Rekomendasi |
|------------------------|------|-------------|
| **30 days** | Rotate setiap 30 hari | Highest security, banyak key versions |
| **60 days** | Rotate setiap 60 hari | Balance security & cost |
| **90 days** (default) | Rotate setiap 90 hari | **Recommended** untuk kebanyakan use case |
| **180 days** | Rotate setiap 6 bulan | Low-risk data |
| **365 days** | Rotate setiap 1 tahun | Compliance minimum |
| **Custom** | Tentukan sendiri (minimum 1 hari) | Custom requirement |
| **Never** | Tidak auto-rotate | **Tidak disarankan** |

**Starting on** = tanggal rotation pertama dimulai (auto-calculated dari tanggal create + period).

```
Flow Auto-Rotation:

  Day 0:   Key Version 1 dibuat (PRIMARY)
  Day 90:  Key Version 2 dibuat (PRIMARY) ← otomatis!
           Key Version 1 → ENABLED (masih bisa decrypt)
  Day 180: Key Version 3 dibuat (PRIMARY) ← otomatis!
           Key Version 2 → ENABLED
           Key Version 1 → ENABLED

  Encrypt: Selalu pakai PRIMARY (terbaru)
  Decrypt: Bisa pakai SEMUA version yang ENABLED
```

| Kelebihan Auto-Rotation | Kekurangan Auto-Rotation |
|-------------------------|--------------------------|
| Otomatis — tidak perlu manual | Banyak key versions = cost naik |
| Best practice keamanan | Perlu cleanup old versions |
| Compliance requirement terpenuhi | — |
| Auto-rotation **GRATIS** | — |

---

### Section 5: Additional Settings (optional)

```
  ● Additional settings (optional)               ← section header
  │
  │  Duration of 'scheduled destruction' state
  │  ┌─────────────────────────────────────────────┐
  │  │ 30 days (default)                          ▼│
  │  └─────────────────────────────────────────────┘
  │
  │  Labels
  │  [+ ADD LABEL]
  │
  │  Key access justifications (KAJ) policy
  │  ☐ Enable Key Access Justifications
```

Setelah selesai, section ter-collapse menampilkan summary:

```
  ● Additional settings (optional)
  │  Duration of 'scheduled destruction' state
  │  30 days (default)
```

#### Duration of 'Scheduled Destruction' State

Berapa lama key version tetap di state **"Scheduled for destruction"** sebelum dihapus permanen.

| Pilihan | Arti | Rekomendasi |
|---------|------|-------------|
| **24 hours** | Destroy setelah 1 hari | Hanya untuk test/dev |
| **7 days** | Destroy setelah 1 minggu | Staging environment |
| **30 days** (default) | Destroy setelah 30 hari | **Recommended** — cukup waktu untuk cancel |
| **60 days** | Destroy setelah 60 hari | Extra cautious |
| **120 days** | Destroy setelah 120 hari | Highly regulated environments |

Selama periode ini, key version **masih bisa di-restore** (cancel destruction).

#### Labels

| Setting | Fungsi |
|---------|--------|
| **Labels** | Key-value labels untuk organisasi (`environment: prod`, `team: backend`) |
| **Key Access Justifications** | Requires justification dari Google setiap akses key — untuk compliance ultra-ketat |

---

### Flow Stepper: Cara Kerja Wizard

```
Section 1: Name and protection level  ● (blue dot — ACTIVE, expanded)
     │
     │ [CONTINUE]
     ▼
Section 2: Key material               ● (blue dot — ACTIVE, expanded)
  Section 1 → collapsed, tampil summary
     │
     │ [CONTINUE]
     ▼
Section 3: Purpose and algorithm       ● (blue dot — ACTIVE, expanded)
  Section 1,2 → collapsed, tampil summary
     │
     │ [CONTINUE]
     ▼
Section 4: Versions                    ● (blue dot — ACTIVE, expanded)
  Section 1,2,3 → collapsed, tampil summary
     │
     │ [CONTINUE]
     ▼
Section 5: Additional settings         ● (blue dot — ACTIVE, expanded)
  Section 1,2,3,4 → collapsed, tampil summary
     │
     ▼
[CREATE] → Key dibuat!
```

**Catatan:** Kamu bisa klik section header yang sudah di-collapse untuk kembali edit section tersebut. Setiap section yang sudah diisi menampilkan **summary** (ringkasan nilai) saat ter-collapse.

---

## Step 4: Key Details (Setelah Dibuat)

Setelah key dibuat, Console menampilkan halaman detail key:

```
┌───────────────────────────────────────────────────────────────────────┐
│  ← my-app-keyring / my-encryption-key                                │
│                                                                       │
│  Purpose: Symmetric encrypt/decrypt    Protection: Software           │
│  Algorithm: GOOGLE_SYMMETRIC_ENCRYPTION                               │
│  Key ring: my-app-keyring              Location: asia-southeast2      │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Key versions                                                 │    │
│  │                                                              │    │
│  │  ┌──────┬──────────┬─────────────┬──────────┬────────────┐  │    │
│  │  │ ID   │ State    │ Created     │ Primary  │ Actions    │  │    │
│  │  ├──────┼──────────┼─────────────┼──────────┼────────────┤  │    │
│  │  │ 1    │ ENABLED  │ Mar 23,2026 │ ★        │ ⋮          │  │    │
│  │  └──────┴──────────┴─────────────┴──────────┴────────────┘  │    │
│  │                                                              │    │
│  │  [CREATE VERSION]  [IMPORT VERSION]                          │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Rotation                                                             │
│  Period: 90 days                                                      │
│  Next rotation: Jun 21, 2026                                          │
│  [EDIT ROTATION SCHEDULE]                                             │
│                                                                       │
│  Labels                                                               │
│  (no labels)                                                          │
│  [EDIT LABELS]                                                        │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Actions per Key Version (klik ⋮)

```
  ⋮ → Dropdown:
  ┌─────────────────────────┐
  │ Make primary             │  ← jadikan primary (untuk encrypt baru)
  │ Disable                  │  ← disable (tidak bisa encrypt/decrypt)
  │ Enable                   │  ← enable kembali
  │ Schedule destruction     │  ← schedule destroy (30 hari)
  │ Restore                  │  ← cancel destruction (jika scheduled)
  └─────────────────────────┘
```

---

## Flow End-to-End: Membuat Key untuk Encrypt Disk

```
Console → Security → Key Management
       │
       ▼
Step 1: CREATE KEY RING
       │
       │  Name:     "myapp-prod-encryption"
       │  Location: asia-southeast2 (Jakarta)
       │  [CREATE]
       │
       ▼
Step 2: Masuk ke Key Ring → CREATE KEY
       │
       │  Type:         Generated key
       │  Name:         "disk-encryption-key"
       │  Protection:   Software
       │  Purpose:      Symmetric encrypt/decrypt
       │  Rotation:     90 days
       │  Destroy wait: 30 days
       │  [CREATE]
       │
       ▼
Step 3: Key siap digunakan!
       │
       │  Key Version 1: ENABLED (PRIMARY)
       │  Algorithm: GOOGLE_SYMMETRIC_ENCRYPTION (AES-256-GCM)
       │
       ▼
Step 4: Gunakan di Compute Engine
       │
       │  Create VM → Disks → Encryption
       │  → Customer-managed encryption key (CMEK)
       │  → Pilih key: "disk-encryption-key"
       │
       ▼
✅ Disk terenkripsi dengan key yang kamu kelola!
```

---

*Dokumen ini berdasarkan fitur Cloud KMS di Google Cloud Console per Maret 2025–2026; nama field UI dapat sedikit berubah antar rilis Console.*
