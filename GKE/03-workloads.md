# Workloads

Panduan deploy aplikasi ke **GKE** — Pod, Deployment, Service, ConfigMap, Secret — berorientasi **GCP Console**.

---

## Console path

`Kubernetes Engine` → **Workloads** → **DEPLOY**

---

## Hierarki Resource Kubernetes

```
Cluster
  └── Namespace (isolasi logis, misal: production, staging)
        └── Deployment (definisi: "jalankan 3 Pod app-A")
              └── ReplicaSet (menjaga jumlah Pod)
                    └── Pod (1+ container yang jalan bersama)
                          └── Container (Docker image: app + dependency)
```

---

## Pod

**Pod** = unit terkecil di Kubernetes. Berisi 1 atau lebih container yang share network dan storage.

```
Pod "api-pod":
  ┌────────────────────────────────────┐
  │  Container 1: api-server           │
  │    Image: gcr.io/my-project/api:v1 │
  │    Port: 8080                      │
  │    RAM: 256MB, CPU: 0.25           │
  │                                    │
  │  Container 2: cloud-sql-proxy      │
  │    Image: gcr.io/cloud-sql-.../v2  │
  │    (sidecar untuk koneksi DB)      │
  │                                    │
  │  Shared: network (localhost),      │
  │          storage (volumes)         │
  └────────────────────────────────────┘
```

---

## Deployment

**Deployment** = definisi "saya mau N replicas Pod berjalan". Kubernetes **menjamin** jumlah Pod selalu sesuai.

**Console:** `Kubernetes Engine` → **Workloads** → **DEPLOY** → isi form

### Deploy via Console

| Step | Field | Deskripsi |
|------|-------|-----------|
| 1 | **Container image** | Path Docker image (contoh: `gcr.io/my-project/api:v1`) |
| 2 | **Application name** | Nama Deployment |
| 3 | **Namespace** | Namespace target (default: `default`) |
| 4 | **Labels** | Key-value untuk identifikasi (contoh: `app=api`) |
| 5 | **Cluster** | Pilih cluster target |

### Deploy via YAML (recommended)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
      - name: api
        image: gcr.io/my-project/api:v1
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

```bash
kubectl apply -f deployment.yaml
```

### Resource requests vs limits

| Setting | Deskripsi |
|---------|-----------|
| **requests** | Minimum resource yang **dijamin** untuk Pod. Scheduler pakai ini untuk memilih node. |
| **limits** | Maximum resource yang **boleh dipakai**. Jika melebihi limit → container di-throttle (CPU) atau di-kill (RAM OOM). |

```
requests: 256Mi RAM, 250m CPU  → "Pod ini butuh minimal segini"
limits:   512Mi RAM, 500m CPU  → "Pod ini tidak boleh pakai lebih dari segini"

Kenapa penting:
  • Tanpa requests: Pod bisa dijadwalkan di node yang sudah penuh → OOM
  • Tanpa limits: Pod bisa "mencuri" resource Pod lain → noisy neighbor
  • SELALU set requests DAN limits di production
```

---

## Service

**Service** = endpoint stabil untuk mengakses Pod. Pod bisa mati/pindah/restart, tapi Service IP tetap.

**Console:** `Kubernetes Engine` → **Services & Ingress** → **EXPOSE**

### Tipe Service

| Tipe | Deskripsi | Kapan pakai |
|------|-----------|-------------|
| **ClusterIP** | Internal only — hanya bisa diakses dalam cluster | Komunikasi antar service (default) |
| **NodePort** | Expose di port tertentu di setiap node | Testing, jarang dipakai di production |
| **LoadBalancer** | Buat GCP Load Balancer (public IP) | Expose ke internet |

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: LoadBalancer
  selector:
    app: api-server
  ports:
  - port: 80
    targetPort: 8080
```

---

## ConfigMap & Secret

### ConfigMap

Menyimpan konfigurasi non-sensitif (environment variables, config files).

**Console:** `Kubernetes Engine` → **Config** → **ConfigMaps**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_HOST: "10.0.1.100"
  APP_ENV: "production"
  LOG_LEVEL: "info"
```

### Secret

Menyimpan data sensitif (password, API key) — di-encode base64 dan bisa di-encrypt.

**Console:** `Kubernetes Engine` → **Config** → **Secrets**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  DB_PASSWORD: cGFzc3dvcmQxMjM=
  API_KEY: YWJjZGVmMTIzNDU2
```

---

## Rolling Update & Rollback

### Rolling update

Saat update image (misal v1 → v2), Kubernetes mengganti Pod secara bertahap:

```
Mulai: 3 Pod v1

Step 1: Buat 1 Pod v2, matikan 1 Pod v1
  [v1] [v1] [v2]

Step 2: Buat 1 Pod v2, matikan 1 Pod v1
  [v1] [v2] [v2]

Step 3: Buat 1 Pod v2, matikan 1 Pod v1
  [v2] [v2] [v2]

Selesai: 3 Pod v2 — ZERO DOWNTIME
```

### Rollback

Jika v2 bermasalah:

**Console:** `Kubernetes Engine` → **Workloads** → klik Deployment → **ROLLBACK**

```bash
# CLI rollback
kubectl rollout undo deployment/api-server
```

---

## Skenario: Deploy Web App

```
3 services: frontend, backend-api, worker

Namespace: production

Deployment:
  frontend:    2 replicas, 128Mi/256Mi RAM, image: frontend:v1
  backend-api: 3 replicas, 256Mi/512Mi RAM, image: api:v1
  worker:      1 replica,  512Mi/1Gi RAM,   image: worker:v1

Service:
  frontend    → LoadBalancer (public)
  backend-api → ClusterIP (internal, diakses frontend via Service name)
  worker      → tidak perlu Service (tidak menerima traffic)

ConfigMap:
  app-config: API_URL, DB_HOST, REDIS_HOST

Secret:
  db-creds: DB_PASSWORD
  api-keys: THIRD_PARTY_API_KEY
```

---

## Console: Monitoring Workloads

**Console:** `Kubernetes Engine` → **Workloads**

| Info | Deskripsi |
|------|-----------|
| **Status** | OK / Warning / Error |
| **Pods** | Jumlah Pod running vs desired |
| **CPU / Memory** | Resource usage real-time |
| **Logs** | Klik Pod → **Container logs** |
| **Events** | Error events (image pull failed, OOM killed, dll) |
