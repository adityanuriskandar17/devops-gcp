# Pricing & Best Practices Cloud KMS

Dokumentasi harga **Cloud KMS** per protection level dan best practices keamanan key management.

**Pricing page:** [cloud.google.com/kms/pricing](https://cloud.google.com/kms/pricing)

---

## Pricing Components

Cloud KMS pricing terdiri dari **2 komponen** utama:
1. **Active key versions** — biaya per jam per key version yang aktif (Enabled)
2. **Cryptographic operations** — biaya per 10,000 operasi (encrypt, decrypt, sign, verify)

---

## Harga per Protection Level

### Active Key Versions

| Protection Level | Harga per Key Version per Bulan | Harga per Jam |
|-----------------|-------------------------------|---------------|
| **Software** | ~**$0.06** / bulan | $0.000082192 / jam |
| **HSM** | ~**$1.00** / bulan | $0.001369863 / jam |
| **External / External VPC** | ~**$3.00** / bulan | $0.004109589 / jam |

**Catatan:** Destroyed key versions → **GRATIS** (tidak dikenakan biaya).

### Cryptographic Operations

| Operasi | Harga |
|---------|-------|
| **Encrypt / Decrypt / Sign / Verify / MAC** | **$0.03** per 10,000 operasi |
| Operasi pertama 10,000/bulan | Tergantung free tier eligibility |

### Free Tier (Autokey)

Jika menggunakan **Cloud KMS Autokey** (auto-create keys via Assured Workloads):

| Item | Gratis |
|------|--------|
| Active Software key versions | **100 versions** / bulan |
| Cryptographic operations | **10,000 operations** / bulan |
| Key rotation | **Selalu gratis** |

---

## Estimasi Biaya

### Skenario 1: Startup — 5 Software Keys

```
5 keys × 1 version each × $0.06/bulan = $0.30/bulan

Operations: ~50,000/bulan
  50,000 ÷ 10,000 × $0.03 = $0.15/bulan

Total: $0.30 + $0.15 = $0.45/bulan (~Rp 7,000)
→ Sangat murah
```

### Skenario 2: Medium — 10 Keys, Auto-Rotation 90 Days

```
10 keys × rata-rata 4 versions = 40 active versions
40 × $0.06/bulan = $2.40/bulan

Operations: ~500,000/bulan
  500,000 ÷ 10,000 × $0.03 = $1.50/bulan

Total: $2.40 + $1.50 = $3.90/bulan (~Rp 62,000)
```

### Skenario 3: Enterprise — 20 HSM Keys + 10 Software Keys

```
HSM: 20 keys × 4 versions = 80 versions × $1.00 = $80.00/bulan
Software: 10 keys × 4 versions = 40 versions × $0.06 = $2.40/bulan

Operations: ~2,000,000/bulan
  2,000,000 ÷ 10,000 × $0.03 = $6.00/bulan

Total: $80.00 + $2.40 + $6.00 = $88.40/bulan (~Rp 1,400,000)
```

### Skenario 4: External KMS

```
5 external keys × 1 version = 5 versions × $3.00 = $15.00/bulan

+ Biaya external KM provider (Thales, Fortanix, dll)
  Biasanya $500-$5,000/bulan tergantung provider

Total KMS: $15.00/bulan (+ provider cost)
```

---

## Tips Hemat

| Tips | Penjelasan | Savings |
|------|-----------|---------|
| **Cleanup old key versions** | Destroy versions yang tidak dibutuhkan — destroyed = gratis | Signifikan jika banyak versions |
| **Pakai Software kecuali perlu HSM** | Software 17x lebih murah dari HSM | ~$0.94/key/bulan |
| **Jangan buat key ring terlalu banyak** | Key ring gratis, tapi lebih sulit manage jika terlalu banyak | Organizational savings |
| **Share keys antar resource** | 1 key bisa dipakai untuk banyak disks/buckets | Kurangi jumlah keys |
| **Rotation period yang reasonable** | 90 hari (bukan 30 hari) = lebih sedikit versions | Moderate savings |
| **Destroy setelah re-encrypt** | Re-encrypt data lama → destroy old version | Cost turun |

---

## Best Practices

### 1. Key Organization

```
Rekomendasi struktur:

Project: my-production-project
│
├── Key Ring: app-encryption (asia-southeast2)
│   ├── Key: disk-encryption      (Symmetric, Software)
│   ├── Key: storage-cmek         (Symmetric, Software)
│   └── Key: db-encryption        (Symmetric, Software)
│
├── Key Ring: app-signing (asia-southeast2)
│   ├── Key: api-jwt-signing      (Asymmetric Sign, Software)
│   └── Key: code-signing         (Asymmetric Sign, HSM)
│
└── Key Ring: compliance-keys (asia-southeast2)
    └── Key: pci-encryption       (Symmetric, HSM)
```

| Practice | Penjelasan |
|----------|-----------|
| **1 Key Ring per purpose group** | Pisahkan encryption vs signing vs compliance |
| **Key Ring per region** | Match region key dengan region resource |
| **Naming convention konsisten** | `{app}-{purpose}-{detail}` |
| **Labels pada keys** | `environment`, `team`, `compliance` |

### 2. Security

| Practice | Penjelasan |
|----------|-----------|
| **Enable auto-rotation** | Minimum 90 hari untuk symmetric keys |
| **Least privilege IAM** | Service account hanya dapat `Encrypter/Decrypter`, bukan `Admin` |
| **Separate admin dari user** | Tim yang manage keys ≠ tim yang pakai keys |
| **Audit key usage** | Enable Cloud Audit Logs → lihat siapa pakai key kapan |
| **Jangan share key antar environment** | Production dan staging harus pakai key berbeda |
| **Destroy duration 30 hari** | Cukup waktu untuk cancel jika salah destroy |
| **Monitor key expiry** | Set alert jika key version mendekati destroy |

### 3. Compliance

| Compliance | Minimum Requirement |
|-----------|-------------------|
| **PCI-DSS** | HSM protection, rotation minimal 1 tahun, audit logs |
| **HIPAA** | CMEK wajib untuk PHI, HSM recommended, audit logs |
| **SOC 2** | CMEK + audit logs, rotation policy documented |
| **ISO 27001** | Key management policy, rotation, access control |
| **GDPR** | Encryption at rest (Google-managed cukup, CMEK recommended) |

### 4. Disaster Recovery

```
Skenario: Accidental key destroy

  Prevention:
  1. Set destroy duration 30 hari (bukan 24 jam)
  2. Restrict "destroy" permission ke admin saja
  3. Alert saat key version di-schedule destroy
  4. Regular backup key metadata (bukan key material)

  Recovery (jika dalam 30-hari window):
  1. Console → Key Management → key → version
  2. ⋮ → Restore
  3. Enable version kembali
  4. Verify data bisa diakses

  Recovery (jika sudah destroyed):
  ❌ TIDAK BISA — data loss permanen
  → Lesson: jangan pernah set destroy duration terlalu pendek di production
```

### 5. Checklist Production

```
☐ Key Ring dibuat di region yang sama dengan resource
☐ Naming convention konsisten diterapkan
☐ Protection level sesuai compliance requirement
☐ Auto-rotation enabled (90 hari recommended)
☐ Destroy duration: 30 hari (minimum)
☐ IAM roles: least privilege
  ☐ Admin: Cloud KMS Admin (hanya tim security)
  ☐ App: CryptoKey Encrypter/Decrypter
  ☐ Auditor: Cloud KMS Viewer
☐ Service Agent permissions di-grant untuk setiap layanan
☐ Cloud Audit Logs enabled untuk KMS
☐ Alert untuk: key scheduled for destruction, key disabled
☐ Labels ditambahkan (environment, team, compliance)
☐ Documentation: key mana dipakai di mana
☐ Tested: disable key → verify data inaccessible → enable → verify restored
```

---

## Kelebihan & Kekurangan Cloud KMS

| Kelebihan | Kekurangan |
|-----------|------------|
| **Fully managed** — tidak perlu maintain HSM sendiri | Biaya per key version (walau murah) |
| **Integrasi native** dengan semua layanan GCP | Key Ring tidak bisa dihapus |
| **Auto-rotation** gratis | Purpose & protection level tidak bisa diubah setelah create |
| **HSM option** untuk compliance ketat | External KMS mahal & complex |
| **Kill switch** — disable key = block semua data | Jika key destroyed = data loss permanen |
| **Audit Logs** terintegrasi | Perlu pemahaman envelope encryption untuk optimasi |
| **Envelope encryption** built-in di GCP services | Initial setup lebih complex dari Google-managed |
| **Global/multi-region** support | — |

---

*Dokumen ini berdasarkan pricing dan fitur Cloud KMS per Maret 2025–2026; harga dapat berubah.*
