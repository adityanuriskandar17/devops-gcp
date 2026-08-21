# Linux Fundamentals

Dokumentasi dasar **Linux** — fondasi sistem operasi yang menjalankan hampir semua server, container, dan cloud infrastructure di dunia DevOps. Materi ini **cloud-agnostic**: berlaku baik VM-nya jalan di GCP, AWS, Azure, on-premise, atau bahkan di laptop sendiri.

---

## Kenapa Linux Penting untuk DevOps?

Hampir semua tooling DevOps modern — Docker, Kubernetes, Ansible, Terraform, CI/CD runner — **jalan di atas Linux** atau dirancang dengan asumsi Linux sebagai target deployment. Bahkan managed service di cloud (Compute Engine VM, GKE node, Cloud SQL instance) di baliknya adalah Linux.

```
Kenapa DevOps engineer WAJIB paham Linux:

  ┌─────────────────────────────────────────────────────┐
  │  Tanpa paham Linux              Dengan paham Linux    │
  ├─────────────────────────────────────────────────────┤
  │  ❌ Panik kalau disk penuh       ✅ df -h, du -sh,     │
  │                                     langsung tahu      │
  │                                     penyebabnya         │
  │  ❌ Restart server kalau app     ✅ systemctl status,  │
  │     "aneh"                         journalctl -xe      │
  │  ❌ Semua orang jadi root        ✅ users/groups,      │
  │                                     sudo yang benar     │
  │  ❌ Copy-paste command tanpa     ✅ Ngerti apa yang    │
  │     ngerti akibatnya               command lakukan     │
  │  ❌ Takut sentuh permission      ✅ Paham rwx, chmod,  │
  │                                     chown dengan aman   │
  └─────────────────────────────────────────────────────┘
```

**Penting:** Semua service GCP yang sudah didokumentasikan di folder lain (Compute-Engine, GKE, Cloud-SQL, dll) pada akhirnya berjalan di atas Linux. Dokumentasi ini melengkapi bagian fundamental yang sering terlewat karena tertutup abstraksi Console/managed service.

---

## Kernel vs Distro vs Userland

```
                    Anatomi Sistem Linux
  ┌─────────────────────────────────────────────────────────┐
  │  USERLAND (Applications)                                  │
  │  nginx, docker, python, bash, vim, systemd services       │
  ├─────────────────────────────────────────────────────────┤
  │  USERLAND (Core Utilities & Libraries)                     │
  │  GNU coreutils (ls, cp, mv, cat) glibc, bash shell         │
  ├─────────────────────────────────────────────────────────┤
  │  KERNEL (Linux)                                            │
  │  Process scheduler, memory management, device drivers,     │
  │  filesystem, network stack, syscall interface              │
  ├─────────────────────────────────────────────────────────┤
  │  HARDWARE                                                   │
  │  CPU, RAM, Disk, NIC                                        │
  └─────────────────────────────────────────────────────────┘

  "Distro" = Kernel Linux + GNU userland + package manager
             + tooling tambahan, dikemas jadi 1 OS siap pakai
             (contoh: Ubuntu, Debian, RHEL, Fedora, Arch)
```

| Layer | Fungsi | Contoh |
|-------|--------|--------|
| **Kernel** | Inti OS — kelola CPU, memory, disk, network, proses | Linux kernel (satu-satunya bagian yang "Linux" sesungguhnya) |
| **GNU Userland** | Tools dasar yang jalan di atas kernel | bash, coreutils (`ls`, `cp`), glibc |
| **Package Manager** | Install/kelola software | apt, dnf, zypper, pacman |
| **Distro** | Paket lengkap kernel + userland + PM + default config | Ubuntu, Debian, RHEL, Fedora, Arch, Alpine |
| **Aplikasi** | Software yang dijalankan user | nginx, docker, postgresql, aplikasi kamu |

**Catatan:** Secara teknis, "Linux" hanya merujuk ke **kernel**. Sistem operasi lengkap yang biasa disebut "Linux" (Ubuntu, dst) lebih tepat disebut **GNU/Linux**, karena sebagian besar userland tools berasal dari proyek GNU.

---

## Daftar Dokumentasi

| # | File | Isi |
|---|------|-----|
| 01 | [Konsep Dasar Linux](01-concepts.md) | Kernel vs distro, keluarga distro, Filesystem Hierarchy Standard, boot process, skenario pilih distro |
| 02 | [User, Group & Permission](02-file-permissions.md) | UID/GID, rwx & octal, chmod/chown, setuid/setgid/sticky bit, sudo vs su, skenario insiden permission |
| 03 | [Process Management](03-process-management.md) | Process state, job control, signals, systemd unit, systemctl, journalctl, skenario debug zombie process |
| 04 | [Package Management](04-package-management.md) | apt vs dnf vs zypper vs snap/flatpak, repository & GPG, install/upgrade/remove, security updates |
| 05 | [Commands Cheatsheet](05-commands-cheatsheet.md) | Navigation, file ops, text processing, disk, networking, archiving, search, redirection & pipes |
| 06 | [Best Practices](06-best-practices.md) | Hardening dasar, permission hygiene, log rotation, monitoring disk/inode, checklist production |

---

## Quick Start

```
1. Login ke server (SSH atau console)
       $ ssh user@server

2. Kenali sistem yang kamu pakai
       $ cat /etc/os-release        # distro & versi
       $ uname -r                   # versi kernel
       $ hostnamectl                # ringkasan sistem

3. Cek siapa kamu & apa yang boleh kamu lakukan
       $ whoami
       $ groups
       $ sudo -l                    # command apa saja yang boleh sudo

4. Kenali resource sistem
       $ df -h                      # disk usage
       $ free -h                    # memory usage
       $ top                        # proses & CPU real-time

5. Lanjut ke dokumentasi 01-concepts.md untuk pemahaman mendalam
```

---

*Dokumen ini berdasarkan Linux (kernel, distro, dan tooling) yang stabil dan didukung luas per 2026.*
