# Docker Compose

Dokumentasi **Docker Compose** — tool untuk mendefinisikan dan menjalankan aplikasi **multi-container** lewat satu file deklaratif (`docker-compose.yml`), lengkap dengan struktur file, contoh worked example aplikasi 3-tier, command sehari-hari, dan penggunaan file `.env`.

---

## Kenapa Compose?

Menjalankan aplikasi multi-container manual dengan `docker run` satu-satu cepat jadi tidak praktis — banyak flag berulang, mudah lupa urutan start, dan tidak ada satu sumber kebenaran (source of truth) untuk konfigurasi.

```
Tanpa Compose (manual, error-prone):

  docker network create app-net
  docker volume create db-data
  docker run -d --name db --network app-net -v db-data:/var/lib/postgresql/data \
      -e POSTGRES_PASSWORD=secret postgres:16
  docker run -d --name backend --network app-net -p 4000:4000 \
      -e DB_HOST=db -e DB_PASSWORD=secret myapp-backend:1.0
  docker run -d --name frontend --network app-net -p 80:80 myapp-frontend:1.0

  ❌ Diketik ulang tiap kali, mudah salah urutan, tidak versioned

Dengan Compose (deklaratif, 1 file, 1 command):

  docker compose up -d

  ✅ Semua service, network, volume terdefinisi di 1 file YAML
  ✅ File di-commit ke git → versioned, reproducible
```

---

## Struktur File `docker-compose.yml`

File Compose punya tiga top-level key utama: `services`, `networks`, dan `volumes`.

```
docker-compose.yml
│
├── services:          ← daftar container yang akan dijalankan
│   ├── frontend:
│   │   ├── build / image
│   │   ├── ports
│   │   ├── environment
│   │   ├── depends_on
│   │   └── networks
│   ├── backend:
│   │   └── (sama strukturnya)
│   └── db:
│       └── (sama strukturnya, + volumes untuk data)
│
├── networks:          ← definisi network custom (opsional,
│                          Compose otomatis buat 1 default network)
│
└── volumes:            ← definisi named volume yang dipakai services
```

| Top-level key | Fungsi |
|----------------|--------|
| **services** | Setiap service = satu container (atau lebih, kalau di-scale). Berisi image/build, port, env, dependency antar service |
| **networks** | Network custom antar service. Kalau tidak didefinisikan, Compose otomatis buat 1 default bridge network per project |
| **volumes** | Named volume yang bisa dipakai lintas service (misal 1 volume dipakai untuk backup) |

**Catatan:** Bahkan tanpa mendefinisikan `networks` secara eksplisit, **semua service dalam satu `docker-compose.yml` otomatis berada di network yang sama** dan bisa saling memanggil pakai **nama service** sebagai hostname — ini adalah user-defined bridge network yang dibahas di [04-networking-volumes.md](04-networking-volumes.md).

---

## Worked Example: Aplikasi 3-Tier (Frontend + Backend + Database)

```
┌─────────────────────────────────────────────────────────────────┐
│                     docker compose project                       │
│                                                                   │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐         │
│  │  frontend    │      │  backend     │      │  db           │         │
│  │  (nginx)      │─────►│  (Node.js API)│─────►│  (postgres)     │         │
│  │  port 80      │ http │  port 4000    │ tcp  │  port 5432      │         │
│  └────────────┘      └────────────┘      └──────┬─────┘         │
│                        depends_on: db              │                │
│                                                    ▼                │
│                                          ┌──────────────┐          │
│                                          │ volume: db-data │          │
│                                          │ (persistent)     │          │
│                                          └──────────────┘          │
│                                                                   │
│  Semua service di 1 network default, saling panggil by NAME:      │
│  backend hubungi db via hostname "db", bukan IP                    │
└─────────────────────────────────────────────────────────────────┘
```

```yaml
# docker-compose.yml
version: "3.9"

services:
  frontend:
    build:
      context: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-net

  backend:
    build:
      context: ./backend
    ports:
      - "4000:4000"
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
    depends_on:
      - db
    networks:
      - app-net
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - app-net
    restart: unless-stopped

networks:
  app-net:
    driver: bridge

volumes:
  db-data:
```

| Bagian | Keterangan |
|--------|-----------|
| `build.context` | Path ke folder berisi Dockerfile untuk service ini (dibangun lokal, bukan pull dari registry) |
| `image` | Alternatif dari `build` — pakai image yang sudah ada di registry (contoh: `db` pakai image `postgres:16-alpine` langsung) |
| `ports` | Sama seperti `-p` di `docker run`: `HOST:CONTAINER` |
| `environment` | Environment variable untuk container, bisa reference variable dari `.env` dengan `${VAR}` |
| `depends_on` | Urutan start — `backend` menunggu `db` **start** dulu (bukan menunggu "ready", lihat catatan di bawah) |
| `volumes` (level service) | Mount named volume ke path tertentu di container |
| `volumes` (top-level) | Deklarasi named volume yang dipakai di atas |
| `restart: unless-stopped` | Container otomatis restart kalau crash, kecuali sengaja di-stop manual |

**Penting:** `depends_on` hanya menjamin urutan **start container**, **bukan** menjamin service di dalamnya sudah benar-benar siap menerima koneksi (misal PostgreSQL container sudah start tapi database belum selesai inisialisasi). Untuk kasus yang butuh "tunggu sampai benar-benar ready", tambahkan `healthcheck` di service `db` dan gunakan `depends_on: condition: service_healthy`, atau implementasikan retry logic di sisi aplikasi backend.

```yaml
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 3s
      retries: 5
    # ...

  backend:
    depends_on:
      db:
        condition: service_healthy
    # ...
```

---

## Compose Commands

| Aksi | Cara |
|------|------|
| **Start semua service (foreground)** | `docker compose up` |
| **Start semua service (background/detached)** | `docker compose up -d` |
| **Rebuild image sebelum start** | `docker compose up -d --build` |
| **Stop & hapus container, network (volume TETAP ada)** | `docker compose down` |
| **Stop & hapus SEMUA termasuk volume** | `docker compose down -v` |
| **Lihat status semua service** | `docker compose ps` |
| **Lihat log semua service** | `docker compose logs` |
| **Lihat log 1 service, follow (live tail)** | `docker compose logs -f backend` |
| **Masuk shell ke dalam container yang jalan** | `docker compose exec backend sh` |
| **Jalankan command sekali (container baru, bukan yang jalan)** | `docker compose run backend npm test` |
| **Scale 1 service jadi beberapa instance** | `docker compose up -d --scale backend=3` |
| **Restart 1 service** | `docker compose restart backend` |
| **Validasi & lihat konfigurasi final (setelah resolve `.env`)** | `docker compose config` |

```bash
# Workflow harian yang umum
docker compose up -d              # start semua service di background
docker compose ps                 # cek status
docker compose logs -f backend    # tail log backend untuk debugging
docker compose exec backend sh    # masuk ke container untuk inspect manual
docker compose down               # stop semua, volume tetap aman
```

---

## Penggunaan File `.env`

Compose otomatis membaca file `.env` di direktori yang sama dengan `docker-compose.yml`, lalu menyediakan variable-nya untuk substitusi `${VAR}` di dalam file compose.

```
Struktur project:

  myproject/
  ├── docker-compose.yml
  ├── .env                  ← dibaca otomatis oleh Compose
  ├── .env.example           ← template, di-commit ke git (TANPA nilai asli)
  ├── frontend/
  │   └── Dockerfile
  └── backend/
      └── Dockerfile
```

```
# .env
DB_NAME=myapp
DB_USER=myapp_user
DB_PASSWORD=change-me-in-production
```

```
# .env.example  (di-commit ke git, jadi referensi tim)
DB_NAME=myapp
DB_USER=myapp_user
DB_PASSWORD=
```

**Best practice:** Tambahkan `.env` ke `.gitignore` — file ini biasa berisi password/secret asli. Commit hanya `.env.example` sebagai template kosong, supaya anggota tim baru tahu variable apa saja yang harus diisi tanpa ter-expose nilai production.

```
# .gitignore
.env
```

**Catatan:** Variable dari `.env` **hanya** dipakai untuk substitusi di file `docker-compose.yml` saat parsing — ini **bukan** cara otomatis untuk inject environment variable ke dalam container. Kalau container juga butuh variable tersebut saat runtime, tetap harus dideklarasikan di key `environment:` (seperti contoh di atas: `DB_PASSWORD=${DB_PASSWORD}`).

---

## Skenario: Menjalankan Aplikasi 3-Tier dari Nol

```
Step 1: Clone/siapkan project dengan struktur:
        myproject/
        ├── docker-compose.yml
        ├── .env.example
        ├── frontend/Dockerfile
        └── backend/Dockerfile

Step 2: Copy .env.example → .env, isi value asli
        cp .env.example .env
        # edit .env, isi DB_PASSWORD yang sesungguhnya

Step 3: Build & start semua service
        docker compose up -d --build

Step 4: Compose otomatis:
        ├── Build image frontend & backend dari Dockerfile masing-masing
        ├── Pull image postgres:16-alpine dari registry
        ├── Buat network "myproject_app-net"
        ├── Buat volume "myproject_db-data"
        ├── Start db → tunggu healthy (kalau healthcheck ada)
        ├── Start backend → connect ke db via hostname "db"
        └── Start frontend → proxy request ke backend

Step 5: Cek semua service jalan
        docker compose ps
        NAME                 STATUS
        myproject-db-1       Up (healthy)
        myproject-backend-1  Up
        myproject-frontend-1 Up

Step 6: Akses aplikasi
        curl http://localhost/          → frontend
        curl http://localhost:4000/api  → backend langsung

Step 7: Debug kalau ada masalah
        docker compose logs -f backend
        docker compose exec backend sh

Step 8: Selesai kerja, stop semua (data db tetap aman di volume)
        docker compose down
```

---

## Ringkasan Konsep

```
Docker Compose = deklaratif multi-container di 1 file YAML

  services  → daftar container (build/image, port, env, depends_on)
  networks  → custom network (opsional, Compose auto-buat 1 default)
  volumes   → named volume untuk data persistent lintas recreate

Antar service:
  Saling panggil pakai NAMA SERVICE sebagai hostname
  (otomatis di user-defined bridge network yang dibuat Compose)

depends_on:
  Menjamin urutan START, BUKAN urutan "ready"
  → kombinasikan dengan healthcheck untuk kepastian ready

.env:
  Dibaca otomatis untuk substitusi ${VAR} di docker-compose.yml
  Simpan .env di .gitignore, commit .env.example sebagai template

Command inti:
  docker compose up -d       → start semua
  docker compose down        → stop semua (volume tetap ada)
  docker compose logs -f     → debugging
  docker compose exec        → masuk ke container yang jalan
```

---

*Dokumen ini berdasarkan Docker Compose (Compose V2, `docker compose` sebagai plugin CLI) versi stabil per 2026.*
