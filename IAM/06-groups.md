# Google Groups untuk IAM

Dokumentasi lengkap cara menggunakan **Google Groups** untuk mengelola akses IAM secara efisien — create group, manage members, assign roles ke group, dan flow skenario.

**Console:** IAM & Admin → **Groups**
**Atau:** Cloud Identity → Groups

---

## Apa itu Google Groups di IAM?

Google Groups memungkinkan kamu mengelola **akses banyak user sekaligus**. Daripada assign role ke setiap user satu per satu, assign role ke **group** — semua member group otomatis mendapat akses.

```
Tanpa Groups (per user):

  IAM Policy:
  ├── alice@example.com   → roles/editor
  ├── bob@example.com     → roles/editor
  ├── charlie@example.com → roles/editor
  ├── david@example.com   → roles/editor
  └── eve@example.com     → roles/editor

  5 bindings untuk 1 role → sulit manage!
  User baru? → harus edit IAM lagi
  User resign? → harus edit IAM lagi


Dengan Groups:

  Google Group: backend-team@example.com
  Members: alice, bob, charlie, david, eve

  IAM Policy:
  └── backend-team@example.com → roles/editor

  1 binding saja! ✅
  User baru? → add ke group → otomatis dapat akses
  User resign? → remove dari group → otomatis kehilangan akses
```

```
Flow Groups vs Individual:

  ┌─────────────────────────────┐    ┌─────────────────────────────┐
  │  TANPA GROUPS               │    │  DENGAN GROUPS              │
  │                             │    │                             │
  │  Onboard:                   │    │  Onboard:                   │
  │  1. IAM → Grant Access      │    │  1. Groups → Add member     │
  │  2. Add email               │    │     (1 langkah, selesai!)   │
  │  3. Select role             │    │                             │
  │  4. Save                    │    │  Offboard:                  │
  │  (repeat per project!)      │    │  1. Groups → Remove member  │
  │                             │    │     (1 langkah, selesai!)   │
  │  Offboard:                  │    │                             │
  │  1. IAM → Find user         │    │  Semua projects otomatis    │
  │  2. Remove roles            │    │  ter-update ✅              │
  │  3. Save                    │    │                             │
  │  (repeat per project!)      │    │                             │
  └─────────────────────────────┘    └─────────────────────────────┘
```

---

## Step 1: Buka Groups

```
Console → IAM & Admin → Groups

  ATAU: console.cloud.google.com/iam-admin/groups
```

### Halaman Groups

```
┌───────────────────────────────────────────────────────────────────────┐
│  Groups                                                               │
│                                                                       │
│  [CREATE]                                                             │
│                                                                       │
│  ≡ Filter groups                                                      │
│                                                                       │
│  ┌──────────────────┬────────────────────────────┬──────────────────┐│
│  │ Name             │ Email                       │ Members          ││
│  ├──────────────────┼────────────────────────────┼──────────────────┤│
│  │ Backend Team     │ backend-team@example.com    │ 5 members        ││
│  │ DevOps Team      │ devops@example.com          │ 3 members        ││
│  │ Frontend Team    │ frontend-team@example.com   │ 4 members        ││
│  └──────────────────┴────────────────────────────┴──────────────────┘│
│                                                                       │
│  (Jika belum ada group):                                              │
│  "No groups found."                                                   │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Step 2: Create Group

Klik **[CREATE]**.

### Console: Create Group Form

```
┌───────────────────────────────────────────────────────────────────────┐
│  Create group                                                         │
│                                                                       │
│  Group details                                                        │
│                                                                       │
│  Group name *                                                         │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ Backend Team                                                  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Group email *                                                        │
│  ┌──────────────────────────────────────┐ @ ┌──────────────────┐    │
│  │ backend-team                          │   │ example.com    ▼│    │
│  └──────────────────────────────────────┘   └──────────────────┘    │
│                                                                       │
│  Description                                                          │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ Backend developers with access to web-prod and web-staging   │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Labels                                                               │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ (optional)                                                    │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│                                          [SUBMIT]  [CANCEL]           │
└───────────────────────────────────────────────────────────────────────┘
```

| Field | Fungsi | Aturan |
|-------|--------|--------|
| **Group name** | Nama tampilan group | Deskriptif — mudah dikenali |
| **Group email** | Email address group (dipakai di IAM) | Unique di domain |
| **Description** | Penjelasan fungsi group | Optional tapi recommended |

**Naming convention:**

```
{tim/fungsi}-{detail}@domain

Contoh:
  backend-team@example.com       ← tim backend
  devops@example.com             ← tim DevOps
  prod-admins@example.com        ← admin production
  staging-developers@example.com ← developer staging
  security-team@example.com      ← tim security
  data-analysts@example.com      ← data analyst
```

---

## Step 3: Manage Members

Setelah group dibuat, klik group → **View group details**.

### Console: Group Details — Members

```
┌───────────────────────────────────────────────────────────────────────┐
│  ← Backend Team (backend-team@example.com)                            │
│                                                                       │
│  MEMBERS  │  SETTINGS                                                 │
│  ─────────                                                            │
│                                                                       │
│  [ADD MEMBER]                                                         │
│                                                                       │
│  ┌───────────────────────┬────────────────┬──────────────────────┐   │
│  │ Member                │ Role           │ Join date             │   │
│  ├───────────────────────┼────────────────┼──────────────────────┤   │
│  │ ☐ alice@example.com   │ OWNER          │ Mar 15, 2026         │   │
│  │ ☐ bob@example.com     │ MEMBER         │ Mar 16, 2026         │   │
│  │ ☐ charlie@example.com │ MEMBER         │ Mar 20, 2026         │   │
│  └───────────────────────┴────────────────┴──────────────────────┘   │
│                                                                       │
│  Actions: [REMOVE MEMBERS] (select checkbox dulu)                     │
└───────────────────────────────────────────────────────────────────────┘
```

### Add Member

```
  [ADD MEMBER] → dialog:

  ┌──────────────────────────────────────────────────────────────┐
  │  Add members                                                  │
  │                                                              │
  │  New members *                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ david@example.com                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Roles *                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ MEMBER                                              ▼│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Pilihan roles:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ OWNER     ← full control group (add/remove members)  │    │
  │  │ MANAGER   ← manage members, tidak bisa delete group  │    │
  │  │ MEMBER    ← anggota biasa (default)                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │                            [ADD]  [CANCEL]                    │
  └──────────────────────────────────────────────────────────────┘
```

| Group Role | Fungsi dalam Group | IAM Impact |
|------------|-------------------|------------|
| **OWNER** | Full control — manage group, add/remove members, delete group | Sama dengan MEMBER dari segi IAM (group role ≠ IAM role) |
| **MANAGER** | Manage members — add/remove | Sama dengan MEMBER dari segi IAM |
| **MEMBER** | Anggota biasa | Mendapat semua IAM roles yang di-assign ke group |

**Penting:** Group role (OWNER/MANAGER/MEMBER) adalah **role di dalam group** — bukan IAM role. Semua members (termasuk OWNER/MANAGER/MEMBER) mendapat **IAM roles yang sama** yang di-assign ke group.

---

## Step 4: Assign IAM Role ke Group

Setelah group dibuat, assign role di IAM:

```
Console → IAM → GRANT ACCESS

  New principals: backend-team@example.com
  Role: Editor (project web-staging)
  [SAVE]

  → Semua members group (alice, bob, charlie, david)
     mendapat Editor di web-staging ✅
```

---

## Flow Skenario

### Onboarding Developer Baru

```
Skenario: Eve (developer baru) join tim backend

  Step 1: Add Eve ke group
  │  Console → Groups → Backend Team → ADD MEMBER
  │  Email: eve@example.com
  │  Role: MEMBER
  │  [ADD]
  │
  ▼
  Step 2: Eve otomatis dapat semua akses
  │  Group "backend-team@" punya:
  │  ├── roles/editor di project web-staging
  │  ├── roles/viewer di project web-prod
  │  └── roles/container.developer di project gke-prod
  │
  │  Eve otomatis dapat SEMUA roles di atas ✅
  │  Tanpa edit IAM di project manapun!
  │
  ▼
  Selesai! (1 langkah saja)
```

### Offboarding / Resign

```
Skenario: Bob resign dari perusahaan

  Step 1: Remove Bob dari group
  │  Console → Groups → Backend Team → ☐ bob@ → REMOVE
  │
  ▼
  Step 2: Bob otomatis kehilangan semua akses
  │  ├── Tidak bisa akses web-staging ❌
  │  ├── Tidak bisa akses web-prod ❌
  │  └── Tidak bisa akses gke-prod ❌
  │
  ▼
  Selesai! (1 langkah saja)

  Catatan: Jika Bob juga punya individual IAM roles,
  hapus juga di IAM → edit Bob → remove roles
```

### Multi-Project Access

```
Skenario: Tim backend perlu akses 3 projects

  Tanpa Groups (12 IAM edits):
    Project 1: add alice, bob, charlie, david → Editor
    Project 2: add alice, bob, charlie, david → Viewer
    Project 3: add alice, bob, charlie, david → Developer

  Dengan Groups (3 IAM edits):
    Project 1: add backend-team@... → Editor
    Project 2: add backend-team@... → Viewer
    Project 3: add backend-team@... → Developer

  Setiap ada member baru?
    Tanpa Groups: edit 3 projects
    Dengan Groups: add 1 member ke group → done ✅
```

---

## Kelebihan & Kekurangan Groups

| Kelebihan | Kekurangan |
|-----------|------------|
| **Scalable** — manage ratusan user dengan 1 group | Butuh Google Workspace atau Cloud Identity |
| **Onboard/offboard instant** — add/remove dari group | Semua members dapat role yang sama (tidak granular) |
| **Audit mudah** — lihat siapa di group apa | Nested groups bisa jadi complex |
| **Multi-project** — 1 group, banyak project | Group management butuh separate permission |
| **Best practice** Google | — |

---

*Dokumen ini berdasarkan fitur Groups di Google Cloud Console per Maret 2025–2026.*
