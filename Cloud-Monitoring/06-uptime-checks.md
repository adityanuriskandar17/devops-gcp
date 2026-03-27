# Uptime Checks

Dokumentasi lengkap **Uptime Checks** di Google Cloud Monitoring — pemantauan ketersediaan service dari lokasi global.

**Console:** Monitoring → **Uptime checks**

---

## Apa itu Uptime Check?

Uptime Check secara periodik mengirim **probe/request** ke endpoint (URL, IP, port) dari beberapa lokasi global Google untuk memastikan service tersedia dan merespons dengan benar.

```
Google Probe Locations (6 region):

  USA-EAST ─────────┐
  USA-CENTRAL ──────┤
  USA-WEST ─────────┤
  EUROPE ───────────┼──► Target: https://myapp.com/health
  SOUTH-AMERICA ────┤         │
  ASIA-PACIFIC ─────┘         ▼
                          ┌────────┐
                Response?  │ 200 OK │ ← UP ✅
                          │ timeout│ ← DOWN ❌
                          │ 500    │ ← DOWN ❌
                          └────────┘
                               │
                    Fail dari 2+ region?
                               │
                               ▼
                       🚨 ALERT FIRES
```

---

## Membuat Uptime Check

**Console:** Monitoring → Uptime checks → **+ Create Uptime Check**

### Step 1: Target

```
Console UI:

  ┌─────────────────────────────────────────────────┐
  │  Target                                          │
  │                                                 │
  │  Protocol:  ● HTTP  ○ HTTPS  ○ TCP              │
  │                                                 │
  │  Resource type: ┌──────────────────────┐        │
  │                 │ URL                  ▼│        │
  │                 └──────────────────────┘        │
  │                                                 │
  │  Hostname: ┌──────────────────────────────┐     │
  │            │ myapp.example.com            │     │
  │            └──────────────────────────────┘     │
  │                                                 │
  │  Path:     ┌──────────────────────────────┐     │
  │            │ /health                       │     │
  │            └──────────────────────────────┘     │
  │                                                 │
  │  Port:     ┌──────┐                             │
  │            │ 443  │                             │
  │            └──────┘                             │
  └─────────────────────────────────────────────────┘
```

| Field | Pilihan | Deskripsi |
|-------|---------|-----------|
| **Protocol** | HTTP | Check tanpa SSL — untuk internal/non-HTTPS service |
| | HTTPS | Check dengan SSL — **rekomendasi untuk production** |
| | TCP | Check koneksi TCP — untuk database, custom service |
| **Resource type** | URL | Target endpoint URL langsung |
| | Instance | Target VM Compute Engine by instance ID |
| | App Engine | Target App Engine service |
| | Kubernetes LoadBalancer | Target GKE service |
| | Cloud Run Revision | Target Cloud Run service |
| **Hostname** | Domain/IP | Domain name atau IP target |
| **Path** | URL path | Endpoint spesifik — biasanya `/health` atau `/` |
| **Port** | 80, 443, custom | Port target — default 80 (HTTP) atau 443 (HTTPS) |

### Step 2: Check Frequency & Regions

```
  ┌─────────────────────────────────────────────────┐
  │  Check frequency:  ┌──────────┐                  │
  │                    │ 1 minute ▼│                  │
  │                    └──────────┘                  │
  │                                                 │
  │  Regions:                                       │
  │  ☑ USA - Oregon      ☑ USA - Virginia           │
  │  ☑ Europe            ☑ South America             │
  │  ☑ Asia Pacific      ☑ USA - Iowa                │
  └─────────────────────────────────────────────────┘
```

| Frequency | Deteksi | Cost | Cocok Untuk |
|-----------|---------|------|-------------|
| **1 menit** | Cepat (downtime terdeteksi < 2 menit) | Paling mahal | Production critical, SLA 99.9% |
| **5 menit** | Moderate | Moderate | Production standard |
| **10 menit** | Lambat | Murah | Staging, internal tools |
| **15 menit** | Paling lambat | Paling murah | Non-critical services |

| Kelebihan (Frequency cepat) | Kekurangan (Frequency cepat) |
|-----------------------------|------------------------------|
| Downtime cepat terdeteksi | Cost lebih tinggi |
| SLA compliance lebih baik | Load ke target lebih besar |

### Step 3: Response Validation

```
  ┌─────────────────────────────────────────────────┐
  │  Response validation                             │
  │                                                 │
  │  Response code:  ┌────────────────────────┐     │
  │                  │ Response code matches: │     │
  │                  │ 2xx (any success)     ▼│     │
  │                  └────────────────────────┘     │
  │                                                 │
  │  Content match:                                 │
  │  ☑ Response body contains:                      │
  │  ┌──────────────────────────────┐               │
  │  │ "status":"ok"                │               │
  │  └──────────────────────────────┘               │
  └─────────────────────────────────────────────────┘
```

| Validation | Deskripsi | Kelebihan | Kekurangan |
|-----------|-----------|-----------|------------|
| **Status code** (2xx) | Hanya cek HTTP status | Simple, cepat | App bisa return 200 tapi sebenarnya error |
| **Content match** | Cek body mengandung teks tertentu | Validasi lebih dalam | Jika response body besar, sedikit lebih lambat |
| **Both** | Status code + content | Paling reliable | Setup lebih rumit |

### Step 4: Authentication (Optional)

```
  ┌─────────────────────────────────────────────────┐
  │  Authentication                                  │
  │                                                 │
  │  Custom headers:                                │
  │  ┌────────────────┐  ┌──────────────────────┐   │
  │  │ Authorization  │  │ Bearer <token>       │   │
  │  └────────────────┘  └──────────────────────┘   │
  │                                                 │
  │  ☐ Use basic authentication                     │
  │  Username: ┌──────────┐                         │
  │            │          │                         │
  │  Password: ┌──────────┐                         │
  │            │          │                         │
  └─────────────────────────────────────────────────┘
```

### Step 5: Alert & Notification

```
  ┌─────────────────────────────────────────────────┐
  │  Alert & notification                            │
  │                                                 │
  │  ☑ Create an alert                              │
  │                                                 │
  │  Alert name: ┌────────────────────────────┐     │
  │              │ Website Down               │     │
  │              └────────────────────────────┘     │
  │                                                 │
  │  Duration:  ┌──────────┐                        │
  │             │ 1 minute ▼│                        │
  │             └──────────┘                        │
  │                                                 │
  │  Notification channels:                         │
  │  ☑ ops-slack   ☑ ops-email                      │
  │                                                 │
  │            [ Create ]                           │
  └─────────────────────────────────────────────────┘
```

---

## Protocol Comparison

| Aspek | HTTP | HTTPS | TCP |
|-------|------|-------|-----|
| **Apa yang dicek** | HTTP response | HTTPS response + SSL | TCP connection |
| **SSL validation** | Tidak | Ya (cert valid, not expired) | Tidak |
| **Response body** | Ya (bisa content match) | Ya | Tidak |
| **Cocok untuk** | Internal HTTP service | Website, API production | Database, Redis, custom TCP |
| **Kelebihan** | Simple, cepat | Validasi SSL + content | Check non-HTTP service |
| **Kekurangan** | Tidak cek SSL | Sedikit overhead SSL | Tidak bisa validasi response |

---

## SSL Certificate Monitoring

HTTPS uptime check otomatis memonitor **SSL certificate expiry**. Jika SSL mendekati expired, bisa di-alert.

```
Console: Monitoring → Uptime checks → (pilih HTTPS check) → SSL Certificate tab

  Certificate valid until: 15 June 2027
  Days remaining: 450 days
  
  Alert when < 30 days remaining ← rekomendasi
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Otomatis dengan HTTPS check | Hanya untuk endpoint yang di-check |
| Bisa alert sebelum SSL expire | Tidak berlaku untuk TCP check |

---

## Skenario Uptime Checks

### 1. Website Production

```
Protocol:     HTTPS
Hostname:     www.myapp.com
Path:         /health
Port:         443
Frequency:    1 minute
Regions:      All (6 regions)
Validation:   Status 2xx + body contains "ok"
Alert:        Website Down → Slack + PagerDuty + SMS
```

### 2. API Endpoint

```
Protocol:     HTTPS
Hostname:     api.myapp.com
Path:         /v1/status
Port:         443
Frequency:    5 minutes
Headers:      Authorization: Bearer <service-token>
Validation:   Status 200 + body contains "healthy"
Alert:        API Down → Slack + Email
```

### 3. Database Connectivity

```
Protocol:     TCP
Hostname:     10.0.0.5 (private IP Cloud SQL)
Port:         3306
Frequency:    5 minutes
Validation:   TCP connection success
Alert:        DB Unreachable → PagerDuty + Slack
```

### 4. Internal Admin Panel

```
Protocol:     HTTPS
Hostname:     admin.internal.myapp.com
Path:         /login
Port:         443
Frequency:    15 minutes
Validation:   Status 200
Alert:        Admin Panel Down → Email
```

---

## Uptime Check Dashboard

Setiap uptime check otomatis mendapat **dashboard mini** di Console:

```
Console: Monitoring → Uptime checks → (klik check name)

  ┌─────────────────────────────────────────┐
  │  Uptime: 99.95%   (last 30 days)       │
  │                                         │
  │  100%|████████████████████████████████  │
  │   99%|                    █             │ ← downtime
  │      └──────────────────────────────── │
  │        1 Mar    8 Mar    15 Mar  22 Mar │
  │                                         │
  │  Latency (avg): 120ms                  │
  │  Checks: 43,200   Passed: 43,178       │
  │  Failed: 22       Downtime: ~22 min    │
  └─────────────────────────────────────────┘
```

---

## Kelebihan & Kekurangan Uptime Checks

| Kelebihan | Kekurangan |
|-----------|------------|
| Probing dari 6 global regions | Hanya cek dari luar (tidak cek internal health) |
| Deteksi downtime cepat (1 min) | TCP check tidak validasi response content |
| SSL certificate monitoring gratis | Free tier: 10 uptime checks per project |
| Auto-create alert | Tidak bisa check gRPC / WebSocket |
| Latency tracking per region | Private endpoint butuh konfigurasi khusus |
| Integrasi native dengan alerting | Content match terbatas (simple substring) |

---

## Free Tier

| Item | Gratis |
|------|--------|
| Uptime checks | **10 per project** |
| Probe locations | 6 regions (semua gratis) |
| SSL monitoring | Gratis (included dengan HTTPS check) |
| Frequency | Semua frequency gratis (1m, 5m, 10m, 15m) |
| Alerting | Gratis (bagian dari alerting policies) |
