# Commands Cheatsheet (Console + CLI)

Mapping antara aksi di GCP Console dan perintah gcloud CLI. Setiap aksi ditunjukkan cara melakukannya di kedua tempat.

---

## VM Instances

### Create VM

| | Cara |
|-|------|
| **Console** | Compute Engine → VM instances → **Create Instance** → isi form → **Create** |
| **CLI** | `gcloud compute instances create VM_NAME --zone=ZONE --machine-type=TYPE ...` |

```bash
gcloud compute instances create my-vm \
    --zone=asia-southeast2-a \
    --machine-type=e2-medium \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-balanced
```

### List VM

| | Cara |
|-|------|
| **Console** | Compute Engine → **VM instances** (langsung terlihat tabel) |
| **CLI** | `gcloud compute instances list` |

```bash
gcloud compute instances list --project=PROJECT_ID
gcloud compute instances list --filter="status=RUNNING"
gcloud compute instances list --filter="zone:asia-southeast2-a"
```

### Detail VM

| | Cara |
|-|------|
| **Console** | Compute Engine → VM instances → **klik nama VM** |
| **CLI** | `gcloud compute instances describe VM_NAME --zone=ZONE` |

```bash
gcloud compute instances describe VM_NAME --zone=ZONE
gcloud compute instances describe VM_NAME --zone=ZONE --format="get(status)"
gcloud compute instances describe VM_NAME --zone=ZONE \
    --format="get(networkInterfaces[0].networkIP)"
```

### Start / Stop / Reset

| Aksi | Console | CLI |
|------|---------|-----|
| Start | VM instances → ☑ select VM → **Start/Resume** (tombol atas) | `gcloud compute instances start VM --zone=ZONE` |
| Stop | VM instances → ☑ select VM → **Stop** (tombol atas) | `gcloud compute instances stop VM --zone=ZONE` |
| Reset | VM instances → ☑ select VM → **Reset** | `gcloud compute instances reset VM --zone=ZONE` |
| Suspend | VM instances → ☑ select VM → **Suspend** | `gcloud compute instances suspend VM --zone=ZONE` |
| Resume | VM instances → ☑ select VM → **Start/Resume** | `gcloud compute instances resume VM --zone=ZONE` |

### Delete VM

| | Cara |
|-|------|
| **Console** | VM instances → ☑ select VM → **Delete** (tombol atas) |
| **CLI** | `gcloud compute instances delete VM_NAME --zone=ZONE` |

```bash
gcloud compute instances delete VM_NAME --zone=ZONE
gcloud compute instances delete VM_NAME --zone=ZONE --keep-disks=all
```

### Edit VM

| Aksi | Console | CLI | Butuh Stop? |
|------|---------|-----|-------------|
| Ubah machine type | VM → Edit → Machine configuration | `set-machine-type --machine-type=TYPE` | Ya |
| Tambah tags | VM → Edit → Network tags | `add-tags --tags=TAG1,TAG2` | Tidak |
| Tambah metadata | VM → Edit → Custom metadata | `add-metadata --metadata=KEY=VALUE` | Tidak |
| Tambah labels | VM → Edit → Labels | `update --update-labels=KEY=VALUE` | Tidak |
| Ubah service account | VM → Edit → Service account | Stop → recreate | Ya (harus delete + create) |

---

## SSH & File Transfer

| Aksi | Console | CLI |
|------|---------|-----|
| SSH | VM instances → klik **SSH** | `gcloud compute ssh VM_NAME --zone=ZONE` |
| SSH + command | N/A | `gcloud compute ssh VM --zone=ZONE --command="uptime"` |
| Upload file | N/A | `gcloud compute scp local.txt VM:~/remote.txt --zone=ZONE` |
| Download file | N/A | `gcloud compute scp VM:~/remote.txt ./local.txt --zone=ZONE` |
| Upload folder | N/A | `gcloud compute scp --recurse ./folder VM:~/folder --zone=ZONE` |
| IAP tunnel | N/A | `gcloud compute start-iap-tunnel VM PORT --local-host-port=localhost:PORT --zone=ZONE` |
| Serial console | VM → Logs → Serial port 1 | `gcloud compute instances get-serial-port-output VM --zone=ZONE` |

---

## Disks

| Aksi | Console | CLI |
|------|---------|-----|
| List | Compute Engine → **Disks** | `gcloud compute disks list` |
| Create | Disks → **Create Disk** | `gcloud compute disks create NAME --size=SIZE --type=TYPE --zone=ZONE` |
| Attach | VM → Edit → Additional disks → **Add new disk** | `gcloud compute instances attach-disk VM --disk=NAME --zone=ZONE` |
| Detach | VM → Edit → Additional disks → **x** (remove) | `gcloud compute instances detach-disk VM --disk=NAME --zone=ZONE` |
| Resize | Disks → klik disk → **Edit** → Size | `gcloud compute disks resize NAME --size=SIZE --zone=ZONE` |
| Delete | Disks → ☑ select → **Delete** | `gcloud compute disks delete NAME --zone=ZONE` |

---

## Snapshots

| Aksi | Console | CLI |
|------|---------|-----|
| List | Compute Engine → **Snapshots** | `gcloud compute snapshots list` |
| Create | Snapshots → **Create Snapshot** | `gcloud compute snapshots create NAME --source-disk=DISK --source-disk-zone=ZONE` |
| Delete | Snapshots → ☑ select → **Delete** | `gcloud compute snapshots delete NAME` |
| Restore to disk | Disks → Create Disk → Source: Snapshot | `gcloud compute disks create NAME --source-snapshot=SNAP --zone=ZONE` |

### Snapshot Schedules

| Aksi | Console | CLI |
|------|---------|-----|
| List | Compute Engine → **Snapshot schedules** | `gcloud compute resource-policies list --filter="snapshotSchedulePolicy"` |
| Create | Snapshot schedules → **Create** | `gcloud compute resource-policies create snapshot-schedule NAME --region=REGION --daily-schedule --start-time=02:00 --max-retention-days=7` |
| Attach to disk | Disks → klik disk → Edit → Snapshot schedule | `gcloud compute disks add-resource-policies DISK --resource-policies=SCHEDULE --zone=ZONE` |

---

## Firewall Rules

| Aksi | Console | CLI |
|------|---------|-----|
| List | VPC network → **Firewall** | `gcloud compute firewall-rules list` |
| Create | Firewall → **Create Firewall Rule** | `gcloud compute firewall-rules create NAME --network=NET --direction=INGRESS --action=ALLOW --rules=tcp:22 --source-ranges=CIDR` |
| Detail | Firewall → klik rule name | `gcloud compute firewall-rules describe NAME` |
| Delete | Firewall → ☑ select → **Delete** | `gcloud compute firewall-rules delete NAME` |
| Update | Firewall → klik rule → **Edit** | `gcloud compute firewall-rules update NAME --source-ranges=CIDR` |

---

## Networks & Subnets

| Aksi | Console | CLI |
|------|---------|-----|
| List VPC | VPC network → **VPC networks** | `gcloud compute networks list` |
| Create VPC | VPC networks → **Create VPC network** | `gcloud compute networks create NAME --subnet-mode=custom` |
| List subnets | VPC network → klik VPC → **Subnets** | `gcloud compute networks subnets list` |
| Create subnet | VPC → Subnets → **Add subnet** | `gcloud compute networks subnets create NAME --network=VPC --region=REGION --range=CIDR` |

---

## Load Balancer

| Aksi | Console | CLI |
|------|---------|-----|
| List | Network services → **Load balancing** | `gcloud compute forwarding-rules list` |
| Detail URL map | Load balancing → klik LB → Edit | `gcloud compute url-maps describe NAME --region=REGION` |
| Backend health | LB → Backends → health status | `gcloud compute backend-services get-health NAME --region=REGION` |
| List SSL certs | LB → Frontend → Certificate | `gcloud compute ssl-certificates list` |
| List target proxies | LB → Frontend → Target proxy | `gcloud compute target-https-proxies list` |

---

## IP Addresses

| Aksi | Console | CLI |
|------|---------|-----|
| List | VPC network → **IP addresses** | `gcloud compute addresses list` |
| Reserve static | IP addresses → **Reserve External Static Address** | `gcloud compute addresses create NAME --region=REGION` |
| Release | IP addresses → ☑ select → **Release** | `gcloud compute addresses delete NAME --region=REGION` |

---

## Instance Groups

| Aksi | Console | CLI |
|------|---------|-----|
| List | Compute Engine → **Instance groups** | `gcloud compute instance-groups managed list` |
| Create MIG | Instance groups → **Create** | `gcloud compute instance-groups managed create NAME --template=TPL --size=N --zone=ZONE` |
| Resize | Instance groups → klik MIG → **Edit** → Number | `gcloud compute instance-groups managed resize NAME --size=N --zone=ZONE` |
| Set autoscaling | Instance groups → klik MIG → Edit → Autoscaling | `gcloud compute instance-groups managed set-autoscaling NAME --zone=ZONE --min-num-replicas=2 --max-num-replicas=10 --target-cpu-utilization=0.6` |
| Rolling update | Instance groups → klik MIG → **Update VMs** | `gcloud compute instance-groups managed rolling-action start-update NAME --version=template=TPL --zone=ZONE` |
| List instances | Instance groups → klik MIG → **Members** | `gcloud compute instance-groups managed list-instances NAME --zone=ZONE` |

---

## Instance Templates

| Aksi | Console | CLI |
|------|---------|-----|
| List | Compute Engine → **Instance templates** | `gcloud compute instance-templates list` |
| Create | Instance templates → **Create** (form sama seperti Create VM) | `gcloud compute instance-templates create NAME --machine-type=TYPE ...` |
| Delete | Instance templates → ☑ select → **Delete** | `gcloud compute instance-templates delete NAME` |

---

## Machine Images

| Aksi | Console | CLI |
|------|---------|-----|
| List | Compute Engine → **Machine images** | `gcloud compute machine-images list` |
| Create | Machine images → **Create** | `gcloud compute machine-images create NAME --source-instance=VM --source-instance-zone=ZONE` |
| Create VM from MI | VM instances → Create → Boot disk → Machine images tab | `gcloud compute instances create NAME --source-machine-image=MI --zone=ZONE` |

---

## Monitoring & Logging

| Aksi | Console | CLI |
|------|---------|-----|
| View VM metrics | VM → tab **Monitoring** | N/A (pakai Monitoring API) |
| View logs | Logging → **Logs Explorer** | `gcloud logging read 'resource.type="gce_instance"' --limit=20` |
| Uptime checks | Monitoring → **Uptime checks** | `gcloud monitoring uptime list-configs` |
| Alert policies | Monitoring → **Alerting** | `gcloud alpha monitoring policies list` |
| Dashboards | Monitoring → **Dashboards** | N/A (Console only) |

---

## Billing & Cost

| Aksi | Console | CLI |
|------|---------|-----|
| View reports | Billing → **Reports** | N/A (Console only) |
| Create budget | Billing → Budgets & alerts → **Create budget** | `gcloud billing budgets create --billing-account=ID --display-name=NAME --budget-amount=AMOUNT` |
| View recommendations | VM instances → kolom **Recommendation** | `gcloud recommender recommendations list --recommender=google.compute.instance.MachineTypeRecommender --location=ZONE` |
| Committed use | Compute Engine → **Committed use discounts** | `gcloud compute commitments create NAME --region=REGION --resources=vcpu=N,memory=NGB --plan=twelve-month` |
