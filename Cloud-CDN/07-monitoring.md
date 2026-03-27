# Monitoring & Logging

Panduan monitoring, logging, dan troubleshooting **Cloud CDN**, berorientasi pada **GCP Console**.

---

## Console path

| Fitur | Console path |
|-------|-------------|
| CDN overview | `Network services` → **Cloud CDN** |
| CDN metrics | `Network services` → **Cloud CDN** → klik origin → grafik |
| Cloud Monitoring | `Monitoring` → **Dashboards** / **Metrics Explorer** |
| Cloud Logging | `Logging` → **Logs Explorer** |

---

## Metric Utama: Cache Hit Ratio

**Cache hit ratio** = persentase request yang dilayani dari cache (bukan dari origin).

```
Cache hit ratio = cache HIT / (cache HIT + cache MISS) × 100%

Contoh:
  10.000 request total
  9.200 cache HIT + 800 cache MISS
  Hit ratio = 92%
```

### Target cache hit ratio

| Hit ratio | Evaluasi | Aksi |
|-----------|----------|------|
| **> 95%** | Excellent | Maintain |
| **90-95%** | Good | Cek apakah bisa optimize TTL |
| **80-90%** | Fair | Review cache key, TTL, cacheable content |
| **< 80%** | Poor | Investigasi — mungkin banyak konten tidak cacheable |

### Lihat cache hit ratio

**Console:** `Monitoring` → **Metrics Explorer**

| Setting | Value |
|---------|-------|
| Resource type | **Cloud HTTP/S Load Balancing Rule** |
| Metric | `https/request_count` |
| Group by | `cache_result` |

Nilai `cache_result`:
- `HIT` — dilayani dari cache
- `MISS` — harus fetch dari origin
- `DISABLED` — CDN tidak aktif untuk request ini
- `STALE` — konten expired tapi served karena origin down

---

## Metrics Cloud CDN

### Via Cloud Monitoring

**Console:** `Monitoring` → **Metrics Explorer**

| Metric | Nama lengkap | Deskripsi |
|--------|-------------|-----------|
| Request count | `loadbalancing.googleapis.com/https/request_count` | Total request per status/cache result |
| Request bytes | `loadbalancing.googleapis.com/https/request_bytes_count` | Total bytes request |
| Response bytes | `loadbalancing.googleapis.com/https/response_bytes_count` | Total bytes response (termasuk cache) |
| Latency | `loadbalancing.googleapis.com/https/total_latencies` | Latency end-to-end |
| Backend latency | `loadbalancing.googleapis.com/https/backend_latencies` | Latency origin saja |
| Backend request count | `loadbalancing.googleapis.com/https/backend_request_count` | Request yang sampai ke origin |

### Dimensi penting untuk filter

| Dimensi | Deskripsi |
|---------|-----------|
| `cache_result` | HIT, MISS, DISABLED, STALE |
| `response_code` | 200, 301, 404, 502, dll |
| `proxy_continent` | Benua edge yang handle request |
| `backend_target_name` | Backend bucket/service mana |

---

## CDN Logging

### Enable Logging

**Console:** Load Balancer → **Edit** → **Backend configuration** → pilih backend → **Logging** → **Enable**

| Setting | Opsi |
|---------|------|
| **Enable logging** | ON / OFF |
| **Sample rate** | 0.0 - 1.0 (1.0 = log semua request) |

**Rekomendasi:**
- Production: `0.1` - `0.5` (10-50% sample — hemat biaya log)
- Debugging: `1.0` (log semua — temporary)

### Lihat log

**Console:** `Logging` → **Logs Explorer**

```
resource.type="http_load_balancer"
```

### Field penting di log

| Field | Deskripsi | Contoh |
|-------|-----------|--------|
| `httpRequest.requestUrl` | URL yang di-request | `https://example.com/image.png` |
| `httpRequest.status` | HTTP status code | `200`, `304`, `404` |
| `jsonPayload.cacheId` | ID edge yang serve request | `IAD-12345` |
| `jsonPayload.statusDetails` | Detail (response_from_cache, etc) | `response_sent_by_backend` |
| `jsonPayload.cacheHit` | Boolean cache hit | `true` / `false` |
| `jsonPayload.cacheLookup` | CDN mencoba lookup cache? | `true` / `false` |
| `jsonPayload.cacheFillBytes` | Bytes yang di-cache (saat MISS) | `1048576` |

### Query log berguna

```
# Semua cache MISS
resource.type="http_load_balancer"
jsonPayload.cacheHit=false

# Semua 404 error
resource.type="http_load_balancer"
httpRequest.status=404

# Request ke backend bucket tertentu
resource.type="http_load_balancer"
resource.labels.backend_service_name="my-backend-bucket"

# Latency tinggi (>1 detik)
resource.type="http_load_balancer"
httpRequest.latency>"1s"
```

---

## Dashboard Rekomendasi

Buat custom dashboard di `Monitoring` → **Dashboards** → **Create dashboard**:

### Widget yang direkomendasikan

| Widget | Metric | Tipe chart |
|--------|--------|------------|
| Cache hit ratio | request_count group by cache_result | Stacked bar / pie |
| Request rate | request_count | Line chart |
| Response bytes | response_bytes_count | Line chart |
| Error rate | request_count filter status 5xx | Line chart |
| Latency p50/p95/p99 | total_latencies | Heatmap / line |
| Origin load | backend_request_count | Line chart |
| Bandwidth | response_bytes_count | Area chart |

---

## Alerting

**Console:** `Monitoring` → **Alerting** → **Create policy**

### Alert yang direkomendasikan

| Alert | Condition | Severity |
|-------|-----------|----------|
| Cache hit ratio drop | cache HIT ratio < 80% (15 min) | Warning |
| Error spike (5xx) | 5xx rate > 5% | Critical |
| Latency tinggi | p95 latency > 500ms | Warning |
| Origin overload | Backend request count spike 3x | Warning |
| Bandwidth abnormal | Egress > 2x normal | Warning |

---

## Troubleshooting

### Masalah: Cache hit ratio rendah

```
Diagnosa:
  1. Cek Logging → filter cache MISS → lihat URL pattern
  2. Apakah URL punya query string unik (tracking params)?
     → Exclude dari cache key
  3. Apakah origin kirim no-cache / no-store header?
     → Fix origin headers atau gunakan FORCE_CACHE_ALL
  4. Apakah TTL terlalu pendek?
     → Naikkan TTL
  5. Apakah konten vary per user (Set-Cookie, Authorization)?
     → Pisahkan konten statis dan dinamis

Solusi umum:
  • Exclude tracking query params dari cache key
  • Naikkan TTL untuk konten statis
  • Gunakan CACHE_ALL_STATIC atau FORCE_CACHE_ALL
  • Gunakan versioned URLs (bukan cache invalidation)
```

### Masalah: Stale content (user lihat data lama)

```
Diagnosa:
  1. Cek response header Age (berapa lama di cache)
  2. Cek TTL yang di-set → terlalu panjang?
  3. Apakah sudah invalidate cache setelah update?

Solusi:
  • Invalidate cache: gcloud compute url-maps invalidate-cdn-cache ...
  • Gunakan versioned URLs (style.v2.css)
  • Kurangi TTL untuk konten yang sering berubah
```

### Masalah: 502/504 error

```
Diagnosa:
  1. Origin down? Cek health check status
  2. Origin timeout? Backend latency tinggi?
  3. SSL mismatch antara LB dan origin?

Solusi:
  • Enable "serve stale" agar CDN tetap serve cached content saat origin down
  • Fix origin health
  • Cek SSL certificate di origin
```

### Masalah: Request tidak di-cache padahal seharusnya

```
Cek header response dari origin:
  curl -I https://example.com/image.png

  Jika ada header ini, CDN TIDAK cache:
    Cache-Control: no-store
    Cache-Control: no-cache
    Cache-Control: private
    Set-Cookie: ...
    Vary: *

Solusi:
  • Fix origin headers (hapus no-store/no-cache untuk konten statis)
  • Gunakan FORCE_CACHE_ALL (override origin headers)
  • Hapus Set-Cookie dari response statis
```

---

## Cara Test CDN Caching

```bash
# Request pertama (expect MISS)
curl -sI https://example.com/image.png | grep -i 'age\|cache\|via'
# Age: 0 (atau tidak ada)
# Via: 1.1 google

# Request kedua (expect HIT)
curl -sI https://example.com/image.png | grep -i 'age\|cache\|via'
# Age: 5 (sudah di-cache 5 detik)
# Via: 1.1 google

# Jika Age > 0 → cache HIT
# Jika Age = 0 atau tidak ada → cache MISS
```
