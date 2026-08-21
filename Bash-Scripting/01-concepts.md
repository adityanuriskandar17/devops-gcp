# Konsep & Cara Kerja Bash Scripting

Dokumentasi konsep dasar Bash — shebang, cara eksekusi script, variables, quoting rules, jenis-jenis variable, exit code, dan command substitution.

**Shell:** Bash 5.x

---

## Shebang Line

Baris pertama script yang menentukan **interpreter** mana yang akan menjalankan file tersebut.

```
#!/bin/bash
```

```
Anatomy shebang:

  #!/bin/bash
  ││└──┬────┘
  ││   └── path absolut ke interpreter
  │└────── "bang"
  └─────── "hash" — bersama jadi "hashbang" / "shebang"
```

| Shebang | Kapan Dipakai |
|---------|---------------|
| `#!/bin/bash` | Paling umum — pakai Bash spesifik (mendukung array, `[[ ]]`, dll) |
| `#!/bin/sh` | POSIX-compliant shell, lebih portable tapi feature terbatas (tidak semua fitur Bash tersedia) |
| `#!/usr/bin/env bash` | Cari `bash` di `$PATH` — lebih portable antar sistem yang path binary-nya beda (misal macOS vs Linux) |

**Best practice:** Gunakan `#!/usr/bin/env bash` di script yang harus portable across sistem (macOS sering punya Bash lama di `/bin/bash`, tapi Bash baru di path lain via Homebrew).

**Penting:** Shebang **hanya berfungsi** kalau script dijalankan langsung (`./script.sh`). Kalau dijalankan dengan `bash script.sh`, shebang **diabaikan** karena interpreter sudah ditentukan secara eksplisit di command.

---

## Cara Eksekusi Script

Ada 3 cara utama menjalankan script Bash, dan masing-masing punya efek berbeda terhadap **subshell** vs **current shell**.

```
Flow eksekusi:

  ./script.sh
       │
       ▼
  ┌─────────────────────────────────────────┐
  │  1. OS baca shebang line                  │
  │  2. Spawn SUBSHELL baru                    │
  │  3. Jalankan script di subshell tersebut   │
  │  4. Subshell selesai → kembali ke shell    │
  │     induk (variable/cd di script HILANG)   │
  └─────────────────────────────────────────┘

  source script.sh   (atau: . script.sh)
       │
       ▼
  ┌─────────────────────────────────────────┐
  │  1. TIDAK spawn subshell                   │
  │  2. Script dijalankan di CURRENT SHELL     │
  │  3. Variable, function, cd yang di-set     │
  │     TETAP ADA setelah script selesai       │
  └─────────────────────────────────────────┘
```

| Cara | Butuh `chmod +x`? | Jalan di | Efek variable/cd setelah selesai |
|------|--------------------|----------|-----------------------------------|
| `./script.sh` | Ya | Subshell baru | Hilang (tidak mempengaruhi shell induk) |
| `bash script.sh` | Tidak | Subshell baru (bash dijalankan sebagai command) | Hilang |
| `sh script.sh` | Tidak | Subshell dengan `sh` interpreter | Hilang |
| `source script.sh` | Tidak | Shell saat ini (current shell) | **Tetap ada** |
| `. script.sh` | Tidak | Shell saat ini (sama seperti `source`, POSIX) | **Tetap ada** |

## Skenario: Kenapa `source` Dipakai untuk `.bashrc` dan `.env`

```
Kasus: kamu punya file .env berisi:
  export DB_HOST=10.0.0.5
  export DB_PORT=5432

Kalau dijalankan dengan ./:
  $ ./.env                      ❌ error, .env bukan executable script
  atau kalaupun jalan:
  $ bash .env
  → variable DB_HOST hanya ada di dalam subshell .env
  → setelah selesai, subshell hilang, variable HILANG dari shell kamu

Kalau dijalankan dengan source:
  $ source .env
  → export DB_HOST dan DB_PORT dijalankan di CURRENT SHELL
  → variable TETAP ADA, bisa dipakai command selanjutnya
  $ echo $DB_HOST
  10.0.0.5                      ✅

Ini kenapa .bashrc, .env, dan config shell lain di-"source",
bukan dieksekusi seperti script biasa.
```

---

## Variables

### Deklarasi Variable

```bash
NAME="Aditya"        # tidak ada spasi di sekitar "="
AGE=30                # tidak perlu quote untuk angka
IS_PROD=true          # Bash tidak punya native boolean, ini cuma string
```

**Penting:** Bash **tidak mengizinkan spasi** di sekitar tanda `=` saat deklarasi variable. `NAME = "Aditya"` akan dianggap sebagai command bernama `NAME` dengan argumen `=` dan `"Aditya"` → error `command not found`.

### Mengakses Variable

```bash
echo $NAME       # cara sederhana
echo ${NAME}     # cara explicit dengan curly braces
```

| Bentuk | Kapan Dipakai |
|--------|---------------|
| `$VAR` | Cukup untuk kasus sederhana, variable berdiri sendiri |
| `${VAR}` | **Wajib** kalau variable diikuti karakter yang bisa ambigu, misal `${VAR}_suffix` (tanpa `{}`, Bash akan cari variable bernama `VAR_suffix`) |
| `${VAR:-default}` | Pakai `default` kalau `VAR` unset/empty, tanpa mengubah `VAR` |
| `${VAR:=default}` | Set `VAR` ke `default` kalau unset/empty |
| `${VAR:?message}` | Print `message` ke stderr dan exit kalau `VAR` unset/empty |
| `${#VAR}` | Panjang string dari `VAR` |

```bash
PREFIX="app"
echo "$PREFIX_env"    # ❌ mencari variable bernama PREFIX_env (kemungkinan kosong)
echo "${PREFIX}_env"  # ✅ hasil: app_env
```

### Quoting Rules: Single vs Double Quotes

```
Perbandingan Quoting:

  Single Quote '...'          Double Quote "..."
  ┌───────────────────┐      ┌───────────────────┐
  │  LITERAL string      │      │  Expand variable    │
  │  TIDAK ada expansion │      │  Expand command sub  │
  │  $VAR tetap "$VAR"   │      │  $VAR jadi isinya    │
  └───────────────────┘      └───────────────────┘
```

| Contoh | Output |
|--------|--------|
| `echo '$NAME'` | `$NAME` (literal, tidak di-expand) |
| `echo "$NAME"` | `Aditya` (di-expand jadi isi variable) |
| `echo '$(date)'` | `$(date)` (literal) |
| `echo "$(date)"` | tanggal hari ini (di-expand) |
| `echo "Halo, $NAME!"` | `Halo, Aditya!` |
| `echo 'Halo, $NAME!'` | `Halo, $NAME!` |

**Best practice:** Selalu **quote variable dengan double quotes** — `"$VAR"` bukan `$VAR` tanpa quote — untuk mencegah **word splitting** dan **globbing** yang tidak diinginkan, terutama kalau isi variable ada spasi. Detail lebih lanjut di [06-best-practices.md](06-best-practices.md).

```bash
FILE="my report.txt"

rm $FILE      # ❌ diperlakukan sebagai 2 argumen: "my" dan "report.txt"
rm "$FILE"    # ✅ diperlakukan sebagai 1 argumen: "my report.txt"
```

---

## Environment Variable vs Shell Variable vs Local Variable

```
Scope Variable di Bash:

  ┌────────────────────────────────────────────────────────┐
  │  Environment Variable                                     │
  │  export DB_HOST=10.0.0.5                                   │
  │  → Diwariskan ke SEMUA child process (subshell, script     │
  │    lain yang dipanggil, program apapun)                    │
  │                                                            │
  │    ┌──────────────────────────────────────────┐           │
  │    │  Shell Variable                             │           │
  │    │  NAME="Aditya"                               │           │
  │    │  → Hanya ada di shell/script saat ini,        │           │
  │    │    TIDAK diwariskan ke child process           │           │
  │    │                                              │           │
  │    │    ┌──────────────────────────────┐         │           │
  │    │    │  Local Variable (dalam function) │         │           │
  │    │    │  local temp="x"                    │         │           │
  │    │    │  → Hanya ada di dalam function      │         │           │
  │    │    │    tersebut, hilang setelah function │         │           │
  │    │    │    selesai                          │         │           │
  │    │    └──────────────────────────────┘         │           │
  │    └──────────────────────────────────────────┘           │
  └────────────────────────────────────────────────────────┘
```

| Tipe | Cara Deklarasi | Scope | Contoh Use Case |
|------|-----------------|-------|-----------------|
| **Environment Variable** | `export VAR=value` | Shell ini + semua child process | `DB_HOST`, `PATH`, `JAVA_HOME` |
| **Shell Variable** | `VAR=value` (tanpa export) | Shell/script ini saja | Variable sementara dalam 1 script |
| **Local Variable** | `local VAR=value` (dalam function) | Dalam function tersebut saja | Variable temporary dalam function, hindari polusi global |

```bash
#!/bin/bash

GLOBAL_VAR="saya global"     # shell variable
export ENV_VAR="saya env"     # environment variable

check_scope() {
    local LOCAL_VAR="saya local"
    echo "Di dalam function: $GLOBAL_VAR, $ENV_VAR, $LOCAL_VAR"
}

check_scope
echo "Di luar function: $GLOBAL_VAR, $ENV_VAR"
echo "$LOCAL_VAR"    # kosong — local variable sudah hilang

bash -c 'echo "Child process: $ENV_VAR"'   # ✅ muncul, karena exported
bash -c 'echo "Child process: $GLOBAL_VAR"' # kosong — tidak diwariskan
```

**Catatan:** `export` tidak membuat variable "lebih permanen" — tetap hilang begitu shell/script yang mendefinisikannya selesai. `export` hanya mengontrol apakah variable itu **diwariskan ke child process** atau tidak.

---

## Exit Codes

Setiap command di Bash mengembalikan **exit code** (juga disebut return status) — angka `0-255` yang menunjukkan apakah command berhasil atau gagal.

```
Konvensi Exit Code:

  0        → Sukses ✅
  1-255    → Gagal, dengan berbagai makna ❌
             (127 = command not found, 126 = permission denied,
              130 = terminated by Ctrl+C, dst — tidak standar
              penuh, tergantung program)
```

```bash
ls /tmp
echo $?     # 0, karena ls berhasil

ls /folder-tidak-ada
echo $?     # 2 (atau nilai lain tergantung sistem), karena gagal
```

| Konsep | Penjelasan | Contoh |
|--------|------------|--------|
| `$?` | Exit code dari command **terakhir** yang dijalankan | `echo $?` setelah command apapun |
| `exit N` | Mengakhiri script dengan exit code `N` | `exit 1` untuk menandakan error |
| `exit` (tanpa argumen) | Exit dengan code dari command terakhir | `exit` |
| `exit 0` | Exit sukses secara eksplisit | Dipakai di akhir script yang berhasil |

```bash
#!/bin/bash

deploy_app() {
    echo "Deploying..."
    # simulasi gagal
    return 1
}

deploy_app
if [ $? -ne 0 ]; then
    echo "Deploy GAGAL!"
    exit 1
fi

echo "Deploy berhasil"
exit 0
```

**Penting:** `$?` **hanya berlaku untuk command langsung sebelumnya**. Kalau kamu jalankan command lain (termasuk `echo`) di antara command yang mau dicek dan pengecekan `$?`, nilainya sudah berubah.

```bash
grep "error" file.log
echo "Mengecek hasil..."   # command ini mengubah $?
if [ $? -eq 0 ]; then       # ❌ ini mengecek exit code dari echo, bukan grep!
    echo "Ada error"
fi
```

---

## Command Substitution: `$(...)` vs Backticks

Command substitution menjalankan sebuah command dan menggantinya dengan **output** dari command tersebut.

```bash
TODAY=$(date '+%Y-%m-%d')      # cara modern
TODAY=`date '+%Y-%m-%d'`       # cara lama (backticks)

echo "Hari ini: $TODAY"
```

| Aspek | `$(...)` | `` `...` `` (backticks) |
|-------|----------|--------------------------|
| Readability | Lebih jelas, terutama saat nested | Sulit dibaca saat nested |
| Nesting | Mudah: `$(cmd1 $(cmd2))` | Sulit: perlu escape backtick dalam: `` `cmd1 \`cmd2\`` `` |
| Escaping karakter khusus | Lebih konsisten | Beberapa karakter perlu escape berbeda |
| Rekomendasi modern | ✅ Gunakan ini | ❌ Hindari, hanya untuk kompatibilitas script lama |

```bash
# Nested command substitution — jauh lebih mudah dibaca dengan $()
COUNT=$(grep -c "error" $(ls /var/log/*.log | head -1))

# vs backticks (sulit dibaca, rawan salah escape)
COUNT=`grep -c "error" \`ls /var/log/*.log | head -1\``
```

**Best practice:** Selalu gunakan `$(...)` untuk command substitution di script baru. Backticks hanya relevan kalau harus mempertahankan kompatibilitas dengan shell POSIX yang sangat lama.

---

## Skenario: Debug Variable yang "Hilang" Setelah Script Selesai

```
Masalah: Developer bikin script set-env.sh untuk set DB_HOST,
lalu bingung kenapa variable-nya tidak ada di terminal.

  $ cat set-env.sh
  #!/bin/bash
  export DB_HOST=10.0.0.5
  echo "DB_HOST di-set ke $DB_HOST"

  $ ./set-env.sh
  DB_HOST di-set ke 10.0.0.5      ✅ terlihat di dalam script

  $ echo $DB_HOST
                                   ❌ kosong! kok hilang?

Root cause:
  ./set-env.sh menjalankan script di SUBSHELL baru.
  export DB_HOST hanya berlaku di subshell tersebut.
  Begitu subshell selesai, environment-nya dibuang.

Fix: pakai source, bukan ./
  $ source set-env.sh
  DB_HOST di-set ke 10.0.0.5

  $ echo $DB_HOST
  10.0.0.5                        ✅ sekarang ada di shell kamu
```

---

## Ringkasan Konsep

```
Shebang:
  #!/bin/bash              → interpreter spesifik Bash
  #!/usr/bin/env bash       → cari bash di $PATH (portable)

Cara eksekusi:
  ./script.sh   → subshell, butuh chmod +x, variable hilang setelah selesai
  bash script.sh → subshell, tidak butuh chmod +x
  source script.sh (atau . script.sh) → current shell, variable tetap ada

Variable:
  VAR="value"     → deklarasi, TANPA spasi di sekitar =
  $VAR / ${VAR}    → akses, pakai {} kalau ambigu
  'literal'        → single quote, TIDAK ada expansion
  "expand $VAR"    → double quote, ADA expansion
  → selalu quote variable: "$VAR"

Scope:
  export VAR=x   → environment variable, diwariskan ke child process
  VAR=x          → shell variable, tidak diwariskan
  local VAR=x    → local variable, hanya di dalam function

Exit code:
  $?         → exit code command terakhir
  exit N     → keluar script dengan code N
  0 = sukses, non-zero = gagal

Command substitution:
  $(command)   → modern, mudah nested (GUNAKAN INI)
  `command`    → legacy, hindari di script baru
```

---

*Dokumen ini berdasarkan Bash versi 5.x yang umum digunakan di distro modern per 2026.*
