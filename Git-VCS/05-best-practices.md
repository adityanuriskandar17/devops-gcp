# Best Practices

Panduan dan rekomendasi untuk penggunaan Git dan version control secara aman dan konsisten di tim — commit message, `.gitignore`, branching strategy, signed commit, protected branch, penanganan secret, dan checklist production-readiness.

---

## 1. Commit Message Convention

Commit message yang konsisten memudahkan tim membaca history, dan bisa dipakai otomatis untuk generate changelog atau menentukan version bump (semantic versioning).

### Conventional Commits Format

```
<type>(<scope opsional>): <deskripsi singkat>

<body opsional — jelaskan KENAPA, bukan APA>

<footer opsional — breaking change, referensi issue>
```

| Type | Kapan Dipakai | Contoh |
|------|-----------------|--------|
| **feat** | Menambah fitur baru | `feat(auth): add OAuth2 login` |
| **fix** | Memperbaiki bug | `fix(payment): handle null response from gateway` |
| **docs** | Perubahan dokumentasi saja | `docs: update README installation steps` |
| **style** | Perubahan format/style kode, tidak ubah logic | `style: fix indentation in utils.js` |
| **refactor** | Ubah struktur kode tanpa ubah behavior | `refactor(cart): extract discount logic to separate function` |
| **perf** | Perubahan yang meningkatkan performance | `perf(query): add index to speed up product search` |
| **test** | Menambah/ubah test | `test(auth): add unit test for token expiry` |
| **chore** | Maintenance, tooling, dependency, tidak menyentuh source app | `chore: bump eslint to v9` |
| **ci** | Perubahan konfigurasi CI/CD | `ci: add cache step to github actions workflow` |
| **build** | Perubahan build system/dependency | `build: update webpack config for code splitting` |
| **revert** | Membalikkan commit sebelumnya | `revert: revert "feat(auth): add OAuth2 login"` |

```bash
git commit -m "feat(cart): add quantity selector"
git commit -m "fix(api): correct status code for validation error"

# Dengan body & footer (buka editor, jangan pakai -m untuk multi-line)
git commit
```
```
fix(payment): prevent double charge on network retry

Sebelumnya, kalau request timeout dan client retry otomatis,
gateway bisa menerima 2 request charge untuk transaksi yang sama.
Fix ini menambahkan idempotency key per transaction ID.

Fixes #482
```

**Best practice:** Breaking change ditandai dengan `!` setelah type/scope, misalnya `feat(api)!: change response format to camelCase` — banyak tool otomatis (semantic-release) mendeteksi tanda ini untuk menentukan major version bump.

---

## 2. .gitignore Patterns

`.gitignore` mencegah file tertentu ikut tracked oleh Git — penting untuk file yang sifatnya lokal, hasil build, atau sensitif.

```
# Dependencies
node_modules/
vendor/
venv/
__pycache__/

# Environment & secrets
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json

# Build output
dist/
build/
*.log
coverage/

# OS & editor files
.DS_Store
Thumbs.db
.vscode/
.idea/
*.swp

# Dependency lock TIDAK di-ignore biasanya (package-lock.json, yarn.lock)
# — justru HARUS di-commit supaya versi dependency konsisten antar developer
```

| Pattern | Arti |
|---------|------|
| `node_modules/` | Ignore folder ini di level manapun |
| `*.log` | Ignore semua file berakhiran `.log` |
| `/build` | Ignore folder `build` HANYA di root repo (leading `/`) |
| `!important.log` | Exception — JANGAN ignore file ini walau pattern lain match |
| `**/temp` | Ignore folder `temp` di kedalaman folder manapun |

```bash
# File sudah accidentally tracked SEBELUM ditambahkan ke .gitignore?
# .gitignore TIDAK berlaku retroaktif ke file yang sudah tracked
git rm --cached .env          # hapus dari tracking, file tetap ada di disk
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: stop tracking .env file"
```

**Catatan:** Gunakan template `.gitignore` standar per bahasa/framework dari [github.com/github/gitignore](https://github.com/github/gitignore) sebagai titik awal, lalu tambahkan pattern spesifik project.

---

## 3. Branching Strategy

| Strategi | Konsep | Kapan Dipakai | Kekurangan |
|----------|--------|------------------|--------------|
| **Git Flow** | Branch permanen `main` + `develop`, plus branch sementara `feature/*`, `release/*`, `hotfix/*` | Project dengan release terjadwal/versioned (misal software desktop, mobile app dengan rilis App Store) | Overhead tinggi, banyak branch, merge kompleks — kurang cocok untuk deploy super sering |
| **GitHub Flow** | Hanya `main` + short-lived `feature branch` → PR → merge → deploy langsung | Web app / SaaS dengan continuous deployment, tim kecil-menengah | Kurang cocok kalau butuh maintain banyak versi rilis paralel |
| **Trunk-Based Development** | Semua developer commit ke `main` (trunk) sangat sering, branch hidup <1 hari, pakai feature flag untuk fitur belum siap | Tim besar, CI/CD matang, deployment frequency tinggi (deploy berkali-kali sehari) | Butuh disiplin tinggi + test coverage kuat + feature flag infrastructure |

```
Git Flow:

  main      ──●──────────────●──────────── (hanya rilis stable)
               \             /
  release/1.2   ●───●───●───●
               /
  develop   ──●──●──●──●──●──●──────────── (integrasi terus-menerus)
              │      \        │
  feature/x   ●──●────●      │
                     feature/y●──●

GitHub Flow:

  main      ──●────●────●────●────●──────── (selalu deployable)
               \    │\   │\   │
  feature/a     ●──●│ │  │ │  │
                     \│  │ │  │
  feature/b            ●─●│  │
                            \│
  feature/c                  ●──●

Trunk-Based Development:

  main      ──●─●─●─●─●─●─●─●─●─●─●─●────── (commit langsung, sangat sering)
              │ │   │     │   │
              (branch hidup HANYA beberapa jam, feature flag
               menyembunyikan fitur yang belum siap dari user)
```

**Best practice:** Untuk kebanyakan tim startup/SaaS modern, **GitHub Flow** adalah titik awal paling masuk akal — sederhana, cocok dengan CI/CD, dan tidak over-engineered. Naik ke **Trunk-Based** kalau tim sudah punya test automation kuat dan ingin deploy lebih sering. **Git Flow** baru relevan kalau memang harus maintain banyak versi rilis paralel (misal library/SDK dengan support versi lama).

---

## 4. Signed Commits

Signed commit membuktikan secara kriptografis bahwa commit benar-benar dibuat oleh pemilik key tertentu — mencegah orang lain membuat commit yang "menyamar" sebagai orang lain (nama/email di commit bisa dipalsukan dengan mudah tanpa signing).

```bash
# Setup GPG key (sekali)
gpg --full-generate-key
gpg --list-secret-keys --keyid-format=long

# Beritahu Git key mana yang dipakai
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true      # auto-sign SEMUA commit

# Commit dengan sign manual (kalau tidak set auto)
git commit -S -m "feat: add signed commit example"

# Verifikasi signature di log
git log --show-signature -1
```

```
Hasil di GitHub/GitLab UI:

  a1b2c3d  feat: add signed commit example   ✅ Verified
  d4e5f6g  fix: typo in readme                 Unverified   ⚠
```

**Catatan:** Selain GPG, Git juga mendukung signing dengan **SSH key** (`git config gpg.format ssh`) sejak Git 2.34 — lebih praktis kalau kamu sudah punya SSH key untuk akses repo, tidak perlu setup GPG terpisah.

---

## 5. Menghindari Commit Secret (dan Cara Recovery)

**Penting:** Sekali secret (API key, password, private key) masuk ke dalam history Git, secret itu **tetap ada di history** walau file-nya sudah dihapus di commit berikutnya — siapapun yang clone repo bisa menemukannya lewat `git log` atau `git show`.

### Pencegahan

| Practice | Cara |
|----------|------|
| `.gitignore` untuk file secret | Masukkan `.env`, `*.pem`, `credentials.json` sejak awal project |
| Pre-commit hook scan secret | Pakai tool seperti `gitleaks` atau `git-secrets` di pre-commit hook |
| Environment variable, bukan hardcode | Simpan secret di secret manager (Vault, GCP Secret Manager, dll), bukan di kode |
| Review sebelum push | `git diff --staged` sebelum commit, cek tidak ada key/token menempel |
| Template `.env.example` | Commit file contoh TANPA value asli, supaya tim tahu variable apa yang dibutuhkan |

```bash
# Scan repo untuk secret yang mungkin ke-commit (contoh: gitleaks)
gitleaks detect --source . --verbose
```

### Kalau Sudah Ke-Commit dan Ke-Push

```
Step 1: ANGGAP SECRET SUDAH BOCOR — rotate/revoke SEGERA
        (ganti API key, reset password, revoke token di provider terkait)
        Menghapus dari history TIDAK cukup kalau sudah pernah di-push,
        karena siapapun yang sudah clone/fetch bisa punya copy-nya.

Step 2: Hapus dari history (setelah rotate)
```

```bash
# Untuk 1 file di SEMUA history (tool: git filter-repo, lebih modern dari filter-branch)
git filter-repo --path config/secret.json --invert-paths

# Alternatif tanpa install tool tambahan (lebih lambat, repo besar bisa berat):
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch config/secret.json" \
  --prune-empty --tag-name-filter cat -- --all

# Setelah history dibersihkan, force-push (WAJIB koordinasi dengan tim!)
git push origin --force --all
git push origin --force --tags
```

```
Step 3: Beritahu tim
  Semua orang harus re-clone atau reset hard ke history baru —
  history lama di local mereka masih punya secret itu tersimpan.

Step 4: Cegah terulang
  Tambahkan file itu ke .gitignore
  Tambahkan pre-commit hook scanning (gitleaks/git-secrets)
```

**Penting:** Rotate/revoke credential SELALU lebih penting dan lebih mendesak daripada membersihkan history. History bisa dibersihkan belakangan; credential yang sudah bocor harus dianggap **compromised** sejak detik itu.

---

## 6. Protected Branch Rules (Ringkasan)

| Rule | Rekomendasi Minimum untuk `main`/`production` |
|------|--------------------------------------------------|
| Require PR/MR sebelum merge | ✅ Wajib |
| Require minimal 1 approval | ✅ Wajib (2+ untuk repo kritis) |
| Require status checks (CI) lulus | ✅ Wajib |
| Require branch up to date sebelum merge | ✅ Direkomendasikan |
| Require signed commits | Opsional, tergantung compliance requirement |
| Disallow force push | ✅ Wajib |
| Disallow branch deletion | ✅ Wajib |
| Require linear history (no merge commit) | Opsional, tergantung branching strategy tim |

---

## 7. Checklist Production-Readiness Team Git Workflow

```
Repository Setup:
  [ ] .gitignore lengkap sesuai stack (dependency, env, build output)
  [ ] .env.example tersedia (tanpa value asli)
  [ ] README dengan setup instructions jelas
  [ ] CODEOWNERS file (siapa reviewer wajib untuk folder/file tertentu)
  [ ] LICENSE (kalau open source)

Branch Protection (main & release branches):
  [ ] Require PR sebelum merge
  [ ] Require minimal 1-2 approval
  [ ] Require CI checks lulus (lint, test, build)
  [ ] No force push, no delete
  [ ] Require branch up to date sebelum merge

Commit & Code Quality:
  [ ] Commit message convention disepakati (Conventional Commits atau lainnya)
  [ ] Pre-commit hook: lint + format (misal: husky + lint-staged)
  [ ] Pre-commit/CI secret scanning (gitleaks/git-secrets)
  [ ] PR template tersedia (deskripsi, checklist testing)

Branching Strategy:
  [ ] Strategi disepakati tim (Git Flow / GitHub Flow / Trunk-Based)
  [ ] Naming convention branch jelas (feature/, fix/, hotfix/, release/)
  [ ] Kebijakan lifetime branch (branch lama yang stale dihapus berkala)

CI/CD Integration:
  [ ] Setiap PR trigger: lint, test, build otomatis
  [ ] Deploy otomatis dari main (atau manual approval untuk production)
  [ ] Rollback plan jika deploy gagal (revert commit / redeploy versi sebelumnya)

Security:
  [ ] Signed commits (kalau compliance mengharuskan)
  [ ] Secret disimpan di secret manager, bukan hardcoded
  [ ] Access control repo di-review berkala (siapa masih punya write access)
  [ ] 2FA wajib untuk semua kontributor di platform hosting

Dokumentasi & Onboarding:
  [ ] Contributing guide untuk kontributor baru
  [ ] Dokumentasi cara resolve conflict, cara request review
  [ ] Dokumentasi rollback/incident response terkait Git (misal: accidental force-push)
```

---

## Ringkasan Konsep

```
Commit message:
  <type>(<scope>): <deskripsi>   → feat/fix/docs/style/refactor/perf/test/chore/ci

.gitignore:
  Ignore dependency, env/secret, build output, OS/editor files
  File sudah tracked? → git rm --cached, BUKAN cukup edit .gitignore saja

Branching strategy:
  Git Flow            → release terjadwal, banyak versi paralel
  GitHub Flow         → continuous deployment, tim kecil-menengah (default pilihan)
  Trunk-Based Dev     → deploy sangat sering, butuh test coverage + feature flag

Signed commit:
  Buktikan identitas commit secara kriptografis (GPG atau SSH key)

Secret leak:
  ROTATE/REVOKE credential dulu (paling urgent) → baru bersihkan history
  (filter-repo/filter-branch) → force-push terkoordinasi → tim re-clone

Protected branch minimum:
  Wajib PR + approval + CI hijau, no force-push, no delete
```

---

*Dokumen ini berdasarkan Git versi 2.4x dan platform hosting (GitHub/GitLab/Bitbucket) per 2026.*
