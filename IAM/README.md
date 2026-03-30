# Identity and Access Management (IAM)

Dokumentasi lengkap **Google Cloud IAM** — sistem untuk mengelola **siapa** (identity) bisa melakukan **apa** (permission) pada **resource mana** (resource) di Google Cloud.

**Console:** IAM & Admin → **IAM**
**URL:** [console.cloud.google.com/iam-admin/iam](https://console.cloud.google.com/iam-admin/iam)

---

## Apa itu IAM?

IAM adalah sistem **access control** yang mengatur akses ke semua resource GCP. Prinsip dasarnya:

```
WHO (Principal)  +  CAN DO WHAT (Role/Permissions)  +  ON WHICH RESOURCE

  contoh:
  alice@example.com  +  roles/compute.admin  +  project "my-project"
  │                     │                       │
  │                     │                       └── Di project ini saja
  │                     └── Bisa manage semua Compute Engine resources
  └── User Alice
```

```
┌───────────────────────────────────────────────────────────────┐
│                    Google Cloud IAM                             │
│                                                               │
│  ┌──────────────┐   ┌───────────────┐   ┌─────────────────┐ │
│  │  Principal    │   │  Role         │   │  Resource       │ │
│  │  (WHO)        │──►│  (WHAT)       │──►│  (WHERE)        │ │
│  │               │   │               │   │                 │ │
│  │  • User       │   │  • Basic      │   │  • Organization │ │
│  │  • Group      │   │  • Predefined │   │  • Folder       │ │
│  │  • Service    │   │  • Custom     │   │  • Project      │ │
│  │    Account    │   │               │   │  • Resource     │ │
│  │  • Domain     │   │               │   │    (VM, Bucket, │ │
│  │               │   │               │   │     DB, dll)    │ │
│  └──────────────┘   └───────────────┘   └─────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## Daftar Dokumentasi

| # | File | Isi |
|---|------|-----|
| 01 | [Konsep & Cara Kerja](01-concepts.md) | Resource hierarchy, principals, allow policy, inheritance, flow |
| 02 | [Grant Access (Add User)](02-grant-access.md) | Console walkthrough: tambah user, assign role, conditions, edit/revoke |
| 03 | [Roles & Permissions](03-roles.md) | Basic/predefined/custom roles, permissions format, perbandingan |
| 04 | [Service Accounts](04-service-accounts.md) | Create service account, keys, Workload Identity Federation |
| 05 | [Best Practices & Audit](05-best-practices.md) | Least privilege, audit logs, organizational policy, checklist |
| 06 | [Google Groups](06-groups.md) | Create group, manage members, assign IAM roles ke group, onboarding/offboarding flow |
| 07 | [Privileged Access Manager (PAM)](07-pam.md) | Just-in-Time access, entitlements, grant request, approval workflow, auto-revoke |

---

## Quick Start

```
1. Console → IAM & Admin → IAM
2. Klik "GRANT ACCESS"
3. Masukkan email user di "New principals"
4. Pilih role (misal: Viewer, Editor, atau predefined role spesifik)
5. Klik "Save"
6. User bisa akses resource sesuai role yang diberikan
```
