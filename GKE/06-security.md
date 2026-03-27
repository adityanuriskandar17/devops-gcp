# Security

Panduan keamanan **GKE** — Workload Identity, RBAC, Private Cluster, Binary Authorization — berorientasi **GCP Console**.

---

## Layer Keamanan GKE

```
Layer 1: Cluster level
  ├── Private cluster (tidak expose ke internet)
  ├── Authorized networks (siapa boleh akses API server)
  └── Release channel (auto security patches)

Layer 2: Node level
  ├── Shielded nodes (secure boot, integrity monitoring)
  ├── Node auto-upgrade (security patches otomatis)
  └── Container-Optimized OS (minimal attack surface)

Layer 3: Workload level
  ├── Workload Identity (akses GCP services tanpa key file)
  ├── RBAC (role-based access control)
  ├── Network Policy (firewall antar Pod)
  └── Binary Authorization (hanya trusted images)

Layer 4: Container level
  ├── Non-root container
  ├── Read-only filesystem
  └── Security context (capabilities)
```

---

## Workload Identity

**Console:** `Kubernetes Engine` → Cluster → **Edit** → **Security** → **Enable Workload Identity**

Workload Identity memungkinkan Pod mengakses GCP services (Cloud SQL, Cloud Storage, dll) **tanpa** menyimpan service account key file.

```
Tanpa Workload Identity (TIDAK AMAN):
  1. Buat service account key (JSON file)
  2. Simpan key di Secret Kubernetes
  3. Mount ke Pod
  ──► RISIKO: key bisa bocor, sulit di-rotate

Dengan Workload Identity (AMAN):
  1. Buat GCP service account
  2. Bind ke Kubernetes service account
  3. Pod otomatis dapat credential — TANPA key file
  ──► Secure, auto-rotate, audit trail
```

### Kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Tidak perlu manage key file | Hanya tersedia di GKE (bukan generic K8s) |
| Auto-rotate credentials | Setup awal sedikit lebih kompleks |
| Audit trail di Cloud Audit Logs | — |
| **Best practice untuk production** | — |

---

## RBAC (Role-Based Access Control)

Mengontrol **siapa bisa melakukan apa** di dalam cluster.

**Console:** `Kubernetes Engine` → Cluster → **Security** → IAM

### Level RBAC

| Level | Scope | Contoh |
|-------|-------|--------|
| **Cluster Role** | Seluruh cluster | Admin bisa manage semua namespace |
| **Role** | Per namespace | Developer hanya bisa deploy di namespace "staging" |

### Contoh: Developer hanya akses namespace staging

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: staging
  name: developer-role
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "create", "update"]
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list"]
```

---

## Private Cluster

**Console:** Create Cluster → **Networking** → **Private cluster**

Control plane dan nodes hanya punya **private IP** — tidak exposed ke internet.

### Setup

| Komponen | Detail |
|----------|--------|
| Nodes | Private IP only — butuh **Cloud NAT** untuk pull container images |
| Control plane | Private endpoint — akses kubectl via VPN/bastion/Cloud Shell |
| Authorized networks | Whitelist CIDR yang boleh akses control plane |

### Kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Attack surface minimal | Butuh Cloud NAT ($1/bulan + egress) |
| Compliance friendly | Kubectl harus via VPN/bastion |
| **Wajib untuk production dengan compliance** | Setup lebih kompleks |

---

## Binary Authorization

**Console:** `Security` → **Binary Authorization**

Hanya container image yang sudah di-**sign/attest** yang boleh deploy.

```
CI/CD Pipeline:
  Build image → Scan vulnerabilities → Sign image → Push to registry
                                           │
GKE Cluster:                               ▼
  Deploy request → Binary Authorization check:
    ├── Image signed? → Ya → Deploy OK
    └── Image NOT signed? → BLOCKED
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Supply chain security | Perlu setup attestation pipeline |
| Block unauthorized/unscanned images | Bisa block legitimate deploy jika lupa sign |
| Compliance | — |

---

## Security Checklist

```
CLUSTER
☐ Private cluster enabled (atau authorized networks ketat)
☐ Release channel: Regular atau Stable
☐ Shielded nodes enabled
☐ Node auto-upgrade enabled

IDENTITY
☐ Workload Identity enabled
☐ RBAC configured (bukan semua orang cluster-admin)
☐ Namespace per team / environment

WORKLOAD
☐ Resource requests & limits di semua Pod
☐ Non-root containers
☐ Network Policy aktif
☐ Binary Authorization (untuk compliance)

MONITORING
☐ Cloud Audit Logs enabled
☐ Container threat detection enabled
```
