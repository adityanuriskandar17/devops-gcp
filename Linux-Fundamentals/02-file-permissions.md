# User, Group & Permission

Dokumentasi model **user, group, dan permission** di Linux — UID/GID, format `/etc/passwd` & `/etc/shadow`, permission `rwx` dan notasi octal, `chmod`/`chown`/`chgrp`, special permission (setuid/setgid/sticky bit), serta perbedaan `sudo`, `su`, dan login sebagai `root`.

---

## Model User & Group

Setiap user dan group di Linux diidentifikasi dengan angka (**UID**/**GID**), bukan nama — nama hanyalah label yang dipetakan ke angka tersebut.

```
User & Group Model:

  Username: alice          Groupname: developers
       │                        │
       ▼                        ▼
     UID: 1001                GID: 1002
       │                        │
       └──────────┬─────────────┘
                  ▼
     Kernel hanya kenal angka (UID/GID) untuk cek permission,
     "alice" hanya representasi manusiawi dari UID 1001
```

| UID Range | Arti |
|-----------|------|
| `0` | **root** — superuser, bisa akses/ubah apa saja tanpa dibatasi permission |
| `1-999` (atau `1-99` di beberapa distro lama) | **System account** — untuk service (misal: `www-data`, `mysql`, `sshd`), bukan untuk login manusia |
| `1000+` | **User account** biasa — dibuat untuk manusia (developer, admin, dll) |

### File Konfigurasi User & Group

```
/etc/passwd  → daftar semua user (info dasar, BUKAN password asli)
  alice:x:1001:1002:Alice Smith:/home/alice:/bin/bash
  │     │ │    │    │            │           │
  │     │ │    │    │            │           └── default shell
  │     │ │    │    │            └── home directory
  │     │ │    │    └── comment/full name (GECOS field)
  │     │ │    └── GID (primary group)
  │     │ └── UID
  │     └── password placeholder ("x" = disimpan di /etc/shadow)
  └── username

/etc/shadow  → password hash & aturan expiry (hanya root bisa baca)
  alice:$6$randomsalt$hashedpassword...:19800:0:90:7:::
  │     │                                │     │ │  │
  │     │                                │     │ │  └── inactive period
  │     │                                │     │ └── warning sebelum expire
  │     │                                │     └── max password age (hari)
  │     │                                └── min password age
  │     └── hash password (algoritma $6$ = SHA-512)
  └── username

/etc/group   → daftar semua group
  developers:x:1002:alice,bob
  │          │ │    │
  │          │ │    └── anggota tambahan (supplementary members)
  │          │ └── GID
  │          └── password placeholder (jarang dipakai)
  └── groupname
```

**Penting:** `/etc/shadow` **hanya bisa dibaca oleh root** (permission `600` atau `640` dengan owner root). Ini alasan kenapa `/etc/passwd` tetap bisa dibaca semua orang (`644`) — password hash-nya sudah dipindah ke `/etc/shadow` yang lebih terlindungi.

| Command | Fungsi |
|---------|--------|
| `useradd alice` / `adduser alice` | Buat user baru |
| `passwd alice` | Set/ubah password user |
| `usermod -aG developers alice` | Tambah user ke group tambahan (append, jangan pakai `-G` saja — itu replace semua group) |
| `groupadd developers` | Buat group baru |
| `id alice` | Lihat UID, GID, dan semua group alice |
| `whoami` | Lihat user saat ini |
| `groups` | Lihat group user saat ini |
| `deluser alice` / `userdel alice` | Hapus user |

---

## Permission Model: rwx & Octal

Setiap file/direktori punya 3 set permission: untuk **owner**, **group**, dan **others**, masing-masing terdiri dari **read (r)**, **write (w)**, **execute (x)**.

```
$ ls -l app.sh
-rwxr-xr-- 1 alice developers 1024 Aug 10 10:00 app.sh
│└┬┘└┬┘└┬┘
│ │  │  │
│ │  │  └── OTHERS:  r-- (read only)
│ │  └───── GROUP:   r-x (read + execute)
│ └──────── OWNER:   rwx (read + write + execute)
└────────── file type: - (regular file), d (directory), l (symlink)

Owner: alice   Group: developers
```

| Symbol | Pada File | Pada Direktori |
|--------|-----------|-----------------|
| `r` (read) | Baca isi file | List isi direktori (`ls`) |
| `w` (write) | Ubah/tulis isi file | Buat/hapus/rename file di dalamnya |
| `x` (execute) | Jalankan file sebagai program/script | Masuk ke direktori (`cd`), akses file di dalamnya |

### Notasi Octal

```
r = 4    w = 2    x = 1    (tidak ada = 0)

Owner + Group + Others → 3 digit octal

  rwx r-x r--
  4+2+1  4+0+1  4+0+0
  = 7     = 5     = 4

  chmod 754 app.sh   ==   rwxr-xr--
```

| Octal | Simbolik | Arti | Kegunaan Umum |
|-------|----------|------|-----------------|
| `777` | `rwxrwxrwx` | Semua orang full akses | ❌ Hampir selalu **BAHAYA** — hindari |
| `755` | `rwxr-xr-x` | Owner full, lainnya read+execute | Direktori umum, script/binary yang dijalankan banyak user |
| `700` | `rwx------` | Hanya owner full akses | Direktori privat (misal: `~/.ssh`) |
| `644` | `rw-r--r--` | Owner baca-tulis, lainnya baca saja | File konfigurasi umum, dokumen |
| `600` | `rw-------` | Hanya owner baca-tulis | File sensitif (private key, `.env`, credentials) |
| `640` | `rw-r-----` | Owner baca-tulis, group baca, others tidak ada akses | File config yang perlu dibaca group tertentu (misal `/etc/shadow`-like) |
| `750` | `rwxr-x---` | Owner full, group read+execute, others tidak ada akses | Direktori aplikasi shared dalam 1 team |
| `444` | `r--r--r--` | Read-only untuk semua | File referensi yang tidak boleh diubah siapa pun |

**Best practice:** Private key SSH (`id_rsa`) **wajib** `600` — SSH client akan **menolak** memakai key kalau permission-nya terlalu terbuka (misal `644` atau `777`), dengan error `UNPROTECTED PRIVATE KEY FILE!`.

---

## chmod, chown, chgrp

```bash
# chmod — ubah permission
chmod 755 script.sh              # set permission via octal
chmod u+x script.sh               # tambah execute untuk owner (user)
chmod g-w file.txt                 # cabut write untuk group
chmod o-rwx secret.conf            # cabut semua akses untuk others
chmod -R 644 /var/www/html         # recursive ke semua file di direktori

# chown — ubah owner (dan optional group)
chown alice file.txt                    # ubah owner jadi alice
chown alice:developers file.txt          # ubah owner + group sekaligus
chown -R www-data:www-data /var/www/html # recursive, umum untuk web server

# chgrp — ubah group saja
chgrp developers file.txt
chgrp -R developers /srv/project
```

| Simbol chmod | Arti |
|--------------|------|
| `u` | user (owner) |
| `g` | group |
| `o` | others |
| `a` | all (u+g+o) |
| `+` | tambah permission |
| `-` | cabut permission |
| `=` | set permission secara eksak (replace) |

---

## Special Permissions: setuid, setgid, sticky bit

Selain rwx biasa, ada 3 permission khusus yang punya digit octal ke-4 (di depan 3 digit biasa).

```
Special Permission Bits:

  setuid = 4000   setgid = 2000   sticky = 1000

  Contoh: chmod 4755 /usr/bin/passwd
                │
                └── digit ke-4 = 4 (setuid)

  Ditampilkan di `ls -l` sebagai huruf s atau t
  menggantikan posisi 'x':
    -rwsr-xr-x   → setuid aktif (s di posisi owner)
    -rwxr-sr-x   → setgid aktif (s di posisi group)
    drwxrwxrwt   → sticky bit aktif (t di posisi others)
```

| Special Bit | Pada File | Pada Direktori | Contoh Nyata |
|-------------|-----------|-----------------|---------------|
| **setuid** (`4000`) | Program dijalankan dengan privilege **owner file**, bukan user yang menjalankan | Tidak berpengaruh (di sistem modern) | `/usr/bin/passwd` — user biasa bisa ubah password sendiri karena binary ini setuid root, sehingga bisa menulis ke `/etc/shadow` |
| **setgid** (`2000`) | Program dijalankan dengan privilege **group file** | File baru yang dibuat di dalam direktori otomatis inherit **group direktori**, bukan group user pembuat | Direktori shared project — semua file baru otomatis masuk group tim, bukan group masing-masing user |
| **sticky bit** (`1000`) | Tidak berpengaruh pada file biasa | User hanya bisa **hapus/rename file miliknya sendiri**, meski direktori writable oleh semua | `/tmp` — semua user bisa buat file di `/tmp`, tapi tidak bisa hapus file user lain |

```
Real-world case: /tmp

$ ls -ld /tmp
drwxrwxrwt 15 root root 4096 Aug 21 10:00 /tmp
         │
         └── sticky bit (t) — semua user bisa WRITE (buat file baru),
             tapi TIDAK BISA delete/rename file milik user lain,
             meskipun direktori-nya sendiri permission 777 (rwxrwxrwx)

Tanpa sticky bit: user A bisa hapus file user B di /tmp → chaos
Dengan sticky bit: user A hanya bisa hapus file miliknya sendiri ✅
```

```bash
chmod u+s /path/to/binary       # set setuid
chmod g+s /path/to/directory     # set setgid
chmod +t /path/to/directory      # set sticky bit
chmod 4755 binary                 # setuid + rwxr-xr-x
chmod 1777 /tmp                   # sticky + rwxrwxrwx
```

**Penting:** Binary dengan **setuid root** adalah target favorit attacker — kalau ada bug di binary tersebut, attacker bisa exploit untuk dapat privilege root. Audit berkala dengan `find / -perm -4000 -type f 2>/dev/null` untuk cek semua binary setuid di sistem, dan hapus setuid dari binary yang tidak butuh.

---

## sudo vs su vs Login sebagai root

```
Tiga cara mendapat privilege root — tidak semua sama amannya:

  ┌─────────────────────────────────────────────────────────┐
  │  sudo command                                              │
  │  → Jalankan 1 command dengan privilege root                │
  │  → Pakai password USER SENDIRI (bukan password root)        │
  │  → Tercatat di /var/log/auth.log (audit trail jelas)         │
  │  → Bisa dibatasi command apa saja via /etc/sudoers           │
  │  ✅ RECOMMENDED untuk operasional harian                     │
  ├─────────────────────────────────────────────────────────┤
  │  su -                                                        │
  │  → Switch penuh jadi user root (shell baru sebagai root)      │
  │  → Butuh PASSWORD ROOT                                       │
  │  → Semua command berikutnya berjalan sebagai root TANPA log   │
  │     per-command yang jelas                                    │
  │  ⚠ Kurang audit trail dibanding sudo                          │
  ├─────────────────────────────────────────────────────────┤
  │  Login langsung sebagai root (SSH root@server)                │
  │  → Tidak ada jejak "user mana yang jadi root"                 │
  │  → Kalau credential root leak, attacker langsung full access  │
  │  ❌ SANGAT TIDAK DIREKOMENDASIKAN, terutama via SSH            │
  └─────────────────────────────────────────────────────────┘
```

| Aspek | `sudo` | `su -` | SSH langsung sebagai root |
|-------|--------|--------|------------------------------|
| Password dipakai | Password user sendiri | Password root | Password/key root |
| Audit trail | Jelas — tercatat siapa & command apa | Kurang jelas setelah masuk shell | Tidak ada — semua log seolah dari root |
| Bisa dibatasi command | Ya, via `/etc/sudoers` | Tidak — full access | Tidak — full access |
| Rekomendasi | ✅ Default untuk operasional | ⚠ Kadang perlu (misal maintenance panjang) | ❌ Disable di `sshd_config` |

```bash
# Setup sudo untuk user (Debian/Ubuntu)
usermod -aG sudo alice

# Setup sudo untuk user (RHEL family)
usermod -aG wheel alice

# Edit aturan sudo dengan aman (validasi syntax otomatis)
visudo

# Cek command apa saja yang boleh dijalankan user saat ini
sudo -l
```

**Best practice:** Disable root login via SSH (`PermitRootLogin no` di `/etc/ssh/sshd_config`), dan wajibkan semua akses admin lewat `sudo` dengan user masing-masing. Ini memastikan setiap aksi privileged tercatat atas nama orang yang benar-benar melakukannya.

---

## Skenario: Insiden Permission Misconfiguration

### Kejadian: Credential Leak karena Permission Terlalu Terbuka

```
Kronologi insiden:

  Hari 1: Developer deploy aplikasi ke server production
          │
          │  File .env (berisi DB password, API key) dibuat
          │  dengan permission default umask → 644 (rw-r--r--)
          │
          ▼
  Hari 3: Server yang sama juga dipakai untuk hosting beberapa
          aplikasi lain milik tim berbeda (shared server, banyak user)
          │
          │  User lain di server (developer_b) yang tidak seharusnya
          │  punya akses ke aplikasi ini, ternyata BISA membaca .env
          │  karena permission 644 → "others" punya read access
          │
          ▼
  Hari 5: developer_b (tanpa niat jahat, sekadar eksplorasi)
          membuka .env, melihat DB password production
          │
          ▼
  Hari 10: Credential yang sama ternyata dipakai juga oleh
          developer_b untuk keperluan lain, dan tanpa sengaja
          ter-commit ke public repository di GitHub
          │
          ▼
  ❌ DB password production leak ke publik
  ❌ Perlu emergency password rotation ke semua service
```

### Root Cause & Fix

```
Root cause:
  1. File credential (.env) permission 644 → bisa dibaca semua user
  2. Tidak ada isolasi antar-aplikasi di shared server
  3. Tidak ada monitoring/audit siapa yang akses file sensitif

Fix:
  ┌────────────────────────────────────────────────────────┐
  │ 1. Perbaiki permission SEGERA                             │
  │    $ chmod 600 .env                                        │
  │    $ chown app_user:app_user .env                          │
  │    → hanya owner (app_user) yang bisa baca/tulis            │
  ├────────────────────────────────────────────────────────┤
  │ 2. Set umask default lebih strict untuk service account    │
  │    umask 077  (di ~/.bashrc atau systemd service file)     │
  │    → file baru otomatis 600, direktori baru otomatis 700   │
  ├────────────────────────────────────────────────────────┤
  │ 3. Audit semua file sensitif di server                     │
  │    $ find / -name "*.env" -o -name "*.pem" -o \             │
  │        -name "*credentials*" 2>/dev/null                    │
  │    → cek permission tiap file yang ditemukan                │
  ├────────────────────────────────────────────────────────┤
  │ 4. Rotate semua credential yang sempat exposed              │
  │    → ganti DB password, API key, regenerate secret          │
  ├────────────────────────────────────────────────────────┤
  │ 5. Jangka panjang: pisahkan aplikasi antar-tim              │
  │    → container/VM terpisah, bukan shared server             │
  │    → pakai secret manager (bukan file .env di disk)         │
  └────────────────────────────────────────────────────────┘
```

**Penting:** Permission default (`umask`) di banyak sistem adalah `022` untuk file (hasil akhir `644`) — cukup aman untuk file publik, tapi **tidak aman** untuk file berisi credential. Selalu set permission eksplisit (`600`) untuk file sensitif, jangan andalkan default.

---

## Ringkasan Konsep

```
User & Group:
  UID/GID → identitas numerik, nama hanya label
  /etc/passwd → info user (bukan password)
  /etc/shadow → password hash (hanya root bisa baca)
  /etc/group  → daftar group & anggota

Permission rwx:
  r=4 w=2 x=1 → kombinasi jadi 1 digit octal
  Owner | Group | Others → 3 digit (misal: 755, 644, 600)

Special permission:
  setuid (4000) → jalan sebagai owner file (contoh: passwd)
  setgid (2000) → file baru inherit group direktori
  sticky (1000) → hanya bisa hapus file milik sendiri (contoh: /tmp)

Privilege escalation:
  sudo  → per-command, audit jelas, RECOMMENDED
  su -  → full shell root, kurang audit
  root login langsung → HINDARI, terutama via SSH

Golden rule:
  File sensitif → 600, owner tepat
  Direktori privat → 700
  Jangan pernah 777 di production
```

---

*Dokumen ini berdasarkan Linux (kernel, distro, dan tooling) yang stabil dan didukung luas per 2026.*
