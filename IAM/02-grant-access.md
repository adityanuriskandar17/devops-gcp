# Grant Access (Tambah User) — Console Walkthrough

Dokumentasi langkah-langkah menambahkan **user**, **assign role**, **edit**, dan **revoke access** di Google Cloud Console.

**Console:** IAM & Admin → IAM → **GRANT ACCESS**

**Prasyarat:**
- Role minimal: **Project IAM Admin** (`roles/resourcemanager.projectIamAdmin`)
- Atau **Owner** (`roles/owner`)

---

## Step 1: Buka IAM Page

```
Console → Navigation menu → IAM & Admin → IAM

  ATAU langsung: console.cloud.google.com/iam-admin/iam
```

### Left Sidebar — IAM & Admin

```
IAM & Admin
│
├── IAM                         ← halaman utama (list principals & roles)
├── Identity                    ← workforce / workload identity
├── Organization policies       ← org-level constraints
├── Quotas & System Limits      ← resource quotas
├── Service Accounts            ← manage service accounts
├── Workload Identity Federation← external identity providers
├── Roles                       ← view & create custom roles
├── Audit Logs                  ← siapa melakukan apa kapan
├── Labels                      ← resource labeling
├── Tags                        ← resource tags
├── Asset Inventory             ← inventory semua resources
├── Groups                      ← Google Groups management
├── Settings                    ← project settings
├── Privacy & Security          ← data privacy settings
└── Resource Manager            ← manage projects & folders
```

---

### Halaman IAM — Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│  IAM                                                                      │
│                                                                           │
│  Permissions for project "fc-1-434201"                                    │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │ VIEW BY PRINCIPALS  │  VIEW BY ROLES  │  VIEW BY PERMISSIONS         ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  [GRANT ACCESS]                    ☐ Include Google-provided role grants  │
│                                                                           │
│  ≡ Filter  Enter property name or value                                   │
│                                                                           │
│  ┌───────────────┬──────────────────────────────────────┬──────────────┐ │
│  │ Principal ↑   │ Role                                  │ IAM condition│ │
│  ├───────────────┼──────────────────────────────────────┼──────────────┤ │
│  │ 👤 alice@     │ Editor                                │              │ │
│  │ example.com   │                                      │              │ │
│  │               │                                      │              │ │
│  │ 👤 bob@       │ Viewer                                │              │ │
│  │ example.com   │ Compute Admin                         │              │ │
│  │               │                                      │              │ │
│  │ 🤖 123456@    │ Compute Engine Service Agent           │              │ │
│  │ cloudservices │                                      │              │ │
│  │ .gserviceacc  │                                      │              │ │
│  │               │                                      │              │ │
│  │ 🤖 ci-deploy  │ Kubernetes Engine Developer            │              │ │
│  │ -sa@project   │ Storage Object Viewer                 │              │ │
│  │ .iam...       │                                      │              │ │
│  └───────────────┴──────────────────────────────────────┴──────────────┘ │
│                                                                           │
│  Setiap row memiliki icon ✏ (edit) di sebelah kanan                      │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Penjelasan Layout

| Area | Fungsi |
|------|--------|
| **Permissions for project "..."** | Menunjukkan project mana yang sedang di-view |
| **VIEW BY PRINCIPALS** | Default — list per user/service account dengan roles mereka |
| **VIEW BY ROLES** | Group by role — lihat siapa saja yang punya role tertentu |
| **VIEW BY PERMISSIONS** | Cari permission spesifik |
| **[GRANT ACCESS]** | Tombol utama untuk menambah user baru |
| **☐ Include Google-provided role grants** | Checkbox — tampilkan juga role yang auto-granted oleh Google (service agents) |
| **Filter** | Cari principal berdasarkan nama/email |
| **Table** | List semua principals, roles, dan conditions |

---

## Step 2: Grant Access (Tambah User Baru)

Klik **[GRANT ACCESS]** → muncul panel di sebelah kanan.

### Console: Grant Access Panel

```
┌───────────────────────────────────────────────────────────────┐
│  Grant access                                                  │
│                                                               │
│  Grant principals access to the project "fc-1-434201"          │
│                                                               │
│  ━━━━━━━━ Add principals ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                               │
│  New principals *                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ alice@example.com                                         ││
│  └──────────────────────────────────────────────────────────┘│
│  Enter one or more principals (user, group, domain,           │
│  or service account)                                          │
│                                                               │
│  ━━━━━━━━ Assign roles ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                               │
│  Role *                                                        │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Select a role                                            ▼││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  (Setelah pilih role):                                        │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 🔍 Filter                                                ││
│  │                                                          ││
│  │  ▸ Basic                                                 ││
│  │    Browser                                                ││
│  │    Editor                                                 ││
│  │    Owner                                                  ││
│  │    Viewer                                                 ││
│  │                                                          ││
│  │  ▸ Cloud Build                                           ││
│  │  ▸ Cloud Functions                                       ││
│  │  ▸ Cloud KMS                                             ││
│  │  ▸ Cloud SQL                                             ││
│  │  ▸ Cloud Storage                                         ││
│  │  ▸ Compute Engine                                        ││
│  │  ▸ Kubernetes Engine                                     ││
│  │  ▸ Logging                                               ││
│  │  ▸ Monitoring                                            ││
│  │  ▸ Project                                               ││
│  │  ... (ratusan kategori)                                  ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  IAM condition (optional)                                      │
│  [+ ADD IAM CONDITION]                                         │
│                                                               │
│  [+ ADD ANOTHER ROLE]                                          │
│                                                               │
│                                     [SAVE]  [CANCEL]           │
└───────────────────────────────────────────────────────────────┘
```

---

### Penjelasan Setiap Field

#### New Principals

```
  New principals *
  ┌──────────────────────────────────────────────────┐
  │ alice@example.com                                 │
  └──────────────────────────────────────────────────┘
```

| Input | Contoh | Tipe Principal |
|-------|--------|---------------|
| Email Google Account | `alice@example.com` | User (individual) |
| Email Google Group | `devops-team@example.com` | Group (semua member dapat akses) |
| Service Account email | `my-sa@project.iam.gserviceaccount.com` | Service Account |
| Domain | `example.com` | Semua user di domain |
| `allAuthenticatedUsers` | — | Semua user Google (public!) |
| `allUsers` | — | Siapa saja termasuk anonymous (public!) |

Bisa menambahkan **lebih dari 1 principal** sekaligus (comma-separated atau Enter per principal).

#### Select a Role

```
  Role *
  ┌──────────────────────────────────────────────────┐
  │ Select a role                                    ▼│
  └──────────────────────────────────────────────────┘

  Dropdown → role browser dengan search & kategori:

  ┌──────────────────────────────────────────────────┐
  │ 🔍 Type to filter                                │
  │                                                  │
  │  ▸ Basic                                         │
  │  ▸ Cloud Build                                   │
  │  ▸ Compute Engine                                │
  │  ▸ Kubernetes Engine                             │
  │  ▸ ... (organized by service)                    │
  │                                                  │
  │  Klik category → expand roles:                   │
  │  ▾ Compute Engine                                │
  │    Compute Admin                                  │
  │    Compute Image User                             │
  │    Compute Instance Admin (beta)                  │
  │    Compute Instance Admin (v1)                    │
  │    Compute Network Admin                          │
  │    Compute Network User                           │
  │    Compute OS Admin Login                         │
  │    Compute OS Login                               │
  │    Compute Security Admin                         │
  │    Compute Storage Admin                          │
  │    Compute Viewer                                 │
  └──────────────────────────────────────────────────┘
```

**Tips:** Ketik langsung di filter untuk cari cepat. Misal ketik "compute admin" → langsung muncul `Compute Admin`.

#### Add Another Role

```
  [+ ADD ANOTHER ROLE]

  Klik → muncul dropdown role tambahan:

  Role *
  ┌──────────────────────────────────────────────────┐
  │ Select a role                                    ▼│
  └──────────────────────────────────────────────────┘

  (bisa add sebanyak yang dibutuhkan)
```

Satu principal bisa memiliki **banyak roles** sekaligus. Setiap role menambah permissions.

```
Contoh: Alice mendapat 3 roles

  Role 1: Compute Viewer → bisa lihat VMs
  Role 2: Storage Object Viewer → bisa lihat files di bucket
  Role 3: Logs Viewer → bisa lihat logs

  Effective permissions = gabungan ketiga roles
```

#### IAM Condition (Optional)

```
  IAM condition (optional)
  [+ ADD IAM CONDITION]

  Klik → muncul panel:
  ┌──────────────────────────────────────────────────────────┐
  │  Edit condition                                           │
  │                                                          │
  │  Title *                                                  │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ Working hours only                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  Description                                              │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ Access only during working hours                  │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  ┌────────────────────────┬─────────────────────────┐   │
  │  │ CONDITION BUILDER      │ CONDITION EDITOR (CEL)  │   │
  │  └────────────────────────┴─────────────────────────┘   │
  │                                                          │
  │  Condition Builder:                                       │
  │  Condition type:                                          │
  │  ┌──────────────────────────────────────────────┐        │
  │  │ Access expiry                               ▼│        │
  │  └──────────────────────────────────────────────┘        │
  │                                                          │
  │  Pilihan condition types:                                 │
  │  • Access expiry (akses berakhir pada tanggal tertentu)   │
  │  • Resource type                                          │
  │  • Resource name                                          │
  │  • Resource tags                                          │
  │                                                          │
  │                         [SAVE]  [CANCEL]                  │
  └──────────────────────────────────────────────────────────┘
```

| Condition Type | Fungsi | Contoh |
|---------------|--------|--------|
| **Access expiry** | Role berlaku sampai tanggal tertentu | Contractor akses sampai 31 Dec 2026 |
| **Resource type** | Role hanya berlaku pada tipe resource tertentu | Hanya untuk Compute Engine instances |
| **Resource name** | Role hanya berlaku pada resource spesifik | Hanya untuk bucket "media-prod" |
| **Resource tags** | Role berlaku berdasarkan tag | Hanya resource dengan tag `env:staging` |

**Condition Editor (CEL)** — untuk expression custom:

```
Contoh CEL conditions:

  // Akses berakhir 31 Dec 2026
  request.time < timestamp("2026-12-31T23:59:59Z")

  // Hanya untuk Compute Engine instances
  resource.type == "compute.googleapis.com/Instance"

  // Kombinasi: hanya staging resources sampai akhir tahun
  resource.matchTag("env", "staging") &&
    request.time < timestamp("2026-12-31T23:59:59Z")
```

| Kelebihan Conditions | Kekurangan Conditions |
|---------------------|----------------------|
| Granular access control | Lebih complex untuk manage |
| Temporary access (contractor, intern) | Tidak semua resource support conditions |
| Resource-specific restrictions | Perlu monitoring kapan condition expire |

---

## Step 3: Edit Permissions (User yang Sudah Ada)

Di halaman IAM, klik icon **✏ (edit)** di sebelah kanan principal.

### Console: Edit Permissions Panel

```
┌───────────────────────────────────────────────────────────────┐
│  Edit permissions                                              │
│                                                               │
│  Edit access for alice@example.com on project "fc-1-434201"    │
│                                                               │
│  ━━━━━━━━ Assigned roles ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                               │
│  Role *                                                        │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Editor                                                ▼ 🗑││
│  └──────────────────────────────────────────────────────────┘│
│  IAM condition (optional)                                      │
│  [+ ADD IAM CONDITION]                                         │
│                                                               │
│  Role *                                                        │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Compute Admin                                         ▼ 🗑││
│  └──────────────────────────────────────────────────────────┘│
│  IAM condition (optional)                                      │
│  [+ ADD IAM CONDITION]                                         │
│                                                               │
│  [+ ADD ANOTHER ROLE]                                          │
│                                                               │
│                                     [SAVE]  [CANCEL]           │
└───────────────────────────────────────────────────────────────┘
```

| Action | Cara |
|--------|------|
| **Ubah role** | Klik dropdown role → pilih role baru |
| **Hapus role** | Klik icon 🗑 di sebelah kanan role |
| **Tambah role** | Klik [+ ADD ANOTHER ROLE] |
| **Tambah condition** | Klik [+ ADD IAM CONDITION] |

---

## Step 4: Revoke Access (Hapus User)

Untuk **hapus semua akses** user dari project:

```
Console: IAM → cari user → klik ✏ (edit) → hapus semua roles → Save

  ATAU:

  Console: IAM → cari user → klik 🗑 (remove) di row user
```

```
Flow revoke access:

  Admin: "David sudah resign, cabut aksesnya"
       │
       ▼
  Console → IAM → cari "david@example.com"
       │
       ▼
  Klik 🗑 (delete/remove icon)
       │
       ▼
  Konfirmasi: "Remove david@example.com from project?"
       │
       ▼
  [REMOVE] → David tidak bisa akses project lagi ✅
       │
       ▼
  Audit Log: "admin@... removed david@... from project"
```

---

## Flow End-to-End: Onboarding Tim Baru

```
Skenario: Tim backend (3 developer + 1 lead) join project

  ━━━━━ Step 1: Buat Google Group ━━━━━

  Console → Groups → Create group
  │  Name: backend-team@example.com
  │  Members: dev1@, dev2@, dev3@, lead@
  │
  ▼

  ━━━━━ Step 2: Grant Access ke Group ━━━━━

  Console → IAM → GRANT ACCESS
  │
  │  New principals: backend-team@example.com
  │
  │  Role 1: Compute Viewer (project web-prod)
  │    → bisa lihat production VMs
  │
  │  Role 2: Editor (project web-staging)
  │    → bisa develop & test di staging
  │
  │  [SAVE]
  │
  ▼

  ━━━━━ Step 3: Grant Extra untuk Lead ━━━━━

  Console → IAM → GRANT ACCESS
  │
  │  New principals: lead@example.com
  │
  │  Role: Compute Admin (project web-prod)
  │    → lead bisa manage production VMs
  │  Condition: sampai 31 Dec 2026
  │
  │  [SAVE]
  │
  ▼

  ━━━━━ Hasil ━━━━━

  dev1@, dev2@, dev3@:
    web-prod: Compute Viewer (lihat saja)
    web-staging: Editor (full develop)

  lead@:
    web-prod: Compute Viewer (dari group)
            + Compute Admin (personal, sampai Dec 2026)
    web-staging: Editor (dari group)

  ━━━━━ Step 4: Developer resign ━━━━━

  dev2@ resign → hapus dari Google Group
  │  → otomatis kehilangan SEMUA akses ✅
  │  → tidak perlu edit IAM satu-satu
```

| Kelebihan Pakai Group | Kekurangan Pakai Group |
|-----------------------|------------------------|
| Add/remove member di 1 tempat | Perlu Google Workspace atau Cloud Identity |
| Semua project otomatis ter-update | Kurang granular (semua member sama) |
| Audit mudah | — |

---

## Flow: Memberikan Akses Sementara (Contractor)

```
Skenario: Contractor perlu akses 3 bulan untuk audit

  Console → IAM → GRANT ACCESS
  │
  │  New principals: contractor@external.com
  │
  │  Role: Viewer
  │  Condition:
  │    Title: "Temp access for audit"
  │    Type: Access expiry
  │    Expiry: 2026-06-30
  │
  │  [SAVE]
  │
  ▼

  Contractor bisa akses sampai 30 Juni 2026
  Setelah itu → akses otomatis expired ✅
  Tidak perlu manual revoke!

  Timeline:
  ┌──────────────────────────────────────────────┐
  │  Mar 2026        Jun 2026                     │
  │  ├────── ACCESS ACTIVE ──────┤ EXPIRED        │
  │  Grant           Condition    No access       │
  │  access          expires      (automatic)     │
  └──────────────────────────────────────────────┘
```

---

*Dokumen ini berdasarkan fitur IAM di Google Cloud Console per Maret 2025–2026.*
