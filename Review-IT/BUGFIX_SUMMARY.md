# Ringkasan Bug Fixing POS System

> Dokumen ini mencatat seluruh perbaikan bug yang telah dilakukan pada sistem POS (Point of Sales).

---

## 1. Dashboard Utama

### 1.1 Hitungan Margin Pesanan Minggu Ini
**Masalah:** Total margin di kolom "Pesanan minggu ini" tidak sesuai dengan data margin dari manajemen resep.

**Penyebab:** Query margin menggunakan kalkulasi yang tidak memperhitungkan HPP (Harga Pokok Penjualan) dari resep secara benar.

**File yang diubah:**
- `backend-golang-pos/controllers/dashboardController.go`

**Perbaikan:** Kalkulasi margin dikoreksi menggunakan rumus `(selling_price - HPP) * qty` yang sesuai dengan data di manajemen resep.

---

### 1.2 Stock Alert / Peringatan Stok
**Masalah:** Notifikasi peringatan stok menipis tidak sesuai — produk dengan stok hampir habis masih berstatus "Aman", sementara produk yang masih cukup justru muncul sebagai peringatan.

**Penyebab:** Threshold untuk status stok (aman/menipis/habis) tidak dikalibrasi dengan benar.

**File yang diubah:**
- `backend-golang-pos/controllers/dashboardController.go`

**Perbaikan:** Penyesuaian logika threshold status stok untuk bahan baku dan produk items.

---

### 1.3 Reservasi Hari Ini
**Masalah:** Kolom "Reservasi yang akan datang" menunjukkan angka 0, padahal terdapat data reservasi yang seharusnya tercantum.

**Penyebab:** Query tidak memperhitungkan reservasi dengan status yang benar untuk "yang akan datang".

**File yang diubah:**
- `backend-golang-pos/controllers/dashboardController.go`

**Perbaikan:** Query reservasi diperbaiki untuk menghitung reservasi upcoming dengan benar.

---

### 1.4 Custom Filter Rentang Tanggal (Fitur Baru)
**Masalah:** Dashboard hanya memiliki filter preset (Hari ini, Kemarin, 7 hari, 30 hari). User meminta filter custom berdasarkan rentang tanggal seperti di halaman Laporan & Analitik.

**Penyebab (Kemarin tidak berfungsi):** Backend tidak mengenali `filter=1` yang dikirim untuk option "Kemarin".

**File yang diubah:**
- `backend-golang-pos/controllers/dashboardController.go` — Tambah case `"1"` dan `"yesterday"` pada switch filter
- `frontend-web-pos/src/services/api.ts` — `getDashboard()` sekarang menerima `startDate`/`endDate`
- `frontend-web-pos/src/pages/MerchantDashboard.tsx` — Tambah option "Pilih Rentang Tanggal" dengan 2 input tanggal + tombol "Terapkan"

**Perbaikan:**
- Dropdown filter ditambah option **"Pilih Rentang Tanggal"**
- Muncul date picker (tanggal mulai & selesai) + tombol Terapkan
- Backend sudah support `start_date` & `end_date` query params
- Fix filter "Kemarin" yang sebelumnya tidak berfungsi

---

## 2. Manajemen Refund

### 2.1 Sesi Akses Refund Tetap Berlaku
**Masalah:** Setelah owner/manager login ke halaman refund, sesi tetap berlaku sehingga kasir bisa memproses refund tanpa persetujuan ulang.

**Penyebab:** Tidak ada mekanisme single-use token untuk akses refund.

**File yang diubah:**
- `backend-golang-pos/controllers/orderController.go` — Endpoint refund + token validation
- `backend-golang-pos/models/refundToken.go` — Model `RefundToken` (baru)
- `backend-golang-pos/routes/routes.go` — Route baru untuk refund token
- `frontend-flutter-pos/lib/app/modules/refund/` — UI + controller refund

**Perbaikan:**
- Implementasi mekanisme **single-use refund token** (`X-Refund-Token` header)
- Satu kali login owner/manager hanya berlaku untuk 1 kali proses refund
- Kasir harus meminta persetujuan ulang untuk setiap transaksi refund

---

### 2.2 Filter Data Refund Berdasarkan Rentang Tanggal
**Masalah:** Saat menarik data berdasarkan rentang tanggal, riwayat transaksi non-refund masih muncul.

**File yang diubah:**
- `backend-golang-pos/controllers/orderController.go`
- `frontend-flutter-pos/lib/app/modules/refund/`

**Perbaikan:**
- Data yang ditampilkan setelah filter hanya: riwayat refund, total nilai refund, net balance
- User hanya dapat memproses refund untuk transaksi di shift yang sedang berjalan

---

## 3. Invoice

### 3.1 Nama Kasir Salah di Invoice
**Masalah:** Saat login sebagai kasir, invoice menampilkan nama owner ("Budi Owner POS") bukan nama kasir yang bertugas ("Andi Cashier").

**Penyebab:** Terdapat fallback logic di backend yang mengganti nama kasir kosong dengan nama owner outlet.

**File yang diubah:**
- `backend-golang-pos/controllers/orderController.go` — `GetInvoice`, `SendInvoiceWA`, `SendInvoiceEmail`, `ViewInvoice`, `ShareInvoice`

**Perbaikan:**
- Hapus fallback logic yang menimpa nama kasir dengan nama owner
- Tambah `Preload("User")` pada query transaksi untuk memastikan nama kasir ter-load
- Jika nama kasir kosong, tampilkan "Kasir" bukan nama owner

---

### 3.2 Diskon di Invoice WhatsApp Tidak Menampilkan Persentase
**Masalah:** Diskon di invoice WA hanya menampilkan nilai Rupiah total, tidak ada persentase (%).

**File yang diubah:**
- `backend-golang-pos/controllers/orderController.go` — Tambah field `DiskonPercent` dan `DiskonType`
- `backend-golang-pos/services/whatsapp.go` — Format diskon `Discount (X%) : -Rp. Y`
- `frontend-flutter-pos/lib/app/data/models/invoice_detail_model.dart` — Tambah field `diskonPercent`, `diskonType`
- `frontend-flutter-pos/lib/app/modules/pos/views/widgets/receipt_dialog.dart` — Tampilkan `Diskon (X%)`

**Perbaikan:** Diskon sekarang menampilkan format **"Discount (10%) : -Rp. 5.000"** di WA dan receipt dialog.

---

### 3.3 Alamat & No. Telp Toko Hilang di Invoice Email
**Masalah:** Invoice email tidak menampilkan alamat toko dan nomor telepon.

**File yang diubah:**
- `backend-golang-pos/controllers/orderController.go` — `SendInvoiceEmail`

**Perbaikan:** Tambah error handling pada query outlet, memastikan data outlet (alamat + telepon) tersedia sebelum kirim email.

---

## 4. Manajemen Reservasi

### 4.1 Counter "Reservasi Dibatalkan" Tidak Konsisten
**Masalah:** Halaman menunjukkan "Cancel: 1 Reservasi" tapi data tidak muncul di list. Data reservasi sudah terhapus permanen namun masih terhitung.

**Penyebab:**
- Counter cancel menghitung seluruh data (termasuk yang sudah di-soft delete)
- Counter tidak di-filter berdasarkan rentang tanggal yang aktif
- UI mencegah penghapusan reservasi berstatus "cancel"

**File yang diubah:**
- `backend-golang-pos/controllers/reservasiController.go` — `GetReservasiCancel`, `GetReservasi`, `GetReservasiList`
- `frontend-flutter-pos/lib/app/modules/reservation/views/reservation_view.dart`
- `frontend-flutter-pos/lib/app/modules/reservation/controllers/reservation_controller.dart`

**Perbaikan:**
- Counter cancel sekarang di-filter berdasarkan rentang tanggal aktif
- Tambah `WHERE deleted_at IS NULL` pada query list dan deposit
- Tombol delete diaktifkan kembali untuk reservasi berstatus "cancel" dan "reservasi"

---

## 5. Report Detail Shift

### 5.1 Rounding Ditampilkan Sebagai Nilai Positif (+)
**Masalah:** Di report detail shift, rounding ditampilkan sebagai `(+) Rounding: +Rp310`, padahal seharusnya dikurangi seperti item lainnya (Refund, Pajak, Service, Diskon).

**File yang diubah:**
- `frontend-flutter-pos/lib/app/modules/shift/views/widgets/shift_detail_dialog.dart`
- `frontend-flutter-pos/lib/app/core/services/printer_service.dart`

**Perbaikan:**
- Label diubah menjadi **`(-) Rounding:`** secara konsisten
- Nilai ditampilkan dalam format **(RpX)** dengan warna orange
- Perubahan diterapkan baik di UI dialog maupun thermal print

---

### 5.2 Topping Tidak Muncul di Produk Terjual (Fitur Baru)
**Masalah:** Bagian "Produk Terjual" hanya menampilkan produk utama tanpa topping. Net Sales hanya menghitung harga produk, tidak termasuk topping sehingga nilainya kurang tepat.

**Penyebab:** Query `ProductSold` hanya meng-aggregate `transaksi_items.price * qty`, tidak memperhitungkan `extra_transaksi_items`.

**File yang diubah:**
- `backend-golang-pos/models/shift.go` — Tambah field `Toppings []ToppingSold` pada `ProductSold`, tambah struct `ToppingSold`
- `backend-golang-pos/controllers/shiftDetailController.go` — Query sekarang menggunakan `SUM(transaksi_items.subtotal)` yang sudah termasuk harga topping + query terpisah untuk data topping per produk
- `backend-golang-pos/controllers/shiftController.go` — Perubahan yang sama
- `frontend-flutter-pos/lib/app/data/models/shift_model.dart` — Tambah class `ShiftTopping`, tambah field `toppings` pada `ShiftItem`
- `frontend-flutter-pos/lib/app/modules/shift/views/widgets/shift_detail_dialog.dart` — Tampilkan list topping di bawah setiap produk
- `frontend-flutter-pos/lib/app/core/services/printer_service.dart` — Topping muncul di thermal print report

**Perbaikan:**
- Setiap produk menampilkan daftar topping yang digunakan beserta harga
- Net Sales sekarang menghitung `SUM(subtotal)` yang sudah termasuk topping
- Thermal print juga menampilkan topping

---

## 6. Report & Analitik

### 6.1 Perbedaan Nilai Refund Antara Mobile & Admin Panel
**Masalah:** Total refund di mobile = Rp 362.000, di admin panel = Rp 392.000 untuk rentang tanggal yang sama.

**Penyebab:**
- Mobile (`GetFlutterReport`): menggunakan `SUM(subtotal)` → harga produk saja
- Admin (`GetAnalyticsReport`): menggunakan `SUM(total)` → termasuk pajak & service
- Admin juga tidak ada filter `is_paid = true` pada query refund

**File yang diubah:**
- `backend-golang-pos/controllers/reportController.go` — `GetAnalyticsReport`, `ExportDashboardExcel1`, `ExportDashboardPDF1`, daily balance

**Perbaikan:**
- Semua endpoint refund sekarang konsisten menggunakan **`SUM(subtotal)`** (harga produk saja, sesuai aturan bisnis)
- Tambah filter **`is_paid = true`** pada semua query refund yang kurang

---

### 6.2 Perbedaan Jumlah Pelanggan Antara Mobile & Admin Panel
**Masalah:** Total pelanggan di mobile = 11 Orang, di admin panel = 7 Orang.

**Penyebab:**
- Mobile: `COUNT(DISTINCT COALESCE(NULLIF(customer_phone,''), NULLIF(customer_name,''), id))` → fallback ke `id` membuat setiap transaksi tanpa nomor telepon dihitung sebagai pelanggan unik
- Admin: `COUNT(DISTINCT customer_phone) WHERE phone IS NOT NULL` → hanya berdasarkan nomor telepon

**File yang diubah:**
- `backend-golang-pos/controllers/reportController.go` — `GetFlutterReport` (current + previous period)
- `backend-golang-pos/controllers/reportFlutterExport.go` — Export CSV/PDF

**Perbaikan:**
- Semua endpoint konsisten menggunakan **`COUNT(DISTINCT customer_phone) WHERE phone IS NOT NULL AND phone != ''`**
- Query dipisah agar filter `customer_phone` tidak mempengaruhi total_sales/total_transaction

---

### 6.3 Gross Omzet di Halaman Transaksi Termasuk Refund
**Masalah:** Halaman transaksi mobile menampilkan Gross Omzet = Rp 2.111.500 yang berbeda dari report = Rp 1.719.500.

**Penyebab:** `GetTransaksiDashboard` menghitung Gross Sales sebagai `SUM(total) WHERE is_paid = true` — termasuk total dari transaksi refund.

**File yang diubah:**
- `backend-golang-pos/controllers/transaksi_dashboard.go`

**Perbaikan:** Gross Sales diubah ke `SUM(total) WHERE is_paid = true AND is_refund = false`, konsisten dengan halaman report.

---

## 7. Produk & Kategori (Panel Admin Web)

### 7.1 Dropdown Kategori Kosong di Edit/Tambah Produk
**Masalah:** Saat edit atau tambah produk, dropdown kategori menampilkan "Belum ada kategori. Buat kategori terlebih dahulu." padahal kategori sudah ada.

**Penyebab:**
- State `apiCategories` hanya di-fetch ketika tab "Kategori" aktif
- Saat user berada di tab "Produk" dan membuka dialog edit/tambah, `apiCategories` masih kosong
- Bahkan jika sudah di-fetch, hanya menampilkan 1 halaman (limit 5)

**File yang diubah:**
- `frontend-web-pos/src/pages/ProductsCategories.tsx`

**Perbaikan:**
- Tambah state `allCategories` — menyimpan semua kategori (limit 100) khusus untuk dropdown
- Tambah fungsi `fetchAllCategoriesForDropdown()` yang dipanggil saat mount awal
- Dropdown produk menggunakan `allCategories` bukan `apiCategories`
- Refresh `allCategories` setelah setiap operasi CRUD kategori

---

## Ringkasan File yang Diubah

### Backend (Go)
| File | Perubahan |
|------|-----------|
| `controllers/dashboardController.go` | Margin, stock alert, reservasi, custom date filter, fix "yesterday" |
| `controllers/orderController.go` | Invoice nama kasir, diskon %, email alamat toko, refund token |
| `controllers/reportController.go` | Konsistensi refund (subtotal), pelanggan (phone), export fix |
| `controllers/reportFlutterExport.go` | Konsistensi customer count & transaction count |
| `controllers/transaksi_dashboard.go` | Gross sales exclude refund |
| `controllers/reservasiController.go` | Counter cancel + date filter + soft delete |
| `controllers/shiftDetailController.go` | Topping di produk terjual + net sales |
| `controllers/shiftController.go` | Topping di produk terjual |
| `models/shift.go` | Struct `ToppingSold`, field `Toppings` di `ProductSold` |
| `models/refundToken.go` | Model baru untuk single-use refund token |
| `services/whatsapp.go` | Format diskon dengan persentase |
| `routes/routes.go` | Route refund token |

### Frontend Flutter
| File | Perubahan |
|------|-----------|
| `data/models/shift_model.dart` | Class `ShiftTopping`, field `toppings` di `ShiftItem` |
| `data/models/invoice_detail_model.dart` | Field `diskonPercent`, `diskonType` |
| `modules/shift/views/widgets/shift_detail_dialog.dart` | Rounding (-), topping list UI |
| `modules/pos/views/widgets/receipt_dialog.dart` | Diskon dengan persentase |
| `modules/reservation/views/reservation_view.dart` | Enable delete untuk cancel/reservasi |
| `modules/reservation/controllers/reservation_controller.dart` | Allow delete non-completed |
| `modules/refund/` | Single-use refund token flow |
| `core/services/printer_service.dart` | Rounding (-), topping di thermal print |

### Frontend Web (React/TypeScript)
| File | Perubahan |
|------|-----------|
| `pages/MerchantDashboard.tsx` | Custom date range filter, fix kemarin |
| `pages/ProductsCategories.tsx` | Fix dropdown kategori kosong |
| `services/api.ts` | Dashboard API support date range params |
