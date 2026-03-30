# Preconfigured WAF Rules (OWASP)

Dokumentasi lengkap **preconfigured WAF rules** di Cloud Armor — proteksi otomatis terhadap **OWASP Top 10** vulnerabilities (SQL Injection, XSS, dll) tanpa perlu tulis regex sendiri.

**Console:** Cloud Armor → (policy) → + ADD RULE → Advanced mode

---

## Apa itu Preconfigured WAF Rules?

Cloud Armor menyediakan **rules yang sudah di-pre-configure** berdasarkan **OWASP ModSecurity Core Rule Set (CRS)**. Rules ini mendeteksi common web attack patterns secara otomatis.

```
Cara kerja WAF rule:

  Request masuk:
  POST /api/login
  Body: {"username": "admin' OR 1=1 --", "password": "..."}
       │
       ▼
  Cloud Armor WAF (sqli-v33-stable):
  ┌────────────────────────────────────────────┐
  │  Pattern match: "' OR 1=1 --"              │
  │  → SQL Injection detected!                  │
  │  → Sensitivity level 1 match               │
  │  → Action: DENY 403                         │
  └────────────────────────────────────────────┘
       │
       ▼
  403 Forbidden (request di-block di edge)
  Backend TIDAK PERNAH menerima request ini ✅
```

---

## Cara Menggunakan di Console

### Add Rule dengan WAF Expression

```
Console: Cloud Armor → (policy) → + ADD RULE

  Mode: ○ Advanced mode (custom rule expression)

  Rule expression *:
  ┌──────────────────────────────────────────────────────────────┐
  │ evaluatePreconfiguredWaf('sqli-v33-stable',                  │
  │   {'sensitivity': 1})                                        │
  └──────────────────────────────────────────────────────────────┘

  Action: Deny
  Deny status: 403 (Forbidden)
  Priority: 3000
```

### Syntax

```
evaluatePreconfiguredWaf('RULE_SET_NAME', {'sensitivity': LEVEL})
```

| Parameter | Fungsi |
|-----------|--------|
| `RULE_SET_NAME` | Nama rule set (misal: `sqli-v33-stable`) |
| `sensitivity` | Level sensitivitas: 0–4 (0 = off, 4 = most aggressive) |

---

## Daftar Semua Preconfigured WAF Rules

### CRS 3.3 (Recommended)

| Rule Set Name | Attack Type | OWASP | Contoh Pattern yang Dideteksi |
|--------------|-------------|-------|------------------------------|
| **`sqli-v33-stable`** | SQL Injection | A03:2021 | `' OR 1=1 --`, `UNION SELECT`, `SLEEP()`, `BENCHMARK()` |
| **`xss-v33-stable`** | Cross-Site Scripting | A03:2021 | `<script>alert(1)</script>`, `onerror=`, `javascript:` |
| **`lfi-v33-stable`** | Local File Inclusion | A01:2021 | `../../etc/passwd`, `..\\windows\\`, `file://` |
| **`rfi-v33-stable`** | Remote File Inclusion | A01:2021 | `http://evil.com/shell.php`, `ftp://`, external URL inject |
| **`rce-v33-stable`** | Remote Code Execution | A03:2021 | `; ls -la`, `| cat /etc/passwd`, `` `whoami` ``, `$()` |
| **`methodenforcement-v33-stable`** | Method Enforcement | — | Block unusual HTTP methods (TRACE, CONNECT, dll) |
| **`scannerdetection-v33-stable`** | Scanner Detection | A09:2021 | Detect known scanner user-agents (Nmap, Nikto, sqlmap) |
| **`protocolattack-v33-stable`** | Protocol Attack | — | HTTP request smuggling, header injection |
| **`php-v33-stable`** | PHP Injection | A03:2021 | `eval()`, `exec()`, `system()`, `<?php` in request |
| **`sessionfixation-v33-stable`** | Session Fixation | A07:2021 | Cookie manipulation, session ID injection |
| **`java-v33-stable`** | Java Attack | A08:2021 | Log4Shell patterns, Java deserialization, JNDI injection |
| **`nodejs-v33-stable`** | Node.js Attack | A08:2021 | Prototype pollution, `__proto__`, `constructor` |

### Canary vs Stable

Setiap rule set punya 2 variant:

| Variant | Suffix | Fungsi |
|---------|--------|--------|
| **Stable** | `-stable` | Production-ready, well-tested |
| **Canary** | `-canary` | Newer signatures, mungkin lebih banyak false positive |

**Rekomendasi:** Gunakan `-stable` untuk production, `-canary` untuk testing.

---

## Sensitivity Levels

Sensitivity menentukan seberapa **agresif** detection:

```
Sensitivity 0: OFF — tidak ada rule yang aktif
Sensitivity 1: ████░░░░ — high-confidence signatures saja
Sensitivity 2: ██████░░ — + medium-confidence signatures
Sensitivity 3: ████████ — + lower-confidence (lebih banyak false positive)
Sensitivity 4: ████████████ — ALL signatures (paling agresif, paling banyak FP)
```

| Level | Confidence | False Positive Risk | Cocok Untuk |
|-------|-----------|--------------------|----|
| **0** | Off | None | Disable rule set |
| **1** | Tinggi | **Rendah** | **Production recommended** — hanya high-confidence patterns |
| **2** | Tinggi + Medium | Moderate | Production yang butuh lebih strict |
| **3** | Tinggi + Medium + Low | **Tinggi** | Staging/testing atau high-security apps |
| **4** | Semua | **Sangat tinggi** | Testing only — banyak false positive |

### Contoh: Sensitivity Impact pada SQL Injection

```
Sensitivity 1 — mendeteksi:
  ✅ ' OR 1=1 --
  ✅ UNION SELECT * FROM users
  ✅ ; DROP TABLE users
  ❌ CONCAT(0x,...)      → tidak terdeteksi (low confidence)

Sensitivity 3 — mendeteksi:
  ✅ ' OR 1=1 --
  ✅ UNION SELECT * FROM users
  ✅ ; DROP TABLE users
  ✅ CONCAT(0x,...)      → terdeteksi!
  ⚠️ Tapi juga bisa false positive pada query normal
     yang kebetulan mengandung kata "SELECT" atau "UNION"
```

| Kelebihan Low Sensitivity (1) | Kekurangan Low Sensitivity (1) |
|-------------------------------|-------------------------------|
| Minim false positive | Bisa miss sophisticated attacks |
| Production-safe | — |

| Kelebihan High Sensitivity (3–4) | Kekurangan High Sensitivity (3–4) |
|----------------------------------|-----------------------------------|
| Deteksi lebih banyak patterns | Banyak false positive |
| Cocok untuk high-security | Butuh tuning / exclusion |

---

## Tuning WAF Rules

### Opt-out Specific Signatures

Jika rule set terlalu agresif (false positive), bisa **exclude signature tertentu**:

```
evaluatePreconfiguredWaf('sqli-v33-stable',
  {'sensitivity': 2,
   'opt_out_rule_ids': ['owasp-crs-v030301-id942100-sqli',
                        'owasp-crs-v030301-id942120-sqli']})
```

| Parameter | Fungsi |
|-----------|--------|
| `opt_out_rule_ids` | List signature IDs yang di-skip (tidak di-evaluate) |

### Opt-in Specific Signatures

Atau hanya aktifkan **signature tertentu** saja:

```
evaluatePreconfiguredWaf('sqli-v33-stable',
  {'opt_in_rule_ids': ['owasp-crs-v030301-id942100-sqli']})
```

### Kapan Tuning Diperlukan?

```
Flow tuning:

  1. Deploy WAF rule di PREVIEW MODE
     │
     ▼
  2. Monitor logs selama 1–7 hari
     │
     ├── Ada false positive?
     │   ├── Ya → identifikasi signature ID dari log
     │   │       → tambahkan ke opt_out_rule_ids
     │   │       → re-deploy di preview mode
     │   │       → ulangi monitoring
     │   │
     │   └── Tidak → lanjut ke step 3
     │
     ▼
  3. Disable preview mode → rule aktif di production ✅
```

---

## Contoh: Setup WAF Rules Lengkap

### Production Web App — OWASP Protection

```
Policy: webapp-prod-waf

Rule 1 — SQL Injection:
  Expression: evaluatePreconfiguredWaf('sqli-v33-stable', {'sensitivity': 1})
  Action:     Deny 403
  Priority:   3000

Rule 2 — Cross-Site Scripting:
  Expression: evaluatePreconfiguredWaf('xss-v33-stable', {'sensitivity': 1})
  Action:     Deny 403
  Priority:   3100

Rule 3 — Local File Inclusion:
  Expression: evaluatePreconfiguredWaf('lfi-v33-stable', {'sensitivity': 1})
  Action:     Deny 403
  Priority:   3200

Rule 4 — Remote Code Execution:
  Expression: evaluatePreconfiguredWaf('rce-v33-stable', {'sensitivity': 1})
  Action:     Deny 403
  Priority:   3300

Rule 5 — Scanner Detection:
  Expression: evaluatePreconfiguredWaf('scannerdetection-v33-stable', {'sensitivity': 1})
  Action:     Deny 403
  Priority:   3400

Rule 6 — Protocol Attack:
  Expression: evaluatePreconfiguredWaf('protocolattack-v33-stable', {'sensitivity': 1})
  Action:     Deny 403
  Priority:   3500
```

### Kombinasi WAF + Custom Condition

```
Rule: Block SQLi hanya pada path /api/*

  Expression:
  request.path.matches('/api/.*') &&
    evaluatePreconfiguredWaf('sqli-v33-stable', {'sensitivity': 2})

  Action: Deny 403
  Priority: 3000
```

Hanya evaluate SQLi **pada request ke API path**, bukan semua request.

---

## WAF Rules vs Custom Rules

| Aspek | Preconfigured WAF Rules | Custom CEL Rules |
|-------|------------------------|-----------------|
| **Siapa buat?** | Google (OWASP CRS) | Kamu sendiri |
| **Maintenance** | Google update otomatis | Kamu maintain sendiri |
| **Coverage** | OWASP Top 10 | Anything via CEL |
| **False positive handling** | Tuning via sensitivity + opt-out | Full control |
| **Cocok untuk** | Common web attacks | Business-specific logic |

**Rekomendasi:** Gunakan **keduanya** — WAF rules untuk OWASP coverage + custom rules untuk business-specific filtering.

---

*Dokumen ini berdasarkan fitur Cloud Armor di Google Cloud Console per Maret 2025–2026.*
