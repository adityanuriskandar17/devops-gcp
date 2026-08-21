# Security

Fitur keamanan **Cloud CDN** yang mendalam, berorientasi pada **GCP Console**.

---

## Overview Keamanan CDN

```
Internet ──► Cloud Armor (DDoS/WAF) ──► Cloud CDN ──► SSL/TLS ──► Origin

Layer keamanan:
1. Cloud Armor     → Filter DDoS, WAF rules, geo-blocking
2. SSL/TLS         → Enkripsi traffic end-to-end
3. Signed URL      → Akses konten terbatas waktu
4. Signed Cookie   → Akses multiple konten terbatas waktu
5. IAP             → Autentikasi user (untuk backend service)
```

---

## SSL/TLS (HTTPS)

**Console path:** Load Balancer → **Edit** → **Frontend configuration** → **Certificate**

### Tipe certificate

| Tipe | Deskripsi | Console path |
|------|-----------|-------------|
| **Google-managed** | GCP otomatis provision dan renew SSL cert | LB → Frontend → **Create a new certificate** → Google-managed |
| **Self-managed** | Upload certificate sendiri (.crt + .key) | LB → Frontend → **Create a new certificate** → Upload |

### Google-managed — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| **Gratis** dan otomatis | Hanya untuk domain yang di-verify |
| Auto-renew sebelum expired | Provisioning awal bisa 15-60 menit |
| Tidak perlu manage cert manual | Hanya support RSA, belum ECDSA |

### Self-managed — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Kontrol penuh (wildcard, EV cert, ECDSA) | Harus renew manual / via automation |
| Langsung aktif setelah upload | Biaya cert (kecuali Let's Encrypt) |
| Bisa wildcard (*.example.com) | Risiko expired jika lupa renew |

### SSL Policy

**Console:** `Network Security` → **SSL policies** → **Create SSL policy**

| Setting | Opsi |
|---------|------|
| **Min TLS version** | TLS 1.0, 1.1, **1.2** (recommended) — maksimum yang bisa dipilih sebagai floor; LB tetap bisa nego up to TLS 1.3 dengan client yang mendukung |
| **Profile** | COMPATIBLE (luas), MODERN (aman), RESTRICTED (paling aman), CUSTOM |

---

## Signed URL

**Signed URL** = URL yang berisi signature (tanda tangan digital) dengan waktu expired. Hanya user yang memiliki URL ini yang bisa akses konten.

### Cara kerja

```
1. Server/aplikasi generate signed URL:
   https://cdn.example.com/video.mp4?Expires=1680300000&Signature=abc123...

2. User buka signed URL → CDN verifikasi signature:
   ├── Signature valid + belum expired → Konten dikirim (200 OK)
   └── Signature invalid / expired → Ditolak (403 Forbidden)

3. Setelah expired, URL tidak bisa dipakai lagi
```

### Kapan pakai Signed URL?

| Skenario | Contoh |
|----------|--------|
| **Premium content** | Video berbayar, e-book, file premium |
| **Temporary download** | Link download yang expired dalam 1 jam |
| **Private media** | Foto profil user yang tidak boleh publik |
| **Software distribution** | Link download installer yang controlled |

### Setup Signed URL

**Console path:** Backend → Cloud CDN → **Signed URLs and signed cookies**

| Step | Aksi |
|------|------|
| 1 | Buat **signing key** (generate key name + key value) |
| 2 | Attach key ke backend bucket / backend service |
| 3 | Generate signed URL di aplikasi menggunakan key |

### CLI setup

```bash
# Buat signing key di backend bucket
gcloud compute backend-buckets add-signed-url-key BACKEND_BUCKET \
    --key-name=my-key \
    --key-file=key.txt

# Buat signing key di backend service
gcloud compute backend-services add-signed-url-key BACKEND_SERVICE \
    --key-name=my-key \
    --key-file=key.txt \
    --global

# Generate signed URL (via gcloud)
gcloud compute sign-url \
    "https://cdn.example.com/video.mp4" \
    --key-name=my-key \
    --key-file=key.txt \
    --expires-in=1h
```

### Signed URL — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Kontrol akses per file | Setiap file butuh URL sendiri |
| Waktu expired configurable | URL bisa di-share (siapa pun yang punya URL bisa akses) |
| Tidak perlu autentikasi user | Perlu generate URL di server-side |
| Bekerja untuk file yang belum di-cache juga | — |

---

## Signed Cookie

**Signed Cookie** = cookie yang di-sign secara kriptografis, memberikan akses ke **banyak file** sekaligus selama cookie valid.

### Perbedaan Signed URL vs Signed Cookie

| Aspek | Signed URL | Signed Cookie |
|-------|-----------|---------------|
| **Scope** | 1 URL = 1 file | 1 cookie = banyak file (URL prefix) |
| **Kapan pakai** | Download 1 file | Streaming playlist / multi-file access |
| **Implementasi** | URL digenerate server-side | Cookie di-set via Set-Cookie header |
| **User experience** | Klik link khusus | Navigasi normal (cookie otomatis dikirim) |

### Cara kerja

```
1. User login di aplikasi Anda
2. Server set signed cookie:
   Set-Cookie: Cloud-CDN-Cookie=URLPrefix=aHR0cH...~Expires=1680300000~Signature=abc123...

3. Browser simpan cookie → otomatis kirim di setiap request ke CDN
4. CDN verifikasi cookie:
   ├── Valid + belum expired → Konten dikirim
   └── Invalid / expired → 403 Forbidden

5. User bisa akses semua konten di URL prefix selama cookie valid
```

### Contoh skenario

```
Platform kursus online:

  User login → server set signed cookie untuk prefix /courses/123/

  User bisa akses:
    /courses/123/video1.mp4  ✓
    /courses/123/video2.mp4  ✓
    /courses/123/slides.pdf  ✓

  User TIDAK bisa akses:
    /courses/456/video1.mp4  ✗ (beda course, diluar prefix)
```

---

## Cloud Armor (DDoS & WAF)

**Console path:** `Network Security` → **Cloud Armor** → **Create policy**

Cloud Armor bekerja **di depan** Cloud CDN — memfilter traffic berbahaya sebelum sampai ke CDN/origin.

### Fitur Cloud Armor

| Fitur | Deskripsi |
|-------|-----------|
| **DDoS protection** | Mitigasi L3/L4/L7 DDoS otomatis |
| **WAF rules** | SQL injection, XSS, RCE protection |
| **Geo-blocking** | Blokir / allow traffic berdasarkan negara |
| **Rate limiting** | Batasi request per IP per detik |
| **IP allowlist/denylist** | Allow/block IP/CIDR spesifik |
| **Bot management** | reCAPTCHA Enterprise integration |

### Setup Cloud Armor + CDN

| Step | Console path |
|------|-------------|
| 1 | `Network Security` → **Cloud Armor** → **Create policy** |
| 2 | Pilih **type**: Backend security policy |
| 3 | Tambah **rules** (contoh: block country, rate limit) |
| 4 | Attach policy ke **backend service** di Load Balancer |

### Contoh rules

```
Rule 1 (priority 1000): Allow Indonesia + Singapore
  action: allow
  condition: origin.region_code == 'ID' || origin.region_code == 'SG'

Rule 2 (priority 2000): Block known bad IPs
  action: deny(403)
  condition: inIpRange(origin.ip, '1.2.3.0/24')

Rule 3 (priority 3000): Rate limit per IP
  action: rate_based_ban
  rate_limit: 100 requests per 60 seconds
  ban_duration: 300 seconds

Default rule: allow (semua traffic lain dibolehkan)
```

### Cloud Armor — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| DDoS protection enterprise-grade | Biaya tambahan (per policy + per request) |
| WAF pre-configured rules | False positive mungkin block legitimate traffic |
| Geo-blocking untuk compliance | Rule management bisa kompleks |
| Integrasi langsung dengan LB + CDN | Hanya untuk External Application LB |

---

## Edge Security Policy

**Console path:** `Network Security` → **Cloud Armor** → Create policy → type: **Edge security policy**

Edge security policy dieksekusi **di edge CDN** (sebelum caching), sehingga request berbahaya diblokir tanpa membebani origin.

```
User request ──► Edge Security Policy ──► Cloud CDN cache ──► Origin
                 (filter di sini)         (cache di sini)

Tanpa edge policy:
  Bad request ──► CDN cache ──► Backend Security Policy ──► Origin
  (request tetap sampai ke CDN/origin layer)
```

| Aspek | Backend Security Policy | Edge Security Policy |
|-------|------------------------|---------------------|
| Lokasi eksekusi | Di backend (sebelum origin) | Di edge (sebelum CDN cache) |
| Bisa block sebelum cache? | Tidak | **Ya** |
| Fitur | Semua fitur Cloud Armor | IP allow/deny, geo-blocking |
| Kapan pakai | Proteksi origin | Proteksi CDN layer |

---

## CORS (Cross-Origin Resource Sharing)

Jika CDN serve assets untuk domain berbeda, perlu konfigurasi CORS di origin.

### Cloud Storage CORS

```bash
# cors.json
[
  {
    "origin": ["https://www.example.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]

gcloud storage buckets update gs://my-bucket --cors-file=cors.json
```

### Backend Service — custom header

**Console:** Backend service → **Edit** → **Custom response headers**

Tambahkan:
```
Access-Control-Allow-Origin: https://www.example.com
```

---

## Ringkasan: Layer Keamanan CDN

```
Layer 1: Cloud Armor Edge Policy
  → Blokir DDoS, geo-blocking, IP denylist
  → Sebelum CDN cache (paling awal)

Layer 2: SSL/TLS
  → Enkripsi semua traffic
  → Certificate managed atau self-managed

Layer 3: Signed URL / Signed Cookie
  → Kontrol akses per konten
  → Untuk premium/private content

Layer 4: Cloud Armor Backend Policy
  → WAF rules, rate limiting
  → Sebelum origin

Layer 5: Origin Security
  → IAM, firewall, VPC
  → Proteksi backend itu sendiri
```
