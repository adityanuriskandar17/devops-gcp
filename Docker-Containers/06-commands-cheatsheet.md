# Commands Cheatsheet

Referensi cepat command Docker, dikelompokkan per kategori: **image management**, **container lifecycle**, **networking**, **volumes**, dan **system**.

---

## Image Management

### Build Image

| | Cara |
|-|------|
| **Command** | `docker build -t NAME:TAG PATH` |

```bash
docker build -t myapp:1.0 .
docker build -t myapp:1.0 -f Dockerfile.prod .
docker build --target=builder -t myapp:builder .      # build stage tertentu (multi-stage)
docker build --no-cache -t myapp:1.0 .                  # build tanpa pakai cache
docker build --build-arg VERSION=1.2 -t myapp:1.0 .     # pass ARG saat build
```

### Pull Image

| | Cara |
|-|------|
| **Command** | `docker pull NAME:TAG` |

```bash
docker pull nginx:1.25
docker pull asia-southeast2-docker.pkg.dev/my-project/my-repo/myapp:1.0
```

### Push Image

| | Cara |
|-|------|
| **Command** | `docker push NAME:TAG` (harus login dulu) |

```bash
docker login REGISTRY_HOST
docker push asia-southeast2-docker.pkg.dev/my-project/my-repo/myapp:1.0
```

### Tag Image

| | Cara |
|-|------|
| **Command** | `docker tag SOURCE_IMAGE TARGET_IMAGE` |

```bash
docker tag myapp:1.0 myapp:latest
docker tag myapp:1.0 asia-southeast2-docker.pkg.dev/my-project/my-repo/myapp:1.0
```

### List Image

| | Cara |
|-|------|
| **Command** | `docker images` atau `docker image ls` |

```bash
docker images
docker images --filter "dangling=true"       # image tanpa tag (leftover build)
docker images myapp                            # filter by repository name
```

### Hapus Image

| | Cara |
|-|------|
| **Command** | `docker rmi IMAGE` |

```bash
docker rmi myapp:1.0
docker rmi $(docker images -q --filter "dangling=true")   # hapus semua dangling image
docker image prune                              # hapus image yang tidak dipakai container manapun
docker image prune -a                           # hapus SEMUA image yang tidak dipakai container
```

### Inspect & History

| Aksi | Cara |
|------|------|
| Detail metadata image | `docker inspect IMAGE` |
| Lihat layer & history build | `docker history IMAGE` |
| Cek vulnerability (Docker Scout) | `docker scout cves IMAGE` |

---

## Container Lifecycle

### Run Container

| | Cara |
|-|------|
| **Command** | `docker run [FLAGS] IMAGE [CMD]` |

```bash
docker run nginx                                   # foreground, interaktif melihat log
docker run -d --name web nginx                      # detached (background)
docker run -d -p 8080:80 --name web nginx            # dengan port publishing
docker run -it ubuntu bash                            # interactive shell
docker run --rm alpine echo "hello"                    # otomatis hapus container setelah exit
docker run -e KEY=VALUE myapp:1.0                       # set environment variable
docker run --memory=512m --cpus=1 myapp:1.0             # limit resource (cgroups)
docker run -v mydata:/data myapp:1.0                     # mount named volume
```

### Start / Stop / Restart

| Aksi | Cara |
|------|------|
| Start container yang sudah berhenti | `docker start CONTAINER` |
| Stop (kirim SIGTERM, tunggu, lalu SIGKILL) | `docker stop CONTAINER` |
| Kill langsung (SIGKILL, tanpa graceful) | `docker kill CONTAINER` |
| Restart | `docker restart CONTAINER` |
| Pause proses (freeze) | `docker pause CONTAINER` |
| Unpause | `docker unpause CONTAINER` |

```bash
docker stop web
docker start web
docker restart web
```

### List Container

| | Cara |
|-|------|
| **Command** | `docker ps` |

```bash
docker ps                        # hanya yang running
docker ps -a                     # semua, termasuk yang sudah stop
docker ps --filter "status=exited"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Hapus Container

| | Cara |
|-|------|
| **Command** | `docker rm CONTAINER` |

```bash
docker rm web                              # container harus sudah stop
docker rm -f web                            # force, stop dulu lalu hapus
docker container prune                       # hapus semua container yang sudah exited
```

### Exec & Logs

| Aksi | Cara |
|------|------|
| Masuk shell ke container yang jalan | `docker exec -it CONTAINER sh` (atau `bash`) |
| Jalankan 1 command sekali | `docker exec CONTAINER ls /app` |
| Lihat log | `docker logs CONTAINER` |
| Lihat log, follow (live tail) | `docker logs -f CONTAINER` |
| Lihat log, 100 baris terakhir | `docker logs --tail 100 CONTAINER` |

```bash
docker exec -it web sh
docker logs -f web
docker logs --tail 50 --since 10m web
```

### Inspect & Copy File

| Aksi | Cara |
|------|------|
| Detail metadata container (network, mount, env) | `docker inspect CONTAINER` |
| Copy file dari container ke host | `docker cp CONTAINER:/path/file ./local/` |
| Copy file dari host ke container | `docker cp ./local/file CONTAINER:/path/` |
| Lihat resource usage real-time | `docker stats` |
| Lihat proses yang jalan di dalam container | `docker top CONTAINER` |

---

## Networking

### Kelola Network

| | Cara |
|-|------|
| **Command** | `docker network create/ls/connect/disconnect/rm` |

```bash
docker network create app-net                     # buat user-defined bridge
docker network create --driver bridge app-net
docker network ls                                    # list semua network
docker network inspect app-net                        # detail: container yang terhubung, subnet
docker network connect app-net CONTAINER               # sambungkan container yang sudah jalan
docker network disconnect app-net CONTAINER
docker network rm app-net                              # hapus (network harus tidak terpakai)
docker network prune                                    # hapus semua network yang tidak dipakai
```

---

## Volumes

### Kelola Volume

| | Cara |
|-|------|
| **Command** | `docker volume create/ls/inspect/rm` |

```bash
docker volume create db-data
docker volume ls
docker volume inspect db-data                          # lihat mountpoint asli di host
docker volume rm db-data                                # volume harus tidak dipakai container manapun
docker volume prune                                      # hapus semua volume yang tidak dipakai
```

```bash
# Mount volume ke container
docker run -v db-data:/var/lib/postgresql/data postgres:16

# Backup isi volume ke tar.gz (lewat container sementara)
docker run --rm -v db-data:/data -v $(pwd):/backup alpine \
    tar czf /backup/db-data-backup.tar.gz -C /data .

# Restore dari backup
docker run --rm -v db-data:/data -v $(pwd):/backup alpine \
    tar xzf /backup/db-data-backup.tar.gz -C /data
```

---

## System

### Disk Usage & Cleanup

| Aksi | Cara |
|------|------|
| Lihat ringkasan disk usage Docker | `docker system df` |
| Lihat detail per item (image/container/volume) | `docker system df -v` |
| Bersihkan semua yang tidak terpakai (image dangling, container stopped, network unused, build cache) | `docker system prune` |
| Bersihkan termasuk volume yang tidak terpakai | `docker system prune --volumes` |
| Bersihkan SEMUA image tidak terpakai (bukan cuma dangling) | `docker system prune -a` |

```bash
docker system df
docker system df -v
docker system prune                  # aman, hanya hapus resource yang benar-benar tidak dipakai
docker system prune -a --volumes     # agresif — pastikan tidak ada data penting di volume unused
```

### Info & Version

| Aksi | Cara |
|------|------|
| Info daemon (storage driver, jumlah container/image) | `docker info` |
| Versi Docker Client & Server | `docker version` |
| Cek daemon events real-time | `docker events` |

```bash
docker info
docker version
docker events --filter 'event=start'
```

---

*Dokumen ini berdasarkan Docker CLI versi stabil per 2026.*
