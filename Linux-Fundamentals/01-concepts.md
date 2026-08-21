# Konsep Dasar Linux

Dokumentasi konsep fundamental **Linux** — apa itu kernel vs GNU/Linux vs distro, keluarga-keluarga distro besar, Filesystem Hierarchy Standard (FHS), dan proses boot dari power-on sampai login prompt.

---

## Apa itu Linux?

"Linux" sering dipakai secara longgar untuk merujuk ke seluruh sistem operasi, padahal secara teknis **Linux hanya kernel-nya**.

```
Linux (kernel) dibuat oleh Linus Torvalds (1991)
       │
       │  Kernel sendirian tidak berguna — butuh:
       ▼
GNU Project (Richard Stallman, 1983) menyediakan:
       │  bash, coreutils (ls/cp/mv/cat), gcc, glibc, dll
       ▼
GNU + Linux kernel = sistem operasi lengkap
       │
       │  disebut "GNU/Linux", populer disingkat "Linux"
       ▼
Distro menambahkan: package manager, init system,
default config, tooling tambahan → siap pakai
       │
       ▼
Ubuntu, Debian, RHEL, Fedora, Arch, Alpine, dll
```

| Istilah | Definisi |
|---------|----------|
| **Kernel** | Program inti yang bicara langsung dengan hardware — scheduling CPU, memory management, driver, filesystem, network stack |
| **GNU/Linux** | Kernel Linux + GNU userland tools — sistem operasi lengkap tapi belum "dikemas" |
| **Distro (Distribution)** | GNU/Linux yang dikemas + package manager + installer + default configuration, siap diinstall end-user |
| **Free/Open Source Software (FOSS)** | Prinsip di balik semua ini — source code kernel dan sebagian besar tooling terbuka dan bisa dimodifikasi siapa saja |

**Catatan:** Ada juga distro yang **tidak** pakai GNU userland penuh, misalnya **Alpine Linux** yang pakai `musl libc` dan `busybox` sebagai pengganti glibc/coreutils — makanya image container Alpine jauh lebih kecil (±5MB vs ±70MB Ubuntu base).

---

## Keluarga Besar Distro Linux

Ratusan distro Linux ada, tapi hampir semua berasal dari beberapa "keluarga" besar berdasarkan package manager dan basis kodenya.

```
                         Linux Distro Families

  DEBIAN FAMILY                    RED HAT FAMILY
  ┌─────────────┐                  ┌──────────────┐
  │   Debian     │                  │  Red Hat      │
  │  (base, apt) │                  │  Enterprise   │
  └──────┬──────┘                  │  Linux (RHEL) │
         │                          └──────┬───────┘
         ├── Ubuntu ─┬── Kubuntu             │  (upstream source)
         │           ├── Lubuntu             ▼
         │           └── Ubuntu Server   Fedora (upstream RHEL,
         ├── Linux Mint                  rilis cepat, community)
         └── Raspberry Pi OS                 │
                                         ┌────┴────┐
  SUSE FAMILY                           ▼         ▼
  ┌──────────────┐                  CentOS Stream  Rocky Linux
  │  SUSE Linux   │                 (rolling,      Alma Linux
  │  Enterprise   │                  upstream RHEL) (RHEL rebuild,
  └──────┬───────┘                                   1:1 binary
         │                                            compatible)
         └── openSUSE (community, free)

  INDEPENDENT / ROLLING RELEASE
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │    Arch       │    │    Alpine     │    │    Gentoo     │
  │  Linux        │    │  Linux        │    │               │
  │  (pacman,     │    │  (musl+       │    │  (compile     │
  │   rolling)    │    │   busybox,    │    │   from source)│
  │               │    │   container)  │    │               │
  └──────────────┘    └──────────────┘    └──────────────┘
```

| Keluarga | Package Manager | Format Paket | Rilis | Tipikal Use Case |
|----------|-----------------|---------------|-------|-------------------|
| **Debian / Ubuntu** | `apt` (dpkg) | `.deb` | Ubuntu LTS tiap 2 tahun, Debian stabil (2-3 tahun) | Server umum, developer workstation, cloud VM default |
| **RHEL / Fedora / Rocky / Alma** | `dnf` (yum lama) | `.rpm` | RHEL siklus panjang (10 tahun support), Fedora rilis cepat | Enterprise, perusahaan butuh support kontrak & compliance |
| **SUSE / openSUSE** | `zypper` | `.rpm` | SLES siklus panjang, openSUSE lebih cepat | Enterprise (terutama Eropa), SAP workload |
| **Arch Linux** | `pacman` | paket biner Arch | Rolling release (update terus-menerus) | Power user, kustomisasi penuh, bukan untuk production server umum |
| **Alpine Linux** | `apk` | `.apk` | Rilis reguler, ringan | Base image container/Docker (ukuran kecil) |

**Best practice:** Untuk server production, pilih distro dengan **LTS (Long Term Support)** atau siklus support panjang — Ubuntu LTS, Debian stable, atau RHEL/Rocky/Alma — supaya security patch terjamin selama bertahun-tahun tanpa perlu upgrade major version tiap tahun.

---

## Filesystem Hierarchy Standard (FHS)

Semua distro Linux mengikuti struktur direktori standar yang disebut **FHS**, supaya lokasi file bisa diprediksi di sistem manapun.

```
/
├── bin, sbin     → symlink ke /usr/bin, /usr/sbin (di distro modern)
├── boot/         → kernel image, initramfs, bootloader config
├── dev/          → device files (representasi hardware sebagai file)
├── etc/          → configuration files sistem & aplikasi
├── home/         → home directory tiap user
├── lib, lib64    → symlink ke /usr/lib (shared libraries)
├── media/        → mount point removable media (USB, CD)
├── mnt/          → mount point sementara (manual mount)
├── opt/          → software pihak ketiga yang self-contained
├── proc/         → virtual filesystem — info kernel & proses (runtime)
├── root/         → home directory untuk user root
├── run/          → data runtime volatile (hilang saat reboot)
├── srv/          → data untuk service yang di-serve (web, ftp)
├── sys/          → virtual filesystem — info kernel & device (sysfs)
├── tmp/          → file temporary, biasa dibersihkan otomatis
├── usr/          → userland: binary, library, dokumentasi (bagian terbesar)
└── var/          → data yang berubah-ubah: log, cache, spool, database
```

| Direktori | Tujuan | Contoh Isi |
|-----------|--------|-----------|
| `/etc` | Configuration file sistem & aplikasi | `/etc/passwd`, `/etc/ssh/sshd_config`, `/etc/nginx/nginx.conf` |
| `/var` | Data yang tumbuh/berubah saat runtime | `/var/log`, `/var/www`, `/var/lib/mysql`, `/var/cache` |
| `/home` | Home directory user biasa (non-root) | `/home/alice`, `/home/bob` |
| `/root` | Home directory user root | Terpisah dari `/home` supaya tetap terjangkau meski `/home` gagal mount |
| `/usr` | Userland applications & data — sebagian besar filesystem ada di sini | `/usr/bin`, `/usr/lib`, `/usr/share` |
| `/opt` | Software pihak ketiga yang mandiri (bukan dari package manager distro) | `/opt/google`, `/opt/app-vendor` |
| `/proc` | Virtual FS — snapshot kernel & proses saat ini (tidak ada di disk) | `/proc/cpuinfo`, `/proc/meminfo`, `/proc/1234/status` |
| `/sys` | Virtual FS — interface kernel ke device & driver | `/sys/class/net`, `/sys/block` |
| `/tmp` | Temporary files, biasa dihapus otomatis (reboot/tmpwatch) | File sementara aplikasi |
| `/dev` | Device file — representasi hardware sebagai file | `/dev/sda`, `/dev/null`, `/dev/tty` |
| `/boot` | File yang dibutuhkan saat boot | `vmlinuz` (kernel image), `initrd.img`, konfigurasi GRUB |
| `/srv` | Data yang di-serve oleh service di server ini | Data web server, repository git |
| `/mnt`, `/media` | Mount point manual vs removable media | `/mnt/backup`, `/media/usb-drive` |

**Catatan:** `/proc` dan `/sys` bukan file sungguhan di disk — mereka adalah **virtual filesystem** yang dibuat kernel secara real-time. Baca `/proc/cpuinfo` misalnya, tidak membaca dari disk, tapi kernel men-generate isinya saat itu juga.

---

## Proses Boot Linux

Dari menekan tombol power sampai muncul login prompt, sistem melalui beberapa tahap.

```
Boot Process Flow:

  ┌──────────────────────────────────────────────────────┐
  │  1. Power On → BIOS/UEFI                                │
  │     Firmware motherboard, POST (Power-On Self-Test),    │
  │     cari bootable device                                 │
  └──────────────────────┬───────────────────────────────┘
                         ▼
  ┌──────────────────────────────────────────────────────┐
  │  2. Bootloader (GRUB2 / systemd-boot)                    │
  │     Baca konfigurasi dari /boot, tampilkan menu OS        │
  │     (kalau dual-boot / multiple kernel version),          │
  │     load kernel image + initramfs ke memory               │
  └──────────────────────┬───────────────────────────────┘
                         ▼
  ┌──────────────────────────────────────────────────────┐
  │  3. Kernel + initramfs                                    │
  │     Kernel mulai jalan, mount root filesystem sementara    │
  │     dari initramfs, load driver esensial (disk, filesystem)│
  └──────────────────────┬───────────────────────────────┘
                         ▼
  ┌──────────────────────────────────────────────────────┐
  │  4. Mount Root Filesystem (real root, dari disk)          │
  │     Kernel pivot dari initramfs ke root filesystem asli    │
  └──────────────────────┬───────────────────────────────┘
                         ▼
  ┌──────────────────────────────────────────────────────┐
  │  5. Init System (systemd di distro modern)                │
  │     PID 1 — proses pertama yang dijalankan kernel          │
  │     Jalankan target/runlevel default, start semua service  │
  │     (network, ssh, cron, aplikasi, dll)                    │
  └──────────────────────┬───────────────────────────────┘
                         ▼
  ┌──────────────────────────────────────────────────────┐
  │  6. Login Prompt / Display Manager                        │
  │     Server: TTY login prompt / SSH ready                   │
  │     Desktop: display manager (GDM/SDDM) muncul              │
  └──────────────────────────────────────────────────────┘
```

| Tahap | BIOS Klasik | UEFI (modern) |
|-------|-------------|----------------|
| Firmware | BIOS, mode 16-bit, terbatas | UEFI, mode 32/64-bit, lebih fleksibel |
| Partition table | MBR (maks 4 partisi primary, disk ≤2TB) | GPT (partisi lebih banyak, disk >2TB) |
| Boot process | Baca MBR → bootloader stage 1/2 | Baca EFI System Partition langsung |
| Secure Boot | Tidak didukung | Didukung — verifikasi signature bootloader/kernel |

**Best practice:** Untuk VM di cloud (termasuk GCP), gunakan image dengan **UEFI + Secure Boot** aktif (Shielded VM di GCP) supaya proses boot terverifikasi dan tidak bisa disusupi bootkit/rootkit.

---

## Skenario: Pilih Distro untuk Production Server vs Desktop

### Kasus: Tim DevOps Perlu Setup Server Production Baru

```
Kebutuhan: Server production untuk API backend, harus stabil
           bertahun-tahun, minim downtime, predictable update.

  Kandidat:
  ┌────────────────────────────────────────────────────────┐
  │ Ubuntu Server LTS 24.04                                   │
  │  ✅ Support 5 tahun (bisa extend 10 tahun via ESM)         │
  │  ✅ Package repository sangat lengkap (apt)                │
  │  ✅ Dokumentasi & community terbesar                        │
  │  ✅ Default image di hampir semua cloud provider            │
  ├────────────────────────────────────────────────────────┤
  │ Rocky Linux 9                                              │
  │  ✅ 1:1 binary compatible dengan RHEL (gratis)               │
  │  ✅ Support ~10 tahun                                        │
  │  ✅ Pilihan tepat kalau perusahaan sudah pakai RHEL family    │
  │  ⚠ Ekosistem apt-based tooling kadang butuh adaptasi          │
  ├────────────────────────────────────────────────────────┤
  │ Arch Linux                                                  │
  │  ❌ Rolling release → breaking change bisa terjadi kapan saja │
  │  ❌ Tidak ada LTS — tidak cocok untuk production yang butuh   │
  │     stabilitas jangka panjang                                │
  │  ✅ Cocok untuk lab/testing yang butuh software paling baru    │
  └────────────────────────────────────────────────────────┘

  Keputusan: Ubuntu Server 24.04 LTS
    → Alasan: dukungan jangka panjang, ekosistem tooling DevOps
      (Docker, Ansible, Terraform) paling matang di Debian/Ubuntu,
      tim sudah familiar dengan apt.
```

### Kasus: Developer Butuh Laptop Desktop untuk Ngoding

```
Kebutuhan: Daily driver, butuh software terbaru, driver hardware
           lengkap (WiFi, GPU), UI nyaman.

  Kandidat:
  ┌────────────────────────────────────────────────────────┐
  │ Ubuntu Desktop / Linux Mint                                │
  │  ✅ Driver hardware paling lengkap out-of-the-box            │
  │  ✅ Software Center mudah dipakai                            │
  │  ✅ Cocok untuk yang baru pindah dari Windows/Mac             │
  ├────────────────────────────────────────────────────────┤
  │ Fedora Workstation                                          │
  │  ✅ Software lebih baru daripada Ubuntu LTS                  │
  │  ✅ Bagus untuk develop aplikasi yang target RHEL family      │
  ├────────────────────────────────────────────────────────┤
  │ Arch Linux (+ AUR)                                          │
  │  ✅ Kontrol penuh, software paling baru, ringan               │
  │  ⚠ Butuh effort setup & maintenance manual lebih besar        │
  └────────────────────────────────────────────────────────┘

  Keputusan tergantung preferensi: stabilitas & kemudahan
  (Ubuntu/Mint) vs kontrol & software terbaru (Fedora/Arch).
```

**Penting:** Untuk server production, **jangan** pilih rolling-release distro (Arch, Gentoo) — risiko breaking change saat update jauh lebih tinggi dibanding distro dengan siklus rilis stabil (Ubuntu LTS, Debian stable, RHEL family).

---

## Ringkasan Konsep

```
Linux (kernel) + GNU userland = GNU/Linux
GNU/Linux + package manager + tooling = Distro

Keluarga distro besar:
  Debian/Ubuntu  → apt,    .deb
  RHEL family    → dnf,    .rpm
  SUSE           → zypper, .rpm
  Arch           → pacman, rolling release
  Alpine         → apk,    minimal (container)

FHS (Filesystem Hierarchy Standard):
  /etc  → config
  /var  → data yang berubah (log, cache, database)
  /home → data user
  /usr  → aplikasi & library
  /proc, /sys → virtual FS, info kernel real-time

Boot process:
  BIOS/UEFI → Bootloader (GRUB) → Kernel + initramfs
            → Mount root FS → systemd (PID 1) → Login

Pilih distro production:
  Butuh: LTS / long-term support, ekosistem matang, stabil
  Hindari: rolling release untuk server critical
```

---

*Dokumen ini berdasarkan Linux (kernel, distro, dan tooling) yang stabil dan didukung luas per 2026.*
