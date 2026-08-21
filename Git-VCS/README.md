# Git & Version Control

Dokumentasi lengkap **Git** dan **version control** — sistem untuk melacak perubahan kode, berkolaborasi dalam tim, dan mengelola history project dari waktu ke waktu. Berbeda dengan folder GCP lainnya, topik ini **cloud-agnostic** — berlaku di semua platform (GitHub, GitLab, Bitbucket, atau self-hosted).

---

## Apa itu Version Control?

Version control (VCS) adalah sistem yang **mencatat setiap perubahan** pada file dari waktu ke waktu, sehingga kamu bisa:

```
Tanpa Version Control:               Dengan Version Control:

  app.js                               app.js  ──commit──► v1
  app_v2.js                                    ──commit──► v2
  app_v2_final.js                              ──commit──► v3
  app_v2_final_FIX.js                          ──commit──► v4 (bisa rollback ke v1/v2/v3)
  app_v2_final_FIX_REAL.js
                                        + tahu SIAPA yang ubah APA dan KAPAN
  ❌ Tidak jelas versi mana yang jalan  + bisa kerja paralel tanpa saling timpa file
  ❌ Tidak ada history perubahan        + bisa gabungkan (merge) perubahan dari banyak orang
  ❌ Sulit kolaborasi tim               ✅ Semua tercatat, semua bisa di-revert
```

**Penting:** Version control bukan hanya soal "backup". Intinya adalah **history yang bisa diaudit** dan **kolaborasi tanpa saling menimpa (overwrite)** pekerjaan orang lain.

---

## Kenapa Git yang Menang?

Sebelum Git ada, VCS populer seperti **CVS** dan **Subversion (SVN)** bekerja secara **centralized** — hanya ada satu "server of truth", dan setiap operasi (commit, lihat history, diff) butuh koneksi ke server itu.

```
Centralized VCS (SVN/CVS):                 Distributed VCS (Git):

     ┌──────────────┐                      ┌──────────────┐
     │   Central     │                      │   Remote      │
     │   Server      │                      │   Repo        │ (GitHub/GitLab)
     │  (source of   │                      │  (backup/     │
     │   truth)      │                      │   sync point) │
     └───┬───┬───┬───┘                      └───┬───┬───┬───┘
         │   │   │                              │   │   │
     ┌───▼┐┌─▼──┐┌▼───┐                     ┌───▼┐┌─▼──┐┌▼───┐
     │Dev1││Dev2││Dev3│                     │Dev1││Dev2││Dev3│
     │(no │└────┘└────┘                     │FULL││FULL││FULL│
     │full│                                  │repo││repo││repo│
     │hist│                                  │+   ││+   ││+   │
     │ory)│                                  │hist││hist││hist│
     └────┘                                  └────┘└────┘└────┘

  Setiap operasi butuh server               Setiap dev punya COPY LENGKAP
  Server down = tidak bisa kerja             history — commit, branch, diff,
  Butuh koneksi terus                        log semua jalan OFFLINE
```

| Faktor | Centralized (SVN/CVS) | Git (Distributed) |
|--------|------------------------|--------------------|
| **Lokasi history** | Hanya di server | Full copy di setiap clone |
| **Kerja offline** | Terbatas/tidak bisa | Bisa penuh (commit, branch, log offline) |
| **Branching** | Berat, mahal (copy semua file) | Ringan — hanya pointer 40-karakter |
| **Speed** | Bergantung network ke server | Operasi lokal = instan |
| **Single point of failure** | Ya — server down = stuck | Tidak — setiap clone adalah backup penuh |
| **Model data** | Delta (menyimpan diff antar versi) | Snapshot (menyimpan state lengkap tiap commit) |

**Best practice:** Karena setiap developer punya full history di local repo mereka, Git pada dasarnya membuat setiap clone menjadi **backup lengkap** dari seluruh project — ini salah satu alasan Git jadi standar industri sejak diciptakan Linus Torvalds tahun 2005 untuk pengembangan Linux kernel.

---

## Empat Area Kerja Git

Ini konsep paling fundamental yang harus dipahami sebelum masuk ke command apapun:

```
┌─────────────────┐   git add    ┌─────────────────┐   git commit   ┌─────────────────┐
│  Working          │ ──────────►  │  Staging Area    │ ─────────────►  │  Local Repo       │
│  Directory        │              │  (Index)          │                  │  (.git — HEAD)    │
│                   │              │                    │                  │                   │
│  File yang kamu    │              │  File yang sudah   │                  │  History commit    │
│  edit di editor    │◄────────────  │  ditandai untuk    │                  │  tersimpan          │
│  (belum tracked)   │  git restore  │  dimasukkan ke     │                  │  permanen di        │
│                   │  / checkout   │  commit berikutnya │                  │  local machine       │
└─────────────────┘              └─────────────────┘                  └─────────┬─────────┘
                                                                                  │
                                                                          git push │ git pull/fetch
                                                                                  │
                                                                        ┌─────────▼─────────┐
                                                                        │  Remote Repo        │
                                                                        │  (GitHub/GitLab/    │
                                                                        │   Bitbucket)        │
                                                                        │                     │
                                                                        │  Tempat sharing dgn  │
                                                                        │  tim, backup, CI/CD  │
                                                                        └─────────────────────┘
```

| Area | Fungsi | Command Terkait |
|------|--------|------------------|
| **Working Directory** | File asli di disk yang kamu edit | `git status`, `git diff` |
| **Staging Area (Index)** | "Ruang tunggu" sebelum commit — kamu pilih file mana yang masuk commit ini | `git add` |
| **Local Repository** | Database `.git/` — menyimpan semua commit, branch, tag secara lokal | `git commit`, `git log` |
| **Remote Repository** | Copy repo di server (GitHub/GitLab/Bitbucket) untuk kolaborasi | `git push`, `git pull`, `git fetch` |

---

## Daftar Dokumentasi

| # | File | Isi |
|---|------|-----|
| 01 | [Konsep & Cara Kerja](01-concepts.md) | Snapshot model, three-tree architecture, anatomy commit, branch sebagai pointer, HEAD, detached HEAD |
| 02 | [Branching & Merging](02-branching-merging.md) | Create/switch/delete branch, fast-forward vs merge commit vs three-way merge, rebase vs merge, resolve conflict, cherry-pick, stash |
| 03 | [Remote & Collaboration](03-remote-collaboration.md) | Remote (origin/upstream), clone/fetch/pull, PR/MR workflow, fork vs shared-repo model, perbandingan GitHub/GitLab/Bitbucket, protected branch |
| 04 | [Commands Cheatsheet](04-commands-cheatsheet.md) | Setup, snapshot commands, branching, remote ops, undo & recovery (reset/revert/reflog), inspecting history |
| 05 | [Best Practices](05-best-practices.md) | Commit message convention, .gitignore, branching strategy (Git Flow/GitHub Flow/Trunk-Based), signed commit, secret handling, checklist |

---

## Quick Start

```
1. Install Git
   → https://git-scm.com/downloads (atau: apt install git / brew install git)

2. Konfigurasi identitas (sekali saja per machine)
   git config --global user.name "Nama Kamu"
   git config --global user.email "kamu@example.com"

3. Inisialisasi repo baru (project baru)
   cd my-project
   git init

   ATAU clone repo yang sudah ada
   git clone https://github.com/org/repo.git

4. Buat perubahan → cek status → stage → commit
   git status
   git add file.txt          # atau: git add .
   git commit -m "feat: add initial setup"

5. Hubungkan ke remote (kalau belum, untuk repo baru dari git init)
   git remote add origin https://github.com/org/repo.git

6. Push ke remote
   git push -u origin main
```

```bash
# Full flow dari nol untuk project baru
mkdir my-app && cd my-app
git init
echo "# My App" > README.md
git add README.md
git commit -m "chore: initial commit"
git branch -M main
git remote add origin https://github.com/username/my-app.git
git push -u origin main
```

**Catatan:** Setelah `push -u` pertama kali, `origin` dan `main` sudah "diingat" sebagai upstream default — untuk push/pull selanjutnya cukup `git push` dan `git pull` tanpa parameter tambahan.

---

*Dokumen ini berdasarkan Git versi 2.4x dan platform hosting (GitHub/GitLab/Bitbucket) per 2026.*
