# Tutorial: Setup Domain & HTTPS (Let's Encrypt + Certbot)

Tutorial ini menjelaskan cara **menghubungkan domain** ke VM GCP dan memasang **HTTPS gratis** via **Let's Encrypt** + **Certbot**. Setelah selesai, aplikasi bisa diakses lewat `https://example.com` (bukan IP) dengan gembok hijau di browser.

Prasyarat: VM frontend dan backend sudah jalan sesuai [tutorial 03](03-integrasikan-database-backend-nginx.md) dan [tutorial 04](04-vm-frontend-nginx-git.md).

---

## Daftar Isi

1. [Arsitektur domain](#1-arsitektur-domain)
2. [DNS — Arahkan domain ke IP VM](#2-dns--arahkan-domain-ke-ip-vm)
3. [Update Nginx `server_name`](#3-update-nginx-server_name)
4. [Install Certbot & dapatkan SSL](#4-install-certbot--dapatkan-ssl)
5. [Update proxy frontend ke backend](#5-update-proxy-frontend-ke-backend)
6. [Verifikasi](#6-verifikasi)
7. [Troubleshooting](#7-troubleshooting)
8. [Ringkasan](#8-ringkasan)

---

## 1. Arsitektur domain

Ada dua pendekatan:

| Pendekatan | Domain | Keterangan |
|------------|--------|------------|
| **Satu domain** (simpel) | `example.com` → frontend | Backend tetap diakses lewat proxy Nginx frontend (`/api/` → IP backend). Tidak perlu domain untuk backend. |
| **Subdomain** (bersih) | `example.com` → frontend, `api.example.com` → backend | Masing-masing VM punya domain sendiri + SSL sendiri. |

**Rekomendasi untuk tutorial ini: subdomain.** Lebih fleksibel dan siap scale.

```
Internet
   │
   ├──► https://example.com      →  Nginx + SSL  →  SPA statis (instance-2)
   │                                     │
   │                                     └─► location /api/ → proxy ke api.example.com
   │
   └──► https://api.example.com  →  Nginx + SSL  →  Express :3000 → MariaDB (instance-1)
```

> Ganti `example.com` dengan domain Anda di seluruh tutorial ini.

---

## 2. DNS — Arahkan domain ke IP VM

Login ke panel DNS provider Anda (Niagahoster, Namecheap, Cloudflare, GoDaddy, Google Domains, dll.). Buat **A record** yang mengarahkan domain ke External IP VM.

### Record yang perlu dibuat

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` (atau `example.com`) | `<IP_FRONTEND>` (mis. `34.136.60.59`) | 300 atau Auto |
| A | `api` | `<IP_BACKEND>` (mis. `34.9.36.125`) | 300 atau Auto |

> **`@`** = root domain (`example.com`). **`api`** = subdomain (`api.example.com`).
> Jika hanya pakai satu domain (tanpa subdomain backend), cukup buat record `@` saja.

### Contoh di Cloudflare

1. Dashboard → pilih domain → **DNS** → **Records** → **Add record**
2. Type: **A**, Name: **@**, IPv4: **34.136.60.59**, Proxy status: **DNS only** (awan abu-abu)
3. Tambah lagi: Type: **A**, Name: **api**, IPv4: **34.9.36.125**, Proxy status: **DNS only**

> **Penting:** Matikan proxy (awan oranye) di Cloudflare jika mau pakai Certbot langsung. Atau pakai mode **DNS only** (awan abu-abu).

### Contoh di Niagahoster

1. **Member Area** → **Kelola Hosting** → **DNS Zone Editor**
2. Tambah record A: Name: domain Anda, Address: IP frontend
3. Tambah record A: Name: `api`, Address: IP backend

### Tunggu propagasi DNS

DNS biasanya propagasi dalam **5–15 menit**, kadang sampai **24 jam** tergantung provider & TTL sebelumnya.

**Verifikasi dari terminal lokal:**

```bash
$ ping example.com
```
```
PING example.com (34.136.60.59): 56 data bytes
64 bytes from 34.136.60.59: ...
```

```bash
$ ping api.example.com
```
```
PING api.example.com (34.9.36.125): 56 data bytes
64 bytes from 34.9.36.125: ...
```

Jika IP yang muncul sudah benar, DNS sudah propagasi — lanjut ke langkah berikutnya.

---

## 3. Update Nginx `server_name`

Certbot memerlukan `server_name` yang cocok dengan domain. Update di kedua VM.

### VM Frontend (instance-2)

```bash
$ sudo nano /etc/nginx/sites-available/default
```

Ganti `server_name _;` menjadi:

```nginx
server_name example.com;
```

Konfigurasi lengkap (sebelum SSL — Certbot akan menambah blok SSL otomatis):

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;
    server_name example.com;

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

```bash
$ sudo nginx -t && sudo systemctl reload nginx
```

### VM Backend (instance-1) — jika pakai subdomain

```bash
$ sudo nano /etc/nginx/sites-available/default
```

Ganti `server_name _;` menjadi:

```nginx
server_name api.example.com;
```

```bash
$ sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. Install Certbot & dapatkan SSL

Lakukan langkah ini di **kedua VM** (frontend dan backend, jika backend pakai subdomain).

### 4.1 Install Certbot

```bash
$ sudo apt update
$ sudo apt install certbot python3-certbot-nginx -y
```

### 4.2 Pastikan firewall HTTPS terbuka

Di **Google Cloud Console** → **VPC Network** → **Firewall rules**, pastikan VM mengizinkan port **443** (HTTPS). Jika saat create VM Anda sudah centang **Allow HTTPS traffic**, ini sudah aktif.

Verifikasi di Console: baris VM → kolom **Firewall** harus menunjukkan `http-server, https-server`.

### 4.3 Dapatkan sertifikat SSL

**Di VM Frontend:**

```bash
$ sudo certbot --nginx -d example.com
```

**Di VM Backend (jika pakai subdomain):**

```bash
$ sudo certbot --nginx -d api.example.com
```

Certbot akan bertanya:

```
Enter email address (used for urgent renewal and security notices):
```
Masukkan email Anda → **Enter**.

```
Please read the Terms of Service...
(A)gree/(C)ancel:
```
Ketik **A** → **Enter**.

```
Would you be willing to share your email...
(Y)es/(N)o:
```
Ketik **N** (opsional) → **Enter**.

Jika berhasil:

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/example.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/example.com/privkey.pem

Deploying certificate
Successfully deployed certificate for example.com to /etc/nginx/sites-enabled/default
```

Certbot **otomatis** mengedit Nginx config untuk:
- Listen di port **443** dengan SSL
- Redirect HTTP (80) → HTTPS (443)
- Mengarahkan ke file sertifikat

### 4.4 Verifikasi auto-renew

Sertifikat Let's Encrypt berlaku **90 hari**. Certbot memasang **timer systemd** yang otomatis memperpanjang sebelum expired.

```bash
$ sudo certbot renew --dry-run
```
```
Congratulations, all simulated renewals succeeded:
  /etc/letsencrypt/live/example.com/fullchain.pem (success)
```

Cek timer:

```bash
$ sudo systemctl status certbot.timer
```
```
● certbot.timer - Run certbot twice daily
     Active: active (waiting)
```

Tidak perlu melakukan apa-apa lagi — perpanjangan otomatis.

---

## 5. Update proxy frontend ke backend

Setelah backend punya SSL di `api.example.com`, update `proxy_pass` di Nginx frontend dari IP ke domain HTTPS.

**Di VM Frontend:**

```bash
$ sudo nano /etc/nginx/sites-available/default
```

Cari baris `proxy_pass` dan ganti:

```nginx
# Sebelum (IP langsung)
proxy_pass http://34.9.36.125/api/;

# Sesudah (domain + HTTPS)
proxy_pass https://api.example.com/api/;
```

```bash
$ sudo nginx -t && sudo systemctl reload nginx
```

> Jika tidak pakai subdomain backend (tetap IP), lewati langkah ini — `proxy_pass` tetap ke `http://<IP_BACKEND>/api/;`.

---

## 6. Verifikasi

### Browser

Buka `https://example.com` — harus muncul:
- Gembok hijau di address bar
- UI frontend load normal
- Kirim skor → berhasil tersimpan
- Cari akun → data muncul

### Redirect HTTP → HTTPS

```bash
$ curl -I http://example.com
```
```
HTTP/1.1 301 Moved Permanently
Location: https://example.com/
```

### Tes API via domain

```bash
$ curl -sS "https://example.com/api/nps/test_user"
```

```bash
$ curl -sS -X POST https://example.com/api/nps \
  -H "Content-Type: application/json" \
  -d '{"instagram_account":"test_user","score":9}'
```

---

## 7. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|--------|---------------|--------|
| Certbot error: `Could not connect` | DNS belum propagasi ke IP VM | Tunggu propagasi, cek dengan `ping domain.com` |
| Certbot error: `Timeout during connect` | Firewall port 80/443 tidak terbuka | Cek firewall GCP → pastikan HTTP & HTTPS dicentang |
| Browser: `NET::ERR_CERT_AUTHORITY_INVALID` | Sertifikat belum ter-deploy / Nginx belum reload | Jalankan `sudo certbot --nginx -d domain.com` ulang, lalu `sudo systemctl reload nginx` |
| Browser: `ERR_CONNECTION_REFUSED` di :443 | Nginx belum listen port 443 | Cek `sudo certbot --nginx` sudah dijalankan; cek `sudo nginx -t` |
| `502 Bad Gateway` setelah SSL | Backend mati atau `proxy_pass` salah | Cek `pm2 status` di backend; pastikan `proxy_pass` URL benar |
| Mixed content warning | Frontend HTTPS memanggil API HTTP | Pastikan `proxy_pass` pakai `https://` jika backend punya SSL, atau gunakan path relatif (`/api/...`) lewat proxy |

### Cek sertifikat dari terminal

```bash
$ sudo certbot certificates
```
```
Certificate Name: example.com
    Domains: example.com
    Expiry Date: 2026-07-06
    Certificate Path: /etc/letsencrypt/live/example.com/fullchain.pem
```

### Perpanjang manual (jika perlu)

```bash
$ sudo certbot renew
$ sudo systemctl reload nginx
```

---

## 8. Ringkasan

### Checklist

```
✅ DNS: A record domain → IP frontend, subdomain api → IP backend
✅ DNS propagasi OK (ping menunjukkan IP yang benar)
✅ Nginx: server_name diset ke domain (bukan _)
✅ Certbot terinstall; sertifikat SSL didapat untuk setiap domain
✅ HTTPS aktif: gembok hijau di browser
✅ HTTP → HTTPS redirect otomatis
✅ Auto-renew: certbot.timer aktif, dry-run sukses
✅ Proxy frontend → backend tetap jalan via HTTPS
```

### Commands Cheatsheet

```bash
# DNS: verifikasi propagasi
ping example.com
ping api.example.com

# Nginx: update server_name
sudo nano /etc/nginx/sites-available/default
sudo nginx -t && sudo systemctl reload nginx

# Certbot: install
sudo apt update && sudo apt install certbot python3-certbot-nginx -y

# Certbot: dapatkan SSL (jalankan di masing-masing VM)
sudo certbot --nginx -d example.com
sudo certbot --nginx -d api.example.com

# Certbot: cek sertifikat & auto-renew
sudo certbot certificates
sudo certbot renew --dry-run
sudo systemctl status certbot.timer

# Tes HTTPS
curl -I http://example.com         # harus redirect 301
curl -sS https://example.com/api/nps/test_user
```

---

*Tutorial ini melanjutkan seri GCE — menambahkan domain dan HTTPS di atas infrastruktur VM, Nginx, dan Node.js dari tutorial sebelumnya.*
