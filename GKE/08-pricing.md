# Pricing

Komponen biaya **GKE** dan perbandingan Autopilot vs Standard, berorientasi **GCP Console**.

---

## Komponen Biaya

| Komponen | Deskripsi | Dihitung per |
|----------|-----------|-------------|
| **Cluster management fee** | Biaya control plane (Autopilot: free, Standard: free untuk 1 zonal) | Per jam |
| **Nodes (Compute)** | VM Compute Engine yang jadi node | Per jam (vCPU + RAM) |
| **Storage** | Persistent Disk untuk node dan PVC | Per GB/bulan |
| **Network** | Egress traffic, Load Balancer | Per GB + per jam |
| **Autopilot Pod resource** | (Autopilot only) bayar per resource Pod | Per vCPU-jam + GB-jam |

### Cluster management fee

| Mode | Fee |
|------|-----|
| Autopilot | **$0.10/jam** (~$73/bulan) |
| Standard (zonal) | **$0.10/jam** (~$73/bulan) — dibebankan, tapi ada **credit $74.40/bulan per billing account** yang otomatis meng-offset biaya ini (efektif menutupi ~1 zonal cluster per billing account, bukan per project) |
| Standard (regional) | **$0.10/jam** (~$73/bulan) |

---

## Autopilot Pricing

Bayar berdasarkan **resource yang diminta Pod** (requests), bukan per VM.

| Resource | Harga (perkiraan) |
|----------|-------------------|
| vCPU | ~$0.0445/vCPU-jam |
| Memory | ~$0.0049/GB-jam |
| Ephemeral storage | ~$0.00011/GB-jam |

### Contoh Autopilot

```
3 Pod, masing-masing: 0.5 vCPU, 512MB RAM
Running 24/7 selama 1 bulan (730 jam)

vCPU:    3 × 0.5 × 730 × $0.0445  = $48.72
Memory:  3 × 0.5 × 730 × $0.0049  = $5.37
Management fee:      730 × $0.10   = $73.00
──────────────────────────────────────────────
Total perkiraan                    ≈ $127/bulan
```

---

## Standard Pricing

Bayar berdasarkan **VM nodes** — terpakai atau tidak.

### Contoh Standard

```
3 nodes × e2-standard-4 (4 vCPU, 16GB RAM)
Region: asia-southeast2
Running 24/7

Per node: ~$100/bulan
3 nodes: ~$300/bulan
Management fee (regional): ~$73/bulan
──────────────────────────────────────
Total perkiraan         ≈ $373/bulan

Tapi nodes mungkin hanya 50% utilized
──► Bayar $373, efektif pakai ~$186 worth of resource
```

---

## Autopilot vs Standard — Perbandingan Biaya

| Skenario | Autopilot | Standard |
|----------|-----------|----------|
| **Workload kecil** (2-3 Pod, <2 vCPU total) | ~$80-130/bulan | ~$180-250/bulan (nodes under-utilized) |
| **Workload medium** (10 Pod, ~8 vCPU total) | ~$350-400/bulan | ~$350-450/bulan |
| **Workload besar** (50+ Pod, custom needs) | ~$1000+/bulan | ~$800-1200/bulan (bisa optimize) |
| **Variable traffic** (spike dan sepi) | Hemat (scale to 0 possible) | Boros jika tidak setup autoscaler |

**Kesimpulan:**
- **Workload kecil → Autopilot lebih murah** (tidak bayar idle node)
- **Workload besar dan stabil → Standard bisa lebih murah** (optimize node utilization)

---

## Tips Hemat Biaya

| Tips | Detail | Hemat |
|------|--------|-------|
| **Spot VM node pool** | Node pool dengan Spot VM (60-91% diskon) untuk non-critical | 60-91% per node |
| **Cluster Autoscaler** | Scale down nodes saat sepi | 30-60% |
| **Right-size Pod resources** | VPA recommend → kurangi over-provisioned resources | 20-50% |
| **Autopilot** untuk workload kecil/variable | Tidak bayar idle nodes | Variable |
| **Committed Use Discount** | Commit 1-3 tahun untuk node VM | 25-52% |
| **Matikan cluster dev** di luar jam kerja | Stop nodes atau delete cluster dev | 60-70% non-prod |
| **Namespace resource quotas** | Cegah team over-provision | Prevent waste |
| **Bin packing** | Set resource requests yang tepat → lebih banyak Pod per Node | 20-40% |

### Spot VM Node Pool

```bash
# Buat node pool dengan Spot VM
gcloud container node-pools create spot-pool \
    --cluster=my-cluster \
    --machine-type=e2-standard-4 \
    --spot \
    --num-nodes=3 \
    --enable-autoscaling \
    --min-nodes=0 \
    --max-nodes=10
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Diskon 60-91% dari on-demand | Bisa di-preempt kapan saja (max 24 jam) |
| Otomatis replace jika di-preempt | Tidak cocok untuk stateful / long-running |
| Cocok untuk batch, CI/CD, dev | — |

---

## Billing di Console

**Console:** `Billing` → **Reports** → filter:
- **Service:** Kubernetes Engine
- **SKU:** Autopilot vCPU, Memory, Management fee, dll

### Budget alert

**Console:** `Billing` → **Budgets & alerts** → **Create budget**
