# Machine Types

> **Console:** Compute Engine → VM instances → Create Instance → **Machine configuration**

Saat create VM, bagian Machine configuration adalah pilihan pertama setelah Name & Region. Di sini kamu menentukan "otak" dari VM: berapa CPU, berapa RAM.

---

## Tab Pertama: Machine Family

> **Console:** Machine configuration → **General purpose** | Compute optimized | Memory optimized | ...

```
┌─────────────────┬────────────────────┬─────────────────┬──────────────┐
│ General purpose  │ Compute optimized  │ Memory optimized│ Accelerator  │
│ ██████████████   │                    │                 │ (GPU)        │
└─────────────────┴────────────────────┴─────────────────┴──────────────┘
  ↑ default
```

### General Purpose

| Kelebihan | Kekurangan |
|-----------|------------|
| Harga wajar, paling fleksibel | Tidak optimal untuk heavy workload spesifik |
| Banyak pilihan series (E2, N2, N2D, N4, T2D) | CPU performance tidak se-tinggi Compute Optimized |
| Bisa custom machine type | |

**Kapan pakai:** Web server, API server, database kecil-menengah, dev/staging, backend app -- **90% use case masuk sini**.

### Compute Optimized

| Kelebihan | Kekurangan |
|-----------|------------|
| Clock speed CPU tertinggi | Mahal (~25% lebih dari General Purpose) |
| Performa single-thread terbaik | Pilihan machine type terbatas |
| Intel terbaru | Tidak bisa custom machine type |

**Kapan pakai:** Video encoding, scientific computing, game server, high-performance computing (HPC).

### Memory Optimized

| Kelebihan | Kekurangan |
|-----------|------------|
| RAM sangat besar (hingga 12 TB) | Sangat mahal |
| Cocok untuk in-memory workload | Overkill untuk kebanyakan app |

**Kapan pakai:** SAP HANA, in-memory database (Redis cluster besar), real-time analytics.

### Accelerator (GPU)

| Kelebihan | Kekurangan |
|-----------|------------|
| Ada GPU (NVIDIA T4, L4, A100, H100) | Sangat mahal ($300-$3000+/bulan per GPU) |
| Wajib untuk ML training/inference | Butuh driver & setup tambahan |
| Support CUDA, TensorRT | Tidak semua zone tersedia |

**Kapan pakai:** Machine learning, AI, video rendering, simulasi.

---

## Tab Kedua: Series

> **Console:** Machine configuration → General purpose → **Series dropdown**

```
Series:
┌────────────────────────┐
│  E2                  ▼ │
├────────────────────────┤
│  E2                    │  ← Default, paling murah
│  N1                    │  ← Generasi lama
│  N2                    │  ← Balanced, production
│  N2D                   │  ← AMD, lebih murah
│  N4                    │  ← Terbaru, Intel
│  T2D                   │  ← AMD, budget
│  T2A                   │  ← ARM-based, GA sejak 2022
└────────────────────────┘
```

### Perbandingan Detail

| Series | CPU | Kelebihan | Kekurangan | Harga relatif |
|--------|-----|-----------|------------|---------------|
| **E2** | Intel/AMD (auto) | Paling murah, burst capability, shared core tersedia | Performa kurang konsisten, tidak support local SSD, tidak support GPU | $ |
| **N1** | Intel Skylake | Legacy, sudah lama stabil | Generasi lama, harga kurang efisien, GCP recommend migrasi ke N2 | $$ |
| **N2** | Intel Cascade Lake / Ice Lake | Performa konsisten, dedicated core, support local SSD, custom machine type | ~20% lebih mahal dari E2 | $$$ |
| **N2D** | AMD EPYC Rome/Milan | Lebih murah ~10% dari N2, core count lebih banyak per VM | Beberapa software optimize untuk Intel, fitur sedikit lebih terbatas | $$ |
| **N4** | Intel Emerald Rapids | Performa per-core terbaik, generasi terbaru | Belum tersedia di semua region/zone, harga premium | $$$$ |
| **T2D** | AMD EPYC Milan | Paling murah setelah E2, dedicated core | Hanya predefined sizes (tidak bisa custom), fitur terbatas | $ |
| **T2A** | Ampere Altra (ARM) | Hemat energi, murah | ARM architecture (tidak semua software kompatibel); GA sejak 2022, bukan experimental | $ |

### Panduan Pilih Series

```
╔══════════════════════════════════════════════════╗
║  Butuh yang murah?                              ║
║    ├─ Ya, shared core OK    → E2                ║
║    ├─ Ya, dedicated core    → T2D               ║
║    └─ Ya, ARM OK            → T2A               ║
║                                                  ║
║  Butuh production-grade?                         ║
║    ├─ Intel                 → N2                 ║
║    ├─ AMD (hemat sedikit)   → N2D                ║
║    └─ Performa max          → N4                 ║
║                                                  ║
║  Legacy, jangan pilih       → N1                 ║
╚══════════════════════════════════════════════════╝
```

---

## Tab Ketiga: Preset vs Custom

> **Console:** Machine configuration → **Preset** | **Custom** (tab)

### Preset Tab

```
Machine type:
┌──────────────────────────────────────────┐
│  e2-medium (2 vCPU, 1 core, 4 GB memory)│
├──────────────────────────────────────────┤
│  e2-micro    (2 vCPU, 0.25 core, 1 GB)  │  ~$8/bln
│  e2-small    (2 vCPU, 0.5 core, 2 GB)   │  ~$15/bln
│  e2-medium   (2 vCPU, 1 core, 4 GB)     │  ~$37/bln
│  ─────────── standard ───────────        │
│  e2-standard-2   (2 vCPU, 8 GB)         │  ~$73/bln
│  e2-standard-4   (4 vCPU, 16 GB)        │  ~$146/bln
│  e2-standard-8   (8 vCPU, 32 GB)        │  ~$293/bln
│  e2-standard-16  (16 vCPU, 64 GB)       │  ~$586/bln
│  ─────────── highcpu ────────────        │
│  e2-highcpu-2    (2 vCPU, 2 GB)         │  ~$53/bln
│  e2-highcpu-4    (4 vCPU, 4 GB)         │  ~$106/bln
│  e2-highcpu-8    (8 vCPU, 8 GB)         │  ~$212/bln
│  e2-highcpu-16   (16 vCPU, 16 GB)       │  ~$424/bln
│  ─────────── highmem ────────────        │
│  e2-highmem-2    (2 vCPU, 16 GB)        │  ~$98/bln
│  e2-highmem-4    (4 vCPU, 32 GB)        │  ~$196/bln
│  e2-highmem-8    (8 vCPU, 64 GB)        │  ~$392/bln
└──────────────────────────────────────────┘
```

#### Shared Core (micro, small, medium)

| Tipe | vCPU | Shared Core | RAM | Kelebihan | Kekurangan |
|------|------|------------|-----|-----------|------------|
| e2-micro | 2 vCPU | 0.25 core | 1 GB | Sangat murah ($2-8/bln) | Sangat lambat, hanya untuk test/dev |
| e2-small | 2 vCPU | 0.5 core | 2 GB | Murah ($4-15/bln) | Terbatas, burst tapi tidak konsisten |
| e2-medium | 2 vCPU | 1 core | 4 GB | Cukup untuk small app ($7-37/bln) | Masih shared, tidak untuk production berat |

**Shared core** artinya VM berbagi CPU fisik dengan VM lain. Saat idle bisa "burst" pakai CPU lebih, tapi saat busy performa turun.

#### Standard (balanced CPU:RAM = 1:4)

| Kelebihan | Kekurangan | Kapan pakai |
|-----------|------------|-------------|
| Balanced, cocok untuk kebanyakan app | Kadang bayar RAM yang tidak terpakai (kalau app CPU-heavy) | Web app, API, general purpose |

#### High-CPU (CPU:RAM = 1:1)

| Kelebihan | Kekurangan | Kapan pakai |
|-----------|------------|-------------|
| Banyak CPU dengan harga lebih rendah | RAM sangat kecil | Web server (banyak concurrent request, sedikit RAM per request), encoding, batch processing |

**Contoh:** ftlgymweb pakai `n2-highcpu-16` karena serve banyak web traffic yang butuh CPU tinggi tapi tidak butuh RAM besar.

#### High-Memory (CPU:RAM = 1:8)

| Kelebihan | Kekurangan | Kapan pakai |
|-----------|------------|-------------|
| RAM besar per vCPU | Mahal, overkill kalau app tidak memory-heavy | Database, cache server (Redis/Memcached), in-memory processing |

### Custom Tab

> **Console:** Machine configuration → Custom tab → slider **Cores** & **Memory**

```
┌──────────────────────────────────────┐
│  Cores:   ◄────●────────────► 6     │
│  Memory:  ◄──────────●──────► 12 GB │
└──────────────────────────────────────┘
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Pas sesuai kebutuhan, tidak ada waste | ~5% premium dibanding preset terdekat |
| Bisa kombinasi bebas (dalam batasan) | Harus tahu kebutuhan exact app kamu |
| Hemat kalau preset terlalu besar | |

**Aturan:**
- vCPU: 1, atau kelipatan 2 (2, 4, 6, 8, ...)
- RAM: kelipatan 256 MB
- RAM per vCPU: min 0.9 GB, max 6.5 GB

**Extended Memory:** Centang "Extend memory" untuk menambah RAM di atas batas 6.5 GB/vCPU (bayar premium tambahan).

---

## Opsi Tambahan di Machine Configuration

### CPU Platform

> **Console:** Machine configuration → Advanced configurations → **CPU platform dropdown**

| Pilihan | Keterangan |
|---------|------------|
| **Automatic** (default) | GCP pilih CPU terbaik yang tersedia |
| Intel Cascade Lake | Generasi spesifik |
| Intel Ice Lake | Lebih baru |
| AMD Rome / Milan | Hanya di N2D/T2D |

**Rekomendasi:** Biarkan **Automatic** kecuali ada requirement licensing atau benchmark.

### vCPUs to Core Ratio

> **Console:** Machine configuration → Advanced configurations → **vCPUs to core ratio**

| Pilihan | Artinya | Kelebihan | Kekurangan |
|---------|---------|-----------|------------|
| **Default** (2 vCPU = 1 core) | Hyperthreading ON | Lebih murah per vCPU | Performa per vCPU sedikit lebih rendah |
| 1 vCPU = 1 core | Hyperthreading OFF | Performa per vCPU lebih tinggi, lebih aman | 2x lebih mahal (bayar per core) |

### Visible Core Count

> **Console:** Machine configuration → Advanced configurations → **Visible core count**

Menentukan berapa core yang "terlihat" oleh OS. Berguna untuk software licensing berbasis core count.

### Limit CPU Frequency

> **Console:** Machine configuration → Advanced configurations → **☐ Limit the VM's CPU frequency to all-core turbo**

| Centang | Artinya | Kelebihan | Kekurangan |
|---------|---------|-----------|------------|
| Tidak (default) | CPU bisa turbo boost per core | Single-thread lebih cepat | Performa kurang predictable |
| Ya | CPU di-cap ke all-core turbo speed | Performa lebih konsisten/predictable | Single-thread sedikit lebih lambat |

---

## Contoh Pilihan di Project ftlgym

| VM | Console Pilihan | Alasan |
|----|----------------|--------|
| ftlgymweb | N2 → Preset → n2-highcpu-16 | Web server banyak traffic, butuh CPU tinggi, RAM cukup 16 GB |
| apiserver1 | N2 → Custom → 2 vCPU, 4 GB | API ringan, preset n2-standard-2 (8 GB) terlalu besar |
| dbserver1 | N2 → Custom → 12 vCPU, 24 GB | Database, butuh CPU + RAM seimbang, preset tidak cocok |
| ftlhorizon1 | E2 → Custom → 6 vCPU, 8 GB | App server, E2 cukup, custom karena preset tidak pas |
| stridegym | E2 → Preset → e2-medium | Small app, shared core cukup |
| ftlgym-mobile | E2 → Custom → 6 vCPU, 12 GB | Mobile API, butuh lebih dari e2-standard-4 tapi kurang dari standard-8 |
