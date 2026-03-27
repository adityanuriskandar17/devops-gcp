# Konsep & Kenapa Kubernetes

Penjelasan **kenapa menggunakan Kubernetes bisa menghemat biaya**, perbedaan container vs VM, dan arsitektur GKE.

---

## Masalah: Tanpa Container (Traditional VM)

Saat deploy aplikasi langsung di VM **tanpa container**, setiap aplikasi "mengklaim" seluruh resource server:

```
Server: 1 vCPU, 1GB RAM, 10GB Storage

┌──────────────────────────────────────────┐
│              VM (Server)                  │
│                                          │
│   Install: Ubuntu + Node.js 18           │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │     App A (Node.js 18)           │   │
│   │     Consume: 500MB RAM, 2GB disk │   │
│   └──────────────────────────────────┘   │
│                                          │
│   Sisa resource:                         │
│   RAM:  500MB  ──► TERBUANG (idle)       │
│   Disk: 8GB    ──► TERBUANG (idle)       │
│   CPU:  ~50%   ──► TERBUANG (idle)       │
│                                          │
│   ❌ Tidak bisa install App B (Node 20)  │
│      karena sudah install Node 18        │
│   ❌ 1 server = 1 app = BOROS            │
└──────────────────────────────────────────┘
```

### Kenapa tidak bisa taruh 2 app?

- **Konflik dependency**: App A butuh Node 18, App B butuh Node 20 — tidak bisa install 2 versi Node.js sekaligus di 1 server (tanpa workaround rumit)
- **Konflik port**: App A dan App B mungkin sama-sama pakai port 3000
- **Isolasi**: Jika App A crash atau memory leak → App B ikut terdampak
- **Security**: App A bisa akses file/proses App B

### Akibatnya: 1 app = 1 server = MAHAL

```
3 aplikasi → butuh 3 server terpisah:

  Server 1: App A (Node 18)    $50/bulan    utilization ~30%
  Server 2: App B (Node 20)    $50/bulan    utilization ~20%
  Server 3: App C (Python 3)   $50/bulan    utilization ~15%
  ────────────────────────────────────────
  Total: $150/bulan   avg utilization: ~22% (78% terbuang!)
```

---

## Solusi: Container (Docker + Kubernetes)

Container **membungkus** aplikasi beserta semua dependency-nya (runtime, library, config) dalam paket yang **terisolasi** — bisa jalan di server manapun tanpa konflik.

```
Server: 4 vCPU, 8GB RAM, 50GB Storage

┌────────────────────────────────────────────────────────┐
│                    VM (Server)                          │
│                                                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐         │
│  │ Container 1│ │ Container 2│ │ Container 3│         │
│  │            │ │            │ │            │         │
│  │ Node 18   │ │ Node 20   │ │ Python 3.11│         │
│  │ App A     │ │ App B     │ │ App C      │         │
│  │ 500MB RAM │ │ 300MB RAM │ │ 200MB RAM  │         │
│  │ 2GB disk  │ │ 1GB disk  │ │ 1.5GB disk │         │
│  └────────────┘ └────────────┘ └────────────┘         │
│                                                        │
│  ┌────────────┐ ┌────────────┐                         │
│  │ Container 4│ │ Container 5│   Masih bisa            │
│  │ Java 17   │ │ Go 1.21   │   tambah lagi!           │
│  │ App D     │ │ App E     │                           │
│  │ 1GB RAM   │ │ 100MB RAM │                           │
│  └────────────┘ └────────────┘                         │
│                                                        │
│  Total used: ~2.1GB RAM dari 8GB                       │
│  5 app di 1 server, masing-masing TERISOLASI           │
│  Beda versi Node, Python, Java — TIDAK KONFLIK         │
└────────────────────────────────────────────────────────┘
```

### Kenapa tidak konflik?

Setiap container punya **filesystem, network, dan process space sendiri** — seperti VM mini tapi **jauh lebih ringan**:

```
Container A:                Container B:
  /usr/bin/node (v18)         /usr/bin/node (v20)
  /app/index.js               /app/server.js
  Port 3000 (internal)        Port 3000 (internal)
  PID namespace sendiri       PID namespace sendiri

  ──► Tidak saling lihat, tidak saling ganggu
  ──► Beda versi Node.js di server yang SAMA
```

---

## Kenapa Kubernetes Menghemat Biaya?

### 1. Packing lebih efisien (bin packing)

```
Tanpa container (3 app = 3 server):
  Server 1: $50/bulan  (utilization 30%)
  Server 2: $50/bulan  (utilization 20%)
  Server 3: $50/bulan  (utilization 15%)
  Total: $150/bulan

Dengan Kubernetes (3 app = 1 server):
  Server 1: $80/bulan  (utilization 85%)
  Total: $80/bulan

  HEMAT: $150 - $80 = $70/bulan (47%)
```

### 2. Autoscaling (scale sesuai kebutuhan)

```
Jam sibuk (09:00-18:00):
  Traffic tinggi → Kubernetes tambah Pod/Node otomatis
  ──► 5 node running

Jam sepi (18:00-09:00):
  Traffic rendah → Kubernetes kurangi Pod/Node otomatis
  ──► 2 node running (HEMAT 60% dari jam sibuk)

Tanpa Kubernetes:
  5 server jalan 24/7 meskipun jam sepi = bayar penuh terus
```

### 3. Spot/Preemptible VM untuk workload non-critical

```
Kubernetes bisa mix:
  Node pool 1: On-demand VM (untuk app production critical)
  Node pool 2: Spot VM, diskon 60-91% (untuk batch job, dev, staging)

  ──► Total cost jauh lebih rendah
```

### 4. Resource limit per container

```
Tanpa container:
  App A bisa pakai 100% RAM server → app lain mati

Dengan Kubernetes:
  App A: limit 512MB RAM, 0.5 CPU
  App B: limit 256MB RAM, 0.25 CPU
  App C: limit 1GB RAM, 1 CPU
  ──► Resource terkontrol, tidak bisa saling "mencuri"
```

### Ringkasan hemat biaya

| Faktor | Tanpa K8s | Dengan K8s | Hemat |
|--------|----------|------------|-------|
| Server utilization | ~20-30% | ~70-85% | Resource tidak terbuang |
| Scaling | Manual, over-provision | Otomatis, scale down saat sepi | 30-60% |
| VM type | On-demand semua | Mix on-demand + Spot | 30-60% Spot discount |
| Ops effort | 1 server per app, manage semua | Managed control plane | Waktu tim berkurang |
| Downtime | Manual restart, manual deploy | Self-healing, rolling update | Lebih sedikit downtime |

---

## Container vs VM — Perbandingan

| Aspek | VM (Traditional) | Container (Kubernetes) |
|-------|------------------|----------------------|
| **Isolasi** | Full OS per app | Shared kernel, isolated namespaces |
| **Ukuran** | GB (termasuk OS) | MB (hanya app + dependency) |
| **Startup** | Menit (boot OS) | Detik (start process) |
| **Resource** | 1 app per VM (boros) | Banyak app per VM (efisien) |
| **Dependency** | Konflik jika beda versi | Tidak konflik (setiap container bawa sendiri) |
| **Scaling** | Lambat (provisioning VM) | Cepat (start container baru ~detik) |
| **Portability** | Terikat OS/environment | Jalan di mana saja (laptop, cloud, on-prem) |

---

## Arsitektur GKE

```
┌────────────────────────────────────────────────────────────┐
│                    GKE Cluster                              │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Control Plane (Managed by Google — gratis)         │  │
│  │                                                      │  │
│  │   API Server: menerima request (kubectl, Console)    │  │
│  │   etcd: database cluster state                       │  │
│  │   Scheduler: tentukan Pod jalan di Node mana         │  │
│  │   Controller: pastikan desired state = actual state   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│              ┌───────────┼───────────┐                      │
│              ▼           ▼           ▼                      │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │
│  │  Node Pool:    │ │  Node Pool:    │ │  Node Pool:    │  │
│  │  "default"     │ │  "highcpu"     │ │  "spot"        │  │
│  │  e2-standard-4 │ │  n2-highcpu-8  │ │  e2-medium     │  │
│  │  (on-demand)   │ │  (on-demand)   │ │  (Spot VM)     │  │
│  │                │ │                │ │                │  │
│  │ ┌──┐ ┌──┐     │ │ ┌──┐ ┌──┐     │ │ ┌──┐           │  │
│  │ │PA│ │PB│     │ │ │PC│ │PD│     │ │ │PE│           │  │
│  │ └──┘ └──┘     │ │ └──┘ └──┘     │ │ └──┘           │  │
│  └────────────────┘ └────────────────┘ └────────────────┘  │
│                                                            │
│  P = Pod (1+ container)                                    │
│  Node = VM Compute Engine                                  │
│  Node Pool = group of nodes dengan machine type yang sama  │
└────────────────────────────────────────────────────────────┘
```

### Istilah penting

| Istilah | Arti |
|---------|------|
| **Cluster** | Keseluruhan environment Kubernetes (control plane + nodes) |
| **Control Plane** | "Otak" cluster — manage scheduling, state, API. Di GKE: **managed by Google, gratis**. |
| **Node** | VM (Compute Engine) tempat container berjalan |
| **Node Pool** | Group of nodes dengan machine type dan config yang sama |
| **Pod** | Unit terkecil di Kubernetes — 1 atau lebih container yang jalan bersama |
| **Deployment** | Definisi "saya mau 3 Pod App A berjalan" — Kubernetes pastikan selalu 3 |
| **Service** | Endpoint stabil untuk mengakses Pod (Pod bisa mati/pindah, Service tetap) |
| **Namespace** | Isolasi logis di dalam cluster (misal: `production`, `staging`) |

---

## GKE Mode: Autopilot vs Standard

| Aspek | Autopilot | Standard |
|-------|-----------|----------|
| **Manage nodes** | Google (otomatis) | Anda (manual node pool) |
| **Bayar** | Per Pod resource (vCPU + RAM) | Per Node (VM) — terpakai atau tidak |
| **Scaling** | Otomatis | Manual configure autoscaler |
| **Security** | Hardened by default | Konfigurasi sendiri |
| **Flexibility** | Terbatas (Google tentukan) | Penuh (pilih machine type, GPU, dll) |
| **Cocok untuk** | Tim kecil, standard workload | Workload custom, GPU, high-performance |

---

## Skenario: Tanpa vs Dengan Kubernetes

### Startup dengan 5 microservices

```
Tanpa Kubernetes:
  5 VM × $50/bulan = $250/bulan
  5 server yang harus di-manage, patch, monitor
  Deploy = SSH ke tiap server, pull code, restart
  Scaling = beli server baru, setup dari awal

Dengan GKE Autopilot:
  1 cluster, 5 Deployment
  Cost ~$100-150/bulan (autopilot scale sesuai kebutuhan)
  Deploy = kubectl apply (1 command)
  Scaling = otomatis
  Self-healing = Pod crash → Kubernetes restart otomatis
```

---

## Apakah Kubernetes Wajib?

**Jawaban singkat: TIDAK wajib.** Kubernetes adalah **alat**, bukan keharusan. Apakah diperlukan tergantung pada **skala, kompleksitas, dan kebutuhan tim**.

### Decision Tree — Kapan Butuh Kubernetes?

```
Aplikasi kamu...

  ├── Cuma 1 aplikasi sederhana (blog, landing page)?
  │     └── ❌ TIDAK perlu Kubernetes
  │         → Pakai 1 VM / Cloud Run / App Engine
  │
  ├── 1-2 aplikasi, traffic stabil, tim kecil (1-3 orang)?
  │     └── ❌ TIDAK perlu Kubernetes
  │         → Pakai VM + Docker Compose, atau Cloud Run
  │
  ├── 3-5 aplikasi, mulai butuh scaling, tim 3-5 orang?
  │     └── ⚠️ MUNGKIN perlu, tergantung kompleksitas
  │         → Cloud Run masih bisa, Kubernetes mulai masuk akal
  │
  ├── 5+ microservices, traffic fluktuatif, butuh zero-downtime?
  │     └── ✅ SANGAT direkomendasikan
  │         → Kubernetes (GKE Autopilot)
  │
  └── 10+ microservices, multi-team, multi-environment?
        └── ✅ WAJIB pakai orchestrator (Kubernetes)
            → GKE Standard dengan node pool custom
```

---

### Case 1: TIDAK Perlu Kubernetes

**Profil:** Website company profile + 1 API backend

```
Situasi:
  - 1 frontend (React/Vue static site)
  - 1 backend API (Node.js/Express)
  - 1 database (Cloud SQL)
  - Traffic: ~1.000 user/hari, stabil
  - Tim: 1-2 developer

Solusi tanpa Kubernetes:
  ┌─────────────────────────────────────────────┐
  │ Cloud Storage          → hosting frontend   │  $1/bulan
  │ 1 VM (e2-micro)        → backend API        │  $7/bulan
  │ Cloud SQL (db-f1-micro) → database           │  $10/bulan
  │                                              │
  │ Total: ~$18/bulan                            │
  │ Manage: SSH ke 1 VM, deploy manual           │
  │ Scaling: tidak perlu (traffic stabil)        │
  └─────────────────────────────────────────────┘

Kalau pakai Kubernetes:
  ┌─────────────────────────────────────────────┐
  │ GKE Autopilot cluster → overkill!           │
  │ Cluster management fee: $72/bulan           │  ← cuma buat management
  │ Pod resource:            $15/bulan           │
  │ Cloud SQL:               $10/bulan           │
  │                                              │
  │ Total: ~$97/bulan                            │
  │ 5x LEBIH MAHAL untuk hasil yang sama!        │
  └─────────────────────────────────────────────┘
```

**Kesimpulan:** Untuk 1-2 app sederhana, Kubernetes justru **membuang uang**.

---

### Case 2: MULAI Butuh Kubernetes

**Profil:** E-commerce dengan beberapa service

```
Situasi:
  - Frontend (React)
  - API Gateway
  - Auth Service
  - Product Service
  - Order Service
  - Payment Service
  - Notification Service
  - 2 database (Cloud SQL + Redis)
  - Traffic: 10.000-50.000 user/hari, ada jam sibuk
  - Tim: 5-10 developer

Tanpa Kubernetes (per VM):
  ┌────────────────────────────────────────────────────────────┐
  │ VM 1: Frontend           $30/bulan  (utilization ~25%)     │
  │ VM 2: API Gateway        $30/bulan  (utilization ~40%)     │
  │ VM 3: Auth Service       $30/bulan  (utilization ~15%)     │
  │ VM 4: Product Service    $30/bulan  (utilization ~20%)     │
  │ VM 5: Order Service      $30/bulan  (utilization ~30%)     │
  │ VM 6: Payment Service    $30/bulan  (utilization ~25%)     │
  │ VM 7: Notification Svc   $30/bulan  (utilization ~10%)     │
  │ Cloud SQL + Redis        $50/bulan                         │
  │                                                            │
  │ Total: 7×$30 + $50 = $260/bulan                            │
  │ Avg utilization: ~24% (76% resource terbuang)              │
  │                                                            │
  │ Masalah:                                                   │
  │   ❌ 7 server harus di-manage, patch, monitor              │
  │   ❌ Deploy = SSH ke 7 server, pull code, restart           │
  │   ❌ Scaling = beli VM baru, setup dari awal                │
  │   ❌ Jam sibuk → server lambat, tapi jam sepi tetap bayar   │
  │   ❌ 1 service crash → harus manual restart                 │
  └────────────────────────────────────────────────────────────┘
```

```
Dengan GKE Autopilot:
  ┌────────────────────────────────────────────────────────────┐
  │ GKE Autopilot cluster                                      │
  │                                                            │
  │ Cluster fee:    $72/bulan (fixed)                          │
  │ Pod resources:                                             │
  │   7 services × ~0.25 vCPU × ~256MB = ~$45/bulan           │
  │   (Autopilot hanya bayar resource yang TERPAKAI)           │
  │ Cloud SQL + Redis: $50/bulan                               │
  │                                                            │
  │ Total: $72 + $45 + $50 = $167/bulan                        │
  │                                                            │
  │ Saat jam sibuk (auto-scale up):                            │
  │   Order + Payment scale ke 3 replika → +$20               │
  │ Saat jam sepi (auto-scale down):                           │
  │   Scale ke minimum → HEMAT                                 │
  │                                                            │
  │ Rata-rata: ~$170/bulan                                     │
  │                                                            │
  │ Kelebihan:                                                 │
  │   ✅ Deploy = 1 command (kubectl apply / CI/CD)            │
  │   ✅ Scaling = OTOMATIS (HPA + Cluster Autoscaler)         │
  │   ✅ Self-healing = Pod crash → restart otomatis            │
  │   ✅ Rolling update = zero-downtime deployment              │
  │   ✅ Monitoring = built-in Cloud Monitoring                 │
  └────────────────────────────────────────────────────────────┘
```

**Perbandingan:**

| Aspek | Tanpa K8s (7 VM) | Dengan GKE Autopilot |
|-------|-------------------|---------------------|
| **Cost/bulan** | ~$260 | ~$170 |
| **Hemat** | — | **$90/bulan (35%)** |
| **Deploy** | SSH ke 7 server | 1 command |
| **Scaling** | Manual beli VM | Otomatis |
| **Downtime saat deploy** | Ya (restart manual) | Tidak (rolling update) |
| **Self-healing** | Tidak | Ya |
| **Effort manage** | Tinggi (7 server) | Rendah (Google manage infra) |

---

### Case 3: WAJIB Kubernetes

**Profil:** Platform SaaS besar / Fintech / E-commerce skala besar

```
Situasi:
  - 20+ microservices
  - Multi-team (5+ tim developer)
  - Multi-environment (dev, staging, production)
  - Traffic: 100.000+ user/hari, highly variable
  - SLA 99.9% (downtime max ~8.7 jam/tahun)
  - Butuh: canary deployment, A/B testing, service mesh

Tanpa Kubernetes:
  ┌────────────────────────────────────────────────────────────┐
  │ 20+ VM (masing-masing dedicated)                           │
  │ Total: 20 × $50 = $1.000/bulan (utilization ~20%)         │
  │                                                            │
  │ + 20 VM untuk staging = $500/bulan                         │
  │ + 20 VM untuk dev = $300/bulan                             │
  │                                                            │
  │ Total: $1.800/bulan                                        │
  │                                                            │
  │ Masalah BESAR:                                             │
  │   ❌ 60 server harus di-manage                              │
  │   ❌ Butuh dedicated SRE team (tambah cost gaji)            │
  │   ❌ Deploy sangat rumit dan berisiko                        │
  │   ❌ Scaling manual = tidak bisa handle traffic spike        │
  │   ❌ SLA 99.9% hampir mustahil tanpa automation             │
  └────────────────────────────────────────────────────────────┘
```

```
Dengan GKE Standard + Spot VM:
  ┌────────────────────────────────────────────────────────────┐
  │ PRODUCTION cluster (Regional, HA):                         │
  │   Cluster fee:    $72/bulan                                │
  │   On-demand nodes: 3× n2-standard-4 = $300/bulan          │
  │   Spot VM nodes:   2× e2-standard-4 = $50/bulan (-75%)    │
  │   Subtotal: $422/bulan (20 services, 85% utilization)      │
  │                                                            │
  │ STAGING cluster (Autopilot, hemat):                        │
  │   Cluster fee:    $72/bulan                                │
  │   Pod resources:  ~$30/bulan (minimal replika)             │
  │   Subtotal: $102/bulan                                     │
  │                                                            │
  │ DEV namespace (di staging cluster, bukan cluster baru):    │
  │   Tambahan cost:  ~$20/bulan                               │
  │                                                            │
  │ Total: $422 + $102 + $20 = $544/bulan                      │
  │                                                            │
  │ Kelebihan:                                                 │
  │   ✅ 20 services di ~5 node (bukan 60 VM)                  │
  │   ✅ SLA 99.9% achievable (Regional + rolling update)      │
  │   ✅ Canary deployment, traffic splitting                   │
  │   ✅ Namespace isolation per team                           │
  │   ✅ CI/CD pipeline = auto deploy                           │
  │   ✅ Monitoring + alerting built-in                         │
  └────────────────────────────────────────────────────────────┘
```

**Perbandingan:**

| Aspek | Tanpa K8s (60 VM) | Dengan GKE | Hemat |
|-------|-------------------|------------|-------|
| **Cost/bulan** | ~$1.800 | ~$544 | **$1.256 (70%)** |
| **Server to manage** | 60 | 5 nodes (managed) | 92% less |
| **Deploy** | Manual per server | CI/CD + kubectl | Jam → menit |
| **SLA 99.9%** | Sangat sulit | Built-in HA | — |
| **Effort** | Full SRE team | 1-2 DevOps engineer | Gaji team ↓ |

---

### Flow Cost Efisiensi — Ringkasan Visual

```
╔══════════════════════════════════════════════════════════════════════╗
║                   FLOW COST EFFICIENCY                              ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                     ║
║  1-2 apps                  5-10 apps               20+ apps         ║
║  Traffic stabil            Traffic variable         High traffic     ║
║                                                                     ║
║  ┌─────────────┐          ┌──────────────┐       ┌──────────────┐   ║
║  │  1-2 VM     │          │ 7 VM (tanpa) │       │ 60 VM(tanpa) │   ║
║  │  $18/bulan  │          │ $260/bulan   │       │ $1.800/bulan │   ║
║  │  ✅ Murah    │          │ ❌ Boros      │       │ ❌ Sangat boros│   ║
║  └──────┬──────┘          └──────┬───────┘       └──────┬───────┘   ║
║         │                        │                       │           ║
║     vs K8s?                  vs K8s?                 vs K8s?         ║
║         │                        │                       │           ║
║  ┌──────▼──────┐          ┌──────▼───────┐       ┌──────▼───────┐   ║
║  │  K8s $97    │          │ K8s $170     │       │ K8s $544     │   ║
║  │  ❌ Rugi     │          │ ✅ Hemat 35%  │       │ ✅ Hemat 70%  │   ║
║  │  DON'T USE  │          │ RECOMMENDED  │       │ WAJIB PAKAI  │   ║
║  └─────────────┘          └──────────────┘       └──────────────┘   ║
║                                                                     ║
║  Kesimpulan:                                                        ║
║  • Semakin banyak service → semakin besar hemat K8s                 ║
║  • Semakin fluktuatif traffic → semakin besar hemat autoscaling     ║
║  • Tipping point: ~3-5 microservices                                ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

### Kapan TIDAK Pakai Kubernetes?

| Situasi | Alternatif yang Lebih Baik | Alasan |
|---------|---------------------------|--------|
| 1 website/blog sederhana | **Cloud Run** atau **1 VM** | K8s overkill, cluster fee $72/bulan sia-sia |
| Static site (React/Vue build) | **Cloud Storage + CDN** | Tidak perlu server sama sekali |
| 1 API kecil, traffic rendah | **Cloud Functions** atau **Cloud Run** | Serverless = bayar per request, bisa $0 saat idle |
| Prototype / MVP | **App Engine** atau **1 VM** | Cepat deploy, tidak perlu belajar K8s |
| Tim 1 orang, belum paham DevOps | **Cloud Run** | Abstraksi lebih tinggi, tanpa manage cluster |
| Batch job sesekali | **Cloud Functions** atau **Compute Engine preemptible** | Tidak perlu cluster running 24/7 |

### Kapan WAJIB Pakai Kubernetes?

| Situasi | Kenapa K8s Wajib? | Contoh Real |
|---------|-------------------|-------------|
| 5+ microservices | Tanpa orchestrator, deploy & manage chaos | E-commerce (auth, product, order, payment, notif) |
| Traffic sangat fluktuatif | Butuh autoscaling otomatis, manual scaling terlalu lambat | Flash sale, live streaming, ticketing |
| Zero-downtime deployment | Rolling update & canary deployment bawaan K8s | Fintech, banking, SaaS |
| Multi-team development | Namespace isolation per tim, RBAC | Perusahaan dengan 5+ tim developer |
| SLA 99.9%+ | Regional cluster, self-healing, auto-restart | Healthcare, payment gateway |
| Beda tech stack | Container isolasi dependency (Node, Python, Go, Java) | Startup yang berkembang cepat |
| CI/CD mature pipeline | GitOps + K8s = auto deploy on merge | Organisasi dengan engineering culture kuat |

---

### Rekomendasi Berdasarkan Tahap Pertumbuhan

```
Tahap 1: Baru mulai (1-2 app)
  → VM / Cloud Run
  → Cost: $10-30/bulan
  → Fokus: building product, bukan infra

         │ Berkembang...
         ▼

Tahap 2: Mulai scale (3-5 app)
  → Cloud Run (masih bisa)
  → Atau mulai GKE Autopilot
  → Cost: $100-200/bulan
  → Evaluasi: apakah Cloud Run cukup?

         │ Berkembang...
         ▼

Tahap 3: Scale besar (5-15 app)
  → GKE Autopilot (recommended)
  → Cost: $200-500/bulan
  → Hemat 30-50% vs dedicated VM

         │ Berkembang...
         ▼

Tahap 4: Enterprise (15+ app, multi-team)
  → GKE Standard (full control)
  → Spot VM + node pool strategy
  → Cost: $500-2.000/bulan
  → Hemat 50-70% vs dedicated VM
  → Service mesh, canary, GitOps
```
