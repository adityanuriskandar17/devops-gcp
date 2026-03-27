# Backups & Recovery

Panduan lengkap backup dan recovery di **Cloud SQL**, berorientasi pada **GCP Console**.

---

## Console path utama

`Google Cloud Console` → **SQL** → klik **instance** → **Backups**

---

## Automated Backups

**Console path:** `SQL` → instance → **Edit** → **Data protection** → **Automated backups**

### Konfigurasi

| Setting | Opsi | Deskripsi |
|---------|------|-----------|
| **Enable automated backups** | ON / OFF | Backup otomatis harian |
| **Backup window** | Waktu (contoh: 02:00 - 06:00) | Jam berapa backup dijalankan |
| **Retention** | 1 - 365 hari | Berapa lama backup disimpan |
| **Backup location** | Multi-region / Specific region | Lokasi penyimpanan backup |

### Kelebihan & kekurangan

**Automated backups ON**

| Kelebihan | Kekurangan |
|-----------|------------|
| Backup konsisten tanpa intervensi manual | Biaya storage backup (dihitung per GB) |
| **Wajib** untuk PITR (Point-in-Time Recovery) | Window backup bisa sedikit mempengaruhi performa |
| Retention configurable sampai 365 hari | Backup terjadwal — bukan real-time |

**Automated backups OFF**

| Kelebihan | Kekurangan |
|-----------|------------|
| Tidak ada biaya backup | **Data hilang = hilang selamanya** |
| — | Tidak bisa enable PITR |
| — | **Jangan untuk production** |

---

## On-Demand Backups

**Console path:** `SQL` → instance → **Backups** → **Create backup**

Backup manual yang bisa dijalankan kapan saja (sebelum migration, sebelum deploy besar, dll).

| Aspek | Automated | On-demand |
|-------|-----------|-----------|
| Jadwal | Otomatis harian | Manual, kapan saja |
| Retention | Ikut setting (1-365 hari) | Disimpan sampai dihapus manual |
| Jumlah | 1 per hari | Unlimited |
| Biaya | Per GB backup storage | Per GB backup storage |

### Kapan pakai On-demand?

- Sebelum **migration** atau **upgrade** database
- Sebelum **deploy** besar yang mengubah schema
- Sebelum menjalankan **script** yang mengubah data massal
- Sebagai **snapshot** sebelum eksperimen

---

## Point-in-Time Recovery (PITR)

**Console path:** `SQL` → instance → **Edit** → **Data protection** → **Enable point-in-time recovery**

### Apa itu PITR?

PITR memungkinkan restore database ke **detik tertentu** dalam retention window, bukan hanya ke waktu backup harian.

### Cara kerja

```
02:00       08:00      10:30      14:00
  │           │          │          │
  ▼           ▼          ▼          ▼
Backup    Transaksi   ERROR!    Sekarang
harian    normal      DELETE *
                      tanpa WHERE

Recovery target: 10:29:59
  ──► Restore backup 02:00
  ──► Replay binary log / WAL dari 02:00 sampai 10:29:59
  ──► Database kembali ke keadaan tepat sebelum error
```

### Prasyarat PITR

- **Automated backups** harus **enabled**
- MySQL: **binary logging** aktif (otomatis saat enable PITR)
- PostgreSQL: **WAL archiving** aktif (otomatis saat enable PITR)

### PITR — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Bisa recover dari human error ke detik tertentu | Binary log / WAL menambah **disk usage** dan sedikit write overhead |
| Granularity tinggi (bukan hanya per backup harian) | Retention binary log terbatas (biasanya 7 hari, configurable) |
| **Wajib untuk production** | Restore PITR membuat **instance baru** (bukan in-place) |

### Log retention untuk PITR

| Setting | Default | Range | Deskripsi |
|---------|---------|-------|-----------|
| **Transaction log retention** | 7 hari | 1 - 7 hari | Berapa lama binary log / WAL disimpan |

**Console path:** `SQL` → instance → **Edit** → **Data protection** → **Transaction log retention days**

Semakin lama retention = semakin jauh bisa PITR, tapi disk usage semakin besar.

---

## Restore dari Backup

### Restore ke instance yang sama (overwrite)

**Console path:** `SQL` → instance → **Backups** → pilih backup → **Restore**

```
Backup dipilih ──► Confirm restore ──► Instance di-overwrite
                                       (data saat ini HILANG,
                                        diganti data dari backup)
```

**Peringatan:** Restore ke instance yang sama akan **menghapus semua data saat ini** dan mengganti dengan data dari backup.

### Restore ke instance baru

**Console path:** `SQL` → instance → **Backups** → pilih backup → **Restore** → pilih **Restore to a different instance** → **Create new instance**

| Metode | Kelebihan | Kekurangan |
|--------|-----------|------------|
| **Restore ke instance sama** | Cepat, tidak perlu setup baru | Data saat ini hilang, downtime |
| **Restore ke instance baru** | Data asli tetap aman, bisa verifikasi dulu | Perlu provisioning instance baru, biaya tambahan sementara |

**Rekomendasi:** Selalu restore ke **instance baru** dulu, verifikasi data, lalu switch aplikasi.

### PITR Restore (ke waktu tertentu)

**Console path:** `SQL` → instance → **Backups** → **Recover to a point in time** → pilih tanggal dan waktu → **Confirm**

PITR selalu membuat **instance baru** — tidak bisa in-place.

---

## Export / Import

### Export

**Console path:** `SQL` → instance → **Export** → pilih format → tentukan **Cloud Storage URI**

| Format | Deskripsi | Kapan pakai |
|--------|-----------|-------------|
| **SQL dump** | File .sql berisi CREATE TABLE + INSERT | Migration ke platform lain, backup manual |
| **CSV** | Data saja tanpa schema | Analytics, import ke spreadsheet/BigQuery |
| **BAK** (SQL Server) | Native backup format | Migration SQL Server |

### Import

**Console path:** `SQL` → instance → **Import** → pilih file dari **Cloud Storage** → pilih database target

### Export/Import — kelebihan & kekurangan

| Kelebihan | Kekurangan |
|-----------|------------|
| Portable — bisa dipakai di platform lain | Lambat untuk database besar (>100GB) |
| Bisa selective (per database / per tabel) | Downtime mungkin dibutuhkan untuk konsistensi |
| Format standard (SQL, CSV) | Tidak seefisien backup native Cloud SQL |

### CLI export/import

```bash
# Export ke Cloud Storage
gcloud sql export sql INSTANCE_NAME gs://BUCKET/export.sql \
    --database=DB_NAME

# Import dari Cloud Storage
gcloud sql import sql INSTANCE_NAME gs://BUCKET/export.sql \
    --database=DB_NAME
```

---

## Backup Location

### Multi-region vs Specific region

| Opsi | Deskripsi |
|------|-----------|
| **Multi-region** | Backup disimpan di lokasi multi-region terdekat (default) |
| **Specific region** | Backup hanya disimpan di region yang dipilih |

| Aspek | Multi-region | Specific region |
|-------|-------------|-----------------|
| **Durability** | Lebih tinggi (disebar) | Standar |
| **Data residency** | Data bisa di luar negara | Kontrol penuh lokasi data |
| **Biaya** | Lebih mahal | Lebih murah |
| **Recovery speed** | Tergantung lokasi | Lebih predictable |

### Cross-region backup (Enterprise Plus)

**Enterprise Plus** mendukung **cross-region automated backups** — backup otomatis disimpan di region berbeda dari primary.

```
Primary (Jakarta) ──backup──► Backup storage (Singapore)

Jakarta down? ──► Restore dari backup di Singapore ke instance baru
```

| Kelebihan | Kekurangan |
|-----------|------------|
| Disaster recovery jika seluruh region down | Hanya tersedia di Enterprise Plus |
| RPO (Recovery Point Objective) rendah | Biaya transfer data cross-region |

---

## Biaya Backup

| Komponen | Harga (perkiraan) |
|----------|-------------------|
| Backup storage | ~$0.08/GB/bulan |
| Binary log / WAL storage | Termasuk dalam disk usage instance |
| Cross-region backup transfer | Egress charges berlaku |

**Tips hemat:**
- Set retention sesuai kebutuhan (jangan 365 hari kalau tidak perlu)
- Hapus on-demand backup yang sudah tidak diperlukan
- Gunakan **export ke Cloud Storage** (Nearline/Coldline) untuk arsip jangka panjang

---

## Ringkasan Rekomendasi

| Tipe instance | Automated backup | PITR | Retention | On-demand |
|---------------|-----------------|------|-----------|-----------|
| Production | **ON** | **ON** | 30 hari | Sebelum deploy/migration |
| Staging | ON | ON | 7 hari | Opsional |
| Development | Opsional | OFF | 1 hari | Opsional |
| Compliance | **ON** | **ON** | 365 hari | Sebelum perubahan apapun |
