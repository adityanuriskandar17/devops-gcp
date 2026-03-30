# Konsep & Cara Kerja IAM

Dokumentasi konsep dasar **Identity and Access Management** — resource hierarchy, principals, roles, permissions, allow policy, dan inheritance.

**Console:** IAM & Admin → **IAM**

---

## Resource Hierarchy

Semua resource di GCP tersusun dalam **hierarki** — dan IAM policy **diwariskan** dari atas ke bawah.

```
Resource Hierarchy:

  ┌───────────────────────────────────────┐
  │  Organization                          │  ← perusahaan (example.com)
  │  (org-level policies berlaku ke semua) │
  └──────────────────┬────────────────────┘
                     │ inherited ↓
         ┌───────────┴───────────┐
         ▼                       ▼
  ┌──────────────┐       ┌──────────────┐
  │  Folder       │       │  Folder       │  ← departemen / tim
  │  "Engineering"│       │  "Finance"    │
  └──────┬───────┘       └──────┬───────┘
         │ inherited ↓          │ inherited ↓
    ┌────┴────┐            ┌────┴────┐
    ▼         ▼            ▼         ▼
┌────────┐┌────────┐ ┌────────┐┌────────┐
│Project ││Project │ │Project ││Project │  ← project
│"web-   ││"api-   │ │"fin-   ││"fin-   │
│ prod"  ││ prod"  │ │ prod"  ││ staging│
└───┬────┘└───┬────┘ └───┬────┘└────────┘
    │         │           │
    ▼         ▼           ▼
 Resources  Resources  Resources               ← VM, bucket, database, dll
```

### Inheritance (Pewarisan)

```
Flow inheritance:

  Organization: alice@example.com → roles/viewer
       │
       ├── inherited ke SEMUA folders di bawahnya
       ├── inherited ke SEMUA projects di bawahnya
       └── inherited ke SEMUA resources di bawahnya

  Artinya: Alice bisa VIEW semua resource di seluruh organization!
```

| Level | Scope | Contoh |
|-------|-------|--------|
| **Organization** | Seluruh org | Policy berlaku ke semua folder, project, resource |
| **Folder** | Folder + sub-resources | Policy berlaku ke semua project dalam folder |
| **Project** | 1 project | Policy berlaku ke semua resource dalam project |
| **Resource** | 1 resource spesifik | Policy hanya berlaku ke resource tersebut (misal: 1 bucket) |

```
Contoh inheritance:

  Organization level:
    alice@example.com → roles/viewer (bisa view semua)

  Project "web-prod" level:
    alice@example.com → roles/compute.admin (bisa manage VMs)

  Effective permissions Alice di project "web-prod":
    = roles/viewer (inherited dari org)
    + roles/compute.admin (dari project)
    = bisa view semua + manage VMs

  Effective permissions Alice di project "fin-prod":
    = roles/viewer (inherited dari org saja)
    = hanya bisa view
```

| Kelebihan Inheritance | Kekurangan Inheritance |
|----------------------|----------------------|
| Mudah manage — set di atas, berlaku ke bawah | Terlalu broad jika tidak hati-hati |
| Konsisten across resources | Tidak bisa "revoke" inherited permission di level bawah |
| Kurangi repetitive assignments | — |

**Penting:** IAM bersifat **additive** — permission hanya bisa ditambah, tidak bisa dikurangi di level bawah. Jika user dapat `Editor` di org level, tidak bisa di-restrict menjadi `Viewer` di project level.

---

## Principals (Identitas)

Principal adalah **siapa** yang ingin akses resource.

```
Console: IAM → Grant Access → New principals

  ┌──────────────────────────────────────────────────┐
  │ New principals *                                  │
  │ ┌──────────────────────────────────────────────┐ │
  │ │ alice@example.com                             │ │
  │ └──────────────────────────────────────────────┘ │
  └──────────────────────────────────────────────────┘
```

### Tipe Principals

| Tipe | Format | Contoh | Penjelasan |
|------|--------|--------|-----------|
| **Google Account** | `user:email` | `alice@example.com` | Akun Google perorangan (Gmail atau Google Workspace) |
| **Google Group** | `group:email` | `devops-team@example.com` | Grup Google — assign role ke grup, semua member dapat akses |
| **Service Account** | `serviceAccount:email` | `my-sa@project.iam.gserviceaccount.com` | Akun untuk aplikasi/service (bukan manusia) |
| **Google Workspace domain** | `domain:domain` | `example.com` | Semua user di domain Google Workspace |
| **allAuthenticatedUsers** | `allAuthenticatedUsers` | — | Semua orang yang login dengan akun Google (public!) |
| **allUsers** | `allUsers` | — | **Siapa saja** termasuk yang tidak login (public internet!) |

```
Flow: Siapa yang bisa jadi principal?

  ┌──────────────────────────────────────────────────┐
  │  Principal types:                                 │
  │                                                  │
  │  👤 Google Account (alice@example.com)            │
  │     └── 1 orang spesifik                         │
  │                                                  │
  │  👥 Google Group (team@example.com)               │
  │     └── Banyak orang dalam 1 grup                │
  │         (tambah/hapus member di Google Groups,    │
  │          otomatis dapat/kehilangan akses)         │
  │                                                  │
  │  🤖 Service Account (sa@project.iam...)           │
  │     └── Aplikasi / VM / Cloud Function / dll      │
  │                                                  │
  │  🏢 Domain (example.com)                          │
  │     └── SEMUA user di domain tersebut            │
  │                                                  │
  │  🌐 allUsers                                      │
  │     └── SIAPA SAJA (⚠ BAHAYA untuk production)   │
  └──────────────────────────────────────────────────┘
```

**Best practice:** Gunakan **Google Group** untuk team-based access. Lebih mudah manage daripada assign per individu.

---

## Allow Policy (IAM Policy)

Allow policy menghubungkan **principal** dengan **role** pada sebuah resource. Setiap resource punya allow policy.

```
Allow Policy structure:

  Resource: project "web-prod"
  ┌──────────────────────────────────────────────────┐
  │  Allow Policy (IAM Policy)                        │
  │                                                  │
  │  Binding 1:                                       │
  │    Role:       roles/editor                       │
  │    Members:    alice@example.com                  │
  │               bob@example.com                     │
  │                                                  │
  │  Binding 2:                                       │
  │    Role:       roles/viewer                       │
  │    Members:    devops-team@example.com            │
  │                                                  │
  │  Binding 3:                                       │
  │    Role:       roles/compute.admin                │
  │    Members:    ci-sa@project.iam.gserviceaccount  │
  │    Condition:  request.time < "2026-12-31"        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### Komponen Allow Policy

| Komponen | Fungsi | Contoh |
|----------|--------|--------|
| **Binding** | 1 pasangan role + members | `roles/editor` → `[alice, bob]` |
| **Role** | Kumpulan permissions | `roles/editor` |
| **Members** | List principals yang dapat role tersebut | `[alice@..., bob@...]` |
| **Condition** (optional) | Syarat tambahan kapan binding berlaku | Hanya berlaku jam kerja, hanya dari IP tertentu |

---

## Flow: Bagaimana IAM Memproses Request

```
User/Service mengirim request ke GCP API
       │
       ▼
  ┌──────────────────────────────────────────────┐
  │  1. Authentication (AuthN)                    │
  │     "Siapa kamu?"                             │
  │     → Verify identity via Google Account,     │
  │       Service Account token, atau OAuth        │
  │                                               │
  │     ✅ Identity verified: alice@example.com   │
  │     ❌ Not authenticated → 401 Unauthorized   │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  2. Authorization (AuthZ)                     │
  │     "Boleh tidak?"                            │
  │     → Check IAM allow policy:                 │
  │                                               │
  │     Request: compute.instances.delete          │
  │     Resource: project "web-prod"               │
  │     Principal: alice@example.com               │
  │                                               │
  │     Check bindings:                            │
  │     ├── alice punya roles/editor di project?  │
  │     │   roles/editor includes                  │
  │     │   compute.instances.delete? → Ya ✅      │
  │     │                                          │
  │     └── Condition terpenuhi? → Ya ✅           │
  │                                               │
  │     ✅ ALLOWED → proceed                       │
  │     ❌ DENIED → 403 Forbidden                  │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │  3. Execute Action                            │
  │     → VM deleted ✅                            │
  │     → Audit Log recorded                       │
  └──────────────────────────────────────────────┘
```

---

## Skenario: Dengan dan Tanpa IAM yang Baik

### Tanpa IAM yang Baik (Semua User = Owner)

```
Skenario: Startup kecil — semua orang dikasih Owner role

  alice@... → Owner
  bob@... → Owner
  charlie@... → Owner (intern)

  Risiko:
  ├── Charlie (intern) bisa DELETE production database ❌
  ├── Alice bisa ubah billing → tagihan melonjak ❌
  ├── Bob bisa invite siapa saja → shadow admin ❌
  └── Tidak ada audit trail yang jelas ❌

  Dampak:
  ✗ Accidental deletion (intern hapus production VM)
  ✗ Over-spending (billing tidak terkontrol)
  ✗ Security breach (terlalu banyak akses)
  ✗ Compliance violation
```

### Dengan IAM yang Baik (Least Privilege)

```
Skenario: Sama startup — tapi dengan proper IAM

  alice@... → roles/editor (project web-prod)
    → Bisa manage resources, TIDAK bisa manage IAM/billing
  bob@... → roles/compute.admin (project web-prod)
    → Hanya bisa manage VMs
  charlie@... → roles/viewer (project web-staging)
    → Hanya bisa LIHAT di staging, TIDAK bisa apa-apa di prod

  Hasil:
  ├── Charlie (intern) hanya bisa lihat staging ✅
  ├── Alice bisa manage tapi tidak bisa ubah billing ✅
  ├── Bob fokus hanya di VMs ✅
  └── Semua aksi tercatat di Audit Log ✅
```

---

## Skenario: Flow Onboarding Developer Baru

```
Developer baru "David" join tim backend:

  Step 1: Admin buka Console → IAM & Admin → IAM
          │
          ▼
  Step 2: Klik "GRANT ACCESS"
          │
          │  New principals: david@example.com
          │  Role 1: roles/viewer (project web-prod)
          │    → David bisa lihat semua di production
          │  Role 2: roles/editor (project web-staging)
          │    → David bisa develop & test di staging
          │
          ▼
  Step 3: Save → David langsung bisa akses
          │
          ▼
  Step 4: David login → Console menampilkan projects sesuai aksesnya
          │
          │  web-prod:    hanya bisa View ✅
          │  web-staging: bisa Create/Edit/Delete ✅
          │  fin-prod:    tidak terlihat ❌ (no access)
          │
          ▼
  Step 5 (6 bulan kemudian): David pindah tim
          │
          │  Admin → IAM → David → Edit → Revoke roles
          │  atau: hapus David dari Google Group
          │
          ▼
  ✅ Akses dicabut, David tidak bisa akses lagi
```

---

## Skenario: Flow Service Account untuk CI/CD

```
CI/CD pipeline perlu deploy ke GKE:

  Step 1: Buat Service Account
          │  Console → IAM & Admin → Service Accounts
          │  Name: ci-deploy-sa
          │  Email: ci-deploy-sa@project.iam.gserviceaccount.com
          │
          ▼
  Step 2: Assign Roles (minimal yang dibutuhkan)
          │  roles/container.developer → deploy ke GKE
          │  roles/storage.objectViewer → baca config dari bucket
          │
          ▼
  Step 3: Setup Authentication
          │
          ├── Option A: Workload Identity Federation (recommended)
          │   → GitHub Actions OIDC → exchange token → no keys needed ✅
          │
          └── Option B: Service Account Key (legacy, tidak recommended)
              → Download JSON key → simpan sebagai secret
              → ⚠ Risiko: key bisa leak!
          │
          ▼
  Step 4: Pipeline berjalan
          │
          │  GitHub Actions:
          │  1. Authenticate sebagai ci-deploy-sa
          │  2. gcloud container clusters get-credentials...
          │  3. kubectl apply -f deployment.yaml
          │  4. Deploy berhasil ✅
          │
          ▼
  Audit Log: "ci-deploy-sa deployed app v2.1 to GKE cluster"
```

---

## Ringkasan Konsep

```
IAM = WHO + WHAT + WHERE

  WHO (Principal):
    User, Group, Service Account, Domain

  WHAT (Role → Permissions):
    Basic (Owner/Editor/Viewer)
    Predefined (roles/compute.admin, roles/storage.admin, dll)
    Custom (kamu buat sendiri)

  WHERE (Resource):
    Organization → Folder → Project → Resource

  Inheritance:
    Policy di level atas → inherited ke semua level bawah
    Additive only — tidak bisa restrict di level bawah

  Allow Policy:
    Binding = Role + Members [+ Condition]
    Attached ke setiap resource
```

---

*Dokumen ini berdasarkan fitur IAM di Google Cloud Console per Maret 2025–2026.*
