# Synthetic Monitoring

Dokumentasi lengkap **Synthetic Monitoring** di Google Cloud Monitoring — pengujian proaktif terhadap endpoint, user journey, dan broken links menggunakan **Cloud Function** berbasis script.

**Console:** Monitoring → **Synthetic monitoring**

**Dokumentasi resmi:**
- [Synthetic monitoring overview](https://cloud.google.com/monitoring/synthetic-monitors)
- [Create synthetic monitors](https://cloud.google.com/monitoring/synthetic-monitors/create)

---

## Apa itu Synthetic Monitoring?

Synthetic Monitoring adalah fitur di Cloud Monitoring yang memungkinkan **pengujian proaktif** terhadap aplikasi/endpoint menggunakan **script custom** yang berjalan di **Cloud Run functions** (rebrand 2024 dari Cloud Functions 2nd gen). Berbeda dengan Uptime Checks yang hanya cek "apakah endpoint hidup?", Synthetic Monitoring bisa **menjalankan skenario lengkap** seperti login, klik button, cek API chain, dsb.

```
Perbandingan: Uptime Checks vs Synthetic Monitoring

  Uptime Checks:                        Synthetic Monitoring:
  ┌────────────────────┐                ┌────────────────────────────┐
  │  Probe → GET /health │               │  Cloud Function (script):  │
  │  → 200 OK? → UP ✅  │               │                            │
  │  → timeout? → DOWN ❌│               │  1. GET /login             │
  │                      │               │  2. POST /auth (username)  │
  │  Sederhana:          │               │  3. Verify token           │
  │  Cek 1 endpoint saja │               │  4. GET /dashboard         │
  └────────────────────┘                │  5. Assert status + body   │
                                        │                            │
                                        │  → Semua pass? → OK ✅    │
                                        │  → Step gagal? → FAIL ❌  │
                                        └────────────────────────────┘
```

---

## Synthetic Monitoring vs Uptime Checks

| Aspek | Uptime Checks | Synthetic Monitoring |
|-------|--------------|---------------------|
| **Cara kerja** | Probe HTTP/HTTPS/TCP sederhana dari Google locations | Script Cloud Function yang bisa melakukan multi-step |
| **Kompleksitas** | Simple: cek 1 endpoint, 1 response | Complex: multi-request, assertions, user journey |
| **Script custom** | Tidak — hanya konfigurasi via UI | Ya — tulis code (Node.js / Mocha) |
| **Multi-step** | Tidak — hanya 1 request | Ya — bisa chained requests (login → dashboard → API) |
| **Content validation** | Substring match sederhana | Full assertion (regex, JSON parsing, value check) |
| **Protocol** | HTTP, HTTPS, TCP | Apapun yang bisa dilakukan di Node.js (HTTP, gRPC, WebSocket) |
| **Broken link check** | Tidak | Ya — built-in broken link checker |
| **Pricing** | 10 gratis per project | Tergantung Cloud Function executions |
| **Setup** | UI only (tanpa coding) | Perlu coding / template |
| **Rekomendasi** | Monitoring availability dasar | Monitoring user journey & API complex |

---

## Tipe Synthetic Monitors

Di Console, saat membuat Synthetic Check, ada **3 tipe** yang bisa dipilih di sidebar kiri:

```
Console: Monitoring → Synthetic monitoring → [+ CREATE SYNTHETIC MONITOR]

┌───────────────────────────────────────────────────────────────────────┐
│  ← Create Synthetic Check                                             │
│                                                                       │
│  To create a synthetic monitor, select from a predefined template     │
│  or script your own.                                                  │
│                                                                       │
│  ┌────────────────────────────┐   ┌───────────────────────────────┐  │
│  │                            │   │                               │  │
│  │  ▶ Custom synthetic monitor│   │  Name *                       │  │
│  │    Create from your custom │   │  ┌───────────────────────┐    │  │
│  │    script                  │   │  │ fc-syntetic-1         │    │  │
│  │                            │   │  └───────────────────────┘    │  │
│  │  TEMPLATES                 │   │                               │  │
│  │                            │   │  Response Timeout *            │  │
│  │  ⚙ Mocha synthetic monitor│   │  ┌───────────────────┐ seconds│  │
│  │    Create from your custom │   │  │ 30                │        │  │
│  │    mocha suite             │   │  └───────────────────┘        │  │
│  │                            │   │                               │  │
│  │  🔗 Broken link checker    │   │  Check Frequency              │  │
│  │    Scan your website for   │   │  ┌───────────────────┐     ▼ │  │
│  │    broken links            │   │  │ 1 minute          │        │  │
│  │                            │   │  └───────────────────┘        │  │
│  │                            │   │                               │  │
│  │                            │   │  User labels                  │  │
│  │                            │   │  [+ ADD LABEL]                │  │
│  │                            │   │                               │  │
│  │                            │   │  Cloud function ⓘ             │  │
│  │                            │   │  [🔲 CREATE FUNCTION]         │  │
│  │                            │   │                               │  │
│  │                            │   │  Alerts and notifications ⓘ   │  │
│  │                            │   │  🔵 Create an alert            │  │
│  │                            │   │                               │  │
│  │                            │   │  Alert Name *                  │  │
│  │                            │   │  ┌───────────────────────┐ ⓘ │  │
│  │                            │   │  │ fc-syntetic-1         │    │  │
│  │                            │   │  │ synthetic failure     │    │  │
│  │                            │   │  └───────────────────────┘    │  │
│  │                            │   │                               │  │
│  │                            │   │  Alert Duration                │  │
│  │                            │   │  ┌───────────────────┐  ▼ ⓘ │  │
│  │                            │   │  │ 1 minute          │        │  │
│  │                            │   │  └───────────────────┘        │  │
│  │                            │   │                               │  │
│  │                            │   │  Notification Channels         │  │
│  │                            │   │  ┌───────────────────────┐  ▼│  │
│  │                            │   │  │ (pilih channel)       │    │  │
│  │                            │   │  └───────────────────────┘    │  │
│  │                            │   │                               │  │
│  └────────────────────────────┘   └───────────────────────────────┘  │
│                                                                       │
│                                              [CREATE]                 │
└───────────────────────────────────────────────────────────────────────┘
```

### Penjelasan Sidebar Kiri

| Item | Label di Console | Deskripsi |
|------|-----------------|-----------|
| **Custom synthetic monitor** | "Create from your custom script" | Tulis script sendiri dari nol — paling flexible |
| **Mocha synthetic monitor** (TEMPLATES) | "Create from your custom mocha suite" | Mulai dari template Mocha yang siap pakai |
| **Broken link checker** (TEMPLATES) | "Scan your website for broken links" | Otomatis crawl halaman, cek semua link — tanpa coding |

### Perbandingan Tipe

| Tipe | Apa yang Dilakukan | Skill yang Dibutuhkan | Cocok Untuk |
|------|-------------------|----------------------|-------------|
| **Custom synthetic monitor** | Tulis script custom di Cloud Function | JavaScript/Node.js | API testing complex, custom user journey |
| **Mocha synthetic monitor** | Mulai dari template Mocha, modifikasi | JavaScript dasar | Quick start untuk API health check |
| **Broken link checker** | Crawl halaman web, cek semua link (href) | Tidak perlu coding (UI only) | Website/docs — pastikan tidak ada dead links |

---

## 1. Custom Synthetic Monitor — Detail

### Apa itu?

Menulis **script custom** yang di-deploy sebagai **Cloud Run functions**. Cloud Monitoring akan menjalankan function ini secara periodik dan melaporkan hasilnya.

### Console Form: Create Synthetic Check

Saat memilih **Custom synthetic monitor** di sidebar kiri, form kanan menampilkan field berikut:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Name *                                                         │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ fc-syntetic-1                                        │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  Response Timeout *                                              │
│  ┌──────────────────────────────────────────────┐  seconds      │
│  │ 30                                            │               │
│  └──────────────────────────────────────────────┘               │
│                                                                 │
│  Check Frequency                                                 │
│  ┌──────────────────────────────────────────────┐            ▼  │
│  │ 1 minute                                      │               │
│  └──────────────────────────────────────────────┘               │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  User labels                                                     │
│  [+ ADD LABEL]                                                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Cloud function ⓘ                                               │
│  ┌────────────────────┐                                         │
│  │ 🔲 CREATE FUNCTION │   ← klik untuk buat/pilih Cloud Function│
│  └────────────────────┘                                         │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Alerts and notifications ⓘ                                     │
│  🔵 Create an alert                    ← toggle ON/OFF          │
│                                                                 │
│  Alert Name *                                                    │
│  ┌─────────────────────────────────────────────────────┐  ⓘ    │
│  │ fc-syntetic-1 synthetic failure                      │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  Alert Duration                                                  │
│  ┌──────────────────────────────────────────────┐  ▼  ⓘ        │
│  │ 1 minute                                      │               │
│  └──────────────────────────────────────────────┘               │
│                                                                 │
│  Notification Channels                                           │
│  ┌──────────────────────────────────────────────┐            ▼  │
│  │ (pilih channel)                               │               │
│  └──────────────────────────────────────────────┘               │
│                                                                 │
│                                               [CREATE]          │
└─────────────────────────────────────────────────────────────────┘
```

### Penjelasan Setiap Field

| Field | Fungsi | Pilihan / Contoh |
|-------|--------|-----------------|
| **Name** | Nama synthetic check (muncul di dashboard & alert) | `fc-syntetic-1`, `api-health-check` |
| **Response Timeout** | Batas waktu (detik) sebelum eksekusi dianggap gagal | `30` seconds (default), bisa isi angka custom |
| **Check Frequency** | Seberapa sering Cloud Function dijalankan | 1 min, 5 min, 10 min, 15 min |
| **User labels** | Custom key-value labels untuk organisasi & filtering | `environment=production`, `team=backend` |
| **Cloud function** | Cloud Function yang menjalankan script test | Klik CREATE FUNCTION untuk buat baru |
| **Create an alert** | Toggle: otomatis buat alert policy saat check gagal | ON (default recommended) / OFF |
| **Alert Name** | Nama alert policy — auto-generated dari Name | `{name} synthetic failure` |
| **Alert Duration** | Berapa lama gagal berturut-turut sebelum alert fires | 1 min, 5 min, 10 min |
| **Notification Channels** | Channel untuk menerima alert (Slack, Email, dll) | Pilih dari dropdown |

### Detail per Field

#### Name

Nama unik untuk synthetic check. Best practice: gunakan nama deskriptif.

```
Contoh nama yang baik:
  api-health-check-prod
  login-flow-prod
  payment-api-test
  db-connectivity-check

Contoh nama kurang baik:
  test-1
  check
  monitor
```

#### Response Timeout

Batas waktu **dalam detik** untuk seluruh eksekusi Cloud Function.

| Nilai | Kapan Digunakan |
|-------|----------------|
| **10 seconds** | Script simple: 1 HTTP request saja |
| **30 seconds** (default) | Script moderate: 2-3 requests |
| **60 seconds** | Script complex: multi-step flow, login chain |
| **120 seconds** | Script sangat complex dengan dependency external |

Jika timeout tercapai sebelum script selesai → dianggap **FAILED**.

#### Check Frequency

| Frequency | Invocations/bulan | Cocok Untuk |
|-----------|------------------|-------------|
| **1 minute** | ~43,200 | Critical path (login, checkout, API utama) |
| **5 minutes** | ~8,640 | Standard monitoring |
| **10 minutes** | ~4,320 | Non-critical checks |
| **15 minutes** | ~2,880 | Broken link, low priority |

#### User Labels

Sama seperti Policy user labels di Alerting — key-value untuk organisasi.

```
Klik [+ ADD LABEL]:
  ┌────────────────┬─────────────────────┐
  │ Key            │ Value               │
  │ environment    │ production          │
  │ team           │ backend             │
  └────────────────┴─────────────────────┘
```

#### Cloud Function — CREATE FUNCTION

Klik **CREATE FUNCTION** membuka halaman **Create function** — ini adalah wizard standar Cloud Run functions (2nd gen Cloud Functions) yang terintegrasi langsung.

##### Layout Halaman Create Function

```
┌───────────────────────────────────────────────────────────────────────┐
│  Create function                                                   >  │
│                                                                       │
│  ══════════════════════════════════════════════════════════════════    │
│  Basics                                                               │
│  ──────────────────────────────────────────────────────────────────   │
│                                                                       │
│  Function name *                                                      │
│  ┌──────────────────────────────────────────────────────┐  ⓘ        │
│  │ fc-syntetic-1                                         │             │
│  └──────────────────────────────────────────────────────┘             │
│                                                                       │
│  Region *                                                             │
│  ┌──────────────────────────────────────────────────────┐  ▼  ⓘ     │
│  │ asia-southeast2 (Jakarta)                             │             │
│  └──────────────────────────────────────────────────────┘             │
│                                                                       │
│  ══════════════════════════════════════════════════════════════════    │
│  Trigger                                                              │
│  ──────────────────────────────────────────────────────────────────   │
│                                                                       │
│  Trigger type                                                         │
│  ┌──────────────────────────────────────────────────────┐  ▼         │
│  │ HTTPS                                                 │  (disabled)│
│  └──────────────────────────────────────────────────────┘             │
│                                                                       │
│  URL                                                                  │
│  https://asia-southeast2-fc-1-434201.cloudfunctions.net/  📋          │
│  fc-syntetic-1                                                        │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────   │
│  ▸ Runtime, build, connections and security settings              ∨   │
│  ──────────────────────────────────────────────────────────────────   │
│                                                                       │
│  ══════════════════════════════════════════════════════════════════    │
│  Source Code                                                          │
│  ──────────────────────────────────────────────────────────────────   │
│                                                                       │
│  Runtime *                           Entry point *                    │
│  ┌────────────────────┐  ▼  ⓘ      ┌────────────────────┐  ⓘ       │
│  │ nodejs20            │             │ SyntheticFunction   │            │
│  └────────────────────┘             └────────────────────┘            │
│                                                                       │
│  ⚠ An error occurred during fetching available runtimes:              │
│    Cloud Functions API has not been used in project fc-1-434201       │
│    before or it is disabled. Enable it by visiting                     │
│    https://console.developers.google.com/apis/api/                    │
│    cloudfunctions.googleapis.com/overview?project=fc-1-434201         │
│    then retry...                                                      │
│                                                                       │
│  Source code                                                          │
│  ● Inline Editor                                                      │
│                                                                       │
│  ┌──────────┬──────────────┐                                          │
│  │ INDEX.JS │ PACKAGE.JSON │                                          │
│  └──────────┴──────────────┘                                          │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │ // index.js                                                  │     │
│  │ const functions = require('@google-cloud/functions-framework');│    │
│  │ const GcmSynthetics = require('@google-cloud/synthetics-sdk- │     │
│  │                        mocha');                                │     │
│  │                                                              │     │
│  │ const mocha = require('mocha');                               │     │
│  │ const { expect } = require('chai');                           │     │
│  │                                                              │     │
│  │ // Tulis test di sini                                        │     │
│  │ describe('Synthetic Test', function() {                       │     │
│  │   it('should pass', async function() {                        │     │
│  │     const res = await fetch('https://YOUR_URL');              │     │
│  │     expect(res.status).to.equal(200);                         │     │
│  │   });                                                         │     │
│  │ });                                                           │     │
│  │                                                              │     │
│  │ functions.http('SyntheticFunction',                           │     │
│  │   GcmSynthetics.runMochaHandler({                             │     │
│  │     spec: `${__dirname}/mocha_tests.spec.js`                  │     │
│  │   })                                                          │     │
│  │ );                                                            │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                       │
│                                          [DEPLOY]  [CANCEL]           │
└───────────────────────────────────────────────────────────────────────┘
```

##### Section 1: Basics

| Field | Fungsi | Detail |
|-------|--------|--------|
| **Function name** | Nama Cloud Function — harus unik dalam project | Auto-filled dari Name di Synthetic Check (bisa diedit) |
| **Region** | Region tempat function di-deploy | Pilih terdekat ke target monitoring. Contoh: `asia-southeast2 (Jakarta)` |

**Tips Region:** Pilih region yang **sama atau dekat** dengan resource yang dimonitor. Jika VM di `asia-southeast2`, deploy function di region yang sama untuk latensi minimal.

##### Section 2: Trigger

| Field | Nilai | Penjelasan |
|-------|-------|-----------|
| **Trigger type** | `HTTPS` (disabled/locked) | Synthetic monitoring selalu menggunakan **HTTPS trigger** — tidak bisa diganti |
| **URL** | Auto-generated | URL endpoint Cloud Function yang akan di-invoke oleh Monitoring |

**Format URL:**

```
https://{region}-{project-id}.cloudfunctions.net/{function-name}

Contoh:
https://asia-southeast2-fc-1-434201.cloudfunctions.net/fc-syntetic-1
         │                  │                              │
         │                  │                              └─ function name
         │                  └─ project ID
         └─ region
```

URL ini **otomatis** di-generate — tidak perlu konfigurasi manual. Monitoring akan memanggil URL ini setiap `Check Frequency`.

**Catatan:** Tombol 📋 (copy) di sebelah URL memudahkan copy URL untuk testing manual via `curl` atau browser:

```bash
curl https://asia-southeast2-fc-1-434201.cloudfunctions.net/fc-syntetic-1
```

##### Section 3: Runtime, Build, Connections and Security Settings

Section ini **collapsed by default** (klik ∨ untuk expand). Berisi konfigurasi advanced:

```
▸ Runtime, build, connections and security settings            ∨

  Klik expand:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Memory allocated: ┌──────────┐                          │
  │                    │ 256 MB  ▼│                          │
  │                    └──────────┘                          │
  │                                                          │
  │  Timeout: ┌──────────┐  seconds                          │
  │           │ 60        │                                   │
  │           └──────────┘                                   │
  │                                                          │
  │  Maximum instances: ┌──────────┐                         │
  │                     │ 1        │                         │
  │                     └──────────┘                         │
  │                                                          │
  │  Service account: ┌────────────────────────────────┐     │
  │                   │ App Engine default service acc ▼│     │
  │                   └────────────────────────────────┘     │
  │                                                          │
  │  VPC connector: ┌────────────────────────────────┐       │
  │                 │ (none)                        ▼│       │
  │                 └────────────────────────────────┘       │
  │                                                          │
  │  Environment variables:                                   │
  │  ┌──────────────┬──────────────────────────────┐         │
  │  │ Key          │ Value                         │         │
  │  │ API_KEY      │ sk-xxxxxxxxxxxx              │         │
  │  │ TEST_PASSWORD│ ************                 │         │
  │  └──────────────┴──────────────────────────────┘         │
  │  [+ ADD VARIABLE]                                        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

| Setting | Default | Fungsi | Kapan Diubah |
|---------|---------|--------|-------------|
| **Memory allocated** | 256 MB | RAM yang dialokasikan ke function | Naikkan jika script complex / process banyak data |
| **Timeout** | 60 seconds | Batas waktu eksekusi function | Naikkan jika script multi-step yang lambat |
| **Maximum instances** | 1 | Jumlah instance concurrent | Biarkan 1 — synthetic check tidak perlu concurrent |
| **Service account** | App Engine default | Identity yang digunakan function | Ganti jika perlu akses ke resource GCP tertentu (Secret Manager, Cloud SQL) |
| **VPC connector** | none | Koneksi ke VPC internal | Aktifkan jika perlu test **private endpoint** (internal IP) |
| **Environment variables** | — | Key-value untuk secrets | Masukkan API key, password, config |

**VPC Connector** — penting untuk monitoring private endpoints:

```
Tanpa VPC Connector:
  Cloud Function → Internet → Public endpoint ✅
  Cloud Function → Internet ✕ Private endpoint ❌ (tidak bisa akses)

Dengan VPC Connector:
  Cloud Function → VPC Connector → Private network → Private endpoint ✅
```

##### Section 4: Source Code

| Field | Nilai | Penjelasan |
|-------|-------|-----------|
| **Runtime** | `nodejs20` | Runtime Node.js — dropdown (nodejs18, nodejs20) |
| **Entry point** | `SyntheticFunction` | Nama function yang akan dipanggil — **jangan diganti** untuk synthetic monitoring |
| **Source code** | Inline Editor | Cara input code — bisa Inline Editor, ZIP upload, atau Cloud Source Repositories |

**Entry point `SyntheticFunction`:** Ini adalah nama function yang sudah di-register di code. Cloud Monitoring akan memanggil function ini. Nama **harus cocok** dengan yang ada di code:

```javascript
// Di code (index.js):
functions.http('SyntheticFunction', ...);
//               ↑ harus sama dengan Entry point di Console
```

**Tabs di Inline Editor:**

```
┌──────────┬──────────────┐
│ INDEX.JS │ PACKAGE.JSON │
└──────────┴──────────────┘
```

| Tab | Isi | Fungsi |
|-----|-----|--------|
| **INDEX.JS** | Script test utama (Mocha + Chai + fetch) | Tulis logic test di sini |
| **PACKAGE.JSON** | Dependencies yang dibutuhkan | Definisikan package: `chai`, `node-fetch`, `@google-cloud/synthetics-sdk-mocha`, dll |

**Contoh INDEX.JS:**

```javascript
const functions = require('@google-cloud/functions-framework');
const GcmSynthetics = require('@google-cloud/synthetics-sdk-mocha');

functions.http('SyntheticFunction', GcmSynthetics.runMochaHandler({
  spec: `${__dirname}/mocha_tests.spec.js`
}));
```

**Contoh PACKAGE.JSON:**

```json
{
  "name": "synthetic-check",
  "version": "1.0.0",
  "dependencies": {
    "@google-cloud/functions-framework": "^3.0.0",
    "@google-cloud/synthetics-sdk-mocha": "^0.1.0",
    "chai": "^4.3.0",
    "node-fetch": "^2.6.0",
    "mocha": "^10.0.0"
  }
}
```

##### Warning: Cloud Functions API

```
⚠ An error occurred during fetching available runtimes: Cloud Functions
  API has not been used in project fc-1-434201 before or it is disabled.
  Enable it by visiting https://console.developers.google.com/apis/api/
  cloudfunctions.googleapis.com/overview?project=fc-1-434201 then retry.
  If you enabled this API recently, wait a few minutes for the action
  to propagate to our systems and retry..
```

**Apa artinya:** Cloud Functions API **belum diaktifkan** di project ini. Ini terjadi jika project belum pernah menggunakan Cloud Functions sebelumnya.

**Cara fix:**

```
Step 1: Klik link di warning ATAU buka:
        Console → APIs & Services → Library → search "Cloud Functions API"

Step 2: Klik [ENABLE]

Step 3: Tunggu 1-2 menit (propagasi)

Step 4: Kembali ke Create function → klik retry/refresh

Step 5: Runtime dropdown akan berfungsi normal
```

**APIs yang perlu diaktifkan untuk Synthetic Monitoring:**

| API | Fungsi | Wajib? |
|-----|--------|--------|
| **Cloud Functions API** | Menjalankan Cloud Function | Ya |
| **Cloud Build API** | Build & deploy function | Ya (auto-enabled saat deploy) |
| **Cloud Monitoring API** | Integrasi monitoring | Ya (biasanya sudah aktif) |
| **Artifact Registry API** | Menyimpan container image function | Ya (auto-enabled) |
| **Secret Manager API** | Akses secrets (jika digunakan) | Opsional |

#### Alerts and Notifications

```
Alerts and notifications ⓘ
🔵 Create an alert                    ← toggle (default: ON)

  Saat ON:
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  Alert Name *                                            │
  │  ┌───────────────────────────────────────────────┐  ⓘ  │
  │  │ fc-syntetic-1 synthetic failure                │      │
  │  └───────────────────────────────────────────────┘      │
  │  (auto-generated: "{name} synthetic failure")            │
  │                                                         │
  │  Alert Duration                                          │
  │  ┌───────────────────────────────────────┐  ▼  ⓘ       │
  │  │ 1 minute                              │              │
  │  └───────────────────────────────────────┘              │
  │                                                         │
  │  Notification Channels                                   │
  │  ┌───────────────────────────────────────────────┐  ▼  │
  │  │ (pilih channel dari dropdown)                  │      │
  │  └───────────────────────────────────────────────┘      │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  Saat OFF:
  (Tidak ada alert — check tetap jalan, hasil terlihat di dashboard,
   tapi tidak ada notifikasi saat gagal)
```

| Field | Fungsi | Default |
|-------|--------|---------|
| **Alert Name** | Nama alert policy yang auto-dibuat | `{name} synthetic failure` (editable) |
| **Alert Duration** | Berapa lama check harus gagal sebelum alert fires | 1 minute |
| **Notification Channels** | Channel notifikasi (Slack, Email, PagerDuty, dll) | (pilih dari daftar yang sudah di-setup) |

**Alert Duration** artinya:

```
Alert Duration: 1 minute

  Check 1 (00:00): FAIL  ← belum alert (baru 1x)
  Check 2 (01:00): FAIL  ← ALERT FIRES! (gagal >= 1 menit)

Alert Duration: 5 minutes

  Check 1 (00:00): FAIL  ← belum
  Check 2 (01:00): FAIL  ← belum
  Check 3 (02:00): FAIL  ← belum
  Check 4 (03:00): FAIL  ← belum
  Check 5 (04:00): FAIL  ← belum
  Check 6 (05:00): FAIL  ← ALERT FIRES! (gagal >= 5 menit)
```

### Contoh Script: API Health Check

```javascript
const { expect } = require('chai');
const fetch = require('node-fetch');

describe('API Health Check', function () {
  this.timeout(10000);

  it('GET /health should return 200 with status ok', async () => {
    const res = await fetch('https://api.myapp.com/health');
    expect(res.status).to.equal(200);

    const body = await res.json();
    expect(body.status).to.equal('ok');
    expect(body.database).to.equal('connected');
  });
});
```

### Contoh Script: Multi-Step Login Flow

```javascript
const { expect } = require('chai');
const fetch = require('node-fetch');

describe('Login Flow', function () {
  this.timeout(30000);
  let authToken;

  it('Step 1: GET /login page should return 200', async () => {
    const res = await fetch('https://myapp.com/login');
    expect(res.status).to.equal(200);
  });

  it('Step 2: POST /auth should return token', async () => {
    const res = await fetch('https://api.myapp.com/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'synthetic-test@myapp.com',
        password: process.env.TEST_PASSWORD
      })
    });
    expect(res.status).to.equal(200);

    const body = await res.json();
    expect(body.token).to.be.a('string');
    authToken = body.token;
  });

  it('Step 3: GET /dashboard with token should return 200', async () => {
    const res = await fetch('https://api.myapp.com/dashboard', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(res.status).to.equal(200);

    const body = await res.json();
    expect(body.user).to.have.property('email');
  });
});
```

### Contoh Script: API Response Time Check

```javascript
const { expect } = require('chai');
const fetch = require('node-fetch');

describe('API Performance', function () {
  this.timeout(15000);

  it('GET /api/products should respond within 2 seconds', async () => {
    const start = Date.now();
    const res = await fetch('https://api.myapp.com/api/products');
    const duration = Date.now() - start;

    expect(res.status).to.equal(200);
    expect(duration).to.be.below(2000);
  });

  it('GET /api/search should respond within 3 seconds', async () => {
    const start = Date.now();
    const res = await fetch('https://api.myapp.com/api/search?q=test');
    const duration = Date.now() - start;

    expect(res.status).to.equal(200);
    expect(duration).to.be.below(3000);
  });
});
```

### Contoh Script: Database Connectivity via API

```javascript
const { expect } = require('chai');
const fetch = require('node-fetch');

describe('Database Health', function () {
  this.timeout(10000);

  it('DB health endpoint should confirm all connections', async () => {
    const res = await fetch('https://api.myapp.com/health/db');
    expect(res.status).to.equal(200);

    const body = await res.json();
    expect(body.postgres).to.equal('connected');
    expect(body.redis).to.equal('connected');
    expect(body.activeConnections).to.be.below(100);
  });
});
```

---

## Halaman Synthetic Monitor Details

Setelah synthetic monitor dibuat dan Cloud Function di-deploy, kamu bisa melihat detail monitor di halaman **Synthetic monitor details**.

**Console:** Monitoring → Synthetic monitoring → klik nama monitor

### Layout Halaman

```
┌───────────────────────────────────────────────────────────────────────┐
│  ← Synthetic monitor details          ✏ EDIT   📋 COPY   🗑 DELETE   │
│                                                                       │
│  ● fc-syntetic-1                                                      │
│                                                                       │
│  ⚠ Cloud Function still deploying for this Synthetic monitor.        │
│    Please wait for it to finish deploying.                            │
│                                                                       │
│  ┌──────────┬──────────┐                                              │
│  │ OVERVIEW │   CODE   │  ← tabs                                     │
│  └──────────┴──────────┘                                              │
│                                                                       │
│  Cloud function: fc-syntetic-1 ↗   Function region: asia-southeast2  │
│  Last deployed: Sep 7, 2024, 7:07:01 AM                              │
│                                                                       │
│  ┌────────────────┐  ┌────────────────────────────────────────────┐  │
│  │ File tree      │  │ Code viewer                                │  │
│  │                │  │                                            │  │
│  │ 📄 index.js    │  │  1│ // Copyright 2023 Google LLC           │  │
│  │ 📄 package.json│  │  2│ //                                     │  │
│  │                │  │ ...│ // (license header)                    │  │
│  │                │  │ 15│ const { instantiateAutoInstrumen...     │  │
│  │                │  │ 16│ // Run instantiateAutoInstrum...        │  │
│  │                │  │ 17│ instantiateAutoInstrumentation();       │  │
│  │                │  │ 18│ const functions = require('@google...   │  │
│  │                │  │ 19│ const axios = require('axios');         │  │
│  │                │  │ 20│ const assert = require('node:assert'); │  │
│  │                │  │ 21│                                        │  │
│  │                │  │ 22│ functions.http('SyntheticFunction',    │  │
│  │                │  │   │  runSyntheticHandler(async ({logger,   │  │
│  │                │  │   │  executionId}) => {                     │  │
│  │                │  │ ...│  // test logic                         │  │
│  │                │  │ 31│ }));                                    │  │
│  └────────────────┘  └────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

### Header — Tombol Aksi

| Tombol | Fungsi |
|--------|--------|
| **✏ EDIT** | Edit konfigurasi monitor (name, frequency, timeout, function, alert) |
| **📋 COPY** | Duplikasi monitor — buat salinan dengan konfigurasi yang sama |
| **🗑 DELETE** | Hapus synthetic monitor (Cloud Function tetap ada, harus hapus terpisah jika tidak dibutuhkan) |

### Status Indicator

```
● fc-syntetic-1       ← status dot

  ● (hijau)  = PASSING — check terakhir berhasil
  ● (merah)  = FAILING — check terakhir gagal
  ● (hitam)  = DEPLOYING — Cloud Function masih di-deploy
  ● (abu)    = UNKNOWN — belum pernah dijalankan
```

### Warning: Cloud Function Still Deploying

```
⚠ Cloud Function still deploying for this Synthetic monitor.
  Please wait for it to finish deploying.
```

**Apa artinya:** Cloud Function sedang dalam proses build & deploy. Ini normal saat baru membuat monitor — proses deploy biasanya memakan waktu **1-3 menit**. Selama deploying:
- Monitor **belum aktif** — belum ada check yang dijalankan
- Tab OVERVIEW belum ada data
- Tunggu sampai warning hilang, lalu check pertama akan otomatis jalan

### Tab OVERVIEW vs CODE

#### Tab OVERVIEW

Menampilkan **execution history**, success rate, dan detail per-run.

```
OVERVIEW tab:

  ┌─────────────────────────────────────────────────────────────┐
  │  Execution History (last 24 hours)                           │
  │                                                             │
  │  ✅✅✅✅✅✅✅✅❌✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅  │
  │                    ↑                                         │
  │               failure                                        │
  │                                                             │
  │  Success rate (24h): 95.8%    Avg duration: 1.2s            │
  │                                                             │
  │  Latest execution:                                           │
  │  ┌─────────────────────────────────────────────────────┐    │
  │  │ ✅ PASS — 1.2s — Mar 23, 2026, 10:05 AM            │    │
  │  │ Logger output:                                       │    │
  │  │   Making an http request using synthetics,           │    │
  │  │   with execution id: abc123                          │    │
  │  └─────────────────────────────────────────────────────┘    │
  │                                                             │
  │  Recent failed execution:                                    │
  │  ┌─────────────────────────────────────────────────────┐    │
  │  │ ❌ FAIL — timeout — Mar 23, 2026, 08:35 AM         │    │
  │  │ Error: AssertionError: expected 503 to equal 200     │    │
  │  └─────────────────────────────────────────────────────┘    │
  └─────────────────────────────────────────────────────────────┘
```

| Informasi | Fungsi |
|-----------|--------|
| **Execution History** | Timeline visual pass/fail tiap eksekusi (24 jam) |
| **Success rate** | Persentase check berhasil dalam periode tertentu |
| **Avg duration** | Rata-rata waktu eksekusi |
| **Latest execution** | Detail run terakhir (status, duration, logger output) |
| **Failed execution** | Detail kegagalan (error message, stack trace) |

#### Tab CODE

Menampilkan **source code** Cloud Function yang digunakan monitor.

```
CODE tab:

  Cloud function: fc-syntetic-1 ↗     ← link ke Cloud Function di Console
  Function region: asia-southeast2
  Last deployed: Sep 7, 2024, 7:07:01 AM

  ┌────────────────┐  ┌────────────────────────────────────────┐
  │ File tree      │  │ Code viewer (read-only)                │
  │                │  │                                        │
  │ 📄 index.js ◀  │  │ (menampilkan isi file yang dipilih)   │
  │ 📄 package.json│  │                                        │
  └────────────────┘  └────────────────────────────────────────┘
```

| Elemen | Fungsi |
|--------|--------|
| **Cloud function** (link) | Klik untuk buka Cloud Function di Console (bisa edit code di sana) |
| **Function region** | Region tempat function di-deploy |
| **Last deployed** | Kapan terakhir function di-deploy |
| **File tree** | Daftar file dalam function (index.js, package.json, dll) |
| **Code viewer** | Read-only viewer — untuk edit, klik EDIT atau buka Cloud Function langsung |

### Info Bar

```
Cloud function: fc-syntetic-1 ↗   Function region: asia-southeast2
Last deployed: Sep 7, 2024, 7:07:01 AM
```

| Field | Fungsi |
|-------|--------|
| **Cloud function** | Nama function + link ke halaman Cloud Function di Console |
| **Function region** | Region deployment (misal: `asia-southeast2`) |
| **Last deployed** | Timestamp deploy terakhir — berguna untuk track kapan code terakhir diubah |

---

### Default Code Template (Sesuai GCP Console)

Saat membuat **Custom synthetic monitor**, Cloud Function otomatis berisi default template berikut. Ini adalah code **yang sebenarnya** ada di Console (bukan Mocha/Chai seperti template Mocha):

#### index.js (Default)

```javascript
// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// ...

const {
  instantiateAutoInstrumentation,
  runSyntheticHandler
} = require('@google-cloud/synthetics-sdk-api');

instantiateAutoInstrumentation();

const functions = require('@google-cloud/functions-framework');
const axios = require('axios');
const assert = require('node:assert');

functions.http('SyntheticFunction', runSyntheticHandler(async ({logger, executionId}) => {
  /*
   * This function executes the synthetic code for testing purposes.
   * If the code runs without errors, the synthetic test is considered successful.
   * If an error is thrown during execution, the synthetic test is considered failed.
   */
  logger.info('Making an http request using synthetics, with execution id: ' + executionId);
  const url = 'https://www.google.com/'; // URL to send the request to
  return await assert.doesNotReject(axios.get(url));
}));
```

#### Penjelasan Setiap Bagian Code

| Line | Code | Penjelasan |
|------|------|-----------|
| 15 | `require('@google-cloud/synthetics-sdk-api')` | SDK resmi Google untuk Synthetic Monitoring — menyediakan `runSyntheticHandler` dan auto-instrumentation |
| 17 | `instantiateAutoInstrumentation()` | Mengaktifkan **auto-tracing** — otomatis mencatat HTTP requests ke Cloud Trace |
| 18 | `require('@google-cloud/functions-framework')` | Framework Cloud Functions — wajib untuk register HTTP handler |
| 19 | `require('axios')` | HTTP client — digunakan untuk membuat request ke target URL |
| 20 | `require('node:assert')` | Node.js built-in assertion — untuk validasi response |
| 22 | `functions.http('SyntheticFunction', ...)` | Register handler dengan nama `SyntheticFunction` — **harus cocok** dengan Entry point di Console |
| 22 | `runSyntheticHandler(async ({logger, executionId}) => {...})` | Wrapper dari SDK — menyediakan `logger` dan `executionId` |
| 28 | `logger.info(...)` | Log yang muncul di **Cloud Logging** dan di tab OVERVIEW |
| 29 | `const url = 'https://www.google.com/'` | Target URL — **ganti ini** ke endpoint yang ingin dimonitor |
| 30 | `assert.doesNotReject(axios.get(url))` | Pastikan request **tidak reject** (tidak error) — jika reject = test FAIL |

#### Cara Modifikasi Default Code

```javascript
// Ganti URL target:
const url = 'https://api.myapp.com/health';  // ← URL aplikasi kamu

// Tambah validasi response:
functions.http('SyntheticFunction', runSyntheticHandler(async ({logger, executionId}) => {
  logger.info('Checking API health, execution id: ' + executionId);

  const url = 'https://api.myapp.com/health';
  const response = await axios.get(url);

  // Validasi status code
  assert.strictEqual(response.status, 200, 'Expected status 200');

  // Validasi response body
  assert.strictEqual(response.data.status, 'ok', 'Expected status ok');
  assert.ok(response.data.database === 'connected', 'DB should be connected');

  logger.info('All checks passed!');
}));
```

#### Parameter yang Tersedia di Handler

| Parameter | Type | Fungsi |
|-----------|------|--------|
| **logger** | Object | Logger yang output-nya muncul di Cloud Logging dan tab OVERVIEW. Methods: `logger.info()`, `logger.warn()`, `logger.error()` |
| **executionId** | String | ID unik untuk setiap eksekusi — berguna untuk debugging dan tracing |

#### Package yang Digunakan

| Package | Versi | Fungsi |
|---------|-------|--------|
| `@google-cloud/synthetics-sdk-api` | latest | SDK utama Synthetic Monitoring — `runSyntheticHandler`, `instantiateAutoInstrumentation` |
| `@google-cloud/functions-framework` | ^3.x | Framework Cloud Functions — register HTTP handler |
| `axios` | ^1.x | HTTP client — membuat request |
| `node:assert` | built-in | Assertion library bawaan Node.js |

**Perbedaan Custom synthetic monitor vs Mocha synthetic monitor:**

| Aspek | Custom (synthetics-sdk-api) | Mocha (synthetics-sdk-mocha) |
|-------|---------------------------|------------------------------|
| **SDK** | `@google-cloud/synthetics-sdk-api` | `@google-cloud/synthetics-sdk-mocha` |
| **Handler** | `runSyntheticHandler` | `runMochaHandler` |
| **Test structure** | Fungsi biasa + `assert` | Mocha `describe()` + `it()` + `expect()` |
| **Assertion** | `node:assert` (built-in) | `chai` (expect/should) |
| **HTTP client** | `axios` (default) | `node-fetch` atau `axios` |
| **Step visibility** | 1 block — pass/fail keseluruhan | Per `it()` block — lihat step mana yang gagal |
| **Cocok untuk** | Simple check (1-2 assertions) | Multi-step testing (login flow, API chain) |

---

## 2. Broken Link Checker — Detail

### Apa itu?

Secara otomatis **crawl halaman web** dan cek semua link (`<a href>`) di halaman tersebut. Jika ada link yang mengembalikan **404, 5xx, atau timeout**, dilaporkan sebagai gagal.

### Console Form: Broken Link Checker

Saat memilih **Broken link checker** di sidebar kiri, form kanan berubah:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Name *                                                         │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ website-broken-links                                 │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  URI to check *                                                  │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ https://www.myapp.com                                │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  Response Timeout *                                              │
│  ┌──────────────────────────────────────────────┐  seconds      │
│  │ 30                                            │               │
│  └──────────────────────────────────────────────┘               │
│                                                                 │
│  Check Frequency                                                 │
│  ┌──────────────────────────────────────────────┐            ▼  │
│  │ 15 minutes                                    │               │
│  └──────────────────────────────────────────────┘               │
│                                                                 │
│  Options:                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Max links to check: ┌──────┐                            │   │
│  │                       │ 100  │                            │   │
│  │                       └──────┘                            │   │
│  │                                                          │   │
│  │  Link timeout: ┌──────────┐                              │   │
│  │                │ 30 sec  ▼│                              │   │
│  │                └──────────┘                              │   │
│  │                                                          │   │
│  │  ☑ Wait for page to fully load (execute JavaScript)      │   │
│  │  ☐ Check links on same origin only                       │   │
│  │  ☐ Follow redirects                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  User labels                                                     │
│  [+ ADD LABEL]                                                  │
│                                                                 │
│  Cloud function ⓘ                                               │
│  (auto-deployed — tidak perlu tulis code)                        │
│  Region: ┌────────────────────────┐                              │
│          │ asia-southeast2       ▼│                              │
│          └────────────────────────┘                              │
│                                                                 │
│  Alerts and notifications ⓘ                                     │
│  🔵 Create an alert                                              │
│  Alert Name: website-broken-links synthetic failure              │
│  Alert Duration: 1 minute                                        │
│  Notification Channels: (pilih)                                  │
│                                                                 │
│                                               [CREATE]          │
└─────────────────────────────────────────────────────────────────┘
```

### Penjelasan Setiap Field

| Field | Fungsi | Default / Contoh |
|-------|--------|-----------------|
| **URI to check** | URL halaman yang di-crawl | `https://www.myapp.com` |
| **Check frequency** | Seberapa sering check dijalankan | 15 min (link check tidak perlu terlalu sering) |
| **Max links to check** | Batas jumlah link yang dicek per eksekusi | 100 (default), bisa dinaikkan |
| **Link timeout** | Timeout per link | 30 sec |
| **Wait for page to fully load** | Render JavaScript dulu sebelum extract links (headless browser) | Aktifkan untuk SPA (React, Vue, Angular) |
| **Check links on same origin only** | Hanya cek link ke domain yang sama | Aktifkan jika tidak perlu cek external links |
| **Follow redirects** | Ikuti redirect (301, 302) dan cek destination | Aktifkan untuk validasi redirect chain |

### Cara Kerja Broken Link Checker

```
Step 1: Cloud Function membuka URI target
       │
       ▼
Step 2: Parse HTML → extract semua <a href="...">
       │
       │  Ditemukan 50 links:
       │  ├─ /about
       │  ├─ /pricing
       │  ├─ /docs/getting-started
       │  ├─ https://github.com/myapp
       │  ├─ /blog/old-post-deleted      ← broken?
       │  └─ ...
       │
       ▼
Step 3: Request setiap link → cek response
       │
       │  /about                → 200 ✅
       │  /pricing              → 200 ✅
       │  /docs/getting-started → 200 ✅
       │  github.com/myapp      → 200 ✅
       │  /blog/old-post-deleted→ 404 ❌ BROKEN!
       │
       ▼
Step 4: Report
       │
       │  Total links:   50
       │  Passing:        49
       │  Broken:         1
       │  └─ /blog/old-post-deleted → 404 Not Found
       │
       ▼
Step 5: Alert (jika dikonfigurasi)
       │
       │  🔔 "Broken link detected on https://www.myapp.com"
       │  → Slack notification dikirim
```

### Skenario Penggunaan

| Skenario | URI | Frequency | Options |
|----------|-----|-----------|---------|
| **Website production** | `https://www.myapp.com` | 15 min | Max 200, same origin, follow redirects |
| **Documentation site** | `https://docs.myapp.com` | 1 hour | Max 500, termasuk external links |
| **E-commerce** | `https://shop.myapp.com` | 15 min | Max 100, wait for JS (SPA) |
| **Blog** | `https://blog.myapp.com` | 1 hour | Max 300, follow redirects |

| Kelebihan | Kekurangan |
|-----------|------------|
| Tidak perlu coding (UI konfigurasi saja) | Hanya cek `<a href>` — tidak cek images, CSS, JS |
| Otomatis crawl semua link di halaman | Max links limit bisa miss link jika halaman besar |
| Deteksi dead links sebelum user menemukan | SPA butuh "wait for JS" yang lebih lambat |
| Berguna untuk SEO (broken links = ranking turun) | External links bisa false positive (site lain temporary down) |

---

## 3. Mocha Synthetic Monitor — Detail

### Apa itu?

Sama dengan Custom synthetic monitor, tapi Console menyediakan **template Mocha siap pakai** yang bisa langsung dimodifikasi. Cocok untuk **quick start** tanpa harus tulis dari nol. Form-nya sama dengan Custom synthetic monitor (Name, Response Timeout, Check Frequency, dll) — bedanya Cloud Function sudah berisi **boilerplate Mocha test**.

### Template yang Tersedia

```
Console → Create Synthetic Check → Mocha synthetic monitor

  Cloud Function sudah berisi template:
  ┌──────────────────────────────────────────────────────┐
  │  const { expect } = require('chai');                  │
  │  const fetch = require('node-fetch');                 │
  │                                                      │
  │  describe('Synthetic Test', function() {              │
  │    this.timeout(10000);                               │
  │                                                      │
  │    it('should return HTTP 200', async () => {         │
  │      const res = await fetch('https://YOUR_URL');     │ ← ganti URL
  │      expect(res.status).to.equal(200);                │
  │    });                                                │
  │  });                                                  │
  └──────────────────────────────────────────────────────┘

  Modifikasi yang umum:
  - Ganti URL target
  - Tambah it() blocks untuk endpoint lain
  - Tambah content/body assertions
```

### Contoh Template: Generic HTTP Check

```javascript
const { expect } = require('chai');
const fetch = require('node-fetch');

const TARGET_URL = 'https://YOUR_APP_URL/health'; // ← ganti ini

describe('HTTP Health Check', function () {
  this.timeout(10000);

  it('should return HTTP 200', async () => {
    const res = await fetch(TARGET_URL);
    expect(res.status).to.equal(200);
  });
});
```

**Modifikasi yang umum dilakukan:**
- Ganti `TARGET_URL` ke endpoint aplikasi
- Tambah `it()` blocks untuk endpoint lain
- Tambah content validation (`expect(body).to.have.property(...)`)

---

## Dashboard Synthetic Monitoring

Setelah monitor dibuat, Console menampilkan dashboard per monitor:

```
Console: Monitoring → Synthetic monitoring → (klik monitor name)

┌─────────────────────────────────────────────────────────────────┐
│  api-health-check                                    [EDIT] [⋮] │
│                                                                 │
│  Status: ● PASSING                    Last run: 2 min ago       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Execution History (last 24 hours)                       │    │
│  │                                                         │    │
│  │  ✅✅✅✅✅✅✅✅✅✅✅✅✅❌✅✅✅✅✅✅✅✅✅✅  │    │
│  │                           ↑                              │    │
│  │                      failure at 14:35                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Success rate (24h): 95.8%    Avg duration: 1.2s               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Latest execution details:                               │    │
│  │                                                         │    │
│  │  ✅ Step 1: GET /health — 200 OK (320ms)                │    │
│  │  ✅ Step 2: POST /auth — 200 OK (890ms)                 │    │
│  │  ✅ Step 3: GET /dashboard — 200 OK (445ms)             │    │
│  │                                                         │    │
│  │  Total duration: 1,655ms                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Failed execution (14:35):                               │    │
│  │                                                         │    │
│  │  ✅ Step 1: GET /health — 200 OK (310ms)                │    │
│  │  ❌ Step 2: POST /auth — 503 Service Unavailable        │    │
│  │     AssertionError: expected 503 to equal 200            │    │
│  │  ⏭ Step 3: SKIPPED (previous step failed)               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Informasi yang Ditampilkan

| Elemen | Fungsi |
|--------|--------|
| **Status** | PASSING (hijau) atau FAILING (merah) — status eksekusi terakhir |
| **Execution History** | Timeline visual pass/fail per eksekusi (24 jam) |
| **Success rate** | Persentase keberhasilan dalam periode tertentu |
| **Avg duration** | Rata-rata waktu eksekusi script |
| **Latest execution details** | Detail per-step dari eksekusi terakhir (status, duration) |
| **Failed execution details** | Detail error — step mana yang gagal dan assertion error message |

---

## Alerting pada Synthetic Monitor

Saat membuat Synthetic Monitor, bisa langsung attach **alert policy**:

```
Alert flow:

  Synthetic Monitor berjalan (setiap 1/5/10/15 menit)
       │
       ├─ Semua test PASS → OK ✅ (tidak ada alert)
       │
       └─ Ada test FAIL → ALERT! 🚨
            │
            ├─ Incident dibuat di Monitoring → Alerting → Incidents
            │
            └─ Notifikasi dikirim:
                 ├─ Slack: "Synthetic monitor 'api-health-check' FAILED"
                 ├─ Email: detail error + step yang gagal
                 └─ PagerDuty: incident created
```

### Konfigurasi Alert

| Setting | Deskripsi | Rekomendasi |
|---------|-----------|-------------|
| **Consecutive failures** | Berapa kali berturut-turut gagal sebelum alert | 2-3 (hindari alert dari network flake) |
| **Notification channels** | Channel mana yang diberitahu | Slack + Email (production) |
| **Severity** | Level severity alert | Error (untuk API check), Critical (untuk login flow) |

---

## Skenario Lengkap: Kapan Pakai Apa?

```
Decision Tree:

  Apa yang ingin dimonitor?
       │
       ├─ "Apakah website/API saya hidup?"
       │    → Uptime Checks (simple, free, no coding)
       │
       ├─ "Apakah user bisa login dan akses dashboard?"
       │    → Synthetic Monitoring — Custom Script
       │    (multi-step flow: login → verify → navigate)
       │
       ├─ "Apakah ada broken links di website saya?"
       │    → Synthetic Monitoring — Broken Link Checker
       │    (auto crawl, no coding)
       │
       ├─ "Apakah API chain saya (A → B → C) berfungsi?"
       │    → Synthetic Monitoring — Custom Script
       │    (chained requests with data passing)
       │
       ├─ "Apakah response time API saya acceptable?"
       │    → Synthetic Monitoring — Custom Script
       │    (timing assertions: expect(duration).below(2000))
       │
       └─ "Quick health check tanpa coding?"
            → Synthetic Monitoring — Mocha Template
            (pre-built, modify URL saja)
```

### Contoh Implementasi per Skenario

| Skenario | Tool | Frequency | Kompleksitas |
|----------|------|-----------|-------------|
| Website uptime | Uptime Check | 1 min | Sangat mudah (UI) |
| API availability | Uptime Check (HTTPS) | 1 min | Mudah (UI) |
| Login + checkout flow | Synthetic (Custom) | 5 min | Menengah (coding) |
| Broken links SEO | Synthetic (Broken Link) | 1 hour | Mudah (UI) |
| API performance SLA | Synthetic (Custom) | 5 min | Menengah (coding) |
| Third-party API dependency | Synthetic (Custom) | 5 min | Menengah (coding) |
| Database connectivity | Synthetic (Custom) | 1 min | Mudah (template) |
| SSL + endpoint + content | Uptime Check (HTTPS) | 5 min | Mudah (UI) |

---

## Cloud Function — Infrastruktur di Balik Synthetic

Synthetic Monitoring menggunakan **Cloud Run functions** (rebrand 2024 dari Cloud Functions 2nd gen) sebagai infrastruktur eksekusi. Berikut yang perlu dipahami:

```
Arsitektur:

  Cloud Monitoring                      Cloud Functions
  ┌──────────────────┐                 ┌──────────────────────┐
  │                  │                 │                      │
  │  Synthetic       │  ── trigger ──► │  Cloud Function      │
  │  Monitor Config  │  (setiap 1m)   │  (2nd gen)           │
  │                  │                 │                      │
  │  - frequency     │                 │  Runtime: Node.js 20 │
  │  - timeout       │                 │  Memory: 256 MB      │
  │  - alert policy  │                 │  Region: asia-se2    │
  │                  │  ◄── result ─── │                      │
  │  Result:         │                 │  Mocha test suite:   │
  │  - pass/fail     │                 │  - describe()        │
  │  - duration      │                 │  - it()              │
  │  - error detail  │                 │  - expect()          │
  │                  │                 │                      │
  └──────────────────┘                 └──────────────────────┘
         │
         ▼
  Dashboard + Alerting
```

### Hal Penting tentang Cloud Function

| Aspek | Detail |
|-------|--------|
| **Auto-deploy** | Console otomatis membuat & deploy Cloud Function saat create monitor |
| **Region** | Pilih region terdekat ke target (misal asia-southeast2 untuk ID) |
| **Runtime** | Node.js 18 atau 20 |
| **Dependencies** | `chai`, `node-fetch`, `mocha` sudah included — bisa tambah di `package.json` |
| **Environment variables** | Bisa set env vars di Cloud Function untuk secrets (API keys, passwords) |
| **VPC Connector** | Bisa attach VPC Connector untuk test endpoint **internal/private** |
| **Logs** | Output log dari test tersedia di Cloud Logging |

### Tips: Secret Management

Jangan hardcode credentials di script. Gunakan **environment variables** atau **Secret Manager**:

```javascript
// Environment variable (di Cloud Function settings)
const API_KEY = process.env.API_KEY;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

// Atau Secret Manager
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function getSecret(name) {
  const [version] = await client.accessSecretVersion({
    name: `projects/my-project/secrets/${name}/versions/latest`
  });
  return version.payload.data.toString();
}
```

---

## Pricing

Synthetic Monitoring pricing tergantung pada **Cloud Function** yang dijalankan:

| Komponen | Harga | Keterangan |
|----------|-------|-----------|
| **Synthetic Monitor** | **Gratis** | Konfigurasi monitor di Monitoring tidak dikenakan biaya |
| **Cloud Function invocations** | 2 juta invocations/bulan **gratis** | Setelah itu ~$0.40 per 1 juta invocations |
| **Cloud Function compute** | 400,000 GB-seconds/bulan **gratis** | Setelah itu ~$0.0000025/GB-second |
| **Network egress** | 5 GB/bulan **gratis** | Biaya network dari Cloud Function ke target |
| **Alert policy** | **Gratis** (up to 500 policies) | Bagian dari Cloud Monitoring free tier |

### Estimasi Cost

```
Skenario: 5 Synthetic Monitors, frequency 5 menit

  Invocations per monitor per bulan:
    60 min/hour ÷ 5 min × 24 hours × 30 days = 8,640 invocations

  Total: 5 monitors × 8,640 = 43,200 invocations/bulan

  Free tier: 2,000,000 invocations
  43,200 << 2,000,000

  → GRATIS (masih jauh dari batas free tier)
```

```
Skenario: 50 Synthetic Monitors, frequency 1 menit (enterprise)

  Invocations per monitor per bulan:
    60 × 24 × 30 = 43,200 invocations

  Total: 50 × 43,200 = 2,160,000 invocations/bulan

  Over free tier: 160,000 invocations
  Cost: 160,000 × $0.0000004 ≈ $0.06/bulan

  → Hampir gratis bahkan untuk skala besar
```

| Kelebihan (Pricing) | Kekurangan (Pricing) |
|---------------------|---------------------|
| Free tier sangat besar — kebanyakan gratis | Cloud Function compute bisa mahal jika script lambat (long timeout) |
| Monitor config sendiri gratis | VPC Connector ada biaya tambahan (untuk private endpoint) |
| Alert policy gratis | Secret Manager ada biaya minimal jika digunakan |

---

## Kelebihan & Kekurangan Synthetic Monitoring

| Kelebihan | Kekurangan |
|-----------|------------|
| **Multi-step testing** — bisa test user journey lengkap | Butuh **coding skill** (JavaScript/Mocha) untuk Custom Script |
| **Proaktif** — detect masalah sebelum user melapor | Cloud Function cold start bisa memperlambat first execution |
| **Broken Link Checker** tanpa coding | Script maintenance — perlu update jika API berubah |
| **Flexible** — bisa test apapun yang Node.js bisa lakukan | Region terbatas pada region Cloud Function |
| **Alert integration** native dengan Cloud Monitoring | Tidak bisa simulate real browser (headless browser terbatas) |
| **Cost efektif** — kebanyakan gratis di free tier | Timeout limit — script harus selesai dalam batas waktu |
| **Secret management** via env vars / Secret Manager | Debugging script perlu cek Cloud Function logs |
| Hasil terintegrasi di Monitoring dashboard | — |

---

## Best Practices

### 1. Naming Convention

```
Pattern: {service}-{check-type}-{environment}

Contoh:
  api-health-check-prod
  web-login-flow-prod
  docs-broken-links-prod
  payment-api-chain-staging
```

### 2. Frequency Guidelines

| Check Type | Recommended Frequency | Alasan |
|-----------|----------------------|--------|
| API health (critical) | 1 min | Detect downtime ASAP |
| Login/checkout flow | 5 min | Balance cost vs detection speed |
| Broken links | 1 hour | Links jarang berubah |
| Performance check | 5 min | Capture trend tanpa overhead |

### 3. Script Best Practices

| Practice | Penjelasan |
|----------|-----------|
| **Set timeout per test** | `this.timeout(10000)` — jangan biarkan default (2s terlalu pendek) |
| **Gunakan descriptive names** | `it('POST /auth should return JWT token')` — bukan `it('test 2')` |
| **Jangan hardcode secrets** | Gunakan env vars atau Secret Manager |
| **Handle flaky networks** | Tambah retry logic atau toleransi untuk network jitter |
| **Keep scripts fast** | Target total < 10 detik — script lambat = cost lebih tinggi |
| **Test independence** | Setiap `it()` block harus bisa jalan sendiri jika memungkinkan |

### 4. Alert Strategy

```
Synthetic Monitor Alerts:

  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  API Health Check (1 min)                            │
  │  → Alert after 2 consecutive failures                │
  │  → Slack + Email                                     │
  │  → Severity: Error                                   │
  │                                                      │
  │  Login Flow (5 min)                                  │
  │  → Alert after 1 failure (critical path!)            │
  │  → PagerDuty + Slack + SMS                           │
  │  → Severity: Critical                                │
  │                                                      │
  │  Broken Links (1 hour)                               │
  │  → Alert after 1 detection                           │
  │  → Email only                                        │
  │  → Severity: Warning                                 │
  │                                                      │
  └──────────────────────────────────────────────────────┘
```

---

## Ringkasan

```
Synthetic Monitoring:

  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  "Apakah endpoint hidup?"        → Uptime Check             │
  │                                                              │
  │  "Apakah user journey berfungsi?" → Synthetic (Custom)      │
  │                                                              │
  │  "Apakah ada broken links?"       → Synthetic (Broken Link) │
  │                                                              │
  │  "Quick API check tanpa coding?"  → Synthetic (Template)    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  Infrastruktur: Cloud Run functions (2nd gen Cloud Functions)
  Bahasa: JavaScript (Node.js + Mocha + Chai)
  Cost: Kebanyakan GRATIS (free tier besar)
  Integrasi: Dashboard + Alerting + Cloud Logging
```

---

*Dokumen ini berdasarkan fitur Synthetic Monitoring di Google Cloud Console per Maret 2025–2026; nama field UI dapat sedikit berubah antar rilis Console.*
