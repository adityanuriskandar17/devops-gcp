# Cloud Key Management Service (Cloud KMS)

Dokumentasi lengkap **Google Cloud Key Management Service (Cloud KMS)** — layanan managed untuk membuat, mengelola, dan menggunakan **encryption keys** di Google Cloud Platform.

**Console:** Security → **Key Management**
**URL:** [console.cloud.google.com/security/kms](https://console.cloud.google.com/security/kms)

---

## Apa itu Cloud KMS?

Cloud KMS adalah layanan **managed key management** yang memungkinkan kamu membuat, mengimpor, dan mengelola **cryptographic keys** untuk melindungi data di GCP. Keys bisa digunakan untuk enkripsi/dekripsi data, signing, dan verifikasi.

```
┌──────────────────────────────────────────────────────────────┐
│                   Google Cloud KMS                            │
│                                                              │
│   ┌──────────────┐                                           │
│   │  Key Ring     │  ← container keys di 1 lokasi            │
│   │  (us-east1)   │                                           │
│   │               │                                           │
│   │  ┌──────────┐ │    ┌──────────────────────────────────┐  │
│   │  │  Key 1   │ │───►│ Encrypt/Decrypt data             │  │
│   │  │ (AES-256)│ │    │ Cloud Storage, Disks, BigQuery   │  │
│   │  └──────────┘ │    └──────────────────────────────────┘  │
│   │               │                                           │
│   │  ┌──────────┐ │    ┌──────────────────────────────────┐  │
│   │  │  Key 2   │ │───►│ Sign/Verify digital signatures   │  │
│   │  │ (RSA)    │ │    │ Code signing, JWT, certificates  │  │
│   │  └──────────┘ │    └──────────────────────────────────┘  │
│   │               │                                           │
│   │  ┌──────────┐ │    ┌──────────────────────────────────┐  │
│   │  │  Key 3   │ │───►│ MAC signing/verification         │  │
│   │  │ (HMAC)   │ │    │ API authentication, integrity    │  │
│   │  └──────────┘ │    └──────────────────────────────────┘  │
│   └──────────────┘                                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Daftar Dokumentasi

| # | File | Isi |
|---|------|-----|
| 01 | [Konsep & Resource Hierarchy](01-concepts.md) | Key ring, key, key version, protection level, hierarki |
| 02 | [Create Key Ring & Key](02-create-key.md) | Console walkthrough: create key ring, create key, semua opsi |
| 03 | [Key Rotation & Versioning](03-rotation-versioning.md) | Auto-rotation, manual rotation, key versions, destroy/restore |
| 04 | [Integrasi & Penggunaan](04-integration.md) | CMEK, enkripsi disk/storage/SQL, envelope encryption |
| 05 | [Pricing & Best Practices](05-pricing-best-practices.md) | Harga per protection level, free tier, tips keamanan |

---

## Quick Start

```
1. Buka Console → Security → Key Management
2. Klik "Create Key Ring" → isi nama dan lokasi
3. Klik "Create Key" → pilih purpose, protection level
4. Gunakan key untuk encrypt data di Cloud Storage, Compute Engine disk, Cloud SQL, dll
```
