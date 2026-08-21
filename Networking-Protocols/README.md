# Networking & Protocols Fundamentals

Dokumentasi **konsep dasar networking dan protokol** yang bersifat **cloud-agnostic** — berlaku di GCP, AWS, Azure, on-premise, atau infrastruktur apapun. Topik ini adalah fondasi yang harus dipahami sebelum mendalami service cloud spesifik (VPC, Load Balancer, Cloud Armor, dll), karena semua service tersebut hanyalah **implementasi** dari konsep networking universal yang dibahas di sini.

---

## Kenapa DevOps Perlu Paham Networking?

Sebagian besar incident production **bukan** disebabkan oleh bug aplikasi, melainkan oleh masalah networking: DNS salah konfigurasi, sertifikat TLS expired, firewall rule terlalu ketat/longgar, load balancer salah algoritma, koneksi timeout karena packet loss, dan seterusnya.

```
Tanpa paham networking:                Dengan paham networking:

  "Website down, gak tau kenapa"         "DNS resolve ke IP lama →
   → panik, restart semua service          TTL belum expired → cek
   → masih down → escalate ke              dig, flush cache resolver,
     senior → 2 jam baru ketemu             tunggu propagasi → fixed
     root cause (DNS TTL 24 jam)            dalam 5 menit"

  ❌ Trial and error                     ✅ Diagnosis sistematis
  ❌ Downtime lebih lama                 ✅ Root cause jelas
  ❌ Tidak reproducible                  ✅ Bisa didokumentasikan
```

**Penting:** Semua service cloud (Load Balancer, CDN, Cloud Armor, VPC, dst.) pada akhirnya adalah **abstraksi** di atas protokol standar: TCP/IP, HTTP, TLS, DNS. Kalau paham protokolnya, memahami dan men-debug service cloud apapun jadi jauh lebih mudah — bahkan ketika pindah provider.

---

## Perjalanan Satu Request

Gambaran umum apa yang terjadi ketika user mengetik URL di browser — setiap tahap ini dibahas mendalam di dokumen 01-06.

```
User ketik: https://app.example.com

  ┌────────┐   1. DNS Lookup    ┌──────────────┐
  │ Browser │ ─────────────────►│  DNS Resolver │
  │ (Client)│                    │ (ISP/8.8.8.8) │
  └───┬────┘◄─────────────────── └──────────────┘
      │        IP: 34.101.x.x
      │
      │ 2. TCP Handshake (SYN, SYN-ACK, ACK)
      │ 3. TLS Handshake (jika HTTPS)
      ▼
  ┌─────────────────────────────────────────┐
  │     Reverse Proxy / Load Balancer         │
  │     (Nginx, HAProxy, Cloud LB, dst.)       │
  │     - Terminasi TLS                        │
  │     - Firewall / WAF check                 │
  │     - Pilih backend (round robin, dll.)    │
  └───────────────────┬───────────────────────┘
                      │ 4. Forward HTTP request
                      ▼
              ┌───────────────┐
              │  App Server 1  │ ◄── bisa banyak instance
              │  App Server 2  │
              │  App Server 3  │
              └───────┬───────┘
                      │ 5. Query data
                      ▼
              ┌───────────────┐
              │    Database     │
              └───────────────┘
                      │
                      ▼
      6. Response dikirim balik: Server → LB → Client
      7. Browser render HTML/CSS/JS
```

| Tahap | Yang Terjadi | Dibahas di |
|-------|-------------|-----------|
| DNS Lookup | Domain diterjemahkan jadi IP address | [02-dns.md](02-dns.md) |
| TCP/UDP transport | Reliable/unreliable data transfer, three-way handshake | [01-osi-tcp-ip.md](01-osi-tcp-ip.md) |
| TLS Handshake | Enkripsi koneksi, verifikasi sertifikat | [03-http-https-ssl-tls.md](03-http-https-ssl-tls.md) |
| Proxy / Load Balancer | Distribusi traffic, terminasi TLS, firewall | [04-proxy-load-balancer-firewall.md](04-proxy-load-balancer-firewall.md) |
| Akses server (admin) | SSH, SFTP, tunneling | [05-ssh-ftp.md](05-ssh-ftp.md) |
| Notifikasi (email) | SMTP, SPF/DKIM/DMARC | [06-email-protocols.md](06-email-protocols.md) |

---

## Daftar Dokumentasi

| # | File | Isi |
|---|------|-----|
| 01 | [OSI & TCP/IP Model](01-osi-tcp-ip.md) | 7 layer OSI, 4 layer TCP/IP, TCP vs UDP, three-way handshake, port & socket |
| 02 | [DNS](02-dns.md) | Cara kerja resolusi DNS, record types, TTL, caching, debugging propagasi |
| 03 | [HTTP/HTTPS & SSL/TLS](03-http-https-ssl-tls.md) | Struktur request/response, status code, HTTP/1.1 vs 2 vs 3, TLS handshake, chain of trust |
| 04 | [Proxy, Load Balancer & Firewall](04-proxy-load-balancer-firewall.md) | Forward vs reverse proxy, caching, algoritma load balancing, L4 vs L7, firewall stateful/stateless |
| 05 | [SSH & FTP](05-ssh-ftp.md) | SSH architecture, key pair, SFTP vs FTP vs FTPS, port forwarding/tunneling |
| 06 | [Email Protocols](06-email-protocols.md) | SMTP vs IMAP vs POP3, SPF/DKIM/DMARC, whitelisting/greylisting, debug spam |
| 07 | [Commands Cheatsheet](07-commands-cheatsheet.md) | dig, nslookup, ping, traceroute, mtr, netstat, ss, nc, curl, tcpdump |
| 08 | [Best Practices](08-best-practices.md) | Network segmentation, least-privilege firewall, TLS everywhere, checklist production |

---

## Quick Start

Urutan belajar yang disarankan kalau kamu baru mulai dari nol:

```
1. Baca 01-osi-tcp-ip.md
   → Pahami dasar: layer, TCP vs UDP, port
   
2. Baca 02-dns.md
   → Pahami bagaimana domain jadi IP address

3. Baca 03-http-https-ssl-tls.md
   → Pahami HTTP request/response dan enkripsi TLS

4. Baca 04-proxy-load-balancer-firewall.md
   → Pahami bagaimana traffic didistribusikan & diamankan

5. Baca 05-ssh-ftp.md & 06-email-protocols.md
   → Pahami protokol operasional harian (akses server, email)

6. Praktik dengan 07-commands-cheatsheet.md
   → dig, curl, ping, tcpdump — langsung coba di terminal

7. Terapkan 08-best-practices.md
   → Checklist sebelum production
```

**Best practice:** Setiap kali menemukan istilah baru di dokumentasi service cloud spesifik (misal "backend service health check" di GCP, atau "target group" di AWS), coba hubungkan dulu ke konsep dasar di sini (health check = bagian dari load balancing, dibahas di 04). Ini membuat pengetahuan lebih transferable antar cloud provider.

---

*Dokumen ini membahas konsep networking & protokol yang bersifat umum/cloud-agnostic per 2026.*
