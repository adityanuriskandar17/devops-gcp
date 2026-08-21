# Proxy, Load Balancer & Firewall

Dokumentasi tentang komponen infrastruktur yang berada **di antara client dan server**: forward proxy vs reverse proxy, caching server, algoritma load balancing, perbedaan L4 vs L7 load balancing, serta dasar-dasar firewall (stateful vs stateless). Konsep ini adalah fondasi dari service seperti Cloud Load Balancing, Cloud Armor, atau Nginx/HAProxy yang di-deploy sendiri.

---

## Forward Proxy vs Reverse Proxy

Keduanya "proxy" (perantara), tapi posisinya dan tujuannya berbeda — sering tertukar oleh yang baru belajar.

```
FORWARD PROXY (mewakili CLIENT)

  ┌────────┐        ┌───────────────┐        ┌────────┐
  │ Client1 │───────►│               │───────►│ Server1 │
  ├────────┤        │ Forward Proxy  │        ├────────┤
  │ Client2 │───────►│               │───────►│ Server2 │
  └────────┘        └───────────────┘        └────────┘

  Dari sudut pandang SERVER: yang terlihat adalah IP proxy,
  bukan IP client asli.

  Use case:
  - Kontrol/filter akses internet karyawan kantor (web filtering)
  - Anonimitas / bypass geo-restriction
  - Caching konten yang sering diakses banyak client
  - Kantor pakai 1 proxy untuk semua karyawan akses internet


REVERSE PROXY (mewakili SERVER)

  ┌────────┐        ┌───────────────┐        ┌────────┐
  │        │───────►│               │───────►│ Server1 │
  │ Clients │        │ Reverse Proxy  │        ├────────┤
  │        │───────►│ (Nginx, LB)    │───────►│ Server2 │
  └────────┘        └───────────────┘        └────────┘

  Dari sudut pandang CLIENT: yang terlihat adalah 1 alamat
  (domain/IP reverse proxy), tidak tahu ada berapa server
  di baliknya atau IP asli masing-masing server.

  Use case:
  - Load balancing ke banyak backend server
  - Terminasi TLS/SSL (server backend tidak perlu handle enkripsi)
  - Caching response (mengurangi load ke backend)
  - Menyembunyikan struktur internal infrastruktur (security)
  - Web Application Firewall (WAF) di depan aplikasi
```

| Aspek | Forward Proxy | Reverse Proxy |
|-------|---------------|----------------|
| Mewakili siapa | Client | Server |
| Ditempatkan di | Sisi client (kantor, ISP) | Sisi server (data center) |
| Yang tersembunyi | Identitas client (dari server) | Identitas/topology server (dari client) |
| Contoh software | Squid, Privoxy | Nginx, HAProxy, Cloud Load Balancing |
| Contoh use case | Web filtering kantor, VPN corporate | Load balancer web app, CDN edge, API gateway |

---

## Caching Server

Server yang menyimpan **copy** dari response sebelumnya, supaya request berikutnya untuk data yang sama tidak perlu diproses ulang dari awal.

```
Tanpa cache:                          Dengan cache:

  Request 1 → Server proses          Request 1 → Server proses
              (200ms, query DB)                   (200ms) → simpan di cache
  Request 2 → Server proses ULANG    Request 2 → Ambil dari CACHE
              (200ms lagi)                        (5ms, jauh lebih cepat)
  Request 3 → Server proses ULANG    Request 3 → Ambil dari CACHE (5ms)
              (200ms lagi)

  ❌ Beban server tinggi              ✅ Beban server jauh berkurang
  ❌ Response time konsisten lambat   ✅ Response cepat untuk data populer
```

**Catatan:** Caching bisa terjadi di banyak level — browser cache, reverse proxy cache (Nginx `proxy_cache`), CDN edge cache, hingga application-level cache (Redis/Memcached). Yang dibahas di sini adalah caching di level proxy/network, bukan application cache.

---

## Load Balancer — Algoritma Distribusi Traffic

| Algoritma | Cara Kerja | Kelebihan | Kekurangan |
|-----------|-----------|-----------|------------|
| **Round Robin** | Request dibagi bergilir ke setiap server secara berurutan | Simpel, distribusi rata secara jumlah request | Tidak mempertimbangkan beban aktual server (server lambat tetap kebagian rata) |
| **Least Connections** | Request diarahkan ke server dengan koneksi aktif paling sedikit | Lebih adil untuk request dengan durasi bervariasi | Butuh tracking state koneksi (lebih kompleks) |
| **IP Hash** | Server dipilih berdasarkan hash dari IP client — client yang sama selalu ke server yang sama | Session persistence tanpa cookie (sticky session) | Distribusi bisa tidak rata kalau IP client tidak beragam |
| **Weighted (Round Robin/Least Conn)** | Server dengan kapasitas lebih besar diberi "weight" lebih tinggi, dapat porsi traffic lebih banyak | Cocok untuk server dengan spek heterogen | Perlu tuning manual weight per server |
| **Least Response Time** | Kombinasi least connections + response time tercepat | Paling optimal untuk performa | Overhead monitoring lebih tinggi |

```
Ilustrasi Round Robin vs Weighted:

  Round Robin (3 server sama kapasitas):
  Req1→SrvA  Req2→SrvB  Req3→SrvC  Req4→SrvA  Req5→SrvB ...

  Weighted (SrvA kapasitas 2x lipat SrvB & SrvC):
  Weight: SrvA=4, SrvB=2, SrvC=2
  Req1→SrvA Req2→SrvA Req3→SrvB Req4→SrvA Req5→SrvA Req6→SrvC Req7→SrvB Req8→SrvA
  (SrvA dapat porsi lebih banyak sesuai weight)
```

---

## L4 vs L7 Load Balancing

```
L4 Load Balancer (Transport Layer)          L7 Load Balancer (Application Layer)

  Keputusan berdasarkan:                    Keputusan berdasarkan:
  - IP address                              - HTTP header (Host, path, cookie)
  - Port                                    - URL path (/api vs /static)
  - Protokol (TCP/UDP)                      - Content-type, User-Agent, dll.

  ┌────────┐   IP:Port    ┌────────┐        ┌────────┐  GET /api/*  ┌────────┐
  │ Client  │─────────────►│Backend1│        │ Client  │─────────────►│ API SVC │
  └────────┘               └────────┘        └────────┘              └────────┘
       tidak baca isi HTTP,                       │  GET /static/*
       hanya routing di level                     └─────────────────►┌────────┐
       IP/port, sangat cepat                                          │Static SVC│
                                                    baca isi request,  └────────┘
                                                    routing berdasarkan
                                                    konten aplikasi
```

| Aspek | L4 (Transport) | L7 (Application) |
|-------|-----------------|---------------------|
| Layer OSI | 4 (TCP/UDP) | 7 (HTTP/HTTPS) |
| Yang dilihat | IP, port | HTTP header, path, cookie, body |
| Kecepatan | Lebih cepat (less processing) | Sedikit lebih lambat (parsing HTTP) |
| Fleksibilitas routing | Terbatas (hanya IP/port) | Tinggi (path-based, header-based routing) |
| TLS termination | Umumnya pass-through (tidak dekripsi) | Umumnya terminasi TLS di LB |
| Contoh | Network Load Balancer, TCP proxy | HTTP(S) Load Balancer, Ingress Controller, API Gateway |
| Cocok untuk | Non-HTTP traffic (database, game server, custom TCP protocol) | Web app, microservices, path-based routing |

---

## Firewall — Stateful vs Stateless

```
STATELESS Firewall                       STATEFUL Firewall

  Setiap paket dicek SENDIRI-SENDIRI       Firewall INGAT koneksi yang
  tanpa tahu konteks koneksi                sudah established

  Request  (client→server, port 443)       Request  (client→server, port 443)
  → dicek rule: allow?  ✅                  → dicek rule: allow? ✅ → dicatat
                                              di connection table

  Response (server→client, port random)    Response (server→client, port random)
  → dicek rule SENDIRI: perlu rule          → firewall INGAT ini balasan dari
    EXPLISIT untuk allow return traffic!      koneksi yang sudah di-allow →
    ❌ Kalau lupa buat rule ini, koneksi       otomatis di-ALLOW tanpa perlu
       gagal walau request awal di-allow       rule return traffic terpisah ✅
```

| Aspek | Stateless | Stateful |
|-------|-----------|----------|
| Tracking koneksi | Tidak (setiap paket independen) | Ya (ingat state koneksi: NEW, ESTABLISHED, RELATED) |
| Rule yang dibutuhkan | Harus buat rule untuk kedua arah (in & out) | Cukup 1 rule untuk initiating traffic, response otomatis diizinkan |
| Performa | Lebih cepat per paket (less overhead) | Sedikit overhead (perlu maintain connection table) |
| Contoh | ACL router sederhana, packet filter dasar | iptables (conntrack), VPC firewall modern, Cloud Armor |
| Risiko kalau misconfigured | Koneksi legitimate gagal (lupa allow return traffic) | Connection table bisa jadi target DoS (exhaustion attack) |

### Allow/Deny Rule — Prinsip Dasar

```
Firewall Rule terdiri dari:

  Priority + Direction + Action + Protocol/Port + Source/Destination

  Contoh rule:
  Priority: 1000
  Direction: INGRESS (masuk)
  Action: ALLOW
  Protocol/Port: tcp:443
  Source: 0.0.0.0/0 (siapa saja)
  Target: tag "web-server"

  Artinya: "Izinkan traffic HTTPS masuk dari mana saja,
            ke server yang punya tag 'web-server'"

Default posture yang direkomendasikan:
  1. DENY ALL secara default (implicit atau explicit deny-all
     dengan priority paling rendah)
  2. ALLOW hanya port/protokol/source yang benar-benar dibutuhkan
  3. Ini disebut prinsip "default deny" / "least privilege network"
```

---

## Skenario: Merancang Traffic Flow untuk 3-Tier Web App

```
Requirement: Web app dengan tier Frontend (web), Backend (API), Database
             Hanya frontend yang boleh diakses publik.
```

```
                    INTERNET
                       │
                       ▼
        ┌─────────────────────────────┐
        │         FIREWALL              │  Rule: allow tcp:443 dari 0.0.0.0/0
        │   (edge / perimeter firewall) │        deny semua yang lain
        └──────────────┬───────────────┘
                       │ hanya port 443 lolos
                       ▼
        ┌─────────────────────────────┐
        │   LOAD BALANCER (L7)           │  - Terminasi TLS
        │   (reverse proxy)              │  - Routing berdasarkan path
        └──────────────┬───────────────┘    - Health check ke backend
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
      ┌────────┐  ┌────────┐  ┌────────┐
      │ Web-1   │  │ Web-2   │  │ Web-3   │   Tier: FRONTEND
      │(private │  │(private │  │(private │   Firewall: hanya allow traffic
      │  IP)    │  │  IP)    │  │  IP)    │   dari LB, TIDAK ada public IP
      └────┬───┘  └────┬───┘  └────┬───┘
           │           │           │
           └───────────┼───────────┘
                       ▼
        ┌─────────────────────────────┐
        │   INTERNAL LOAD BALANCER (L7) │   Tier: BACKEND/API
        │   (private, tidak exposed)    │   Firewall: hanya allow traffic
        └──────────────┬───────────────┘    dari tag "frontend"
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
      ┌────────┐  ┌────────┐  ┌────────┐
      │ API-1   │  │ API-2   │  │ API-3   │
      └────┬───┘  └────┬───┘  └────┬───┘
           │           │           │
           └───────────┼───────────┘
                       ▼
        ┌─────────────────────────────┐
        │        DATABASE                │   Tier: DATA
        │   (private subnet, no LB)      │   Firewall: hanya allow traffic
        │                                │   dari tag "backend", port 5432
        └─────────────────────────────┘    saja. TIDAK ADA akses internet.
```

| Tier | Exposed ke Internet? | Firewall Rule Utama | Load Balancer |
|------|----------------------|----------------------|-----------------|
| Frontend (Web) | Ya (via LB) | Allow 443 dari 0.0.0.0/0 hanya ke LB, backend server tidak punya public IP | L7 (path/host routing, TLS termination) |
| Backend (API) | Tidak | Allow traffic hanya dari tag/network frontend | Internal L7 LB (opsional, tergantung skala) |
| Database | Tidak | Allow traffic hanya dari tag/network backend, port DB saja | Tidak perlu (kecuali multi-primary/proxy khusus) |

**Best practice:** Setiap tier hanya boleh menerima traffic dari tier yang **langsung** di atasnya (frontend→backend→database), tidak boleh ada "shortcut" (misal frontend langsung akses database). Ini membatasi blast radius kalau salah satu tier ter-compromise.

---

## Ringkasan Konsep

```
Forward Proxy                       Reverse Proxy
  Mewakili CLIENT                     Mewakili SERVER
  Server tidak tahu IP client asli    Client tidak tahu topology server

Load Balancer Algorithms:
  Round Robin       → bergilir rata
  Least Connections → ke server paling idle
  IP Hash           → sticky session per client IP
  Weighted          → proporsional ke kapasitas server

L4 vs L7 Load Balancing:
  L4: routing by IP/port, cepat, tidak baca HTTP
  L7: routing by HTTP header/path/cookie, fleksibel, sedikit lebih lambat

Firewall:
  Stateless → cek setiap paket sendiri, butuh rule 2 arah
  Stateful  → ingat state koneksi, return traffic otomatis di-allow
  Default posture: DENY ALL, lalu ALLOW yang dibutuhkan saja

3-Tier Architecture Flow:
  Internet → Firewall → LB (L7, TLS termination) → Frontend
    → Internal LB → Backend/API → Database
  Setiap tier hanya terima traffic dari tier tepat di atasnya
```

---

*Dokumen ini membahas konsep networking & protokol yang bersifat umum/cloud-agnostic per 2026.*
