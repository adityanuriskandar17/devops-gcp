# Commands Cheatsheet — Networking Tools

Kumpulan command line tool yang paling sering dipakai untuk **diagnosa masalah networking** — DNS, connectivity, port/socket, HTTP testing, dan packet capture. Semua tool ini cloud-agnostic, bisa dipakai di server GCP, AWS, on-premise, atau laptop sendiri.

---

## DNS Tools

### dig

| | Cara |
|-|------|
| **Fungsi** | Query DNS record, tool paling lengkap & fleksibel untuk debug DNS |
| **Install** | `apt install dnsutils` (Debian/Ubuntu) atau `brew install bind` (macOS) |

```bash
dig example.com                       # Query A record (default)
dig example.com +short                # Hanya tampilkan hasil (tanpa detail)
dig example.com MX                     # Query record type tertentu (MX, TXT, NS, dst.)
dig example.com @8.8.8.8               # Query ke resolver spesifik (skip cache lokal)
dig -x 34.101.20.5                     # Reverse lookup (IP → domain, PTR record)
dig example.com +trace                 # Trace seluruh proses root → TLD → authoritative
dig example.com ANY                    # Query semua record type (banyak resolver disable ini)
```

### nslookup

| | Cara |
|-|------|
| **Fungsi** | Query DNS sederhana, tersedia default di hampir semua OS (termasuk Windows) |
| **Install** | Biasanya sudah ada bawaan OS |

```bash
nslookup example.com                   # Query A record
nslookup example.com 8.8.8.8           # Query ke resolver spesifik
nslookup -type=MX example.com          # Query record type tertentu
nslookup -type=TXT example.com         # Cek SPF/DKIM/verifikasi domain
```

### host

| | Cara |
|-|------|
| **Fungsi** | Query DNS ringkas, output lebih sederhana dari dig |
| **Install** | `apt install bind9-host` (Debian/Ubuntu) |

```bash
host example.com                       # Query A/AAAA record
host -t MX example.com                 # Query record type tertentu
host -a example.com                    # Query semua informasi (verbose)
```

---

## Connectivity Tools

### ping

| | Cara |
|-|------|
| **Fungsi** | Cek apakah host reachable & ukur latency (round-trip time) via ICMP |
| **Install** | Bawaan OS |

```bash
ping example.com                       # Ping terus-menerus (Ctrl+C stop)
ping -c 4 example.com                   # Ping 4 kali saja
ping -i 0.5 example.com                 # Interval custom (0.5 detik)
ping -s 1400 example.com                # Custom packet size (cek MTU/fragmentation)
```

**Catatan:** Beberapa server/firewall memblok ICMP (ping) sebagai kebijakan keamanan. Tidak ada response ping **tidak selalu** berarti server down — bisa jadi hanya ICMP-nya yang diblok. Verifikasi dengan tool lain (curl, telnet, nc) untuk konfirmasi.

### traceroute / tracert

| | Cara |
|-|------|
| **Fungsi** | Lihat rute/hop yang dilewati paket dari client ke tujuan |
| **Install** | `apt install traceroute` (Linux) — Windows pakai `tracert` |

```bash
traceroute example.com                  # Trace rute ke domain (Linux/macOS)
tracert example.com                     # Trace rute ke domain (Windows)
traceroute -I example.com               # Pakai ICMP echo (bukan UDP default)
traceroute -n example.com               # Jangan resolve hostname (lebih cepat)
```

### mtr

| | Cara |
|-|------|
| **Fungsi** | Kombinasi ping + traceroute REAL-TIME per hop — lebih informatif untuk diagnosa packet loss di hop mana |
| **Install** | `apt install mtr` |

```bash
mtr example.com                         # Mode interaktif, update terus-menerus
mtr -r -c 10 example.com                # Report mode, 10 cycle, lalu keluar (cocok untuk log)
mtr -n example.com                      # Jangan resolve hostname
```

```
Contoh output mtr (report mode):

  HOST: laptop                    Loss%   Snt   Last   Avg  Best  Wrst StDev
  1. gateway.local                 0.0%    10    0.5    0.6   0.4   1.2   0.2
  2. isp-router.net                0.0%    10    3.2    3.5   2.9   5.1   0.6
  3. 10.20.30.1                   20.0%    10   45.0   50.2  40.1  80.3  12.1  ← packet loss di hop ini!
  4. shop.example.com               0.0%    10   48.0   49.0  45.0  55.0   3.0

  → Loss 20% di hop 3, tapi 0% di hop 4 (tujuan akhir) sering
    berarti hop 3 sengaja rate-limit ICMP, BUKAN masalah nyata
    (karena paket tetap sampai ke tujuan akhir tanpa loss)
```

---

## Port & Socket Tools

### netstat

| | Cara |
|-|------|
| **Fungsi** | Lihat koneksi network aktif, listening port, routing table (tool lama, mulai digantikan `ss`) |
| **Install** | `apt install net-tools` |

```bash
netstat -tulnp                          # TCP/UDP listening ports + proses (perlu sudo)
netstat -an                              # Semua koneksi (established + listening)
netstat -r                               # Routing table
```

### ss

| | Cara |
|-|------|
| **Fungsi** | Pengganti modern `netstat`, lebih cepat & informatif |
| **Install** | Bawaan `iproute2` (biasanya sudah terinstall) |

```bash
ss -tulnp                               # TCP/UDP listening ports + proses (perlu sudo)
ss -tan                                  # Semua koneksi TCP (established, listening, dll.)
ss -s                                    # Summary statistik koneksi
ss -o state established '( dport = :443 )'   # Filter koneksi established ke port 443
```

### nc (netcat)

| | Cara |
|-|------|
| **Fungsi** | "Swiss army knife" networking — test koneksi ke port tertentu, transfer data sederhana |
| **Install** | `apt install netcat` |

```bash
nc -zv example.com 443                  # Cek apakah port 443 open (tanpa kirim data)
nc -zv example.com 22 80 443             # Cek beberapa port sekaligus
nc -l 8080                               # Listen di port 8080 (jadi server sementara)
echo "test" | nc example.com 12345       # Kirim data mentah ke port tertentu
```

---

## HTTP Testing Tools

### curl

| | Cara |
|-|------|
| **Fungsi** | Kirim HTTP request dari command line, paling umum untuk test API & debug HTTP |
| **Install** | Biasanya sudah bawaan OS |

```bash
curl https://example.com                          # GET request, tampilkan body
curl -I https://example.com                        # HEAD request, hanya tampilkan header
curl -v https://example.com                         # Verbose, tampilkan detail TLS handshake & header
curl -X POST -d '{"key":"value"}' \
     -H "Content-Type: application/json" \
     https://api.example.com/endpoint               # POST dengan JSON body
curl -o output.html https://example.com             # Simpan response ke file
curl -w "%{time_total}\n" -o /dev/null -s https://example.com  # Ukur response time saja
curl --resolve example.com:443:34.101.20.5 https://example.com # Test IP spesifik sebelum DNS berubah
```

### wget

| | Cara |
|-|------|
| **Fungsi** | Download file/halaman dari command line, lebih cocok untuk download besar/recursive |
| **Install** | `apt install wget` |

```bash
wget https://example.com/file.zip        # Download file
wget -c https://example.com/file.zip      # Resume download yang terputus
wget --spider https://example.com         # Cek URL accessible tanpa download (mirip curl -I)
wget -r -np https://example.com/docs/     # Download recursive (mirror struktur folder)
```

---

## Packet Capture

### tcpdump

| | Cara |
|-|------|
| **Fungsi** | Capture & analisa packet mentah di level network interface — paling detail untuk debugging deep |
| **Install** | `apt install tcpdump` |

```bash
sudo tcpdump -i eth0                              # Capture semua traffic di interface eth0
sudo tcpdump -i eth0 port 443                       # Filter hanya port 443
sudo tcpdump -i eth0 host 34.101.20.5                # Filter hanya traffic ke/dari IP tertentu
sudo tcpdump -i eth0 -w capture.pcap                 # Simpan hasil capture ke file (buka di Wireshark)
sudo tcpdump -i eth0 -A port 80                      # Tampilkan isi packet dalam ASCII (HTTP plaintext)
sudo tcpdump -i any icmp                             # Capture hanya ICMP (ping) di semua interface
```

```
Contoh output tcpdump (three-way handshake terlihat):

  12:00:01.123 IP client.54321 > server.443: Flags [S], seq 100        ← SYN
  12:00:01.145 IP server.443 > client.54321: Flags [S.], seq 300, ack 101  ← SYN-ACK
  12:00:01.146 IP client.54321 > server.443: Flags [.], ack 301        ← ACK
  12:00:01.150 IP client.54321 > server.443: Flags [P.], length 517    ← data (TLS ClientHello)
```

**Best practice:** Selalu gunakan filter (`port`, `host`) saat `tcpdump` di server production — capture tanpa filter di server dengan traffic tinggi bisa menghasilkan file sangat besar dan membebani CPU/disk I/O.

---

## Ringkasan Perintah Cepat

| Kategori | Command | Kegunaan Singkat |
|----------|---------|--------------------|
| DNS | `dig domain +short` | IP dari domain, cepat |
| DNS | `dig domain @8.8.8.8` | Query resolver spesifik |
| Connectivity | `ping -c 4 host` | Cek reachability & latency |
| Connectivity | `mtr -r -c 10 host` | Cek hop mana yang packet loss |
| Port | `ss -tulnp` | Lihat port yang listening |
| Port | `nc -zv host port` | Cek 1 port spesifik open/closed |
| HTTP | `curl -I url` | Cek status code & header cepat |
| HTTP | `curl -v url` | Debug detail TLS handshake |
| Packet | `tcpdump -i eth0 port 443` | Lihat traffic mentah port tertentu |

---

*Dokumen ini membahas konsep networking & protokol yang bersifat umum/cloud-agnostic per 2026.*
