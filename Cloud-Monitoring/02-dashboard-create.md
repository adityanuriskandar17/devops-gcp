# Membuat Dashboard di Google Cloud Monitoring Console

Dokumen ini menjelaskan cara membuat dan mengelola **dashboard** di **Google Cloud Monitoring** melalui **Cloud Console**, termasuk **predefined dashboards**, **custom dashboard**, **widgets**, **settings**, **JSON export/import**, dan **skenario** praktis.

---

## Membuka Cloud Monitoring Dashboard

### Console path

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Pastikan **project** yang benar dipilih (selector di bagian atas).
3. Navigasi: **Navigation menu** (☰) → **Observability** → **Monitoring** → **Dashboards**.

   Atau gunakan **search bar** di Console: ketik `Monitoring dashboards` dan pilih hasil yang mengarah ke halaman **Dashboards**.

### Landing page: apa yang Anda lihat

Di halaman **Monitoring → Dashboards**, biasanya Anda melihat:

- **Daftar dashboard** yang tersedia untuk project tersebut.
- **Predefined dashboards** (dashboard bawaan Google) yang muncul otomatis atau dapat dipilih dari galeri/template terkait produk (misalnya **Compute Engine**, **GKE**, **Cloud SQL**).
- **Custom dashboards** yang dibuat tim Anda sendiri (nama dan metadata sesuai kebutuhan internal).

**Predefined dashboards** fokus pada metrik standar untuk layanan GCP tertentu dan cepat dipakai tanpa konfigurasi mendalam. **Custom dashboards** memungkinkan Anda menggabungkan **metrics**, **logs**, dan **visualisasi** lintas layanan sesuai **SLO**, **on-call**, atau **postmortem**.

Ringkasnya: landing page adalah titik masuk untuk melihat **health overview** per produk (via template Google) dan **view operasional kustom** yang Anda desain sendiri.

---

## Predefined Dashboards

Google menyediakan **built-in dashboards** yang mengikuti best practice visualisasi untuk layanan populer. Anda tidak perlu mendefinisikan query dari nol untuk skenario umum.

### Contoh predefined dashboards yang umum

| Dashboard / fokus | Layanan terkait | Apa yang biasanya ditampilkan |
|-------------------|-----------------|-------------------------------|
| **VM Instances** / **Compute Engine** | **GCE** | **CPU utilization**, **memory**, **disk I/O**, **network traffic**, status instance, sering dengan breakdown per **zone** atau **instance** |
| **Google Kubernetes Engine** | **GKE** | **Cluster** dan **node** health, **pod** metrics, **control plane** (tergantung versi/integrasi), resource usage workload |
| **Cloud SQL** | **Cloud SQL** | **Connections**, **CPU**, **memory**, **disk**, **replication lag** (jika ada), **query/performance** indicators |
| **Cloud Run** | **Cloud Run** | **Request count**, **latency**, **error rate**, **concurrency**, **instance count** |

> **Catatan:** Nama pasti di UI bisa sedikit berbeda antar versi Console; cari entri yang jelas berlabel **GCE**, **GKE**, **Cloud SQL**, atau **Cloud Run** di daftar atau galeri dashboard.

### Predefined vs custom

| Aspek | Predefined dashboards | Custom dashboards |
|-------|----------------------|-------------------|
| **Time to value** | Sangat cepat; siap pakai | Butuh waktu desain & iterasi |
| **Coverage** | Cocok untuk pola standar per produk | Bisa gabung multi-service, **SLO**, **alerts context** |
| **Fleksibilitas** | Terbatas pada metrik/layout yang Google sediakan | Penuh: **MQL**, **PromQL** (jika relevan), **logs**, layout **grid**/**mosaic** |
| **Maintenance** | Diupdate Google; bisa berubah seiring UI/metrik | Anda yang menjaga konsistensi naming & widget |
| **Cocok untuk** | Onboarding, troubleshooting cepat per produk | **Production overview**, **runbook** spesifik, **stakeholder** custom |

**Rekomendasi praktis:** mulai dari **predefined** untuk observabilitas dasar, lalu tambahkan **custom dashboard** untuk **golden signals** (latency, traffic, errors, saturation) yang dipadukan dengan kebutuhan bisnis Anda.

---

## Create Custom Dashboard

Berikut langkah membuat **custom dashboard** di **Cloud Console** (alur umum; label tombol dapat sedikit bervariasi).

### 1. Buka halaman Dashboards

**Path:** **Monitoring** → **Dashboards**.

### 2. Klik **+ Create dashboard**

Tombol biasanya berlabel **Create dashboard** atau **+ Create dashboard** di toolbar atas daftar dashboard.

### 3. **Dashboard name**

- Masukkan nama yang deskriptif, misalnya `prod-overview-gce` atau `gke-cluster-health`.
- Nama membantu saat **sharing** dan saat mencari di daftar dashboard.

### 4. **Layout options: Grid vs Mosaic**

- **Grid layout:** widget diatur dalam **kolom** dan **baris** teratur; mudah dipahami dan konsisten untuk **NOC** / **wallboard**.
- **Mosaic layout:** penempatan lebih fleksibel (seperti **mosaic** / **free-form** dalam batas editor); berguna untuk menonjolkan satu chart besar dan beberapa chart kecil.

Pilih sesuai kebiasaan tim: **grid** untuk seragam, **mosaic** untuk emphasis visual.

### 5. Representasi ASCII — editor dashboard (konsep)

```
+------------------------------------------------------------------+
|  Google Cloud Console   [Project ▼]   [Search resources...]     |
+------------------------------------------------------------------+
| ☰  Observability > Monitoring > Dashboards > [Edit: my-dash]   |
+------------------------------------------------------------------+
|  [Save] [Cancel]                    Time range: [1h ▼]  [Refresh]|
+------------------------------------------------------------------+
|  Dashboard: prod-overview                                         |
|  +----------------------------------------------------------------+
|  |  [Add widget]     Layout: ( ) Grid  (•) Mosaic                 |
|  +----------------------------------------------------------------+
|  |                                                                 |
|  |   +------------------+  +------------------+  +-------------+ |
|  |   | Line chart       |  | Scorecard        |  | Heatmap     | |
|  |   | (CPU per VM)     |  | (Error rate)     |  | (optional)  | |
|  |   +------------------+  +------------------+  +-------------+ |
|  |                                                                 |
|  |   +------------------------------+  +-------------------------+ |
|  |   | Stacked area / Bar           |  | Logs panel (if added)   | |
|  |   +------------------------------+  +-------------------------+ |
|  +----------------------------------------------------------------+
+------------------------------------------------------------------+
```

---

## Add Widget

**Add widget** adalah fitur inti untuk mengisi dashboard dengan visualisasi data **metrics**, **logs**, atau komponen lain yang didukung.

### Alur di Console

1. Pastikan Anda dalam mode **edit** dashboard (buka dashboard lalu **Edit**, atau lanjut setelah **Create dashboard**).
2. Klik tombol **Add widget** (biasanya di toolbar area konten dashboard).
3. Akan muncul **widget picker panel** (drawer/modal) di sisi kanan atau tengah layar.
4. Di panel tersebut, pilih **kategori** (misalnya **Line**, **Stacked bar**, **Scorecard**, **Gauge**, **Logs**, dan lain-lain sesuai rilis Console).
5. Konfigurasi **resource type**, **metric**, **filter**, **aggregation**, lalu **Apply** / **Save** ke dashboard.

### ASCII — widget picker panel (konsep)

```
                         [ Dashboard editor — latar belakang redup ]
+------------------------------------------------------------------+
|  Add widget                                              [ X ]   |
+------------------------------------------------------------------+
|  Search widgets...                                    [🔍]       |
+------------------------------------------------------------------+
|  Categories                                                      |
|  ---------------------------------------------------------------- |
|  > Visualization                                                 |
|      - Line chart                                                |
|      - Stacked area / bar                                        |
|      - Heatmap                                                   |
|      - Scorecard                                                 |
|      - Gauge                                                     |
|  > Observability                                                 |
|      - Logs (log-based panel)                                    |
|      - (lainnya sesuai produk)                                   |
|  > (Other / Advanced)                                            |
|      - Custom queries (MQL / PromQL jika tersedia di UI)         |
+------------------------------------------------------------------+
|  [ Cancel ]                              [ Add to dashboard ]    |
+------------------------------------------------------------------+
```

**Tips:** gunakan **Search** di picker untuk menemukan chart type cepat; untuk metrik spesifik, setelah memilih jenis widget, gunakan **Metric** browser atau **query editor** sesuai yang ditampilkan di wizard.

---

## Dashboard Settings

Pengaturan berikut biasanya tersedia di toolbar dashboard (mode view atau edit):

| Fitur | Deskripsi singkat |
|-------|-------------------|
| **Time range selector** | Memilih jendela waktu (mis. **1h**, **6h**, **24h**, **custom range**). Mempengaruhi semua widget yang mengikuti **global time** (kecuali override per widget jika didukung). |
| **Auto-refresh** | Interval penyegaran otomatis (mis. **off**, **30s**, **1m**) agar data **near real-time** di wallboard. |
| **Variables / filters** | **Dashboard variables** (jika dikonfigurasi) memungkinkan filter dinamis, misalnya **cluster**, **namespace**, **region**, tanpa mengedit setiap widget. |
| **Sharing** | Dashboard disimpan per **project**; akses mengikuti **IAM** di GCP. Untuk distribusi lintas project atau sebagai kode, pertimbangkan **export JSON** + **version control** atau **Terraform**/**API**. |

**Path umum untuk opsi terkait dashboard:** dari dashboard yang dibuka, periksa ikon **⋮** / **Settings** / **Edit** di toolbar untuk **variables**, **JSON**, atau preferensi tampilan.

---

## Dashboard JSON

Dashboard dapat direpresentasikan sebagai **JSON** untuk **export**, **import**, **backup**, atau **GitOps**.

### Mengapa JSON

- **Reproducibility:** environment **staging** dan **production** bisa memakai definisi yang sama.
- **Review:** perubahan bisa di-**peer review** seperti kode aplikasi.
- **Automation:** integrasi dengan **Monitoring API** atau **Infrastructure as Code**.

### Cara di Console (alur umum)

1. Buka **Monitoring** → **Dashboards**.
2. Pilih **custom dashboard** yang ingin Anda kelola.
3. Masuk mode yang memungkinkan konfigurasi lanjutan: biasanya **Edit** dashboard.
4. Buka menu **Settings** (ikon **gear**) atau menu **⋮** pada toolbar dashboard — cari opsi seperti **JSON editor**, **View JSON**, atau **Edit JSON** (penamaan dapat bervariasi).
5. Di **JSON editor**, Anda dapat **menyalin** definisi, **menempel** definisi dari file, lalu **Save** / **Apply** sesuai prompt.

> **Peringatan:** validasi JSON gagal jika field tidak sesuai **schema** API Monitoring. Setelah import, periksa widget di UI apakah **metric** dan **resource** masih valid untuk project Anda.

### Alternatif di luar Console penuh

Untuk pipeline otomatis, tim DevOps sering memakai **Cloud Monitoring Dashboard API** atau **Terraform** resource `google_monitoring_dashboard` alih-alih hanya copy-paste manual.

---

## Skenario Dashboard

Berikut tiga skenario umum beserta **widget** yang direkomendasikan (nama pasti di picker bisa sedikit berbeda).

### 1. Production overview — CPU, memory, disk, network di semua VM

**Tujuan:** melihat **saturation** dan **utilization** agregat/instance untuk **Compute Engine** atau workload serupa.

**Console path metrics:** **Monitoring** → **Metrics explorer** (untuk eksplorasi) lalu pin/add ke dashboard, atau langsung dari **Add widget** → pilih chart → set **resource** ke **VM Instance** / **GCE**.

**Widget yang direkomendasikan:**

| Widget | Isi / metrik contoh |
|--------|---------------------|
| **Line chart** | **CPU utilization** per **instance** atau agregat per **zone** |
| **Line chart** | **Memory** (jika agent/metrik tersedia) atau **guest memory** indicators |
| **Line atau stacked chart** | **Disk read/write bytes** atau **IOPS** |
| **Line chart** | **Network bytes sent/received** |
| **Scorecard** | **Uptime** atau **error budget** sederhana (jika Anda punya **SLO**) |
| **Logs panel** (opsional) | Filter log **severity** ERROR untuk korelasi cepat |

### 2. GKE cluster health dashboard

**Tujuan:** kesehatan **cluster**, **node**, dan sinyal workload (traffic/errors/latency jika ada).

**Widget yang direkomendasikan:**

| Widget | Isi / metrik contoh |
|--------|---------------------|
| **Line chart** | **Node** CPU / memory |
| **Line chart** | **Pod** restart count / **unschedulable** events (via metrik yang tersedia) |
| **Heatmap** atau **line** | **Latency** request (jika instrumentasi HTTP/gRPC) |
| **Scorecard** | **Error rate** atau ratio **5xx** |
| **Logs** | Filter **namespace** / **deployment** untuk incident |

Tambahkan **dashboard variables** untuk **cluster name** dan **namespace** bila UI Anda mendukung, agar satu dashboard dipakai untuk banyak environment.

### 3. Cloud SQL performance dashboard

**Tujuan:** kapasitas koneksi, beban CPU, storage, dan replikasi.

**Widget yang direkomendasikan:**

| Widget | Isi / metrik contoh |
|--------|---------------------|
| **Line chart** | **CPU utilization** |
| **Line chart** | **Memory** / buffer cache indicators (sesuai metrik yang diekspor) |
| **Line chart** | **Disk utilization** / **storage** |
| **Line chart** | **Active connections** / **connection count** |
| **Line chart** | **Replication lag** (untuk **read replica**) |
| **Scorecard** | Ambang koneksi mendekati **max_connections** (visual threshold) |

---

## Ringkasan

| Topik | Path / aksi utama |
|-------|-------------------|
| Buka dashboards | **Monitoring** → **Dashboards** |
| Buat custom | **+ Create dashboard** → nama → **Grid** / **Mosaic** → **Add widget** |
| Widget | **Add widget** → **widget picker** → kategori → konfigurasi metrik |
| Settings | **Time range**, **auto-refresh**, **variables**, **IAM** untuk sharing |
| JSON | **Dashboard** → **Settings** / menu edit → **JSON editor** → export/import |

Dengan kombinasi **predefined** dan **custom dashboards**, tim Anda mendapat landasan cepat dari Google serta fleksibilitas penuh untuk **production readiness** dan **incident response**.
