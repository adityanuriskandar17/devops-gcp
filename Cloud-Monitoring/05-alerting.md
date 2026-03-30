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

Setelah klik **NEXT** dari Step 1, masuk ke halaman **"Configure alert trigger"** — menentukan **kapan alert fires**.

#### Layout Halaman Configure Alert Trigger

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Create alerting policy     [+ ADD ALERT CONDITION] [🗑] [<> VIEW CODE] [✕]│
│                                                                           │
│  ┌──────────────┐  ┌─────────────────────────────┐  ┌──────────────────┐ │
│  │ ALERT        │  │  Configure alert trigger     │  │ Chart Preview    │ │
│  │ CONDITIONS   │  │                             │  │                  │ │
│  │              │  │  Condition Types             │  │ ✓1hr 6hr 1d 7d  │ │
│  │ ● VM Instance│  │                             │  │                  │ │
│  │   - CPU util │  │  ● Threshold                │  │ VM Instance -    │ │
│  │   ● Configure│  │    Condition triggers if a  │  │ CPU utilization  │ │
│  │     trigger  │  │    time series rises above  │  │                  │ │
│  │              │  │    or falls below a value   │  │  30%│            │ │
│  │ ALERT        │  │    for a specific duration  │  │  20%│╱╲  ╱╲     │ │
│  │ DETAILS      │  │    window                   │  │  10%│  ╲╱  ╲──  │ │
│  │              │  │                             │  │     └──────────  │ │
│  │ ∘ Notif &   │  │  ○ Metric absence           │  │                  │ │
│  │   name      │  │    Condition triggers if any │  │ ≡Filter│ⓘ│📊│✕ │ │
│  │ ∘ Review    │  │    time series has no data   │  │                  │ │
│  │   alert     │  │    for a specific duration   │  │ ☐ Metric  Value  │ │
│  │              │  │    window                   │  │ ● utiliz. 8.904% │ │
│  │              │  │                             │  │                  │ │
│  │              │  │  ○ Forecast  PREVIEW        │  └──────────────────┘ │
│  │              │  │    Condition triggers if any│                       │
│  │              │  │    timeseries is projected  │                       │
│  │              │  │    to cross the threshold   │                       │
│  │              │  │    in the near future       │                       │
│  │              │  │                             │                       │
│  │              │  │  Alert trigger              │                       │
│  │              │  │  ┌─────────────────────┐ ▼  │                       │
│  │              │  │  │Any time series viol.│    │                       │
│  │              │  │  └─────────────────────┘    │                       │
│  │              │  │                             │                       │
│  │              │  │  Threshold position         │                       │
│  │              │  │  ┌─────────────────────┐ ▼  │                       │
│  │              │  │  │ Above threshold     │    │                       │
│  │              │  │  └─────────────────────┘    │                       │
│  │              │  │                             │                       │
│  │              │  │  Threshold value             │                       │
│  │              │  │  ┌────────────────┐   %     │                       │
│  │              │  │  │                │          │                       │
│  │              │  │  └────────────────┘          │                       │
│  │              │  │                             │                       │
│  │              │  │  Advanced Options        ∨  │                       │
│  │              │  │                             │                       │
│  │              │  │  Condition name *            │                       │
│  │              │  │  ┌──────────────────────────┐│                       │
│  │              │  │  │VM Instance - CPU utiliz. ││                       │
│  │              │  │  └──────────────────────────┘│                       │
│  │              │  │                             │                       │
│  │              │  │         [ NEXT ]             │                       │
│  └──────────────┘  └─────────────────────────────┘                       │
│                                                                           │
│                    [CREATE POLICY]  [PROVIDE FEEDBACK]  [CANCEL]           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

#### Condition Types

Tiga tipe kondisi ditampilkan sebagai **radio button** dengan deskripsi.

##### 1. Threshold (Default)

```
  ● Threshold
    Condition triggers if a time series rises above or falls below
    a value for a specific duration window
```

Alert saat metric **melewati batas** (naik di atas atau turun di bawah) selama durasi tertentu.

```
Visualisasi:

  100%│                    ╱──╲
   80%│─ ─ ─ ─ ─ ─ ─ ╱─ ─ ─ ─╲─ ─ ← THRESHOLD (80%)
   60%│           ╱──╱           ╲──
   40%│      ╱───╱                  ╲───
   20%│─────╱
      └────────────────────────────────── time
                       ↑
                    ALERT FIRES
          (metric > 80% selama rolling window)
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Paling intuitif dan mudah dikonfigurasi | Threshold statis — tidak auto-adjust ke pola normal |
| Cocok untuk 90% use case alerting | Butuh tuning agar tidak noisy |
| Mendukung semua jenis metric | Alert storm jika banyak resource kena sekaligus |

##### 2. Metric Absence

```
  ○ Metric absence
    Condition triggers if any time series in the metric has no data
    for a specific duration window
```

Alert saat **tidak ada data** dari metric — biasanya artinya resource **down** atau agent **mati**.

```
Visualisasi:

  CPU%│
   80%│──╱╲──╱╲──╱╲──
   60%│─╱──╲╱──╲╱──╲─
   40%│╱                    (tidak ada data)
      └────────────────┬──────────────────── time
                       ↑
                    VM dimatikan / agent crash
                    → METRIC ABSENCE ALERT
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Deteksi resource mati/offline | False positive jika resource memang dimatikan (maintenance) |
| Deteksi Ops Agent crash | Harus set duration yang tepat |
| Penting untuk health check infrastructure | Tidak berguna untuk metric yang memang intermittent |

**Kapan pakai Metric Absence:**

| Skenario | Cocok? | Alasan |
|----------|--------|--------|
| VM production harus selalu online | **Ya** | Jika VM mati, metric hilang → alert |
| Ops Agent harus selalu running | **Ya** | Jika agent crash, metric berhenti → alert |
| Batch job yang jalan 1x sehari | **Tidak** | Metric memang intermittent — akan false positive |
| Dev VM yang sering on/off | **Tidak** | Terlalu banyak false positive |

##### 3. Forecast (PREVIEW)

```
  ○ Forecast  PREVIEW
    Condition triggers if any timeseries in the metric is projected
    to cross the threshold in the near future
```

Alert berdasarkan **prediksi** — GCP menganalisis trend data dan memperkirakan kapan metric akan melewati threshold.

```
Visualisasi:

  100%│                              ╱ (predicted)
   90%│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─╱─ ─ ← THRESHOLD
   80%│                        ╱╱
   70%│                    ╱╱╱
   60%│               ╱╱╱╱
   50%│          ╱╱╱╱╱      ← actual data + forecast
   40%│─────╱╱╱╱╱
      └────────────────┬──────────── time
                       ↑
             FORECAST ALERT FIRES
        "Disk akan penuh dalam ~24 jam"
             (sebelum benar-benar penuh)
```

| Kelebihan | Kekurangan |
|-----------|------------|
| **Proaktif** — alert sebelum masalah terjadi | Masih **PREVIEW** (belum GA), bisa berubah |
| Cocok untuk metric yang tumbuh gradual (disk, memory leak) | Prediksi bisa salah jika pola berubah mendadak |
| Beri waktu tim untuk bereaksi sebelum outage | Membutuhkan data historis yang cukup untuk prediksi akurat |
| Mengurangi downtime | Tidak cocok untuk metric yang spike mendadak |

**Contoh use case Forecast:**

| Skenario | Forecast Horizon | Threshold |
|----------|-----------------|-----------|
| Disk filling up | 24 jam ke depan | 90% disk used |
| Memory leak | 6 jam ke depan | 95% memory |
| Database storage growing | 7 hari ke depan | 80% storage |
| SSL certificate expiry | 30 hari ke depan | — |

**Catatan:** Label **PREVIEW** artinya fitur ini masih dalam tahap preview dan bisa berubah. Tidak disarankan untuk production-critical alerts sampai GA.

---

#### Alert Trigger

```
  Alert trigger
  ┌───────────────────────────────────────────┐
  │ Any time series violates                ▼ │
  └───────────────────────────────────────────┘
```

| Pilihan | Deskripsi | Kapan Digunakan |
|---------|-----------|-----------------|
| **Any time series violates** | Alert jika **minimal 1** time series (resource) melanggar threshold | Default — alert saat **satu pun** VM/DB/resource bermasalah |
| **Percent of time series violates** | Alert jika **X%** dari semua time series melanggar | Alert hanya saat masalah **widespread** (misal 50%+ VM kena) |

```
Contoh "Any time series violates":
  VM-1: 85% > 80%  ← VIOLATES → ALERT!
  VM-2: 45% < 80%  ← OK
  VM-3: 72% < 80%  ← OK
  → Alert fires karena VM-1 melanggar

Contoh "Percent of time series violates" (50%):
  VM-1: 85% > 80%  ← VIOLATES
  VM-2: 45% < 80%  ← OK
  VM-3: 72% < 80%  ← OK
  → 1/3 = 33% < 50% → NO ALERT

  VM-1: 85% > 80%  ← VIOLATES
  VM-2: 92% > 80%  ← VIOLATES
  VM-3: 72% < 80%  ← OK
  → 2/3 = 67% > 50% → ALERT!
```

---

#### Threshold Position

```
  Threshold position
  ┌───────────────────────────────────────────┐
  │ Above threshold                         ▼ │
  └───────────────────────────────────────────┘
```

| Pilihan | Deskripsi | Contoh Use Case |
|---------|-----------|-----------------|
| **Above threshold** | Alert saat metric **di atas** nilai | CPU > 80%, Memory > 90%, Error count > 100 |
| **Below threshold** | Alert saat metric **di bawah** nilai | Free disk < 10%, Uptime ratio < 99.9%, Available memory < 500MB |

---

#### Threshold Value

```
  Threshold value
  ┌────────────────────────┐
  │ 80                     │   %
  └────────────────────────┘
```

Nilai batas numerik. Unit tergantung metric yang dipilih:
- CPU utilization: `%` (0-100)
- Network bytes: `bytes`, `KB`, `MB`
- Latency: `ms`, `s`
- Count: angka (request count, error count)

**Tips:** Untuk metric CPU utilization di GCP, nilainya bisa **0-1** (fraction) atau **0-100** (percentage) tergantung metric. Cek chart preview di kanan untuk memastikan unit yang benar.

---

#### Advanced Options

Section yang tersembunyi (collapsed) — klik untuk expand.

```
  Advanced Options                                    ∨

  Klik expand:
  ┌──────────────────────────────────────────────────────┐
  │  Advanced Options                                 ∧  │
  │                                                      │
  │  Retest window                                       │
  │  ┌──────────────────────────────────────────┐        │
  │  │ 10 min                                 ▼ │        │
  │  └──────────────────────────────────────────┘        │
  │  The amount of time to wait before re-evaluating     │
  │  a condition that has already fired.                  │
  │                                                      │
  │  Evaluation missing data ⓘ                           │
  │  ┌──────────────────────────────────────────┐        │
  │  │ Active — missing data treated as          │        │
  │  │ violating the condition               ▼ │        │
  │  └──────────────────────────────────────────┘        │
  └──────────────────────────────────────────────────────┘
```

##### Retest Window

| Nilai | Arti | Kapan Digunakan |
|-------|------|-----------------|
| **10 min** (default) | Setelah alert fire, tunggu 10 menit sebelum evaluasi ulang | Default yang bagus untuk sebagian besar kasus |
| **5 min** | Evaluasi ulang lebih cepat | Saat ingin alert re-fire/resolve lebih cepat |
| **30 min** | Evaluasi ulang lebih jarang | Untuk alert yang tidak perlu real-time resolution |
| **1 hour** | Evaluasi 1x per jam | Untuk trend-based alert (disk growth) |

**Fungsi:** Setelah alert fires, Cloud Monitoring menunggu selama **retest window** sebelum cek lagi. Jika metric masih violates → incident tetap open. Jika sudah normal → incident resolved.

```
Flow Retest:

  Alert FIRES (CPU > 80%)
       │
       ▼
  Tunggu retest window (10 min)
       │
       ├─ CPU masih > 80%  → Incident tetap OPEN
       │                     (retest lagi 10 min kemudian)
       │
       └─ CPU sudah < 80%  → Incident RESOLVED
```

##### Evaluation Missing Data

Bagaimana alert berperilaku saat **data hilang** (metric tidak dikirim).

| Pilihan | Deskripsi | Efek |
|---------|-----------|------|
| **Active** (default) | Missing data dianggap **melanggar** kondisi | Jika VM mati dan metric hilang → alert fires |
| **Inactive** | Missing data dianggap **tidak melanggar** | Jika VM mati → no alert (gunakan Metric Absence jika perlu detect) |
| **No data** | Missing data tidak dievaluasi | Condition state = unknown sampai data kembali |

```
Contoh: VM dimatikan, metric berhenti

  Active:    Missing data = violating → ALERT FIRES
  Inactive:  Missing data = OK → NO ALERT
  No data:   Missing data = unknown → NO CHANGE
```

| Pilihan | Kelebihan | Kekurangan |
|---------|-----------|------------|
| **Active** | Tangkap semua anomali termasuk data hilang | False positive saat VM memang dimatikan |
| **Inactive** | Tidak ada false positive dari maintenance | Bisa miss masalah jika VM mati tiba-tiba |
| **No data** | Paling conservative | Tidak informatif — alert "diam" saat data hilang |

**Rekomendasi:**
- **Production VM yang harus 24/7:** Active (tangkap semua)
- **Dev/Staging VM:** Inactive (sering on/off)
- **Batch jobs:** No data (metric intermittent by design)

---

#### Condition Name

```
  Condition name *
  ┌─────────────────────────────────────────────────┐
  │ VM Instance - CPU utilization                    │
  └─────────────────────────────────────────────────┘
```

**Apa itu:** Nama yang diberikan ke **condition** ini (bukan policy — 1 policy bisa punya beberapa conditions). Secara default, Console auto-generate nama berdasarkan metric yang dipilih.

**Bisa diedit** menjadi nama yang lebih deskriptif:

| Default (auto) | Custom (lebih baik) |
|----------------|---------------------|
| `VM Instance - CPU utilization` | `Prod VMs - CPU > 80% sustained` |
| `Cloud SQL Database - connections` | `Main DB - Connection limit warning` |
| `HTTP/S LB Rule - Request count` | `API Gateway - High error count` |

**Tips:**
- Condition name muncul di **incident detail** dan **notification** — buat se-deskriptif mungkin
- Jika policy punya **multiple conditions**, nama yang jelas membantu identifikasi condition mana yang trigger

---

#### Contoh Konfigurasi Trigger per Skenario

| Skenario | Condition Type | Trigger | Position | Value | Advanced |
|----------|---------------|---------|----------|-------|----------|
| CPU tinggi pada VM manapun | Threshold | Any time series | Above | 80% | Retest: 10m, Missing: Active |
| 50%+ VM CPU tinggi (outbreak) | Threshold | 50% of time series | Above | 80% | Retest: 5m, Missing: Inactive |
| VM mati (no data) | Absence | Any time series | — | duration: 5m | — |
| Disk hampir penuh | Threshold | Any time series | Above | 90% | Retest: 30m, Missing: Active |
| Free memory sangat rendah | Threshold | Any time series | Below | 10% | Retest: 10m, Missing: Active |
| Disk predicted full in 24h | Forecast | Any time series | Above | 90% | — |
| API error spike | Threshold | Any time series | Above | 100 (count) | Retest: 5m, Missing: Inactive |

---

### Step 3: Configure Notifications and Finalize Alert

Di Console, setelah klik **NEXT** dari Configure Trigger, halaman berubah ke **"Configure notifications and finalize alert"**. Halaman ini berisi **semua konfigurasi non-condition** dalam satu halaman panjang.

#### Layout Halaman Lengkap

```
┌───────────────────────────────────────────────────────────────────┐
│  Create alerting policy     [+ ADD ALERT CONDITION] [🗑] [<> VIEW CODE] [✕] │
│                                                                   │
│  ┌──────────────┐  ┌─────────────────────────────────────────┐   │
│  │ ALERT        │  │                                         │   │
│  │ CONDITIONS   │  │  Configure notifications and            │   │
│  │              │  │  finalize alert                         │   │
│  │ ● VM Instance│  │                                         │   │
│  │   - CPU util │  │  ─────────────────────────────────────  │   │
│  │ ✅ Configure │  │                                         │   │
│  │    trigger   │  │  Configure notifications (Recommended)  │   │
│  │              │  │  🔵 Use notification channel             │   │
│  │ ALERT        │  │                                         │   │
│  │ DETAILS      │  │  ┌ Notification Channels ────────────┐  │   │
│  │              │  │  │ There are no available notif...    │  │   │
│  │ ● Notif &   │  │  │                                    │  │   │
│  │   name ◀    │  │  │ 🔄 MANAGE NOTIFICATION CHANNELS    │  │   │
│  │ ∘ Review    │  │  └────────────────────────────────────┘  │   │
│  │   alert     │  │                                         │   │
│  │              │  │  ⓘ We recommend that you create         │   │
│  │              │  │    multiple notification channels for   │   │
│  │              │  │    redundancy purposes...               │   │
│  │              │  │    LEARN MORE ↗                         │   │
│  │              │  │                                         │   │
│  │              │  │  ☐ Notify on incident closure           │   │
│  │              │  │                                         │   │
│  │              │  │  Incident autoclose duration             │   │
│  │              │  │  ┌──────────────────────────────┐  ▼   │   │
│  │              │  │                                         │   │
│  │              │  │  ─────────────────────────────────────  │   │
│  │              │  │                                         │   │
│  │              │  │  Policy user labels (Recommended)       │   │
│  │              │  │  [+ ADD LABEL]                          │   │
│  │              │  │                                         │   │
│  │              │  │  ─────────────────────────────────────  │   │
│  │              │  │                                         │   │
│  │              │  │  Policy Severity Level                   │   │
│  │              │  │  Severity: ┌──────────────┐  ▼  ⓘ     │   │
│  │              │  │            │ No severity   │            │   │
│  │              │  │            └──────────────┘            │   │
│  │              │  │                                         │   │
│  └──────────────┘  └─────────────────────────────────────────┘   │
│                                                                   │
│                    [CREATE POLICY]  [PROVIDE FEEDBACK]  [CANCEL]   │
└───────────────────────────────────────────────────────────────────┘
```

---

#### 3a. Configure Notifications

##### Use Notification Channel (Toggle)

```
  Configure notifications  Recommended

  🔵 Use notification channel     ← toggle ON/OFF
```

| State | Efek |
|-------|------|
| **ON** (default, recommended) | Menampilkan Notification Channels — bisa pilih channel untuk menerima alert |
| **OFF** | Tidak ada notifikasi — alert tetap tercatat di Incidents tapi **tidak ada orang yang diberitahu** |

**Kapan OFF?** Hanya untuk testing policy atau jika hanya ingin track via Incidents dashboard tanpa notifikasi aktif.

##### Notification Channels

Ditampilkan sebagai **dropdown** — klik untuk melihat dan memilih channel yang tersedia.

```
  Notification Channels
  ┌──────────────────────────────────────────────────┐
  │ (pilih channel)                                ▼ │
  └──────────────────────────────────────────────────┘

  Klik dropdown → muncul list:
  ┌──────────────────────────────────────────────────┐
  │  ☑ ops-team-slack (#alerts)                      │
  │  ☑ ops-team-email (ops@company.com)              │
  │  ☐ pagerduty-critical                            │
  │  ☐ sms-oncall (+62812xxx)                        │
  └──────────────────────────────────────────────────┘

  Jika belum ada channel:
  ┌──────────────────────────────────────────────────┐
  │  "There are no available notification channels    │
  │   for this workspace."                           │
  │                                                  │
  │  🔄 MANAGE NOTIFICATION CHANNELS                 │
  └──────────────────────────────────────────────────┘
```

##### Notification Subject Line

Field teks untuk **custom subject** pada notifikasi yang dikirim.

```
  Notification subject line
  ┌──────────────────────────────────────────────────┐
  │ (opsional — custom subject email/Slack)          │
  └──────────────────────────────────────────────────┘
```

**Apa itu:** Override subject/title default pada notifikasi. Secara default, GCP menggunakan format `[FIRING/RESOLVED] Policy name` sebagai subject. Field ini memungkinkan custom subject.

| Aspek | Default (kosong) | Custom subject |
|-------|-----------------|----------------|
| **Email subject** | `[FIRING] High CPU - Production VMs` | Custom text yang diisi |
| **Slack title** | Policy name | Custom text yang diisi |
| **PagerDuty title** | Policy name | Custom text yang diisi |

**Contoh penggunaan:**

| Custom Subject | Kegunaan |
|---------------|----------|
| `[P1] URGENT: Production VM CPU Critical` | Tambah priority tag agar mudah difilter di email |
| `🔴 API DOWN - Immediate Action Required` | Buat subject yang mencolok untuk critical alert |
| `[Team-Infra] Disk Warning` | Tambah tag tim untuk routing |

**Variabel yang bisa digunakan di subject:**

```
${resource.type}         → gce_instance
${resource.label.zone}   → asia-southeast2-a
${metric.type}           → compute.googleapis.com/instance/cpu/utilization
${condition.name}        → VM Instance - CPU utilization
${policy.name}           → High CPU - Production VMs
```

**Contoh dengan variabel:**

```
Subject: [ALERT] ${policy.name} on ${resource.label.zone}
Result:  [ALERT] High CPU - Production VMs on asia-southeast2-a
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Bisa custom subject agar lebih informatif | Jika terlalu panjang, bisa terpotong di email |
| Support variabel untuk dynamic content | Variabel yang salah tidak akan ter-resolve |
| Membantu filtering email (Gmail rules, Outlook rules) | Opsional — default subject sudah cukup informatif |

**Tips:** Berguna jika tim menerima banyak alert email — custom subject dengan tag `[P1]`, `[Team-X]`, atau emoji memudahkan filtering dan prioritas.

---

##### MANAGE NOTIFICATION CHANNELS

Klik tombol ini akan **membuka panel/tab** ke halaman konfigurasi channel.

**Console:** Monitoring → Alerting → **Notification channels** (atau klik MANAGE NOTIFICATION CHANNELS dari Create Policy)

#### Layout Halaman Notification Channels

```
┌───────────────────────────────────────────────────────────────────────┐
│  Notification channels                                            ✕  │
│                                                                      │
│  ────────────────────────────────────────────────────────────────     │
│  Mobile Devices (via Cloud Mobile App ↗)                  ADD NEW    │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ ⓘ Monitoring now supports both user-scoped and device-scoped │    │
│  │   Cloud Console Mobile notification channels  LEARN MORE  DISMISS│ │
│  └──────────────────────────────────────────────────────────────┘    │
│  No mobile devices configured                                        │
│                                                                      │
│  ────────────────────────────────────────────────────────────────     │
│  Google Chat  PREVIEW                                     ADD NEW    │
│  No Google Chat channels configured                                  │
│                                                                      │
│  ────────────────────────────────────────────────────────────────     │
│  PagerDuty Services                                       ADD NEW    │
│  No PagerDuty services configured                                    │
│                                                                      │
│  ────────────────────────────────────────────────────────────────     │
│  PagerDuty Sync  BETA                                     ADD NEW    │
│  No PagerDuty Sync channels configured                               │
│                                                                      │
│  ────────────────────────────────────────────────────────────────     │
│  Slack ⓘ                                                  ADD NEW    │
│  No Slack channels configured                                        │
│                                                                      │
│  ────────────────────────────────────────────────────────────────     │
│  Webhooks                                                 ADD NEW    │
│  No webhook channels configured                                      │
│                                                                      │
│  ────────────────────────────────────────────────────────────────     │
│  Email                                                    ADD NEW    │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ ≡ Filter │ Filter email addresses                       │ ⓘ │    │
│  ├────────────────┬────────────────────────────────────────────┤    │
│  │ Email          │ Display Name                               │    │
│  ├────────────────┼────────────────────────────────────────────┤    │
│  │ halo@halo.com  │ halo                                       │    │
│  └────────────────┴────────────────────────────────────────────┘    │
│                                                                      │
│  ────────────────────────────────────────────────────────────────     │
│  SMS                                                      ADD NEW    │
│  No SMS channels configured                                          │
│                                                                      │
│  ────────────────────────────────────────────────────────────────     │
│  Pub/Sub                                                  ADD NEW    │
│  No Pub/Sub channels configured                                      │
│                                                                      │
└───────────────────────────────────────────────────────────────────────┘
```

#### Penjelasan Setiap Channel Type

| No | Channel | Label | Fungsi | Konfigurasi |
|----|---------|-------|--------|-------------|
| 1 | **Mobile Devices** | — | Push notification ke **Cloud Console Mobile App** di smartphone | Install app → login → device otomatis muncul |
| 2 | **Google Chat** | **PREVIEW** | Kirim alert ke **Google Chat space** via webhook | Buat webhook di Chat space → paste URL |
| 3 | **PagerDuty Services** | — | Integrasi **PagerDuty** untuk on-call scheduling & escalation | Integration key dari PagerDuty service |
| 4 | **PagerDuty Sync** | **BETA** | **Sync 2 arah** antara GCP incidents & PagerDuty incidents — status saling update | PagerDuty API key + service mapping |
| 5 | **Slack** | — | Kirim alert ke **Slack channel** | OAuth app atau incoming webhook |
| 6 | **Webhooks** | — | Kirim alert ke **custom HTTP endpoint** (REST API) | URL endpoint + optional auth header |
| 7 | **Email** | — | Kirim alert ke **email address** | Alamat email + display name |
| 8 | **SMS** | — | Kirim alert via **SMS** ke nomor telepon | Nomor telepon + verifikasi |
| 9 | **Pub/Sub** | — | Kirim alert ke **Pub/Sub topic** untuk automation | Topic name di project |

#### PagerDuty Services vs PagerDuty Sync — Apa Bedanya?

```
PagerDuty Services (standard):
  GCP Alert fires → Notifikasi dikirim ke PagerDuty → PagerDuty buat incident
  (satu arah: GCP → PagerDuty)

PagerDuty Sync (BETA — bidirectional):
  GCP Alert fires → PagerDuty incident dibuat
  PagerDuty acknowledge → GCP incident juga acknowledged
  PagerDuty resolve → GCP incident juga resolved
  (dua arah: GCP ↔ PagerDuty)
```

| Aspek | PagerDuty Services | PagerDuty Sync (BETA) |
|-------|-------------------|----------------------|
| **Arah** | Satu arah (GCP → PD) | Dua arah (GCP ↔ PD) |
| **Status sync** | Tidak — harus manage 2 tempat | Ya — acknowledge/resolve auto-sync |
| **Setup** | Integration key saja | API key + mapping lebih kompleks |
| **Maturity** | GA (stable) | **BETA** (bisa berubah) |
| **Rekomendasi** | Untuk kebanyakan tim | Untuk tim yang heavy PagerDuty user |

#### Google Chat [PREVIEW] — Detail

```
Klik ADD NEW:

  ┌─────────────────────────────────────────────────┐
  │  Display name: ops-alerts-chat                   │
  │  Room URL: https://chat.googleapis.com/v1/...    │
  │                                                 │
  │  [SAVE]  [SEND TEST NOTIFICATION]               │
  └─────────────────────────────────────────────────┘
```

**Catatan PREVIEW:** Fitur masih dalam preview — bisa berubah atau dihapus. Untuk production, lebih aman pakai Slack atau Webhooks.

#### Email Channel — Detail

Berbeda dari channel lain, Email menampilkan **tabel** dengan filter:

```
  Email                                                    ADD NEW

  ┌──────────────────────────────────────────────────────────────┐
  │ ≡ Filter │ Filter email addresses                       │ ⓘ │
  ├────────────────┬─────────────────────────────────────────────┤
  │ Email          │ Display Name                                │
  ├────────────────┼─────────────────────────────────────────────┤
  │ halo@halo.com  │ halo                              ✏️  🗑    │
  │ ops@company.com│ ops-team                          ✏️  🗑    │
  └────────────────┴─────────────────────────────────────────────┘
```

| Kolom | Fungsi |
|-------|--------|
| **Email** | Alamat email penerima notifikasi |
| **Display Name** | Nama yang ditampilkan — muncul saat pilih channel di Create Policy |
| **✏️** (edit) | Edit email/display name |
| **🗑** (delete) | Hapus email channel |
| **Filter** | Search email jika banyak — ketik untuk filter list |

```
Klik ADD NEW:

  ┌─────────────────────────────────────────────────┐
  │  Email address: ops@company.com                  │
  │  Display name: ops-team                          │
  │                                                 │
  │  [SAVE]                                          │
  └─────────────────────────────────────────────────┘
```

#### Mobile Devices — Info Box

```
  ⓘ Monitoring now supports both user-scoped and device-scoped
    Cloud Console Mobile notification channels

    LEARN MORE ↗    DISMISS
```

| Type | Penjelasan |
|------|-----------|
| **User-scoped** | Notifikasi dikirim ke **semua device** milik user tersebut |
| **Device-scoped** | Notifikasi dikirim ke **device spesifik** saja |

**Cara setup:** Install **Google Cloud Console app** di Android/iOS → login dengan akun GCP → device otomatis terdaftar.

#### Flow Membuat Channel Baru (Contoh: Slack)

```
1. Klik [ADD NEW] di bagian Slack
       │
       ▼
2. Form: 
   ┌──────────────────────────────────────┐
   │  Slack Channel Name: #ops-alerts     │
   │  Auth Token: xoxb-xxxx (dari Slack)  │
   │                                      │
   │  [SAVE]  [SEND TEST NOTIFICATION]    │
   └──────────────────────────────────────┘
       │
       ▼
3. Kembali ke Create Policy → klik 🔄 (refresh)
       │
       ▼
4. Channel baru muncul di list → centang ☑
```

##### Info Box Redundansi

```
  ⓘ  We recommend that you create multiple notification channels
     for redundancy purposes. Google has no control of many of the
     delivery systems after we have passed the notification to that
     system. Additionally, a single Google service supports Cloud
     Console Mobile App, PagerDuty, Webhooks, and Slack. If you use
     one of these notification channels, then use email, SMS, or
     Pub/Sub as the redundant channel.

     LEARN MORE ↗
```

**Apa artinya:**

| Konsep | Penjelasan |
|--------|-----------|
| **Redundansi** | Gunakan **minimal 2 channel berbeda** — jika satu channel down, yang lain tetap mengirim notifikasi |
| **Google-managed channels** | Cloud Console Mobile App, PagerDuty, Webhooks, Slack — semua melewati **satu Google service** yang sama |
| **External channels** | Email, SMS, Pub/Sub — melewati **service berbeda** |
| **Rekomendasi** | Jika pakai Slack (Google-managed), **tambahkan** Email atau SMS (external) sebagai backup |

**Contoh kombinasi redundan:**

```
Kombinasi 1 (recommended):
  Primary:   Slack (#ops-alerts)        ← Google-managed
  Redundant: Email (ops@company.com)    ← External

Kombinasi 2 (critical alerts):
  Primary:   PagerDuty                  ← Google-managed
  Redundant: SMS (+62812xxx)            ← External
  Backup:    Email (ops@company.com)    ← External

Kombinasi 3 (automation):
  Primary:   Pub/Sub (topic: alerts)    ← External, trigger Cloud Function
  Redundant: Slack (#ops-alerts)        ← Google-managed
```

| Kelebihan Redundansi | Kekurangan |
|----------------------|------------|
| Tidak miss alert karena channel down | Lebih banyak channel = lebih banyak notifikasi (bisa noisy) |
| Berbeda delivery path = lebih reliable | Setup awal lebih lama |
| Best practice untuk production | Butuh maintain semua channel |

---

##### Notify on Incident Closure

```
  ☐ Notify on incident closure
```

| State | Efek |
|-------|------|
| **Unchecked** (default) | Notifikasi hanya dikirim saat **incident dibuat** (alert fires). Saat metric kembali normal, incident auto-resolve tapi **tidak ada notifikasi** |
| **Checked** | Notifikasi dikirim **dua kali**: saat incident dibuat **DAN** saat incident di-close/resolve |

**Kapan aktifkan?**

| Skenario | Aktifkan? | Alasan |
|----------|-----------|--------|
| Alert CPU tinggi pada production | **Ya** | Tim perlu tahu kapan masalah selesai — bisa stop debugging |
| Alert disk penuh | **Ya** | Konfirmasi bahwa cleanup berhasil |
| Alert warning (non-critical) | **Tidak** | Terlalu banyak notifikasi untuk hal yang tidak urgent |
| Alert saat maintenance | **Tidak** | Sudah expected, tidak perlu closure notif |

```
Flow dengan Notify on incident closure ON:

  CPU > 80% selama 5 menit
       │
       ▼
  🔔 NOTIFIKASI 1: "INCIDENT OPENED"
  │   Subject: [FIRING] High CPU - Production VMs
  │   Body: CPU utilization 87% > 80% threshold
  │   → Tim mulai investigate
       │
  ... (tim fix masalah, CPU turun ke 45%) ...
       │
       ▼
  CPU < 80% (metric kembali normal)
       │
       ▼
  🔔 NOTIFIKASI 2: "INCIDENT CLOSED"
  │   Subject: [RESOLVED] High CPU - Production VMs
  │   Body: CPU utilization returned to normal (45%)
  │   → Tim tahu masalah sudah selesai
```

---

##### Incident Autoclose Duration

```
  Incident autoclose duration
  ┌────────────────────────────────────────────┐
  │ (select duration)                        ▼ │
  └────────────────────────────────────────────┘
  If data is absent, select a duration after which
  Incident will automatically close.
```

**Apa itu:** Jika metric **berhenti mengirim data** (misalnya VM dimatikan), incident akan otomatis di-close setelah durasi yang dipilih.

| Pilihan | Arti | Kapan Digunakan |
|---------|------|----------------|
| **No autoclose** | Incident tetap open sampai manual close | Untuk critical alert yang harus selalu di-acknowledge manual |
| **30 minutes** | Auto-close setelah 30 menit tanpa data | Untuk VM/resource yang sering on/off (dev environment) |
| **1 hour** | Auto-close setelah 1 jam | Default yang bagus untuk sebagian besar kasus |
| **2 hours** | Auto-close setelah 2 jam | Untuk resource yang kadang restart lama |
| **1 day** | Auto-close setelah 1 hari | Untuk batch jobs / scheduled workloads |
| **7 days** | Auto-close setelah 7 hari | Jarang digunakan — incident menumpuk |

**Contoh skenario:**

```
Skenario: VM dimatikan untuk maintenance

  VM running → CPU data dikirim
       │
       ▼
  Alert active: CPU monitoring berjalan
       │
       ▼
  VM dimatikan (shutdown)
       │
       ▼
  Metric BERHENTI (no data)
       │
       ├─ Tanpa autoclose: Incident tetap OPEN selamanya
       │                   (perlu manual close)
       │
       └─ Dengan autoclose 1 hour:
          │
          ▼
          ... menunggu 1 jam ...
          │
          ▼
          Incident otomatis CLOSED
          (karena tidak ada data selama 1 jam)
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Menghindari incident menumpuk tanpa batas | Bisa close incident padahal resource memang mati (butuh investigasi) |
| Otomatis — tidak perlu manual close | Durasi yang salah = terlalu cepat close atau terlalu lama open |
| Bersihkan incident dashboard | — |

---

#### 3b. Policy User Labels

```
  Policy user labels  Recommended

  Policy user labels allow you to add your own labels to alert
  policies for organization. The labels are included in the
  notification and incident details.

  [+ ADD LABEL]
```

**Apa itu:** Custom key-value labels yang ditambahkan ke policy untuk **organisasi dan filtering**.

```
Klik [+ ADD LABEL]:

  ┌────────────────────────────────────────────┐
  │  Key              │  Value                  │
  │  ┌─────────────┐  │  ┌──────────────────┐  │
  │  │ environment  │  │  │ production       │  │
  │  └─────────────┘  │  └──────────────────┘  │
  │                                             │
  │  [+ ADD LABEL]   ← tambah label lagi       │
  └────────────────────────────────────────────┘
```

**Contoh labels yang berguna:**

| Key | Value | Kegunaan |
|-----|-------|----------|
| `environment` | `production` / `staging` / `dev` | Filter policy berdasarkan environment |
| `team` | `backend` / `infra` / `data` | Identifikasi tim yang bertanggung jawab |
| `service` | `web-api` / `worker` / `database` | Identifikasi service yang dimonitor |
| `priority` | `P1` / `P2` / `P3` | Prioritas internal organisasi |
| `oncall` | `team-alpha` | Tim on-call yang handle |

**Dimana label muncul:**

```
Label ditambahkan ke policy:
  environment = production
  team = backend

Saat incident terjadi:
  ┌─────────────────────────────────────────┐
  │ INCIDENT: High CPU - Production VMs     │
  │                                         │
  │ Labels:                                 │
  │   environment: production               │  ← muncul di incident detail
  │   team: backend                         │  ← muncul di notifikasi
  │                                         │
  │ (labels juga muncul di email/Slack)     │
  └─────────────────────────────────────────┘

Filter incidents by label:
  Monitoring → Alerting → Incidents
  Filter: label.environment = "production"   ← cepat temukan incident production
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Organisasi policy yang rapi (filter, search) | Butuh konvensi naming yang konsisten di tim |
| Labels muncul di notifikasi — tim langsung tahu konteks | Jika tidak dipakai, hanya menambah noise |
| Bisa filter incidents berdasarkan label | — |
| **Gratis** — tidak ada biaya tambahan | — |

---

#### 3c. Policy Severity Level

```
  Policy Severity Level

  Severity
  ┌────────────────────────────────────────────┐
  │ No severity                              ▼ │  ⓘ
  └────────────────────────────────────────────┘
```

| Severity | Kapan Digunakan | Warna di Console | Contoh |
|----------|----------------|-----------------|--------|
| **No severity** (default) | Belum dikategorikan atau untuk testing | Abu-abu | Policy percobaan |
| **Critical** | Sistem down, revenue loss, user terdampak langsung | Merah | VM unreachable, DB crash |
| **Error** | Degradasi signifikan tapi belum total down | Oranye | CPU > 90%, memory > 95% |
| **Warning** | Potensi masalah, perlu perhatian tapi tidak urgent | Kuning | Disk > 80%, slow query naik |

```
Severity mempengaruhi:

  1. Warna incident di Console
     ┌──────────────────────────────────────────────┐
     │ Incidents                                     │
     │                                               │
     │ 🔴 [CRITICAL] VM web-prod-1 unreachable      │
     │ 🟠 [ERROR]    High CPU on api-server          │
     │ 🟡 [WARNING]  Disk 85% on worker-3            │
     │ ⚪ [—]        Test alert policy               │
     └──────────────────────────────────────────────┘

  2. Routing notifikasi (manual best practice)
     Critical → PagerDuty + Slack + SMS
     Error    → Slack + Email
     Warning  → Email saja

  3. Filtering di Alerting dashboard
     Filter: severity = "CRITICAL"   ← lihat hanya critical incidents
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Prioritas visual yang jelas | "No severity" default — banyak orang lupa set |
| Bisa filter incidents by severity | Severity statis — tidak bisa auto-escalate |
| Membantu routing notifikasi yang tepat | Butuh agreement tim tentang definisi severity |

---

#### 3d. Alerting Policy Name & Documentation

Di bawah severity (masih di halaman yang sama), ada field nama dan dokumentasi:

```
  Alerting policy name
  ┌────────────────────────────────────────────┐
  │ High CPU on production VMs                 │
  └────────────────────────────────────────────┘

  Documentation (markdown — muncul di notifikasi)
  ┌────────────────────────────────────────────┐
  │ ## High CPU Alert                          │
  │                                            │
  │ CPU telah melebihi 80% selama 5 menit.     │
  │                                            │
  │ **Langkah troubleshoot:**                  │
  │ 1. SSH ke VM: `gcloud compute ssh VM_NAME` │
  │ 2. Jalankan `htop` atau `top`              │
  │ 3. Cek proses yang consume CPU tinggi      │
  │ 4. Jika traffic spike → scale up           │
  │                                            │
  │ **Runbook:** go/cpu-high-runbook           │
  │ **Dashboard:** go/prod-dashboard           │
  └────────────────────────────────────────────┘
```

**Tips penamaan policy:**

| Pattern | Contoh | Kelebihan |
|---------|--------|-----------|
| `[Resource] [Metric] [Environment]` | "VM CPU High - Production" | Jelas resource dan env |
| `[Service] [Condition]` | "API Error Rate > 2%" | Jelas service dan threshold |
| `[Priority] [Resource] [Metric]` | "P1 - Database Connection Limit" | Prioritas terlihat langsung |

**Tips documentation:**
- Tulis dalam **markdown** — support formatting di notifikasi
- Sertakan **langkah troubleshoot** yang actionable
- Tambahkan **link ke runbook/dashboard** — tim langsung tahu harus ke mana
- Documentation muncul di **email, Slack, PagerDuty** notifikasi

---

### Step 4: Review Alert

Step terakhir — review semua konfigurasi sebelum membuat policy.

```
  ┌─────────────────────────────────────────────────┐
  │  Review alert                                    │
  │                                                 │
  │  Alert conditions:                               │
  │  ┌───────────────────────────────────────────┐  │
  │  │ VM Instance - CPU utilization              │  │
  │  │ Threshold: > 80% for 5 minutes (mean)      │  │
  │  │ Trigger: Any time series violates           │  │
  │  └───────────────────────────────────────────┘  │
  │                                                 │
  │  Notifications:                                  │
  │  ┌───────────────────────────────────────────┐  │
  │  │ ☑ Slack (#ops-alerts)                      │  │
  │  │ ☑ Email (ops@company.com)                  │  │
  │  │ Notify on closure: Yes                      │  │
  │  │ Autoclose: 1 hour                           │  │
  │  └───────────────────────────────────────────┘  │
  │                                                 │
  │  Policy details:                                 │
  │  ┌───────────────────────────────────────────┐  │
  │  │ Name: High CPU on production VMs           │  │
  │  │ Severity: Critical                          │  │
  │  │ Labels: environment=production, team=infra  │  │
  │  └───────────────────────────────────────────┘  │
  │                                                 │
  │  ┌────────────────────┐                          │
  │  │   CREATE POLICY    │  ← finalize              │
  │  └────────────────────┘                          │
  └─────────────────────────────────────────────────┘
```

**Tips sebelum CREATE POLICY:**
- Pastikan **metric dan filter** benar — salah metric = alert yang tidak berguna
- Pastikan **threshold** realistis — terlalu rendah = noisy, terlalu tinggi = miss masalah
- Pastikan **notification channel** aktif dan tested — klik "Send test notification" di channel settings
- Pastikan **severity** sesuai — jangan semua Critical

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
       │    Within each time series:
       │      Rolling window: 5 min
       │      Rolling window function: mean
       │    Across time series:
       │      Aggregation: none (per VM)
       │    Secondary: OFF
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
Step 3: CONFIGURE NOTIFICATIONS & FINALIZE
       │
       │  🔵 Use notification channel: ON
       │  ☑ Slack (#ops-alerts)
       │  ☑ Email (ops@company.com)
       │  ☐ PagerDuty (belum setup)
       │
       │  ☑ Notify on incident closure
       │  Autoclose duration: 1 hour
       │
       │  Labels:
       │    environment = production
       │    team = infra
       │
       │  Severity: Error
       │
       │  Name: "High CPU - Production VMs"
       │  Docs: "CPU > 80%. ssh → htop. Runbook: go/cpu-high"
       │
       ▼
Step 4: REVIEW
       │
       │  Verifikasi semua konfigurasi
       │  [CREATE POLICY]
       │
       ▼
✅ Policy aktif — mulai monitoring
       │
       ▼
Saat CPU VM > 80% selama 5 menit:
  │
  ├─ 🔔 Incident OPENED
  │    → Slack: "[FIRING] High CPU - Production VMs"
  │    → Email: subject + documentation + labels
  │    → Tim acknowledge & mulai investigate
  │
  ... (tim fix masalah, CPU turun) ...
  │
  ├─ 🔔 Incident CLOSED (karena Notify on closure = ON)
  │    → Slack: "[RESOLVED] High CPU - Production VMs"
  │    → Email: resolved notification
  │    → Tim tahu masalah sudah selesai
  │
  └─ Jika VM dimatikan (no data):
       → Autoclose setelah 1 jam (incident auto-close)
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

## Notification Channels — Ringkasan

**Console:** Monitoring → Alerting → **Notification channels**

| Channel | Label | Konfigurasi | Cocok Untuk | Kelebihan | Kekurangan |
|---------|-------|------------|-------------|-----------|------------|
| **Mobile Devices** | — | Cloud Console Mobile App | Ops on-the-go | Push notification langsung ke HP | Butuh install app |
| **Google Chat** | PREVIEW | Space webhook URL | Tim Google Workspace | Integrasi native | Masih preview, terbatas ke GChat |
| **PagerDuty Services** | — | Integration key | Critical/on-call | Auto-escalation, scheduling | Berbayar, setup lebih kompleks |
| **PagerDuty Sync** | BETA | API key + mapping | Heavy PagerDuty user | Sync 2 arah GCP ↔ PD | Masih beta, setup kompleks |
| **Slack** | — | OAuth app / webhook | Tim engineering | Real-time, bisa thread | Butuh setup webhook/app |
| **Webhooks** | — | URL endpoint | Custom system | Sangat flexible, bisa integrasi apapun | Harus maintain endpoint |
| **Email** | — | Alamat email + display name | Semua level alert | Simple, semua orang punya | Bisa masuk spam, lambat dibaca |
| **SMS** | — | Phone number | Critical emergency | Pasti dibaca | Mahal, terbatas karakter |
| **Pub/Sub** | — | Topic name | Automation / custom pipeline | Trigger Cloud Function, flexible | Butuh coding untuk consume |

**Rekomendasi kombinasi per severity:**

```
Severity Critical:  PagerDuty Services + Slack + SMS
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
