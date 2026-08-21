# Konsep & Cara Kerja Git

Dokumentasi konsep dasar **Git** — snapshot model, three-tree architecture, anatomy sebuah commit, branch sebagai pointer, HEAD, dan detached HEAD state.

---

## Snapshot Model vs Delta-Based Model

VCS lama seperti **SVN/CVS** menyimpan history sebagai **rangkaian delta (diff)** — setiap versi disimpan sebagai "apa yang berubah dari versi sebelumnya". Git bekerja berbeda: setiap commit adalah **snapshot lengkap** dari seluruh project pada titik waktu itu.

```
Delta-based (SVN/CVS):                    Snapshot-based (Git):

  v1: file.txt (full)                       commit A: [snapshot lengkap semua file]
  v2: diff(v1→v2)                                        │
  v3: diff(v2→v3)                                        ▼
  v4: diff(v3→v4)                            commit B: [snapshot lengkap semua file]
                                                          │
  Untuk lihat v4, harus                                  ▼
  apply semua diff dari v1                   commit C: [snapshot lengkap semua file]
  secara berurutan.
                                              Setiap commit "tahu" persis kondisi
                                              SELURUH project — tidak perlu
                                              replay diff satu-satu.
```

**Catatan:** Secara internal Git tetap efisien secara storage — file yang tidak berubah antar commit tidak disimpan dua kali, cukup di-reference (pointer ke object yang sama). Tapi secara **konsep**, setiap commit direpresentasikan sebagai snapshot utuh, bukan diff — inilah yang membuat operasi seperti `checkout` ke commit manapun sama cepatnya, dan branching menjadi sangat murah.

| Aspek | Delta-based (SVN/CVS) | Snapshot-based (Git) |
|-------|------------------------|------------------------|
| Cara simpan versi | Diff antar revisi berurutan | Snapshot lengkap tiap commit |
| Checkout ke versi lama | Replay diff satu-satu (lambat) | Langsung ambil snapshot (cepat) |
| Branching | Mahal (copy direktori di server) | Murah (hanya buat pointer baru) |
| Bergantung urutan history | Ya, linear | Tidak — bisa banyak parent (merge) |

---

## Three-Tree Architecture

Secara internal, Git mengelola tiga "tree" (representasi struktur file) yang saling berkaitan:

```
┌───────────────────────────────────────────────────────────────────┐
│                        THREE TREES                                │
│                                                                     │
│  1. HEAD                    2. Index (Staging)      3. Working    │
│     └── snapshot commit         └── snapshot yang        Directory │
│         terakhir (apa yang          akan jadi commit      └── file │
│         "sudah tersimpan")          berikutnya                aktual│
│                                                                di disk│
│  ┌──────────────┐          ┌──────────────┐          ┌──────────┐ │
│  │  Last commit  │          │  Staged        │          │  Editable │ │
│  │  (committed)  │  git add │  changes       │ git      │  files    │ │
│  │              │ ────────►│  (about to     │ commit   │  (bisa    │ │
│  │              │◄─────────│   commit)      │─────────►│  belum    │ │
│  │              │ git reset│                │          │  tracked) │ │
│  └──────────────┘          └──────────────┘          └──────────┘ │
└───────────────────────────────────────────────────────────────────┘

  git status membandingkan ketiga tree ini:
  - Working Dir vs Index    → "Changes not staged for commit"
  - Index vs HEAD           → "Changes to be committed"
  - Working Dir vs HEAD     → gabungan keduanya (untracked + modified)
```

| Tree | Nama Lain | Isi | Command Terkait |
|------|-----------|-----|------------------|
| **HEAD** | Local Repo / commit terakhir | Snapshot commit terakhir di branch aktif | `git log`, `git show HEAD` |
| **Index** | Staging Area / Cache | Snapshot yang sedang disiapkan untuk commit selanjutnya | `git add`, `git status` |
| **Working Directory** | Workspace | File aktual yang bisa kamu edit langsung | `git diff` (tanpa staged) |

---

## Anatomy of a Commit

Sebuah commit bukan hanya "pesan + tanggal" — secara internal, commit adalah **object** dalam database Git yang menyimpan referensi ke struktur data lain.

```
Commit object:

  commit a1b2c3d... (SHA-1/SHA-256 hash — identitas unik commit ini)
  ├── tree:    f4e5d6c...        ──► snapshot struktur folder & file
  │              ├── blob: app.js      (isi file, disimpan sebagai object terpisah)
  │              ├── blob: README.md
  │              └── tree: src/        (subfolder = tree juga, nested)
  │                    └── blob: index.js
  ├── parent:  9f8e7d6...        ──► commit sebelumnya (linked list ke history)
  ├── author:  Aditya <aditya@ftlgym.com>, 2026-08-20 10:00:00 +0700
  ├── committer: Aditya <aditya@ftlgym.com>, 2026-08-20 10:00:00 +0700
  └── message: "feat: add login validation"
```

```
Commit DAG (Directed Acyclic Graph):

  A ── B ── C ── D            main
             \
              E ── F          feature/login
                    \
                     G         (merge commit, 2 parents: F dan D)
                    /
       ...D────────┘

  main:            A → B → C → D ─────────────┐
                                                 ▼
  feature/login:              (branch dari C) E → F → G (merge commit)
```

| Bagian Commit | Fungsi |
|---------------|--------|
| **SHA hash** | ID unik 40-karakter (SHA-1) atau 64-karakter (SHA-256) — hasil hash dari isi commit (tree + parent + metadata). Ubah 1 karakter di file manapun → hash berubah total |
| **Tree** | Representasi struktur direktori pada snapshot itu — daftar file & subfolder |
| **Blob** | Isi konten file (binary large object) — tidak menyimpan nama file, hanya isi |
| **Parent pointer** | Pointer ke commit sebelumnya — inilah yang membentuk history/DAG. Commit pertama tidak punya parent. Merge commit punya 2+ parent |
| **Author vs Committer** | Author = siapa yang menulis perubahan. Committer = siapa yang membuat commit (bisa beda saat rebase/cherry-pick oleh orang lain) |

**Penting:** Karena SHA hash dihitung dari **isi** commit (termasuk parent-nya), mengubah commit apapun di history (lewat `rebase`, `amend`, atau edit manual) akan mengubah hash commit itu **dan semua commit setelahnya**. Inilah kenapa rewrite history di branch yang sudah di-push dan dipakai orang lain berbahaya — history "lama" dan "baru" jadi dua rangkaian hash yang berbeda total.

---

## Branch = Pointer, Bukan Copy

Ini konsep paling penting yang membedakan Git dari model VCS lama: **branch hanyalah file kecil berisi 1 SHA hash** — pointer yang menunjuk ke commit tertentu.

```
.git/refs/heads/main          → berisi teks: "a1b2c3d4..." (SHA commit terakhir)
.git/refs/heads/feature/login → berisi teks: "9f8e7d6c..." (SHA commit terakhir)

Visualisasi:

           main
            │
            ▼
  A ── B ── C
        \
         ▼
        feature/login
        (branch dari B, sudah maju ke commit sendiri)

  Membuat branch baru = HANYA menulis 1 file kecil baru
  berisi SHA commit saat ini. TIDAK copy file/folder apapun.
  Inilah kenapa "git branch" nyaris instan, walau project besar.
```

**Best practice:** Karena branch semurah ini, jangan ragu membuat branch baru untuk setiap task/fitur/bugfix — bahkan yang kecil sekalipun. Tidak ada cost signifikan untuk membuat banyak branch pendek-lived.

---

## HEAD — Penunjuk "Kamu Sedang di Mana"

`HEAD` adalah pointer khusus yang menunjukkan **branch mana (atau commit mana) yang sedang aktif** di working directory kamu.

```
Kondisi normal (attached HEAD):

  HEAD ──► main ──► commit C (a1b2c3d)

  HEAD tidak menunjuk langsung ke commit,
  tapi ke NAMA BRANCH ("main"), yang baru
  menunjuk ke commit. Kalau kamu commit lagi,
  "main" otomatis maju, HEAD ikut maju juga.
```

### Detached HEAD State

```
Kondisi detached HEAD (checkout langsung ke commit / tag):

  git checkout a1b2c3d     (checkout ke SHA commit langsung, bukan nama branch)

  main ──► commit D
                          HEAD ──► commit C   (a1b2c3d)
                                   (tidak ada nama branch yang menunjuk ke sini!)

  ⚠ Kalau kamu commit baru di kondisi ini, commit itu TIDAK
    tertaut ke branch manapun. Begitu kamu checkout ke branch
    lain, commit itu jadi "yatim" (orphan) dan berisiko
    hilang / di-garbage-collect oleh Git.
```

| Situasi | HEAD menunjuk ke | Aman commit? |
|---------|-------------------|----------------|
| Normal (di branch `main`/`feature/x`) | Nama branch → commit | ✅ Aman, branch ikut maju |
| Detached HEAD (checkout ke SHA/tag langsung) | Commit langsung | ⚠ Commit baru berisiko orphan |
| Setelah detached HEAD, mau simpan pekerjaan | — | Buat branch baru: `git checkout -b temp-branch` sebelum commit hilang |

**Catatan:** Detached HEAD bukan error — ini normal terjadi saat kamu ingin sekadar **melihat/menguji** kode versi lama (`git checkout <tag>` atau `git checkout <commit-sha>`) tanpa niat mengubah history. Kalau ternyata kamu ingin lanjut kerja dari titik itu, segera jalankan `git switch -c nama-branch-baru` supaya pekerjaanmu punya "pegangan" branch.

---

## Skenario: Full Lifecycle Satu Perubahan Kecil

Ikuti perjalanan lengkap satu baris kode dari edit sampai ter-push ke remote — memperlihatkan bagaimana keempat area kerja Git saling berinteraksi.

```
Step 0: Kondisi awal
  Working Dir : app.js (versi lama)
  Index       : kosong (sama dengan HEAD)
  HEAD        : commit C123 "fix: typo di header"
  Remote      : origin/main juga di commit C123 (sinkron)

Step 1: Edit file
  $ vim app.js   → tambah validasi input

  Working Dir : app.js (BERUBAH — belum tracked oleh staging)
  git status  → "Changes not staged for commit: app.js"

Step 2: Cek diff sebelum staging
  $ git diff app.js
  → menampilkan baris yang ditambah (+) dan dihapus (-)

Step 3: Staging
  $ git add app.js

  Index       : sekarang berisi snapshot app.js yang BARU
  git status  → "Changes to be committed: app.js"

Step 4: Commit
  $ git commit -m "feat: add input validation on login form"

  Local Repo  : commit baru C124 dibuat
                - tree menyimpan snapshot app.js baru
                - parent = C123
  HEAD        : main → C124 (branch "main" otomatis maju)
  Remote      : origin/main MASIH di C123 (belum tahu ada commit baru!)

Step 5: Cek status vs remote
  $ git status
  → "Your branch is ahead of 'origin/main' by 1 commit"

Step 6: Push ke remote
  $ git push origin main

  Remote      : origin/main sekarang JUGA di C124 — sinkron kembali
  Tim lain    : bisa `git pull` untuk dapat perubahan ini
```

```
Ringkasan pergerakan data:

  edit ──► Working Dir
             │ git add
             ▼
           Index (staging)
             │ git commit
             ▼
           Local Repo (HEAD maju, branch pointer maju)
             │ git push
             ▼
           Remote Repo (origin/main maju, tim lain bisa pull)
```

---

## Ringkasan Konsep

```
Git = Snapshot-based, distributed, content-addressable database

  Model data:
    Setiap commit = snapshot LENGKAP (bukan diff berurutan)
    Object types: commit, tree, blob, tag

  Three trees:
    HEAD (last commit) ←→ Index (staging) ←→ Working Directory

  Commit:
    SHA hash (identitas unik) + tree (snapshot) + parent (link history)
    + author/committer + message
    → ubah apapun di history = hash berubah, semua commit turunan ikut berubah

  Branch:
    HANYA pointer (1 file kecil berisi SHA) — bukan copy folder
    → murah dibuat, murah dihapus, murah pindah-pindah

  HEAD:
    Normal    → menunjuk NAMA BRANCH → branch menunjuk commit
    Detached  → menunjuk COMMIT langsung → ⚠ commit baru berisiko orphan

  Lifecycle 1 perubahan:
    edit → git add (Index) → git commit (Local Repo, HEAD maju)
    → git push (Remote Repo maju, tim lain bisa pull)
```

---

*Dokumen ini berdasarkan Git versi 2.4x dan platform hosting (GitHub/GitLab/Bitbucket) per 2026.*
