# Deploy MariaDB di GKE — PVC, Deployment, Service & Migrasi dari VM

Tutorial **end-to-end** men-deploy **MariaDB** sebagai Pod di GKE dengan **PersistentVolumeClaim** agar data tidak hilang saat restart/upgrade, expose ke dalam cluster sebagai Service `ClusterIP`, akses lewat **port-forward** dari Cloud Shell untuk operasi admin (`mysql` CLI), dan **migrasi schema** dari database MariaDB existing yang jalan di VM. Melengkapi [12-deploy-backend-integrated.md § Opsi C](12-deploy-backend-integrated.md#53-opsi-c--statefulset--persistent-volume-di-dalam-cluster-devlab-only).

---

## Daftar Isi

1. [Tujuan & Arsitektur (Flow Diagram)](#1-tujuan--arsitektur-flow-diagram)
2. [Konsep Kunci: Pod Ephemeral & Persistent Volume](#2-konsep-kunci-pod-ephemeral--persistent-volume)
3. [Persiapan: Cloud Shell & Kredensial Cluster](#3-persiapan-cloud-shell--kredensial-cluster)
4. [Namespace `mariadb`](#4-namespace-mariadb)
5. [PersistentVolumeClaim (`pvc.yaml`)](#5-persistentvolumeclaim-pvcyaml)
6. [Simpan Password di Secret (bukan hardcode)](#6-simpan-password-di-secret-bukan-hardcode)
7. [Deployment + Service MariaDB (`mariadb-deployment.yaml`)](#7-deployment--service-mariadb-mariadb-deploymentyaml)
8. [Verifikasi Pod & Service](#8-verifikasi-pod--service)
9. [Akses lewat Port-Forward (Cloud Shell / Local)](#9-akses-lewat-port-forward-cloud-shell--local)
10. [Migrasi Schema dari VM MariaDB](#10-migrasi-schema-dari-vm-mariadb)
11. [Kenapa Wajib Pakai PVC (Bahaya Tanpa Volume)](#11-kenapa-wajib-pakai-pvc-bahaya-tanpa-volume)
12. [Production: StatefulSet vs Cloud SQL](#12-production-statefulset-vs-cloud-sql)
13. [Troubleshooting](#13-troubleshooting)
14. [Ringkasan](#14-ringkasan)

---

## 1. Tujuan & Arsitektur (Flow Diagram)

```
                ┌─────────────────────────────────────────────────┐
                │  GKE Cluster  (cluster-1, us-central1-a)        │
                │                                                 │
                │  Namespace: mariadb                             │
                │                                                 │
                │  ┌───────────────────────────────────────────┐  │
                │  │ Deployment: mariadb (replicas: 1)         │  │
                │  │                                           │  │
                │  │   ┌───────────────────────────────────┐   │  │
                │  │   │  Pod: mariadb-xxxx                │   │  │
                │  │   │  Container: mariadb:latest        │   │  │
                │  │   │    Port: 3306                     │   │  │
                │  │   │    VolumeMount: /var/lib/mysql    │◄──┼──┼── PVC
                │  │   └───────────────────────────────────┘   │  │
                │  └──────────────────┬────────────────────────┘  │
                │                     │                            │
                │  ┌──────────────────▼────────────────────────┐   │
                │  │ Service: mariadb  (type: ClusterIP)        │   │
                │  │   port 3306 → targetPort 3306              │   │
                │  │   DNS: mariadb.mariadb.svc.cluster.local   │   │
                │  └──────────┬────────────────┬────────────────┘   │
                │             │                │                    │
                │   (internal)▼       port-forward (admin)          │
                │   ┌──────────────┐  ▲                             │
                │   │ Backend Pod  │  │                             │
                │   │ (namespace   │  │                             │
                │   │  default)    │  │                             │
                │   └──────────────┘  │                             │
                └─────────────────────┼─────────────────────────────┘
                                      │ kubectl port-forward :3306
                                      ▼
                              ┌────────────────┐
                              │  Cloud Shell   │
                              │  mysql -h 127… │
                              └────────────────┘

        ┌────────────────────────────────┐
        │  PersistentVolume  (10 GB PD)  │ ◄── data tetap hidup
        │  (auto-provision via           │     walaupun Pod mati /
        │   StorageClass "standard")     │     image di-upgrade
        └────────────────────────────────┘
```

**Alur singkat:**

1. Cloud Shell → ambil kredensial cluster.
2. Buat namespace `mariadb` (isolasi resource DB).
3. Apply **PVC** 10Gi → GKE otomatis bikin **PersistentVolume** (disk GCP di belakang).
4. Apply **Deployment** MariaDB yang mount PVC ke `/var/lib/mysql` + **Service** `ClusterIP` port 3306.
5. `port-forward` Service → akses via `mysql` CLI dari Cloud Shell untuk buat schema.
6. Import schema dari VM existing (`SHOW CREATE TABLE ...` di VM, paste di Pod).
7. Backend Pod di namespace lain konek via DNS `mariadb.mariadb.svc.cluster.local:3306`.

---

## 2. Konsep Kunci: Pod Ephemeral & Persistent Volume

| Istilah | Arti |
|---------|------|
| **Pod ephemeral** | Pod dianggap "barang sekali pakai". Kalau mati (crash, eviction, upgrade) → Kubernetes buat Pod **baru**, disk di dalam Pod **hilang total**. |
| **PersistentVolume (PV)** | Storage **di luar** Pod — biasanya disk GCP (Persistent Disk). Hidup terus tanpa tergantung Pod. |
| **PersistentVolumeClaim (PVC)** | "Permintaan" Pod ke cluster: *"aku butuh 10GB, mode RWO"*. Cluster yang menyiapkan PV sesuai request (lewat **StorageClass** default). |
| **StorageClass** | Template cara provision PV. Di GKE default-nya `standard` (HDD) atau `premium-rwo` (SSD). |
| **Access mode RWO (ReadWriteOnce)** | Satu PV di-mount oleh **satu Node** saja — cocok untuk database yang cuma 1 replica. |

```
┌──────────────────────────────────────────────────────────────┐
│ Pod mariadb-xyz                                              │
│   container: mariadb:latest                                   │
│   /var/lib/mysql  ◄── volumeMount                             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ claims
                     ▼
               ┌──────────────┐          ┌──────────────────┐
               │  PVC         │ ──bind── │  PV (10 GB)      │
               │  mariadb-pvc │          │  gce-pd disk     │
               │  namespace:  │          │  (auto-created)  │
               │  mariadb     │          └──────────────────┘
               └──────────────┘
```

Pod boleh mati 100 kali — selama PVC (dan PV di belakangnya) tidak dihapus, data **aman**. Inilah yang menjadikan database di Pod bisa berperilaku seperti database di VM.

---

## 3. Persiapan: Cloud Shell & Kredensial Cluster

**Console:** klik ikon **Activate Cloud Shell** (ikon terminal di header kanan atas Console).

```
┌──────────────────────────────────────────┐
│  Google Cloud Console                    │
│                        [🖥 Cloud Shell] │  ◄── klik ini
└──────────────────────────────────────────┘
```

Cek nama cluster + zone dulu di **Kubernetes Engine → Clusters** (contoh di bawah memakai `cluster-1` di `us-central1-a` — sesuaikan).

```bash
ls                                     # cek working directory Cloud Shell

# ambil kredensial untuk kubectl
gcloud container clusters get-credentials cluster-1 --zone us-central1-a

# verifikasi
kubectl cluster-info
kubectl get nodes
```

> **Apa yang `get-credentials` lakukan?** Menulis file `~/.kube/config` dengan endpoint + token autentikasi cluster, supaya `kubectl` bisa memanggil API server GKE.

---

## 4. Namespace `mariadb`

Namespace = **kotak isolasi logis** di cluster. Resource DB dipisah dari aplikasi.

```bash
kubectl create namespace mariadb
kubectl get namespaces
```

> Sebaiknya tidak pakai namespace `default` untuk database — nanti sulit diatur RBAC, network policy, dan quota.

---

## 5. PersistentVolumeClaim (`pvc.yaml`)

Buat file:

```bash
nano pvc.yaml
```

Isi (perhatikan **indentasi YAML pakai spasi, bukan tab**):

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mariadb-pvc
  namespace: mariadb
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

Simpan: **Ctrl+O** → **Enter** → **Ctrl+X**.

Apply:

```bash
kubectl apply -f pvc.yaml

# verifikasi
kubectl get pvc -n mariadb
# NAME          STATUS   VOLUME            CAPACITY   ACCESS MODES   STORAGECLASS
# mariadb-pvc   Bound    pvc-xxxx          10Gi       RWO            standard
```

Status harus **`Bound`** — artinya PV sudah ter-provision dan siap dipakai.

> **YAML rule penting:** Indentasi **WAJIB spasi** (2 atau 4 spasi konsisten). Editor seperti `nano` di Cloud Shell biasanya sudah benar, tapi kalau copy-paste dari catatan berisi TAB → error `found tab character` saat `kubectl apply`. Fix: `:set expandtab` di vim, atau retype manual dengan spasi.

---

## 6. Simpan Password di Secret (bukan hardcode)

Catatan versi pertamamu pakai `value: "your-root-password"` di Deployment — **jangan lakukan di production** karena password akan terlihat di `kubectl describe` dan masuk history Git jika yaml di-commit.

Buat Secret dulu:

```bash
kubectl create secret generic mariadb-secret \
  --namespace=mariadb \
  --from-literal=MYSQL_ROOT_PASSWORD='P@ssw0rdKuatSekali!'
```

Verifikasi:

```bash
kubectl get secret mariadb-secret -n mariadb
# NAME             TYPE     DATA   AGE
# mariadb-secret   Opaque   1      5s
```

> Secret di Kubernetes disimpan **base64-encoded** di etcd — bukan enkripsi murni. Untuk encryption-at-rest, aktifkan **Application-layer Secrets Encryption** di GKE (pakai Cloud KMS). Detail: [06-security.md](06-security.md).

---

## 7. Deployment + Service MariaDB (`mariadb-deployment.yaml`)

```bash
nano mariadb-deployment.yaml
```

Isi (YAML yang sudah **diperbaiki** indentasi dan strukturnya — versi aslimu ada beberapa error: `volumes` ter-indent di dalam `containers`, `-name:` tanpa spasi, `kind: service` lowercase, `port : 3306` dengan spasi sebelum titik dua):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mariadb
  namespace: mariadb
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mariadb
  template:
    metadata:
      labels:
        app: mariadb
    spec:
      containers:
        - name: mariadb
          image: mariadb:latest
          env:
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mariadb-secret
                  key: MYSQL_ROOT_PASSWORD
          ports:
            - containerPort: 3306
              name: mysql
          volumeMounts:
            - name: mariadb-data
              mountPath: /var/lib/mysql
      volumes:
        - name: mariadb-data
          persistentVolumeClaim:
            claimName: mariadb-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mariadb
  namespace: mariadb
spec:
  type: ClusterIP
  selector:
    app: mariadb
  ports:
    - port: 3306
      targetPort: 3306
      protocol: TCP
```

Simpan: **Ctrl+O** → **Enter** → **Ctrl+X**.

### Perbaikan vs catatan asli

| Baris asli | Masalah | Perbaikan |
|------------|---------|-----------|
| `-name: mariadb-persistent-storage` | Tidak ada spasi setelah `-` | `- name: mariadb-persistent-storage` |
| `volumes:` di bawah `containers:` | Scope salah — harus di bawah `spec:` template, bukan `containers:` | Dipindah ke level `template.spec` |
| `kind: service` | Kubernetes case-sensitive | `kind: Service` |
| `port : 3306` | Spasi sebelum titik dua = YAML error | `port: 3306` |
| `image: mariadb:latest` | `:latest` tidak deterministik, rawan break saat upgrade | Di production pakai tag eksplisit, mis. `mariadb:11.4.2` |
| `value: "your-root-password"` | Password bocor di kubectl describe | `valueFrom.secretKeyRef` |

Apply:

```bash
kubectl apply -f mariadb-deployment.yaml
```

> **Kenapa pakai `Deployment` (bukan `StatefulSet`)?** Untuk **1 replica** dan use-case sederhana (migrasi dari VM), `Deployment` + PVC sudah cukup. Tapi begitu butuh replica >1 (read replica, clustering) atau stable network identity → harus pindah ke **StatefulSet** (dibahas di §12).

---

## 8. Verifikasi Pod & Service

```bash
kubectl get pods -n mariadb
# NAME                       READY   STATUS    RESTARTS   AGE
# mariadb-7b5fc94c4-abcde    1/1     Running   0          30s

kubectl get svc -n mariadb
# NAME      TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)    AGE
# mariadb   ClusterIP   10.x.x.x      <none>        3306/TCP   45s
```

> **`EXTERNAL-IP` `<none>` itu BENAR** — karena Service bertipe `ClusterIP` memang **tidak publik**. Database tidak boleh langsung di-expose ke internet. Akses admin lewat port-forward (§9) atau dari Pod lain di cluster (backend).

Cek log Pod untuk memastikan MariaDB berhasil init:

```bash
kubectl logs -l app=mariadb -n mariadb --tail=30
# cari: "ready for connections" atau "socket: '/run/mysqld/mysqld.sock'"
```

---

## 9. Akses lewat Port-Forward (Cloud Shell / Local)

Port-forward membuka tunnel **localhost Cloud Shell → Service cluster** di port 3306.

```bash
kubectl port-forward svc/mariadb 3306:3306 -n mariadb
# Forwarding from 127.0.0.1:3306 -> 3306
# Forwarding from [::1]:3306 -> 3306
```

**Biarkan terminal ini tetap terbuka.** Buka **tab baru** di Cloud Shell:

```bash
# di tab baru
mysql -h 127.0.0.1 -P 3306 -u root -p
# masukkan password (sesuai Secret yang dibuat di §6)
```

Setelah masuk:

```sql
SHOW DATABASES;
-- +--------------------+
-- | Database           |
-- +--------------------+
-- | information_schema |
-- | mysql              |
-- | performance_schema |
-- | sys                |
-- +--------------------+
```

### Kalau port 3306 sudah terpakai

Kalau port-forward gagal dengan error `bind: address already in use`, berarti ada proses lain yang pakai port 3306 (biasanya port-forward lama yang masih nyangkut):

```bash
# cek siapa yang pakai port 3306
sudo netstat -tulpn | grep LISTEN | grep 3306
# tcp  0  0 127.0.0.1:3306  LISTEN  1717/kubectl

# kill proses tersebut (ganti PID sesuai output)
kill 1717

# verifikasi port sudah bebas
sudo netstat -tulpn | grep LISTEN | grep 3306
# (kosong)

# ulangi port-forward
kubectl port-forward svc/mariadb 3306:3306 -n mariadb
```

> **Tips:** Format kill yang benar `kill <PID>` saja (mis. `kill 1717`) — bukan `kill 1717/kubectl`. Tanda `/` itu bagian dari output `netstat` yang menampilkan `PID/NamaProses`.

---

## 10. Migrasi Schema dari VM MariaDB

Skenario: database lama hidup di VM Compute Engine (dari [Tutorial-GCE/01](../Tutorial-GCE/01-create-vm-nginx-mariadb.md)), kamu mau recreate schema yang sama di MariaDB GKE.

### 10.1 Di VM lama — ekspor DDL tabel

```bash
# SSH ke VM bosani-nps-instance-1
gcloud compute ssh bosani-nps-instance-1 --zone us-central1-a
```

```bash
mysql -u root -p
```

```sql
SHOW DATABASES;
-- cari: bosani_nps

USE bosani_nps;

SHOW TABLES;
-- mis.: bosani_score_tab

SHOW CREATE TABLE bosani_score_tab\G
-- copy output DDL nya (CREATE TABLE ...)
```

> **Tips copy DDL bersih:** pakai `\G` (bukan `;`) agar output vertikal — lebih mudah dibaca & di-copy.

### 10.2 Di MariaDB GKE — create schema

Di tab `mysql` yang konek lewat port-forward (§9):

```sql
CREATE DATABASE bosani_nps CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bosani_nps;

-- paste DDL hasil SHOW CREATE TABLE
CREATE TABLE bosani_score_tab (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  score INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SHOW TABLES;
```

### 10.3 Alternatif: pindahkan data juga (bukan cuma schema)

Kalau butuh **isi data**, pakai `mysqldump` di VM → import di GKE:

```bash
# di VM
mysqldump -u root -p bosani_nps > /tmp/bosani_nps.sql

# copy ke Cloud Shell (bisa lewat gcloud scp)
gcloud compute scp bosani-nps-instance-1:/tmp/bosani_nps.sql ~/ --zone us-central1-a

# di Cloud Shell, import via port-forward
mysql -h 127.0.0.1 -P 3306 -u root -p bosani_nps < ~/bosani_nps.sql
```

### 10.4 User aplikasi (jangan pakai root)

```sql
CREATE USER 'nps_app'@'%' IDENTIFIED BY 'PasswordAppKuat!';
GRANT SELECT, INSERT, UPDATE, DELETE ON bosani_nps.* TO 'nps_app'@'%';
FLUSH PRIVILEGES;
```

Simpan kredensial user ini di **Secret terpisah** (`db-creds`) yang dipakai backend — sesuai pola di [12-deploy-backend-integrated.md § 7](12-deploy-backend-integrated.md#7-environment-variables--secret).

---

## 11. Kenapa Wajib Pakai PVC (Bahaya Tanpa Volume)

Kalau MariaDB di Pod **tanpa PVC** (data di `emptyDir` default atau di filesystem container), data akan **hilang** pada skenario berikut:

| Event | Dengan PVC | Tanpa PVC |
|-------|------------|-----------|
| Pod crash → auto-restart | Data **tetap** (PV re-mount) | Data **hilang** (fresh container) |
| Rolling update image (`mariadb:11.3` → `mariadb:11.4`) | Data **tetap** | Data **hilang** |
| Pod eviction (node penuh, spot VM preempted) | Data **tetap** | Data **hilang** |
| Node mati → Pod re-schedule di node lain | Data **tetap** (PD bisa re-attach) | Data **hilang** |
| Scale down lalu up | Data **tetap** | Data **hilang** |

Ilustrasi:

```
TANPA PVC:
┌──────────┐        ┌──────────┐           ┌──────────┐
│ Pod v1   │ CRASH  │ Pod v1   │  upgrade  │ Pod v2   │
│ data: A  │ ─────► │ data: -  │ ────────► │ data: -  │   ← data hilang DUA kali
└──────────┘        └──────────┘           └──────────┘

DENGAN PVC:
┌──────────┐        ┌──────────┐           ┌──────────┐
│ Pod v1   │ CRASH  │ Pod v1   │  upgrade  │ Pod v2   │
│ mount PV │ ─────► │ mount PV │ ────────► │ mount PV │
└────┬─────┘        └────┬─────┘           └────┬─────┘
     └──────────── PV: data A ────────────────┘    ← data AMAN
```

> Dengan Deployment biasa, Kubernetes **menjamin Pod selalu ada**, tapi **tidak menjamin data di dalamnya** kecuali kamu menyambungkan PVC. Prinsip Kubernetes: *"compute is ephemeral, state is persistent"*.

---

## 12. Production: StatefulSet vs Cloud SQL

Konfigurasi di tutorial ini **simpel & cocok untuk lab / dev**. Untuk production, pertimbangkan:

| Pilihan | Kapan pakai |
|---------|-------------|
| **Cloud SQL (managed)** ⭐ | Hampir semua production — backup, HA, patch, monitoring dikelola Google |
| **StatefulSet + PVC** | Regulasi minta DB di cluster, atau ingin full kontrol. Butuh keahlian tuning, backup, failover sendiri |
| **Deployment + PVC (tutorial ini)** | Dev/lab, demo, prototipe. **Tidak direkomendasikan** untuk production |

### Kenapa StatefulSet > Deployment untuk DB multi-replica?

```
Deployment (replicas: 3):
  Pod 1: mariadb-abc123        ← nama random, tiap restart berubah
  Pod 2: mariadb-def456
  Pod 3: mariadb-ghi789
  Semua mount PVC yang SAMA → conflict write, tidak bisa!

StatefulSet (replicas: 3):
  Pod 1: mariadb-0             ← nama stabil
  Pod 2: mariadb-1
  Pod 3: mariadb-2
  Masing-masing PVC SENDIRI    ← mariadb-data-0, -1, -2
  DNS stabil: mariadb-0.mariadb.mariadb.svc.cluster.local
```

Skeleton StatefulSet:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mariadb
  namespace: mariadb
spec:
  serviceName: mariadb
  replicas: 1
  selector:
    matchLabels:
      app: mariadb
  template:
    metadata:
      labels:
        app: mariadb
    spec:
      containers:
        - name: mariadb
          image: mariadb:11.4
          # ... env, ports, volumeMounts sama seperti Deployment
          volumeMounts:
            - name: data
              mountPath: /var/lib/mysql
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

**Keunggulan StatefulSet:**

- `volumeClaimTemplates` → tiap Pod otomatis dapat PVC sendiri (`data-mariadb-0`, `data-mariadb-1`, ...).
- Pod lahir **berurutan** (mariadb-0 → mariadb-1 → mariadb-2) — penting untuk master-replica setup.
- Nama Pod stabil → bisa dijadikan primary DNS untuk konfigurasi replikasi.

Untuk Cloud SQL sebagai alternatif: [12-deploy-backend-integrated.md § 5.1](12-deploy-backend-integrated.md#51-opsi-a--cloud-sql--cloud-sql-auth-proxy-rekomendasi-production).

---

## 13. Troubleshooting

| Gejala | Penyebab umum | Fix |
|--------|---------------|-----|
| `kubectl apply -f pvc.yaml` → `found tab character` | Indentasi pakai TAB | Buka `nano`, retype dengan spasi, atau `:retab` di vim |
| `PVC` stuck di status `Pending` | StorageClass default tidak ada / cluster kecil habis kuota | `kubectl describe pvc mariadb-pvc -n mariadb` — lihat `Events`. Cek StorageClass default: `kubectl get sc` |
| Pod `CrashLoopBackOff` saat startup pertama | Password kosong / volume sudah punya data lama dari image berbeda | Cek `kubectl logs`. Untuk fresh start: hapus PVC (HATI-HATI, data hilang) lalu apply ulang |
| `port-forward` gagal `bind: already in use` | Port 3306 sudah dipakai | Kill proses lama (§9), atau pakai port beda: `kubectl port-forward svc/mariadb 13306:3306 -n mariadb` lalu `mysql -P 13306` |
| `mysql: ERROR 1045 access denied` | Password salah / user belum diberi hak | Cek Secret: `kubectl get secret mariadb-secret -n mariadb -o jsonpath='{.data.MYSQL_ROOT_PASSWORD}' \| base64 -d` |
| Backend Pod di namespace `default` tidak bisa konek | Pakai DNS pendek `mariadb:3306` | Pakai FQDN: `mariadb.mariadb.svc.cluster.local:3306` (karena beda namespace) |
| Data hilang setelah restart cluster | PVC ikut terhapus saat delete namespace | Jangan `kubectl delete namespace` sembarangan — PV dengan `reclaimPolicy: Delete` ikut hilang. Cek `kubectl get pv` |

### Debug commands

```bash
kubectl describe pod -l app=mariadb -n mariadb       # Events Pod
kubectl logs -l app=mariadb -n mariadb --tail=100    # Log MariaDB
kubectl describe pvc mariadb-pvc -n mariadb          # PVC status + events
kubectl get pv                                       # Semua PV cluster-wide
kubectl exec -it deploy/mariadb -n mariadb -- sh     # Masuk ke Pod MariaDB
```

Cheat sheet lengkap: [09-commands-cheatsheet.md](09-commands-cheatsheet.md).

---

## 14. Ringkasan

**Checklist deploy MariaDB di GKE:**

- [ ] Cloud Shell aktif + `gcloud container clusters get-credentials`
- [ ] Namespace `mariadb` dibuat
- [ ] PVC 10Gi → status **Bound**
- [ ] Secret `mariadb-secret` untuk `MYSQL_ROOT_PASSWORD` (bukan hardcode di YAML)
- [ ] Deployment MariaDB + Service ClusterIP port 3306
- [ ] Pod status **Running**, log "ready for connections"
- [ ] `port-forward` tidak error, `mysql -h 127.0.0.1` bisa login
- [ ] Database `bosani_nps` + tabel dibuat (schema dari VM)
- [ ] User aplikasi dibuat terpisah dari `root`
- [ ] Backend dari namespace lain konek via `mariadb.mariadb.svc.cluster.local:3306`
- [ ] Backup: snapshot PD manual / `mysqldump` terjadwal

**Alur mental singkat:**

```
Cloud Shell
  → get-credentials cluster
  → create namespace mariadb
  → apply PVC (10Gi)  ──► PV di-provision otomatis
  → create Secret root password
  → apply Deployment + Service (ClusterIP, port 3306)
  → port-forward :3306
  → mysql CLI → CREATE DATABASE + schema dari VM
  → backend namespace default pakai DNS: mariadb.mariadb.svc.cluster.local:3306
```

**Penekanan terpenting:**

> Database **tanpa** PersistentVolumeClaim = **data bisa hilang** setiap kali Pod restart atau image di-upgrade. Pakai PVC **selalu** untuk workload yang punya state.

Lanjutkan baca: [12-deploy-backend-integrated.md § 5](12-deploy-backend-integrated.md#5-integrasi-backend--database) (menyambungkan backend ke database ini), [03-workloads.md § ConfigMap & Secret](03-workloads.md#configmap--secret), [06-security.md](06-security.md) (encryption-at-rest Secret), [10-best-practices.md](10-best-practices.md) (backup & restore strategy).
