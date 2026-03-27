# Networking

Panduan networking di **GKE** — VPC-native, Ingress, Load Balancer, Network Policy — berorientasi **GCP Console**.

---

## Console path

`Kubernetes Engine` → **Services & Ingress**

---

## VPC-Native Cluster

GKE cluster menggunakan **VPC-native** (alias IP) — setiap Pod mendapat IP dari VPC subnet, bukan overlay network.

```
VPC: 10.0.0.0/16
  │
  ├── Node subnet: 10.0.0.0/20 (IP untuk Nodes/VM)
  ├── Pod range:   10.4.0.0/14 (IP untuk Pods)
  └── Service range: 10.8.0.0/20 (IP untuk Services)

  Node 1 (10.0.0.2):
    Pod A: 10.4.0.5
    Pod B: 10.4.0.6

  Node 2 (10.0.0.3):
    Pod C: 10.4.1.2
    Pod D: 10.4.1.3

  Pod A bisa langsung komunikasi ke Pod C via VPC (tanpa NAT/overlay)
```

### Kelebihan VPC-native

| Kelebihan | Kekurangan |
|-----------|------------|
| Pod IP routable di VPC — bisa diakses dari VM non-K8s | Butuh lebih banyak IP range |
| Integrasi native dengan Firewall, Cloud NAT, VPC peering | IP range harus direncanakan |
| **Default dan recommended** | — |

---

## Expose Aplikasi ke Internet

### Opsi 1: Service type LoadBalancer

Buat **Network Load Balancer** (L4) per Service.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-lb
spec:
  type: LoadBalancer
  selector:
    app: api-server
  ports:
  - port: 80
    targetPort: 8080
```

GKE otomatis buat **External TCP Load Balancer** dengan public IP.

| Kelebihan | Kekurangan |
|-----------|------------|
| Simple, 1 command | Setiap Service = 1 Load Balancer = 1 IP = biaya LB |
| L4 (TCP/UDP) | Tidak bisa path-based routing |

### Opsi 2: Ingress (recommended)

**1 Ingress** = **1 HTTPS Load Balancer** (L7) untuk **banyak Service** — routing berdasarkan host/path.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    kubernetes.io/ingress.global-static-ip-name: "my-static-ip"
    networking.gke.io/managed-certificates: "my-cert"
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
  - host: www.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

```
1 Ingress (1 LB) routing banyak Service:

  api.example.com/*      ──► api-service
  www.example.com/*      ──► frontend-service
  www.example.com/admin  ──► admin-service
```

| Kelebihan | Kekurangan |
|-----------|------------|
| 1 LB untuk banyak Service (hemat biaya) | Sedikit lebih kompleks dari LoadBalancer Service |
| Path-based dan host-based routing | Hanya HTTP/HTTPS (L7) |
| SSL termination built-in | — |
| Managed certificate support | — |

### Console: Lihat Ingress/Service

**Console:** `Kubernetes Engine` → **Services & Ingress**

Tampilan menunjukkan semua Service dan Ingress, termasuk **external IP** yang di-assign.

---

## Network Policy

Mengontrol traffic antar Pod — seperti firewall di level Kubernetes.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow-frontend-only
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - port: 8080
```

Artinya: `api-server` hanya menerima traffic dari Pod berlabel `app=frontend` di port 8080.

---

## Internal Load Balancer

Untuk Service yang hanya bisa diakses dari VPC (bukan dari internet):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: internal-api
  annotations:
    networking.gke.io/load-balancer-type: "Internal"
spec:
  type: LoadBalancer
  selector:
    app: api-server
  ports:
  - port: 80
    targetPort: 8080
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Tidak exposed ke internet | Hanya bisa diakses dari VPC |
| Cocok untuk internal microservices | — |

---

## Skenario: Full Networking Setup

```
Cluster: ftlgym-prod

Services:
  web-frontend  → Ingress (public, HTTPS)
  api-backend   → ClusterIP (internal)
  admin-panel   → Ingress (public, HTTPS, path /admin)
  worker        → tidak perlu Service
  database      → headless Service (internal DNS)

Ingress:
  ftlgym.com/*        → web-frontend
  ftlgym.com/api/*    → api-backend
  admin.ftlgym.com/*  → admin-panel

Network Policy:
  api-backend: hanya terima dari web-frontend dan admin-panel
  database: hanya terima dari api-backend
  worker: hanya bisa keluar ke api-backend dan database
```
