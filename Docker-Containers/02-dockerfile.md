# Dockerfile

Dokumentasi lengkap **Dockerfile** — instruction reference, perbedaan `CMD` vs `ENTRYPOINT`, `COPY` vs `ADD`, teknik **multi-stage build**, serta optimasi **build cache** dan urutan layer untuk memperkecil ukuran image.

---

## Instruction Reference

Dockerfile adalah teks berisi instruksi berurutan — setiap instruksi (kecuali beberapa metadata) **menghasilkan satu layer baru** di image (lihat [01-concepts.md](01-concepts.md)).

| Instruksi | Fungsi | Contoh |
|-----------|--------|--------|
| **FROM** | Menentukan base image — instruksi pertama di setiap stage | `FROM node:20-slim` |
| **RUN** | Eksekusi command saat **build** (menghasilkan layer baru) | `RUN apt-get update && apt-get install -y curl` |
| **COPY** | Copy file dari build context (host) ke image | `COPY package.json ./` |
| **ADD** | Seperti COPY, tapi bisa extract tar & fetch URL | `ADD app.tar.gz /app/` |
| **WORKDIR** | Set direktori kerja untuk instruksi setelahnya | `WORKDIR /app` |
| **ENV** | Set environment variable, persist ke container runtime | `ENV NODE_ENV=production` |
| **ARG** | Variable hanya tersedia saat **build** (tidak persist ke container) | `ARG VERSION=1.0` |
| **EXPOSE** | Dokumentasi port yang dipakai container (tidak otomatis publish) | `EXPOSE 8080` |
| **USER** | Set user yang menjalankan proses & instruksi setelahnya | `USER appuser` |
| **CMD** | Command default saat container dijalankan (bisa di-override) | `CMD ["node", "server.js"]` |
| **ENTRYPOINT** | Command utama container (biasanya tidak di-override) | `ENTRYPOINT ["node"]` |
| **VOLUME** | Deklarasi mount point untuk data persistent | `VOLUME /data` |
| **HEALTHCHECK** | Command untuk cek kesehatan container secara periodik | `HEALTHCHECK CMD curl -f http://localhost/ \|\| exit 1` |

```
Setiap instruksi = 1 layer baru (kecuali ENV, ARG, WORKDIR, LABEL, dll
yang hanya metadata dan tidak menambah ukuran signifikan):

  FROM node:20-slim     → Layer 1 (base, ~120MB)
  WORKDIR /app          → metadata, hampir tidak menambah ukuran
  COPY package.json .   → Layer 2 (beberapa KB)
  RUN npm install       → Layer 3 (bisa puluhan-ratusan MB!)
  COPY . .              → Layer 4 (source code)
  CMD ["node","index.js"] → metadata, command default
```

**Penting:** `RUN`, `COPY`, dan `ADD` masing-masing membuat layer permanen. Kalau di satu `RUN` kamu `apt-get install` lalu di `RUN` lain kamu `apt-get remove`, **file yang dihapus TIDAK mengecilkan image** — layer sebelumnya (yang berisi file itu) tetap ada di image. Gabungkan install-dan-cleanup dalam **satu** `RUN` kalau ingin benar-benar menghemat ukuran.

---

## CMD vs ENTRYPOINT

Ini instruksi yang paling sering disalahpahami. Keduanya menentukan apa yang dijalankan saat container start, tapi punya sifat override yang berbeda.

| Aspek | CMD | ENTRYPOINT |
|-------|-----|------------|
| **Bisa di-override?** | Ya — argumen `docker run image ARG` menggantikan seluruh CMD | Tidak — argumen `docker run image ARG` **ditambahkan** sebagai argumen ke ENTRYPOINT |
| **Tujuan umum** | Default command / default argumen | Command utama yang wajib dijalankan |
| **Kombinasi keduanya** | CMD jadi default argumen untuk ENTRYPOINT | ENTRYPOINT jadi "binary", CMD jadi "argumen default"-nya |

```
Kasus 1: Hanya CMD
  Dockerfile: CMD ["node", "server.js"]

  docker run myimage
    → jalankan: node server.js

  docker run myimage node debug.js
    → CMD DIABAIKAN, jalankan: node debug.js
    (seluruh CMD di-override oleh argumen di command line)
```

```
Kasus 2: Hanya ENTRYPOINT
  Dockerfile: ENTRYPOINT ["node", "server.js"]

  docker run myimage
    → jalankan: node server.js

  docker run myimage --debug
    → ENTRYPOINT TETAP jalan, argumen ditambahkan:
      jalankan: node server.js --debug
```

```
Kasus 3: ENTRYPOINT + CMD (pola paling umum & direkomendasikan)
  Dockerfile:
    ENTRYPOINT ["node"]
    CMD ["server.js"]

  docker run myimage
    → gabung: node server.js
      (ENTRYPOINT + CMD default)

  docker run myimage debug.js
    → CMD di-override, ENTRYPOINT tetap:
      gabung: node debug.js

  ──► Pola ini memberi FLEKSIBILITAS: user bisa ganti argumen
      (file yang dijalankan) tanpa mengubah "binary" utama (node)
```

**Best practice:** Gunakan bentuk **exec form** (`["executable", "arg1"]`), bukan **shell form** (`node server.js` tanpa array). Exec form menjalankan proses langsung sebagai PID 1 (menerima signal `SIGTERM` dengan benar untuk graceful shutdown); shell form membungkus proses dalam `/bin/sh -c`, sehingga signal tidak diteruskan dengan baik ke proses aplikasi.

```
❌ Shell form:
  CMD node server.js
  → proses sesungguhnya: /bin/sh -c "node server.js"
  → docker stop kirim SIGTERM ke sh, BUKAN ke node
  → node mungkin tidak shutdown gracefully, Docker tunggu timeout
    lalu SIGKILL (paksa)

✅ Exec form:
  CMD ["node", "server.js"]
  → proses sesungguhnya: node server.js (langsung, PID 1)
  → docker stop kirim SIGTERM langsung ke node
  → node bisa handle SIGTERM, cleanup, shutdown gracefully
```

---

## COPY vs ADD

| Aspek | COPY | ADD |
|-------|------|-----|
| **Copy file/folder lokal** | Ya | Ya |
| **Extract file `.tar`, `.tar.gz` otomatis** | Tidak | Ya — otomatis di-extract ke destination |
| **Fetch dari URL remote** | Tidak | Ya (`ADD https://example.com/file.tar.gz /app/`) |
| **Predictability** | Tinggi — hanya copy, tidak ada "magic" | Rendah — behavior tersembunyi (auto-extract) bisa mengejutkan |
| **Direkomendasikan untuk** | Hampir semua kasus | Hanya saat memang butuh extract tar lokal |

**Best practice:** Gunakan `COPY` sebagai default. Docker sendiri merekomendasikan `COPY` karena lebih transparan — apa yang kamu tulis adalah apa yang terjadi. Pakai `ADD` hanya untuk kasus spesifik seperti extract tarball source. **Jangan** pakai `ADD` untuk fetch URL — lebih baik `RUN curl -fsSL URL | ...` supaya bisa kontrol caching, cleanup, dan verifikasi checksum dalam satu langkah.

---

## Multi-Stage Build

Multi-stage build memisahkan **stage build** (butuh compiler, dependency development, tools besar) dari **stage runtime** (hanya butuh binary hasil compile). Hasil akhirnya: image production yang jauh lebih kecil karena tidak membawa toolchain build.

```
┌───────────────────────────────┐        ┌───────────────────────────────┐
│  Stage 1: "builder"            │        │  Stage 2: runtime (final)      │
│  FROM golang:1.22               │        │  FROM alpine:3.20               │
│                                  │        │                                  │
│  Berisi:                          │  COPY  │  Berisi:                          │
│  - Go compiler (~350MB)          │ --from=│  - Hanya binary hasil compile      │
│  - Source code                   │ builder│    (beberapa MB)                    │
│  - Build cache                   │───────►│  - Base alpine minimal (~7MB)       │
│  - Dependency modules             │        │                                  │
│                                  │        │  TIDAK ikut:                       │
│  Ukuran total: ~900MB             │        │  - Go compiler                     │
│  (TIDAK dipakai di production)    │        │  - Source code                     │
│                                  │        │  - Build cache                     │
└───────────────────────────────┘        └───────────────────────────────┘
                                                Ukuran final: ~15MB
```

Contoh worked example lengkap untuk aplikasi Go:

```dockerfile
# ── Stage 1: builder ──────────────────────────────────────────────
FROM golang:1.22 AS builder

WORKDIR /src

# Copy go.mod & go.sum dulu (terpisah dari source code)
# supaya layer "download dependency" bisa di-cache
COPY go.mod go.sum ./
RUN go mod download

# Copy source code, lalu compile jadi binary statis
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/app ./cmd/server

# ── Stage 2: runtime ───────────────────────────────────────────────
FROM alpine:3.20 AS runtime

RUN apk add --no-cache ca-certificates && \
    addgroup -S app && adduser -S app -G app

WORKDIR /app

# Hanya copy binary hasil build dari stage "builder"
COPY --from=builder /out/app .

USER app
EXPOSE 8080
ENTRYPOINT ["./app"]
```

Contoh untuk aplikasi Node.js (build step lebih ringan tapi tetap manfaat multi-stage untuk memisahkan `devDependencies`):

```dockerfile
# ── Stage 1: install & build ──────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                      # install SEMUA deps termasuk devDependencies
COPY . .
RUN npm run build                # hasilkan folder dist/

# ── Stage 2: runtime ───────────────────────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev            # HANYA production dependencies
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/index.js"]
```

**Best practice:** Beri nama tiap stage dengan `AS nama` (`builder`, `runtime`, `test`, dll) supaya `COPY --from=nama` jelas maksudnya, dan supaya bisa target stage tertentu saat build (`docker build --target=builder .`) — misalnya untuk menjalankan test di stage builder tanpa membuat image final.

---

## Build Cache & Urutan Layer

Docker men-cache setiap layer. Kalau instruksi dan file input-nya **tidak berubah** dari build sebelumnya, Docker **skip eksekusi ulang** dan pakai layer dari cache — build jadi jauh lebih cepat.

```
Build cache bekerja per-instruksi, top-to-bottom:

  FROM node:20-slim         ← cache hit (base image tidak berubah)
  WORKDIR /app               ← cache hit
  COPY package.json .        ← cache hit JIKA package.json tidak berubah
  RUN npm install             ← cache hit JIKA instruksi di atas cache hit
  COPY . .                    ← cache MISS jika source code berubah
  RUN npm run build            ← otomatis MISS (layer di atasnya miss)

  ATURAN: begitu SATU layer cache miss, SEMUA layer setelahnya
  juga otomatis rebuild (invalidated) — meski isinya sendiri tidak berubah.
```

Karena itu, **urutan instruksi sangat menentukan seberapa sering cache terpakai**. Prinsip: taruh yang **paling sering berubah** (source code) di **paling bawah**, yang **paling jarang berubah** (base image, dependency manifest) di **paling atas**.

```
❌ Urutan buruk (cache selalu invalid saat source code berubah):

  FROM node:20-slim
  WORKDIR /app
  COPY . .                 ← copy SEMUA file, termasuk source code
  RUN npm install            ← ikut re-run SETIAP source code berubah,
                                padahal package.json belum tentu berubah!

✅ Urutan baik (cache tetap valid untuk npm install):

  FROM node:20-slim
  WORKDIR /app
  COPY package.json package-lock.json ./   ← copy manifest DULU
  RUN npm install                            ← cache hit selama manifest sama
  COPY . .                                    ← baru copy source code
  RUN npm run build
```

```
Dampak ke waktu build:

  Urutan buruk:  ubah 1 baris kode → npm install re-run → build 90 detik
  Urutan baik:   ubah 1 baris kode → npm install cache hit → build 8 detik
```

---

## Skenario: Mengecilkan Image dari 1.2GB Menjadi 80MB

Tim punya aplikasi Node.js dengan Dockerfile berikut — image final **1.2GB**, terlalu besar untuk deploy cepat dan boros storage di registry.

```dockerfile
# ❌ Dockerfile awal — image 1.2GB
FROM node:20

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

ENV NODE_ENV=production
CMD ["npm", "start"]
```

**Masalah yang teridentifikasi:**

```
1. FROM node:20               → base image FULL Debian (~1GB), bukan slim/alpine
2. COPY . . sebelum npm install → cache SELALU invalid, setiap source
                                    code berubah, npm install re-run semua
3. npm install (bukan npm ci)  → install devDependencies juga di production
4. Tidak ada .dockerignore     → node_modules, .git ikut ter-copy ke context
5. Single-stage                → source code mentah + devDependencies +
                                    build tools semua ikut ke image final
```

**Perbaikan langkah demi langkah:**

```
Step 1: Base image node:20 (Debian full) → node:20-alpine
        1.2GB base → ~180MB base
        Sisa: ~380MB

Step 2: Tambah .dockerignore
        node_modules/
        .git/
        *.md
        Dockerfile
        Sisa: ~350MB (context lebih kecil, tidak ada file sia-sia ter-copy)

Step 3: Perbaiki urutan COPY — manifest dulu, source belakangan
        COPY package*.json ./
        RUN npm ci
        COPY . .
        Sisa: ~350MB (belum berkurang ukuran, tapi build jadi lebih cepat)

Step 4: Multi-stage build — pisahkan builder & runtime
        Stage builder: node:20-alpine + devDependencies + build
        Stage runtime: node:20-alpine + npm ci --omit=dev + hasil build saja
        Sisa: ~90MB

Step 5: npm ci --omit=dev di stage runtime (bukan npm install)
        Hanya production dependencies ikut ke image final
        Sisa: ~80MB
```

Dockerfile hasil akhir:

```dockerfile
# ✅ Dockerfile final — image ~80MB

# .dockerignore:
#   node_modules
#   .git
#   *.md

# ── builder ──────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── runtime ──────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/index.js"]
```

| Versi | Ukuran Image | Waktu Build (ubah 1 baris kode) |
|-------|-------------|----------------------------------|
| Awal (single-stage, node:20) | 1.2 GB | ~95 detik (cache selalu invalid) |
| Final (multi-stage, alpine) | ~80 MB | ~10 detik (cache termanfaatkan) |

**Hasil:** Image 93% lebih kecil, push/pull ke registry jauh lebih cepat, dan build time berkurang drastis karena cache layer termanfaatkan dengan benar.

---

## Ringkasan Konsep

```
Dockerfile = resep step-by-step untuk membangun image

  Setiap instruksi (RUN/COPY/ADD) = 1 layer baru
  ENV/ARG/WORKDIR/LABEL = metadata, hampir tanpa biaya ukuran

CMD vs ENTRYPOINT:
  CMD saja         → mudah di-override total
  ENTRYPOINT saja   → argumen CLI ditambahkan, command utama tetap
  ENTRYPOINT + CMD  → pola terbaik: binary tetap, argumen default fleksibel

COPY vs ADD:
  COPY → default, predictable
  ADD  → hanya untuk extract tar lokal

Multi-stage build:
  Stage builder (compiler, deps)  →  Stage runtime (hasil saja)
  Image final TIDAK bawa toolchain build

Build cache:
  Cache invalid dari titik pertama yang berubah, ke bawah
  Urutan: base image → manifest dependency → install → source code → build

Optimasi ukuran image:
  base image kecil (alpine/distroless) + .dockerignore +
  multi-stage + install production-only dependencies
```

---

*Dokumen ini berdasarkan Dockerfile syntax & BuildKit versi stabil per 2026.*
