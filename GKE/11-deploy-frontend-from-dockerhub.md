# Deploy Frontend ke GKE dari Docker Hub

Tutorial **end-to-end** men-deploy image frontend yang sudah di-push ke **Docker Hub** ke **Google Kubernetes Engine (GKE)** lewat **GCP Console** — termasuk expose sebagai Load Balancer, rolling update untuk merilis versi baru, dan scaling (manual & autoscaling). Melengkapi [03-workloads.md](03-workloads.md) dan [05-scaling.md](05-scaling.md) dengan skenario konkret.

---

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Alur Skenario (Flow Diagram)](#2-alur-skenario-flow-diagram)
3. [Siapkan Image di Docker Hub](#3-siapkan-image-di-docker-hub)
4. [Deploy ke GKE (Console)](#4-deploy-ke-gke-console)
5. [Verifikasi & Akses Aplikasi](#5-verifikasi--akses-aplikasi)
6. [Update Aplikasi dengan Rolling Update](#6-update-aplikasi-dengan-rolling-update)
7. [Scaling: Manual & Autoscaling](#7-scaling-manual--autoscaling)
8. [Troubleshooting Umum](#8-troubleshooting-umum)
9. [Ringkasan](#9-ringkasan)

---

## 1. Prasyarat

| Item | Keterangan |
|------|------------|
| **GKE Cluster** | Sudah jalan — lihat [02-create-cluster.md](02-create-cluster.md) |
| **Docker Hub account** | Sudah push image frontend (mis. hasil `docker build` + `docker push`) |
| **Dockerfile** | Aplikasi meng-`EXPOSE` port (mis. `EXPOSE 80` untuk Nginx) |
| **Image path** | Format `{username}/{repository}:{tag}` — mis. `tandrysyawaludin/fc-nps-fe:tag7` |

> Tutorial ini memakai contoh deployment **`bosani-nps-fe`** dengan image publik di Docker Hub. Jika image **private**, perlu **imagePullSecret** (dibahas singkat di akhir).

---

## 2. Alur Skenario (Flow Diagram)

```
┌──────────────────────┐     docker push     ┌──────────────────────┐
│  Local: build image  │ ──────────────────► │   Docker Hub         │
│  docker build .      │                     │   {user}/{repo}:tag  │
│  → image:tag7        │                     │   (public registry)  │
└──────────────────────┘                     └──────────┬───────────┘
                                                        │ pull image
                                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                GKE Cluster  (cluster-1, us-central1-a)              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Deployment: bosani-nps-fe                                 │     │
│  │   replicas: 1  (default, bisa di-scale)                   │     │
│  │   labels: app=bosani-nps-fe                               │     │
│  │                                                            │     │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │     │
│  │   │   Pod        │  │   Pod        │  │   Pod        │    │     │
│  │   │ container:80 │  │ container:80 │  │ container:80 │    │     │
│  │   └──────────────┘  └──────────────┘  └──────────────┘    │     │
│  └────────────────────────────┬──────────────────────────────┘     │
│                               │ selector: app=bosani-nps-fe         │
│  ┌────────────────────────────▼──────────────────────────────┐     │
│  │ Service: bosani-nps-fe-service                            │     │
│  │   type: LoadBalancer                                      │     │
│  │   port 80  →  targetPort 80  (TCP)                        │     │
│  └────────────────────────────┬──────────────────────────────┘     │
└───────────────────────────────┼─────────────────────────────────────┘
                                │ External IP (endpoint publik)
                                ▼
                        ┌──────────────┐
                        │   Browser    │
                        │  user akses  │
                        └──────────────┘
```

**Ringkasan alur:**

1. Build image frontend lokal → push ke Docker Hub.
2. Buat **Deployment** di GKE yang menarik image itu → jalankan jadi Pod.
3. Buat **Service LoadBalancer** yang expose Pod ke internet via External IP.
4. Akses lewat endpoint → traffic masuk ke Pod lewat Service.
5. Saat ada versi baru: **Rolling Update** ganti tag image → GKE replace Pod bertahap (zero downtime).
6. Saat traffic naik/turun: **Scale** (manual) atau **Autoscale/HPA** (otomatis).

---

## 3. Siapkan Image di Docker Hub

**Link:** [`hub.docker.com/repository/docker/{username}/{repository}/general`](https://hub.docker.com/)

Di halaman repository, klik tab **General** atau **Tags** → salin perintah push yang ditampilkan Docker Hub:

```bash
docker push {username}/{repository}:{tag}
```

**Contoh konkret:**

```bash
docker build -t tandrysyawaludin/fc-nps-fe:tag7 .
docker push tandrysyawaludin/fc-nps-fe:tag7
```

Yang perlu kamu **catat** untuk langkah selanjutnya:

| Field | Contoh |
|-------|--------|
| **Image path** | `tandrysyawaludin/fc-nps-fe:tag7` |
| **Container port** (dari `EXPOSE` di Dockerfile) | `80` |

> **Tip:** Selalu pakai tag eksplisit (`:tag7`, `:v1.2.3`) — **jangan pakai `:latest`** di production. GKE butuh tag yang berbeda saat rolling update untuk men-trigger deploy ulang.

---

## 4. Deploy ke GKE (Console)

**Link wizard:** [`console.cloud.google.com/kubernetes/workload/deploy`](https://console.cloud.google.com/kubernetes/workload/deploy)

**Console path:** `Kubernetes Engine` → **Workloads** → **DEPLOY**

Wizard terdiri dari **3 step**: Container → Configuration → (optional) Expose.

---

### 4.1 Step 1 — Container

Di bagian **Container**:

| Field | Nilai |
|-------|-------|
| **New container** | Pilih **Existing container image** |
| **Image path** | Ketik path dari Docker Hub, mis. `tandrysyawaludin/fc-nps-fe:tag7` |

```
┌─────────────────────────────────────────────────┐
│  Container                                      │
│                                                 │
│  ○ New container image                          │
│  ● Existing container image                     │
│                                                 │
│  Image path:                                    │
│  ┌───────────────────────────────────────────┐  │
│  │ tandrysyawaludin/fc-nps-fe:tag7           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│                           [ CONTINUE ]          │
└─────────────────────────────────────────────────┘
```

Klik **CONTINUE**.

---

### 4.2 Step 2 — Configuration

| Field | Nilai contoh |
|-------|--------------|
| **Deployment name** | `bosani-nps-fe` |
| **Labels** — key 1 | `app` |
| **Labels** — value 1 | `bosani-nps-fe` |
| **Namespace** | `default` (atau namespace khusus) |
| **Cluster** | `cluster-1` di `us-central1-a` |

> **Kenapa label penting?** Service menemukan Pod lewat label `selector`. Deployment name dan app label sebaiknya **sama** agar mudah di-trace.

Klik **CONTINUE**.

---

### 4.3 Step 3 — Expose (Optional, tapi WAJIB untuk frontend)

☑ **Expose deployment as a new service**

| Field | Nilai |
|-------|-------|
| **Port** | `80` — port yang **diekspos oleh Service** ke luar |
| **Target port** | `80` — port **di dalam container** (sesuai `EXPOSE` di Dockerfile) |
| **Protocol** | `TCP` |
| **Service type** | **Load balancer** |

```
Port           : 80    ← yang diakses user di browser (http://IP:80)
Target port    : 80    ← port container (cek Dockerfile: EXPOSE 80)
Service type   : Load balancer  ← buat GCP Load Balancer + External IP publik
```

> **Catatanmu benar:** port container diambil dari directive `EXPOSE` di Dockerfile. Kalau Nginx → `EXPOSE 80`, kalau Node.js → biasanya `3000`. Target port **harus sama** dengan port yang di-listen aplikasi di dalam container.

Klik **DEPLOY** → tunggu ~1–3 menit sampai **status hijau**.

---

## 5. Verifikasi & Akses Aplikasi

### 5.1 Cek Pod

**Console path:** `Kubernetes Engine` → **Workloads** → klik `bosani-nps-fe` → tab **Managed pods**

```
Managed pods
┌─────────────────────────────────┬──────────┬─────────┐
│ Name                            │ Status   │ Restarts│
├─────────────────────────────────┼──────────┼─────────┤
│ bosani-nps-fe-7c9d8f5b-abc12    │ Running  │ 0       │
└─────────────────────────────────┴──────────┴─────────┘
```

Semua Pod harus **Running**. Kalau ada `CrashLoopBackOff` atau `ImagePullBackOff` → lihat [§8 Troubleshooting](#8-troubleshooting-umum).

### 5.2 Akses Aplikasi

**Console:** di halaman detail deployment, scroll ke bagian **Exposing services** → klik link di kolom **Endpoints**.

```
Exposing services
┌─────────────────────────┬────────────────────┬──────────┐
│ Name                    │ Endpoints          │ Type     │
├─────────────────────────┼────────────────────┼──────────┤
│ bosani-nps-fe-service   │ 34.x.y.z:80  ◄──── │ LoadBal. │
└─────────────────────────┴────────────────────┴──────────┘
```

Klik link `34.x.y.z:80` → browser membuka aplikasi frontend.

> **Butuh waktu ~30–60 detik** setelah deploy untuk Load Balancer mendapat External IP dari GCP. Kalau masih `<pending>`, refresh sebentar lagi.

---

## 6. Update Aplikasi dengan Rolling Update

**Analogi vs VM:** Di VM, kalau ada kodingan baru kamu harus **SSH → `git pull` → restart service**. Di GKE **tidak perlu** — kamu cukup push image versi baru ke Docker Hub lalu ganti tag di Deployment. GKE yang mengurus sisanya.

### 6.1 Step-by-step (Console)

1. Build & push image versi baru:

   ```bash
   docker build -t tandrysyawaludin/fc-nps-fe:tag8 .
   docker push tandrysyawaludin/fc-nps-fe:tag8
   ```

2. **Console:** `Kubernetes Engine` → **Workloads** → klik `bosani-nps-fe` → **ACTIONS** → **Rolling update**.
3. Di field **Container images**, ganti tag:

   ```
   SEBELUM:  tandrysyawaludin/fc-nps-fe:tag7
   SESUDAH:  tandrysyawaludin/fc-nps-fe:tag8
   ```

4. Klik **UPDATE** → GKE mulai rolling update.

### 6.2 Apa yang terjadi di belakang layar?

```
Mulai: 3 Pod tag7

Step 1: Buat 1 Pod tag8 (tunggu Ready), matikan 1 Pod tag7
  [tag7] [tag7] [tag8]

Step 2: Buat 1 Pod tag8, matikan 1 Pod tag7
  [tag7] [tag8] [tag8]

Step 3: Buat 1 Pod tag8, matikan 1 Pod tag7
  [tag8] [tag8] [tag8]

Selesai — ZERO DOWNTIME, traffic tidak pernah putus.
```

### 6.3 Rollback ke versi sebelumnya

Sama persis dengan update, tinggal ganti tag kembali ke versi lama:

```
SEBELUM:  tandrysyawaludin/fc-nps-fe:tag8
SESUDAH:  tandrysyawaludin/fc-nps-fe:tag7
```

Atau lewat CLI (lebih cepat):

```bash
kubectl rollout undo deployment/bosani-nps-fe
```

> Lihat [03-workloads.md § Rolling Update & Rollback](03-workloads.md#rolling-update--rollback) untuk detail.

---

## 7. Scaling: Manual & Autoscaling

**Console path:** `Kubernetes Engine` → **Workloads** → klik deployment → **ACTIONS** → **Scale** / **Autoscale**.

Ada **dua cara** scaling Pod:

```
1. Manual scale       ──► kamu pilih angka tetap (mis. 3 replicas)
2. Autoscale (HPA)    ──► GKE tambah/kurangi otomatis berdasarkan CPU/RAM
```

---

### 7.1 Manual Scale

**ACTIONS → Scale** → isi **Replicas** → klik **SCALE**.

| Replicas | Efek |
|----------|------|
| `0` | Deployment off — tidak ada Pod, hemat resource, tapi aplikasi **tidak bisa diakses** |
| `1` | Minimal — **berisiko downtime** saat Pod restart / rolling update |
| `2`–`3` | Rekomendasi **minimum production** — high availability, Pod jatuh satu tidak putus |
| `5`–`10` | High traffic — load tersebar ke banyak Pod |

```
┌─────────────────────────────────────┐
│  Scale                              │
│                                     │
│  Current replicas: 1                │
│  New replicas:    ┌──────┐          │
│                   │  3   │          │
│                   └──────┘          │
│                                     │
│  [ SCALE ]                          │
└─────────────────────────────────────┘
```

Cocok untuk traffic yang **stabil/predictable** atau saat **testing**.

**Kekurangan manual scale:**

- Harus **diawasi** — traffic malam sepi, siang ramai → kamu harus ganti angkanya manual.
- Kalau lupa scale-up sebelum event (sale, viral) → server overload.
- Kalau lupa scale-down → buang-buang biaya.

→ Solusinya: **Autoscaling**.

---

### 7.2 Autoscaling (HPA — Horizontal Pod Autoscaler)

**ACTIONS → Autoscale** → isi target metric + batas min/max → klik **AUTOSCALE**.

| Field | Contoh | Arti |
|-------|--------|------|
| **Minimum replicas** | `2` | Pod minimum — **selalu** running, untuk HA |
| **Maximum replicas** | `10` | Pod maksimum — batas atas agar biaya tidak meledak |
| **Target CPU utilization** | `70%` | HPA tambah Pod jika rata-rata CPU semua Pod > 70% |
| **Target memory utilization** | `80%` (opsional) | Alternatif/pelengkap metric CPU |

```
Traffic rendah (pagi):
  CPU: 20%    ──►  [Pod 1] [Pod 2]                          (2 Pod)

Traffic naik (siang):
  CPU: 75%    ──►  [Pod 1] [Pod 2] [Pod 3] [Pod 4]          (4 Pod)
                   HPA menambah Pod karena CPU > 70%

Traffic puncak (jam kantor):
  CPU: 72%    ──►  [Pod 1] ... [Pod 8]                      (8 Pod)

Traffic turun (malam):
  CPU: 15%    ──►  [Pod 1] [Pod 2]                          (2 Pod, min)
                   HPA kurangi Pod, tapi tidak di bawah minimum
```

**Cara kerja HPA (setiap 15 detik):**

```
┌────────────────────────────────────────────────┐
│ 1. Metrics Server kumpulkan CPU/RAM semua Pod  │
│ 2. HPA hitung rata-rata → bandingkan ke target │
│ 3. Jika > target → tambah Pod (scale out)      │
│    Jika < target → kurangi Pod (scale in)      │
│ 4. Selalu dalam rentang [min, max]             │
└────────────────────────────────────────────────┘
```

**Prasyarat HPA bisa bekerja:**

- Container punya **resource `requests`** (mis. `cpu: "250m"`). Tanpa ini HPA **tidak bisa** menghitung persentase CPU — akan muncul `<unknown>` di metric.
- Aplikasi Nginx/SPA frontend: CPU biasanya rendah, pertimbangkan autoscale berdasarkan **requests-per-second (RPS)** lewat custom metrics untuk hasil lebih presisi.

**Contoh YAML ekuivalen** (jika mau manage lewat kubectl):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bosani-nps-fe-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bosani-nps-fe
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

### 7.3 Manual vs Autoscaling — Kapan pakai mana?

| Kasus | Rekomendasi |
|-------|-------------|
| Dev / staging | **Manual** replicas `1`–`2` (hemat) |
| Production traffic stabil | **Manual** replicas `2`–`3` + alert kalau Pod down |
| Production traffic fluktuatif | **Autoscale** min=2, max=10, CPU 70% |
| Event besar (sale, launching) | Autoscale + **naikkan max** sementara (mis. 20), monitor biaya |
| Aplikasi batch/worker | Autoscale berdasarkan **queue length** (custom metric), bukan CPU |

Detail lanjutan (VPA, Cluster Autoscaler) → [05-scaling.md](05-scaling.md).

---

## 8. Troubleshooting Umum

| Gejala | Kemungkinan penyebab | Cara cek / fix |
|--------|----------------------|----------------|
| `ImagePullBackOff` | Image tag salah ketik / image private tanpa secret | Cek image path di Docker Hub; untuk private image buat **imagePullSecret** |
| `CrashLoopBackOff` | Aplikasi error saat startup (port salah, config hilang) | Pod → tab **Logs** di Console; cek `EXPOSE` di Dockerfile sama dengan Target port |
| **External IP `<pending>`** lama | LB belum siap / kuota habis | Tunggu 1–3 menit; cek **IAM & Quota** region |
| Endpoint buka tapi 404 | Path routing salah di Nginx / target port salah | Cek Nginx config dalam image; pastikan Target port sama dengan port Nginx di-listen |
| HPA metric `<unknown>` | Container tidak punya resource `requests` | Edit Deployment → tambahkan `resources.requests.cpu` |

### Lihat log Pod (Console)

`Workloads` → klik Deployment → klik Pod (di Managed pods) → tab **Container logs**.

### Lihat log Pod (CLI)

```bash
kubectl logs -l app=bosani-nps-fe --tail=100 -f
```

---

## 9. Ringkasan

**Checklist deploy frontend dari Docker Hub ke GKE:**

- [ ] Image sudah di-push ke Docker Hub dengan tag eksplisit (bukan `latest`)
- [ ] Cluster GKE sudah running
- [ ] **Workloads → DEPLOY** → Existing container image → paste image path
- [ ] Deployment name + label `app` konsisten (mis. keduanya `bosani-nps-fe`)
- [ ] Expose: port 80 / target port 80 / TCP / **Load balancer**
- [ ] Tunggu Pod **Running** + External IP keluar → akses lewat Endpoint
- [ ] Versi baru → build + push tag baru → **Rolling update** → ganti tag
- [ ] Production: set **min replicas ≥ 2** + **Autoscale** dengan CPU target 70%
- [ ] Monitor CPU/Memory/Logs di Console atau Cloud Monitoring

**Alur mental singkat:**

```
Kode berubah
  → docker build + push  (tag baru)
  → Rolling update di GKE  (ganti tag di Deployment)
  → GKE replace Pod bertahap  (zero downtime)
  → Autoscale handle traffic
```

Untuk pendalaman: [03-workloads.md](03-workloads.md) (konsep Deployment/Service), [05-scaling.md](05-scaling.md) (HPA/VPA/Cluster Autoscaler), [09-commands-cheatsheet.md](09-commands-cheatsheet.md) (kubectl & gcloud commands).
