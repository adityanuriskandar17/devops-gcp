# Package Management

Dokumentasi **package management** di Linux — perbandingan `apt`, `dnf`/`yum`, `zypper`, dan `snap`/`flatpak`, konsep repository & GPG signing, workflow install/upgrade/remove side-by-side untuk `apt` dan `dnf`, serta cara cek dan apply security update.

---

## Perbandingan Package Manager

```
Package Manager per Keluarga Distro:

  Debian/Ubuntu          RHEL/Fedora/Rocky/Alma      SUSE/openSUSE
  ┌─────────────┐        ┌──────────────────┐        ┌────────────┐
  │  apt          │        │  dnf (yum lama)    │        │  zypper      │
  │  (frontend)   │        │  (frontend)         │        │  (frontend)  │
  ├─────────────┤        ├──────────────────┤        ├────────────┤
  │  dpkg         │        │  rpm                │        │  rpm         │
  │  (backend)    │        │  (backend)          │        │  (backend)   │
  ├─────────────┤        ├──────────────────┤        ├────────────┤
  │  .deb files   │        │  .rpm files          │        │  .rpm files  │
  └─────────────┘        └──────────────────┘        └────────────┘

  Cross-distro / Universal Package Format:
  ┌────────────────────┐        ┌────────────────────┐
  │  snap (Canonical)    │        │  flatpak (community) │
  │  sandboxed, auto-     │        │  sandboxed, populer   │
  │  update, dari Ubuntu  │        │  untuk aplikasi desktop│
  └────────────────────┘        └────────────────────┘
```

| Package Manager | Distro | Format | Dependency Resolution | Karakteristik |
|-------------------|--------|--------|--------------------------|-----------------|
| **apt** | Debian, Ubuntu, Mint | `.deb` | Otomatis | Frontend paling umum dipakai di Debian family, di atas `dpkg` |
| **dnf** | Fedora, RHEL 8+, Rocky, Alma | `.rpm` | Otomatis (pengganti `yum`) | Lebih cepat & modern dari `yum`, tetap backward compatible |
| **yum** | RHEL 7 dan lebih lama | `.rpm` | Otomatis | Pendahulu `dnf`, masih banyak dipakai di sistem legacy |
| **zypper** | openSUSE, SLES | `.rpm` | Otomatis | Punya fitur unik seperti "patterns" (grup paket) |
| **pacman** | Arch Linux | paket Arch | Otomatis | Sangat cepat, filosofi minimalis |
| **snap** | Cross-distro (utamanya Ubuntu) | snap package | Self-contained (bundle dependency) | Auto-update, sandboxed, tapi ukuran lebih besar & startup lebih lambat |
| **flatpak** | Cross-distro | flatpak bundle | Self-contained | Populer untuk aplikasi desktop, sandbox via portal |

| Kelebihan apt/dnf/zypper (native) | Kelebihan snap/flatpak (universal) |
|--------------------------------------|----------------------------------------|
| Terintegrasi penuh dengan sistem, ringan | Sama persis di semua distro (1 paket untuk semua) |
| Dependency shared antar-aplikasi (hemat disk) | Sandboxed — lebih terisolasi dari sistem |
| Update lewat repository resmi distro | Auto-update tanpa perlu campur tangan user |
| Startup aplikasi lebih cepat | Vendor bisa rilis versi terbaru tanpa menunggu distro |

**Best practice:** Untuk **server production**, prioritaskan package manager native (`apt`/`dnf`/`zypper`) — lebih ringan, terintegrasi baik dengan sistem, dan update security patch lebih cepat sinkron dengan distro. `snap`/`flatpak` lebih relevan untuk **desktop** atau kebutuhan spesifik (misal butuh versi software yang sangat baru dan sandboxing).

---

## Konsep Repository & GPG Signing

```
Flow Install Package dari Repository:

  1. Package manager cek daftar repository yang terdaftar
     (sources.list untuk apt, /etc/yum.repos.d/ untuk dnf)
                     │
                     ▼
  2. Download index paket dari repository (metadata: versi,
     dependency, checksum) — bukan paket-nya dulu
                     │
                     ▼
  3. Verifikasi signature repository dengan GPG public key
     yang sudah ditambahkan ke sistem
                     │
              ┌──────┴──────┐
              ▼             ▼
        ✅ Signature      ❌ Signature invalid/
           valid             tidak dikenal
              │             │
              ▼             ▼
        Lanjut install   DITOLAK — package manager
                          refuse install (mencegah
                          supply-chain attack)
                     │
                     ▼
  4. Download paket .deb/.rpm, verifikasi checksum,
     lalu install via dpkg/rpm
```

### apt (Debian/Ubuntu)

```
/etc/apt/sources.list                → daftar repository utama (legacy format)
/etc/apt/sources.list.d/*.list        → repository tambahan (per-file, modern)
/etc/apt/trusted.gpg.d/                → GPG public key yang dipercaya
```

```bash
# Contoh isi 1 baris sources.list
deb http://archive.ubuntu.com/ubuntu focal main restricted

# Tambah repository pihak ketiga + GPG key (contoh pola umum modern)
curl -fsSL https://example.com/repo/gpg-key.asc | \
    sudo gpg --dearmor -o /usr/share/keyrings/example-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/example-archive-keyring.gpg] \
    https://example.com/repo stable main" | \
    sudo tee /etc/apt/sources.list.d/example.list
sudo apt update
```

### dnf (RHEL family)

```
/etc/yum.repos.d/*.repo               → definisi repository (per-file)
```

```ini
# Contoh /etc/yum.repos.d/example.repo
[example-repo]
name=Example Repository
baseurl=https://example.com/repo/rhel/9/x86_64/
enabled=1
gpgcheck=1
gpgkey=https://example.com/repo/gpg-key.asc
```

```bash
sudo dnf config-manager --add-repo https://example.com/repo/example.repo
sudo dnf makecache
```

**Penting:** Jangan pernah set `gpgcheck=0` (dnf) atau menambahkan repository dengan `[trusted=yes]`/tanpa signature verification (apt) kecuali benar-benar tahu risikonya. GPG signing memastikan paket yang diinstall memang berasal dari maintainer yang sah dan tidak dimodifikasi di tengah jalan (supply-chain attack).

---

## Workflow Install/Upgrade/Remove: apt vs dnf

| Aksi | apt (Debian/Ubuntu) | dnf (RHEL/Fedora/Rocky/Alma) |
|------|------------------------|----------------------------------|
| Update index repository | `sudo apt update` | `sudo dnf check-update` (tidak wajib, dnf auto-refresh) |
| Install paket | `sudo apt install nginx` | `sudo dnf install nginx` |
| Install versi spesifik | `sudo apt install nginx=1.18.0-0ubuntu1` | `sudo dnf install nginx-1.20.1` |
| Upgrade 1 paket | `sudo apt install --only-upgrade nginx` | `sudo dnf upgrade nginx` |
| Upgrade semua paket | `sudo apt upgrade` (minor) / `sudo apt full-upgrade` (bisa remove paket) | `sudo dnf upgrade` (semua paket, termasuk yang butuh remove/replace) |
| Remove paket | `sudo apt remove nginx` (config tetap ada) | `sudo dnf remove nginx` |
| Remove + config | `sudo apt purge nginx` | `sudo dnf remove nginx` (rpm biasanya sudah bersih config non-`%config(noreplace)`) |
| Cari paket | `apt search nginx` | `dnf search nginx` |
| Info detail paket | `apt show nginx` | `dnf info nginx` |
| List paket terinstall | `apt list --installed` | `dnf list installed` |
| Bersihkan dependency tak terpakai | `sudo apt autoremove` | `sudo dnf autoremove` |
| Bersihkan cache paket | `sudo apt clean` / `sudo apt autoclean` | `sudo dnf clean all` |
| Cek paket menyediakan file tertentu | `dpkg -S /usr/bin/nginx` (untuk paket terinstall) atau `apt-file search` | `dnf provides /usr/bin/nginx` |
| List semua repository | `apt policy` atau `cat /etc/apt/sources.list*` | `dnf repolist` |
| Downgrade paket | `sudo apt install nginx=VERSION_LAMA` | `sudo dnf downgrade nginx` |
| Riwayat transaksi | `cat /var/log/apt/history.log` | `dnf history` |
| Rollback transaksi terakhir | Tidak ada built-in, manual | `sudo dnf history undo LAST` |

```bash
# Workflow lengkap apt: dari update sampai bersih-bersih
sudo apt update                    # refresh index repository
sudo apt list --upgradable          # lihat apa saja yang bisa diupgrade
sudo apt upgrade                    # upgrade semua paket (aman, tidak remove)
sudo apt install htop                # install paket baru
sudo apt autoremove                 # bersihkan dependency tidak terpakai
sudo apt clean                      # bersihkan cache .deb yang sudah didownload
```

```bash
# Workflow lengkap dnf: dari update sampai bersih-bersih
sudo dnf check-update                # cek paket apa saja yang punya update
sudo dnf upgrade                     # upgrade semua paket
sudo dnf install htop                 # install paket baru
sudo dnf autoremove                  # bersihkan dependency tidak terpakai
sudo dnf clean all                   # bersihkan cache metadata & paket
sudo dnf history                      # lihat riwayat transaksi (bisa di-undo)
```

---

## Cek & Apply Security Updates

```
Flow Security Update:

  Repository resmi menandai sebagian update sebagai "security"
  (biasanya dari repo terpisah, misal *-security di Ubuntu)
                     │
                     ▼
  ┌────────────────────────────────────────────────────┐
  │  Manual check                                         │
  │  apt:  apt list --upgradable                           │
  │        (lalu filter manual atau pakai unattended-upgrades │
  │         --dry-run untuk lihat security-only)              │
  │  dnf:  dnf check-update --security                       │
  │        dnf updateinfo list security                       │
  └────────────────────────────────────────────────────┘
                     │
                     ▼
  ┌────────────────────────────────────────────────────┐
  │  Automated security update                            │
  │  apt:  unattended-upgrades (paket resmi Ubuntu/Debian)   │
  │  dnf:  dnf-automatic (dengan config apply_updates=yes)    │
  └────────────────────────────────────────────────────┘
```

```bash
# apt — cek & install security update
sudo apt update
apt list --upgradable                       # lihat semua yang bisa diupgrade
sudo apt install unattended-upgrades          # tool otomatisasi security patch
sudo dpkg-reconfigure unattended-upgrades      # enable via wizard
# config manual: /etc/apt/apt.conf.d/50unattended-upgrades
#   Unattended-Upgrade::Allowed-Origins { "${distro_id}:${distro_codename}-security"; }

# dnf — cek & install security update
sudo dnf check-update --security              # (butuh plugin dnf-plugins-core di beberapa distro)
sudo dnf updateinfo list security              # list advisory security
sudo dnf update --security                     # hanya apply update terkait security
sudo dnf install dnf-automatic                  # tool otomatisasi
sudo systemctl enable --now dnf-automatic-install.timer
```

**Best practice:** Aktifkan automated security update (`unattended-upgrades` / `dnf-automatic`) minimal untuk patch **security-only**, bukan semua upgrade — supaya server tetap terlindungi dari vulnerability terbaru tanpa risiko breaking change dari feature update yang tidak direncanakan. Untuk major/minor version upgrade non-security, tetap lakukan **manual & terjadwal** dengan testing di staging dulu.

**Catatan:** Selalu cek `apt list --upgradable` atau `dnf check-update` secara rutin (atau lewat monitoring/alerting) sebagai bagian dari **patch management** — jangan hanya andalkan automated update tanpa visibility, karena beberapa update (misal kernel) tetap butuh reboot manual untuk benar-benar aktif.

---

## Ringkasan Konsep

```
Package manager per keluarga:
  Debian/Ubuntu → apt   (dpkg, .deb)
  RHEL family   → dnf   (rpm, .rpm) — pengganti yum
  SUSE          → zypper (rpm, .rpm)
  Universal     → snap / flatpak (sandboxed, cross-distro)

Repository & trust:
  sources.list / sources.list.d (apt)
  /etc/yum.repos.d/*.repo (dnf)
  GPG signing → WAJIB, mencegah supply-chain attack
  Jangan disable gpgcheck kecuali benar-benar paham risikonya

Workflow inti (apt ↔ dnf):
  update index      : apt update      ↔ dnf check-update
  install            : apt install     ↔ dnf install
  upgrade semua      : apt upgrade     ↔ dnf upgrade
  remove              : apt remove      ↔ dnf remove
  bersih dependency   : apt autoremove  ↔ dnf autoremove

Security updates:
  Cek rutin: apt list --upgradable | dnf check-update --security
  Otomatisasi: unattended-upgrades (apt) | dnf-automatic (dnf)
  Security patch → boleh otomatis, feature upgrade → manual + testing
```

---

*Dokumen ini berdasarkan Linux (kernel, distro, dan tooling) yang stabil dan didukung luas per 2026.*
