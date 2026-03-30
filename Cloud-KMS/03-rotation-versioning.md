# Key Rotation & Versioning

Dokumentasi lengkap **key rotation** (auto & manual), **key versioning**, dan **destroy/restore** di Google Cloud KMS Console.

**Console:** Security → Key Management → (key ring) → (key) → **Rotation / Versions**

---

## Apa itu Key Rotation?

Key rotation adalah proses **membuat key version baru** secara periodik dan menjadikannya **primary** (digunakan untuk encrypt data baru). Key version lama tetap **enabled** agar data yang sudah di-encrypt masih bisa di-decrypt.

```
Rotation Flow:

  Day 0:
    Version 1 ★ PRIMARY  ← semua encrypt pakai ini
    [Encrypt] → ciphertext tagged "version 1"

  Day 90 (auto-rotate):
    Version 2 ★ PRIMARY  ← encrypt baru pakai ini
    Version 1   ENABLED   ← masih bisa decrypt data lama

  Day 180 (auto-rotate):
    Version 3 ★ PRIMARY  ← encrypt baru pakai ini
    Version 2   ENABLED
    Version 1   ENABLED

  Decrypt:
    Data encrypted by V1 → decrypt pakai V1 ✅
    Data encrypted by V2 → decrypt pakai V2 ✅
    Data encrypted by V3 → decrypt pakai V3 ✅
    (KMS otomatis pilih version yang benar berdasarkan ciphertext metadata)
```

---

## Auto-Rotation (Symmetric Keys)

Hanya tersedia untuk **Symmetric encrypt/decrypt** keys.

### Konfigurasi di Console

```
Console: Key Management → (key ring) → (key) → Rotation section

  ┌──────────────────────────────────────────────────────────────┐
  │  Rotation                                                     │
  │                                                              │
  │  Rotation period: 90 days                                     │
  │  Next rotation: Jun 21, 2026                                  │
  │                                                              │
  │  [EDIT ROTATION SCHEDULE]                                     │
  └──────────────────────────────────────────────────────────────┘
```

Klik **EDIT ROTATION SCHEDULE**:

```
  ┌──────────────────────────────────────────────────────────────┐
  │  Edit rotation schedule                                       │
  │                                                              │
  │  Rotation period                                              │
  │  ┌─────────────────────────────────────────────────┐         │
  │  │ 90 days                                        ▼│         │
  │  └─────────────────────────────────────────────────┘         │
  │                                                              │
  │  Starting on                                                  │
  │  ┌─────────────────────────────────────────────────┐         │
  │  │ Jun 21, 2026                                    │         │
  │  └─────────────────────────────────────────────────┘         │
  │                                                              │
  │                            [SAVE]  [CANCEL]                   │
  └──────────────────────────────────────────────────────────────┘
```

### Pilihan Rotation Period

| Period | Security | Cost Impact | Cocok Untuk |
|--------|----------|-------------|-------------|
| **30 days** | Sangat tinggi | Key versions menumpuk cepat | Financial, healthcare |
| **90 days** | Tinggi (default) | Moderate | **Default yang recommended** |
| **180 days** | Moderate | Rendah | Internal tools, dev data |
| **365 days** | Minimum acceptable | Minimal | Low-risk data |
| **Never** | Rendah | Hanya 1 version | **Tidak disarankan** |

### Kenapa Rotation Penting?

```
Tanpa rotation:
  Key Version 1 digunakan SELAMANYA
  │
  ├─ Jika key compromised → SEMUA data terekspos
  └─ Tidak memenuhi compliance (PCI-DSS, HIPAA)

Dengan rotation (90 hari):
  Key Version 1 → encrypt data Jan-Mar
  Key Version 2 → encrypt data Apr-Jun
  Key Version 3 → encrypt data Jul-Sep
  │
  ├─ Jika Version 2 compromised → hanya data Apr-Jun terekspos
  └─ Compliance terpenuhi ✅
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Membatasi dampak jika key compromised | Lebih banyak key versions = cost naik |
| Memenuhi compliance requirement | Perlu cleanup old versions secara berkala |
| Otomatis — tidak perlu manual | — |
| Auto-rotation **GRATIS** | — |

---

## Manual Rotation

Membuat key version baru **secara manual** — berguna saat:
- Suspected key compromise → segera rotate
- Asymmetric/MAC keys (tidak support auto-rotation)
- Perlu kontrol penuh kapan rotation terjadi

### Console: Create New Version

```
Console: Key Management → (key ring) → (key) → [CREATE VERSION]

  ┌──────────────────────────────────────────────────────────────┐
  │  Create key version                                           │
  │                                                              │
  │  A new key version will be created and set as the primary     │
  │  key version.                                                 │
  │                                                              │
  │                            [CREATE]  [CANCEL]                 │
  └──────────────────────────────────────────────────────────────┘
```

Setelah create, version baru otomatis menjadi **PRIMARY**.

---

## Key Version Management

### Console: Key Versions List

```
Console: Key Management → (key ring) → (key)

  Key versions

  ┌──────┬──────────────────┬─────────────┬──────────┬────────────┐
  │ ID   │ State            │ Created     │ Primary  │ Actions    │
  ├──────┼──────────────────┼─────────────┼──────────┼────────────┤
  │ 3    │ ● ENABLED        │ Mar 23,2026 │ ★        │ ⋮          │
  │ 2    │ ● ENABLED        │ Dec 23,2025 │          │ ⋮          │
  │ 1    │ ● ENABLED        │ Sep 23,2025 │          │ ⋮          │
  └──────┴──────────────────┴─────────────┴──────────┴────────────┘
```

### Actions Menu (klik ⋮)

```
  ⋮ Actions per version:

  ┌───────────────────────────┐
  │ Make primary               │  → Jadikan primary version
  │ Disable                    │  → Disable (tidak bisa encrypt/decrypt)
  │ Schedule destruction       │  → Schedule destroy (countdown)
  └───────────────────────────┘

  Jika version disabled:
  ┌───────────────────────────┐
  │ Enable                     │  → Enable kembali
  │ Schedule destruction       │  → Schedule destroy
  └───────────────────────────┘

  Jika version scheduled for destruction:
  ┌───────────────────────────┐
  │ Restore                    │  → Cancel destruction, kembali ke disabled
  └───────────────────────────┘
```

### State Transitions

```
  ENABLED ──── Disable ────► DISABLED
  ENABLED ◄──── Enable ───── DISABLED
     │                           │
     └─── Schedule destroy ──────┘
                  │
                  ▼
          DESTROY SCHEDULED ──── Restore ────► DISABLED
                  │
                  │ (30 hari berlalu)
                  ▼
              DESTROYED (permanen, tidak bisa restore)
```

---

## Destroy & Restore Key Versions

### Schedule Destruction

```
Console: Key → Version → ⋮ → Schedule destruction

  ┌──────────────────────────────────────────────────────────────┐
  │  Schedule key version for destruction                         │
  │                                                              │
  │  ⚠ WARNING: Scheduling this key version for destruction      │
  │  will make it unusable after the scheduled destruction        │
  │  period. Any data encrypted with this key version will        │
  │  become PERMANENTLY UNRECOVERABLE after destruction.          │
  │                                                              │
  │  Duration: 30 days (configured at key creation)               │
  │                                                              │
  │  Type "my-encryption-key" to confirm:                         │
  │  ┌─────────────────────────────────────────────────┐         │
  │  │                                                  │         │
  │  └─────────────────────────────────────────────────┘         │
  │                                                              │
  │                    [SCHEDULE DESTRUCTION]  [CANCEL]            │
  └──────────────────────────────────────────────────────────────┘
```

**Proses:**

```
Schedule destruction:
       │
       ▼
  State: DESTROY SCHEDULED
  Countdown: 30 hari mulai sekarang
       │
       ├─ Dalam 30 hari → bisa RESTORE (cancel)
       │
       └─ Setelah 30 hari → DESTROYED (permanen!)
            │
            └─ Key material dihapus
               Data yang di-encrypt → TIDAK BISA didecrypt
               TIDAK ADA cara restore
```

### Restore (Cancel Destruction)

```
Console: Key → Version (Destroy Scheduled) → ⋮ → Restore

  ┌──────────────────────────────────────────────────────────────┐
  │  Restore key version                                          │
  │                                                              │
  │  This will cancel the scheduled destruction and restore       │
  │  the key version to DISABLED state.                           │
  │                                                              │
  │                            [RESTORE]  [CANCEL]                │
  └──────────────────────────────────────────────────────────────┘
```

Setelah restore → state kembali ke **DISABLED** (perlu enable manual untuk digunakan).

---

## Skenario: Cleanup Old Key Versions

```
Situasi: Key sudah rotate 10x → 10 key versions → cost naik

Strategy:
  1. Identifikasi data lama yang masih perlu decrypt
  2. Re-encrypt data lama dengan primary version (optional)
  3. Disable old versions yang tidak dibutuhkan
  4. Schedule destroy old versions
  5. Setelah 30 hari → otomatis destroyed → cost turun

Flow:
  Version 10 ★ PRIMARY  ← keep (active encrypt)
  Version 9   ENABLED   ← keep (recent data)
  Version 8   ENABLED   ← keep (recent data)
  Version 7   DISABLED  ← scheduled destroy
  Version 6   DISABLED  ← scheduled destroy
  ...
  Version 1   DESTROYED ← no more cost
```

| Kelebihan Cleanup | Kekurangan Cleanup |
|-------------------|--------------------|
| Kurangi cost (destroyed versions gratis) | Data lama yang di-encrypt oleh version ini = hilang |
| Dashboard lebih bersih | Perlu pastikan tidak ada data yang masih butuh version ini |
| Best practice security | Proses memakan waktu (30 hari per destroy) |

---

## Ringkasan

```
Auto-Rotation:
  - Hanya Symmetric encrypt/decrypt
  - Set period (30/90/180/365 days)
  - Rotation GRATIS
  - Old versions tetap ENABLED (bisa decrypt)

Manual Rotation:
  - Semua key types
  - Klik [CREATE VERSION]
  - New version otomatis PRIMARY

Destroy:
  - Schedule → 30 hari countdown → Destroyed (permanen)
  - Selama countdown → bisa Restore
  - Setelah destroyed → data TIDAK BISA didecrypt

Best Practice:
  - Enable auto-rotation (90 hari recommended)
  - Cleanup old versions secara berkala
  - Jangan destroy version jika masih ada data yang di-encrypt
```

---

*Dokumen ini berdasarkan fitur Cloud KMS di Google Cloud Console per Maret 2025–2026.*
