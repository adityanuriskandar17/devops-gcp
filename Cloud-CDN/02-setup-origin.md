# Setup Origin Cloud CDN

Panduan mengaktifkan **Cloud CDN** dan konfigurasi origin, berorientasi pada **GCP Console**.

---

## Prasyarat

Cloud CDN **membutuhkan** salah satu dari:

| Origin type | Deskripsi | Console path |
|-------------|-----------|-------------|
| **External Application Load Balancer** | HTTP(S) Load Balancer dengan backend service | `Network services` → **Load balancing** |
| **Backend bucket** | Cloud Storage bucket sebagai backend di Load Balancer | `Network services` → **Load balancing** → backend bucket |

Cloud CDN **tidak bisa berdiri sendiri** — harus di-enable melalui Load Balancer.

```
Arsitektur wajib:

  User ──► Cloud CDN ──► Load Balancer ──► Origin (backend service / bucket)

  Cloud CDN "menempel" di Load Balancer
```

---

## Cara Enable Cloud CDN

### Metode 1: Via Cloud CDN page (Add Origin Wizard)

**Console path:** `Network services` → **Cloud CDN** → **Add origin**

Wizard ini terdiri dari **3 step** berurutan:

```
┌──────────────────────────────────────────────────┐
│  ✅ Step 1: Origin basics                        │
│     │   Pilih origin (Load Balancer + backend)   │
│     │                                            │
│  ✅ Step 2: Host and path rules                  │
│     │   Tentukan host/domain dan path mana       │
│     │   yang akan di-cache oleh CDN              │
│     │                                            │
│  ③ Step 3: Cache performance                     │
│        Konfigurasi cache mode, TTL, cache keys   │
└──────────────────────────────────────────────────┘
```

#### Step 1: Origin basics

| Field | Deskripsi |
|-------|-----------|
| **Origin** | Pilih Load Balancer yang sudah ada sebagai origin CDN |
| **Backend(s)** | Pilih backend service atau backend bucket mana di dalam LB yang ingin di-CDN-kan |

#### Step 2: Host and path rules

| Field | Deskripsi |
|-------|-----------|
| **Hosts** | Domain/host yang akan dilayani CDN (contoh: `www.example.com`, `cdn.example.com`) |
| **Path rules** | Path mana yang di-cache (contoh: `/*` untuk semua, `/static/*` untuk statis saja) |

Di step ini bisa atur **multiple host + path rules** agar satu CDN origin melayani beberapa domain dan path berbeda.

#### Step 3: Cache performance

Step ini berisi semua konfigurasi caching:

**Basic options — Cache mode:**

| Opsi di Console | Internal name | Deskripsi |
|-----------------|---------------|-----------|
| **Cache static content (recommended)** | `CACHE_ALL_STATIC` | CDN otomatis cache konten statis (gambar, CSS, JS, video) berdasarkan Content-Type. Origin tidak perlu set header. **Default dan recommended.** |
| **Use origin settings based on Cache-Control headers** | `USE_ORIGIN_HEADERS` | CDN hanya cache jika origin mengirim `Cache-Control` header. Origin harus set header sendiri. Cocok untuk API atau konten yang butuh kontrol penuh. |
| **Force cache all content** | `FORCE_CACHE_ALL` | CDN cache **semua** response (200 OK), mengabaikan `private`, `no-store`, atau `no-cache` dari origin. Hati-hati: bisa cache konten sensitif. |

**TTL Settings:**

| Setting di Console | Default | Range | Deskripsi |
|-------------------|---------|-------|-----------|
| **Client TTL** | 1 hour | 0 - 1 tahun | Berapa lama browser user menyimpan cache lokal (`max-age` di response header) |
| **Default TTL** | 1 hour | 0 - 1 tahun | Berapa lama CDN edge menyimpan cache jika origin tidak kirim `Cache-Control` |
| **Maximum TTL** | 1 day | 0 - 1 tahun | Batas atas TTL di CDN — meskipun origin kirim `max-age=1year`, CDN tidak cache lebih dari Maximum TTL |

**Cache keys:** (di bawah TTL settings)

Menentukan komponen URL mana yang dijadikan key cache. Lihat detail di [03-caching-policies.md](03-caching-policies.md).

| Komponen | Default | Opsi |
|----------|---------|------|
| **Include host** | Ya | Ya / Tidak |
| **Include protocol** | Ya | Ya / Tidak |
| **Include query string** | Semua | Include all / Exclude all / Include specific / Exclude specific |

Detail setiap opsi dan kelebihan/kekurangannya: [03-caching-policies.md](03-caching-policies.md)

### Metode 2: Via Load Balancer (saat create/edit)

**Console path:** `Network services` → **Load balancing** → klik LB → **Edit** → **Backend configuration** → centang **Enable Cloud CDN**

| Step | Aksi |
|------|------|
| 1 | Buka Load Balancer → **Edit** |
| 2 | Di **Backend configuration**, pilih backend |
| 3 | Centang **Enable Cloud CDN** |
| 4 | Konfigurasi cache mode, TTL, dll (opsi sama seperti Step 3 wizard di atas) |
| 5 | **Save** |

---

## Tipe Origin

### Origin 1: Backend Bucket (Cloud Storage)

**Console path:** `Network services` → **Load balancing** → **Create** → **Backend configuration** → **Create a backend bucket**

Gunakan Cloud Storage bucket sebagai origin. Cocok untuk:
- Website statis (HTML, CSS, JS)
- Gambar, video, file download
- SPA (Single Page Application)

```
Flow:

  User ──► Cloud CDN Edge ──► Load Balancer ──► Backend Bucket ──► GCS Bucket
                                                                    │
                                                                    ├── index.html
                                                                    ├── style.css
                                                                    ├── logo.png
                                                                    └── app.js
```

#### Langkah create backend bucket + CDN

1. **Buat bucket** (jika belum ada):
   `Cloud Storage` → **Create bucket** → pilih nama, region, class

2. **Buat Load Balancer** (jika belum ada):
   `Network services` → **Load balancing** → **Create** → **Application Load Balancer (HTTP/S)** → **Internet-facing**

3. **Backend configuration:**
   - Klik **Create a backend bucket**
   - **Cloud Storage bucket:** pilih bucket
   - **Enable Cloud CDN:** centang
   - **Cache mode:** pilih (lihat [03-caching-policies.md](03-caching-policies.md))

4. **Frontend configuration:**
   - Protocol: HTTPS
   - IP: Reserve static IP atau pilih existing
   - Certificate: pilih SSL certificate

5. **Review and finalize** → **Create**

#### Kelebihan & kekurangan backend bucket

| Kelebihan | Kekurangan |
|-----------|------------|
| Setup paling sederhana | Hanya bisa serve file statis (tidak ada server-side logic) |
| Biaya rendah (Cloud Storage + CDN egress saja) | Tidak bisa custom header / rewrite di origin level |
| Auto-scale (GCS tidak pernah down karena traffic) | URL path = path di bucket (tidak flexible) |
| Cocok untuk gambar, CSS, JS, font | Tidak support WebSocket |

### Origin 2: Backend Service (Compute Engine / GKE / Cloud Run)

**Console path:** `Network services` → **Load balancing** → **Backend configuration** → **Create a backend service**

Gunakan VM / container sebagai origin. Cocok untuk:
- API backend yang ingin di-cache sebagian
- Website dinamis dengan konten cacheable
- Mixed content (statis + dinamis)

```
Flow:

  User ──► Cloud CDN Edge ──► Load Balancer ──► Backend Service
                                                     │
                                          ┌──────────┴──────────┐
                                          │                     │
                                    Instance Group          NEG (Cloud Run/GKE)
                                    (Compute Engine)
```

#### Langkah create backend service + CDN

1. **Buat backend** (VM / Instance Group / Cloud Run / GKE)

2. **Create / Edit Load Balancer:**
   - Backend configuration → **Create a backend service**
   - **Backend type:** Instance group / NEG / Serverless NEG
   - Pilih backend yang sudah dibuat
   - **Enable Cloud CDN:** centang
   - Konfigurasi cache mode dan TTL

3. **Frontend configuration:** (sama seperti di atas)

4. **Create**

#### Kelebihan & kekurangan backend service

| Kelebihan | Kekurangan |
|-----------|------------|
| Bisa serve konten dinamis + statis | Lebih kompleks untuk di-setup |
| Kontrol penuh atas origin (custom header, rewrite, logic) | Origin bisa overload jika cache hit rendah |
| Bisa selective caching (per path rule) | Biaya lebih tinggi (VM/container + LB + CDN) |
| Cocok untuk API + website | Perlu manage backend health |

---

## Konfigurasi CDN saat Enable

Saat enable Cloud CDN di backend, Console menampilkan opsi:

| Setting | Opsi | Default | Deskripsi |
|---------|------|---------|-----------|
| **Cache mode** | USE_ORIGIN_HEADERS / CACHE_ALL_STATIC / FORCE_CACHE_ALL | CACHE_ALL_STATIC | Bagaimana CDN menentukan apa yang di-cache |
| **Default TTL** | 0 - 31536000 detik | 3600 (1 jam) | Berapa lama konten di-cache |
| **Max TTL** | 0 - 31536000 detik | 86400 (24 jam) | Batas atas TTL |
| **Client TTL** | 0 - 31536000 detik | 3600 (1 jam) | Cache-Control max-age yang dikirim ke browser |
| **Negative caching** | ON / OFF | OFF | Cache response 404/301/302 |
| **Serve stale content** | ON / OFF | ON | Sajikan cache expired jika origin down |
| **Cache key policy** | Include/exclude host, protocol, query string | Include all | Apa yang dijadikan key cache |

Detail setiap setting: [03-caching-policies.md](03-caching-policies.md)

---

## Multi-backend dengan URL Map

Satu Load Balancer bisa punya **beberapa backend** dengan **path rules** berbeda:

```
URL Map (Host & Path Rules):

  example.com/api/*     ──► Backend Service (Cloud Run) ──► CDN OFF
  example.com/images/*  ──► Backend Bucket (GCS)        ──► CDN ON, TTL 24h
  example.com/static/*  ──► Backend Bucket (GCS)        ──► CDN ON, TTL 7d
  example.com/*         ──► Backend Service (VM)         ──► CDN ON, TTL 1h
```

**Console path:** Load Balancer → **Edit** → **Routing rules** → **Advanced host and path rule**

Setiap backend bisa punya **setting CDN yang berbeda**:
- API: CDN off (data dinamis)
- Images: CDN on, TTL panjang (jarang berubah)
- Static assets: CDN on, TTL sangat panjang + versioned filename

---

## Skenario: Setup Website Statis dengan CDN

```
Langkah:

1. Buat GCS bucket: "my-website-assets"
   Upload: index.html, style.css, app.js, logo.png

2. Buat Load Balancer:
   • Frontend: HTTPS, IP static, SSL certificate
   • Backend: Backend bucket → "my-website-assets"
   • Enable Cloud CDN pada backend bucket

3. Setup DNS:
   Arahkan www.example.com → IP Load Balancer

4. Test:
   curl -I https://www.example.com/logo.png
   ──► Pertama: X-Cache: MISS (fetch dari GCS)
   ──► Kedua:   X-Cache: HIT (dari edge cache)
```

---

## Skenario: Setup API + Website dengan CDN

```
Langkah:

1. Buat backend service: API server di Cloud Run
   Buat backend bucket: GCS bucket untuk assets statis

2. Buat Load Balancer dengan URL map:
   • /api/* → Backend Service (CDN OFF)
   • /*     → Backend Bucket (CDN ON, TTL 1 jam)

3. Enable CDN hanya pada backend bucket

4. SSL certificate + DNS setup

5. Result:
   • https://example.com/           → CDN (cache HIT)
   • https://example.com/style.css  → CDN (cache HIT)
   • https://example.com/api/users  → Direct ke Cloud Run (no cache)
```

---

## CLI: Enable Cloud CDN

```bash
# Enable CDN pada backend bucket
gcloud compute backend-buckets update BACKEND_BUCKET_NAME \
    --enable-cdn

# Enable CDN pada backend service
gcloud compute backend-services update BACKEND_SERVICE_NAME \
    --enable-cdn \
    --global

# Disable CDN
gcloud compute backend-services update BACKEND_SERVICE_NAME \
    --no-enable-cdn \
    --global
```
