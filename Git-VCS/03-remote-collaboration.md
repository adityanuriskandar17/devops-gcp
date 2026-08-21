# Remote & Collaboration

Dokumentasi lengkap **kolaborasi lewat remote repository** — konsep remote (origin/upstream), perbedaan clone/fetch/pull, workflow pull request/merge request, model fork vs shared-repo, perbandingan platform hosting (GitHub/GitLab/Bitbucket), protected branch, dan skenario kontribusi open-source lengkap.

---

## Remote — Origin dan Upstream

Remote adalah **referensi** ke repository lain (biasanya di server seperti GitHub) yang terhubung dengan repo lokal kamu. Satu repo lokal bisa punya lebih dari satu remote.

```
Repo lokal kamu (clone hasil fork)

  ┌───────────────────────────────────────────────────────┐
  │  Local Repo (di laptop kamu)                          │
  │                                                         │
  │  remote "origin"   ──────► github.com/YOURNAME/repo.git │
  │  (fork kamu — biasa untuk push hasil kerjamu)           │
  │                                                         │
  │  remote "upstream" ──────► github.com/ORIGINAL/repo.git │
  │  (repo asli — biasa untuk pull update terbaru)          │
  └───────────────────────────────────────────────────────┘
```

```bash
git remote -v                                    # lihat semua remote & URL-nya
git remote add origin https://github.com/x/y.git # tambah remote baru
git remote add upstream https://github.com/a/b.git
git remote rename origin old-origin               # rename remote
git remote remove upstream                        # hapus remote
git remote set-url origin git@github.com:x/y.git   # ganti URL (misal HTTPS→SSH)
```

| Nama Remote | Konvensi Penggunaan |
|-------------|------------------------|
| **origin** | Remote default — biasanya repo tempat kamu punya write access (repo asli, atau fork milikmu) |
| **upstream** | Repo "sumber asli", dipakai kalau kamu kerja dari fork dan perlu sinkron update dari project original |

**Catatan:** Nama "origin" dan "upstream" hanyalah **konvensi**, bukan keyword khusus di Git — kamu bisa menamainya apapun. Tapi hampir semua tooling, dokumentasi, dan developer lain mengasumsikan penamaan ini, jadi sebaiknya tetap diikuti.

---

## Clone vs Fetch vs Pull

Tiga command ini sering tertukar tapi punya perbedaan fundamental.

```
git clone   → COPY seluruh repo (history + semua branch) dari remote,
              sekali di awal, otomatis set remote "origin"

git fetch   → AMBIL update terbaru dari remote (commit, branch baru)
              TAPI TIDAK menggabungkannya ke branch lokal kamu.
              Aman 100% — tidak mengubah working directory sama sekali.

git pull    → git fetch + git merge (atau + git rebase kalau pakai --rebase)
              digabungkan langsung ke branch lokal yang sedang aktif.
```

```
Visualisasi git fetch (tidak mengubah local branch):

  Sebelum fetch:
    origin/main (tracking)   A ── B         (posisi lama, belum tahu ada update)
    main (lokal)              A ── B ── C   (HEAD kamu, ada 1 commit lokal)

  Remote sebenarnya sudah:
    origin/main (server)      A ── B ── D ── E

  $ git fetch origin

  Setelah fetch:
    origin/main (tracking)   A ── B ── D ── E   ← ter-update
    main (lokal)              A ── B ── C        ← TETAP, belum digabung

  Sekarang kamu bisa decide: merge, rebase, atau cek dulu isi D & E
  sebelum menggabungkan (git log origin/main, git diff main origin/main)
```

| Command | Ambil data dari remote? | Gabung ke branch lokal? | Ubah working directory? |
|---------|---------------------------|----------------------------|----------------------------|
| `git fetch` | ✅ Ya | ❌ Tidak | ❌ Tidak — 100% aman |
| `git pull` | ✅ Ya | ✅ Ya (merge/rebase) | ✅ Ya — bisa trigger conflict |
| `git pull --rebase` | ✅ Ya | ✅ Ya (rebase, bukan merge) | ✅ Ya — history jadi linear |
| `git clone` | ✅ Ya (full copy pertama kali) | — (belum ada branch lokal) | ✅ Ya — buat folder project baru |

**Best practice:** Jika ragu, gunakan `git fetch` dulu untuk melihat apa yang berubah di remote (`git log main..origin/main`) sebelum memutuskan cara menggabungkannya. `git pull` yang langsung dijalankan tanpa melihat isinya bisa mengejutkan kalau ternyata ada conflict atau perubahan besar yang tidak terduga.

---

## Push, Pull Request, dan Merge Request

**Push** mengirim commit lokal ke remote. Tapi di kebanyakan tim modern, kamu **tidak push langsung ke branch utama** — melainkan lewat mekanisme review bernama **Pull Request (PR)** di GitHub/Bitbucket, atau **Merge Request (MR)** di GitLab (istilah berbeda, konsep sama).

```
Workflow PR/MR:

  1. git switch -c feature/add-search
  2. ... coding ...
  3. git commit -m "feat: add search endpoint"
  4. git push origin feature/add-search
  5. Buka platform (GitHub/GitLab/Bitbucket) → buat PR/MR
     "feature/add-search" → merge ke → "main"
  6. Reviewer comment, request changes, approve
  7. CI/CD jalan otomatis (test, lint, build)
  8. Setelah approved + CI hijau → Merge (via UI)
  9. Branch feature/add-search bisa dihapus
```

```
┌─────────────────────────────────────────────────────────────┐
│  Pull Request #42: feat: add search endpoint                │
│  feature/add-search → main                                   │
│                                                                │
│  ✅ CI: build passed                                          │
│  ✅ CI: tests passed (24/24)                                   │
│  👤 Reviewer: bob approved                                     │
│  💬 3 comments (resolved)                                      │
│                                                                │
│  [ Merge pull request ▼ ]                                     │
│    ├── Create a merge commit                                  │
│    ├── Squash and merge                                       │
│    └── Rebase and merge                                       │
└─────────────────────────────────────────────────────────────┘
```

| Opsi Merge di UI | Efek ke History |
|--------------------|--------------------|
| **Merge commit** | Semua commit di branch tetap terlihat + 1 merge commit baru (2 parent) |
| **Squash and merge** | Semua commit di branch digabung jadi **1 commit** di main — history main bersih, tapi detail commit individual hilang |
| **Rebase and merge** | Setiap commit di branch di-replay linear di atas main, TANPA merge commit |

**Penting:** "Squash and merge" populer untuk feature branch yang punya banyak commit "WIP", "fix typo", "oops" — supaya history di `main` tetap bersih (1 commit = 1 fitur). Tapi ini menghilangkan granularitas history individual commit di branch aslinya (masih ada di branch sebelum dihapus, dan biasanya masih tersimpan di PR).

---

## Fork Model vs Shared-Repo Model

Dua model kolaborasi paling umum, tergantung siapa yang punya akses write ke repo.

```
Shared-Repo Model (tim internal):

  ┌─────────────────────────┐
  │  1 Repository            │
  │  Semua developer punya   │
  │  WRITE access langsung   │
  └───────┬────────┬─────────┘
          │        │
     branch A   branch B     ← semua branch DI DALAM repo yang sama
     (Alice)    (Bob)
          │        │
          └───► PR/MR ke main ◄───┘


Fork Model (open source / kontributor eksternal):

  ┌──────────────────────┐         ┌──────────────────────┐
  │  Upstream Repo         │         │  Fork (copy repo)     │
  │  (org/project)         │  fork   │  (yourname/project)   │
  │  Kamu TIDAK punya      │ ──────► │  Kamu punya FULL      │
  │  write access          │         │  write access di sini │
  └──────────▲─────────────┘         └──────────┬─────────────┘
             │                                    │
             │         Pull Request               │
             └────────────────────────────────────┘
               (dari branch di fork kamu, ke upstream)
```

| Aspek | Shared-Repo Model | Fork Model |
|-------|---------------------|--------------|
| **Write access** | Semua kontributor punya akses langsung ke 1 repo | Hanya maintainer; kontributor kerja di fork masing-masing |
| **Cocok untuk** | Tim internal perusahaan | Open source, kontributor eksternal, banyak orang tak dikenal |
| **Branch dibuat di** | Repo utama langsung | Fork milik masing-masing kontributor |
| **PR/MR dibuat dari** | branch → branch (repo sama) | fork branch → upstream branch |
| **Kontrol maintainer** | Sedang (lewat protected branch + review) | Tinggi (kontributor tidak bisa ubah apapun tanpa PR di-approve) |

---

## Perbandingan Platform: GitHub vs GitLab vs Bitbucket

| Fitur | GitHub | GitLab | Bitbucket |
|-------|--------|--------|-----------|
| **Istilah PR** | Pull Request | Merge Request (MR) | Pull Request |
| **CI/CD built-in** | GitHub Actions | GitLab CI/CD (`.gitlab-ci.yml`) — sangat terintegrasi | Bitbucket Pipelines |
| **Self-hosted option** | GitHub Enterprise Server | GitLab Self-Managed / Community Edition (gratis) | Bitbucket Data Center |
| **Free private repo** | ✅ Unlimited (dengan batas Actions minutes) | ✅ Unlimited | ✅ Unlimited (tim kecil) |
| **Container registry** | GitHub Container Registry (ghcr.io) | GitLab Container Registry built-in | Terbatas (butuh integrasi eksternal) |
| **Issue tracking** | GitHub Issues | GitLab Issues + Epics (lebih hierarkis) | Jira (integrasi native — Bitbucket produk Atlassian) |
| **Populer di kalangan** | Open source, komunitas terbesar | Enterprise, DevOps end-to-end (1 platform utuh) | Tim yang sudah pakai Jira/Confluence (Atlassian stack) |
| **Built-in wiki** | ✅ Ada | ✅ Ada | ✅ Ada |
| **Approval rules granular** | Lewat branch protection + CODEOWNERS | Approval rules native, sangat granular | Merge checks sederhana |

**Catatan:** Ketiga platform sama-sama berjalan di atas **Git** — perbedaannya ada di fitur hosting, UI, CI/CD, dan ekosistem sekitarnya, bukan di cara Git itu sendiri bekerja. Command Git (`clone`, `push`, `pull`, dll) identik di ketiganya.

---

## Protected Branches

Protected branch adalah aturan di level platform hosting (bukan Git itu sendiri) yang membatasi apa yang bisa dilakukan langsung ke branch tertentu (biasanya `main`/`production`).

```
Contoh rule protected branch untuk "main":

  ┌─────────────────────────────────────────────────────┐
  │  Branch protection rule: main                        │
  │                                                       │
  │  ☑ Require pull request before merging                │
  │  ☑ Require approvals: minimal 1 reviewer               │
  │  ☑ Require status checks to pass (CI harus hijau)      │
  │  ☑ Require branches to be up to date before merging     │
  │  ☑ Require signed commits                              │
  │  ☑ Do not allow force pushes                           │
  │  ☑ Do not allow deletions                              │
  │  ☐ Allow specified actors to bypass (misal: admin saja) │
  └─────────────────────────────────────────────────────┘
```

| Rule | Fungsi |
|------|--------|
| **Require PR/MR before merging** | Tidak ada yang bisa `git push` langsung ke `main` — harus lewat review |
| **Require approvals** | Minimal N reviewer harus approve sebelum merge diizinkan |
| **Require status checks** | CI (test/build/lint) harus sukses sebelum tombol merge aktif |
| **Require up to date branch** | Branch harus di-update (merge/rebase dari main terbaru) sebelum merge, cegah "merge basi" |
| **No force push** | Cegah siapapun menimpa history `main` dengan `push --force` |
| **No deletions** | Cegah branch `main` terhapus tidak disengaja |

**Best practice:** Aktifkan protected branch untuk minimal `main` dan branch rilis (`release/*`, `production`). Ini mencegah kesalahan manusia paling umum: push langsung tanpa review, atau force-push yang menghapus history tim.

---

## Skenario: Full Cycle Kontribusi Open Source

Kontributor eksternal ("Dina") ingin menambahkan fitur ke project open source yang tidak dia punya write access-nya.

```
Step 1: Fork
  Dina klik "Fork" di github.com/awesome-org/awesome-lib
  → github.com/dina/awesome-lib dibuat (copy penuh, milik Dina)

Step 2: Clone fork ke local
  $ git clone https://github.com/dina/awesome-lib.git
  $ cd awesome-lib
  $ git remote add upstream https://github.com/awesome-org/awesome-lib.git
  $ git remote -v
    origin    https://github.com/dina/awesome-lib.git   (fetch/push)
    upstream  https://github.com/awesome-org/awesome-lib.git (fetch/push)

Step 3: Sinkron dengan upstream (pastikan mulai dari kondisi terbaru)
  $ git fetch upstream
  $ git switch main
  $ git merge upstream/main
  $ git push origin main

Step 4: Buat branch untuk fitur
  $ git switch -c feature/add-json-export

Step 5: Coding + commit
  $ git add src/export.js
  $ git commit -m "feat: add JSON export support"
  $ git commit -m "test: add unit test for JSON export"

Step 6: Push ke FORK (bukan upstream — Dina tidak punya write access ke upstream)
  $ git push origin feature/add-json-export

Step 7: Buka Pull Request
  Di GitHub: "Compare & pull request"
  Base:  awesome-org/awesome-lib  ←  main
  Head:  dina/awesome-lib         ←  feature/add-json-export

  Judul PR: "feat: add JSON export support"
  Deskripsi: menjelaskan apa yang berubah + cara test

Step 8: Review
  Maintainer comment: "tambahkan handling untuk empty array"
  Dina:
    $ git add src/export.js
    $ git commit -m "fix: handle empty array in JSON export"
    $ git push origin feature/add-json-export
  → PR otomatis update (tidak perlu buka PR baru)

Step 9: CI checks
  ✅ Lint passed
  ✅ Unit tests passed (18/18)
  ✅ Build passed

Step 10: Approved & Merged
  Maintainer klik "Squash and merge"
  → 3 commit Dina jadi 1 commit bersih di upstream/main:
    "feat: add JSON export support (#128)"

Step 11: Bersih-bersih
  Dina:
    $ git switch main
    $ git fetch upstream
    $ git merge upstream/main      (sekarang berisi fitur Dina juga)
    $ git push origin main
    $ git branch -d feature/add-json-export
    $ git push origin --delete feature/add-json-export
```

---

## Ringkasan Konsep

```
Remote:
  origin    → remote default, tempat push hasil kerja
  upstream  → repo sumber asli (dipakai di model fork)

Clone/Fetch/Pull:
  clone  → copy penuh repo (sekali di awal)
  fetch  → ambil update, TIDAK digabung otomatis (aman)
  pull   → fetch + merge/rebase otomatis (bisa trigger conflict)

PR/MR workflow:
  branch → push ke remote → buka PR/MR → review + CI →
  merge (merge commit / squash / rebase) → hapus branch

Fork vs Shared-Repo:
  Shared-Repo → tim internal, semua punya write access
  Fork        → open source, kontributor push ke fork sendiri, PR ke upstream

Platform:
  GitHub    → komunitas open source terbesar
  GitLab    → DevOps end-to-end, CI/CD sangat terintegrasi
  Bitbucket → terintegrasi dengan Jira/Confluence (Atlassian)

Protected branch:
  Wajib PR + review + CI hijau sebelum merge ke main
  No force-push, no delete — mencegah kesalahan human error
```

---

*Dokumen ini berdasarkan Git versi 2.4x dan platform hosting (GitHub/GitLab/Bitbucket) per 2026.*
