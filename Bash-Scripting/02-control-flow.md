# Control Flow

Dokumentasi struktur kontrol di Bash — `if/elif/else`, test operators, `case`, loop (`for`, `while`, `until`), dan `break`/`continue`.

**Shell:** Bash 5.x

---

## if / elif / else

```
Struktur dasar:

  if [[ kondisi ]]; then
      # dijalankan kalau kondisi TRUE
  elif [[ kondisi lain ]]; then
      # dijalankan kalau kondisi pertama FALSE, kondisi ini TRUE
  else
      # dijalankan kalau semua kondisi FALSE
  fi
```

```bash
#!/bin/bash

CPU_USAGE=85

if [[ $CPU_USAGE -ge 90 ]]; then
    echo "CRITICAL: CPU usage $CPU_USAGE%"
elif [[ $CPU_USAGE -ge 70 ]]; then
    echo "WARNING: CPU usage $CPU_USAGE%"
else
    echo "OK: CPU usage $CPU_USAGE%"
fi
```

```
Flow evaluasi if/elif/else:

  if [[ cond1 ]]  ──true──► jalankan block 1 ──► selesai
       │false
       ▼
  elif [[ cond2 ]] ──true──► jalankan block 2 ──► selesai
       │false
       ▼
  else ──► jalankan block else ──► selesai
```

**Penting:** Bash mengeksekusi **hanya blok pertama** yang kondisinya TRUE, lalu langsung lompat ke `fi` — tidak seperti `switch` di bahasa lain yang bisa fall-through.

---

## Test Operators

Test operator dipakai di dalam `[[ ... ]]` (atau `[ ... ]`) untuk mengevaluasi kondisi.

### String Test Operators

| Operator | Arti | Contoh |
|----------|------|--------|
| `-z STRING` | TRUE jika string kosong (zero length) | `[[ -z "$VAR" ]]` |
| `-n STRING` | TRUE jika string TIDAK kosong | `[[ -n "$VAR" ]]` |
| `STRING1 == STRING2` | TRUE jika string sama | `[[ "$A" == "$B" ]]` |
| `STRING1 != STRING2` | TRUE jika string berbeda | `[[ "$A" != "$B" ]]` |
| `STRING1 < STRING2` | TRUE jika STRING1 secara alfabetis sebelum STRING2 (hanya di `[[ ]]`) | `[[ "$A" < "$B" ]]` |
| `STRING1 =~ REGEX` | TRUE jika STRING1 match dengan regex (hanya di `[[ ]]`) | `[[ "$A" =~ ^[0-9]+$ ]]` |

### Numeric Test Operators

| Operator | Arti | Contoh |
|----------|------|--------|
| `-eq` | Equal (sama) | `[[ $A -eq $B ]]` |
| `-ne` | Not equal (tidak sama) | `[[ $A -ne $B ]]` |
| `-gt` | Greater than (lebih besar) | `[[ $A -gt $B ]]` |
| `-ge` | Greater or equal (lebih besar sama dengan) | `[[ $A -ge $B ]]` |
| `-lt` | Less than (lebih kecil) | `[[ $A -lt $B ]]` |
| `-le` | Less or equal (lebih kecil sama dengan) | `[[ $A -le $B ]]` |

### File Test Operators

| Operator | Arti | Contoh |
|----------|------|--------|
| `-e FILE` | TRUE jika file/path ada (exists), apapun tipenya | `[[ -e "$FILE" ]]` |
| `-f FILE` | TRUE jika ada dan berupa **regular file** | `[[ -f "$FILE" ]]` |
| `-d FILE` | TRUE jika ada dan berupa **directory** | `[[ -d "$DIR" ]]` |
| `-L FILE` | TRUE jika berupa symbolic link | `[[ -L "$FILE" ]]` |
| `-r FILE` | TRUE jika file readable | `[[ -r "$FILE" ]]` |
| `-w FILE` | TRUE jika file writable | `[[ -w "$FILE" ]]` |
| `-x FILE` | TRUE jika file executable | `[[ -x "$FILE" ]]` |
| `-s FILE` | TRUE jika file ada dan **ukurannya > 0** | `[[ -s "$FILE" ]]` |
| `FILE1 -nt FILE2` | TRUE jika FILE1 lebih baru (newer than) dari FILE2 | `[[ "$A" -nt "$B" ]]` |

### Logical Operators

| Operator | Arti | Contoh |
|----------|------|--------|
| `&&` | AND (dalam `[[ ]]`) | `[[ -f "$FILE" && -r "$FILE" ]]` |
| `\|\|` | OR (dalam `[[ ]]`) | `[[ -z "$A" \|\| -z "$B" ]]` |
| `!` | NOT (negasi) | `[[ ! -f "$FILE" ]]` |

**Best practice:** Gunakan `[[ ... ]]` (Bash builtin) daripada `[ ... ]` (POSIX test command lama). `[[ ]]` lebih aman terhadap word splitting, mendukung `&&`/`||`/`=~` langsung, dan tidak perlu quote variable seketat `[ ]`. Detail perbandingan lengkap ada di [06-best-practices.md](06-best-practices.md).

```bash
FILE="/var/log/app.log"

if [[ -f "$FILE" && -s "$FILE" ]]; then
    echo "File ada dan tidak kosong"
fi

if [[ ! -d "/backup" ]]; then
    echo "Folder backup belum ada, membuat..."
    mkdir -p /backup
fi
```

---

## case Statement

`case` cocok untuk mengecek 1 variable terhadap **banyak pattern** — lebih rapi daripada `if/elif` berantai.

```bash
#!/bin/bash

ENV=$1

case "$ENV" in
    dev|development)
        echo "Deploy ke development environment"
        ;;
    staging)
        echo "Deploy ke staging environment"
        ;;
    prod|production)
        echo "Deploy ke PRODUCTION — butuh approval!"
        ;;
    *)
        echo "Environment tidak dikenal: $ENV"
        exit 1
        ;;
esac
```

```
Anatomi case:

  case "$VAR" in
      pattern1)
          # command
          ;;          ← wajib, menandakan akhir 1 branch
      pattern2|pattern3)   ← "|" berarti OR antar pattern
          # command
          ;;
      *)                   ← wildcard, catch-all (seperti "default")
          # command
          ;;
  esac                     ← "case" dibalik, menutup blok
```

**Catatan:** Pattern di `case` mendukung glob-style wildcard seperti `*.log`, `[0-9]*`, bukan full regex.

---

## for Loop

### Iterasi List

```bash
for SERVER in web-1 web-2 web-3; do
    echo "Checking $SERVER..."
done
```

### Iterasi Array

```bash
SERVERS=("web-1" "web-2" "web-3")

for SERVER in "${SERVERS[@]}"; do
    echo "Checking $SERVER..."
done
```

### Iterasi Output Command

```bash
for FILE in $(ls *.log); do
    echo "Processing $FILE"
done
```

**Penting:** Iterasi hasil `ls` seperti di atas **berisiko** kalau nama file mengandung spasi — lihat [06-best-practices.md](06-best-practices.md) untuk cara aman (`for FILE in *.log`).

### C-Style for Loop

```bash
for (( i=1; i<=5; i++ )); do
    echo "Iterasi ke-$i"
done
```

### seq / Range

```bash
for i in $(seq 1 5); do
    echo "Nomor: $i"
done

for i in {1..5}; do
    echo "Nomor: $i"
done

for i in {0..10..2}; do   # step 2
    echo "Angka genap: $i"
done
```

| Cara | Kapan Dipakai |
|------|----------------|
| `for i in {1..5}` | Range statis, diketahui saat menulis script (brace expansion, lebih cepat) |
| `for i in $(seq 1 5)` | Range yang bisa dinamis (misal dari variable: `seq 1 "$N"`) |
| `for (( i=1; i<=5; i++ ))` | Butuh step custom, kondisi kompleks, atau gaya C-style lebih familiar |

---

## while Loop

Jalankan blok berulang **selama** kondisi TRUE.

```bash
COUNT=0

while [[ $COUNT -lt 5 ]]; do
    echo "Count: $COUNT"
    ((COUNT++))
done
```

### Membaca File Baris per Baris

```bash
while IFS= read -r LINE; do
    echo "Baris: $LINE"
done < "servers.txt"
```

**Best practice:** Gunakan `while IFS= read -r LINE` untuk membaca file baris per baris — `IFS=` mencegah leading/trailing whitespace terpotong, dan `-r` mencegah backslash di-interpretasi sebagai escape character.

---

## until Loop

Kebalikan dari `while` — jalankan blok berulang **sampai** kondisi TRUE (selama kondisi masih FALSE).

```bash
COUNT=0

until [[ $COUNT -ge 5 ]]; do
    echo "Count: $COUNT"
    ((COUNT++))
done
```

```
Perbandingan while vs until:

  while [[ cond ]]     → loop SELAMA cond TRUE
  until [[ cond ]]     → loop SAMPAI cond TRUE (selama cond FALSE)

  Contoh sama, hasil sama:
  while [[ $COUNT -lt 5 ]]; do ...; done
  until  [[ $COUNT -ge 5 ]]; do ...; done
```

### Skenario Umum: Menunggu Service Siap

```bash
until curl -sf http://localhost:8080/health > /dev/null; do
    echo "Menunggu service siap..."
    sleep 2
done

echo "Service sudah siap!"
```

---

## break dan continue

| Keyword | Fungsi |
|---------|--------|
| `break` | Keluar dari loop **sepenuhnya** |
| `continue` | Skip ke iterasi **berikutnya**, tanpa keluar loop |
| `break N` | Keluar dari `N` level loop bersarang (nested loop) |
| `continue N` | Lanjut ke iterasi loop level `N` bersarang |

```bash
for SERVER in web-1 web-2 web-3 web-4; do
    if [[ "$SERVER" == "web-2" ]]; then
        echo "Skip $SERVER"
        continue
    fi

    if [[ "$SERVER" == "web-4" ]]; then
        echo "Stop di $SERVER"
        break
    fi

    echo "Processing $SERVER"
done

# Output:
# Processing web-1
# Skip web-2
# Processing web-3
# Stop di web-4
```

---

## Skenario: Health Check Banyak Server dengan Error Handling

```
Kebutuhan: cek health endpoint di 5 server, catat mana yang gagal,
tapi JANGAN stop keseluruhan script hanya karena 1 server down.
```

```bash
#!/bin/bash
#
# check-servers.sh - health check banyak server dengan error handling per iterasi

SERVERS=(
    "web-1.internal:8080"
    "web-2.internal:8080"
    "web-3.internal:8080"
    "api-1.internal:9090"
    "api-2.internal:9090"
)

FAILED_SERVERS=()
SUCCESS_COUNT=0

echo "=== Health Check Report ==="

for SERVER in "${SERVERS[@]}"; do
    HOST="${SERVER%%:*}"       # ambil bagian sebelum ":"
    PORT="${SERVER##*:}"       # ambil bagian setelah ":"

    echo -n "Checking $HOST:$PORT ... "

    # curl -sf: silent + fail on HTTP error, timeout 3 detik
    if curl -sf --max-time 3 "http://${HOST}:${PORT}/health" > /dev/null 2>&1; then
        echo "OK ✅"
        ((SUCCESS_COUNT++))
    else
        echo "FAILED ❌"
        FAILED_SERVERS+=("$SERVER")
        # TIDAK exit — lanjut cek server berikutnya
        continue
    fi
done

echo ""
echo "=== Summary ==="
echo "Sukses: $SUCCESS_COUNT / ${#SERVERS[@]}"

if [[ ${#FAILED_SERVERS[@]} -gt 0 ]]; then
    echo "Server bermasalah:"
    for FAILED in "${FAILED_SERVERS[@]}"; do
        echo "  - $FAILED"
    done
    exit 1     # exit non-zero supaya CI/CD atau cron tahu ada kegagalan
fi

echo "Semua server sehat ✅"
exit 0
```

```
Kenapa desain ini penting:

  ❌ Desain buruk: pakai `set -e` global lalu curl gagal → script
     langsung exit di server pertama yang down, server ke-2 dst
     TIDAK PERNAH dicek.

  ✅ Desain baik: setiap iterasi loop di-handle sendiri (if/else),
     kegagalan 1 server DICATAT tapi tidak menghentikan loop.
     Exit code non-zero baru diberikan di AKHIR, setelah semua
     server selesai dicek — cocok untuk dipakai di cron/CI dengan
     alerting yang akurat.
```

---

## Ringkasan Konsep

```
if/elif/else:
  if [[ cond ]]; then ... elif [[ cond ]]; then ... else ... fi

Test operators:
  String:  -z -n == != =~
  Numeric: -eq -ne -gt -ge -lt -le
  File:    -e -f -d -L -r -w -x -s -nt
  Logic:   && || !   (gunakan [[ ]], bukan [ ])

case:
  case "$VAR" in
      pattern) cmd ;;
      *) default ;;
  esac

for loop:
  for X in list; do ... done
  for (( i=0; i<N; i++ )); do ... done
  for i in {1..5}; do ... done

while / until:
  while [[ cond ]]; do ... done     → loop selama TRUE
  until [[ cond ]]; do ... done     → loop sampai TRUE

break / continue:
  break     → keluar loop sepenuhnya
  continue  → skip ke iterasi berikutnya

Prinsip error handling per-iterasi:
  Jangan exit di tengah loop hanya karena 1 item gagal —
  catat kegagalan, lanjutkan loop, exit non-zero di akhir.
```

---

*Dokumen ini berdasarkan Bash versi 5.x yang umum digunakan di distro modern per 2026.*
