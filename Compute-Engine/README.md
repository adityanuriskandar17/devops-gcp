# Google Compute Engine

Catatan lengkap tentang Compute Engine (VM instances) di GCP.

## Daftar Isi

| # | Topik | File |
|---|-------|------|
| 01 | VM Instances (create, manage, start/stop) | [01-vm-instances.md](01-vm-instances.md) |
| 02 | Machine Types (general, compute, memory) | [02-machine-types.md](02-machine-types.md) |
| 03 | Disks & Snapshots (persistent disk, backup) | [03-disks-snapshots.md](03-disks-snapshots.md) |
| 04 | Networking (VPC, firewall, IP, load balancer) | [04-networking.md](04-networking.md) |
| 05 | Instance Groups & Autoscaling | [05-instance-groups.md](05-instance-groups.md) |
| 06 | SSH Access & IAP | [06-ssh-access.md](06-ssh-access.md) |
| 07 | Monitoring & Logging | [07-monitoring.md](07-monitoring.md) |
| 08 | Pricing | [08-pricing.md](08-pricing.md) |
| 09 | Commands Cheatsheet | [09-commands-cheatsheet.md](09-commands-cheatsheet.md) |
| 10 | Best Practices | [10-best-practices.md](10-best-practices.md) |

---

## Overview: Apa itu Compute Engine?

Compute Engine adalah layanan **Virtual Machine (VM)** di GCP. Kamu bisa membuat server virtual dengan OS, CPU, RAM, dan disk sesuai kebutuhan.

```
╔═══════════════════════════════════════════════════════════════╗
║                     COMPUTE ENGINE                           ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  VM Instance = Server virtual di cloud                        ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │  Kamu pilih:                                            │  ║
║  │                                                         │  ║
║  │  1. Machine Type  (CPU + RAM)                           │  ║
║  │  2. Boot Disk     (OS + ukuran disk)                    │  ║
║  │  3. Network       (VPC, IP, firewall)                   │  ║
║  │  4. Region/Zone   (lokasi fisik server)                 │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║  GCP yang urus:                                               ║
║  - Hardware fisik                                             ║
║  - Data center                                                ║
║  - Listrik & pendingin                                        ║
║  - Network backbone                                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Arsitektur Umum

```
╔════════════════════════════════════════════════════════════════╗
║  Region: asia-southeast2 (Jakarta)                            ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐  ║
║  │  Zone: asia-southeast2-a                                 │  ║
║  │                                                          │  ║
║  │  ╔═════════════╗  ╔═════════════╗  ╔═════════════╗      │  ║
║  │  ║ ftlgymweb   ║  ║ apiserver1  ║  ║ dbserver1   ║      │  ║
║  │  ║ n2-highcpu  ║  ║ n2-custom   ║  ║ n2-custom   ║      │  ║
║  │  ║ 16 vCPU     ║  ║ 2 vCPU     ║  ║ 12 vCPU    ║      │  ║
║  │  ║ 10.0.1.3    ║  ║ 10.0.1.6    ║  ║ 10.0.1.100  ║      │  ║
║  │  ╚═════════════╝  ╚═════════════╝  ╚═════════════╝      │  ║
║  │                                                          │  ║
║  │  ╔═════════════╗  ╔═════════════╗  ╔═════════════╗      │  ║
║  │  ║ ftlhorizon1 ║  ║ ftlgym-     ║  ║ stridegym   ║      │  ║
║  │  ║ e2-custom   ║  ║ mobile      ║  ║ e2-medium   ║      │  ║
║  │  ║ 6 vCPU      ║  ║ e2-custom   ║  ║ 2 vCPU     ║      │  ║
║  │  ║ 10.0.1.7    ║  ║ 10.0.6.2    ║  ║ 10.0.1.4    ║      │  ║
║  │  ╚═════════════╝  ╚═════════════╝  ╚═════════════╝      │  ║
║  └──────────────────────────────────────────────────────────┘  ║
║                                                                ║
║  VPC Network: vpc-ftlgym                                       ║
║  Load Balancer: lb1 (regional, asia-southeast2)                ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## Quick Start: Buat VM Pertama

```bash
gcloud compute instances create my-vm \
    --zone=asia-southeast2-a \
    --machine-type=e2-medium \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-balanced \
    --project=PROJECT_ID
```

Detail lengkap: [01-vm-instances.md](01-vm-instances.md)
