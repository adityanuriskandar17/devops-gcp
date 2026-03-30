# Adaptive Protection, Rate Limiting & Bot Management

Dokumentasi fitur **Adaptive Protection** (ML-based DDoS detection), **Rate Limiting** (throttle & ban), dan **Bot Management** (reCAPTCHA) di Cloud Armor.

**Console:** Cloud Armor → (policy) → Adaptive Protection / Rules

---

## Adaptive Protection

### Apa itu Adaptive Protection?

Adaptive Protection menggunakan **machine learning** untuk mendeteksi dan membantu mitigasi **Layer 7 DDoS attacks** (HTTP floods, slow attacks, dll). Sistem ini membangun model dari traffic normal, lalu mendeteksi anomali secara real-time.

```
Cara kerja Adaptive Protection:

  Phase 1: LEARNING (minimal 1 jam)
  ┌──────────────────────────────────────────────────┐
  │  ML model observe traffic patterns:               │
  │  - Request rate per backend                       │
  │  - Geographic distribution                        │
  │  - URL patterns                                   │
  │  - Header patterns                                │
  │  → Build baseline "normal traffic"                │
  └──────────────────────────────────────────────────┘
           │
           ▼
  Phase 2: DETECTION (continuous)
  ┌──────────────────────────────────────────────────┐
  │  ML model compare real-time traffic vs baseline:  │
  │                                                  │
  │  Normal:   ████████░░░░ (1000 req/s)             │
  │  Sekarang: ████████████████████ (50,000 req/s)   │
  │                                                  │
  │  → ANOMALY DETECTED! (confidence: 0.95)          │
  └──────────────────────────────────────────────────┘
           │
           ▼
  Phase 3: ALERTING
  ┌──────────────────────────────────────────────────┐
  │  Alert generated:                                 │
  │  - Attack signature                               │
  │  - Confidence score                               │
  │  - Suggested Cloud Armor rule                     │
  │  - Source IP distribution                         │
  │  → Cloud Logging + Security Command Center        │
  └──────────────────────────────────────────────────┘
           │
           ▼
  Phase 4: MITIGATION
  ┌──────────────────────────────────────────────────┐
  │  Admin review:                                    │
  │  → Deploy suggested rule (1-click)                │
  │  → atau custom rule berdasarkan signature         │
  │  → attack traffic blocked ✅                      │
  └──────────────────────────────────────────────────┘
```

### Enable di Console

```
Console: Cloud Armor → (policy) → EDIT POLICY

  ━━━━━━━━ Adaptive Protection ━━━━━━━━━━━━━━━━━━━━

  ☑ Enable Adaptive Protection

  ⓘ Adaptive Protection uses machine learning to
    detect and help mitigate Layer 7 DDoS attacks.
    It requires at least 1 hour of traffic observation
    before enhanced mitigations activate.

  [UPDATE]
```

Atau saat create policy:

```
  ☑ Enable Adaptive Protection
```

### Standard vs Enterprise

| Fitur | Standard (gratis) | Enterprise (berbayar) |
|-------|-------------------|----------------------|
| **Anomaly detection** | Ya | Ya |
| **Basic alerts** (confidence score) | Ya | Ya |
| **Attack signatures** | Tidak | **Ya** |
| **Suggested WAF rules** | Tidak | **Ya** (1-click deploy) |
| **Source IP analysis** | Tidak | **Ya** |
| **Geographic analysis** | Tidak | **Ya** |
| **Threat Intelligence integration** | Tidak | **Ya** |

### Adaptive Protection Event Dashboard

```
Console: Cloud Armor → (policy) → Adaptive Protection tab

  ┌───────────────────────────────────────────────────────────────┐
  │  Adaptive Protection                                           │
  │                                                               │
  │  Recent events:                                                │
  │  ┌─────────┬────────────┬────────────┬───────────┬──────────┐│
  │  │ Time    │ Confidence │ Attack     │ Suggested │ Status   ││
  │  │         │ Score      │ Type       │ Rule      │          ││
  │  ├─────────┼────────────┼────────────┼───────────┼──────────┤│
  │  │ 14:23   │ 0.95       │ HTTP Flood │ Block     │ Active   ││
  │  │         │            │            │ 45.xx.0/16│          ││
  │  │ 09:15   │ 0.72       │ Slow POST  │ Rate limit│ Resolved ││
  │  └─────────┴────────────┴────────────┴───────────┴──────────┘│
  │                                                               │
  │  (Enterprise only: DEPLOY SUGGESTED RULE button)              │
  └───────────────────────────────────────────────────────────────┘
```

| Kelebihan Adaptive Protection | Kekurangan Adaptive Protection |
|------------------------------|-------------------------------|
| Auto-detect tanpa manual rule writing | Butuh 1 jam learning period |
| ML-based — adaptif terhadap pattern baru | False positive mungkin di awal |
| Real-time alerting | Suggested rules hanya di Enterprise |
| Tidak impact performance (di edge) | Tidak auto-block (perlu manual deploy rule) |

---

## Rate Limiting

### Apa itu Rate Limiting?

Rate limiting membatasi jumlah request yang bisa dikirim client dalam periode waktu tertentu. Ada 2 tipe:

```
Throttle:
  Client: 150 req/min (limit: 100 req/min)
  ┌──────────────────────────────────────────┐
  │ Request 1-100   → ALLOW ✅              │
  │ Request 101-150 → DENY 429 ❌           │
  │ Next minute     → counter reset          │
  └──────────────────────────────────────────┘

Rate-based Ban:
  Client: 500 req/min terus-menerus (ban threshold: 1000 req/5min)
  ┌──────────────────────────────────────────┐
  │ Min 1: 500 req → throttle excess         │
  │ Min 2: 500 req → total 1000 → BAN!       │
  │ Banned 10 menit → ALL requests denied    │
  │ Setelah 10 min → unban, counter reset    │
  └──────────────────────────────────────────┘
```

### Console: Throttle Rule

```
Console: Cloud Armor → (policy) → + ADD RULE

  Mode: ○ Advanced mode
  Expression: request.path.matches('/api/.*')

  Action: Throttle

  ┌──────────────────────────────────────────────────────────────┐
  │  Rate limit threshold                                         │
  │  Request count: ┌────────┐  per  ┌──────────────┐           │
  │                 │ 100     │      │ 60 seconds  ▼│           │
  │                 └────────┘      └──────────────┘           │
  │                                                              │
  │  Identify traffic by:                                         │
  │  ┌──────────────────────────────────────┐                    │
  │  │ IP address                          ▼│                    │
  │  └──────────────────────────────────────┘                    │
  │                                                              │
  │  Conform action:  Allow                                       │
  │  Exceed action:   Deny (429)                                  │
  └──────────────────────────────────────────────────────────────┘

  Priority: 4000
```

### Console: Rate-based Ban Rule

```
  Action: Rate-based ban

  ┌──────────────────────────────────────────────────────────────┐
  │  Rate limit threshold                                         │
  │  Request count: ┌────────┐  per  ┌──────────────┐           │
  │                 │ 500     │      │ 120 seconds ▼│           │
  │                 └────────┘      └──────────────┘           │
  │                                                              │
  │  Ban threshold                                                │
  │  Request count: ┌────────┐  per  ┌──────────────┐           │
  │                 │ 1000    │      │ 300 seconds ▼│           │
  │                 └────────┘      └──────────────┘           │
  │                                                              │
  │  Ban duration:  ┌──────────────┐                             │
  │                 │ 600 seconds   │                             │
  │                 └──────────────┘                             │
  │                                                              │
  │  Identify traffic by:                                         │
  │  ┌──────────────────────────────────────┐                    │
  │  │ IP address                          ▼│                    │
  │  └──────────────────────────────────────┘                    │
  │                                                              │
  │  Conform action:  Allow                                       │
  │  Exceed action:   Deny (429)                                  │
  └──────────────────────────────────────────────────────────────┘
```

### Key Types (Identify Traffic By)

```
  Identify traffic by:
  ┌──────────────────────────────────────┐
  │ IP address                          ▼│
  └──────────────────────────────────────┘

  Pilihan:
  ┌──────────────────────────────────────┐
  │ ALL                                   │  ← rate limit total (semua traffic)
  │ IP address                            │  ← per source IP
  │ X-Forwarded-For IP                    │  ← per client IP (behind proxy)
  │ HTTP header                           │  ← per header value
  │ HTTP cookie                           │  ← per cookie value
  │ Region code                           │  ← per country
  │ TLS JA3 fingerprint                   │  ← per TLS fingerprint
  └──────────────────────────────────────┘
```

| Key Type | Dihitung Per | Use Case |
|----------|-------------|----------|
| **ALL** | Total semua traffic | Global rate limit (misal: max 10,000 req/s total) |
| **IP address** | Per source IP | **Paling umum** — limit per user/client |
| **X-Forwarded-For IP** | Per client IP di header XFF | Saat backend di belakang reverse proxy |
| **HTTP header** | Per nilai header tertentu | Rate limit per API key di header |
| **HTTP cookie** | Per nilai cookie tertentu | Rate limit per session |
| **Region code** | Per negara | Limit per country |
| **TLS JA3 fingerprint** | Per TLS client fingerprint | Anti-bot (detect unique client fingerprints) |

### Perbandingan Throttle vs Rate-based Ban

| Aspek | Throttle | Rate-based Ban |
|-------|---------|---------------|
| **Behavior** | Block excess requests, allow up to limit | Ban client entirely setelah threshold |
| **Recovery** | Instant — next window langsung reset | Harus tunggu ban duration selesai |
| **Severity** | Moderate | Aggressive |
| **Cocok untuk** | Normal rate limiting API | Brute force, credential stuffing |

### Skenario Rate Limiting

```
Skenario 1: API Rate Limiting (Throttle)

  Rule: request.path.matches('/api/.*')
  Action: Throttle — 100 req/60s per IP
  Priority: 4000

  Normal user (10 req/min):     → ALLOW ✅
  Heavy user (100 req/min):     → ALLOW (at limit) ⚠️
  Abusive client (500 req/min): → 100 ALLOW, 400 DENY ❌


Skenario 2: Login Brute Force Protection (Rate-based Ban)

  Rule: request.path == '/auth/login' && request.method == 'POST'
  Action: Rate-based ban
    Rate limit: 10 req/60s
    Ban threshold: 30 req/300s
    Ban duration: 600s (10 min)
  Priority: 4100

  Normal user (1 login attempt):           → ALLOW ✅
  Typo password (5 attempts/min):          → ALLOW ✅
  Brute force (30+ attempts/5min):         → BANNED 10 min ❌


Skenario 3: Country-based Rate Limit

  Rule: origin.region_code == 'CN'
  Action: Throttle — 10 req/60s per IP
  Priority: 4200

  CN user normal (5 req/min):   → ALLOW ✅
  CN bot/scraper (100 req/min): → 10 ALLOW, 90 DENY ❌
  ID user (100 req/min):        → rule tidak match → ALLOW ✅
```

---

## Bot Management

### Apa itu Bot Management?

Cloud Armor terintegrasi dengan **reCAPTCHA Enterprise** untuk membedakan traffic human vs bot. Ada beberapa mekanisme:

```
Bot Management Flow:

  Request masuk
       │
       ▼
  Cloud Armor Rule: Redirect to reCAPTCHA
       │
       ├── Human (pass challenge) → ALLOW ✅
       │
       └── Bot (fail challenge) → DENY ❌
```

### Tipe Bot Management

| Tipe | Mekanisme | UX Impact |
|------|-----------|-----------|
| **Manual reCAPTCHA challenge** | User harus solve challenge (gambar, checkbox) | Tinggi — user harus interact |
| **reCAPTCHA action token** | Frictionless — JS embed di frontend, score-based | Rendah — invisible untuk user |
| **reCAPTCHA session token** | Frictionless — cookie-based session scoring | Rendah — invisible untuk user |
| **HTTP 302 redirect** | Redirect ke custom URL | Medium — user di-redirect |
| **Request decoration** | Tambah custom header, backend decide | Tidak ada — transparent |

### Console: Bot Management Rule

```
Console: Cloud Armor → (policy) → + ADD RULE

  Mode: ○ Advanced mode
  Expression: request.path.matches('/checkout/.*')

  Action: Redirect

  Redirect type:
  ● Google reCAPTCHA

  reCAPTCHA site key:
  ┌──────────────────────────────────────────────┐
  │ 6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX          │
  └──────────────────────────────────────────────┘

  Priority: 5000
```

### Setup Flow

```
Step 1: Create reCAPTCHA Enterprise site key
       │  Console → reCAPTCHA Enterprise
       │  → Create site key (WAF type)
       │
       ▼
Step 2: Integrate reCAPTCHA JS di frontend
       │  (untuk action/session token)
       │
       ▼
Step 3: Cloud Armor rule
       │  Action: Redirect → Google reCAPTCHA
       │  Site key: (dari step 1)
       │
       ▼
Step 4: Bot traffic terfilter! ✅
```

| Kelebihan Bot Management | Kekurangan Bot Management |
|--------------------------|--------------------------|
| Efektif filter bot vs human | reCAPTCHA Enterprise berbayar |
| Multiple mekanisme (manual, frictionless) | Perlu frontend integration (JS) |
| Google ML-powered scoring | Some bots bisa bypass reCAPTCHA |
| Invisible option available | UX impact pada manual challenge |

---

## Advanced Network DDoS Protection

Untuk **Network Load Balancer** dan **VM dengan public IP** (Enterprise only):

```
Console: Cloud Armor → Create Policy

  Policy type: ○ Network edge security policy

  ┌──────────────────────────────────────────────────────────────┐
  │  Advanced network DDoS protection                             │
  │                                                              │
  │  ☑ Enable advanced DDoS protection                           │
  │                                                              │
  │  ⓘ Advanced DDoS protection for network load balancers       │
  │    uses ML to learn baseline traffic patterns.                │
  │    24-hour training period required.                          │
  │                                                              │
  │  Region: asia-southeast2                                      │
  └──────────────────────────────────────────────────────────────┘
```

| Fitur | Detail |
|-------|--------|
| **Layer** | L3/L4 (network layer) |
| **Training period** | 24 jam untuk learn baseline |
| **Resource** | Network LB, VM with public IP, Protocol forwarding |
| **Requirement** | Cloud Armor Enterprise |

---

## Ringkasan

```
Adaptive Protection:
  → ML-based anomaly detection
  → Learning (1h) → Detection → Alert → Mitigation
  → Standard: basic alerts
  → Enterprise: full signatures + suggested rules

Rate Limiting:
  → Throttle: limit per window, excess denied
  → Rate-based ban: temporary full ban setelah abuse threshold
  → Key types: IP, header, cookie, region, TLS fingerprint

Bot Management:
  → reCAPTCHA integration (manual + frictionless)
  → Redirect action di Cloud Armor rule
  → Perlu reCAPTCHA Enterprise site key

Network DDoS:
  → Enterprise only
  → Network edge security policy
  → 24h training period
```

---

*Dokumen ini berdasarkan fitur Cloud Armor di Google Cloud Console per Maret 2025–2026.*
