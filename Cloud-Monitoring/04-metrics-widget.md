# Widget Metrics / Line Chart di Google Cloud Monitoring

Dokumen ini menjelaskan **Line chart widget** (widget grafik garis) pada **custom dashboard** dan alur yang sama pada **Metrics Explorer** di **Google Cloud Console**. Semua langkah mengacu pada perilaku UI **Monitoring** resmi GCP.

**Console utama:**

- Dashboard: [Monitoring → Dashboards](https://console.cloud.google.com/monitoring/dashboards)
- Metrics Explorer: [Monitoring → Metrics explorer](https://console.cloud.google.com/monitoring/metrics-explorer)

**Dokumentasi resmi terkait:**

- [Add charts and tables to a custom dashboard](https://cloud.google.com/monitoring/charts)
- [Select metrics (Metrics Explorer)](https://cloud.google.com/monitoring/charts/metrics-selector)
- [Set chart display options](https://cloud.google.com/monitoring/charts/chart-view-options)
- [Explore charted data](https://cloud.google.com/monitoring/charts/working-with-charts)

---

## 1. Membuat Line Chart Widget

Di Console, alur umum untuk menambahkan grafik garis ke **custom dashboard** adalah: buka dashboard → tambah widget → pilih sumber data **Metric** → konfigurasi query → set **widget type** ke **Line chart**.

### Prasyarat singkat

- Project GCP yang aktif dipilih di toolbar Console.
- Peran minimal yang umum dipakai: **Monitoring Editor** (`roles/monitoring.editor`) atau setara untuk membuat/mengedit dashboard.
- Satu dashboard custom (buat baru atau buka yang sudah ada).

### Langkah demi langkah (GCP Console)

1. Buka **Google Cloud Console** → menu **Monitoring** (atau cari “Monitoring” di search bar; pilih hasil dengan subheading **Monitoring**).
2. Masuk ke halaman **Dashboards**: **Monitoring → Dashboards**  
   URL: `https://console.cloud.google.com/monitoring/dashboards`
3. Pilih salah satu:
   - **Create dashboard** untuk dashboard baru, atau
   - Klik nama dashboard yang sudah ada untuk membukanya.
4. Pada toolbar dashboard, klik **Add widget** (Tambah widget).
5. Pada dialog **Add widget**, pilih **Metric** (bukan Logs, Text, SLO, dll.). Ini memulai konfigurasi berbasis **time series**.
6. Panel konfigurasi widget terbuka. Di bagian **Query** (query pane):
   - Buka elemen **Metric** → **Select a metric**.
   - Pilih **resource type** (mis. **VM instance**), kategori metrik jika ada, lalu **metric** (mis. **CPU utilization**).
   - Klik **Apply** bila diminta.
7. Setelah data muncul di preview, tentukan **Widget type** / **Chart type**:
   - Pilih **Line chart** jika UI menawarkan daftar tipe yang kompatibel (line chart adalah salah satu **time-series chart** standar).
   - Catatan GCP: Anda bisa memilih **visualization dulu** atau **metric dulu**; keduanya valid. Dokumentasi resmi sering mengasumsikan alur **Metric** lalu mengubah tipe chart.
8. Sesuaikan **Aggregation**, **Filter**, **Group by**, **Display** (threshold, axis, legend) — dijelaskan pada bagian berikut.
9. Beri **judul widget** jika ada field title (disarankan nama yang menjelaskan resource + metrik + scope).
10. Klik **Save** / selesaikan dialog agar widget tersimpan di dashboard.

### Kelebihan / kekurangan (membuat via Dashboard vs Metrics Explorer)

| Aspek | Kelebihan | Kekurangan |
|--------|-----------|------------|
| **Dashboard widget** | Grafik permanen untuk tim; bisa dikombinasikan banyak widget; mendukung **Compare to past** untuk line chart | Perlu permission edit dashboard; perubahan sementara lebih “berat” daripada explorer |
| **Metrics Explorer** | Eksplorasi ad-hoc cepat; cocok untuk troubleshooting satu metrik | Tidak otomatis jadi dashboard kecuali Anda **Save to dashboard** |

---

## 2. Resource & Metric Selection

Hal **pertama** yang Anda konfigurasi di query builder adalah pasangan **resource type** (sumber data) dan **metric type** (apa yang diukur). Tanpa pasangan ini, chart tidak punya semantik yang jelas.

### Resource type dropdown

**Resource type** menjawab pertanyaan: *dari entitas GCP mana sampel metrik ini berasal?* Contoh umum di menu **Resources** / **Active resources**:

| Resource type (contoh UI) | Deskripsi singkat |
|---------------------------|-------------------|
| **VM instance** (`gce_instance`) | Compute Engine VM |
| **GKE Container** (`k8s_container`) | Workload di Kubernetes (GKE) |
| **Cloud SQL Database** (`cloudsql_database`) | Instance Cloud SQL |
| **Cloud Storage** (`gcs_bucket`) | Bucket GCS |
| **HTTP Load Balancer** / **HTTPS LB** | Metrik load balancing global/regional |
| **Cloud Run Revision** | Layanan Cloud Run per revision |
| **Cloud Functions** | Fungsi serverless |
| **Pub/Sub Topic / Subscription** | Messaging |
| **Unspecified** | Untuk metrik yang tidak terikat resource standar (dipakai terbatas) |

**Kelebihan** memilih resource yang tepat: label yang tersedia konsisten (mis. `instance_id`, `zone`, `database_id`).  
**Kekurangan** salah pilih: metrik tidak muncul, filter tidak relevan, atau chart kosong.

### Metric dropdown

**Metric** menjawab: *apa yang diplot?* (CPU, memory, latency, bytes, error rate, dll.). Kategori di Console sering dikelompokkan (mis. **Instance**, **Uptime**, **Logging**).

### Tabel metrik umum per resource type

Nama persis di UI bisa sedikit berbeda; di bawah ini menggunakan nama yang umum muncul atau **metric type** yang sering dipakai engineer.

#### VM instance (`gce_instance`)

| Metrik (contoh di UI) | Makna operasional |
|----------------------|-------------------|
| **CPU utilization** | Persentase penggunaan vCPU |
| **Memory utilization** (jika agent/config mendukung) | Pemakaian memori tamu |
| **Disk read/write bytes** | Throughput disk |
| **Disk read/write operations** | IOPS |
| **Network bytes sent/received** | Lalu lintas jaringan instance |
| **Uptime** / **Instance uptime** | Ketersediaan / status |
| **Firewall dropped packets** | Isu keamanan / rules |

#### GKE Container (`k8s_container`)

| Metrik (contoh) | Makna |
|-----------------|--------|
| **CPU request utilization** | Pemakaian CPU vs request |
| **Memory request utilization** | Pemakaian memori vs request |
| **Restart count** | Instabilitas pod |
| **Network received/sent bytes** | Traffic pod |

#### Cloud SQL (`cloudsql_database`)

| Metrik (contoh) | Makna |
|-----------------|--------|
| **CPU utilization** | Beban CPU instance DB |
| **Memory usage** | Pemakaian RAM |
| **Disk utilization** | Pemakaian storage |
| **PostgreSQL/ MySQL connections** | Jumlah koneksi |
| **Read/write IOPs** | Beban I/O |
| **Replication lag** (jika replika) | Kesehatan replikasi |

#### Cloud Storage bucket (`gcs_bucket`)

| Metrik (contoh) | Makna |
|-----------------|--------|
| **Request count** | GET/PUT dll. |
| **Network bytes sent** | Data keluar |

#### HTTP(S) Load Balancing

| Metrik (contoh) | Makna |
|-----------------|--------|
| **Request count** | QPS agregat |
| **Request latency** | Performa backend |
| **Backend healthy / unhealthy** | Kesehatan target |

### Cara mencari metrik di Console

1. Di elemen **Metric**, buka **Select a metric**.
2. Gunakan **Filter bar** di dalam dialog: ketik substring (mis. `util`, `latency`). Matching biasanya **case-insensitive contains**.
3. Default sering **hanya metrik yang punya data** di project. Untuk menampilkan metrik tanpa data terbaru, ubah opsi **Active** sesuai penjelasan di UI (GCP: klik **Active** untuk menampilkan semua metric types).
4. Pilih urutan: **Resource** → **Metric category** (jika ada) → **Metric** → **Apply**.

**Kelebihan** filter bar: cepat menemukan metrik di project besar.  
**Kekurangan**: string yang terlalu pendek bisa mengembalikan terlalu banyak kandidat; perlu disiplin penamaan saat custom metrics.

---

## 3. Filter

**Filter** membatasi **time series** yang masuk ke chart: hanya series yang memenuhi **semua** kriteria filter yang Anda tambahkan (**logical AND**).

### Add filter by label

1. Di query pane, pada elemen **Filter**, klik **Add filter**.
2. Pilih **label** (mis. `zone`, `instance_name`, `project_id`, `database_id`, label metrik kustom).
3. Pilih **comparator** (lihat bawah).
4. Isi **Value** (dropdown jika nilai pernah terlihat di data, atau ketik manual jika series belum pernah emit).

**Kelebihan**: mengurangi jumlah garis, chart lebih responsif (penting karena ada batas jumlah garis yang ditampilkan).  
**Kekurangan**: filter terlalu ketat bisa menyebabkan “no data” saat salah zona atau label typo.

### Operator filter (Comparator)

Menurut dokumentasi **Monitoring filters** di Console untuk menu-driven filter, comparator yang didukung:

| Operator | Arti | Contoh pemakaian |
|----------|------|------------------|
| **`=`** | Equals | `zone = us-central1-a` |
| **`!=`** | Not equals | Menghapus satu zone dari chart |
| **`=~`** | Regex match (RE2) | `zone =~ us-central1.*` |
| **`!=~`** | Regex does not match | Menyaring pola yang tidak diinginkan |

Untuk **project_id** / **resource container**, GCP mensyaratkan memakai **`=`** (equals), bukan regex.

### `starts_with` / `ends_with` pada nilai

Untuk perbandingan langsung `=` / `!=`, Console memungkinkan **value** berupa **filter string** seperti `starts_with("us-central1")` atau `ends_with(...)` (lihat [Monitoring filters](https://cloud.google.com/monitoring/api/v3/filters)).

**Kelebihan**: ekspresif tanpa menulis regex penuh.  
**Kekurangan**: kurang familiar untuk pemula; salah sintaks membuat query invalid.

### Multiple filters (AND logic)

- Setiap baris filter adalah syarat tambahan.
- **Semua** harus terpenuhi agar series ditampilkan.
- Label yang sama boleh dipakai beberapa kali untuk membentuk rentang/logika yang didukung oleh filter string (lihat dokumentasi resmi untuk batasan).

**ASCII: AND antar filter**

```
Time series candidate:  A, B, C, D, E

Filter 1: zone = us-central1-a     --> keeps A, D
Filter 2: instance_name =~ web-.*  --> dari {A,D} hanya A

Chart menampilkan: A saja
```

### Walkthrough UI (ringkas)

1. **Edit** widget → panel **Query** → **Filter** → **Add filter**.
2. Atur label + comparator + value → **OK**.
3. Ulangi untuk filter tambahan.
4. **Menu** pada chip filter untuk edit; **Cancel** untuk hapus.

**Kelebihan** UI chip: readable untuk operator NOC.  
**Kekurangan**: banyak filter kompleks kadang lebih cepat di **Direct Filter Mode** / bahasa query (lihat bagian MQL).

---

## 4. Group By

**Group by** di Console berkaitan dengan **pengelompokan label** saat Anda menggabungkan time series: series dengan kombinasi label yang sama digabung menjadi satu hasil per grup.

### Group by instance, zone, project

Contoh praktis:

- **Group by `zone`**: satu garis per zone (setelah aggregasi ke grup).
- **Group by `instance_name` atau `instance_id`**: satu garis per VM.
- **Group by `project_id`**: berguna di skenario multi-project jika label tersedia (bergantung pada metrik dan binding resource).

Di elemen **Aggregation**, menu kedua (grouping) memungkinkan memilih satu atau lebih label.

### Apa yang terjadi secara visual?

- **Tanpa grouping yang membentuk banyak grup**: Anda bisa mendapatkan **satu** garis agregat (mis. mean semua instance) — tergantung fungsi agregasi pertama.
- **Dengan grouping**: chart menampilkan **satu garis per kombinasi nilai label** yang dipilih → mudah membandingkan instance vs instance atau zone vs zone.

### With vs without grouping (perbandingan)

**Tanpa group by (contoh konseptual)**

```
Aggregation: Mean + group None
--> satu garis "rata-rata fleet"
```

**Dengan group by `instance_name`**

```
Aggregation: Mean + group instance_name
--> banyak garis, satu per instance
```

**ASCII**

```
Tanpa group by (mean fleet):

  ^ util
  |     .-------------------
  |    /
  |___/

Dengan group by per instance:

  ^ util
  |   /\    /\      (garis A)
  |  /  \  /  \     (garis B)
  |_/____\/____\    (garis C)
```

**Kelebihan** group by: diagnosis granular (siapa yang anomali).  
**Kekurangan**: bisa melebihi batas jumlah garis; perlu **Sort & limit** atau filter tambahan.

---

## 5. Aggregation

**Aggregation** di Monitoring = **alignment** (merapikan titik dalam satu series ke interval tetap) + **cross-series reduction** (menggabungkan banyak series menjadi lebih sedikit) + opsional **secondary aggregation**.

### Komponen utama di UI

1. **Aggregator / reduction function** (menu pertama di **Aggregation**): `mean`, `sum`, `min`, `max`, `count`, `percentile`, dll.
2. **Alignment period** / **Min interval**: di Console sering dikonfigurasi lewat **Add query element → Min Interval** (mis. `1m`, `5m`, `1h`). Ini mengontrol seberapa sering titik hasil alignment.
3. **Aligner / alignment function**: ketika Anda memilih **Configure aligner**, Anda bisa mengoverride aligner default (tergantung metrik dan pilihan agregasi).

### Aggregator: mean, sum, min, max, count, percentile

| Fungsi | Contoh interpretasi | Kapan dipakai |
|--------|---------------------|---------------|
| **Mean** | Nilai rata-rata antar series dalam grup | “Rata-rata CPU fleet per zone” |
| **Sum** | Menjumlahkan contoh: total throughput jika metrik additive | **Network bytes** antar instance per layanan |
| **Min / Max** | Nilai terendah/tertinggi dalam grup | SLA tail latency per shard, deteksi hotspot |
| **Count (time series)** | Menghitung berapa series yang cocok | Indikasi cardinality / banyak target |
| **Percentile (mis. p95, p99)** | Ringkasan distribusi antar series di grup | Latency, error distribution |

**Kelebihan mean**: halus, mudah dibaca. **Kekurangan mean**: menyembunyikan outlier ekstrem.  
**Kelebihan max**: menangkap puncak beban. **Kekurangan max**: sensitif noise singkat.  
**Kelebihan percentile**: fokus pengalaman tail. **Kekurangan**: interpretasi harus selaras dengan cara Monitoring menghitung percentile di agregasi multi-series.

### Alignment period (1m, 5m, 1h, …)

- Semakin **kecil** interval → detail tinggi, titik banyak, chart “berisik”.
- Semakin **besar** interval → lebih halus, cocok rentang waktu panjang; Console dapat **menaikkan interval secara otomatis** jika terlalu banyak titik untuk rentang yang dipilih.

**Contoh**: CPU dengan sampling 1 menit, tampilan 1 jam: tanpa min interval bisa ~60 titik per series; min interval `5m` → ~12 titik per series (lebih halus).

**Kelebihan min interval besar**: performa UI lebih baik, trend jelas.  
**Kekurangan**: spike pendek bisa ter-smoothing.

### Aligner: rate, delta, count_true, next older, percentile, dll.

Aligner menentukan **cara menggabungkan sampel mentah** dalam jendela alignment. Berikut ringkasan yang sering muncul di diskusi operasional (detail API: [Aligner](https://cloud.google.com/monitoring/api/ref_v3/rest/v3/projects.alertPolicies#Aligner)):

| Aligner (contoh) | Ide | Contoh pemakaian |
|------------------|-----|------------------|
| **rate** | Mengubah cumulative/delta menjadi “per detik” (gauge) | **Bytes per second** dari counter bytes |
| **delta** | Perubahan dalam periode alignment | Menghitung kenaikan counter per bucket waktu |
| **next older** | Ambil sampel terbaru di periode | **Gauge** yang hanya peduli nilai terakhir |
| **percentile** (untuk distribution) | Ambil p50/p95/p99 dari distribusi di periode | Latency distribution metrics |
| **count_true** | Untuk boolean-ish / kejadian | Menghitung berapa kali kondisi true per jendela (bergantung metrik) |

**Kelebihan rate**: cocok untuk **counter** yang ingin dibaca sebagai throughput.  
**Kekurangan rate**: sensitif pada gap data; perlu paham unit asli metrik.

### Tabel ringkas opsi agregasi (pros/cons)

| Opsi | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Unaggregated + group None** | Menampilkan semua series mentah (ideal untuk sedikit target) | Mudah melebihi batas garis; chart berat |
| **Mean + group by zone** | Ringkas per zona | Outlier instance tersembunyi |
| **Max + group by instance** | Menonjolkan puncak per instance | Bisa “false alarm” visual dari spike kecil |
| **Sum + group by service label** | Total beban additive | Tidak cocok untuk metrik yang tidak additive (mis. utilization %) |
| **Percentile + grouping ketat** | Fokus SLO tail | Lebih sulit dijelaskan ke non-SRE |
| **Secondary aggregation** | Mereduksi banyak garis hasil grup ke satu garis | Kehilangan granularitas; harus paham urutan agregasi |

---

## 6. Analysis Mode

Di **Google Cloud Console**, istilah sedikit berbeda antara **Metrics Explorer** dan **Dashboard**, tetapi konsepnya sama:

- **Metrics Explorer**: **Analysis mode** → *Standard*, *Stats*, *X-Ray*.
- **Dashboard (line chart)**: **Chart mode** di **Display pane** → *Color mode*, *Stats mode*, *X-Ray mode*.

**Color mode** ≈ **Standard mode**: setiap time series warna unik.

Fitur **Outlier** dan **Compare to past** adalah **kemampuan terpisah** (bukan sub-mode Analysis mode di dokumentasi resmi), tetapi secara operasional tim sering mengelompokkannya sebagai “mode analitik”; maka di sini dijelaskan lengkap.

---

### Standard / Color mode

**Penampilan (ASCII)**

```
Legend:  [ A: blue ] [ B: orange ] [ C: green ]

  ^ metric
  |      /\        -----
  |  ---/  \---   /     \
  | /          \-/       \---
  +----------------------------> time
```

**Apa ini?** Tampilan default: **nilai metrik aktual** per time series sebagai garis berwarna berbeda.

**Kapan dipakai?** Monitoring harian, drill-down ke beberapa instance, presentasi ke engineer yang perlu melihat garis individual.

| Kelebihan | Kekurangan |
|-----------|------------|
| Interpretasi paling natural | Ramai jika banyak series |
| Mudah bedakan series di legenda | Bisa menabrak batas ~50 garis (perilaku “too much data”) |

**Skenario nyata**: Anda memfilter 5 VM production; Standard mode menunjukkan siapa yang CPU-nya naik dulu saat deploy.

**Console (dashboard permanen)**: **Edit** chart → **Display** → **Chart mode** → **Color mode**.  
**Console (sementara)**: toolbar chart → **More options** → pilih mode (perubahan hilang saat reload jika tidak disimpan).

---

### Stats mode

**Penampilan (ASCII)**

```
  ^ metric
  |................. max ------
  |     - - - - - - mean ------
  |................. min ------
  |     (garis metrik bisa tetap ada + statistik)
  +----------------------------> time
```

**Apa ini?** Menampilkan **ukuran statistik** terkait data pada chart (mis. **mean**, **stddev**, **percentiles** tergantung konteks); legenda memuat ringkasan statistik.

**Kapan dipakai?** Menjawab “berapa kisaran normal?” tanpa export ke spreadsheet.

| Kelebihan | Kekurangan |
|-----------|------------|
| Ringkasan kuantitatif cepat | Kurang ideal jika Anda butuh identitas per-instance |
| Baik untuk komunikasi ke leadership | Bisa membingungkan jika banyak grup dan statistik tumpang tindih |

**Skenario nyata**: Review mingguan latency: Stats mode membantu melihat mean vs tail secara visual.

---

### X-Ray mode

**Penampilan (ASCII)**

```
Banyak garis abu-abu transparan; area padat jadi "terang"

  ^ metric
  |   ████████ band terang (banyak overlap)
  |  ██    ██   garis individual redup
  | ____________
  +----------------------------> time
```

**Apa ini?** Setiap series digambar **abu-abu transparan**; **tumpang tindih** membuat **jalur terang** yang menunjukkan **perilaku normal kolektif**; penyimpangan mudah terlihat.

**Kapan dipakai?** Banyak VM/pod dengan pola serupa — Anda ingin melihat **distribusi** dan outlier relatif terhadap “band” utama.

| Kelebihan | Kekurangan |
|-----------|------------|
| Sangat baik untuk dense cluster | Sulit dibedakan identitas series tanpa highlight |
| Menonjolkan anomali relatif | Kurang cocok untuk presentasi non-teknis |

**Skenario nyata**: 80 pod frontend: X-Ray menunjukkan satu pod yang “keluar jalur” dari band CPU cluster.

---

### Outlier mode (Sort & Limit + siluet abu-abu)

Di dokumentasi GCP, fitur ini dijelaskan sebagai **Sort & limit** pada query: Anda mengurutkan series (mis. by mean) dan menampilkan **top/bottom N**; **outline abu-abu** di background menunjukkan **seluruh data** yang tidak digariskan penuh.

**Penampilan (ASCII)**

```
Foreground: 3 garis warna (top 3 by mean)
Background: siluet semua series (abu-abu)

  ^ metric
  | ~~~gray cloud~~~
  | ---thick red---
  | --thick blue--
  | .--thick green-.
  +----------------------------> time
```

**Kapan dipakai?** Chart kebanyakan garis; Anda ingin fokus ke **ekstrem** (mis. 5 instance paling boros CPU).

| Kelebihan | Kekurangan |
|-----------|------------|
| Mengatasi kepadatan garis | Bisa melewatkan masalah yang “medium” tapi sistemik |
| Menjaga konteks distribusi (siluet) | Perlu memilih metrik pengurutan yang adil |

**Skenario nyata**: Ratusan micro-VM: tampilkan **top 10** max network egress untuk menemukan kemungkinan exfil/error config.

**Console**: **Edit** → query pane → **Add query element** → **Sort & limit** (jika belum ada).

---

### Compare to past

**Apa ini?** **Overlay** data periode yang sama dari **waktu lampau** sebagai garis **putus-putus** di atas data **sekarang** (hanya **line chart**).

**Penampilan (ASCII)**

```
Solid line   = current window
Dotted line  = same clock-time window, shifted back

  ^
  |   ....... past ........
  |  .                   .
  | --current-----------   (bisa di atas atau bawah past)
  +----------------------------> time
```

**Kapan dipakai?** Menjawab pertanyaan klasik: *“Apakah pola hari ini normal?”* — mis. **CPU hari ini vs minggu lalu** pada jam yang sama.

| Kelebihan | Kekurangan |
|-----------|------------|
| Perbandingan musiman intuitif | Membutuhkan data historis tersimpan untuk window tersebut |
| Tidak perlu export CSV manual | Jika tidak ada data lampau, chart tidak berubah |

**Skenario nyata**: Incident pagi: bandingkan error rate **jam ini** dengan **minggu lalu** untuk membedakan regressi rilis vs pola traffic.

**Catatan penting (perilaku resmi)**: Data masa lalu yang di-overlay adalah **periode tampilan yang sama** (mis. 10:00–11:00) tetapi **digeser** sesuai offset yang Anda set.

**Console (dashboard)**: **Edit** → **Display** → **Compare to Past** → set **Value** + **Scope** (mis. `2` + `weeks`).  
**Console (Metrics Explorer)**: **Display** → expand **Compare to past** → enable + **Timeshift duration** (mis. `1w`).

---

## 7. Compare to Past (Deep Dive)

Bagian ini fokus pada fitur **Compare to past** / **Compare to Past** seperti di **Display pane** Console.

### Lokasi di Console

- **Dashboard custom**: buka dashboard → **Edit** widget line chart → **Display** → **Compare to Past**.
- **Metrics explorer**: **Display** → **Compare to past** → **Enable compare to past** → isi **Timeshift duration**.

### Opsi offset waktu

Di dashboard, Anda mengisi **angka** + **unit scope** (mis. jam/hari/minggu) sesuai field di UI. Contoh yang umum dipakai operasional:

| Offset | Pertanyaan bisnis yang dibantu |
|--------|--------------------------------|
| **1 hour** | Apakah spike ini juga terjadi satu jam lalu? (rolling pendek) |
| **1 day** | Bandingkan dengan kemarin (pola harian) |
| **1 week** | Bandingkan dengan minggu lalu (pola mingguan + rilis) |
| **4 weeks** | Bandingkan dengan sebulan lalu (musiman kasar) |

**Kelebihan**: sangat cepat untuk sanity check tanpa membuat dua chart.  
**Kekurangan**: event satu kali (maintenance, holiday) bisa membuat perbandingan menyesatkan.

### Apa yang ditampilkan?

- **Garis solid** (current) vs **garis putus-putus** (past) untuk window waktu yang **sama panjangnya** dengan time range chart, tetapi digeser mundur.
- **Legenda** menunjukkan nilai **present** dan **past** pada titik yang Anda pin/hover (bersama fitur legend lain).

### Use case: “Apakah CPU hari ini lebih tinggi dari biasanya?”

1. Set dashboard time range ke **Last 6 hours** (contoh).
2. Aktifkan **Compare to Past** dengan offset **1w**.
3. Amati apakah garis solid secara sistematis di atas garis putus-putus.
4. Jika ya, korelasikan dengan **deploy**, **traffic**, **batch job** (gunakan log/metric lain).

### ASCII: current vs past overlay

```
Metric: CPU utilization (%)

100 |                             * past (dotted)
 80 |                .............*
 60 |...............*            :
 40 |   -----------current--------'----
 20 |
  0 +----------------------------------------> time
        ^                       ^
        |                       |
   spike hari ini          tidak ada di minggu lalu
   --> investigasi rilis / autoscaling
```

**Kelebihan visual**: immediate “delta pola”.  
**Kekurangan visual**: dua garis yang sangat berimpit sulit dibedakan tanpa hover.

---

## 8. Display Options

Opsi tampilan mengatur bagaimana data **sudah ter-query** divisualisasikan.

### Chart mode: Line, Stacked area, Stacked bar, Heatmap

| Mode | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Line** | Terbaik untuk tren kontinu multi-series | Ramai jika banyak series |
| **Stacked area** | Menunjukkan kontribusi komponen terhadap total | Sulit baca series kecil (thin band) |
| **Stacked bar** | Diskrit per bucket waktu | Kurang ideal untuk high-frequency spikes |
| **Heatmap** | Kuat untuk **distribution metrics** | Hanya untuk metrik distribusi; tidak semua metrik |

### Y-axis: auto, custom min/max, log scale

- **Auto**: cepat, adaptif.
- **Custom min/max**: menekankan perbedaan kecil (mis. latency 200–220ms).
- **Log scale on Y-axis** (Display): berguna saat nilai tersebar beberapa orde.

| Opsi | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Auto** | Tidak perlu tuning | Spike kecil bisa terlihat datar |
| **Custom range** | Kontrol narasi visual | Salah range → misleading |
| **Log scale** | Menampung outliers besar + cluster kecil | Tidak intuitif untuk audiens non-teknis |

### Legend position

Di dashboard, tampilan legenda global bisa dikontrol lewat **dashboard toolbar → Settings** (condensed/table), dan per-chart lewat **Expand legend** / menu chart.  
**Kelebihan table legend**: sort/filter nilai. **Kekurangan**: memakan ruang.

### Threshold lines (garis referensi)

**Threshold** membuat **garis horizontal** pada nilai tertentu (mis. **80% CPU**).

**Console (dashboard)**: **Edit** chart → **Display** → centang **Threshold** → pilih sumbu (kiri/kanan jika dual-axis) → isi nilai.  
**Console (Metrics Explorer)**: **Display** → **Threshold Line** → **Add threshold**.

| Kelebihan | Kekurangan |
|-----------|------------|
| SLO/operational boundary jelas | Satu threshold tidak menggantikan alerting |
| Bagus untuk dashboard NOC | Threshold multi-kondisi lebih baik di alerting policy |

---

## 9. MQL vs Builder

Di Console modern, builder metrik sering disebut **menu-driven interface** / **Builder**. Selain itu tersedia mode teks untuk query lanjutan.

### Builder (visual UI)

**Apa ini?** Dropdown **Resource**, **Metric**, **Filter**, **Aggregation**, **Min interval**, **Sort & limit**, dll.

| Kelebihan | Kekurangan |
|-----------|------------|
| Kurva belajar rendah | Agak lambat untuk pola query berulang |
| Konversi ke PromQL sering tersedia (lihat toolbar) | Kasus edge kadang memaksa **Direct Filter Mode** |

### MQL (Monitoring Query Language)

**Apa ini?** Bahasa query teks untuk menyusun pipeline fetch/align/group dengan kontrol tinggi pada beberapa skenario advanced.

**Contoh pola MQL (ilustratif — sesuaikan project dan metric type Anda):**

```mql
fetch gce_instance
| metric 'compute.googleapis.com/instance/cpu/utilization'
| filter (metric.instance_name =~ 'web-.*')
| group_by 1m, [mean(value.utilization)]
```

```mql
fetch cloudsql_database
| metric 'cloudsql.googleapis.com/database/cpu/utilization'
| group_by 5m, [max(value.utilization)]
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Ekspresif untuk transformasi kompleks | Maintenance oleh tim yang paham sintaks |
| Mudah di-review sebagai teks | Tidak semua alur UI bisa round-trip sempurna |

### Catatan Console (GCP) — PromQL & Direct Filter Mode

Toolbar query sering berisi tombol **MQL** / **PromQL**. **PromQL** populer untuk engineer yang sudah terbiasa ekosistem Prometheus. **Direct Filter Mode** memakai **Monitoring filter** murni untuk kasus seperti metrik tanpa data, SLO, atau filter label yang belum muncul di menu.

| Mode | Kelebihan | Kekurangan |
|------|-----------|------------|
| **PromQL** | Familiar untuk pengguna Prometheus; auto-suggestion | Tidak selalu reversible ke Builder |
| **Monitoring filter** | Presisi seleksi time series | Perlu paham dokumentasi filter |

---

## 10. Contoh Konfigurasi Lengkap

Contoh berikut menggunakan pola **Dashboard → Add widget → Metric** lalu **Line chart**.

---

### Contoh 1: CPU utilization per VM + threshold 80%

**Tujuan**: Satu chart menunjukkan **CPU per instance**, dengan **garis referensi** di 0.8 (80% jika metrik 0–1) atau 80 jika metrik persen — **selaraskan dengan unit yang ditampilkan di legend**.

**Langkah Console**

1. **Monitoring → Dashboards** → pilih dashboard → **Add widget** → **Metric**.
2. **Metric → Select a metric**:
   - Resource: **VM instance**
   - Metric: **CPU utilization** (Instance / CPU)
   - **Apply**
3. **Filter** (opsional): tambahkan `zone = ...` jika ingin satu zona saja.
4. **Aggregation**:
   - Fungsi: **mean** (atau sesuai kebutuhan)
   - Group by: **instance_name** atau **instance_id** (agar **satu garis per VM**)
5. **Add query element → Min interval**: `1m` untuk detail 1 jam terakhir.
6. **Widget type**: **Line chart**
7. **Display**:
   - **Chart mode**: **Color mode** (Standard)
   - **Threshold**: enable → set ke **0.8** atau **80** sesuai unit chart
8. **Save** widget.

| Aspek | Kelebihan | Kekurangan |
|-------|-----------|------------|
| Threshold | Cepat melihat pelanggaran visual | Perlu alerting terpisah untuk notifikasi |
| Per-instance | Mudah pinpoint VM | Banyak VM → perlu Sort & limit |

---

### Contoh 2: Network bytes received, group by instance, aggregator sum

**Tujuan**: Melihat **total bytes received** yang **additive** per instance (bukan rata-rata utilization).

**Langkah Console**

1. **Add widget** → **Metric**
2. Pilih resource **VM instance**, metric **Network bytes received** (nama persesuaikan UI; biasanya counter bytes).
3. **Aggregation**:
   - Fungsi pertama: **sum** (menjumlahkan series yang digabung dalam grup)
   - Group by: **instance_name** atau **instance_id**
4. Jika metrik bersifat **cumulative counter**, buka **Configure aligner** → pilih **rate** agar interpretasi menjadi **bytes per second** (disarankan untuk analisis throughput).
5. **Min interval**: `1m` atau `5m`.
6. **Line chart**

| Aspek | Kelebihan | Kekurangan |
|-------|-----------|------------|
| **Sum** | Cocok untuk total beban | Salah interpretasi jika duplikasi label/series ganda |
| **Rate pada counter** | Membuat metrik mudah dibaca | Butuh pemahaman counter vs gauge |

---

### Contoh 3: Cloud SQL connections, compare to 1 week ago

**Tujuan**: Cek apakah koneksi DB **minggu ini** pada jam yang sama berbeda jauh dari **minggu lalu**.

**Langkah Console**

1. **Add widget** → **Metric**
2. Resource: **Cloud SQL Database**
3. Metric: **connections** / **PostgreSQL connections** / **MySQL connections** (sesuai engine)
4. **Filter**: `database_id = ...` jika banyak instance.
5. **Aggregation**:
   - **mean** atau **max** (max lebih sensitif lonjakan)
   - Group by: **none** jika satu DB saja; atau group by label yang membedakan instance jika perlu.
6. **Widget type**: **Line chart** (wajib untuk Compare to past)
7. **Display → Compare to Past**:
   - Value: `1`
   - Scope: `week` (atau setara di UI)
8. **Save**

| Aspek | Kelebihan | Kekurangan |
|-------|-----------|------------|
| Compare 1w | Deteksi regressi pola mingguan | Event maintenance bisa mengacaukan baseline |

---

## Ringkasan cepat untuk operator

- Mulai dari **resource + metric** yang benar, lalu **filter** cardinality, lalu **aggregation + group by**, baru **display** (mode, threshold, compare).
- Jika chart penuh sesak, urutkan strategi: **filter** → **group/mean** → **Sort & limit** → **X-Ray**.
- **Compare to past** hanya untuk **line chart**; pastikan **time range** dashboard cukup panjang agar pola terlihat.

---

*Dokumen ini menggabungkan pengalaman praktis operasi observabilitas dengan struktur yang selaras dokumentasi resmi Google Cloud Monitoring per Maret 2025–2026; nama field UI dapat sedikit berubah antar rilis Console.*
