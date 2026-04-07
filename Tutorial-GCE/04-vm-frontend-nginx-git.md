# Tutorial: VM Frontend Terpisah (Nginx + Git) — Integrasi ke Backend

Tutorial ini menjelaskan cara membuat **VM Instance kedua** khusus **frontend** (gaya *microservice ringan*: satu VM backend API + DB, satu VM UI), dengan **spek sama** seperti VM backend agar biaya dan perilaku konsisten. Referensi **Google Cloud Console** mengikuti pola [01-create-vm-nginx-mariadb.md](01-create-vm-nginx-mariadb.md). **Git & GitHub** mengikuti pola [02-setup-git-ssh-github.md](02-setup-git-ssh-github.md). Backend & API mengacu pada [03-integrasikan-database-backend-nginx.md](03-integrasikan-database-backend-nginx.md).

---

## Daftar Isi

1. [Kenapa VM terpisah untuk frontend?](#1-kenapa-vm-terpisah-untuk-frontend)
2. [Create VM Instance (Console)](#2-create-vm-instance-console)
3. [SSH ke VM Frontend](#3-ssh-ke-vm-frontend)
4. [Install Nginx](#4-install-nginx)
5. [Install Git & Koneksi GitHub](#5-install-git--koneksi-github)
6. [Repository Git untuk Frontend](#6-repository-git-untuk-frontend)
7. [Deploy & Konfigurasi Nginx Proxy ke Backend](#7-deploy--konfigurasi-nginx-proxy-ke-backend)
8. [Ringkasan](#8-ringkasan)

---

## 1. Kenapa VM terpisah untuk frontend?

```
┌─────────────────────────────────────┐   HTTP :80    ┌─────────────────────────────────────┐
│  VM: bosani-nps-instance-2         │               │  VM: bosani-nps-instance-1          │
│  (frontend)                        │               │  (backend + MariaDB)                │
│                                    │               │                                     │
│  Nginx → file statis / SPA build   │  ──────────►  │  Nginx → Express :3000 → MariaDB    │
│  External IP publik (UI)           │   API calls   │  External IP publik (API)           │
└─────────────────────────────────────┘               └─────────────────────────────────────┘
```

- **Pemisahan peran:** UI di satu VM, API + database di VM lain — mudah di-scale dan di-deploy terpisah.
- **Spek sama dengan instance backend:** tutorial ini memakai **e2-micro**, Debian 12, firewall HTTP/HTTPS — **mirror** konfigurasi [§1 Create VM](01-create-vm-nginx-mariadb.md#1-create-vm-instance) agar tidak ada kejutan biaya/perilaku.

---

## 2. Create VM Instance (Console)

**Console:** [Google Cloud Console](https://console.cloud.google.com/) → **Compute Engine** → **VM instances** → **CREATE INSTANCE**

### Yang disamakan dengan `bosani-nps-instance-1`

| Bagian | Nilai |
|--------|--------|
| **Name** | `bosani-nps-instance-2` |
| **Region / Zone** | **Sama** dengan instance-1 (mis. `us-central1` / `us-central1-a`) — latensi rendah antar-VM dalam region yang sama |
| **Machine type** | **e2-micro** (General purpose, E2, Standard) |
| **Boot disk** | Debian GNU/Linux **12 (Bookworm)**, 10 GB Balanced |
| **Firewall** | ☑ Allow HTTP · ☑ Allow HTTPS · ☑ Load balancer health checks (sama seperti tutorial 01) |
| **Observability** | Ops Agent + display device — opsional, boleh sama seperti instance-1 |

**Tidak perlu MariaDB** di VM ini — database hanya di instance backend.

### Step singkat (mirror tutorial 01)

1. **Machine configuration** → Name: `bosani-nps-instance-2` → e2-micro → Standard.
2. **OS and storage** → Debian 12, 10 GB.
3. **Networking** → centang firewall HTTP/HTTPS seperti di atas.
4. Klik **Create** → tunggu status **Running** → catat **External IP** VM frontend (mis. `34.x.y.z`).

```
VM instances (contoh):
┌──────────────────────────┬─────────────┬──────────────────┐
│ Name                     │ Machine     │ External IP      │
├──────────────────────────┼─────────────┼──────────────────┤
│ bosani-nps-instance-1    │ e2-micro    │ 34.a.b.c (API)   │
│ bosani-nps-instance-2    │ e2-micro    │ 34.x.y.z (UI)    │
└──────────────────────────┴─────────────┴──────────────────┘
```

---

## 3. SSH ke VM Frontend

Sama seperti VM lain di seri tutorial ini:

**Console:** baris VM `bosani-nps-instance-2` → tombol **SSH** (browser terminal) **atau** dari mesin lokal:

```bash
gcloud compute ssh bosani-nps-instance-2 --zone=ZONA_ANDA
```

Verifikasi OS:

```bash
$ cat /etc/os-release | head -3
```

Harus menunjukkan **Debian 12 (bookworm)**.

---

## 4. Install Nginx

Langkah ini mengikuti inti [§3 Install Nginx](01-create-vm-nginx-mariadb.md#3-install-nginx) di tutorial 01.

### Update paket & install

```bash
$ sudo apt update
```
```
Hit:1 http://deb.debian.org/debian bookworm InRelease
...
Reading package lists... Done
```

```bash
$ sudo apt install nginx
```
```
Do you want to continue? [Y/n] Y
...
Setting up nginx (1.22.x) ...
```

### Verifikasi

```bash
$ sudo systemctl status nginx
```
```
● nginx.service - A high performance web server and a reverse proxy server
     Active: active (running)
```

### Test di browser

Buka `http://<EXTERNAL_IP_INSTANCE_2>` — harus muncul halaman **Welcome to nginx!**

Jika tidak terbuka, cek firewall VM (HTTP allowed) dan IP yang dipakai benar **External IP** instance-2.

---

## 5. Install Git & Koneksi GitHub

Untuk **detail** (generate SSH key, add ke GitHub, `~/.ssh/config`, `ssh -T git@github.com`), ikuti **seluruh** [02-setup-git-ssh-github.md](02-setup-git-ssh-github.md) di VM **ini** (`bosani-nps-instance-2`).

### Ringkasan perintah (di VM frontend)

```bash
$ sudo apt update
$ sudo apt install git-all
$ git --version
```

Set identity:

```bash
$ git config --global user.name "Nama Kamu"
$ git config --global user.email "email@gmail.com"
```

Lalu di VM yang sama: **SSH key** → **GitHub Settings** → **clone** repository frontend (lihat §6).

---

## 6. Repository Git untuk Frontend

1. Di **GitHub** → **New repository** — mis. nama `bosani-nps-frontend` (Public/Private sesuai kebutuhan).
2. Inisialisasi: README, `.gitignore` (mis. **Node** jika pakai React/Vite), license opsional — sama seperti penjelasan [§2 Buat Repository](02-setup-git-ssh-github.md#2-buat-repository-di-github) di tutorial 02.
3. Di VM frontend, **clone via SSH** (setelah SSH key VM ini terdaftar di GitHub):

```bash
$ cd ~
$ git clone git@github.com:USERNAME/bosani-nps-frontend.git
$ cd bosani-nps-frontend
```

> Satu SSH key per VM: kalau key ini baru pertama kali dipakai di GitHub, tambahkan **public key** VM instance-2 di GitHub → **Settings → SSH and GPG keys** (boleh beda title, mis. `GCE VM bosani-nps-instance-2`).

---

## 7. Deploy & Konfigurasi Nginx Proxy ke Backend

**Backend** sudah jalan di **instance-1** dengan API `http://<IP_BACKEND>/api/...` (lihat tutorial 03).

Strategi: Nginx di VM frontend melayani file statis (SPA) **dan** mem-proxy request `/api/...` ke VM backend. Browser hanya bicara ke satu IP (frontend) — tidak perlu konfigurasi CORS di backend.

### 7.1 Build & salin file

1. Di VM frontend, build project:

```bash
$ cd ~/bosani-nps-frontend
$ npm install
$ npm run build
```

2. Salin artefak build ke direktori web Nginx (`dist/`):

```bash
$ sudo rm -rf /var/www/html/*
$ sudo cp -r dist/* /var/www/html/
```

### 7.2 Buat `api-config.js`

Setelah build, file `api-config.js` mungkin tidak ikut ter-copy (atau kosong). File ini dibaca oleh frontend untuk menentukan base URL API. Karena kita pakai **Nginx proxy**, kosongkan value-nya agar frontend pakai path relatif (`/api/...`):

```bash
$ sudo nano /var/www/html/api-config.js
```

Isi:

```javascript
window.__BOSANI_API_BASE__ = '';
```

Simpan (**Ctrl+O** → **Enter** → **Ctrl+X**).

### 7.3 Konfigurasi Nginx — Serve SPA + Proxy `/api/`

Edit konfigurasi Nginx agar:
- **`location /`** → serve file statis, fallback ke `index.html` (SPA routing)
- **`location /api/`** → teruskan ke VM backend

```bash
$ sudo nano /etc/nginx/sites-available/default
```

Ganti isi blok `server` menjadi:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;
    server_name _;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://<IP_BACKEND>/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

> **Ganti `<IP_BACKEND>`** dengan External IP `bosani-nps-instance-1`.
> Contoh: `proxy_pass http://34.9.36.125/api/;`

Test dan reload:

```bash
$ sudo nginx -t
```
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

```bash
$ sudo systemctl reload nginx
```

### 7.4 Verifikasi

**Tes proxy dari VM frontend:**

```bash
$ curl -sS "http://localhost/api/nps/test_user"
```

Jika proxy benar, respons JSON dari backend (bukan 404).

**Tes POST via curl:**

```bash
$ curl -X POST 'http://localhost/api/nps' \
  --header 'Content-Type: application/json' \
  --data '{
    "instagram_account": "www",
    "score": 9
  }'
```

Respons yang diharapkan:
```json
{"message":"Score created","id":1}
```

**Buka browser:** `http://<EXTERNAL_IP_INSTANCE_2>` — UI harus load dan berhasil memanggil API.

- Kirim skor → harus tersimpan dan muncul pesan "Tersimpan (id: ...)"
- Cari akun → harus menampilkan tabel data skor

---

## 8. Ringkasan

### Arsitektur singkat

```
Internet
   │
   ├──► http://<IP_FRONTEND>  →  Nginx ─┬─► SPA / statis (instance-2)
   │                                     │
   │                                     └─► location /api/ ──► proxy_pass
   │                                                               │
   └──► http://<IP_BACKEND>   →  Nginx  →  Express :3000  →  MariaDB (instance-1)
```

Browser hanya bicara ke IP frontend; Nginx frontend yang meneruskan `/api/...` ke backend.

### Checklist

```
✅ Instance-2 dibuat dengan spek sama seperti instance-1 (nama: bosani-nps-instance-2)
✅ Firewall HTTP/HTTPS aktif; SSH ke VM frontend berhasil
✅ Nginx terinstall; halaman default nginx terbuka dari External IP
✅ Git terinstall; repo frontend di GitHub; clone via SSH di VM frontend
✅ npm run build → dist/ di-copy ke /var/www/html/
✅ api-config.js dibuat (value kosong agar pakai proxy Nginx)
✅ Nginx: location / → SPA statis, location /api/ → proxy_pass ke IP backend
✅ curl POST/GET ke http://localhost/api/nps berhasil dari VM frontend
✅ Browser: UI bisa kirim skor & lihat data via proxy
```

### Commands Cheatsheet

```bash
# SSH (ganti zone)
gcloud compute ssh bosani-nps-instance-2 --zone=us-central1-b

# Nginx
sudo apt update && sudo apt install nginx
sudo systemctl status nginx

# Git
sudo apt install git-all
git config --global user.name "..." && git config --global user.email "..."

# Deploy build
npm run build
sudo cp -r dist/* /var/www/html/

# Edit api-config.js (set backend URL atau kosongkan untuk proxy)
sudo nano /var/www/html/api-config.js

# Nginx: tambah location /api/ proxy
sudo nano /etc/nginx/sites-available/default
sudo nginx -t && sudo systemctl reload nginx

# Verifikasi koneksi ke backend via proxy
curl -sS "http://localhost/api/nps/test_user"
curl -X POST 'http://localhost/api/nps' \
  -H 'Content-Type: application/json' \
  -d '{"instagram_account":"test","score":8}'
```

---

*Tutorial ini berbasis Google Cloud Console (Compute Engine), Debian 12, Nginx, dan GitHub SSH — konsisten dengan tutorial GCE lain di folder ini.*
