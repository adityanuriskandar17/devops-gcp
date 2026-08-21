# Bash Scripting

Dokumentasi lengkap **Bash Scripting** — bahasa scripting yang jadi tulang punggung automation di dunia DevOps: dari provisioning server, CI/CD pipeline, cron job, sampai glue code antar tools (`gcloud`, `kubectl`, `docker`, `terraform`, dll). Materi ini **cloud-agnostic** — berlaku di GCP, AWS, on-premise, laptop kamu sendiri, di mana saja ada shell.

**Shell:** Bash (Bourne Again SHell)
**Umumnya tersedia di:** Linux, macOS, WSL, Git Bash, hampir semua container image

---

## Apa itu Bash Scripting?

Bash adalah **command-line interpreter** (shell) yang juga berfungsi sebagai bahasa pemrograman. Script Bash adalah kumpulan perintah shell yang disimpan dalam file dan dieksekusi secara berurutan.

```
Kenapa DevOps sangat bergantung pada Bash?

  ┌────────────────────────────────────────────────────────┐
  │  Hampir semua tools DevOps punya CLI:                    │
  │                                                          │
  │    gcloud, aws, kubectl, docker, terraform, git,          │
  │    ansible, helm, curl, jq, ssh ...                       │
  │                                                          │
  │  Bash = "lem" yang menyambungkan semua CLI tools ini      │
  │  menjadi satu automation flow yang konsisten dan          │
  │  repeatable.                                              │
  └────────────────────────────────────────────────────────┘
```

### Flow: Shell → Script → Interpreter

```
Kamu ketik command di terminal:
  $ echo "Hello"
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  1. Shell (Bash) membaca input                           │
│     → interactive shell menunggu command satu-per-satu   │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
Kamu simpan banyak command dalam 1 file: deploy.sh
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  2. Script File (deploy.sh)                               │
│                                                           │
│     #!/bin/bash             ← shebang, menentukan          │
│     echo "Starting deploy"    interpreter yang dipakai    │
│     gcloud compute ssh ...                                │
│     kubectl apply -f app.yaml                              │
│                                                           │
└──────────────────────┬────────────────────────────────────┘
                       │  dijalankan via: ./deploy.sh
                       ▼
┌─────────────────────────────────────────────────────────┐
│  3. Interpreter (/bin/bash)                                │
│     → membaca script baris demi baris                     │
│     → parse syntax, expand variables, jalankan command    │
│     → tangani pipes, redirection, exit code                │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  4. Kernel / OS                                            │
│     → execute binary (gcloud, kubectl, curl, dll)          │
│     → return exit code + output ke Bash                    │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
              ✅ Output ditampilkan / di-log
              ✅ Exit code dikembalikan ($?)
```

**Penting:** Bash bukan bahasa compiled — setiap kali script dijalankan, Bash **membaca dan menginterpretasikan ulang** baris per baris (interpreted language). Ini artinya error syntax di baris 50 baru terdeteksi ketika eksekusi sampai baris 50, bukan sebelum script mulai jalan.

---

## Kenapa Penting untuk DevOps Automation?

| Use Case | Contoh |
|----------|--------|
| **Provisioning** | Startup script VM (`startup-script` metadata di GCE), user-data di AWS EC2 |
| **CI/CD Pipeline** | Steps di GitHub Actions / GitLab CI / Jenkins sering berupa Bash script |
| **Cron Jobs** | Backup harian, cleanup log, rotate snapshot |
| **Glue Code** | Menyambungkan output 1 CLI tool jadi input CLI tool lain (`gcloud ... | jq ... | kubectl ...`) |
| **Health Check / Monitoring** | Script custom cek status service, kirim alert |
| **Deployment** | Script deploy manual atau semi-otomatis sebelum full IaC |
| **Local Dev Tooling** | Setup environment, install dependency, seed database |

```
Tanpa Bash scripting:
  → Setiap deploy = ketik 15 command manual, satu-satu, tiap kali
  → Human error tinggi (lupa 1 step, typo, urutan salah)
  → Tidak ada jejak apa yang sudah dijalankan

Dengan Bash scripting:
  → 1 command: ./deploy.sh
  → Konsisten, repeatable, bisa di-review (code review script)
  → Bisa di-version-control (git)
  → Basis untuk automation lebih lanjut (cron, CI/CD, Ansible)
```

---

## Daftar Dokumentasi

| # | File | Isi |
|---|------|-----|
| 01 | [Konsep & Cara Kerja](01-concepts.md) | Shebang, cara eksekusi script, variables, quoting, environment vs shell vs local variable, exit code, command substitution |
| 02 | [Control Flow](02-control-flow.md) | if/elif/else, test operators, case, for/while/until loop, break/continue, skenario error handling |
| 03 | [Functions & Arguments](03-functions-arguments.md) | Function, positional parameters, shift, local vs global, return value, getopts, skenario CLI flags |
| 04 | [Text Processing](04-text-processing.md) | grep/sed/awk/cut/sort/uniq/tr, pipes & redirection, heredoc, process substitution, skenario parsing log |
| 05 | [Commands Cheatsheet](05-commands-cheatsheet.md) | String ops, array, arithmetic, file test, loop syntax, debugging flags, one-liners |
| 06 | [Best Practices](06-best-practices.md) | Quoting, `set -euo pipefail`, ShellCheck, `[[ ]]` vs `[ ]`, trap, idempotency, logging, checklist |

---

## Quick Start

```
1. Buat file script:
   $ nano hello.sh

2. Isi dengan shebang + command:
   #!/bin/bash
   echo "Hello, DevOps!"

3. Kasih permission execute:
   $ chmod +x hello.sh

4. Jalankan:
   $ ./hello.sh
   Hello, DevOps!
```

```bash
#!/bin/bash
# hello.sh - script Bash paling sederhana

echo "Hello, DevOps!"
echo "User saat ini: $(whoami)"
echo "Tanggal: $(date '+%Y-%m-%d')"
```

```bash
chmod +x hello.sh   # kasih permission execute ke file
./hello.sh          # jalankan script
```

**Catatan:** Kalau lupa `chmod +x`, script tetap bisa dijalankan dengan `bash hello.sh` tanpa perlu execute permission — lihat detail perbedaannya di [01-concepts.md](01-concepts.md).

---

*Dokumen ini berdasarkan Bash versi 5.x yang umum digunakan di distro modern per 2026.*
