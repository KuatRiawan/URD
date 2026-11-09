# PT Upaya Riksa Daya (URD) — UI/UX Visual & Responsive Verification

Dokumen ini mendokumentasikan standar desain visual, pemenuhan aturan Anti-Slop UI, sistem desain korporat PT Upaya Riksa Daya, dan hasil verifikasi responsif lintas 5 resolusi baku peramban.

---

## 1. Filosofi Desain & Standar Estetika Apple (macOS & iOS)

Aplikasi PT Upaya Riksa Daya dirancang dengan pendekatan *Human Interface Guidelines (HIG)* ala ekosistem Apple yang dipadukan dengan wibawa korporat keteknikan K3:

1. **Pengalaman Desktop (macOS Inspired)**:
   - Sidebar navigasi ramping dengan efek semi-transparan (*subtle frosted glass*), ikonografi garis halus berbasis Phosphor Icons.
   - Header aplikasi dengan breadcrumb dinamis, indikator status sistem, dan menu profil pengguna.
   - Penggunaan kartu konten (*Card*) dengan sudut membulat elegan (`rounded-2xl` / `rounded-xl`), bayangan lembut (*soft ambient elevation*), dan batas tepi beraksen halus (*border slate-200 / slate-800*).
   - Tata letak tabel data (*TableWrapper*) dengan header berperekat (*sticky table header*), baris bergaris kontras nyaman (*zebra or hover highlighting*), dan paginasi stateful.

2. **Pengalaman Bergerak (iOS Mobile Inspired)**:
   - Navigasi bawah ramah ibu jari (*iOS Bottom Navigation Bar*) dengan ikon tebal (*duotone/fill*) pada tab aktif.
   - Target sentuh interaktif berukuran minimal **44 × 44 piksel** untuk menjamin kemudahan pengoperasian di lapangan oleh Inspector yang mengenakan sarung tangan kerja K3.
   - Modal dan drawer geser bawah (*Bottom Sheet Modal*) untuk formulir aksi cepat di layar ponsel.

---

## 2. Palet Identitas Resmi Korporat URD

Sistem secara ketat menerapkan warna identitas resmi perusahaan dan melarang penggunaan warna gradien neon acak:

- **Hitam Korporat Utama**: `#121212` / `#0F172A` (Lambang ketegasan, wibawa, dan presisi legalitas).
- **Merah Aksen K3**: `#DC2626` / `#B91C1C` (Lambang norma keselamatan dan kesehatan kerja; digunakan secara selektif untuk tombol tindakan primer, peringatan bahaya, dan status tidak laik).
- **Putih Bersih**: `#FFFFFF` (Latar kartu dan teks primer pada tema gelap).
- **Abu-abu Netral (Slate)**: `#F8FAFC` (Latar kanvas kerja desktop), `#E2E8F0` (Garis pemisah), `#64748B` (Teks sekunder/keterangan).
- **Status Warna Semantik K3**:
  - *Memenuhi Syarat (Laik)*: Hijau Emerald (`#059669` / `#10B981`)
  - *Perlu Perbaikan / Revisi*: Kuning Amber (`#D97706` / `#F59E0B`)
  - *Tidak Memenuhi Syarat / Ditolak*: Merah Crimson (`#DC2626` / `#EF4444`)
  - *Dalam Proses / Dijadwalkan*: Biru Indigo (`#2563EB` / `#3B82F6`)

---

## 3. Penegakan Aturan Anti-Slop UI & Disiplin Tombol

Sesuai pedoman rekayasa produk URD dan keahlian `antislop`:

1. **Eliminasi Penumpukan Tombol (*Zero Button Stacking*)**:
   - Dilarang menumpuk 3 hingga 5 tombol berdampingan dalam satu baris tabel data.
   - Aksi baris dikonsolidasikan menjadi satu tombol primer (misal: "Buka" atau "Review") dan menu tindakan elipsis kontekstual (`ActionMenu` dengan ikon titik tiga vertikal) untuk tindakan sekunder (Edit, Salin, Nonaktifkan, Riwayat).
2. **Hierarki Kontras Aksi**:
   - Hanya satu tombol primer (*Solid High-Contrast Button*) per kelompok tugas visual.
   - Aksi sekunder menggunakan tombol berbingkai (*Outline / Ghost Button*).
   - Aksi destruktif (Hapus, Batalkan) menggunakan warna bahaya dengan konfirmasi dialog modal eksplisit (*Confirmation Guard*).
3. **Kepatuhan Terminologi Bahasa Indonesia Resmi**:
   - Seluruh label antarmuka menggunakan istilah resmi K3 Indonesia: `PO`, `Riksa Uji`, `LHPP`, `BAP`, `Suket K3`, `BAST`, `Surat Tugas`, `Ahli K3`, `Disnaker`.
   - Menghilangkan terjemahan mesin yang canggung atau campuran istilah asing tidak beraturan.

---

## 4. Cakupan State Antarmuka Menyeluruh

Setiap modul dan tabel dalam aplikasi dilengkapi empat status penanganan:

1. **Loading State**: Komponen Skeleton animasi bernafas (*shimmer effect*) yang merefleksikan bentuk tabel atau kartu yang akan dimuat, bukan sekadar spinner berputar di tengah layar kosong.
2. **Empty State**: Ilustrasi ikon tematik, judul deskriptif ("Belum Ada Unit Alat"), penjelasan kontekstual cara memulai, dan tombol aksi utama ("Tambah Alat Baru").
3. **Error State**: Tampilan kartu penanganan kesalahan dengan pesan ramah pengguna, kode galat teknis transparan, dan tombol "Coba Lagi" (*Retry Action*).
4. **Success State**: Notifikasi Toast non-intrusif di pojok layar dengan umpan balik durasi 3 detik yang mengonfirmasi perubahan data telah tersimpan permanen.

---

## 5. Hasil Verifikasi Lintas 5 Resolusi Baku

Pengujian visual otomatis dijalankan menggunakan headless browser Puppeteer resolusi tinggi pada 5 profil layar:

| Profil Viewport | Dimensi Layar | Target Perangkat | Hasil Verifikasi Tata Letak | Status |
| :---: | :---: | :---: | :--- | :---: |
| **Mobile Compact** | `360 × 800` | Ponsel Android Menengah | Navigasi bawah iOS-style aktif, tabel berganti menjadi kartu vertikal, tidak ada overflow horizontal (`scroll-x`). | **PASS** |
| **Mobile Modern** | `390 × 844` | iPhone 12 / 13 / 14 / 15 | Margin proporsional, font Plus Jakarta Sans terbaca tajam, drawer modal dapat di-scroll lancar. | **PASS** |
| **Tablet Portrait** | `768 × 1024` | iPad / Galaxy Tab | Sidebar collapsible responsif, grid 2-kolom terdistribusi seimbang, grafik analitik menyesuaikan proporsi. | **PASS** |
| **Laptop Standar** | `1366 × 768` | Layar Laptop Kantoran | Sidebar default terbuka, tabel data menampilkan 6 kolom esensial dengan ActionMenu, header tetap menempel (*sticky*). | **PASS** |
| **Desktop Full HD**| `1920 × 1080`| Monitor PC / Monitor Eksekutif | Maksimum lebar kontainer nyaman (`max-w-7xl`), tidak ada peregangan konten berlebih, kartu statistik 4-kolom proporsional. | **PASS** |

Tangkapan layar hasil audit visual tersimpan secara lengkap di direktori `docs/ui-ux/screenshots/`.

