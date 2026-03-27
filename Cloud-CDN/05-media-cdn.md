# Media CDN

Dokumentasi **Media CDN** — CDN khusus media yang menggunakan infrastruktur **YouTube** untuk streaming video (VoD & live) dan download file besar.

---

## Apa itu Media CDN?

Media CDN menggunakan **infrastruktur yang sama dengan YouTube** (jaringan terbesar dunia untuk video delivery) untuk menghadirkan:

- **Video on Demand (VoD)** — film, kursus online, replay
- **Live Streaming** — siaran langsung, event, webinar
- **Download file besar** — game updates, software installer, firmware

---

## Cloud CDN vs Media CDN — Perbandingan Detail

| Aspek | Cloud CDN | Media CDN |
|-------|-----------|-----------|
| **Infrastruktur** | Google edge network (200+ PoP) | YouTube infrastructure (1000+ PoP) |
| **Optimized untuk** | Website, API, small-medium assets | Video, large file download |
| **Ukuran file ideal** | KB - puluhan MB | MB - puluhan GB |
| **Streaming support** | Basic (serve file saja) | HLS, DASH, CMAF native |
| **Range requests** | Didukung | **Highly optimized** (chunked delivery) |
| **Prefetch / warm cache** | Tidak ada | **Ada** (pre-populate cache) |
| **Multi-tier caching** | Edge → Origin | Edge → Mid-tier → Shield → Origin |
| **Konsol** | `Network services` → Cloud CDN | `Media CDN` |
| **Origin** | Via Load Balancer | **Direct origin** (tanpa LB) |
| **Harga** | Per GB egress | Per GB delivered (tiered) |
| **DRM support** | Tidak ada native | Widevine, FairPlay integration |

### Kapan pilih yang mana?

| Skenario | Pilihan | Alasan |
|----------|---------|--------|
| Website company profile | **Cloud CDN** | Konten kecil, HTML/CSS/JS |
| E-commerce (gambar produk) | **Cloud CDN** | Gambar kecil-medium |
| Platform kursus online (video) | **Media CDN** | Video besar, streaming |
| Live streaming event | **Media CDN** | Live delivery optimized |
| Game patch distribution (2-50GB) | **Media CDN** | File sangat besar |
| API caching | **Cloud CDN** | Response kecil, low latency |
| Campuran (website + video) | **Keduanya** | CDN untuk web, Media CDN untuk video |

---

## Arsitektur Media CDN

```
┌──────────────────────────────────────────────────────────────┐
│                     End Users (Viewers)                       │
│          Mobile, Desktop, Smart TV, Set-top Box              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│               YouTube Infrastructure (Edge)                   │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Edge    │ │  Edge    │ │  Edge    │ │  Edge    │       │
│  │ Jakarta  │ │ Tokyo    │ │ Mumbai   │ │ London   │ ...   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       └─────────────┴──────┬─────┴─────────────┘             │
│                            │                                  │
│                   ┌────────▼────────┐                         │
│                   │  Mid-tier Cache  │ (regional cache layer) │
│                   └────────┬────────┘                         │
│                            │                                  │
│                   ┌────────▼────────┐                         │
│                   │  Origin Shield   │ (single point to       │
│                   │                  │  protect origin)       │
│                   └────────┬────────┘                         │
└────────────────────────────┼─────────────────────────────────┘
                             │ cache MISS
                             ▼
                   ┌──────────────────┐
                   │  Origin Server    │
                   │  • Cloud Storage  │
                   │  • Custom HTTP    │
                   └──────────────────┘
```

### Multi-tier caching

Media CDN punya **3+ tier** caching (vs Cloud CDN yang 1-2 tier):

```
Tier 1: Edge Cache (dekat user)
  ──► Mayoritas HIT di sini untuk konten populer

Tier 2: Mid-tier Cache (regional)
  ──► Jika edge MISS, cek regional cache dulu (bukan langsung ke origin)

Tier 3: Origin Shield (satu titik pelindung origin)
  ──► Satu request ke origin meskipun ratusan edge MISS bersamaan
  ──► Melindungi origin dari stampede

Tier 4: Origin (Cloud Storage / HTTP server)
  ──► Hanya diakses jika semua tier cache MISS
```

---

## Console path

**Media CDN** punya Console sendiri:

`Google Cloud Console` → **Media CDN**

### Resources di Media CDN

| Resource | Deskripsi |
|----------|-----------|
| **EdgeCacheService** | Service utama (setara "CDN instance") — define routing, caching, security |
| **EdgeCacheOrigin** | Konfigurasi origin (Cloud Storage bucket atau custom HTTP) |
| **EdgeCacheKeyset** | Set of signing keys untuk signed request |

---

## Setup Media CDN

### Step 1: Create EdgeCacheOrigin

**Console:** `Media CDN` → **Origins** → **Create origin**

| Field | Deskripsi | Contoh |
|-------|-----------|--------|
| **Name** | Nama origin | `video-origin` |
| **Origin address** | URL origin | `gs://my-video-bucket` atau `origin.example.com` |
| **Protocol** | HTTP / HTTPS | HTTPS |
| **Origin override** | Custom host header ke origin | Opsional |
| **Failover origin** | Backup origin jika primary down | Opsional |

### Step 2: Create EdgeCacheService

**Console:** `Media CDN` → **Services** → **Create service**

| Field | Deskripsi |
|-------|-----------|
| **Name** | Nama service |
| **Routing** | Route rules (host, path → origin) |
| **CDN policy** | Cache mode, TTL, signed request |
| **Edge security policy** | Cloud Armor policy |
| **SSL certificate** | Google-managed atau self-managed |
| **IP address** | Anycast IP |

### Step 3: Configure Routing

```
Route rules di Media CDN:

  Host: cdn.example.com
    Path: /videos/*    → Origin: video-origin    (cache TTL 24h)
    Path: /thumbnails/* → Origin: thumb-origin   (cache TTL 7d)
    Path: /live/*      → Origin: live-origin     (cache TTL 2s)
```

### Step 4: DNS

Arahkan domain ke IP address EdgeCacheService.

---

## Skenario: Platform Video Streaming (VoD)

```
Arsitektur:

  Video Upload:
    Creator ──► Cloud Storage (origin bucket)
             ──► Transcoder API (HLS/DASH encoding)
             ──► Output ke Cloud Storage

  Video Delivery:
    Viewer ──► Media CDN ──► Cloud Storage (origin)
    
  Flow detail:
    1. Creator upload video mentah ke GCS
    2. Transcoder API encode ke HLS (multiple bitrate)
       Output: /videos/123/master.m3u8
               /videos/123/720p/segment001.ts
               /videos/123/1080p/segment001.ts
    3. Viewer request master.m3u8 → Media CDN
    4. Player pilih bitrate sesuai bandwidth
    5. Setiap segment di-cache di edge
    6. Viewer selanjutnya dari lokasi sama = cache HIT
```

### Adaptive Bitrate Streaming (ABR)

```
Viewer bandwidth tinggi (50 Mbps):
  Player request: /videos/123/1080p/segment001.ts  ──► 1080p quality

Viewer bandwidth rendah (2 Mbps):
  Player request: /videos/123/360p/segment001.ts   ──► 360p quality

Bandwidth berubah:
  Player otomatis switch ke bitrate yang sesuai
  ──► Semua segment sudah di-cache di Media CDN
```

---

## Skenario: Live Streaming

```
Live streaming flow:

  Camera/Encoder ──► Live origin server ──► Media CDN ──► Viewers

  Perbedaan dengan VoD:
  • TTL sangat pendek (1-2 detik) untuk segment terbaru
  • Segment lama bisa TTL lebih panjang (sudah tidak berubah)
  • Media CDN handle jutaan concurrent viewers

  TTL strategy:
    /live/stream/manifest.m3u8     → TTL 1 detik (selalu fresh)
    /live/stream/segment-latest.ts → TTL 2 detik
    /live/stream/segment-old.ts    → TTL 1 jam (sudah final)
```

---

## Skenario: Game Update Distribution

```
Game studio release patch 20GB:

  Tanpa CDN:
    1 juta player download dari 1 server
    ──► Server overload, download lambat

  Dengan Media CDN:
    1 juta player download dari edge terdekat
    ──► Origin hanya serve 1x per edge location
    ──► Edge serve ke semua player di area tersebut
    ──► Download cepat, origin ringan

  Media CDN prefetch:
    Sebelum patch release, prefetch ke semua edge
    ──► Saat release, SEMUA request = cache HIT
    ──► Zero load ke origin
```

---

## Prefetch (Cache Warming)

**Hanya Media CDN** — Cloud CDN tidak punya fitur ini.

Prefetch = pre-populate cache **sebelum** user request, sehingga saat launch, semua request langsung cache HIT.

```bash
# CLI: prefetch konten ke semua edge
gcloud edge-cache services prefetch SERVICE_NAME \
    --paths="/videos/new-movie/master.m3u8" \
    --paths="/videos/new-movie/1080p/*"
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Zero latency saat launch (semua HIT) | Butuh storage di semua edge (biaya) |
| Origin zero load saat peak | Hanya berguna untuk konten yang pasti akan diakses |
| Smooth user experience | Prefetch terlalu banyak = waste storage |

---

## Media CDN — Kelebihan & Kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Infrastruktur YouTube = proven scale | Lebih mahal dari Cloud CDN untuk konten kecil |
| Multi-tier caching = origin sangat terproteksi | Setup lebih kompleks |
| Native streaming support (HLS, DASH) | Fitur lebih baru, dokumentasi masih berkembang |
| Prefetch capability | Tidak terintegrasi langsung dengan Load Balancer |
| Origin shield mencegah stampede | — |
| Handle jutaan concurrent viewers | — |
