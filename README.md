# DevOps Documentation

Catatan dan dokumentasi DevOps untuk infrastruktur GCP.

**Project:** `webserver-435507`
**Region:** `asia-southeast2` (Jakarta)

---

## Daftar Topik

### Google Cloud Platform

| Topik | Folder | Keterangan |
|-------|--------|------------|
| Cloud CDN | [Cloud-CDN/](Cloud-CDN/) | Cloud CDN, Media CDN, caching, security, integrasi Cloud Storage |
| Cloud Storage | [Cloud-Storage/](Cloud-Storage/) | Storage classes, Autoclass, lifecycle, access control, pricing |
| Cloud SQL | [Cloud-SQL/](Cloud-SQL/) | MySQL, PostgreSQL, SQL Server — create, HA, backup, migration, pricing |
| Compute Engine | [Compute-Engine/](Compute-Engine/) | VM instances, machine types, disks, networking, SSH, monitoring |
| Cloud Monitoring | [Cloud-Monitoring/](Cloud-Monitoring/) | Monitoring, Logging, Dashboard, Widgets, Alerting, Uptime Checks, Synthetic Monitoring |
| GKE | [GKE/](GKE/) | Kubernetes Engine — cluster, workloads, scaling, networking, security |

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

---

## Topik Selanjutnya (TODO)

- [x] Compute Engine (VM management, instance groups, snapshots)
- [ ] IAM & Security (service accounts, roles, organization policy)
- [x] Cloud SQL / Database
- [x] Cloud CDN (Cloud CDN, Media CDN, caching, security)
- [x] Kubernetes / GKE
- [x] Cloud Monitoring & Logging
- [ ] CI/CD (Cloud Build, deployment pipelines)
- [ ] Cost Management (billing alerts, budget, recommendations)
