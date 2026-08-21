# Email Protocols

Dokumentasi tentang protokol yang membuat email bisa terkirim dan diterima: **SMTP** (kirim), **IMAP** dan **POP3** (baca/ambil), serta mekanisme anti-spam **SPF/DKIM/DMARC** yang krusial supaya email tidak masuk folder spam. Termasuk konsep greylisting/whitelisting dan skenario debugging email masuk spam.

---

## SMTP vs IMAP vs POP3 — Alur Pengiriman Email

```
Alur lengkap email dari pengirim ke penerima:

  ┌────────┐  SMTP   ┌──────────────┐  SMTP   ┌──────────────┐
  │ Sender  │────────►│ MTA Pengirim   │────────►│ MTA Penerima   │
  │ (mail   │ (submit,│ (Mail Transfer │ (relay  │ (Mail Transfer │
  │  client)│  port   │  Agent, misal   │  antar   │  Agent, misal  │
  │         │  587)   │  Gmail SMTP)    │  server) │  Google/Outlook│
  └────────┘         └──────────────┘         │  mail server)  │
                                              └──────┬───────┘
                                                     │ disimpan di
                                                     ▼
                                              ┌──────────────┐
                                              │   Mailbox      │
                                              │  (mail store)   │
                                              └──────┬───────┘
                                                     │
                              ┌──────────────────────┴──────────────────────┐
                              ▼ IMAP (port 143/993)          ▼ POP3 (port 110/995)
                       ┌──────────────┐                ┌──────────────┐
                       │ Recipient      │                │ Recipient      │
                       │ ambil & SYNC    │                │ DOWNLOAD email  │
                       │ email (tetap di │                │ (hapus dari     │
                       │ server)         │                │  server)        │
                       └──────────────┘                └──────────────┘
```

| Protokol | Fungsi | Port (plain / secure) | Karakteristik |
|----------|--------|------------------------|----------------|
| **SMTP** | KIRIM email (client→server dan server→server) | 25 (relay antar server), 587 (submission dari client) | Push-based, satu arah pengiriman |
| **IMAP** | AMBIL & SYNC email, tetap tersimpan di server | 143 / 993 (IMAPS) | Email tetap di server, sync multi-device, folder terstruktur |
| **POP3** | AMBIL & (biasanya) HAPUS email dari server setelah download | 110 / 995 (POP3S) | Email di-download ke 1 device, tidak sync antar device |

```
Perbedaan mental model IMAP vs POP3:

  IMAP: "Server adalah source of truth"          POP3: "Device adalah source of truth"
  - Baca email di HP → status "read"              - Download email di laptop →
    langsung sync ke semua device                    email HILANG dari server
  - Cocok untuk multi-device (HP, laptop,          - Kalau device rusak/hilang,
    tablet akses email yang sama)                    email yang sudah didownload
                                                      hilang juga (kecuali di-backup)
  - Umumnya default modern untuk personal          - Historically dipakai saat storage
    & bisnis                                          server mahal/terbatas
```

---

## Whitelisting & Greylisting

Teknik anti-spam yang bekerja **sebelum** email bahkan dianalisa isinya.

```
Whitelisting:
  Daftar sender/domain/IP yang SELALU dipercaya
  → email dari daftar ini SKIP semua filter spam,
    langsung masuk inbox

  Contoh: whitelist domain partner bisnis, atau
          notifikasi internal dari sistem sendiri


Greylisting:
  Teknik unik — server penerima SENGAJA menolak
  email untuk PERTAMA KALINYA dengan temporary
  error (SMTP code 4xx, "coba lagi nanti")

  ┌────────┐                              ┌──────────┐
  │ Sender  │──── kirim email pertama ────►│ Receiver   │
  │         │◄─── 450 Try again later ─────│ (greylist) │
  └────────┘                              └──────────┘

  MTA yang LEGIT akan otomatis retry sesuai standar SMTP
  (biasanya beberapa menit sampai jam kemudian) →
  saat retry, baru diterima dan sender ditandai "known good"

  Spammer/bot SEBAGIAN BESAR tidak melakukan retry
  yang benar (mereka spray-and-forget, tidak mengikuti
  standar SMTP retry) → otomatis terfilter tanpa perlu
  analisa isi email sama sekali
```

| Teknik | Cara Kerja | Kelebihan | Kekurangan |
|--------|-----------|-----------|------------|
| **Whitelisting** | Allow-list eksplisit sender terpercaya | Zero false positive untuk sender terdaftar | Perlu maintenance manual |
| **Greylisting** | Tolak sementara, terima kalau MTA retry sesuai standar | Efektif blok spammer tanpa analisa konten, minim resource | Delay pengiriman email pertama kali (beberapa menit) |

---

## SPF, DKIM, DMARC

Ketiga ini adalah mekanisme **otentikasi email** berbasis DNS TXT record, dirancang untuk mencegah **spoofing** (orang lain mengirim email seolah-olah dari domain kamu).

| Mekanisme | Apa yang Diverifikasi | Cara Kerja | Record Type |
|-----------|------------------------|-----------|--------------|
| **SPF** (Sender Policy Framework) | "Apakah IP pengirim ini BERHAK mengirim atas nama domain ini?" | Domain publikasikan daftar IP/server yang authorized mengirim email | TXT |
| **DKIM** (DomainKeys Identified Mail) | "Apakah isi email ini TIDAK DIUBAH sejak dikirim, dan benar dari domain ini?" | Email ditandatangani digital dengan private key, penerima verifikasi dengan public key di DNS | TXT |
| **DMARC** (Domain-based Message Authentication) | "Kalau SPF/DKIM gagal, apa yang harus dilakukan penerima?" | Kebijakan (policy) yang memberi instruksi ke penerima: reject, quarantine, atau none | TXT |

```
Contoh record DNS:

  SPF (di root domain):
  example.com.  TXT  "v=spf1 include:_spf.google.com ip4:34.101.20.5 ~all"
                       │              │                    │        │
                       versi     authorized server     IP spesifik  soft fail
                                 (misal Google Workspace)             untuk yang lain

  DKIM (di subdomain selector):
  default._domainkey.example.com.  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSq..."
                                            │      │        │
                                          versi   key type  public key

  DMARC (di subdomain _dmarc):
  _dmarc.example.com.  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@example.com"
                              │           │              │
                            versi    policy: reject   kirim laporan agregat
                                     email yang gagal   ke alamat ini
                                     SPF & DKIM
```

```
Flow verifikasi penerima email:

  Email masuk dari "billing@example.com"
       │
       ▼
  1. Cek SPF: apakah IP pengirim ada di daftar authorized example.com?
       ├── Pass ✅ → lanjut
       └── Fail ❌ → tandai
       │
       ▼
  2. Cek DKIM: apakah signature valid & isi email tidak diubah?
       ├── Pass ✅ → lanjut
       └── Fail ❌ → tandai
       │
       ▼
  3. Cek DMARC policy example.com: "p=reject" atau "p=quarantine" atau "p=none"
       │
       ├── SPF/DKIM keduanya pass → email diterima normal ✅
       ├── SPF/DKIM gagal, policy=reject     → email DITOLAK ❌
       ├── SPF/DKIM gagal, policy=quarantine → masuk folder SPAM ⚠
       └── SPF/DKIM gagal, policy=none       → diterima, tapi dilaporkan
                                                 ke admin domain (monitoring mode)
```

**Catatan:** "**DomainKeys**" adalah pendahulu DKIM (dikembangkan Yahoo), yang kemudian digabung dengan "Identified Internet Mail" (dikembangkan Cisco) menjadi **DKIM** yang dipakai sekarang. Istilah "DomainKeys" kadang masih muncul di dokumentasi lama sebagai sinonim longgar untuk konsep signing email berbasis domain.

---

## Skenario: Debugging Email Masuk Folder Spam

```
Laporan: "Email notifikasi dari sistem kita (noreply@shop.example.com)
          selalu masuk folder SPAM di Gmail penerima!"
```

### Langkah Diagnosis

```
Step 1: Cek SPF record domain

  $ dig shop.example.com TXT +short

  "v=spf1 include:_spf.google.com ~all"

  → Domain PUNYA SPF, tapi cek apakah IP server pengirim
    ACTUAL (misal server aplikasi yang kirim email langsung,
    bukan lewat Google Workspace) sudah termasuk di record ini.

  ❌ Ditemukan: aplikasi kirim email langsung dari IP server
     34.101.20.5, tapi IP ini TIDAK ADA di SPF record!
     → SPF FAIL untuk email dari aplikasi ini


Step 2: Cek DKIM signature

  $ dig default._domainkey.shop.example.com TXT +short

  (tidak ada hasil / kosong)

  → DKIM belum dikonfigurasi sama sekali untuk domain ini


Step 3: Cek DMARC policy

  $ dig _dmarc.shop.example.com TXT +short

  (tidak ada hasil / kosong)

  → Tanpa DMARC, penerima (terutama Gmail/Outlook) makin
    curiga karena tidak ada kebijakan otentikasi yang jelas


Step 4: Perbaikan — tambahkan IP server ke SPF

  Update SPF record:
  "v=spf1 include:_spf.google.com ip4:34.101.20.5 ~all"
                                    └── tambahkan IP server aplikasi


Step 5: Setup DKIM

  ├── Generate key pair DKIM di mail server / provider (misal
  │   lewat Google Workspace Admin, atau software seperti OpenDKIM)
  └── Publish public key sebagai TXT record:
      default._domainkey.shop.example.com TXT "v=DKIM1; k=rsa; p=..."


Step 6: Setup DMARC (mode monitoring dulu, jangan langsung reject)

  _dmarc.shop.example.com  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@example.com"

  → Mulai dengan p=none supaya bisa PANTAU laporan dulu tanpa
    risiko email legitimate ke-block, baru setelah yakin semua
    email legitimate PASS, naikkan ke p=quarantine lalu p=reject


Step 7: Verifikasi dengan mail-tester / header analysis

  Kirim email test ke alamat testing (misal mail-tester.com),
  cek skor dan detail SPF/DKIM/DMARC pass/fail

  Atau cek header email yang sudah diterima:
  Authentication-Results: mx.google.com;
    spf=pass (google.com: domain of ... designates 34.101.20.5 as permitted sender)
    dkim=pass header.i=@shop.example.com
    dmarc=pass (p=NONE sp=NONE dis=NONE)


Step 8: Tunggu reputasi domain/IP membangun kembali

  Selain SPF/DKIM/DMARC, reputasi domain & IP juga dipengaruhi
  riwayat pengiriman (bounce rate, complaint rate, volume).
  Setelah fix konfigurasi, mungkin masih perlu beberapa hari-minggu
  sebelum reputasi sepenuhnya "bersih" di mata provider email besar.
```

**Best practice:** Konfigurasi SPF, DKIM, DAN DMARC ketiganya — hanya SPF saja **tidak cukup** untuk email modern, karena banyak provider (terutama Gmail & Yahoo, sejak kebijakan bulk sender 2024) mensyaratkan ketiganya untuk sender dengan volume tinggi agar tidak otomatis masuk spam atau ditolak sepenuhnya.

---

## Ringkasan Konsep

```
SMTP vs IMAP vs POP3:
  SMTP  → kirim email (client→server, server→server)
  IMAP  → sync email, tetap di server, multi-device
  POP3  → download email, biasanya hapus dari server

Whitelisting & Greylisting:
  Whitelist  → allow-list eksplisit, skip filter
  Greylist   → tolak sementara, spammer jarang retry dengan benar

SPF / DKIM / DMARC:
  SPF     → verifikasi IP pengirim authorized
  DKIM    → verifikasi isi email tidak diubah (signature)
  DMARC   → kebijakan: apa yang dilakukan kalau SPF/DKIM gagal
            (none / quarantine / reject)

Debug email masuk spam:
  1. dig TXT record → cek SPF mencakup semua IP pengirim
  2. dig DKIM selector → cek signature dikonfigurasi
  3. dig _dmarc → cek policy ada & sesuai
  4. Mulai DMARC dengan p=none, naikkan bertahap ke reject
  5. Verifikasi via mail-tester / Authentication-Results header
  6. Reputasi domain/IP butuh waktu membangun setelah fix
```

---

*Dokumen ini membahas konsep networking & protokol yang bersifat umum/cloud-agnostic per 2026.*
