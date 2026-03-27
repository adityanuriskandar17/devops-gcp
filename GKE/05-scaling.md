# Scaling

Panduan **autoscaling** di GKE — HPA, VPA, Cluster Autoscaler, Node Pool — berorientasi **GCP Console**.

---

## 3 Level Autoscaling di GKE

```
Level 1: HPA (Horizontal Pod Autoscaler)
  ──► Tambah/kurangi jumlah Pod berdasarkan CPU/RAM/custom metric

Level 2: VPA (Vertical Pod Autoscaler)
  ──► Adjust resource requests/limits Pod berdasarkan actual usage

Level 3: Cluster Autoscaler (Node Autoscaler)
  ──► Tambah/kurangi jumlah Node (VM) berdasarkan pending Pods
```

---

## HPA (Horizontal Pod Autoscaler)

**Console:** `Kubernetes Engine` → **Workloads** → klik Deployment → **ACTIONS** → **Autoscale**

Menambah atau mengurangi **jumlah Pod** berdasarkan metric.

```
Traffic rendah:   [Pod 1] [Pod 2]
                  CPU: 20%

Traffic naik:     [Pod 1] [Pod 2] [Pod 3] [Pod 4] [Pod 5]
                  CPU: 70% ──► HPA tambah Pod

Traffic turun:    [Pod 1] [Pod 2]
                  CPU: 15% ──► HPA kurangi Pod
```

### Konfigurasi HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

| Setting | Rekomendasi |
|---------|-------------|
| **minReplicas** | ≥ 2 (HA — jangan 1 untuk production) |
| **maxReplicas** | Sesuai budget dan kapasitas |
| **target CPU** | 60-80% (terlalu rendah = overspend, terlalu tinggi = slow scale) |

### Kelebihan & kekurangan HPA

| Kelebihan | Kekurangan |
|-----------|------------|
| Scale otomatis sesuai traffic | Perlu set resource requests di Pod |
| Hemat biaya (kurangi Pod saat sepi) | Scale up butuh waktu (Pod start ~detik) |
| Custom metrics (request count, queue length) | Bisa flapping jika threshold terlalu ketat |

---

## VPA (Vertical Pod Autoscaler)

**Console:** `Kubernetes Engine` → **Workloads** → klik Deployment → lihat **Resource recommendations**

VPA menganalisis actual usage dan **merekomendasikan** atau **otomatis adjust** resource requests/limits.

```
Saat ini: requests 1GB RAM → actual usage: 300MB
VPA rekomendasi: requests 400MB RAM
──► Hemat 600MB RAM per Pod × 5 Pod = 3GB RAM hemat
```

### Mode VPA

| Mode | Deskripsi |
|------|-----------|
| **Off** | Tidak aktif |
| **Initial** | Set resource saat Pod dibuat, tidak update yang sudah running |
| **Auto** | Otomatis restart Pod dengan resource baru (bisa disruptive) |
| **Recommend only** | Hanya tampilkan rekomendasi, tidak action. **Recommended untuk mulai.** |

### Kelebihan & kekurangan VPA

| Kelebihan | Kekurangan |
|-----------|------------|
| Right-sizing otomatis | Auto mode restart Pod (sementara downtime) |
| Identifikasi over/under-provisioned | Tidak cocok dipakai bersamaan dengan HPA pada metric yang sama |
| Hemat resource dan biaya | — |

---

## Cluster Autoscaler

**Console:** `Kubernetes Engine` → **Clusters** → klik cluster → **Node Pools** → klik pool → **Edit** → **Enable cluster autoscaler**

Menambah/kurangi **jumlah Node (VM)** berdasarkan Pod yang pending (tidak bisa dijadwalkan karena resource tidak cukup).

```
Situasi: HPA menambah Pod, tapi semua Node sudah penuh

  Node 1: [Pod][Pod][Pod] ◄── PENUH
  Node 2: [Pod][Pod][Pod] ◄── PENUH
  Pod baru: PENDING (tidak ada tempat)

Cluster Autoscaler:
  ──► Deteksi Pod pending
  ──► Tambah Node 3 (provisioning VM baru, ~1-2 menit)
  ──► Pod pending dijadwalkan ke Node 3

Situasi sepi: Node 3 kosong
  ──► Cluster Autoscaler hapus Node 3 (scale down)
  ──► Hemat biaya
```

### Setting Cluster Autoscaler

| Setting | Deskripsi |
|---------|-----------|
| **Minimum nodes** | Minimum jumlah node di pool (misal: 1) |
| **Maximum nodes** | Maximum jumlah node di pool (misal: 10) |
| **Auto-provisioning** | GKE otomatis buat node pool baru jika tidak ada pool yang cocok |

### Kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Scale node otomatis | Scale up butuh ~1-2 menit (provisioning VM) |
| Scale down saat sepi = hemat biaya | Pod bisa terganggu saat scale down (eviction) |
| Bisa combine dengan Spot VM | — |

---

## Node Pool

**Console:** `Kubernetes Engine` → **Clusters** → klik cluster → **Node Pools** → **ADD NODE POOL**

Node Pool = group of nodes dengan **machine type dan config yang sama**.

### Strategi Node Pool

| Node Pool | Machine type | Tipe VM | Workload |
|-----------|-------------|---------|----------|
| `default` | e2-standard-4 | On-demand | Critical production |
| `batch` | e2-standard-8 | **Spot VM** (60-91% diskon) | Batch jobs, non-critical |
| `highcpu` | c2-standard-8 | On-demand | CPU-intensive workload |
| `gpu` | n1-standard-4 + T4 | On-demand | ML inference |

```
Cluster
  ├── Node Pool "default" (on-demand, e2-standard-4)
  │     ├── Node 1: [web-frontend] [api-backend]
  │     └── Node 2: [api-backend] [admin-panel]
  │
  ├── Node Pool "batch" (Spot VM, e2-standard-8)
  │     └── Node 3: [batch-job-1] [batch-job-2]
  │
  └── Node Pool "gpu" (on-demand, n1 + T4 GPU)
        └── Node 4: [ml-inference]
```

---

## Skenario: Full Autoscaling

```
E-commerce website: traffic bervariasi

  Normal (weekday):   HPA: 3 Pod, Nodes: 2
  Flash sale:         HPA scale ke 20 Pod, Nodes scale ke 8
  Malam hari:         HPA: 2 Pod, Nodes scale down ke 1

  Cost saving:
    Tanpa autoscaling: 8 nodes 24/7 = $800/bulan
    Dengan autoscaling: avg 3 nodes  = $300/bulan
    Hemat: 62%
```
