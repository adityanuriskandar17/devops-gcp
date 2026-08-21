# Commands Cheatsheet

Kumpulan command Linux esensial sehari-hari, dikelompokkan per kategori: navigation, file operations, text processing, disk/storage, networking basics, archiving, search, dan redirection & pipes.

---

## Navigation

| Aksi | Cara |
|------|------|
| Lihat direktori sekarang | `pwd` |
| Pindah direktori | `cd /path/to/dir` |
| Kembali ke home directory | `cd` atau `cd ~` |
| Kembali ke direktori sebelumnya | `cd -` |
| Naik 1 level | `cd ..` |
| List isi direktori | `ls` |
| List detail (permission, owner, size) | `ls -l` |
| List termasuk hidden file | `ls -la` |
| List dengan ukuran human-readable | `ls -lh` |
| Tampilkan struktur direktori (tree) | `tree` (perlu install) atau `find . -maxdepth 2` |

```bash
pwd
cd /var/log
ls -lah
cd ~/projects/app
cd -                     # balik ke /var/log lagi
tree -L 2 /etc           # struktur 2 level ke bawah
```

---

## File Operations

| Aksi | Cara |
|------|------|
| Copy file | `cp source.txt dest.txt` |
| Copy direktori (recursive) | `cp -r sourcedir/ destdir/` |
| Move / rename | `mv old.txt new.txt` |
| Hapus file | `rm file.txt` |
| Hapus direktori (recursive) | `rm -rf dir/` |
| Buat direktori | `mkdir newdir` |
| Buat direktori bertingkat | `mkdir -p a/b/c` |
| Buat file kosong / update timestamp | `touch file.txt` |
| Lihat isi file | `cat file.txt` |
| Lihat isi file per halaman | `less file.txt` |
| Lihat N baris awal | `head -n 20 file.txt` |
| Lihat N baris akhir | `tail -n 20 file.txt` |
| Ikuti file secara real-time | `tail -f app.log` |
| Buat symlink | `ln -s /path/target linkname` |
| Cek tipe file | `file namafile` |

```bash
cp -r ./build /var/www/html/app
mv old-name.conf new-name.conf
rm -rf ./tmp-cache
mkdir -p /srv/app/logs/2026
touch newfile.txt
tail -f /var/log/nginx/access.log
ln -s /opt/app/current /opt/app/latest
```

**Penting:** `rm -rf` **tidak ada Recycle Bin** — file terhapus langsung dan permanen. Selalu double-check path sebelum eksekusi, terutama saat memakai wildcard (`rm -rf /path/*`).

---

## Text Processing: grep, sed, awk, cut, sort, uniq, wc

| Aksi | Cara |
|------|------|
| Cari pattern dalam file | `grep "pattern" file.txt` |
| Cari case-insensitive | `grep -i "pattern" file.txt` |
| Cari recursive di direktori | `grep -r "pattern" /path/` |
| Cari + tampilkan nomor baris | `grep -n "pattern" file.txt` |
| Cari yang TIDAK match | `grep -v "pattern" file.txt` |
| Cari dengan regex extended | `grep -E "pattern1|pattern2" file.txt` |
| Ganti teks (in-place) | `sed -i 's/old/new/g' file.txt` |
| Print baris tertentu | `sed -n '5,10p' file.txt` |
| Ambil kolom tertentu | `awk '{print $1}' file.txt` |
| Ambil kolom dengan delimiter custom | `awk -F',' '{print $2}' file.csv` |
| Ambil kolom (versi sederhana) | `cut -d',' -f2 file.csv` |
| Sort baris | `sort file.txt` |
| Sort numerik | `sort -n file.txt` |
| Sort descending | `sort -r file.txt` |
| Hilangkan duplikat baris berurutan | `uniq file.txt` |
| Hitung kemunculan duplikat | `sort file.txt \| uniq -c` |
| Hitung baris/kata/karakter | `wc -l file.txt` (baris), `wc -w` (kata), `wc -c` (karakter) |

```bash
# Cari error di log, case-insensitive, tampilkan nomor baris
grep -in "error" /var/log/app.log

# Ganti semua "staging" jadi "production" di file config
sed -i 's/staging/production/g' app.conf

# Ambil kolom ke-3 dari log yang delimiter-nya spasi
awk '{print $3}' access.log

# Ambil IP address terbanyak yang akses server (dari access.log)
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10

# Hitung jumlah baris di file
wc -l app.log
```

**Best practice:** Untuk analisis log cepat, kombinasi `grep | awk | sort | uniq -c | sort -rn` adalah pola paling umum untuk "hitung kemunculan terbanyak dari suatu field" — misal top IP, top error message, top endpoint yang di-hit.

---

## Disk / Storage: df, du, lsblk

| Aksi | Cara |
|------|------|
| Cek disk usage per filesystem | `df -h` |
| Cek inode usage | `df -i` |
| Cek ukuran direktori (total) | `du -sh /path/dir` |
| Cek ukuran tiap subdirektori | `du -h --max-depth=1 /path/dir` |
| List semua block device (disk & partisi) | `lsblk` |
| Detail partisi & filesystem | `lsblk -f` |
| Info detail 1 disk | `fdisk -l /dev/sda` (butuh sudo) |
| Cek disk mana yang paling banyak dipakai (top N) | `du -h /path \| sort -rh \| head -10` |

```bash
df -h                                   # disk usage, human-readable
df -i                                    # inode usage (bisa habis meski disk masih ada space)
du -sh /var/log                          # total ukuran /var/log
du -h --max-depth=1 /var | sort -rh       # ranking subdirektori terbesar di /var
lsblk                                     # lihat semua disk & partisi
lsblk -f                                  # + filesystem type & UUID
```

```
Output df -h contoh:

Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        20G   15G  4.2G   79% /
/dev/sda2       100G   85G   10G   90% /var
tmpfs           1.9G     0  1.9G    0% /dev/shm
                              │
                              └── ⚠ 90% used — waktunya investigasi/cleanup
```

**Penting:** Disk bisa terlihat masih ada space (`df -h`) tapi aplikasi tetap gagal menulis file — cek juga `df -i` (inode usage). Inode habis biasanya terjadi karena terlalu banyak file kecil (misal cache/session file yang tidak pernah dibersihkan), meskipun total ukuran byte-nya kecil.

---

## Networking Basics: ip, ss

| Aksi | Cara |
|------|------|
| Lihat semua interface & IP | `ip addr` (atau `ip a`) |
| Lihat routing table | `ip route` (atau `ip r`) |
| Lihat status link interface | `ip link` |
| Cek port yang listening | `ss -tuln` |
| Cek koneksi aktif + proses pemilik | `ss -tulnp` |
| Cek koneksi ke host tertentu | `ss -o state established '( dst 10.0.0.5 )'` |
| Test konektivitas | `ping host` |
| Trace jalur network | `traceroute host` (atau `tracepath host`) |
| DNS lookup | `dig domain.com` atau `nslookup domain.com` |
| Test koneksi ke port tertentu | `nc -zv host port` |

```bash
ip addr show                       # semua interface & IP address
ip route show                       # routing table

ss -tuln                            # semua port TCP/UDP yang listening
ss -tulnp                           # + nama proses/PID (butuh sudo untuk lihat proses lain)
ss -tan state established           # koneksi TCP yang established

ping -c 4 8.8.8.8                    # test konektivitas, 4 paket saja
dig api.example.com                   # cek DNS record
nc -zv api.example.com 443             # cek apakah port 443 terbuka
```

**Catatan:** `netstat` (perintah lama) sudah **deprecated** di banyak distro modern, digantikan oleh `ss` (dari paket `iproute2`) — lebih cepat dan tetap dipelihara aktif.

---

## Archiving: tar, gzip

| Aksi | Cara |
|------|------|
| Buat archive tar | `tar -cvf archive.tar folder/` |
| Buat archive tar + gzip | `tar -czvf archive.tar.gz folder/` |
| Extract tar | `tar -xvf archive.tar` |
| Extract tar.gz | `tar -xzvf archive.tar.gz` |
| Lihat isi archive tanpa extract | `tar -tvf archive.tar` |
| Extract ke direktori tertentu | `tar -xzvf archive.tar.gz -C /target/dir` |
| Compress file tunggal | `gzip file.txt` (hasil: `file.txt.gz`) |
| Decompress | `gunzip file.txt.gz` |
| Compress tanpa hapus file asli | `gzip -k file.txt` |

```bash
tar -czvf backup-2026-08-21.tar.gz /var/www/html    # backup + compress
tar -tvf backup-2026-08-21.tar.gz                     # cek isi tanpa extract
tar -xzvf backup-2026-08-21.tar.gz -C /restore/path    # extract ke lokasi lain

gzip access.log                                        # jadi access.log.gz
gunzip access.log.gz                                    # kembalikan jadi access.log
```

| Flag tar | Arti |
|----------|------|
| `-c` | create (buat archive baru) |
| `-x` | extract |
| `-t` | list isi (tanpa extract) |
| `-v` | verbose (tampilkan progress) |
| `-z` | filter melalui gzip (compress/decompress) |
| `-f` | tentukan nama file archive (harus di akhir sebelum nama file) |

---

## Search: find, locate

| Aksi | Cara |
|------|------|
| Cari file berdasarkan nama | `find /path -name "*.log"` |
| Cari case-insensitive | `find /path -iname "*.LOG"` |
| Cari berdasarkan tipe | `find /path -type f` (file) / `-type d` (direktori) |
| Cari berdasarkan ukuran | `find /path -size +100M` |
| Cari berdasarkan waktu modifikasi | `find /path -mtime -7` (7 hari terakhir) |
| Cari + eksekusi command | `find /path -name "*.tmp" -exec rm {} \;` |
| Cari file dengan permission tertentu | `find / -perm -4000 -type f` (cari setuid) |
| Cari cepat via database index | `locate filename` (butuh `updatedb` sebelumnya) |
| Update database locate | `sudo updatedb` |

```bash
find /var/log -name "*.log" -mtime +30                # log lebih tua dari 30 hari
find /var/log -name "*.log" -mtime +30 -delete          # sekaligus hapus
find / -type f -size +500M 2>/dev/null                   # cari file besar (>500MB)
find / -perm -4000 -type f 2>/dev/null                    # audit binary setuid

locate nginx.conf                                          # cari cepat via index
sudo updatedb                                                # refresh index locate
```

**Best practice:** `find ... -exec ... \;` menjalankan command sekali per file (lebih lambat untuk banyak file) — gunakan `find ... -exec ... +` atau `find ... | xargs` untuk batch execution yang lebih efisien pada jumlah file besar.

---

## Redirection & Pipes

```
Konsep dasar:

  stdin  (0) → input ke command
  stdout (1) → output normal
  stderr (2) → output error

  command > file        → redirect stdout, OVERWRITE file
  command >> file        → redirect stdout, APPEND ke file
  command 2> file         → redirect stderr saja
  command > file 2>&1      → redirect stdout DAN stderr ke file yang sama
  command1 | command2       → pipe, output command1 jadi input command2
```

| Aksi | Cara |
|------|------|
| Redirect stdout ke file (overwrite) | `command > output.txt` |
| Redirect stdout ke file (append) | `command >> output.txt` |
| Redirect stderr saja | `command 2> error.txt` |
| Redirect stdout + stderr ke file sama | `command > all.txt 2>&1` |
| Buang output (tidak butuh sama sekali) | `command > /dev/null 2>&1` |
| Pipe output ke command lain | `command1 \| command2` |
| Pipe + filter dengan grep | `ps aux \| grep nginx` |
| Ambil input dari file (bukan keyboard) | `command < input.txt` |
| Tee — tampilkan DAN simpan ke file | `command \| tee output.txt` |

```bash
# Jalankan script, simpan semua output (stdout+stderr) ke log
./deploy.sh > deploy.log 2>&1

# Jalankan di background, buang semua output
long-task.sh > /dev/null 2>&1 &

# Pipe: cari proses nginx yang berjalan
ps aux | grep nginx | grep -v grep

# Tee: lihat output di terminal SEKALIGUS simpan ke file
./build.sh | tee build.log

# Gabungan: filter log lalu simpan hasil filter ke file baru
grep "ERROR" app.log | tee errors-only.log
```

---

*Dokumen ini berdasarkan Linux (kernel, distro, dan tooling) yang stabil dan didukung luas per 2026.*
