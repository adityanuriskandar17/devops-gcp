# SSH & FTP

Dokumentasi tentang protokol yang paling sering dipakai untuk **akses remote server** dan **transfer file**: SSH (Secure Shell), FTP/SFTP/FTPS. Termasuk arsitektur key pair SSH, perbandingan protokol file transfer, dan konsep tunneling/port forwarding (local, remote, dynamic).

---

## SSH Architecture

**SSH (Secure Shell)** adalah protokol untuk mengakses command line server secara remote, dengan seluruh komunikasi terenkripsi. Autentikasi SSH paling umum menggunakan **key pair** (public/private key), bukan password.

```
SSH Key Pair — Cara Kerja:

  ┌─────────────────────┐         ┌─────────────────────┐
  │  Client (laptop kamu) │         │  Server                │
  │                       │         │                        │
  │  🔑 Private Key        │         │  🔓 Public Key           │
  │  (id_rsa / id_ed25519) │         │  (~/.ssh/authorized_keys)│
  │  DIJAGA, tidak pernah   │         │  Boleh dibagikan bebas,   │
  │  dikirim ke mana-mana   │         │  hanya bisa VERIFIKASI,   │
  │                       │         │  tidak bisa dipakai LOGIN  │
  └──────────┬────────────┘         └───────────┬────────────┘
             │                                  │
             │  1. Client minta koneksi          │
             │ ─────────────────────────────────►│
             │                                  │
             │  2. Server kirim "challenge"       │
             │     (random data terenkripsi        │
             │      dengan public key client)      │
             │ ◄─────────────────────────────────│
             │                                  │
             │  3. Client BUKTIKAN kepemilikan     │
             │     private key dengan mendekripsi  │
             │     challenge tersebut               │
             │ ─────────────────────────────────►│
             │                                  │
             │  4. Server verifikasi hasil          │
             │     ✅ Cocok → login berhasil          │
             │     ❌ Tidak cocok → akses ditolak     │
             │                                  │
             │  Private key TIDAK PERNAH dikirim    │
             │  lewat network — hanya dipakai untuk  │
             │  membuktikan diri secara matematis    │
```

### known_hosts — Verifikasi Identitas Server

```
Saat pertama kali connect ke server baru:

  $ ssh user@34.101.20.5

  The authenticity of host '34.101.20.5' can't be established.
  ED25519 key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxx.
  Are you sure you want to continue connecting (yes/no)?

  → Client menyimpan fingerprint public key SERVER ini
    di ~/.ssh/known_hosts

  Kalau nanti fingerprint berubah (misal server di-reinstall,
  atau ada MITM attack), SSH akan WARNING keras:

  WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!
  IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!

  ⚠ Jangan asal "yes" kalau ini muncul di server yang SUDAH
    pernah kamu akses sebelumnya tanpa perubahan apapun —
    bisa jadi indikasi man-in-the-middle attack.
```

### SSH Agent Forwarding

```
Tanpa Agent Forwarding:               Dengan Agent Forwarding:

  Laptop → Server A → Server B         Laptop → Server A → Server B
                                         (agent)

  Private key harus di-copy ke          Private key TETAP di laptop,
  Server A supaya bisa SSH lanjut       Server A "meneruskan" request
  ke Server B ❌ (risiko keamanan,       autentikasi ke laptop lewat
  key tersebar di banyak server)         agent socket ✅

  ssh-agent di laptop menyimpan private key secara aman di memory,
  lalu SSH client meneruskan akses ke agent (bukan key itu sendiri)
  saat perlu autentikasi hop berikutnya.

  $ eval $(ssh-agent)
  $ ssh-add ~/.ssh/id_ed25519
  $ ssh -A user@server-a     # -A = enable agent forwarding
  server-a$ ssh user@server-b   # bisa auth pakai key dari laptop
```

**Penting:** Agent forwarding nyaman, tapi kalau Server A ter-compromise, attacker bisa memanfaatkan forwarded agent untuk auth ke Server B (selama sesi kamu masih aktif) — walau tidak bisa mencuri private key itu sendiri. Gunakan hanya ke server yang dipercaya.

---

## SFTP vs FTP vs FTPS

| Aspek | FTP | FTPS | SFTP |
|-------|-----|------|------|
| Kepanjangan | File Transfer Protocol | FTP Secure (FTP + SSL/TLS) | SSH File Transfer Protocol |
| Enkripsi | ❌ Tidak ada (plaintext, termasuk password!) | ✅ Ya (TLS) | ✅ Ya (dienkripsi lewat SSH) |
| Port | 20 (data), 21 (control) | 21 (control) + range port data (implicit: 990) | 22 (sama dengan SSH) |
| Protokol dasar | Sendiri (dedicated protocol) | FTP + TLS layer | Berjalan di atas SSH, bukan varian FTP |
| Firewall friendliness | Sulit (banyak port dinamis untuk data channel) | Sulit (sama seperti FTP + port TLS) | Mudah (cukup 1 port: 22) |
| Autentikasi | Username/password (plaintext) | Username/password (terenkripsi) atau certificate | Password atau SSH key pair |
| Status saat ini | ⚠ Sebaiknya dihindari untuk data sensitif | Masih dipakai di beberapa sistem legacy/compliance | ✅ Standar modern yang direkomendasikan |

```
Kenapa FTP polos berbahaya:

  Client                              Server
    │  USER admin                       │
    │ ──────────────────────────────────►│   ← username plaintext
    │  PASS SuperSecret123               │
    │ ──────────────────────────────────►│   ← password PLAINTEXT!
    │                                    │      siapapun yang sniff
    │                                    │      traffic bisa BACA password ini

  Dengan SFTP (di atas SSH):
    Seluruh sesi (termasuk auth) terenkripsi end-to-end,
    tidak ada data yang terlihat plaintext di network.
```

**Best practice:** Hindari FTP polos untuk transfer apapun yang melibatkan kredensial atau data sensitif. Gunakan **SFTP** sebagai default modern — satu port (22), terenkripsi, dan bisa pakai SSH key yang sama dengan akses shell.

---

## SSH Tunneling / Port Forwarding

SSH tidak hanya untuk shell access — koneksi SSH yang sudah terenkripsi bisa dipakai sebagai "terowongan" untuk traffic lain. ada 3 jenis: **local**, **remote**, dan **dynamic**.

### Local Port Forwarding

```
Use case: Akses database yang hanya listen di localhost server remote,
          dari laptop kamu, tanpa expose port DB ke internet.

  $ ssh -L 3307:localhost:3306 user@34.101.20.5

  Laptop                    SSH Tunnel                 Server
  ┌──────────┐                                       ┌──────────┐
  │ MySQL     │  localhost:3307                        │ MySQL      │
  │ Client    │──────┐                                 │ Server     │
  │           │      │  [terowongan terenkripsi SSH]    │ (listen di │
  │           │      └────────────────────────────────► │  localhost │
  └──────────┘                                       │  :3306)    │
                                                      └──────────┘

  Client connect ke localhost:3307 di LAPTOP →
  diteruskan lewat SSH tunnel → keluar sebagai
  localhost:3306 di SERVER (seolah dari server itu sendiri)
```

### Remote Port Forwarding

```
Use case: Expose service yang jalan di LAPTOP kamu (misal dev server
          localhost:8080) supaya bisa diakses dari SERVER remote
          (kebalikan dari local forwarding).

  $ ssh -R 9000:localhost:8080 user@34.101.20.5

  Laptop                    SSH Tunnel                 Server
  ┌──────────┐                                       ┌──────────┐
  │ Dev Server│                                       │           │
  │ :8080     │◄──────────────────────────────────────│ Someone   │
  │           │      [terowongan terenkripsi SSH]      │ akses     │
  └──────────┘                                       │ localhost:│
                                                      │ 9000      │
                                                      └──────────┘

  Siapapun yang akses localhost:9000 DI SERVER →
  diteruskan lewat tunnel → sampai ke localhost:8080 DI LAPTOP kamu
```

### Dynamic Port Forwarding (SOCKS Proxy)

```
Use case: Jadikan koneksi SSH sebagai SOCKS proxy — semua traffic
          browser/app di-route lewat server remote (mirip VPN ringan).

  $ ssh -D 1080 user@34.101.20.5

  Laptop                    SSH Tunnel                 Server
  ┌──────────┐                                       ┌──────────┐
  │ Browser    │  SOCKS proxy                          │           │
  │ (setting   │  localhost:1080                        │ Traffic   │
  │  proxy ke  │──────┐                                 │ keluar    │
  │  :1080)    │      │  [terowongan terenkripsi SSH]    │ dari IP   │
  │           │      └────────────────────────────────► │ server    │
  └──────────┘                                       └──────────┘

  Berbeda dari -L/-R yang forward ke 1 tujuan spesifik,
  -D membuat proxy SOCKS yang bisa meneruskan ke MANA SAJA
  (dynamic destination) — traffic browser seolah berasal
  dari IP server, bukan IP laptop.
```

| Jenis | Flag | Arah Tunnel | Use Case Umum |
|-------|------|-------------|-----------------|
| **Local** | `-L local_port:host:remote_port` | Laptop → Server | Akses DB/service privat di server dari laptop |
| **Remote** | `-R remote_port:host:local_port` | Server → Laptop | Expose service lokal ke server (demo, webhook testing) |
| **Dynamic** | `-D local_port` | Laptop → mana saja (via server) | Browsing lewat IP server, bypass firewall/geo-block |

---

## Skenario: Setup Passwordless SSH Access secara Aman

```
Goal: Developer baru butuh akses SSH ke server tanpa password,
      tapi tetap aman (tidak asal copy private key ke mana-mana).
```

```
Step 1: Generate key pair BARU di laptop developer (bukan reuse!)

  $ ssh-keygen -t ed25519 -C "david@example.com" -f ~/.ssh/id_ed25519_work

  → Menghasilkan:
    ~/.ssh/id_ed25519_work       (private key — JANGAN dibagikan)
    ~/.ssh/id_ed25519_work.pub   (public key — aman dibagikan)


Step 2: Tambahkan PUBLIC key ke server (bukan private key!)

  # Cara aman: pakai ssh-copy-id (kalau masih ada akses password/key lain)
  $ ssh-copy-id -i ~/.ssh/id_ed25519_work.pub user@34.101.20.5

  # Atau manual: paste isi .pub ke akhir file ini di server
  $ cat ~/.ssh/id_ed25519_work.pub | ssh admin@server \
      "cat >> ~/.ssh/authorized_keys"


Step 3: Set permission yang benar di server (SSH strict soal ini)

  $ chmod 700 ~/.ssh
  $ chmod 600 ~/.ssh/authorized_keys

  ⚠ Kalau permission terlalu longgar, SSH akan MENOLAK memakai
    authorized_keys demi keamanan (silent failure yang sering
    membingungkan pemula).


Step 4: Test akses passwordless

  $ ssh -i ~/.ssh/id_ed25519_work user@34.101.20.5
  → Harus langsung masuk TANPA diminta password


Step 5: (Best practice) Matikan password authentication di server

  # /etc/ssh/sshd_config
  PasswordAuthentication no
  PermitRootLogin no

  $ sudo systemctl reload sshd

  → Sekarang SATU-SATUNYA cara masuk adalah via SSH key,
    brute-force password attack jadi tidak relevan lagi.


Step 6: (Opsional, untuk tim besar) Kelola access lewat 1 mekanisme terpusat

  ├── Gunakan SSH Certificate Authority (CA) — server percaya sertifikat
  │   yang ditandatangani CA internal, tidak perlu tambah/hapus public
  │   key satu-satu di setiap server saat onboarding/offboarding
  └── Atau gunakan managed access (misal IAP tunnel di GCP, SSO-based
      bastion host) supaya revoke akses cukup di 1 tempat terpusat
```

**Best practice:** Selalu pakai **1 key pair per device/context**, bukan 1 key untuk semua. Kalau laptop hilang atau developer resign, cukup revoke 1 public key spesifik dari `authorized_keys`, tanpa mengganggu key lain yang sedang aktif digunakan.

---

## Ringkasan Konsep

```
SSH Authentication:
  Private key (client, dijaga) + Public key (server, authorized_keys)
  Server kirim challenge → client buktikan kepemilikan private key
  known_hosts = verifikasi identitas SERVER (cegah MITM)
  Agent forwarding = private key tetap di laptop, diteruskan lewat agent

FTP vs FTPS vs SFTP:
  FTP    → plaintext, hindari untuk data sensitif
  FTPS   → FTP + TLS, masih dipakai di sistem legacy
  SFTP   → di atas SSH, terenkripsi penuh, standar modern

SSH Tunneling:
  Local  (-L)  → akses service remote dari laptop
  Remote (-R)  → expose service lokal ke server
  Dynamic (-D) → SOCKS proxy, traffic bebas lewat server

Passwordless SSH Setup:
  1. Generate key pair baru per device
  2. Copy PUBLIC key saja ke authorized_keys server
  3. Set permission ketat (700 dir, 600 file)
  4. Matikan password auth setelah key auth terverifikasi jalan
  5. Revoke = hapus 1 public key spesifik, tidak ganggu yang lain
```

---

*Dokumen ini membahas konsep networking & protokol yang bersifat umum/cloud-agnostic per 2026.*
