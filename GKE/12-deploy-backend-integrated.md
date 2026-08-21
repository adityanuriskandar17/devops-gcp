# Deploy Backend ke GKE + Integrasi Frontend ↔ Database

Tutorial **end-to-end** men-deploy backend Node.js ke **GKE**, lalu menyambungkannya dengan **frontend** (yang sudah dideploy di [11-deploy-frontend-from-dockerhub.md](11-deploy-frontend-from-dockerhub.md)) dan **database**. Dimulai dari **membaca Dockerfile backend baris-per-baris**, build + push ke Docker Hub, deploy di Console, sampai strategi koneksi ke database (Cloud SQL, VM MariaDB, atau in-cluster).

---

## Daftar Isi

1. [Arsitektur Target (Flow Diagram)](#1-arsitektur-target-flow-diagram)
2. [Memahami Dockerfile Backend Baris-per-Baris](#2-memahami-dockerfile-backend-baris-per-baris)
3. [Build & Push Image Backend](#3-build--push-image-backend)
4. [Deploy Backend ke GKE (Console)](#4-deploy-backend-ke-gke-console)
5. [Integrasi Backend ↔ Database](#5-integrasi-backend--database)
6. [Integrasi Frontend ↔ Backend](#6-integrasi-frontend--backend)
7. [Environment Variables & Secret](#7-environment-variables--secret)
8. [Verifikasi & Testing End-to-End](#8-verifikasi--testing-end-to-end)
9. [Troubleshooting](#9-troubleshooting)
10. [Ringkasan](#10-ringkasan)

---

## 1. Arsitektur Target (Flow Diagram)

```
                            ┌──────────────────┐
                            │   User Browser   │
                            └─────────┬────────┘
                                      │  HTTPS / HTTP :80
                                      ▼
        ┌─────────────────────────────────────────────────────────┐
        │  GKE Cluster  (cluster-1, us-central1-a)               │
        │                                                         │
        │  ┌────────────────────────────────────────┐             │
        │  │ Service: bosani-nps-fe-service          │ (LB, public)│
        │  │ type: LoadBalancer    port 80 → 80      │             │
        │  └──────────────────┬─────────────────────┘             │
        │                     │                                   │
        │         Deployment: bosani-nps-fe                       │
        │         [Pod FE] [Pod FE] ...  (Nginx + SPA)            │
        │                     │ fetch('/api/...')                 │
        │                     ▼                                   │
        │  ┌────────────────────────────────────────┐             │
        │  │ Service: bosani-nps-be-service          │ (ClusterIP  │
        │  │ type: ClusterIP       port 3000 → 3000  │  internal)  │
        │  └──────────────────┬─────────────────────┘             │
        │                     │                                   │
        │         Deployment: bosani-nps-be                       │
        │         [Pod BE] [Pod BE] ...  (Node.js :3000)          │
        │                     │                                   │
        │                     │ koneksi DB                        │
        │                     ▼                                   │
        └─────────────────────┼───────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
     ┌───────────┐     ┌───────────┐      ┌───────────────┐
     │ Cloud SQL │     │ VM MariaDB│      │ StatefulSet   │
     │ (managed) │     │ (Compute  │      │ MariaDB di    │
     │ +proxy SC │     │  Engine)  │      │ cluster       │
     └───────────┘     └───────────┘      └───────────────┘
     REKOMENDASI        Tutorial-GCE       Untuk lab / dev
```

**Prinsip utama:**

- **Frontend Service** → `LoadBalancer` (punya External IP publik, diakses user).
- **Backend Service** → `ClusterIP` (internal only, tidak perlu External IP — dipanggil frontend **dari dalam cluster**).
- **Database** → **di luar** cluster (rekomendasi: **Cloud SQL** managed). Data **tidak** boleh berada di dalam Pod biasa karena Pod bersifat *ephemeral* (hilang saat restart).

> Kalau database ditaruh di Pod biasa (bukan StatefulSet + Persistent Volume), data akan **hilang** saat Pod restart atau rolling update. Selalu gunakan **Cloud SQL** untuk production.

---

## 2. Memahami Dockerfile Backend Baris-per-Baris

Dockerfile yang kamu pakai:

```dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
```

Mari bedah satu per satu:

### `FROM node:18-alpine`

| Bagian | Arti |
|--------|------|
| `FROM` | Image **base** yang jadi fondasi image kamu |
| `node:18` | Node.js versi 18 LTS sudah terinstall |
| `-alpine` | Varian **Alpine Linux** — image sangat kecil (~50 MB vs ~900 MB `node:18` biasa) |

> **Kenapa alpine?** Pull cepat, hemat storage registry, cold-start cepat. Trade-off: beberapa native module (`bcrypt`, `sharp`) butuh compile tambahan karena Alpine pakai `musl` bukan `glibc`. Kalau ada error aneh saat build, ganti ke `node:18-slim`.

### `WORKDIR /usr/src/app`

| Bagian | Arti |
|--------|------|
| `WORKDIR` | Set **direktori kerja** di dalam container — semua perintah setelah ini jalan dari sini |
| `/usr/src/app` | Konvensi Node.js official (boleh diganti `/app` saja) |

> Jika folder belum ada, Docker akan **otomatis membuatnya**. Semua `COPY`, `RUN`, dan `CMD` berikutnya jalan relatif ke sini.

### `COPY package*.json ./`

| Bagian | Arti |
|--------|------|
| `COPY` | Salin file **dari host** ke dalam image |
| `package*.json` | Wildcard — ambil `package.json` dan `package-lock.json` |
| `./` | Ke `WORKDIR` yaitu `/usr/src/app/` |

> **Kenapa copy `package.json` duluan, bukan langsung semua?** Ini **trik cache Docker**: selama `package.json` tidak berubah, layer `npm install` tidak akan diulang saat rebuild — build jauh lebih cepat. Kalau `COPY . .` diletakkan sebelum `npm install`, setiap perubahan kode sekecil apapun akan memaksa install ulang.

### `RUN npm install --production`

| Bagian | Arti |
|--------|------|
| `RUN` | Jalankan perintah shell **saat build** — hasilnya jadi bagian image |
| `npm install --production` | Install dependencies, **skip** `devDependencies` (jest, eslint, nodemon, dll) |

> Di Node.js modern lebih baik pakai `npm ci --omit=dev` — install deterministik dari `package-lock.json`, lebih cepat dan aman untuk production.

### `COPY . .`

| Bagian | Arti |
|--------|------|
| `COPY . .` | Salin semua file host ke `WORKDIR` (kode aplikasi) |

> **Penting:** buat file `.dockerignore` berisi `node_modules`, `.git`, `.env` agar tidak ikut ter-copy. `node_modules` host bisa berisi binary yang tidak kompatibel dengan Alpine — dan `.env` **jangan pernah masuk image**.

```
# .dockerignore
node_modules
.git
.env
*.log
Dockerfile
.dockerignore
```

### `EXPOSE 3000`

| Bagian | Arti |
|--------|------|
| `EXPOSE` | **Dokumentasi** port yang di-listen aplikasi — **tidak** otomatis buka port |
| `3000` | Port Node.js app (sesuaikan dengan `app.listen(3000)`) |

> `EXPOSE` **bukan** yang membuat port bisa diakses dari luar. Yang benar-benar mengekspos port adalah **Service Kubernetes** (`targetPort` di Service harus **sama** dengan `EXPOSE` — di GKE nanti ini jadi `3000`).

### `CMD ["node", "app.js"]`

| Bagian | Arti |
|--------|------|
| `CMD` | Perintah default yang dijalankan saat container **start** |
| `["node", "app.js"]` | Format **exec** (array) — lebih baik dari `CMD node app.js` karena signal (SIGTERM) diteruskan dengan benar ke proses Node |

> Di production, gunakan `CMD ["node", "app.js"]` (exec form), **jangan** `CMD node app.js` (shell form) — yang kedua membungkus Node dalam shell, dan saat Kubernetes kirim SIGTERM untuk graceful shutdown, shell tidak meneruskannya → Pod force-kill → request user bisa hilang.

### Catatan: case-sensitivity

Docker tidak case-sensitive untuk directive (`copy` ≡ `COPY`), tapi **konvensi** selalu **UPPERCASE** (`FROM`, `COPY`, `RUN`, `CMD`). Biar gampang scanning mata dan konsisten dengan contoh di [Docker Hub](https://hub.docker.com).

---

## 3. Build & Push Image Backend

### 3.1 Build image

```bash
docker build --tag funcodexai/bosani-nps-be:tag1 --platform linux/amd64 .
```

| Flag | Arti |
|------|------|
| `--tag funcodexai/bosani-nps-be:tag1` | Nama + tag image sesuai akun Docker Hub dan repository |
| `--platform linux/amd64` | **Paksa** build untuk arsitektur **x86_64** — wajib kalau laptop kamu **Mac M1/M2/M3** (ARM), karena GKE default pakai node **amd64**. Tanpa flag ini, image ARM tidak bisa jalan di node amd64 → `exec format error` |
| `.` | Build context (folder berisi Dockerfile) |

> **Urutan flag:** letakkan `.` paling akhir — itu build context, bukan nama image. Format di catatanmu (`--tag ...:tag{nomor}. --platform ...`) titiknya **nempel ke tag** itu sekadar salah tulis — yang benar ada spasi sebelum `.`.

### 3.2 Push ke Docker Hub

```bash
docker login                                          # sekali saja, atau saat token expire
docker push funcodexai/bosani-nps-be:tag1
```

### 3.3 Copy image path dari Docker Hub

**Link:** `hub.docker.com/r/funcodexai/bosani-nps-be` → tab **Tags** → klik tombol salin di perintah `docker pull`.

```
docker pull funcodexai/bosani-nps-be:tag1
          │
          └─ yang di-copy cukup bagian SETELAH "docker pull":
             funcodexai/bosani-nps-be:tag1
```

Paste ini nanti di wizard GKE.

---

## 4. Deploy Backend ke GKE (Console)

**Console path:** `Kubernetes Engine` → **Workloads** → **DEPLOY**

Alurnya mirip dengan deploy frontend di [11-deploy-frontend-from-dockerhub.md](11-deploy-frontend-from-dockerhub.md), tapi dengan **perbedaan kunci** di Expose.

### 4.1 Step 1 — Container

| Field | Nilai |
|-------|-------|
| **New container** | Pilih **Existing container image** |
| **Image path** | Paste hasil copy dari Docker Hub, mis. `funcodexai/bosani-nps-be:tag1` |

Klik **CONTINUE**.

### 4.2 Step 2 — Configuration

| Field | Nilai contoh |
|-------|--------------|
| **Deployment name** | `bosani-nps-be` |
| **Labels** — key/value | `app` / `bosani-nps-be` |
| **Namespace** | `default` |
| **Cluster** | Cluster yang sama dengan frontend (`cluster-1`, `us-central1-a`) |

> **Harus di cluster yang sama dengan frontend** — agar Frontend Pod bisa memanggil Backend Service via DNS internal (`bosani-nps-be-service.default.svc.cluster.local`).

Klik **CONTINUE**.

### 4.3 Step 3 — Expose (opsi berbeda vs frontend)

Di sini ada **dua skenario**, pilih salah satu:

#### Skenario A (rekomendasi) — Backend internal only (ClusterIP)

**Kosongkan** checkbox expose. Nanti kita buat Service `ClusterIP` secara terpisah — backend tidak perlu External IP karena cuma diakses frontend dari dalam cluster.

```
Expose (optional):  [ ]  unchecked
                    → DEPLOY tanpa Service, kita tambah manual setelah itu
```

#### Skenario B — Expose backend publik (untuk testing / mobile app eksternal)

☑ **Expose deployment as a new service**

| Field | Nilai |
|-------|-------|
| **Port** | `3000` |
| **Target port** | `3000` ← **sama dengan `EXPOSE 3000`** di Dockerfile |
| **Protocol** | `TCP` |
| **Service type** | `Load balancer` (dapat External IP) atau `Cluster IP` |

> **Kenapa target port 3000?** Karena `EXPOSE 3000` di Dockerfile artinya aplikasi Node.js listen di port 3000 dalam container. Kalau beda, traffic masuk tapi tidak ketemu listener → connection refused.

Klik **DEPLOY**.

### 4.4 Buat Service ClusterIP setelah deploy (Skenario A)

Setelah deploy tanpa Service, buat file `be-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: bosani-nps-be-service
spec:
  type: ClusterIP
  selector:
    app: bosani-nps-be
  ports:
    - port: 3000
      targetPort: 3000
      protocol: TCP
```

```bash
kubectl apply -f be-service.yaml
```

Atau via **Console**: `Services & Ingress` → **CREATE SERVICE** → pilih Deployment `bosani-nps-be` → type `Cluster IP` → port `3000` → **CREATE**.

---

## 5. Integrasi Backend ↔ Database

Ada 3 opsi — pilih sesuai kebutuhan:

### 5.1 Opsi A — Cloud SQL + Cloud SQL Auth Proxy (REKOMENDASI production)

**Arsitektur:**

```
[Pod BE]  ──► [Sidecar: Cloud SQL Auth Proxy]  ──► Cloud SQL (managed)
   localhost:5432 / 3306                              (private IP)
```

**Keunggulan:**

- Backup otomatis, HA, patch dikelola Google.
- Koneksi via **localhost** → aplikasi tidak perlu tahu IP Cloud SQL.
- Kredensial pakai **Workload Identity** — tanpa menyimpan password di Secret.

**Deployment snippet:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bosani-nps-be
spec:
  replicas: 2
  selector:
    matchLabels:
      app: bosani-nps-be
  template:
    metadata:
      labels:
        app: bosani-nps-be
    spec:
      serviceAccountName: bosani-nps-be-sa  # Workload Identity
      containers:
        - name: app
          image: funcodexai/bosani-nps-be:tag1
          ports:
            - containerPort: 3000
          env:
            - name: DB_HOST
              value: "127.0.0.1"
            - name: DB_PORT
              value: "3306"
            - name: DB_NAME
              valueFrom: { secretKeyRef: { name: db-creds, key: DB_NAME } }
            - name: DB_USER
              valueFrom: { secretKeyRef: { name: db-creds, key: DB_USER } }
            - name: DB_PASSWORD
              valueFrom: { secretKeyRef: { name: db-creds, key: DB_PASSWORD } }
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.14.0  # pakai tag versi eksplisit, jangan :latest
          args:
            - "--private-ip"
            - "fc-nps:us-central1:bosani-nps-db"  # instance connection name
          securityContext:
            runAsNonRoot: true
```

> Selengkapnya: dokumentasi Google [Cloud SQL + GKE](https://cloud.google.com/sql/docs/mysql/connect-kubernetes-engine).

### 5.2 Opsi B — VM MariaDB (existing di Tutorial-GCE)

Jika database sudah ada di VM `bosani-nps-instance-1` (dari [Tutorial-GCE/01](../Tutorial-GCE/01-create-vm-nginx-mariadb.md)), backend di GKE bisa konek via **Internal IP VM** (pakai VPC peering otomatis di region yang sama).

```yaml
env:
  - name: DB_HOST
    value: "10.x.x.x"          # internal IP VM, BUKAN external IP
  - name: DB_PORT
    value: "3306"
```

**Syarat:**

- VM dan GKE **di region/VPC yang sama** agar bisa pakai internal IP.
- Firewall VPC mengizinkan traffic dari CIDR Pod GKE ke port 3306 VM.

> **Hindari** pakai External IP VM — traffic keluar-masuk internet → lambat + kena biaya egress.

### 5.3 Opsi C — StatefulSet + Persistent Volume di dalam cluster (dev/lab only)

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mariadb
spec:
  serviceName: mariadb
  replicas: 1
  selector:
    matchLabels:
      app: mariadb
  template:
    metadata:
      labels:
        app: mariadb
    spec:
      containers:
        - name: mariadb
          image: mariadb:11
          ports:
            - containerPort: 3306
          volumeMounts:
            - name: data
              mountPath: /var/lib/mysql
          env:
            - name: MARIADB_ROOT_PASSWORD
              valueFrom: { secretKeyRef: { name: db-creds, key: DB_PASSWORD } }
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

> **Hanya untuk belajar/dev** — backup, HA, dan replikasi harus kamu urus sendiri. Untuk production selalu pakai Cloud SQL.

---

## 6. Integrasi Frontend ↔ Backend

Frontend (Nginx + SPA) perlu tahu ke mana harus memanggil API backend.

### 6.1 Skema 1 — Frontend panggil Backend via ClusterIP (RECOMMENDED)

Nginx di Pod frontend bertindak sebagai **reverse proxy**, meneruskan `/api/*` ke backend Service internal:

```nginx
# default.conf di image frontend
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # proxy /api ke backend Service (DNS internal GKE)
    location /api/ {
        proxy_pass http://bosani-nps-be-service.default.svc.cluster.local:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**DNS format dalam cluster:**

```
{service-name}.{namespace}.svc.cluster.local
       │              │
       │              └─ mis. "default"
       └─ sesuai metadata.name Service
```

Bisa juga versi singkat `bosani-nps-be-service` (tanpa suffix) kalau di namespace yang sama.

### 6.2 Skema 2 — Frontend panggil Backend via External IP publik

Jika backend memang di-expose sebagai LoadBalancer (Skenario B di §4.3), frontend bisa konek langsung:

```javascript
// frontend env
const API_URL = "http://34.a.b.c:3000";
```

**Kelemahan:**

- Butuh **CORS** di backend.
- Traffic keluar cluster → lambat + kena egress cost.
- External IP backend terlihat user → bisa dieksploitasi.

→ Selalu prefer **Skema 1** (internal proxy) untuk production.

---

## 7. Environment Variables & Secret

Jangan hardcode kredensial di Docker image.

### 7.1 Buat Secret untuk kredensial DB

**Console:** `Kubernetes Engine` → **Config** → **Secrets** → **CREATE**

Atau via CLI:

```bash
kubectl create secret generic db-creds \
  --from-literal=DB_NAME=nps_db \
  --from-literal=DB_USER=nps_user \
  --from-literal=DB_PASSWORD='P@ssword!1'
```

### 7.2 ConfigMap untuk env non-sensitif

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bosani-nps-be-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "3000"
```

### 7.3 Inject ke Deployment

```yaml
spec:
  containers:
    - name: app
      image: funcodexai/bosani-nps-be:tag1
      envFrom:
        - configMapRef: { name: bosani-nps-be-config }
        - secretRef:    { name: db-creds }
```

Di kode Node.js tinggal `process.env.DB_HOST`, `process.env.DB_PASSWORD`, dst. Detail konsep: [03-workloads.md § ConfigMap & Secret](03-workloads.md#configmap--secret).

---

## 8. Verifikasi & Testing End-to-End

### 8.1 Cek Pod backend running

**Console:** `Kubernetes Engine` → **Workloads** → `bosani-nps-be` → tab **Managed pods** — semua **Running**.

### 8.2 Test koneksi dari dalam cluster

Pakai Pod debug sementara untuk curl backend service:

```bash
kubectl run curl-test --rm -it --image=curlimages/curl -- sh
# di dalam pod:
curl http://bosani-nps-be-service.default.svc.cluster.local:3000/health
# → harus dapat response dari backend
```

### 8.3 Test koneksi backend → database

```bash
kubectl logs -l app=bosani-nps-be --tail=50
# cari log "connected to database" atau error koneksi
```

### 8.4 Test dari browser (end-to-end)

1. Buka External IP frontend di browser.
2. Lakukan aksi yang memicu panggilan API (mis. submit form).
3. Cek DevTools → **Network** → harus ada request ke `/api/...` dengan status 200.
4. Cek log backend Pod memastikan request diterima.

---

## 9. Troubleshooting

| Gejala | Penyebab umum | Fix |
|--------|---------------|-----|
| `exec format error` saat Pod start | Image di-build di Mac M1 tanpa `--platform linux/amd64` | Rebuild dengan flag platform → push ulang dengan tag baru |
| `CrashLoopBackOff` backend | Env `DB_HOST`/`DB_PASSWORD` salah / DB belum reachable | Cek logs Pod, cek Secret, test koneksi DB dari Pod debug |
| Frontend fetch `/api/...` → `502 Bad Gateway` | Nginx proxy ke service name salah / backend Pod down | Cek Service name, endpoints (`kubectl get endpoints`), pastikan selector `app=bosani-nps-be` cocok |
| Frontend fetch `/api/...` → CORS error | Frontend ≠ origin backend (kalau pakai Skema 2) | Pindah ke Skema 1 (Nginx proxy), atau set header CORS di backend |
| Koneksi DB timeout dari GKE ke VM | Firewall VPC belum allow CIDR Pod | Tambah firewall rule: source `10.x.x.x/20` (pod CIDR) → port 3306 VM |
| Pod backend Running tapi 0 traffic | Label selector Service tidak match Deployment | `kubectl describe service bosani-nps-be-service` — cek `Endpoints:` — kalau `<none>` berarti selector salah |
| Cloud SQL Proxy container restart terus | Service Account belum punya role `roles/cloudsql.client` | Tambahkan role lewat IAM + setup Workload Identity |

### Debug commands cepat

```bash
kubectl get pods -l app=bosani-nps-be
kubectl describe pod <pod-name>              # lihat Events
kubectl logs <pod-name> -c app               # log aplikasi
kubectl logs <pod-name> -c cloud-sql-proxy   # log sidecar (kalau pakai)
kubectl get endpoints bosani-nps-be-service  # cek Service connected ke Pod
kubectl exec -it <pod-name> -- sh            # masuk ke Pod untuk investigasi
```

Cheat sheet lengkap: [09-commands-cheatsheet.md](09-commands-cheatsheet.md).

---

## 10. Ringkasan

**Checklist deploy backend terintegrasi:**

- [ ] Dockerfile backend → pakai `node:18-alpine`, `EXPOSE 3000`, `CMD` exec-form
- [ ] `.dockerignore` mencakup `node_modules`, `.env`, `.git`
- [ ] Build dengan `--platform linux/amd64` jika host ARM (Mac M-series)
- [ ] Push ke Docker Hub dengan **tag eksplisit** (bukan `latest`)
- [ ] Deploy di GKE → Deployment name `bosani-nps-be`, label `app=bosani-nps-be`
- [ ] Backend Service = **ClusterIP** (internal), port 3000 → targetPort 3000
- [ ] Frontend Nginx proxy `/api/*` → `bosani-nps-be-service:3000`
- [ ] Database: **Cloud SQL** via Auth Proxy (production) atau VM internal IP (transisi)
- [ ] Secret untuk kredensial, ConfigMap untuk env non-sensitif
- [ ] Min **2 replicas** + **HPA** (lihat [11 §7 Scaling](11-deploy-frontend-from-dockerhub.md#7-scaling-manual--autoscaling))
- [ ] Test end-to-end: browser → frontend → backend → DB

**Alur mental singkat:**

```
Dockerfile backend (EXPOSE 3000)
  → docker build --platform linux/amd64 -t user/be:tag1 .
  → docker push user/be:tag1
  → GKE Deploy (image path + target port 3000)
  → Service ClusterIP :3000 (internal)
  → Frontend Nginx proxy /api → ClusterIP
  → Backend ⇄ Cloud SQL (via Auth Proxy sidecar)
```

Lanjutkan ke: [05-scaling.md](05-scaling.md) (HPA/VPA detail), [06-security.md](06-security.md) (Workload Identity, RBAC), [07-monitoring.md](07-monitoring.md) (log & alert).
