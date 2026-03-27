# Alerting Policies

Dokumentasi lengkap **Alerting** di Google Cloud Monitoring — notifikasi otomatis saat metrics melebihi batas yang ditentukan.

**Console:** Monitoring → **Alerting**

---

## Apa itu Alerting?

Alerting adalah sistem **notifikasi otomatis** yang memantau metrics secara real-time dan mengirim pemberitahuan ketika kondisi tertentu terpenuhi (misal CPU > 80% selama 5 menit).

```
Alur Alerting:

  Metrics (CPU, RAM, Disk, dll)
       │
       ▼
  ┌─────────────────────────┐
  │   Alerting Policy        │
  │                         │
  │   Condition:            │
  │   "CPU > 80% for 5m"   │
  │                         │
  │   ┌─────┐   ┌───────┐  │
  │   │ OK  │──►│ FIRING│  │  ← threshold tercapai
  │   └─────┘   └───┬───┘  │
  └──────────────────┼──────┘
                     │
                     ▼
  ┌─────────────────────────┐
  │   Notification Channels  │
  │                         │
  │   📧 Email              │
  │   💬 Slack              │
  │   📱 PagerDuty          │
  │   📨 Pub/Sub            │
  └─────────────────────────┘
                     │
                     ▼
  ┌─────────────────────────┐
  │   Incident Created       │
  │   → Tim on-call respond  │
  │   → Acknowledge          │
  │   → Resolve              │
  └─────────────────────────┘
```

---

## Membuat Alerting Policy — Panduan Lengkap Console

**Console:** Monitoring → Alerting → **+ Create Policy**

### Layout Halaman Create Alerting Policy

Saat klik **+ Create Policy**, Console menampilkan halaman dengan layout berikut:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  Create alerting policy          [+ ADD ALERT CONDITION] [🗑 DELETE] [<> VIEW CODE]  [✕] │
│                                                                               │
│  ┌──────────────┐  ┌──────────────────────────────┐  ┌─────────────────────┐  │
│  │ SIDEBAR      │  │  MAIN CONTENT                │  │  CHART PREVIEW      │  │
│  │              │  │                              │  │                     │  │
│  │ ALERT        │  │  Policy configuration mode   │  │ ✓1hr 6hr 1d 7d 30d │  │
│  │ CONDITIONS   │  │  ● Builder  ○ Code editor    │  │                     │  │
│  │              │  │                              │  │ VM Instance - CPU   │  │
│  │ ● VM Instance│  │  Select a metric ⓘ          │  │ utilization         │  │
│  │   - CPU util │  │  [VM INSTANCE-CPU UTIL ▼]    │  │                     │  │
│  │   ∘ Configure│  │                              │  │  15%│               │  │
│  │     trigger  │  │  Add filters (Optional)      │  │  10%│ ╱╲  ╱╲  ╱╲   │  │
│  │              │  │  [ADD A FILTER]              │  │   5%│╱  ╲╱  ╲╱  ╲  │  │
│  │ ALERT        │  │                              │  │     └──────────────  │  │
│  │ DETAILS      │  │  Transform data              │  │                     │  │
│  │              │  │  ┌ Within each time series   │  │ ≡ Filter │ ⓘ │ 📊  │  │
│  │ ∘ Notif &    │  │  │  Rolling window: 5 min    │  │                     │  │
│  │   name       │  │  │  Rolling fn: mean         │  │ ☐ Metric    Value   │  │
│  │ ∘ Review     │  │  └                           │  │ ● utiliz.  8.997%   │  │
│  │   alert      │  │  ▸ Across time series        │  │                     │  │
│  │              │  │                              │  │                     │  │
│  │              │  │  ⊖ Add secondary data transf  │  │                     │  │
│  │              │  │                              │  │                     │  │
│  │              │  │         [ NEXT ]              │  │                     │  │
│  └──────────────┘  └──────────────────────────────┘  └─────────────────────┘  │
│                                                                               │
│                    [CREATE POLICY]  [PROVIDE FEEDBACK]  [CANCEL]               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Penjelasan Setiap Area

| Area | Lokasi | Fungsi |
|------|--------|--------|
| **Left Sidebar** | Kiri | Navigasi step-by-step — menunjukkan progress pembuatan policy |
| **Main Content** | Tengah | Area konfigurasi utama — berubah sesuai step yang dipilih |
| **Chart Preview** | Kanan | Preview real-time metric yang dipilih — langsung terlihat data aktual |
| **Top Bar** | Atas | Tombol aksi global: tambah/hapus condition, view code, close |
| **Bottom Bar** | Bawah | Tombol final: Create Policy, Provide Feedback, Cancel |

---

### Left Sidebar — Navigasi Step

Sidebar kiri menampilkan **step-by-step wizard** untuk membuat policy:

```
ALERT CONDITIONS            ← Section 1
│
├─ ● VM Instance - CPU      ← Condition yang sedang dikonfigurasi
│    utilization             
│    ∘ Configure trigger     ← Sub-step trigger
│
ALERT DETAILS               ← Section 2
│
├─ ∘ Notifications and name ← Step notifikasi
├─ ∘ Review alert           ← Step review akhir
```

| Step | Apa yang Dikonfigurasi | Keterangan |
|------|----------------------|------------|
| **VM Instance - CPU utilization** | Metric, filter, transform data | Step pertama — pilih "apa yang dimonitor" |
| **Configure trigger** | Threshold, condition type, duration | Step kedua — "kapan alert fires" |
| **Notifications and name** | Channel notifikasi, nama policy, severity, documentation | Step ketiga — "siapa yang diberitahu" |
| **Review alert** | Review semua konfigurasi sebelum create | Step terakhir — verifikasi |

**Navigasi:** Bisa klik langsung pada step di sidebar, atau gunakan tombol **NEXT** di main content.

---

### Top Bar — Tombol Aksi

```
[+ ADD ALERT CONDITION]    [🗑 DELETE ALERT CONDITION]    [<> VIEW CODE]    [✕]
```

| Tombol | Fungsi | Penjelasan Detail |
|--------|--------|-------------------|
| **+ ADD ALERT CONDITION** | Tambah condition baru ke policy yang sama | Satu policy bisa punya **multiple conditions** — misal: CPU > 80% **DAN** Memory > 90% |
| **DELETE ALERT CONDITION** | Hapus condition yang sedang aktif | Berguna saat ingin menghapus condition yang salah konfigurasi |
| **VIEW CODE** | Lihat policy dalam format **MQL atau JSON** | Berguna untuk copy-paste ke Terraform/API, atau debug konfigurasi |
| **✕** (Close) | Tutup halaman create policy | Kembali ke halaman Alerting utama |

#### + ADD ALERT CONDITION — Multiple Conditions

```
Contoh: Alert saat CPU tinggi DAN Memory tinggi secara bersamaan

  ALERT CONDITIONS
  │
  ├─ ● Condition 1: VM Instance - CPU utilization > 80%
  │    ∘ Configure trigger
  │
  ├─ ● Condition 2: VM Instance - Memory utilization > 90%
  │    ∘ Configure trigger
  │
  ├─ Multi-condition trigger:
  │    ● All conditions are met    ← CPU > 80% DAN Memory > 90%
  │    ○ Any condition is met      ← CPU > 80% ATAU Memory > 90%
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Kurangi false positive — alert hanya saat multiple signals agree | Konfigurasi lebih kompleks |
| Lebih akurat mencerminkan masalah nyata | Jika salah satu condition bermasalah, bisa miss real alert |
| Cocok untuk composite alert (CPU + Memory + Disk) | Sulit debug ketika alert tidak trigger |

#### VIEW CODE — Lihat Konfigurasi sebagai Code

Klik **VIEW CODE** menampilkan policy dalam format JSON/MQL:

```json
{
  "displayName": "High CPU - Production VMs",
  "conditions": [{
    "displayName": "VM Instance - CPU utilization",
    "conditionThreshold": {
      "filter": "resource.type = \"gce_instance\" AND metric.type = \"compute.googleapis.com/instance/cpu/utilization\"",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 0.8,
      "duration": "300s",
      "aggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_MEAN"
      }]
    }
  }],
  "notificationChannels": ["projects/my-project/notificationChannels/12345"]
}
```

| Kegunaan VIEW CODE | Penjelasan |
|-------------------|------------|
| **Export ke Terraform** | Copy JSON lalu convert ke HCL untuk Infrastructure as Code |
| **Debug** | Lihat persis filter dan aggregation yang dipakai (kadang Builder UI menyembunyikan detail) |
| **Copy ke project lain** | Salin konfigurasi policy ke project GCP lain via API |
| **Version control** | Simpan policy config di Git untuk audit trail |

---

### Policy Configuration Mode

Bagian paling atas di main content — memilih cara konfigurasi policy.

```
  Policy configuration mode

  ● Builder              ○ Code editor (MQL or PromQL)
```

| Mode | Cara Kerja | Cocok Untuk |
|------|-----------|-------------|
| **Builder** (default) | GUI point-and-click — pilih metric, filter, threshold dari dropdown | Pemula, konfigurasi standar, cepat |
| **Code editor** | Tulis query manual dalam **MQL** (Monitoring Query Language) atau **PromQL** (Prometheus Query Language) | Advanced user, query kompleks, migrasi dari Prometheus |

#### Builder Mode (Default)

Semua konfigurasi menggunakan dropdown dan form input — tidak perlu menulis query manual.

```
Builder Mode:

  Select a metric ⓘ
  ┌─────────────────────────────────────────────┐
  │ ⊞ VM INSTANCE - CPU UTILIZATION           ▼│
  └─────────────────────────────────────────────┘

  Add filters (Optional)
  ┌──────────────┐
  │ ADD A FILTER │
  └──────────────┘

  Transform data
  ...
```

#### Code Editor Mode (MQL / PromQL)

Beralih ke text editor — bisa tulis query sendiri.

```
Code editor mode:

  ┌─────────────────────────────────────────────────┐
  │ Language: ● MQL  ○ PromQL                       │
  │                                                 │
  │ fetch gce_instance                              │
  │ | metric 'compute.googleapis.com/instance/      │
  │          cpu/utilization'                        │
  │ | filter zone = 'asia-southeast2-a'             │
  │ | group_by [resource.instance_id]               │
  │ | every 5m                                      │
  │ | condition val() > 0.8 '5m'                    │
  └─────────────────────────────────────────────────┘
```

| Aspek | Builder | Code Editor (MQL) | Code Editor (PromQL) |
|-------|---------|-------------------|---------------------|
| **Kemudahan** | Sangat mudah | Perlu belajar syntax MQL | Perlu belajar syntax PromQL |
| **Flexibility** | Terbatas pada opsi UI | Sangat flexible | Sangat flexible |
| **Complex query** | Sulit/tidak bisa | Bisa (join, ratio, math) | Bisa |
| **Migrasi** | — | Native GCP | Cocok jika sudah pakai Prometheus |
| **Rekomendasi** | Gunakan untuk 90% kasus | Gunakan saat Builder tidak cukup | Gunakan jika tim sudah familiar Prometheus |

---

### Select a Metric

Pilih **resource type** dan **metric** yang ingin dimonitor.

```
Klik dropdown → muncul hierarchi:

  ┌────────────────────────────────────────────────────┐
  │  Select a metric                                   │
  │                                                    │
  │  🔍 Search metrics...                              │
  │                                                    │
  │  ▸ VM Instance                                     │
  │    ├─ cpu                                          │
  │    │  ├─ CPU utilization                           │ ← gauge (0-1)
  │    │  └─ Reserved cores                            │
  │    ├─ disk                                         │
  │    │  ├─ Disk read bytes                           │ ← counter
  │    │  └─ Disk write bytes                          │
  │    ├─ network                                      │
  │    │  ├─ Received bytes count                      │
  │    │  └─ Sent bytes count                          │
  │    └─ memory (requires Ops Agent)                  │
  │       ├─ Memory utilization                        │
  │       └─ Memory usage                              │
  │                                                    │
  │  ▸ Cloud SQL Database                              │
  │  ▸ GKE Container                                   │
  │  ▸ HTTP/S Load Balancer Rule                       │
  │  ▸ Cloud Storage Bucket                            │
  │  ...                                               │
  └────────────────────────────────────────────────────┘
```

Setelah dipilih, metric ditampilkan sebagai **chip/badge**:

```
  ┌──────────────────────────────────────────────┐
  │ ⊞ VM INSTANCE - CPU UTILIZATION            ▼│  ← klik ▼ untuk ganti
  └──────────────────────────────────────────────┘
```

---

### Add Filters (Optional)

Filter mempersempit data hanya ke resource tertentu.

```
Klik [ADD A FILTER]:

  ┌──────────────────────────────────────────────────────┐
  │  Filter 1:                                           │
  │  ┌──────────────┐  ┌──────┐  ┌────────────────┐     │
  │  │ instance_name│  │  =   │  │ web-prod-1     │     │
  │  └──────────────┘  └──────┘  └────────────────┘     │
  │                                                      │
  │  [ADD A FILTER]  ← tambah filter lagi (AND)          │
  └──────────────────────────────────────────────────────┘
```

| Label yang bisa difilter | Contoh Value | Kegunaan |
|--------------------------|-------------|----------|
| **instance_name** | `web-prod-1` | Target VM spesifik |
| **zone** | `asia-southeast2-a` | Semua VM di zone tertentu |
| **project_id** | `my-project-id` | Jika multi-project scope |
| **instance_id** | `1234567890` | VM by ID (lebih presisi) |
| **metadata.user_labels.env** | `production` | Berdasarkan label custom |

**Operator yang tersedia:**
- `=` (equals)
- `!=` (not equals)
- `=~` (regex match)
- `!=~` (regex not match)

**Tips:** Selalu filter ke environment **production** saja untuk alert penting — hindari alert dari dev/staging.

---

### Transform Data — Penjelasan Lengkap

Bagian **Transform data** adalah inti dari cara data metric diproses **sebelum** dibandingkan dengan threshold. Ada 3 sub-section:

```
Transform data
│
├─ Within each time series    ← Proses data di DALAM setiap series
│   ├─ Rolling window
│   └─ Rolling window function
│
├─ Across time series         ← Proses data ANTAR series (aggregation)
│   ├─ Time series aggregation
│   └─ Time series group by
│
└─ Add secondary data transformation   ← Transformasi tambahan (opsional)
```

#### Flow Transform Data

```
Raw metric data (setiap detik/menit)
       │
       ▼
┌─────────────────────────────────────┐
│  1. Within each time series         │
│                                     │
│  Raw: [72, 85, 78, 91, 88, 76]     │  ← 6 data points dalam 5 menit
│                                     │
│  Rolling window: 5 min              │
│  Rolling fn: mean                   │
│                                     │
│  Result: mean(72,85,78,91,88,76)    │
│        = 81.67%                     │  ← 1 value per series per window
│                                     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  2. Across time series              │
│                                     │
│  Series A (web-1): 81.67%           │
│  Series B (web-2): 55.33%           │
│  Series C (web-3): 72.10%           │
│                                     │
│  Aggregation: none (per series)     │
│  ATAU                               │
│  Aggregation: mean → 69.7%          │  ← 1 value untuk semua series
│                                     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  3. Compare with Threshold          │
│                                     │
│  81.67% > 80% ?  → YES → ALERT!    │
│  55.33% > 80% ?  → NO              │
│  72.10% > 80% ?  → NO              │
└─────────────────────────────────────┘
```

---

#### Within Each Time Series

Memproses data **di dalam** setiap individual time series. Gunanya: menghaluskan data agar alert tidak trigger karena spike sesaat.

```
Console UI:

  Within each time series ⓘ
  
  Rolling window *
  ┌──────────────────────────────────────────┐
  │ 5 min                                  ▼ │
  └──────────────────────────────────────────┘
  Adjust the length of time a signal is calculated for.
  Example: Mean of CPU utilization for 5 minutes is above 80%
  
  Rolling window function *
  ┌──────────────────────────────────────────┐
  │ mean                                   ▼ │
  └──────────────────────────────────────────┘
  Function applied to the rolling window
```

##### Rolling Window

**Apa itu:** Jendela waktu bergerak (sliding window) yang menentukan **berapa lama** data dikumpulkan sebelum dihitung.

```
Visualisasi Rolling Window 5 menit:

  Timeline: ──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──►
              │  │  │  │  │  │  │  │  │  │
              72 85 78 91 88 76 82 95 87 79  (CPU%)

  Window 1:   [72 85 78 91 88]              → mean = 82.8%
  Window 2:      [85 78 91 88 76]           → mean = 83.6%
  Window 3:         [78 91 88 76 82]        → mean = 83.0%
  Window 4:            [91 88 76 82 95]     → mean = 86.4%  ← ALERT!
```

| Nilai | Arti | Kapan Digunakan |
|-------|------|----------------|
| **1 min** | Data 1 menit terakhir | Alert **sangat cepat**, tapi sensitif (noisy) |
| **5 min** | Data 5 menit terakhir | **Default yang bagus** — balance speed vs noise |
| **10 min** | Data 10 menit terakhir | Kurangi noise, tapi alert lebih lambat |
| **15 min** | Data 15 menit terakhir | Untuk metric yang sering spike (OK selama tidak berkepanjangan) |
| **30 min** | Data 30 menit terakhir | Hanya alert jika masalah **berkepanjangan** |
| **1 hour** | Data 1 jam terakhir | Untuk trend alert (disk filling, connection growing) |

| Kelebihan Rolling Window | Kekurangan Rolling Window |
|--------------------------|--------------------------|
| Mengurangi false positive dari spike sesaat | Window terlalu panjang = lambat detect masalah |
| Memberikan waktu metric untuk "settle" | Window terlalu pendek = noisy alert |
| Konfigurasi sederhana | Tidak cocok untuk deteksi anomaly mendadak |

##### Rolling Window Function

**Apa itu:** Fungsi matematika yang diterapkan pada data **di dalam** rolling window.

| Function | Rumus | Penjelasan | Contoh (data: 72, 85, 78, 91, 88) |
|----------|-------|-----------|-----------------------------------|
| **mean** | Rata-rata | Menghitung nilai rata-rata dalam window | mean = (72+85+78+91+88)/5 = **82.8%** |
| **min** | Minimum | Nilai **terendah** dalam window | min = **72%** |
| **max** | Maximum | Nilai **tertinggi** dalam window | max = **91%** |
| **sum** | Jumlah | Total semua nilai dalam window | sum = **414** |
| **count** | Hitung | Jumlah data point dalam window | count = **5** |
| **count_true** | Boolean true | Hitung berapa kali kondisi true | Untuk boolean metric |
| **count_false** | Boolean false | Hitung berapa kali kondisi false | Untuk boolean metric |
| **fraction_true** | Rasio true | Persentase true dalam window | Untuk uptime ratio |
| **percentile_99** | P99 | Nilai persentil ke-99 | Untuk latency — worst case |
| **percentile_95** | P95 | Nilai persentil ke-95 | Untuk latency — almost worst |
| **percentile_50** | P50 (median) | Nilai tengah | Untuk latency — typical user |

##### Skenario Pemilihan Function

```
Skenario 1: Alert CPU Tinggi (production VM)
  → Rolling window: 5 min
  → Function: mean
  → Threshold: > 80%
  → Alasan: mean menangkap sustained high CPU, bukan spike sesaat

Skenario 2: Alert Latency Buruk (API response time)
  → Rolling window: 5 min
  → Function: percentile_99
  → Threshold: > 2000ms
  → Alasan: P99 menangkap worst-case user experience

Skenario 3: Alert Disk Penuh (paling pesimistis)
  → Rolling window: 10 min
  → Function: max
  → Threshold: > 90%
  → Alasan: max = jika PERNAH sentuh 90% dalam 10 menit, alert

Skenario 4: Alert Memory Rendah
  → Rolling window: 5 min
  → Function: min
  → Threshold: < 10% (free memory)
  → Alasan: min = jika free memory PERNAH turun dibawah 10%

Skenario 5: Alert Error Rate (uptime ratio)
  → Rolling window: 10 min
  → Function: fraction_true
  → Threshold: < 0.99 (99% success)
  → Alasan: fraction_true menghitung rasio request sukses
```

| Function | Kelebihan | Kekurangan | Best For |
|----------|-----------|------------|----------|
| **mean** | Stabil, ignore spike | Bisa "sembunyikan" spike pendek | CPU, Memory, general |
| **max** | Tangkap worst case | Sensitif terhadap spike sesaat | Disk, penting yang tidak boleh sentuh batas |
| **min** | Tangkap drop terendah | Bisa miss masalah jika data normal dominan | Free memory, available connections |
| **percentile_99** | Tangkap tail latency | Butuh cukup banyak data point | API latency, response time |
| **sum** | Total volume | Sensitif terhadap jumlah series | Request count, error count |

---

#### Across Time Series

Memproses data **antar** semua time series — menggabungkan data dari **multiple resources**.

```
Klik "▸ Across time series" untuk expand:

  Across time series  ⓘ                       ∨

  Time series aggregation *
  ┌──────────────────────────────────────────┐
  │ none                                   ▼ │
  └──────────────────────────────────────────┘

  Time series group by
  ┌──────────────────────────────────────────┐
  │ (none selected)                        ▼ │
  └──────────────────────────────────────────┘
```

##### Time Series Aggregation

Menentukan **bagaimana** menggabungkan semua time series menjadi satu (atau beberapa grup).

| Aggregation | Fungsi | Contoh |
|-------------|--------|--------|
| **none** | Tidak digabung — setiap series dievaluasi **sendiri-sendiri** | VM-1: 82%, VM-2: 55%, VM-3: 72% → evaluasi masing-masing |
| **mean** | Rata-rata semua series | (82+55+72)/3 = **69.7%** → 1 value |
| **sum** | Jumlah semua series | Request count dari semua VM dijumlah |
| **min** | Nilai terendah di antara semua series | 55% (VM-2 terendah) |
| **max** | Nilai tertinggi di antara semua series | 82% (VM-1 tertinggi) |
| **count** | Jumlah series yang ada | 3 series |

```
Visualisasi "none" vs "mean":

  none (per series):                    mean (aggregated):

  100│                                  100│
   80│──A──────── threshold             80│──────────── threshold
   60│    B─────                         60│
   40│────────── C                       40│──mean(A,B,C)──────
   20│                                   20│
     └───────── time                      └───────── time

  Alert: VM-1 (A) violates             Alert: Aggregated 69.7% < 80%
         VM-2 (B) OK                           → NO alert
         VM-3 (C) OK
```

##### Time Series Group By

Sebelum aggregasi, **group by** mengelompokkan series berdasarkan label.

```
Contoh: Group by "zone"

  Tanpa group by:
    VM-1 (zone-a): 82%  ─┐
    VM-2 (zone-a): 55%  ─┤─→ mean = 69.7%  → 1 value
    VM-3 (zone-b): 72%  ─┘

  Dengan group by "zone":
    VM-1 (zone-a): 82%  ─┐─→ mean = 68.5%  → value per zone-a
    VM-2 (zone-a): 55%  ─┘
    VM-3 (zone-b): 72%  ───→ mean = 72.0%  → value per zone-b
```

| Skenario | Aggregation | Group By | Hasil |
|----------|-------------|----------|-------|
| Alert per VM | none | — | Setiap VM dievaluasi sendiri |
| Alert per Zone | mean | zone | Rata-rata per zone |
| Alert total project | sum | — | Satu value: total semua VM |
| Alert per environment | mean | metadata.user_labels.env | Rata-rata per env (prod/staging) |

| Kelebihan | Kekurangan |
|-----------|------------|
| Kurangi jumlah alert (aggregate = 1 alert vs 100 alert per VM) | Bisa miss masalah di single VM jika di-rata-rata |
| Group by → alert per group (zone, env) | Konfigurasi lebih kompleks |
| none → paling granular, alert per resource | Bisa alert storm jika banyak VM kena |

---

#### Add Secondary Data Transformation

Toggle opsional yang menambahkan **transformasi kedua** setelah transformasi pertama.

```
  ⊖ Add secondary data transformation     ← toggle (default: OFF)
```

Saat diaktifkan, muncul set konfigurasi tambahan yang sama (rolling window, function, aggregation) — diterapkan **setelah** transformasi pertama.

| Kegunaan | Contoh |
|----------|--------|
| **Double smoothing** | Pertama: rate (counter → per-second), Kedua: mean 5m (smooth) |
| **Ratio calculation** | Pertama: sum errors, Kedua: fraction of total |
| **Outlier detection** | Pertama: mean per series, Kedua: stddev across series |

**Rekomendasi:** Untuk sebagian besar kasus, **tidak perlu** mengaktifkan ini. Gunakan hanya untuk query advanced.

---

### Chart Preview (Kanan)

Area kanan menampilkan **preview real-time** dari metric yang dikonfigurasi.

```
┌─────────────────────────────────────────┐
│ ✓1 hour  6 hours  1 day  7 days  30 days  Custom ▼  │
│                                                      │
│  VM Instance - CPU utilization ⓘ               ⋮    │
│                                                      │
│   15%│                                               │
│   10%│  ╱╲    ╱╲    ╱╲    ╱╲                        │
│    5%│─╱──╲──╱──╲──╱──╲──╱──╲───                    │
│      └────────────────────────────                   │
│    UTC+7  6:20AM  6:30AM  6:40AM  6:50AM  7:00AM    │
│                                                      │
│  ≡ Filter │ Enter property or value │ ⓘ │ 📊 │ ✕   │
│                                                      │
│  ☐    Metric                ↑        Value           │
│  ●    utilization                    8.997 %         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

| Elemen | Fungsi |
|--------|--------|
| **Time range tabs** (1 hour, 6 hours, dll) | Ubah rentang waktu chart — default 1 hour |
| **Custom** | Pilih rentang waktu kustom (tanggal mulai + akhir) |
| **Chart area** | Grafik garis dari metric — update sesuai filter/transform yang dikonfigurasi |
| **≡ Filter** | Filter tambahan pada chart (tidak mempengaruhi alert policy) |
| **📊 icon** | Toggle view: chart / table |
| **✕ icon** | Close filter/table panel |
| **Table area** | Menampilkan semua time series dengan value terkini |

**Catatan penting:** Perubahan filter/time range di **chart preview** bersifat **read-only untuk preview saja** — tidak mempengaruhi konfigurasi alert yang sebenarnya. Seperti tertulis di Console: *"Selections made on the chart do not affect the alert policy."*

---

### Step 1: Select a Metric & Transform Data (Lengkap)

Ini adalah step pertama yang terlihat saat membuka Create Policy.

```
Flow Step 1:

  ┌──────────────────────────────────────────────┐
  │  1. Pilih Policy configuration mode          │
  │     ● Builder (recommended)                  │
  │                                              │
  │  2. Select a metric                          │
  │     Pilih resource + metric dari dropdown    │
  │                                              │
  │  3. Add filters (opsional)                   │
  │     Narrowkan ke VM/zone/label tertentu      │
  │                                              │
  │  4. Transform data                           │
  │     a. Within each time series               │
  │        - Rolling window → 5 min              │
  │        - Rolling window function → mean      │
  │     b. Across time series                    │
  │        - Aggregation → none                  │
  │        - Group by → (none)                   │
  │     c. Secondary transformation → OFF        │
  │                                              │
  │  5. Lihat Chart Preview di kanan             │
  │     Pastikan data yang terlihat sesuai       │
  │                                              │
  │  6. Klik [NEXT]                              │
  └──────────────────────────────────────────────┘
```

---

### Step 2: Configure Alert Trigger

Setelah klik **NEXT**, masuk ke konfigurasi **kapan alert fires**.

```
  ┌─────────────────────────────────────────────────┐
  │  Configure alert trigger                         │
  │                                                 │
  │  Condition type:                                │
  │  ● Threshold    ○ Absence                       │
  │                                                 │
  │  Alert trigger:                                 │
  │  ● Any time series violates                     │
  │  ○ Percent of time series violates  ┌────┐      │
  │                                     │ 50 │ %    │
  │                                     └────┘      │
  │  Threshold position:  ┌────────────────┐        │
  │                       │ Above threshold│        │
  │                       └────────────────┘        │
  │                                                 │
  │  Threshold value:  ┌──────┐                     │
  │                    │  80  │  %                   │
  │                    └──────┘                     │
  │                                                 │
  │         [ NEXT ]                                │
  └─────────────────────────────────────────────────┘
```

| Field | Pilihan | Deskripsi |
|-------|---------|-----------|
| **Condition type** | **Threshold** | Alert saat metric **melewati** batas tertentu |
| | **Absence** | Alert saat **tidak ada data** selama durasi tertentu (resource down) |
| **Alert trigger** | **Any time series violates** | Alert jika **salah satu** resource (VM, DB, dll) melanggar threshold |
| | **% of time series violates** | Alert hanya jika **X%** resource melanggar (misal 50% VM CPU tinggi = ada masalah besar) |
| **Threshold position** | **Above threshold** | Metric **di atas** batas (CPU > 80%, Memory > 90%) |
| | **Below threshold** | Metric **di bawah** batas (Disk free < 10%, Uptime < 99%) |
| **Threshold value** | Angka | Nilai batas — misal `80` untuk 80%, atau `0.8` untuk 0-1 range |

##### Contoh Konfigurasi Trigger per Skenario

| Skenario | Condition | Trigger | Position | Value |
|----------|-----------|---------|----------|-------|
| CPU tinggi pada VM manapun | Threshold | Any time series | Above | 80% |
| 50%+ VM CPU tinggi (outbreak) | Threshold | 50% of time series | Above | 80% |
| VM mati (no data) | Absence | Any time series | — | duration: 5m |
| Disk hampir penuh | Threshold | Any time series | Above | 90% |
| Free memory sangat rendah | Threshold | Any time series | Below | 10% |

---

### Step 3: Configure Notifications

```
  ┌─────────────────────────────────────────────────┐
  │  Notification channels                           │
  │                                                 │
  │  Use notification channel                        │
  │  ┌─────────────────────────────────────────┐    │
  │  │ 🔍 Search channels...                  │    │
  │  └─────────────────────────────────────────┘    │
  │                                                 │
  │  ☑ ops-team-slack (#alerts)                     │
  │  ☑ ops-team-email (ops@company.com)             │
  │  ☐ pagerduty-critical                           │
  │                                                 │
  │  + Manage notification channels                 │
  │                                                 │
  │         [ NEXT ]                                │
  └─────────────────────────────────────────────────┘
```

### Step 4: Name, Severity & Documentation

```
  ┌─────────────────────────────────────────────────┐
  │  Alerting policy name:                           │
  │  ┌─────────────────────────────────────────┐    │
  │  │ High CPU on production VMs              │    │
  │  └─────────────────────────────────────────┘    │
  │                                                 │
  │  Policy severity level: ┌──────────┐            │
  │                         │ Critical ▼│            │
  │                         └──────────┘            │
  │                                                 │
  │  Documentation: (markdown — muncul di notif)    │
  │  ┌─────────────────────────────────────────┐    │
  │  │ CPU melebihi 80%.                       │    │
  │  │ Cek: ssh ke VM → htop                   │    │
  │  │ Runbook: go/cpu-high-runbook            │    │
  │  └─────────────────────────────────────────┘    │
  │                                                 │
  │         [ NEXT ]                                │
  └─────────────────────────────────────────────────┘
```

### Step 5: Review Alert

```
  ┌─────────────────────────────────────────────────┐
  │  Review alert                                    │
  │                                                 │
  │  Condition: VM Instance - CPU utilization        │
  │             > 80% for 5 minutes (mean)           │
  │                                                 │
  │  Trigger: Any time series violates               │
  │                                                 │
  │  Notifications: Slack (#alerts), Email           │
  │                                                 │
  │  Name: High CPU on production VMs                │
  │  Severity: Critical                              │
  │                                                 │
  │  ┌────────────────────┐                          │
  │  │   CREATE POLICY    │  ← finalize              │
  │  └────────────────────┘                          │
  └─────────────────────────────────────────────────┘
```

---

### Flow End-to-End: Membuat Alert CPU > 80%

```
Monitoring → Alerting → [+ Create Policy]
       │
       ▼
Step 1: SELECT METRIC & TRANSFORM
       │
       │  Mode:     Builder
       │  Metric:   VM Instance → CPU utilization
       │  Filter:   metadata.user_labels.env = "production"
       │  Transform:
       │    Within:  Rolling window 5 min, function: mean
       │    Across:  none (per VM)
       │  [NEXT]
       │
       ▼
Step 2: CONFIGURE TRIGGER
       │
       │  Condition:  Threshold
       │  Trigger:    Any time series violates
       │  Position:   Above threshold
       │  Value:      80 (%)
       │  [NEXT]
       │
       ▼
Step 3: NOTIFICATIONS
       │
       │  ☑ Slack (#ops-alerts)
       │  ☑ Email (ops@company.com)
       │  [NEXT]
       │
       ▼
Step 4: NAME & DOCS
       │
       │  Name:     "High CPU - Production VMs"
       │  Severity: Error
       │  Docs:     "CPU > 80%. ssh → htop. Runbook: go/cpu-high"
       │  [NEXT]
       │
       ▼
Step 5: REVIEW
       │
       │  Verifikasi semua konfigurasi
       │  [CREATE POLICY]
       │
       ▼
✅ Policy aktif — mulai monitoring
       │
       ▼
Saat CPU VM > 80% selama 5 menit:
  → Incident dibuat
  → Slack notif dikirim
  → Email dikirim
  → Tim acknowledge & resolve
```

---

## Condition Types

### 1. Metric Threshold

Paling umum — alert saat metric melewati batas.

```
Contoh: CPU > 80% selama 5 menit

  100%|                    ╱──╲
   80%|· · · · · · · ·╱─ ─ ─ ─╲─ · · ← THRESHOLD
   60%|           ╱──╱           ╲──
   40%|      ╱───╱                  ╲───
   20%|─────╱
      └────────────────────────────────── time
                     ↑
                  ALERT FIRES (above 80% for 5min)
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Paling intuitif dan mudah dikonfigurasi | Threshold statis — tidak menyesuaikan pola normal |
| Mendukung semua jenis metrics | Butuh tuning agar tidak terlalu sensitif (noisy) |
| Bisa combine duration (5m, 10m) | Alert storm jika banyak resource kena sekaligus |

### 2. Metric Absence

Alert saat **tidak ada data** — biasanya artinya resource down atau agent mati.

| Kelebihan | Kekurangan |
|-----------|------------|
| Deteksi resource mati/offline | False positive jika resource memang dimatikan |
| Deteksi Ops Agent crash | Harus set duration yang pas (terlalu pendek = noisy) |

### 3. Log-Based Alert

Alert berdasarkan **log entry** — bukan metric.

**Console:** Monitoring → Alerting → Create Policy → Select condition → **Log match condition**

```
Contoh: Alert saat log mengandung "ERROR" atau "OOMKilled"

  Query: resource.type="gce_instance"
         AND severity="ERROR"
         AND textPayload:"OOMKilled"
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Alert berbasis event spesifik (error message) | Butuh Cloud Logging aktif |
| Tidak perlu custom metric | Query yang kompleks bisa lambat |
| Deteksi pattern yang tidak bisa via metric | Rate limiting: min 5 menit antar notifikasi |

### 4. Forecast-Based (Preview)

Alert berdasarkan **prediksi** — misal "disk akan penuh dalam 24 jam".

| Kelebihan | Kekurangan |
|-----------|------------|
| Proaktif — alert sebelum masalah terjadi | Masih preview, belum GA |
| Cocok untuk disk/storage yang tumbuh gradual | Prediksi bisa salah jika pola berubah |

---

## Notification Channels

**Console:** Monitoring → Alerting → **Edit notification channels**

| Channel | Konfigurasi | Cocok Untuk | Kelebihan | Kekurangan |
|---------|------------|-------------|-----------|------------|
| **Email** | Alamat email | Semua level alert | Simple, semua orang punya | Bisa masuk spam, lambat dibaca |
| **Slack** | Webhook URL / Slack app | Tim engineering | Real-time, bisa thread | Butuh setup webhook/app |
| **PagerDuty** | Integration key | Critical/on-call | Auto-escalation, scheduling | Berbayar, setup lebih kompleks |
| **Pub/Sub** | Topic name | Custom integration | Flexible, bisa trigger Cloud Function | Butuh coding untuk consume |
| **Webhooks** | URL endpoint | Custom system | Sangat flexible | Harus maintain endpoint |
| **SMS** | Phone number | Critical emergency | Pasti dibaca | Mahal, terbatas karakter |
| **Google Chat** | Space webhook | Tim yang pakai Google Workspace | Integrasi native | Terbatas ke Google Chat |
| **Mobile App** | Cloud Console app | Ops on-the-go | Push notification | Butuh install app |

**Rekomendasi kombinasi:**

```
Severity Critical:  PagerDuty + Slack + SMS
Severity Error:     Slack + Email
Severity Warning:   Email saja (atau Slack low-priority channel)
```

---

## Severity Levels

| Severity | Kapan Digunakan | Contoh | Response Time |
|----------|----------------|--------|---------------|
| **Critical** | Sistem down / sangat terdampak | VM unreachable, DB crash, uptime check fail | Segera (< 15 menit) |
| **Error** | Degradasi performa signifikan | CPU > 90%, memory > 95%, error rate tinggi | < 1 jam |
| **Warning** | Potensi masalah di masa depan | Disk > 80%, slow query meningkat | < 4 jam / next business day |

---

## Incidents

**Console:** Monitoring → Alerting → **Incidents**

Saat alert firing, otomatis terbuat **Incident** — record dari alert event.

```
Incident Lifecycle:

  OPEN → ACKNOWLEDGED → RESOLVED
    │         │              │
    │    Tim melihat &       │
    │    mulai investigate   │
    │                        │
    └── Bisa auto-resolve ───┘
        jika metric kembali normal
```

| Field | Deskripsi |
|-------|-----------|
| **Status** | Open / Acknowledged / Resolved |
| **Started** | Kapan alert pertama kali fire |
| **Duration** | Berapa lama incident berlangsung |
| **Policy** | Alert policy mana yang trigger |
| **Resource** | Resource mana yang terdampak |
| **Annotations** | Catatan dari tim yang handle |

---

## Contoh Alerting Production

### 1. High CPU Alert

```
Policy name:    High CPU - Production VMs
Metric:         compute.googleapis.com/instance/cpu/utilization
Filter:         metadata.system_labels.state = "ACTIVE"
Threshold:      > 0.8 (80%)
Duration:       5 minutes
Severity:       Error
Notifications:  Slack (#ops-alerts) + Email
Documentation:  "CPU tinggi pada VM production. Cek htop, kemungkinan traffic spike."
```

### 2. Disk Almost Full (Critical)

```
Policy name:    Disk Almost Full
Metric:         compute.googleapis.com/instance/disk/percent_used
Threshold:      > 0.9 (90%)
Duration:       5 minutes
Severity:       Critical
Notifications:  PagerDuty + Slack + SMS
Documentation:  "Disk > 90%. Segera bersihkan log/tmp atau resize disk."
```

### 3. Cloud SQL Connections Warning

```
Policy name:    Cloud SQL High Connections
Metric:         cloudsql.googleapis.com/database/network/connections
Threshold:      > 100
Duration:       10 minutes
Severity:       Warning
Notifications:  Email
Documentation:  "Connection pool tinggi. Cek apakah ada connection leak di app."
```

### 4. Uptime Check Failed

```
Policy name:    Website Down
Condition:      Uptime check "website-prod" fails from 2+ regions
Duration:       1 minute
Severity:       Critical
Notifications:  PagerDuty + Slack + SMS
Documentation:  "Website down. Cek load balancer, backend health, DNS."
```

### 5. No Data (Agent Down)

```
Policy name:    Monitoring Agent Offline
Condition:      Metric absence — agent.googleapis.com/agent/uptime
Duration:       5 minutes
Severity:       Error
Notifications:  Slack + Email
Documentation:  "Ops Agent tidak mengirim data. SSH ke VM → systemctl status google-cloud-ops-agent"
```

---

## Kelebihan & Kekurangan Alerting

| Kelebihan | Kekurangan |
|-----------|------------|
| Deteksi otomatis 24/7 — tidak perlu manual monitor | Alert terlalu banyak = **alert fatigue** (diabaikan) |
| Multi-channel notifikasi (email, Slack, PagerDuty) | Butuh **tuning** threshold yang tepat |
| Incident tracking built-in | Log-based alert: min interval 5 menit |
| Documentation di alert = runbook untuk tim | Alert storm saat outage besar (banyak alert sekaligus) |
| Severity levels untuk prioritas | Forecast-based masih preview |
| Free tier: 500 metric-based policies | Custom metrics bisa tambah cost |
| Integrasi native dengan semua GCP service | — |

---

## Tips Menghindari Alert Fatigue

| Strategi | Penjelasan |
|----------|-----------|
| **Duration yang cukup** | Jangan alert saat spike sesaat — gunakan rolling window 5-10m |
| **Severity yang tepat** | Tidak semua alert harus Critical |
| **Routing yang benar** | Critical → PagerDuty, Warning → email saja |
| **Grouping** | Group alert per resource untuk hindari alert storm |
| **Snooze** | Mute alert sementara saat maintenance |
| **Review rutin** | Evaluasi apakah alert masih relevan setiap bulan |
