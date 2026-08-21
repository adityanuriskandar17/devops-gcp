# DNS (Domain Name System)

Dokumentasi tentang **DNS** — sistem yang menerjemahkan domain name yang mudah diingat manusia (`example.com`) menjadi IP address yang dimengerti komputer (`34.101.20.5`). Termasuk cara kerja resolusi step-by-step, jenis-jenis DNS record, konsep TTL & caching, dan skenario debugging masalah propagasi DNS.

---

## Apa itu DNS?

DNS sering disebut **"buku telepon internet"** — mengubah nama domain jadi IP address, karena komputer berkomunikasi menggunakan IP address, bukan nama.

```
Tanpa DNS:                          Dengan DNS:

  Ingat semua IP address:            Ingat nama domain saja:
  34.101.20.5   (shop)                shop.example.com
  142.250.4.10  (search)              google.com
  157.240.2.1   (social)              facebook.com
  ...                                 ...
  ❌ Tidak mungkin diingat            ✅ Mudah diingat & readable
     manusia biasa                       DNS handle terjemahannya
```

---

## Cara Kerja Resolusi DNS (Step by Step)

Saat browser butuh IP address dari sebuah domain, ada rangkaian query berjenjang yang terjadi — mulai dari cache lokal sampai ke authoritative server.

```
User ketik: www.shop.example.com

  ┌────────┐
  │ Browser │  1. Cek cache browser sendiri
  └───┬────┘     └── Ada? → langsung pakai, SELESAI
      │ Tidak ada di cache
      ▼
  ┌────────────────┐
  │ OS / Stub       │  2. Cek /etc/hosts & OS DNS cache
  │ Resolver        │     └── Ada? → langsung pakai, SELESAI
  └───┬────────────┘
      │ Tidak ada
      ▼
  ┌────────────────────┐
  │ Recursive Resolver   │  3. Query ke resolver (ISP / 8.8.8.8 / 1.1.1.1)
  │ (misal Google DNS)   │     Resolver ini yang akan "keliling" cari jawaban
  └───┬────────────────┘
      │ Resolver belum punya cache, mulai proses recursive lookup:
      │
      │ 4. Tanya Root Server (".")
      ▼
  ┌────────────────┐
  │ Root Name Server │  "Saya gak tau IP-nya, tapi authoritative
  │  (13 root cluster│   untuk .com ada di sini →"
  │   di seluruh dunia)│
  └───┬────────────┘
      │ 5. Tanya TLD Server (.com)
      ▼
  ┌────────────────────┐
  │ TLD Name Server      │  "Saya gak tau IP exact-nya, tapi
  │  (.com registry)     │   authoritative untuk example.com
  │                       │   ada di nameserver ini →"
  └───┬────────────────┘
      │ 6. Tanya Authoritative Server (example.com)
      ▼
  ┌────────────────────────┐
  │ Authoritative Name      │  "Ini jawabannya:
  │ Server (dikelola owner  │   www.shop.example.com = 34.101.20.5"
  │ domain / DNS provider)  │
  └───┬────────────────────┘
      │ 7. Jawaban dikirim balik berjenjang
      ▼
  Recursive Resolver → cache jawaban (sesuai TTL) → kirim ke client
      │
      ▼
  Browser terima IP: 34.101.20.5 → mulai TCP handshake ke IP tersebut
```

**Catatan:** Proses "tanya root → tanya TLD → tanya authoritative" disebut **recursive query** (dilakukan oleh resolver atas nama client). Dari sisi client ke resolver, itu disebut **iterative query sederhana** — client cuma tanya sekali, resolver yang kerja keras muter-muter.

---

## Jenis-Jenis DNS Record

| Record | Nama | Fungsi | Contoh |
|--------|------|--------|--------|
| **A** | Address | Mapping domain → IPv4 address | `shop.example.com → 34.101.20.5` |
| **AAAA** | IPv6 Address | Mapping domain → IPv6 address | `shop.example.com → 2001:db8::1` |
| **CNAME** | Canonical Name | Alias domain → domain lain (bukan IP langsung) | `www.example.com → example.com` |
| **MX** | Mail Exchange | Menentukan mail server penerima email domain | `example.com → 10 mail.example.com` |
| **TXT** | Text | Data teks bebas — sering untuk verifikasi & SPF/DKIM | `"v=spf1 include:_spf.google.com ~all"` |
| **NS** | Name Server | Menentukan authoritative name server untuk domain | `example.com → ns1.example.com` |
| **SRV** | Service | Lokasi service spesifik (host + port) | `_sip._tcp.example.com → 5 0 5060 sip.example.com` |
| **PTR** | Pointer | Reverse DNS — mapping IP → domain (kebalikan A record) | `5.20.101.34.in-addr.arpa → shop.example.com` |
| **SOA** | Start of Authority | Info admin zone, serial number, refresh/retry timing | Metadata zona DNS |
| **CAA** | Certification Authority Authorization | Membatasi CA mana yang boleh issue sertifikat untuk domain | `example.com → 0 issue "letsencrypt.org"` |

```
Ilustrasi CNAME vs A Record:

  A Record:                          CNAME Record:
  example.com → 34.101.20.5          www.example.com → example.com
       (langsung ke IP)                    (alias, resolve lagi ke A record)

  blog.example.com → 34.101.20.5     cdn.example.com → xyz.cloudfront.net
       (juga A record langsung)           (alias ke domain provider CDN)

  ⚠ CNAME tidak boleh dipasang di root domain (apex domain,
    misal "example.com" tanpa www) karena bentrok dengan
    record lain (NS, MX, SOA) yang wajib ada di root.
    Solusi: pakai A record, atau "ALIAS/ANAME" (proprietary,
    tergantung provider DNS).
```

---

## TTL (Time To Live) dan Caching

**TTL** adalah durasi (dalam detik) berapa lama sebuah DNS record boleh disimpan di cache sebelum resolver harus query ulang ke authoritative server.

```
DNS Record dengan TTL:

  shop.example.com.  3600  IN  A  34.101.20.5
                      │
                      └── TTL 3600 detik (1 jam)

  Timeline:
  00:00  Resolver query pertama kali → dapat jawaban, cache selama 1 jam
  00:15  Client lain query domain sama → resolver jawab dari CACHE (cepat!)
  00:59  Masih pakai cache (masih dalam TTL)
  01:00  Cache expired → resolver query ULANG ke authoritative server
```

| TTL Pendek (misal 60-300 detik) | TTL Panjang (misal 86400 detik / 24 jam) |
|----------------------------------|--------------------------------------------|
| ✅ Perubahan IP cepat ter-propagasi | ✅ Kurangi load ke authoritative server |
| ✅ Cocok untuk failover / migrasi server | ✅ Cocok untuk record yang stabil (jarang berubah) |
| ❌ Lebih banyak query ke authoritative server | ❌ Perubahan butuh waktu lama untuk ter-propagasi |
| ❌ Sedikit lebih lambat (less caching) | ❌ Rollback jadi lambat kalau ada kesalahan |

**Best practice:** Turunkan TTL (misal ke 300 detik / 5 menit) **beberapa jam sebelum** melakukan migrasi server atau perubahan IP penting, supaya propagasi lebih cepat saat perubahan benar-benar terjadi. Setelah migrasi selesai dan stabil, naikkan kembali TTL untuk mengurangi beban query.

---

## Skenario: Debugging "DNS Belum Propagasi"

```
Laporan: "Saya sudah ubah A record dari IP lama ke IP baru
          2 jam yang lalu, tapi sebagian user masih akses ke server lama!"
```

### Langkah Diagnosis

```
Step 1: Cek record yang tersimpan di authoritative server LANGSUNG
  (skip cache dengan query ke authoritative nameserver spesifik)

  $ dig shop.example.com @ns1.example.com

  ;; ANSWER SECTION:
  shop.example.com.  3600  IN  A  34.101.20.99   ← IP baru, SUDAH benar

  → Kesimpulan: record di authoritative server SUDAH benar.
    Masalahnya ada di propagasi cache, bukan konfigurasi.


Step 2: Cek TTL record LAMA sebelum diubah

  Kalau TTL record lama = 86400 (24 jam), dan baru diubah 2 jam lalu,
  maka resolver yang SUDAH sempat cache record lama SEBELUM perubahan
  akan tetap menyimpan IP lama selama sisa 22 jam ke depan.

  → Ini NORMAL, bukan bug. Ini disebut "DNS propagation delay"
    dan sepenuhnya dikontrol oleh TTL, BUKAN oleh "internet lambat".


Step 3: Cek dari beberapa resolver publik berbeda

  $ dig shop.example.com @8.8.8.8      # Google DNS
  $ dig shop.example.com @1.1.1.1      # Cloudflare DNS
  $ dig shop.example.com @9.9.9.9      # Quad9

  Kalau semua resolver publik SUDAH menunjukkan IP baru,
  tapi user tertentu masih lihat IP lama → kemungkinan:
  ├── User tersebut pakai resolver ISP yang cache-nya belum expired
  ├── OS user masih menyimpan cache DNS lokal
  └── Browser user masih menyimpan cache DNS browser


Step 4: Flush cache di sisi client (kalau perlu verifikasi cepat)

  # Windows
  ipconfig /flushdns

  # macOS
  sudo dscacheutil -flushcache

  # Linux (systemd-resolved)
  sudo systemd-resolve --flush-caches


Step 5: Selesai — komunikasikan ke user

  "Perubahan sudah benar di server. TTL record lama adalah 24 jam,
   jadi propagasi penuh butuh waktu sampai maksimal 24 jam dari
   waktu perubahan. Untuk migrasi berikutnya, kita akan turunkan
   TTL beberapa jam sebelumnya agar propagasi lebih cepat."
```

### Command dig — Membaca Output

```bash
$ dig shop.example.com

; <<>> DiG 9.18.1 <<>> shop.example.com
;; ANSWER SECTION:
shop.example.com.    300   IN    A    34.101.20.99
                      │      │     │        │
                      TTL   class  type    IP hasil resolusi

;; Query time: 24 msec
;; SERVER: 127.0.0.53#53(127.0.0.53)     ← resolver yang menjawab
```

| Flag `dig` | Fungsi |
|-----------|--------|
| `dig domain +short` | Tampilkan hanya IP hasil resolusi (tanpa detail lain) |
| `dig domain @resolver` | Query ke resolver/nameserver spesifik, skip cache lokal |
| `dig domain MX` | Query record tipe tertentu (MX, TXT, NS, dst.) |
| `dig domain +trace` | Tampilkan seluruh proses recursive dari root → authoritative |
| `dig -x IP_ADDRESS` | Reverse lookup — cari domain dari IP (PTR record) |

---

## Ringkasan Konsep

```
DNS Resolution Flow:
  Browser cache → OS cache → Recursive Resolver
    → Root Server → TLD Server → Authoritative Server
    → Jawaban di-cache sesuai TTL → dikirim balik ke client

Record Types:
  A        domain → IPv4
  AAAA     domain → IPv6
  CNAME    domain → domain lain (alias)
  MX       domain → mail server
  TXT      data teks bebas (SPF, verifikasi domain)
  NS       domain → authoritative nameserver
  SRV      host+port untuk service spesifik
  PTR      IP → domain (reverse DNS)

TTL:
  Menentukan lama cache disimpan sebelum query ulang
  TTL pendek  → propagasi cepat, load server lebih tinggi
  TTL panjang → propagasi lambat, load server lebih rendah
  Best practice: turunkan TTL SEBELUM migrasi, naikkan lagi SETELAH stabil

Debug propagasi DNS:
  1. dig ke authoritative server langsung (skip cache)
  2. Cek TTL record lama (itu = waktu tunggu propagasi maksimal)
  3. dig dari beberapa resolver publik (8.8.8.8, 1.1.1.1)
  4. Flush cache lokal kalau perlu verifikasi cepat
  5. "DNS belum propagasi" = normal & terprediksi via TTL,
     bukan tanda ada yang salah
```

---

*Dokumen ini membahas konsep networking & protokol yang bersifat umum/cloud-agnostic per 2026.*
