# Tutorial: Create VM Instance + Install Nginx & MariaDB

Tutorial langkah demi langkah membuat **VM Instance** di Google Compute Engine, lalu install **Nginx** sebagai web server dan **MariaDB** sebagai database server di **Debian 12 (Bookworm)**.

---

## Daftar Isi

1. [Create VM Instance](#1-create-vm-instance)
2. [SSH ke VM & Cek Environment](#2-ssh-ke-vm--cek-environment)
3. [Install Nginx](#3-install-nginx)
4. [Install MariaDB](#4-install-mariadb)
5. [Secure MariaDB Installation](#5-secure-mariadb-installation)
6. [Buat Administrative User](#6-buat-administrative-user)
7. [Operasi Database](#7-operasi-database)

---

## 1. Create VM Instance

**Console:** Compute Engine → VM instances → **CREATE INSTANCE**

### Konfigurasi yang Digunakan

```
┌───────────────────────────────────────────────────────────────────────┐
│  ← Create an instance                    🟦 Create VM from...        │
│                                                                       │
│  Sidebar:                          Monthly estimate: $7.11            │
│  ● Machine configuration ─────────────────────────────────────────── │
│  ● OS and storage                                                     │
│  ● Data protection                                                    │
│  ● Networking                                                         │
│  ● Observability                                                      │
│  ● Security                                                           │
│  ● Advanced                                                           │
└───────────────────────────────────────────────────────────────────────┘
```

### Step 1: Machine Configuration

```
  Name: (nama VM kamu)

  Region: us-central1 (Iowa)
  Zone: us-central1-a (atau zone default)

  Machine configuration:
  ┌──────────────────────────────────────────────────────────────────┐
  │  Machine family: General purpose                                 │
  │  Series: E2                                                      │
  │  Machine type: e2-micro                                          │
  │                                                                  │
  │  ┌────────────────────────────────────────────────────────────┐  │
  │  │  vCPU: 2       Memory: 1 GB       Shared core             │  │
  │  └────────────────────────────────────────────────────────────┘  │
  │                                                                  │
  │  Provisioning model: ● Standard                                  │
  └──────────────────────────────────────────────────────────────────┘
```

**Kenapa e2-micro?**
- Paling murah (~$7.11/bulan)
- Cukup untuk belajar dan testing
- 2 vCPU (shared core) + 1 GB RAM
- Provisioning model **Standard** — VM tidak akan di-terminate oleh GCP

### Step 2: OS and Storage

```
  Boot disk:
  ┌──────────────────────────────────────────────────────────────────┐
  │  OS: Debian GNU/Linux 12 (Bookworm)                              │
  │  Disk type: Balanced persistent disk                             │
  │  Size: 10 GB                                                     │
  └──────────────────────────────────────────────────────────────────┘
```

Debian 12 Bookworm dipilih karena:
- Ringan dan stabil
- Default OS di GCP
- Support package yang kita butuhkan (Nginx, MariaDB)

### Step 3: Data Protection

```
  Backups:
  ● No backups

  → Untuk tutorial tidak perlu backup/snapshot schedule
```

### Step 4: Networking (Firewall)

```
  Firewall:
  ☑ Allow HTTP traffic          ← port 80
  ☑ Allow HTTPS traffic         ← port 443
  ☑ Allow load balancer health checks
```

**Kenapa centang ketiganya?**

| Checkbox | Port | Fungsi |
|----------|------|--------|
| **Allow HTTP traffic** | tcp:80 | Agar Nginx bisa diakses via browser (http://) |
| **Allow HTTPS traffic** | tcp:443 | Agar bisa diakses via HTTPS nantinya |
| **Allow load balancer health checks** | Varies | Agar Load Balancer bisa cek apakah VM healthy |

### Step 5: Observability

```
  ☑ Install Ops Agent for monitoring and logging
  ☑ Enable display device
```

| Checkbox | Fungsi |
|----------|--------|
| **Install Ops Agent** | Auto-install Cloud Monitoring & Logging agent — bisa lihat metrics dan logs di Console |
| **Enable display device** | Mengaktifkan virtual display — berguna untuk screenshot/VNC |

### Step 6: Security

```
  → Biarkan default

  Service account: Compute Engine default service account
  Access scopes: Allow default access
  Shielded VM: vTPM ☑, Integrity Monitoring ☑
```

### Step 7: Advanced

```
  → Biarkan default (semua default)
```

### Step 8: Create

```
  Klik [Create]

  → Tunggu beberapa detik sampai VM running ✅
  → Status: ✅ Running (centang hijau)
  → External IP: xxx.xxx.xxx.xxx (catat IP ini)
```

```
VM instances:
┌──────────┬────────────┬──────────┬───────────────┬──────────────────┐
│ Name     │ Zone       │ Machine  │ Internal IP   │ External IP      │
│          │            │ type     │               │                  │
├──────────┼────────────┼──────────┼───────────────┼──────────────────┤
│ ✅ my-vm │ us-central │ e2-micro │ 10.128.0.x    │ 34.xxx.xxx.xxx   │
│          │ 1-a        │          │               │   [SSH ▼]        │
└──────────┴────────────┴──────────┴───────────────┴──────────────────┘
```

---

## 2. SSH ke VM & Cek Environment

Klik **SSH** di Console → browser window baru terbuka dengan terminal.

### Cek File System

```bash
$ ls
```
```
(biasanya kosong — home directory baru)
```

```bash
$ ls -a
```
```
.  ..  .bash_logout  .bashrc  .profile
```

File-file default di home directory:
- `.bash_logout` — script yang jalan saat logout
- `.bashrc` — konfigurasi bash shell
- `.profile` — environment variables saat login

### Cek OS Version

```bash
$ cat /etc/os-release
```
```
PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
NAME="Debian GNU/Linux"
VERSION_ID="12"
VERSION="12 (bookworm)"
VERSION_CODENAME=bookworm
ID=debian
HOME_URL="https://www.debian.org/"
SUPPORT_URL="https://www.debian.org/support"
BUG_REPORT_URL="https://bugs.debian.org/"
```

Konfirmasi: OS-nya **Debian 12 (Bookworm)** sesuai yang dipilih saat create VM.

---

## 3. Install Nginx

### Install

```bash
$ sudo apt install nginx
```
```
Reading package lists... Done
Building dependency tree... Done
The following additional packages will be installed:
  ...
Do you want to continue? [Y/n] Y

Setting up nginx (1.22.1-9) ...
```

### Verifikasi

```bash
$ sudo systemctl status nginx
```
```
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
     Active: active (running) ← ✅ running
```

### Test di Browser

Buka browser → masukkan **External IP** VM:

```
http://34.xxx.xxx.xxx
```

```
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                     Welcome to nginx!                                  │
│                                                                       │
│  If you see this page, the nginx web server is successfully           │
│  installed and working. Further configuration is required.            │
│                                                                       │
│  For online documentation and support please refer to nginx.org       │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

Jika muncul halaman "Welcome to nginx!" → Nginx berhasil terinstall dan firewall HTTP sudah benar.

---

## 4. Install MariaDB

### Kenapa MariaDB, Bukan MySQL?

```
Debian 12 (Bookworm) → TIDAK support MySQL 8.4 secara native
                      → MariaDB yang tersedia di repository default

MariaDB adalah fork dari MySQL:
├── Kompatibel 99% dengan MySQL
├── Perintah SQL sama
├── Client mysql tetap bisa dipakai
├── Drop-in replacement
└── Sudah di-maintain oleh komunitas Debian
```

### Install

```bash
$ sudo apt install mariadb-server
```
```
Reading package lists... Done
Building dependency tree... Done
The following additional packages will be installed:
  mariadb-client mariadb-common ...
Do you want to continue? [Y/n] Y
```

> **Jika ada error terkait `google-cloud-cli`:**
> Ini karena ada update/upgrade yang pending untuk google-cloud-cli package. **Abaikan saja** — tidak mempengaruhi instalasi MariaDB. Bisa jalankan `sudo apt update && sudo apt upgrade` jika ingin resolve, tapi tidak wajib.

### Verifikasi

```bash
$ sudo systemctl start mariadb.service
$ sudo systemctl status mariadb.service
```
```
● mariadb.service - MariaDB 10.11.x database server
     Loaded: loaded (/lib/systemd/system/mariadb.service; enabled)
     Active: active (running) ← ✅ running
```

**Checklist:**
- ✅ `active (running)` — MariaDB berjalan
- ✅ `enabled` — auto-start saat boot

---

## 5. Secure MariaDB Installation

Secara default, MariaDB **belum aman**:
- Root account tidak punya password
- Anonymous user bisa login
- Test database bisa diakses semua orang
- Root bisa login dari remote

### Jalankan Security Script

```bash
$ sudo mysql_secure_installation
```

### Jawaban Step-by-Step

```
┌─────────────────────────────────────────────────────────────────┐
│  mysql_secure_installation                                       │
│                                                                  │
│  1. Enter current password for root (enter for none):            │
│     → [Enter] (belum ada password)                               │
│                                                                  │
│  2. Switch to unix_socket authentication [Y/n]                   │
│     → Y                                                          │
│                                                                  │
│  3. Change the root password? [Y/n]                              │
│     → Y                                                          │
│     New password: bosani                                         │
│     Re-enter new password: bosani                                │
│                                                                  │
│  4. Remove anonymous users? [Y/n]                                │
│     → Y ✅                                                       │
│                                                                  │
│  5. Disallow root login remotely? [Y/n]                          │
│     → Y ✅                                                       │
│                                                                  │
│  6. Remove test database and access to it? [Y/n]                 │
│     → Y ✅                                                       │
│                                                                  │
│  7. Reload privilege tables now? [Y/n]                           │
│     → Y ✅                                                       │
│                                                                  │
│  All done! ✅                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Penjelasan Setiap Jawaban

| # | Pertanyaan | Jawaban | Kenapa |
|---|-----------|---------|--------|
| 1 | Current root password | Enter (kosong) | Fresh install belum ada password |
| 2 | Switch to unix_socket auth | Y | Hanya user system `root` yang bisa login sebagai DB root |
| 3 | Change root password | Y → `bosani` | Root harus punya password untuk keamanan |
| 4 | **Remove anonymous users** | **Y** | Anonymous user bisa login tanpa username — risiko keamanan |
| 5 | **Disallow root login remotely** | **Y** | Root hanya boleh login dari localhost — mencegah brute force |
| 6 | **Remove test database** | **Y** | Test DB bisa diakses oleh siapa saja termasuk anonymous — hapus! |
| 7 | **Reload privilege tables** | **Y** | Apply semua perubahan di atas ke running server |

```
Sebelum mysql_secure_installation:

  ┌──────────────────────────────────────────────────────────┐
  │  MariaDB                                                  │
  │                                                          │
  │  root     → NO password ❌                                │
  │  anonymous → bisa login ❌                                 │
  │  root     → bisa login dari remote ❌                      │
  │  test DB  → siapa saja bisa akses ❌                       │
  └──────────────────────────────────────────────────────────┘

Setelah mysql_secure_installation:

  ┌──────────────────────────────────────────────────────────┐
  │  MariaDB                                                  │
  │                                                          │
  │  root     → password: bosani ✅                            │
  │  anonymous → DIHAPUS ✅                                    │
  │  root     → hanya localhost ✅                             │
  │  test DB  → DIHAPUS ✅                                     │
  └──────────────────────────────────────────────────────────┘
```

---

## 6. Buat Administrative User

### Login sebagai Root

```bash
$ sudo mariadb
```
```
Welcome to the MariaDB monitor.
MariaDB [(none)]>
```

> **`sudo mariadb`** langsung masuk sebagai root tanpa perlu password (unix_socket authentication — mendeteksi user system `root`).

### Create Admin User

```sql
GRANT ALL ON *.* TO 'admin'@'localhost' IDENTIFIED BY 'password' WITH GRANT OPTION;
```

**Penjelasan:**

| Bagian | Arti |
|--------|------|
| `GRANT ALL` | Berikan semua permission (SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, dll) |
| `ON *.*` | Pada semua database dan semua table |
| `TO 'admin'@'localhost'` | Ke user `admin` yang login dari `localhost` |
| `IDENTIFIED BY 'password'` | Dengan password `password` |
| `WITH GRANT OPTION` | User ini juga bisa memberikan permission ke user lain |

### Apply Privileges

```sql
FLUSH PRIVILEGES;
```

Reload privilege tables agar perubahan langsung berlaku.

```sql
exit;
```

### Perbedaan Login Method

```
┌──────────────────────────────────────────────────────────────────┐
│  Cara 1: sudo mariadb                                            │
│  ├── Langsung masuk sebagai root                                 │
│  ├── Menggunakan unix_socket (deteksi system user)               │
│  ├── Tidak perlu password                                        │
│  └── Hanya bisa dari user system root/sudo                       │
│                                                                  │
│  Cara 2: mysql -u root -p                                        │
│  ├── Login sebagai DB user root                                  │
│  ├── Harus masukkan password (bosani)                            │
│  ├── Bisa login sebagai user lain: mysql -u admin -p             │
│  └── Menggunakan password authentication                         │
└──────────────────────────────────────────────────────────────────┘
```

### Test Login dengan Password

```bash
$ mysql -u root -p
Enter password: bosani
```
```
Welcome to the MariaDB monitor.
MariaDB [(none)]>
```

---

## 7. Operasi Database

### Lihat Database yang Ada

```sql
MariaDB [(none)]> SHOW DATABASES;
```
```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
```

Database default setelah secure installation (test sudah dihapus).

### Buat Database Baru

```sql
MariaDB [(none)]> CREATE DATABASE bosani_nps;
```
```
Query OK, 1 row affected
```

### Gunakan Database

```sql
MariaDB [(none)]> USE bosani_nps;
```
```
Database changed
MariaDB [bosani_nps]>
```

### Buat Table

```sql
MariaDB [bosani_nps]> CREATE TABLE nps_score_tab (
    id INT NOT NULL AUTO_INCREMENT,
    score FLOAT NOT NULL,
    instagram_account VARCHAR(255) NOT NULL,
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
```
```
Query OK, 0 rows affected
```

**Penjelasan kolom:**

| Kolom | Tipe | Fungsi |
|-------|------|--------|
| `id` | INT AUTO_INCREMENT | Primary key, auto-increment |
| `score` | FLOAT NOT NULL | Skor NPS (Net Promoter Score) |
| `instagram_account` | VARCHAR(255) NOT NULL | Akun Instagram responden |
| `created_time` | DATETIME DEFAULT CURRENT_TIMESTAMP | Waktu data dibuat (otomatis) |
| `updated_time` | DATETIME DEFAULT ... ON UPDATE | Waktu data terakhir diupdate (otomatis) |

### Verifikasi Table

```sql
MariaDB [bosani_nps]> SHOW TABLES;
```
```
+-----------------------+
| Tables_in_bosani_nps  |
+-----------------------+
| nps_score_tab         |
+-----------------------+
```

### Lihat Struktur Table

```sql
MariaDB [bosani_nps]> DESC nps_score_tab;
```
```
+-------------------+--------------+------+-----+---------------------+-------------------------------+
| Field             | Type         | Null | Key | Default             | Extra                         |
+-------------------+--------------+------+-----+---------------------+-------------------------------+
| id                | int(11)      | NO   | PRI | NULL                | auto_increment                |
| score             | float        | NO   |     | NULL                |                               |
| instagram_account | varchar(255) | NO   |     | NULL                |                               |
| created_time      | datetime     | YES  |     | current_timestamp() |                               |
| updated_time      | datetime     | YES  |     | current_timestamp() | on update current_timestamp() |
+-------------------+--------------+------+-----+---------------------+-------------------------------+
```

```sql
MariaDB [bosani_nps]> EXIT;
```

---

## Ringkasan

### Arsitektur yang Sudah Dibuat

```
┌───────────────────────────────────────────────────────────────┐
│  Google Compute Engine                                         │
│                                                               │
│  VM Instance: e2-micro (2 vCPU shared, 1 GB RAM)              │
│  OS: Debian 12 (Bookworm)                                     │
│  Disk: 10 GB Balanced Persistent Disk                         │
│  Firewall: HTTP ✅ HTTPS ✅ Health Check ✅                   │
│  Ops Agent: ✅ Installed                                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Software Stack                                          │ │
│  │                                                         │ │
│  │  ┌──────────────────┐    ┌──────────────────────────┐  │ │
│  │  │  Nginx           │    │  MariaDB                  │  │ │
│  │  │  Web Server      │    │  Database Server          │  │ │
│  │  │                  │    │                           │  │ │
│  │  │  Port: 80/443    │    │  Port: 3306 (localhost)   │  │ │
│  │  │  Status: running │    │  Status: running          │  │ │
│  │  └──────────────────┘    │                           │  │ │
│  │                          │  DB: bosani_nps           │  │ │
│  │                          │  Table: nps_score_tab     │  │ │
│  │                          │  Users:                   │  │ │
│  │                          │  ├── root (localhost)     │  │ │
│  │                          │  └── admin (localhost)    │  │ │
│  │                          └──────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  External IP: 34.xxx.xxx.xxx → http://34.xxx.xxx.xxx         │
│  → "Welcome to nginx!" ✅                                     │
└───────────────────────────────────────────────────────────────┘
```

### Checklist

```
✅ VM Instance dibuat (e2-micro, Debian 12, Standard)
✅ Firewall: HTTP + HTTPS + Health Check
✅ Ops Agent: monitoring & logging aktif
✅ SSH: berhasil connect
✅ Nginx: installed & running (port 80)
✅ MariaDB: installed & running
✅ MariaDB: secured (password root, no anonymous, no remote root, no test DB)
✅ Admin user: dibuat dengan GRANT ALL
✅ Database: bosani_nps dibuat
✅ Table: nps_score_tab dibuat dengan 5 kolom
```

### Commands Cheatsheet

```bash
# SSH ke VM
gcloud compute ssh VM_NAME --zone=ZONE

# Nginx
sudo systemctl status nginx       # cek status
sudo systemctl restart nginx      # restart
sudo systemctl stop nginx         # stop
sudo nano /etc/nginx/sites-available/default  # edit config

# MariaDB
sudo mariadb                      # login sebagai root (no password)
mysql -u root -p                  # login dengan password
mysql -u admin -p                 # login sebagai admin
sudo systemctl status mariadb     # cek status
sudo systemctl restart mariadb    # restart

# Database operations
SHOW DATABASES;                   # list database
CREATE DATABASE nama_db;          # buat database
USE nama_db;                      # pilih database
SHOW TABLES;                      # list tables
DESC nama_table;                  # lihat struktur table
SELECT * FROM nama_table;         # lihat semua data
DROP DATABASE nama_db;            # hapus database (hati-hati!)
```

---

*Tutorial ini berdasarkan Google Cloud Console dengan VM e2-micro, Debian 12 (Bookworm), Nginx, dan MariaDB.*
