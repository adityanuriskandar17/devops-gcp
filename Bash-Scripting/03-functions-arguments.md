# Functions & Arguments

Dokumentasi function di Bash — deklarasi, positional parameters, `shift`, local vs global variable, return value, dan parsing flag dengan `getopts`.

**Shell:** Bash 5.x

---

## Deklarasi Function

```bash
# Cara 1: dengan keyword "function" (Bash-specific)
function greet() {
    echo "Hello, $1!"
}

# Cara 2: tanpa keyword "function" (POSIX-compatible, lebih portable)
greet() {
    echo "Hello, $1!"
}

greet "Aditya"    # Hello, Aditya!
```

| Cara | Portability | Rekomendasi |
|------|-------------|-------------|
| `function name() { ... }` | Bash-only | Boleh, lebih eksplisit terlihat sebagai function |
| `name() { ... }` | POSIX-compatible (jalan di `sh` juga) | ✅ **Best practice** — lebih portable |

**Penting:** Function di Bash **harus dideklarasikan sebelum dipanggil** dalam urutan baca file dari atas ke bawah — Bash tidak melakukan "hoisting" seperti beberapa bahasa lain.

```
Flow eksekusi function:

  Script mulai dijalankan (baris demi baris, top to bottom)
       │
       ▼
  Baris 1-5: definisi function greet() { ... }
       │        (BELUM dijalankan, hanya didaftarkan)
       ▼
  Baris 10: greet "Aditya"
       │        (BARU sekarang function benar-benar dieksekusi)
       ▼
  Masuk ke dalam body function, jalankan command di dalamnya
       │
       ▼
  Function selesai → kembali ke baris setelah pemanggilan
```

---

## Positional Parameters

Argumen yang dikirim ke script (atau function) tersedia sebagai **positional parameters**.

```bash
#!/bin/bash
# deploy.sh

echo "Script name : $0"
echo "Argumen 1   : $1"
echo "Argumen 2   : $2"
echo "Semua arg (list)   : $@"
echo "Semua arg (1 string): $*"
echo "Jumlah argumen      : $#"
```

```bash
./deploy.sh production v1.2.3
```

```
Script name : ./deploy.sh
Argumen 1   : production
Argumen 2   : v1.2.3
Semua arg (list)   : production v1.2.3
Semua arg (1 string): production v1.2.3
Jumlah argumen      : 2
```

| Variable | Arti |
|----------|------|
| `$0` | Nama script itu sendiri (atau nama function, tergantung konteks) |
| `$1`, `$2`, ... `$9` | Argumen ke-1, ke-2, dst |
| `${10}`, `${11}`, ... | Argumen ke-10 dan seterusnya (harus pakai `{}` karena `$10` akan dibaca sebagai `${1}0`) |
| `$@` | Semua argumen sebagai **list terpisah** (masing-masing tetap 1 word) |
| `$*` | Semua argumen sebagai **1 string tunggal**, digabung dengan `$IFS` (default: spasi) |
| `$#` | Jumlah total argumen |

### `$@` vs `$*` — Perbedaan Krusial

```bash
set -- "arg one" "arg two"   # simulasi 2 argumen, salah satunya ada spasi

for A in "$@"; do
    echo "[$A]"
done
# Output:
# [arg one]
# [arg two]      ✅ tetap 2 item

for A in "$*"; do
    echo "[$A]"
done
# Output:
# [arg one arg two]   ❌ jadi 1 item gabungan
```

**Best practice:** Gunakan `"$@"` (dengan quote!) ketika perlu meneruskan semua argumen ke command/function lain apa adanya. `"$*"` jarang dipakai kecuali memang ingin menggabungkan semua argumen jadi 1 string.

---

## shift

`shift` menggeser posisi parameter — `$2` menjadi `$1`, `$3` menjadi `$2`, dst. Berguna untuk memproses argumen satu per satu, terutama saat parsing flag manual.

```bash
#!/bin/bash

echo "Sebelum shift: $1 $2 $3"
shift
echo "Setelah shift 1x: $1 $2"
shift 2
echo "Setelah shift 2x lagi: $1"
```

```bash
./script.sh a b c d
# Sebelum shift: a b c
# Setelah shift 1x: b c
# Setelah shift 2x lagi: d
```

```
Flow shift dalam loop parsing argumen:

  argumen: --env prod --verbose

  while [[ $# -gt 0 ]]; do
      case "$1" in
          --env)
              ENV="$2"
              shift 2      # buang "--env" DAN nilainya "prod"
              ;;
          --verbose)
              VERBOSE=true
              shift         # buang "--verbose" saja (tidak ada nilai)
              ;;
      esac
  done
```

---

## Local vs Global Variable dalam Function

```bash
#!/bin/bash

COUNTER=0    # global

increment() {
    local STEP=1      # local — hanya ada di dalam function ini
    COUNTER=$((COUNTER + STEP))    # mengubah variable GLOBAL
}

increment
increment
echo "$COUNTER"   # 2
echo "$STEP"      # kosong — STEP tidak ada di luar function
```

**Penting:** Tanpa `local`, semua variable yang di-assign dalam function **otomatis menjadi global** — ini sumber bug klasik ketika nama variable di dalam function tanpa sengaja menimpa variable global dengan nama sama.

```bash
TOTAL=100

process() {
    TOTAL=0          # ❌ tanpa "local", ini menimpa TOTAL global!
    echo "Di dalam function: $TOTAL"
}

process
echo "Di luar function: $TOTAL"   # 0 — TOTAL global sudah tertimpa!
```

**Best practice:** Selalu deklarasikan variable dalam function dengan `local`, kecuali memang **sengaja** ingin mengubah state global (dan idealnya beri komentar kalau begitu).

---

## Return Value: Exit Code vs echo + Capture

Bash function **tidak punya return value seperti bahasa lain** — `return` di Bash hanya mengembalikan **exit code** (0-255), bukan data arbitrer.

### Cara 1: Exit Code (untuk hasil TRUE/FALSE atau status)

```bash
is_production() {
    if [[ "$1" == "prod" ]]; then
        return 0    # sukses / true
    else
        return 1    # gagal / false
    fi
}

if is_production "prod"; then
    echo "Ini environment production!"
fi
```

### Cara 2: echo + Command Substitution (untuk data/string)

```bash
get_full_name() {
    local first="$1"
    local last="$2"
    echo "${first} ${last}"    # "echo" di sini bukan print biasa,
                                  # tapi cara "mengembalikan" data
}

FULL_NAME=$(get_full_name "Aditya" "Nur")
echo "Nama lengkap: $FULL_NAME"
```

| Cara | Dipakai Untuk | Batasan |
|------|----------------|---------|
| `return N` | Status sukses/gagal (mirip boolean), dicek dengan `$?` atau langsung di `if` | Hanya angka 0-255 |
| `echo VALUE` + `$(function_call)` | Mengembalikan string/data | Function TIDAK BOLEH `echo` hal lain (misal log/debug) ke stdout, karena akan ikut tertangkap sebagai return value |

**Catatan:** Kalau function butuh log/debug output sekaligus mengembalikan data via `echo`, arahkan log ke **stderr** (`echo "log message" >&2`) supaya tidak tercampur dengan return value di stdout.

```bash
get_disk_usage() {
    echo "Menghitung disk usage..." >&2    # log ke stderr, tidak ikut tertangkap
    df -h / | awk 'NR==2 {print $5}'        # ini yang jadi "return value"
}

USAGE=$(get_disk_usage)
echo "Disk usage: $USAGE"
```

---

## getopts untuk Parsing Flag

`getopts` adalah builtin Bash untuk parsing **short flag** (`-e`, `-v`) dengan cara yang standar dan robust.

```bash
#!/bin/bash

while getopts "e:v" OPT; do
    case "$OPT" in
        e) ENV="$OPTARG" ;;
        v) VERBOSE=true ;;
        \?) echo "Flag tidak dikenal"; exit 1 ;;
    esac
done

echo "Env: $ENV, Verbose: $VERBOSE"
```

```bash
./script.sh -e production -v
# Env: production, Verbose: true
```

| Simbol dalam optstring | Arti |
|--------------------------|------|
| `e:` (dengan `:`) | Flag `-e` **butuh nilai** (tersimpan di `$OPTARG`) |
| `v` (tanpa `:`) | Flag `-v` **tidak butuh nilai** (boolean flag) |
| `\?` di dalam `case` | Menangkap flag yang tidak dikenal |

**Penting:** `getopts` **native hanya mendukung short flag** (`-e`, `-v`), bukan long flag (`--env`, `--verbose`). Untuk long flag, umumnya dipakai parsing manual dengan `case` + `shift` seperti pada skenario di bawah, atau tool eksternal seperti `getopt` (GNU, berbeda dari builtin `getopts`).

---

## Skenario: Membangun CLI Script dengan Flag `--env` dan `--verbose`

```
Kebutuhan: script deploy.sh yang menerima:
  --env <nama>      (wajib)
  --verbose         (optional, boolean)
  --dry-run         (optional, boolean)
  -h / --help       (tampilkan usage)
```

```bash
#!/bin/bash
#
# deploy.sh - contoh CLI script dengan long-flag parsing manual

set -euo pipefail

ENV=""
VERBOSE=false
DRY_RUN=false

usage() {
    cat <<EOF
Usage: $0 --env <env> [--verbose] [--dry-run]

Options:
  --env <env>     Target environment (dev|staging|prod) [wajib]
  --verbose       Tampilkan output detail
  --dry-run       Simulasi tanpa eksekusi aktual
  -h, --help      Tampilkan bantuan ini
EOF
}

log() {
    if [[ "$VERBOSE" == true ]]; then
        echo "[LOG] $*"
    fi
}

# --- Parsing argumen (long flag manual, karena getopts tidak support --env) ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --env)
            ENV="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Flag tidak dikenal: $1" >&2
            usage
            exit 1
            ;;
    esac
done

# --- Validasi ---
if [[ -z "$ENV" ]]; then
    echo "Error: --env wajib diisi" >&2
    usage
    exit 1
fi

case "$ENV" in
    dev|staging|prod) ;;
    *)
        echo "Error: --env harus salah satu dari dev|staging|prod" >&2
        exit 1
        ;;
esac

# --- Eksekusi ---
log "Environment target: $ENV"
log "Dry run: $DRY_RUN"

if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY RUN] Akan deploy ke $ENV, tapi tidak benar-benar dijalankan"
    exit 0
fi

echo "Deploying ke $ENV..."
log "Menjalankan kubectl apply -f manifests/$ENV/"
# kubectl apply -f "manifests/$ENV/"
echo "Deploy ke $ENV selesai ✅"
```

```bash
./deploy.sh --env prod --verbose
./deploy.sh --env staging --dry-run
./deploy.sh --help
./deploy.sh                          # error: --env wajib diisi
```

---

## Ringkasan Konsep

```
Function:
  name() { ... }              → deklarasi (POSIX-compatible, best practice)
  function name() { ... }     → deklarasi (Bash-specific)

Positional parameters:
  $0        → nama script
  $1, $2... → argumen ke-N
  $@        → semua argumen, list terpisah (quote: "$@")
  $*        → semua argumen, 1 string gabungan
  $#        → jumlah argumen

shift:
  shift      → geser 1 posisi (buang $1, $2 jadi $1)
  shift N    → geser N posisi

Scope dalam function:
  local VAR=x   → variable hanya di dalam function
  VAR=x         → TANPA local = otomatis jadi GLOBAL (hati-hati!)

Return value:
  return N              → exit code (0-255), untuk status
  echo VALUE + $(func)   → data/string, log harus ke stderr (>&2)

Parsing flag:
  getopts "e:v" OPT     → short flag saja (-e, -v)
  case + shift manual    → dibutuhkan untuk long flag (--env, --verbose)
```

---

*Dokumen ini berdasarkan Bash versi 5.x yang umum digunakan di distro modern per 2026.*
