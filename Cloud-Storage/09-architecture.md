# Arsitektur & Skenario

Skenario-skenario real-world penggunaan Cloud Storage, lengkap dengan lifecycle, disaster recovery, dan arsitektur.

> **Console:** Cloud Storage → **Buckets** (untuk melihat/membuat bucket sesuai skenario di bawah)
> 
> Setiap skenario menunjukkan setting yang perlu dikonfigurasi di Console saat membuat bucket.

---

## Skenario 1: Backup dengan Lifecycle Transition

Data backup otomatis berpindah ke class yang lebih murah seiring waktu, lalu dihapus setelah tidak diperlukan.

```
╔════════════════════════════════════════════════════════════════════════╗
║  SKENARIO: Backup Database Harian                                    ║
║  Bucket: gs://myapp-db-backups                                       ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║   Hari ke-0              Hari ke-30             Hari ke-120           ║
║   (baru upload)          (1 bulan)              (4 bulan)             ║
║                                                                       ║
║  ╔═══════════╗       ╔═══════════╗        ╔═══════════╗              ║
║  ║ STANDARD  ║──────►║ NEARLINE  ║───────►║ COLDLINE  ║              ║
║  ║ 8 GB      ║       ║ 8 GB      ║        ║ 8 GB      ║              ║
║  ╚═══════════╝       ╚═══════════╝        ╚═══════════╝              ║
║                                                                       ║
║  Fungsi:              Fungsi:              Fungsi:                     ║
║  Active backup        Monthly backup       Disaster Recovery          ║
║  Bisa restore cepat   Jarang diakses       Hanya untuk DR             ║
║                                                                       ║
║  Biaya/GB: $0.023     Biaya/GB: $0.016     Biaya/GB: $0.006          ║
║  (termahal)           (hemat 30%)          (hemat 74%)                ║
║                                                                       ║
║  Hari ke-365 (1 tahun): AUTO DELETE                                   ║
║                                                                       ║
╚════════════════════════════════════════════════════════════════════════╝
```

**Setup di Console:**
- Create bucket → Default storage class: **Standard**
- Bucket → tab **Lifecycle** → Add a rule:
  - Rule 1: Action **Set storage class to Nearline**, Condition: Age = 30 days
  - Rule 2: Action **Set storage class to Coldline**, Condition: Age = 120 days
  - Rule 3: Action **Delete object**, Condition: Age = 365 days

**Lifecycle rules (JSON) equivalent:**

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
        "condition": {"age": 120, "matchesStorageClass": ["NEARLINE"]}
      },
      {
        "action": {"type": "Delete"},
        "condition": {"age": 365}
      }
    ]
  }
}
```

**Simulasi biaya 8 GB backup per hari (30 hari/bulan):**

```
Tanpa lifecycle (semua Standard):
  240 GB × $0.023 = $5.52/bulan

Dengan lifecycle:
  Hari 0-30:   8 GB × $0.023  = $0.18  (Standard, 1 bulan)
  Hari 30-120: 8 GB × $0.016  = $0.13  (Nearline, 3 bulan)
  Hari 120-365:8 GB × $0.006  = $0.05  (Coldline, 8 bulan)
  Total per backup: ~$0.36 (vs $2.76 kalau Standard terus)
  
  HEMAT ~87%
```

---

## Skenario 2: Disaster Recovery Multi-Region

Aplikasi di Jakarta, dengan backup di region lain untuk disaster recovery kalau Jakarta DC bermasalah.

```
╔══════════════════════════════════════════════════════════════════════╗
║  SKENARIO: Multi-Region Disaster Recovery                           ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ┌─────────┐      ┌───────────────────┐    ┌──────────────────┐     ║
║  │  User   │─────►│  Load Balancer    │───►│  App (1) - JKT   │     ║
║  │         │      │  Firewall         │    │  asia-southeast2 │     ║
║  └─────────┘      │  www.myapp.com    │    └────────┬─────────┘     ║
║                   └─────────┬─────────┘             │               ║
║                             │                       │               ║
║                             │ (failover             │ (write)       ║
║                             │  kalau JKT down)      │               ║
║                             │                       ▼               ║
║                   ┌─────────▼─────────┐    ╔══════════════════╗     ║
║                   │  App (2) - US     │    ║ Bucket PRIMARY   ║     ║
║                   │  us-central1      │    ║ Standard 8GB     ║     ║
║                   └───────────────────┘    ║ asia-southeast2  ║     ║
║                                            ╚════════╤═════════╝     ║
║                                                     │               ║
║                            ┌────────────────────────┤               ║
║                            │ (lifecycle 30 hari)    │ (replika)     ║
║                            ▼                        ▼               ║
║                   ╔══════════════════╗     ╔══════════════════╗     ║
║                   ║ Bucket BACKUP    ║     ║ Bucket DR        ║     ║
║                   ║ Nearline 8GB     ║     ║ Coldline 8GB     ║     ║
║                   ║ asia-southeast2  ║     ║ us-central1      ║     ║
║                   ╚══════════════════╝     ╚══════════════════╝     ║
║                   (backup bulanan)         (disaster recovery,      ║
║                                             region berbeda)          ║
║                                                                      ║
║  ⚠️  Kalau Jakarta DC down:                                         ║
║  1. LB failover ke App (2) US                                       ║
║  2. App US baca data dari Bucket DR (us-central1)                   ║
║  3. Service tetap jalan, data aman                                   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

**Setup di Console:**

| Bucket | Console: Create Bucket settings |
|--------|--------------------------------|
| `myapp-primary` | Location: **asia-southeast2**, Class: **Standard** |
| `myapp-backup` | Location: **asia-southeast2**, Class: **Nearline**, Lifecycle: Standard→Nearline 30 hari |
| `myapp-dr` | Location: **us-central1** (region berbeda!), Class: **Coldline** |

Untuk sync data ke DR bucket:
> **Console:** Storage Transfer Service → **Create transfer job** → Source: `myapp-primary` → Destination: `myapp-dr` → Schedule: Daily

Atau via CLI:

```bash
gcloud storage rsync gs://myapp-primary gs://myapp-dr --recursive
```

---

## Skenario 3: Website Assets + CDN

Gambar dan file static di-serve via Cloud CDN untuk akses cepat dari seluruh dunia.

```
╔══════════════════════════════════════════════════════════════════════╗
║  SKENARIO: Website Static Assets                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ┌─────────┐      ┌──────────────┐      ╔══════════════════╗       ║
║  │  Admin   │─────►│  App Server  │─────►║ Bucket: assets   ║       ║
║  │  upload  │      │  (ftlgymweb) │      ║ Standard         ║       ║
║  │  gambar  │      └──────────────┘      ║ asia-southeast2  ║       ║
║  └─────────┘                             ╚════════╤═════════╝       ║
║                                                    │                 ║
║                                           (gambar di-cache)          ║
║                                                    │                 ║
║                                                    ▼                 ║
║                                           ╔══════════════════╗       ║
║                                           ║  Cloud CDN       ║       ║
║                                           ║  (cache global)  ║       ║
║                                           ╚════════╤═════════╝       ║
║                                                    │                 ║
║                              ┌─────────────────────┼────────────┐    ║
║                              ▼                     ▼            ▼    ║
║                        ┌──────────┐         ┌──────────┐  ┌────────┐║
║                        │ User JKT │         │ User SG  │  │User US │║
║                        │ ~5ms     │         │ ~15ms    │  │~50ms   │║
║                        └──────────┘         └──────────┘  └────────┘║
║                                                                      ║
║  Tanpa CDN:  User US → Jakarta bucket = ~200ms                      ║
║  Dengan CDN: User US → CDN edge US    = ~50ms (4x lebih cepat)      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

**Kelebihan pakai CDN:**
- Gambar di-cache di edge server seluruh dunia
- User akses dari server terdekat (bukan dari Jakarta)
- Mengurangi bandwidth/egress cost dari bucket

**Kekurangan:**
- Ada CDN cost tambahan
- Cache invalidation bisa delay (update gambar tidak langsung terlihat)

---

## Skenario 4: Log Storage dengan Auto-Cleanup

Log aplikasi disimpan di bucket, otomatis pindah class dan dihapus setelah retention period.

```
╔══════════════════════════════════════════════════════════════════════╗
║  SKENARIO: Application Log Storage                                  ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ╔═══════════╗  ╔═══════════╗  ╔═══════════╗                       ║
║  ║ App Server║  ║ API Server║  ║ DB Server ║                       ║
║  ╚═════╤═════╝  ╚═════╤═════╝  ╚═════╤═════╝                       ║
║        │               │               │                             ║
║        └───────┬───────┘───────────────┘                             ║
║                │ (kirim log)                                         ║
║                ▼                                                     ║
║  ╔══════════════════════════════════════════════════╗                ║
║  ║  Bucket: gs://myapp-logs                         ║                ║
║  ║                                                  ║                ║
║  ║  /logs/2026-03-23/app.log     ← STANDARD        ║                ║
║  ║  /logs/2026-02-20/app.log     ← NEARLINE        ║                ║
║  ║  /logs/2025-12-01/app.log     ← COLDLINE        ║                ║
║  ║  /logs/2025-03-01/app.log     ← ❌ AUTO DELETE   ║                ║
║  ║                                                  ║                ║
║  ║  Lifecycle:                                      ║                ║
║  ║    0-30 hari   → Standard  (sering dibaca)       ║                ║
║  ║    30-90 hari  → Nearline  (kadang dibaca)       ║                ║
║  ║    90-365 hari → Coldline  (jarang, audit only)  ║                ║
║  ║    >365 hari   → DELETE    (tidak diperlukan)    ║                ║
║  ╚══════════════════════════════════════════════════╝                ║
║                                                                      ║
║  Biaya ~50 GB log/bulan:                                             ║
║    Tanpa lifecycle: 600 GB × $0.023 = $13.80/bulan (1 tahun)       ║
║    Dengan lifecycle: ~$5.20/bulan                                    ║
║    HEMAT ~62%                                                        ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Skenario 5: User Upload + Versioning

User bisa upload foto/dokumen, dengan versioning untuk proteksi kalau file tertimpa.

```
╔══════════════════════════════════════════════════════════════════════╗
║  SKENARIO: User Upload dengan Versioning & Soft Delete              ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ┌───────┐     ┌──────────┐     ╔════════════════════════════╗      ║
║  │ User  │────►│ App API  │────►║ Bucket: user-uploads       ║      ║
║  │ upload│     │          │     ║ Standard, asia-southeast2  ║      ║
║  │ foto  │     └──────────┘     ║                            ║      ║
║  └───────┘                      ║ Versioning: ON             ║      ║
║                                 ║ Soft Delete: 7 hari        ║      ║
║                                 ╚════════════════════════════╝      ║
║                                                                      ║
║  Apa yang terjadi:                                                   ║
║                                                                      ║
║  1. User upload foto.jpg (v1)                                        ║
║     └─ foto.jpg v1 tersimpan                                        ║
║                                                                      ║
║  2. User upload foto.jpg lagi (v2, overwrite)                        ║
║     ├─ foto.jpg v2 = versi aktif (live)                              ║
║     └─ foto.jpg v1 = versi lama (tersimpan, bisa restore)           ║
║                                                                      ║
║  3. User hapus foto.jpg                                              ║
║     ├─ foto.jpg v2 = soft deleted (tersimpan 7 hari)                ║
║     └─ foto.jpg v1 = masih ada                                      ║
║                                                                      ║
║  4. Admin restore dari v1 atau v2 (dalam 7 hari)                    ║
║     └─ File kembali!                                                 ║
║                                                                      ║
║  Lifecycle untuk cleanup versi lama:                                 ║
║  - Versi lama > 30 hari → Nearline                                  ║
║  - Versi lama > 90 hari → DELETE                                    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Skenario 6: Multi-Tier Storage Architecture

Arsitektur lengkap dengan beberapa bucket untuk fungsi berbeda.

```
╔══════════════════════════════════════════════════════════════════════╗
║  ARSITEKTUR LENGKAP (contoh: project ftlgym)                        ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ┌──────────────────────── HOT TIER ────────────────────────┐       ║
║  │                                                          │       ║
║  │  ╔═══════════════════╗    ╔═══════════════════╗         │       ║
║  │  ║ ftl-images        ║    ║ ftl-documents     ║         │       ║
║  │  ║ Standard          ║    ║ Standard          ║         │       ║
║  │  ║ + CDN             ║    ║ Versioning ON     ║         │       ║
║  │  ║                   ║    ║                   ║         │       ║
║  │  ║ Foto member,      ║    ║ PDF esign,        ║         │       ║
║  │  ║ gambar website     ║    ║ kontrak, invoice  ║         │       ║
║  │  ╚═══════════════════╝    ╚═══════════════════╝         │       ║
║  │  Akses: setiap menit      Akses: setiap hari            │       ║
║  └──────────────────────────────────────────────────────────┘       ║
║                                    │                                 ║
║                                    │ (lifecycle 30 hari)             ║
║                                    ▼                                 ║
║  ┌──────────────────── WARM TIER ───────────────────────────┐       ║
║  │                                                          │       ║
║  │  ╔═══════════════════╗    ╔═══════════════════╗         │       ║
║  │  ║ ftl-backups       ║    ║ ftl-old-uploads   ║         │       ║
║  │  ║ Nearline          ║    ║ Nearline          ║         │       ║
║  │  ║                   ║    ║                   ║         │       ║
║  │  ║ DB dump harian,   ║    ║ Upload lama       ║         │       ║
║  │  ║ config backup     ║    ║ (>30 hari)        ║         │       ║
║  │  ╚═══════════════════╝    ╚═══════════════════╝         │       ║
║  │  Akses: mingguan           Akses: jarang                 │       ║
║  └──────────────────────────────────────────────────────────┘       ║
║                                    │                                 ║
║                                    │ (lifecycle 120 hari)            ║
║                                    ▼                                 ║
║  ┌──────────────────── COLD TIER ───────────────────────────┐       ║
║  │                                                          │       ║
║  │  ╔═══════════════════╗    ╔═══════════════════╗         │       ║
║  │  ║ ftl-archive       ║    ║ ftl-dr            ║         │       ║
║  │  ║ Coldline          ║    ║ Coldline           ║         │       ║
║  │  ║ asia-southeast2   ║    ║ us-central1       ║         │       ║
║  │  ║                   ║    ║ (region berbeda!)  ║         │       ║
║  │  ║ Backup lama,      ║    ║ Disaster recovery ║         │       ║
║  │  ║ compliance data   ║    ║ copy              ║         │       ║
║  │  ╚═══════════════════╝    ╚═══════════════════╝         │       ║
║  │  Akses: hampir tidak       Akses: hanya saat disaster    │       ║
║  └──────────────────────────────────────────────────────────┘       ║
║                                                                      ║
║  Lifecycle lengkap:                                                  ║
║    Standard (0-30 hari) → Nearline (30-120 hari)                    ║
║    → Coldline (120-365 hari) → DELETE (>365 hari)                   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Skenario 7: Dual-Region untuk High Availability

Bucket dual-region supaya data tetap available kalau 1 region down.

```
╔══════════════════════════════════════════════════════════════════════╗
║  SKENARIO: Dual-Region Bucket                                       ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║                    ╔══════════════════════════╗                      ║
║                    ║  Bucket: myapp-data      ║                      ║
║                    ║  Dual-region:            ║                      ║
║                    ║  asia-southeast1 (SG)    ║                      ║
║                    ║  asia-southeast2 (JKT)   ║                      ║
║                    ╚════════════╤═════════════╝                      ║
║                                 │                                    ║
║              ┌──────────────────┼──────────────────┐                ║
║              ▼                                     ▼                ║
║  ╔═════════════════════╗            ╔═════════════════════╗         ║
║  ║  Replika JKT        ║            ║  Replika SG         ║         ║
║  ║  asia-southeast2    ║            ║  asia-southeast1    ║         ║
║  ╚═════════════════════╝            ╚═════════════════════╝         ║
║                                                                      ║
║  ✅ Normal: data diakses dari replika terdekat                       ║
║  ⚠️ JKT down: otomatis failover ke replika SG                       ║
║  ⚠️ SG down: otomatis failover ke replika JKT                       ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  Single-region vs Dual-region vs Multi-region                       ║
╠══════════════════╦══════════════╦════════════╦═══════════════╗      ║
║                  ║ Single-region║ Dual-region║ Multi-region  ║      ║
╠══════════════════╬══════════════╬════════════╬═══════════════╣      ║
║  Availability    ║  99.9%       ║  99.95%    ║  99.95%       ║      ║
║  Redundancy      ║  1 region    ║  2 region  ║  continent    ║      ║
║  Harga (std)     ║  $0.023/GB   ║  $0.036/GB ║  $0.026/GB   ║      ║
║  Failover        ║  Tidak       ║  Otomatis  ║  Otomatis     ║      ║
║  Latency         ║  Terendah    ║  Rendah    ║  Sedang       ║      ║
║  Kapan pakai     ║  Dev, budget ║  Prod HA   ║  Global app   ║      ║
╚══════════════════╩══════════════╩════════════╩═══════════════╝      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Kesalahan yang Harus Dihindari

### Jangan set default ke Nearline untuk data aktif

```
┌─────────────────────────────┬─────────────────────────────┐
│      SALAH                  │      BENAR                  │
├─────────────────────────────┼─────────────────────────────┤
│                             │                             │
│  Data aktif (sering akses)  │  Data aktif (sering akses)  │
│  disimpan di NEARLINE       │  disimpan di STANDARD       │
│                             │                             │
├─────────────────────────────┼─────────────────────────────┤
│  Latency:    TINGGI (lambat)│  Latency:    RENDAH (cepat) │
│  Biaya akses: $$ MAHAL      │  Biaya akses: $ MURAH       │
│  User experience: JELEK     │  User experience: BAGUS     │
├─────────────────────────────┼─────────────────────────────┤
│                             │                             │
│  User: "kok lambat ya?"    │  User: "wah cepet nih!"    │
│  Image load: 3-5 detik     │  Image load: <1 detik       │
│  Biaya membengkak karena   │  Biaya storage lebih mahal  │
│  akses terlalu sering      │  tapi biaya akses murah     │
│                             │  TOTAL lebih hemat!         │
└─────────────────────────────┴─────────────────────────────┘
```

### Jangan lupa Lifecycle rules

```
┌─────────────────────────────┬─────────────────────────────┐
│      SALAH                  │      BENAR                  │
├─────────────────────────────┼─────────────────────────────┤
│                             │                             │
│  Upload backup ke bucket    │  Upload backup ke bucket    │
│  Tidak set lifecycle        │  Set lifecycle:             │
│  Backup menumpuk terus      │  - 30 hari → Nearline      │
│  Biaya naik setiap bulan    │  - 120 hari → Coldline     │
│  500 GB backup unused       │  - 365 hari → DELETE       │
│  Bayar $11.50/bulan sia-sia │  Biaya terkontrol           │
│                             │                             │
└─────────────────────────────┴─────────────────────────────┘
```

### Jangan single bucket untuk semua

```
┌─────────────────────────────┬─────────────────────────────┐
│      SALAH                  │      BENAR                  │
├─────────────────────────────┼─────────────────────────────┤
│                             │                             │
│  1 bucket untuk semua:      │  Pisah berdasarkan fungsi:  │
│  gs://myapp/                │                             │
│    /images/                 │  gs://myapp-images/         │
│    /backups/                │    → Standard + CDN         │
│    /logs/                   │                             │
│    /documents/              │  gs://myapp-backups/        │
│                             │    → Lifecycle + Nearline   │
│  Masalah:                   │                             │
│  - 1 class untuk semua      │  gs://myapp-logs/           │
│  - Lifecycle susah diatur   │    → Lifecycle + auto-delete│
│  - Permission terlalu luas  │                             │
│                             │  gs://myapp-documents/      │
│                             │    → Standard + Versioning  │
│                             │                             │
│                             │  Setiap bucket punya:       │
│                             │  - Class yang tepat         │
│                             │  - Lifecycle sendiri        │
│                             │  - Permission granular      │
└─────────────────────────────┴─────────────────────────────┘
```

---

## Ringkasan Skenario

| # | Skenario | Class | Fitur Utama | Use Case |
|---|----------|-------|-------------|----------|
| 1 | Backup Lifecycle | Standard → Nearline → Coldline | Lifecycle rules | Backup database harian |
| 2 | DR Multi-Region | Standard + Coldline (region lain) | Cross-region sync | Disaster recovery |
| 3 | Website + CDN | Standard + CDN | Cloud CDN cache | Static assets website |
| 4 | Log Auto-Cleanup | Standard → Nearline → DELETE | Lifecycle delete | Application logs |
| 5 | User Upload | Standard + Versioning | Versioning + Soft Delete | User-generated content |
| 6 | Multi-Tier | Standard → Nearline → Coldline | Semua fitur | Full architecture |
| 7 | Dual-Region HA | Dual-region bucket | Auto-failover | High availability |
