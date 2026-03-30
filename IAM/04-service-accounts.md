# Service Accounts

Dokumentasi lengkap **Service Accounts** — identitas untuk **aplikasi/service** (bukan manusia), cara membuat, assign roles, keys, dan Workload Identity Federation.

**Console:** IAM & Admin → **Service Accounts**

---

## Apa itu Service Account?

Service Account adalah **akun khusus untuk aplikasi**, bukan untuk manusia. Digunakan agar VM, Cloud Function, GKE pod, CI/CD pipeline, dll bisa mengakses GCP resources.

```
Perbedaan User Account vs Service Account:

  User Account (manusia):
    alice@example.com → login via browser → akses Console
    → Authenticate: username + password + 2FA

  Service Account (aplikasi):
    my-app@project.iam.gserviceaccount.com → call GCP API
    → Authenticate: token (auto) atau JSON key
    → Tidak bisa login ke Console
```

```
Flow Service Account:

  Application (VM / Cloud Function / GKE Pod)
       │
       │ "Saya my-app@project.iam.gserviceaccount.com"
       │
       ▼
  GCP IAM: Verify identity
       │
       │ Check: my-app@ punya roles apa?
       │ → roles/storage.objectViewer (di project web-prod)
       │
       ▼
  GCP Storage API: request GET /bucket/my-object
       │
       │ Permission storage.objects.get? → ✅ (dari role)
       │
       ▼
  Object returned to application ✅
```

---

## Step 1: Buka Service Accounts

```
Console → IAM & Admin → Service Accounts

  ATAU: console.cloud.google.com/iam-admin/serviceaccounts
```

### Halaman Service Accounts

```
┌───────────────────────────────────────────────────────────────────────┐
│  Service accounts for project "fc-1-434201"                           │
│                                                                       │
│  [+ CREATE SERVICE ACCOUNT]                                           │
│                                                                       │
│  ≡ Filter                                                             │
│                                                                       │
│  ┌──────────────────┬────────────────────────────────┬──────────────┐│
│  │ Name             │ Email                           │ Description  ││
│  ├──────────────────┼────────────────────────────────┼──────────────┤│
│  │ ci-deploy-sa     │ ci-deploy-sa@fc-1-434201.iam   │ CI/CD deploy ││
│  │                  │ .gserviceaccount.com            │              ││
│  │                  │                                │              ││
│  │ Compute Engine   │ 123456-compute@developer       │ (Google-     ││
│  │ default service  │ .gserviceaccount.com            │  managed)    ││
│  │ account          │                                │              ││
│  └──────────────────┴────────────────────────────────┴──────────────┘│
│                                                                       │
│  ⓘ Google-managed service accounts are auto-created by Google and     │
│    should not be deleted.                                             │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Step 2: Create Service Account

Klik **[+ CREATE SERVICE ACCOUNT]**.

### Console: Create Service Account — Stepper (3 Steps)

```
┌───────────────────────────────────────────────────────────────────────┐
│  Create service account                                               │
│                                                                       │
│  ● Service account details         ← Step 1 (active)                 │
│  ○ Grant this service account access to project    ← Step 2          │
│  ○ Grant users access to this service account      ← Step 3          │
│                                                                       │
│  ━━━━━━━━ Step 1: Service account details ━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  Service account name *                                               │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ ci-deploy-sa                                                  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Service account ID *                                                 │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ ci-deploy-sa                                                  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│  ci-deploy-sa@fc-1-434201.iam.gserviceaccount.com                    │
│                                                                       │
│  Service account description                                          │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ Service account for CI/CD pipeline deployment                 │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│                    [CREATE AND CONTINUE]  [CANCEL]                     │
└───────────────────────────────────────────────────────────────────────┘
```

#### Step 1: Service Account Details

| Field | Fungsi |
|-------|--------|
| **Service account name** | Nama tampilan |
| **Service account ID** | Auto-generated dari name, jadi bagian email. Bisa diedit |
| **Email** (auto) | `{id}@{project}.iam.gserviceaccount.com` — immutable setelah create |
| **Description** | Penjelasan fungsi service account |

#### Step 2: Grant Access (Assign Roles)

```
  ━━━━━━━━ Step 2: Grant this service account access to project ━━━━

  Select a role
  ┌──────────────────────────────────────────────────────────────┐
  │ Kubernetes Engine Developer                                 ▼│
  └──────────────────────────────────────────────────────────────┘

  [+ ADD ANOTHER ROLE]

  Select a role
  ┌──────────────────────────────────────────────────────────────┐
  │ Storage Object Viewer                                       ▼│
  └──────────────────────────────────────────────────────────────┘

                              [CONTINUE]  [CANCEL]
```

Assign roles **langsung ke service account** saat create.

#### Step 3: Grant Users Access (Optional)

```
  ━━━━━━━━ Step 3: Grant users access to this service account ━━━━

  Service account users role
  ┌──────────────────────────────────────────────────────────────┐
  │ alice@example.com                                             │
  └──────────────────────────────────────────────────────────────┘
  Users who can use this service account (act as it)

  Service account admins role
  ┌──────────────────────────────────────────────────────────────┐
  │ admin@example.com                                             │
  └──────────────────────────────────────────────────────────────┘
  Users who can manage this service account

                              [DONE]  [CANCEL]
```

| Field | Role yang Diberikan | Fungsi |
|-------|-------------------|--------|
| **Service account users** | `roles/iam.serviceAccountUser` | User yang bisa **act as** service account ini (misal: attach ke VM) |
| **Service account admins** | `roles/iam.serviceAccountAdmin` | User yang bisa **manage** service account (edit, delete, create keys) |

---

## Authentication: Cara Service Account Authenticate

### Option A: Attached Service Account (Recommended)

VM, Cloud Function, GKE Pod bisa **attach service account** langsung — token otomatis tersedia tanpa key.

```
Flow attached service account:

  VM di-create dengan service account "ci-deploy-sa"
       │
       ▼
  VM automatically mendapat access token
  via metadata server (169.254.169.254)
       │
       ▼
  Application di VM call GCP API
  menggunakan token ini → AUTHENTICATED ✅
       │
       ▼
  Token auto-refresh setiap ~1 jam

  Tidak perlu JSON key!
  Tidak perlu manual token management!
```

```
Console: Compute Engine → Create VM → Identity and API access

  ┌──────────────────────────────────────────────────────────────┐
  │  Identity and API access                                      │
  │                                                              │
  │  Service account                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ci-deploy-sa@fc-1-434201.iam.gserviceaccount.com   ▼│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Access scopes                                                │
  │  ● Allow default access                                      │
  │  ○ Allow full access to all Cloud APIs                        │
  │  ○ Set access for each API                                    │
  └──────────────────────────────────────────────────────────────┘
```

| Kelebihan Attached SA | Kekurangan Attached SA |
|----------------------|------------------------|
| **Tidak ada key** — tidak bisa leak | Hanya untuk resources di GCP |
| Token auto-managed | Tidak bisa dipakai dari luar GCP |
| Best practice security | — |
| Zero maintenance | — |

### Option B: Workload Identity Federation (External → GCP)

Untuk workloads **di luar GCP** (GitHub Actions, AWS, Azure, on-premise) — exchange external token untuk GCP token.

```
Flow Workload Identity Federation:

  GitHub Actions Pipeline
       │
       │ "Saya GitHub OIDC token untuk repo X"
       │
       ▼
  Google Cloud Security Token Service (STS)
       │
       │ Verify: token valid? repo allowed?
       │ Exchange: GitHub token → GCP short-lived token
       │
       ▼
  Pipeline mendapat GCP access token (1 jam)
       │
       │ Token impersonate service account
       │ → mendapat permissions dari SA roles
       │
       ▼
  GCP API calls berhasil ✅

  Tidak perlu JSON key!
  Token short-lived (1 jam) → lebih aman!
```

| Kelebihan WIF | Kekurangan WIF |
|--------------|----------------|
| **Tidak ada long-lived key** | Setup lebih complex |
| Short-lived tokens (~1 jam) | Perlu configure identity pool & provider |
| Works with GitHub, AWS, Azure, OIDC | — |
| **Recommended** untuk external workloads | — |

### Option C: Service Account Key (Legacy — Tidak Recommended)

Download JSON key file — **risiko tinggi** karena key bisa leak.

```
Console: Service Accounts → (sa) → KEYS tab → ADD KEY → Create new key

  ┌──────────────────────────────────────────────────────────────┐
  │  Create private key                                           │
  │                                                              │
  │  Key type                                                     │
  │  ● JSON (recommended)                                        │
  │  ○ P12                                                       │
  │                                                              │
  │                            [CREATE]  [CANCEL]                 │
  └──────────────────────────────────────────────────────────────┘

  → Download: fc-1-434201-abc123.json
```

```
JSON key file content:

  {
    "type": "service_account",
    "project_id": "fc-1-434201",
    "private_key_id": "abc123...",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...",
    "client_email": "ci-deploy-sa@fc-1-434201.iam...",
    "client_id": "123456789",
    ...
  }
```

**⚠ RISIKO JSON KEY:**

```
Risiko:
  ├── Key bisa di-commit ke Git → exposed ke publik ❌
  ├── Key bisa di-copy oleh unauthorized person ❌
  ├── Key TIDAK expire → berlaku selamanya sampai di-delete ❌
  ├── Sulit audit siapa yang pakai key ❌
  └── Jika compromised → full access sebagai service account ❌
```

| Kelebihan Key | Kekurangan Key |
|--------------|----------------|
| Simple — download dan pakai | **Risiko leak sangat tinggi** |
| Works everywhere | Key tidak expire (harus manual delete) |
| | Sulit audit |
| | **Google strongly discourages** |

### Perbandingan Authentication Methods

| Method | Security | Convenience | Use Case |
|--------|----------|-------------|----------|
| **Attached SA** | ★★★★★ | ★★★★★ | GCP resources (VM, GKE, CF) |
| **Workload Identity Federation** | ★★★★★ | ★★★☆☆ | External (GitHub, AWS, Azure) |
| **Service Account Key** | ★★☆☆☆ | ★★★★☆ | Legacy, on-premise (avoid if possible) |

---

## Service Account Types

| Type | Dibuat Oleh | Contoh | Boleh Dihapus? |
|------|-----------|--------|---------------|
| **User-managed** | Kamu | `ci-deploy-sa@project.iam...` | Ya |
| **Default** | Google (per service) | `123456-compute@developer...` | **Jangan!** (bisa break service) |
| **Google-managed (agent)** | Google | `service-123@compute-system...` | **Jangan!** (internal Google) |

**Google-managed service accounts** (agents) otomatis dibuat oleh Google untuk internal operations. Jangan hapus atau ubah permissions-nya.

---

## Flow: Service Account untuk Berbagai Skenario

### Skenario 1: VM Perlu Akses Cloud Storage

```
  Step 1: Buat service account
          Name: "app-storage-sa"
          Role: Storage Object Viewer
       │
       ▼
  Step 2: Attach ke VM saat create
          VM → Identity and API access → app-storage-sa
       │
       ▼
  Step 3: App di VM bisa akses Storage
          gsutil ls gs://my-bucket → WORKS ✅
          Token auto-provided via metadata server
```

### Skenario 2: GitHub Actions Deploy ke GKE

```
  Step 1: Buat service account
          Name: "github-deploy-sa"
          Roles: GKE Developer + Artifact Registry Reader
       │
       ▼
  Step 2: Setup Workload Identity Federation
          Pool: "github-pool"
          Provider: "github-actions"
          Attribute: repo == "myorg/myrepo"
       │
       ▼
  Step 3: GitHub Actions workflow
          - uses: google-github-actions/auth@v2
            with:
              workload_identity_provider: "projects/123/..."
              service_account: "github-deploy-sa@project.iam..."
       │
       ▼
  Step 4: Deploy ke GKE
          kubectl apply -f deploy.yaml → SUCCESS ✅
```

### Skenario 3: Cloud Function Akses Cloud SQL

```
  Step 1: Buat service account
          Name: "cf-sql-sa"
          Role: Cloud SQL Client
       │
       ▼
  Step 2: Deploy Cloud Function dengan SA
          --service-account=cf-sql-sa@project.iam...
       │
       ▼
  Step 3: Function bisa connect ke Cloud SQL
          via Cloud SQL Auth Proxy → auto-authenticated ✅
```

---

*Dokumen ini berdasarkan fitur IAM di Google Cloud Console per Maret 2025–2026.*
