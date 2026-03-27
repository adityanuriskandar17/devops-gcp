# Autoclass (Recommended) — Console

**Autoclass** adalah fitur **Google Cloud Storage** yang memindahkan objek antar **storage class** berdasarkan **pola akses (access pattern)**. Tanpa atur class per file secara manual—**GCP** yang menyesuaikan **Standard → Nearline → Coldline → Archive** dan bisa **naik kembali** ke **Standard** bila objek ramai diakses lagi.

Dokumen ini berfokus pada **Google Cloud Console**.

---

## Navigasi Console: aktifkan saat buat bucket

**Path:**

`Console: Cloud Storage → Buckets → CREATE → ☑ Autoclass`

Di wizard **Create bucket**, cari section **Autoclass** (biasanya bersamaan dengan langkah **Default storage class**). Centang **Autoclass** untuk mengaktifkan.

| Perilaku UI (umum) | Penjelasan |
|--------------------|------------|
| **Autoclass ON** | Class objek dikelola otomatis; tidak perlu pilih satu class statis untuk seluruh siklus hidup objek. |
| **Autoclass OFF** | Pilih **Default storage class** manual dari dropdown (**Standard**, **Nearline**, **Coldline**, **Archive**). |

---

## Navigasi Console: aktifkan di bucket yang sudah ada

**Path:**

`Console: Cloud Storage → Buckets → klik nama bucket → tab Configuration → Autoclass → EDIT / Enable`

- Buka **Buckets** → pilih bucket target.
- Tab **Configuration** → bagian **Autoclass**.
- Gunakan **EDIT** atau toggle **Enable Autoclass** sesuai tampilan Console saat ini.

**Catatan:** mengaktifkan **Autoclass** di bucket existing bisa punya syarat (mis. bucket tidak memakai konfigurasi tertentu yang bentrok). Jika tombol nonaktif, baca pesan error di UI atau dokumentasi GCP terbaru untuk constraint bucket.

---

## Kelebihan & Kekurangan Autoclass

| Kelebihan | Kekurangan |
|-----------|------------|
| Tidak perlu memutuskan class manual untuk tiap tahap umur data | Kurang kontrol prediktif dibanding policy **lifecycle** berbasis usia murni |
| Biaya cenderung mengikuti pola akses aktual (hemat untuk data dingin) | Perilaku transisi bergantung pada **access pattern**—perlu pemahaman agar tidak kaget saat cost retrieval naik setelah objek turun class |
| Performa untuk data panas tetap di **Standard** secara otomatis | Bucket/constraint tertentu mungkin tidak mendukung Autoclass |
| Objek yang jarang diakses turun class; yang “hidup” lagi bisa naik ke **Standard** | Bukan pengganti **Object Lifecycle** untuk **delete** objek—hanya class |
| Satu toggle di **Console** untuk enable | Untuk kebutuhan compliance ketat, kadang perlu kombinasi dengan **lifecycle** eksplisit |

---

## Cara Kerja

**Skenario: 3 file di bucket dengan Autoclass aktif**

```
╔══════════════════════════════════════════════════════════════════╗
║  AUTOCLASS ENGINE (GCP) - monitor akses pattern otomatis       ║
╚══════════════════════════╤═══════════════════════════════════════╝
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
 image_a.jpg          image_b.jpg         image_c.jpg
 (jarang akses)       (sering akses)      (sering akses)
```

**image_b dan image_c: sering diakses, tetap di Standard**

```
image_b.jpg ──► STANDARD (tetap, karena sering diakses)
image_c.jpg ──► STANDARD (tetap, karena sering diakses)
```

**image_a: jarang diakses, otomatis turun ke class lebih murah**

```
Waktu          Class         Alasan
─────          ─────         ──────
Hari ke-0      STANDARD      Awal upload
               │
               ▼  (30 hari tidak diakses)
Hari ke-30     NEARLINE      Mulai jarang diakses
               │
               ▼  (90 hari tidak diakses)
Hari ke-90     COLDLINE      Makin jarang
               │
               ▼  (365 hari tidak diakses)
Hari ke-365    ARCHIVE       Tidak pernah diakses
```

**Lalu image_a tiba-tiba diakses lagi, otomatis naik!**

```
SEBELUM                           SESUDAH
═══════                           ═══════

image_a.jpg                       image_a.jpg
Class: ARCHIVE                    Class: STANDARD
Status: tidak diakses             Status: mulai sering diakses
                  │
                  │  user mulai akses image_a lagi
                  │
                  ▼
         ARCHIVE ──► STANDARD
         (otomatis naik kembali!)
```

---

## Ringkasan Arah Perpindahan

```
Sering diakses   ──────►  NAIK ke Standard   (performa cepat)
Jarang diakses   ──────►  TURUN ke Nearline  (hemat biaya)
Makin jarang     ──────►  TURUN ke Coldline  (lebih hemat)
Tidak pernah     ──────►  TURUN ke Archive   (paling hemat)
Diakses lagi     ──────►  NAIK ke Standard   (otomatis pulih)
```

* File sering diakses → pindah ke **Standard**
* File jarang diakses → pindah ke **Nearline / Coldline / Archive**
* File yang tadinya turun → **bisa naik lagi** kalau mulai sering diakses

---

## Best practice (Console)

* Saat **Create bucket**, pertimbangkan **☑ Autoclass** bila pola akses campuran atau belum pasti.
* Setelah enable, pantau **Billing** dan **metrics** bucket untuk memahami retrieval vs storage savings.

---

## Autoclass vs Object Lifecycle Management

| Aspek | Autoclass | Lifecycle Management |
|-------|-----------|---------------------|
| Tujuan | Pindah **class** otomatis berdasarkan **akses** | Hapus / pindah objek berdasarkan **usia** atau kondisi |
| Trigger | Pola akses (sering / jarang) | Waktu (hari sejak dibuat, dll.) |
| Bisa naik class? | Ya (**Archive → Standard**, dll.) | Biasanya tidak untuk “naik”; fokus turun / delete |
| Bisa hapus objek? | Tidak | Ya |
| Perlu konfigurasi? | Cukup **enable** di **Console** | Perlu atur **rules** di **Lifecycle** |

Keduanya bisa dipakai bersamaan: **Autoclass** untuk optimasi class menurut akses; **Lifecycle** untuk auto-cleanup atau aturan berbasis umur.

**Console path (lifecycle, referensi):** `Cloud Storage → Buckets → bucket → tab Lifecycle` (detail di [03-lifecycle-management.md](03-lifecycle-management.md)).

---

## Lihat juga

* **Storage classes** & dropdown **Default storage class**: [01-storage-classes.md](01-storage-classes.md)
* Indeks: [README.md](README.md)
