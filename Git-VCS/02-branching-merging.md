# Branching & Merging

Dokumentasi lengkap **branching dan merging** di Git — membuat/switch/hapus branch, tiga tipe merge (fast-forward, merge commit, three-way merge), rebase vs merge, resolusi merge conflict, cherry-pick, dan stash.

---

## Membuat, Switch, dan Menghapus Branch

```
Command dasar:

  git branch                        → list semua branch lokal
  git branch nama-branch             → BUAT branch baru (tidak pindah ke sana)
  git switch nama-branch             → PINDAH ke branch (Git 2.23+, recommended)
  git checkout nama-branch           → PINDAH ke branch (cara lama, masih valid)
  git switch -c nama-branch           → buat DAN pindah sekaligus (shortcut)
  git checkout -b nama-branch         → sama, cara lama
  git branch -d nama-branch           → hapus branch (aman, cegah kalau belum di-merge)
  git branch -D nama-branch           → hapus FORCE (walau belum di-merge) ⚠
  git push origin --delete nama-branch → hapus branch di REMOTE
```

```
Visualisasi: buat branch baru dari main

  Sebelum:                          Setelah "git switch -c feature/checkout":

  main                               main
   │                                  │
   A ── B ── C                        A ── B ── C
             ▲                                  ▲   ▲
            HEAD                                │   HEAD
                                                  │
                                          feature/checkout
                                          (pointer baru, sama posisi dgn main)

  Belum ada commit baru — feature/checkout dan main
  masih menunjuk ke commit yang SAMA (C).
  Begitu kamu commit di feature/checkout, baru dia maju sendiri.
```

**Best practice:** Beri nama branch yang deskriptif dan konsisten, misalnya `feature/nama-fitur`, `fix/nama-bug`, `hotfix/nama-urgent`, `chore/nama-task`. Ini memudahkan tim membaca daftar branch dan integrasi dengan tools CI/CD yang sering filter branch berdasarkan prefix.

---

## Fast-Forward Merge

Terjadi ketika branch target (misal `main`) **tidak punya commit baru sejak branch dibuat** — Git tinggal "menggeser" pointer `main` maju, tanpa perlu membuat commit gabungan.

```
Sebelum merge:

  main            A ── B ── C
                            │
  feature/x                └── D ── E
                                      ▲
                                     HEAD (di feature/x)

$ git switch main
$ git merge feature/x

Setelah fast-forward merge:

  main                       A ── B ── C ── D ── E
                                                  ▲
                                                 main, HEAD

  Tidak ada merge commit baru — "main" hanya digeser
  maju mengikuti feature/x, karena main tidak punya
  commit lain yang bercabang.
```

---

## Merge Commit (Three-Way Merge)

Terjadi ketika **kedua branch punya commit baru masing-masing** sejak titik pisah (divergent history) — Git membuat commit baru dengan **2 parent**.

```
Sebelum merge:

  main            A ── B ── C ── F ── G
                            │
  feature/x                └── D ── E
                                      ▲
                                     HEAD (di feature/x)

$ git switch main
$ git merge feature/x

Setelah three-way merge:

  main            A ── B ── C ── F ── G ────── M
                            │                 ╱
  feature/x                └── D ── E ───────
                                                ▲
                                          M = merge commit
                                          (parent: G DAN E)

  Git membandingkan 3 titik: common ancestor (C),
  ujung main (G), dan ujung feature/x (E) — makanya
  disebut "three-way merge". Kalau tidak ada baris
  yang saling tumpang tindih, hasil digabung otomatis.
```

| Tipe Merge | Kapan Terjadi | Hasil |
|------------|----------------|-------|
| **Fast-forward** | Branch target tidak punya commit baru sejak divergence | Pointer digeser, TIDAK ada merge commit baru |
| **Three-way merge (merge commit)** | Kedua branch punya commit baru masing-masing | Commit baru dengan 2 parent, history tetap menunjukkan percabangan |
| **Merge conflict** | Kedua branch mengubah baris yang sama di file yang sama | Merge terhenti, butuh resolusi manual |

**Catatan:** Untuk memaksa merge commit walau sebenarnya bisa fast-forward (supaya history tetap menunjukkan "di sini ada fitur X digabung"), gunakan `git merge --no-ff feature/x`. Banyak tim mewajibkan ini di branching strategy mereka agar history lebih mudah ditelusuri per fitur.

---

## Rebase vs Merge

Rebase adalah cara **alternatif** untuk menggabungkan perubahan — bukan dengan membuat merge commit, tapi dengan **memindahkan (replay) commit** dari satu branch ke ujung branch lain.

```
Sebelum:

  main            A ── B ── C ── F ── G
                            │
  feature/x                └── D ── E

$ git switch feature/x
$ git rebase main

Setelah rebase:

  main            A ── B ── C ── F ── G
                                        │
  feature/x                            └── D' ── E'
                                                    ▲
                                                   HEAD

  D dan E di-REPLAY di atas G, menghasilkan commit BARU
  D' dan E' (SHA berbeda dari D dan E — karena parent-nya
  beda). History jadi LINEAR, seolah feature/x memang
  dibuat setelah G, bukan dari C.
```

| Aspek | Merge | Rebase |
|-------|-------|--------|
| **History** | Non-linear, menunjukkan percabangan asli (merge commit) | Linear, seolah commit dibuat berurutan |
| **Commit asli** | Tetap (SHA tidak berubah) | Ditulis ulang (SHA baru untuk setiap commit yang di-rebase) |
| **Aman di branch shared?** | ✅ Ya, selalu aman | ❌ Berbahaya kalau branch sudah di-push & dipakai orang lain |
| **Konflik** | Diselesaikan sekali di merge commit | Bisa muncul berulang, per commit yang di-replay |
| **Kapan dipakai** | Menggabungkan feature branch ke main/develop | Merapikan history LOKAL sebelum push, atau update feature branch dari main |
| **Command** | `git merge feature/x` | `git rebase main` |

**Penting:** Jangan pernah rebase branch yang **sudah di-push dan sedang dipakai orang lain** tanpa koordinasi — karena rebase menulis ulang SHA setiap commit, siapapun yang sudah pull versi lama akan punya history yang "bercabang palsu" dengan versi barumu. Aturan umum: *"never rebase what has been pushed and shared — rebase freely what is still local."*

```
Golden rule rebase:

  Local branch, belum di-push          → aman rebase, aman force-push
  Feature branch pribadi, sudah push    → OK rebase + `git push --force-with-lease`
                                            (asal kamu satu-satunya yang pakai branch itu)
  Shared branch (main/develop, dipakai
  banyak orang)                         → ❌ JANGAN rebase, JANGAN force-push
```

---

## Skenario: Resolusi Merge Conflict

Dua developer mengubah baris yang sama di file `config.js` pada branch berbeda.

```
Kondisi:

  main:          function getPort() { return 3000; }
  feature/port:  function getPort() { return process.env.PORT || 8080; }

  Alice (di main) sudah commit dan push duluan.
  Bob (di feature/port) mau merge feature/port ke main.
```

**Step 1 — Bob mencoba merge:**

```bash
$ git switch main
$ git pull origin main
$ git merge feature/port

Auto-merging config.js
CONFLICT (content): Merge conflict in config.js
Automatic merge failed; fix conflicts and then commit the result.
```

**Step 2 — Bob membuka `config.js`, Git menandai area konflik:**

```
<<<<<<< HEAD
function getPort() { return 3000; }
=======
function getPort() { return process.env.PORT || 8080; }
>>>>>>> feature/port
```

| Marker | Arti |
|--------|------|
| `<<<<<<< HEAD` | Awal versi dari branch yang SEDANG kamu tempati (di sini: `main`) |
| `=======` | Pemisah antara dua versi yang konflik |
| `>>>>>>> feature/port` | Akhir versi dari branch yang SEDANG di-merge masuk |

**Step 3 — Bob memutuskan versi final (gabungkan logikanya), lalu hapus semua marker:**

```javascript
function getPort() { return process.env.PORT || 8080; }
```

**Step 4 — Tandai selesai, commit hasil merge:**

```bash
$ git add config.js
$ git status
# "All conflicts fixed but you are still merging."

$ git commit -m "merge: resolve port config conflict with feature/port"
$ git push origin main
```

```
Hasil akhir di history:

  main    A ── B(Alice) ── ────────── M (merge commit, resolve conflict)
                              │       ╱
  feature/port                └── C(Bob)

  M berisi hasil final config.js yang sudah digabung manual.
```

**Best practice:** Kalau konflik terjadi saat `git merge` dan kamu ingin membatalkan semuanya untuk mulai ulang, jalankan `git merge --abort` — ini mengembalikan working directory ke kondisi sebelum merge dimulai, tanpa kehilangan apapun.

---

## Cherry-Pick

Cherry-pick mengambil **satu commit spesifik** dari branch lain dan menerapkannya (replay) di branch saat ini — tanpa membawa seluruh history branch tersebut.

```
Sebelum:

  main            A ── B ── C
                            │
  feature/x                └── D ── E ── F
                                    ▲
                                (hanya E yang mau diambil,
                                 misal E = hotfix penting)

$ git switch main
$ git cherry-pick <SHA-commit-E>

Setelah:

  main            A ── B ── C ── E'
                                  ▲
                            (copy dari E, SHA baru,
                             D dan F TIDAK ikut terbawa)
```

```bash
git cherry-pick abc1234              # ambil 1 commit
git cherry-pick abc1234 def5678      # ambil beberapa commit sekaligus
git cherry-pick abc1234 --no-commit  # apply perubahan tanpa auto-commit (review dulu)
```

**Catatan:** Cherry-pick sering dipakai untuk membawa **hotfix** dari branch `main`/`hotfix` ke branch `release` yang sedang berjalan paralel, tanpa harus merge seluruh history antara kedua branch tersebut.

---

## Stash — Simpan Perubahan Sementara

Stash menyimpan perubahan yang **belum di-commit** ke "rak sementara", mengembalikan working directory ke kondisi bersih (sesuai HEAD), supaya kamu bisa switch branch atau pull tanpa kehilangan pekerjaan yang belum selesai.

```
Skenario: sedang kerja di feature/x, tiba-tiba disuruh fix bug urgent di main

  Working Dir : ada perubahan belum commit di feature/x
                        │
                        │  git stash
                        ▼
  Stash       : perubahan tersimpan di "stash@{0}"
  Working Dir : bersih (sama dengan HEAD feature/x)
                        │
                        │  git switch main → fix bug → commit → push
                        │
                        │  git switch feature/x
                        │  git stash pop
                        ▼
  Working Dir : perubahan yang tadi disimpan MUNCUL KEMBALI
                stash terhapus dari daftar (karena "pop")
```

```bash
git stash                       # simpan semua perubahan tracked (staged + unstaged)
git stash -u                    # ikut simpan untracked files juga
git stash list                  # lihat semua stash yang tersimpan
git stash pop                   # ambil stash terbaru & hapus dari daftar
git stash apply                 # ambil stash terbaru TANPA hapus dari daftar
git stash apply stash@{2}       # ambil stash spesifik (bukan yang terbaru)
git stash drop stash@{0}        # hapus 1 stash tanpa apply
git stash clear                 # hapus SEMUA stash ⚠
```

**Penting:** `git stash pop` bisa gagal dengan conflict kalau kondisi working directory sudah berubah sejak stash dibuat (misal karena kamu pull commit baru). Kalau ini terjadi, stash TIDAK dihapus dari daftar sampai konflik diselesaikan — jadi tidak ada risiko kehilangan data, tapi kamu harus resolve manual seperti merge conflict biasa.

---

## Ringkasan Konsep

```
Branch operations:
  git branch NAME        → buat (tanpa pindah)
  git switch -c NAME      → buat + pindah
  git branch -d/-D NAME   → hapus (aman / force)

Merge types:
  Fast-forward     → tidak ada commit baru sejak divergence, pointer digeser
  Merge commit     → kedua branch punya commit baru, 2-parent commit dibuat
  Conflict         → baris sama diubah di kedua branch, butuh resolusi manual

Merge vs Rebase:
  Merge   → history non-linear, commit asli tidak berubah, AMAN di shared branch
  Rebase  → history linear, SHA ditulis ulang, HANYA aman di branch lokal/pribadi

Resolusi conflict:
  <<<<<<< HEAD (versi kamu) ======= (versi lain) >>>>>>> branch-lain
  → edit manual → hapus marker → git add → git commit

Cherry-pick:
  Ambil 1 commit spesifik dari branch lain, replay di branch sekarang
  (tanpa membawa seluruh history branch asal)

Stash:
  Simpan perubahan belum-commit sementara → working dir bersih
  → stash pop/apply untuk mengembalikan
```

---

*Dokumen ini berdasarkan Git versi 2.4x dan platform hosting (GitHub/GitLab/Bitbucket) per 2026.*
