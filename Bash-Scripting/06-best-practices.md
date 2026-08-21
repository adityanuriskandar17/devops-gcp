# Best Practices

Panduan dan rekomendasi untuk menulis Bash script yang aman, konsisten, dan production-ready.

---

## 1. Selalu Quote Variable

| Practice | Alasan |
|----------|--------|
| Gunakan `"$VAR"`, bukan `$VAR` | Mencegah word splitting (isi variable dengan spasi jadi beberapa argumen) dan globbing (isi variable berupa `*` diperlakukan sebagai wildcard) |
| Gunakan `"$@"`, bukan `$@` atau `$*` | Meneruskan argumen apa adanya, masing-masing tetap 1 item terpisah |
| Quote hasil command substitution | `FILE="$(basename "$PATH_VAR")"` |

```bash
FILE="my report final.txt"

rm $FILE      # ❌ dianggap 3 argumen terpisah: "my" "report" "final.txt"
rm "$FILE"    # ✅ dianggap 1 argumen: "my report final.txt"

PATTERN="*.log"
echo $PATTERN    # ❌ kalau ada file .log di direktori saat ini, akan di-glob-expand
echo "$PATTERN"  # ✅ tetap literal "*.log"
```

**Penting:** Pengecualian untuk quoting adalah saat kamu **memang sengaja** ingin word splitting atau glob expansion terjadi (jarang, dan sebaiknya diberi komentar kalau begitu).

---

## 2. `set -euo pipefail` — Dijelaskan Baris per Baris

```bash
#!/bin/bash
set -euo pipefail
```

| Bagian | Penjelasan |
|--------|------------|
| `set -e` | Script langsung **exit** begitu ada command yang exit code-nya non-zero (gagal). Tanpa ini, Bash akan melanjutkan ke baris berikutnya meski ada error. |
| `set -u` | Script **error** kalau memakai variable yang belum pernah di-set (unset) — mencegah typo nama variable yang diam-diam jadi string kosong. |
| `set -o pipefail` | Exit code dari sebuah **pipeline** (`cmd1 \| cmd2 \| cmd3`) menjadi exit code dari command **pertama yang gagal**, bukan selalu exit code command terakhir. |

```
Kenapa pipefail penting:

  Tanpa pipefail:
    grep "pattern" file-tidak-ada.txt | wc -l
         │ (gagal, exit 2)              │ (tetap berjalan, output "0")
         └──────────────────────────────┴──► exit code keseluruhan = 0 (dari wc -l)
    ❌ Script menganggap SUKSES padahal grep gagal!

  Dengan pipefail:
    grep "pattern" file-tidak-ada.txt | wc -l
    → exit code keseluruhan = exit code grep (non-zero)
    ✅ Script tahu ada kegagalan di tengah pipeline
```

**Penting:** `set -e` **tidak** menangkap semua jenis kegagalan — misalnya command di dalam `if condition; then`, command sebelum `&&`/`||`, atau command dalam pipeline (kecuali dengan `pipefail`) tidak memicu exit otomatis. Jangan mengandalkan `set -e` sebagai satu-satunya error handling; tetap cek `$?` atau pakai `if` secara eksplisit untuk logic penting.

**Best practice:** Selalu mulai script production dengan `set -euo pipefail` di baris awal (setelah shebang), kecuali ada alasan spesifik untuk menonaktifkan salah satunya secara sementara (misal `set +e` sebelum command yang memang boleh gagal, lalu `set -e` lagi setelahnya).

---

## 3. ShellCheck

**ShellCheck** adalah static analysis tool untuk Bash/sh yang mendeteksi bug umum, quoting yang salah, dan anti-pattern — sebelum script dijalankan.

```bash
# Install (Debian/Ubuntu)
sudo apt install shellcheck

# Jalankan terhadap script
shellcheck deploy.sh

# Contoh output warning:
# In deploy.sh line 12:
# rm $FILE
#    ^-- SC2086: Double quote to prevent globbing and word splitting.
```

| Practice | Cara |
|----------|------|
| Cek script sebelum commit | `shellcheck *.sh` |
| Integrasikan ke CI/CD | Tambahkan step `shellcheck` di pipeline sebelum deploy step |
| Integrasikan ke pre-commit hook | Pakai `pre-commit` framework dengan hook `shellcheck` |
| Suppress warning spesifik (kalau memang perlu) | Komentar `# shellcheck disable=SC2086` di atas baris terkait |

**Best practice:** Jalankan ShellCheck sebagai **gate di CI/CD** — script yang punya warning level error tidak boleh merge ke branch utama.

---

## 4. Hindari Parsing Output `ls`

```bash
# ❌ JANGAN — rawan pecah kalau nama file ada spasi, newline, atau mulai dengan "-"
for FILE in $(ls *.txt); do
    echo "$FILE"
done

# ✅ GUNAKAN glob langsung
for FILE in *.txt; do
    [[ -e "$FILE" ]] || continue   # handle kasus tidak ada file yang match
    echo "$FILE"
done

# ✅ Atau find + while read untuk kasus lebih kompleks (rekursif, filter lanjutan)
find . -name "*.txt" -print0 | while IFS= read -r -d '' FILE; do
    echo "$FILE"
done
```

**Penting:** `ls` dirancang untuk **dibaca manusia**, bukan untuk di-parse oleh script — formatnya bisa berubah tergantung locale, alias, atau opsi tersembunyi (`ls -l` beda parsing dengan `ls` polos). Gunakan glob (`*.txt`), `find`, atau `stat` untuk kebutuhan scripting.

---

## 5. `[[ ]]` vs `[ ]`

| Aspek | `[ ... ]` (POSIX test) | `[[ ... ]]` (Bash builtin) |
|-------|-------------------------|-----------------------------|
| Portability | Jalan di semua POSIX shell (`sh`, `dash`, `bash`) | Hanya Bash, `ksh`, `zsh` |
| Word splitting pada variable unquoted | Rawan pecah kalau variable tidak di-quote | Lebih aman meski variable tidak di-quote (tapi tetap disarankan quote) |
| Operator `&&` / `\|\|` di dalam kondisi | Tidak didukung langsung, perlu `-a`/`-o` (deprecated) atau bracket terpisah | Didukung langsung: `[[ cond1 && cond2 ]]` |
| Regex matching (`=~`) | Tidak didukung | Didukung: `[[ "$VAR" =~ ^[0-9]+$ ]]` |
| Pattern matching (`==` dengan wildcard) | Tidak didukung | Didukung: `[[ "$FILE" == *.log ]]` |

```bash
# [ ] — rawan error kalau VAR kosong dan tidak di-quote
VAR=""
[ $VAR == "test" ]      # ❌ error: "[: ==: unary operator expected"

# [[ ]] — lebih aman
[[ $VAR == "test" ]]    # ✅ tidak error, hasilnya false
```

**Best practice:** Gunakan `[[ ]]` untuk semua script yang memang ditulis untuk Bash (bukan POSIX `sh` murni). Hanya gunakan `[ ]` kalau script benar-benar harus portable ke shell non-Bash seperti `dash` atau `/bin/sh` di Alpine Linux.

---

## 6. `trap` untuk Cleanup saat Exit

`trap` menangkap sinyal (signal) atau event tertentu dan menjalankan command sebagai respons — paling umum dipakai untuk **cleanup** resource sementara (temp file, lock file, background process) apapun cara script berakhir.

```bash
#!/bin/bash
set -euo pipefail

TMP_DIR=$(mktemp -d)

cleanup() {
    echo "Membersihkan temporary files di $TMP_DIR..."
    rm -rf "$TMP_DIR"
}

trap cleanup EXIT    # cleanup dijalankan APAPUN cara script berakhir

# ... proses yang pakai $TMP_DIR ...
echo "data" > "$TMP_DIR/output.txt"
cat "$TMP_DIR/output.txt"

# cleanup() otomatis terpanggil di sini, baik normal exit, error (set -e), atau Ctrl+C
```

| Signal | Kapan Terjadi |
|--------|-----------------|
| `EXIT` | Script berakhir apapun sebabnya (normal, error, sinyal) — paling umum dipakai untuk cleanup |
| `ERR` | Command gagal (exit code non-zero) — dikombinasikan dengan `set -e` untuk logging error |
| `INT` | User tekan Ctrl+C (SIGINT) |
| `TERM` | Proses menerima sinyal terminate (SIGTERM), misal dari `kill` |

```bash
trap 'echo "Script dihentikan oleh user"; exit 130' INT
trap 'echo "Error di baris $LINENO"' ERR
```

**Best practice:** Gunakan `trap cleanup EXIT` untuk **semua script** yang membuat resource sementara (temp file/dir, lock file, port forwarding, background process) — jangan mengandalkan script selesai "normal" sebagai satu-satunya jalan cleanup terjadi.

---

## 7. Idempotent Script Design

Script **idempotent** = bisa dijalankan berkali-kali dengan **hasil akhir yang sama**, tanpa efek samping berlipat.

```
Contoh TIDAK idempotent:

  echo "export PATH=/opt/app/bin:\$PATH" >> ~/.bashrc
  → dijalankan 3x = baris yang sama muncul 3x di .bashrc ❌

Contoh idempotent:

  grep -qxF 'export PATH=/opt/app/bin:$PATH' ~/.bashrc \
    || echo "export PATH=/opt/app/bin:\$PATH" >> ~/.bashrc
  → dijalankan berkali-kali = baris hanya ditambahkan SEKALI ✅
```

| Practice | Contoh |
|----------|--------|
| Cek existing state sebelum membuat | `[[ -d "$DIR" ]] || mkdir -p "$DIR"` (bukan `mkdir "$DIR"` polos yang error kalau sudah ada — atau pakai `mkdir -p` yang aman dipanggil berulang) |
| Gunakan flag "-p" / "--force" yang aman | `mkdir -p`, `rm -f`, `ln -sf` |
| Cek sebelum append ke file | `grep -qxF "line" file || echo "line" >> file` |
| Gunakan `apply`/`ensure` pattern, bukan `create` | Cek dulu apakah resource sudah dalam state yang diinginkan, baru ubah kalau belum |

**Catatan:** Idempotency sangat penting untuk script yang dijalankan otomatis berkali-kali — startup script VM yang mungkin re-run saat reboot, script provisioning yang dijalankan ulang setelah gagal di tengah jalan, atau step CI/CD yang di-retry.

---

## 8. Logging dalam Script

```bash
#!/bin/bash
set -euo pipefail

LOG_FILE="/var/log/myapp/deploy.log"

log() {
    local LEVEL="$1"
    shift
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$LEVEL] $*" | tee -a "$LOG_FILE"
}

log INFO "Deploy dimulai"
log WARN "Config file tidak ditemukan, pakai default"
log ERROR "Deploy gagal di step 3"
```

| Practice | Alasan |
|----------|--------|
| Selalu sertakan timestamp | Memudahkan korelasi dengan event lain saat troubleshooting |
| Beri log level (INFO/WARN/ERROR) | Memudahkan filtering (`grep ERROR deploy.log`) |
| Log ke file DAN stdout (`tee -a`) | Bisa dilihat real-time saat run manual, tetap tersimpan untuk audit |
| Pisahkan log message dari return value function | Log ke stderr (`>&2`) kalau function juga `echo` data ke stdout |
| Log command penting sebelum eksekusi | Memudahkan reproduce masalah — apa command persis yang dijalankan |

**Best practice:** Untuk script yang dijalankan via cron atau CI/CD (tidak ada human langsung melihat output real-time), pastikan semua log **tersimpan ke file atau sistem logging terpusat** — jangan hanya print ke stdout yang akan hilang.

---

## 9. Checklist Production-Readiness

Cek semua poin ini sebelum script dianggap siap dipakai di production:

```
Struktur & Syntax:
  [ ] Shebang line di baris pertama (#!/bin/bash atau #!/usr/bin/env bash)
  [ ] set -euo pipefail di awal script
  [ ] Lolos ShellCheck tanpa warning level error
  [ ] Nama file dan permission benar (chmod +x kalau dieksekusi langsung)

Variable & Quoting:
  [ ] Semua variable di-quote: "$VAR", bukan $VAR
  [ ] Semua "$@" di-quote saat meneruskan argumen
  [ ] Tidak ada variable yang diasumsikan selalu ter-set (manfaatkan set -u)
  [ ] Default value untuk variable optional: "${VAR:-default}"

Error Handling:
  [ ] Setiap command penting dicek hasilnya (exit code atau if/else eksplisit)
  [ ] trap cleanup EXIT untuk resource sementara (temp file, lock, background process)
  [ ] Exit code yang jelas dan konsisten (0 = sukses, non-zero = gagal, dengan makna)
  [ ] Error message informatif, dikirim ke stderr (>&2)

Idempotency & Safety:
  [ ] Script aman dijalankan berkali-kali (idempotent)
  [ ] Tidak parsing output ls — pakai glob atau find
  [ ] Pakai [[ ]] bukan [ ] (kecuali butuh POSIX sh)
  [ ] Tidak ada hardcoded path/credential — pakai variable atau env var

Logging & Observability:
  [ ] Log dengan timestamp dan level (INFO/WARN/ERROR)
  [ ] Log tersimpan ke file (bukan cuma stdout) kalau dijalankan via cron/CI
  [ ] Command penting di-log sebelum dieksekusi

Testing:
  [ ] Sudah ditest di environment non-production dulu
  [ ] Sudah ditest kondisi gagal (misal: file tidak ada, network down)
  [ ] Sudah ditest --dry-run (kalau ada) sebelum eksekusi aktual
  [ ] Sudah direview oleh orang lain (code review), bukan hanya self-test
```

---

## Ringkasan Konsep

```
Quoting:
  "$VAR" bukan $VAR      → cegah word splitting & globbing

set -euo pipefail:
  -e            → exit kalau command gagal
  -u            → error kalau variable belum di-set
  -o pipefail   → exit code pipeline = command pertama yang gagal

Tools:
  ShellCheck    → static analysis, cek sebelum commit/deploy

Test bracket:
  [[ ]]  → gunakan ini (Bash), lebih aman & lebih banyak fitur
  [ ]    → hanya kalau butuh portability ke POSIX sh

trap:
  trap cleanup EXIT   → cleanup jalan apapun cara script berakhir

Idempotency:
  Cek state dulu sebelum ubah — script aman dijalankan berkali-kali

Logging:
  Timestamp + level + simpan ke file (bukan cuma stdout)

Checklist production:
  Struktur → Quoting → Error handling → Idempotency → Logging → Testing
```

---

*Dokumen ini berdasarkan Bash versi 5.x yang umum digunakan di distro modern per 2026.*
