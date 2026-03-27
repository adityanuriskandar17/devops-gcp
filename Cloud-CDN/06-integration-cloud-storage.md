# Integrasi Cloud CDN + Cloud Storage

Panduan detail mengintegrasikan **Cloud CDN** dengan **Cloud Storage** sebagai origin, termasuk flow, skenario, dan konfigurasi.

---

## Hubungan Cloud CDN dan Cloud Storage

```
Cloud Storage = tempat menyimpan file (origin)
Cloud CDN     = jaringan cache yang mempercepat akses ke file tersebut

┌──────────────────────────────────────────────────┐
│ Tanpa CDN:                                       │
│   User Jakarta ──200ms──► GCS bucket (US)        │
│   User Tokyo   ──150ms──► GCS bucket (US)        │
│   Setiap user langsung ke bucket = lambat + mahal│
├──────────────────────────────────────────────────┤
│ Dengan CDN:                                      │
│   User Jakarta ──10ms──► Edge Jakarta (cache HIT)│
│   User Tokyo   ──10ms──► Edge Tokyo (cache HIT)  │
│   Hanya cache MISS yang ke bucket = cepat + murah│
└──────────────────────────────────────────────────┘
```

---

## Arsitektur: CDN + Cloud Storage

```
┌────────────────────────────────────────────────────────────┐
│                     Users (Global)                          │
└────────────────────────┬───────────────────────────────────┘
                         │ HTTPS request
                         ▼
              ┌─────────────────────┐
              │  External HTTPS     │
              │  Load Balancer      │
              │  (Frontend: IP+SSL) │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │    Cloud CDN        │
              │    (Edge Cache)     │
              │                     │
              │  HIT → return       │
              │  MISS ↓             │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │   Backend Bucket    │
              │  (GCS bucket link)  │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │   Cloud Storage     │
              │   Bucket            │
              │                     │
              │   /index.html       │
              │   /css/style.css    │
              │   /js/app.js        │
              │   /images/logo.png  │
              └─────────────────────┘
```

---

## Setup Lengkap: Cloud CDN + Cloud Storage

### Step 1: Buat Cloud Storage Bucket

**Console:** `Cloud Storage` → **Create bucket**

| Setting | Rekomendasi untuk CDN |
|---------|-----------------------|
| **Name** | Unique, deskriptif (contoh: `mysite-static-assets`) |
| **Location** | Multi-region (untuk availability) atau Regional (untuk cost) |
| **Storage class** | Standard (konten akan sering diakses via CDN) |
| **Access control** | Uniform bucket-level access |
| **Public access** | Bisa public read ATAU private + Signed URL |

### Step 2: Upload konten

```bash
gcloud storage cp -r ./website/* gs://mysite-static-assets/
```

### Step 3: Set Permission (jika public)

```bash
# Public read untuk semua objek
gcloud storage buckets add-iam-policy-binding gs://mysite-static-assets \
    --member=allUsers \
    --role=roles/storage.objectViewer
```

### Step 4: Buat Load Balancer + Backend Bucket + CDN

**Console:** `Network services` → **Load balancing** → **Create load balancer**

1. Pilih **Application Load Balancer (HTTP/S)** → **Start configuration**
2. Pilih **From Internet to my VMs or serverless services** → **Global external**

#### Backend configuration

| Setting | Value |
|---------|-------|
| **Create backend bucket** | Klik |
| **Cloud Storage bucket** | Pilih `mysite-static-assets` |
| **Enable Cloud CDN** | **Centang** |
| **Cache mode** | CACHE_ALL_STATIC |
| **Default TTL** | 3600 (1 jam) |
| **Max TTL** | 86400 (24 jam) |

#### Frontend configuration

| Setting | Value |
|---------|-------|
| **Protocol** | HTTPS |
| **IP address** | Create/select static IP |
| **Certificate** | Google-managed (masukkan domain) |

3. **Review** → **Create**

### Step 5: Setup DNS

Arahkan domain ke IP Load Balancer:

```
www.example.com → A record → 34.xxx.xxx.xxx (LB IP)
```

---

## Flow Detail: Request User ke CDN + Cloud Storage

```
User browser: GET https://www.example.com/images/logo.png

Step 1: DNS resolve www.example.com → 34.xxx.xxx.xxx (LB Anycast IP)
Step 2: Request masuk ke edge terdekat (Jakarta)

Step 3: Edge cek cache
  ├── CACHE HIT:
  │   └── Return cached logo.png (Age: 1200, Cache-Status: hit)
  │       Latency: ~5-15ms
  │
  └── CACHE MISS:
      Step 4: Edge forward ke Load Balancer
      Step 5: LB forward ke Backend Bucket
      Step 6: Backend Bucket fetch dari GCS bucket
      Step 7: GCS return logo.png
      Step 8: Edge cache logo.png (TTL dari Cache-Control / Default TTL)
      Step 9: Return logo.png ke User
              Latency: ~50-200ms (tergantung jarak ke GCS bucket)

Next request dari Jakarta:
  CACHE HIT → ~5-15ms (dari edge cache)
```

---

## Skenario 1: Website Statis + CDN

```
Use case: Company profile website

Struktur bucket:
  gs://company-website/
  ├── index.html
  ├── about.html
  ├── css/
  │   └── style.css
  ├── js/
  │   └── app.js
  ├── images/
  │   ├── logo.png
  │   ├── hero.jpg
  │   └── team.jpg
  └── fonts/
      ├── inter.woff2
      └── poppins.woff2

Caching strategy:
  HTML files     → TTL 5 menit (berubah saat deploy)
  CSS/JS (hashed)→ TTL 1 tahun (filename berubah saat build)
  Images         → TTL 1 bulan
  Fonts          → TTL 1 tahun

Traffic pattern:
  • 100.000 visitors/hari dari Indonesia
  • Cache hit ratio: ~95%
  • GCS hanya serve ~5% request (cache MISS)
  • Cost: mayoritas CDN egress (lebih murah dari GCS egress)
```

---

## Skenario 2: E-commerce Product Images

```
Use case: 50.000 gambar produk, akses dari seluruh Asia

Bucket:
  gs://product-images/
  ├── product-001/
  │   ├── main.jpg
  │   ├── thumb.jpg
  │   └── gallery-1.jpg
  ├── product-002/
  │   └── ...
  └── ...

CDN config:
  Cache mode: CACHE_ALL_STATIC
  Default TTL: 86400 (24 jam)
  Max TTL: 604800 (7 hari)

Saat gambar produk diupdate:
  Option A: Cache invalidation
    gcloud compute url-maps invalidate-cdn-cache LB_NAME \
        --path="/product-001/*"

  Option B: Versioned URL (lebih baik)
    /product-001/main.jpg?v=20260323
    → Upload gambar baru → update URL di database → CDN fetch fresh
```

---

## Skenario 3: Private Content + Signed URL

```
Use case: PDF dokumen premium yang hanya bisa diakses subscriber

Bucket:
  gs://premium-docs/ (PRIVATE, tidak public read)

Flow:
  1. User login ke aplikasi
  2. User klik "Download PDF"
  3. Server generate signed URL:
     https://cdn.example.com/docs/report.pdf?Expires=...&Signature=...
  4. Browser download via signed URL → CDN serve (atau fetch dari GCS)
  5. Setelah expired, URL tidak bisa dipakai lagi

CDN config:
  Signed URL enabled pada backend bucket
  Cache mode: USE_ORIGIN_HEADERS
  TTL: 1 jam
```

---

## Skenario 4: Multi-origin (Website + API)

```
1 Load Balancer, 2 backend berbeda:

  URL Map:
    /api/*      → Backend Service (Cloud Run)     → CDN OFF
    /static/*   → Backend Bucket (GCS: static)    → CDN ON, TTL 7 hari
    /uploads/*  → Backend Bucket (GCS: uploads)   → CDN ON, TTL 1 hari
    /*          → Backend Bucket (GCS: website)   → CDN ON, TTL 1 jam

  Arsitektur:
    User ──► LB ──┬── /api/*     ──► Cloud Run (no cache)
                  ├── /static/*  ──► GCS static (CDN cache 7d)
                  ├── /uploads/* ──► GCS uploads (CDN cache 1d)
                  └── /*         ──► GCS website (CDN cache 1h)
```

---

## Biaya: CDN + Cloud Storage

### Tanpa CDN

| Komponen | Harga |
|----------|-------|
| GCS storage | ~$0.020/GB/bulan (Standard) |
| GCS egress ke internet | ~$0.12/GB |
| GCS operations (GET) | ~$0.004 per 10.000 |

### Dengan CDN

| Komponen | Harga |
|----------|-------|
| GCS storage | ~$0.020/GB/bulan (sama) |
| GCS egress ke CDN | **Free** (same Google network) |
| CDN cache egress | ~$0.02-0.08/GB (tergantung region) |
| CDN operations | Included |
| Load Balancer | ~$18/bulan (forwarding rule) |

### Contoh kalkulasi

```
Website dengan 1TB egress/bulan, 95% cache hit:

Tanpa CDN:
  1000GB × $0.12 = $120/bulan

Dengan CDN (95% hit):
  CDN egress: 950GB × $0.08 = $76
  GCS egress to CDN (miss): 50GB × $0 = $0 (free)
  Load Balancer: ~$18
  Total: ~$94/bulan

  Hemat: $120 - $94 = $26/bulan (22%)
  PLUS: 10x lebih cepat untuk user

Dengan CDN (99% hit — konten sangat statis):
  CDN egress: 990GB × $0.08 = $79.20
  Load Balancer: ~$18
  Total: ~$97/bulan

  Tapi latency dari 200ms → 10ms = UX jauh lebih baik
```

---

## Tips Konfigurasi

| Tips | Detail |
|------|--------|
| **Pakai hashed filenames** | `style.a1b2c3.css` → TTL 1 tahun, cache busting otomatis saat build |
| **Separate bucket untuk uploads** | User-uploaded content di bucket terpisah dengan TTL lebih pendek |
| **GCS location = dekat user mayoritas** | Jika 90% user Indonesia, GCS di `asia-southeast2` → cache MISS pun cepat |
| **Uniform access control** | Konsisten dan lebih mudah manage |
| **Compression** | GCS bisa serve compressed (gzip/brotli) → CDN cache versi compressed |
