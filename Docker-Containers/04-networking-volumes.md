# Networking & Volumes

Dokumentasi **Docker network drivers**, perbedaan **default bridge** vs **user-defined bridge**, komunikasi antar container lewat DNS by name, **port publishing** (`-p` vs `-P`), dan perbandingan **volume vs bind mount vs tmpfs** untuk penyimpanan data.

---

## Network Drivers

Docker mendukung beberapa driver network, masing-masing untuk kebutuhan berbeda.

| Driver | Isolasi | Cocok untuk |
|--------|---------|-------------|
| **bridge** | Container terisolasi dalam network virtual di 1 host, keluar lewat NAT | Default — komunikasi antar container di 1 host, paling umum dipakai |
| **host** | Tidak ada isolasi network — container pakai network stack host langsung | Performa maksimal, saat butuh akses langsung ke interface host (jarang dipakai production karena mengurangi isolasi) |
| **none** | Tidak ada network sama sekali — container tidak punya interface network | Job yang benar-benar tidak butuh network (batch processing murni) |
| **overlay** | Network virtual yang menjangkau **banyak Docker host** (multi-host) | Docker Swarm / cluster multi-node — di luar scope single-host yang dibahas di sini |

```
docker network create --driver bridge my-net
docker run --network my-net ...
docker run --network host ...
docker run --network none ...
```

**Catatan:** `overlay` network relevan untuk Docker Swarm. Kalau kebutuhan sudah sampai orkestrasi multi-node dengan scheduling, self-healing, dan scaling otomatis, pertimbangkan Kubernetes/GKE (lihat [`GKE/01-concepts.md`](../GKE/01-concepts.md)) daripada Swarm.

---

## Default Bridge vs User-Defined Bridge

Docker otomatis membuat network bernama `bridge` saat instalasi — tapi network ini punya keterbatasan penting yang sering jadi sumber bug.

```
┌────────────────────────────────────────────────────────────┐
│  Default bridge network ("bridge")                          │
│                                                              │
│  ┌────────────┐          ┌────────────┐                     │
│  │ Container A │          │ Container B │                     │
│  │ 172.17.0.2  │          │ 172.17.0.3  │                     │
│  └────────────┘          └────────────┘                     │
│                                                              │
│  ❌ TIDAK ada DNS resolution by container name                │
│     Container A HARUS tahu IP 172.17.0.3 untuk hubungi B      │
│     (IP bisa berubah setiap container di-recreate!)            │
│                                                              │
│  Harus pakai --link (deprecated) untuk resolve by name         │
└────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────┐
│  User-defined bridge network ("my-net")                      │
│  docker network create my-net                                │
│                                                              │
│  ┌────────────┐          ┌────────────┐                     │
│  │ Container A │          │ Container B │                     │
│  │ 172.20.0.2  │◄────────►│ 172.20.0.3  │                     │
│  │ nama: web    │  DNS      │ nama: db     │                     │
│  └────────────┘          └────────────┘                     │
│                                                              │
│  ✅ DNS resolution OTOMATIS by container name                 │
│     Container "web" bisa hubungi "db" via hostname "db"         │
│     ping db          → resolve otomatis ke 172.20.0.3           │
│     mysql -h db ...  → tidak perlu tahu IP sama sekali           │
│                                                              │
│  ✅ Isolasi lebih baik — hanya container di network ini          │
│     yang bisa saling lihat                                     │
└────────────────────────────────────────────────────────────┘
```

| Aspek | Default bridge | User-defined bridge |
|-------|----------------|----------------------|
| **DNS by container name** | ❌ Tidak (perlu `--link`, deprecated) | ✅ Otomatis |
| **Isolasi antar grup container** | Semua container di 1 default bridge saling lihat | Bisa buat network terpisah per grup aplikasi |
| **Cara buat** | Otomatis ada, tidak perlu dibuat | `docker network create NAME` |
| **Direkomendasikan** | ❌ Tidak untuk multi-container app | ✅ Ya — default untuk `docker run` maupun basis dari Docker Compose |

**Best practice:** Selalu buat **user-defined bridge network** untuk aplikasi multi-container. Docker Compose otomatis melakukan ini — setiap `docker-compose.yml` membuat network sendiri per project, sehingga service bisa saling panggil pakai nama service (lihat [05-docker-compose.md](05-docker-compose.md)).

```bash
docker network create app-net
docker run -d --name db --network app-net postgres:16
docker run -d --name web --network app-net -e DB_HOST=db myapp:1.0
# Di dalam container "web", host "db" otomatis resolve ke IP container db
```

---

## Port Publishing: `-p` vs `-P`

Port yang di-`EXPOSE` di Dockerfile **hanya dokumentasi** — tidak otomatis bisa diakses dari luar host. Untuk membuat port bisa diakses dari luar, harus di-**publish** secara eksplisit saat `docker run`.

| Flag | Perilaku |
|------|----------|
| `-p HOST_PORT:CONTAINER_PORT` | Publish port tertentu ke port host tertentu (kontrol penuh) |
| `-p CONTAINER_PORT` | Publish ke port host **random/ephemeral** (Docker pilih otomatis) |
| `-P` | Publish **SEMUA** port yang di-`EXPOSE` di image, masing-masing ke port host random |
| (tanpa flag) | Port container **tidak bisa diakses** dari luar host sama sekali |

```
docker run -d -p 8080:80 nginx
  Host port 8080  ────► Container port 80

  Request: curl http://localhost:8080
  ──► diteruskan ke port 80 DI DALAM container
```

```
docker run -d -P nginx
  (image nginx punya EXPOSE 80 di Dockerfile-nya)

  Host port RANDOM (misal 32768) ────► Container port 80
  Cek port yang dipakai: docker port CONTAINER_ID
```

```
Host                              Container
┌─────────────────┐              ┌─────────────────┐
│  Port 8080 ●─────┼──────────────┼─●  Port 80        │
│  (bisa diakses    │              │  (nginx listen     │
│   dari luar host)  │              │   di sini)          │
└─────────────────┘              └─────────────────┘

docker run -p 8080:80 nginx
```

**Penting:** Port di sisi kiri (`HOST_PORT`) adalah port di **mesin host** — kalau sudah dipakai proses lain, `docker run` akan gagal dengan error "port already allocated". Port di sisi kanan (`CONTAINER_PORT`) adalah port yang benar-benar di-`listen` oleh proses **di dalam** container — ini yang harus cocok dengan konfigurasi aplikasi (misal nginx listen di 80, jangan salah tulis jadi 8080 kalau app-nya listen di 80).

---

## Volume vs Bind Mount vs tmpfs

Writable layer container **hilang** saat container dihapus (lihat [01-concepts.md](01-concepts.md)). Untuk data yang harus bertahan atau perlu diakses dari host, Docker menyediakan tiga mekanisme mount.

| Aspek | Volume | Bind Mount | tmpfs |
|-------|--------|-----------|-------|
| **Lokasi data** | Dikelola Docker (`/var/lib/docker/volumes/...`) | Path eksplisit di filesystem host | Hanya di memory (RAM) |
| **Persistent setelah container dihapus** | ✅ Ya | ✅ Ya | ❌ Tidak — hilang saat container stop |
| **Bisa dibuat/dilihat via `docker volume`** | ✅ Ya | ❌ Tidak (bukan konsep Docker, hanya path host) | ❌ Tidak |
| **Portabilitas** | Tinggi — tidak terikat struktur folder host tertentu | Rendah — terikat path spesifik di host | N/A |
| **Kontrol path di host** | Docker yang atur | User yang tentukan path persis | N/A |
| **Use case umum** | Data database, upload file — data yang harus persistent & portable | Mount source code saat development (live reload), config file dari host | Data sensitif sementara (cache, secret runtime) yang tidak boleh tersimpan di disk |

```
Volume:
  docker volume create db-data
  docker run -v db-data:/var/lib/postgresql/data postgres:16

  Host                                Container
  /var/lib/docker/volumes/db-data ──► /var/lib/postgresql/data
  (dikelola Docker, tidak perlu tahu path persisnya)
```

```
Bind Mount:
  docker run -v /home/user/myapp/src:/app/src myapp:dev

  Host                                Container
  /home/user/myapp/src ─────────────► /app/src
  (path EKSPLISIT, biasa dipakai untuk live-reload saat development)
```

```
tmpfs:
  docker run --tmpfs /app/cache myapp:1.0

  RAM (tmpfs) ────────────────────► /app/cache
  (hilang total begitu container stop — tidak pernah menyentuh disk)
```

**Best practice:** Untuk **data production yang harus persistent** (database, object storage lokal), gunakan **volume** — bukan bind mount. Volume tidak terikat struktur folder host tertentu sehingga lebih portable antar environment. **Bind mount** sangat berguna untuk **development** (source code di-mount live supaya perubahan langsung terlihat tanpa rebuild image), tapi jarang dipakai di production karena terikat path host yang spesifik.

---

## Skenario: Persistensi Data Database Container Saat Recreate

Tim menjalankan PostgreSQL sebagai container untuk development. Suatu hari mereka perlu upgrade versi image PostgreSQL — container lama harus dihapus dan diganti container baru dari image yang baru.

**Setup awal — TANPA volume (masalah):**

```bash
docker run -d --name mydb -p 5432:5432 -e POSTGRES_PASSWORD=secret postgres:15
# ... beberapa hari pemakaian, banyak data masuk ...

docker stop mydb
docker rm mydb
docker run -d --name mydb -p 5432:5432 -e POSTGRES_PASSWORD=secret postgres:16
```

```
Apa yang terjadi:

  Container lama (postgres:15)          Container baru (postgres:16)
  ┌─────────────────────┐              ┌─────────────────────┐
  │ Writable layer:        │              │ Writable layer:        │
  │  /var/lib/postgresql/   │  docker rm   │  /var/lib/postgresql/   │
  │  data/ (semua data)      │ ───────────► │  data/ (KOSONG, fresh)  │
  └─────────────────────┘   HILANG      └─────────────────────┘

  ❌ SEMUA DATA HILANG — writable layer container lama
     dihapus permanen bersama container-nya
```

**Perbaikan — DENGAN named volume:**

```bash
# Buat volume eksplisit untuk data postgres
docker volume create pgdata

# Jalankan container, mount volume ke direktori data postgres
docker run -d --name mydb -p 5432:5432 \
    -e POSTGRES_PASSWORD=secret \
    -v pgdata:/var/lib/postgresql/data \
    postgres:15

# ... pemakaian normal, data masuk ...

# Saat perlu upgrade: stop & remove CONTAINER, volume TETAP ada
docker stop mydb
docker rm mydb

# Jalankan container baru dari image baru, MOUNT VOLUME YANG SAMA
docker run -d --name mydb -p 5432:5432 \
    -e POSTGRES_PASSWORD=secret \
    -v pgdata:/var/lib/postgresql/data \
    postgres:16
```

```
Apa yang terjadi (dengan volume):

  Container lama (postgres:15)          Container baru (postgres:16)
  ┌─────────────────────┐              ┌─────────────────────┐
  │ Mount:                  │  docker rm   │ Mount:                  │
  │  pgdata → /var/lib/...  │ ───────────► │  pgdata → /var/lib/...  │
  └──────────┬───────────┘   (container  └──────────┬───────────┘
             │                  saja, bukan          │
             ▼                  volume)               ▼
        ┌─────────┐                              ┌─────────┐
        │ Volume:  │◄─────── TETAP ADA ─────────►│ Volume:  │
        │ "pgdata" │        (independen dari      │ "pgdata" │
        │ (data)   │         lifecycle container)  │ (data)   │
        └─────────┘                              └─────────┘

  ✅ SEMUA DATA TETAP ADA — volume punya lifecycle SENDIRI,
     terpisah dari container yang mount ke dalamnya
```

**Penting:** Volume harus **secara eksplisit dihapus** dengan `docker volume rm pgdata` — `docker rm` container **tidak** menghapus volume yang di-mount (kecuali pakai flag `-v` tambahan di `docker rm -v`, dan itu pun hanya berlaku untuk **anonymous volume**, bukan named volume). Ini membuat named volume sengaja dirancang aman dari penghapusan tidak sengaja.

---

## Ringkasan Konsep

```
Network:
  bridge (default) → per-host, TIDAK ada DNS by name
  bridge (user-defined) → per-host, DNS by name OTOMATIS ✅ pakai ini
  host → tanpa isolasi network, share stack host
  none → tanpa network sama sekali
  overlay → multi-host (Swarm/orchestrator, di luar scope Docker standalone)

Port publishing:
  EXPOSE di Dockerfile = dokumentasi saja, TIDAK otomatis publish
  -p HOST:CONTAINER → publish spesifik & terkendali
  -P                → publish semua EXPOSE ke port random

Storage:
  Volume      → dikelola Docker, portable, PRODUCTION untuk data persistent
  Bind mount  → path host eksplisit, cocok DEVELOPMENT (live reload)
  tmpfs       → hanya RAM, hilang saat stop, untuk data sensitif sementara

Prinsip inti:
  Writable layer container = sementara, hilang saat container dihapus
  Data yang harus bertahan → WAJIB pakai volume (atau bind mount),
  bukan mengandalkan writable layer container
```

---

*Dokumen ini berdasarkan Docker Engine networking & volume management versi stabil per 2026.*
