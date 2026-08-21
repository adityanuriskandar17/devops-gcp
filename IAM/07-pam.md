# Privileged Access Manager (PAM)

Dokumentasi lengkap **Privileged Access Manager** — fitur **Just-in-Time (JIT) access** untuk memberikan akses elevated/admin secara **sementara** dengan approval workflow.

**Console:** IAM & Admin → **Privileged Access Manager**
**Atau:** Security → Privileged Access Manager

---

## Apa itu PAM?

PAM memungkinkan user **meminta akses elevated sementara** (misalnya admin access) yang harus di-**approve** dan otomatis **expired** setelah durasi tertentu. Menghilangkan kebutuhan **standing privileges** (akses admin permanen).

```
Tanpa PAM (Standing Privileges):

  alice@... → roles/owner (PERMANEN)
       │
       ├── 24/7 punya akses Owner
       ├── Bahkan saat tidak butuh
       ├── Jika account compromised → full access ❌
       └── Risiko accidental damage tinggi ❌


Dengan PAM (Just-in-Time Access):

  alice@... → roles/viewer (PERMANEN, minimal)
       │
       │ Butuh admin access?
       ▼
  PAM: Request elevated access
       │  Role: roles/owner
       │  Duration: 2 jam
       │  Justification: "Fix production database issue"
       │
       ▼
  Approver: Review → APPROVE ✅
       │
       ▼
  alice@... → roles/owner (SEMENTARA — 2 jam saja!)
       │
       │ ... alice fix issue ...
       │
       ▼
  2 jam kemudian → roles/owner otomatis DICABUT
  alice@... → kembali roles/viewer saja ✅

  Jika account compromised di hari biasa → hanya Viewer (minimal damage)
```

---

## Cara Kerja PAM

```
PAM Flow:

  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
  │  ENTITLEMENT │     │  GRANT       │     │  AUTO-REVOKE    │
  │  (template)  │     │  REQUEST     │     │                 │
  │              │     │              │     │                 │
  │  Siapa boleh │     │  User minta  │     │  Setelah durasi │
  │  minta apa,  │────►│  akses,      │────►│  → role otomatis│
  │  berapa lama,│     │  approver    │     │    dicabut      │
  │  siapa       │     │  review &    │     │                 │
  │  approve     │     │  approve     │     │                 │
  └─────────────┘     └──────────────┘     └─────────────────┘
```

### Komponen PAM

| Komponen | Fungsi | Contoh |
|----------|--------|--------|
| **Entitlement** | Template yang menentukan: siapa boleh minta, role apa, berapa lama, siapa approve | "Backend devs boleh minta roles/owner max 4 jam, approve oleh lead" |
| **Grant** | Request aktual dari user berdasarkan entitlement | "Alice minta roles/owner selama 2 jam untuk fix DB" |
| **Approver** | Orang yang review dan approve/deny grant request | Lead engineer, security team |
| **Justification** | Alasan kenapa user butuh akses | "Production database migration" |
| **Duration** | Berapa lama akses diberikan | 1 jam, 2 jam, 4 jam (max sesuai entitlement) |

---

## Console: Halaman PAM

```
Console → IAM & Admin → Privileged Access Manager

┌───────────────────────────────────────────────────────────────────────┐
│  Privileged Access Manager                                            │
│                                                                       │
│  ┌────────────────┬──────────────┬─────────────┐                     │
│  │ ENTITLEMENTS   │ GRANTS       │ MY GRANTS   │                     │
│  └────────────────┴──────────────┴─────────────┘                     │
│                                                                       │
│  (Tab content depends on selection)                                   │
└───────────────────────────────────────────────────────────────────────┘
```

### Tab: ENTITLEMENTS

Daftar semua entitlement yang sudah dibuat.

```
  ENTITLEMENTS

  [+ CREATE ENTITLEMENT]

  ┌──────────────────┬──────────────┬──────────┬────────────┬────────┐
  │ Name             │ Roles        │ Max      │ Eligible   │ Status │
  │                  │              │ duration │ requesters │        │
  ├──────────────────┼──────────────┼──────────┼────────────┼────────┤
  │ prod-admin-      │ roles/owner  │ 4 hours  │ backend-   │ Active │
  │ access           │              │          │ team@...   │        │
  │                  │              │          │            │        │
  │ db-admin-        │ roles/       │ 2 hours  │ dba-team@  │ Active │
  │ emergency        │ cloudsql.    │          │ ...        │        │
  │                  │ admin        │          │            │        │
  └──────────────────┴──────────────┴──────────┴────────────┴────────┘
```

### Tab: GRANTS

Daftar semua grant requests (active, approved, expired).

```
  GRANTS

  ┌──────────────┬────────────┬──────────┬──────────┬──────────────┐
  │ Requester    │ Entitlement│ Duration │ Status   │ Expires      │
  ├──────────────┼────────────┼──────────┼──────────┼──────────────┤
  │ alice@...    │ prod-admin │ 2 hours  │ Active   │ 16:30 today  │
  │ bob@...      │ db-admin   │ 1 hour   │ Approval │ —            │
  │              │            │          │ awaited  │              │
  │ charlie@...  │ prod-admin │ 4 hours  │ Expired  │ yesterday    │
  └──────────────┴────────────┴──────────┴──────────┴──────────────┘
```

### Tab: MY GRANTS

Grant requests milik user yang sedang login.

---

## Step 1: Create Entitlement

Klik **[+ CREATE ENTITLEMENT]**.

### Console: Create Entitlement Form

```
┌───────────────────────────────────────────────────────────────────────┐
│  Create entitlement                                                   │
│                                                                       │
│  ━━━━━━━━ Entitlement details ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  Entitlement name *                                                   │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ prod-admin-access                                             │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ━━━━━━━━ Roles to grant ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  Roles *                                                              │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ roles/owner                                                 ▼│    │
│  └──────────────────────────────────────────────────────────────┘    │
│  [+ ADD ANOTHER ROLE]                                                 │
│                                                                       │
│  ━━━━━━━━ Maximum grant duration ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  Maximum duration *                                                   │
│  ┌──────────┐                                                        │
│  │ 4 hours  │                                                        │
│  └──────────┘                                                        │
│                                                                       │
│  ━━━━━━━━ Eligible requesters ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  Principals who can request this entitlement *                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ backend-team@example.com                                      │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ━━━━━━━━ Approval workflow ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  ☑ Require approval                                                   │
│                                                                       │
│  Approvers *                                                          │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ lead-engineers@example.com                                    │    │
│  └──────────────────────────────────────────────────────────────┘    │
│  [+ ADD APPROVER]                                                     │
│                                                                       │
│  ━━━━━━━━ Additional settings ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  ☑ Require justification from requester                               │
│                                                                       │
│  Notification emails (optional)                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ security-alerts@example.com                                   │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│                            [CREATE]  [CANCEL]                         │
└───────────────────────────────────────────────────────────────────────┘
```

### Penjelasan Setiap Field

| Field | Fungsi | Contoh |
|-------|--------|--------|
| **Entitlement name** | Nama identifikasi entitlement | `prod-admin-access`, `db-emergency` |
| **Roles** | IAM roles yang akan di-grant sementara | `roles/owner`, `roles/cloudsql.admin` |
| **Maximum duration** | Durasi maksimal grant | 1 jam, 2 jam, 4 jam, 8 jam, 24 jam |
| **Eligible requesters** | Siapa yang boleh request (user, group) | `backend-team@example.com` |
| **Require approval** | Apakah perlu di-approve? | Checkbox — jika unchecked, auto-approved |
| **Approvers** | Siapa yang approve (user, group) | `lead-engineers@example.com` |
| **Require justification** | Requester harus isi alasan | Checkbox — recommended ✅ |
| **Notification emails** | Email tambahan yang di-notifikasi | `security-alerts@example.com` |

---

## Step 2: Request Grant (User Side)

User yang eligible bisa request grant:

```
Console → Privileged Access Manager → MY GRANTS tab

  My entitlements:
  ┌──────────────────┬──────────────┬──────────┬──────────────────┐
  │ Entitlement      │ Roles        │ Max      │ Action           │
  ├──────────────────┼──────────────┼──────────┼──────────────────┤
  │ prod-admin-      │ roles/owner  │ 4 hours  │ [REQUEST GRANT]  │
  │ access           │              │          │                  │
  └──────────────────┴──────────────┴──────────┴──────────────────┘
```

Klik **[REQUEST GRANT]**:

```
┌───────────────────────────────────────────────────────────────────────┐
│  Request grant                                                        │
│                                                                       │
│  Entitlement: prod-admin-access                                       │
│  Roles: roles/owner                                                   │
│                                                                       │
│  Duration *                                                           │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ 2 hours                                                       │    │
│  └──────────────────────────────────────────────────────────────┘    │
│  (Maximum: 4 hours)                                                   │
│                                                                       │
│  Justification *                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ Need to fix production database connection pool issue.        │    │
│  │ Ticket: PROD-1234                                             │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Additional notification emails (optional)                            │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ manager@example.com                                           │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│                            [REQUEST GRANT]  [CANCEL]                  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Step 3: Approve/Deny Grant (Approver Side)

Approver menerima notifikasi dan bisa approve/deny:

```
Console → Privileged Access Manager → GRANTS tab

  Pending approval:
  ┌──────────────┬────────────┬──────────┬──────────────────────────┐
  │ Requester    │ Role       │ Duration │ Justification            │
  ├──────────────┼────────────┼──────────┼──────────────────────────┤
  │ alice@...    │ roles/     │ 2 hours  │ Fix production DB        │
  │              │ owner      │          │ connection. PROD-1234    │
  │              │            │          │                          │
  │              │            │          │ [APPROVE]  [DENY]        │
  └──────────────┴────────────┴──────────┴──────────────────────────┘
```

---

## Flow End-to-End

```
  ━━━━━ Setup (Admin — 1x saja) ━━━━━

  Admin: Create entitlement
  │  Name: "prod-admin-access"
  │  Role: roles/owner
  │  Max duration: 4 hours
  │  Requesters: backend-team@example.com
  │  Approvers: lead-engineers@example.com
  │  Require justification: ☑
  │
  ▼

  ━━━━━ Request (User — setiap kali butuh) ━━━━━

  Alice: "Saya butuh admin access untuk fix bug"
  │
  │  Console → PAM → REQUEST GRANT
  │  Duration: 2 hours
  │  Justification: "Fix DB issue PROD-1234"
  │
  ▼

  ━━━━━ Approval (Approver) ━━━━━

  Lead Engineer: mendapat notifikasi email
  │
  │  Console → PAM → GRANTS → Review request
  │  "Alice minta Owner 2 jam untuk fix DB issue"
  │  [APPROVE]
  │
  ▼

  ━━━━━ Access Active ━━━━━

  Alice: roles/owner ACTIVE (2 jam countdown)
  │
  │  Alice bisa:
  │  ├── Akses production Console ✅
  │  ├── Fix database issue ✅
  │  ├── Restart services ✅
  │  └── Semua Owner permissions ✅
  │
  ▼

  ━━━━━ Auto-Revoke (2 jam kemudian) ━━━━━

  System: roles/owner otomatis DICABUT
  │
  │  Alice kembali ke roles/viewer saja
  │  Audit Log: "PAM grant expired for alice@..."
  │
  ▼
  ✅ Zero standing privileges maintained

  Timeline:
  ┌──────────────────────────────────────────────────┐
  │  14:00    14:05      14:10        16:10          │
  │  │        │          │            │              │
  │  Request  Approved   Access       Auto-Revoked   │
  │           (lead)     Active       (Owner gone)   │
  │                      (Owner)                     │
  │           ├──────────┤            │              │
  │           waiting    2 hours      back to        │
  │                      countdown    Viewer only    │
  └──────────────────────────────────────────────────┘
```

---

## Skenario: Emergency Access Tanpa Approval

```
Entitlement: "emergency-break-glass"
  Roles: roles/owner
  Max duration: 1 hour
  Requesters: oncall-engineers@example.com
  Require approval: ☐ UNCHECKED (auto-approved!)
  Require justification: ☑

  Saat incident:
  1. On-call engineer request grant
  2. AUTO-APPROVED (tidak perlu menunggu approval!)
  3. 1 jam access → fix issue
  4. Auto-revoke

  ⚠ Gunakan hanya untuk true emergencies
  ⚠ Semua aksi tetap tercatat di Audit Log
```

---

## Grant Status Lifecycle

```
  Request submitted
       │
       ├── Approval required?
       │   ├── Ya → Status: APPROVAL AWAITED
       │   │        │
       │   │        ├── Approved → Status: ACTIVE (countdown)
       │   │        │                │
       │   │        │                └── Duration expired → EXPIRED
       │   │        │
       │   │        ├── Denied → Status: DENIED
       │   │        │
       │   │        └── 24 jam no response → Status: EXPIRED
       │   │
       │   └── Tidak → Status: ACTIVE (auto-approved, countdown)
       │                  │
       │                  └── Duration expired → EXPIRED
       │
       └── User cancel → Status: CANCELLED
```

| Status | Arti |
|--------|------|
| **Approval awaited** | Menunggu approver review (max 24 jam) |
| **Active** | Grant active — user punya elevated roles |
| **Expired** | Durasi habis — roles otomatis dicabut |
| **Denied** | Approver reject request |
| **Cancelled** | User cancel request sendiri |
| **Revoked** | Admin revoke grant sebelum durasi habis |

---

## PAM vs IAM Conditions (Access Expiry)

| Aspek | PAM | IAM Condition (Access Expiry) |
|-------|-----|------------------------------|
| **Approval workflow** | Ya — approver review | Tidak — langsung active |
| **Justification** | Ya — wajib (jika diset) | Tidak — tanpa alasan |
| **On-demand** | Ya — user request kapan butuh | Tidak — admin set di awal |
| **Audit trail** | Full — request, approval, expiry | Basic — hanya IAM change |
| **Self-service** | Ya — user request sendiri | Tidak — admin harus configure |
| **Emergency access** | Ya — auto-approve option | Tidak ada emergency mode |
| **Cocok untuk** | Elevated/admin access | Contractor temporary access |

---

## Kelebihan & Kekurangan PAM

| Kelebihan | Kekurangan |
|-----------|------------|
| **Zero standing privileges** — admin access hanya saat dibutuhkan | Memerlukan setup entitlements |
| **Approval workflow** — control siapa yang approve | Approval bisa menambah delay |
| **Auto-revoke** — tidak ada lupa cabut akses | — |
| **Justification** — audit trail kenapa akses diminta | — |
| **Self-service** — user request sendiri | — |
| **Emergency mode** — auto-approve untuk on-call | — |
| **Multi-level approval** — native, sampai 2 level approval berurutan, max 5 approver per level (tidak butuh Cloud Armor Enterprise atau SCC Premium) | — |

---

*Dokumen ini berdasarkan fitur Privileged Access Manager di Google Cloud Console per Maret 2025–2026.*
