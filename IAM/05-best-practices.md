# Best Practices & Audit

Dokumentasi best practices IAM — **least privilege**, **audit logging**, organizational policies, dan checklist production.

**Console:** IAM & Admin → **Audit Logs** / **Organization Policies**

---

## Principle of Least Privilege

Prinsip utama IAM: berikan **hanya permissions yang dibutuhkan**, tidak lebih.

```
❌ Bad practice:

  Developer baru → kasih Owner role
  "Biar gampang, nanti aja dibatasin"
  │
  ├── Developer bisa hapus production database
  ├── Developer bisa ubah billing
  ├── Developer bisa invite siapa saja
  └── Accident = disaster

✅ Good practice:

  Developer baru → kasih role spesifik
  "Hanya yang dibutuhkan"
  │
  ├── roles/compute.viewer (project prod) → lihat saja
  ├── roles/editor (project staging) → develop & test
  └── Accident scope terbatas → aman
```

### Flow Menentukan Role yang Tepat

```
  Apa yang user/service perlu lakukan?
       │
       ▼
  List permissions yang dibutuhkan:
  (contoh: lihat VMs, deploy ke GKE, baca logs)
       │
       ▼
  Cari predefined role yang PALING KECIL scopenya:
       │
       ├── Hanya lihat VMs?
       │   → roles/compute.viewer (bukan roles/editor!)
       │
       ├── Deploy ke GKE?
       │   → roles/container.developer (bukan roles/container.admin!)
       │
       └── Baca logs?
           → roles/logging.viewer (bukan roles/logging.admin!)
       │
       ▼
  Assign role → test → user bisa kerja ✅
       │
       ▼
  Jika kurang permission?
  → Tambah role spesifik yang kurang
  → JANGAN upgrade ke role yang lebih broad!
```

---

## Audit Logs

IAM terintegrasi dengan **Cloud Audit Logs** — setiap perubahan IAM dan akses resource tercatat.

### Console: Audit Logs

```
Console → IAM & Admin → Audit Logs

  ┌──────────────────────────────────────────────────────────────┐
  │  Audit Logs                                                   │
  │                                                              │
  │  ⓘ Audit logs record who did what, where, and when           │
  │    within your Google Cloud resources.                        │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Data Access log type:                                 │    │
  │  │                                                      │    │
  │  │ Service            Admin  Data    Data                │    │
  │  │                    Read   Read    Write               │    │
  │  │ ────────────────── ────── ──────  ──────              │    │
  │  │ Cloud IAM          ☑      ☐       ☐                  │    │
  │  │ Cloud Storage      ☑      ☐       ☐                  │    │
  │  │ Compute Engine     ☑      ☐       ☐                  │    │
  │  │ Cloud SQL          ☑      ☐       ☐                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  [SAVE]                                                      │
  └──────────────────────────────────────────────────────────────┘
```

### Tipe Audit Logs

| Tipe | Apa yang Dicatat | Gratis? | Contoh |
|------|-----------------|---------|--------|
| **Admin Activity** | Perubahan config/IAM | **Ya (always on)** | Create VM, change IAM policy, delete bucket |
| **Data Access (Admin Read)** | Baca metadata/config | Tidak (enable manual) | List VMs, describe instance |
| **Data Access (Data Read)** | Baca data user | Tidak (enable manual) | Download object dari bucket, query BigQuery |
| **Data Access (Data Write)** | Tulis data user | Tidak (enable manual) | Upload object, insert row |
| **System Event** | System-generated events | **Ya (always on)** | Auto-scaling, maintenance migration |

### Contoh Audit Log Entries

```
Log Explorer query:

  protoPayload.methodName="SetIamPolicy"

  Hasil:
  ┌──────────────────────────────────────────────────────────────┐
  │  Timestamp:    2026-03-23T14:30:00Z                          │
  │  Principal:    admin@example.com                              │
  │  Method:       SetIamPolicy                                   │
  │  Resource:     projects/fc-1-434201                           │
  │  Action:       Added alice@example.com as roles/editor        │
  │  Status:       Success                                        │
  └──────────────────────────────────────────────────────────────┘

  Artinya: admin@ menambahkan alice@ sebagai Editor
  di project fc-1-434201 pada 23 Mar 2026 pukul 14:30
```

```
Flow audit IAM changes:

  Admin: Grant alice@... → roles/editor
       │
       ▼
  IAM: Policy updated ✅
       │
       ▼
  Audit Log: Admin Activity log created
  │
  │  {
  │    "principalEmail": "admin@example.com",
  │    "methodName": "SetIamPolicy",
  │    "resourceName": "projects/fc-1-434201",
  │    "request": {
  │      "policy": {
  │        "bindings": [
  │          {
  │            "role": "roles/editor",
  │            "members": ["user:alice@example.com"]
  │          }
  │        ]
  │      }
  │    }
  │  }
  │
  ▼
  Bisa di-query di Log Explorer / export ke BigQuery
```

---

## IAM Recommender

Google menyediakan **IAM Recommender** yang memberikan rekomendasi untuk **mengurangi permissions** yang tidak terpakai.

```
Console: IAM → lihat icon "⚡" di sebelah role

  ┌──────────────────────────────────────────────────────────────┐
  │  IAM                                                          │
  │                                                              │
  │  Principal          Role               Recommendation        │
  │  ──────────────── ─────────────────── ──────────────────    │
  │  alice@...         Editor              ⚡ Replace with        │
  │                                        Compute Viewer        │
  │                                                              │
  │  bob@...           Owner               ⚡ Replace with        │
  │                                        Editor                │
  └──────────────────────────────────────────────────────────────┘
```

IAM Recommender menganalisis **usage patterns selama 90 hari** dan menyarankan role yang lebih spesifik.

```
Flow Recommender:

  alice@... punya roles/editor (5000+ permissions)
       │
       ▼
  Recommender analyze (90 hari):
  "Alice hanya menggunakan 15 permissions terkait Compute"
       │
       ▼
  Recommendation:
  "Replace roles/editor dengan roles/compute.viewer"
  (cukup untuk apa yang Alice lakukan)
       │
       ▼
  Admin: Review → Apply recommendation → Role updated ✅
  Alice: masih bisa kerja, tapi dengan less permissions (more secure)
```

| Kelebihan Recommender | Kekurangan Recommender |
|----------------------|------------------------|
| Data-driven recommendations | Butuh 90 hari data |
| Easy apply (1-click) | Bisa miss occasional use |
| Continuous monitoring | — |

---

## Organization Policies (Constraints)

Untuk **organization-level** restrictions yang tidak bisa di-override di level bawah.

```
Console: IAM & Admin → Organization Policies

  Contoh constraints:
  ┌──────────────────────────────────────────────────────────────┐
  │  constraints/iam.disableServiceAccountKeyCreation            │
  │  → Tidak boleh create SA keys di seluruh org                 │
  │                                                              │
  │  constraints/iam.allowedPolicyMemberDomains                  │
  │  → Hanya domain example.com yang boleh di-add ke IAM         │
  │                                                              │
  │  constraints/compute.restrictSharedVpcSubnetworks            │
  │  → Restrict subnets yang boleh dipakai                       │
  └──────────────────────────────────────────────────────────────┘
```

| Constraint | Fungsi | Cocok Untuk |
|-----------|--------|-------------|
| **Disable SA key creation** | Cegah siapapun buat SA keys | Enterprise — force WIF |
| **Allowed member domains** | Hanya domain tertentu boleh di-add | Cegah external access |
| **Restrict VM external IP** | VM tidak boleh punya public IP | Security — force private access |

---

## Skenario: Flow Investigasi Security Incident

```
Alert: "Unauthorized VM created di project production"

  Step 1: Buka Audit Logs
  │  Console → Logging → Log Explorer
  │  Query: protoPayload.methodName="v1.compute.instances.insert"
  │         resource.labels.project_id="web-prod"
  │
  ▼
  Step 2: Identifikasi siapa
  │  Log entry:
  │    principalEmail: "charlie@example.com"
  │    methodName: "v1.compute.instances.insert"
  │    timestamp: "2026-03-23T02:30:00Z"
  │
  │  → Charlie membuat VM jam 2:30 pagi?!
  │
  ▼
  Step 3: Check permissions Charlie
  │  Console → IAM → cari charlie@
  │  Roles: Editor (project web-prod)
  │
  │  → Charlie punya Editor role → bisa create VMs
  │  → Kenapa? → Harusnya Developer role saja
  │
  ▼
  Step 4: Immediate action
  │  ├── Disable/delete unauthorized VM
  │  ├── Revoke Charlie's Editor role
  │  ├── Assign lebih spesifik: Compute Viewer only
  │  └── Investigate: apakah account compromised?
  │
  ▼
  Step 5: Prevention
  │  ├── Apply least privilege ke semua users
  │  ├── Set up alert: "VM created outside business hours"
  │  ├── Enable Data Access logs
  │  └── Review semua Editor/Owner assignments
  │
  ▼
  ✅ Incident resolved, preventive measures applied
```

---

## Checklist Production

```
IAM Setup:
  ☐ Predefined roles digunakan (bukan Basic roles)
  ☐ Least privilege diterapkan (minimal permissions)
  ☐ Google Groups untuk team-based access
  ☐ Individual user = hanya jika perlu akses khusus
  ☐ Conditions dipakai untuk temporary access (contractor, intern)

Service Accounts:
  ☐ User-managed SA untuk setiap app/service
  ☐ Attached SA (bukan key) untuk GCP resources
  ☐ Workload Identity Federation untuk external workloads
  ☐ SA keys dihindari — jika terpaksa, rotate regularly
  ☐ Org policy: disable SA key creation (jika memungkinkan)

Audit & Monitoring:
  ☐ Admin Activity logs enabled (default always on)
  ☐ Data Access logs enabled untuk sensitive services
  ☐ Log Export ke BigQuery untuk long-term analysis
  ☐ Alert: IAM policy changes (SetIamPolicy)
  ☐ Alert: SA key creation (CreateServiceAccountKey)
  ☐ Regular review: IAM Recommender recommendations
  ☐ Quarterly review: siapa punya akses apa

Organization:
  ☐ Org policy: allowed member domains (cegah external)
  ☐ Org policy: restrict VM external IP
  ☐ Org policy: disable SA key creation
  ☐ Folder structure: separate prod/staging/dev
  ☐ Minimal Owner assignments (hanya break-glass admin)
```

---

## Kelebihan & Kekurangan IAM

| Kelebihan | Kekurangan |
|-----------|------------|
| **Granular** — ribuan predefined roles | Banyak pilihan — bisa confusing |
| **Inheritance** — set di atas, berlaku ke bawah | Additive only — tidak bisa restrict di bawah |
| **Audit trail** — semua aksi tercatat | Data Access logs berbayar |
| **Conditions** — temporary/contextual access | Tidak semua resource support conditions |
| **Recommender** — ML-based suggestions | Butuh 90 hari data |
| **Free** — IAM sendiri gratis | Audit logs storage berbayar |
| **Integrated** — semua GCP services | Learning curve untuk setup yang proper |

---

*Dokumen ini berdasarkan fitur IAM di Google Cloud Console per Maret 2025–2026.*
