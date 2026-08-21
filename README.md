# DevOps Documentation

Catatan dan dokumentasi DevOps untuk infrastruktur GCP.

**Project:** `webserver-435507`
**Region:** `asia-southeast2` (Jakarta)

---

## Daftar Topik

### Fundamental DevOps (Cloud-Agnostic)

| Topik | Folder | Keterangan |
|-------|--------|------------|
| Linux Fundamentals | [Linux-Fundamentals/](Linux-Fundamentals/) | Kernel vs distro, filesystem, user/permission, process management, package management |
| Bash Scripting | [Bash-Scripting/](Bash-Scripting/) | Shell scripting untuk automation — variables, control flow, functions, text processing |
| Git & Version Control | [Git-VCS/](Git-VCS/) | Git concepts, branching/merging, remote collaboration, GitHub/GitLab/Bitbucket |
| Networking & Protocols | [Networking-Protocols/](Networking-Protocols/) | OSI/TCP-IP, DNS, HTTP/HTTPS/TLS, proxy/load balancer/firewall, SSH, email protocols |
| Docker & Containers | [Docker-Containers/](Docker-Containers/) | Image, Dockerfile, registry, networking/volumes, Docker Compose |

### Google Cloud Platform

| Topik | Folder | Keterangan |
|-------|--------|------------|
| Cloud Armor | [Cloud-Armor/](Cloud-Armor/) | WAF, DDoS protection, security policies, OWASP rules, rate limiting, adaptive protection |
| Cloud CDN | [Cloud-CDN/](Cloud-CDN/) | Cloud CDN, Media CDN, caching, security, integrasi Cloud Storage |
| Cloud KMS | [Cloud-KMS/](Cloud-KMS/) | Key Management — encryption keys, key ring, rotation, CMEK, HSM |
| Cloud Monitoring | [Cloud-Monitoring/](Cloud-Monitoring/) | Monitoring, Logging, Dashboard, Widgets, Alerting, Uptime Checks, Synthetic Monitoring |
| Cloud SQL | [Cloud-SQL/](Cloud-SQL/) | MySQL, PostgreSQL, SQL Server — create, HA, backup, migration, pricing |
| Cloud Storage | [Cloud-Storage/](Cloud-Storage/) | Storage classes, Autoclass, lifecycle, access control, pricing |
| Compute Engine | [Compute-Engine/](Compute-Engine/) | VM instances, machine types, disks, networking, SSH, monitoring |
| GKE | [GKE/](GKE/) | Kubernetes Engine — cluster, workloads, scaling, networking, security |
| IAM | [IAM/](IAM/) | Identity & Access Management — users, roles, service accounts, audit |
| Tutorial GCE | [Tutorial-GCE/](Tutorial-GCE/) | Tutorial hands-on: create VM, install Nginx, MariaDB, setup database |

### Linux Fundamentals

| # | File | Isi |
|---|------|-----|
| -- | [README](Linux-Fundamentals/README.md) | Kenapa Linux penting untuk DevOps, kernel vs distro vs userland |
| 01 | [Konsep Dasar Linux](Linux-Fundamentals/01-concepts.md) | Kernel vs distro, keluarga distro, Filesystem Hierarchy Standard, boot process |
| 02 | [User, Group & Permission](Linux-Fundamentals/02-file-permissions.md) | UID/GID, rwx & octal, chmod/chown, setuid/setgid/sticky bit, sudo vs su |
| 03 | [Process Management](Linux-Fundamentals/03-process-management.md) | Process state, job control, signals, systemd unit, systemctl, journalctl |
| 04 | [Package Management](Linux-Fundamentals/04-package-management.md) | apt vs dnf vs zypper vs snap/flatpak, repository & GPG, security updates |
| 05 | [Commands Cheatsheet](Linux-Fundamentals/05-commands-cheatsheet.md) | Navigation, file ops, text processing, disk, networking, archiving, search |
| 06 | [Best Practices](Linux-Fundamentals/06-best-practices.md) | Hardening dasar, permission hygiene, log rotation, checklist production |

### Bash Scripting

| # | File | Isi |
|---|------|-----|
| -- | [README](Bash-Scripting/README.md) | Kenapa Bash penting untuk DevOps automation, flow shell → script → interpreter |
| 01 | [Konsep & Cara Kerja](Bash-Scripting/01-concepts.md) | Shebang, cara eksekusi script, variables, quoting, exit code, command substitution |
| 02 | [Control Flow](Bash-Scripting/02-control-flow.md) | if/elif/else, test operators, case, for/while/until loop, break/continue |
| 03 | [Functions & Arguments](Bash-Scripting/03-functions-arguments.md) | Function, positional parameters, shift, local vs global, getopts |
| 04 | [Text Processing](Bash-Scripting/04-text-processing.md) | grep/sed/awk/cut/sort/uniq/tr, pipes & redirection, heredoc |
| 05 | [Commands Cheatsheet](Bash-Scripting/05-commands-cheatsheet.md) | String ops, array, arithmetic, file test, loop syntax, debugging flags |
| 06 | [Best Practices](Bash-Scripting/06-best-practices.md) | Quoting, `set -euo pipefail`, ShellCheck, trap, idempotency, checklist |

### Git & Version Control

| # | File | Isi |
|---|------|-----|
| -- | [README](Git-VCS/README.md) | Apa itu version control, kenapa Git menang, empat area kerja Git |
| 01 | [Konsep & Cara Kerja](Git-VCS/01-concepts.md) | Snapshot model, three-tree architecture, anatomy commit, branch sebagai pointer |
| 02 | [Branching & Merging](Git-VCS/02-branching-merging.md) | Fast-forward vs merge commit vs three-way merge, rebase vs merge, resolve conflict |
| 03 | [Remote & Collaboration](Git-VCS/03-remote-collaboration.md) | Clone/fetch/pull, PR/MR workflow, GitHub/GitLab/Bitbucket, protected branch |
| 04 | [Commands Cheatsheet](Git-VCS/04-commands-cheatsheet.md) | Setup, snapshot, branching, remote ops, undo & recovery (reset/revert/reflog) |
| 05 | [Best Practices](Git-VCS/05-best-practices.md) | Commit convention, .gitignore, branching strategy, signed commit, secret handling |

### Networking & Protocols

| # | File | Isi |
|---|------|-----|
| -- | [README](Networking-Protocols/README.md) | Kenapa DevOps perlu paham networking, perjalanan satu request |
| 01 | [OSI & TCP/IP Model](Networking-Protocols/01-osi-tcp-ip.md) | 7 layer OSI, 4 layer TCP/IP, TCP vs UDP, three-way handshake, port & socket |
| 02 | [DNS](Networking-Protocols/02-dns.md) | Cara kerja resolusi DNS, record types, TTL, caching, debugging propagasi |
| 03 | [HTTP/HTTPS & SSL/TLS](Networking-Protocols/03-http-https-ssl-tls.md) | Status code, HTTP/1.1 vs 2 vs 3, TLS handshake, chain of trust |
| 04 | [Proxy, Load Balancer & Firewall](Networking-Protocols/04-proxy-load-balancer-firewall.md) | Forward vs reverse proxy, algoritma load balancing, L4 vs L7, firewall |
| 05 | [SSH & FTP](Networking-Protocols/05-ssh-ftp.md) | SSH architecture, key pair, SFTP vs FTP vs FTPS, port forwarding/tunneling |
| 06 | [Email Protocols](Networking-Protocols/06-email-protocols.md) | SMTP vs IMAP vs POP3, SPF/DKIM/DMARC, whitelisting/greylisting |
| 07 | [Commands Cheatsheet](Networking-Protocols/07-commands-cheatsheet.md) | dig, nslookup, ping, traceroute, mtr, netstat, ss, nc, curl, tcpdump |
| 08 | [Best Practices](Networking-Protocols/08-best-practices.md) | Network segmentation, least-privilege firewall, TLS everywhere, checklist |

### Docker & Containers

| # | File | Isi |
|---|------|-----|
| -- | [README](Docker-Containers/README.md) | Kenapa Docker penting, arsitektur Docker (client/daemon/containerd/runc) |
| 01 | [Konsep & Cara Kerja](Docker-Containers/01-concepts.md) | Namespaces, cgroups, union filesystem, image layers, flow `docker run` |
| 02 | [Dockerfile](Docker-Containers/02-dockerfile.md) | Instruction reference, CMD vs ENTRYPOINT, COPY vs ADD, multi-stage build |
| 03 | [Images & Registry](Docker-Containers/03-images-registry.md) | Build/tag/push/pull, naming convention, Docker Hub vs private vs cloud registry |
| 04 | [Networking & Volumes](Docker-Containers/04-networking-volumes.md) | Network driver, DNS antar container, port publishing, volume vs bind mount |
| 05 | [Docker Compose](Docker-Containers/05-docker-compose.md) | Struktur compose file, contoh 3-tier app, compose commands, `.env` usage |
| 06 | [Commands Cheatsheet](Docker-Containers/06-commands-cheatsheet.md) | Referensi cepat semua command Docker per kategori |
| 07 | [Best Practices](Docker-Containers/07-best-practices.md) | Non-root user, minimal base image, pin tag, health check, secrets, checklist |

### Cloud Armor

| # | File | Isi |
|---|------|-----|
| -- | [README](Cloud-Armor/README.md) | Overview, arsitektur, quick start |
| 01 | [Konsep & Cara Kerja](Cloud-Armor/01-concepts.md) | Arsitektur edge network, policy types, flow traffic, skenario pakai/tidak pakai |
| 02 | [Create Security Policy](Cloud-Armor/02-create-policy.md) | Console walkthrough: create policy, default rule, attach target backend |
| 03 | [Rules & Conditions](Cloud-Armor/03-rules.md) | Priority, basic/advanced mode, CEL expressions, actions (allow/deny/throttle/ban/redirect) |
| 04 | [WAF Rules (OWASP)](Cloud-Armor/04-waf-rules.md) | Preconfigured WAF rules, SQL injection, XSS, sensitivity levels, tuning |
| 05 | [Adaptive Protection & Rate Limiting](Cloud-Armor/05-adaptive-protection.md) | ML DDoS detection, throttle, rate-based ban, bot management, reCAPTCHA |
| 06 | [Pricing & Best Practices](Cloud-Armor/06-pricing-best-practices.md) | Standard vs Enterprise, estimasi biaya, checklist production |

### Cloud CDN

| # | File | Isi |
|---|------|-----|
| -- | [README](Cloud-CDN/README.md) | Overview, Cloud CDN vs Media CDN vs Cloud Storage |
| 01 | [Konsep & Cara Kerja](Cloud-CDN/01-concepts.md) | Cara kerja CDN, edge caching, kenapa cepat, kelebihan/kekurangan |
| 02 | [Setup Origin](Cloud-CDN/02-setup-origin.md) | Enable CDN, backend bucket, backend service, URL map |
| 03 | [Caching Policies](Cloud-CDN/03-caching-policies.md) | Cache mode, TTL, cache key, invalidation |
| 04 | [Security](Cloud-CDN/04-security.md) | Signed URL, Signed Cookie, Cloud Armor, SSL |
| 05 | [Media CDN](Cloud-CDN/05-media-cdn.md) | Streaming VoD & live, infrastruktur YouTube, perbedaan detail |
| 06 | [Integrasi Cloud Storage](Cloud-CDN/06-integration-cloud-storage.md) | CDN + GCS bucket, flow, skenario, biaya |
| 07 | [Monitoring](Cloud-CDN/07-monitoring.md) | Cache hit ratio, logging, metrics, troubleshooting |
| 08 | [Pricing](Cloud-CDN/08-pricing.md) | Komponen biaya, Cloud CDN vs Media CDN, estimasi |
| 09 | [Commands Cheatsheet](Cloud-CDN/09-commands-cheatsheet.md) | gcloud CLI commands |
| 10 | [Best Practices](Cloud-CDN/10-best-practices.md) | Performance, security, cost optimization, checklist |

### Cloud Storage

| # | File | Isi |
|---|------|-----|
| -- | [README](Cloud-Storage/README.md) | Overview flow, decision tree, ringkasan |
| 01 | [Storage Classes](Cloud-Storage/01-storage-classes.md) | Standard, Nearline, Coldline, Archive |
| 02 | [Autoclass](Cloud-Storage/02-autoclass.md) | Fitur auto-transition class berdasarkan akses |
| 03 | [Lifecycle Management](Cloud-Storage/03-lifecycle-management.md) | Auto-delete & auto-transition berdasarkan usia objek |
| 04 | [Access Control](Cloud-Storage/04-access-control.md) | IAM, Signed URL, public access prevention |
| 05 | [Location Types](Cloud-Storage/05-location-types.md) | Regional, Dual-region, Multi-region |
| 06 | [Data Protection](Cloud-Storage/06-data-protection.md) | Versioning, Soft Delete & Retention (compliance) |
| 07 | [Commands Cheatsheet](Cloud-Storage/07-commands-cheatsheet.md) | gcloud storage & gsutil commands |
| 08 | [Pricing](Cloud-Storage/08-pricing.md) | Estimasi harga per class, simulasi biaya |
| 09 | [Arsitektur & Strategi](Cloud-Storage/09-architecture.md) | Contoh arsitektur, kesalahan umum, strategi |
| 10 | [Best Practices](Cloud-Storage/10-best-practices.md) | Security, encryption, monitoring, checklist |

### Cloud SQL

| # | File | Isi |
|---|------|-----|
| -- | [README](Cloud-SQL/README.md) | Overview, arsitektur, quick start |
| 01 | [Create Instance](Cloud-SQL/01-create-instance.md) | Edition, Preset, Region, Machine, Storage — semua opsi Console |
| 02 | [Configuration & Flags](Cloud-SQL/02-configuration-flags.md) | Database flags, parameter tuning, maintenance |
| 03 | [Networking & Security](Cloud-SQL/03-networking-security.md) | Private IP, Public IP, SSL, Cloud SQL Proxy, IAM auth |
| 04 | [Backups & Recovery](Cloud-SQL/04-backups-recovery.md) | Automated backup, PITR, restore, export/import |
| 05 | [Replicas & HA](Cloud-SQL/05-replicas-ha.md) | High Availability, Read Replicas, DR switchback |
| 06 | [Migration](Cloud-SQL/06-migration.md) | Database Migration Service (DMS), SQL dump, external replica |
| 07 | [Monitoring](Cloud-SQL/07-monitoring.md) | Query Insights, slow query, alerting, troubleshooting |
| 08 | [Pricing](Cloud-SQL/08-pricing.md) | Komponen biaya, estimasi, CUD, tips hemat |
| 09 | [Commands Cheatsheet](Cloud-SQL/09-commands-cheatsheet.md) | gcloud sql commands |
| 10 | [Best Practices](Cloud-SQL/10-best-practices.md) | Security, availability, performance, checklist production |

### Compute Engine

| # | File | Isi |
|---|------|-----|
| -- | [README](Compute-Engine/README.md) | Overview, arsitektur, quick start |
| 01 | [VM Instances](Compute-Engine/01-vm-instances.md) | Create, manage, start/stop, delete VM |
| 02 | [Machine Types](Compute-Engine/02-machine-types.md) | E2, N2, highcpu, highmem, custom |
| 03 | [Disks & Snapshots](Compute-Engine/03-disks-snapshots.md) | Persistent disk, SSD, snapshot, machine image |
| 04 | [Networking](Compute-Engine/04-networking.md) | VPC, firewall, IP address, load balancer, NEG |
| 05 | [Instance Groups](Compute-Engine/05-instance-groups.md) | MIG, autoscaling, auto-healing, rolling update |
| 06 | [SSH Access & IAP](Compute-Engine/06-ssh-access.md) | SSH, IAP tunnel, SCP, troubleshooting |
| 07 | [Monitoring & Logging](Compute-Engine/07-monitoring.md) | Ops Agent, Cloud Monitoring, alerting |
| 08 | [Pricing](Compute-Engine/08-pricing.md) | Estimasi harga, CUD, Spot VM, simulasi biaya |
| 09 | [Commands Cheatsheet](Compute-Engine/09-commands-cheatsheet.md) | gcloud compute commands |
| 10 | [Best Practices](Compute-Engine/10-best-practices.md) | Security, availability, cost optimization |

### Cloud Monitoring & Logging

| # | File | Isi |
|---|------|-----|
| -- | [README](Cloud-Monitoring/README.md) | Overview, arsitektur, quick start |
| 01 | [Konsep & Overview](Cloud-Monitoring/01-concepts.md) | Apa itu Cloud Monitoring, fitur Console, flow pakai/tidak pakai |
| 02 | [Dashboard & Create](Cloud-Monitoring/02-dashboard-create.md) | Cara membuat dashboard di Console, layout, predefined vs custom |
| 03 | [Widgets Overview](Cloud-Monitoring/03-widgets-overview.md) | Semua tipe widget, fungsi, kapan digunakan |
| 04 | [Metrics Widget Detail](Cloud-Monitoring/04-metrics-widget.md) | Line chart detail: analysis mode, compare to past, aggregation, filter |
| 05 | [Alerting Policies](Cloud-Monitoring/05-alerting.md) | Membuat alert, notification channel, severity, incident management |
| 06 | [Uptime Checks](Cloud-Monitoring/06-uptime-checks.md) | HTTP/TCP uptime monitoring, SSL cert, global probing |
| 07 | [Cloud Logging](Cloud-Monitoring/07-logging.md) | Log Explorer, query, log-based metrics, log routing/sinks |
| 08 | [Pricing](Cloud-Monitoring/08-pricing.md) | Komponen biaya monitoring & logging, free tier, tips hemat |
| 09 | [Best Practices](Cloud-Monitoring/09-best-practices.md) | Golden Signals, alert strategy, logging best practices, checklist |
| 10 | [Synthetic Monitoring](Cloud-Monitoring/10-synthetic-monitoring.md) | Custom script, broken link checker, Mocha template, Cloud Function |

### Cloud KMS (Key Management Service)

| # | File | Isi |
|---|------|-----|
| -- | [README](Cloud-KMS/README.md) | Overview, arsitektur, quick start |
| 01 | [Konsep & Resource Hierarchy](Cloud-KMS/01-concepts.md) | Key ring, key, key version, protection level, envelope encryption |
| 02 | [Create Key Ring & Key](Cloud-KMS/02-create-key.md) | Console walkthrough: create key ring, create key, semua opsi |
| 03 | [Key Rotation & Versioning](Cloud-KMS/03-rotation-versioning.md) | Auto-rotation, manual rotation, key versions, destroy/restore |
| 04 | [Integrasi & Penggunaan](Cloud-KMS/04-integration.md) | CMEK, enkripsi disk/storage/SQL/GKE, envelope encryption, kill switch |
| 05 | [Pricing & Best Practices](Cloud-KMS/05-pricing-best-practices.md) | Harga per protection level, free tier, compliance, checklist |

### GKE (Google Kubernetes Engine)

| # | File | Isi |
|---|------|-----|
| -- | [README](GKE/README.md) | Overview, arsitektur, container vs VM, quick start |
| 01 | [Konsep & Kenapa K8s](GKE/01-concepts.md) | Container vs VM, kenapa hemat biaya, arsitektur GKE |
| 02 | [Create Cluster](GKE/02-create-cluster.md) | Wizard Console: Cluster basics, Fleet, Networking, Advanced |
| 03 | [Workloads](GKE/03-workloads.md) | Deploy app: Pod, Deployment, Service, ConfigMap, Secret |
| 04 | [Networking](GKE/04-networking.md) | VPC-native, Ingress, Load Balancer, Network Policy |
| 05 | [Scaling](GKE/05-scaling.md) | HPA, VPA, Cluster Autoscaler, Node Pool |
| 06 | [Security](GKE/06-security.md) | Workload Identity, RBAC, Private Cluster, Binary Auth |
| 07 | [Monitoring](GKE/07-monitoring.md) | GKE Dashboard, Cloud Monitoring, Logging |
| 08 | [Pricing](GKE/08-pricing.md) | Autopilot vs Standard, Spot VM, tips hemat |
| 09 | [Commands Cheatsheet](GKE/09-commands-cheatsheet.md) | gcloud container + kubectl commands |
| 10 | [Best Practices](GKE/10-best-practices.md) | Security, scaling, cost, checklist production |

### IAM (Identity & Access Management)

| # | File | Isi |
|---|------|-----|
| -- | [README](IAM/README.md) | Overview, arsitektur, quick start |
| 01 | [Konsep & Cara Kerja](IAM/01-concepts.md) | Resource hierarchy, principals, allow policy, inheritance, flow AuthN/AuthZ |
| 02 | [Grant Access (Add User)](IAM/02-grant-access.md) | Console walkthrough: GRANT ACCESS, assign role, conditions, edit/revoke, onboarding flow |
| 03 | [Roles & Permissions](IAM/03-roles.md) | Basic/predefined/custom roles, permissions format, create custom role Console |
| 04 | [Service Accounts](IAM/04-service-accounts.md) | Create SA, attached SA, Workload Identity Federation, SA keys, authentication flow |
| 05 | [Best Practices & Audit](IAM/05-best-practices.md) | Least privilege, audit logs, IAM Recommender, org policies, checklist production |
| 06 | [Google Groups](IAM/06-groups.md) | Create group, manage members, assign IAM role ke group, onboarding/offboarding flow |
| 07 | [Privileged Access Manager (PAM)](IAM/07-pam.md) | Just-in-Time access, entitlements, grant request, approval workflow, auto-revoke |

### Tutorial GCE (Hands-on)

| # | File | Isi |
|---|------|-----|
| -- | [README](Tutorial-GCE/README.md) | Overview tutorial GCE |
| 01 | [Create VM + Nginx + MariaDB](Tutorial-GCE/01-create-vm-nginx-mariadb.md) | Create e2-micro VM, SSH, install Nginx & MariaDB, secure DB, buat database & table |

---

## Topik Selanjutnya (TODO)

- [x] Linux Fundamentals (kernel, distro, filesystem, permission, process, package management)
- [x] Bash Scripting (variables, control flow, functions, text processing)
- [x] Git & Version Control (branching, merging, remote collaboration)
- [x] Networking & Protocols (OSI/TCP-IP, DNS, HTTP/TLS, proxy/LB/firewall, SSH, email)
- [x] Docker & Containers (image, Dockerfile, registry, networking/volumes, compose)
- [x] Compute Engine (VM management, instance groups, snapshots)
- [x] IAM & Security (service accounts, roles, organization policy)
- [x] Cloud SQL / Database
- [x] Cloud CDN (Cloud CDN, Media CDN, caching, security)
- [x] Kubernetes / GKE
- [x] Cloud Monitoring & Logging
- [x] Cloud KMS (Key Management Service)
- [x] Cloud Armor (WAF & DDoS protection)
- [ ] CI/CD (Cloud Build, deployment pipelines)
- [ ] Cost Management (billing alerts, budget, recommendations)
