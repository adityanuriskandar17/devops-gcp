# Widget Cloud Monitoring Dashboard — Ringkasan Lengkap

Dokumen ini merangkum **widget** yang dapat ditambahkan ke **custom dashboard** di **Google Cloud Console** lewat alur **Monitoring → Dashboards → Add widget** ([Dashboards](https://console.cloud.google.com/monitoring/dashboards)). Istilah teknis tetap dalam bahasa Inggris sesuai UI GCP; penjelasan dalam bahasa Indonesia.

**Referensi resmi (dokumentasi, selaras Console):**

- [Create and manage custom dashboards](https://docs.cloud.google.com/monitoring/charts/dashboards)
- [Add charts and tables](https://docs.cloud.google.com/monitoring/charts)
- [Dashboards overview](https://docs.cloud.google.com/monitoring/dashboards)
- [Manage dashboard widgets](https://docs.cloud.google.com/monitoring/charts/manage-widgets)
- [Display logs and errors](https://docs.cloud.google.com/monitoring/charts/view-logs)
- [Alerts and incidents on dashboards](https://docs.cloud.google.com/monitoring/dashboards/alerts-and-incidents)
- [Text and grouping](https://docs.cloud.google.com/monitoring/dashboards/text-and-grouping)

**Batasan umum:** hingga **100 widget** per dashboard; widget memakai **metrics scope** proyek yang dipilih di Console.

---

## Daftar Semua Widget

Panel **Add widget** di Console mengelompokkan pilihan menurut **jenis data** (mis. Metric, Logs) dan **layout**. Tabel di bawah mengikuti pengelompokan praktis **Visualization** vs **Other** seperti yang umum terlihat saat membangun dashboard, dengan kolom: **Nama**, **ikon (deskripsi)**, **apa yang ditampilkan**, **kapan dipakai**.

> **Catatan Console:** Setelah memilih sumber data (mis. **Metric**), banyak visualisasi diatur lewat **Display pane → Widget type**. Dokumentasi GCP secara eksplisit menyebut **line, stacked area, stacked bar, heatmap** untuk chart berbasis waktu ([Dashboards overview](https://docs.cloud.google.com/monitoring/dashboards)). Opsi seperti **horizontal bar** atau **scatter** muncul pada kombinasi metric/query tertentu bila tipe data kompatibel dengan **widget type** yang tersedia di editor.

### Kategori: Visualization

| Nama widget | Ikon (deskripsi kasar di Console) | Apa yang ditampilkan | Kapan dipakai |
|-------------|-----------------------------------|----------------------|---------------|
| **Line chart** | Kurva multi-warna naik-turun di sumbu waktu | **Time series** numerik atas **sumbu waktu**; banyak seri sekaligus | **Trend**, troubleshooting latency/CPU, resolusi tinggi; default paling fleksibel |
| **Stacked area chart** | Area bertumpuk antar seri di atas timeline | Kontribusi tiap seri terhadap **total** di setiap titik waktu | Memahami **proporsi** + **jumlah agregat** (mis. traffic per region) |
| **Stacked bar chart** | Batang vertikal bertumpuk per interval waktu | Agregat per **bucket waktu** sebagai batang bertumpuk | Data **jarang sampling** (mis. **quota**), perbandingan per periode |
| **Heatmap** | Petak warna (grid) intensitas vs waktu | **Distribution-valued metrics**; warna = kepadatan/percentile | Latency **distribution**, error rate spread, SLA tail |
| **Bar chart (horizontal)** | Batang mendatar (sering untuk perbandingan kategori) | Nilai terbaru atau agregat per **kategori/label** (sumbu Y = label) | **Ranking** instance/zone/service side-by-side |
| **Scatter plot** | Titik-titik di bidang X–Y | Hubungan dua ukuran (korelasi, outlier) pada snapshot atau rentang waktu | **Korelasi** mis. traffic vs error; **outlier detection** |
| **Pie chart** | Lingkaran tersegmentasi | **Nilai terakhir** tiap seri sebagai **proporsi** terhadap total | Proporsi sederhana (mis. CPU per zone)—hati-hati jika terlalu banyak slice |
| **Table** | Grid/kolom baris seperti spreadsheet | Satu baris per kombinasi **label**; nilai numerik/percentile; bisa multi-metric | **Daftar resource**, sort/filter, pasangan dengan chart untuk drill-down |
| **Scorecard** | Angka besar + area status (warna latar) | **Satu time series**: nilai terkini + **sparkline** ringkas; **threshold** warning/danger | **KPI** tunggal (availability, error rate) dengan konteks singkat |
| **Gauge** | Speedometer/setengah lingkaran | **Satu time series** terakhir vs **threshold** (hijau/amber/merah) | **Status cepat** “apakah dalam batas?” tanpa riwayat panjang |

**ASCII — Line chart**

```
  ^
  |     ___/‾‾\_
  | ___/        ‾‾\___
  +---------------------> waktu
```

**ASCII — Stacked area**

```
  ^
  | ████████████
  | ████░░░░░░░░
  | █░░░░░░░░░░░
  +---------------------> waktu
```

**ASCII — Stacked bar**

```
  |  ██
  |  ██  █
  |  ██  █  ██
  +-------------> waktu
```

**ASCII — Heatmap**

```
      t1 t2 t3 t4
  p99 ▓░▓▓
  p50 ░▓░░
  p10 ░░░▓
```

**ASCII — Horizontal bar**

```
  zone-a  |████████████     | 80%
  zone-b  |████             | 35%
```

**ASCII — Scatter**

```
  y ^
    |    •
    |  •   •
    |      • •
    +---------> x
```

**ASCII — Pie**

```
       ____
     /      \
    |  A  B  |
     \  C   /
       ‾‾‾‾
```

**ASCII — Table**

```
  | instance | zone   | CPU |
  | vm-1     | us-c1  | 12% |
  | vm-2     | us-e1  | 88% |
```

**ASCII — Scorecard**

```
  +------------------+
  |   99.95%   SLA   |
  | ~~~~ mini chart  |
  +------------------+
```

**ASCII — Gauge**

```
        (====)
       /  72% \
      +--------+
```

### Kategori: Other

| Nama widget | Ikon (deskripsi kasar) | Apa yang ditampilkan | Kapan dipakai |
|-------------|------------------------|----------------------|---------------|
| **Alert chart** | Grafik + garis **threshold** + chip **incidents** | **Time series** yang dipantau **alerting policy**, status policy, jumlah insiden terbuka | Menempelkan **SLO/alert** yang sama dengan notifikasi tim di satu dashboard |
| **Error reporting panel** | Simbol error/stack | **Error groups** terbaru dari **Error Reporting** | Menghubungkan metric/log dengan **crash/error** yang dikelompokkan GCP |
| **Logs panel** | Ikon log/teks baris | Tabel **log entries** (severity, timestamp, summary); query sama seperti **Logs Explorer** | **Troubleshooting** real-time di samping metric |
| **Incident list** | Daftar/clipboard insiden | Tabel **incidents** (policy, condition, waktu buka); filter policy/resource | **War room**: lihat apa yang sedang firing tanpa buka halaman Alerting |
| **Collapsible group** | Folder/group yang bisa dilipat | **Kontainer** untuk banyak widget; collapsed = data di-load **prioritas lebih rendah** | Dashboard padat; percepat **initial load** dengan grup yang jarang dibuka |
| **Single stat** | Satu angka besar minimalis | Angka **point-in-time** sangat ringkas (sering overlap konfigurasi dengan **scorecard**/indikator) | **At-a-glance** KPI di grid rapat |
| **Text** | Dokumen/teks | **Markdown** (judul, link, list); dukung **variabel** `${VAR}` | **Runbook**, link ke playbook, penjelasan section |

**ASCII — Alert chart**

```
  metric ~~~/__threshold___
  [ 2 open incidents ]  [View policy]
```

**ASCII — Error reporting**

```
  | Error group        | Count |
  | NullPointer in X   |  124  |
```

**ASCII — Logs panel**

```
  I 2025-03-27 ... Request completed
  W 2025-03-27 ... Retry exhausted
```

**ASCII — Incident list**

```
  | Policy      | Opened        |
  | High CPU    | 10 min ago    |
```

**ASCII — Collapsible group**

```
  [▼ Production metrics  ...............]
     (widgets di dalam grup)
```

**ASCII — Single stat**

```
  +--------+
  |  42 ms |
  +--------+
```

**ASCII — Text**

```
  +---------------------------+
  | # Production runbook      |
  | - Escalation: ...         |
  +---------------------------+
```

### Widget tambahan di Console (di luar tabel utama)

| Nama | Kategori | Keterangan singkat |
|------|----------|-------------------|
| **Top List** | Visualization (tabular) | Mirip tabel; baris **terurut** + **indikator visual** rentang nilai ([Add charts and tables](https://docs.cloud.google.com/monitoring/charts)) |
| **Treemap** | Visualization | Persegi bersarang; luas/warna ∝ nilai agregat terbaru |
| **Section header** | Layout | Judul section + **daftar isi** navigasi dashboard |
| **Dropdown group** / **Tab group** | Layout | Satu widget terlihat per waktu; menghemat ruang & prioritas load ([Text and grouping](https://docs.cloud.google.com/monitoring/dashboards/text-and-grouping)) |
| **SLO** | Observability | Widget khusus **Service Level Objectives** ([SLO dashboards](https://docs.cloud.google.com/monitoring/dashboards/slos)) |
| **Observability Analytics chart** | Logs/SQL | Hasil query **SQL** terhadap data log ([view logs](https://docs.cloud.google.com/monitoring/charts/view-logs)) |

---

## Widget yang Paling Sering Digunakan

Peringkat praktis untuk tim operasional GCP (bukan angka resmi Google):

1. **Line chart (metrics over time)** — **MOST USED**  
   Alasan: hampir semua **metric** berbasis waktu langsung cocok; mendukung multi-query, **legend**, **compare to past**, dan konversi ke **alert chart**. Ini fondasi observability.

2. **Table (list of resources)**  
   Alasan: setelah melihat anomali di chart, **sort/filter** pada tabel (per instance, zone, service) adalah cara tercepat menemukan **pelaku**.

3. **Scorecard (single number)**  
   Alasan: **KPI** (SLO, error rate, utilization) terbaca dalam **detik**; **threshold** warna memberi konteks tanpa alert noise.

4. **Logs panel (recent logs)**  
   Alasan: menyatukan **Logging** dengan **Monitoring** di satu URL dashboard; query sama dengan **Logs Explorer**.

5. **Alert chart (alert status)**  
   Alasan: menautkan **alerting policy** yang sudah disetujui tim dengan **metric + threshold + incidents**—konsistensi antara notifikasi dan tampilan.

---

## Kategori Widget Berdasarkan Kebutuhan

| Kebutuhan (bahasa sehari-hari) | Widget yang disarankan |
|--------------------------------|-------------------------|
| “Saya ingin lihat **trend CPU**” | **Line chart** (atau **Stacked area** jika fokus ke kontribusi total) |
| “Saya ingin lihat **nilai sekarang**” | **Scorecard** / **Gauge** / **Single stat** |
| “Saya ingin **bandingkan antar resource**” | **Table** / **Bar chart (horizontal)** / **Top List** |
| “Saya ingin lihat **distribusi**” | **Heatmap** (distribution metrics) / **Pie chart** (proporsi nilai terakhir) |
| “Saya ingin lihat **log**” | **Logs panel** |
| “Saya ingin lihat **alert**” | **Alert chart** / **Incident list** |

---

## Perbandingan Widget

| Widget | Data type (ringkas) | Best for | Complexity | Pro | Con |
|--------|---------------------|----------|------------|-----|-----|
| Line chart | Time series numeric | Trend, multi-seri | Rendah–sedang | Fleksibel, resolusi baik | Banyak seri → lambat/ramai |
| Stacked area | Time series numeric | Proporsi + total | Sedang | Menunjukkan **share** | Sulit baca seri kecil di bawah |
| Stacked bar | Time series numeric | Sample jarang, quota | Sedang | Cocok interval lebar | Kurang ideal untuk high-frequency |
| Heatmap | Distribution | Latency tail, spread | Tinggi | Insight **percentile** | Perlu pahami distribution metrics |
| Bar chart (horizontal) | Numeric per label | Ranking, perbandingan | Rendah | Mudah dibandingkan | Bukan untuk trend panjang |
| Scatter plot | Dua dimensi numerik | Korelasi, outlier | Sedang–tinggi | Pola cluster | Butuh metric/query yang tepat |
| Pie chart | Latest numeric | Proporsi sederhana | Rendah | Intuitif cepat | Buruk untuk banyak kategori |
| Table | Numeric + labels | Inventory, drill-down | Sedang | Sort/filter powerful | Perlu desain kolom agar tidak penuh |
| Scorecard | Single series | KPI + mini history | Rendah | Threshold + sparkline | Hanya **satu** seri utama |
| Gauge | Single series | Status vs batas | Rendah | Cepat “hijau/merah” | Tanpa konteks historis kaya chart |
| Alert chart | Policy + series | Alert context | Sedang | Selaras dengan alerting | Terikat ke policy tertentu |
| Error reporting panel | Error groups | Crash triage | Sedang | Integrasi Error Reporting | Perlu Error Reporting aktif |
| Logs panel | Log entries | Debug | Sedang–tinggi | Query penuh | IAM log + performa query |
| Incident list | Incidents | War room | Rendah | Fokus firing/closed | Bukan pengganti halaman Alerting penuh |
| Collapsible group | (bukan data) | Organisasi | Rendah | Mempercepat load | Hanya **mosaic layout** default |
| Single stat | Single value | KPI minimal | Sangat rendah | Ringkas | Informasi terbatas |
| Text | Markdown | Dokumentasi | Rendang | Link runbook, variabel | Tidak menampilkan metric |

---

## Widget Khusus

Widget berikut **bukan** chart metric klasik tetapi penting untuk **layout**, **narasi**, dan **sumber data non-murni metric**.

### Text widget

- **Fungsi:** catatan **Markdown** di dashboard (judul, **bold**, link internal `#section` atau URL eksternal).
- **Console:** **Add widget → Layout → Text** ([Text and grouping](https://docs.cloud.google.com/monitoring/dashboards/text-and-grouping)).
- **ASCII:**

```
  # On-call
  * [Playbook](https://...)
```

### Collapsible group

- **Fungsi:** mengelompokkan widget; saat **collapsed**, Monitoring mengambil data anak dengan **prioritas lebih rendah** sehingga dashboard terasa lebih cepat ([Manage widgets](https://docs.cloud.google.com/monitoring/charts/manage-widgets)).
- **Console:** **Add widget → Layout → Collapsible Group**; seret widget ke dalam grup.

### Error Reporting panel

- **Fungsi:** menampilkan **error groups** terbaru untuk korelasi dengan metric/log ([Display logs and errors](https://docs.cloud.google.com/monitoring/charts/view-logs)).
- **ASCII:**

```
  [ Error group A — 50 events ]
  [ Error group B — 3 events  ]
```

### Incident list

- **Fungsi:** daftar **incidents** dengan nama policy, condition, waktu; filter oleh **alert policy** atau **resource type**; opsi **Show closed incidents** ([Alerts and incidents](https://docs.cloud.google.com/monitoring/dashboards/alerts-and-incidents)).
- **ASCII:**

```
  Policy: Latency P99 | Open | View
  Policy: Disk full   | Open | View
```

---

## Ringkasan navigasi Console

1. Buka [Monitoring → Dashboards](https://console.cloud.google.com/monitoring/dashboards).
2. Pilih dashboard atau **Create dashboard**.
3. Klik **Add widget** — pilih **Metric**, **Logs**, **Alerting policy**, **Layout**, dll. sesuai kebutuhan.
4. Klik **Apply**, lalu **Save**.

Dengan memetakan **kebutuhan** ke **widget** yang tepat, dashboard tetap **ringan** (ingat batas **cardinality** dan jumlah seri), **mudah dibaca**, dan selaras dengan **alerting** serta **logging** di GCP.
