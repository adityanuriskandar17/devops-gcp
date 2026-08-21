# Commands Cheatsheet

Kumpulan command Git yang paling sering dipakai, dikelompokkan per kategori. Setiap aksi ditunjukkan singkat lalu dilengkapi contoh nyata.

---

## Setup & Config

| Aksi | Cara |
|------|------|
| Set nama global | `git config --global user.name "Nama Kamu"` |
| Set email global | `git config --global user.email "kamu@example.com"` |
| Set default editor | `git config --global core.editor "vim"` |
| Set default branch name | `git config --global init.defaultBranch main` |
| Lihat semua config | `git config --list` |
| Lihat 1 config spesifik | `git config user.email` |
| Config per-repo (override global) | Jalankan tanpa `--global` di dalam folder repo |
| Setup alias | `git config --global alias.co checkout` |

```bash
git config --global user.name "Aditya"
git config --global user.email "aditya@ftlgym.com"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"

# Alias umum yang mempercepat kerja harian
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm "commit -m"
git config --global alias.lg "log --oneline --graph --decorate --all"
```

---

## Basic Snapshot Commands (add / commit / status / diff)

| Aksi | Cara |
|------|------|
| Cek status working directory | `git status` |
| Stage 1 file | `git add nama-file` |
| Stage semua file berubah | `git add .` |
| Stage sebagian isi file (interactive) | `git add -p nama-file` |
| Unstage file (batal stage) | `git restore --staged nama-file` |
| Commit dengan pesan | `git commit -m "pesan commit"` |
| Commit + edit pesan sebelumnya | `git commit --amend` |
| Lihat diff belum staged | `git diff` |
| Lihat diff yang sudah staged | `git diff --staged` |
| Diff antar 2 commit | `git diff SHA1 SHA2` |
| Hapus file dari tracking + disk | `git rm nama-file` |
| Rename/move file (tracked) | `git mv old-name new-name` |

```bash
git status
git add app.js src/utils.js
git add .
git status --short          # output ringkas: M/A/D/?? per file

git diff                    # perubahan working dir vs staging
git diff --staged           # perubahan staging vs commit terakhir

git commit -m "feat: add pagination to product list"
git commit --amend -m "feat: add pagination to product list (fixed typo)"
git commit --amend --no-edit    # tambah file ke commit terakhir tanpa ubah pesan

git rm old-config.json
git mv config.js config.mjs
```

**Catatan:** `git commit --amend` mengubah commit **terakhir** — kalau commit itu sudah di-push dan dipakai orang lain, amend akan mengubah SHA dan butuh `push --force-with-lease`. Aman dipakai kalau commit masih lokal atau di branch pribadi.

---

## Branching & Merging

| Aksi | Cara |
|------|------|
| List branch lokal | `git branch` |
| List branch + remote | `git branch -a` |
| Buat branch baru | `git branch nama-branch` |
| Pindah branch | `git switch nama-branch` |
| Buat + pindah sekaligus | `git switch -c nama-branch` |
| Hapus branch (aman) | `git branch -d nama-branch` |
| Hapus branch (force) | `git branch -D nama-branch` |
| Merge branch lain ke branch aktif | `git merge nama-branch` |
| Merge tanpa fast-forward | `git merge --no-ff nama-branch` |
| Batalkan merge yang konflik | `git merge --abort` |
| Rebase branch aktif ke branch lain | `git rebase nama-branch` |
| Lanjut rebase setelah resolve conflict | `git rebase --continue` |
| Batalkan rebase | `git rebase --abort` |
| Cherry-pick 1 commit | `git cherry-pick SHA` |
| Simpan perubahan sementara | `git stash` |
| Kembalikan stash terbaru | `git stash pop` |

```bash
git branch feature/checkout
git switch feature/checkout
git switch -c fix/login-bug

git switch main
git merge feature/checkout --no-ff -m "merge: add checkout feature"

git switch feature/x
git rebase main
# kalau conflict:
#   edit file konflik → git add file → git rebase --continue

git cherry-pick a1b2c3d

git stash
git stash list
git stash pop
```

---

## Remote Operations

| Aksi | Cara |
|------|------|
| Clone repo | `git clone URL` |
| Lihat remote yang terhubung | `git remote -v` |
| Tambah remote | `git remote add nama URL` |
| Ambil update tanpa merge | `git fetch origin` |
| Ambil update + merge otomatis | `git pull origin main` |
| Ambil update + rebase (bukan merge) | `git pull --rebase origin main` |
| Push branch ke remote | `git push origin nama-branch` |
| Push + set upstream tracking | `git push -u origin nama-branch` |
| Push force (⚠ hati-hati) | `git push --force-with-lease` |
| Hapus branch di remote | `git push origin --delete nama-branch` |
| Lihat branch remote yang di-track | `git branch -vv` |

```bash
git clone https://github.com/org/repo.git
cd repo

git remote -v
git remote add upstream https://github.com/original/repo.git

git fetch origin
git pull origin main
git pull --rebase origin main

git push -u origin feature/checkout   # pertama kali (set tracking)
git push                              # selanjutnya, cukup ini

git push --force-with-lease           # lebih aman dari --force biasa,
                                       # gagal kalau ada commit baru dari
                                       # orang lain yang belum kamu fetch

git push origin --delete feature/checkout
```

**Penting:** Gunakan `--force-with-lease`, BUKAN `--force` polos. `--force-with-lease` menolak push kalau remote branch sudah berubah sejak terakhir kamu fetch (mencegah menimpa commit orang lain tanpa sadar). `--force` polos akan menimpa apapun tanpa pengecekan ini.

---

## Undo & Recovery (reset / revert / checkout / restore / reflog)

| Aksi | Cara |
|------|------|
| Buang perubahan di 1 file (belum staged) | `git restore nama-file` |
| Unstage 1 file | `git restore --staged nama-file` |
| Reset ke commit tertentu, KEEP perubahan di working dir | `git reset --soft SHA` |
| Reset ke commit tertentu, KEEP perubahan tapi unstaged | `git reset --mixed SHA` (default) |
| Reset ke commit tertentu, BUANG semua perubahan ⚠ | `git reset --hard SHA` |
| Buat commit baru yang membalikkan 1 commit (aman untuk shared branch) | `git revert SHA` |
| Lihat history semua pergerakan HEAD (termasuk yang "hilang") | `git reflog` |
| Checkout ke commit lama (lihat isi, detached HEAD) | `git checkout SHA` |

```bash
# Buang perubahan di working directory (belum di-stage)
git restore app.js

# Unstage file (perubahan tetap ada di working dir)
git restore --staged app.js

# Reset soft: pindahkan HEAD, TAPI staging & working dir tetap ada
git reset --soft HEAD~1        # "batalkan" commit terakhir, siap commit ulang

# Reset mixed (default): pindahkan HEAD + unstage, working dir tetap ada
git reset HEAD~1

# Reset hard: BUANG SEMUA perubahan sejak SHA target ⚠ DESTRUCTIVE
git reset --hard HEAD~1

# Revert: cara AMAN membalikkan commit yang SUDAH di-push (tidak menulis ulang history)
git revert a1b2c3d
git revert a1b2c3d --no-edit
```

### Skenario Recovery: "Saya accidentally hard reset / force push dan commit saya hilang!"

```
Kondisi: Bob tidak sengaja jalankan
  $ git reset --hard HEAD~3
lalu sadar 3 commit terakhirnya "hilang".

Kabar baik: commit itu TIDAK benar-benar hilang selama belum
di-garbage-collect (biasanya aman selama ~30-90 hari default Git).
git reflog mencatat SETIAP pergerakan HEAD, termasuk sebelum reset.
```

```bash
# Step 1: Lihat reflog — history pergerakan HEAD, bukan history commit biasa
$ git reflog

a1b2c3d HEAD@{0}: reset: moving to HEAD~3
d4e5f6g HEAD@{1}: commit: fix: handle edge case in payment
h7i8j9k HEAD@{2}: commit: test: add payment edge case test
l0m1n2o HEAD@{3}: commit: feat: add payment retry logic
p3q4r5s HEAD@{4}: commit: chore: initial setup
              ▲
    commit "d4e5f6g" ini yang mau Bob kembalikan — SHA-nya
    masih ada di reflog walau sudah "hilang" dari git log biasa

# Step 2: Buat branch baru menunjuk ke commit sebelum reset (paling aman)
$ git branch recovery-branch d4e5f6g
$ git switch recovery-branch
# → semua 3 commit yang "hilang" ada lagi di branch ini

# ATAU langsung reset branch semula ke titik itu:
$ git switch main
$ git reset --hard d4e5f6g

# Step 3 (kalau kejadiannya SUDAH di-push dan minta rekan tim jangan panik):
# Kalau kamu sudah `push --force` yang menghapus commit rekan tim,
# reflog KAMU tidak akan menyimpan commit MEREKA yang belum pernah
# masuk local repo kamu. Cek dulu apakah rekan tim masih punya commit
# itu di local repo/reflog mereka sebelum menyimpulkan hilang permanen.
$ git push --force-with-lease origin main
```

**Penting:** `git reflog` hanya menyimpan history **lokal** — kalau kamu clone ulang repo dari remote setelah kejadian force-push yang salah, reflog kamu yang lama ikut hilang. Selalu cek reflog di machine yang sama tempat reset/force-push terjadi, secepat mungkin setelah insiden.

---

## Inspecting History (log / blame / show)

| Aksi | Cara |
|------|------|
| Lihat history commit | `git log` |
| Lihat history ringkas 1 baris per commit | `git log --oneline` |
| Lihat history + graph branch | `git log --oneline --graph --decorate --all` |
| Lihat history 1 file spesifik | `git log -- nama-file` |
| Lihat siapa mengubah baris apa (per baris) | `git blame nama-file` |
| Lihat isi 1 commit spesifik | `git show SHA` |
| Cari commit yang mengandung kata tertentu di message | `git log --grep="kata-kunci"` |
| Cari commit yang mengubah suatu string di kode | `git log -S"nama_function"` |
| Lihat siapa contributor + jumlah commit | `git shortlog -sn` |

```bash
git log
git log --oneline
git log --oneline --graph --decorate --all
git log -5                          # 5 commit terakhir saja
git log --author="Aditya"
git log --since="2 weeks ago"
git log -- src/payment.js           # history khusus 1 file

git blame src/payment.js
git blame -L 10,20 src/payment.js   # hanya baris 10-20

git show a1b2c3d                    # isi lengkap 1 commit (diff + metadata)
git show a1b2c3d --stat             # ringkas: file apa saja yang berubah

git log --grep="fix: payment"
git log -S"calculateDiscount"       # cari commit yang tambah/hapus string ini

git shortlog -sn                    # ranking contributor by jumlah commit
```

---

*Dokumen ini berdasarkan Git versi 2.4x dan platform hosting (GitHub/GitLab/Bitbucket) per 2026.*
