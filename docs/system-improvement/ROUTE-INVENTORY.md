# PT Upaya Riksa Daya (URD) — Frontend Route Inventory & Access Matrix

Dokumen ini mencatat seluruh rute navigasi antarmuka pengguna pada aplikasi React SPA PT Upaya Riksa Daya, komponen halaman yang dimuat, serta batasan akses peran (*Role Guard*).

---

## 1. Rute Publik (Unauthenticated)

| Path Rute | Komponen Halaman | Deskripsi & Tujuan | Perlindungan Akses |
| :--- | :--- | :--- | :--- |
| `/` | `RootRedirect` | Pengarah otomatis: jika belum login diarahkan ke `/login`, jika sudah diarahkan ke `/app/dashboard`. | Publik |
| `/login` | `LoginPage` | Formulir autentikasi pengguna dengan email dan password. Mendukung error handling, remember me, dan pengamanan brute force. | Publik |
| `/verifikasi/:code` | `VerificationPage` | Halaman publik untuk memverifikasi keabsahan dokumen resmi (Suket K3, LHPP, BAP, QR Sticker) tanpa perlu login. Menampilkan status keaslian dan hash SHA-256. | Publik |
| `/portal/:token` | `ClientPortalPage` | Portal mandiri untuk perwakilan klien (PIC) mengakses dokumen resmi K3 perusahaannya dengan token akses terproteksi hash. | Publik (Token-Gated) |

---

## 2. Rute Terproteksi Aplikasi (`/app/*`)

Seluruh rute di bawah `/app` diwajibkan melewati pembungkus `<RequireAuth>` (memeriksa sesi JWT aktif dan masa berlaku token) serta `<AppLayout>` yang menyediakan sidebar navigasi desktop macOS-style dan navigasi bawah mobile iOS-style.

| Path Rute | Komponen | Peran Diizinkan (*Allowed Roles*) | Fungsi & Operasional Utama |
| :--- | :--- | :--- | :--- |
| `/app/dashboard` | `DashboardPage` | Semua Peran (`ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN`) | Menampilkan dasbor spesifik peran:<br>• **Marketing**: Ringkasan pipeline PO, perpanjangan suket, status klien.<br>• **Inspector**: Surat tugas aktif, jadwal riksa hari ini, status offline queue.<br>• **Admin Kantor**: Antrean QC, berkas siap finalisasi, status distribusi.<br>• **Pimpinan**: Metrik eksekutif read-only, rasio kelulusan K3, utilisasi tim.<br>• **Super Admin**: Metrik kesehatan sistem, log audit, master data. |
| `/app/clients` | `ClientsPage` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN` | Manajemen data klien/perusahaan, cabang/lokasi operasional, dan daftar banyak PIC per klien. |
| `/app/objects` | `ObjectsPage` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN` | Registri objek uji K3 (alat/mesin) lengkap dengan taksonomi 3-level (*Domain → Jenis Alat → Nama Alat*), nomor seri, kapasitas, riwayat pengujian, dan cetak QR code stiker. |
| `/app/orders` | `OrdersPage` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN` | Manajemen Purchase Order (PO) multi-unit. Marketing membuat PO dengan banyak alat; Admin menjadwalkan; setiap unit bergerak independen. |
| `/app/schedule` | `SchedulePage` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN` | Kalender riksa uji, penugasan Ahli K3/Inspector ke unit tertentu, dan deteksi otomatis jadwal bentrok (*conflict detection*). |
| `/app/inspections` | `InspectionsPage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN` | Formulir pemeriksaan digital di lapangan. Inspector mengisi checklist dinamis, input pengukuran teknis, foto temuan, dan tanda tangan digital. Didukung penyimpanan luring (IndexedDB). |
| `/app/bap` | `BapPage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN` | Modul Berita Acara Pemeriksaan (BAP). Diterbitkan otomatis setelah LHPP difinalisasi, tanda tangan kedua belah pihak, dan ekspor PDF/DOCX resmi. |
| `/app/lhpp` | `LhppPage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN` | Laporan Hasil Pemeriksaan & Pengujian (LHPP) berbasis template spesifik kategori. Meliputi Quality Control (QC), revisi terarah per seksi, dan finalisasi berkas resmi ber-hash SHA-256. |
| `/app/history` | `HistoryPage` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN` | Riwayat riksa uji lengkap per unit alat: histori PO, nomor BAP/LHPP, foto temuan, status kelayakan K3, dan riwayat perpanjangan. |
| `/app/distributions` | `DocumentDistributionPage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `PIMPINAN` | Pelacakan serah terima berkas resmi (LHPP, BAP, Suket, Stiker QR) ke Klien dan Disnaker. Dilengkapi pembuatan berkas BAST (*Berita Acara Serah Terima*) PDF dan bukti tanda terima ekspedisi. |
| `/app/suket` | `SuketPage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `PIMPINAN` | Registri Surat Keterangan (Suket) K3 resmi dari Disnaker, pengunggahan dokumen pindaian, dan manajemen masa berlaku sertifikasi. |
| `/app/reminders` | `RemindersPage` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR`, `PIMPINAN` | Manajemen pengingat jatuh tempo sertifikasi alat (H-90, H-60, H-30). Mengirimkan notifikasi tanpa duplikasi dan memicu pembaruan PO secara instan. |
| `/app/notifications`| `NotificationsPage` | Semua Peran Terautentikasi | Pusat pemberitahuan sistem (tugas baru, permintaan revisi QC, dokumen selesai, pengingat kadaluwarsa). |
| `/app/issues` | `IssuesPage` | Semua Peran Terautentikasi | Pelaporan kendala operasional di lapangan oleh Inspector (misal: alat tidak siap, cuaca ekstrem) dan tindak lanjut oleh Marketing/Admin. |
| `/app/users` | `UsersPage` | `ADMIN_SISTEM` (Eksklusif Super Admin) | Tata kelola akun pengguna, penugasan peran, status keaktifan, nomor pegawai, dan riwayat jejak login. |
| `/app/audit-logs` | `AuditLogPage` | `ADMIN_SISTEM`, `PIMPINAN` | Jejak audit kekal (*immutable audit log*) untuk melacak setiap perubahan data kritis, finalisasi dokumen, dan aktivitas pengguna demi kepatuhan regulasi K3. |
| `/app/settings` | `SettingsPage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `PIMPINAN` | Konfigurasi sistem:<br>• **Super Admin**: Master alat 3-level, Dynamic Checklist Builder, Dynamic LHPP Engine, Pengaturan Kop Perusahaan, Backup Database SQL.<br>• **Admin/Pimpinan**: Pengaturan profil dan preferensi tampilan. |

---

## 3. Penanganan Alias Peran (Role Normalization)

Sistem secara transparan mendukung kompatibilitas ke belakang (*backward compatibility*) untuk alias peran:
- `AHLI_K3` ↔ `INSPECTOR` (keduanya merepresentasikan akun teknis pelaksana lapangan).
- `PIMPINAN` ↔ `MANAGER` (keduanya merepresentasikan manajemen eksekutif pemantauan operasional).
- `ADMIN_SISTEM` (peran kanonis untuk Administrator Sistem / Super Admin).
- `ADMIN_KANTOR` (peran staf administrasi kantor & quality control dokumen).
- `MARKETING` (peran staf komersial & relasi klien).

Pengguna yang mencoba mengakses rute di luar wewenangnya akan secara elegan dialihkan ke `ForbiddenPage` (HTTP 403 Forbidden UI) tanpa terjadinya layar putih (*crash*) atau kesalahan JavaScript.

