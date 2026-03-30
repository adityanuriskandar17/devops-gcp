# Konsep & Resource Hierarchy Cloud KMS

Dokumentasi konsep dasar **Cloud Key Management Service** — hierarki resource, tipe key, protection level, dan cara kerja enkripsi.

**Console:** Security → **Key Management**

---

## Resource Hierarchy

Cloud KMS memiliki hierarki resource yang ketat. Setiap level memiliki fungsi berbeda:

```
Google Cloud Project
  │
  └── Key Ring (container — terikat pada 1 lokasi)
        │
        ├── Key 1 (symmetric encrypt/decrypt)
        │     ├── Key Version 1 (primary) ← digunakan untuk encrypt
        │     ├── Key Version 2 (enabled) ← bisa decrypt data lama
        │     └── Key Version 3 (destroyed)
        │
        ├── Key 2 (asymmetric sign)
        │     ├── Key Version 1 (primary)
        │     └── Key Version 2 (disabled)
        │
        └── Key 3 (MAC)
              └── Key Version 1 (primary)
```

### Penjelasan Setiap Level

| Resource | Fungsi | Catatan Penting |
|----------|--------|----------------|
| **Project** | Container utama — semua KMS resource ada di dalam project | Billing dihitung per project |
| **Key Ring** | Grup/container untuk keys — terikat pada **1 lokasi** (region) | **Tidak bisa dihapus** setelah dibuat. Nama harus unik per lokasi per project |
| **Key** | Berisi metadata (purpose, protection level, rotation) | **Purpose dan protection level tidak bisa diubah** setelah dibuat |
| **Key Version** | Berisi **actual key material** untuk operasi kriptografi | Bisa di-enable, disable, schedule destroy, atau restore |

### Kenapa Key Ring Tidak Bisa Dihapus?

```
Alasan keamanan:

  Key Ring dibuat → berisi Key → Key meng-encrypt data
       │
       ▼
  Jika Key Ring bisa dihapus:
    → Key hilang
    → Data yang di-encrypt dengan key tersebut
      TIDAK BISA didecrypt lagi (data loss!)
       │
       ▼
  Solusi Google: Key Ring TIDAK BISA dihapus
    → Key bisa di-disable atau version di-destroy
    → Tapi Key Ring dan nama Key tetap ada sebagai record
```

**Tips:** Gunakan naming convention yang baik sejak awal karena Key Ring bersifat **permanen**.

---

## Lokasi (Location)

Key Ring terikat pada **satu lokasi**. Lokasi menentukan **di mana** key material disimpan secara fisik.

```
Console: Create Key Ring → Key ring location

  ┌─────────────────────────────────────────────────┐
  │  Key ring location                               │
  │  ┌──────────────────────────────────────────┐    │
  │  │ asia-southeast2 (Jakarta)              ▼ │    │
  │  └──────────────────────────────────────────┘    │
  └─────────────────────────────────────────────────┘
```

### Tipe Lokasi

| Tipe | Contoh | Fungsi | Kapan Digunakan |
|------|--------|--------|----------------|
| **Regional** | `asia-southeast2` (Jakarta) | Key disimpan di 1 region | Default — data residency compliance, latency rendah |
| **Multi-region** | `asia`, `us`, `europe` | Key di-replicate ke beberapa region dalam area | HA tinggi, multi-region apps |
| **Global** | `global` | Key di-replicate ke semua region | Saat lokasi tidak penting, convenience |
| **Dual-region** | `nam4` (Iowa + South Carolina) | 2 region spesifik | Compliance yang butuh 2 lokasi |

### Pertimbangan Pemilihan Lokasi

| Pertimbangan | Rekomendasi |
|-------------|-------------|
| **Data residency** (data harus di Indonesia) | `asia-southeast2` (Jakarta) |
| **Latency** (encrypt/decrypt cepat) | Pilih region **sama** dengan resource yang dienkripsi |
| **Compliance** (GDPR, data harus di EU) | `europe` atau region EU spesifik |
| **High availability** | Multi-region (`asia`, `us`, `europe`) |
| **Tidak ada requirement spesifik** | `global` (paling flexible) |

| Kelebihan Regional | Kekurangan Regional |
|--------------------|--------------------|
| Data residency terjamin | Jika region down, key tidak accessible |
| Latency rendah | Hanya tersedia di 1 region |
| Compliance mudah | — |

| Kelebihan Global/Multi-region | Kekurangan Global/Multi-region |
|-------------------------------|-------------------------------|
| High availability | Tidak memenuhi data residency strict |
| Flexible — bisa diakses dari mana saja | Sedikit lebih lambat (routing) |

---

## Key Purpose (Tujuan Key)

Setiap key dibuat dengan **satu purpose** yang menentukan operasi apa yang bisa dilakukan.

```
Console: Create Key → Purpose

  ┌──────────────────────────────────────────────────────┐
  │  Purpose:                                             │
  │                                                      │
  │  ● Symmetric encrypt/decrypt                         │
  │  ○ Asymmetric sign                                   │
  │  ○ Asymmetric decrypt                                │
  │  ○ MAC signing/verification                          │
  └──────────────────────────────────────────────────────┘
```

### Tipe Purpose

| Purpose | Operasi | Algoritma | Use Case |
|---------|---------|-----------|----------|
| **Symmetric encrypt/decrypt** | Encrypt + Decrypt data | AES-256-GCM | Enkripsi disk, storage, database, secrets |
| **Raw symmetric encrypt/decrypt** | Encrypt + Decrypt raw data | AES-256-GCM, AES-256-CBC, AES-256-CTR | Interoperability dengan sistem lain |
| **Asymmetric sign** | Sign + Verify digital signature | RSA (2048-4096), EC (P-256, P-384, secp256k1), Ed25519 | Code signing, JWT, certificate signing |
| **Asymmetric decrypt** | Encrypt + Decrypt (public/private key) | RSA (2048-4096) | Key wrapping, secure data exchange |
| **MAC signing/verification** | Create + Verify MAC signature | HMAC-SHA256 | API authentication, data integrity |

### Flow per Purpose

#### Symmetric Encrypt/Decrypt

```
Paling umum — 1 key untuk encrypt DAN decrypt

  Plaintext data ──► KMS Encrypt (Key) ──► Ciphertext
                                              │
  Ciphertext ──────► KMS Decrypt (Key) ──► Plaintext ✅

  Same key digunakan untuk kedua operasi
```

#### Asymmetric Sign / Verify

```
2 keys: private key (sign) + public key (verify)

  Data ──► Sign (Private Key) ──► Signature
                                     │
  Data + Signature ──► Verify (Public Key) ──► Valid? ✅/❌

  Private key: tetap di KMS (tidak pernah keluar)
  Public key: bisa di-download dan distribusikan
```

#### Asymmetric Decrypt

```
2 keys: public key (encrypt) + private key (decrypt)

  Plaintext ──► Encrypt (Public Key) ──► Ciphertext
                                            │
  Ciphertext ──► Decrypt (Private Key) ──► Plaintext ✅

  Public key: bisa di-download, siapa saja bisa encrypt
  Private key: tetap di KMS, hanya pemilik yang bisa decrypt
```

#### MAC Signing

```
1 shared key untuk create dan verify MAC

  Data ──► MAC Sign (Key) ──► MAC Tag
                                 │
  Data + MAC Tag ──► MAC Verify (Key) ──► Valid? ✅/❌
```

### Perbandingan Purpose

| Aspek | Symmetric | Asymmetric Sign | Asymmetric Decrypt | MAC |
|-------|-----------|----------------|-------------------|-----|
| **Jumlah key** | 1 (shared) | 2 (public + private) | 2 (public + private) | 1 (shared) |
| **Kecepatan** | Sangat cepat | Lebih lambat | Lebih lambat | Cepat |
| **Data size** | Unlimited (via envelope) | Terbatas pada hash | Terbatas (RSA block size) | Unlimited |
| **Key keluar KMS?** | Tidak | Public key bisa di-download | Public key bisa di-download | Tidak |
| **Paling cocok untuk** | Enkripsi data at rest | Tanda tangan digital | Secure key exchange | Integrity check |

---

## Protection Level

Menentukan **di mana** dan **bagaimana** operasi kriptografi dilakukan.

```
Console: Create Key → Protection level

  ┌──────────────────────────────────────────────────────┐
  │  Protection level:                                    │
  │                                                      │
  │  ● Software                                          │
  │  ○ HSM                                               │
  │  ○ External                                          │
  │  ○ External via VPC                                  │
  └──────────────────────────────────────────────────────┘
```

### Tipe Protection Level

| Level | Apa itu | Keamanan | Harga |
|-------|---------|----------|-------|
| **Software** | Operasi kriptografi dilakukan di **software** (BoringCrypto module, FIPS 140-2 validated) | Tinggi | **Paling murah** (~$0.06/key/bulan) |
| **HSM** | Operasi dilakukan di **Hardware Security Module** multi-tenant (FIPS 140-2 Level 3) | Sangat tinggi | ~$1.00/key/bulan |
| **External (EKM)** | Key material disimpan di **external key manager** di luar Google, diakses via internet | Kontrol penuh | ~$3.00/key/bulan |
| **External via VPC** | Sama seperti External tapi diakses via **VPC network** (private connection) | Kontrol penuh + private | ~$3.00/key/bulan |

### Visualisasi Protection Level

```
Software:
  ┌─────────────────────────────────────┐
  │  Google Cloud                        │
  │  ┌───────────────────────────────┐  │
  │  │  KMS Software                  │  │
  │  │  (BoringCrypto / FIPS 140-2)  │  │
  │  │  Key material ada DI SINI     │  │
  │  └───────────────────────────────┘  │
  └─────────────────────────────────────┘

HSM:
  ┌─────────────────────────────────────┐
  │  Google Cloud                        │
  │  ┌───────────────────────────────┐  │
  │  │  Hardware Security Module      │  │
  │  │  (tamper-resistant hardware)   │  │
  │  │  FIPS 140-2 Level 3           │  │
  │  │  Key material ada DI SINI     │  │
  │  └───────────────────────────────┘  │
  └─────────────────────────────────────┘

External (EKM):
  ┌──────────────────┐          ┌──────────────────────┐
  │  Google Cloud     │          │  External KM         │
  │                  │  HTTPS   │  (Thales, Fortanix,  │
  │  KMS Proxy ──────┼─────────►│   Equinix, dll)      │
  │                  │          │  Key material DI SINI │
  └──────────────────┘          └──────────────────────┘

External via VPC:
  ┌──────────────────┐          ┌──────────────────────┐
  │  Google Cloud     │          │  External KM         │
  │                  │  VPC     │                      │
  │  KMS Proxy ──────┼─ ─ ─ ──►│  Key material DI SINI│
  │                  │ (private)│                      │
  └──────────────────┘          └──────────────────────┘
```

### Kapan Pakai Apa?

| Skenario | Protection Level | Alasan |
|----------|-----------------|--------|
| Enkripsi data umum (disk, storage) | **Software** | Cukup aman, murah, cepat |
| Compliance yang mensyaratkan HSM (PCI-DSS, HIPAA) | **HSM** | Sertifikasi FIPS 140-2 Level 3 |
| Regulasi mengharuskan key di luar Google | **External** | Full control key material |
| Regulasi + keamanan network private | **External via VPC** | Key di luar + akses private |
| Budget terbatas, keamanan standard | **Software** | Cost effective |
| Financial / banking industry | **HSM** | Regulatory requirement |

| Kelebihan Software | Kekurangan Software |
|--------------------|--------------------|
| Paling murah | Tidak memenuhi compliance HSM |
| Paling cepat (low latency) | Key material ada di Google software |
| Cukup untuk kebanyakan use case | — |

| Kelebihan HSM | Kekurangan HSM |
|---------------|---------------|
| Hardware-backed (tamper resistant) | ~17x lebih mahal dari Software |
| FIPS 140-2 Level 3 certified | Sedikit lebih lambat |
| Memenuhi compliance ketat | — |

| Kelebihan External | Kekurangan External |
|--------------------|---------------------|
| Full control — key tidak pernah di Google | Paling mahal |
| Bisa revoke akses Google kapan saja | Dependency pada external KM (jika down = tidak bisa encrypt/decrypt) |
| Ultimate trust model | Setup dan maintenance lebih kompleks |

---

## Key Version States

Setiap key version memiliki **state** yang menentukan apakah bisa digunakan:

```
State diagram:

  ┌──────────────┐
  │  PENDING     │  ← baru dibuat, menunggu generate
  │  GENERATION  │
  └──────┬───────┘
         │ (generated)
         ▼
  ┌──────────────┐                    ┌──────────────┐
  │   ENABLED    │ ──── disable ────► │  DISABLED    │
  │              │ ◄──── enable ───── │              │
  │  (bisa      │                    │  (tidak bisa │
  │   dipakai)  │                    │   dipakai)   │
  └──────┬───────┘                    └──────┬───────┘
         │                                    │
         │ schedule destroy                   │ schedule destroy
         ▼                                    ▼
  ┌──────────────┐
  │  DESTROY     │  ← menunggu 30 hari (default)
  │  SCHEDULED   │    masih bisa di-restore!
  └──────┬───────┘
         │ (30 hari berlalu)
         ▼
  ┌──────────────┐
  │  DESTROYED   │  ← key material DIHAPUS permanen
  │              │    TIDAK bisa di-restore
  └──────────────┘
```

| State | Bisa Encrypt? | Bisa Decrypt? | Bisa Restore? |
|-------|--------------|--------------|--------------|
| **Enabled** | Ya (jika primary) | Ya | — |
| **Disabled** | Tidak | Tidak | Ya (enable kembali) |
| **Destroy Scheduled** | Tidak | Tidak | Ya (cancel destroy) |
| **Destroyed** | Tidak | **TIDAK** — data loss! | **TIDAK** — permanen |

**Catatan penting:** Jika key version di-destroy dan ada data yang di-encrypt dengan version tersebut, data tersebut **tidak bisa didecrypt lagi** (data loss permanen).

---

## Envelope Encryption

Cloud KMS menggunakan **envelope encryption** untuk melindungi data besar secara efisien:

```
Envelope Encryption Flow:

  1. Generate DEK (Data Encryption Key) — random key lokal
  2. Encrypt data dengan DEK (cepat, lokal)
  3. Encrypt DEK dengan KEK (Key Encryption Key di KMS)
  4. Simpan: encrypted data + encrypted DEK

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  Data (100 MB)                                          │
  │       │                                                 │
  │       ▼                                                 │
  │  ┌──────────┐                                           │
  │  │ DEK      │ ←── random generated (lokal)              │
  │  │ (AES-256)│                                           │
  │  └────┬─────┘                                           │
  │       │                                                 │
  │       ├──► Encrypt data (lokal, cepat)                  │
  │       │    → Encrypted data (100 MB)                    │
  │       │                                                 │
  │       └──► DEK di-encrypt oleh KMS KEK                  │
  │            ┌─────────────────────────────┐              │
  │            │ KMS: Encrypt(DEK, KEK)      │              │
  │            │ → Encrypted DEK (256 bytes) │              │
  │            └─────────────────────────────┘              │
  │                                                         │
  │  Simpan: Encrypted data + Encrypted DEK                 │
  │  (KEK tetap di KMS, tidak pernah keluar)                │
  └─────────────────────────────────────────────────────────┘

  Decrypt:
  1. Kirim Encrypted DEK ke KMS → dapat DEK plaintext
  2. Decrypt data dengan DEK (lokal, cepat)
```

**Kenapa envelope encryption?**

| Aspek | Tanpa Envelope | Dengan Envelope |
|-------|---------------|-----------------|
| **Data 100 MB** | Kirim 100 MB ke KMS → lambat, mahal | Generate DEK lokal → encrypt lokal → kirim 256 bytes DEK ke KMS |
| **Latency** | Sangat tinggi (network roundtrip data besar) | Rendah (hanya DEK kecil yang ke KMS) |
| **Cost** | Banyak API calls / data transfer | Minimal API calls |
| **Security** | KEK di KMS, data transit ke KMS | KEK di KMS, data TIDAK transit ke KMS |

---

## Ringkasan Konsep

```
Cloud KMS Hierarchy:
  Project → Key Ring (per lokasi) → Key (per purpose) → Key Version (actual material)

Key Purpose:
  Symmetric encrypt/decrypt  → Enkripsi data (paling umum)
  Asymmetric sign           → Tanda tangan digital
  Asymmetric decrypt        → Secure key exchange
  MAC                       → Integrity check

Protection Level:
  Software  → Murah, cepat, cukup untuk kebanyakan use case
  HSM       → Hardware-backed, compliance (PCI-DSS, HIPAA)
  External  → Key di luar Google, full control

Key Version States:
  Enabled → Disabled → Destroy Scheduled (30 hari) → Destroyed (permanen)
```

---

*Dokumen ini berdasarkan fitur Cloud KMS di Google Cloud Console per Maret 2025–2026; nama field UI dapat sedikit berubah antar rilis Console.*
