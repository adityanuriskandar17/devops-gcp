# Images & Registry

Dokumentasi workflow **build → tag → push → pull**, konvensi penamaan image, perbandingan **Docker Hub** vs **private registry** vs **cloud registry** (GCP Artifact Registry, AWS ECR), konsep **image scanning** untuk vulnerability, dan skenario setup CI pipeline yang build & push image bertag.

---

## Workflow Build → Tag → Push → Pull

```
┌────────────┐   docker build   ┌────────────┐   docker tag    ┌──────────────┐
│ Dockerfile  │ ───────────────► │   Image     │ ───────────────► │ Image + Tag   │
│ + source     │                 │  (local)     │                 │  registry-ready│
└────────────┘                 └────────────┘                 └──────┬───────┘
                                                                       │ docker push
                                                                       ▼
                                                              ┌──────────────┐
                                                              │   Registry    │
                                                              │ (Docker Hub /  │
                                                              │  Artifact Reg /│
                                                              │  ECR / GHCR)   │
                                                              └──────┬───────┘
                                                                       │ docker pull
                                                                       ▼
                                                              ┌──────────────┐
                                                              │  Mesin lain    │
                                                              │  (server, CI,  │
                                                              │   developer)   │
                                                              └──────────────┘
```

```bash
# 1. Build image dari Dockerfile di direktori saat ini
docker build -t myapp:1.0 .

# 2. Tag image supaya sesuai konvensi penamaan registry tujuan
docker tag myapp:1.0 asia-southeast2-docker.pkg.dev/my-project/my-repo/myapp:1.0

# 3. Login ke registry (sekali per registry, token/credential di-cache)
docker login asia-southeast2-docker.pkg.dev

# 4. Push image ke registry
docker push asia-southeast2-docker.pkg.dev/my-project/my-repo/myapp:1.0

# 5. Pull image dari mesin/server lain
docker pull asia-southeast2-docker.pkg.dev/my-project/my-repo/myapp:1.0
```

**Catatan:** `docker tag` **tidak menyalin** image — hanya membuat referensi/alias baru yang menunjuk ke image ID yang sama. Satu image bisa punya banyak tag sekaligus tanpa menambah storage.

---

## Konvensi Penamaan Image

Nama image lengkap (**image reference**) punya struktur baku:

```
[REGISTRY_HOST[:PORT]/]NAMESPACE/REPOSITORY[:TAG]

Contoh lengkap:
  asia-southeast2-docker.pkg.dev/my-project/my-repo/myapp:1.0
  └──────────┬──────────────┘ └───┬───┘ └──┬─┘ └─┬─┘ └┬┘
         REGISTRY HOST          PROJECT   REPO  APP  TAG
                                (namespace)

Contoh Docker Hub (registry default, host bisa disembunyikan):
  nginx:1.25              → docker.io/library/nginx:1.25   (official image)
  myuser/myapp:1.0        → docker.io/myuser/myapp:1.0     (user namespace)

Contoh Artifact Registry (GCP):
  REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/IMAGE:TAG

Contoh Amazon ECR:
  ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/REPOSITORY:TAG

Contoh GitHub Container Registry:
  ghcr.io/OWNER/IMAGE:TAG
```

| Bagian | Fungsi | Contoh |
|--------|--------|--------|
| **Registry host** | Server tempat image disimpan; kalau kosong, default ke `docker.io` (Docker Hub) | `asia-southeast2-docker.pkg.dev` |
| **Namespace/Project** | Pengelompokan — user, organisasi, atau project cloud | `my-project` |
| **Repository** | Nama aplikasi/image | `my-repo/myapp` |
| **Tag** | Versi/variant dari repository yang sama | `1.0`, `1.0-alpine`, `latest` |

**Best practice:** Pakai tag yang **spesifik dan immutable** seperti versi semantik (`1.4.2`) atau git commit SHA (`sha-a1b2c3d`), bukan `latest`. Lihat detail alasan dan konsekuensinya di [07-best-practices.md](07-best-practices.md).

---

## Docker Hub vs Private Registry vs Cloud Registry

| Aspek | Docker Hub | Private Registry (self-hosted) | GCP Artifact Registry | AWS ECR |
|-------|-----------|--------------------------------|------------------------|---------|
| **Hosting** | Managed oleh Docker Inc. | Kamu deploy sendiri (`registry:2` image, Harbor, dll) | Managed oleh Google Cloud | Managed oleh AWS |
| **Public image** | Ya (image resmi seperti `nginx`, `node`) | Tidak — semua private by default | Tidak — private di dalam project | Tidak — private di dalam account |
| **Access control** | Team/Organization (paid tier) | Full control (kamu atur sendiri) | IAM (roles/artifactregistry.*) | IAM (policy per repository) |
| **Rate limit pull anonymous** | Ya, dibatasi (per IP/per user) | Tidak ada (kamu yang kontrol) | Tidak ada rate limit publik | Tidak ada rate limit publik |
| **Vulnerability scanning** | Terbatas (paid tier) | Tergantung tooling tambahan (Trivy, Clair) | Built-in (Artifact Analysis) | Built-in (ECR image scanning) |
| **Integrasi cloud native** | Tidak spesifik ke satu cloud | Tidak | Terintegrasi IAM, VPC-SC, Cloud Build, GKE | Terintegrasi IAM, VPC, ECS/EKS |
| **Cocok untuk** | Open-source image, base image publik | Air-gapped/on-prem environment, kontrol penuh infra | Workload yang jalan di GCP (GKE, Cloud Run, GCE) | Workload yang jalan di AWS (ECS, EKS, Lambda) |

```
Kapan pakai yang mana?

  Base image publik (nginx, postgres, node, alpine)
    ──► Docker Hub (docker.io/library/...)

  Image aplikasi milik sendiri, deploy ke GCP
    ──► GCP Artifact Registry (dekat dengan compute, IAM terintegrasi,
        network path private lewat VPC kalau perlu)

  Image aplikasi milik sendiri, deploy ke AWS
    ──► AWS ECR

  Air-gapped / regulasi ketat / tidak boleh keluar network internal
    ──► Private registry self-hosted (Harbor, Nexus, registry:2)
```

**Penting:** Menyimpan image aplikasi production di **Docker Hub public repository** berisiko — siapa saja bisa pull dan melihat isi image (termasuk kalau ada secret yang ter-bake secara tidak sengaja, lihat [07-best-practices.md](07-best-practices.md)). Gunakan **private repository** di registry manapun untuk image internal.

---

## Image Scanning untuk Vulnerability

Image dibangun dari layer OS + dependency — setiap layer bisa membawa **known vulnerability (CVE)** dari paket yang sudah usang. Image scanning membaca daftar paket di setiap layer dan mencocokkan dengan database CVE.

```
┌─────────────────────────────────────────────────────────────┐
│                     Image Scanning Flow                      │
│                                                               │
│  Image (layers)                                               │
│    │                                                          │
│    ▼                                                          │
│  Scanner (Trivy / Grype / Artifact Analysis / ECR scanning)   │
│    │  1. Ekstrak daftar paket OS + library per layer           │
│    │  2. Cocokkan versi paket dengan database CVE               │
│    │     (NVD, OS vendor advisory, dll)                          │
│    ▼                                                          │
│  Report:                                                       │
│    CRITICAL: openssl 1.1.1k → CVE-2023-XXXX (upgrade ke 1.1.1w)│
│    HIGH:     libxml2 2.9.10  → CVE-2022-YYYY                    │
│    MEDIUM:   curl 7.68.0     → CVE-2021-ZZZZ                    │
│                                                               │
│  ✅ Tidak ada CRITICAL → lanjut deploy                         │
│  ❌ Ada CRITICAL          → block pipeline, gagalkan build       │
└─────────────────────────────────────────────────────────────┘
```

| Tool/Layanan | Tipe | Catatan |
|--------------|------|---------|
| **Trivy** | Open-source CLI | Bisa scan image, filesystem, repo Git; mudah diintegrasikan ke CI apapun |
| **Grype** | Open-source CLI | Alternatif Trivy, dari Anchore |
| **GCP Artifact Analysis** | Built-in cloud service | Otomatis scan image yang di-push ke Artifact Registry |
| **AWS ECR Image Scanning** | Built-in cloud service | Otomatis scan saat push (basic scan gratis, enhanced scan berbayar) |
| **Docker Scout** | Built-in Docker CLI | `docker scout cves IMAGE` — terintegrasi langsung ke Docker CLI |

**Best practice:** Jalankan image scanning **sebagai gate di CI pipeline**, sebelum image di-push ke registry production — bukan hanya scan manual sesekali. Kombinasikan dengan kebiasaan **rebuild image secara rutin** (misal mingguan) supaya patch security dari base image ikut terbawa, bukan hanya saat source code aplikasi berubah.

---

## Skenario: Setup CI Pipeline Build & Push Image Bertag

Tim ingin setiap push ke branch `main` otomatis: build image, scan vulnerability, tag dengan commit SHA, lalu push ke Artifact Registry — tanpa proses manual.

```
Trigger: git push ke branch main
       │
       ▼
Step 1: Checkout source code
       │
       ▼
Step 2: docker build -t TEMP_IMAGE .
       │  Build image dari Dockerfile (idealnya multi-stage, lihat 02-dockerfile.md)
       │
       ▼
Step 3: Scan vulnerability (trivy image TEMP_IMAGE)
       │
       ├── ❌ Ada CRITICAL CVE → pipeline GAGAL, stop di sini
       │
       └── ✅ Aman → lanjut
       │
       ▼
Step 4: Tag image dengan commit SHA (immutable, traceable)
       │  docker tag TEMP_IMAGE REGISTRY/myapp:sha-a1b2c3d
       │  docker tag TEMP_IMAGE REGISTRY/myapp:latest   (opsional, untuk convenience)
       │
       ▼
Step 5: Login ke registry (pakai service account / OIDC, bukan password statis)
       │
       ▼
Step 6: docker push REGISTRY/myapp:sha-a1b2c3d
       │
       ▼
Step 7: (opsional) Trigger deployment step — update manifest/Deployment
       │  dengan tag image yang baru di-push
       ▼
✅ Image tersedia di registry, siap di-pull oleh target deployment
```

Contoh implementasi di GitHub Actions:

```yaml
name: build-and-push
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Scan image (fail on CRITICAL)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          severity: CRITICAL
          exit-code: "1"

      - name: Authenticate to registry
        run: echo "${{ secrets.REGISTRY_TOKEN }}" | docker login REGISTRY_HOST --username _token_ --password-stdin

      - name: Tag & push
        run: |
          docker tag myapp:${{ github.sha }} REGISTRY_HOST/my-project/my-repo/myapp:${{ github.sha }}
          docker push REGISTRY_HOST/my-project/my-repo/myapp:${{ github.sha }}
```

**Catatan:** Tag dengan commit SHA (bukan `latest`) membuat setiap image **traceable** — dari tag image, bisa langsung ditelusuri commit source code mana yang menghasilkannya. Ini krusial saat debugging insiden production.

---

## Ringkasan Konsep

```
Workflow: build → tag → push → pull

  docker build -t NAME:TAG .     → hasilkan image local
  docker tag SRC DEST:TAG         → beri alias baru (tidak duplikasi storage)
  docker push DEST:TAG            → upload ke registry
  docker pull DEST:TAG            → download dari registry

Konvensi nama:
  [registry-host/]namespace/repository[:tag]

Registry:
  Docker Hub          → base image publik, bukan untuk image production internal
  Private self-hosted → kontrol penuh, cocok air-gapped
  Artifact Registry    → native GCP, IAM terintegrasi
  ECR                   → native AWS, IAM terintegrasi

Image scanning:
  Scan setiap layer → cocokkan dengan database CVE →
  gate di CI SEBELUM push ke registry production

Tagging strategy:
  Pakai versi semantik atau commit SHA — traceable & immutable
  Hindari 'latest' untuk image production (lihat 07-best-practices.md)
```

---

*Dokumen ini berdasarkan Docker CLI, GCP Artifact Registry, dan AWS ECR per 2026.*
