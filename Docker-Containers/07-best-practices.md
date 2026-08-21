# Best Practices

Panduan praktik terbaik untuk image dan container Docker yang **aman, kecil, dan production-ready** — mulai dari non-root user, minimal base image, `.dockerignore`, pinning tag, health check, penanganan secrets, image scanning di CI, hingga checklist kesiapan production.

---

## 1. Jalankan Container Sebagai Non-Root User

Secara default, proses di dalam container Docker berjalan sebagai **root** (UID 0) — kalau tidak dikonfigurasi lain. Kalau ada vulnerability yang memungkinkan container breakout (kelemahan di kernel, misconfiguration), proses yang berjalan sebagai root di dalam container memberi permukaan serangan lebih besar.

```
❌ Default (root):
  Container proses jalan sebagai UID 0
  Kalau container breakout → attacker punya akses root

✅ Non-root user:
  Container proses jalan sebagai UID non-privileged (misal UID 1000)
  Kalau container breakout → attacker HANYA punya akses user terbatas
```

```dockerfile
FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --chown=appuser:appgroup . .

USER appuser
CMD ["node", "server.js"]
```

**Catatan:** Banyak official image (`node`, `postgres`, `nginx`) sudah menyediakan user non-root bawaan (misal `node` image punya user `node`) — cukup tambahkan `USER node` tanpa perlu membuat user baru.

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY --chown=node:node . .
USER node
CMD ["node", "server.js"]
```

---

## 2. Pakai Minimal Base Image

Base image yang besar membawa lebih banyak paket OS — artinya lebih banyak potensi vulnerability, lebih lambat pull/push, dan attack surface lebih besar.

| Base Image Tier | Ukuran Kira-kira | Isi | Trade-off |
|-----------------|-------------------|-----|-----------|
| **Full OS** (`debian`, `ubuntu`) | 70-120 MB+ | Shell lengkap, package manager, banyak utility | Mudah debug, tapi besar & banyak paket yang tidak dipakai |
| **Slim variant** (`node:20-slim`) | ~70-100 MB | OS minimal, tetap ada shell dasar | Kompromi baik — cukup kecil, masih bisa `apt-get` kalau perlu |
| **Alpine** (`node:20-alpine`) | ~40-50 MB | musl libc (bukan glibc), package manager `apk` | Sangat kecil, tapi hati-hati kompatibilitas library native (musl vs glibc) |
| **Distroless** (`gcr.io/distroless/*`) | ~20 MB atau kurang | Hanya runtime + aplikasi, **tanpa shell, tanpa package manager** | Attack surface minimal, tapi tidak bisa `exec -it ... sh` untuk debug |

```
Perbandingan attack surface:

  debian:12 (full)     → ~120MB, ratusan binary & library terinstal
  node:20-slim          → ~80MB,  lebih sedikit utility
  node:20-alpine         → ~45MB,  minimal, musl libc
  gcr.io/distroless/nodejs20 → ~25MB, HANYA node runtime, tanpa shell

  Semakin kecil & minimal → semakin kecil permukaan serangan
  Semakin kecil & minimal → semakin sulit di-debug interaktif
```

**Best practice:** Untuk **stage runtime** (setelah multi-stage build, lihat [02-dockerfile.md](02-dockerfile.md)), pilih base image paling minimal yang masih kompatibel dengan aplikasi. Alpine cocok untuk kebanyakan kasus; distroless cocok untuk aplikasi yang sudah matang dan tim nyaman debugging tanpa shell (misal lewat `docker cp`, ephemeral debug container, atau observability tooling).

---

## 3. Gunakan `.dockerignore`

Tanpa `.dockerignore`, **seluruh isi direktori build context** dikirim ke Docker daemon saat `docker build` — termasuk file yang tidak relevan atau bahkan sensitif seperti `.git`, `node_modules`, `.env`.

```
❌ Tanpa .dockerignore:

  docker build .
  Sending build context to Docker daemon  850MB
  (termasuk .git/, node_modules/, .env, file log lokal, dll)

  Risiko:
  - Build lebih lambat (context besar dikirim tiap build)
  - COPY . . bisa ikut menyalin .env atau .git ke dalam image ❌
```

```
# .dockerignore
.git
.gitignore
node_modules
npm-debug.log
.env
.env.*
*.md
Dockerfile
.dockerignore
dist
coverage
.vscode
.DS_Store
```

```
✅ Dengan .dockerignore:

  docker build .
  Sending build context to Docker daemon  4.2MB
  (hanya source code yang relevan)
```

**Best practice:** Treat `.dockerignore` seperti `.gitignore` — buat sejak awal project, bukan setelah insiden (misal setelah sadar `.env` ter-bake ke image yang sudah di-push ke registry).

---

## 4. Pin Image Tag — Hindari `:latest`

**Penting:** Ini pelajaran yang sama pentingnya dengan kasus di GKE — jangan pernah mengandalkan tag yang bisa berubah isinya secara diam-diam. Tag `:latest` **bukan** berarti "versi paling stabil" — artinya cuma "tag default kalau tidak menyebut tag lain", dan **isinya bisa berubah kapan saja** setiap kali maintainer image push ulang dengan tag `latest`.

```
❌ Pakai :latest:

  FROM node:latest
  # Hari ini: node:latest = Node.js 20.x
  # 3 bulan lagi: node:latest = Node.js 22.x (maintainer sudah update)
  #
  # docker build hari ini vs docker build 3 bulan lagi
  # BISA MENGHASILKAN IMAGE BERBEDA dari Dockerfile yang SAMA
  # ❌ Build tidak reproducible
  # ❌ "Kemarin jalan, sekarang error" — padahal tidak ada yang diubah di kode

✅ Pin ke versi spesifik:

  FROM node:20.11.1-alpine3.19
  # Selalu sama, di mesin manapun, kapanpun di-build
  # ✅ Reproducible build
  # ✅ Upgrade versi = perubahan EKSPLISIT di Dockerfile, bukan diam-diam
```

```
Skenario nyata insiden akibat :latest:

  Senin:  docker build -t myapp .   → base image node:latest = Node 20
          Deploy ke production, semua normal ✅

  Selasa: Maintainer upstream update tag node:latest → sekarang Node 22
          Ada breaking change API di Node 22 yang dipakai dependency tertentu

  Rabu:   CI pipeline re-build image (base image di-pull ulang, tanpa
          ada perubahan kode aplikasi sama sekali)
          → base image sekarang diam-diam jadi Node 22
          → dependency lama TIDAK KOMPATIBEL
          → build sukses TAPI runtime ERROR di production ❌

  Root cause: tidak ada satupun baris kode yang berubah — MURNI karena
  tag :latest berubah isi tanpa sepengetahuan tim.
```

**Best practice:** Sama seperti rekomendasi untuk image di GKE Deployment, selalu **pin ke versi spesifik** (`node:20.11.1-alpine3.19`) atau minimal **major.minor** (`node:20.11-alpine`) untuk base image, dan pin image aplikasi sendiri ke **tag versi semantik atau commit SHA** (`myapp:1.4.2` atau `myapp:sha-a1b2c3d`) — bukan `myapp:latest` — supaya setiap deployment **reproducible dan traceable** ke commit source code yang jelas.

---

## 5. Health Check

`HEALTHCHECK` memberi Docker cara untuk tahu apakah proses **di dalam** container benar-benar sehat, bukan hanya "proses masih berjalan" (yang bisa ditangkap `docker ps` meski aplikasinya sudah deadlock/hang).

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1
```

```
Status container tanpa HEALTHCHECK:
  docker ps
  STATUS: Up 2 hours              ← proses jalan, tapi TIDAK TAHU apakah SEHAT

Status container DENGAN HEALTHCHECK:
  docker ps
  STATUS: Up 2 hours (healthy)     ← endpoint /healthz merespons 200 OK
  STATUS: Up 2 hours (unhealthy)   ← endpoint /healthz gagal N kali berturut-turut
```

**Best practice:** Sediakan endpoint `/healthz` (atau nama serupa) di aplikasi yang benar-benar memeriksa dependency kritis (koneksi database, koneksi cache) — bukan sekadar `return 200` statis. Kombinasikan dengan `depends_on: condition: service_healthy` di Docker Compose (lihat [05-docker-compose.md](05-docker-compose.md)) supaya service lain menunggu dependency benar-benar siap, bukan hanya "sudah start".

---

## 6. Secrets Handling — Jangan Bake ke Image

**Penting:** Image Docker **bukan tempat yang aman** untuk secret. Setiap layer bersifat immutable dan bisa di-inspect siapa saja yang punya akses `docker pull` atau `docker history` — termasuk layer yang "sudah dihapus" di layer berikutnya (secret di layer lama tetap bisa diekstrak).

```
❌ Secret di ARG / ENV (TERLIHAT permanen di image):

  FROM node:20-alpine
  ARG API_KEY
  ENV API_KEY=$API_KEY
  RUN curl -H "Authorization: Bearer $API_KEY" https://internal-api/setup

  docker history myapp:1.0
  → ARG API_KEY masih bisa terlihat di build history / image metadata
  → docker inspect myapp:1.0 → ENV API_KEY=xxxxx TERLIHAT jelas
  → Siapapun yang docker pull image ini bisa BACA secret-nya ❌
```

```
❌ Secret ikut ter-COPY karena tidak ada .dockerignore:

  COPY . .
  → kalau ada .env berisi password di direktori project,
     otomatis ikut masuk ke image ❌
```

```
✅ Cara aman — inject secret HANYA saat runtime, TIDAK pernah masuk image:

  1. Docker secrets (Swarm) / mounted secret file saat run:
     docker run -v /path/to/secret.txt:/run/secrets/api_key:ro myapp:1.0

  2. Environment variable saat runtime (bukan saat build):
     docker run -e API_KEY="$API_KEY" myapp:1.0
     (nilai TIDAK ter-bake ke image, hanya ada saat container jalan)

  3. BuildKit secret mount (secret HANYA tersedia sesaat saat RUN,
     tidak tersimpan di layer manapun):

     # syntax=docker/dockerfile:1
     RUN --mount=type=secret,id=api_key \
         curl -H "Authorization: Bearer $(cat /run/secrets/api_key)" https://internal-api/setup

     docker build --secret id=api_key,src=./api_key.txt -t myapp .
     → secret TIDAK muncul di layer manapun, TIDAK muncul di docker history

  4. Secret manager eksternal (Vault, GCP Secret Manager, AWS Secrets Manager)
     → aplikasi fetch secret saat startup, bukan di-bake sama sekali
```

**Best practice:** Anggap semua yang masuk lewat `ARG`, `ENV`, atau `COPY` ke dalam image sebagai **permanen dan bisa dibaca siapa saja yang punya akses image**. Gunakan BuildKit secret mount untuk kebutuhan saat build, dan environment variable/secret manager untuk kebutuhan saat runtime.

---

## 7. Image Scanning di CI

Scanning manual sesekali tidak cukup — vulnerability baru terus ditemukan di paket OS dan library yang sudah lama tidak berubah di image. Jadikan scanning sebagai **gate otomatis** (lihat detail flow di [03-images-registry.md](03-images-registry.md)).

```
CI Pipeline dengan scanning gate:

  build image → scan (Trivy/Grype/Artifact Analysis) → evaluasi severity
                                                              │
                          ┌───────────────────────────────────┤
                          ▼                                   ▼
                  ❌ CRITICAL/HIGH found                ✅ Aman (atau hanya
                  → GAGALKAN pipeline                      LOW/MEDIUM diterima)
                  → jangan push ke registry              → lanjut push & deploy
```

**Best practice:** Jadwalkan **rebuild + rescan rutin** (misal mingguan) untuk image yang jarang berubah source code-nya. Base image bisa mendapat patch security baru meskipun aplikasi sendiri tidak ada perubahan kode — tanpa rebuild rutin, image production diam-diam menjadi usang dari sisi security.

---

## Skenario: Audit Sebelum Rilis ke Production

Tim akan merilis image `myapp:1.4.0` ke production. Sebelum deploy, dilakukan audit cepat berdasarkan checklist di bawah.

```
Audit myapp:1.4.0:

  [x] Base image: node:20.11.1-alpine3.19 (pinned, bukan :latest)     ✅
  [ ] USER masih root (belum ditambahkan USER non-root)                ❌
  [x] .dockerignore ada, node_modules & .env dikecualikan               ✅
  [x] Tidak ada ARG/ENV berisi secret di Dockerfile                     ✅
  [ ] Belum ada HEALTHCHECK                                              ❌
  [x] Image sudah di-scan, tidak ada CRITICAL CVE                        ✅
  [x] Tag versi semantik (1.4.0), bukan latest                           ✅

  Hasil: 2 item GAGAL — tim menambahkan USER appuser dan HEALTHCHECK
  sebelum rilis benar-benar dilepas ke production.
```

---

## Production Readiness Checklist

```
Dockerfile:
  [ ] Base image di-pin ke versi spesifik (bukan :latest)
  [ ] Base image minimal (alpine/slim/distroless) untuk stage runtime
  [ ] Multi-stage build — toolchain build TIDAK ikut ke image final
  [ ] USER non-root di-set sebelum CMD/ENTRYPOINT
  [ ] .dockerignore mengecualikan .git, node_modules, .env, dll
  [ ] Tidak ada secret di ARG/ENV/COPY — pakai runtime injection
  [ ] CMD/ENTRYPOINT pakai exec form (array), bukan shell form
  [ ] HEALTHCHECK terkonfigurasi dan cek dependency kritis

Image & Registry:
  [ ] Tag image pakai versi semantik atau commit SHA (traceable)
  [ ] Image di-scan vulnerability sebagai gate di CI (bukan opsional)
  [ ] Image disimpan di private registry (bukan public repo untuk app internal)
  [ ] Rebuild + rescan rutin terjadwal (bukan hanya saat kode berubah)

Runtime:
  [ ] Resource limit di-set (--memory, --cpus atau equivalent)
  [ ] Volume dipakai untuk data yang harus persistent
  [ ] restart policy sesuai (unless-stopped / on-failure)
  [ ] Logging terarah ke stdout/stderr (bukan file di dalam container)
  [ ] Network custom (user-defined bridge) dipakai, bukan default bridge

Operasional:
  [ ] docker system prune / volume prune dijadwalkan untuk housekeeping
  [ ] Monitoring resource usage container (docker stats / observability tool)
  [ ] Dokumentasi rollback: tag versi sebelumnya masih tersedia di registry
```

---

*Dokumen ini berdasarkan Docker Engine, BuildKit, dan praktik keamanan container umum per 2026.*
