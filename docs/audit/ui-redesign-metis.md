# Redesain UI/UX: Adaptasi Bootstrap Admin Template (Metis) Beraksen PT Upaya Riksa Daya

Dokumen ini mencatat detail penyesuaian seluruh elemen antarmuka sistem internal PT Upaya Riksa Daya mengacu pada arsitektur desain template **Metis (puikinsh/Bootstrap-Admin-Template)** dengan tetap mempertahankan identitas tunggal, brand warna, dan aturan operasional PJK3.

## 1. Komponen Shell & Navigasi Utama (AppLayout)
- **Sidebar Collapsible (Mini Icon-Only Mode)**:
  - Ditambahkan tombol toggle collapse di header atas samping breadcrumb.
  - State collapse tersimpan di `localStorage` (`urd_sidebar_collapsed`) sehingga preferensi layar pengguna tetap terjaga.
  - Mode Collapsed (`w-20`): Teks menu disembunyikan, ikon berada di tengah secara simetris dengan tooltip judul yang muncul saat hover.
  - Mode Expanded (`w-64`): Header section yang tegas (`Utama`, `Operasional`, `Dokumen & Sertifikasi`, `Pemantauan`, `Administrasi`).
- **Indikator Aktif Menu Bergaya Metis**:
  - Menggunakan aksen solid merah marun URD (`bg-brand-600`) dengan penanda strip vertikal putih di tepi kiri.
  - Kontras tinggi dan jelas terbaca pada latar gelap (`bg-slate-950`).
- **Top Header Bar**:
  - Breadcrumb navigasi dinamis: `URD / [Grup] / [Nama Halaman]`.
  - Tombol pintasan pencarian cepat `Cmd+K` yang menonjol dan responsif.
  - Pusat notifikasi dengan badge penghitung unread merah.
  - Dropdown profil pengguna lengkap dengan avatar, role badge, indikator sesi terverifikasi, dan tombol logout aman.

## 2. Struktur Kartu & Widget Dashboard
- **KPI Summary Cards**:
  - Panel dengan garis aksen atas berwarna (*top border accent* 2px: marun, biru, amber, merah).
  - Kotak ikon berbentuk persegi tumpul (*rounded-xl icon container*) dengan latar pastel lembut.
  - Angka metrik tebal 30px (*font-black*) dengan keterangan status yang informatif.
- **Work Queue Widget (Antrean Tugas Prioritas)**:
  - Header panel terstruktur dengan tab filter ala Metis (`Semua`, `Urgensi Tinggi`).
  - Baris daftar tugas dengan badge prioritas, keterangan ringkas, dan tombol aksi langsung.

## 3. Komponen Primitif UI
- `PageHeader`: Menampilkan aksen garis penanda marun vertikal di samping judul halaman, chip badge status peran, dan action bar di kanan.
- `Card`: Mendukung prop `accent` (`brand`, `blue`, `emerald`, `amber`) untuk memberikan penanda visual sejalan dengan dashboard enterprise.
- `TableWrapper`: Header abu-abu sejuk, baris padat dan bersih, batas border sel yang nyaman dipindai untuk data alat dan dokumen K3.

## 4. Hasil Pengujian & Build
- `npm --prefix backend test src/tests/lhpp-pdf-generator.test.js`: 6/6 passed.
- `npm --prefix backend test src/tests/search-and-workqueue.test.js`: 4/4 passed.
- `npm --prefix frontend test`: 4/4 passed.
- `npm --prefix frontend run build`: Berhasil tanpa error.

