# Best Practices

Panduan dan rekomendasi untuk setiap area di Compute Engine, mengacu pada setting di GCP Console.

---

## 1. Security

### Saat Create VM

| Setting di Console | Recommended | Alasan |
|-------------------|-------------|--------|
| **External IP** (Networking) | None | VM tidak perlu exposed ke internet, akses via LB atau IAP |
| **Firewall** (Allow HTTP/HTTPS checkbox) | Jangan centang | Buat firewall rule manual yang lebih spesifik |
| **Service Account** (Identity) | Custom SA | Default SA punya permission terlalu luas (Editor) |
| **Access Scopes** (Identity) | Allow full access | Batasi permission di IAM role SA, bukan di scopes |
| **Shielded VM: Secure Boot** (Security) | On | Mencegah rootkit, boot hanya signed software |
| **Shielded VM: vTPM** (Security) | On (default) | Integrity verification |
| **Shielded VM: Integrity Monitoring** (Security) | On (default) | Deteksi perubahan boot sequence |

### Firewall Rules

> **Console:** VPC network → Firewall

| Practice | Cara di Console |
|----------|----------------|
| Jangan pakai source `0.0.0.0/0` (kecuali LB frontend) | Create Firewall Rule → Source IP ranges: isi CIDR spesifik |
| Pakai target tags (bukan all instances) | Create Firewall Rule → Targets: Specified target tags |
| SSH hanya via IAP | Source: `35.235.240.0/20`, port `tcp:22` |
| Health check allow | Source: `35.191.0.0/16`, `130.211.0.0/22` |
| Review firewall rules berkala | Firewall → cek rules yang unused (Firewall Insights) |

### IAM & Service Account

> **Console:** IAM & Admin → Service Accounts

| Practice | Cara di Console |
|----------|----------------|
| 1 SA per VM/aplikasi | Service Accounts → Create → beri nama per app |
| Minimum permission | IAM → SA → klik → Permissions → tambah role spesifik |
| Jangan download key | Pakai attached SA di VM, bukan key file |
| Audit SA usage | IAM → SA → klik → Activity log |

---

## 2. Availability & Reliability

### Saat Create VM

| Setting di Console | Recommended (Production) | Alasan |
|-------------------|--------------------------|--------|
| **Provisioning Model** | Standard | Spot VM bisa di-terminate kapan saja |
| **On host maintenance** (Management) | Migrate | VM pindah tanpa downtime saat Google maintenance |
| **Automatic restart** (Management) | On | VM otomatis restart setelah crash |

### High Availability Checklist

> **Console:** Lokasi setting di Console

| Checklist | Console Location |
|-----------|-----------------|
| ☐ Minimal 2 VM (atau MIG min 2) | Instance groups → Create → min instances: 2 |
| ☐ Health check aktif di LB | Load balancing → Backend → Health check |
| ☐ Firewall rule health check | VPC → Firewall → rule source 35.191.0.0/16 |
| ☐ Auto-healing di MIG | Instance groups → klik MIG → Autohealing |
| ☐ Snapshot schedule aktif | Snapshot schedules → Create |
| ☐ Multi-zone MIG (kalau critical) | Instance groups → Create → Multiple zones |
| ☐ Tested restore dari snapshot | Disks → Create from Snapshot → test boot |

### Untuk VM yang Tidak Bisa Pakai MIG (misal: database)

| Practice | Console Location |
|----------|-----------------|
| Snapshot schedule harian | Snapshot schedules → Create → Daily |
| Machine Image sebelum major change | Machine images → Create |
| Monitor CPU, RAM, Disk | Monitoring → Alerting → Create alert |
| Pertimbangkan Cloud SQL | SQL → Create Instance (managed database) |

---

## 3. Cost Optimization

### Saat Create VM

| Setting di Console | Tips Hemat |
|-------------------|------------|
| **Machine Type** | Mulai kecil (e2-medium), naikkan kalau perlu |
| **Machine Type** | Highcpu kalau app CPU-bound (lebih murah dari standard) |
| **Custom** | Custom machine type kalau preset terlalu besar |
| **Series** | E2 untuk non-critical (lebih murah 20% vs N2) |
| **Provisioning Model** | Spot untuk batch/dev/testing (hemat 60-91%) |
| **Boot Disk Type** | pd-standard untuk dev (hemat 60% vs pd-balanced) |
| **Boot Disk Size** | Jangan terlalu besar (bayar per GB) |
| **External IP** | None (IP idle = $3/bln) |

### Ongoing Cost Management

| Practice | Console Location |
|----------|-----------------|
| Cek GCP Recommendations | VM instances → kolom Recommendation (icon kuning) |
| Right-size VM | Home → Recommendations → Machine type |
| Hapus unused disk | Disks → filter "unattached" → Delete |
| Hapus unused snapshot | Snapshots → hapus yang tidak perlu |
| Release unused static IP | IP addresses → release yang tidak attached |
| Stop dev VM malam hari | Schedule: VM → Edit → Instance schedule (atau manual) |
| CUD untuk VM 24/7 | Committed use discounts → Purchase commitment |
| Budget alert | Billing → Budgets & alerts → Create budget |

### VM Schedule (start/stop otomatis)

> **Console:** Compute Engine → VM instances → klik VM → **Edit** → Availability policies → **Add Instance schedule**

Atau buat resource policy:

> **Console:** Compute Engine → **Instance schedules** → Create

| Setting | Contoh |
|---------|--------|
| Start time | `08:00 Senin-Jumat` (WIB) |
| Stop time | `20:00 Senin-Jumat` (WIB) |
| Timezone | Asia/Jakarta |

Hemat ~64% untuk dev VM (hanya jalan 60 jam vs 168 jam per minggu).

---

## 4. Data Protection

### Backup Strategy

| Data | Backup Method | Console Location | Frequency | Retention |
|------|--------------|-----------------|-----------|-----------|
| Boot disk | Snapshot schedule | Snapshot schedules → Create | Harian | 7 hari |
| Data disk | Snapshot schedule | Snapshot schedules → Create | Harian | 14 hari |
| Full VM config | Machine Image | Machine images → Create | Sebelum major change | 3 bulan |
| Database | Cloud SQL backup / pg_dump | SQL → Backups / manual | Harian | 30 hari |

### Snapshot Best Practices

| Practice | Console Location |
|----------|-----------------|
| Pakai schedule (jangan manual) | Snapshot schedules → Create |
| Simpan multi-regional | Snapshot → Create → Location: Multi-regional |
| Label snapshot | Snapshot → Create → Labels |
| Test restore berkala | Disks → Create from Snapshot → boot test |
| Set retention (auto-delete lama) | Snapshot schedule → Max retention |

---

## 5. Monitoring & Alerting

### Minimum Monitoring Setup

| Item | Console Location | Keterangan |
|------|-----------------|------------|
| ☐ Install Ops Agent | VM → Observability → Install | Untuk memory & disk monitoring |
| ☐ CPU alert > 80% | Monitoring → Alerting → Create | Warning |
| ☐ CPU alert > 95% | Monitoring → Alerting → Create | Critical |
| ☐ Memory alert > 85% | Monitoring → Alerting → Create | Warning (butuh Ops Agent) |
| ☐ Disk alert > 85% | Monitoring → Alerting → Create | Warning (butuh Ops Agent) |
| ☐ Uptime check per domain | Monitoring → Uptime checks → Create | Cek website hidup |
| ☐ Notification channel | Monitoring → Alerting → Notification channels | Email/Slack/PagerDuty |
| ☐ Budget alert | Billing → Budgets & alerts | Alert kalau biaya naik |

---

## 6. Naming Conventions

Konsistensi penamaan di seluruh Console.

| Resource | Format | Contoh |
|----------|--------|--------|
| VM | `{app}-{role}-{env}` | `ftlgym-web-prod` |
| Disk | `{vm}-{purpose}-disk` | `ftlgym-web-prod-data-disk` |
| Snapshot | `{disk}-{date}` | `ftlgym-web-prod-20260323` |
| Snapshot schedule | `{frequency}-{retention}` | `daily-7d` |
| Firewall rule | `{action}-{source}-{target}-{port}` | `allow-iap-ssh-22` |
| VPC | `vpc-{project}` | `vpc-ftlgym` |
| Subnet | `subnet-{purpose}-{region}` | `subnet-web-jkt` |
| Static IP | `ip-{purpose}` | `ip-ftlgymweb-frontend` |
| Service Account | `sa-{app}-{role}` | `sa-ftlgymweb-backend` |
| Instance Template | `tpl-{app}-{version}` | `tpl-ftlgym-web-v2` |
| MIG | `mig-{app}-{env}` | `mig-ftlgym-web-prod` |
| Health Check | `hc-{protocol}-{app}` | `hc-http-ftlgymweb` |
| Backend Service | `backend-{app}` | `backend-service-ftlgymweb` |

---

## 7. Checklist Sebelum Create VM Production

Cek semua setting ini di form Create VM:

```
Machine Configuration:
  [ ] Machine family yang tepat (General Purpose untuk kebanyakan)
  [ ] Series yang tepat (N2 untuk production, E2 untuk dev)
  [ ] Machine type yang tepat (jangan terlalu besar)
  [ ] Provisioning Model: Standard (bukan Spot)

Boot Disk:
  [ ] OS image yang tepat dan LTS
  [ ] Disk type: minimal pd-balanced (pd-ssd untuk DB)
  [ ] Disk size: minimal 20 GB
  [ ] Deletion rule: Keep (untuk VM penting)

Identity:
  [ ] Custom service account (bukan default)
  [ ] Access scopes: Allow full access (control via IAM)

Networking:
  [ ] External IP: None (akses via LB / IAP)
  [ ] Network tags sesuai (untuk firewall)
  [ ] VPC & subnet yang benar
  [ ] Firewall rules sudah dibuat sebelumnya

Advanced - Security:
  [ ] Shielded VM: vTPM On
  [ ] Shielded VM: Integrity Monitoring On
  [ ] Secure Boot: On (kalau pakai standard OS)

Advanced - Management:
  [ ] On host maintenance: Migrate
  [ ] Automatic restart: On
  [ ] Labels untuk organize (env, team, app)

Setelah Create:
  [ ] Snapshot schedule di-attach ke disk
  [ ] Ops Agent installed
  [ ] Alert policies configured
  [ ] Uptime check configured (kalau serve public traffic)
  [ ] Test SSH access via IAP
```
