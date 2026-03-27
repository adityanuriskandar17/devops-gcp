# Konsep Google Cloud Monitoring

Dokumen ini merujuk pada **Google Cloud Console** (bukan hanya CLI/API). Untuk membuka layanan: login ke [Google Cloud Console](https://console.cloud.google.com), pilih **project** yang benar, lalu gunakan **search bar** (Ctrl+K / Cmd+K) dengan kata kunci **Monitoring**, atau buka langsung **Monitoring** dari menu produk (**Observability** / **Operations** tergantung tampilan Console Anda).

---

## Apa itu Cloud Monitoring?

**Cloud Monitoring** adalah platform **observability** resmi Google Cloud untuk mengumpulkan **metrics** (angka terukur), memvisualisasikan kesehatan workload, dan memicu **alerting** saat kondisi melanggar threshold atau **SLO** (Service Level Objective).

- **Basic metrics & fitur inti**: banyak metrik bawaan layanan GCP (mis. **Compute Engine**, **Cloud SQL**, **GKE**) tersedia tanpa biaya tambahan dalam batas **free tier** / kuota yang ditetapkan Google untuk penggunaan standar pemantauan.
- **Advanced / premium capabilities**: fitur seperti retensi lebih panjang, **metric export** ke BigQuery, penggunaan di luar free tier, integrasi enterprise, atau kapasitas alerting/notifikasi skala besar mengikuti **pricing** Observability resmi di Console (**Billing** → lihat SKU terkait **Cloud Monitoring**).

| Aspek | Kelebihan | Kekurangan |
|--------|-----------|------------|
| **Integrasi GCP** | Metrik otomatis untuk banyak resource; navigasi terpusat di Console | Kurva belajar filter **labels** dan **metric descriptors** |
| **Model pricing** | Basic monitoring banyak kasus cukup ekonomis / gratis dalam batas | Biaya bisa naik untuk volume time series tinggi & fitur advanced |
| **Ekosistem** | Satu tempat dengan **dashboards**, **alerts**, **uptime checks** | Bukan pengganti **logs** penuh (lihat bagian vs **Cloud Logging**) |

---

## Fitur-Fitur di Console

Landasan navigasi: **Console** → **Monitoring** (atau URL: `https://console.cloud.google.com/monitoring` setelah memilih project). Di **navigation pane** (sidebar) Monitoring, item berikut umumnya tersedia—nama persis bisa sedikit berbeda antar rilis UI, tetapi lokasinya konsisten di area **Monitoring**.

### Overview

- **Console path:** **Monitoring** → **Overview** (landing page Monitoring).
- **Apa yang ditampilkan:** ringkasan kesehatan lingkungan: widget agregat, pintasan ke **incidents**, **uptime**, dan insight singkat agar engineer cepat melihat “apakah ada yang merah” tanpa membuka setiap layanan.

| Kelebihan | Kekurangan |
|-----------|------------|
| Cepat untuk **health check** visual | Detail debugging tetap perlu drill-down ke **Metrics Explorer** / **Logs** |

### Dashboards

- **Console path:** **Monitoring** → **Dashboards** → pilih **Predefined** (bawaan GCP) atau **Custom** (buatan tim).
- **Apa yang ditampilkan:** kumpulan **charts** (grafik time series) untuk VM, database, load balancer, GKE, dll. **Predefined** menghemat waktu setup; **custom** untuk KPI bisnis atau layout tim SRE.

| Kelebihan | Kekurangan |
|-----------|------------|
| Storytelling operasional yang jelas | Dashboard buruk rancangan bisa mengaburkan sinyal penting |

### Alerting

- **Console path:** **Monitoring** → **Alerting** → subtabs umum: **Policies** (definisi aturan), **Incidents** (kejadian aktif/riwayat), **Notification channels** (Email, PagerDuty, Slack, Webhook, dll).
- **Apa yang ditampilkan:** **alerting policy** menjembatani kondisi metrik (mis. CPU > 80% 5 menit) dengan **notification**; **incident** adalah instance ketika policy “fire” dan melalui lifecycle acknowledge/close.

| Kelebihan | Kekurangan |
|-----------|------------|
| **Proactive** response | **Alert fatigue** jika threshold terlalu sensitif |

### Uptime Checks

- **Console path:** **Monitoring** → **Uptime checks** (kadang dikelompokkan dengan **Synthetic monitoring** di dokumentasi).
- **Apa yang ditampilkan:** probe berkala ke URL/IP/resource untuk **availability** dan latensi; hasilnya metrik & status di Console untuk SLA/uptime reporting.

| Kelebihan | Kekurangan |
|-----------|------------|
| Deteksi **blackhole** DNS atau endpoint down dari luar | Tidak menggantikan pemeriksaan **internal-only** endpoint tanpa konfigurasi jaringan yang tepat |

### Groups

- **Console path:** **Monitoring** → **Groups** (pengelompokan resource).
- **Apa yang ditampilkan:** himpunan resource yang memenuhi **filter** (mis. semua VM dengan label `env=prod`) agar dashboard dan alerting bisa di-scope ke “grup” logis, bukan satu-satu instance.

| Kelebihan | Kekurangan |
|-----------|------------|
| Skala monitoring ke banyak resource | Filter salah → resource terlewat atau kebanyakan noise |

### Metrics Explorer

- **Console path:** **Monitoring** → **Metrics explorer** (nama UI: **Metrics Explorer**).
- **Apa yang ditampilkan:** query **ad-hoc** ke **metric type** + **resource type** + **labels**; Anda membangun chart sementara untuk eksplorasi sebelum memutuskan membuat **dashboard** atau **alerting policy**.

| Kelebihan | Kekurangan |
|-----------|------------|
| Fleksibel untuk RCA (**root cause analysis**) | Chart ad-hoc tidak otomatis tersimpan kecuali Anda simpan ke dashboard |

---

## Kenapa Harus Monitoring?

Tanpa monitoring, tim bereaksi terhadap gejala yang sudah terlihat pengguna. Dengan monitoring, tim bereaksi terhadap **signal** sebelum atau saat degradasi menjadi outage.

### Tanpa monitoring (reaktif)

- Issue sering **terdeteksi terlambat** (setelah ticket / komplain).
- **Manual checking** (login Console acak, `kubectl`, cek DB) tidak skalabel.
- **Blame game** karena tidak ada data objektif bersama.
- **Debugging** sulit: tidak ada baseline CPU, latency, error rate.

### Dengan monitoring (proaktif + terukur)

- **Alert** ke **on-call** saat threshold dilanggar.
- **Dashboard** memberi konteks satu layar untuk banyak service.
- **Auto-detection** lewat metrik bawaan + **synthetic** / **uptime**.
- **MTTR** (Mean Time To Repair) turun karena titik awal investigasi jelas.

#### Diagram alur: TANPA monitoring

```
  [ Users / Traffic ]
         |
         v
  [ Aplikasi / Infra GCP ]
         |
         |  (tidak ada metrik terpusat)
         v
  [ Masalah terjadi ───────────────> tidak terlihat di satu tempat ]
         |
         v
  [ Baru ketahuan via: email user / Twitter / boss / kebetulan cek Console ]
         |
         v
  [ RCA lambat, downtime panjang, biaya reputasi ]
```

#### Diagram alur: DENGAN monitoring

```
  [ Users / Traffic ]
         |
         v
  [ Aplikasi / Infra GCP ]
         |
         |  metrik & checks
         v
  [ Cloud Monitoring: time series + uptime + logs correlation (opsional) ]
         |
         +--> [ Dashboards ] ----> situational awareness harian
         |
         +--> [ Alerting / Incidents ] --> [ Notification channels ] --> [ On-call ]
         |
         v
  [ Investigasi terarah di Metrics Explorer / Logs Explorer ]
         |
         v
  [ Perbaikan lebih cepat, MTTR lebih rendah ]
```

| Mode | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Tanpa monitoring** | Biaya tooling rendah di awal | Outage mahal, RCA lambat |
| **Dengan monitoring** | Transparansi operasional | Perlu investasi desain alert & dashboard |

---

## Skenario: Tanpa vs Dengan Monitoring

### Case 1: VM CPU spike jam 3 pagi

| | **Tanpa monitoring** | **Dengan monitoring** |
|---|----------------------|------------------------|
| **Deteksi** | Tidak ada yang sadar sampai pagi; user mulai komplain aplikasi lambat/timeout | **Alerting policy** pada metrik CPU **Compute Engine** memicu **incident** |
| **Notifikasi** | Tidak ada sinyal ke on-call | **Notification channel** (mis. PagerDuty / Slack) membangunkan **on-call** |
| **Tindakan** | Panik + tebak-tebakan resource mana | Buka **Monitoring** → **Incidents** + **Metrics explorer** untuk melihat VM & korelasi |
| **Outcome** | Komplain menumpuk, reputasi turun | Perbaikan (mis. scale up, kill runaway job) ~**10 menit** setelah alert |

### Case 2: Cloud SQL memory leak

| | **Tanpa monitoring** | **Dengan monitoring** |
|---|----------------------|------------------------|
| **Pola** | Memori naik perlahan; tidak terlihat sampai OOM / restart | Metrik memori **Cloud SQL** naik gradual; **alert** pada trend / threshold |
| **Respons** | Crash database → downtime aplikasi | Tim **scale up** tier / patch query / restart terjadwal **sebelum** crash |
| **Console** | Hanya sadar dari error aplikasi | **Monitoring** → **Metrics explorer** (resource **Cloud SQL**) + **Dashboards** |

### Case 3: GKE pod crash loop

| | **Tanpa monitoring** | **Dengan monitoring** |
|---|----------------------|------------------------|
| **Tanpa** | Developer harus ingat `kubectl get pods`; sering terlambat | **Alert** pada error rate / restart count / metrik Kubernetes di Monitoring |
| **Dengan** | Investigasi manual tersebar | **Dashboard** menunjukkan lonjakan restart; drill-down ke namespace/workload di Console |
| **Console** | **Kubernetes Engine** + CLI | **Monitoring** → **Dashboards** (GKE) / **Metrics explorer** dengan **resource type** Kubernetes |

| Pendekatan | Kelebihan | Kekurangan |
|------------|-----------|------------|
| **Hanya manual** | Tidak perlu konfigurasi alert | Human error & delay |
| **Monitoring terkonfigurasi** | Sinyal konsisten | Butuh tuning policy agar tidak berisik |

---

## Cloud Monitoring vs Cloud Logging

| Dimensi | **Cloud Monitoring** | **Cloud Logging** |
|---------|----------------------|-------------------|
| **Jenis data** | **Metrics**: angka time series (CPU%, latency, request count) | **Logs**: teks/struktur event (stdout, audit, application log) |
| **Pertanyaan tipikal** | “Berapa RPS dan error rate 1 jam terakhir?” | “Event apa yang terjadi tepat sebelum error di baris ini?” |
| **Console path** | **Monitoring** → **Metrics explorer** / **Dashboards** | **Logging** → **Logs Explorer** |
| **Monitoring path** | **Monitoring** → **Metrics explorer** / **Dashboards** | — |

**Keduanya melengkapi**: metrik memberi **trend** dan **SLO**; logs memberi **bukti** peristiwa untuk RCA. Di praktik SRE, alur umum: alert dari **Monitoring** → buka **Logs Explorer** untuk trace ID / pesan error yang sama.

| Kombinasi | Kelebihan | Kekurangan |
|-----------|-----------|------------|
| **Hanya Monitoring** | Ringkas untuk SLA & kapasitas | Kurang detail konteks per request |
| **Hanya Logging** | Kaya konteks | Sulit melihat trend tanpa agregasi |
| **Monitoring + Logging** | Observability penuh | Biaya retensi & injesti perlu dikelola |

---

## Arsitektur Cloud Monitoring

Alur data dari resource GCP (dan sumber eksternal yang dikonfigurasi) menuju penyimpanan time series dan UI Console:

```
 +----------------------+     +----------------------+
 |  GCP Managed Service |     |  Compute Engine VM   |
 |  (GKE, LB, SQL, ...) |     |  + Ops Agent         |
 +----------+-----------+     +----------+-----------+
            |                              |
            |  built-in metrics            |  agent metrics + logs (logs ke Logging)
            v                              v
 +------------------------------------------------------+
 |           Cloud Monitoring ingestion pipeline         |
 |  (metric descriptors, monitored resources, labels)    |
 +--------------------------+---------------------------+
                            |
                            v
 +------------------------------------------------------+
 |  Time series store (per project / metrics scope)     |
 +--------------------------+---------------------------+
                            |
            +---------------+---------------+
            v               v               v
    [ Metrics explorer ] [ Dashboards ] [ Alerting / Incidents ]
            ^               ^               ^
            |               |               |
            +------- Google Cloud Console: Monitoring -------+
```

### Komponen konsep

- **Agents (Ops Agent)**: daemon di VM untuk metrik sistem/aplikasi (dan forwarding log ke **Cloud Logging**). Dikonfigurasi via dokumentasi instalasi; di Console sering dikaitkan dengan VM dan kebijakan agen.
- **Built-in metrics**: layanan GCP mengirim metrik tanpa agen (mis. request count load balancer, metrik control plane GKE)—muncul di **Metrics explorer** setelah resource aktif.
- **Custom metrics**: aplikasi atau pipeline mengirim metrik via **API** / **OpenTelemetry** / **Prometheus (managed)** sesuai kebutuhan bisnis.
- **Metric descriptors**: definisi tipe metrik (nama, jenis, unit); di Console Anda memilih **metric** dari picker yang mencerminkan descriptor ini.
- **Time series**: rangkaian `(timestamp, value)` untuk kombinasi **resource** + **labels** (mis. `zone`, `instance_id`, `namespace`).
- **Labels**: dimensi untuk slice & dice di chart dan alert (filter di **Metrics explorer**).

| Sumber data | Kelebihan | Kekurangan |
|-------------|-----------|------------|
| **Built-in** | Zero-touch untuk banyak layanan GCP | Kurang untuk logika bisnis unik |
| **Ops Agent** | Visibilitas OS & middleware | Perlu deploy & patch agent |
| **Custom metrics** | KPI aplikasi presisi | Perlu engineering untuk instrumentasi & biaya time series |

---

## Referensi cepat di Console

| Kebutuhan | Arah navigasi (Google Cloud Console) |
|-----------|--------------------------------------|
| Landing Monitoring | **Monitoring** → **Overview** |
| Chart ad-hoc | **Monitoring** → **Metrics explorer** |
| Panel tim | **Monitoring** → **Dashboards** |
| Alarm & kejadian | **Monitoring** → **Alerting** → **Policies** / **Incidents** |
| Ketersediaan eksternal | **Monitoring** → **Uptime checks** |
| Scope resource | **Monitoring** → **Groups** |
| Teks peristiwa / audit | **Logging** → **Logs Explorer** |

---

*Dokumen ini mengacu pada pengalaman navigasi **Google Cloud Console** untuk **Cloud Monitoring** dan **Cloud Logging**. Nama menu dapat diperbarui oleh Google; gunakan **search bar** di Console dengan kata kunci **Monitoring** atau **Logs** jika posisi menu berubah.*
