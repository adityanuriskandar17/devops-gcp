# Create Cluster

Panduan lengkap membuat **GKE Cluster** melalui **GCP Console**, step-by-step sesuai wizard.

---

## Enable Kubernetes Engine (Pertama Kali)

**Console path:** `Google Cloud Console` → search **Kubernetes Engine** → klik

Jika belum pernah dipakai, akan muncul tombol **ENABLE**:

```
┌──────────────────────────────────────────┐
│  Kubernetes Engine API                    │
│                                          │
│  [ ENABLE ]                              │
│                                          │
│  Tunggu ~1-2 menit...                    │
│  ──► API aktif, bisa create cluster      │
└──────────────────────────────────────────┘
```

Setelah enabled: `Kubernetes Engine` → **Clusters** → **CREATE**

---

## Pilih Mode Cluster

Setelah klik CREATE, muncul pilihan:

| Mode | Deskripsi |
|------|-----------|
| **Autopilot (recommended)** | Google manage nodes. Bayar per Pod resource. Lebih mudah. |
| **Standard** | Anda manage nodes. Bayar per VM. Lebih flexible. |

```
┌──────────────────────────┐  ┌──────────────────────────┐
│    Autopilot              │  │    Standard               │
│    (Recommended)          │  │                           │
│                           │  │                           │
│  Google manages your      │  │  You manage your          │
│  cluster infrastructure   │  │  cluster infrastructure   │
│                           │  │                           │
│  Pay per pod              │  │  Pay per node             │
│                           │  │                           │
│  [ CONFIGURE ]            │  │  [ CONFIGURE ]            │
└──────────────────────────┘  └──────────────────────────┘
```

### Autopilot — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Tidak perlu manage node/VM | Tidak bisa pilih machine type spesifik |
| Auto-scaling built-in | Tidak support GPU (terbatas) |
| Security hardened by default | Tidak bisa SSH ke node |
| Bayar per Pod = lebih predictable | Kurang flexible untuk custom workload |
| **Recommended untuk kebanyakan use case** | Start-up time Pod sedikit lebih lama |

### Standard — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Kontrol penuh (machine type, GPU, node config) | Harus manage node pool sendiri |
| Bisa SSH ke node untuk debug | Bayar per VM — terpakai atau tidak |
| Support GPU, TPU | Security harus dikonfigurasi sendiri |
| Spot VM node pool | Lebih kompleks |

---

## Wizard Create Cluster

Setelah pilih mode, wizard menampilkan beberapa step. Berikut penjelasan untuk mode **Autopilot** (Standard mirip tapi ada tambahan node pool config):

```
┌──────────────────────────────────────────────┐
│  Create an Autopilot cluster                  │
│                                              │
│  ① Cluster basics          ◄── name, region  │
│  ② Fleet registration      ◄── fleet mgmt    │
│  ③ Networking              ◄── VPC, IP range  │
│  ④ Advanced settings       ◄── maintenance    │
│  ──────────────────────────────────────────── │
│  [ REVIEW AND CREATE ]                        │
└──────────────────────────────────────────────┘
```

---

## Step 1: Cluster Basics

**Console:** Create cluster → **Cluster basics**

### Name

| Field | Deskripsi |
|-------|-----------|
| **Name** | Nama cluster (lowercase, huruf, angka, dash). Contoh: `my-app-prod`, `ftlgym-cluster-1` |

Nama tidak bisa diubah setelah cluster dibuat.

**Rekomendasi naming:** `{project}-{env}` contoh: `ftlgym-prod`, `ftlgym-staging`

### Region / Location

| Field | Opsi | Deskripsi |
|-------|------|-----------|
| **Region** | Dropdown region | Lokasi cluster. Contoh: `asia-southeast2 (Jakarta)` |

| Opsi lokasi | Deskripsi |
|-------------|-----------|
| **Regional** (default Autopilot) | Control plane dan nodes tersebar di **3 zona** dalam 1 region. HA tinggi. |
| **Zonal** (hanya Standard) | Control plane dan nodes di **1 zona** saja. Lebih murah tapi single point of failure. |

#### Kelebihan & kekurangan

**Regional cluster**

| Kelebihan | Kekurangan |
|-----------|------------|
| HA — control plane di 3 zona | Biaya sedikit lebih tinggi (node tersebar) |
| Toleran terhadap zona failure | Network latency antar zona (minimal, ~1ms) |
| **Wajib untuk production** | — |

**Zonal cluster** (Standard only)

| Kelebihan | Kekurangan |
|-----------|------------|
| Lebih murah | **Single point of failure** — zona down = cluster down |
| Latency antar node lebih rendah | Control plane downtime saat maintenance |
| Cocok untuk development/testing | **Jangan untuk production** |

### Cluster version (Release channel)

| Field | Opsi |
|-------|------|
| **Release channel** | Rapid / Regular / Stable |

| Channel | Deskripsi | Kapan pakai |
|---------|-----------|-------------|
| **Rapid** | Versi terbaru, update paling sering | Testing fitur baru |
| **Regular** | Balance antara fitur baru dan stabilitas | **Recommended untuk production** |
| **Stable** | Versi paling mature, jarang update | Workload yang butuh stabilitas maksimal |
| **No channel** (Static) | Versi fixed, tidak auto-update | Full kontrol, tapi harus manual patch |

#### Kelebihan & kekurangan

| Channel | Kelebihan | Kekurangan |
|---------|-----------|------------|
| Rapid | Fitur terbaru | Mungkin ada bug, update sering |
| Regular | Balance | — |
| Stable | Paling stabil, tested | Fitur baru datang paling lambat |
| No channel | Full kontrol versi | Harus manual upgrade, risiko security patch terlambat |

---

## Step 2: Fleet Registration

**Console:** Create cluster → **Fleet registration**

### Apa itu Fleet?

**Fleet** = fitur untuk mengelola **banyak cluster** sebagai satu group. Berguna jika punya beberapa cluster (prod, staging, multi-region).

| Field | Deskripsi |
|-------|-----------|
| **Register this cluster to a fleet** | Centang untuk daftarkan cluster ke fleet project |
| **Fleet host project** | Project GCP yang jadi "pusat" management fleet |

### Fleet — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Manage banyak cluster dari 1 tempat | Overkill jika hanya punya 1 cluster |
| Consistent policy across clusters | Tambah kompleksitas |
| Multi-cluster service mesh (Anthos) | — |
| Team scope & namespace management | — |

### Kapan pakai Fleet?

| Situasi | Fleet? |
|---------|--------|
| 1 cluster saja | Tidak perlu (skip / uncheck) |
| Prod + staging cluster | Opsional |
| Multi-region clusters | **Ya, recommended** |
| Multi-team organization | **Ya, recommended** |

**Untuk pemula atau 1 cluster: bisa di-skip (uncheck).**

---

## Step 3: Networking

**Console:** Create cluster → **Networking**

### Network

| Field | Opsi | Deskripsi |
|-------|------|-----------|
| **Network** | Dropdown VPC | VPC network untuk cluster. Default: `default` |
| **Node subnet** | Dropdown subnet | Subnet di VPC tersebut. Contoh: `default (10.128.0.0/20)` |

### IPv4 network access

**Console:** Create cluster → Networking → **IPv4 network access**

Di Console tampil 2 radio button:

```
IPv4 network access
Choose the type of network you want to allow to access your cluster's workloads.

  ◉ Public cluster
    Choose a public cluster to configure access from public networks to
    the cluster's workloads. Routes aren't created automatically.
    You cannot change this setting after the cluster is created.

  ○ Private cluster
    Choose a private cluster to assign internal IP addresses to Pods
    and nodes. This isolates the cluster's workloads from public networks.
    You cannot change this setting after the cluster is created.

  ☐ Override control plane's default private endpoint subnet
```

**Penting:** Setting ini **tidak bisa diubah** setelah cluster dibuat. Pilih dengan benar dari awal.

| Opsi | Deskripsi |
|------|-----------|
| **Public cluster** | Nodes dan Pods bisa punya **public IP** — bisa diakses dari internet. Routes tidak otomatis dibuat. **Default.** |
| **Private cluster** | Nodes dan Pods hanya punya **internal IP** — terisolasi dari jaringan publik. Lebih secure. |
| **Override control plane's default private endpoint subnet** | Ubah subnet default untuk private endpoint control plane. Berguna jika default subnet conflict atau butuh subnet tertentu untuk peering. |

---

### Konsep: Public vs Private Workload

Pilihan Public/Private cluster berkaitan langsung dengan **arsitektur aplikasi** — memisahkan workload yang perlu diakses publik dari workload yang harus tetap internal/private.

```
┌─────────────────────────────────────────────────────────────────┐
│                         GKE Cluster                              │
│                                                                 │
│  ┌─────────────────────┐      ┌──────────────────────────────┐  │
│  │   App Public         │      │  App Data Management Tools   │  │
│  │   (Frontend/API)     │      │  (Private / Internal)        │  │
│  │                      │      │                              │  │
│  │  • Website           │      │  • Admin panel database      │  │
│  │  • REST API          │      │  • Migration tools           │  │
│  │  • Mobile backend    │      │  • Backup scripts            │  │
│  │                      │      │  • Monitoring dashboard      │  │
│  │  Diakses oleh:       │      │                              │  │
│  │  → User dari internet│      │  Diakses oleh:               │  │
│  └──────────┬───────────┘      │  → Hanya internal team       │  │
│             │                  │  → Hanya dari VPC/VPN        │  │
│             │                  └──────────────┬───────────────┘  │
│             │                                 │                  │
│             └────────────┬────────────────────┘                  │
│                          │                                       │
│                          ▼                                       │
│                 ┌─────────────────┐                              │
│                 │    Database      │                              │
│                 │  (Cloud SQL /    │                              │
│                 │   internal DB)   │                              │
│                 └─────────────────┘                              │
│                                                                 │
│  App Public  → expose via Ingress/LoadBalancer (public IP)       │
│  App Private → ClusterIP Service (tidak ada public IP)           │
│  Database    → hanya bisa diakses dari dalam cluster (private)   │
└─────────────────────────────────────────────────────────────────┘
```

### Kenapa pisahkan Public dan Private?

| Aspek | App Public | App Private (Data Management) |
|-------|-----------|-------------------------------|
| **Siapa akses** | Semua user dari internet | Hanya tim internal |
| **Expose** | Ingress / LoadBalancer (public IP) | ClusterIP (internal only) atau via VPN |
| **Contoh** | Website, API, mobile backend | Admin DB, migration tool, backup script |
| **Security** | WAF, rate limit, authentication | Tidak exposed, hanya internal access |
| **Risiko jika exposed** | Normal (designed for public) | **Sangat berbahaya** — bisa manipulasi data langsung |

### Implementasi di Kubernetes

```yaml
# App Public — exposed ke internet via LoadBalancer
apiVersion: v1
kind: Service
metadata:
  name: web-public
spec:
  type: LoadBalancer          # ◄── Public IP, bisa diakses dari internet
  selector:
    app: web-frontend
  ports:
  - port: 80
    targetPort: 8080
---
# App Private — hanya internal cluster
apiVersion: v1
kind: Service
metadata:
  name: db-admin-tool
spec:
  type: ClusterIP              # ◄── Internal only, TIDAK ada public IP
  selector:
    app: db-admin
  ports:
  - port: 80
    targetPort: 3000
---
# Database — hanya bisa diakses dari dalam cluster
apiVersion: v1
kind: Service
metadata:
  name: database
spec:
  type: ClusterIP              # ◄── Internal only
  selector:
    app: postgres
  ports:
  - port: 5432
```

**Tambahan Network Policy** — pastikan hanya app tertentu yang bisa akses database:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-access-policy
spec:
  podSelector:
    matchLabels:
      app: postgres
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web-frontend       # App public boleh akses DB
    - podSelector:
        matchLabels:
          app: db-admin           # App private boleh akses DB
    ports:
    - port: 5432
  # Semua Pod lain TIDAK bisa akses database
```

### Skenario: Public Cluster vs Private Cluster

**Public cluster — cocok untuk:**

```
Skenario: Startup kecil, 3 developer

  GKE Cluster (Public):
    ┌──────────────────────────────────────────┐
    │  App frontend → LoadBalancer (public)     │
    │  App API      → LoadBalancer (public)     │
    │  App admin    → ClusterIP (internal)      │
    │  Database     → ClusterIP (internal)      │
    └──────────────────────────────────────────┘

  Developer bisa kubectl dari laptop (via internet)
  App admin diakses via kubectl port-forward
  Simple, cepat, cocok untuk development
```

**Private cluster — cocok untuk:**

```
Skenario: Enterprise, compliance requirement, data sensitif

  GKE Cluster (Private):
    ┌──────────────────────────────────────────┐
    │  Semua Nodes: internal IP only            │
    │  Semua Pods: internal IP only             │
    │                                          │
    │  App frontend → Ingress (satu-satunya    │
    │                  public access point)     │
    │  App API      → ClusterIP (internal)     │
    │  App admin    → ClusterIP (internal)     │
    │  Database     → ClusterIP (internal)     │
    └──────────────────────────────────────────┘
              │
    Akses kubectl: hanya via VPN / Bastion / Cloud Shell
    Nodes pull image: via Cloud NAT (tidak exposed)
    
  Seluruh cluster terisolasi dari public network
  Hanya Ingress yang punya public IP
```

---

#### Public vs Private cluster — perbandingan

| Aspek | Public cluster | Private cluster |
|-------|---------------|-----------------|
| **Node IP** | Public + private | **Private only** |
| **Pod IP** | Routable dari internet (jika ada Service) | **Internal only** |
| **Control plane** | Public endpoint | **Private endpoint** |
| **Akses kubectl** | Dari mana saja (dengan auth) | Harus dari VPC (bastion / VPN / Cloud Shell) |
| **Isolasi** | Workloads bisa di-reach dari internet | Workloads **terisolasi** dari public networks |
| **Setup** | Simple | Perlu Cloud NAT + VPN/bastion |
| **Kapan pakai** | Development, small team | **Production dengan compliance ketat** |
| **Bisa diubah?** | **TIDAK** setelah cluster dibuat | **TIDAK** setelah cluster dibuat |

#### Kelebihan & kekurangan

**Public cluster**

| Kelebihan | Kekurangan |
|-----------|------------|
| Simple, bisa `kubectl` dari laptop | Nodes punya public IP = attack surface lebih besar |
| Tidak perlu setup VPN/bastion/NAT | Harus set authorized networks agar API server aman |
| Routes ke internet langsung | Kurang cocok untuk compliance ketat |

**Private cluster**

| Kelebihan | Kekurangan |
|-----------|------------|
| Nodes & Pods **tidak punya public IP** — terisolasi total | Perlu **Cloud NAT** agar nodes bisa pull container images |
| Control plane hanya private endpoint | Perlu **VPN/bastion** untuk kubectl |
| **Best practice untuk production** | Setup lebih kompleks |
| Compliance friendly (data tidak exposed) | — |

### Override control plane's default private endpoint subnet

| Field | Deskripsi |
|-------|-----------|
| **Override control plane's default private endpoint subnet** | Centang jika ingin menentukan subnet spesifik untuk private endpoint control plane. Default: GKE pilih otomatis dari VPC. |

Kapan perlu override:
- Subnet default conflict dengan CIDR range yang sudah dipakai
- Butuh kontrol routing yang spesifik untuk control plane
- VPC peering dengan range tertentu

**Untuk kebanyakan kasus: biarkan default (jangan centang).**

### Authorized networks

| Field | Deskripsi |
|-------|-----------|
| **Control plane authorized networks** | CIDR ranges yang boleh akses API server (kubectl). Contoh: `103.xxx.xxx.0/24` (IP kantor) |

### Advanced networking options

| Field | Deskripsi |
|-------|-----------|
| **Enable Dataplane V2** | Networking modern berbasis eBPF (lebih cepat, built-in network policy). **Recommended.** |
| **DNS provider** | Cloud DNS (default) atau kube-dns |
| **Pod IPv4 address range** | CIDR untuk Pod IPs (auto atau custom) |
| **Service IPv4 address range** | CIDR untuk Service IPs (auto atau custom) |

#### Dataplane V2 — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Performa networking lebih baik (eBPF) | Masih relatif baru |
| Built-in network policy enforcement | — |
| Observability mendalam (Hubble — flow logs, metrics) | — |
| **Recommended untuk semua cluster baru** | — |

#### GKE Dataplane V2 — Observability Tools

Dataplane V2 menyediakan **Hubble Terkelola (Managed Hubble)** — solusi observasi jaringan dan insight keamanan untuk workload Kubernetes.

Saat diaktifkan, GKE Dataplane V2 men-deploy komponen berikut ke cluster:

| Komponen | Tipe | Deskripsi |
|----------|------|-----------|
| **Hubble Relay** | Auto-deploy | Layanan yang mengumpulkan data **telemetri jaringan** tentang Pod dari setiap node |
| **Hubble CLI** | Auto-deploy | Command line tool yang menyediakan informasi **traffic live** di dalam cluster |
| **Hubble UI** | Manual deploy | Web UI untuk melihat dan menganalisis data telemetri jaringan yang dikumpulkan Hubble Relay. Harus enable observasi Dataplane V2 dulu. |

```
Arsitektur Hubble di GKE Dataplane V2:

  ┌───────────────────────────────────────────────────────┐
  │                    GKE Cluster                         │
  │                                                       │
  │  Node 1                    Node 2                     │
  │  ┌──────────────────┐     ┌──────────────────┐       │
  │  │ Pod A    Pod B    │     │ Pod C    Pod D    │       │
  │  │   │        │      │     │   │        │      │       │
  │  │   ▼        ▼      │     │   ▼        ▼      │       │
  │  │ eBPF (Dataplane V2)│     │ eBPF (Dataplane V2)│       │
  │  │   │  capture flow  │     │   │  capture flow  │       │
  │  └───┼────────────────┘     └───┼────────────────┘       │
  │      │                          │                       │
  │      └──────────┬───────────────┘                       │
  │                 ▼                                       │
  │        ┌─────────────────┐                              │
  │        │  Hubble Relay    │ ◄── kumpulkan telemetri     │
  │        │  (semua node)    │     dari setiap node        │
  │        └────────┬────────┘                              │
  │                 │                                       │
  │       ┌─────────┼──────────┐                            │
  │       ▼                    ▼                            │
  │  ┌──────────┐       ┌──────────┐                       │
  │  │Hubble CLI│       │Hubble UI │                       │
  │  │(terminal)│       │  (web)   │                       │
  │  └──────────┘       └──────────┘                       │
  └───────────────────────────────────────────────────────┘
```

**Apa yang bisa dilihat:**

| Data | Contoh |
|------|--------|
| **Flow logs** | Pod A → Pod B port 8080 (HTTP 200 OK) |
| **Network policy drops** | Pod C → Pod D port 5432 **DROPPED** (blocked by policy) |
| **DNS queries** | Pod A query `api-service.production.svc.cluster.local` → resolved |
| **TCP metrics** | `hubble_tcp_flags_total` — total alur yang diproses per TCP flag |
| **ICMP metrics** | `hubble_icmp_total` — total alur ICMP yang diproses |
| **HTTP metrics** | Request/response per service, latency, error rate |

**Metrics Hubble yang tersedia:**

| Metric | Tipe | Deskripsi |
|--------|------|-----------|
| `hubble_tcp_flags_total` | Kumulatif | Jumlah total alur yang diproses dengan set flag TCP yang ditentukan |
| `hubble_icmp_total` | Kumulatif | Jumlah total alur ICMP yang diproses |
| `hubble_flows_processed_total` | Kumulatif | Total flow yang diproses |
| `hubble_dns_queries_total` | Kumulatif | Total DNS queries yang di-observe |
| `hubble_drop_total` | Kumulatif | Total paket yang di-drop (oleh network policy, dll) |

**Kenapa Hubble penting:**

| Kelebihan | Kekurangan |
|-----------|------------|
| Visibility penuh traffic antar Pod tanpa install tool tambahan | Sedikit overhead resource di node |
| Deteksi network policy yang salah konfigurasi (mana yang blocked) | Hubble UI perlu deploy manual |
| Debug connectivity issues (Pod A tidak bisa reach Pod B — kenapa?) | Data volume besar jika cluster besar |
| Security insight — lihat traffic tidak wajar | — |
| Integrasi native dengan GKE (tidak perlu install Cilium manual) | — |

**Enable observasi Dataplane V2:**

```bash
# Saat create cluster (sudah otomatis jika enable Dataplane V2)
gcloud container clusters create my-cluster \
    --enable-dataplane-v2 \
    --enable-dataplane-v2-flow-observability

# Untuk cluster yang sudah ada
gcloud container clusters update my-cluster \
    --enable-dataplane-v2-flow-observability

# Deploy Hubble UI (manual)
kubectl apply -f https://raw.githubusercontent.com/cilium/hubble/main/tutorials/deploy-hubble-ui.yaml

# Akses Hubble UI via port-forward
kubectl port-forward -n kube-system svc/hubble-ui 12000:80
# Buka browser: http://localhost:12000
```

---

## Step 4: Advanced Settings

**Console:** Create cluster → **Advanced settings**

Di Console Autopilot, halaman Advanced settings menampilkan:

```
Advanced settings

  ┌─────────────────────────────────────────────┐
  │  Release channel                             │
  │  Rapid channel                            ▼  │
  └─────────────────────────────────────────────┘

  ⚠ cAdvisor and Kubelet Metrics will be enabled by default
    in GKE Autopilot clusters with the version in the Rapid
    channel. See more details in Advanced settings > Operations.

  ▸ Automation                                  ∨
  ▸ Service Mesh                                ∨
  ▸ Backup plan                                 ∨
  ▸ Security                                    ∨
```

---

### Release channel

**Console:** Advanced settings → **Release channel** (dropdown)

| Channel di Console | Deskripsi |
|-------------------|-----------|
| **Rapid channel** | Versi terbaru — test fitur baru Kubernetes sebelum qualified untuk production. **Recommended untuk pre-production/testing.** |
| **Regular channel** | Balance antara fitur baru dan stabilitas. **Recommended untuk production.** |
| **Stable channel** | Versi paling mature, update paling jarang. Untuk workload yang butuh stabilitas maksimal. |

#### Perbandingan release channel

| Aspek | Rapid | Regular | Stable |
|-------|-------|---------|--------|
| **Update frequency** | Paling sering (~mingguan) | Bulanan | Beberapa bulan sekali |
| **Versi Kubernetes** | Terbaru (minor+patch) | 2-3 bulan setelah Rapid | 3-5 bulan setelah Regular |
| **Stabilitas** | Kurang tested | Tested | Paling tested |
| **Fitur baru** | Paling cepat | Medium | Paling lambat |
| **Risiko** | Mungkin ada bug | Low risk | Very low risk |
| **Kapan pakai** | Dev/staging, test fitur baru | **Production (recommended)** | Mission-critical, compliance |

#### Kelebihan & kekurangan

**Rapid channel**

| Kelebihan | Kekurangan |
|-----------|------------|
| Fitur terbaru Kubernetes | Mungkin ada bug yang belum terdeteksi |
| Test API baru sebelum production | Update sering = lebih banyak potential disruption |
| cAdvisor & Kubelet Metrics enabled by default (Autopilot) | Tidak cocok untuk production |

**Regular channel**

| Kelebihan | Kekurangan |
|-----------|------------|
| Balance fitur dan stabilitas | Fitur baru lebih lambat dari Rapid |
| **Recommended untuk production** | — |
| Sudah tested di Rapid channel dulu | — |

**Stable channel**

| Kelebihan | Kekurangan |
|-----------|------------|
| Paling stabil dan reliable | Fitur baru paling lambat datang |
| Cocok untuk compliance/regulated industry | Security patch bisa terlambat |
| Minimal disruption | — |

#### Info: cAdvisor dan Kubelet Metrics

Pada **Rapid channel** di Autopilot, **cAdvisor** dan **Kubelet Metrics** otomatis enabled:

| Komponen | Fungsi |
|----------|--------|
| **cAdvisor** | Mengumpulkan metric resource (CPU, RAM, disk, network) dari setiap container di node. Data dikirim ke Cloud Monitoring. |
| **Kubelet Metrics** | Metric dari Kubelet (node agent) — info tentang Pod lifecycle, volume, runtime. |

Lihat detail di **Advanced settings** → **Operations** section.

---

### Automation (expandable section)

**Console:** Advanced settings → klik **Automation** → expand

---

#### 1. Enable Maintenance Window (checkbox)

**Console UI:**
```
☑ Enable Maintenance Window  ⓘ

  ● Weekly editor
  ○ Custom editor
```

Jika **dicentang**, kamu mengontrol **kapan** GKE boleh melakukan maintenance (auto-upgrade node, patch keamanan). Jika **tidak dicentang**, GKE melakukan maintenance kapan saja.

| Opsi | Deskripsi |
|------|-----------|
| **Enable Maintenance Window** ☑ | Kamu tentukan jadwal maintenance. GKE **hanya** maintenance di window yang kamu set. |
| **Disable** (tidak centang) | GKE maintenance **kapan saja** — bisa terjadi di jam sibuk. |

| Kelebihan (Enable) | Kekurangan (Enable) |
|---------------------|---------------------|
| Kontrol penuh kapan node boleh di-restart | Window terlalu ketat → security patch tertunda |
| Hindari maintenance saat jam sibuk | Harus minimal 48 jam availability dalam 32 hari (rolling) |
| Predictable — tim tahu kapan mungkin ada gangguan | Perlu monitoring apakah window cukup |

| Kelebihan (Disable) | Kekurangan (Disable) |
|----------------------|----------------------|
| Tidak perlu konfigurasi, GKE urus semua | Maintenance bisa terjadi kapan saja, termasuk jam sibuk |
| Security patch langsung diterapkan | Tidak predictable — Pod bisa restart di waktu unexpected |

**Rekomendasi:** ✅ **Enable** untuk production, boleh disable untuk dev/staging.

---

#### 2. Weekly Editor vs Custom Editor

Setelah enable, pilih mode konfigurasi:

**Console UI:**
```
  ● Weekly editor       → Set jadwal mingguan (visual, mudah)
  ○ Custom editor       → Tulis JSON cron expression (fleksibel)
```

| Mode | Cara Kerja | Cocok Untuk |
|------|-----------|-------------|
| **Weekly editor** | Pilih hari dan jam lewat dropdown visual | Mayoritas user — simple dan cukup |
| **Custom editor** | Tulis JSON/cron untuk jadwal kompleks | Advanced user yang butuh jadwal non-standar |

---

#### 3. Weekly Editor — Detail Opsi Console

**Console UI:**
```
⚠ You must allow at least 48 hours of maintenance availability
  in a 32-day rolling window. Only contiguous availability
  windows of at least four hours are considered.

  ┌──────────────┐  ┌──────────────┐
  │ Start time   │  │ Length       │
  │ 12:00 AM   ▼│  │ 24h        ▼│
  └──────────────┘  └──────────────┘
  Hours shown in your local time zone (UTC+7)

  ⓘ Days of week are always specified in UTC. If you want a
    maintenance window to start at 02:00:00+06:00 (UTC+6)
    on Wednesday, this correlates to Tuesday 20:00:00+00:00
    (UTC). You should select 2 AM for the start time (start
    time is local), and Tuesday for the date for your window
    (day of week is UTC).

  Days:
  ☑ Monday  ☑ Tuesday  ☑ Wednesday  ☑ Thursday
  ☑ Friday  ☑ Saturday ☑ Sunday
```

**Penjelasan setiap opsi:**

| Field | Pilihan | Deskripsi |
|-------|---------|-----------|
| **Start time** | 12:00 AM – 11:00 PM (per jam) | Jam mulai maintenance boleh dilakukan. Ditampilkan dalam **zona waktu lokal** (misal UTC+7 WIB). |
| **Length** | 4h, 8h, 12h, 24h | Durasi window maintenance. Minimal **4 jam** per window. |
| **Days** | Monday – Sunday (checkbox) | Hari apa saja maintenance boleh dilakukan. Hari ditentukan dalam **UTC** (perhatikan konversi zona waktu). |

**⚠ Aturan penting:**
- **Minimal 48 jam** availability dalam 32 hari (rolling window)
- Window yang dihitung harus **contiguous minimal 4 jam**
- Jika kamu pilih terlalu sedikit hari/jam → GKE akan menolak konfigurasi

**Contoh konversi timezone:**

```
Kamu ingin maintenance Rabu jam 02:00 WIB (UTC+7):

  WIB:  Rabu   02:00 (local)
  UTC:  Selasa 19:00 (UTC = WIB - 7)

  Di Console:
    Start time: 2:00 AM  (ini local time, Console convert otomatis)
    Days:       pilih Tuesday (karena di UTC = Selasa)

  ⚠ PENTING: Start time diset dalam LOCAL time,
     tapi Days diset dalam UTC!
```

| Konfigurasi | Kelebihan | Kekurangan |
|-------------|-----------|------------|
| Length: **4h** (sempit) | Maintenance sangat terkontrol, minimal gangguan | Mungkin tidak cukup waktu untuk upgrade besar |
| Length: **8h** (moderat) | Balance antara kontrol dan fleksibilitas | — |
| Length: **24h** (lebar) | GKE punya banyak waktu, upgrade pasti selesai | Window besar = maintenance bisa kapan saja di hari itu |
| Days: **weekday saja** | Weekend bebas gangguan | 5 hari × length harus ≥ 48 jam (perlu length ≥ 10h) |
| Days: **weekend saja** | Weekday production aman | 2 hari × length = 48 jam minimum (perlu 24h both days) |
| Days: **semua hari** | Paling fleksibel, GKE mudah scheduling | Maintenance bisa terjadi kapan saja |

**Rekomendasi konfigurasi production:**

```
Rekomendasi: Maintenance di jam sepi, hari kerja dini hari

  Start time: 1:00 AM (local WIB)
  Length:     4h  (01:00 - 05:00)
  Days:       ☑ Tuesday  ☑ Wednesday  ☑ Thursday
              (hindari Senin = awal minggu, Jumat = rilis akhir minggu)

  Total availability: 3 hari × 4 jam = 12 jam/minggu
  Per 32 hari: ~48+ jam  ✅ memenuhi syarat
```

---

#### 4. Maintenance Exclusions

Periode di mana maintenance **tidak boleh** terjadi sama sekali.

**Console:** Automation → **Add maintenance exclusion**

| Field | Deskripsi |
|-------|-----------|
| **Start date** | Tanggal mulai exclusion |
| **End date** | Tanggal selesai exclusion |
| **Scope** | `no_upgrades` (blok semua) atau `no_minor_upgrades` (blok minor upgrade saja) |

| Kelebihan | Kekurangan |
|-----------|------------|
| Lindungi event penting (promo, rilis besar) | Security patch tertunda selama exclusion |
| Kontrol penuh, tidak ada surprise downtime | Exclusion > 180 hari = cluster jadi outdated, risiko keamanan |
| Bisa set beberapa exclusion sekaligus | Terlalu banyak exclusion → GKE kesulitan scheduling upgrade |

**Contoh:**

```
Maintenance exclusion 1:
  Start: 20 December 2026
  End:   5 January 2027
  Scope: no_upgrades
  Alasan: Periode liburan + promo akhir tahun

Maintenance exclusion 2:
  Start: 10 March 2027
  End:   12 March 2027
  Scope: no_upgrades
  Alasan: Launch fitur baru / major release
```

---

#### 5. Notifications

**Console:** Automation → **Notification settings**

| Setting | Deskripsi |
|---------|-----------|
| **Pub/Sub topic** | Kirim notifikasi maintenance ke Pub/Sub topic → bisa forward ke Slack, email, PagerDuty |
| **Advance notice** | GKE kirim notifikasi **sebelum** maintenance terjadi |

| Kelebihan | Kekurangan |
|-----------|------------|
| Tim tahu sebelum maintenance terjadi | Perlu setup Pub/Sub + subscription |
| Bisa integrasi ke alerting system (Slack, email) | Jika tidak diset, maintenance "diam-diam" tanpa warning |
| Contoh: "Maintenance akan dilakukan besok 02:00" | — |

---

#### 6. Auto-upgrade

| Mode | Behavior |
|------|----------|
| **Autopilot cluster** | Auto-upgrade **selalu ON**, tidak bisa dimatikan |
| **Standard cluster** | Bisa di-disable per node pool (tapi TIDAK direkomendasikan) |

| Kelebihan (Enable) | Kekurangan (Enable) |
|---------------------|---------------------|
| Selalu up-to-date dengan security patch | Node di-restart saat upgrade (downtime singkat per node) |
| Tidak perlu manual upgrade | Versi baru mungkin ada breaking change (rare tapi bisa) |
| Sesuai release channel yang dipilih | — |

| Kelebihan (Disable) | Kekurangan (Disable) |
|----------------------|----------------------|
| Full control kapan upgrade | Cluster bisa jadi outdated, risiko keamanan |
| Test dulu sebelum upgrade | Manual effort tinggi |
| — | GKE **tetap** akan force-upgrade jika terlalu outdated (end-of-life) |

**Rekomendasi:** ✅ **Biarkan ON** + set maintenance window agar upgrade terjadi di jam sepi.

---

#### Contoh konfigurasi lengkap (production)

```
Automation:
  ☑ Enable Maintenance Window

  Mode: Weekly editor
  Start time: 1:00 AM (WIB)
  Length: 4h
  Days: ☑ Tuesday ☑ Wednesday ☑ Thursday

  Maintenance exclusions:
    - 20 Dec 2026 → 5 Jan 2027 (liburan)
    - 10 Mar 2027 → 12 Mar 2027 (major release)

  Notifications:
    Pub/Sub topic: projects/my-project/topics/gke-maintenance
    → Forward ke Slack channel #ops-alerts

  Auto-upgrade: ON (Autopilot = selalu ON)
```

---

### Service Mesh (expandable section)

**Console:** Advanced settings → klik **Service Mesh** → expand

| Setting | Deskripsi |
|---------|-----------|
| **Enable Anthos Service Mesh** | Managed service mesh — observability, security, dan traffic management antar microservices. |

#### Apa itu Service Mesh?

Service Mesh mengelola **komunikasi antar microservices** secara otomatis — tanpa mengubah kode aplikasi.

```
Tanpa Service Mesh:
  App A ──direct──► App B
  (tidak ada visibility, tidak ada mTLS, tidak ada retry otomatis)

Dengan Service Mesh (sidecar proxy):
  App A ──► Sidecar Proxy ──► Sidecar Proxy ──► App B
            │                 │
            ├── mTLS (enkripsi otomatis)
            ├── Retry & timeout otomatis
            ├── Traffic splitting (canary deployment)
            └── Metrics & tracing otomatis
```

#### Kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| mTLS otomatis antar service (zero-trust) | Sidecar proxy menambah resource usage per Pod |
| Observability (tracing, metrics) tanpa ubah kode | Kompleksitas operasional bertambah |
| Traffic management (canary, A/B testing) | Latency sedikit bertambah (melalui proxy) |
| Retry, timeout, circuit breaker otomatis | Overkill untuk aplikasi sederhana (< 5 services) |

#### Kapan pakai?

| Situasi | Service Mesh? |
|---------|---------------|
| 2-3 microservices | Tidak perlu — terlalu overkill |
| 10+ microservices | **Recommended** — butuh observability dan security |
| Compliance (zero-trust networking) | **Ya** — mTLS otomatis |
| Canary deployment / traffic splitting | **Ya** |

---

### Backup plan (expandable section)

**Console:** Advanced settings → klik **Backup plan** → expand

| Setting | Deskripsi |
|---------|-----------|
| **Enable Backup for GKE** | Backup workload Kubernetes (Deployments, ConfigMaps, Secrets, PVCs) secara terjadwal. |
| **Backup plan** | Pilih backup plan yang sudah dibuat atau buat baru. |

#### Apa yang di-backup?

| Resource | Di-backup? |
|----------|-----------|
| Deployments, StatefulSets, DaemonSets | Ya |
| Services, Ingress | Ya |
| ConfigMaps, Secrets | Ya |
| Persistent Volume Claims (PVC) + data | Ya (volume snapshot) |
| Node configuration | Tidak (managed by GKE) |

#### Kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Disaster recovery untuk workload Kubernetes | Biaya backup storage |
| Restore ke cluster yang **sama** atau **beda** | Restore tidak instant (tergantung ukuran data) |
| Scheduled backup (harian, mingguan) | — |
| Selective restore (per namespace / per resource) | — |

#### Kapan pakai?

| Situasi | Backup? |
|---------|---------|
| Development/staging | Tidak perlu (bisa recreate dari Git) |
| Production tanpa stateful data | Opsional (YAML di Git sudah cukup) |
| Production dengan Persistent Volume (database, files) | **Ya — wajib** |
| Compliance requirement | **Ya** |

---

### Security (expandable section)

**Console:** Advanced settings → klik **Security** → expand

| Setting | Deskripsi |
|---------|-----------|
| **Enable Binary Authorization** | Hanya container image yang sudah di-**sign/attest** yang boleh deploy ke cluster. |
| **Deletion protection** | Cluster tidak bisa dihapus sampai fitur ini dimatikan. Mencegah accidental delete. |
| **Secret encryption** | Encrypt Kubernetes Secrets menggunakan **Cloud KMS** key (bukan hanya base64 encoding default). |

#### Binary Authorization — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Supply chain security — hanya trusted images | Setup attestation pipeline lebih kompleks |
| Block image yang belum di-scan/sign | Bisa block deployment jika lupa sign |
| Compliance requirement (SLSA, SOC2) | — |

#### Deletion protection

| Kelebihan | Kekurangan |
|-----------|------------|
| Mencegah delete cluster tidak sengaja | Harus disable dulu sebelum bisa delete (1 step tambahan) |
| **Recommended untuk semua production cluster** | — |

#### Secret encryption dengan Cloud KMS

```
Default:
  Kubernetes Secret: base64 encoded → disimpan di etcd
  ──► Siapa pun yang akses etcd bisa decode base64

Dengan Cloud KMS encryption:
  Kubernetes Secret: encrypted dengan KMS key → disimpan di etcd
  ──► Perlu KMS key untuk decrypt → jauh lebih aman
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Secrets benar-benar encrypted at rest | Biaya Cloud KMS (~$0.06/key/bulan + per operasi) |
| Compliance requirement (HIPAA, PCI-DSS) | Sedikit latency tambahan saat read/write Secret |
| Audit trail via KMS audit log | Harus manage KMS key rotation |

---

## Step 5: Review and Create

**Console:** Create cluster → **REVIEW AND CREATE**

Halaman review menampilkan **ringkasan semua konfigurasi**:

```
┌──────────────────────────────────────────────┐
│  Review and create                            │
│                                              │
│  Cluster basics:                             │
│    Name: ftlgym-prod                         │
│    Region: asia-southeast2                   │
│    Mode: Autopilot                           │
│    Release channel: Regular                  │
│                                              │
│  Fleet registration:                         │
│    Registered: No                            │
│                                              │
│  Networking:                                 │
│    Network: default                          │
│    Subnet: default                           │
│    Access: Public cluster                    │
│    Dataplane: V2                             │
│                                              │
│  Advanced settings:                          │
│    Maintenance: 02:00 - 06:00                │
│    Deletion protection: Enabled              │
│                                              │
│  Estimated cost: ~$XX/month (Autopilot)      │
│                                              │
│  [ CREATE ]                                  │
└──────────────────────────────────────────────┘
```

Klik **CREATE** → tunggu **5-10 menit** → cluster ready.

**Status di Console:** `Kubernetes Engine` → **Clusters** → status berubah dari `Provisioning` → `Running`

---

## Flow Lengkap: Create Cluster hingga Deploy App

```
Step 1: Enable Kubernetes Engine API
  Console → Kubernetes Engine → ENABLE → tunggu ~2 menit

Step 2: Create Cluster
  Clusters → CREATE → Autopilot → isi wizard (5 step) → CREATE
  ──► Tunggu ~5-10 menit

Step 3: Connect ke cluster
  Console → Clusters → klik cluster → CONNECT
  ──► Copy perintah gcloud:
      gcloud container clusters get-credentials CLUSTER_NAME \
          --region=REGION --project=PROJECT

Step 4: Deploy aplikasi
  kubectl apply -f deployment.yaml
  kubectl apply -f service.yaml

Step 5: Expose ke internet
  Buat Ingress atau LoadBalancer Service
  ──► User bisa akses aplikasi
```

---

## Skenario: Startup Deploy 3 Microservices

```
Situasi:
  3 microservices: auth-service, api-service, web-frontend
  Tim kecil (3 developer), butuh cepat dan murah

Pilihan: GKE Autopilot

Langkah:
  1. Create Autopilot cluster "startup-prod"
     Region: asia-southeast2
     Release channel: Regular

  2. Deploy 3 Deployment (1 per service):
     auth-service:  2 replicas, 256MB RAM, 0.25 CPU
     api-service:   3 replicas, 512MB RAM, 0.5 CPU
     web-frontend:  2 replicas, 128MB RAM, 0.25 CPU

  3. Buat Service untuk masing-masing
  4. Buat Ingress untuk expose web-frontend

  Estimasi biaya (Autopilot):
    Total resource: ~2.5 vCPU, ~2.5GB RAM
    ~$60-80/bulan (jauh lebih murah dari 3 VM terpisah)
```

---

## Skenario: Enterprise Multi-environment

```
Situasi:
  Production + Staging + Development
  Team 20 developer, compliance requirement

Pilihan: GKE Standard (butuh custom node pool, GPU)

Cluster:
  prod-cluster:    Standard, Regional, Private cluster
  staging-cluster: Standard, Zonal, Public cluster
  dev-cluster:     Autopilot (simple, murah)

Fleet: Register semua cluster ke fleet untuk centralized management

Node pools (prod):
  default:   e2-standard-4 (on-demand)   ──► critical workload
  batch:     e2-standard-8 (Spot VM)     ──► batch processing (hemat 60%)
  gpu:       n1-standard-4 + T4 GPU      ──► ML inference
```

---

## CLI: Create Cluster

```bash
# Autopilot cluster
gcloud container clusters create-auto my-cluster \
    --region=asia-southeast2 \
    --release-channel=regular

# Standard cluster
gcloud container clusters create my-cluster \
    --region=asia-southeast2 \
    --num-nodes=3 \
    --machine-type=e2-standard-4 \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=10 \
    --release-channel=regular \
    --enable-ip-alias

# Connect ke cluster
gcloud container clusters get-credentials my-cluster \
    --region=asia-southeast2

# Verify
kubectl get nodes
```
