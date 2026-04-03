# Dokumentasi Perbaikan Backend Go POS

> Tanggal: 03 April 2026

---

## 1. Dashboard

### 1.1 Statistik Dashboard Tidak Sinkron
- **File:** `controllers/dashboardController.go`
- **Sebelum:** Endpoint `/dashboard` mengembalikan data kosong untuk "Pesanan Minggu Ini", "Stok Perlu Perhatian", "Reservasi Hari Ini", dan "Aktivitas Terkini"
- **Sesudah:** Ditambahkan query untuk:
  - `OrderWeek` — COUNT transaksi 7 hari terakhir
  - `Reservations` — COUNT reservasi hari ini berdasarkan `reservation_date`
  - `StockAlert` — COUNT bahan baku dengan status perlu perhatian
  - `RecentActivities` — list aktivitas terkini (transaksi, reservasi, dll)
- **Perubahan struct:** `DashboardResponse` ditambah field `OrderWeek`, `Reservations`, `RecentActivities`

### 1.2 Route Dashboard Redirect Issue
- **File:** `routes/routes.go`
- **Sebelum:** `dashboardGroup.GET("/", ...)` menyebabkan redirect 301 (`/dashboard` → `/dashboard/`) yang memicu error CORS di browser
- **Sesudah:** Diubah ke `router.GET("/dashboard", ...)` tanpa trailing slash

---

## 2. Inventory (Bahan Baku)

### 2.1 Stok Terpakai Selalu 0
- **File:** `controllers/bahanbakuController.go`, `models/bahanBaku.go`
- **Sebelum:** DTO `BahanBakuListDTO` tidak memiliki field `StokTerpakai`, sehingga nilai yang sudah dihitung tidak pernah dikirim ke frontend
- **Sesudah:** Ditambahkan field `StokTerpakai float64` ke `BahanBakuListDTO` dan di-mapping dari `stokTerpakaiHariIni` yang dihitung dari `stock_histories`

### 2.2 Resep Tidak Terhubung ke Produk (Fallback Recipe)
- **File:** `controllers/orderController.go` (fungsi `processStockReduction`)
- **Sebelum:** Jika `product.Recipe` nil (karena `product_id` di tabel recipes kosong), stok bahan baku tidak dikurangi saat order
- **Sesudah:** Ditambahkan fallback lookup: cari resep berdasarkan nama produk + outlet. Jika ditemukan, otomatis link `product_id` ke resep untuk order berikutnya

---

## 3. Order / Transaksi

### 3.1 Order Terhubung ke Shift Lama (Zombie Shift)
- **File:** `controllers/orderController.go` (fungsi `CreateOrderByCash`, `CreateOrderByQris`, `CreateOrderByDebit`)
- **Sebelum:** Query shift aktif menggunakan `.First(&shift)` tanpa ordering, sehingga bisa mengambil shift aktif paling lama (zombie)
- **Sesudah:** Ditambahkan `.Order("start_shift desc")` agar selalu mengambil shift aktif terbaru

### 3.2 WhatsApp Invoice — Logo URL Dihapus
- **File:** `services/whatsapp.go`
- **Sebelum:** Pesan WhatsApp menyertakan URL logo merchant yang tidak relevan
- **Sesudah:** Embedding `inv.Store.Logo` URL dihapus dari teks pesan WhatsApp

---

## 4. Shift Management

### 4.1 Auto-Close Zombie Shift
- **File:** `controllers/shiftController.go` (fungsi `CreateShift`)
- **Sebelum:** `CreateShift` hanya cek shift aktif dari user yang sama. Shift aktif dari user lain di outlet yang sama tetap terbuka (zombie)
- **Sesudah:** Saat shift baru berhasil dibuat, semua shift aktif lain di outlet yang sama (dari user manapun) otomatis ditutup
- **Kode:**
  ```go
  config.DB.Model(&models.Shift{}).
      Where("outlet_id = ? AND status = ? AND user_id != ?", OutletID, "Aktif", targetUserID).
      Updates(map[string]interface{}{
          "status":       "Non-Aktif",
          "closed_shift": time.Now(),
      })
  ```

---

## 5. Reservasi

### 5.1 Server-Side Exclude Status
- **File:** `controllers/reservasiController.go` (fungsi `GetReservasi`)
- **Sebelum:** Tidak ada parameter untuk mengecualikan status tertentu dari query
- **Sesudah:** Ditambahkan query parameter `exclude_status` yang mem-filter reservasi langsung di database
- **Contoh:** `GET /reservasi/list?exclude_status=Completed`

### 5.2 Counter Cancel Selalu 0
- **File:** `controllers/reservasiController.go` (fungsi `GetReservasiCancel`)
- **Sebelum:** Query hanya cocokkan `status = 'Canceled'`, padahal frontend menyimpan `'Cancel'`
- **Sesudah:** Query diubah ke `status IN ('Cancel', 'Canceled')` untuk menangkap kedua variasi

### 5.3 Counter "Hari Ini" Menghitung Semua Tanggal
- **File:** `controllers/reservasiController.go` (fungsi `GetReservasi`)
- **Sebelum:** `TotalCount` di response menghitung semua reservasi non-completed tanpa filter tanggal
- **Sesudah:** `TotalCount` dihitung khusus untuk `reservation_date = today` dan `status NOT IN ('Completed', 'Cancel', 'Canceled')`

### 5.4 JSON Field Mismatch (Jumlah Orang & Notes)
- **File:** `models/reservasi.go`
- **Sebelum:** `CountPerson` menggunakan tag `json:"number_of_people"`, `Notes` menggunakan `json:"notes"` — tidak cocok dengan frontend
- **Sesudah:** Distandarisasi ke `json:"count_person"` dan `json:"note"` di struct `Reservasi`, `ReservasiRequest`, `UpdateReservasiRequest`, dan `ReservasiDetail`

---

## 6. Invoice Email

### 6.1 Redesign Template Invoice
- **File:** `templates/invoice.html`
- **Sebelum:** Layout plain dengan `<style>` block dan struktur sederhana
- **Sesudah:** Desain modern email-safe dengan:
  - Header bergradient gelap (#1a1a2e) dengan logo + info toko
  - Tabel item dengan header uppercase, extras indent, catatan item
  - Summary section terstruktur (subtotal, diskon, pajak, service, pembulatan, total)
  - Payment info dalam card terpisah
  - Footer centered dengan branding

### 6.2 Logo Merchant di Email (CID Embed)
- **File:** `services/email.go`, `dtoTransaksi/invoiceResponse.go`, `controllers/orderController.go`
- **Sebelum:** Logo menggunakan path relatif lokal (`uploads/outlets/xxx.jpg`) yang tidak bisa diakses oleh email client → gambar broken
- **Sesudah:**
  - `InvoiceResponse` ditambah field `LogoCID string` untuk referensi CID
  - `orderController.go` mengisi `LogoCID = filepath.Base(outlet.Logo)` di 3 tempat builder invoice
  - `services/email.go` meng-embed file logo via `gomail.Embed()` setelah validasi file exists
  - Template mereferensikan logo via `<img src="cid:{{.LogoCID}}">`

### 6.3 Redesign Inline Invoice (ShareInvoice)
- **File:** `utils/invoice.go`
- **Sebelum:** HTML sederhana tanpa logo, tanpa info toko, tanpa detail summary
- **Sesudah:**
  - Fungsi baru `GenerateInvoiceHTMLWithOutlet(trx, outlet)` dengan desain matching template utama
  - Logo di-convert ke base64 data URI (karena path ini menggunakan `smtp.SendMail` biasa)
  - Fungsi lama `GenerateInvoiceHTML(trx)` tetap ada sebagai wrapper backward-compatible
  - `ShareInvoice` di `orderController.go` sekarang load outlet data dan memanggil fungsi baru

---

## Daftar File Backend yang Diubah

| File | Perubahan |
|------|-----------|
| `routes/routes.go` | Fix dashboard route, update order/reservasi routes |
| `controllers/dashboardController.go` | Query statistik dashboard |
| `controllers/bahanbakuController.go` | Mapping `StokTerpakai` ke DTO |
| `models/bahanBaku.go` | Tambah field `StokTerpakai` di `BahanBakuListDTO` |
| `controllers/orderController.go` | Fallback recipe, shift ordering, LogoCID, ShareInvoice outlet |
| `controllers/shiftController.go` | Auto-close zombie shift |
| `controllers/reservasiController.go` | `exclude_status`, fix cancel count, fix hari ini count |
| `models/reservasi.go` | Standarisasi JSON tags `count_person`, `note` |
| `services/email.go` | Embed logo CID via gomail |
| `services/whatsapp.go` | Hapus logo URL dari pesan WA |
| `dtoTransaksi/invoiceResponse.go` | Tambah field `LogoCID` |
| `templates/invoice.html` | Full redesign template invoice |
| `utils/invoice.go` | Redesign inline HTML + base64 logo + fungsi baru |
