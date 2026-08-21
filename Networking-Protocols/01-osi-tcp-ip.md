# OSI & TCP/IP Model

Dokumentasi tentang **model layer networking** — kerangka konseptual untuk memahami bagaimana data berjalan dari satu komputer ke komputer lain, mulai dari sinyal listrik/cahaya di kabel sampai data yang dimengerti aplikasi. Termasuk perbandingan **TCP vs UDP**, konsep **port & socket**, dan bagaimana semua layer ini bekerja bersama saat membuka sebuah halaman web.

---

## Apa itu OSI Model?

**OSI (Open Systems Interconnection)** adalah model konseptual 7-layer yang membagi proses komunikasi network menjadi tahapan-tahapan spesifik. Model ini dibuat oleh ISO tahun 1984, dan meskipun implementasi nyata (internet) lebih dekat ke model TCP/IP, OSI tetap jadi **bahasa umum** untuk mendiskusikan masalah networking ("ini masalah Layer 3 atau Layer 7?").

```
┌─────────────────────────────────────────────────────────────┐
│  OSI 7 Layers (dari atas/aplikasi ke bawah/fisik)             │
│                                                               │
│  Layer 7  Application   ──  HTTP, DNS, SMTP, FTP, SSH         │
│  Layer 6  Presentation  ──  Encryption, encoding, TLS/SSL      │
│  Layer 5  Session       ──  Session management, login session │
│  Layer 4  Transport     ──  TCP, UDP (port, segmentasi)        │
│  Layer 3  Network       ──  IP, routing (IP address)           │
│  Layer 2  Data Link     ──  Ethernet, MAC address, switch      │
│  Layer 1  Physical      ──  Kabel, sinyal listrik/cahaya, WiFi │
└─────────────────────────────────────────────────────────────┘
```

### Tabel Detail 7 Layer

| Layer | Nama | Fungsi Utama | Unit Data | Contoh Protokol/Device |
|-------|------|--------------|-----------|------------------------|
| 7 | **Application** | Interface langsung ke user/aplikasi | Data | HTTP, HTTPS, DNS, SMTP, FTP, SSH |
| 6 | **Presentation** | Format, enkripsi, kompresi data | Data | TLS/SSL, JPEG, ASCII/Unicode encoding |
| 5 | **Session** | Buka/tutup/kelola sesi komunikasi | Data | Session token, NetBIOS, RPC |
| 4 | **Transport** | Reliable/unreliable delivery, segmentasi, port | Segment (TCP) / Datagram (UDP) | TCP, UDP |
| 3 | **Network** | Routing antar network, logical addressing | Packet | IP (IPv4/IPv6), ICMP, router |
| 2 | **Data Link** | Physical addressing dalam 1 network lokal | Frame | Ethernet, MAC address, switch, ARP |
| 1 | **Physical** | Transmisi bit mentah lewat medium fisik | Bit | Kabel UTP, fiber optic, radio WiFi, hub |

**Catatan:** Urutan menghafal yang umum dipakai: **"All People Seem To Need Data Processing"** (Application, Presentation, Session, Transport, Network, Data Link, Physical) — dari layer 7 ke 1.

---

## TCP/IP Model (4 Layer) — Model yang Sebenarnya Dipakai Internet

Internet nyata tidak strict mengikuti OSI 7-layer. Yang benar-benar dipakai adalah **TCP/IP model**, yang menyederhanakan jadi 4 layer.

```
Perbandingan OSI vs TCP/IP:

  OSI (7 Layer)              TCP/IP (4 Layer)
  ┌─────────────┐
  │ Application  │  ┐
  ├─────────────┤   │
  │ Presentation │   ├──────►  ┌─────────────┐
  ├─────────────┤   │          │ Application  │  (HTTP, DNS, SMTP, SSH)
  │ Session      │  ┘          └─────────────┘
  ├─────────────┤
  │ Transport    │  ──────►    ┌─────────────┐
  ├─────────────┤              │ Transport    │  (TCP, UDP)
  │ Network      │  ──────►    ├─────────────┤
  ├─────────────┤              │ Internet     │  (IP, ICMP)
  │ Data Link    │  ┐          ├─────────────┤
  ├─────────────┤   ├──────►   │ Network      │  (Ethernet, WiFi,
  │ Physical     │  ┘          │ Access       │   ARP)
  └─────────────┘              └─────────────┘
```

| TCP/IP Layer | Setara OSI | Fungsi | Contoh |
|--------------|-----------|--------|--------|
| **Application** | Layer 5-7 | Protokol yang langsung dipakai aplikasi | HTTP, HTTPS, DNS, SMTP, FTP, SSH |
| **Transport** | Layer 4 | End-to-end communication, port | TCP, UDP |
| **Internet** | Layer 3 | Routing paket antar network (IP address) | IP, ICMP, ARP |
| **Network Access** | Layer 1-2 | Transmisi fisik dalam 1 network lokal | Ethernet, WiFi, MAC address |

---

## TCP vs UDP

Keduanya adalah protokol **Layer 4 (Transport)**, tapi dengan filosofi yang sangat berbeda.

```
TCP (Transmission Control Protocol)     UDP (User Datagram Protocol)

  Connection-oriented                    Connectionless
  ┌──────┐        ┌──────┐              ┌──────┐        ┌──────┐
  │Client│───SYN──►│Server│              │Client│──data──►│Server│
  │      │◄SYN-ACK─│      │              │      │        │      │
  │      │───ACK──►│      │              └──────┘        └──────┘
  │      │◄─data──►│      │              (kirim langsung, tanpa
  │      │───FIN──►│      │               handshake, tanpa
  │      │◄─FIN-ACK│      │               konfirmasi diterima)
  └──────┘        └──────┘

  ✅ Reliable (ada acknowledgment)        ❌ Unreliable (fire and forget)
  ✅ Ordered (paket urut sesuai kirim)    ❌ Unordered (bisa datang acak)
  ✅ Error checking + retransmit          ❌ Tidak ada retransmit
  ❌ Overhead lebih besar, lebih lambat   ✅ Ringan, cepat, latency rendah
```

### Three-Way Handshake (TCP)

```
Client                                          Server
  │                                                │
  │  1. SYN (seq=100)                              │
  │  "Saya mau connect, sequence number saya 100"   │
  │ ───────────────────────────────────────────────►│
  │                                                │
  │  2. SYN-ACK (seq=300, ack=101)                  │
  │  "OK, saya terima. Sequence saya 300,           │
  │   saya expect data mulai dari 101"              │
  │ ◄───────────────────────────────────────────────│
  │                                                │
  │  3. ACK (ack=301)                               │
  │  "OK diterima, saya expect data mulai 301"      │
  │ ───────────────────────────────────────────────►│
  │                                                │
  │         === Koneksi TCP ESTABLISHED ===          │
  │                                                │
  │ ◄──────────────── data transfer ───────────────►│
  │                                                │
  │  4. FIN / FIN-ACK / ACK (four-way close)         │
  │  "Saya selesai kirim data, mau tutup koneksi"    │
  │ ───────────────────────────────────────────────►│
```

**Penting:** Handshake inilah alasan TCP disebut "lebih lambat" dibanding UDP — sebelum data pertama terkirim, harus ada 1.5 round-trip (SYN → SYN-ACK → ACK) hanya untuk membangun koneksi. Untuk koneksi HTTPS, di atas TCP handshake ini masih ada **TLS handshake** lagi (dibahas di [03-http-https-ssl-tls.md](03-http-https-ssl-tls.md)).

### Kapan Pakai TCP vs UDP

| Kriteria | TCP | UDP |
|----------|-----|-----|
| Reliability dibutuhkan | ✅ Ya (data harus lengkap & urut) | ❌ Tidak (boleh ada packet loss) |
| Latency kritis (real-time) | ❌ Kurang cocok | ✅ Ya |
| Contoh use case | Web (HTTP), email (SMTP), file transfer (FTP/SSH), database connection | Video call, VoIP, game online, DNS query, streaming, DHCP |
| Overhead header | Lebih besar (20+ byte) | Lebih kecil (8 byte) |
| Flow control & congestion control | Ada (built-in) | Tidak ada (harus di-handle app sendiri kalau perlu) |

```
Contoh nyata:
  DNS query          → UDP (port 53)  — cepat, kalau gagal tinggal retry
  DNS zone transfer  → TCP (port 53)  — perlu reliable, data besar
  Web browsing       → TCP (port 80/443)
  Video call (Zoom)  → UDP            — lebih baik ada sedikit glitch
                                         daripada delay menunggu retransmit
  Database (MySQL)   → TCP (port 3306) — data query harus lengkap & akurat
```

---

## Port & Socket

**Port** adalah nomor 0-65535 yang mengidentifikasi *layanan spesifik* dalam satu host. **Socket** adalah kombinasi (IP address + port + protokol) yang mengidentifikasi 1 koneksi unik.

```
Socket = IP Address + Port + Protocol

  Contoh koneksi browser ke web server:

  Client socket:  192.168.1.10:54321 (TCP)   ← port random/ephemeral
  Server socket:  34.101.20.5:443    (TCP)   ← port well-known (HTTPS)

  1 koneksi TCP diidentifikasi oleh PASANGAN socket ini.
  Server bisa handle ribuan koneksi sekaligus karena setiap
  client punya ephemeral port yang berbeda-beda.
```

| Range Port | Nama | Contoh |
|-----------|------|--------|
| 0 - 1023 | **Well-known ports** | 22 (SSH), 25 (SMTP), 53 (DNS), 80 (HTTP), 443 (HTTPS) |
| 1024 - 49151 | **Registered ports** | 3306 (MySQL), 5432 (PostgreSQL), 6379 (Redis), 8080 (HTTP alt) |
| 49152 - 65535 | **Dynamic/Ephemeral ports** | Dipakai OS untuk outgoing connection sementara |

| Service | Port | Protokol Transport |
|---------|------|---------------------|
| SSH | 22 | TCP |
| SMTP | 25 (submission: 587) | TCP |
| DNS | 53 | UDP (query) / TCP (zone transfer, response besar) |
| HTTP | 80 | TCP |
| HTTPS | 443 | TCP |
| FTP | 20 (data), 21 (control) | TCP |
| POP3 | 110 (995 untuk POP3S) | TCP |
| IMAP | 143 (993 untuk IMAPS) | TCP |
| MySQL | 3306 | TCP |
| PostgreSQL | 5432 | TCP |
| RDP | 3389 | TCP |

---

## Skenario: Melacak Layer Mana yang Terlibat saat Buka Halaman Web

```
User ketik https://shop.example.com di browser:

  Layer 7 (Application)
  │  Browser bentuk HTTP GET request:
  │    GET / HTTP/1.1
  │    Host: shop.example.com
  │
  ▼
  Layer 6 (Presentation) — dalam praktik disatukan ke TLS handshake
  │  Data di-enkripsi via TLS (karena HTTPS)
  │
  ▼
  Layer 5 (Session)
  │  TLS session dibuat, session ID/ticket disimpan
  │  untuk resume koneksi berikutnya lebih cepat
  │
  ▼
  Layer 4 (Transport)
  │  Data dipecah jadi TCP segments
  │  Source port: 54321 (ephemeral)
  │  Dest port: 443 (HTTPS)
  │  Three-way handshake terjadi di sini
  │
  ▼
  Layer 3 (Network)
  │  Setiap segment dibungkus jadi IP packet
  │  Source IP: 192.168.1.10 (client)
  │  Dest IP: 34.101.20.5 (server, hasil dari DNS lookup)
  │  Router menentukan rute terbaik (routing table)
  │
  ▼
  Layer 2 (Data Link)
  │  Packet dibungkus jadi Ethernet/WiFi frame
  │  Source MAC: aa:bb:cc:dd:ee:ff (network card client)
  │  Dest MAC: MAC dari default gateway/router terdekat
  │  (bukan MAC server — karena beda network, next hop dulu)
  │
  ▼
  Layer 1 (Physical)
  │  Frame dikonversi jadi sinyal listrik (kabel UTP/Ethernet)
  │  atau radio (WiFi) atau cahaya (fiber optic)
  │  dikirim lewat medium fisik ke ISP → internet backbone
  │  → data center tempat server berada
  ▼
  === Di sisi server, proses dibalik dari Layer 1 → Layer 7 ===
  === Server proses request, kirim response balik ===
```

**Best practice:** Saat troubleshooting, gunakan pemetaan layer untuk mempersempit masalah dengan cepat:
- Tidak connect sama sekali (timeout) → cek Layer 3/4 (routing, firewall, port)
- Connect tapi response salah/error → cek Layer 7 (aplikasi, HTTP)
- Koneksi putus-putus / lambat → cek Layer 1/2 (kabel, WiFi signal, NIC)
- Sertifikat invalid → cek Layer 6 (TLS/encryption)

---

## Ringkasan Konsep

```
OSI 7 Layer                      TCP/IP 4 Layer
┌──────────────┐
│ 7 Application │ ┐               ┌──────────────┐
│ 6 Presentation│ ├── mapped ke ──►│ Application   │
│ 5 Session     │ ┘               └──────────────┘
│ 4 Transport   │ ── mapped ke ──►┌──────────────┐
├──────────────┤                 │ Transport     │  (TCP/UDP)
│ 3 Network     │ ── mapped ke ──►├──────────────┤
├──────────────┤                 │ Internet      │  (IP)
│ 2 Data Link   │ ┐               ├──────────────┤
│ 1 Physical    │ ┴── mapped ke ─►│ Network Access│
└──────────────┘                 └──────────────┘

TCP                              UDP
  Connection-oriented              Connectionless
  Reliable, ordered                Unreliable, unordered
  Handshake (SYN/SYN-ACK/ACK)      Tidak ada handshake
  Cocok: web, database, email      Cocok: video call, DNS, gaming

Port & Socket:
  Port  = nomor identifikasi service (0-65535)
  Socket = IP + Port + Protocol = 1 koneksi unik

Debug shortcut:
  Tidak connect     → cek Layer 3/4 (IP, port, firewall)
  Response salah    → cek Layer 7 (aplikasi)
  Lambat/putus      → cek Layer 1/2 (fisik)
  Cert invalid      → cek Layer 6 (TLS)
```

---

*Dokumen ini membahas konsep networking & protokol yang bersifat umum/cloud-agnostic per 2026.*
