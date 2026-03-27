# Cloud CDN

Dokumentasi lengkap **Cloud CDN** dan **Media CDN** di Google Cloud Platform, berorientasi pada **GCP Console**.

---

## Apa itu CDN?

**CDN (Content Delivery Network)** adalah jaringan server yang tersebar secara global (disebut **edge locations**) yang meng-cache dan menyajikan konten lebih dekat ke pengguna akhir.

**Tujuan utama:** Memperbesar cakupan/jangkauan agar objek (website, gambar, video) bisa diakses **cepat** oleh **banyak user** di seluruh dunia.

```
Tanpa CDN:
  User Jakarta  ──────────────────────────────► Origin (US) ──► Response (lambat, 200ms+)
  User Singapore ─────────────────────────────► Origin (US) ──► Response (lambat)
  User Tokyo  ────────────────────────────────► Origin (US) ──► Response (lambat)

Dengan CDN:
  User Jakarta  ──► Edge Jakarta (cache HIT) ──► Response (cepat, <20ms)
  User Singapore ─► Edge Singapore (cache HIT) ► Response (cepat)
  User Tokyo  ────► Edge Tokyo (cache HIT) ────► Response (cepat)

  Kalau cache MISS:
  Edge Jakarta ──► Origin (US) ──► simpan di cache ──► Response ke user
                                   (request berikutnya = HIT, langsung dari edge)
```

---

## Google Cloud punya 2 produk CDN

| Produk | Fungsi utama | Infrastruktur |
|--------|-------------|---------------|
| **Cloud CDN** | Mempercepat **aplikasi web**, API, website statis | Jaringan edge global Google |
| **Media CDN** | Streaming **video** (VoD & live) dan download file besar | Infrastruktur **YouTube** |

### Cloud CDN

**Console path:** `Network services` → **Cloud CDN**

- Mempercepat website, API, dan konten statis
- Terintegrasi langsung dengan **Cloud Load Balancing**
- Menggunakan **200+ edge locations** Google di seluruh dunia
- Cocok untuk: website, SPA, API response caching, gambar, CSS/JS

### Media CDN

**Console path:** `Media CDN` (atau `Network services` → **Media CDN**)

- Menggunakan **infrastruktur YouTube** (jaringan terbesar dunia untuk video)
- Optimized untuk **streaming video** (VoD dan live) serta download file besar (>10MB)
- Throughput sangat tinggi, latency rendah untuk media
- Cocok untuk: platform video, live streaming, game updates, software downloads

---

## Cloud CDN vs Media CDN vs Cloud Storage

| Aspek | Cloud Storage | Cloud CDN | Media CDN |
|-------|--------------|-----------|-----------|
| **Fungsi** | Menyimpan objek (file) | Mempercepat akses ke objek | Mempercepat delivery media/video |
| **Analogi** | Gudang penyimpanan | Jaringan kurir cepat untuk web | Jaringan kurir khusus video |
| **Lokasi data** | Di bucket (1 region/multi-region) | Di 200+ edge cache global | Di edge YouTube global |
| **Kecepatan** | Tergantung jarak user ↔ bucket | Cepat (dari edge terdekat) | Sangat cepat untuk media besar |
| **Caching** | Tidak ada caching | Ya — cache di edge | Ya — cache di edge + mid-tier |
| **Integrasi** | Standalone | Origin = GCS bucket / backend service | Origin = GCS / custom origin |
| **Biaya** | Storage + egress | Cache egress (lebih murah dari origin egress) | Per GB delivered |
| **Kapan pakai** | Simpan semua file | Percepat akses web/API | Streaming video, download besar |

### Hubungan ketiganya

```
┌──────────────────────────────────────────────────────┐
│                    User / Browser                     │
└────────────────────────┬─────────────────────────────┘
                         │ request
                         ▼
              ┌─────────────────────┐
              │    CDN Edge Cache    │◄── Cloud CDN atau Media CDN
              │  (Jakarta, Tokyo,   │
              │   Singapore, dll)   │
              └──────────┬──────────┘
                         │ cache MISS → fetch dari origin
                         ▼
              ┌─────────────────────┐
              │   Origin Server     │
              │                     │
              │  Bisa berupa:       │
              │  • Cloud Storage    │◄── Bucket GCS sebagai origin
              │  • Compute Engine   │◄── VM / container
              │  • Cloud Run        │◄── Serverless
              │  • GKE              │◄── Kubernetes
              │  • External backend │◄── Server di luar GCP
              └─────────────────────┘
```

**Kesimpulan:**
- **Cloud Storage** = tempat menyimpan file
- **Cloud CDN** = mempercepat pengiriman file ke user global (origin bisa Cloud Storage)
- **Media CDN** = sama tapi khusus optimized untuk video/file besar (infrastruktur YouTube)

---

## Daftar Dokumentasi

| No | Topik | File | Deskripsi |
|----|-------|------|-----------|
| 01 | Konsep & Cara Kerja | [01-concepts.md](01-concepts.md) | Cara kerja CDN, edge caching, kenapa cepat, kelebihan/kekurangan |
| 02 | Setup Origin | [02-setup-origin.md](02-setup-origin.md) | Enable Cloud CDN via Console, pilih origin (GCS, backend, LB) |
| 03 | Caching Policies | [03-caching-policies.md](03-caching-policies.md) | Cache mode, TTL, cache key, invalidation |
| 04 | Security | [04-security.md](04-security.md) | Signed URL, Signed Cookie, Cloud Armor, SSL |
| 05 | Media CDN | [05-media-cdn.md](05-media-cdn.md) | Streaming VoD & live, setup, perbedaan detail dengan Cloud CDN |
| 06 | Integrasi Cloud Storage | [06-integration-cloud-storage.md](06-integration-cloud-storage.md) | CDN + GCS bucket, flow, skenario |
| 07 | Monitoring | [07-monitoring.md](07-monitoring.md) | Cache hit ratio, logging, metrics, troubleshooting |
| 08 | Pricing | [08-pricing.md](08-pricing.md) | Komponen biaya, estimasi, Cloud CDN vs Media CDN |
| 09 | CLI Cheatsheet | [09-commands-cheatsheet.md](09-commands-cheatsheet.md) | gcloud CLI commands |
| 10 | Best Practices | [10-best-practices.md](10-best-practices.md) | Performance, security, cost optimization, checklist |

---

## Quick Start: Enable Cloud CDN via Console

1. Buka **Google Cloud Console** → **Network services** → **Cloud CDN**
2. Klik **Add origin**
3. Pilih **Origin type** (Load Balancer atau Cloud Storage bucket)
4. Konfigurasi caching policy
5. Klik **Add**
6. CDN aktif — konten mulai di-cache di edge global

Detail setiap langkah: [02-setup-origin.md](02-setup-origin.md)
