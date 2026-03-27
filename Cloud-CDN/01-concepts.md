# Konsep & Cara Kerja CDN

Penjelasan detail **bagaimana CDN bekerja**, kenapa bisa diakses banyak user dengan cepat, dan apa kekurangannya.

---

## Apa itu CDN?

CDN = **Content Delivery Network** — jaringan server edge yang tersebar di seluruh dunia, bertugas meng-**cache** (menyimpan salinan) konten dari origin server dan menyajikannya dari lokasi **terdekat** ke pengguna.

---

## Cara Kerja CDN — Step by Step

### Request pertama (Cache MISS)

```
User di Jakarta request: https://cdn.example.com/logo.png

1. Browser ──► DNS resolve ──► diarahkan ke edge terdekat (Jakarta)

2. Edge Jakarta: "apakah /logo.png ada di cache saya?"
   ──► TIDAK ADA (cache MISS)

3. Edge Jakarta ──► fetch dari Origin Server (misal Cloud Storage di US)
   ──► Origin kirim logo.png ke Edge Jakarta

4. Edge Jakarta:
   a. Simpan logo.png di cache (dengan TTL, misal 1 jam)
   b. Kirim logo.png ke User di Jakarta

   Waktu total: ~200ms (harus fetch dari origin)
```

### Request kedua (Cache HIT)

```
User lain di Jakarta request: https://cdn.example.com/logo.png

1. Browser ──► DNS ──► Edge Jakarta

2. Edge Jakarta: "apakah /logo.png ada di cache saya?"
   ──► ADA! (cache HIT)

3. Edge Jakarta ──► langsung kirim logo.png ke User
   ──► TIDAK PERLU ke Origin

   Waktu total: ~5-20ms (dari cache lokal)
```

### Request dari negara lain

```
User di Tokyo request: https://cdn.example.com/logo.png

1. Browser ──► DNS ──► Edge Tokyo

2. Edge Tokyo: cache MISS (belum pernah di-request dari Tokyo)

3. Edge Tokyo ──► fetch dari Origin (atau dari mid-tier cache)
   ──► simpan di cache Edge Tokyo
   ──► kirim ke User Tokyo

   Request berikutnya dari Tokyo = cache HIT = cepat
```

---

## Kenapa CDN Bisa Diakses Banyak User dengan Cepat?

### 1. Distribusi geografis

```
Google Edge Locations (200+):
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │  🇺🇸 US (20+)    🇪🇺 Europe (30+)    🇯🇵 Asia (40+)          │
  │  • Los Angeles   • London           • Tokyo                │
  │  • New York      • Frankfurt        • Singapore            │
  │  • Chicago       • Amsterdam        • Jakarta              │
  │  • Dallas        • Paris            • Hong Kong            │
  │  • ...           • ...              • Mumbai, Seoul, ...   │
  │                                                             │
  │  🇧🇷 South America   🇦🇺 Oceania   🇿🇦 Africa                 │
  │  • São Paulo         • Sydney     • Johannesburg           │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘

Setiap edge location menyimpan cache konten yang sering diakses
──► User selalu dilayani dari lokasi terdekat
```

### 2. Caching mengurangi beban origin

```
Tanpa CDN (1 juta request):
  Origin harus handle 1.000.000 requests ──► server overload

Dengan CDN (1 juta request, 95% cache hit):
  Edge handle 950.000 requests (dari cache)
  Origin hanya handle 50.000 requests ──► ringan
```

### 3. Anycast routing

Google menggunakan **Anycast IP** — satu IP address di-announce dari semua edge location. Network routing otomatis mengarahkan user ke edge **terdekat secara fisik**.

```
cdn.example.com ──► IP 34.149.160.230 (Anycast)

  User Jakarta  ──► routed ke Edge Jakarta  (terdekat)
  User Tokyo    ──► routed ke Edge Tokyo    (terdekat)
  User New York ──► routed ke Edge New York (terdekat)
```

### 4. Persistent connections & HTTP/2 / HTTP/3

- Edge ↔ Origin: koneksi persistent (tidak perlu handshake berulang)
- Edge ↔ User: HTTP/2 multiplexing, HTTP/3 (QUIC) untuk lebih cepat
- TLS termination di edge (SSL handshake lebih cepat karena dekat)

---

## Arsitektur Cloud CDN di GCP

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Internet Users                               │
│  (Jakarta, Tokyo, Singapore, New York, London, ...)                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Google Edge Network                               │
│                    (200+ locations)                                  │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │Edge Cache│  │Edge Cache│  │Edge Cache│  │Edge Cache│           │
│  │ Jakarta  │  │ Tokyo    │  │Singapore │  │ London   │  ...      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │              │              │              │                 │
│       └──────────────┴──────┬───────┴──────────────┘                │
│                             │ cache MISS                            │
│                             ▼                                       │
│                    ┌─────────────────┐                               │
│                    │  Mid-tier Cache  │ (optional, regional)         │
│                    └────────┬────────┘                               │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ cache MISS
                              ▼
                    ┌─────────────────┐
                    │  Origin Server   │
                    │  • Cloud Storage │
                    │  • Load Balancer │
                    │  • Compute Engine│
                    │  • Cloud Run     │
                    └──────────────────┘
```

---

## Cloud CDN — Kelebihan

| Kelebihan | Penjelasan |
|-----------|------------|
| **Latency rendah** | Konten disajikan dari edge terdekat, bukan dari origin jauh |
| **Throughput tinggi** | Jaringan Google backbone mendukung traffic besar |
| **Skalabilitas otomatis** | Tidak perlu provisioning — edge scale otomatis |
| **Mengurangi beban origin** | 90%+ request dilayani dari cache → origin ringan |
| **Global coverage** | 200+ edge locations di seluruh dunia |
| **Terintegrasi GCP** | Langsung dari Cloud Load Balancing — 1 klik enable |
| **Keamanan** | Signed URL, Cloud Armor (DDoS/WAF), SSL/TLS termination |
| **Cost saving** | Egress dari cache lebih murah dari egress origin |

---

## Cloud CDN — Kekurangan

| Kekurangan | Penjelasan | Mitigasi |
|------------|------------|----------|
| **Stale content** | Cache bisa menyajikan data lama jika TTL belum expired | Set TTL yang tepat, gunakan cache invalidation |
| **Cache MISS pertama tetap lambat** | Request pertama harus ke origin | Gunakan cache warming / pre-fetch |
| **Tidak cocok untuk data real-time** | Data yang berubah setiap detik tidak cocok di-cache | Jangan cache API real-time, gunakan WebSocket |
| **Tidak cocok untuk konten personalized** | Setiap user beda konten → cache hit rendah | Pisahkan bagian statis (CDN) dan dinamis (origin) |
| **Debugging lebih kompleks** | Request melalui banyak layer → harder to trace | Gunakan CDN logging dan custom headers |
| **Biaya egress tetap ada** | Meskipun lebih murah, tetap ada biaya per GB | Monitor cache hit ratio, optimize caching |
| **Cache invalidation sulit** | "Only two hard things in CS: cache invalidation and naming things" | Gunakan versioned URL (file.v2.js) |

---

## Skenario: Kapan Pakai CDN?

### Skenario 1 — Website statis / SPA (PAKAI CDN)

```
Situasi:
  Website company profile + React SPA
  User dari seluruh Indonesia
  File: HTML, CSS, JS, gambar (total ~5MB)

Solusi:
  Cloud Storage (origin) ──► Cloud CDN ──► User

Kenapa CDN:
  • File statis jarang berubah → cache hit tinggi
  • User tersebar → butuh edge dekat
  • Traffic bisa spike (marketing campaign)
```

### Skenario 2 — API backend dinamis (SELECTIVE CDN)

```
Situasi:
  REST API untuk mobile app
  GET /products (jarang berubah) vs POST /orders (selalu beda)

Solusi:
  • GET /products → Cache di CDN (TTL 5 menit)
  • POST /orders → Bypass CDN, langsung ke origin
  • GET /user/profile → Bypass CDN (personalized)

Cloud CDN bisa cache berdasarkan path dan method
```

### Skenario 3 — Video streaming platform (PAKAI MEDIA CDN)

```
Situasi:
  Platform kursus online dengan 10.000 video
  User streaming dari seluruh Asia

Solusi:
  Cloud Storage (video files) ──► Media CDN ──► User

Kenapa Media CDN (bukan Cloud CDN):
  • File besar (100MB - 5GB per video)
  • Infrastruktur YouTube = optimized untuk video
  • Adaptive bitrate streaming support
  • Range request handling yang lebih baik
```

### Skenario 4 — Internal app (JANGAN CDN)

```
Situasi:
  Internal dashboard hanya diakses 50 karyawan di Jakarta
  Data selalu realtime dari database

Jangan CDN:
  • User sedikit dan 1 lokasi → CDN tidak memberi manfaat
  • Data realtime → cache bisa menyesatkan
  • Private data → tidak boleh di-cache di edge publik
```

---

## Flow Lengkap: Request melalui Cloud CDN

```
Step 1: User ketik https://example.com/image.jpg
            │
Step 2: DNS resolve → Anycast IP → routed ke Edge terdekat
            │
Step 3: Edge terdekat cek cache
            │
            ├── HIT ──► Return cached response (cepat)
            │           Header: Age: 300, X-Cache: HIT
            │
            └── MISS ─► Forward ke Origin
                         │
                    Origin return response + Cache-Control header
                         │
                    Edge simpan di cache (sesuai TTL)
                         │
                    Return response ke User
                    Header: Age: 0, X-Cache: MISS
```

---

## Istilah Penting

| Istilah | Arti |
|---------|------|
| **Origin** | Server asal konten (Cloud Storage, VM, Cloud Run) |
| **Edge / PoP** | Point of Presence — lokasi cache CDN di seluruh dunia |
| **Cache HIT** | Konten ditemukan di cache edge → disajikan langsung |
| **Cache MISS** | Konten tidak ada di cache → harus fetch dari origin |
| **TTL** | Time-to-Live — berapa lama konten di-cache sebelum expired |
| **Invalidation** | Paksa hapus cache sebelum TTL habis |
| **Cache key** | Identifier unik untuk setiap cached object (biasanya URL) |
| **Anycast** | Satu IP di-route ke edge terdekat secara otomatis |
| **Egress** | Traffic keluar (dari CDN ke user) → dikenakan biaya |
| **Cache hit ratio** | Persentase request yang dilayani dari cache (target: >90%) |
