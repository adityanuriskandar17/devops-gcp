# Instance Groups & Autoscaling

> **Console:** Compute Engine → **Instance groups**

Instance Group = kumpulan VM yang dikelola sebagai satu unit.

---

## 1. Create Instance Group

> **Console:** Compute Engine → Instance groups → **Create instance group**

### Tipe Instance Group

> **Console:** Create instance group → header pilihan

```
┌──────────────────────────────┬─────────────────────────────────┐
│ New managed instance group   │ New unmanaged instance group    │
│ ████████████████████████████ │                                 │
└──────────────────────────────┴─────────────────────────────────┘
```

| Tipe | Kelebihan | Kekurangan | Kapan pakai |
|------|-----------|------------|-------------|
| **Managed (MIG)** | Autoscaling, auto-healing, rolling update, semua VM identik | Semua VM harus dari 1 template, tidak bisa mix | Production: web server, API server |
| **Unmanaged** | Bisa group VM existing yang berbeda-beda | Tidak ada autoscaling, auto-healing, rolling update | Grouping VM lama untuk LB backend |

---

## 2. Managed Instance Group (MIG)

### Location

> **Console:** Create MIG → **Location**

```
Location:
┌─────────────────────────────┐
│  Single zone              ▼ │
├─────────────────────────────┤
│  Single zone                │
│  Multiple zones             │
└─────────────────────────────┘
```

| Pilihan | Kelebihan | Kekurangan |
|---------|-----------|------------|
| **Single zone** | Sederhana, low latency antar VM | 1 zone down = semua VM down |
| **Multiple zones** | High availability (VM tersebar di beberapa zone) | Setup lebih kompleks, cross-zone latency |

**Rekomendasi:** Multiple zones untuk production. Single zone untuk dev/staging.

### Instance Template

> **Console:** Create MIG → **Instance template dropdown**

MIG butuh instance template sebagai "blueprint" untuk membuat VM. Template berisi semua konfigurasi: machine type, disk, network, dll.

> **Console:** Compute Engine → **Instance templates** → Create instance template

Form Instance Template **sama persis** dengan form Create VM Instance (machine type, disk, network, dll). Bedanya: template tidak langsung membuat VM, tapi menyimpan konfigurasi.

| Kelebihan template | Kekurangan template |
|--------------------|---------------------|
| Konsisten: semua VM di MIG identik | Kalau mau ubah, harus buat template baru |
| Reusable: bisa dipakai di banyak MIG | Tidak bisa edit template yang sudah ada (buat baru, lalu update MIG) |
| Versioning: bisa rolling update ke template baru | |

### Number of Instances

> **Console:** Create MIG → **Number of instances**

Berapa VM yang langsung dibuat.

| Jumlah | Keterangan |
|--------|------------|
| 1 | Minimum, tidak HA |
| 2 | Minimum untuk HA |
| 3+ | Lebih aman, bisa handle traffic spike |

**Catatan:** Kalau pakai Autoscaling, ini jadi jumlah awal. Nanti autoscaler yang adjust.

---

## 3. Autoscaling

> **Console:** Create MIG → **Autoscaling** section

### Autoscaling Mode

> **Console:** Autoscaling → **Autoscaling mode**

```
Autoscaling mode:
┌──────────────────────────────────┐
│  Off (do not autoscale)        ▼ │
├──────────────────────────────────┤
│  Off (do not autoscale)          │
│  On: add and remove instances    │
│  Scale out only                  │
└──────────────────────────────────┘
```

| Mode | Kelebihan | Kekurangan | Kapan pakai |
|------|-----------|------------|-------------|
| **Off** | Jumlah VM tetap, predictable cost | Tidak otomatis handle traffic spike | VM tetap, budget fixed |
| **On: add and remove** | Scale out saat busy, scale in saat idle (hemat biaya) | Biaya tidak predictable, cold start delay | Production dengan traffic berfluktuasi |
| **Scale out only** | Hanya tambah VM, tidak pernah kurangi | Biaya naik tapi tidak turun | Kalau tidak mau risk VM dihapus saat idle |

### Autoscaling Metrics

> **Console:** Autoscaling → **Autoscaling signals** → **Add signal**

```
Autoscaling signal:
┌────────────────────────────────────────┐
│  CPU utilization                     ▼ │
├────────────────────────────────────────┤
│  CPU utilization                       │
│  HTTP load balancing utilization       │
│  Cloud Monitoring metric               │
│  Cloud Pub/Sub queue                   │
└────────────────────────────────────────┘
```

| Signal | Cara kerja | Kelebihan | Kekurangan |
|--------|------------|-----------|------------|
| **CPU utilization** | Scale kalau average CPU > target | Simple, cocok untuk CPU-bound app | Tidak akurat kalau bottleneck bukan CPU |
| **HTTP LB utilization** | Scale berdasarkan requests per second | Bagus untuk web traffic | Hanya kalau pakai HTTP LB |
| **Cloud Monitoring metric** | Scale berdasarkan custom metric apapun | Sangat fleksibel | Harus setup metric sendiri |
| **Pub/Sub queue** | Scale berdasarkan jumlah unprocessed messages | Ideal untuk queue worker | Hanya untuk Pub/Sub workload |

#### CPU Utilization Target

> **Console:** Autoscaling signal → CPU → **Target CPU utilization**

| Target | Keterangan |
|--------|------------|
| 60% | Conservative, headroom besar untuk spike |
| 70% | Balanced (recommended) |
| 80% | Aggressive, lebih hemat tapi risk overload |

**Rekomendasi:** 60-70% untuk production web server.

### Min & Max Instances

> **Console:** Autoscaling → **Minimum number of instances** / **Maximum number of instances**

| Setting | Keterangan |
|---------|------------|
| **Min instances** | Jumlah minimum VM yang selalu jalan (meski traffic rendah) |
| **Max instances** | Batas atas VM (untuk kontrol biaya) |

```
╔═══════════════════════════════════════════╗
║  Contoh autoscaling:                     ║
║                                           ║
║  Min: 2, Max: 10, Target CPU: 60%        ║
║                                           ║
║  Malam (traffic rendah):                  ║
║    CPU ~20% → scale in ke 2 VM           ║
║                                           ║
║  Siang (traffic normal):                  ║
║    CPU ~50% → tetap 3-4 VM              ║
║                                           ║
║  Peak (traffic tinggi):                   ║
║    CPU ~80% → scale out ke 6-8 VM        ║
║                                           ║
║  Extreme (viral):                         ║
║    CPU max → scale out ke 10 VM (max)    ║
╚═══════════════════════════════════════════╝
```

### Cool Down Period

> **Console:** Autoscaling → **Initialization period (cool down)**

Waktu tunggu setelah VM baru dibuat sebelum autoscaler mulai mengevaluasi metric-nya.

| Period | Keterangan |
|--------|------------|
| 60s (default) | Cukup kalau app boot cepat |
| 120-180s | Kalau app butuh waktu boot (install deps, warm up cache) |
| 300s | App heavy yang butuh waktu lama untuk siap |

### Scale-in Controls

> **Console:** Autoscaling → **Scale-in controls**

Mencegah autoscaler mengurangi VM terlalu cepat.

| Setting | Keterangan |
|---------|------------|
| **Don't scale in** within X minutes | Tidak boleh kurangi VM dalam jangka waktu tertentu |
| **Max scaled-in replicas** | Maksimal berapa VM yang boleh dihapus sekaligus |

---

## 4. Auto-Healing

> **Console:** Create MIG → **Autohealing** section

### Health Check

> **Console:** Autohealing → **Health check dropdown**

Pilih health check yang akan dipakai untuk mendeteksi VM yang mati/hang. Buat baru kalau belum ada.

| Setting | Keterangan |
|---------|------------|
| **Health check** | HTTP/TCP check ke app |
| **Initial delay** | Waktu tunggu sebelum mulai cek VM baru (supaya VM punya waktu boot) |

### Cara Kerja

```
VM respond 200 OK?
  ├─ Ya  → HEALTHY (tidak ada aksi)
  └─ Tidak (setelah unhealthy threshold) → UNHEALTHY
       │
       ▼
  MIG hapus VM → MIG buat VM baru dari template
       │
       ▼
  VM baru boot → tunggu initial delay → cek lagi
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Otomatis ganti VM yang hang/crash | Kalau health check salah config, VM yang sehat bisa dianggap mati |
| Tidak perlu monitoring manual 24/7 | Initial delay terlalu pendek → VM di-kill sebelum siap |
| Selalu punya VM yang sehat | |

---

## 5. Update (Rolling Update)

> **Console:** Instance groups → klik MIG → **Update VMs** (tombol atas)

### Metode Update

> **Console:** Update VMs → **Update method**

```
Update method:
┌──────────────────────────────┐
│  Proactive                 ▼ │
├──────────────────────────────┤
│  Proactive                   │  ← Langsung replace semua VM
│  Opportunistic               │  ← Replace saat VM recreate/scale
└──────────────────────────────┘
```

| Method | Kelebihan | Kekurangan | Kapan pakai |
|--------|-----------|------------|-------------|
| **Proactive** | Semua VM segera di-update | Ada disruption (VM di-replace) | Deploy perubahan segera |
| **Opportunistic** | Tidak ada disruption langsung | Update lambat (hanya saat ada event) | Non-urgent update |

### Max Surge & Max Unavailable

> **Console:** Update VMs → **Maximum surge** / **Maximum unavailable**

| Setting | Keterangan |
|---------|------------|
| **Max surge** | Berapa VM tambahan boleh dibuat saat update |
| **Max unavailable** | Berapa VM yang boleh mati saat update |

| Strategi | Max Surge | Max Unavailable | Keterangan |
|----------|-----------|-----------------|------------|
| Zero downtime | 1 | 0 | Buat 1 baru, baru hapus 1 lama. Lebih lambat tapi aman |
| Fast update | 3 | 1 | Lebih cepat, tapi 1 VM mungkin down sebentar |
| Replace all | 100% | 100% | Semua diganti sekaligus. Downtime singkat |

---

## 6. Unmanaged Instance Group

> **Console:** Instance groups → **Create instance group** → **New unmanaged instance group**

Hanya untuk mengelompokkan VM existing sebagai backend Load Balancer.

| Setting | Keterangan |
|---------|------------|
| **Zone** | Semua VM harus di zone yang sama |
| **Network** | VPC network |
| **VM instances** | Pilih VM yang mau dimasukkan |
| **Named port** | Port yang di-expose ke LB (misal: http:80) |

| Kelebihan | Kekurangan |
|-----------|------------|
| Bisa group VM yang sudah ada | Tidak ada autoscaling |
| VM bisa berbeda machine type | Tidak ada auto-healing |
| Simple setup | Tidak ada rolling update |
| | Tidak ada template (VM dikelola manual) |
