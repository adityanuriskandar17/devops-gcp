# Disks & Snapshots

Halaman-halaman di Console untuk mengelola storage VM.

---

## 1. Disks

> **Console:** Compute Engine → **Disks**

Halaman ini menampilkan semua disk di project. Setiap VM punya minimal 1 boot disk.

### Create Disk

> **Console:** Compute Engine → Disks → **Create Disk**

#### Name

Nama unik untuk disk. Tips: `{vm-name}-{role}-disk` (contoh: `ftlgymweb-data-disk`).

#### Location

> **Console:** Create Disk → **Region / Zone**

| Pilihan | Kelebihan | Kekurangan |
|---------|-----------|------------|
| **Single zone** (default) | Murah, latensi rendah | Hilang kalau zone down |
| **Regional** (replika di 2 zone) | High availability, auto-failover | 2x harga, pd-standard/pd-balanced/pd-ssd, hanya di machine type E2/N1/N2/N2D |

**Rekomendasi:** Single zone untuk kebanyakan use case. Regional untuk database production yang butuh HA.

#### Disk Source Type

> **Console:** Create Disk → **Source type dropdown**

```
Source type:
┌──────────────────────────┐
│  Blank disk            ▼ │
├──────────────────────────┤
│  Blank disk              │  ← Disk kosong, format sendiri
│  Image                   │  ← Dari OS image (Ubuntu, Debian, dll)
│  Snapshot                │  ← Restore dari snapshot
│  Disk                    │  ← Clone dari disk lain
└──────────────────────────┘
```

| Source | Kapan pakai |
|--------|-------------|
| **Blank disk** | Data disk tambahan (database, storage) |
| **Image** | Boot disk (install OS) |
| **Snapshot** | Restore dari backup |
| **Disk** | Clone disk existing (migrasi, test) |

#### Disk Type

> **Console:** Create Disk → **Disk type dropdown**

```
Disk type:
┌────────────────────────────────┐
│  Balanced persistent disk    ▼ │
├────────────────────────────────┤
│  Standard persistent disk      │  ← HDD, murah
│  Balanced persistent disk      │  ← SSD light, default
│  SSD persistent disk           │  ← SSD full
│  Extreme persistent disk       │  ← Max IOPS
│  Hyperdisk Balanced            │  ← Generasi baru
│  Hyperdisk Extreme             │  ← Generasi baru, max
│  Hyperdisk Throughput          │  ← Generasi baru, streaming
│  Hyperdisk ML                  │  ← Generasi baru, ML
└────────────────────────────────┘
```

##### Persistent Disk (PD) - Generasi Lama/Standar

| Type | IOPS (read) | Throughput | Harga/GB/bln | Kelebihan | Kekurangan |
|------|-------------|-----------|-------------|-----------|------------|
| **pd-standard** | ~0.75/GB | ~0.12 MB/s/GB | ~$0.048 | Paling murah | Lambat, boot lama |
| **pd-balanced** | ~6/GB | ~0.28 MB/s/GB | ~$0.108 | Balance harga & performa, default | Sedang di semua aspek |
| **pd-ssd** | ~30/GB | ~0.48 MB/s/GB | ~$0.187 | Cepat, boot cepat | 2x harga pd-balanced |
| **pd-extreme** | Custom (max 120K) | Custom | ~$0.125+ | IOPS tertinggi, bisa set IOPS sendiri | Mahal, hanya N2 (shape 64+ vCPU), M2, M3, min 500 GB |

##### Hyperdisk - Generasi Baru

| Type | Kelebihan | Kekurangan | Kapan pakai |
|------|-----------|------------|-------------|
| **Hyperdisk Balanced** | IOPS & throughput bisa di-set independen dari size | Lebih mahal, tidak semua VM support | Production database |
| **Hyperdisk Extreme** | IOPS sampai 350K | Sangat mahal | Extreme OLTP database |
| **Hyperdisk Throughput** | Throughput tinggi | IOPS rendah | Streaming, big data |
| **Hyperdisk ML** | Optimized untuk ML workload | Spesifik use case | ML training data loading |

##### Panduan Pilih Disk Type

```
╔══════════════════════════════════════════════════════╗
║  Kebutuhan                          → Pilih         ║
╠══════════════════════════════════════════════════════╣
║  Dev/staging, budget ketat          → pd-standard   ║
║  Boot disk production               → pd-balanced   ║
║  Database production                → pd-ssd        ║
║  App dengan banyak read/write       → pd-ssd        ║
║  Backup, archival, log storage      → pd-standard   ║
║  Database butuh IOPS extreme        → pd-extreme    ║
║  Perlu set IOPS independen dari size→ Hyperdisk     ║
╚══════════════════════════════════════════════════════╝
```

#### Size

> **Console:** Create Disk → **Size (GB)**

| Size | Kelebihan | Kekurangan |
|------|-----------|------------|
| 10 GB (minimum) | Murah | Cepat penuh, IOPS rendah |
| 20-50 GB | Cukup untuk boot disk | |
| 100 GB | Aman, IOPS lebih baik | Lebih mahal |
| 500+ GB | IOPS & throughput tinggi | Mahal, mungkin overkill |

**Penting:** Pada persistent disk, **IOPS dan throughput berbanding lurus dengan ukuran disk**. Disk 200 GB pd-ssd punya 2x IOPS dari disk 100 GB pd-ssd.

```
pd-ssd 10 GB   = ~300 IOPS
pd-ssd 100 GB  = ~3,000 IOPS
pd-ssd 500 GB  = ~15,000 IOPS
pd-ssd 1000 GB = ~30,000 IOPS
```

Jadi kalau butuh IOPS tinggi tapi data kecil, buat disk **lebih besar** dari yang dibutuhkan.

#### Encryption

> **Console:** Create Disk → **Encryption**

| Pilihan | Kelebihan | Kekurangan |
|---------|-----------|------------|
| **Google-managed** (default) | Otomatis, gratis, tidak perlu setup | Tidak bisa kontrol key sendiri |
| **Cloud KMS key** (CMEK) | Kontrol penuh atas key, bisa revoke | Harus manage KMS, sedikit lebih kompleks |
| **Customer-supplied** (CSEK) | Key di tangan kamu sepenuhnya | Kalau key hilang, data tidak bisa diakses. High risk |

**Rekomendasi:** Google-managed untuk kebanyakan use case. CMEK kalau ada compliance requirement.

---

## 2. Snapshots

> **Console:** Compute Engine → **Snapshots**

Snapshot = backup point-in-time dari disk.

### Create Snapshot

> **Console:** Compute Engine → Snapshots → **Create Snapshot**

#### Source Disk

> **Console:** Create Snapshot → **Source disk dropdown**

Pilih disk mana yang mau di-snapshot. Bisa snapshot disk yang sedang dipakai VM (running VM OK).

#### Location

> **Console:** Create Snapshot → **Location**

| Pilihan | Kelebihan | Kekurangan |
|---------|-----------|------------|
| **Multi-regional** (default) | Tersimpan di beberapa region, lebih tahan disaster | Sedikit lebih mahal |
| **Regional** | Lebih murah, tetap di 1 region | Hilang kalau region down |

**Rekomendasi:** Multi-regional untuk backup penting. Regional kalau budget ketat.

#### Labels

Tag key-value untuk organize snapshots (contoh: `env=prod`, `app=ftlgym`).

### List Snapshots

> **Console:** Compute Engine → Snapshots

Tabel yang menampilkan semua snapshot dengan kolom:
- Name
- Source disk
- Creation time
- Disk size
- Status

### Restore dari Snapshot

> **Console:** Compute Engine → Disks → Create Disk → Source type: **Snapshot**

Atau:

> **Console:** Compute Engine → VM instances → Create Instance → Boot disk → **Change** → Snapshots tab

---

## 3. Snapshot Schedules

> **Console:** Compute Engine → **Snapshot schedules** (atau Storage → Snapshot schedules)

Jadwal otomatis untuk snapshot rutin.

### Create Snapshot Schedule

> **Console:** Snapshot schedules → **Create snapshot schedule**

#### Schedule Frequency

> **Console:** Create Snapshot Schedule → **Schedule frequency**

```
Schedule frequency:
┌──────────────────┐
│  Daily         ▼ │
├──────────────────┤
│  Hourly          │
│  Daily           │
│  Weekly          │
└──────────────────┘
```

| Frequency | Kelebihan | Kekurangan | Kapan pakai |
|-----------|-----------|------------|-------------|
| **Hourly** | RPO sangat kecil (max 1 jam data loss) | Banyak snapshot, mahal | Database critical |
| **Daily** | Balance antara proteksi dan cost | Max 24 jam data loss | Production servers (recommended) |
| **Weekly** | Murah | Max 7 hari data loss | Dev/staging, data yang jarang berubah |

#### Start Time

> **Console:** Create Snapshot Schedule → **Start time**

**Rekomendasi:** Set di luar jam sibuk (contoh: 02:00 WIB) untuk meminimalkan dampak ke performance.

#### Snapshot Retention

> **Console:** Create Snapshot Schedule → **Maximum number of snapshots** atau **Keep snapshots for**

| Retention | Kelebihan | Kekurangan |
|-----------|-----------|------------|
| 3 hari | Murah | Histori singkat |
| 7 hari | Cukup untuk recovery kebanyakan masalah | |
| 14 hari | Lebih aman | 2x storage cost vs 7 hari |
| 30 hari | Sangat aman | Mahal |

#### Auto-delete

> **Console:** Create Snapshot Schedule → **Deletion rule**

| Pilihan | Keterangan |
|---------|------------|
| **Keep snapshots** | Snapshot tidak dihapus meski schedule dihapus |
| **Delete snapshots** | Snapshot ikut terhapus saat schedule dihapus |

#### Attach Schedule ke Disk

> **Console:** Compute Engine → Disks → klik disk → **Edit** → Snapshot schedule dropdown

Atau saat create disk, ada opsi Snapshot schedule.

---

## 4. Machine Images

> **Console:** Compute Engine → **Machine images**

Machine Image = snapshot **lengkap** seluruh VM (semua disk + config + metadata + network settings).

### Create Machine Image

> **Console:** Compute Engine → Machine images → **Create machine image**

| Setting | Keterangan |
|---------|------------|
| **Source VM instance** | VM yang mau di-capture |
| **Location** | Multi-regional / Regional |
| **Encryption** | Google-managed / CMEK / CSEK |

### Snapshot vs Machine Image

```
╔══════════════════════╦══════════════════╦════════════════════╗
║                      ║  Snapshot        ║  Machine Image     ║
╠══════════════════════╬══════════════════╬════════════════════╣
║  Console lokasi      ║  Snapshots       ║  Machine images    ║
║  Isi                 ║  1 disk saja     ║  Semua disk+config ║
║  Metadata (tags, SA) ║  Tidak           ║  Ya                ║
║  Network config      ║  Tidak           ║  Ya                ║
║  Restore jadi        ║  Disk baru       ║  VM baru (identik) ║
║  Use case            ║  Backup disk     ║  Clone / template  ║
║  Scheduling          ║  Ya (otomatis)   ║  Tidak (manual)    ║
║  Incremental         ║  Ya              ║  Tidak             ║
╚══════════════════════╩══════════════════╩════════════════════╝
```

**Rekomendasi:**
- Backup rutin → **Snapshot schedule**
- Clone VM / buat template → **Machine Image**
- Disaster recovery → **Snapshot schedule + simpan multi-regional**
- Sebelum major change → **Machine Image** (bisa rollback seluruh VM)

---

## 5. Boot Disk saat Create VM

> **Console:** Create Instance → **Boot disk** → **Change**

Saat create VM, klik tombol "Change" di bagian Boot disk membuka panel:

### Tab: Public Images

```
┌───────────────┬──────────┬────────────┬──────────┐
│ Public images  │ Custom   │ Snapshots  │ Existing │
│ ████████████   │ images   │            │ disks    │
└───────────────┴──────────┴────────────┴──────────┘
```

#### Operating System dropdown

| OS | Kelebihan | Kekurangan |
|----|-----------|------------|
| **Ubuntu** | Komunitas besar, banyak tutorial, LTS support lama | Sedikit lebih "berat" dari Debian |
| **Debian** | Minimal, stabil, ringan | Komunitas lebih kecil, paket kurang update |
| **Rocky Linux** | RHEL-compatible, pengganti CentOS | Komunitas masih berkembang |
| **CentOS Stream** | RHEL upstream, stabil | CentOS klasik sudah EOL |
| **Windows Server** | .NET, AD, SQL Server | Lisensi mahal ($50-200+/bln tambahan) |
| **Container-Optimized OS** | Minimal, aman, hanya untuk Docker | Tidak bisa install software lain |

#### Version dropdown

Setelah pilih OS, pilih versi spesifik (contoh: Ubuntu 20.04 LTS, 22.04 LTS, 24.04 LTS).

#### Boot disk type & size

Sama seperti di section Disk Type dan Size di atas.

### Tab: Custom Images

Image yang kamu buat sendiri (dari snapshot atau disk). Berguna kalau sudah punya image dengan software pre-installed.

### Tab: Snapshots

Restore VM langsung dari snapshot yang sudah ada.

### Tab: Existing Disks

Pakai disk yang sudah ada sebagai boot disk (misalnya disk dari VM yang dihapus dengan `--keep-disks`).

---

## 6. Disk Management dari VM Detail

> **Console:** Compute Engine → VM instances → klik VM → **Edit** → **Additional disks**

Dari halaman edit VM, kamu bisa:

| Aksi | Keterangan | Butuh stop VM? |
|------|------------|----------------|
| **Add new disk** | Buat & attach disk baru | Tidak |
| **Attach existing disk** | Attach disk yang sudah ada | Tidak |
| **Detach disk** | Lepas disk dari VM | Tidak |
| **Change disk type** | Ubah pd-standard ke pd-ssd, dll | Ya |
| **Resize disk** | Perbesar (tidak bisa kecilkan) | Tidak |

**Setelah attach/resize disk baru, SSH ke VM untuk:**

```bash
# Cek disk baru terdeteksi
lsblk

# Format disk baru (HATI-HATI, pastikan disk yang benar)
sudo mkfs.ext4 -F /dev/sdb

# Mount
sudo mkdir -p /mnt/data
sudo mount /dev/sdb /mnt/data

# Auto-mount saat boot
echo '/dev/sdb /mnt/data ext4 defaults 0 2' | sudo tee -a /etc/fstab

# Setelah resize, extend filesystem
sudo resize2fs /dev/sdb
```
