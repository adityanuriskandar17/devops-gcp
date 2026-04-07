# Tutorial: Integrasi Database, Backend Node.js & Setting Nginx

Tutorial ini menjelaskan cara menjalankan API **NPS (Net Promoter Score)** berbasis **Node.js (Express)** + **MariaDB** di VM, dengan **Nginx** sebagai reverse proxy di depan aplikasi (port 80 → 3000). Dokumen ini melengkapi setup VM, database, dan Git dari tutorial sebelumnya.

---

## Daftar Isi

1. [Ringkasan stack](#1-ringkasan-stack)
2. [Menjalankan aplikasi](#2-menjalankan-aplikasi)
3. [Database](#3-database)
4. [Base URL](#4-base-url)
5. [Endpoint API](#5-endpoint-api)
6. [Konfigurasi Nginx](#6-konfigurasi-nginx) — [Backup](#backup-konfigurasi-lama) · [Edit](#edit-file-default) · [Isi blok server](#isi-lengkap-blok-server) · [Reload](#verifikasi-dan-reload-nginx)
7. [Postman](#7-postman)
8. [Troubleshooting](#8-troubleshooting)
9. [Keamanan (produksi)](#9-keamanan-produksi)
10. [Ringkasan](#10-ringkasan)

---

## 1. Ringkasan stack

```
┌─────────────────────────────────────────────────────────────────┐
│  Client (browser / Postman / cURL)                               │
│         │                                                        │
│         ▼  :80                                                   │
│  ┌──────────────┐    proxy_pass    ┌──────────────────────────┐ │
│  │  Nginx       │ ───────────────► │  Express (app.js)        │ │
│  │  reverse     │                  │  :3000                   │ │
│  │  proxy       │                  └───────────┬──────────────┘ │
│  └──────────────┘                              │                │
│                                                ▼                │
│                                     ┌──────────────────────────┐ │
│                                     │  MariaDB                 │ │
│                                     │  DB: bosani_nps          │ │
│                                     │  Table: nps_score_tab    │ │
│                                     └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

| Komponen | Peran |
|----------|--------|
| **Nginx** | Mendengarkan port **80**, meneruskan ke **127.0.0.1:3000** |
| **Express** (`app.js`) | API di port **3000** |
| **MariaDB** | Database `bosani_nps`, tabel `nps_score_tab` |

---

## 2. Menjalankan aplikasi

Asumsikan repo sudah di-clone ke home (mis. `~/bosani-nps`):

```bash
$ cd ~/bosani-nps
$ npm install
```

### Masalah: `npm start` mati saat SSH ditutup

Jika Anda jalankan `npm start` biasa, proses Node.js berjalan di **foreground** — begitu SSH ditutup, proses ikut mati dan API tidak bisa diakses.

### Solusi: PM2 (Process Manager)

**PM2** menjaga app tetap jalan di background, otomatis restart kalau crash, dan bisa auto-start saat VM reboot.

**Install PM2:**

```bash
$ sudo npm install -g pm2
```

**Jalankan app dengan PM2:**

```bash
$ cd ~/bosani-nps
$ pm2 start app.js --name bosani-nps
```
```
[PM2] Starting /home/.../bosani-nps/app.js in fork_mode
[PM2] Done.
┌────┬──────────────┬─────────┬──────┬───────┬──────────┐
│ id │ name         │ mode    │ ↺    │ status│ cpu      │
├────┼──────────────┼─────────┼──────┼───────┼──────────┤
│ 0  │ bosani-nps   │ fork    │ 0    │ online│ 0%       │
└────┴──────────────┴─────────┴──────┴───────┴──────────┘
```

**Auto-start saat VM reboot:**

```bash
$ pm2 startup
$ pm2 save
```

> `pm2 startup` akan menampilkan perintah `sudo ...` — **copy-paste dan jalankan** perintah tersebut.

**Perintah PM2 yang sering dipakai:**

```bash
$ pm2 status              # lihat status semua app
$ pm2 logs bosani-nps     # lihat log (Ctrl+C untuk keluar)
$ pm2 restart bosani-nps  # restart app
$ pm2 stop bosani-nps     # stop app
$ pm2 delete bosani-nps   # hapus app dari PM2
```

Sekarang tutup SSH — app tetap jalan.

---

## 3. Database

- **Database:** `bosani_nps`
- **Tabel:** `nps_score_tab`

Struktur kolom (sesuai setup di [01-create-vm-nginx-mariadb.md](01-create-vm-nginx-mariadb.md)):

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | INT, AI | Primary key |
| `score` | FLOAT | Wajib diisi saat insert |
| `instagram_account` | VARCHAR(255) | Username Instagram |
| `created_time` | DATETIME | Default timestamp |
| `updated_time` | DATETIME | Auto update |

Kredensial koneksi di `app.js` sebaiknya dipindah ke **variabel lingkungan** — jangan commit password ke Git.

---

## 4. Base URL

| Lingkungan | Contoh |
|------------|--------|
| Langsung ke Node | `http://127.0.0.1:3000` |
| Lewat Nginx (publik) | `http://<IP-VM>` (port 80) |

Semua path di bawah mengasumsikan base URL tanpa trailing slash berlebihan.

---

## 5. Endpoint API

### `GET /api/nps/:account`

Mengambil semua baris NPS untuk **satu akun Instagram**.

**Parameter path**

| Nama | Tipe | Keterangan |
|------|------|------------|
| `account` | string | Nilai **`instagram_account`** di database (bukan `id` numerik) |

**Contoh request**

```http
GET /api/nps/test_user
```

**Respons sukses:** `200 OK` — body JSON berupa **array** objek baris.

```json
[
  {
    "id": 1,
    "score": 9,
    "instagram_account": "test_user",
    "created_time": "2024-04-07T07:22:54.000Z",
    "updated_time": "2024-04-07T07:22:54.000Z"
  }
]
```

Jika tidak ada data untuk akun tersebut, server mengembalikan array kosong:

```json
[]
```

**cURL (localhost)**

```bash
$ curl -sS "http://127.0.0.1:3000/api/nps/test_user"
```

---

### `POST /api/nps`

Menyimpan satu skor NPS.

**Header**

| Header | Nilai |
|--------|--------|
| `Content-Type` | `application/json` |

**Body (JSON)**

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `instagram_account` | string | Ya | Username Instagram |
| `score` | number | Ya | Nilai skor (angka, boleh `0`) |

**Contoh body**

```json
{
  "instagram_account": "test_user",
  "score": 9
}
```

**Respons sukses:** `201 Created`

```json
{
  "message": "Score created",
  "id": 1
}
```

Field `id` adalah **auto-increment** dari baris yang baru disisipkan.

**Validasi gagal:** `400 Bad Request` jika `instagram_account` atau `score` tidak ada.

```json
{
  "error": "instagram_account and score are required"
}
```

**Gagal server / database:** `500 Internal Server Error`

```json
{
  "error": "Failed to insert score"
}
```

**cURL (localhost)**

```bash
$ curl -sS -X POST http://127.0.0.1:3000/api/nps \
  -H "Content-Type: application/json" \
  -d '{"instagram_account":"test_user","score":9}'
```

> **Tes lewat IP publik** (port 80 / Nginx) ada di [§7 Postman](#7-postman) — lakukan setelah [§6 Konfigurasi Nginx](#6-konfigurasi-nginx).

---

## 6. Konfigurasi Nginx

Tujuan: Nginx di port **80** meneruskan semua request ke **Express** di **127.0.0.1:3000**. Blok `location /` harus memakai **`proxy_pass`**, bukan `try_files` ke file statis.

---

### Backup konfigurasi lama

**Selalu backup dulu** sebelum mengganti isi file, supaya bisa mengembalikan konfigurasi jika ada kesalahan:

```bash
$ sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak.$(date +%Y%m%d-%H%M%S)
```

Perintah ini membuat salinan dengan nama seperti `default.bak.20260407-143022` (tanggal & jam saat perintah dijalankan). Cek file backup:

```bash
$ ls -la /etc/nginx/sites-available/default*
```

---

### Edit file default

Buka file konfigurasi di `/etc/nginx/sites-available/default` dengan editor (nano):

```bash
$ sudo nano /etc/nginx/sites-available/default
```

- Simpan: **Ctrl+O** → **Enter**
- Keluar: **Ctrl+X**

---

### Isi lengkap blok server

Ganti isi file menjadi **hanya** blok `server` berikut (sesuaikan jika VM Anda memakai layout site lain; untuk tutorial ini satu blok `server` untuk port 80 sudah cukup):

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Penjelasan singkat**

| Bagian | Fungsi |
|--------|--------|
| `listen 80` … `default_server` | Nginx mendengarkan HTTP di IPv4 dan IPv6 sebagai server default |
| `server_name _` | Catch-all untuk hostname apa pun |
| `location /` + `proxy_pass` | Semua path diteruskan ke aplikasi Node di port 3000 |
| Header `X-Forwarded-*` | Agar aplikasi tahu IP asli client dan skema (http/https) |

> **Catatan:** Di Debian/Ubuntu, `sites-enabled/default` biasanya symlink ke `sites-available/default`. Mengedit `sites-available/default` sudah memengaruhi site yang aktif.

---

### Verifikasi dan reload Nginx

Setelah menyimpan file:

```bash
$ sudo nginx -t
```

Harus muncul `syntax is ok` dan `test is successful`. Jika ada error, perbaiki file atau pulihkan dari backup:

```bash
$ sudo cp /etc/nginx/sites-available/default.bak.YYYYMMDD-HHMMSS /etc/nginx/sites-available/default
```

(Ganti nama file `.bak...` dengan file backup yang Anda punya.)

Lalu reload agar konfigurasi baru dipakai tanpa putus koneksi lama:

```bash
$ sudo systemctl reload nginx
```

---

## 7. Postman

Setelah Nginx mem-proxy ke aplikasi di **127.0.0.1:3000**, Anda bisa menguji API dari komputer lain memakai **External IP** VM (bukan hanya localhost).

| Method | URL |
|--------|-----|
| GET | `http://<IP-VM>/api/nps/<instagram_account>` |
| POST | `http://<IP-VM>/api/nps` |

- **GET:** tab **Body** → **none**
- **POST:** tab **Body** → **raw** → **JSON**, dan set header `Content-Type: application/json`

**cURL (lewat IP publik / Nginx)** — untuk memastikan reverse proxy berjalan:

```bash
$ curl -sS -X POST http://<IP-VM>/api/nps \
  -H "Content-Type: application/json" \
  -d '{"instagram_account":"test_user","score":9}'
```

```bash
$ curl -sS "http://<IP-VM>/api/nps/test_user"
```

---

## 8. Troubleshooting

| Gejala | Penyebab umum | Yang dicek |
|--------|---------------|------------|
| **502 Bad Gateway** | Tidak ada proses di port **3000** | Jalankan `pm2 start app.js --name bosani-nps` atau cek `pm2 status` |
| **404** HTML dari Nginx untuk `/api/...` | `sites-enabled/default` masih pakai **`try_files`** | Ganti dengan blok **`proxy_pass`** seperti di atas |
| **GET** `/api/nps/1` mengembalikan `[]` | Path `:account` adalah **username**, bukan **id** | Gunakan `/api/nps/nama_user` |
| **500** saat POST | Kolom INSERT tidak cocok dengan skema tabel | Cek struktur tabel dan log di terminal Node (`console.error`) |

---

## 9. Keamanan (produksi)

- Jangan menyimpan password database di dalam kode; gunakan `.env` atau secret manager.
- Pertimbangkan **HTTPS** (mis. Let’s Encrypt) untuk trafik publik.
- Batasi firewall GCP hanya ke port yang diperlukan (mis. 22, 80, 443).

---

## 10. Ringkasan

### Checklist

```
✅ MariaDB: database bosani_nps & tabel nps_score_tab sudah ada
✅ PM2 terinstall; app jalan via pm2 start (bukan npm start)
✅ pm2 startup + pm2 save → app auto-start saat VM reboot
✅ Nginx: backup `default` sebelum edit; `location /` mem-proxy ke 127.0.0.1:3000
✅ GET /api/nps/:account & POST /api/nps teruji (localhost atau IP VM)
✅ SSH ditutup → app tetap jalan (cek: buka IP VM di browser)
```

### Commands Cheatsheet

```bash
# Install dependencies
cd ~/bosani-nps && npm install

# PM2: jalankan app (tetap hidup setelah SSH ditutup)
sudo npm install -g pm2
pm2 start app.js --name bosani-nps
pm2 startup    # lalu jalankan perintah sudo yang muncul
pm2 save

# PM2: kelola app
pm2 status
pm2 logs bosani-nps
pm2 restart bosani-nps

# Nginx (backup dulu sebelum edit)
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak.$(date +%Y%m%d-%H%M%S)
sudo nano /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl reload nginx

# Tes cepat API
curl -sS "http://127.0.0.1:3000/api/nps/nama_user"
curl -sS -X POST http://127.0.0.1:3000/api/nps \
  -H "Content-Type: application/json" \
  -d '{"instagram_account":"test_user","score":9}'
```

---

*Tutorial ini melanjutkan alur VM Debian 12, Nginx, MariaDB, dan Git dari tutorial GCE lain di folder ini — fokus pada integrasi backend Node.js dan reverse proxy.*
