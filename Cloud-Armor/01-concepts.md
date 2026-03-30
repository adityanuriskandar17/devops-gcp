# Konsep & Cara Kerja Cloud Armor

Dokumentasi konsep dasar **Google Cloud Armor** — arsitektur, cara kerja di edge network, tipe security policy, dan perbandingan skenario pakai/tidak pakai.

**Console:** Network Security → **Cloud Armor**

---

## Cara Kerja Cloud Armor

Cloud Armor bekerja di **Google Edge Network** — sebelum traffic masuk ke VPC dan backend service kamu. Artinya traffic berbahaya di-**block di pinggir jaringan Google** (PoP / Points of Presence), bukan di server kamu.

```
Flow Traffic dengan Cloud Armor:

  User / Attacker (Internet)
         │
         ▼
  ┌──────────────────────────────────────────────────┐
  │  Google Edge PoP (Jakarta, Singapore, Tokyo...)   │
  │                                                  │
  │  1. Traffic masuk ke Google PoP terdekat          │
  │  2. Cloud Armor evaluasi rules:                   │
  │     ┌──────────────────────────────────────────┐ │
  │     │ Rule 1 (priority 1000): Block IP range?  │ │
  │     │ Rule 2 (priority 2000): WAF SQLi check?  │ │
  │     │ Rule 3 (priority 3000): Geo block?       │ │
  │     │ ...                                      │ │
  │     │ Default (priority MAX): Allow/Deny all   │ │
  │     └──────────────────────────────────────────┘ │
  │                                                  │
  │  3. Jika MATCH → ACTION (allow/deny/throttle)    │
  └──────────┬─────────────────┬─────────────────────┘
             │ ALLOW            │ DENY
             ▼                  ▼
  ┌──────────────────┐  ┌──────────────────┐
  │  Load Balancer    │  │  403 Forbidden   │
  │  → Backend        │  │  (blocked at     │
  │  → Application    │  │   Google edge)   │
  └──────────────────┘  └──────────────────┘
```

### Kenapa di Edge?

| Aspek | Di Edge (Cloud Armor) | Di Backend (firewall biasa) |
|-------|----------------------|---------------------------|
| **Kapan block?** | Sebelum masuk VPC | Setelah traffic sampai di server |
| **Impact ke server** | Traffic buruk tidak pernah sampai ke server | Server tetap terima traffic, baru drop |
| **DDoS protection** | Leveraging Google global capacity | Server bisa overwhelmed |
| **Latency** | Minimal — block di PoP terdekat | Higher — traffic sudah travel ke server |
| **Bandwidth cost** | Tidak ada ingress charge untuk blocked traffic | Tetap ada ingress charge |

---

## Arsitektur Cloud Armor di GCP

```
                    Internet
                       │
                       ▼
              ┌──────────────────┐
              │  Google Edge PoP  │
              │                  │
              │  Cloud Armor     │  ◄── Security Policy + Rules
              │  (WAF + DDoS)   │
              └────────┬─────────┘
                       │ (traffic yang lolos)
                       ▼
              ┌──────────────────┐
              │  Cloud Load       │
              │  Balancer         │
              │  (HTTP/S, TCP,   │
              │   Network)       │
              └────────┬─────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Backend  │ │ Backend  │ │ Backend  │
  │ Service 1│ │ Service 2│ │ Service 3│
  │ (VMs)    │ │ (GKE)    │ │ (NEG)    │
  └──────────┘ └──────────┘ └──────────┘
```

**Penting:** Cloud Armor di-**attach ke backend service** Load Balancer, bukan ke VM langsung.

---

## Security Policy Types

Cloud Armor memiliki beberapa tipe policy untuk melindungi resource yang berbeda:

```
Console: Cloud Armor → Create policy → Policy type

  ┌──────────────────────────────────────────────────────────────┐
  │  Policy type                                                  │
  │                                                              │
  │  ● Backend security policy                                   │
  │  ○ Edge security policy                                      │
  │  ○ Network edge security policy                              │
  └──────────────────────────────────────────────────────────────┘
```

### Perbandingan Policy Types

| Policy Type | Resource yang Dilindungi | Layer | Fitur |
|-------------|------------------------|-------|-------|
| **Backend security policy** | External Application LB, Regional Internal Application LB, Proxy Network LB | Layer 3–7 | **Paling lengkap**: IP, geo, WAF, rate limiting, adaptive protection, bot management |
| **Edge security policy** | Google Cloud CDN, Cloud Storage bucket (via CDN) | Layer 3–7 | Filtering di edge — sebelum CDN cache serve. IP, geo, custom expression |
| **Network edge security policy** | External passthrough Network LB, Protocol forwarding, VM dengan public IP | Layer 3–4 | Advanced network DDoS protection (Enterprise only), byte offset filtering |

### Kapan Pakai Tipe Mana?

```
Decision Tree:

  Apa yang mau dilindungi?
       │
       ├── Web app di belakang HTTP(S) Load Balancer?
       │   └── ✅ Backend security policy (paling umum)
       │
       ├── Static content di CDN / Cloud Storage?
       │   └── ✅ Edge security policy
       │
       └── TCP/UDP service di Network Load Balancer?
           └── ✅ Network edge security policy
```

| Kelebihan Backend Policy | Kekurangan Backend Policy |
|-------------------------|--------------------------|
| Fitur paling lengkap (WAF, rate limit, bot) | Hanya untuk Application LB / Proxy Network LB |
| Support semua match conditions | Butuh Load Balancer (tidak langsung ke VM) |
| Adaptive Protection available | — |

| Kelebihan Edge Policy | Kekurangan Edge Policy |
|-----------------------|------------------------|
| Block traffic sebelum CDN serve | Fitur lebih terbatas dari backend policy |
| Protect cached content | Hanya untuk CDN-enabled backends |

---

## Skenario: Dengan dan Tanpa Cloud Armor

### Tanpa Cloud Armor

```
Skenario: DDoS attack ke web app

  Attacker: 100,000 requests/sec dari botnet
       │
       ▼
  Load Balancer: forward SEMUA traffic ke backend
       │
       ▼
  Backend VMs: overwhelmed!
  ┌──────────────────────────────────┐
  │  CPU: 100%  │  Memory: 95%       │
  │  Response: timeout                │
  │  Real users: TIDAK BISA AKSES    │
  └──────────────────────────────────┘

  Efek:
  ✗ Downtime untuk semua user
  ✗ Biaya bandwidth/compute melonjak
  ✗ Manual intervention diperlukan
  ✗ Recovery time bisa berjam-jam
```

### Dengan Cloud Armor

```
Skenario: DDoS attack ke web app

  Attacker: 100,000 requests/sec dari botnet
       │
       ▼
  Google Edge PoP:
  ┌──────────────────────────────────┐
  │  Cloud Armor:                     │
  │  Rule 1: Rate limit > 1000 req/s │
  │  → 99,000 requests BLOCKED       │
  │                                  │
  │  Adaptive Protection:             │
  │  ML detect anomaly → auto-rule    │
  │  → attack signature blocked       │
  └──────────┬───────────────────────┘
             │ (1,000 normal req/s)
             ▼
  Backend VMs: normal operation
  ┌──────────────────────────────────┐
  │  CPU: 30%  │  Memory: 40%        │
  │  Response: 200ms (normal)         │
  │  Real users: LANCAR ✅            │
  └──────────────────────────────────┘

  Efek:
  ✓ Zero downtime
  ✓ Attack di-block di edge (free bandwidth)
  ✓ Auto-detection dengan ML
  ✓ Logging & visibility penuh
```

---

## Cloud Armor vs Alternatif Lain

| Aspek | Cloud Armor | Cloudflare WAF | AWS WAF | VPC Firewall |
|-------|-------------|---------------|---------|-------------|
| **Tipe** | Cloud WAF + DDoS | Cloud WAF + DDoS + CDN | Cloud WAF | Network firewall |
| **Layer** | L3–L7 | L3–L7 | L7 | L3–L4 |
| **Di mana?** | Google Edge | Cloudflare Edge | AWS Edge | VPC level |
| **DDoS** | Built-in (Standard) + ML (Enterprise) | Built-in always-on | Basic (Shield Standard) | Tidak ada |
| **WAF rules** | OWASP CRS, custom CEL | OWASP, managed rules | AWS managed + custom | Tidak ada WAF |
| **Rate limiting** | Ya (throttle + ban) | Ya | Ya | Tidak ada |
| **Bot management** | reCAPTCHA integration | Bot Fight Mode | Bot Control | Tidak ada |
| **Native GCP** | **Ya — native** | Third-party | AWS native | GCP native |
| **Pricing** | $200/mo (Standard) | Free tier available | Pay per rule | Free (included) |

### Kapan Cloud Armor vs VPC Firewall?

```
VPC Firewall:
  → Layer 3/4 only (IP, port, protocol)
  → Tidak bisa inspect HTTP content
  → Gratis
  → Cocok: basic network segmentation

Cloud Armor:
  → Layer 3–7 (IP, geo, HTTP header, body, URL, WAF)
  → Inspect HTTP content (SQL injection, XSS, dll)
  → Berbayar
  → Cocok: protect web apps dari sophisticated attacks
```

**Rekomendasi:** Gunakan **keduanya** — VPC Firewall untuk network segmentation dasar + Cloud Armor untuk L7 WAF protection.

---

## Resource yang Bisa Dilindungi

| Resource | Policy Type | Caranya |
|----------|------------|---------|
| **External HTTP(S) Load Balancer** (global) | Backend security policy | Attach ke backend service |
| **Regional External Application LB** | Backend security policy | Attach ke backend service |
| **Regional Internal Application LB** | Backend security policy | Attach ke backend service |
| **External Proxy Network LB** (TCP/SSL) | Backend security policy | Attach ke backend service |
| **Cloud CDN** | Edge security policy | Attach ke backend service/bucket |
| **External Passthrough Network LB** | Network edge security policy | Attach via network edge security service |
| **VM dengan public IP** | Network edge security policy | Attach via network edge security service |
| **Protocol Forwarding** | Network edge security policy | Attach via network edge security service |

---

## Ringkasan Konsep

```
Cloud Armor:
  → WAF + DDoS protection di Google Edge Network
  → Attach ke Load Balancer backend service
  → Rules evaluated by priority (lowest number = highest priority)
  → First matching rule → action (allow/deny/throttle/redirect)

Policy Types:
  Backend security policy    → HTTP(S) LB (paling umum & lengkap)
  Edge security policy       → CDN / Cloud Storage
  Network edge security      → Network LB / VM public IP

Tiers:
  Standard  → Pay-as-you-go, basic DDoS, manual rules
  Enterprise → ML adaptive protection, WAF bundled, threat intelligence
```

---

*Dokumen ini berdasarkan fitur Cloud Armor di Google Cloud Console per Maret 2025–2026.*
