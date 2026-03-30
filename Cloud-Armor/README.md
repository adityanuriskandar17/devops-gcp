# Google Cloud Armor

Dokumentasi lengkap **Google Cloud Armor** — layanan **Web Application Firewall (WAF)** dan **DDoS protection** yang melindungi aplikasi di Google Cloud Platform.

**Console:** Network Security → **Cloud Armor**
**URL:** [console.cloud.google.com/net-security/securitypolicies](https://console.cloud.google.com/net-security/securitypolicies)

---

## Apa itu Cloud Armor?

Cloud Armor adalah layanan **keamanan jaringan** yang berjalan di **edge network Google** (PoP — Points of Presence) di seluruh dunia. Cloud Armor melindungi aplikasi dari:

- **DDoS attacks** (Layer 3/4/7)
- **SQL Injection, XSS** (OWASP Top 10)
- **Bot / scraper** traffic
- **Geo-based** threats (block negara tertentu)
- **Rate-based** abuse (brute force, API abuse)

```
Internet Traffic
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│  Google Edge Network (PoP di seluruh dunia)               │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              CLOUD ARMOR                             │ │
│  │                                                     │ │
│  │  Security Policy → Rules → Match? → Action          │ │
│  │                                                     │ │
│  │  ┌───────────┐  ┌──────────┐  ┌──────────────────┐ │ │
│  │  │ IP Block  │  │ WAF/OWASP│  │ Rate Limiting    │ │ │
│  │  │ Geo Block │  │ Bot Mgmt │  │ Adaptive Protect │ │ │
│  │  └───────────┘  └──────────┘  └──────────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                                │
│              ┌───────────┴───────────┐                    │
│              │ ALLOW          DENY   │                    │
│              ▼                ▼      │                    │
└──────────── Traffic ───── Blocked ───┘
              │
              ▼
     Load Balancer → Backend Services (VM, GKE, Cloud Run)
```

---

## Daftar Dokumentasi

| # | File | Isi |
|---|------|-----|
| 01 | [Konsep & Cara Kerja](01-concepts.md) | Apa itu Cloud Armor, arsitektur, policy types, flow traffic, skenario pakai/tidak pakai |
| 02 | [Create Security Policy](02-create-policy.md) | Console walkthrough: create policy, attach ke backend, semua opsi form |
| 03 | [Rules & Conditions](03-rules.md) | Menambah rules, priority, match conditions (IP, geo, header, CEL), actions |
| 04 | [WAF Rules (OWASP)](04-waf-rules.md) | Preconfigured WAF rules, SQL injection, XSS, sensitivity levels, tuning |
| 05 | [Adaptive Protection & Rate Limiting](05-adaptive-protection.md) | ML-based DDoS detection, rate limiting, throttle, rate-based ban, bot management |
| 06 | [Pricing & Best Practices](06-pricing-best-practices.md) | Standard vs Enterprise, harga, checklist production |

---

## Quick Start

```
1. Console → Network Security → Cloud Armor
2. Create security policy (tipe: Backend security policy)
3. Tambah rules (IP whitelist/blacklist, WAF, geo-block)
4. Attach policy ke backend service Load Balancer
5. Traffic dilindungi di edge Google!
```
