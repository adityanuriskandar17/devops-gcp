# Best Practices

Checklist dan rekomendasi untuk **Cloud CDN** production, berorientasi pada **GCP Console**.

---

## Performance

| Praktik | Detail |
|---------|--------|
| **Versioned filenames** | `style.a1b2c3.css` → TTL 1 tahun, cache busting otomatis |
| **Compress content** | Enable gzip/brotli di origin → CDN cache versi compressed |
| **Appropriate image format** | WebP/AVIF > JPEG > PNG → ukuran lebih kecil |
| **Lazy loading** | Jangan load gambar/video di bawah fold sampai user scroll |
| **Minimize cache key** | Exclude query params yang tidak pengaruhi konten (utm_source, fbclid) |
| **CACHE_ALL_STATIC mode** | Otomatis cache konten statis tanpa konfigurasi origin |
| **TTL yang tepat** | Statis (panjang), HTML (pendek), API (sangat pendek atau off) |
| **HTTP/3 (QUIC)** | Enable di Load Balancer → lebih cepat untuk mobile/high-latency |
| **Negative caching** | Cache 404 → origin tidak dibombardir broken link requests |
| **Serve stale** | Website tetap up meskipun origin sementara down |

### TTL rekomendasi per tipe konten

| Konten | TTL | Alasan |
|--------|-----|--------|
| JS/CSS (hashed filename) | 31536000s (1 tahun) | Filename berubah saat build |
| Font files | 2592000s (30 hari) | Sangat jarang berubah |
| Gambar produk | 86400s (24 jam) | Bisa berubah, tapi jarang |
| HTML pages | 300s (5 menit) | Bisa deploy kapan saja |
| API (product list) | 60-300s (1-5 menit) | Data bisa berubah |
| User-specific API | 0 (no cache) | Setiap user beda |

---

## Security

| Praktik | Console path |
|---------|-------------|
| **HTTPS only** (redirect HTTP → HTTPS) | LB → Frontend: HTTP → redirect to HTTPS |
| **SSL policy: TLS 1.2 minimum** | `Network Security` → SSL policies |
| **Signed URL/Cookie** untuk konten premium | Backend → CDN → Signed URL config |
| **Cloud Armor** untuk DDoS/WAF | `Network Security` → Cloud Armor |
| **Edge security policy** untuk filter di edge | Cloud Armor → type: Edge security |
| **Jangan expose origin IP** | Origin hanya terima traffic dari LB (firewall) |
| **CORS yang ketat** | Hanya allow domain yang diperlukan |
| **Hapus header sensitif** | Origin jangan kirim internal header ke CDN |

### Origin protection

```
Best practice: Origin hanya menerima traffic dari Google LB

Cara:
1. Origin = Cloud Storage → otomatis aman (via backend bucket)
2. Origin = VM → Firewall rule:
   Allow: 35.191.0.0/16, 130.211.0.0/22 (Google health check + LB)
   Deny: semua yang lain
```

---

## Caching Strategy

| Praktik | Detail |
|---------|--------|
| **Pisahkan statis dan dinamis** | /static/* → CDN ON, /api/* → CDN OFF |
| **URL Map per path** | Setiap path bisa punya backend + CDN setting berbeda |
| **Versioned URL > Invalidation** | Invalidation lambat + rate limited, versioned URL instan |
| **Exclude tracking params** | utm_source, utm_medium, fbclid → exclude dari cache key |
| **Set Cache-Control di origin** | Origin kirim header yang tepat → CDN hormati |
| **Test caching dengan curl** | `curl -sI URL \| grep -i age` → Age > 0 = cache HIT |

### Anti-pattern (hindari)

| Jangan | Kenapa | Alternatif |
|--------|--------|------------|
| FORCE_CACHE_ALL untuk API | Bisa cache response per-user → data leak | USE_ORIGIN_HEADERS |
| TTL 1 tahun untuk HTML | User lihat versi lama selamanya | TTL 5 menit + versioned assets |
| Cache response dengan Set-Cookie | Cookie user A bisa dikirim ke user B | Origin hapus Set-Cookie untuk static |
| 0.0.0.0/0 di authorized origin | Siapa saja bisa bypass CDN ke origin | Hanya allow Google LB IPs |
| Invalidate setiap deploy | Rate limited, lambat | Versioned filename dari build tool |

---

## Cost Optimization

| Praktik | Penghematan |
|---------|-------------|
| **Maximize cache hit ratio** (target >95%) | Kurangi cache fill cost + origin load |
| **Compress text content** (gzip/brotli) | 50-80% egress saving untuk HTML/CSS/JS |
| **Optimize images** (WebP, resize) | 25-50% egress saving |
| **Remove unused assets** | Tidak bayar egress untuk file yang tidak perlu |
| **CDN logging sample rate** | 0.1-0.5 (bukan 1.0) → hemat logging cost |
| **Review cache hit ratio mingguan** | Identifikasi low-hit paths → fix atau exclude |
| **Budget alerts** | `Billing` → Budgets → alert 50%, 80%, 100% |

---

## Monitoring

| Praktik | Detail |
|---------|--------|
| **Monitor cache hit ratio** | Target >90%, alert jika drop < 80% |
| **Monitor latency** | p95 < 100ms (cache HIT), p95 < 500ms (overall) |
| **Monitor 5xx errors** | Alert jika > 1% → origin masalah |
| **Monitor bandwidth** | Deteksi spike abnormal (DDoS atau bot) |
| **Log sampling** | 10-50% untuk production, 100% hanya saat debug |
| **Custom dashboard** | Cache hit ratio + latency + error rate + bandwidth |

---

## Checklist Sebelum Go-Live CDN

```
SETUP
☐ Load Balancer created (global external HTTPS)
☐ Backend bucket/service configured
☐ Cloud CDN enabled pada backend yang tepat
☐ Cache mode set (CACHE_ALL_STATIC recommended)
☐ TTL configured per content type
☐ SSL certificate active (Google-managed recommended)
☐ DNS pointing to LB IP

CACHING
☐ Cache hit ratio > 90% di staging test
☐ Versioned filenames untuk CSS/JS (webpack/vite hash)
☐ Tracking query params excluded dari cache key
☐ Static vs dynamic paths separated di URL map
☐ Origin mengirim Cache-Control header yang tepat
☐ Negative caching enabled
☐ Serve stale content enabled

SECURITY
☐ HTTPS only (HTTP → redirect)
☐ TLS 1.2 minimum (SSL policy)
☐ Cloud Armor policy attached (DDoS + WAF)
☐ Signed URL/Cookie configured (jika ada private content)
☐ Origin firewall hanya allow Google LB IPs
☐ CORS configured (jika cross-domain)

MONITORING
☐ CDN logging enabled (sample rate 0.1-0.5)
☐ Dashboard: cache hit ratio, latency, errors, bandwidth
☐ Alert: cache hit drop < 80%
☐ Alert: 5xx error rate > 1%
☐ Alert: latency p95 > 500ms
☐ Budget alert configured

DOCUMENTATION
☐ Cache invalidation procedure documented
☐ Origin failover procedure documented
☐ Escalation contacts listed
```
