# Process Management

Dokumentasi pengelolaan **proses** di Linux — process state, job control (foreground/background), tools monitoring (`ps`/`top`/`htop`), signals, dasar-dasar **systemd** unit, `systemctl`, `journalctl`, dan skenario debugging proses yang hang di production.

---

## Process States

Setiap proses di Linux berada di salah satu state berikut, bisa dilihat lewat `ps` atau `top`.

```
Process State Diagram:

           ┌──────────────┐
           │   R (Running) │◄──────────┐
           │  atau Runnable │           │
           └──────┬───────┘           │
                  │                    │ scheduled kembali
      butuh I/O   │  dikasih CPU time  │
                  ▼                    │
           ┌──────────────┐           │
           │  S (Sleeping)  │───────────┘
           │  interruptible │
           └──────┬───────┘
                  │
      sleep tidak bisa diinterupsi (biasanya I/O disk)
                  ▼
           ┌──────────────┐
           │  D (Disk sleep)│  ← uninterruptible, tidak respons sinyal
           └──────────────┘

           ┌──────────────┐
           │  T (Stopped)   │  ← dihentikan sinyal (SIGSTOP/Ctrl+Z)
           └──────────────┘

           ┌──────────────┐
           │  Z (Zombie)    │  ← proses selesai, tapi parent belum
           │                │     "reap" exit status-nya
           └──────────────┘
```

| State | Kode | Arti |
|-------|------|------|
| Running | `R` | Sedang dieksekusi CPU, atau siap dieksekusi (runnable) |
| Sleeping | `S` | Menunggu event (I/O, timer) — interruptible, bisa dibangunkan sinyal |
| Disk Sleep | `D` | Menunggu I/O disk — uninterruptible, tidak merespons sinyal apa pun kecuali `SIGKILL` bahkan bisa gagal |
| Stopped | `T` | Dihentikan sementara, misal via `Ctrl+Z` atau `SIGSTOP` |
| Zombie | `Z` | Proses sudah selesai (exited), tapi entry-nya masih ada di process table karena parent belum memanggil `wait()` |

**Catatan:** Proses **zombie** sudah tidak memakai CPU/memory — hanya menyisakan entry kecil di process table. Zombie yang menumpuk banyak biasanya menandakan **bug di aplikasi parent** yang tidak pernah `wait()` child process-nya, bukan masalah resource langsung.

---

## Foreground vs Background Jobs

```
Job Control Flow:

  $ long-running-command
       │
       │  Ctrl+Z → suspend (jadi Stopped, T)
       ▼
  $ jobs
  [1]+  Stopped    long-running-command
       │
       │  bg %1 → lanjutkan di background
       ▼
  [1]+  Running    long-running-command &
       │
       │  fg %1 → bawa kembali ke foreground
       ▼
  long-running-command (kembali menempel ke terminal)
```

| Command | Fungsi |
|---------|--------|
| `command &` | Jalankan langsung di background |
| `Ctrl+Z` | Suspend proses foreground yang sedang jalan (jadi state Stopped) |
| `jobs` | List semua job (background/stopped) di shell session ini |
| `fg %N` | Bawa job nomor N ke foreground |
| `bg %N` | Lanjutkan job nomor N di background |
| `kill %N` | Kirim signal ke job nomor N |
| `nohup command &` | Jalankan command yang **tetap hidup** meski terminal/SSH session ditutup (ignore SIGHUP) |
| `disown %N` | Lepaskan job dari kontrol shell — job tetap jalan meski shell ditutup, tapi tidak seperti nohup, output tidak otomatis di-redirect |

```bash
# Jalankan proses lama, biarkan tetap hidup setelah logout SSH
nohup ./long-running-script.sh > output.log 2>&1 &

# Cek job aktif di session ini
jobs -l

# Kirim proses yang sedang jalan di foreground ke background
# (setelah Ctrl+Z, lalu ketik:)
bg

# Disown job supaya benar-benar lepas dari shell
disown -h %1
```

**Best practice:** Untuk proses yang harus tetap jalan lama setelah SSH session ditutup (misal deploy script), lebih baik pakai `systemd` service atau `tmux`/`screen` daripada `nohup &` — lebih mudah dimonitor, restart otomatis, dan logging-nya lebih rapi lewat `journalctl`.

---

## Monitoring Proses: ps, top, htop

| Tool | Karakteristik | Kapan Dipakai |
|------|----------------|-----------------|
| `ps` | Snapshot sekali (point-in-time), scriptable | Cek cepat / dipakai dalam script otomatisasi |
| `top` | Real-time, interactive, built-in di semua distro | Monitoring cepat tanpa install tambahan |
| `htop` | Real-time, interactive, UI lebih enak (warna, scroll, tree view) | Monitoring interaktif — butuh install manual |

```bash
# ps — snapshot proses
ps aux                       # semua proses, format lengkap (user, %cpu, %mem, dll)
ps aux --sort=-%cpu | head   # top 10 proses berdasarkan CPU usage
ps aux --sort=-%mem | head   # top 10 proses berdasarkan memory usage
ps -ef                        # format alternatif (System V style)
ps -p 1234                    # detail proses dengan PID 1234
ps --forest                   # tampilkan parent-child tree

# top — interactive, real-time
top                            # tampilkan semua proses, update per interval
#  di dalam top:
#    q → quit, k → kill proses, M → sort by memory, P → sort by CPU

# htop (perlu install: apt install htop / dnf install htop)
htop
```

```
ps aux — kolom penting:

  USER   PID  %CPU %MEM   VSZ    RSS   TTY   STAT START   TIME COMMAND
  root     1   0.0  0.1  22000  9000   ?     Ss   08:00   0:03 /sbin/init
  www-data 512 15.2  2.1  80000 42000   ?     S    09:15   1:20 nginx: worker
                                                │
                                                └── STAT: state proses (R/S/D/T/Z)
                                                    + modifier (s=session leader,
                                                    l=multi-thread, +=foreground)
```

---

## Signals

Signal adalah cara kernel/proses lain **berkomunikasi** dengan sebuah proses — biasanya untuk minta proses berhenti, reload, atau merespons kondisi tertentu.

```
Flow: Kirim signal ke proses

  $ kill -SIGTERM 1234        atau        $ kill -15 1234
              │
              ▼
  ┌────────────────────────────────────────────┐
  │  Proses PID 1234 menerima SIGTERM            │
  │                                             │
  │  Jika proses handle signal ini:               │
  │    → cleanup (tutup koneksi, flush data)      │
  │    → exit dengan graceful                     │
  │                                             │
  │  Jika proses TIDAK bisa di-terminate biasa:   │
  │    → kirim SIGKILL (-9) sebagai last resort   │
  │    → kernel langsung matikan, TANPA cleanup   │
  └────────────────────────────────────────────┘
```

| Signal | Nomor | Bisa Ditangkap/Diabaikan? | Arti / Kegunaan |
|--------|-------|------------------------------|-------------------|
| `SIGHUP` | 1 | Ya | Hangup — dulu berarti terminal terputus; sekarang umum dipakai untuk **reload config** tanpa restart (misal `nginx`, `sshd`) |
| `SIGINT` | 2 | Ya | Interrupt — dikirim saat user tekan `Ctrl+C` |
| `SIGQUIT` | 3 | Ya | Quit — seperti SIGINT tapi memicu core dump |
| `SIGKILL` | 9 | **Tidak** | Paksa terminate langsung oleh kernel, tanpa kesempatan cleanup — last resort |
| `SIGTERM` | 15 | Ya | Terminate — cara **standar & sopan** untuk minta proses berhenti (default signal dari `kill`) |
| `SIGSTOP` | 19 | **Tidak** | Suspend proses (tidak bisa diabaikan), setara `Ctrl+Z` tapi tidak bisa ditangkap aplikasi |
| `SIGCONT` | 18 | Ya | Lanjutkan proses yang di-suspend |
| `SIGUSR1` / `SIGUSR2` | 10 / 12 | Ya | User-defined — aplikasi bisa pakai untuk trigger custom action (misal: rotate log) |

```bash
kill -15 1234          # SIGTERM (default), minta proses berhenti dengan sopan
kill -9 1234            # SIGKILL, paksa matikan (kalau SIGTERM tidak berhasil)
kill -HUP 1234           # SIGHUP, reload config (untuk service yang support ini)
killall nginx             # kirim signal (default SIGTERM) ke semua proses bernama "nginx"
pkill -f "python app.py"  # kill berdasarkan pattern command line
```

**Best practice:** Selalu coba `SIGTERM` (`kill -15` atau `kill` tanpa flag) dulu sebelum `SIGKILL` (`kill -9`). SIGTERM memberi kesempatan aplikasi untuk cleanup (tutup koneksi database, flush buffer, hapus lock file) — SIGKILL langsung memutus paksa tanpa itu, berisiko corrupt data atau meninggalkan resource menggantung.

---

## Systemd: Unit, Service, Timer, Target

**systemd** adalah init system (PID 1) di hampir semua distro modern (Ubuntu, Debian, RHEL, Fedora, dll) — mengatur startup, dependency, dan lifecycle semua service di sistem.

```
Systemd Unit Types (yang paling umum):

  ┌────────────────────────────────────────────────────┐
  │  .service  → definisi 1 service/daemon                │
  │              (nginx.service, sshd.service, dll)        │
  │                                                       │
  │  .timer    → penjadwal, mirip cron tapi terintegrasi   │
  │              dengan systemd (backup.timer)              │
  │                                                       │
  │  .target   → grup dari beberapa unit, semacam           │
  │              "runlevel" modern (multi-user.target)      │
  │                                                       │
  │  .socket   → activation berbasis socket (proses baru    │
  │              start saat ada koneksi masuk)               │
  │                                                       │
  │  .mount    → definisi mount point filesystem             │
  └────────────────────────────────────────────────────┘
```

### Contoh Unit File (.service)

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application Service
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/run.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

| Section | Fungsi |
|---------|--------|
| `[Unit]` | Metadata & dependency — `Description`, `After` (urutan start), `Requires` |
| `[Service]` | Cara service dijalankan — `ExecStart`, `Restart`, `User`, `WorkingDirectory` |
| `[Install]` | Target mana yang meng-enable unit ini — `WantedBy=multi-user.target` |

### systemctl

| Command | Fungsi |
|---------|--------|
| `systemctl start NAME` | Jalankan service sekarang |
| `systemctl stop NAME` | Hentikan service sekarang |
| `systemctl restart NAME` | Stop lalu start ulang |
| `systemctl reload NAME` | Reload config tanpa restart penuh (kalau service support) |
| `systemctl enable NAME` | Set service auto-start saat boot |
| `systemctl disable NAME` | Cabut auto-start saat boot |
| `systemctl status NAME` | Lihat status, PID, log terakhir |
| `systemctl daemon-reload` | Reload systemd setelah edit unit file |
| `systemctl list-units --type=service` | List semua service yang aktif |
| `systemctl is-enabled NAME` | Cek apakah service auto-start saat boot |
| `systemctl is-active NAME` | Cek apakah service sedang jalan |

```bash
sudo systemctl daemon-reload         # wajib setelah edit .service file
sudo systemctl enable --now myapp     # enable + start langsung dalam 1 command
sudo systemctl status myapp
sudo systemctl restart myapp
```

### journalctl (Logs dari systemd)

```bash
journalctl -u myapp                   # semua log untuk unit "myapp"
journalctl -u myapp -f                 # follow (real-time, seperti tail -f)
journalctl -u myapp --since "1 hour ago"
journalctl -u myapp -p err              # hanya level error ke atas
journalctl -xe                          # log terbaru + explanation, untuk debugging cepat
journalctl --disk-usage                 # cek berapa besar journal log memakai disk
journalctl --vacuum-time=7d              # hapus log lebih tua dari 7 hari
```

---

## Skenario: Debugging Proses Hang / Zombie di Production

### Kejadian: API Server Tidak Merespons, tapi Proses "Terlihat" Jalan

```
Laporan: "API kita timeout semua, tapi kalau di cek proses masih ada"

  Step 1: Cek status service
          $ systemctl status api-backend
          → Active: active (running)   ← terlihat OK, tapi ini menyesatkan

  Step 2: Cek proses lebih detail
          $ ps aux | grep api-backend
          www-data  4521  0.0  1.2  ... D    10:03   0:00 api-backend
                                     │
                                     └── STAT = D (disk sleep, uninterruptible)
          → Proses stuck menunggu I/O, TIDAK merespons SIGTERM biasa

  Step 3: Cek apakah ada proses zombie menumpuk
          $ ps aux | grep 'Z' | grep -v grep
          www-data  4522  0.0  0.0  0     0   ?    Z    10:03   0:00 [api-worker] <defunct>
          www-data  4530  0.0  0.0  0     0   ?    Z    10:04   0:00 [api-worker] <defunct>
          ... (puluhan baris)
                                     │
                                     └── Parent process tidak pernah "reap"
                                         child process yang sudah selesai

  Step 4: Cek resource & I/O sistem
          $ df -h                    # apakah disk penuh?
          $ iostat -x 1               # apakah ada I/O bottleneck?
          $ dmesg | tail -50           # cek kernel log, mungkin ada disk error

  Root cause ditemukan: Disk penuh (100%) → proses yang mencoba
  menulis log/file jadi stuck di state D menunggu I/O yang tidak
  pernah selesai, dan child process yang di-fork tidak pernah
  di-reap dengan benar oleh parent → menumpuk jadi zombie.
```

### Fix

```
  Immediate fix:
  ┌────────────────────────────────────────────────────┐
  │ 1. Bersihkan disk (hapus log lama, file temp)         │
  │    $ du -sh /var/log/* | sort -rh | head              │
  │    $ journalctl --vacuum-size=200M                     │
  ├────────────────────────────────────────────────────┤
  │ 2. Proses state D tidak bisa di-SIGKILL biasa —        │
  │    biasanya hilang otomatis begitu I/O selesai/disk     │
  │    lega. Kalau benar-benar stuck permanen, opsi          │
  │    terakhir adalah reboot service/VM                    │
  ├────────────────────────────────────────────────────┤
  │ 3. Restart service setelah disk lega                    │
  │    $ sudo systemctl restart api-backend                 │
  │    → zombie process akan otomatis hilang setelah          │
  │      parent process (api-backend) di-restart               │
  └────────────────────────────────────────────────────┘

  Long-term fix:
  ┌────────────────────────────────────────────────────┐
  │ 1. Setup log rotation (logrotate) supaya log tidak      │
  │    menumpuk sampai disk penuh                            │
  │ 2. Setup alert monitoring disk usage > 85%                │
  │ 3. Perbaiki bug aplikasi yang tidak "wait()" child        │
  │    process (kalau aplikasi fork proses secara manual)      │
  │ 4. Tambahkan Restart=on-failure di systemd unit file       │
  │    supaya service auto-recover                             │
  └────────────────────────────────────────────────────┘
```

**Penting:** Proses dengan state `D` (disk sleep) **tidak bisa dihentikan** dengan `SIGKILL` sekalipun, karena sedang menunggu operasi kernel-level (biasanya I/O) yang belum selesai. Satu-satunya cara adalah menunggu I/O selesai, mengatasi root cause (misal disk penuh), atau dalam kasus ekstrem — reboot.

---

## Ringkasan Konsep

```
Process states: R (running) S (sleeping) D (disk sleep, stuck)
                T (stopped)  Z (zombie, sudah exit tapi belum di-reap)

Job control:
  & → background       Ctrl+Z → suspend
  jobs/fg/bg → kelola job dalam 1 shell session
  nohup → tahan proses hidup setelah SSH ditutup

Monitoring: ps (snapshot) | top (built-in realtime) | htop (realtime, enak dilihat)

Signals penting:
  SIGTERM (15) → minta berhenti sopan (DEFAULT, coba dulu)
  SIGKILL (9)  → paksa matikan (last resort, tanpa cleanup)
  SIGHUP  (1)  → reload config
  SIGSTOP/CONT → pause/resume paksa

Systemd:
  .service/.timer/.target → unit types
  systemctl start/stop/enable/status
  journalctl -u NAME -f   → lihat log real-time

Debug proses hang:
  Cek state (ps aux) → D state = stuck I/O, cek disk & iostat
  Zombie menumpuk = parent bug, restart service untuk reap
```

---

*Dokumen ini berdasarkan Linux (kernel, distro, dan tooling) yang stabil dan didukung luas per 2026.*
