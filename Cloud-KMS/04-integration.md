# Integrasi & Penggunaan Cloud KMS

Dokumentasi cara menggunakan **Cloud KMS keys** untuk enkripsi data di berbagai layanan GCP — **CMEK** (Customer-Managed Encryption Keys), envelope encryption, dan integrasi Console.

**Console:** Setiap layanan GCP yang support CMEK memiliki opsi enkripsi di Console masing-masing.

---

## Default Encryption vs CMEK

Semua data di GCP **sudah di-encrypt secara default** menggunakan **Google-managed keys**. CMEK memberi kamu **kontrol penuh** atas encryption keys.

```
Default (Google-managed):
  ┌─────────────────────────────────────────────┐
  │  Data kamu (disk, storage, database)         │
  │       │                                     │
  │       ▼                                     │
  │  Google auto-encrypt dengan Google key       │
  │  (kamu TIDAK bisa lihat, manage, atau        │
  │   rotate key-nya)                            │
  └─────────────────────────────────────────────┘

CMEK (Customer-managed):
  ┌─────────────────────────────────────────────┐
  │  Data kamu (disk, storage, database)         │
  │       │                                     │
  │       ▼                                     │
  │  Encrypt dengan KEY KAMU di Cloud KMS        │
  │  (kamu BISA lihat, manage, rotate,           │
  │   disable, dan destroy key-nya)              │
  └─────────────────────────────────────────────┘
```

### Perbandingan

| Aspek | Google-managed (Default) | CMEK (Cloud KMS) |
|-------|-------------------------|-------------------|
| **Siapa manage key?** | Google (otomatis) | Kamu (via Cloud KMS) |
| **Bisa lihat key?** | Tidak | Ya |
| **Bisa rotate?** | Otomatis oleh Google | Kamu atur schedule |
| **Bisa disable/destroy?** | Tidak | Ya — bisa "kill switch" data |
| **Audit key usage?** | Tidak | Ya — Cloud Audit Logs |
| **Compliance** | Dasar | PCI-DSS, HIPAA, SOC2, dll |
| **Biaya tambahan** | Gratis | Biaya per key version + operations |
| **Setup** | Tidak perlu | Perlu create Key Ring + Key |

### Kapan Pakai CMEK?

| Skenario | Pakai CMEK? | Alasan |
|----------|------------|--------|
| Development environment | **Tidak** | Google-managed cukup |
| Production data umum | **Opsional** | Best practice tapi tidak wajib |
| Data sensitif (PII, financial) | **Ya** | Compliance & audit requirement |
| Regulated industry (banking, healthcare) | **Wajib** | Regulatory requirement |
| Perlu "kill switch" data | **Ya** | Disable key = data tidak bisa diakses |
| Multi-cloud / hybrid | **Ya** | Konsisten key management across environments |

---

## Integrasi per Layanan GCP

### 1. Compute Engine — Disk Encryption

```
Console: Compute Engine → Create Instance → Disks → Encryption

  ┌──────────────────────────────────────────────────────────────┐
  │  Boot disk                                                    │
  │                                                              │
  │  Encryption:                                                  │
  │  ● Google-managed encryption key (default)                   │
  │  ○ Customer-managed encryption key                            │
  │  ○ Customer-supplied encryption key                           │
  │                                                              │
  │  (Jika CMEK dipilih):                                        │
  │  Select a customer-managed key:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ projects/my-project/locations/asia-southeast2/        │    │
  │  │ keyRings/myapp-prod/cryptoKeys/disk-encryption     ▼│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⓘ Grant the Compute Engine Service Agent access to this key │
  │    [GRANT]                                                    │
  └──────────────────────────────────────────────────────────────┘
```

**3 tipe enkripsi disk:**

| Tipe | Siapa Manage | Key Di Mana | Use Case |
|------|-------------|-------------|----------|
| **Google-managed** | Google | Google internal | Default, tanpa effort |
| **CMEK** | Kamu (Cloud KMS) | Cloud KMS | Compliance, audit, control |
| **CSEK** (Customer-supplied) | Kamu | Kamu simpan sendiri di luar GCP | Maximum control, tapi risky |

**Penting: Service Agent Permission**

Saat pertama kali pakai CMEK untuk Compute Engine, perlu **grant permission** ke Compute Engine Service Agent:

```
Service Agent: service-{PROJECT_NUMBER}@compute-system.iam.gserviceaccount.com
Role yang dibutuhkan: Cloud KMS CryptoKey Encrypter/Decrypter
  (roles/cloudkms.cryptoKeyEncrypterDecrypter)
```

Console biasanya menampilkan tombol **[GRANT]** yang otomatis setup permission ini.

---

### 2. Cloud Storage — Bucket Encryption

```
Console: Cloud Storage → Create bucket → Choose how to protect object data

  ┌──────────────────────────────────────────────────────────────┐
  │  Data encryption                                              │
  │                                                              │
  │  ● Google-managed encryption key                             │
  │    No configuration required                                  │
  │                                                              │
  │  ○ Customer-managed encryption key                            │
  │    Manage via Google Cloud Key Management Service              │
  │                                                              │
  │  (Jika CMEK dipilih):                                        │
  │  Select a customer-managed key:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ projects/my-project/locations/asia-southeast2/        │    │
  │  │ keyRings/myapp-prod/cryptoKeys/storage-cmek        ▼│    │
  │  └──────────────────────────────────────────────────────┘    │
  └──────────────────────────────────────────────────────────────┘
```

CMEK pada bucket berlaku untuk **semua object** yang di-upload ke bucket tersebut (default encryption key).

---

### 3. Cloud SQL — Instance Encryption

```
Console: Cloud SQL → Create Instance → Customize your instance
  → Data protection → Encryption

  ┌──────────────────────────────────────────────────────────────┐
  │  Encryption                                                   │
  │                                                              │
  │  ● Google-managed encryption key                             │
  │  ○ Customer-managed encryption key                            │
  │                                                              │
  │  (Jika CMEK dipilih):                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Key: projects/my-project/locations/asia-southeast2/   │    │
  │  │ keyRings/myapp-prod/cryptoKeys/db-encryption       ▼│    │
  │  └──────────────────────────────────────────────────────┘    │
  └──────────────────────────────────────────────────────────────┘
```

**Catatan Cloud SQL CMEK:**
- Harus diset **saat create instance** — tidak bisa ditambahkan ke instance existing
- Key harus di **region yang sama** dengan Cloud SQL instance
- Berlaku untuk: data at rest, backups, replicas

---

### 4. GKE — Cluster & Secret Encryption

```
Console: GKE → Create Cluster → Security

  ┌──────────────────────────────────────────────────────────────┐
  │  Application-layer secrets encryption                         │
  │                                                              │
  │  ☑ Enable application-layer secrets encryption                │
  │                                                              │
  │  Select a customer-managed key:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ projects/my-project/locations/asia-southeast2/        │    │
  │  │ keyRings/gke-prod/cryptoKeys/secret-encryption     ▼│    │
  │  └──────────────────────────────────────────────────────┘    │
  └──────────────────────────────────────────────────────────────┘
```

Mengenkripsi Kubernetes **Secrets** di etcd menggunakan CMEK (di atas enkripsi default Google).

---

### 5. BigQuery — Dataset/Table Encryption

```
Console: BigQuery → Create dataset → Advanced options → Encryption

  ┌──────────────────────────────────────────────────────────────┐
  │  Encryption                                                   │
  │                                                              │
  │  ● Google-managed key                                        │
  │  ○ Customer-managed encryption key (CMEK)                     │
  │                                                              │
  │  (Jika CMEK):                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ (pilih key dari dropdown)                           ▼│    │
  │  └──────────────────────────────────────────────────────┘    │
  └──────────────────────────────────────────────────────────────┘
```

---

### Ringkasan Integrasi

| Layanan GCP | CMEK Support | Level Enkripsi | Kapan Diset |
|-------------|-------------|---------------|-------------|
| **Compute Engine** (disk) | Ya | Per disk | Create / attach disk |
| **Cloud Storage** (bucket) | Ya | Per bucket (default key) | Create bucket / edit |
| **Cloud SQL** | Ya | Per instance | **Hanya saat create** |
| **GKE** (secrets) | Ya | Per cluster | Create cluster |
| **BigQuery** | Ya | Per dataset/table | Create dataset |
| **Pub/Sub** | Ya | Per topic | Create topic |
| **Cloud Spanner** | Ya | Per database | Create database |
| **Filestore** | Ya | Per instance | Create instance |
| **Secret Manager** | Ya | Per secret | Create secret |
| **Artifact Registry** | Ya | Per repository | Create repository |

---

## "Kill Switch" — Disable Key untuk Block Akses Data

Salah satu keuntungan utama CMEK: jika perlu **segera block akses ke semua data** yang di-encrypt dengan key tertentu.

```
Skenario: Security breach detected!

  Step 1: Buka Console → Key Management
  Step 2: Cari key yang digunakan
  Step 3: Disable key version (atau semua versions)

  Efek LANGSUNG:
  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  Key: DISABLED                                       │
  │                                                      │
  │  Compute Engine disk → TIDAK BISA di-mount/read      │
  │  Cloud Storage objects → TIDAK BISA di-download      │
  │  Cloud SQL → TIDAK BISA diakses                      │
  │  BigQuery → TIDAK BISA di-query                      │
  │                                                      │
  │  Semua data yang di-encrypt oleh key ini              │
  │  → INACCESSIBLE sampai key di-enable kembali         │
  │                                                      │
  └──────────────────────────────────────────────────────┘

  Step 4 (setelah breach resolved):
    Enable key kembali → semua data accessible lagi ✅
```

| Kelebihan Kill Switch | Kekurangan Kill Switch |
|----------------------|------------------------|
| Instant — disable langsung block semua akses | Semua service yang pakai key ini juga terdampak |
| Reversible — enable kembali untuk restore | Bisa menyebabkan downtime jika salah disable |
| Tidak perlu akses ke setiap service satu per satu | Perlu tracking key mana dipakai di mana |

---

## IAM Roles untuk Cloud KMS

| Role | Permissions | Cocok Untuk |
|------|------------|-------------|
| **Cloud KMS Admin** (`roles/cloudkms.admin`) | Full access: create, manage, destroy keys | KMS administrator |
| **Cloud KMS CryptoKey Encrypter/Decrypter** | Encrypt + Decrypt menggunakan key | Service accounts yang butuh encrypt/decrypt |
| **Cloud KMS CryptoKey Encrypter** | Hanya Encrypt | Service yang hanya perlu encrypt (write-only) |
| **Cloud KMS CryptoKey Decrypter** | Hanya Decrypt | Service yang hanya perlu decrypt (read-only) |
| **Cloud KMS Viewer** (`roles/cloudkms.viewer`) | Read-only: lihat keys, tidak bisa operasi crypto | Auditor, read-only access |
| **Cloud KMS Signer/Verifier** | Sign + Verify menggunakan asymmetric key | Signing service |

```
Best practice IAM:

  Admin team     → Cloud KMS Admin (manage keys)
  App service account → Encrypter/Decrypter (gunakan keys)
  Auditor        → Cloud KMS Viewer (lihat saja)
  Backup service → Encrypter only (hanya encrypt backup)
```

---

*Dokumen ini berdasarkan fitur Cloud KMS di Google Cloud Console per Maret 2025–2026.*
