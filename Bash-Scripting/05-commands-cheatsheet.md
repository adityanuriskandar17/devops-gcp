# Commands Cheatsheet

Referensi cepat syntax Bash yang sering dipakai sehari-hari — string, array, arithmetic, file test, loop, debugging flags, dan one-liners umum.

---

## String Operations

| Aksi | Cara |
|------|------|
| Panjang string | `${#VAR}` |
| Substring (offset, length) | `${VAR:OFFSET:LENGTH}` |
| Substring dari offset sampai akhir | `${VAR:OFFSET}` |
| Replace kemunculan pertama | `${VAR/old/new}` |
| Replace SEMUA kemunculan | `${VAR//old/new}` |
| Hapus prefix (pola terpendek match) | `${VAR#pattern}` |
| Hapus prefix (pola terpanjang match) | `${VAR##pattern}` |
| Hapus suffix (pola terpendek match) | `${VAR%pattern}` |
| Hapus suffix (pola terpanjang match) | `${VAR%%pattern}` |
| Uppercase semua | `${VAR^^}` |
| Lowercase semua | `${VAR,,}` |
| Default value kalau unset/empty | `${VAR:-default}` |
| Cek string kosong | `[[ -z "$VAR" ]]` |
| Cek string tidak kosong | `[[ -n "$VAR" ]]` |
| Concat string | `NEW="$A$B"` atau `NEW="${A}${B}"` |
| Gabung dengan separator | `NEW="${A}-${B}"` |

```bash
FILE="app.tar.gz"

echo "${#FILE}"          # 11 (panjang string)
echo "${FILE:0:3}"       # app
echo "${FILE%.gz}"       # app.tar          (hapus suffix .gz)
echo "${FILE%%.*}"       # app              (hapus suffix terpanjang mulai dari .)
echo "${FILE#*.}"        # tar.gz           (hapus prefix terpendek sampai .)

PATH_URL="https://api.example.com/v1/users"
echo "${PATH_URL##*/}"   # users            (ambil bagian setelah "/" terakhir)
echo "${PATH_URL%/*}"    # https://api.example.com/v1  (buang bagian setelah "/" terakhir)

NAME="devops"
echo "${NAME^^}"         # DEVOPS
echo "${NAME^}"          # Devops (kapital huruf pertama saja)
```

---

## Array Basics

| Aksi | Cara |
|------|------|
| Deklarasi array | `ARR=("a" "b" "c")` |
| Deklarasi array kosong | `ARR=()` |
| Akses elemen ke-N (index 0-based) | `${ARR[0]}` |
| Semua elemen (list terpisah) | `"${ARR[@]}"` |
| Jumlah elemen | `${#ARR[@]}` |
| Semua index | `"${!ARR[@]}"` |
| Tambah elemen di akhir | `ARR+=("d")` |
| Hapus elemen index N | `unset 'ARR[N]'` |
| Slice array (mulai index, jumlah) | `"${ARR[@]:1:2}"` |
| Associative array (deklarasi) | `declare -A MAP` |
| Associative array (isi) | `MAP[key]="value"` |
| Associative array (akses) | `${MAP[key]}` |
| Associative array (semua key) | `"${!MAP[@]}"` |

```bash
SERVERS=("web-1" "web-2" "web-3")

echo "${SERVERS[0]}"        # web-1
echo "${SERVERS[@]}"        # web-1 web-2 web-3
echo "${#SERVERS[@]}"       # 3

SERVERS+=("web-4")
echo "${SERVERS[@]}"        # web-1 web-2 web-3 web-4

unset 'SERVERS[1]'
echo "${SERVERS[@]}"        # web-1 web-3 web-4   (index 1 hilang, bukan re-index)

declare -A CONFIG
CONFIG[env]="production"
CONFIG[region]="asia-southeast2"

echo "${CONFIG[env]}"       # production
for KEY in "${!CONFIG[@]}"; do
    echo "$KEY = ${CONFIG[$KEY]}"
done
```

---

## Arithmetic: `(( ))` dan `$(( ))`

| Aksi | Cara |
|------|------|
| Evaluasi ekspresi aritmatika (statement) | `(( EXPRESSION ))` |
| Evaluasi ekspresi aritmatika (return value/substitution) | `RESULT=$(( EXPRESSION ))` |
| Increment | `((i++))` atau `((i+=1))` |
| Decrement | `((i--))` atau `((i-=1))` |
| Perbandingan dalam `(( ))` | `((a > b))`, `((a == b))` — pakai operator matematika biasa, bukan `-gt`/`-eq` |
| Modulo | `$((a % b))` |
| Pangkat | `$((a ** b))` |
| Pembagian integer | `$((a / b))` (hasil selalu integer, tidak ada desimal) |
| Increment variable langsung | `let i++` (alternatif lama, `(( ))` lebih umum) |

```bash
i=5
((i++))
echo "$i"                  # 6

TOTAL=$((10 + 20))
echo "$TOTAL"               # 30

if (( TOTAL > 25 )); then
    echo "Lebih dari 25"
fi

echo "$((7 % 3))"           # 1  (modulo)
echo "$((2 ** 8))"          # 256 (pangkat)
echo "$((7 / 2))"           # 3  (integer division, BUKAN 3.5)
```

**Catatan:** Bash **tidak mendukung floating point** secara native di `$(( ))` — untuk kalkulasi desimal, gunakan `awk` atau `bc`: `echo "7/2" | bc -l` atau `awk 'BEGIN{print 7/2}'`.

---

## File Test Operators

| Operator | Arti |
|----------|------|
| `-e FILE` | File/path ada (apapun tipenya) |
| `-f FILE` | Ada dan berupa regular file |
| `-d FILE` | Ada dan berupa directory |
| `-L FILE` | Symbolic link |
| `-s FILE` | Ada dan ukuran > 0 (tidak kosong) |
| `-r FILE` | Readable |
| `-w FILE` | Writable |
| `-x FILE` | Executable |
| `FILE1 -nt FILE2` | FILE1 lebih baru dari FILE2 |
| `FILE1 -ot FILE2` | FILE1 lebih lama dari FILE2 |

```bash
[[ -f "config.yaml" ]] && echo "Config file ada"
[[ -d "/var/log/app" ]] || mkdir -p /var/log/app
[[ -x "deploy.sh" ]] || chmod +x deploy.sh
[[ ! -s "output.log" ]] && echo "File kosong atau tidak ada"
```

---

## Loop Syntax Quick Reference

| Bentuk | Syntax |
|--------|--------|
| For — list | `for X in a b c; do ...; done` |
| For — array | `for X in "${ARR[@]}"; do ...; done` |
| For — C-style | `for (( i=0; i<N; i++ )); do ...; done` |
| For — range | `for i in {1..10}; do ...; done` |
| For — range dengan step | `for i in {0..20..5}; do ...; done` |
| While | `while [[ cond ]]; do ...; done` |
| Until | `until [[ cond ]]; do ...; done` |
| Baca file per baris | `while IFS= read -r LINE; do ...; done < file.txt` |
| Infinite loop | `while true; do ...; done` |
| Loop dengan break | `for X in list; do [[ cond ]] && break; done` |

```bash
for i in {1..3}; do echo "iterasi $i"; done

while IFS= read -r LINE; do
    echo "baris: $LINE"
done < servers.txt

while true; do
    echo "cek status..."
    sleep 5
done
```

---

## Debugging: `set -x` / `set -e` / `set -u` / `set -o pipefail`

| Flag | Fungsi | Aktifkan | Nonaktifkan |
|------|--------|----------|--------------|
| `set -x` | Print setiap command sebelum dieksekusi (trace mode) | `set -x` | `set +x` |
| `set -e` | Exit script segera kalau ada command yang gagal (exit code non-zero) | `set -e` | `set +e` |
| `set -u` | Error kalau memakai variable yang belum di-set (unset) | `set -u` | `set +u` |
| `set -o pipefail` | Exit code pipeline = exit code command TERAKHIR yang gagal (bukan cuma command paling akhir) | `set -o pipefail` | `set +o pipefail` |
| Kombinasi umum | Semua sekaligus | `set -euo pipefail` | — |

```bash
#!/bin/bash
set -euo pipefail

# set -x untuk debug sementara — nyalakan di bagian yang mau di-trace
set -x
echo "Debugging bagian ini"
CONFIG=$(cat config.json)
set +x    # matikan trace lagi setelah selesai

echo "Bagian ini tidak di-trace"
```

```bash
# Jalankan seluruh script dalam trace mode dari command line (tanpa edit file)
bash -x deploy.sh

# Cek syntax script tanpa benar-benar menjalankannya
bash -n deploy.sh
```

Detail lengkap tentang `set -euo pipefail` ada di [06-best-practices.md](06-best-practices.md).

---

## Common One-Liners

| Kebutuhan | Command |
|-----------|---------|
| Cek OS/distro | `cat /etc/os-release` |
| Cek jumlah CPU | `nproc` |
| Cek free memory | `free -h` |
| Cek disk usage | `df -h` |
| Cek proses pakai port tertentu | `lsof -i :8080` atau `ss -tulpn \| grep 8080` |
| Kill proses by port | `kill -9 $(lsof -t -i:8080)` |
| Cek IP address | `hostname -I` atau `ip a` |
| Loop retry sampai berhasil | `until CMD; do sleep 2; done` |
| Timeout untuk command | `timeout 10 CMD` |
| Ukur waktu eksekusi | `time CMD` |
| Cari file lebih besar dari 100MB | `find . -type f -size +100M` |
| Hapus file lebih lama dari 7 hari | `find . -type f -mtime +7 -delete` |
| Watch command tiap 2 detik | `watch -n 2 CMD` |
| Generate random string | `openssl rand -hex 16` |
| Cek exit code command terakhir | `echo $?` |
| Jalankan command di background | `CMD &` |
| Lihat job background | `jobs` |
| Bawa job background ke foreground | `fg %1` |
| Cek variable environment tertentu | `printenv VAR_NAME` |
| Print semua environment variable | `env` |

```bash
until curl -sf https://api.example.com/health > /dev/null; do
    echo "Menunggu API siap..."
    sleep 2
done

find /var/log -type f -mtime +30 -delete

time ./heavy-script.sh

timeout 5 curl https://slow-endpoint.example.com
```

---

*Dokumen ini berdasarkan Bash versi 5.x yang umum digunakan di distro modern per 2026.*
