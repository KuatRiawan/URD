# Audit Kondisi Existing UI/UX & Responsive Design
PT Upaya Riksa Daya

Tanggal Audit: 31 Oktober 2026
Auditor: Senior UI/UX Designer & Frontend Engineer

## 1. Ringkasan Eksekutif

Audit komprehensif dilakukan terhadap seluruh antarmuka aplikasi internal PT Upaya Riksa Daya (URD) yang dibangun dengan React + Vite + Tailwind CSS v4. Pemeriksaan mencakup struktur kode antarmuka desktop, tablet (768px - 1024px), dan smartphone (360px - 430px) pada seluruh peran operasional (Marketing / Admin Kantor, Ahli K3 / Inspector, Pimpinan / Manager, dan Admin Sistem).

## 2. Klasifikasi Temuan Berdasarkan Prioritas

### A. Prioritas Critical (Mengganggu Fungsi / Fitur Tidak Dapat Diakses)

1. **Ketiadaan Akses Navigasi Menu Sekunder di Mobile (Navigation Lockout)**
   - **Lokasi**: `frontend/src/components/layout/MobileBottomNav.jsx`
   - **Deskripsi**: Navigasi bawah mobile dibatasi kaku hanya memotong 4 item teratas (`getVisibleNav(role).slice(0, 4)`). Akibatnya, menu penting seperti Data Klien, Objek Uji, Berita Acara BAP, Distribusi Dokumen, Registri Suket K3, Pengingat Perpanjangan, Manajemen Pengguna, dan Pengaturan Akun sama sekali tidak dapat diakses saat pengguna membuka aplikasi melalui ponsel pintar.
   - **Dampak**: Pengguna mobile terkunci dari lebih dari 60% fungsionalitas sistem.

2. **Hilangnya Komponen Drawer Navigasi Mobile ("Lainnya")**
   - **Lokasi**: `frontend/src/components/layout/`
   - **Deskripsi**: File `MobileNavDrawer.jsx` terhapus dalam refaktorisasi sebelumnya, tanpa adanya mekanisme pengganti drawer atau bottom sheet untuk menampilkan sisa menu peran.
   - **Dampak**: Tidak ada sarana penjelajahan modul sekunder pada layar ponsel pintar.

### B. Prioritas High (Mengganggu Navigasi & Aktivitas Utama)

1. **Horizontal Table Overflow & Cramped Controls pada Tampilan Mobile**
   - **Lokasi**:
     - `frontend/src/features/clients/components/ClientTable.jsx`
     - `frontend/src/features/objects/components/ObjectTable.jsx`
     - `frontend/src/features/lhpp/components/LhppTable.jsx`
     - `frontend/src/features/bap/components/BapTable.jsx`
     - `frontend/src/features/distributions/components/DistributionTable.jsx`
     - `frontend/src/features/suket/components/SuketTable.jsx`
     - `frontend/src/features/users/components/UserTable.jsx`
     - `frontend/src/features/audit-log/AuditLogPage.jsx`
   - **Deskripsi**: Tabel data tabular ditampilkan mentah dengan `overflow-x-auto` pada viewport smartphone (360px - 430px). Pengguna terpaksa menggeser tabel ke samping berkali-kali untuk melihat data dasar dan menemukan tombol aksi (Kelola, Detail, Ubah, PDF). Tombol-tombol berjejer terlalu kecil dan rapat sehingga rentan salah tekan (fat-finger issue).
   - **Solusi**: Transformasi ke pola kartu responsif mobile (`sm:hidden`) dengan target sentuh minimal 40px - 44px, di samping tabel penuh untuk tablet/desktop (`hidden sm:block`).

2. **Akses Pencarian Global (Cmd+K) & Pengalih Tema Tersembunyi di Mobile Header**
   - **Lokasi**: `frontend/src/components/layout/TopHeader.jsx`
   - **Deskripsi**: Tombol pencarian cepat dan pengalih tema (`ThemeToggle`) disembunyikan menggunakan kelas `hidden sm:inline-flex`. Pada mobile, pengguna tidak memiliki cara untuk memicu pencarian cepat nomor PO, klien, atau nomor seri alat.
   - **Solusi**: Sertakan pintasan pencarian cepat dan pengaturan tema di dalam lembar navigasi "Lainnya" serta sediakan ikon pencarian yang proporsional di header mobile.

3. **Form Input Grid Cramped pada Modal Tambah Unit PO**
   - **Lokasi**: `frontend/src/features/orders/components/StepPoUnits.jsx`
   - **Deskripsi**: Form penambahan unit alat baru langsung ke PO menggunakan `grid grid-cols-1 sm:grid-cols-6 gap-2`. Pada ukuran tablet (768px), membagi 6 kolom input dalam satu baris modal menghasilkan lebar input kurang dari 100px sehingga teks placeholder dan isi input terpotong.
   - **Solusi**: Sesuaikan breakpoint grid menjadi `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5` dengan label yang jelas.

### C. Prioritas Medium (Inkonsistensi Visual & Kenyamanan Penggunaan)

1. **Variasi Radius dan Ukuran Tombol**
   - **Lokasi**: Berbagai halaman fitur (`rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`).
   - **Deskripsi**: Beberapa halaman menggunakan border radius tidak seragam untuk tombol dan badge status.
   - **Solusi**: Standarisasi token radius: `rounded-lg` (8px) untuk tombol dan kontrol form, `rounded-full` untuk badge status dan avatar, serta `rounded-xl` / `rounded-2xl` untuk card kontainer.

2. **Inkonsistensi Tinggi Kontrol Input dan Tombol Aksi**
   - **Lokasi**: Filter bar dan form modal.
   - **Deskripsi**: Beberapa input memiliki tinggi 36px (`py-1.5`), sementara yang lain 44px (`min-h-11`). Standar sentuh mobile yang ramah pengguna memerlukan tinggi sentuh minimal 44px.
   - **Solusi**: Terapkan standar tinggi kontrol terpadu (`min-h-[44px]` untuk mobile primary controls, `min-h-9` untuk compact table actions).

3. **Status Navigasi Aktif pada Tombol "Lainnya"**
   - **Lokasi**: `MobileBottomNav.jsx`
   - **Deskripsi**: Ketika pengguna berada di halaman sub-menu (misal `/app/clients` atau `/app/settings`), bottom navigation tidak memberikan indikasi visual bahwa halaman aktif berada di dalam grup "Lainnya".
   - **Solusi**: Tambahkan penanda aktif dinamis pada tombol "Lainnya" jika rute aktif saat ini cocok dengan salah satu menu di dalam drawer.

### D. Prioritas Low (Detail Visual & Polish)

1. **Scrollbar Tampilan Modal Panjang**
   - **Lokasi**: Modal inspeksi dan modal detail PO.
   - **Deskripsi**: Scrollbar pada beberapa browser desktop tampak kaku dan kurang menyatu dengan palet tema gelap.
   - **Solusi**: Pastikan utility `scrollbar-thin` dan warna scrollbar CSS diterapkan konsisten di seluruh modal dialog.

2. **Feedback Umpan Balik Tombol Aksi**
   - **Lokasi**: Tombol tabel di desktop.
   - **Deskripsi**: Perlu penegasan visual hover/active state dengan transition yang seragam (150ms).

