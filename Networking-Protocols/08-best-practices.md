# Best Practices — Networking & Protocols

Panduan praktik terbaik untuk desain dan operasional networking yang **cloud-agnostic** — berlaku baik infrastruktur di GCP, AWS, on-premise, maupun hybrid. Mencakup segmentasi network, firewall least-privilege, TLS everywhere, tuning DNS TTL, monitoring, dan checklist kesiapan production.

---

## 1. Network Segmentation

Memisahkan network jadi beberapa zona/tier agar blast radius insiden terbatas.

| Practice | Alasan |
|----------|--------|
| Pisahkan tier: public (frontend), private (backend/app), data (database) | Kompromi 1 tier tidak otomatis mengekspos tier lain |
| Database & backend **TIDAK punya public IP** | Mengurangi attack surface — akses hanya lewat tier di atasnya |
| Gunakan subnet berbeda per tier/environment (prod, staging, dev) | Isolasi jelas, kesalahan konfigurasi di 1 environment tidak menular |
| Terapkan micro-segmentation untuk service kritis (misal database keuangan) | Setiap service hanya bisa diakses oleh service yang benar-benar butuh |

```
Segmentasi yang baik:

  Internet
     │
  ┌──▼───────────┐
  │ Public Subnet  │  ← LB, reverse proxy (satu-satunya yang exposed)
  └──┬───────────┘
     │ hanya traffic dari LB
  ┌──▼───────────┐
  │ Private Subnet │  ← App server / backend (tidak ada public IP)
  └──┬───────────┘
     │ hanya traffic dari app tier
  ┌──▼───────────┐
  │ Data Subnet    │  ← Database (paling terisolasi, tidak ada akses
  └──────────────┘     internet keluar/masuk sama sekali)
```

**Penting:** Jangan taruh semua resource dalam 1 subnet/network flat "karena lebih simpel" — ini adalah anti-pattern yang membuat 1 titik kompromi (misal 1 app server ter-hack) langsung berisiko mengekspos seluruh infrastruktur, termasuk database.

---

## 2. Least-Privilege Firewall Rules

| Practice | Cara Menerapkan |
|----------|-------------------|
| Default posture: **deny all**, lalu allow spesifik | Jangan mulai dari "allow all lalu tambah deny" — mulai dari "deny all lalu tambah allow" |
| Hindari source `0.0.0.0/0` kecuali benar-benar untuk public-facing service | Batasi source ke CIDR/IP/tag spesifik yang memang butuh akses |
| Gunakan tag/label untuk target rule, bukan "all instances" | Rule lebih presisi, mudah di-audit per fungsi server |
| Buka **port sesempit mungkin** — 1 port spesifik, bukan range besar | Mengurangi kemungkinan port lain yang tidak sengaja terbuka disalahgunakan |
| Review firewall rule secara berkala, hapus yang tidak terpakai | Rule lama yang menumpuk sering jadi celah keamanan tersembunyi |
| Pisahkan rule administrative access (SSH/RDP) dari rule traffic aplikasi | SSH/RDP sebaiknya hanya dari IP kantor/VPN/bastion, bukan 0.0.0.0/0 |

```
❌ Buruk:                              ✅ Baik:

  Allow ANY → ANY on ANY port           Allow 0.0.0.0/0 → tag:web on tcp:443
  (rule tunggal, sangat longgar)        Allow tag:web → tag:backend on tcp:8080
                                         Allow tag:backend → tag:db on tcp:5432
                                         Deny ALL lainnya (implicit/explicit)
```

---

## 3. TLS Everywhere

**Best practice:** Enkripsi seharusnya menjadi **default**, bukan pengecualian — baik traffic yang menghadap publik maupun traffic internal antar service.

| Protokol Plaintext | Ganti Dengan | Alasan |
|---------------------|----------------|--------|
| HTTP | HTTPS (TLS) | Mencegah eavesdropping & man-in-the-middle pada data & cookie/session |
| FTP | SFTP atau FTPS | Password & data file tidak boleh plaintext di network |
| Telnet | SSH | Telnet mengirim kredensial & seluruh sesi tanpa enkripsi sama sekali |
| SMTP tanpa STARTTLS | SMTP + STARTTLS / SMTPS | Email (termasuk kredensial auth) bisa disadap di transit |

```
⚠ Penting: TLS internal (service-to-service) sering diabaikan
  karena "toh di dalam network privat sendiri" — tapi asumsi ini
  berbahaya kalau ada 1 titik kompromi di dalam network (lateral
  movement attacker). Prinsip modern "Zero Trust" mengasumsikan
  network internal TIDAK otomatis aman, sehingga TLS/mTLS antar
  service tetap direkomendasikan untuk data sensitif.
```

| Practice | Detail |
|----------|--------|
| Gunakan TLS 1.2 minimum, TLS 1.3 jika memungkinkan | TLS 1.0/1.1 sudah deprecated, punya kelemahan keamanan diketahui |
| Automasi renewal sertifikat (ACME/Let's Encrypt/certbot) | Hindari expired certificate karena lupa renew manual |
| Redirect semua traffic HTTP → HTTPS (301) | Jangan biarkan opsi plaintext tetap terbuka |
| Set header `Strict-Transport-Security` (HSTS) | Memaksa browser selalu pakai HTTPS untuk domain tersebut ke depannya |
| Gunakan sertifikat wildcard/SAN untuk banyak subdomain | Kurangi jumlah sertifikat yang perlu dikelola manual |

---

## 4. DNS TTL Tuning untuk Failover

| Skenario | TTL yang Disarankan | Alasan |
|----------|------------------------|--------|
| Record stabil, jarang berubah (misal MX, NS) | Panjang (86400 detik / 24 jam) | Kurangi load query, tidak butuh propagasi cepat |
| Sebelum migrasi/maintenance terjadwal | Turunkan ke pendek (300 detik) beberapa jam/hari sebelumnya | Propagasi perubahan cepat saat migrasi benar-benar terjadi |
| Record untuk failover otomatis (health-check based DNS) | Sangat pendek (60 detik atau kurang) | Client harus cepat pindah ke endpoint sehat saat terjadi outage |
| Setelah migrasi selesai & stabil | Naikkan kembali TTL ke normal | Kembalikan efisiensi caching setelah tidak ada perubahan mendadak |

```
Timeline yang direkomendasikan untuk migrasi server:

  T-24 jam   Turunkan TTL A record dari 86400 → 300 detik
  T-1 jam    Pastikan TTL rendah sudah ter-propagasi penuh
  T-0        Lakukan switch IP / migrasi
  T+1 jam    Verifikasi traffic sudah pindah ke server baru
  T+24 jam   Setelah stabil, naikkan TTL kembali ke normal
```

**Catatan:** TTL rendah bukan tanpa biaya — makin rendah TTL, makin sering resolver query ulang ke authoritative server, meningkatkan beban query DNS. Untuk service dengan traffic sangat tinggi, pertimbangkan trade-off ini, dan gunakan TTL rendah hanya saat memang dibutuhkan (jendela migrasi/failover), bukan permanen.

---

## 5. Monitoring Latency & Packet Loss

| Yang Dimonitor | Tool/Metode | Threshold Umum untuk Alert |
|-----------------|-------------|-------------------------------|
| Latency (round-trip time) | Uptime check, `ping`/`mtr` terjadwal | Alert kalau > 2x baseline normal |
| Packet loss | `mtr` report mode terjadwal, monitoring platform | Alert kalau loss > 1-2% konsisten |
| DNS resolution time | Synthetic monitoring, `dig` dengan timing | Alert kalau resolusi > 200-500ms |
| TLS certificate expiry | Uptime check dengan SSL monitoring | Alert 30/14/7 hari sebelum expired |
| Error rate HTTP (4xx/5xx) | Log-based metrics, reverse proxy access log | Alert kalau error rate > baseline signifikan |
| Bandwidth/throughput | Network monitoring (interface stats) | Alert mendekati kapasitas link (misal > 80%) |

```
Kombinasi monitoring yang baik:

  Layer 7 (Application)  → Uptime check HTTP, response time, status code
  Layer 4 (Transport)    → Koneksi TCP established/refused, port reachability
  Layer 3 (Network)      → Latency, packet loss antar region (mtr terjadwal)
  DNS                    → Resolution time, TTL expiry tracking
  TLS                    → Certificate expiry, handshake failure rate
```

**Best practice:** Monitoring hanya di level aplikasi (misal cek endpoint `/health` return 200) **tidak cukup** — insiden networking (DNS, TLS, packet loss di jalur tertentu) sering tidak terlihat di health check aplikasi sampai user benar-benar terdampak. Kombinasikan monitoring di beberapa layer sekaligus.

---

## 6. Checklist Kesiapan Production

```
DNS:
  [ ] TTL record sesuai kebutuhan (tidak terlalu panjang untuk record kritis)
  [ ] SPF, DKIM, DMARC dikonfigurasi untuk domain pengirim email
  [ ] CAA record diset untuk membatasi CA yang boleh issue sertifikat
  [ ] Reverse DNS (PTR) dikonfigurasi untuk IP pengirim email

TLS/HTTPS:
  [ ] Semua traffic publik pakai HTTPS, HTTP redirect ke HTTPS
  [ ] TLS minimum 1.2, idealnya 1.3
  [ ] Sertifikat auto-renewal terpasang & tervalidasi jalan
  [ ] Monitoring expiry sertifikat aktif (alert 30/14/7 hari)
  [ ] HSTS header diset untuk domain production

Firewall & Network:
  [ ] Default deny-all, allow rule sesempit mungkin
  [ ] Tidak ada source 0.0.0.0/0 untuk port administrative (SSH/RDP)
  [ ] Database & backend tidak punya public IP
  [ ] Network segmentation per tier (public/private/data)
  [ ] Firewall rule di-review, rule tidak terpakai sudah dihapus

Load Balancer:
  [ ] Health check dikonfigurasi & terverifikasi mendeteksi backend unhealthy
  [ ] Algoritma load balancing sesuai karakteristik traffic
  [ ] TLS termination dikonfigurasi dengan sertifikat valid
  [ ] Minimal 2 backend instance untuk high availability

SSH/Akses Remote:
  [ ] Password authentication dimatikan, hanya key-based
  [ ] 1 key pair per device/context (bukan shared key)
  [ ] Akses SSH dibatasi ke IP/network tertentu (bukan 0.0.0.0/0)
  [ ] Proses revoke akses jelas untuk offboarding

Monitoring:
  [ ] Uptime check aktif untuk endpoint publik
  [ ] Alert latency & packet loss terpasang
  [ ] Alert error rate HTTP (4xx/5xx) terpasang
  [ ] Notification channel (email/Slack/PagerDuty) terkonfigurasi
```

---

## Ringkasan Konsep

```
Network Segmentation:
  Public tier → Private tier → Data tier
  Setiap tier hanya terima traffic dari tier tepat di atasnya

Firewall:
  Default DENY ALL, lalu ALLOW spesifik saja
  Hindari 0.0.0.0/0 untuk akses administrative

TLS Everywhere:
  HTTP → HTTPS, FTP → SFTP, Telnet → SSH
  Auto-renewal + monitoring expiry sertifikat

DNS TTL Tuning:
  Turunkan TTL sebelum migrasi/failover
  Naikkan kembali setelah stabil

Monitoring:
  Kombinasikan layer 7 (app), layer 4 (transport),
  layer 3 (network), DNS, dan TLS — jangan andalkan
  1 layer monitoring saja

Checklist production = DNS + TLS + Firewall + LB
  + SSH access + Monitoring, semua tercek sebelum go-live
```

---

*Dokumen ini membahas konsep networking & protokol yang bersifat umum/cloud-agnostic per 2026.*
