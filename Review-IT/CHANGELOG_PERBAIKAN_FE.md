# Dokumentasi Perbaikan Frontend Flutter POS

> Tanggal: 03 April 2026

---

## 1. Menu/Pesan (POS)

### 1.1 Nomor Meja → Dropdown
- **File:** `lib/app/modules/pos/views/widgets/customer_data_dialog.dart`
- **Sebelum:** Input teks bebas untuk nomor meja
- **Sesudah:** Dropdown yang menampilkan daftar meja tersedia dari API (`TableService`)
- **Terkait:** Ditambahkan `TableService` di `home_binding.dart`

### 1.2 Harga Topping di Order Summary
- **File:** `lib/app/modules/pos/views/widgets/order_summary_widget.dart`
- **Sebelum:** Topping hanya menampilkan nama
- **Sesudah:** Setiap topping menampilkan nama beserta harganya (contoh: `+ Extra Shot (+Rp 5.000)`)

### 1.3 Detail Topping di Receipt/Invoice Dialog
- **File:** `lib/app/modules/pos/views/widgets/receipt_dialog.dart`, `lib/app/data/models/invoice_detail_model.dart`
- **Sebelum:** Invoice tidak menampilkan detail topping
- **Sesudah:** Setiap item di invoice menampilkan daftar topping/extras beserta harga masing-masing

---

## 2. Dashboard (Home)

### 2.1 Sinkronisasi Statistik Dashboard
- **File:** `lib/app/modules/home/views/dashboard_view.dart`, `lib/app/data/models/dashboard_model.dart`
- **Sebelum:** "Pesanan Minggu Ini", "Stok Perlu Perhatian", "Reservasi Hari Ini" selalu 0; "Aktivitas Terkini" kosong
- **Sesudah:** Semua statistik ditampilkan secara real-time dari data backend
- **Perubahan model:** Ditambahkan `DashboardOrderWeek`, `DashboardReservations`, `List<DashboardActivity>`

---

## 3. Reservasi

### 3.1 Reservasi Baru Tidak Muncul di List
- **File:** `lib/app/core/services/reservation_service.dart`, `lib/app/modules/reservation/controllers/reservation_controller.dart`
- **Sebelum:** Filter "Completed" dilakukan di client-side, menyebabkan item baru di halaman berikutnya tidak terambil
- **Sesudah:** Filter `exclude_status=Completed` dikirim ke backend, sehingga paginasi server sudah mengecualikan status Completed

### 3.2 Jumlah Orang Selalu 0
- **File:** `lib/app/data/models/reservation_model.dart`
- **Sebelum:** Field `count_person` tidak terbaca karena mismatch JSON key (`number_of_people` vs `count_person`)
- **Sesudah:** Parsing mendukung kedua key dengan fallback dan konversi tipe yang robust

### 3.3 Counter "Cancel" Selalu 0
- **Perbaikan di backend:** Query diubah dari `status = 'Canceled'` menjadi `status IN ('Cancel', 'Canceled')`

### 3.4 Counter "Hari Ini" Menghitung Semua Tanggal
- **Perbaikan di backend:** Query `TotalCount` sekarang filter berdasarkan `reservation_date = today` dan `status NOT IN ('Completed', 'Cancel', 'Canceled')`

---

## 4. Transaksi

### 4.1 Text Overlap pada Stat Card "Total Transaksi"
- **File:** `lib/app/modules/transaction/views/transaction_view.dart`
- **Sebelum:** Label teks pada `_StatCard` meluber/overlap jika lebar card terbatas
- **Sesudah:** Label dibungkus `Expanded` dengan `TextOverflow.ellipsis` dan `maxLines: 1`

---

## 5. Manajemen Shift

### 5.1 Saldo Awal Bertambah Sendiri
- **File:** `lib/app/modules/shift/views/shift_view.dart`
- **Sebelum:** "Saldo Awal" menampilkan `expectedTotal` yang sudah termasuk penjualan
- **Sesudah:** Menampilkan `cashAwal + eWalletAwal + debitCreditAwal` (hanya modal awal murni)

### 5.2 "Cash" Menunjukkan Rp 0 Padahal Ada Transaksi Cash
- **Perbaikan di backend:** Order creation (`CreateOrderByCash`, `CreateOrderByQris`, `CreateOrderByDebit`) sekarang menggunakan `.Order("start_shift desc")` untuk mengambil shift aktif terbaru. `CreateShift` otomatis menutup shift aktif lain di outlet yang sama.

### 5.3 Detail Shift — Total Items Salah
- **File:** `lib/app/data/models/shift_model.dart`
- **Sebelum:** `totalItems` di-mapping dari `transaction_count` (jumlah transaksi), bukan jumlah item
- **Sesudah:** Prioritas mapping diubah: `total_items` → `items_count` → `transaction_count`

### 5.4 Detail Shift — Grand Total Salah
- **File:** `lib/app/data/models/shift_model.dart`, `lib/app/modules/shift/views/widgets/shift_detail_dialog.dart`
- **Sebelum:** "Grand Total" menampilkan `total_sales` (expected register balance = modal + sales - refund), bukan total transaksi sebenarnya
- **Sesudah:** Ditambahkan field `grandTotal` yang di-mapping dari `grand_total` (SUM transaksi dari database)

### 5.5 Detail Shift — TOTAL BERSIH Double-Subtract Refund
- **File:** `lib/app/modules/shift/views/widgets/shift_detail_dialog.dart`, `lib/app/core/services/printer_service.dart`
- **Sebelum:** `TOTAL BERSIH = totalSales - refund` → refund dihitung dua kali karena `totalSales` sudah dikurangi refund
- **Sesudah:** `TOTAL BERSIH = grandTotal - refund` → menggunakan grand total transaksi murni

---

## 6. Invoice Email (Backend + Template)

### 6.1 Redesign Template Invoice
- **File backend:** `templates/invoice.html`
- **Sebelum:** Layout plain tanpa styling yang baik
- **Sesudah:** Desain modern dengan header bergradient, tabel item rapi, summary terstruktur, payment info card, dan footer branding

### 6.2 Logo Merchant di Email Invoice
- **File backend:** `services/email.go`, `dtoTransaksi/invoiceResponse.go`, `controllers/orderController.go`
- **Sebelum:** Logo menggunakan path lokal relatif yang tidak bisa diakses email client (gambar broken)
- **Sesudah:** Logo di-embed sebagai CID attachment via `gomail.Embed()`, ditampilkan di header invoice

### 6.3 Redesign Inline Invoice (ShareInvoice)
- **File backend:** `utils/invoice.go`
- **Sebelum:** HTML sederhana tanpa logo dan styling minimal
- **Sesudah:** Desain matching dengan template utama, logo di-convert ke base64 data URI

---

## Daftar File Frontend yang Diubah

| File | Perubahan |
|------|-----------|
| `lib/app/modules/pos/views/widgets/customer_data_dialog.dart` | Dropdown nomor meja |
| `lib/app/modules/pos/views/widgets/order_summary_widget.dart` | Tampilkan harga topping |
| `lib/app/modules/pos/views/widgets/receipt_dialog.dart` | Detail topping di invoice |
| `lib/app/data/models/invoice_detail_model.dart` | Tambah `InvoiceExtra` class |
| `lib/app/modules/home/views/dashboard_view.dart` | Sinkronisasi statistik dashboard |
| `lib/app/data/models/dashboard_model.dart` | Model dashboard baru |
| `lib/app/modules/home/bindings/home_binding.dart` | Register `TableService` |
| `lib/app/core/services/reservation_service.dart` | Parameter `excludeStatus` |
| `lib/app/modules/reservation/controllers/reservation_controller.dart` | Server-side filter |
| `lib/app/data/models/reservation_model.dart` | Fix parsing `count_person` |
| `lib/app/modules/transaction/views/transaction_view.dart` | Fix text overflow stat card |
| `lib/app/modules/shift/views/shift_view.dart` | Fix Saldo Awal |
| `lib/app/data/models/shift_model.dart` | Fix `totalItems`, tambah `grandTotal` |
| `lib/app/modules/shift/views/widgets/shift_detail_dialog.dart` | Fix Grand Total & TOTAL BERSIH |
| `lib/app/core/services/printer_service.dart` | Fix Grand Total & TOTAL BERSIH di print |
