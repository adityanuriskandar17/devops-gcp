# Konsep & Cara Kerja Docker

Dokumentasi konsep dasar Docker — **namespaces** dan **cgroups** (mekanisme isolasi di level kernel Linux), **union filesystem** dan **image layers**, hubungan antara **image, container, dan registry**, serta flow lengkap saat `docker run` dieksekusi.

**Catatan:** Perbandingan container vs VM secara umum dan kenapa container menghemat resource sudah dibahas di [`GKE/01-concepts.md`](../GKE/01-concepts.md). Dokumen ini fokus ke **bagaimana Docker secara spesifik mengimplementasikan isolasi tersebut**.

---

## Container Bukan "VM Mini" — Container Adalah Proses Linux Biasa

Container **tidak punya kernel sendiri**. Container adalah proses Linux normal yang dijalankan dengan beberapa fitur kernel diaktifkan supaya proses tersebut merasa "sendirian" di sistem.

```
VM:                                Container:

┌─────────────────────┐            ┌─────────────────────┐
│  Guest OS (kernel)   │            │  Proses aplikasi      │
│  ┌────────────────┐  │            │  (PID 1 di dalam       │
│  │  Aplikasi        │  │            │   namespace-nya)       │
│  └────────────────┘  │            └───────────┬─────────┘
└──────────┬───────────┘                        │ dibatasi oleh:
           │ Hypervisor                          │ • namespaces (lihat)
           ▼                                     │ • cgroups (batas resource)
┌─────────────────────┐                        ▼
│   Host Kernel         │            ┌─────────────────────┐
└─────────────────────┘            │   Host Kernel          │  ← SATU kernel
                                    │   (dipakai bersama       │     dipakai bersama
                                    │    semua container)       │     semua container
                                    └─────────────────────┘
```

Dua mekanisme kernel Linux yang membuat ini mungkin: **namespaces** (isolasi apa yang *terlihat*) dan **cgroups** (batasan berapa resource yang *bisa dipakai*).

---

## Namespaces — Isolasi "Apa yang Terlihat"

Namespace membuat proses hanya bisa melihat sebagian kecil dari sistem — seolah-olah dia sendirian di mesin tersebut.

| Namespace | Mengisolasi | Efek untuk container |
|-----------|-------------|----------------------|
| **PID** | Process ID | Container hanya lihat proses miliknya sendiri; proses pertama di dalam container jadi PID 1 |
| **NET** | Network stack | Container punya interface, IP address, routing table, port sendiri |
| **MNT** (Mount) | Mount point / filesystem | Container punya root filesystem (`/`) sendiri — tidak lihat filesystem host |
| **UTS** | Hostname & domain name | Container bisa punya hostname sendiri, beda dari host |
| **IPC** | Inter-Process Communication | Shared memory, semaphore container terisolasi dari proses lain |
| **USER** | User & group ID | UID 0 (root) di dalam container bisa di-map ke UID non-privileged di host |

```
Contoh isolasi PID Namespace:

  Host (lihat semua proses):              Container A (lihat namespace sendiri):
    PID 1    systemd                         PID 1    nginx        ← proses pertama
    PID 842  dockerd                         PID 7    nginx worker
    PID 1533 containerd-shim (container A)
    PID 1534   └── nginx  (PID 1 di container A)
    PID 1601 containerd-shim (container B)
    PID 1602   └── node   (PID 1 di container B)

  Dari DALAM container A, proses nginx TIDAK BISA lihat/kill proses di
  container B atau proses lain di host — namespace-nya berbeda.
```

```
Contoh isolasi NET Namespace:

  Host eth0: 10.0.0.5

  Container A                    Container B
    eth0@if12: 172.17.0.2          eth0@if14: 172.17.0.3
    (virtual interface,            (virtual interface,
     terhubung ke bridge            terhubung ke bridge
     docker0 di host)                docker0 di host)

  Container A dan B punya IP, port, routing table SENDIRI —
  keduanya bisa listen di port 80 tanpa konflik.
```

**Penting:** Sebelum Docker 1.10+, USER namespace tidak aktif secara default, sehingga root di dalam container = root sungguhan di host jika ada container breakout. Fitur `--userns-remap` (dan turunannya di container runtime modern) memungkinkan UID di-remap supaya root di container ≠ root di host — ini alasan kuat untuk juga menjalankan proses **sebagai non-root user** di dalam image (lihat [07-best-practices.md](07-best-practices.md)).

---

## Cgroups — Batasan "Berapa Resource yang Bisa Dipakai"

Kalau namespace mengatur *visibility*, **cgroups (control groups)** mengatur *kuota resource* — CPU, memory, disk I/O, network bandwidth.

```
Host: 8 vCPU, 16GB RAM

┌──────────────────────────────────────────────────────┐
│  cgroup: container-A                                  │
│    cpu.max     = 2 vCPU                                │
│    memory.max  = 2GB                                   │
│    ──► Proses di dalam TIDAK BISA melebihi batas ini    │
│        meskipun host masih punya resource kosong        │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  cgroup: container-B                                  │
│    cpu.max     = 1 vCPU                                │
│    memory.max  = 512MB                                 │
│    ──► Kalau proses coba pakai > 512MB RAM,             │
│        kernel akan OOM-kill proses tersebut ❌           │
└──────────────────────────────────────────────────────┘
```

Ini yang dikonfigurasi lewat flag seperti `docker run --cpus=2 --memory=2g`. Tanpa limit ini di-set, container **bisa memakai semua resource host** — sering jadi sumber "noisy neighbor" di server multi-container.

**Best practice:** Selalu set `--memory` dan `--cpus` (atau equivalent `resources.limits` kalau di orchestrator) untuk container production, supaya satu container yang bermasalah tidak menghabiskan resource container lain.

---

## Union Filesystem & Image Layers

Docker image **tidak disimpan sebagai satu file besar** — image tersusun dari beberapa **layer** read-only yang di-stack menggunakan union filesystem (implementasi umum: `overlay2`).

```
Image "myapp:1.0" — 4 layer:

  ┌─────────────────────────────────────────┐
  │ Layer 4: COPY . /app        (2 MB)       │  ← paling atas, dibuat terakhir
  ├─────────────────────────────────────────┤
  │ Layer 3: RUN npm install     (45 MB)     │
  ├─────────────────────────────────────────┤
  │ Layer 2: RUN apt-get install (30 MB)     │
  ├─────────────────────────────────────────┤
  │ Layer 1: FROM node:20-slim  (120 MB)     │  ← base image, dibuat pertama
  └─────────────────────────────────────────┘
  Total image size ≈ 197 MB (union dari semua layer)
```

Setiap layer **immutable** dan punya content hash — kalau dua image sama-sama pakai `FROM node:20-slim`, layer tersebut **di-share** di disk, tidak digandakan.

```
Image "app-a:1.0"                Image "app-b:1.0"
┌─────────────────┐              ┌─────────────────┐
│ Layer: COPY app-a │              │ Layer: COPY app-b │
├─────────────────┤              ├─────────────────┤
│ Layer: npm install │              │ Layer: npm install │
├─────────────────┤              ├─────────────────┤
│ Layer: node:20-slim │◄────┬────►│ Layer: node:20-slim │   ← LAYER YANG SAMA,
└─────────────────┘     │     └─────────────────┘     disimpan SEKALI di disk
                        │
                  Shared base layer (content-addressable,
                  identified by SHA256 hash)
```

Saat container dijalankan, Docker menambahkan **satu layer baru yang writable** di atas seluruh layer image (read-only):

```
Container = Image layers (read-only) + Container layer (writable)

  ┌─────────────────────────────────────────┐
  │  Container layer (writable)              │  ← perubahan file container
  │  "copy-on-write" — file dari layer bawah  │     hidup di sini
  │  yang diubah akan DI-COPY ke sini dulu    │
  ├─────────────────────────────────────────┤
  │  Layer 4: COPY . /app          (read-only)│
  ├─────────────────────────────────────────┤
  │  Layer 3: RUN npm install       (read-only)│
  ├─────────────────────────────────────────┤
  │  Layer 2: RUN apt-get install   (read-only)│
  ├─────────────────────────────────────────┤
  │  Layer 1: FROM node:20-slim     (read-only)│
  └─────────────────────────────────────────┘

  Kalau container dihapus → writable layer HILANG (kecuali disimpan
  di volume — lihat 04-networking-volumes.md)
```

**Penting:** Ini kenapa data di dalam container **tidak persistent** secara default. Setiap `docker run` dari image yang sama membuat writable layer baru yang kosong. Untuk data yang harus bertahan (database, upload file), gunakan **volume** — bukan mengandalkan writable layer.

---

## Image vs Container vs Registry

Tiga istilah ini sering tertukar tapi punya peran yang jelas berbeda.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   REGISTRY                                                       │
│   (tempat menyimpan & distribusi image)                          │
│   Docker Hub / Artifact Registry / ECR / GHCR                    │
│                                                                  │
│   ┌────────────────────────────────────────────────────────┐    │
│   │  Repository: myapp                                     │    │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│   │  │ tag: 1.0 │  │ tag: 1.1 │  │ tag: latest │            │    │
│   │  └────┬─────┘  └────┬─────┘  └────┬─────┘              │    │
│   └───────┼─────────────┼─────────────┼────────────────────┘    │
│           │ docker pull  │              │                        │
└───────────┼─────────────┼─────────────┼────────────────────────┘
            ▼             ▼             ▼
     ┌────────────────────────────────────────┐
     │           IMAGE (local)                  │
     │  Template read-only — berisi filesystem   │
     │  + metadata (CMD, ENV, EXPOSE, dst)         │
     │  Tidak berjalan, hanya "blueprint"          │
     └───────────────────┬────────────────────┘
                         │ docker run
                         ▼
     ┌────────────────────────────────────────┐
     │           CONTAINER (running/stopped)     │
     │  Instance yang BERJALAN dari image         │
     │  + writable layer + proses aktif           │
     │  Bisa buat banyak container dari 1 image   │
     └────────────────────────────────────────┘
```

| Istilah | Analoginya | Sifat |
|---------|-----------|-------|
| **Registry** | Rak buku di perpustakaan | Tempat menyimpan & mendistribusikan image |
| **Repository** | 1 judul buku | Kumpulan image dengan nama sama, beda tag/versi |
| **Image** | Cetakan kue (mold) | Read-only, immutable, blueprint |
| **Container** | Kue hasil cetakan | Instance yang berjalan, punya state sendiri, bisa banyak dari 1 image |

---

## Skenario: Apa yang Terjadi Saat `docker run nginx` di Mesin Baru

Bayangkan mesin baru yang **belum pernah pull image apapun**. User menjalankan:

```bash
docker run -d -p 8080:80 --name web nginx
```

```
Step 1: Docker CLI kirim request ke Docker Daemon (dockerd)
        │  "Jalankan container dari image 'nginx', tag default 'latest'"
        ▼
Step 2: Daemon cek local image cache
        │  docker images | grep nginx  →  KOSONG, belum ada
        │  ❌ Image tidak ditemukan di local
        ▼
Step 3: Daemon otomatis pull dari registry default (Docker Hub)
        │  Resolve: nginx:latest → docker.io/library/nginx:latest
        │
        │  Download setiap layer (paralel, di-cache per layer):
        │    Pulling from library/nginx
        │    a1: Pull complete  (base layer OS)
        │    b2: Pull complete  (apt packages)
        │    c3: Pull complete  (nginx binary + config)
        │    d4: Pull complete  (default html)
        │  Status: Downloaded newer image for nginx:latest
        ▼
Step 4: Daemon simpan image ke local storage (overlay2)
        │  Layer-layer disimpan content-addressable di
        │  /var/lib/docker/overlay2/...
        ▼
Step 5: containerd + runc membuat container
        │  ├── Buat namespaces baru (PID, NET, MNT, UTS, IPC)
        │  ├── Buat cgroup untuk batasi resource
        │  ├── Buat writable layer di atas image layers
        │  ├── Setup virtual network interface,
        │  │   sambungkan ke bridge network "docker0"
        │  └── Buat port mapping: host:8080 → container:80
        ▼
Step 6: Proses nginx dijalankan sebagai PID 1 di dalam container
        │  Karena flag -d (detached), proses berjalan di background
        ▼
Step 7: Docker CLI print container ID, kembali ke shell
        │  $ docker run -d -p 8080:80 --name web nginx
        │  7f2a9c1e8b3d...
        ▼
✅ curl http://localhost:8080 → HTML default nginx
```

**Catatan:** Kalau `docker run nginx` dijalankan **lagi** setelah ini, Step 2-4 (pull) di-skip karena image sudah ada di local cache — langsung ke Step 5. Ini kenapa container kedua dan seterusnya start jauh lebih cepat (detik, bukan menit).

---

## Ringkasan Konsep

```
Container = Proses Linux biasa + isolasi kernel

  Namespaces  → APA yang terlihat (PID, NET, MNT, UTS, IPC, USER)
  Cgroups     → BERAPA resource yang bisa dipakai (CPU, memory, I/O)

Image = Stack of read-only layers (union filesystem)

  Layer di-share antar image kalau base-nya sama (content-addressable)
  Container = Image layers (read-only) + 1 writable layer di atasnya
  Writable layer hilang saat container dihapus → butuh volume untuk data persistent

Relasi:
  Registry  → simpan & distribusi image (docker push / pull)
  Image     → blueprint read-only (docker build)
  Container → instance yang berjalan dari image (docker run)

Flow docker run (image belum ada lokal):
  cek local cache → miss → pull dari registry → simpan layer →
  buat namespace + cgroup + writable layer → exec proses → running
```

---

*Dokumen ini berdasarkan Docker Engine versi stabil per 2026, mengacu pada implementasi Linux kernel namespaces, cgroups v2, dan containerd/runc sebagai OCI runtime.*
