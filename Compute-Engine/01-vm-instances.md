# VM Instances - Panduan Lengkap Create VM

VM Instance adalah server virtual yang berjalan di infrastruktur Google. Dokumen ini menjelaskan **setiap pilihan** di form Create VM Instance, lengkap dengan kelebihan dan kekurangan.

---

## Daftar Isi

1. [Name](#1-name)
2. [Region & Zone](#2-region--zone)
3. [Machine Configuration](#3-machine-configuration)
   - Machine Family
   - Series
   - Machine Type (Preset vs Custom)
   - CPU Platform
   - vCPUs to Core Ratio
   - GPU
4. [Provisioning Model](#4-provisioning-model)
5. [Confidential VM](#5-confidential-vm)
6. [Container](#6-container)
7. [Boot Disk](#7-boot-disk)
   - Operating System
   - Disk Type
   - Disk Size
   - Deletion Rule
8. [Data Protection](#8-data-protection)
   - Backups (Backup Plan, Snapshot Schedules, No Backups)
   - Replication (Synchronous, Asynchronous, Exclude Boot Disk)
9. [Security](#9-security)
   - Identity and API Access (Service Accounts, Access Scopes)
   - Confidential VM Service
   - Shielded VM (Secure Boot, vTPM, Integrity Monitoring)
   - VM Access (OS Login, SSH Keys, Manage Access)
10. [Firewall](#10-firewall)
11. [Advanced: Networking](#11-advanced-networking)
12. [Advanced: Disks](#12-advanced-disks)
13. [Advanced: Security (Shielded VM)](#13-advanced-security-shielded-vm)
14. [Advanced](#14-advanced)
    - Manage Tags and Labels
    - Description
    - Deletion Protection
    - Reservations
    - Automation (Startup Script)
    - Metadata
    - Data Encryption (Google-managed vs Cloud KMS, CMEK Revocation)
    - Sole-Tenancy
15. [Contoh Lengkap gcloud CLI](#15-contoh-lengkap-gcloud-cli)
16. [Lifecycle & Manage VM](#16-lifecycle--manage-vm)

---

## 1. Name

Nama unik untuk VM dalam project.

**Aturan:**
- Huruf kecil, angka, dan tanda hubung (`-`)
- Diawali huruf, diakhiri huruf atau angka
- Maksimal 63 karakter
- Harus unik di dalam zone yang sama

**Tips penamaan:**

```
Format: {app}-{role}-{env}
Contoh: ftlgym-web-prod, ftlgym-api-staging
```

---

## 2. Region & Zone

Lokasi fisik data center tempat VM akan berjalan.

### Region

| Region | Lokasi | Latency dari Indonesia |
|--------|--------|----------------------|
| `asia-southeast2` | **Jakarta, Indonesia** | Terendah (~1-5ms) |
| `asia-southeast1` | Singapura | Rendah (~10-20ms) |
| `asia-east1` | Taiwan | Sedang (~50ms) |
| `us-central1` | Iowa, USA | Tinggi (~200ms) |

### Zone (dalam 1 region ada beberapa zone)

| Zone | Keterangan |
|------|------------|
| `asia-southeast2-a` | Zone A di Jakarta |
| `asia-southeast2-b` | Zone B di Jakarta |
| `asia-southeast2-c` | Zone C di Jakarta |

```
╔═══════════════════════════════════════════════════════════╗
║  Pilih Region                                            ║
╠══════════════════╦════════════════════════════════════════╣
║  Dekat user      ║  + Latency rendah                     ║
║  (Jakarta)       ║  + Compliance data lokal               ║
║                  ║  - Harga sedikit lebih mahal dari US   ║
╠══════════════════╬════════════════════════════════════════╣
║  Jauh (US)       ║  + Harga lebih murah                   ║
║                  ║  - Latency tinggi                      ║
║                  ║  - Data keluar dari Indonesia           ║
╠══════════════════╬════════════════════════════════════════╣
║  Multi-zone      ║  + High availability                   ║
║  (MIG di 2 zone) ║  - Setup lebih kompleks                ║
║                  ║  - Biaya lebih besar (lebih banyak VM) ║
╚══════════════════╩════════════════════════════════════════╝
```

**Rekomendasi:**  
- User Indonesia → `asia-southeast2` (Jakarta)
- Project ftlgym → semua VM di `asia-southeast2-a`

---

## 3. Machine Configuration

### 3a. Machine Family

```
╔═══════════════════╦════════════════════════════════════════════╗
║  Family           ║  Keterangan                               ║
╠═══════════════════╬════════════════════════════════════════════╣
║  General Purpose  ║  Workload umum (web, app, dev)            ║
║  Compute Optimized║  CPU-intensive (encoding, gaming, HPC)    ║
║  Memory Optimized ║  RAM besar (SAP HANA, in-memory DB)       ║
║  Accelerator      ║  GPU (machine learning, rendering)        ║
║  Storage Optimized║  I/O tinggi (big data, analytics)         ║
╚═══════════════════╩════════════════════════════════════════════╝
```

| Family | Kelebihan | Kekurangan | Kapan pakai |
|--------|-----------|------------|-------------|
| **General Purpose** | Harga wajar, fleksibel | Tidak optimal untuk heavy workload spesifik | 90% use case: web, API, database ringan |
| **Compute Optimized** | Performa CPU tertinggi | Mahal, RAM terbatas | Video encoding, scientific computing, game server |
| **Memory Optimized** | RAM sangat besar (hingga 12 TB) | Sangat mahal | SAP HANA, in-memory database |
| **Accelerator** | Ada GPU/TPU | Sangat mahal, butuh driver | Machine learning, AI training |
| **Storage Optimized** | Local SSD sangat cepat | Data hilang saat VM mati | Big data processing, HDFS |

### 3b. Series (dalam General Purpose)

```
╔═══════════╦════════════════════════════════════════════════════╗
║  Series   ║  Detail                                           ║
╠═══════════╬════════════════════════════════════════════════════╣
║           ║  + Paling murah                                   ║
║  E2       ║  + Burst capability (bisa pakai CPU extra saat    ║
║           ║    idle)                                           ║
║           ║  + Otomatis pilih CPU terbaik yang tersedia        ║
║           ║  - Shared core untuk micro/small/medium            ║
║           ║  - Tidak support local SSD                         ║
║           ║  - Performa kurang konsisten (shared)             ║
╠═══════════╬════════════════════════════════════════════════════╣
║           ║  + Performa konsisten (dedicated core)            ║
║  N2       ║  + Support local SSD                               ║
║           ║  + Intel CPU terbaru                               ║
║           ║  + Bisa custom machine type                        ║
║           ║  - ~20% lebih mahal dari E2                        ║
╠═══════════╬════════════════════════════════════════════════════╣
║           ║  + Mirip N2 tapi pakai AMD CPU                    ║
║  N2D      ║  + Lebih murah ~10% dari N2                       ║
║           ║  + Core count lebih banyak per VM                  ║
║           ║  - Compatibility: beberapa software optimize untuk ║
║           ║    Intel                                           ║
╠═══════════╬════════════════════════════════════════════════════╣
║           ║  + Generasi terbaru (Emerald Rapids)              ║
║  N4       ║  + Performa per-core tertinggi di general purpose ║
║           ║  - Belum tersedia di semua region                  ║
╠═══════════╬════════════════════════════════════════════════════╣
║           ║  + Harga paling murah dari semua (lebih dari E2)  ║
║  T2D      ║  + AMD-based, efisien                             ║
║           ║  - Predefined sizes saja (tidak bisa custom)      ║
║           ║  - Fitur lebih terbatas                            ║
╚═══════════╩════════════════════════════════════════════════════╝
```

**Rekomendasi cepat:**

```
Dev/staging, budget ketat     → E2
Production web/API            → N2
Production, hemat sedikit     → N2D (AMD)
Production, perlu performa max→ N4 (kalau tersedia di region)
```

### 3c. Machine Type: Preset vs Custom

#### Preset

Ukuran yang sudah ditentukan Google.

```
╔═════════════════════╦══════╦═══════╦══════════════════════════╗
║  Preset             ║ vCPU ║  RAM  ║  Rasio CPU:RAM           ║
╠═════════════════════╬══════╬═══════╬══════════════════════════╣
║  e2-micro           ║ 0.25 ║ 1 GB  ║  Shared core             ║
║  e2-small           ║ 0.5  ║ 2 GB  ║  Shared core             ║
║  e2-medium          ║ 1    ║ 4 GB  ║  Shared core             ║
╠═════════════════════╬══════╬═══════╬══════════════════════════╣
║  e2-standard-2      ║ 2    ║ 8 GB  ║  1:4 (balanced)          ║
║  e2-standard-4      ║ 4    ║ 16 GB ║  1:4                     ║
║  e2-standard-8      ║ 8    ║ 32 GB ║  1:4                     ║
║  e2-standard-16     ║ 16   ║ 64 GB ║  1:4                     ║
╠═════════════════════╬══════╬═══════╬══════════════════════════╣
║  e2-highcpu-2       ║ 2    ║ 2 GB  ║  1:1 (CPU heavy)         ║
║  e2-highcpu-4       ║ 4    ║ 4 GB  ║  1:1                     ║
║  e2-highcpu-8       ║ 8    ║ 8 GB  ║  1:1                     ║
║  e2-highcpu-16      ║ 16   ║ 16 GB ║  1:1                     ║
╠═════════════════════╬══════╬═══════╬══════════════════════════╣
║  e2-highmem-2       ║ 2    ║ 16 GB ║  1:8 (RAM heavy)         ║
║  e2-highmem-4       ║ 4    ║ 32 GB ║  1:8                     ║
║  e2-highmem-8       ║ 8    ║ 64 GB ║  1:8                     ║
╚═════════════════════╩══════╩═══════╩══════════════════════════╝
```

| Sub-type | Kelebihan | Kekurangan | Kapan pakai |
|----------|-----------|------------|-------------|
| **micro/small/medium** | Sangat murah ($2-7/bln Spot) | Shared core, performa terbatas | Testing, dev, microservice kecil |
| **standard** | Balanced, cocok untuk kebanyakan app | Overkill kalau app hanya butuh CPU atau RAM saja | Web server, API, general app |
| **highcpu** | Banyak CPU, hemat biaya RAM | RAM kecil, tidak cocok untuk app memory-heavy | Web server (banyak request), encoding, build |
| **highmem** | RAM besar per vCPU | Mahal, overkill kalau tidak butuh RAM besar | Database, cache server, in-memory processing |

#### Custom

Kamu tentukan sendiri jumlah vCPU dan RAM.

```
╔══════════════════════════════════════════════╗
║  Custom Machine Type                        ║
╠═════════════════╦════════════════════════════╣
║  Kelebihan      ║  Kekurangan               ║
╠═════════════════╬════════════════════════════╣
║  Pas sesuai     ║  Sedikit lebih mahal       ║
║  kebutuhan      ║  (~5% premium vs preset)   ║
║                 ║                            ║
║  Tidak ada      ║  Harus tahu kebutuhan      ║
║  resource       ║  exact app kamu            ║
║  terbuang       ║                            ║
╚═════════════════╩════════════════════════════╝
```

**Aturan custom:**
- vCPU: 1, atau kelipatan 2 (2, 4, 6, 8, ...)
- RAM: kelipatan 256 MB
- RAM per vCPU: 0.5 GB - 8 GB (rentang flat untuk E2 custom; series lain seperti N1 punya rentang berbeda)

```bash
# gcloud: custom 6 vCPU, 12 GB RAM
gcloud compute instances create my-vm \
    --custom-cpu=6 --custom-memory=12GB \
    --custom-vm-type=e2 --zone=asia-southeast2-a
```

**Contoh di project ftlgym:**
- `ftlgym-mobile` pakai e2-custom (6 vCPU, 12 GB) — tidak ada preset e2 dengan 6 vCPU dan 12 GB
- `dbserver1` pakai n2-custom (12 vCPU, 24 GB) — n2-standard-8 terlalu kecil, n2-standard-16 terlalu besar

### 3d. CPU Platform

Pilihan CPU fisik yang dipakai. Biasanya "Automatic" (GCP pilihkan).

| Platform | Kelebihan | Kekurangan |
|----------|-----------|------------|
| **Automatic** (default) | GCP pilih yang terbaik tersedia, tidak perlu pusing | Bisa dapat CPU generasi lama |
| **Intel Cascade Lake** | Performa bagus, stabil | Generasi lama |
| **Intel Ice Lake** | Lebih cepat dari Cascade Lake | Tidak selalu tersedia |
| **Intel Sapphire Rapids** | Terbaru, performa terbaik | Hanya di series tertentu (C3) |
| **Intel Emerald Rapids** | Generasi setelah Sapphire Rapids | Hanya di series tertentu (N4) |
| **AMD EPYC Rome** | Harga lebih murah | Hanya di N2D/T2D |
| **AMD EPYC Milan** | Lebih baru dari Rome | Hanya di N2D/T2D |

**Rekomendasi:** Biarkan **Automatic** kecuali ada alasan spesifik (misal: benchmark, licensing yang terikat CPU).

### 3e. vCPUs to Core Ratio

Menentukan berapa vCPU per physical core.

| Opsi | Keterangan | Kelebihan | Kekurangan |
|------|------------|-----------|------------|
| **1 vCPU = 1 thread** (default) | Hyperthreading aktif, 1 core = 2 vCPU | Lebih murah per vCPU | Performance per vCPU lebih rendah |
| **1 vCPU = 1 core** | Tidak ada hyperthreading | Performa per vCPU lebih tinggi, lebih aman | Lebih mahal (bayar per core) |

**Kapan pakai 1 vCPU = 1 core:**
- Butuh performa konsisten per vCPU
- Security-sensitive (menghindari side-channel attacks)
- Licensing yang dihitung per core (Oracle, SQL Server)

**Rekomendasi:** Default (1 vCPU = 1 thread) untuk kebanyakan use case.

### 3f. GPU (opsional)

Menambahkan GPU ke VM (hanya di series tertentu).

| GPU | Kelebihan | Kekurangan | Kapan pakai |
|-----|-----------|------------|-------------|
| NVIDIA T4 | Murah, inference ML | Kurang kuat untuk training besar | ML inference, video encoding |
| NVIDIA L4 | Generasi baru T4, lebih kuat | Lebih mahal | ML inference, rendering |
| NVIDIA V100 | Training ML kuat | Mahal | ML training medium |
| NVIDIA A100 | Training ML tercepat | Sangat mahal ($1000+/bln) | Large-scale ML training |

**Rekomendasi:** Jangan tambah GPU kecuali memang butuh (ML, video processing). Biaya GPU sangat besar.

---

## 4. Provisioning Model

```
╔═══════════════════════════════════════════════════════════════════╗
║  Provisioning Model                                              ║
╠══════════════╦══════════════════════════════════════════════════╣
║              ║  VM berjalan selama kamu butuhkan                ║
║  Standard    ║  + Tidak akan di-terminate paksa oleh GCP       ║
║              ║  + Cocok untuk production                        ║
║              ║  - Harga penuh                                   ║
╠══════════════╬══════════════════════════════════════════════════╣
║              ║  VM bisa di-terminate kapan saja oleh GCP        ║
║  Spot        ║  + Diskon 60-91% (sangat murah)                  ║
║  (dulu:      ║  - GCP bisa ambil kembali kapan saja             ║
║  Preemptible)║  - Tidak cocok untuk production                  ║
║              ║  - Tidak ada SLA                                  ║
╚══════════════╩══════════════════════════════════════════════════╝
```

### Opsi Spot VM

| Setting | Pilihan | Keterangan |
|---------|---------|------------|
| **On VM termination** | **Stop** | VM di-stop (bisa start manual lagi) |
| | **Delete** | VM dihapus permanen |
| **Set a time limit** | Ya/Tidak | Batasi berapa lama VM boleh jalan |
| **Gracefully shut down** | Ya/Tidak | Kirim ACPI signal sebelum terminate (VM bisa cleanup) |

**Perbandingan harga (contoh e2-medium, Jakarta):**

```
Standard : ~$37/bulan
Spot     : ~$7/bulan  (hemat ~81%)
```

**Kapan pakai Spot:**
- Batch processing (bisa diulang kalau gagal)
- CI/CD build (build ulang tidak masalah)
- Data processing (checkpoint bisa di-resume)
- Dev/testing

**Jangan pakai Spot untuk:**
- Production web server
- Database
- Apa pun yang harus always-on

---

## 5. Confidential VM

> **Note:** Di Console, Confidential VM ada di sidebar **Security**. Lihat [Section 9. Security](#9-security) untuk penjelasan lengkap beserta layout Console.

VM dengan enkripsi RAM (memory encryption). Data di RAM tetap terenkripsi bahkan dari Google.

| Opsi | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Off** (default) | Tidak ada overhead performa | RAM tidak terenkripsi (standar cloud) |
| **On** | Data di RAM terenkripsi (AMD SEV) | ~5% performance hit, tersedia di N2D/C2D/C3D/C4D series, sedikit lebih mahal |

**Kapan pakai:**
- Data sangat sensitif (financial, healthcare)
- Compliance requirement (HIPAA, PCI-DSS)
- Multi-tenant environment yang butuh isolasi ketat

**Rekomendasi:** Off untuk kebanyakan use case. Aktifkan hanya kalau ada compliance requirement.

---

## 6. Container

Langsung deploy container Docker ke VM tanpa perlu install Docker sendiri.

| Opsi | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Tidak pakai** (default) | Setup manual, kontrol penuh | Harus install Docker sendiri |
| **Deploy container** | Otomatis install Docker & jalankan container | Hanya 1 container per VM, kurang fleksibel |

```bash
# gcloud: buat VM yang langsung jalankan container
gcloud compute instances create-with-container my-container-vm \
    --container-image=gcr.io/my-project/my-app:latest \
    --zone=asia-southeast2-a
```

**Rekomendasi:** Kalau butuh multi-container, lebih baik install Docker/Podman sendiri, atau pakai **Cloud Run / GKE**.

---

## 7. Boot Disk

### 7a. Operating System

| OS | Kelebihan | Kekurangan | Kapan pakai |
|----|-----------|------------|-------------|
| **Ubuntu 20.04 LTS** | Stabil, support sampai 2025 | Agak tua, paket kurang update | Legacy app, sudah proven |
| **Ubuntu 22.04 LTS** | Modern, support sampai 2027 | Beberapa tool lama mungkin tidak kompatibel | Default pilihan (recommended) |
| **Ubuntu 24.04 LTS** | Terbaru, paket paling update | Beberapa software belum support | Project baru, butuh fitur terbaru |
| **Debian 11** | Sangat stabil, minimal | Paket lebih tua | Server yang butuh stabilitas max |
| **Debian 12** | Stabil + lebih modern | Komunitas lebih kecil dari Ubuntu | Server minimalis |
| **Rocky Linux 9** | Pengganti CentOS, RHEL-compatible | Komunitas masih berkembang | Migrasi dari CentOS |
| **Windows Server 2022** | Support .NET, Active Directory | Lisensi mahal (tambahan $) | Aplikasi Windows-only |
| **Container-Optimized OS** | Minimal, aman, untuk container | Hanya untuk Docker workload | Docker/container-only VM |

**Lisensi:** Linux = gratis. Windows = tambah biaya lisensi.

```bash
# List OS images yang tersedia
gcloud compute images list --project=ubuntu-os-cloud --no-standard-images
gcloud compute images list --project=debian-cloud --no-standard-images
gcloud compute images list --project=rocky-linux-cloud --no-standard-images
```

### 7b. Boot Disk Type

| Type | IOPS | Throughput | Harga/GB/bln | Kelebihan | Kekurangan |
|------|------|-----------|-------------|-----------|------------|
| **pd-standard** (HDD) | ~0.75/GB | ~0.12 MB/s/GB | ~$0.048 | Paling murah | Lambat, boot time lama |
| **pd-balanced** | ~6/GB | ~0.28 MB/s/GB | ~$0.108 | Balance harga & performa | Sedang di semua aspek |
| **pd-ssd** | ~30/GB | ~0.48 MB/s/GB | ~$0.187 | Cepat, boot cepat | 2x harga pd-balanced |
| **pd-extreme** | Custom | Custom | ~$0.125+ | IOPS tertinggi | Sangat mahal, hanya N2 (shape 64+ vCPU), M2, M3 |

```
╔═════════════════════════════════════════════════════════╗
║  Pilih Boot Disk Type                                  ║
╠═══════════════╦════════════════════════════════════════╣
║  Dev/testing  ║  pd-standard (murah, lambat gpp)       ║
║  Production   ║  pd-balanced (default, recommended)    ║
║  Database     ║  pd-ssd (butuh I/O tinggi)             ║
║  SAP/Oracle   ║  pd-extreme (max IOPS)                 ║
╚═══════════════╩════════════════════════════════════════╝
```

### 7c. Boot Disk Size

| Size | Kelebihan | Kekurangan |
|------|-----------|------------|
| **10 GB** | Minimum cost | Cepat penuh, terutama kalau install banyak software |
| **20 GB** | Cukup untuk most apps | Mungkin kurang untuk app besar + logs |
| **50 GB** | Aman untuk production | Lebih mahal |
| **100+ GB** | Banyak ruang untuk logs, temp files | Mahal, mungkin overkill |

**Penting:** IOPS dan throughput disk **berbanding lurus dengan ukuran disk**. Disk 100 GB SSD lebih cepat dari disk 10 GB SSD.

**Rekomendasi:**
- Minimal 20 GB untuk boot disk
- Pisahkan data ke disk terpisah (attach additional disk)
- Boot disk: 20-50 GB, Data disk: sesuai kebutuhan

### 7d. Deletion Rule

Apa yang terjadi pada boot disk saat VM dihapus.

| Opsi | Keterangan | Kelebihan | Kekurangan |
|------|------------|-----------|------------|
| **Delete boot disk** (default) | Disk ikut terhapus saat VM delete | Bersih, tidak ada orphan disk | Data hilang permanen |
| **Keep boot disk** | Disk tetap ada saat VM delete | Bisa restore/attach ke VM lain | Bayar storage terus, harus cleanup manual |

**Rekomendasi:** Default (delete) untuk VM non-critical. Keep untuk VM yang penting (biar bisa recovery).

---

## 8. Data Protection

> **Console:** Create an instance → sidebar **Data protection**

Section ini mengatur **backup** dan **replication** untuk disk VM. Terlihat di sidebar wizard Create VM antara "OS and storage" dan "Networking".

```
┌───────────────────────────────────────────────────────────────────────┐
│  Data protection                                                      │
│  Protect your data against failures and errors. Learn more ↗          │
│                                                                       │
│  ━━━━━━━━ Backups ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  You can automate recurring backups through a backup plan or          │
│  snapshot schedule. Learn more ↗                                      │
│                                                                       │
│  ○ Backup plan                                                        │
│    Back up the full VM. These immutable backups are secured by        │
│    backup vault against accidental or malicious deletion. Managed     │
│    by Backup and DR Service, a separate service from Compute          │
│    Engine with independent certifications and accreditation.          │
│    Learn more ↗                                                       │
│                                                                       │
│  ● Snapshot schedules                                                 │
│    Back up disks only. This provides foundational protection at       │
│    a lower cost. Learn more ↗                                         │
│                                                                       │
│    Select or create a snapshot schedule *                              │
│    ┌──────────────────────────────────────────────────────────────┐   │
│    │ default-schedule-1                                         ▼│   │
│    └──────────────────────────────────────────────────────────────┘   │
│    Every day, starts between 6:00 AM and 7:00 AM,                     │
│    Storage location: us (United States)                               │
│                                                                       │
│  ○ No backups                                                         │
│    Neither VM nor disks will be backed up. If data is deleted or      │
│    corrupted for any reason, you won't be able to recover it.         │
│                                                                       │
│  ━━━━━━━━ Replication ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  ☐ Use synchronous replication                                        │
│    Switch to a regional disk, which is a single disk with storage     │
│    replicas in two zones. Enables zero RPO (no data loss) and VM      │
│    attachment in two zones. Learn more ↗                               │
│                                                                       │
│  ☐ Use asynchronous replication                                       │
│    Replicate data from one disk to a secondary disk in another        │
│    region for cross-region disaster recovery. Learn more ↗             │
│                                                                       │
│  ☐ Exclude boot disk from data replication                            │
│    Save costs by only replicating data in non-boot disks.             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 8a. Backups

Ada 3 pilihan backup saat create VM:

#### Backup Plan

Full VM backup menggunakan **Backup and DR Service** (layanan terpisah dari Compute Engine).

| Aspek | Detail |
|-------|--------|
| **Apa yang di-backup** | Seluruh VM (semua disk + metadata) |
| **Tipe backup** | **Immutable** — tidak bisa dihapus/dimodifikasi sebelum retention period habis |
| **Perlindungan** | Tersimpan di **Backup Vault** — terlindungi dari accidental/malicious deletion |
| **Managed oleh** | Backup and DR Service (sertifikasi independen) |

| Kelebihan | Kekurangan |
|-----------|------------|
| Full VM recovery (disk + config) | Biaya lebih tinggi dari snapshot |
| Immutable — ransomware-proof | Butuh setup Backup and DR Service |
| Backup vault protection | Lebih lambat dari snapshot |
| Independent certifications (compliance) | Overkill untuk dev/testing |

**Kapan pakai:**
- Production VMs yang critical
- Compliance requirement (immutable backup)
- Butuh full VM recovery (bukan hanya disk)

#### Snapshot Schedules

Backup **disk saja** secara otomatis dengan jadwal yang ditentukan.

| Aspek | Detail |
|-------|--------|
| **Apa yang di-backup** | Disk saja (bukan full VM) |
| **Tipe** | Incremental — hanya perubahan yang disimpan |
| **Biaya** | Lebih murah dari Backup Plan |
| **Dropdown** | Pilih schedule yang sudah ada atau buat baru |

| Kelebihan | Kekurangan |
|-----------|------------|
| Biaya rendah (incremental) | Hanya disk, bukan full VM |
| Bisa pilih schedule yang sudah ada | Tidak immutable (bisa dihapus) |
| Foundational protection | Recovery lebih manual |
| Cepat dan ringan | — |

**Info schedule:**
```
default-schedule-1:
  Frequency: Every day
  Start time: between 6:00 AM and 7:00 AM
  Storage location: us (United States)

  ⚠ Perhatikan storage location!
  Jika VM di asia-southeast2 (Jakarta), pertimbangkan
  buat schedule baru dengan location: asia
  untuk latency dan compliance yang lebih baik.
```

**Kapan pakai:**
- Sebagian besar production VMs
- Budget-conscious tapi tetap butuh backup
- Disk data yang penting

#### No Backups

| Kelebihan | Kekurangan |
|-----------|------------|
| Tidak ada biaya backup | Data hilang = hilang selamanya |
| Tidak perlu setup | Tidak ada recovery option |

**Kapan pakai:**
- Dev/testing VMs (data tidak penting)
- Stateless VMs (data di Cloud SQL/Cloud Storage)
- Ephemeral workloads (batch processing)

### Perbandingan 3 Opsi Backup

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                  │  Backup Plan     │  Snapshot         │  No Backups      │
│                  │                  │  Schedules        │                  │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Yang di-backup   │ Full VM          │ Disk saja         │ Tidak ada        │
│ Immutable        │ ✅ Ya            │ ❌ Tidak          │ —                │
│ Biaya            │ $$$ Tinggi       │ $ Rendah          │ Gratis           │
│ Recovery         │ Full VM restore  │ Disk restore      │ Tidak bisa       │
│ Compliance       │ ✅ Sertifikasi   │ ⚠ Basic          │ ❌               │
│ Cocok untuk      │ Critical prod    │ General prod      │ Dev/stateless    │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

### 8b. Replication

Opsi untuk mereplikasi disk ke zone/region lain untuk **disaster recovery**.

#### Use Synchronous Replication

Mengubah disk menjadi **regional disk** — satu disk dengan replika di **2 zones** dalam region yang sama.

| Aspek | Detail |
|-------|--------|
| **Cara kerja** | Write ke disk → otomatis di-replicate ke zone kedua secara sinkron |
| **RPO** | **Zero** (Recovery Point Objective = 0, tidak ada data loss) |
| **Disk type** | Berubah menjadi **regional persistent disk** |
| **VM attachment** | Bisa di-attach ke VM di kedua zones |

| Kelebihan | Kekurangan |
|-----------|------------|
| Zero data loss (RPO = 0) | Biaya 2x lipat (replika di 2 zones) |
| Failover cepat ke zone lain | Hanya dalam 1 region (bukan cross-region) |
| VM bisa attach dari 2 zones | Write latency sedikit lebih tinggi |
| Otomatis — tidak perlu manage | Tidak semua disk type support |

```
Synchronous Replication Flow:

  VM (zone-a)                    VM (zone-b) ← standby/failover
       │                              │
       ▼                              ▼
  ┌──────────┐    sync write    ┌──────────┐
  │  Disk    │ ═══════════════► │  Replica │
  │  (zone-a)│ ◄═══════════════ │  (zone-b)│
  └──────────┘                  └──────────┘
       │                              │
       └──── Regional Persistent Disk ┘
              (1 disk, 2 zones)

  Zone-a failure?
  → VM di zone-b bisa langsung attach disk ✅
  → Zero data loss ✅
```

**Kapan pakai:**
- Database disk (zero data loss critical)
- Production apps yang butuh zone-level HA
- Stateful workloads

#### Use Asynchronous Replication

Mereplikasi disk ke **region lain** untuk cross-region disaster recovery.

| Aspek | Detail |
|-------|--------|
| **Cara kerja** | Write ke disk → replicate ke secondary disk di region lain secara async |
| **RPO** | > 0 (ada sedikit delay, biasanya detik–menit) |
| **Target** | Secondary disk di **region berbeda** |
| **Use case** | Cross-region DR (bukan hanya cross-zone) |

| Kelebihan | Kekurangan |
|-----------|------------|
| Cross-region disaster recovery | RPO > 0 (beberapa detik data bisa hilang) |
| Proteksi dari regional failure | Biaya tinggi (cross-region transfer + storage) |
| Manual failover ke region lain | Setup lebih kompleks |
| Compliance (geo-redundancy) | Latency replication tergantung jarak region |

```
Asynchronous Replication Flow:

  VM (asia-southeast2)              Standby (us-central1)
       │                                  │
       ▼                                  ▼
  ┌──────────┐    async replicate   ┌──────────┐
  │  Primary │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ► │ Secondary│
  │  Disk    │                      │  Disk    │
  │  (Jakarta)│                     │  (Iowa)  │
  └──────────┘                      └──────────┘

  Seluruh region Jakarta down?
  → Failover ke us-central1
  → Beberapa detik data mungkin hilang (RPO > 0)
  → Tapi VM bisa running di region lain ✅
```

**Kapan pakai:**
- Mission-critical apps yang butuh cross-region DR
- Compliance requirement (data harus ada di 2 region)
- Apps yang tidak boleh down meskipun seluruh region mati

#### Exclude Boot Disk from Data Replication

| Aspek | Detail |
|-------|--------|
| **Fungsi** | Hanya replicate **data disks**, skip boot disk |
| **Alasan** | Boot disk bisa di-recreate dari image, tidak perlu replicate |
| **Hemat** | Mengurangi biaya replication (boot disk biasanya 10-50 GB) |

| Kelebihan | Kekurangan |
|-----------|------------|
| Hemat biaya replication | Boot disk tidak ter-replicate |
| Boot disk bisa recreate dari image | Recovery sedikit lebih lama (harus buat VM baru) |
| Data disk yang penting tetap aman | — |

**Rekomendasi:** Centang jika boot disk kamu standar (OS image biasa) dan data ada di disk terpisah.

### Perbandingan Synchronous vs Asynchronous

```
┌──────────────────┬──────────────────────┬──────────────────────┐
│                  │  Synchronous         │  Asynchronous        │
├──────────────────┼──────────────────────┼──────────────────────┤
│ Scope            │ Cross-zone (1 region)│ Cross-region         │
│ RPO              │ 0 (zero data loss)   │ > 0 (detik–menit)   │
│ Latency impact   │ Sedikit              │ Minimal (async)      │
│ Biaya            │ 2x disk cost         │ Disk + network egress│
│ Failover         │ Fast (same region)   │ Manual (diff region) │
│ Proteksi dari    │ Zone failure         │ Region failure       │
│ Cocok untuk      │ Database, stateful   │ Mission-critical DR  │
└──────────────────┴──────────────────────┴──────────────────────┘
```

### Flow Rekomendasi Data Protection

```
Apakah VM ini production/critical?
│
├── TIDAK (dev/testing/stateless)
│   └── No backups ✅
│       └── Data di Cloud SQL/Storage? → aman, tidak perlu backup VM
│
├── YA, production biasa
│   └── Snapshot schedules ✅
│       └── Buat schedule dengan location sesuai region VM
│       └── Tambah synchronous replication jika butuh zone HA
│
├── YA, critical + compliance
│   └── Backup plan ✅
│       └── Immutable backup di Backup Vault
│       └── Tambah synchronous replication
│       └── Pertimbangkan asynchronous replication untuk cross-region DR
│
└── YA, mission-critical (tidak boleh down)
    └── Backup plan + Synchronous + Asynchronous ✅
        └── Full protection: backup + zone HA + cross-region DR
        └── Exclude boot disk jika pakai standard OS image
```

---

## 9. Security

> **Console:** Create an instance → sidebar **Security**

Section "Security" di sidebar wizard Create VM menggabungkan semua setting keamanan VM: identity, confidential computing, shielded VM, dan SSH access.

### Console: Halaman Security

```
┌───────────────────────────────────────────────────────────────────────┐
│  Security                                                             │
│                                                                       │
│  ━━━━━━━━ Identity and API access ⓘ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  Service accounts ⓘ                                                   │
│  ┌─ Service account ──────────────────────────────────────────────┐   │
│  │ Compute Engine default service account                       ▼│   │
│  └────────────────────────────────────────────────────────────────┘   │
│  ⓘ To access instances with this service account you need to add     │
│    the Service Account User role: roles/iam.serviceAccountUser.       │
│    Learn more ↗                                                       │
│                                                                       │
│  Access scopes ⓘ                                                      │
│  ● Allow default access                                               │
│  ○ Allow full access to all Cloud APIs                                │
│  ○ Set access for each API                                            │
│                                                                       │
│  ━━━━━━━━ Confidential VM service ⓘ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  ◉ Confidential Computing is disabled on this VM instance             │
│                                                                       │
│  [Enable]                                                             │
│                                                                       │
│  ━━━━━━━━ Shielded VM ⓘ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Turn on all settings for the most secure configuration.              │
│                                                                       │
│  ☐ Turn on Secure Boot ⓘ                                             │
│  ☑ Turn on vTPM ⓘ                                                    │
│  ☑ Turn on Integrity Monitoring ⓘ                                    │
│                                                                       │
│  ━━━━━━━━ VM access ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Manage how users connect to the VM                                   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ ✅ By default, when you connect to a VM using this console    │   │
│  │    or gcloud, your SSH keys are generated automatically.       │   │
│  │    Learn more ↗                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ▽ Manage access                                                      │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│  [Create]  Cancel  ☐ Equivalent code                                  │
└───────────────────────────────────────────────────────────────────────┘
```

---

### 9a. Identity and API Access

#### Service Accounts

Menentukan **service account** yang digunakan VM untuk mengakses GCP APIs.

```
  Service account dropdown:
  ┌────────────────────────────────────────────────────────────┐
  │ Compute Engine default service account                   ▼│
  ├────────────────────────────────────────────────────────────┤
  │ Compute Engine default service account                     │ ← default
  │ my-custom-sa@project.iam.gserviceaccount.com               │ ← custom SA
  │ No service account                                         │ ← tanpa SA
  └────────────────────────────────────────────────────────────┘
```

| Opsi | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Compute Engine default service account** | Otomatis ada, tidak perlu setup | Permission terlalu luas (Project Editor), risiko keamanan |
| **Custom service account** | Least privilege, lebih aman | Harus buat dan manage sendiri |
| **No service account** | VM tidak bisa akses GCP API | Aman, tapi sangat terbatas |

**Info penting dari Console:**
```
⚠ "To access instances with this service account you need to add
   the Service Account User role: roles/iam.serviceAccountUser."

  Artinya: User yang ingin SSH ke VM yang menggunakan service account,
  harus punya role `roles/iam.serviceAccountUser` pada SA tersebut.

  Tanpa role ini → error saat mencoba connect ke VM.
```

**Best practice:** Selalu buat custom service account dengan permission minimum.

```bash
# Buat service account khusus
gcloud iam service-accounts create sa-ftlgymweb \
    --display-name="Service Account for ftlgymweb"

# Buat VM dengan SA
gcloud compute instances create my-vm \
    --service-account=sa-ftlgymweb@PROJECT_ID.iam.gserviceaccount.com \
    --scopes=cloud-platform
```

#### Access Scopes

**Access scopes** membatasi API mana yang bisa diakses VM — sebagai **filter tambahan** di atas IAM roles.

```
  Access scopes:
  ● Allow default access         ← read storage, write logging/monitoring
  ○ Allow full access to all Cloud APIs  ← semua API (batasi via IAM)
  ○ Set access for each API      ← pilih per API (granular)
```

| Scope | Apa yang diizinkan | Kapan pakai |
|-------|-------------------|-------------|
| **Allow default access** | Read Cloud Storage, write Logging & Monitoring, read-only Compute | VM yang hanya butuh basic access |
| **Allow full access to all Cloud APIs** | Semua GCP API (actual permission tetap dibatasi IAM roles SA) | **Recommended** — kontrol penuh via IAM |
| **Set access for each API** | Pilih per API: Compute, Storage, BigQuery, dll | Jarang dipakai — IAM roles lebih fleksibel |

```
Bagaimana Access Scopes bekerja:

  Request dari VM ke GCP API
       │
       ▼
  ┌──────────────┐     ┌──────────────┐
  │  Access Scope│────►│  IAM Role    │────► ✅ Allowed
  │  (filter 1)  │     │  (filter 2)  │      ATAU
  └──────────────┘     └──────────────┘      ❌ Denied

  Kedua filter harus pass!

  Contoh:
  Scope = "Allow default access" (read-only storage)
  IAM Role SA = roles/storage.admin (read + write)
  Result = Read ONLY (scope membatasi ke read)

  Scope = "Allow full access" (semua API)
  IAM Role SA = roles/storage.objectViewer (read-only)
  Result = Read ONLY (IAM membatasi ke read)

  Rekomendasi: Set scope ke "full access", kontrol via IAM saja ✅
```

**Rekomendasi:** Pilih **"Allow full access to all Cloud APIs"**, lalu batasi lewat **IAM roles** di service account. Lebih mudah di-manage dan lebih fleksibel.

---

### 9b. Confidential VM Service

> Juga dijelaskan di [Section 5](#5-confidential-vm).

```
  Confidential VM service ⓘ
  ┌────────────────────────────────────────────────────────────────┐
  │ ◉ Confidential Computing is disabled on this VM instance      │
  └────────────────────────────────────────────────────────────────┘
  [Enable]
```

| Opsi | Keterangan |
|------|------------|
| **Disabled** (default) | Tidak ada enkripsi RAM — standar cloud computing |
| **[Enable]** | Mengaktifkan Confidential Computing — RAM terenkripsi via AMD SEV/TDX |

**Saat klik [Enable]:**
```
  ⚠ Persyaratan:
  ├── Machine type harus N2D/C2D/C3D/C4D (AMD) — wajib AMD SEV support
  ├── OS image harus support Confidential VM
  ├── Biaya sedikit lebih tinggi (~5%)
  └── Performance hit ~5% (overhead enkripsi RAM)
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Data di RAM terenkripsi | Performance hit ~5% |
| Proteksi dari cloud provider | Hanya series tertentu (N2D/C2D/C3D/C4D, AMD) |
| Compliance (HIPAA, PCI-DSS) | Sedikit lebih mahal |
| Defense-in-depth | Tidak semua OS support |

**Rekomendasi:** Biarkan disabled kecuali ada compliance requirement.

---

### 9c. Shielded VM

```
  Shielded VM ⓘ
  Turn on all settings for the most secure configuration.

  ☐ Turn on Secure Boot ⓘ
  ☑ Turn on vTPM ⓘ
  ☑ Turn on Integrity Monitoring ⓘ
```

| Checkbox | Default | Fungsi | Detail |
|----------|---------|--------|--------|
| **Turn on Secure Boot** | ☐ Off | Hanya boot software yang ter-sign (verified) | Mencegah rootkit dan bootkit — pastikan OS image support |
| **Turn on vTPM** | ☑ On | Virtual Trusted Platform Module | Menyimpan keys/secrets secara aman, memverifikasi boot integrity |
| **Turn on Integrity Monitoring** | ☑ On | Monitor apakah boot sequence berubah | Alert jika boot components dimodifikasi (tanda tampering) |

| Kelebihan | Kekurangan |
|-----------|------------|
| Proteksi dari rootkit dan bootkit | Secure Boot bisa block driver custom/unsigned |
| Compliance requirement (PCI, HIPAA) | Sedikit lebih lambat boot |
| Integrity alert jika ada perubahan | Beberapa OS custom tidak support Secure Boot |
| vTPM untuk key storage aman | — |

```
Shielded VM Protection Flow:

  VM Boot
    │
    ▼
  ┌──────────────┐   Secure Boot ON?
  │ UEFI Boot    │──── Ya → Verifikasi signature semua boot components
  └──────────────┘         │
                           ├── Valid → Lanjut boot ✅
                           └── Invalid → Boot GAGAL ❌ (rootkit blocked)
    │
    ▼
  ┌──────────────┐   vTPM ON?
  │ Boot         │──── Ya → Simpan measurement boot sequence ke vTPM
  │ Components   │         → Bisa diaudit nanti
  └──────────────┘
    │
    ▼
  ┌──────────────┐   Integrity Monitoring ON?
  │ OS Running   │──── Ya → Bandingkan boot measurement dengan baseline
  └──────────────┘         │
                           ├── Match → VM integrity OK ✅
                           └── Mismatch → Alert! Boot tampering detected ⚠
```

**Rekomendasi:**
- **vTPM** dan **Integrity Monitoring** → biarkan **On** (default) ✅
- **Secure Boot** → aktifkan jika pakai standard OS image (Debian, Ubuntu, Windows). Jangan aktifkan jika pakai custom kernel atau unsigned drivers.

---

### 9d. VM Access

```
  VM access
  Manage how users connect to the VM

  ┌────────────────────────────────────────────────────────────────┐
  │ ✅ By default, when you connect to a VM using this console    │
  │    or gcloud, your SSH keys are generated automatically.       │
  │    Learn more ↗                                                │
  └────────────────────────────────────────────────────────────────┘

  ▽ Manage access
```

**Penjelasan:** Secara default, saat kamu klik **SSH** di Console atau pakai `gcloud compute ssh`, GCP **otomatis generate SSH key pair** dan inject public key ke VM. Kamu tidak perlu manage SSH keys secara manual.

#### Manage Access (Expandable)

Klik **"Manage access"** untuk expand opsi tambahan:

```
  ▽ Manage access

  ┌────────────────────────────────────────────────────────────────┐
  │                                                                │
  │  Control VM access through IAM permissions                     │
  │  ☐ Enable OS Login                                             │
  │                                                                │
  │  ── OR ──                                                      │
  │                                                                │
  │  Add manually generated SSH keys                               │
  │                                                                │
  │  SSH Keys                                                      │
  │  ☐ Block project-wide SSH keys                                 │
  │                                                                │
  │  [+ ADD ITEM]                                                  │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
```

#### OS Login

| Opsi | Keterangan |
|------|------------|
| **☐ Enable OS Login** (off) | SSH keys dikelola secara tradisional (metadata SSH keys) |
| **☑ Enable OS Login** (on) | SSH access dikelola via **IAM roles** — tidak perlu manage SSH keys |

| | OS Login OFF (default) | OS Login ON |
|---|---|---|
| **SSH key management** | Manual — metadata SSH keys | Otomatis via IAM |
| **User identity** | Berdasarkan SSH key | Berdasarkan Google account |
| **Access control** | Siapapun yang punya key | Hanya user dengan IAM role `roles/compute.osLogin` |
| **2FA support** | Tidak | Ya (jika diaktifkan) |
| **Audit** | Sulit track siapa login | Google Cloud Audit Log |
| **Best practice** | Dev/testing | **Production** ✅ |

**OS Login Roles:**

| Role | Akses |
|------|-------|
| `roles/compute.osLogin` | SSH sebagai user biasa (non-root) |
| `roles/compute.osAdminLogin` | SSH sebagai root/sudo |

```
OS Login Flow:

  User: gcloud compute ssh my-vm
       │
       ├── OS Login OFF:
       │   │  Cek metadata SSH keys
       │   │  Key match? → Login ✅
       │   └── Key tidak match? → Denied ❌
       │
       └── OS Login ON:
           │  Cek IAM: punya roles/compute.osLogin?
           │  Ya → Login ✅ (menggunakan Google identity)
           └── Tidak → Denied ❌
```

#### SSH Keys (Manual)

Jika OS Login **OFF**, kamu bisa manage SSH keys:

| Opsi | Fungsi |
|------|--------|
| **Block project-wide SSH keys** | Jangan izinkan SSH keys dari project metadata — hanya keys yang di-add spesifik ke VM ini |
| **[+ ADD ITEM]** | Tambah SSH public key secara manual untuk user tertentu |

```
  [+ ADD ITEM] → paste SSH public key:

  ┌────────────────────────────────────────────────────────────────┐
  │ ssh-rsa AAAAB3NzaC1yc2EAAAA... user@example.com               │
  └────────────────────────────────────────────────────────────────┘
```

| Setting | Kelebihan | Kekurangan |
|---------|-----------|------------|
| **Project-wide SSH keys** (default) | Satu set keys berlaku untuk semua VM | Kurang granular — semua VM bisa diakses |
| **Block project-wide + add per-VM** | Granular — setiap VM punya keys sendiri | Lebih ribet manage |
| **OS Login (recommended)** | IAM-based, audit trail, 2FA | Perlu setup IAM roles |

#### Perbandingan Metode SSH Access

```
┌───────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                   │  Auto SSH Keys   │  Manual SSH Keys │  OS Login        │
│                   │  (default)       │                  │                  │
├───────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Setup             │ Tidak perlu      │ Generate & paste │ Enable + IAM     │
│ Key management    │ Otomatis         │ Manual           │ Via IAM          │
│ Security          │ ⚠ Medium        │ ⚠ Medium        │ ✅ Tinggi        │
│ Audit trail       │ Basic            │ Basic            │ ✅ Full (Audit   │
│                   │                  │                  │    Log)          │
│ 2FA               │ ❌               │ ❌               │ ✅ Optional      │
│ Cocok untuk       │ Dev/testing      │ Legacy/specific  │ Production ✅    │
│                   │                  │ user access      │                  │
└───────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

**Rekomendasi:**
- **Dev/testing** → biarkan default (auto SSH keys) — paling mudah
- **Production** → aktifkan **OS Login** untuk centralized access control via IAM
- Jika harus manual → centang **"Block project-wide SSH keys"** dan add keys per-VM untuk granular control

---

## 10. Firewall

Opsi cepat untuk allow traffic HTTP/HTTPS.

| Checkbox | Apa yang terjadi | Kapan centang |
|----------|------------------|---------------|
| **Allow HTTP traffic** | Buat firewall rule allow tcp:80 dari 0.0.0.0/0 | VM serve website via HTTP |
| **Allow HTTPS traffic** | Buat firewall rule allow tcp:443 dari 0.0.0.0/0 | VM serve website via HTTPS |
| **Tidak dicentang** | Tidak ada rule otomatis | VM di belakang Load Balancer (traffic lewat LB, bukan langsung) |

**Rekomendasi:**
- VM di belakang Load Balancer → **jangan centang** (buat firewall rule manual yang lebih spesifik)
- VM standalone web server dengan external IP → centang sesuai kebutuhan

---

## 11. Advanced: Networking

### Network Interface

| Setting | Pilihan | Keterangan |
|---------|---------|------------|
| **Network** | VPC yang dipilih | `default` atau custom VPC |
| **Subnet** | Subnet dalam VPC | Menentukan IP range |
| **Primary internal IP** | Ephemeral / Static | Ephemeral berubah saat restart |
| **External IP** | None / Ephemeral / Static | Akses dari internet |

### External IP

```
╔═══════════════╦════════════════════════════════════════╗
║  Opsi         ║  Detail                               ║
╠═══════════════╬════════════════════════════════════════╣
║  None         ║  + Lebih aman (tidak bisa diakses      ║
║               ║    langsung dari internet)              ║
║               ║  + Gratis                               ║
║               ║  - Butuh IAP/NAT untuk akses keluar    ║
║               ║  - Butuh LB untuk serve traffic         ║
╠═══════════════╬════════════════════════════════════════╣
║  Ephemeral    ║  + Bisa akses internet langsung         ║
║               ║  + Gratis (selama VM running)           ║
║               ║  - IP berubah saat restart               ║
║               ║  - Kurang aman (exposed)                ║
╠═══════════════╬════════════════════════════════════════╣
║  Static       ║  + IP tetap, tidak berubah              ║
║               ║  + Bisa dipakai untuk DNS A record       ║
║               ║  - Bayar ~$3/bln (bahkan saat tidak     ║
║               ║    dipakai)                              ║
║               ║  - Kurang aman (exposed)                ║
╚═══════════════╩════════════════════════════════════════╝
```

**Rekomendasi:** `None` (tanpa external IP). Akses via Load Balancer atau IAP.

### Network Tags

Tag untuk target firewall rules.

```bash
# Contoh: VM dengan tag lb-backend dan allow-health-checks
--tags=lb-backend,allow-health-checks

# Firewall rule yang target tag tersebut:
gcloud compute firewall-rules create allow-lb \
    --target-tags=lb-backend \
    --source-ranges=10.0.10.0/24 \
    --rules=tcp:80
```

---

## 12. Advanced: Disks

### Additional Disk

Bisa attach disk tambahan selain boot disk.

| Setting | Pilihan | Keterangan |
|---------|---------|------------|
| **Tipe** | pd-standard / pd-balanced / pd-ssd | Sama seperti boot disk |
| **Size** | 10 GB - 64 TB | Tergantung kebutuhan data |
| **Mode** | Read/Write / Read-only | Read-only bisa di-share ke banyak VM |
| **Deletion rule** | Delete / Keep saat VM dihapus | Keep kalau data penting |

**Kapan pakai additional disk:**
- Data database (pisahkan dari OS)
- Log files (supaya boot disk tidak penuh)
- Shared storage (read-only ke banyak VM)

### Local SSD

| Kelebihan | Kekurangan |
|-----------|------------|
| IOPS sangat tinggi (900K+) | Data **hilang** saat VM stop/delete |
| Latency sangat rendah | Tidak bisa snapshot/backup |
| Cocok untuk cache/temp | Fixed size (375 GB per disk) |

**Kapan pakai:** Cache, temporary data, swap space.

---

## 13. Advanced: Security (Shielded VM)

> **Note:** Di Console, Shielded VM ada di sidebar **Security**. Lihat [Section 9c. Shielded VM](#9c-shielded-vm) untuk penjelasan lengkap beserta layout Console dan flow diagram.

| Fitur | Default | Keterangan |
|-------|---------|------------|
| **Secure Boot** | Off | Hanya boot software yang signed. Mencegah rootkit |
| **vTPM** | On | Virtual Trusted Platform Module untuk integritas |
| **Integrity Monitoring** | On | Cek apakah boot sequence berubah |

**Rekomendasi:** Biarkan vTPM dan Integrity Monitoring **On**. Aktifkan Secure Boot kalau pakai standard OS image.

---

## 14. Advanced

> **Console:** Create an instance → sidebar **Advanced**

Section "Advanced" menggabungkan setting tambahan: tags, description, deletion protection, reservations, automation, metadata, data encryption, dan sole-tenancy.

### Console: Halaman Advanced

```
┌───────────────────────────────────────────────────────────────────────┐
│  Advanced                                                             │
│                                                                       │
│  ▽ Manage tags and labels                                             │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Description                                                    │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ━━━━━━━━ Deletion protection ⓘ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ☐ Enable deletion protection                                        │
│                                                                       │
│  ━━━━━━━━ Reservations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ● Use automatic selection                                            │
│    Google Cloud will select an existing reservation that matches      │
│    properties of your instance                                        │
│  ○ Choose a reservation                                               │
│  ○ Don't use a reservation                                            │
│                                                                       │
│  ━━━━━━━━ Automation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Startup script                                                 │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  You can choose to specify a startup script that will run when your   │
│  instance boots up or restarts. Startup scripts can be used to        │
│  install software and updates, and to ensure that services are        │
│  running within the virtual machine. Learn more ↗                     │
│                                                                       │
│  ━━━━━━━━ Metadata ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  You can set custom metadata for an instance or project outside of    │
│  the server-defined metadata. This is useful for passing in arbitrary │
│  values to your project or instance that can be queried by your code  │
│  on the instance. Learn more ↗                                        │
│                                                                       │
│  [+ Add item]                                                         │
│                                                                       │
│  ━━━━━━━━ Data encryption ⓘ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ● Google-managed encryption key                                      │
│    Keys owned by Google                                               │
│  ○ Cloud KMS key                                                      │
│    Keys owned by customers                                            │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ ⓘ You can now automate creation of Cloud KMS keys using       │   │
│  │   Autokey.  [Dismiss]  [Learn more ↗]                         │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Customer Managed Encryption Key (CMEK) revocation policy             │
│  You can configure this VM to shut down when the key associated       │
│  with any attached disk is revoked. Learn more ↗                      │
│  ○ Shut down (recommended)                                            │
│  ● Do nothing                                                         │
│                                                                       │
│  ━━━━━━━━ Sole-tenancy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ ⓘ Selected machine type is not compatible with Sole-tenancy.  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│  [Create]  Cancel  ☐ Equivalent code                                  │
└───────────────────────────────────────────────────────────────────────┘
```

---

### 14a. Manage Tags and Labels

Klik **"Manage tags and labels"** untuk expand:

```
  ▽ Manage tags and labels

  Tags
  ┌────────────────────────────────────────────────────────────────┐
  │ (Tag bindings — untuk Organization Policy)                      │
  └────────────────────────────────────────────────────────────────┘

  Labels
  ┌──────────────────┐  ┌──────────────────┐
  │ Key              │  │ Value            │
  ├──────────────────┤  ├──────────────────┤
  │ env              │  │ production       │
  │ team             │  │ devops           │
  │ app              │  │ ftlgym           │
  └──────────────────┘  └──────────────────┘
  [+ Add label]
```

| Item | Fungsi | Contoh |
|------|--------|--------|
| **Tags** | Tag bindings untuk Organization Policy enforcement | Digunakan oleh admin untuk policy control |
| **Labels** | Key-value metadata untuk organisasi dan billing | `env=production`, `team=devops`, `app=ftlgym` |

**Labels use cases:**
- **Billing filter** — lihat biaya per label di Billing Console
- **Inventory** — filter VM berdasarkan label di Console
- **Automation** — script yang target VM berdasarkan label

```bash
# gcloud: buat VM dengan labels
gcloud compute instances create my-vm \
    --labels=env=prod,team=devops,app=ftlgym

# Filter VM berdasarkan label
gcloud compute instances list --filter="labels.env=prod"
```

**Rekomendasi:** Selalu tambahkan minimal labels `env`, `team`, dan `app` untuk setiap VM.

---

### 14b. Description

```
  ┌────────────────────────────────────────────────────────────────┐
  │ Description                                                    │
  │                                                                │
  │ Production web server for ftlgym application.                  │
  │ Serves API and frontend behind Load Balancer.                  │
  └────────────────────────────────────────────────────────────────┘
```

| Aspek | Detail |
|-------|--------|
| **Fungsi** | Catatan deskriptif tentang VM — terlihat di Console dan `gcloud describe` |
| **Optional** | Tidak wajib, tapi sangat recommended |
| **Max length** | 2048 karakter |

**Rekomendasi:** Isi singkat — apa fungsi VM, siapa owner, dan catatan penting. Membantu tim lain memahami fungsi VM tanpa harus bertanya.

---

### 14c. Deletion Protection

```
  Deletion protection ⓘ
  ☐ Enable deletion protection
```

| Opsi | Keterangan |
|------|------------|
| **☐ Off** (default) | VM bisa dihapus kapan saja |
| **☑ On** | VM **tidak bisa dihapus** sampai deletion protection di-disable dulu |

| Kelebihan | Kekurangan |
|-----------|------------|
| Mencegah accidental delete | Harus disable dulu sebelum bisa delete |
| Proteksi dari human error | Bisa menghambat automation jika lupa |
| Safety net untuk production VM | — |

```
Deletion Protection Flow:

  User: gcloud compute instances delete my-prod-vm
       │
       ├── Deletion protection OFF → VM dihapus ✅ (atau ❌ jika accidental!)
       │
       └── Deletion protection ON → ERROR ❌
           "The resource 'my-prod-vm' is protected against deletion"
           │
           └── Harus disable dulu:
               gcloud compute instances update my-prod-vm \
                   --no-deletion-protection
               │
               └── Baru bisa delete
```

**Rekomendasi:**
- **Production VM** → ☑ **Enable** — mencegah delete tidak sengaja
- **Dev/testing** → ☐ Off — tidak perlu

---

### 14d. Reservations

```
  Reservations
  ● Use automatic selection
    Google Cloud will select an existing reservation that matches
    properties of your instance
  ○ Choose a reservation
  ○ Don't use a reservation
```

**Apa itu Reservation?**
Reservation menjamin bahwa **capacity (resource)** tersedia saat kamu butuhkan. Dengan reservation, kamu "book" sejumlah vCPU dan RAM di zone tertentu — GCP menjamin resource tersebut available untukmu.

| Opsi | Keterangan |
|------|------------|
| **Use automatic selection** (default) | GCP otomatis pakai reservation yang cocok (jika ada) |
| **Choose a reservation** | Pilih reservation spesifik yang sudah dibuat |
| **Don't use a reservation** | Jangan pakai reservation — gunakan on-demand capacity |

| Kelebihan Reservation | Kekurangan |
|----------------------|------------|
| Jaminan resource available | Bayar meskipun tidak dipakai |
| Tidak khawatir capacity shortage | Harus dibuat sebelumnya |
| Cocok untuk production yang critical | Terikat pada zone dan machine type |

```
Kapan Perlu Reservation?

  Apakah VM critical dan harus selalu bisa dibuat?
  │
  ├── TIDAK → Don't use a reservation (default on-demand)
  │
  ├── YA, sudah punya reservation
  │   ├── Properties VM cocok → Use automatic selection ✅
  │   └── Mau pilih specific → Choose a reservation
  │
  └── YA, belum punya → Buat reservation dulu di Compute Engine → Reservations
```

**Rekomendasi:** Biarkan **"Use automatic selection"** (default). Reservation hanya dibutuhkan jika sering mengalami capacity shortage di zone tertentu atau ada requirement SLA ketat.

---

### 14e. Automation (Startup Script)

```
  Automation
  ┌────────────────────────────────────────────────────────────────┐
  │ Startup script                                                 │
  │                                                                │
  │ #!/bin/bash                                                    │
  │ apt-get update                                                 │
  │ apt-get install -y nginx                                       │
  │ systemctl enable nginx                                         │
  │ systemctl start nginx                                          │
  └────────────────────────────────────────────────────────────────┘
  You can choose to specify a startup script that will run when your
  instance boots up or restarts.
```

| Aspek | Detail |
|-------|--------|
| **Fungsi** | Script yang jalan otomatis setiap VM boot/restart |
| **Format** | Bash script (Linux) atau PowerShell (Windows) |
| **Kapan jalan** | Setiap boot — termasuk restart |
| **Use case** | Install software, konfigurasi, pull code, start services |

**Contoh Startup Scripts:**

```bash
# Install web server + deploy app
#!/bin/bash
apt-get update && apt-get install -y nginx git
git clone https://github.com/myapp/repo.git /var/www/html
systemctl restart nginx

# Install monitoring agent
#!/bin/bash
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install

# Pull config dari GCS
#!/bin/bash
gcloud storage cp gs://my-bucket/config/nginx.conf /etc/nginx/nginx.conf
systemctl restart nginx
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Otomatis setiap boot | Jalan ulang setiap restart (harus idempotent) |
| Bagus untuk initial setup | Debug sulit — cek serial port output |
| Infrastructure as Code | Max 256 KB per script |

```bash
# gcloud: buat VM dengan startup script
gcloud compute instances create my-vm \
    --metadata-from-file=startup-script=./setup.sh

# Atau inline
gcloud compute instances create my-vm \
    --metadata=startup-script='#!/bin/bash
apt-get update && apt-get install -y nginx'

# Cek output startup script
gcloud compute instances get-serial-port-output my-vm --zone=ZONE
```

**Rekomendasi:** Gunakan startup script untuk **initial provisioning**. Untuk konfigurasi complex, pertimbangkan **Cloud Init**, **Ansible**, atau **Packer** (custom image).

---

### 14f. Metadata

```
  Metadata
  You can set custom metadata for an instance or project outside
  of the server-defined metadata. This is useful for passing in
  arbitrary values to your project or instance that can be queried
  by your code on the instance. Learn more ↗

  [+ Add item]

  Klik [+ Add item]:
  ┌──────────────────┐  ┌──────────────────────────────────────┐
  │ Key              │  │ Value                                │
  ├──────────────────┤  ├──────────────────────────────────────┤
  │ env              │  │ production                           │
  │ db-host          │  │ 10.0.1.5                             │
  │ app-version      │  │ v2.3.1                               │
  └──────────────────┘  └──────────────────────────────────────┘
  [+ Add item]
```

| Aspek | Detail |
|-------|--------|
| **Fungsi** | Key-value pairs yang bisa dibaca dari dalam VM |
| **Cara akses** | Query metadata server: `http://metadata.google.internal/computeMetadata/v1/` |
| **Use case** | Pass configuration ke VM tanpa hardcode |

```bash
# Dari dalam VM — baca metadata
curl -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/env
# Output: production

curl -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/db-host
# Output: 10.0.1.5
```

**Metadata vs Labels:**

| | Metadata | Labels |
|---|---|---|
| **Diakses dari** | Dalam VM (metadata server) | Luar VM (Console, gcloud, API) |
| **Fungsi** | Configuration untuk app di VM | Organisasi dan billing |
| **Contoh** | `db-host=10.0.1.5` | `env=production` |

---

### 14g. Data Encryption

```
  Data encryption ⓘ

  ● Google-managed encryption key
    Keys owned by Google

  ○ Cloud KMS key
    Keys owned by customers

  ┌────────────────────────────────────────────────────────────────┐
  │ ⓘ You can now automate creation of Cloud KMS keys using       │
  │   Autokey.  [Dismiss]  [Learn more ↗]                         │
  └────────────────────────────────────────────────────────────────┘
```

Menentukan **siapa yang mengelola encryption key** untuk disk VM.

| Opsi | Key Owner | Kontrol | Biaya |
|------|-----------|---------|-------|
| **Google-managed encryption key** (default) | Google | Google manage sepenuhnya — kamu tidak perlu apa-apa | Gratis |
| **Cloud KMS key** (CMEK) | Customer | Kamu buat dan manage key sendiri di Cloud KMS | Biaya KMS key |

#### Google-managed Encryption Key

```
  Data di disk → dienkripsi oleh Google secara otomatis
  │
  ├── Key dibuat oleh Google
  ├── Key di-rotate otomatis oleh Google
  ├── Kamu tidak bisa lihat atau manage key
  └── Semua data at-rest terenkripsi (AES-256)
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Zero effort — otomatis | Tidak ada kontrol atas key |
| Gratis | Tidak bisa revoke key |
| Semua data terenkripsi by default | Tidak memenuhi CMEK compliance |

#### Cloud KMS Key (CMEK)

```
  Pilih ○ Cloud KMS key:

  ┌────────────────────────────────────────────────────────────────┐
  │ Select a customer-managed key                                  │
  │ ┌──────────────────────────────────────────────────────────┐   │
  │ │ projects/my-project/locations/asia-southeast2/           │   │
  │ │ keyRings/my-keyring/cryptoKeys/vm-disk-key             ▼│   │
  │ └──────────────────────────────────────────────────────────┘   │
  └────────────────────────────────────────────────────────────────┘
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Full control atas key | Harus buat dan manage key di KMS |
| Bisa revoke key → disk tidak bisa diakses | Biaya KMS key (~$0.06/bulan per key) |
| Compliance (CMEK requirement) | Setup lebih kompleks |
| Audit trail di Cloud Audit Logs | Key destroy = data hilang permanen |
| Bisa pakai HSM key (FIPS 140-2 Level 3) | — |

> Lihat [Cloud KMS documentation](../../Cloud-KMS/) untuk detail membuat key.

#### CMEK Revocation Policy

```
  Customer Managed Encryption Key (CMEK) revocation policy
  You can configure this VM to shut down when the key associated
  with any attached disk is revoked. Learn more ↗

  ○ Shut down (recommended)
  ● Do nothing
```

Menentukan apa yang terjadi jika CMEK key di-**revoke** (disable/destroy):

| Opsi | Apa yang terjadi | Kapan pakai |
|------|-----------------|-------------|
| **Shut down** (recommended) | VM otomatis **shutdown** jika key revoked | Production — data protection |
| **Do nothing** (default) | VM tetap running, tapi disk **tidak bisa diakses** | Dev/testing atau legacy |

```
CMEK Revocation Flow:

  Normal:
  VM Running → disk encrypted with KMS key → data accessible ✅

  Key revoked (disabled/destroyed):
  │
  ├── Policy: "Shut down"
  │   └── VM otomatis SHUTDOWN
  │       └── Aman — VM tidak running dengan disk unreadable
  │
  └── Policy: "Do nothing"
      └── VM tetap running
          └── Tapi disk I/O GAGAL → app crash, data corrupt risk ⚠
```

**Rekomendasi:**
- Pakai **Google-managed** untuk kebanyakan use case (gratis, zero effort)
- Pakai **Cloud KMS key** jika ada compliance requirement (CMEK)
- Jika pakai CMEK → set revocation policy ke **"Shut down"**

#### Autokey

Info banner di Console:
```
  ⓘ You can now automate creation of Cloud KMS keys using Autokey.
```

**Autokey** adalah fitur baru yang otomatis membuat KMS key saat kamu memilih CMEK — tidak perlu buat key manual dulu di Cloud KMS.

---

### 14h. Sole-Tenancy

```
  Sole-tenancy
  ┌────────────────────────────────────────────────────────────────┐
  │ ⓘ Selected machine type is not compatible with Sole-tenancy.  │
  └────────────────────────────────────────────────────────────────┘
```

VM berjalan di hardware yang **tidak dibagi** dengan tenant/customer lain.

| Aspek | Detail |
|-------|--------|
| **Fungsi** | Dedicated physical host — hanya VM kamu yang jalan di server tersebut |
| **Compatibility** | Tidak semua machine type support (e2-micro → not compatible) |
| **Minimum** | Membutuhkan machine type yang cukup besar (N2, C2, dll) |

| Kelebihan | Kekurangan |
|-----------|------------|
| Dedicated hardware — tidak shared | Sangat mahal (bayar seluruh host) |
| Compliance (isolasi fisik) | Overkill untuk kebanyakan use case |
| Performa lebih predictable | Tidak tersedia untuk semua machine types |
| BYOL licensing (Oracle, SQL Server) | Setup node group dulu |

```
  Sole-tenancy hanya tersedia jika:
  ├── Machine type cukup besar (N2, C2, M2, dll)
  ├── Sudah buat Sole-tenant node group
  └── Node group punya capacity

  e2-micro → ⓘ "Not compatible with Sole-tenancy"
  n2-standard-8 → Bisa pilih node group ✅
```

**Kapan pakai:**
- **BYOL licensing** — Oracle, Windows Server, SQL Server yang licensing per-core
- **Compliance** — regulasi membutuhkan physical isolation
- **Performance** — butuh jaminan tidak ada noisy neighbor

**Rekomendasi:** Hampir tidak pernah dibutuhkan kecuali ada requirement licensing atau compliance spesifik.

---

## 15. Contoh Lengkap gcloud CLI

### VM Production (seperti ftlgymweb)

```bash
gcloud compute instances create ftlgymweb \
    --zone=asia-southeast2-a \
    --machine-type=n2-highcpu-16 \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=100GB \
    --boot-disk-type=pd-ssd \
    --network=vpc-ftlgym \
    --subnet=subnet-web \
    --no-address \
    --tags=lb-backend,allow-health-checks \
    --service-account=sa-ftlgymweb@webserver-435507.iam.gserviceaccount.com \
    --scopes=cloud-platform \
    --maintenance-policy=MIGRATE \
    --restart-on-failure \
    --shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --labels=env=prod,team=devops,app=ftlgym \
    --project=webserver-435507
```

### VM Dev/Testing (murah)

```bash
gcloud compute instances create ftlgym-dev \
    --zone=asia-southeast2-a \
    --machine-type=e2-medium \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-balanced \
    --provisioning-model=SPOT \
    --instance-termination-action=STOP \
    --labels=env=dev,team=devops \
    --project=webserver-435507
```

### VM Database

```bash
gcloud compute instances create ftlgym-db \
    --zone=asia-southeast2-a \
    --custom-cpu=12 --custom-memory=24GB --custom-vm-type=n2 \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=50GB \
    --boot-disk-type=pd-ssd \
    --create-disk=name=data-disk,size=200GB,type=pd-ssd,auto-delete=no \
    --network=vpc-ftlgym \
    --subnet=subnet-db \
    --no-address \
    --tags=dbserver1 \
    --maintenance-policy=MIGRATE \
    --restart-on-failure \
    --labels=env=prod,team=devops,app=database \
    --project=webserver-435507
```

---

## 16. Lifecycle & Manage VM

### Lifecycle

```
╔══════════════╗     ╔══════════════╗     ╔══════════════╗
║  PROVISIONING║────►║   STAGING    ║────►║   RUNNING    ║
║  (membuat)   ║     ║  (booting)   ║     ║  (aktif)     ║
╚══════════════╝     ╚══════════════╝     ╚══════╤═══════╝
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                                    ▼             ▼             ▼
                             ╔═══════════╗ ╔══════════╗ ╔═══════════╗
                             ║ SUSPENDED ║ ║ STOPPED  ║ ║TERMINATED ║
                             ║ (suspend) ║ ║ (stop)   ║ ║ (preempt/ ║
                             ║           ║ ║          ║ ║  delete)   ║
                             ╚═══════════╝ ╚══════════╝ ╚═══════════╝
```

| Status | Keterangan | Biaya |
|--------|------------|-------|
| RUNNING | VM aktif, bisa diakses | CPU + RAM + Disk |
| STOPPED | VM mati, disk tetap ada | Disk saja |
| SUSPENDED | VM di-freeze ke disk | Disk saja (lebih cepat resume) |
| TERMINATED | VM mati (spot habis) | Disk saja |

### Start / Stop / Reset

```bash
gcloud compute instances stop VM_NAME --zone=ZONE     # shutdown graceful
gcloud compute instances start VM_NAME --zone=ZONE    # nyalakan
gcloud compute instances reset VM_NAME --zone=ZONE    # hard reboot
gcloud compute instances suspend VM_NAME --zone=ZONE  # freeze ke disk
gcloud compute instances resume VM_NAME --zone=ZONE   # resume dari suspend
```

### Delete

```bash
gcloud compute instances delete VM_NAME --zone=ZONE                # disk ikut hapus
gcloud compute instances delete VM_NAME --zone=ZONE --keep-disks=all  # disk tetap
```

### Edit (beberapa butuh stop dulu)

```bash
# Ubah machine type (harus stop dulu)
gcloud compute instances stop VM_NAME --zone=ZONE
gcloud compute instances set-machine-type VM_NAME --zone=ZONE \
    --machine-type=e2-standard-4
gcloud compute instances start VM_NAME --zone=ZONE

# Ini TIDAK perlu stop:
gcloud compute instances add-tags VM_NAME --zone=ZONE --tags=web,ssh
gcloud compute instances add-metadata VM_NAME --zone=ZONE --metadata=env=prod
gcloud compute instances update VM_NAME --zone=ZONE --update-labels=team=devops
```

### Stop vs Delete vs Suspend

```
╔══════════════╦═══════════════════╦════════════╦══════════════════╗
║  Aksi        ║  Disk             ║  Biaya     ║  Resume time     ║
╠══════════════╬═══════════════════╬════════════╬══════════════════╣
║  Stop        ║  Tetap ada        ║  Disk only ║  ~30-60 detik    ║
║  Suspend     ║  Tetap + RAM dump ║  Disk only ║  ~10-20 detik    ║
║  Delete      ║  Terhapus*        ║  $0        ║  Harus buat baru ║
╚══════════════╩═══════════════════╩════════════╩══════════════════╝

* kecuali pakai --keep-disks=all
```

### Describe & List

```bash
gcloud compute instances list --project=PROJECT_ID
gcloud compute instances list --filter="status=RUNNING"
gcloud compute instances describe VM_NAME --zone=ZONE
gcloud compute instances describe VM_NAME --zone=ZONE --format="get(status)"
gcloud compute instances describe VM_NAME --zone=ZONE \
    --format="get(networkInterfaces[0].networkIP)"
gcloud compute instances get-serial-port-output VM_NAME --zone=ZONE | tail -100
```
