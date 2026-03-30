# Create Security Policy — Console Walkthrough

Dokumentasi langkah-langkah membuat **Security Policy** Cloud Armor di Google Cloud Console.

**Console:** Network Security → Cloud Armor → **Create policy**

**Prasyarat:**
- Role minimal: **Compute Security Admin** (`roles/compute.securityAdmin`)
- Load Balancer sudah ada (untuk backend security policy)

---

## Step 1: Buka Cloud Armor

```
Console → Navigation menu → Network Security → Cloud Armor

  ATAU langsung: console.cloud.google.com/net-security/securitypolicies
```

### Halaman Cloud Armor Policies

```
┌───────────────────────────────────────────────────────────────────────┐
│  Cloud Armor                                                          │
│                                                                       │
│  Policies   |   Threat Intelligence                                   │
│  ─────────────────────────────────────                                │
│                                                                       │
│  [+ CREATE POLICY]                  🔍 Filter policies                │
│                                                                       │
│  ┌──────────────┬──────────┬──────────┬────────────┬───────────────┐ │
│  │ Name         │ Type     │ Rules    │ Targets    │ Adaptive Prot │ │
│  ├──────────────┼──────────┼──────────┼────────────┼───────────────┤ │
│  │ my-waf-policy│ Backend  │ 5 rules  │ 2 backends │ Enabled       │ │
│  │ cdn-policy   │ Edge     │ 2 rules  │ 1 backend  │ —             │ │
│  └──────────────┴──────────┴──────────┴────────────┴───────────────┘ │
│                                                                       │
│  (Jika belum ada policy):                                             │
│  "No security policies found. Create a policy to get started."        │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Step 2: Create Policy

Klik **+ CREATE POLICY**.

### Console: Halaman Create Security Policy — Layout Lengkap (Stepper)

Console menggunakan **stepper/wizard** — halaman dibagi menjadi **section-section** yang di-expand satu per satu dengan tombol [NEXT STEP].

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ← Create security policy                                                │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ ⓘ Cloud Armor advanced network DDoS protection is now generally    │  │
│  │   available to protect applications and services using Network     │  │
│  │   Load Balancer, Protocol Forwarding, or VMs with Public IP.      │  │
│  │   Learn more ↗                                                     │  │
│  │   DISMISS                                                          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  A security policy contains one or more rules. Rules tell your security   │
│  policy what to do (action) and when to do it (condition). Targets are    │
│  where the rule is applied. Learn more ↗                                  │
│                                                                           │
│  ● Configure policy                       ← blue dot, ACTIVE (expanded)  │
│  │                                                                        │
│  │  Name *                                                                │
│  │  ┌──────────────────────────────────────────────┐ ⓘ                   │
│  │  │ fc-policy-1                                   │                     │
│  │  └──────────────────────────────────────────────┘                     │
│  │  Lowercase letters, numbers, hyphens allowed                           │
│  │                                                                        │
│  │  Description                                                           │
│  │  ┌──────────────────────────────────────────────┐                     │
│  │  │                                               │                     │
│  │  └──────────────────────────────────────────────┘                     │
│  │                                                                        │
│  │  Policy type                                                           │
│  │  ● Backend security policy                                            │
│  │  ○ Edge security policy                                               │
│  │  ○ Network edge security policy                                       │
│  │                                                                        │
│  │  Scope                                                                 │
│  │  ● Global                                                             │
│  │  ○ Regional                                                           │
│  │                                                                        │
│  │  Default rule action ⓘ                                                │
│  │  Action *                                                              │
│  │  ┌──────────────────────────────────────────────┐                     │
│  │  │ Deny                                        ▼│                     │
│  │  └──────────────────────────────────────────────┘                     │
│  │                                                                        │
│  │  Response code *                                                       │
│  │  ┌──────────────────────────────────────────────┐                     │
│  │  │ 403 (Forbidden)                             ▼│                     │
│  │  └──────────────────────────────────────────────┘                     │
│  │                                                                        │
│  │  [NEXT STEP]                                                           │
│  │                                                                        │
│  ● Add more rules (optional)               ← collapsed, next step        │
│  │                                                                        │
│  ● Apply policy to targets                  ← collapsed, next step        │
│                                                                           │
│  [CREATE POLICY]  [CANCEL]                                                │
└───────────────────────────────────────────────────────────────────────────┘
```

### Penjelasan Layout

| Area | Fungsi |
|------|--------|
| **← Create security policy** | Back button + judul halaman |
| **Info banner (biru)** | Notifikasi bahwa advanced network DDoS sekarang GA. Bisa di-dismiss |
| **Deskripsi di bawah banner** | Penjelasan singkat apa itu security policy, rules, dan targets |
| **Stepper (● section-section)** | Wizard dengan expand/collapse — section aktif ditandai **blue dot** |
| **[NEXT STEP]** | Tombol di setiap section untuk lanjut ke section berikutnya |
| **[CREATE POLICY] [CANCEL]** | Tombol di bawah untuk create atau cancel |

---

### Section 1: Configure Policy

Section pertama — **active by default** (expanded, blue dot).

#### Name

```
  Name *
  ┌──────────────────────────────────────────────┐ ⓘ
  │ fc-policy-1                                   │
  └──────────────────────────────────────────────┘
  Lowercase letters, numbers, hyphens allowed
```

| Field | Aturan | Detail |
|-------|--------|--------|
| **Name** | Required | **Lowercase** letters, numbers, hyphens only. Unik per project. Tidak bisa diubah setelah dibuat |
| **Description** | Optional | Deskripsi bebas untuk identifikasi policy |

**Naming convention:**

```
{app/service}-{environment}-{purpose}

Contoh:
  webapp-prod-waf           ← WAF untuk web app production
  api-prod-rate-limit       ← rate limiting untuk API
  cdn-global-edge           ← edge policy untuk CDN
  admin-whitelist           ← whitelist IP admin
```

#### Policy Type

```
  Policy type

  ● Backend security policy
  ○ Edge security policy
  ○ Network edge security policy
```

| Type | Kapan Dipilih | Fitur yang Tersedia |
|------|-------------|-------------------|
| **Backend security policy** (default) | Web app di belakang HTTP(S) LB — **paling umum** | WAF, rate limiting, adaptive protection, bot management, geo-block, IP filter, custom CEL |
| **Edge security policy** | Content di CDN/Cloud Storage | IP filter, geo-block, custom expression (tanpa WAF, tanpa rate limit) |
| **Network edge security policy** | TCP/UDP service di Network LB | Advanced network DDoS (Enterprise only), byte offset filtering |

#### Scope

```
  Scope

  ● Global
  ○ Regional
```

| Scope | Arti | Kapan Digunakan |
|-------|------|----------------|
| **Global** (default) | Policy berlaku di **semua region** — di-enforce di semua Google Edge PoP | **Paling umum** — untuk global external Application LB |
| **Regional** | Policy berlaku di **1 region** saja | Untuk regional internal Application LB atau regional external Application LB |

```
Global:
  User Asia    → PoP Jakarta    → Cloud Armor evaluate ✅
  User Europe  → PoP Frankfurt  → Cloud Armor evaluate ✅
  User US      → PoP Virginia   → Cloud Armor evaluate ✅
  → Semua PoP menerapkan policy yang SAMA

Regional (asia-southeast2):
  User Asia    → PoP Jakarta    → Cloud Armor evaluate ✅
  User Europe  → traffic route ke asia-southeast2 → Cloud Armor evaluate ✅
  → Policy hanya di-enforce di region tersebut
```

| Kelebihan Global | Kekurangan Global |
|-----------------|-------------------|
| Protect di semua edge PoP worldwide | Hanya untuk global external LB |
| Latency rendah (evaluate di PoP terdekat) | — |

| Kelebihan Regional | Kekurangan Regional |
|--------------------|---------------------|
| Untuk regional/internal LB | Hanya protect di 1 region |
| Comply dengan regional requirement | — |

#### Default Rule Action

```
  Default rule action ⓘ

  Action *
  ┌──────────────────────────────────────────────┐
  │ Deny                                        ▼│
  └──────────────────────────────────────────────┘

  (Jika Deny dipilih — muncul tambahan):
  Response code *
  ┌──────────────────────────────────────────────┐
  │ 403 (Forbidden)                             ▼│
  └──────────────────────────────────────────────┘
```

**Action dropdown:**

| Pilihan | Arti |
|---------|------|
| **Allow** | Default: semua traffic diizinkan, block yang spesifik (Blacklist approach) |
| **Deny** | Default: semua traffic di-block, allow yang spesifik (Whitelist approach) |

**Response code dropdown** (hanya muncul jika Action = Deny):

| Response Code | Arti | Kapan Digunakan |
|--------------|------|----------------|
| **403 (Forbidden)** | Request ditolak — jelas unauthorized | Default, paling umum |
| **404 (Not Found)** | Seolah-olah resource tidak ada | Sembunyikan keberadaan resource dari attacker |
| **502 (Bad Gateway)** | Seolah-olah server error | Buat attacker berpikir server down |

Default rule adalah rule dengan **priority paling rendah** (`2147483647`) yang akan match jika tidak ada rule lain yang match.

```
Blacklist approach (Action: Allow):

  Traffic masuk → Check rules
       │
       ├── Rule 1: Block IP 1.2.3.4? → DENY
       ├── Rule 2: Block SQLi pattern? → DENY
       ├── Rule 3: Block country XX? → DENY
       └── Default (priority MAX): ALLOW ← semua yang tidak match = diizinkan

Whitelist approach (Action: Deny + 403):

  Traffic masuk → Check rules
       │
       ├── Rule 1: Allow IP 10.0.0.0/8? → ALLOW
       ├── Rule 2: Allow office IP? → ALLOW
       └── Default (priority MAX): DENY 403 ← semua yang tidak match = di-block
```

| Kelebihan Blacklist (Allow) | Kekurangan Blacklist |
|----------------------------|---------------------|
| Mudah setup — tidak perlu list semua sumber | Bisa miss attack pattern baru |
| Cocok untuk public-facing apps | Harus terus update block rules |

| Kelebihan Whitelist (Deny) | Kekurangan Whitelist |
|---------------------------|---------------------|
| Sangat aman — hanya yang diizinkan bisa akses | Perlu maintain daftar IP/pattern yang boleh |
| Cocok untuk admin/internal tools | Tidak cocok untuk public-facing apps |

Klik **[NEXT STEP]** untuk lanjut ke section berikutnya.

---

### Section 2: Add More Rules (optional)

Setelah klik NEXT STEP, section ini ter-expand:

```
  ● Add more rules (optional)                ← blue dot, ACTIVE (expanded)
  │
  │  [+ ADD RULE]
  │
  │  (rules list — kosong saat pertama)
  │
  │  [NEXT STEP]
```

Klik **+ ADD RULE** → muncul form inline:

```
  ┌──────────────────────────────────────────────────────────────┐
  │  Add a rule                                                   │
  │                                                              │
  │  Description                                                  │
  │  ┌────────────────────────────────────────────────────┐      │
  │  │ Block known attacker IPs                            │      │
  │  └────────────────────────────────────────────────────┘      │
  │                                                              │
  │  Mode                                                         │
  │  ● Basic mode (IP addresses / IP address ranges only)        │
  │  ○ Advanced mode (custom rule expression)                     │
  │                                                              │
  │  Match                                                        │
  │  (tergantung mode — lihat detail di 03-rules.md)             │
  │                                                              │
  │  Action                                                       │
  │  ┌──────────────────────────────────┐                        │
  │  │ Allow / Deny / Throttle / ...  ▼│                        │
  │  └──────────────────────────────────┘                        │
  │                                                              │
  │  Priority *                                                   │
  │  ┌────────────────┐                                          │
  │  │ 1000            │                                          │
  │  └────────────────┘                                          │
  │                                                              │
  │  ☐ Enable rule in preview mode                               │
  │                                                              │
  │                            [ADD]  [CANCEL]                    │
  └──────────────────────────────────────────────────────────────┘
```

Rules bisa ditambahkan saat create policy atau nanti setelah policy dibuat.

Lihat penjelasan detail di [03-rules.md](03-rules.md).

---

### Section 3: Apply Policy to Targets

```
  ● Apply policy to targets                  ← blue dot, ACTIVE (expanded)
  │
  │  [+ ADD TARGET]
  │
  │  Klik → muncul dropdown:
  │  ┌──────────────────────────────────────────────────────┐
  │  │ Select a backend service                            ▼│
  │  └──────────────────────────────────────────────────────┘
  │
  │  Dropdown isi:
  │  ┌──────────────────────────────────────────────────────┐
  │  │ web-backend-service          (instance group)        │
  │  │ api-backend-service          (NEG)                   │
  │  │ media-backend-bucket         (Cloud Storage)         │
  │  └──────────────────────────────────────────────────────┘
```

**Target** adalah **backend service** dari Load Balancer yang ingin dilindungi.

| Penting | Detail |
|---------|--------|
| 1 backend service hanya bisa punya **1 security policy** | Jika sudah ada policy, harus detach dulu |
| 1 security policy bisa di-attach ke **banyak backend services** | Policy bersifat shared |
| Backend harus sudah ada sebelum attach | Buat Load Balancer + backend service terlebih dahulu |

---

### Flow Stepper: Cara Kerja Wizard

```
Section 1: Configure policy         ● (blue dot — ACTIVE, expanded)
     │
     │ [NEXT STEP]
     ▼
Section 2: Add more rules           ● (blue dot — ACTIVE, expanded)
  Section 1 → collapsed
     │
     │ [NEXT STEP]
     ▼
Section 3: Apply policy to targets  ● (blue dot — ACTIVE, expanded)
  Section 1, 2 → collapsed
     │
     ▼
[CREATE POLICY] → Policy dibuat!
```

**Catatan:** Kamu bisa klik section header yang sudah di-collapse untuk kembali edit section tersebut.

---

## Step 3: Policy Details (Setelah Dibuat)

Setelah policy dibuat, Console menampilkan halaman **Policy details**.

### Layout Halaman Policy Details

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Google Cloud   ⚙ fc-1 ▾        Search (/) for resources, docs...       │
├────────────────────┬──────────────────────────────────────────────────────┤
│                    │                                                      │
│  Network Security  │  ← Policy details       ✏ EDIT    🗑 DELETE POLICY  │
│                    │                                                      │
│  Secure Web Proxy  │  fc-armor-policy-1                                   │
│                    │                                                      │
│  Cloud Armor     ∧ │  Type         Backend security policy                │
│  ┃ Cloud Armor     │  Description                                         │
│  ┃   policies      │  Scope        asia-southeast2                        │
│  ┃ Adaptive        │                                                      │
│  ┃   Protection    │  ┌──────────────────┬───────────────────────┐       │
│  ┃ Cloud Armor     │  │ Contains         │ Applies to            │       │
│  ┃   Service Tier  │  │ 1 rule           │ 0 targets             │       │
│                    │  └──────────────────┴───────────────────────┘       │
│  Cloud IDS       ∧ │                                                      │
│  ┃ IDS Dashboard   │  ┌────────┬──────────┬────────┐                     │
│  ┃ IDS Endpoints   │  │ RULES  │ TARGETS  │ LOGS   │  ← tabs             │
│  ┃ IDS Threats     │  └────────┴──────────┴────────┘                     │
│                    │                                                      │
│  Cloud NGFW      ∧ │  Rules are evaluated by priority: Lower numbers     │
│  ┃ Dashboard       │  are evaluated first. Learn more ↗                   │
│  ┃ Firewall        │                                                      │
│  ┃   policies      │  ADD RULE    DELETE    MORE ▾                        │
│  ┃ Threats         │                                                      │
│  ┃ Firewall        │  ≡ Filter  Enter property name or value              │
│  ┃   endpoints     │                                                      │
│                    │  ┌────┬──────────────┬──────────────────┬────────┐  │
│  Common          ∧ │  │ ☐  │ Action       │ Type             │ Match  │  │
│  components        │  │    │              │                  │        │  │
│  ┃ Address groups  │  │    │              │                  │        │  │
│  ┃   [PREVIEW]     │  ├────┼──────────────┼──────────────────┼────────┤  │
│  ┃ Security        │  │ ☐  │ 🔴 Deny(403)│ IP addresses/    │ * (All │  │
│  ┃   profiles      │  │    │              │ ranges           │ IP     │  │
│  ┃ TLS inspection  │  │    │              │                  │ addres │  │
│  ┃   policies      │  │    │              │                  │ ses)   │  │
│  ┃ SSL policies    │  └────┴──────────────┴──────────────────┴────────┘  │
│  ┃ Client          │                                                      │
│  ┃   Authentication│  (tabel berlanjut →)                                 │
│                    │                                                      │
└────────────────────┴──────────────────────────────────────────────────────┘

(tabel kolom lanjutan):

  ┌─────────────────────────────────────────┬───────────────┬───┐
  │ Description                              │ Priority ↑    │ ⋮ │
  ├─────────────────────────────────────────┼───────────────┼───┤
  │ Default rule, higher priority overrides  │ 2,147,483,647 │ ⋮ │
  │ it                                       │               │   │
  └─────────────────────────────────────────┴───────────────┴───┘

  0 rules selected
```

### Penjelasan Layout

| Area | Fungsi |
|------|--------|
| **← Policy details** | Back button + judul halaman |
| **✏ EDIT** | Edit policy settings (nama, type, adaptive protection) |
| **🗑 DELETE POLICY** | Hapus policy |
| **Policy info** (atas) | Menampilkan **nama**, **Type**, **Description**, **Scope** |
| **Contains / Applies to** | Jumlah rules dan jumlah backend targets yang di-attach |
| **Tabs: RULES / TARGETS / LOGS** | 3 tab untuk melihat rules, targets, dan logs |

---

### Left Sidebar — Network Security

Sidebar kiri menampilkan **semua fitur Network Security** di GCP:

```
Network Security
│
├── Secure Web Proxy
│
├── Cloud Armor                    ← section ini
│   ├── Cloud Armor policies       ← halaman utama (list policies)
│   ├── Adaptive Protection        ← dashboard ML anomaly detection
│   └── Cloud Armor Service Tier   ← lihat & upgrade tier (Standard/Enterprise)
│
├── Cloud IDS
│   ├── IDS Dashboard              ← Intrusion Detection System overview
│   ├── IDS Endpoints              ← IDS endpoint management
│   └── IDS Threats                ← detected threats
│
├── Cloud NGFW
│   ├── Dashboard                  ← Next-Gen Firewall overview
│   ├── Firewall policies          ← hierarchical firewall policies
│   ├── Threats                    ← NGFW threat detection
│   └── Firewall endpoints         ← NGFW endpoint management
│
└── Common components
    ├── Address groups [PREVIEW]   ← reusable IP address groups
    ├── Security profiles          ← security profile groups
    ├── TLS inspection policies    ← TLS decryption policies
    ├── SSL policies               ← SSL/TLS configuration
    └── Client Authentication      ← mTLS client auth
```

| Sidebar Item | Fungsi |
|-------------|--------|
| **Cloud Armor policies** | List semua security policies — halaman utama Cloud Armor |
| **Adaptive Protection** | Dashboard untuk melihat ML-detected anomalies & suggested rules |
| **Cloud Armor Service Tier** | Lihat tier saat ini (Standard/Enterprise) dan upgrade |

---

### Tab: RULES

Tab default — menampilkan semua rules di policy.

```
  RULES    TARGETS    LOGS
  ─────

  Rules are evaluated by priority: Lower numbers are evaluated first.
  Learn more ↗

  ADD RULE    DELETE    MORE ▾

  ≡ Filter  Enter property name or value

  ┌────┬──────────────┬──────────────────┬───────────────────┐
  │ ☐  │ Action       │ Type             │ Match             │
  ├────┼──────────────┼──────────────────┼───────────────────┤
  │ ☐  │ 🔴 Deny(403)│ IP addresses/    │ * (All IP         │
  │    │              │ ranges           │ addresses)        │
  └────┴──────────────┴──────────────────┴───────────────────┘
  (continued →)
  ┌─────────────────────────────────────────┬───────────────┬───┐
  │ Description                              │ Priority ↑    │ ⋮ │
  ├─────────────────────────────────────────┼───────────────┼───┤
  │ Default rule, higher priority overrides  │ 2,147,483,647 │ ⋮ │
  │ it                                       │               │   │
  └─────────────────────────────────────────┴───────────────┴───┘

  0 rules selected
```

#### Kolom Rules Table

| Kolom | Fungsi |
|-------|--------|
| **☐** (checkbox) | Select rule untuk bulk delete |
| **Action** | Action yang dilakukan: `🔴 Deny (403)`, `🟢 Allow`, `🟡 Throttle`, dll |
| **Type** | Tipe match: `IP addresses/ranges` (basic mode) atau `Advanced expression` (advanced mode) |
| **Match** | Pattern yang di-match: `* (All IP addresses)`, IP range, atau CEL expression |
| **Description** | Deskripsi rule |
| **Priority ↑** | Angka priority (bisa sort ascending/descending) |
| **⋮** | Menu actions per rule (Edit, Delete) |

#### Action Buttons

| Button | Fungsi |
|--------|--------|
| **ADD RULE** | Tambah rule baru |
| **DELETE** | Hapus rule yang di-select (checkbox) |
| **MORE ▾** | Menu tambahan |

#### Default Rule

Policy baru selalu memiliki **1 default rule** yang otomatis dibuat:

| Property | Value |
|----------|-------|
| **Action** | Sesuai pilihan saat create (Allow atau Deny + response code) |
| **Type** | IP addresses/ranges |
| **Match** | `* (All IP addresses)` |
| **Description** | "Default rule, higher priority overrides it" |
| **Priority** | `2,147,483,647` (nilai maximum — paling terakhir dievaluasi) |

---

### Tab: TARGETS

Menampilkan backend services yang di-attach ke policy.

```
  RULES    TARGETS    LOGS
            ────────

  ┌───────────────────────────┬───────────────────────────────┐
  │ Backend service            │ Load Balancer                 │
  ├───────────────────────────┼───────────────────────────────┤
  │ web-backend-service        │ my-web-lb                     │
  │ api-backend-service        │ my-api-lb                     │
  └───────────────────────────┴───────────────────────────────┘

  (Jika 0 targets):
  "No targets. Attach this policy to backend services."
```

---

### Tab: LOGS

Menampilkan Cloud Logging entries untuk requests yang match rules.

```
  RULES    TARGETS    LOGS
                      ─────

  (Redirect ke Cloud Logging dengan filter:
   resource.type="http_load_balancer"
   jsonPayload.enforcedSecurityPolicy.name="fc-armor-policy-1")
```

---

### Actions per Rule (klik ⋮)

```
  ⋮ → Dropdown:
  ┌─────────────────────┐
  │ Edit                 │
  │ Delete               │
  └─────────────────────┘
```

---

## Flow End-to-End: Setup Cloud Armor untuk Web App

```
Step 1: Pastikan Load Balancer + Backend Service sudah ada
       │
       ▼
Step 2: Console → Network Security → Cloud Armor
       │
       ▼
Step 3: + CREATE POLICY
       │
       │  Name:          "webapp-prod-waf"
       │  Type:          Backend security policy
       │  Default rule:  Allow
       │  Adaptive:      ☑ Enable
       │
       ▼
Step 4: + ADD RULE (opsional, bisa nanti)
       │
       │  Rule 1: Block known bad IPs (priority 1000)
       │  Rule 2: WAF SQL injection (priority 2000)
       │  Rule 3: Rate limit /api/* (priority 3000)
       │
       ▼
Step 5: + ADD TARGET
       │
       │  Target: web-backend-service
       │
       ▼
Step 6: [CREATE POLICY]
       │
       ▼
✅ Web app dilindungi Cloud Armor!
   → DDoS blocked at edge
   → SQL injection detected & denied
   → Rate limiting active
   → Logs available di Cloud Logging
```

---

*Dokumen ini berdasarkan fitur Cloud Armor di Google Cloud Console per Maret 2025–2026.*
