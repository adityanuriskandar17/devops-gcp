# Text Processing

Dokumentasi text processing di Bash — `grep`, `sed`, `awk`, `cut`, `sort`, `uniq`, `tr`, pipes & redirection, here-document, dan process substitution.

**Shell:** Bash 5.x

---

## Tools Text Processing: Kapan Pakai Yang Mana

```
Pipeline khas DevOps:

  cat file.log | grep "ERROR" | awk '{print $4}' | sort | uniq -c | sort -rn
       │             │              │                │       │        │
       │             │              │                │       │        └─ urut dari terbanyak
       │             │              │                │       └─ hitung + hilangkan duplikat
       │             │              │                └─ urutkan dulu (uniq butuh input urut)
       │             │              └─ ambil kolom ke-4
       │             └─ filter baris yang mengandung "ERROR"
       └─ baca file
```

| Tool | Fungsi Utama | Kapan Dipakai |
|------|---------------|-----------------|
| `grep` | Cari/filter baris berdasarkan pattern | Filter baris yang match keyword atau regex |
| `sed` | Stream editor — cari & ganti (replace) teks, hapus baris | Modifikasi teks in-place atau streaming, substitusi |
| `awk` | Text processing berbasis kolom + logic (mini bahasa programming) | Ekstrak kolom, agregasi, kalkulasi, format ulang output |
| `cut` | Ekstrak kolom berdasarkan delimiter atau posisi karakter | Ambil kolom sederhana tanpa logic tambahan |
| `sort` | Urutkan baris | Urutkan sebelum `uniq`, ranking, alphabetical/numeric order |
| `uniq` | Hilangkan baris duplikat berurutan, atau hitung jumlah duplikat | Deduplikasi, counting occurrence (`uniq -c`) |
| `tr` | Translate/hapus karakter | Ubah huruf besar/kecil, hapus karakter tertentu, ganti delimiter |

**Best practice:** Gunakan tool **paling sederhana yang cukup** untuk tugasnya — kalau cuma butuh ambil kolom, `cut` lebih ringan daripada `awk`. Tapi begitu butuh logic (kondisi, kalkulasi, multiple field), `awk` jauh lebih tepat daripada memaksakan kombinasi `grep`+`cut`+`sed` yang rumit.

---

## grep

```bash
grep "ERROR" app.log                 # cari baris mengandung "ERROR"
grep -i "error" app.log               # case-insensitive
grep -v "DEBUG" app.log               # invert — tampilkan yang TIDAK match
grep -c "ERROR" app.log               # hitung jumlah baris yang match
grep -n "ERROR" app.log               # tampilkan nomor baris
grep -E "ERROR|WARN" app.log          # extended regex — multiple pattern
grep -r "TODO" ./src                  # rekursif ke semua file dalam folder
grep -A 3 -B 1 "ERROR" app.log        # tampilkan 3 baris After, 1 baris Before
```

| Flag | Fungsi |
|------|--------|
| `-i` | Case-insensitive |
| `-v` | Invert match (tampilkan yang tidak match) |
| `-c` | Hitung jumlah baris match |
| `-n` | Tampilkan nomor baris |
| `-E` | Extended regex (`\|`, `+`, `?` tanpa escape) |
| `-r` / `-R` | Rekursif ke sub-directory |
| `-A N` / `-B N` / `-C N` | Tampilkan N baris after/before/context |

---

## sed

`sed` (stream editor) paling sering dipakai untuk **cari & ganti** teks.

```bash
sed 's/error/ERROR/' app.log            # ganti kemunculan PERTAMA di tiap baris
sed 's/error/ERROR/g' app.log           # ganti SEMUA kemunculan (global) di tiap baris
sed -i 's/error/ERROR/g' app.log        # -i = edit file langsung (in-place)
sed -i.bak 's/error/ERROR/g' app.log    # in-place, tapi backup ke app.log.bak dulu
sed '/DEBUG/d' app.log                  # hapus baris yang mengandung "DEBUG"
sed -n '10,20p' app.log                 # tampilkan hanya baris 10-20
```

**Penting:** `sed -i` (tanpa suffix) langsung mengubah file asli **tanpa backup**. Selalu gunakan `sed -i.bak` saat masih testing, atau pastikan file sudah di-backup/di-version-control sebelum pakai `-i` langsung di production.

---

## awk

`awk` memproses teks **per baris, per kolom** (field), dengan `$1`, `$2`, dst sebagai kolom (default delimiter: whitespace).

```bash
awk '{print $1}' access.log                  # print kolom ke-1
awk '{print $1, $4}' access.log                # print kolom 1 dan 4
awk -F',' '{print $2}' data.csv                # ganti delimiter jadi koma
awk '{sum += $3} END {print sum}' data.txt      # total kolom 3
awk '$3 > 100 {print $1}' data.txt              # filter: hanya baris kolom 3 > 100
awk 'NR==5' file.txt                            # tampilkan hanya baris ke-5
awk '{print NR, $0}' file.txt                   # tambahkan nomor baris di depan
```

| Variable Built-in awk | Arti |
|------------------------|------|
| `$0` | Seluruh baris |
| `$1`, `$2`, ... | Kolom ke-1, ke-2, dst |
| `NF` | Jumlah field/kolom di baris saat ini |
| `NR` | Nomor baris (record) saat ini |
| `FS` | Field separator (delimiter kolom), sama dengan `-F` |

```bash
# Contoh gabungan: hitung total request per status code dari access log
awk '{print $9}' access.log | sort | uniq -c | sort -rn
#   1523 200
#     87 404
#     12 500
```

---

## cut

Ekstrak kolom berdasarkan **delimiter** atau **posisi karakter** — lebih sederhana dari `awk` kalau tidak butuh logic.

```bash
cut -d',' -f2 data.csv           # ambil kolom ke-2, delimiter koma
cut -d':' -f1 /etc/passwd         # ambil kolom ke-1 (username), delimiter ":"
cut -c1-10 file.txt                # ambil karakter ke-1 sampai ke-10 tiap baris
cut -d' ' -f1,3 file.txt           # ambil kolom 1 DAN 3
```

---

## sort dan uniq

```bash
sort file.txt                   # urutkan alfabetis
sort -n numbers.txt              # urutkan numerik (bukan string!)
sort -r file.txt                 # urutkan descending (terbalik)
sort -k2 data.txt                # urutkan berdasarkan kolom ke-2
sort -u file.txt                 # urutkan + hilangkan duplikat sekaligus

uniq file.txt                    # hilangkan baris duplikat BERURUTAN
uniq -c file.txt                 # hitung jumlah kemunculan tiap baris unik
sort file.txt | uniq -c | sort -rn   # pola umum: ranking baris paling sering muncul
```

**Penting:** `uniq` hanya menghilangkan duplikat yang **berurutan** (adjacent) — karena itu hampir selalu dipakai setelah `sort`, supaya baris yang sama sudah berdekatan.

---

## tr

Translate atau hapus karakter (bekerja per-karakter, bukan per-baris seperti `sed`).

```bash
echo "Hello World" | tr 'a-z' 'A-Z'      # jadi huruf besar semua: HELLO WORLD
echo "Hello World" | tr -d ' '             # hapus semua spasi: HelloWorld
echo "a,b,c" | tr ',' '\n'                 # ganti koma jadi newline (delimiter → baris)
cat file.txt | tr -s ' '                   # squeeze — gabungkan spasi berulang jadi 1
```

---

## Pipes dan Redirection

```
Diagram File Descriptor:

  ┌──────────────────────────────────────────────┐
  │  Setiap command punya 3 file descriptor default: │
  │                                                  │
  │    0 = stdin   (input)                            │
  │    1 = stdout  (output normal)                    │
  │    2 = stderr  (output error)                     │
  └──────────────────────────────────────────────┘
```

| Operator | Fungsi | Contoh |
|----------|--------|--------|
| `\|` | Pipe — output command kiri jadi input command kanan | `ls \| grep ".log"` |
| `>` | Redirect stdout, **overwrite** file | `echo "hi" > out.txt` |
| `>>` | Redirect stdout, **append** ke file | `echo "hi" >> out.txt` |
| `<` | Redirect stdin dari file | `sort < names.txt` |
| `2>` | Redirect stderr saja | `command 2> error.log` |
| `2>&1` | Redirect stderr **ke tempat yang sama dengan stdout** | `command > all.log 2>&1` |
| `&>` | Redirect stdout DAN stderr sekaligus (Bash shortcut) | `command &> all.log` |
| `/dev/null` | "Buang" output — tidak disimpan di mana pun | `command > /dev/null 2>&1` |

```
Kenapa urutan 2>&1 penting:

  command > all.log 2>&1
       │        │
       │        └─ SETELAH stdout diarahkan ke all.log, stderr
       │           ikut diarahkan ke tempat yang SAMA (all.log)
       └─ stdout diarahkan ke all.log dulu

  command 2>&1 > all.log     ❌ SALAH URUTAN!
       │    │
       │    └─ stderr diarahkan ke stdout (yang saat ini masih terminal)
       └─ BARU SETELAH itu stdout diarahkan ke all.log
       → hasilnya: stderr tetap tampil di terminal, TIDAK masuk all.log
```

**Best practice:** Untuk menggabungkan stdout dan stderr ke 1 file, selalu tulis `> file 2>&1` (bukan `2>&1 > file`) — urutan menentukan hasil.

```bash
# Contoh redirection dalam script backup
backup.sh > /var/log/backup.log 2>&1
```

---

## Here-Document (`<<EOF`)

Here-document mengizinkan menulis **multi-line string** langsung di script, sering dipakai untuk generate config file atau kirim banyak baris ke command lain.

```bash
cat <<EOF > config.yaml
name: myapp
env: production
replicas: 3
EOF
```

```bash
# Dengan variable expansion (default behavior)
NAME="myapp"
cat <<EOF
Deploying app: $NAME
Waktu: $(date)
EOF
```

```bash
# Tanpa variable expansion — quote delimiter dengan single quote
cat <<'EOF'
Ini $NAME TIDAK di-expand, tampil literal apa adanya.
EOF
```

| Bentuk | Variable Expansion? |
|--------|------------------------|
| `<<EOF ... EOF` | Ya, `$VAR` dan `$(cmd)` di-expand |
| `<<'EOF' ... EOF` | Tidak, semuanya literal |
| `<<-EOF ... EOF` | Ya, DAN mengizinkan leading tab di baris penutup `EOF` diabaikan (untuk indentasi rapi dalam script) |

---

## Process Substitution

Process substitution (`<(...)` dan `>(...)`) memperlakukan **output sebuah command** seolah-olah itu adalah file — berguna ketika command butuh nama file sebagai argumen, bukan input via pipe.

```bash
# Membandingkan output 2 command langsung, tanpa file temporary manual
diff <(ls /folder-a) <(ls /folder-b)

# Setara secara konsep dengan (tapi tanpa file temp manual):
ls /folder-a > /tmp/a.txt
ls /folder-b > /tmp/b.txt
diff /tmp/a.txt /tmp/b.txt
rm /tmp/a.txt /tmp/b.txt
```

```bash
# Contoh lain: bandingkan hasil query database sebelum & sesudah migration
diff <(mysql -e "SELECT * FROM users ORDER BY id" old_db) \
     <(mysql -e "SELECT * FROM users ORDER BY id" new_db)
```

**Catatan:** Process substitution adalah fitur **Bash-specific** (tidak ada di POSIX `sh`) — hindari kalau script harus portable ke shell lain.

---

## Skenario: Parsing Log File untuk Ekstrak dan Hitung Error Pattern

```
Kebutuhan: dari file access.log berformat umum (Apache/Nginx-style),
ekstrak semua baris dengan HTTP status 4xx/5xx, kelompokkan per
status code, dan tampilkan ranking status code paling sering terjadi.

Contoh isi access.log:
  192.168.1.10 - - [21/Aug/2026:10:00:01] "GET /api/users HTTP/1.1" 200 512
  192.168.1.11 - - [21/Aug/2026:10:00:02] "GET /api/orders HTTP/1.1" 500 128
  192.168.1.12 - - [21/Aug/2026:10:00:03] "GET /api/missing HTTP/1.1" 404 64
  192.168.1.10 - - [21/Aug/2026:10:00:04] "POST /api/login HTTP/1.1" 500 96
```

```bash
#!/bin/bash
#
# parse-errors.sh - ekstrak & hitung error pattern dari access log

set -euo pipefail

LOG_FILE="${1:-access.log}"

if [[ ! -f "$LOG_FILE" ]]; then
    echo "Error: file $LOG_FILE tidak ditemukan" >&2
    exit 1
fi

echo "=== Error Report: $LOG_FILE ==="
echo ""

# Ambil status code (kolom kedua dari belakang, sebelum response size),
# filter yang 4xx/5xx, hitung dan urutkan dari yang paling sering
echo "-- Ranking status code error (4xx/5xx) --"
awk '{print $(NF-1)}' "$LOG_FILE" \
    | grep -E '^[45][0-9]{2}$' \
    | sort \
    | uniq -c \
    | sort -rn

echo ""

TOTAL_LINES=$(wc -l < "$LOG_FILE")
TOTAL_ERRORS=$(awk '{print $(NF-1)}' "$LOG_FILE" | grep -cE '^[45][0-9]{2}$' || true)

echo "-- Summary --"
echo "Total request : $TOTAL_LINES"
echo "Total error    : $TOTAL_ERRORS"

if [[ "$TOTAL_ERRORS" -gt 0 ]]; then
    ERROR_RATE=$(awk -v e="$TOTAL_ERRORS" -v t="$TOTAL_LINES" 'BEGIN { printf "%.2f", (e/t)*100 }')
    echo "Error rate     : ${ERROR_RATE}%"
fi

echo ""
echo "-- Detail: 5 IP dengan error terbanyak --"
awk '$(NF-1) ~ /^[45][0-9]{2}$/ {print $1}' "$LOG_FILE" \
    | sort \
    | uniq -c \
    | sort -rn \
    | head -5
```

```bash
./parse-errors.sh access.log
```

```
=== Error Report: access.log ===

-- Ranking status code error (4xx/5xx) --
      2 500
      1 404

-- Summary --
Total request : 4
Total error    : 3
Error rate     : 75.00%

-- Detail: 5 IP dengan error terbanyak --
      2 192.168.1.10
      1 192.168.1.11
      1 192.168.1.12
```

---

## Ringkasan Konsep

```
Tool utama:
  grep    → filter/cari baris berdasarkan pattern
  sed     → cari & ganti teks, hapus baris (stream editor)
  awk     → processing per kolom + logic (paling powerful)
  cut     → ekstrak kolom sederhana
  sort    → urutkan baris (alphabetical/numeric)
  uniq    → hilangkan duplikat berurutan / hitung occurrence
  tr      → translate/hapus karakter

Pola umum:
  sort | uniq -c | sort -rn   → ranking "paling sering muncul"

Redirection:
  |        → pipe antar command
  >  >>    → redirect stdout (overwrite / append)
  2>       → redirect stderr saja
  2>&1     → gabung stderr ke stdout (urutan penting!)
  <        → redirect stdin dari file

Here-document:
  <<EOF ... EOF      → multi-line string, variable di-expand
  <<'EOF' ... EOF    → multi-line string, literal (no expansion)

Process substitution:
  <(command)   → treat command output sebagai file (Bash-only)
```

---

*Dokumen ini berdasarkan Bash versi 5.x yang umum digunakan di distro modern per 2026.*
