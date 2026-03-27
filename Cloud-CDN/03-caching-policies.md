# Caching Policies

Panduan **cache mode**, **TTL**, **cache key**, dan **cache invalidation** di Cloud CDN, berorientasi pada **GCP Console**.

---

## Console path

Setting caching bisa diakses dari:

| Cara akses | Console path |
|------------|-------------|
| **Via Cloud CDN wizard** | `Network services` → **Cloud CDN** → **Add origin** → **Step 3: Cache performance** |
| **Via Load Balancer** | `Network services` → **Load balancing** → klik LB → **Edit** → **Backend configuration** → pilih backend → **Cloud CDN** section |

---

## Cache Mode

**Cache mode** menentukan bagaimana Cloud CDN memutuskan konten mana yang di-cache.

**Console:** Cloud CDN → Add origin → Step 3: **Cache performance** → **Cache mode**

Di Console, tampil 3 pilihan radio button:

| Tampilan di Console | Internal name | Deskripsi | Kapan pakai |
|--------------------|---------------|-----------|-------------|
| **Cache static content (recommended)** | `CACHE_ALL_STATIC` | CDN otomatis cache konten statis (gambar, CSS, JS, video, font) berdasarkan Content-Type, tanpa perlu konfigurasi origin | **Default, cocok untuk kebanyakan kasus** |
| **Use origin settings based on Cache-Control headers** | `USE_ORIGIN_HEADERS` | CDN hanya cache jika origin mengirim `Cache-Control` header. Tertulis keterangan: "Origin must set headers" | Origin sudah mengatur caching sendiri (recommended untuk API) |
| **Force cache all content** | `FORCE_CACHE_ALL` | CDN cache **semua** response (200 OK), mengabaikan `private`, `no-store`, atau `no-cache` dari origin | Konten yang pasti static dan tidak pernah berubah. **Hati-hati: bisa cache konten sensitif** |

### Perbandingan cache mode

| Aspek | USE_ORIGIN_HEADERS | CACHE_ALL_STATIC | FORCE_CACHE_ALL |
|-------|--------------------|------------------|-----------------|
| **Kontrol** | Penuh di origin | Hybrid (CDN + origin) | Penuh di CDN |
| **Flexibility** | Tinggi | Medium | Rendah |
| **Cache hit ratio** | Tergantung origin | Tinggi untuk statis | Sangat tinggi |
| **Risiko stale** | Rendah | Medium | **Tinggi** |
| **Setup** | Harus set header di origin | Mudah | Sangat mudah |

### CACHE_ALL_STATIC — apa saja yang otomatis di-cache?

Content-Type yang di-cache otomatis:

| Kategori | Content-Types |
|----------|---------------|
| **Gambar** | image/jpeg, image/png, image/gif, image/webp, image/svg+xml, image/ico |
| **Video/Audio** | video/mp4, video/webm, audio/mpeg, audio/ogg |
| **Font** | font/woff, font/woff2, application/font-woff |
| **Web assets** | text/css, text/javascript, application/javascript |
| **Documents** | application/pdf |

Yang **TIDAK** di-cache otomatis (butuh origin header):
- `text/html` (HTML)
- `application/json` (API response)
- Response dengan `Set-Cookie`
- Response dengan `Vary: *`

### Kelebihan & kekurangan tiap mode

**USE_ORIGIN_HEADERS**

| Kelebihan | Kekurangan |
|-----------|------------|
| Kontrol penuh — origin menentukan caching | Harus setup Cache-Control header di setiap origin |
| Tidak pernah cache yang tidak seharusnya | Cache hit bisa rendah jika origin tidak set header |
| Aman untuk API dan konten dinamis | Butuh pengetahuan HTTP caching |

**CACHE_ALL_STATIC**

| Kelebihan | Kekurangan |
|-----------|------------|
| Otomatis cache file statis tanpa konfigurasi origin | HTML tidak otomatis di-cache |
| Balance antara kemudahan dan kontrol | Mungkin cache konten yang seharusnya fresh |
| **Recommended untuk kebanyakan website** | — |

**FORCE_CACHE_ALL**

| Kelebihan | Kekurangan |
|-----------|------------|
| Cache hit ratio tertinggi | **Bisa cache konten sensitif / dinamis** |
| Setup paling mudah | Stale content lebih sering terjadi |
| Cocok untuk asset yang 100% static | **Jangan pakai untuk API atau konten personalized** |

---

## TTL (Time-to-Live)

TTL menentukan **berapa lama** konten disimpan di cache sebelum dianggap expired.

**Console:** Cloud CDN → Add origin → Step 3: **Cache performance** → di bawah Cache mode, ada 3 dropdown TTL

Di Console, tampil 3 dropdown bersebelahan:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Client TTL  │  │ Default TTL  │  │ Maximum TTL  │
│   1 hour  ▼  │  │   1 hour  ▼  │  │   1 day   ▼  │
└──────────────┘  └──────────────┘  └──────────────┘
```

| Setting di Console | Range | Default | Deskripsi |
|-------------------|-------|---------|-----------|
| **Client TTL** | 0 - 31,536,000s (1 tahun) | 1 hour (3600s) | Berapa lama **browser user** menyimpan cache lokal — dikirim sebagai `max-age` di response header ke browser |
| **Default TTL** | 0 - 31,536,000s (1 tahun) | 1 hour (3600s) | Berapa lama **CDN edge** menyimpan cache jika origin **tidak** kirim `Cache-Control` header |
| **Maximum TTL** | 0 - 31,536,000s (1 tahun) | 1 day (86400s) | Batas atas TTL di CDN — meskipun origin kirim `max-age=1year`, CDN **tidak** cache lebih lama dari Maximum TTL |

### Bagaimana TTL bekerja

```
Origin kirim: Cache-Control: max-age=7200 (2 jam)
CDN setting: Default TTL=3600, Max TTL=86400

Hasilnya:
  CDN cache TTL = 7200 (ikut origin, karena ≤ Max TTL)
  Browser cache = Client TTL atau origin max-age (mana yang lebih kecil)


Origin kirim: Cache-Control: max-age=604800 (7 hari)
CDN setting: Max TTL=86400 (1 hari)

Hasilnya:
  CDN cache TTL = 86400 (di-cap oleh Max TTL)


Origin tidak kirim Cache-Control header:
CDN setting: Default TTL=3600

Hasilnya:
  CDN cache TTL = 3600 (pakai Default TTL)
```

### Rekomendasi TTL berdasarkan konten

| Tipe konten | Rekomendasi TTL | Alasan |
|-------------|----------------|--------|
| CSS / JS (versioned: style.v2.css) | 1 tahun (31536000s) | Filename berubah saat konten berubah |
| Gambar / font | 1 bulan (2592000s) | Jarang berubah |
| HTML | 5 menit (300s) - 1 jam | Bisa berubah kapan saja |
| API response (product list) | 1-5 menit (60-300s) | Data bisa berubah |
| User-specific data | **0 (jangan cache)** | Setiap user beda |

---

## Cache Key

**Cache key** adalah identifier unik untuk setiap cached object. Secara default, cache key = **full URL** (host + path + query string).

**Console:** Cloud CDN → Add origin → Step 3: **Cache performance** → **Cache keys**

Di Console, tampil dropdown **Cache key**:

```
┌────────────────────────────────────────────────────────────────┐
│  Cache key                                                     │
│  Default (include query parameters known to Cloud Storage)  ▼  │
└────────────────────────────────────────────────────────────────┘
```

### Opsi dropdown Cache key di Console

| Opsi di Console | Deskripsi |
|-----------------|-----------|
| **Default (include query parameters known to Cloud Storage)** | Include semua komponen URL + query parameters yang dikenali Cloud Storage. **Recommended** — bekerja baik dengan backend bucket GCS. |
| **Custom cache key configuration** | Konfigurasi manual: pilih include/exclude host, protocol, dan query string parameters tertentu. |

### Komponen cache key (saat Custom)

| Komponen | Default | Bisa di-exclude? |
|----------|---------|------------------|
| **Host** | Included | Ya |
| **Protocol** (http/https) | Included | Ya |
| **Query string** | Included (semua) | Ya (exclude semua, atau include/exclude spesifik parameter) |

### Contoh cache key behavior

```
Default (semua included):
  https://example.com/image.png?v=1  → key berbeda dari
  https://example.com/image.png?v=2  → (karena query string beda)

Exclude query string:
  https://example.com/image.png?v=1  → key SAMA dengan
  https://example.com/image.png?v=2  → (query string di-ignore)

Exclude host:
  cdn1.example.com/style.css → key SAMA dengan
  cdn2.example.com/style.css → (host di-ignore)
```

### Kapan customize cache key?

| Skenario | Konfigurasi | Alasan |
|----------|-------------|--------|
| Tracking params (utm_source, fbclid) | Exclude query params tertentu | Konten sama meskipun tracking beda → HIT lebih tinggi |
| Multiple domains ke 1 backend | Exclude host | Konten sama dari semua domain |
| API versioning di query param | Include query string | /api?v=1 dan /api?v=2 beda |
| Signed URL params | Include specific params | Token di query harus di-include untuk security |

---

## Negative Caching

Cache response error (4xx, 5xx) agar origin tidak dibombardir error request berulang.

**Console:** Backend → Cloud CDN → **Negative caching**

| Status code | Default TTL (jika negative caching ON) |
|-------------|---------------------------------------|
| 300 | 10 menit |
| 301 | 10 menit |
| 302 | 10 menit |
| 307 | 10 menit |
| 308 | 10 menit |
| 404 | 120 detik |
| 405 | 60 detik |
| 410 | 120 detik |
| 421 | 60 detik |
| 451 | 120 detik |
| 501 | 60 detik |

### Kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Origin tidak dibebani repeated 404 requests | File yang baru di-upload bisa "stuck" 404 selama TTL |
| Reduce origin load saat ada broken link yang viral | 301/302 redirect bisa stale |

---

## Advanced Options

Bagian ini muncul di Console setelah Cache keys, di bawah label **Advanced options**.

### Compression mode

**Console:** Step 3: Cache performance → **Advanced options** → **Compression mode**

```
┌───────────────────────────────┐
│  Compression mode *           │
│  Disabled                  ▼  │
└───────────────────────────────┘
```

| Opsi di Console | Deskripsi |
|-----------------|-----------|
| **Disabled** | CDN **tidak** melakukan kompresi. Jika origin sudah mengirim response terkompresi (gzip/brotli), CDN meneruskan apa adanya. **Default.** |
| **Automatic** | CDN otomatis melakukan kompresi (gzip) untuk response yang belum terkompresi, jika client mendukung (header `Accept-Encoding: gzip`). Berlaku untuk text-based content (HTML, CSS, JS, JSON, XML). |

#### Kelebihan & kekurangan

**Disabled (Default)**

| Kelebihan | Kekurangan |
|-----------|------------|
| Tidak ada overhead kompresi di CDN | Jika origin tidak compress, response ke user besar |
| Predictable — CDN hanya pass-through | Bandwidth lebih tinggi (biaya egress lebih besar) |
| Cocok jika origin sudah handle compression sendiri | — |

**Automatic**

| Kelebihan | Kekurangan |
|-----------|------------|
| Response **50-80% lebih kecil** untuk text content | Sedikit CPU overhead di edge (negligible) |
| Hemat bandwidth = **hemat biaya egress** | Hanya gzip (bukan brotli) |
| Origin tidak perlu handle compression | Tidak berlaku untuk binary content (gambar, video) |
| **Recommended untuk kebanyakan website** | — |

### Serve while stale

**Console:** Step 3: Cache performance → **Advanced options** → **Serve while stale**

```
┌──────────────────────────────────────┐
│  Serve while stale *                 │
│  Disable serve while stale        ▼  │
└──────────────────────────────────────┘

"Serve while stale allows Cloud CDN to return an expired (stale)
 cached object on a cache miss or origin error."
```

| Opsi di Console | Deskripsi |
|-----------------|-----------|
| **Disable serve while stale** | Jika cache expired dan origin error/lambat, CDN return error ke user. **Default.** |
| **Enable serve while stale** | Jika cache expired, CDN tetap return konten lama (stale) sambil fetch fresh dari origin di background. Jika origin error/down, user tetap mendapat konten (meskipun sudah expired). |

#### Kelebihan & kekurangan

**Disable serve while stale (Default)**

| Kelebihan | Kekurangan |
|-----------|------------|
| User selalu dapat data fresh atau error yang jelas | Jika origin down, user langsung lihat error (502/504) |
| Tidak ada risiko data lama tersaji | Downtime origin = downtime user |

**Enable serve while stale**

| Kelebihan | Kekurangan |
|-----------|------------|
| Website **tetap online** meskipun origin sementara down | User mungkin lihat data lama (stale) |
| Graceful degradation — UX lebih baik | Tidak cocok untuk data finansial / real-time / transaksional |
| Reduce perceived downtime | Bisa membingungkan jika data stale sangat berbeda dari current |
| **Recommended untuk website statis dan content-heavy** | — |

---

## Restricted Content

**Console:** Step 3: Cache performance → **Restricted content**

Di Console, tampil 2 pilihan radio button:

| Opsi di Console | Deskripsi |
|-----------------|-----------|
| **Allow public access to my content cached by Cloud CDN (recommended)** | Semua orang bisa mengakses konten yang di-cache di CDN. **Default.** Cocok untuk website publik, gambar produk, asset statis. |
| **Restrict access using signed URLs and signed cookies** | Hanya user yang punya **signed URL** atau **signed cookie** yang valid yang bisa mengakses konten. Cocok untuk konten premium, video berbayar, file private. |

Jika pilih **Restrict access**, perlu setup **signing key**. Detail lengkap: [04-security.md](04-security.md)

#### Kelebihan & kekurangan

**Allow public access (Default)**

| Kelebihan | Kekurangan |
|-----------|------------|
| Setup sederhana, langsung jalan | Siapa saja bisa akses konten |
| Cache hit ratio maksimal | Tidak cocok untuk konten berbayar / private |

**Restrict access (Signed URL/Cookie)**

| Kelebihan | Kekurangan |
|-----------|------------|
| Kontrol akses ketat per konten / per user | Perlu generate signed URL/cookie di server |
| Waktu expired configurable | Implementasi lebih kompleks |
| Cocok untuk konten premium / private | Cache hit bisa sedikit lebih rendah |

---

## Custom Response Headers

**Console:** Step 3: Cache performance → **Custom response headers** → **ADD HEADER**

Menambahkan HTTP header custom ke setiap response yang dikirim CDN ke user.

Klik **ADD HEADER** untuk menambahkan header:

| Field | Contoh |
|-------|--------|
| **Header name** | `X-Frame-Options` |
| **Header value** | `DENY` |

### Contoh header yang sering ditambahkan

| Header | Value | Fungsi |
|--------|-------|--------|
| `X-Frame-Options` | `DENY` atau `SAMEORIGIN` | Mencegah halaman dimuat dalam iframe (clickjacking) |
| `X-Content-Type-Options` | `nosniff` | Mencegah browser MIME-type sniffing |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Paksa HTTPS (HSTS) |
| `X-CDN-Cache-Status` | `{cdn_cache_status}` | Debug: tampilkan HIT/MISS di response |
| `Access-Control-Allow-Origin` | `https://example.com` | CORS untuk cross-domain request |
| `Cache-Control` | `public, max-age=3600` | Override cache behavior untuk browser |

#### Kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Tambah security headers tanpa ubah origin | Header berlaku untuk SEMUA response dari backend ini |
| Berguna untuk debugging (cache status) | Salah konfigurasi bisa break website |
| CORS bisa di-set di CDN level | Tidak bisa conditional per path (berlaku semua) |

---

## Cache Invalidation

Paksa hapus konten dari cache **sebelum TTL habis**.

**Console path:** `Network services` → **Cloud CDN** → klik origin → **Cache invalidation** → **Create invalidation**

### Opsi invalidation

| Opsi | Contoh | Deskripsi |
|------|--------|-----------|
| **Single URL** | `/images/logo.png` | Hapus 1 file spesifik |
| **URL prefix** | `/images/` | Hapus semua yang dimulai dengan `/images/` |
| **Wildcard** | `/static/*.css` | Pattern matching |

### CLI invalidation

```bash
# Invalidate single URL
gcloud compute url-maps invalidate-cdn-cache URL_MAP_NAME \
    --path="/images/logo.png"

# Invalidate prefix
gcloud compute url-maps invalidate-cdn-cache URL_MAP_NAME \
    --path="/images/*"

# Invalidate everything
gcloud compute url-maps invalidate-cdn-cache URL_MAP_NAME \
    --path="/*"
```

### Invalidation — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Paksa update konten segera | Rate limited (1 invalidation per menit per project) |
| Berguna saat deploy baru | Propagasi ke semua edge butuh beberapa menit |
| — | Tidak bisa undo |

### Alternatif: Versioned URLs (lebih baik)

Daripada invalidation, gunakan **versioned filename**:

```
Sebelum update: /style.css         → cached, TTL 1 tahun
Sesudah update: /style.v2.css      → URL baru = cache key baru = MISS = fetch fresh

Atau query string versioning:
  /style.css?v=abc123  → cached
  /style.css?v=def456  → URL baru = MISS = fetch fresh
```

| Aspek | Invalidation | Versioned URL |
|-------|-------------|---------------|
| Kecepatan propagasi | Beberapa menit | Instan (URL baru = pasti MISS) |
| Rate limit | Ya (1/menit) | Tidak ada limit |
| Kompleksitas | Manual trigger | Otomatis via build tools |
| **Rekomendasi** | Untuk emergency | **Untuk workflow normal** |
