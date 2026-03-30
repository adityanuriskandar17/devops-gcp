# Rules & Conditions

Dokumentasi lengkap cara menambah **rules**, mengatur **priority**, **match conditions**, dan **actions** di Cloud Armor Console.

**Console:** Cloud Armor → (policy) → **+ ADD RULE**

---

## Cara Kerja Rules

Rules di-evaluasi berdasarkan **priority** — dari angka **terkecil** (prioritas tertinggi) ke angka **terbesar** (prioritas terendah). Rule pertama yang match menentukan action.

```
Traffic masuk → Evaluasi rules by priority:

  Priority 1000: Block IP 1.2.3.4?        → SKIP (tidak match)
  Priority 2000: Block SQLi pattern?       → MATCH! → DENY 403
                                              (stop evaluasi)
  Priority 3000: Rate limit /api/*?        → (tidak dievaluasi)
  Priority 2147483647: Default rule        → (tidak dievaluasi)

  → Response: 403 Forbidden
```

**Penting:** Begitu rule match, evaluasi **berhenti**. Rules setelahnya tidak diperiksa.

---

## Console: Add Rule Form

```
Console: Cloud Armor → (policy) → + ADD RULE

┌───────────────────────────────────────────────────────────────────────┐
│  Add a rule                                                           │
│                                                                       │
│  Description                                                          │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Block known malicious IPs                                    │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  Mode                                                                 │
│  ● Basic mode (IP addresses / IP address ranges only)                │
│  ○ Advanced mode (custom rule expression)                             │
│                                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  Match (tergantung mode)                                              │
│  ...                                                                  │
│                                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  Action                                                               │
│  ┌──────────────────────────────────────────────┐                    │
│  │ Deny                                        ▼│                    │
│  └──────────────────────────────────────────────┘                    │
│                                                                       │
│  Deny status                                                          │
│  ┌──────────────────────────────────────────────┐                    │
│  │ 403 (Forbidden)                             ▼│                    │
│  └──────────────────────────────────────────────┘                    │
│                                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  Priority *                                                           │
│  ┌──────────────┐                                                    │
│  │ 1000          │                                                    │
│  └──────────────┘                                                    │
│                                                                       │
│  ☐ Enable rule in preview mode                                       │
│                                                                       │
│                                            [ADD]  [CANCEL]            │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Mode

### Basic Mode

```
  Mode
  ● Basic mode (IP addresses / IP address ranges only)

  Match:
  ┌──────────────────────────────────────────────────────┐
  │ Enter IP address or IP address range                  │
  │                                                      │
  │ 192.168.1.0/24                                       │
  │ 10.0.0.1                                             │
  │ 2001:db8::/32                                        │
  └──────────────────────────────────────────────────────┘
```

Basic mode hanya bisa match berdasarkan **IP address** atau **CIDR range**.

| Format | Contoh | Arti |
|--------|--------|------|
| Single IP | `203.0.113.5` | 1 IP spesifik |
| CIDR range | `192.168.1.0/24` | Range 192.168.1.0 – 192.168.1.255 |
| IPv6 | `2001:db8::/32` | IPv6 range |
| Multiple IPs | 1 IP per baris atau koma-separated | Beberapa IP/range |
| Wildcard | `*` | Semua IP (biasanya untuk default rule) |

### Advanced Mode

```
  Mode
  ○ Advanced mode (custom rule expression)

  Match:
  ┌──────────────────────────────────────────────────────┐
  │ Rule expression *                                     │
  │                                                      │
  │ origin.region_code == 'CN'                           │
  │                                                      │
  └──────────────────────────────────────────────────────┘
```

Advanced mode menggunakan **Custom Expression Language (CEL)** — jauh lebih powerful.

---

## Match Conditions (Advanced Mode — CEL)

### Attributes yang Tersedia

| Attribute | Tipe | Contoh | Fungsi |
|-----------|------|--------|--------|
| `origin.ip` | String | `"203.0.113.5"` | IP asal request |
| `origin.region_code` | String | `"ID"`, `"CN"`, `"US"` | Country code ISO 3166-1 alpha-2 |
| `origin.asn` | Integer | `15169` | Autonomous System Number |
| `request.headers` | Map | `request.headers['user-agent']` | HTTP request headers |
| `request.method` | String | `"GET"`, `"POST"` | HTTP method |
| `request.path` | String | `"/api/login"` | URL path |
| `request.query` | String | `"id=1 OR 1=1"` | Query string |
| `request.region_code` | String | `"ID"` | Region based on request origin |

### Operators

| Operator | Arti | Contoh |
|----------|------|--------|
| `==` | Sama dengan | `origin.region_code == 'CN'` |
| `!=` | Tidak sama dengan | `origin.region_code != 'ID'` |
| `&&` | AND | `origin.region_code == 'CN' && request.path.contains('/admin')` |
| `\|\|` | OR | `origin.region_code == 'CN' \|\| origin.region_code == 'RU'` |
| `!` | NOT | `!origin.ip.matches('10.0.0.0/8')` |
| `.contains()` | Contains string | `request.path.contains('/api')` |
| `.matches()` | Regex match | `request.path.matches('/admin.*')` |
| `inIpRange()` | IP dalam CIDR | `inIpRange(origin.ip, '192.168.0.0/16')` |
| `has()` | Header exists | `has(request.headers['x-custom'])` |

### Contoh Expressions

#### Block Berdasarkan Negara (Geo-blocking)

```
origin.region_code == 'CN'
```

Block semua traffic dari China.

```
origin.region_code == 'CN' || origin.region_code == 'RU' || origin.region_code == 'KP'
```

Block traffic dari China, Russia, dan North Korea.

#### Block Berdasarkan IP Range

```
inIpRange(origin.ip, '192.168.1.0/24')
```

Block IP range 192.168.1.0/24.

```
inIpRange(origin.ip, '10.0.0.0/8') || inIpRange(origin.ip, '172.16.0.0/12')
```

Block private IP ranges.

#### Block Berdasarkan Path

```
request.path.matches('/admin.*')
```

Block akses ke semua path yang dimulai dengan `/admin`.

```
request.path.contains('/wp-login') || request.path.contains('/xmlrpc.php')
```

Block WordPress attack vectors.

#### Block Berdasarkan Header

```
has(request.headers['x-bad-bot']) || request.headers['user-agent'].contains('BadBot')
```

Block requests dengan header atau user-agent tertentu.

#### Kombinasi (AND + OR)

```
origin.region_code != 'ID' && request.path.matches('/admin.*')
```

Block akses ke `/admin` dari **luar Indonesia** (hanya Indonesia boleh akses admin).

```
origin.region_code == 'CN' && request.method == 'POST'
```

Block POST requests dari China (misal: spam comment, form abuse).

#### WAF Preconfigured Rules

```
evaluatePreconfiguredWaf('sqli-v33-stable', {'sensitivity': 1})
```

Aktifkan SQL injection detection. Lihat detail di [04-waf-rules.md](04-waf-rules.md).

---

## Actions

```
  Action
  ┌──────────────────────────────────────────────┐
  │ (pilih action)                              ▼│
  └──────────────────────────────────────────────┘

  Pilihan:
  ┌──────────────────────────────────────────────┐
  │ Allow                                         │
  │ Deny                                          │
  │ Throttle                                      │
  │ Rate-based ban                                │
  │ Redirect                                      │
  └──────────────────────────────────────────────┘
```

### Penjelasan Actions

| Action | Fungsi | Field Tambahan |
|--------|--------|---------------|
| **Allow** | Izinkan traffic | — |
| **Deny** | Block traffic dengan HTTP error | Deny status: 403/404/502 |
| **Throttle** | Rate limit — izinkan sampai batas, block sisanya | Rate limit threshold, conform action, exceed action |
| **Rate-based ban** | Ban client yang melebihi threshold untuk durasi tertentu | Rate limit threshold, ban threshold, ban duration |
| **Redirect** | Redirect ke URL lain (misal reCAPTCHA page) | Redirect type, redirect target |

### Action: Deny

```
  Action: Deny

  Deny status
  ┌──────────────────────────────────┐
  │ 403 (Forbidden)                ▼│
  └──────────────────────────────────┘

  Pilihan:
  ┌──────────────────────────────────┐
  │ 403 (Forbidden)                   │
  │ 404 (Not Found)                   │
  │ 502 (Bad Gateway)                 │
  └──────────────────────────────────┘
```

| Status Code | Kapan Digunakan |
|------------|----------------|
| **403** (Forbidden) | Default — jelas bahwa request ditolak |
| **404** (Not Found) | Sembunyikan keberadaan resource dari attacker |
| **502** (Bad Gateway) | Buat attacker berpikir server down |

### Action: Throttle (Rate Limit)

```
  Action: Throttle

  Rate limit threshold
  ┌───────────┐  requests per  ┌──────────┐
  │ 100        │               │ 60 sec  ▼│
  └───────────┘               └──────────┘

  Key type:
  ┌──────────────────────────────────┐
  │ IP                              ▼│
  └──────────────────────────────────┘

  Conform action:   Allow
  Exceed action:    Deny (403/404/502)
```

| Field | Fungsi |
|-------|--------|
| **Rate limit threshold** | Jumlah request maksimal per interval (misal: 100 req / 60 sec) |
| **Key type** | Berdasarkan apa rate dihitung: IP, HTTP Header, X-Forwarded-For, HTTP Cookie, region, TLS fingerprint |
| **Conform action** | Action jika di bawah limit (Allow) |
| **Exceed action** | Action jika melebihi limit (Deny + status code) |

### Action: Rate-based Ban

```
  Action: Rate-based ban

  Rate limit threshold
  ┌───────────┐  requests per  ┌──────────┐
  │ 500        │               │ 120 sec ▼│
  └───────────┘               └──────────┘

  Ban threshold
  ┌───────────┐  requests per  ┌──────────┐
  │ 1000       │               │ 300 sec ▼│
  └───────────┘               └──────────┘

  Ban duration
  ┌──────────┐
  │ 600 sec  │
  └──────────┘
```

| Field | Fungsi |
|-------|--------|
| **Rate limit threshold** | Threshold untuk mulai throttle |
| **Ban threshold** | Jika tetap melebihi → ban total |
| **Ban duration** | Berapa lama banned (detik) |

```
Flow Rate-based Ban:

  Client: 200 req/min → di bawah threshold → ALLOW
  Client: 600 req/min → melebihi rate limit → THROTTLE (excess denied)
  Client terus abuse → melebihi ban threshold → BANNED 600 sec
  Setelah 600 sec → unban → normal lagi
```

### Action: Redirect

```
  Action: Redirect

  Redirect type:
  ● Google reCAPTCHA          ← redirect ke reCAPTCHA challenge
  ○ External 302 redirect     ← redirect ke URL lain

  (Jika reCAPTCHA):
  reCAPTCHA site key:
  ┌──────────────────────────────────────────┐
  │ 6Lc...                                    │
  └──────────────────────────────────────────┘

  (Jika External 302):
  Redirect target:
  ┌──────────────────────────────────────────┐
  │ https://example.com/blocked               │
  └──────────────────────────────────────────┘
```

| Redirect Type | Fungsi | Use Case |
|--------------|--------|----------|
| **Google reCAPTCHA** | Challenge — buktikan human | Bot protection |
| **External 302** | Redirect ke URL tertentu | Custom block page, maintenance page |

---

## Priority

```
  Priority *
  ┌──────────────┐
  │ 1000          │
  └──────────────┘
```

| Range | Rekomendasi | Contoh |
|-------|-------------|--------|
| `0–999` | Emergency / critical rules | Block active attacker IP |
| `1000–1999` | IP whitelist/blacklist | Allow office IP, block known bad |
| `2000–2999` | Geo-based rules | Block negara tertentu |
| `3000–3999` | WAF rules (OWASP) | SQL injection, XSS |
| `4000–4999` | Rate limiting | Throttle, rate-based ban |
| `5000–5999` | Bot management | reCAPTCHA redirect |
| `2147483647` | Default rule (auto-created) | Allow all / Deny all |

**Angka lebih kecil = prioritas lebih tinggi.**

```
Priority example:

  1000: Allow office IP 203.0.113.0/24     ← evaluated first
  2000: Block country CN, RU               ← evaluated second
  3000: WAF SQL injection detection        ← evaluated third
  4000: Rate limit /api/* 100req/min       ← evaluated fourth
  2147483647: Allow all (default)          ← last resort
```

---

## Preview Mode

```
  ☐ Enable rule in preview mode

  ⓘ When preview mode is enabled, requests matching this rule
    will be logged but the action will not be enforced.
```

| Mode | Traffic | Logging | Cocok Untuk |
|------|---------|---------|-------------|
| **Normal** | Rule action diterapkan (block/allow) | Ya | Production active protection |
| **Preview** | Rule **TIDAK** diterapkan, hanya logging | Ya | Testing rule baru sebelum enforce |

**Best practice:** Selalu test rule baru di **preview mode** dulu → cek logs → jika tidak ada false positive → disable preview.

---

## Contoh Rules Lengkap

### Skenario: Production Web App

```
Policy: webapp-prod-waf
Default: Allow

Rules:
┌──────────┬──────────────────────────────────┬───────────┬─────────┐
│ Priority │ Description                       │ Match     │ Action  │
├──────────┼──────────────────────────────────┼───────────┼─────────┤
│ 100      │ Allow office IP                   │ Basic:    │ Allow   │
│          │                                   │ 203.0.113 │         │
│          │                                   │ .0/24     │         │
├──────────┼──────────────────────────────────┼───────────┼─────────┤
│ 500      │ Block active attacker             │ Basic:    │ Deny    │
│          │                                   │ 198.51.   │ 403     │
│          │                                   │ 100.5     │         │
├──────────┼──────────────────────────────────┼───────────┼─────────┤
│ 2000     │ Block high-risk countries         │ Advanced: │ Deny    │
│          │                                   │ origin.   │ 403     │
│          │                                   │ region_   │         │
│          │                                   │ code==    │         │
│          │                                   │ 'CN'||... │         │
├──────────┼──────────────────────────────────┼───────────┼─────────┤
│ 3000     │ WAF: SQL Injection               │ Advanced: │ Deny    │
│          │                                   │ evaluate  │ 403     │
│          │                                   │ Preconfig │         │
│          │                                   │ uredWaf   │         │
│          │                                   │ ('sqli-   │         │
│          │                                   │ v33-...'  │         │
├──────────┼──────────────────────────────────┼───────────┼─────────┤
│ 3100     │ WAF: XSS                         │ Advanced: │ Deny    │
│          │                                   │ evaluate  │ 403     │
│          │                                   │ Preconfig │         │
│          │                                   │ uredWaf   │         │
│          │                                   │ ('xss-    │         │
│          │                                   │ v33-...'  │         │
├──────────┼──────────────────────────────────┼───────────┼─────────┤
│ 4000     │ Rate limit /api/*                │ Advanced: │ Throttle│
│          │                                   │ request.  │ 100/60s │
│          │                                   │ path.     │         │
│          │                                   │ matches   │         │
│          │                                   │ ('/api.*')│         │
├──────────┼──────────────────────────────────┼───────────┼─────────┤
│ 2147...  │ Default rule                      │ *         │ Allow   │
└──────────┴──────────────────────────────────┴───────────┴─────────┘
```

---

*Dokumen ini berdasarkan fitur Cloud Armor di Google Cloud Console per Maret 2025–2026.*
