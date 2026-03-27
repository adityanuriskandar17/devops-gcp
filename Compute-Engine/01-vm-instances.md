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
8. [Identity & API Access](#8-identity--api-access)
9. [Firewall](#9-firewall)
10. [Advanced: Networking](#10-advanced-networking)
11. [Advanced: Disks](#11-advanced-disks)
12. [Advanced: Security (Shielded VM)](#12-advanced-security-shielded-vm)
13. [Advanced: Management](#13-advanced-management)
14. [Advanced: Sole Tenancy](#14-advanced-sole-tenancy)
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
║           ║  + Generasi terbaru (Sapphire Rapids)             ║
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
- RAM per vCPU: min 0.9 GB, max 6.5 GB (extended memory sampai 8 GB)

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
| **Intel Sapphire Rapids** | Terbaru, performa terbaik | Hanya di series tertentu (N4, C3) |
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

VM dengan enkripsi RAM (memory encryption). Data di RAM tetap terenkripsi bahkan dari Google.

| Opsi | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Off** (default) | Tidak ada overhead performa | RAM tidak terenkripsi (standar cloud) |
| **On** | Data di RAM terenkripsi (AMD SEV) | ~5% performance hit, hanya di N2D series, sedikit lebih mahal |

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
| **pd-extreme** | Custom | Custom | ~$0.125+ | IOPS tertinggi | Sangat mahal, N2/N2D only |

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

## 8. Identity & API Access

### Service Account

| Opsi | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Default compute SA** | Otomatis ada, tidak perlu setup | Permission terlalu luas (editor) |
| **Custom service account** | Least privilege, lebih aman | Harus buat dan manage sendiri |
| **No service account** | VM tidak bisa akses GCP API | Aman, tapi sangat terbatas |

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

### Access Scopes

| Scope | Keterangan |
|-------|------------|
| **Allow default access** | Akses read ke storage, write ke logging/monitoring |
| **Allow full access** | Full API access (permission tergantung SA IAM roles) |
| **Set access for each API** | Granular per API (tapi IAM roles lebih recommended) |

**Rekomendasi:** Pilih "Allow full access to all Cloud APIs", lalu batasi lewat **IAM roles** di service account. Lebih mudah di-manage.

---

## 9. Firewall

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

## 10. Advanced: Networking

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

## 11. Advanced: Disks

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

## 12. Advanced: Security (Shielded VM)

| Fitur | Default | Keterangan |
|-------|---------|------------|
| **Secure Boot** | Off | Hanya boot software yang signed. Mencegah rootkit |
| **vTPM** | On | Virtual Trusted Platform Module untuk integritas |
| **Integrity Monitoring** | On | Cek apakah boot sequence berubah |

| Kelebihan | Kekurangan |
|-----------|------------|
| Proteksi dari rootkit dan bootkit | Secure Boot bisa block driver custom |
| Compliance requirement (PCI, HIPAA) | Sedikit lebih lambat boot |
| Integrity monitoring bisa alert | Beberapa OS custom tidak support |

**Rekomendasi:** Biarkan vTPM dan Integrity Monitoring **On**. Aktifkan Secure Boot kalau pakai standard OS image.

---

## 13. Advanced: Management

### Metadata

Key-value pairs yang bisa dibaca oleh VM.

```bash
# Contoh: startup script via metadata
--metadata=startup-script='#!/bin/bash
apt-get update && apt-get install -y nginx'

# Contoh: custom metadata
--metadata=env=production,app=ftlgym
```

### Availability Policy

| Setting | Pilihan | Keterangan |
|---------|---------|------------|
| **On host maintenance** | **Migrate** (default) | VM pindah ke host lain tanpa downtime saat maintenance |
| | **Terminate** | VM dimatikan saat host maintenance |
| **Automatic restart** | **On** (default) | VM otomatis restart kalau crash/maintenance |
| | **Off** | VM tidak otomatis restart |

```
╔═══════════════════╦══════════════════════════════════════════╗
║  On Host          ║                                         ║
║  Maintenance      ║  Detail                                 ║
╠═══════════════════╬══════════════════════════════════════════╣
║                   ║  + Tidak ada downtime                    ║
║  Migrate          ║  + VM tetap running                      ║
║  (default)        ║  - Sedikit performance dip saat migrasi  ║
║                   ║  - Tidak tersedia untuk Spot VM           ║
╠═══════════════════╬══════════════════════════════════════════╣
║                   ║  + Tidak ada performance dip              ║
║  Terminate        ║  - VM mati, harus start lagi              ║
║                   ║  - Downtime saat maintenance               ║
║                   ║  + Wajib untuk Spot VM                    ║
╚═══════════════════╩══════════════════════════════════════════╝
```

**Rekomendasi:** **Migrate + Automatic restart On** untuk semua production VM.

### Preemptibility (lama, sekarang → Provisioning Model)

Setting lama. Sekarang diganti dengan Provisioning Model (Standard/Spot) di section 4.

---

## 14. Advanced: Sole Tenancy

VM berjalan di hardware yang **tidak dibagi** dengan tenant/customer lain.

| Kelebihan | Kekurangan |
|-----------|------------|
| Dedicated hardware | Sangat mahal (bayar seluruh host) |
| Compliance requirement | Overkill untuk kebanyakan use case |
| Performa lebih predictable | Setup lebih kompleks |

**Kapan pakai:** Licensing BYOL (Oracle), compliance ketat, isolasi hardware.

**Rekomendasi:** Hampir tidak pernah dibutuhkan kecuali ada requirement spesifik.

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
