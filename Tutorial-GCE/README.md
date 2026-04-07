# Tutorial Google Compute Engine (GCE)

Kumpulan tutorial **hands-on** step-by-step untuk Google Compute Engine — dari create VM sampai deploy aplikasi.

---

## Daftar Tutorial

| # | File | Isi |
|---|------|-----|
| 01 | [Create VM + Nginx + MariaDB](01-create-vm-nginx-mariadb.md) | Create e2-micro VM, SSH, install Nginx, install MariaDB, secure installation, buat database & table |
| 02 | [Setup Git & SSH GitHub](02-setup-git-ssh-github.md) | Install Git, generate SSH key, add ke GitHub, SSH config, clone via SSH |
| 03 | [Integrasi DB, Backend & Nginx](03-integrasikan-database-backend-nginx.md) | Endpoint API, konfigurasi Nginx (backup + reverse proxy), Postman / tes lewat IP VM, troubleshooting |
| 04 | [VM Frontend + Nginx + Git](04-vm-frontend-nginx-git.md) | VM kedua untuk UI (spek sama instance backend), Console, install Nginx & Git, repo GitHub, integrasi ke API backend |
| 05 | [Setup Domain & HTTPS](05-setup-domain-https.md) | DNS A record, Certbot + Let's Encrypt SSL gratis, redirect HTTP → HTTPS, auto-renew |

---

## Quick Reference

```
VM: e2-micro (2 vCPU shared, 1 GB RAM)
OS: Debian 12 (Bookworm)
Web Server: Nginx
Database: MariaDB (pengganti MySQL di Debian 12)
```
