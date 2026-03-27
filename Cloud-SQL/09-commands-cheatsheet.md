# CLI Commands Cheatsheet

Perintah **gcloud sql** yang sering dipakai, disandingkan dengan **Console path**.

---

## Instance Management

| Aksi | Console | CLI |
|------|---------|-----|
| List instances | `SQL` → halaman utama | `gcloud sql instances list` |
| Detail instance | `SQL` → klik instance | `gcloud sql instances describe INSTANCE` |
| Create instance | `SQL` → **Create Instance** | Lihat contoh di bawah |
| Delete instance | `SQL` → instance → **Delete** | `gcloud sql instances delete INSTANCE` |
| Start instance | `SQL` → instance → **Start** | `gcloud sql instances patch INSTANCE --activation-policy=ALWAYS` |
| Stop instance | `SQL` → instance → **Stop** | `gcloud sql instances patch INSTANCE --activation-policy=NEVER` |
| Restart instance | `SQL` → instance → **Restart** | `gcloud sql instances restart INSTANCE` |

### Create instance (CLI)

```bash
# MySQL
gcloud sql instances create myapp-mysql-prod \
    --database-version=MYSQL_8_0 \
    --edition=enterprise \
    --tier=db-n1-standard-4 \
    --region=asia-southeast2 \
    --availability-type=REGIONAL \
    --storage-type=SSD \
    --storage-size=100GB \
    --storage-auto-increase \
    --backup \
    --backup-start-time=02:00 \
    --enable-point-in-time-recovery \
    --deletion-protection \
    --root-password=SECURE_PASSWORD

# PostgreSQL
gcloud sql instances create myapp-pg-prod \
    --database-version=POSTGRES_16 \
    --edition=enterprise \
    --tier=db-n1-standard-4 \
    --region=asia-southeast2 \
    --availability-type=REGIONAL \
    --storage-type=SSD \
    --storage-size=100GB \
    --storage-auto-increase \
    --backup \
    --backup-start-time=02:00 \
    --enable-point-in-time-recovery \
    --deletion-protection \
    --database-flags=log_min_duration_statement=1000
```

---

## Edit Instance

| Aksi | Console | CLI |
|------|---------|-----|
| Scale up/down | `SQL` → instance → **Edit** → Machine | `gcloud sql instances patch INSTANCE --tier=db-n1-standard-8` |
| Increase storage | `SQL` → instance → **Edit** → Storage | `gcloud sql instances patch INSTANCE --storage-size=200GB` |
| Enable HA | `SQL` → instance → **Edit** → Availability | `gcloud sql instances patch INSTANCE --availability-type=REGIONAL` |
| Set flags | `SQL` → instance → **Edit** → Flags | `gcloud sql instances patch INSTANCE --database-flags=FLAG=VALUE` |
| Set maintenance | `SQL` → instance → **Edit** → Maintenance | `gcloud sql instances patch INSTANCE --maintenance-window-day=SUN --maintenance-window-hour=2` |

---

## Databases

| Aksi | Console | CLI |
|------|---------|-----|
| List databases | `SQL` → instance → **Databases** | `gcloud sql databases list --instance=INSTANCE` |
| Create database | `SQL` → instance → **Databases** → **Create** | `gcloud sql databases create DB_NAME --instance=INSTANCE` |
| Delete database | `SQL` → instance → **Databases** → **Delete** | `gcloud sql databases delete DB_NAME --instance=INSTANCE` |

---

## Users

| Aksi | Console | CLI |
|------|---------|-----|
| List users | `SQL` → instance → **Users** | `gcloud sql users list --instance=INSTANCE` |
| Create user | `SQL` → instance → **Users** → **Add user** | `gcloud sql users create USER --instance=INSTANCE --password=PASS` |
| Set password | `SQL` → instance → **Users** → user → **Change password** | `gcloud sql users set-password USER --instance=INSTANCE --password=NEWPASS` |
| Delete user | `SQL` → instance → **Users** → user → **Delete** | `gcloud sql users delete USER --instance=INSTANCE` |

---

## Backups

| Aksi | Console | CLI |
|------|---------|-----|
| List backups | `SQL` → instance → **Backups** | `gcloud sql backups list --instance=INSTANCE` |
| Create backup | `SQL` → instance → **Backups** → **Create** | `gcloud sql backups create --instance=INSTANCE` |
| Restore backup | `SQL` → instance → **Backups** → **Restore** | `gcloud sql backups restore BACKUP_ID --restore-instance=INSTANCE` |
| Delete backup | `SQL` → instance → **Backups** → **Delete** | `gcloud sql backups delete BACKUP_ID --instance=INSTANCE` |

### PITR restore

```bash
gcloud sql instances clone SOURCE_INSTANCE CLONE_NAME \
    --point-in-time="2026-03-23T10:30:00Z"
```

---

## Export / Import

| Aksi | Console | CLI |
|------|---------|-----|
| Export SQL | `SQL` → instance → **Export** | `gcloud sql export sql INSTANCE gs://BUCKET/file.sql --database=DB` |
| Export CSV | `SQL` → instance → **Export** | `gcloud sql export csv INSTANCE gs://BUCKET/file.csv --database=DB --query="SELECT..."` |
| Import SQL | `SQL` → instance → **Import** | `gcloud sql import sql INSTANCE gs://BUCKET/file.sql --database=DB` |
| Import CSV | `SQL` → instance → **Import** | `gcloud sql import csv INSTANCE gs://BUCKET/file.csv --database=DB --table=TABLE` |

---

## Replicas

| Aksi | Console | CLI |
|------|---------|-----|
| Create read replica | `SQL` → instance → **Replicas** → **Create** | `gcloud sql instances create REPLICA --master-instance-name=PRIMARY --region=REGION` |
| Promote replica | `SQL` → replica → **Promote** | `gcloud sql instances promote-replica REPLICA` |
| List replicas | `SQL` → instance → **Replicas** | `gcloud sql instances list --filter="masterInstanceName:PRIMARY"` |

---

## Connections & Networking

| Aksi | Console | CLI |
|------|---------|-----|
| Get connection name | `SQL` → instance → **Overview** | `gcloud sql instances describe INSTANCE --format="get(connectionName)"` |
| Set authorized networks | `SQL` → instance → **Connections** → **Networking** | `gcloud sql instances patch INSTANCE --authorized-networks=IP/CIDR` |
| Enable Private IP | `SQL` → instance → **Connections** → **Networking** | `gcloud sql instances patch INSTANCE --network=VPC_NAME` |
| Require SSL | `SQL` → instance → **Connections** → **Security** | `gcloud sql instances patch INSTANCE --require-ssl` |

### Cloud SQL Auth Proxy

```bash
# Download proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.3/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Start proxy
./cloud-sql-proxy PROJECT:REGION:INSTANCE --port=3306

# Connect via proxy
mysql -h 127.0.0.1 -P 3306 -u USER -p
```

---

## Failover & Maintenance

| Aksi | Console | CLI |
|------|---------|-----|
| Trigger failover | `SQL` → instance → **Failover** | `gcloud sql instances failover INSTANCE` |
| Reschedule maintenance | `SQL` → instance → **Maintenance** | `gcloud sql instances reschedule-maintenance INSTANCE --reschedule-type=NEXT_AVAILABLE_WINDOW` |

---

## Monitoring (via gcloud)

```bash
# Lihat operasi terbaru
gcloud sql operations list --instance=INSTANCE

# Lihat log (via logging)
gcloud logging read 'resource.type="cloudsql_database" AND resource.labels.database_id="PROJECT:INSTANCE"' --limit=50

# Lihat metric CPU
gcloud monitoring metrics list --filter="metric.type=cloudsql.googleapis.com/database/cpu/utilization"
```
