# Roles & Permissions

Dokumentasi lengkap tipe **roles** (Basic, Predefined, Custom), format **permissions**, dan cara memilih role yang tepat.

**Console:** IAM & Admin → **Roles**

---

## Permissions

Permission adalah **unit terkecil** dari akses. Setiap action di GCP memerlukan permission tertentu.

### Format Permission

```
SERVICE.RESOURCE.VERB

Contoh:
  compute.instances.create     → buat VM baru
  compute.instances.delete     → hapus VM
  compute.instances.list       → list semua VMs
  storage.objects.get          → download object dari bucket
  storage.objects.create       → upload object ke bucket
  container.clusters.create    → buat GKE cluster
  iam.serviceAccounts.create   → buat service account
```

| Bagian | Fungsi | Contoh |
|--------|--------|--------|
| **Service** | GCP service | `compute`, `storage`, `container`, `iam` |
| **Resource** | Tipe resource di service tersebut | `instances`, `objects`, `clusters` |
| **Verb** | Action yang dilakukan | `create`, `delete`, `list`, `get`, `update` |

---

## Tipe Roles

### 1. Basic Roles (Broad Access)

Role paling dasar — memberikan akses yang **sangat luas**.

```
Console: IAM → Grant Access → Select a role → Basic

  ▾ Basic
    Browser         → bisa browse project resources (minimal)
    Editor          → bisa read + write hampir semua resources
    Owner           → bisa semua + manage IAM + billing
    Viewer          → bisa read hampir semua resources
```

| Role | Permissions (approx) | Scope |
|------|---------------------|-------|
| **Viewer** (`roles/viewer`) | Read-only ke hampir semua resources | ~2,000+ read permissions |
| **Editor** (`roles/editor`) | Read + Write ke hampir semua resources | ~5,000+ permissions |
| **Owner** (`roles/owner`) | Semua + manage IAM + billing | ~7,000+ permissions (termasuk iam.*, billing.*) |
| **Browser** (`roles/browser`) | Browse project dan folders | Minimal — hanya list resources |

```
Scope perbandingan:

  Browser: ████░░░░░░░░░░░░░░░░ (minimal, browse only)
  Viewer:  ████████░░░░░░░░░░░░ (read everything)
  Editor:  ██████████████░░░░░░ (read + write everything)
  Owner:   ████████████████████ (everything + IAM + billing)
```

**⚠ PERINGATAN: Basic Roles tidak disarankan untuk production!**

```
Kenapa?

  Editor role includes:
  ├── compute.instances.create ✅
  ├── compute.instances.delete ⚠ (bisa hapus VM!)
  ├── storage.objects.delete ⚠ (bisa hapus files!)
  ├── cloudsql.instances.delete ⚠ (bisa hapus database!)
  ├── ... ratusan permissions lainnya
  └── Terlalu banyak akses yang tidak dibutuhkan!

  Predefined role (Compute Viewer):
  ├── compute.instances.get ✅
  ├── compute.instances.list ✅
  └── Hanya permissions yang dibutuhkan ✅
```

| Kelebihan Basic Roles | Kekurangan Basic Roles |
|-----------------------|------------------------|
| Mudah — tidak perlu pilih spesifik | **Terlalu broad** — violate least privilege |
| Cepat untuk development/testing | **Risiko keamanan** — user bisa delete resources |
| | **Tidak cocok production** |
| | Tidak bisa di-customize |

---

### 2. Predefined Roles (Recommended)

Role yang dibuat oleh Google untuk **setiap service** — granular dan maintained.

```
Console: IAM → Grant Access → Select a role → (Service category)

  ▾ Compute Engine
    Compute Admin               → full control VMs
    Compute Instance Admin (v1) → manage instances only
    Compute Network Admin       → manage networking
    Compute Network User        → use networks
    Compute OS Admin Login      → SSH as admin
    Compute OS Login            → SSH as user
    Compute Security Admin      → manage firewalls & SSL
    Compute Storage Admin       → manage disks & images
    Compute Viewer              → read-only VMs

  ▾ Cloud Storage
    Storage Admin               → full control buckets & objects
    Storage Object Admin        → full control objects only
    Storage Object Creator      → upload objects only
    Storage Object Viewer       → download objects only

  ▾ Kubernetes Engine
    Kubernetes Engine Admin     → full control GKE
    Kubernetes Engine Cluster Admin → manage clusters
    Kubernetes Engine Developer → deploy workloads
    Kubernetes Engine Viewer    → read-only GKE
```

### Predefined Roles yang Sering Digunakan

| Service | Role | Fungsi | Cocok Untuk |
|---------|------|--------|-------------|
| **Compute Engine** | `roles/compute.admin` | Full control VMs, disks, networking | Infra engineer |
| | `roles/compute.viewer` | Read-only | Monitoring, auditor |
| | `roles/compute.instanceAdmin.v1` | Manage instances saja | Developer yang perlu manage VMs |
| **Cloud Storage** | `roles/storage.admin` | Full control | Storage administrator |
| | `roles/storage.objectViewer` | Download objects | Apps yang baca data |
| | `roles/storage.objectCreator` | Upload objects | Apps yang tulis data |
| **Cloud SQL** | `roles/cloudsql.admin` | Full control | DBA |
| | `roles/cloudsql.viewer` | Read-only | Monitoring |
| | `roles/cloudsql.client` | Connect ke instance | Apps |
| **GKE** | `roles/container.admin` | Full control | Cluster admin |
| | `roles/container.developer` | Deploy workloads | Developer |
| | `roles/container.viewer` | Read-only | Monitoring |
| **IAM** | `roles/iam.serviceAccountUser` | Act as service account | Apps, CI/CD |
| | `roles/resourcemanager.projectIamAdmin` | Manage IAM di project | IAM admin |
| **Logging** | `roles/logging.viewer` | Read logs | Developer, support |
| | `roles/logging.admin` | Full control logs | Ops engineer |
| **Monitoring** | `roles/monitoring.viewer` | Read metrics | Dashboard viewer |
| | `roles/monitoring.editor` | Create dashboards, alerts | Ops engineer |

| Kelebihan Predefined Roles | Kekurangan Predefined Roles |
|----------------------------|----------------------------|
| **Granular** — sesuai kebutuhan service | Kadang masih terlalu broad |
| **Google-maintained** — auto-updated | Banyak pilihan — bisa confusing |
| **Best practice** — recommended by Google | Tidak bisa customize |
| Documented — jelas permissions apa saja | — |

---

### 3. Custom Roles

Role yang kamu **buat sendiri** — pilih permissions satu per satu.

```
Console: IAM & Admin → Roles → + CREATE ROLE

  ┌──────────────────────────────────────────────────────────────┐
  │  Create role                                                  │
  │                                                              │
  │  Title *                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Custom VM Viewer                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Description                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Can only view VM instances, nothing else              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ID *                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ customVmViewer                                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Role launch stage                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ General Availability                                ▼│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  [+ ADD PERMISSIONS]                                          │
  │                                                              │
  │  Selected permissions:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ☑ compute.instances.get                               │    │
  │  │ ☑ compute.instances.list                              │    │
  │  │ ☑ compute.zones.list                                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │                            [CREATE]  [CANCEL]                 │
  └──────────────────────────────────────────────────────────────┘
```

#### Add Permissions Dialog

```
  [+ ADD PERMISSIONS] → Dialog:

  ┌──────────────────────────────────────────────────────────────┐
  │  Add permissions                                              │
  │                                                              │
  │  🔍 Filter permissions by role or enter permission            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ compute.instances                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Results:                                                     │
  │  ☐ compute.instances.addAccessConfig                         │
  │  ☐ compute.instances.addMaintenancePolicies                  │
  │  ☑ compute.instances.get                                     │
  │  ☑ compute.instances.list                                    │
  │  ☐ compute.instances.create                                  │
  │  ☐ compute.instances.delete                                  │
  │  ☐ compute.instances.reset                                   │
  │  ☐ compute.instances.setLabels                               │
  │  ☐ compute.instances.start                                   │
  │  ☐ compute.instances.stop                                    │
  │  ... (pilih yang dibutuhkan saja)                            │
  │                                                              │
  │                            [ADD]  [CANCEL]                    │
  └──────────────────────────────────────────────────────────────┘
```

| Kelebihan Custom Roles | Kekurangan Custom Roles |
|------------------------|------------------------|
| **Ultimate granularity** — pilih exact permissions | **Kamu yang maintain** — tidak auto-update |
| Comply dengan strict least privilege | Max 300 per project, 300 per org |
| Cocok untuk unique use cases | Perlu tracking permissions baru dari Google |
| | Lebih complex untuk manage |

### Kapan Pakai Custom Role?

```
Decision tree:

  Butuh akses ke GCP resource?
       │
       ├── Predefined role cocok?
       │   ├── Ya → Pakai predefined ✅
       │   │
       │   └── Tidak — terlalu banyak permissions?
       │       │
       │       └── Buat custom role dengan
       │           HANYA permissions yang dibutuhkan ✅
       │
       └── Development/testing saja?
           └── Basic role (Viewer/Editor) OK ✅
               (tapi jangan untuk production!)
```

---

## Perbandingan Tipe Roles

| Aspek | Basic | Predefined | Custom |
|-------|-------|-----------|--------|
| **Dibuat oleh** | Google | Google | Kamu |
| **Granularity** | Sangat broad | Moderate — per service | Ultimate — per permission |
| **Maintenance** | Google | Google (auto-update) | Kamu (manual) |
| **Jumlah** | 4 roles | Ribuan roles | Max 300/project |
| **Cocok untuk** | Dev/test only | **Production (recommended)** | Strict compliance |
| **Risiko** | Over-privilege | Moderate | Under-privilege jika lupa permission |

---

## Console: View Roles

```
Console: IAM & Admin → Roles

  ┌──────────────────────────────────────────────────────────────┐
  │  Roles                                        [+ CREATE ROLE]│
  │                                                              │
  │  ≡ Filter roles                                              │
  │                                                              │
  │  ┌─────────────────────┬──────────────┬──────────┬────────┐ │
  │  │ Title               │ ID           │ Type     │ Stage  │ │
  │  ├─────────────────────┼──────────────┼──────────┼────────┤ │
  │  │ Custom VM Viewer    │ customVm...  │ Project  │ GA     │ │
  │  │ Compute Admin       │ roles/compute│ Predef.  │ GA     │ │
  │  │ Editor              │ roles/editor │ Basic    │ GA     │ │
  │  │ ...                 │ ...          │ ...      │ ...    │ │
  │  └─────────────────────┴──────────────┴──────────┴────────┘ │
  │                                                              │
  │  Klik role → lihat semua permissions di dalamnya             │
  └──────────────────────────────────────────────────────────────┘
```

---

*Dokumen ini berdasarkan fitur IAM di Google Cloud Console per Maret 2025–2026.*
