# Docker & Containers

Dokumentasi lengkap **Docker** — platform containerization yang membungkus aplikasi beserta seluruh dependency-nya menjadi satu unit portable bernama **container**. Folder ini fokus ke Docker sebagai *layer* containerization (image, Dockerfile, registry, networking, volume, compose); orkestrasi container skala cluster (scheduling, self-healing, scaling banyak node) sudah dibahas di [`GKE/`](../GKE/01-concepts.md).

**Tooling:** Docker Engine, Docker CLI, Docker Compose
**Platform:** Cloud-agnostic — jalan di laptop, VM, on-prem, atau cloud manapun (GCP, AWS, Azure)

---

## Kenapa Docker Penting di DevOps Toolchain

Docker menjawab masalah klasik *"jalan di laptop saya, tapi tidak jalan di server"*. Dengan membungkus aplikasi + runtime + library + config ke dalam satu **image** yang immutable, environment development, staging, dan production menjadi **identik**.

```
Tanpa Docker:                          Dengan Docker:

  Developer laptop                       Developer laptop
    Node 18.2, OpenSSL 1.1                  Image: myapp:1.0
    ✅ App jalan                             (Node 18.2 + OpenSSL 1.1 + app)
                                             ✅ App jalan
  Server production
    Node 20.1, OpenSSL 3.0                 Server production
    ❌ App error — API Node berubah          Image: myapp:1.0 (SAMA)
                                             ✅ App jalan — environment identik
  "Works on my machine" problem           "Build once, run anywhere"
```

Docker menjadi **fondasi** dari banyak praktik DevOps modern:

```
┌─────────────────────────────────────────────────────────────────┐
│                     DevOps Toolchain                            │
│                                                                 │
│  Source Code ──► CI Build ──► Docker Image ──► Registry         │
│  (Git)           (test, lint)   (docker build)  (push)          │
│                                       │                          │
│                                       ▼                          │
│                              ┌─────────────────┐                 │
│                              │  Deploy target   │                 │
│                              │                  │                │
│                              │  • 1 VM (docker  │                │
│                              │    run / compose)│                │
│                              │  • Kubernetes/GKE │                │
│                              │    (orkestrasi)   │                │
│                              │  • Cloud Run       │                │
│                              └─────────────────┘                 │
│                                                                 │
│  Docker = fondasi packaging & portability untuk SEMUA target di │
│  atas — baik yang orchestrated maupun yang tidak.               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arsitektur Docker

Docker bukan satu proses monolitik — ada beberapa komponen yang bekerja berlapis dari CLI hingga proses container yang sesungguhnya.

```
┌───────────────────────────────────────────────────────────────────────┐
│                            Docker Architecture                         │
│                                                                        │
│  ┌──────────────┐   REST API (Unix socket / TCP)                       │
│  │ Docker Client │──────────────────────────┐                          │
│  │ (docker CLI)  │                          │                          │
│  └──────────────┘                          ▼                          │
│                                  ┌────────────────────┐                 │
│  User ketik:                     │  Docker Daemon      │                 │
│  docker run nginx                │  (dockerd)          │                 │
│                                  │                     │                 │
│                                  │  • Manage image      │                 │
│                                  │  • Manage network    │                 │
│                                  │  • Manage volume     │                 │
│                                  │  • Terima API request │                │
│                                  └──────────┬──────────┘                 │
│                                             │ gRPC                       │
│                                             ▼                           │
│                                  ┌────────────────────┐                 │
│                                  │  containerd          │                 │
│                                  │  (container runtime  │                 │
│                                  │   manager)            │                 │
│                                  │                        │                │
│                                  │  • Pull image           │               │
│                                  │  • Manage container      │               │
│                                  │    lifecycle (start/stop) │               │
│                                  └──────────┬───────────┘                 │
│                                             │ spawn                      │
│                                             ▼                           │
│                                  ┌────────────────────┐                 │
│                                  │  runc                │                 │
│                                  │  (low-level OCI      │                 │
│                                  │   runtime)             │               │
│                                  │                         │               │
│                                  │  • Buat namespaces      │               │
│                                  │  • Buat cgroups          │               │
│                                  │  • exec() proses          │              │
│                                  └──────────┬───────────┘                 │
│                                             │                            │
│                                             ▼                           │
│                                  ┌────────────────────┐                 │
│                                  │  Container            │                 │
│                                  │  (proses Linux biasa  │                 │
│                                  │   yang terisolasi)     │                │
│                                  └────────────────────┘                 │
└───────────────────────────────────────────────────────────────────────┘
```

| Komponen | Peran |
|----------|-------|
| **Docker Client (CLI)** | Interface `docker` yang dipakai user — mengirim command ke daemon lewat REST API |
| **Docker Daemon (`dockerd`)** | Proses background yang menerima request, mengatur image/network/volume, dan mendelegasikan eksekusi container ke containerd |
| **containerd** | Container runtime tingkat tinggi — mengatur lifecycle container (pull image, create, start, stop), dipakai juga oleh Kubernetes |
| **runc** | Implementasi referensi OCI (Open Container Initiative) runtime — komponen tingkat rendah yang benar-benar membuat namespace, cgroup, dan menjalankan proses container |
| **Container** | Hasil akhirnya — proses Linux biasa yang berjalan terisolasi menggunakan namespace & cgroup (lihat [01-concepts.md](01-concepts.md)) |

**Catatan:** `docker` CLI, `dockerd`, dan `containerd` bisa berjalan di mesin yang sama (umum di laptop/VM) atau `dockerd` bisa diakses remote lewat TCP socket (umum di setup CI/CD atau `DOCKER_HOST`).

---

## Daftar Dokumentasi

| # | File | Isi |
|---|------|-----|
| 01 | [Konsep & Cara Kerja](01-concepts.md) | Namespaces, cgroups, union filesystem, image layers, image vs container vs registry, flow `docker run` |
| 02 | [Dockerfile](02-dockerfile.md) | Instruction reference, CMD vs ENTRYPOINT, COPY vs ADD, multi-stage build, build cache optimization |
| 03 | [Images & Registry](03-images-registry.md) | Build/tag/push/pull workflow, naming convention, Docker Hub vs private vs cloud registry, image scanning |
| 04 | [Networking & Volumes](04-networking-volumes.md) | Network driver, bridge default vs user-defined, DNS antar container, port publishing, volume vs bind mount vs tmpfs |
| 05 | [Docker Compose](05-docker-compose.md) | Struktur compose file, contoh 3-tier app, compose commands, `.env` usage |
| 06 | [Commands Cheatsheet](06-commands-cheatsheet.md) | Referensi cepat semua command Docker per kategori |
| 07 | [Best Practices](07-best-practices.md) | Non-root user, minimal base image, `.dockerignore`, pin tag, health check, secrets, checklist production |

---

## Quick Start

```
1. Cek Docker Engine terpasang
   docker --version
   docker info

2. Jalankan container pertama
   docker run hello-world

3. Jalankan web server sederhana (interactive)
   docker run -d -p 8080:80 --name web nginx
   → buka browser: http://localhost:8080

4. Build image sendiri dari Dockerfile minimal
```

```bash
# Cek instalasi
docker --version
docker info

# Test paling dasar — pull image kecil, jalankan, exit
docker run hello-world

# Buat project kecil
mkdir quickstart && cd quickstart
cat > Dockerfile <<'EOF'
FROM alpine:3.20
CMD ["echo", "Hello from my first image!"]
EOF

# Build image, beri tag
docker build -t quickstart:1.0 .

# Jalankan container dari image yang baru dibuat
docker run quickstart:1.0
# Output: Hello from my first image!

# Lihat image yang sudah ada di local
docker images

# Bersihkan container yang sudah exit
docker container prune
```

**Best practice:** Setelah paham quick start ini, lanjut ke [01-concepts.md](01-concepts.md) untuk mengerti **kenapa** container bisa terisolasi sebelum masuk ke [02-dockerfile.md](02-dockerfile.md) untuk menulis Dockerfile yang efisien.

---

*Dokumen ini berdasarkan Docker Engine & Docker CLI versi stabil per 2026.*
