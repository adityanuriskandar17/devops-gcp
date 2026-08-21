# Pricing & Best Practices Cloud Armor

Dokumentasi harga **Cloud Armor** (Standard vs Enterprise), estimasi biaya, dan best practices untuk production.

**Pricing page:** [cloud.google.com/armor/pricing](https://cloud.google.com/armor/pricing)

---

## Service Tiers

Cloud Armor memiliki **2 tier** utama:

```
┌───────────────────────────────────────────────────────────────────────┐
│                          Cloud Armor Tiers                             │
│                                                                       │
│  ┌───────────────────┐ ┌────────────────────┐ ┌────────────────────┐│
│  │  STANDARD          │ │  ENTERPRISE Paygo  │ │  ENTERPRISE Annual  ││
│  │                    │ │                     │ │                     ││
│  │  Pay-as-you-go     │ │  No commitment      │ │  12-month commit    ││
│  │  Basic DDoS        │ │  Advanced DDoS +    │ │  Advanced DDoS +    ││
│  │  protection        │ │  WAF bundled        │ │  WAF bundled        ││
│  │  Manual rules      │ │  Adaptive Protect.  │ │  Adaptive Protect.  ││
│  │                    │ │  full               │ │  full               ││
│  │  $5/policy/mo +     │ │  ~$200/mo base,     │ │  ~$3,000/mo base,   ││
│  │  $1/rule/mo +       │ │  2 resources        │ │  100 resources      ││
│  │  $0.75/1M requests  │ │  included           │ │  included           ││
│  └───────────────────┘ └────────────────────┘ └────────────────────┘│
└───────────────────────────────────────────────────────────────────────┘
```

---

## Pricing Detail

### Cloud Armor Standard

| Komponen | Harga |
|---------|-------|
| **Per policy** | **$5/bulan** per policy — **tidak ada** base fee bulanan lain |
| **Rules** | $1/bulan per rule |
| **Requests** (rule evaluation) | $0.75 per 1 juta requests |
| **Adaptive Protection** | Basic alerts gratis |

Standard tier **tidak punya monthly base fee per project/resource** — biaya murni dari policy + rule + request di atas.

### Cloud Armor Enterprise

Enterprise punya **2 mode pricing yang berbeda** — bukan satu harga yang sama:

| Komponen | Enterprise Paygo | Enterprise Annual |
|---------|-----------------|-------------------|
| **Base fee** | **~$200/bulan** (prorated) | **~$3,000/bulan** |
| **Protected resources included** | **2** pertama | **100** pertama |
| **Extra resource (setelah included)** | **$200/bulan** per resource | **$30/bulan** per resource |
| **Rules** | **Included** (bundled) | **Included** (bundled) |
| **Requests** | **Included** (bundled) | **Included** (bundled) |
| **WAF rules** | **Included** | **Included** |
| **Adaptive Protection** | Full (signatures + suggested rules) | Full |
| **Threat Intelligence** | **Included** | **Included** |
| **Commitment** | Tidak ada | 12 bulan |

### Perbandingan Tier

| Fitur | Standard | Enterprise |
|-------|---------|-----------|
| **Basic DDoS protection** | Ya | Ya |
| **Custom rules (IP, geo, CEL)** | Ya | Ya |
| **Preconfigured WAF rules** | Ya (bayar per rule) | **Included** |
| **Rate limiting** | Ya | Ya |
| **Adaptive Protection — basic alerts** | Ya | Ya |
| **Adaptive Protection — full (signatures)** | **Tidak** | **Ya** |
| **Threat Intelligence** | **Tidak** | **Ya** |
| **Named IP address lists** | **Tidak** | **Ya** |
| **Advanced network DDoS** | **Tidak** | **Ya** |
| **Bot management** | Ya | Ya |
| **DDoS bill protection** | **Tidak** | **Ya** (Annual only) |

---

## Estimasi Biaya

### Skenario 1: Startup — 1 Web App, Basic Protection

```
Standard tier:
  1 project, 1 policy, 1 backend service
  5 rules (IP block, geo block, SQLi, XSS, default)
  ~500,000 req/bulan

  Policy: 1 × $5              = $5/bulan
  Rules: 5 × $1                = $5/bulan
  Requests: 0.5M × $0.75/1M    = $0.375/bulan

  Total: ~$10.40/bulan (~Rp 165,000)
```

### Skenario 2: Medium — 3 Apps, WAF + Rate Limiting

```
Standard tier:
  1 project, 2 policies, 5 backend services
  15 rules
  ~10M req/bulan

  Policies: 2 × $5             = $10/bulan
  Rules: 15 × $1                = $15/bulan
  Requests: 10M × $0.75/1M      = $7.50/bulan

  Total: ~$32.50/bulan (~Rp 515,000)

  (Standard tidak charge per protected resource — hanya per policy,
   rule, dan request. Charge per protected resource hanya berlaku
   di Enterprise.)
```

### Skenario 3: Enterprise — 10+ Apps, Full Protection

```
Enterprise Annual:
  1 billing account, 5 projects, 20 backend services
  50 rules, WAF, Adaptive Protection full
  ~100M req/bulan

  Base: ~$3,000/bulan (100 protected resources included)
  Extra resources: $0 (20 < 100 included)
  Rules: included
  Requests: included

  Total: ~$3,000/bulan (~Rp 47,000,000)

  (Kalau pakai Enterprise Paygo bukan Annual: base ~$200/bulan
   tapi hanya 2 resource included, jadi 20 backend services =
   18 extra × $200 = $3,600/bulan tambahan → ~$3,800/bulan total.
   Untuk kasus 20 backend services, Enterprise Annual lebih hemat.)
```

### Standard vs Enterprise — Kapan Upgrade?

```
Decision flow:

  Berapa backend services?
       │
       ├── < 5 backends, < 10 rules → STANDARD ($10–$50/mo)
       │
       ├── 5–15 backends, banyak WAF rules
       │   │
       │   └── Hitung: Standard cost mendekati Enterprise Paygo (~$200/mo base)?
       │       ├── Ya → ENTERPRISE PAYGO lebih hemat (WAF & rules included)
       │       └── Tidak → tetap STANDARD
       │
       └── > 15 backends (lebih dari batas 2/100 free resource),
           butuh Adaptive Protection full, Threat Intelligence,
           DDoS bill protection
           → ENTERPRISE PAYGO (~$200/mo, cocok untuk <20 resource)
             atau ENTERPRISE ANNUAL (~$3,000/mo, cocok untuk skala besar
             karena 100 resource included + commitment discount)
```

---

## Best Practices

### 1. Policy Organization

```
Rekomendasi:

  Policy per application/environment:
  ┌──────────────────────────────────────────────┐
  │ webapp-prod-waf          → production web app│
  │ webapp-staging-waf       → staging web app   │
  │ api-prod-rate-limit      → production API    │
  │ admin-whitelist          → admin panel       │
  │ cdn-edge-policy          → CDN protection    │
  └──────────────────────────────────────────────┘
```

| Practice | Penjelasan |
|----------|-----------|
| **1 policy per app/service** | Easier management, targeted rules |
| **Separate prod vs staging** | Avoid accidental prod impact |
| **Naming convention** | `{app}-{env}-{purpose}` |
| **Default rule = Allow** (public apps) | Blacklist approach — block specific threats |
| **Default rule = Deny** (internal apps) | Whitelist approach — allow specific sources |

### 2. Rule Priority Strategy

```
Recommended priority ranges:

  0–999:       Emergency rules (active attack response)
  1000–1999:   IP whitelist/blacklist
  2000–2999:   Geo-based rules
  3000–3999:   WAF rules (OWASP)
  4000–4999:   Rate limiting
  5000–5999:   Bot management
  2147483647:  Default rule
```

| Practice | Penjelasan |
|----------|-----------|
| **Sisakan gap antar rules** | Priority 1000, 1100, 1200... bukan 1, 2, 3 |
| **Whitelist sebelum blacklist** | Allow trusted IP dulu (priority rendah = dievaluasi duluan) |
| **WAF sebelum rate limit** | Block attack patterns dulu, baru rate limit |

### 3. WAF Tuning

| Practice | Penjelasan |
|----------|-----------|
| **Start dengan sensitivity 1** | High-confidence patterns, minimal false positive |
| **Deploy di preview mode dulu** | Test selama 1–7 hari sebelum enforce |
| **Monitor logs secara rutin** | Cek Cloud Logging untuk false positive |
| **Opt-out signature yang FP** | Gunakan `opt_out_rule_ids` untuk exclude |
| **Gunakan `-stable` variant** | Canary untuk testing only |

### 4. Rate Limiting

| Practice | Penjelasan |
|----------|-----------|
| **Identify by IP** (default) | Paling umum dan reliable |
| **Gunakan X-Forwarded-For** | Jika di belakang proxy/CDN |
| **Throttle untuk API** | Protect API endpoints dari abuse |
| **Rate-based ban untuk login** | Anti brute force |
| **Set reasonable limits** | Jangan terlalu ketat (false positive), jangan terlalu longgar (tidak efektif) |

### 5. Monitoring & Logging

```
Cloud Logging query untuk Cloud Armor:

  resource.type="http_load_balancer"
  jsonPayload.enforcedSecurityPolicy.name="my-policy"

  Filter by action:
  jsonPayload.enforcedSecurityPolicy.outcome="DENY"

  Filter by rule:
  jsonPayload.enforcedSecurityPolicy.matchedFieldValue="sqli-v33-stable"
```

| Practice | Penjelasan |
|----------|-----------|
| **Enable request logging** | Lihat setiap request yang match rule |
| **Set up alerts** | Alert saat deny rate meningkat drastis |
| **Dashboard di Cloud Monitoring** | Visualisasi traffic allowed vs denied |
| **Review logs mingguan** | Cari pattern baru, adjust rules |
| **Export ke BigQuery** | Long-term analysis, compliance reporting |

### 6. Checklist Production

```
☐ Policy dibuat dan di-attach ke semua backend services
☐ Default rule action sesuai kebutuhan (Allow/Deny)
☐ Priority strategy konsisten (gap antar rules)
☐ WAF rules aktif:
  ☐ SQL Injection (sqli-v33-stable, sensitivity 1)
  ☐ XSS (xss-v33-stable, sensitivity 1)
  ☐ LFI (lfi-v33-stable, sensitivity 1)
  ☐ RCE (rce-v33-stable, sensitivity 1)
  ☐ Scanner detection (scannerdetection-v33-stable)
☐ Rate limiting aktif:
  ☐ API endpoints (throttle)
  ☐ Login endpoint (rate-based ban)
☐ Geo-blocking (jika perlu)
☐ Adaptive Protection enabled
☐ Preview mode tested → disabled untuk active rules
☐ Logging enabled di Load Balancer
☐ Alerts configured di Cloud Monitoring
☐ Dashboard untuk traffic monitoring
☐ Incident response playbook (siapa handle alert)
☐ Regular review (mingguan): new FP, new attack patterns
```

---

## Kelebihan & Kekurangan Cloud Armor

| Kelebihan | Kekurangan |
|-----------|------------|
| **Edge-based** — block di PoP, sebelum sampai server | **Butuh Load Balancer** — tidak bisa langsung ke VM (kecuali Network edge policy) |
| **Native GCP** — integrasi seamless | **Berbayar** — Standard mulai dari $5/policy + $1/rule/bulan |
| **WAF preconfigured** — OWASP CRS out-of-the-box | **Enterprise mahal** — ~$200/bulan (Paygo) atau ~$3,000/bulan (Annual) |
| **Adaptive Protection** — ML auto-detect DDoS | **Learning period** — 1 jam (Adaptive) / 24 jam (Network DDoS) |
| **Rate limiting** — throttle + ban built-in | **Manual rule deployment** — Adaptive tidak auto-block |
| **Global capacity** — Google network bandwidth | **CEL learning curve** — Advanced mode butuh belajar syntax |
| **Bot management** — reCAPTCHA integration | **reCAPTCHA Enterprise berbayar** |
| **Preview mode** — test tanpa impact | — |
| **Logging + monitoring** — terintegrasi Cloud Logging | — |

---

*Dokumen ini berdasarkan pricing dan fitur Cloud Armor per Maret 2025–2026; harga dapat berubah.*
