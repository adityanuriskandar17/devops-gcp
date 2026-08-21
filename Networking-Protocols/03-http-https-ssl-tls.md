# HTTP/HTTPS & SSL/TLS

Dokumentasi tentang **HTTP** (protokol dasar web), **HTTPS** (HTTP + enkripsi), dan **SSL/TLS** (protokol enkripsi di baliknya). Termasuk struktur request/response, kategori status code, perbandingan HTTP/1.1 vs HTTP/2 vs HTTP/3, tahapan TLS handshake, dan konsep chain of trust sertifikat.

---

## Struktur HTTP Request & Response

HTTP (**HyperText Transfer Protocol**) adalah protokol **Layer 7 (Application)** yang berjalan di atas TCP (atau UDP untuk HTTP/3), berbasis model **request-response**.

```
Struktur HTTP Request:

  GET /products?id=123 HTTP/1.1          ← Request line (method, path, version)
  Host: shop.example.com                  ┐
  User-Agent: Mozilla/5.0                 │
  Accept: text/html,application/json      ├── Headers (metadata)
  Cookie: session=abc123                  │
  Authorization: Bearer eyJhbGc...        ┘
                                          ← baris kosong (pemisah)
  { "search": "laptop" }                  ← Body (optional, untuk POST/PUT)


Struktur HTTP Response:

  HTTP/1.1 200 OK                         ← Status line (version, code, message)
  Content-Type: application/json          ┐
  Content-Length: 348                      ├── Headers
  Cache-Control: max-age=3600              │
  Set-Cookie: session=abc123; HttpOnly     ┘
                                          ← baris kosong
  { "id": 123, "name": "Laptop X" }       ← Body (data hasil)
```

### HTTP Methods

| Method | Fungsi | Idempotent? | Contoh Use Case |
|--------|--------|-------------|------------------|
| **GET** | Ambil data | Ya | Load halaman, ambil list produk |
| **POST** | Kirim data baru / buat resource | Tidak | Submit form, buat order baru |
| **PUT** | Update seluruh resource (replace) | Ya | Update profil user (full replace) |
| **PATCH** | Update sebagian resource | Tidak (umumnya) | Update 1 field saja (misal nomor telepon) |
| **DELETE** | Hapus resource | Ya | Hapus item dari cart |
| **HEAD** | Sama seperti GET tapi tanpa body response | Ya | Cek resource ada/tidak tanpa download isi |
| **OPTIONS** | Tanya method apa saja yang didukung endpoint | Ya | CORS preflight request |

---

## Kategori HTTP Status Code

| Range | Kategori | Arti | Contoh |
|-------|----------|------|--------|
| **1xx** | Informational | Request diterima, proses berlanjut | `100 Continue` |
| **2xx** | Success | Request berhasil diproses | `200 OK`, `201 Created`, `204 No Content` |
| **3xx** | Redirection | Perlu action tambahan (biasanya redirect) | `301 Moved Permanently`, `302 Found`, `304 Not Modified` |
| **4xx** | Client Error | Kesalahan dari sisi client (request salah) | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests` |
| **5xx** | Server Error | Kesalahan dari sisi server | `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout` |

```
Perbedaan penting yang sering ditanya saat interview/debugging:

  401 Unauthorized       vs   403 Forbidden
  "Kamu belum login/          "Kamu SUDAH teridentifikasi,
   identitas tidak valid"      tapi TIDAK PUNYA IZIN akses ini"

  502 Bad Gateway         vs   504 Gateway Timeout
  "Proxy/LB terhubung ke       "Proxy/LB terhubung ke backend,
   backend, tapi backend        tapi backend TIDAK MERESPON
   memberi respon tidak valid   dalam batas waktu (timeout)"
   / crash / connection refused"

  502/503/504 = biasanya masalah di backend/infrastruktur,
                BUKAN masalah di kode aplikasi frontend
```

**Best practice:** `429 Too Many Requests` sebaiknya selalu disertai header `Retry-After` agar client tahu kapan boleh mencoba lagi — penting untuk desain rate limiting yang baik.

---

## HTTP/1.1 vs HTTP/2 vs HTTP/3

| Aspek | HTTP/1.1 | HTTP/2 | HTTP/3 (QUIC) |
|-------|----------|--------|----------------|
| Tahun rilis | 1997 | 2015 | 2022 |
| Transport | TCP | TCP | **UDP** (via QUIC) |
| Multiplexing | ❌ Tidak (1 request per koneksi TCP, atau perlu banyak koneksi paralel) | ✅ Ya (banyak stream dalam 1 koneksi TCP) | ✅ Ya (banyak stream dalam 1 koneksi QUIC) |
| Head-of-line blocking | Ya (parah) | Berkurang (di level HTTP), tapi masih ada di level TCP | Tidak (QUIC handle per-stream, TCP-level HOL blocking hilang) |
| Header compression | Tidak ada | HPACK | QPACK |
| Enkripsi | Opsional (HTTP vs HTTPS) | Umumnya selalu TLS (de facto) | Wajib TLS 1.3 (built-in ke QUIC) |
| Handshake untuk koneksi baru | TCP handshake + TLS handshake (terpisah) | TCP handshake + TLS handshake (terpisah) | Gabungan (QUIC handshake termasuk TLS 1.3 sekaligus, lebih sedikit round-trip) |
| Server Push | Tidak ada | Ada (jarang dipakai, banyak dihapus browser modern) | Tidak ada |
| Cocok untuk | Kompatibilitas lama, sistem legacy | Web modern, umum dipakai sekarang | Koneksi mobile/lossy network, latency sangat rendah |

```
Ilustrasi Multiplexing:

  HTTP/1.1 (tanpa pipelining):        HTTP/2 (multiplexing):

  Request 1 ──► [tunggu response] ──► Request 1 ─┐
  Request 2 ──► [tunggu response] ──► Request 2 ─┼──► semua dikirim
  Request 3 ──► [tunggu response] ──► Request 3 ─┘    BERSAMAAN dalam
                                                       1 koneksi TCP,
  Butuh banyak koneksi TCP paralel                    respons bisa
  (browser biasa buka 6 koneksi                        datang out-of-order
   per domain) untuk paralelisasi                      lalu di-reassemble
```

**Catatan:** HTTP/3 memakai **QUIC** yang berjalan di atas UDP (bukan TCP) — kedengarannya aneh karena UDP itu unreliable, tapi QUIC mengimplementasikan reliability-nya sendiri di layer aplikasi, sehingga bebas dari batasan TCP (terutama head-of-line blocking) sambil tetap reliable.

---

## TLS Handshake

**TLS (Transport Layer Security)** adalah protokol enkripsi yang membuat HTTP menjadi HTTPS. SSL adalah pendahulu TLS (SSL sudah deprecated/tidak dipakai lagi, tapi istilah "SSL certificate" masih dipakai sehari-hari untuk merujuk ke sertifikat TLS).

```
TLS 1.3 Handshake (disederhanakan):

  Client                                          Server
    │                                               │
    │  1. ClientHello                                │
    │  "Ini cipher suite yang saya dukung,           │
    │   ini random number saya, saya mau ke           │
    │   domain shop.example.com (SNI)"                │
    │ ──────────────────────────────────────────────► │
    │                                                │
    │  2. ServerHello + Certificate + Key Exchange     │
    │  "OK, pakai cipher ini. Ini sertifikat saya      │
    │   (isinya public key), ini juga key exchange     │
    │   parameter saya"                                │
    │ ◄────────────────────────────────────────────── │
    │                                                │
    │  3. Client verifikasi sertifikat server:          │
    │     - Apakah ditandatangani CA terpercaya?        │
    │     - Apakah domain di sertifikat cocok?          │
    │     - Apakah belum expired?                       │
    │     ✅ Valid → lanjut                              │
    │     ❌ Invalid → browser tampilkan warning!         │
    │                                                │
    │  4. Client & Server hitung shared secret key       │
    │     (via key exchange, misal ECDHE)                │
    │     TANPA pernah mengirim secret key itu sendiri    │
    │     lewat network (forward secrecy)                │
    │                                                │
    │  5. Finished (terenkripsi dengan key baru)         │
    │ ◄──────────────────────────────────────────────► │
    │                                                │
    │      === Koneksi terenkripsi, siap kirim data ===   │
    │                                                │
    │ ◄──────────── HTTP request/response (encrypted) ──► │
```

**Penting:** TLS 1.3 menyederhanakan handshake dari 2 round-trip (TLS 1.2) menjadi 1 round-trip, mempercepat koneksi HTTPS baru secara signifikan. Ini salah satu alasan upgrade dari TLS 1.2 ke TLS 1.3 direkomendasikan di semua server modern.

---

## Certificate Chain (Chain of Trust)

Sertifikat TLS tidak berdiri sendiri — ia divalidasi lewat rantai kepercayaan sampai ke **Root CA** yang sudah ditanam (pre-installed) di OS/browser.

```
Chain of Trust:

  ┌─────────────────────────────────────┐
  │  Root CA Certificate                  │  ← Self-signed, sudah
  │  (misal: ISRG Root X1, DigiCert Root) │     ditanam di OS/browser
  │  Sangat dijaga, offline, rarely used  │     sebagai "trust anchor"
  └───────────────┬───────────────────────┘
                  │ menandatangani
                  ▼
  ┌─────────────────────────────────────┐
  │  Intermediate CA Certificate           │  ← Dipakai untuk day-to-day
  │  (misal: Let's Encrypt R3/R10/R11)    │     signing, agar Root CA
  │                                       │     private key tidak sering
  │                                       │     dipakai (lebih aman)
  └───────────────┬───────────────────────┘
                  │ menandatangani
                  ▼
  ┌─────────────────────────────────────┐
  │  Leaf / Server Certificate             │  ← Sertifikat domain kamu
  │  (shop.example.com)                    │     (yang dipasang di server)
  │  Berisi: domain, public key, validity   │
  └─────────────────────────────────────┘

  Browser verifikasi dengan cara:
  Leaf → ditandatangani oleh Intermediate? ✅
  Intermediate → ditandatangani oleh Root? ✅
  Root → ada di trust store browser/OS? ✅
  → Chain VALID, koneksi dipercaya
```

| Jenis Sertifikat | Validasi | Contoh Provider |
|-------------------|----------|-------------------|
| **DV (Domain Validated)** | Hanya verifikasi kepemilikan domain | Let's Encrypt, ZeroSSL |
| **OV (Organization Validated)** | Verifikasi domain + identitas organisasi | DigiCert, Sectigo |
| **EV (Extended Validation)** | Verifikasi mendalam legal & operasional organisasi | DigiCert EV, dulu tampil green bar (sudah tidak umum di browser modern) |

---

## Skenario: Diagnosis Insiden Sertifikat SSL Expired

```
Laporan: "Tiba-tiba semua user lihat warning 'Your connection
          is not private' saat akses https://shop.example.com!"
```

### Langkah Diagnosis

```
Step 1: Cek detail sertifikat langsung dari server

  $ echo | openssl s_client -connect shop.example.com:443 \
      2>/dev/null | openssl x509 -noout -dates

  notBefore=Feb 10 00:00:00 2026 GMT
  notAfter=May 11 23:59:59 2026 GMT   ← sudah lewat tanggal ini!

  → Kesimpulan: sertifikat memang EXPIRED, bukan false alarm.


Step 2: Cek kenapa auto-renewal gagal (kalau pakai Let's Encrypt/ACME)

  $ certbot certificates
  $ journalctl -u certbot.timer --since "7 days ago"

  Kemungkinan root cause:
  ├── Cron job / systemd timer renewal tidak jalan (service mati)
  ├── Rate limit dari CA (terlalu banyak percobaan gagal)
  ├── Domain validation gagal (DNS/HTTP challenge tidak accessible,
  │   misal firewall blok port 80 yang dibutuhkan HTTP-01 challenge)
  └── Sertifikat di-generate manual dan lupa di-renew (tidak automated)


Step 3: Renew sertifikat segera

  $ certbot renew --force-renewal
  $ systemctl reload nginx     # reload agar sertifikat baru dipakai


Step 4: Verifikasi ulang

  $ echo | openssl s_client -connect shop.example.com:443 \
      2>/dev/null | openssl x509 -noout -dates

  notAfter=Aug 21 23:59:59 2026 GMT   ← sudah diperpanjang ✅


Step 5: Perbaikan permanen — cegah terulang

  ├── Pasang monitoring expiry sertifikat (alert 30/14/7 hari sebelum expired)
  ├── Pastikan auto-renewal berjalan via cron/systemd timer + healthcheck
  ├── Pertimbangkan sertifikat wildcard/multi-domain untuk kurangi jumlah
  │   sertifikat yang perlu dikelola manual
  └── Set reminder kalender untuk sertifikat yang TIDAK auto-renew
      (misal sertifikat OV/EV yang butuh proses manual tahunan)
```

**Best practice:** Selalu automasi renewal sertifikat (Let's Encrypt dengan certbot/ACME client) dan pasang **uptime/SSL monitoring** yang mengecek expiry date secara berkala — jangan andalkan human memory untuk hal berulang seperti ini.

---

## Ringkasan Konsep

```
HTTP Request/Response:
  Request  = Method + Path + Version, Headers, Body(optional)
  Response = Version + Status Code + Message, Headers, Body

Status Code:
  1xx Informational   2xx Success   3xx Redirect
  4xx Client Error     5xx Server Error

HTTP/1.1 vs HTTP/2 vs HTTP/3:
  1.1: TCP, no multiplexing, head-of-line blocking parah
  2:   TCP, multiplexing di level HTTP, HOL blocking di level TCP
  3:   UDP (QUIC), multiplexing penuh, HOL blocking hilang

TLS Handshake:
  ClientHello → ServerHello+Cert → Verify chain
  → Key Exchange → Finished → Encrypted data transfer

Chain of Trust:
  Root CA (trust anchor di OS/browser)
    → Intermediate CA (signing day-to-day)
      → Leaf Certificate (sertifikat domain kamu)

Diagnosis expired cert:
  openssl s_client + x509 -noout -dates → cek expiry
  Cek kenapa auto-renewal gagal → fix root cause
  Renew segera → verifikasi → pasang monitoring expiry
```

---

*Dokumen ini membahas konsep networking & protokol yang bersifat umum/cloud-agnostic per 2026.*
