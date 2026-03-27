# Pricing

Memahami biaya Compute Engine berdasarkan tampilan di GCP Console.

---

## 1. Monthly Estimate (saat Create VM)

> **Console:** Compute Engine → Create Instance → panel kanan: **Monthly estimate**

Saat create VM, panel kanan langsung menampilkan estimasi biaya:

```
╔═══════════════════════════════════════════╗
║  Monthly estimate                        ║
║  $7.00                                   ║
║  That's about $0.01 hourly               ║
║                                          ║
║  Item                 Monthly estimate   ║
║  ─────────────────────────────────────── ║
║  2 vCPU + 4 GB memory      $5.70        ║
║  10 GB balanced disk        $1.30        ║
║  Logging                    Cost varies  ║
║  Monitoring                 Cost varies  ║
║  Snapshot schedule          Cost varies  ║
║  ─────────────────────────────────────── ║
║  Total                      $7.00        ║
╚═══════════════════════════════════════════╝
```

**Penting:** Estimasi ini hanya untuk **Spot VM** kalau provisioning model = Spot. Untuk Standard, harganya jauh lebih tinggi.

### Komponen Biaya

| Komponen | Ditampilkan di panel? | Keterangan |
|----------|----------------------|------------|
| **vCPU + Memory** | Ya (angka pasti) | Biaya compute utama |
| **Boot disk** | Ya (angka pasti) | Tergantung type dan size |
| **Additional disk** | Ya (angka pasti) | Kalau ada |
| **Logging** | "Cost varies" | Tergantung volume log, gratis 50 GB/bulan pertama |
| **Monitoring** | "Cost varies" | Gratis untuk metrics dasar, bayar untuk custom/Ops Agent advanced |
| **Snapshot schedule** | "Cost varies" | ~$0.026/GB/bulan |
| **Network egress** | Tidak ditampilkan | Bayar saat traffic keluar dari Google network |
| **External IP** | Tidak ditampilkan | Static IP idle = ~$3/bln |
| **OS license** | Ya (kalau Windows) | Windows Server tambah $50-200+/bln |

---

## 2. Billing Reports

> **Console:** Billing → **Reports**

### Filter

| Filter | Fungsi |
|--------|--------|
| **Time range** | Pilih periode (bulan ini, bulan lalu, custom) |
| **Group by** | SKU / Service / Project / Label |
| **Service** | Filter per service (Compute Engine, Cloud Storage, dll) |

### Tips Membaca Report

Dari Billing Reports, kamu bisa lihat:
- Service mana yang paling mahal
- Trend biaya naik/turun
- Breakdown per SKU (misal: "N2 Custom Instance Core" vs "Balanced PD Capacity")

---

## 3. Cost Breakdown per Komponen

### vCPU + Memory (Standard, On-Demand)

> Region: asia-southeast2 (Jakarta)

| Komponen | E2 | N2 | N2D |
|----------|----|----|-----|
| Per vCPU/bulan | ~$24 | ~$29 | ~$25 |
| Per GB RAM/bulan | ~$3.2 | ~$3.9 | ~$3.4 |

### Harga Machine Type Populer (Standard On-Demand)

| Machine Type | vCPU | RAM | ~$/bulan (Standard) | ~$/bulan (Spot) |
|-------------|------|-----|---------------------|-----------------|
| e2-micro | 0.25 | 1 GB | ~$8 | ~$2.72 |
| e2-small | 0.5 | 2 GB | ~$15 | ~$4.50 |
| e2-medium | 1 | 4 GB | ~$37 | ~$7.00 |
| e2-standard-2 | 2 | 8 GB | ~$73 | ~$22 |
| e2-standard-4 | 4 | 16 GB | ~$146 | ~$44 |
| e2-standard-8 | 8 | 32 GB | ~$293 | ~$88 |
| n2-standard-2 | 2 | 8 GB | ~$89 | ~$20 |
| n2-standard-4 | 4 | 16 GB | ~$178 | ~$40 |
| n2-highcpu-4 | 4 | 4 GB | ~$129 | ~$29 |
| n2-highcpu-8 | 8 | 8 GB | ~$258 | ~$58 |
| n2-highcpu-16 | 16 | 16 GB | ~$515 | ~$116 |
| n2-highmem-4 | 4 | 32 GB | ~$240 | ~$54 |
| n2-highmem-8 | 8 | 64 GB | ~$480 | ~$108 |

### Disk Pricing

| Disk Type | Per GB/bulan | 100 GB/bulan |
|-----------|-------------|-------------|
| pd-standard (HDD) | ~$0.048 | ~$4.80 |
| pd-balanced (SSD lite) | ~$0.108 | ~$10.80 |
| pd-ssd (full SSD) | ~$0.187 | ~$18.70 |
| Snapshot | ~$0.026 | ~$2.60 |

### Network Egress

| Destination | Harga/GB |
|-------------|----------|
| Dalam region yang sama | Gratis |
| Antar region (Indonesia) | ~$0.01 |
| Ke internet (Asia) | ~$0.12 |
| Ke internet (US/Europe) | ~$0.085 |

---

## 4. Pricing Calculator

> **Console:** klik **Compute Engine pricing** link di panel Monthly estimate  
> Atau buka: https://cloud.google.com/products/calculator

Di Pricing Calculator kamu bisa simulasi biaya lengkap sebelum buat resource.

---

## 5. Diskon Otomatis: Sustained Use Discounts (SUD)

> **Console:** Billing → **Committed use discounts** → Sustained Use Discounts section

GCP **otomatis** kasih diskon kalau VM jalan terus dalam 1 bulan. Tidak perlu commit apapun.

```
╔═══════════════════════════════════════════════════╗
║  Jam 0-25%  dari bulan  → harga penuh            ║
║  Jam 25-50% dari bulan  → diskon ~20%            ║
║  Jam 50-75% dari bulan  → diskon ~40%            ║
║  Jam 75-100% dari bulan → diskon ~60%            ║
║                                                   ║
║  VM jalan penuh 1 bulan → rata-rata diskon ~30%  ║
╚═══════════════════════════════════════════════════╝
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Otomatis, tidak perlu commit | Diskon tidak sebesar CUD |
| Berlaku untuk semua VM yang running | Hanya untuk N1, N2, N2D (E2 tidak dapat SUD) |
| Tidak ada penalty kalau stop VM | |

---

## 6. Committed Use Discounts (CUD)

> **Console:** Compute Engine → **Committed use discounts** → **Purchase commitment**

Commit pakai resource selama 1 tahun atau 3 tahun untuk diskon besar.

### Create Commitment

> **Console:** Committed use discounts → **Purchase commitment**

| Field | Pilihan | Keterangan |
|-------|---------|------------|
| **Name** | Nama commitment | Contoh: `ftlgym-prod-1yr` |
| **Region** | Region resource | `asia-southeast2` |
| **Plan** | 1 year / 3 years | 3 tahun lebih murah tapi lebih berisiko |
| **Type** | General purpose / Compute optimized / Memory optimized | Sesuai machine family |
| **Resources** | vCPU count + Memory amount | Total resource yang di-commit |

### Perbandingan Diskon

| Plan | Diskon | Contoh n2-highcpu-16 |
|------|--------|----------------------|
| On-demand | 0% | ~$515/bulan |
| Sustained Use (otomatis) | ~30% | ~$360/bulan |
| 1 Year CUD | ~37% | ~$324/bulan |
| 3 Year CUD | ~55% | ~$232/bulan |

| Kelebihan | Kekurangan |
|-----------|------------|
| Diskon besar (37-55%) | **Commitment**: bayar terus meski VM stop/delete |
| Berlaku ke seluruh region | Tidak bisa cancel |
| Otomatis apply ke VM yang match | Harus prediksi kebutuhan 1-3 tahun ke depan |

**Rekomendasi:** CUD untuk VM production yang pasti jalan 24/7.

---

## 7. Spot VM Pricing

> **Console:** Create Instance → Provisioning model → **Spot**

| Kelebihan | Kekurangan |
|-----------|------------|
| Diskon 60-91% dari harga on-demand | GCP bisa terminate kapan saja |
| Sangat murah untuk batch jobs | Tidak ada SLA uptime |
| Cocok untuk non-critical workload | Tidak cocok untuk production |

**Contoh harga di Console (Jakarta):**

```
e2-micro:
  Standard  → ~$8/bulan
  Spot      → ~$2.72/bulan    (hemat 66%)

e2-medium:
  Standard  → ~$37/bulan
  Spot      → ~$7.00/bulan    (hemat 81%)

n2-highcpu-16:
  Standard  → ~$515/bulan
  Spot      → ~$116/bulan     (hemat 77%)
```

---

## 8. GCP Recommendations

> **Console:** Compute Engine → VM instances → kolom **Recommendation** (icon kuning)

GCP otomatis kasih rekomendasi cost saving:

| Recommendation | Artinya | Contoh |
|----------------|---------|--------|
| 🔶 "Resize VM" | VM terlalu besar untuk workload-nya | "Change machine type from e2-standard-4 to e2-standard-2. Save $73/month" |
| 🔶 "Idle VM" | VM running tapi hampir tidak dipakai | "Stop or delete this VM. Save $37/month" |
| 🔶 "Idle disk" | Disk tidak attached ke VM apapun | "Delete this disk. Save $5/month" |
| 🔶 "Idle IP" | Static IP tidak dipakai | "Release this IP. Save $3/month" |

> **Console:** Home → **Recommendations** (halaman khusus semua recommendations)

Atau:

> **Console:** Compute Engine → VM instances → klik VM → **Recommendations** section

---

## 9. Simulasi Biaya Project ftlgym

### Biaya Saat Ini (On-Demand)

| VM | Machine Type | Status | ~$/bulan |
|----|-------------|--------|----------|
| ftlgymweb | n2-highcpu-16 | RUNNING | ~$515 |
| apiserver1 | n2-custom(2,4GB) | RUNNING | ~$70 |
| dbserver1 | n2-custom(12,24GB) | RUNNING | ~$440 |
| dbserver2 | n2-custom(2,6GB) | RUNNING | ~$80 |
| ftlhorizon1 | e2-custom(6,8GB) | RUNNING | ~$170 |
| ftlgym-mobile | e2-custom(6,12GB) | RUNNING | ~$180 |
| stridegym | e2-medium | RUNNING | ~$37 |
| ftlgym-cdc | e2-custom(4,6GB) | TERMINATED | ~$0 |
| apmserver | e2-standard-4 | TERMINATED | ~$0 |
| ftlhorizon2 | e2-custom(6,8GB) | TERMINATED | ~$0 |
| **Subtotal VM** | | | **~$1,492** |
| Disks (~500GB) | pd-balanced + pd-ssd | | ~$54 |
| Snapshots | | | ~$13 |
| Load Balancer | forwarding rules | | ~$50 |
| **GRAND TOTAL** | | | **~$1,609/bulan** |

### Potensi Penghematan

| Strategi | Saving | Total baru |
|----------|--------|------------|
| On-demand (sekarang) | 0 | ~$1,609 |
| + SUD (otomatis, N2 only) | ~$300 | ~$1,309 |
| + 1 Year CUD (N2 VMs) | ~$400 | ~$1,209 |
| + Stop dev VM malam hari | ~$50 | ~$1,159 |
| + Right-size (cek recommendations) | ~$100 | ~$1,059 |

---

## 10. Budget Alerts

> **Console:** Billing → **Budgets & alerts** → **Create budget**

### Create Budget

| Field | Keterangan |
|-------|------------|
| **Name** | Nama budget (contoh: `ftlgym-monthly`) |
| **Projects** | Filter ke project tertentu |
| **Services** | Filter ke service tertentu (atau semua) |
| **Amount** | Budget amount (contoh: $2,000) |
| **Thresholds** | Persentase dimana alert dikirim |

#### Default Thresholds

| Threshold | Artinya |
|-----------|---------|
| 50% | Sudah pakai setengah budget |
| 90% | Hampir habis |
| 100% | Budget tercapai |

**Catatan:** Budget alerts hanya **notifikasi**, tidak otomatis stop resource. Kalau mau auto-stop, harus setup Cloud Function + Pub/Sub.
