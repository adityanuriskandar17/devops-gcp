# Google Kubernetes Engine (GKE)

Dokumentasi lengkap **Google Kubernetes Engine**, berorientasi pada **GCP Console**.

---

## Apa itu GKE?

**GKE** adalah layanan **managed Kubernetes** di Google Cloud. GCP mengelola control plane (API server, etcd, scheduler) — Anda fokus ke **deploy dan manage aplikasi** dalam container.

**Console path:** `Google Cloud Console` → **Kubernetes Engine** → klik **ENABLE** (pertama kali) → tunggu sebentar

---

## Kenapa Kubernetes?

Kubernetes memungkinkan menjalankan **banyak aplikasi dalam 1 server** menggunakan **container**, sehingga resource server digunakan secara **efisien** dan **hemat biaya**.

Detail lengkap: [01-concepts.md](01-concepts.md)

---

## Daftar Dokumentasi

| No | Topik | File | Deskripsi |
|----|-------|------|-----------|
| 01 | Konsep & Kenapa Kubernetes | [01-concepts.md](01-concepts.md) | Container vs VM, kenapa hemat biaya, arsitektur GKE |
| 02 | Create Cluster | [02-create-cluster.md](02-create-cluster.md) | Wizard Console lengkap: Cluster basics, Fleet, Networking, Advanced |
| 03 | Workloads | [03-workloads.md](03-workloads.md) | Deploy aplikasi: Pod, Deployment, Service, ConfigMap, Secret |
| 04 | Networking | [04-networking.md](04-networking.md) | VPC-native, Ingress, Load Balancer, DNS, Network Policy |
| 05 | Scaling | [05-scaling.md](05-scaling.md) | HPA, VPA, Cluster Autoscaler, Node Pool |
| 06 | Security | [06-security.md](06-security.md) | Workload Identity, RBAC, Private Cluster, Binary Authorization |
| 07 | Monitoring | [07-monitoring.md](07-monitoring.md) | GKE Dashboard, Cloud Monitoring, Logging, alerting |
| 08 | Pricing | [08-pricing.md](08-pricing.md) | Komponen biaya, Autopilot vs Standard, tips hemat |
| 09 | CLI Cheatsheet | [09-commands-cheatsheet.md](09-commands-cheatsheet.md) | gcloud container + kubectl commands |
| 10 | Best Practices | [10-best-practices.md](10-best-practices.md) | Security, scaling, cost, checklist production |
| 11 | Deploy Frontend dari Docker Hub | [11-deploy-frontend-from-dockerhub.md](11-deploy-frontend-from-dockerhub.md) | Tutorial end-to-end: push image → deploy di Console → expose LB → rolling update → scale/autoscale |
| 12 | Deploy Backend + Integrasi FE/DB | [12-deploy-backend-integrated.md](12-deploy-backend-integrated.md) | Bedah Dockerfile Node.js, build multi-platform, deploy backend sebagai ClusterIP, integrasi dengan frontend (Nginx proxy) + database (Cloud SQL / VM / StatefulSet) |
| 13 | Deploy MariaDB di GKE (PVC) | [13-deploy-mariadb-database.md](13-deploy-mariadb-database.md) | MariaDB sebagai Pod dengan PersistentVolumeClaim, port-forward untuk akses mysql CLI, migrasi schema dari VM, konsep ephemeral pod, komparasi Deployment vs StatefulSet vs Cloud SQL |

---

## Arsitektur GKE

```
┌──────────────────────────────────────────────────────────────┐
│                  GKE Cluster                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Control Plane (Managed by Google)                     │  │
│  │  • API Server    • etcd    • Scheduler                 │  │
│  │  • Controller Manager                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                          │                                    │
│              ┌───────────┼───────────┐                        │
│              ▼           ▼           ▼                        │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐      │
│  │   Node 1      │ │   Node 2      │ │   Node 3      │      │
│  │   (VM)        │ │   (VM)        │ │   (VM)        │      │
│  │               │ │               │ │               │      │
│  │ ┌───┐ ┌───┐  │ │ ┌───┐ ┌───┐  │ │ ┌───┐ ┌───┐  │      │
│  │ │App│ │App│  │ │ │App│ │App│  │ │ │App│ │App│  │      │
│  │ │ A │ │ B │  │ │ │ C │ │ A │  │ │ │ B │ │ D │  │      │
│  │ └───┘ └───┘  │ │ └───┘ └───┘  │ │ └───┘ └───┘  │      │
│  └───────────────┘ └───────────────┘ └───────────────┘      │
│                                                              │
│  Setiap Node = VM Compute Engine                             │
│  Setiap App = Container (Pod)                                │
│  Banyak container bisa jalan di 1 Node                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Start: Create Cluster via Console

1. Buka **Google Cloud Console** → **Kubernetes Engine**
2. Klik **ENABLE** (pertama kali, tunggu ~2 menit)
3. Klik **CREATE** → pilih mode (**Autopilot** / **Standard**)
4. Isi **Cluster basics** (name, region)
5. Konfigurasi **Fleet registration**, **Networking**, **Advanced settings**
6. Klik **CREATE**

Detail setiap langkah: [02-create-cluster.md](02-create-cluster.md)
