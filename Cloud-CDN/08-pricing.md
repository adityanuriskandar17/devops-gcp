# Pricing

Komponen biaya **Cloud CDN** dan **Media CDN**, berorientasi pada **GCP Console**.

---

## Komponen Biaya Cloud CDN

| Komponen | Deskripsi | Dihitung per |
|----------|-----------|-------------|
| **Cache egress** | Traffic dari CDN edge ke user | Per GB |
| **Cache fill** | Traffic dari origin ke CDN edge (cache MISS) | Per GB |
| **HTTP/HTTPS request** | Jumlah request yang diproses | Per 10.000 request |
| **Cache invalidation** | Operasi invalidate cache | Per operasi |
| **Load Balancer** | Forwarding rule + traffic processing | Per jam + per GB |

**Catatan:** Cloud CDN **tidak ada biaya bulanan tetap** — hanya bayar per penggunaan.

---

## Harga Cloud CDN Cache Egress (Perkiraan)

Traffic dari CDN edge ke user (harga bervariasi per region tujuan):

| Tujuan | 0-10 TB/bulan | 10-150 TB/bulan | >150 TB/bulan |
|--------|--------------|-----------------|---------------|
| **Asia Pacific** (Indonesia, dll) | ~$0.080/GB | ~$0.065/GB | Negotiable |
| **North America** | ~$0.020/GB | ~$0.015/GB | Negotiable |
| **Europe** | ~$0.020/GB | ~$0.015/GB | Negotiable |
| **South America** | ~$0.110/GB | ~$0.090/GB | Negotiable |
| **Middle East & Africa** | ~$0.110/GB | ~$0.090/GB | Negotiable |

### Cache fill (origin → CDN)

| Source region | Harga |
|--------------|-------|
| Intra-region (origin & edge di region sama) | Free |
| Inter-region | Egress rate standar (~$0.01-0.08/GB) |

### HTTP Request processing

| Tipe | Harga per 10.000 requests |
|------|--------------------------|
| HTTP request | ~$0.0075 |
| HTTPS request | ~$0.010 |

---

## Harga Media CDN (Perkiraan)

Media CDN pricing berdasarkan **total GB delivered**:

| Volume/bulan | Harga per GB (Asia Pacific) |
|--------------|-----------------------------|
| 0-10 TB | ~$0.070/GB |
| 10-50 TB | ~$0.055/GB |
| 50-150 TB | ~$0.040/GB |
| 150-500 TB | ~$0.030/GB |
| >500 TB | Custom/negotiable |

**Media CDN lebih murah** dari Cloud CDN untuk volume besar (>50TB).

---

## Cloud CDN vs Direct dari Cloud Storage — Perbandingan Biaya

### Tanpa CDN (langsung dari GCS)

| Komponen | Harga |
|----------|-------|
| Storage | ~$0.020/GB/bulan |
| Egress ke internet (Asia) | **~$0.12/GB** |
| GET operations | ~$0.004/10.000 ops |

### Dengan Cloud CDN

| Komponen | Harga |
|----------|-------|
| Storage | ~$0.020/GB/bulan (sama) |
| GCS → CDN (cache fill) | **~$0 (intra-Google)** |
| CDN → User (cache egress, Asia) | **~$0.08/GB** |
| Load Balancer | ~$18/bulan + $0.008/GB |
| Request processing | ~$0.01/10.000 req |

### Kalkulasi contoh: 5TB egress/bulan, 95% cache hit

```
TANPA CDN (Direct GCS):
  5000GB × $0.12/GB     = $600.00
  Total                  = $600/bulan

DENGAN CDN (95% hit):
  CDN egress: 4750GB × $0.08/GB   = $380.00
  Cache fill: 250GB × ~$0          = $0 (intra-Google)
  Load Balancer                     = ~$58 ($18 + 5000GB × $0.008)
  Total                             = ~$438/bulan

  HEMAT: $600 - $438 = $162/bulan (27%)
  PLUS: Latency 10x lebih cepat
```

### Kalkulasi contoh: 50TB egress/bulan (high traffic)

```
TANPA CDN:
  50.000GB × $0.12  = $6,000/bulan

DENGAN CDN (95% hit):
  CDN: 47.500GB × $0.065 = $3,087.50
  LB: $18 + 50.000 × $0.008 = $418
  Total                      = ~$3,505/bulan

  HEMAT: $6,000 - $3,505 = $2,495/bulan (42%)
```

---

## Load Balancer Cost (Komponen Wajib CDN)

Cloud CDN memerlukan Load Balancer — biaya LB:

| Komponen | Harga |
|----------|-------|
| Forwarding rule (pertama) | ~$18/bulan |
| Forwarding rule (tambahan) | ~$18/bulan per rule |
| Data processed (inbound) | ~$0.008/GB |
| Data processed (outbound) | ~$0.008/GB |

---

## Tips Hemat Biaya

| Tips | Penjelasan | Estimasi hemat |
|------|------------|---------------|
| **Naikkan cache hit ratio** | Optimize TTL, cache key → kurangi cache fill | 10-30% |
| **Versioned URLs** | TTL panjang + cache busting via filename | Minimize invalidation |
| **Compress content** | Gzip/Brotli → ukuran file lebih kecil → egress lebih murah | 50-80% untuk text |
| **Appropriate image format** | WebP lebih kecil dari JPEG/PNG | 25-35% |
| **Lazy loading** | Jangan load asset yang tidak terlihat | Reduce total egress |
| **Monitor dan right-size** | Review bandwidth per path → hapus yang tidak perlu | Variable |
| **Exclude unnecessary query params** | Tingkatkan cache hit | 5-15% |
| **Multi-region GCS** | Cache fill dari region terdekat | Reduce fill latency |

---

## Billing di Console

### Lihat biaya CDN

**Console:** `Billing` → **Reports** → filter:

| Filter | Value |
|--------|-------|
| **Service** | Cloud CDN |
| **SKU** | Cache Egress, Cache Fill, HTTP request, dll |
| **Labels** | (jika ada label di LB/backend) |

### Budget alert

**Console:** `Billing` → **Budgets & alerts** → **Create budget**

Setup threshold: 50%, 80%, 100% → notification via email/Slack.

---

## Ringkasan: Kapan CDN Cost-Effective?

| Skenario | CDN worth it? | Alasan |
|----------|---------------|--------|
| High traffic (>1TB/bulan) | **Ya** | CDN egress jauh lebih murah dari GCS egress |
| Global users | **Ya** | Latency improvement + cost saving |
| Low traffic (<100GB/bulan) | **Mungkin tidak** | LB cost ($18/bulan) bisa lebih besar dari saving |
| Konten sangat dinamis (low hit ratio) | **Tidak** | Cache MISS banyak = bayar fill + egress |
| Konten statis (high hit ratio >90%) | **Sangat ya** | Maximum cost saving + performance |
