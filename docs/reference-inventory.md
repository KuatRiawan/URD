# Inventarisasi Berkas & Referensi Proyek: PT Upaya Riksa Daya

Dokumen ini mencatat seluruh berkas sumber, aset resmi, dan referensi eksternal yang diperiksa sebelum perancangan dan implementasi sistem operasional internal **PT Upaya Riksa Daya**.

## 1. Berkas Sumber di Workspace (`/Users/mac/Project/URD`)

| Nama Berkas | Lokasi | Tipe & Ukuran | Status Pemeriksaan | Ringkasan Temuan |
|---|---|---|---|---|
| `PRODUCT REQUIREMENTS DOCUMENT - PT UPAYA RIKSA DAYA V.0.1.pdf` | `/Users/mac/Project/URD/PRODUCT REQUIREMENTS DOCUMENT - PT UPAYA RIKSA DAYA V.0.1.pdf` | PDF v1.4, 19 Halaman, 505.870 byte | Dibaca penuh (Halaman 1 s/d 19) | Dokumen PRD v0.1 tertanggal 25 Maret 2026 yang mendefinisikan latar belakang bisnis PJK3 Riksa Uji K3, 4 peran pengguna, 10 modul fungsional, 7 bidang objek uji K3, aturan masa berlaku Suket K3, serta target performa & keamanan. Catatan: Nama berkas di workspace tidak menyertakan akhiran ` (1)` seperti yang tertulis pada prompt. Berkas asli dipertahankan tanpa modifikasi. |
| `logo-urd.png` | `/Users/mac/Project/URD/logo-urd.png` | PNG RGBA, 2117 x 1479 piksel, 271.755 byte | Diperiksa piksel & metadata | Logo resmi **PT. UPAYA RIKSA DAYA** dengan simbol geometris huruf "W/U" berwarna hitam (`#000000`) dan merah tegas (`#FE0000`) di atas latar transparan, disertai wordmark serif kapital `PT. UPAYA RIKSA DAYA`. Atribut metadata `kMDItemWhereFroms` menyimpan URL asal: `https://upayariksadaya.com/wp-content/uploads/2025/01/logo-urd.png` dari situs `https://upayariksadaya.com/`. |
| `template berita acara riksa uji.jpeg` | `/Users/mac/Project/URD/template berita acara riksa uji.jpeg` | JPEG Image, 1086 x 1280 piksel, 165.414 byte | Diperiksa visual & struktur penuh | Template operasional resmi **BERITA ACARA RIKSA UJI** milik **PT. UPAYA RIKSA DAYA** yang memuat: (1) Kop logo resmi PT. UPAYA RIKSA DAYA dan judul `BERITA ACARA RIKSA UJI` beserta Nomor BAP & kalimat pembuka tanggal pemeriksaan; (2) Identitas Pemeriksaan (`Objek diperiksa`, `Nama perusahaan`, `Alamat`, `Pabrik pembuat`, `Nomor seri / Kapasitas`, `Lokasi`); (3) **RUANG LINGKUP RIKSA UJI** dalam tata letak 3 kolom checkbox berjumlah 28 item pemeriksaan lintas bidang K3; (4) **HASIL RIKSA UJI** (`"Berdasarkan hasil riksa uji, dapat disimpulkan unit tersebut MEMENUHI / TIDAK MEMENUHI Persyaratan Keselamatan dan Kesehatan Kerja."`); (5) **CATATAN** pemeriksaan; serta (6) Area tanda tangan dua kolom (`Inspector` dan `Pemilik Alat / Unit`). |

## 2. Pemeriksaan Website Resmi (`https://upayariksadaya.com/`)

Melalui tautan resmi yang tertanam pada metadata berkas `logo-urd.png`, dilakukan pengambilan dan pemeriksaan langsung halaman utama serta berkas stylesheet Elementor (`post-8.css`, `post-25.css`, `post-29.css`, `post-38.css`) dari `https://upayariksadaya.com/`:

- **Identitas Perusahaan**: **PT Upaya Riksa Daya** (Perusahaan Jasa Keselamatan dan Kesehatan Kerja / PJK3 bidang Pemeriksaan dan Pengujian).
- **Slogan / Karakter Layanan**: *"Empowering Safety, Ensuring Compliance"* yaitu layanan pemeriksaan dan pengujian teknis yang berfokus pada keselamatan kerja, kepatuhan regulasi Kemnaker RI, dan akurasi laporan teknis.
- **Informasi Kontak Resmi**:
  - Email: `urd@upayariksadaya.com`
  - Telepon: `(021) 489 1409`
  - Wilayah Operasional: Jakarta / Bekasi / Jawa Barat & Nasional.
- **Palet Warna Resmi dari CSS Website (`post-8.css`)**:
  - Primary Ink / Brand Dark (`--e-global-color-primary`): `#1D1414`
  - Secondary Surface (`--e-global-color-secondary`): `#F3F5F8`
  - Body / Technical Slate (`--e-global-color-text`): `#324A6D`
  - Accent Red (`--e-global-color-accent`): `#F74646` dan `#FE0000` (dari logo resmi)
  - Dark Structural Slate: `#23374B`
  - Border Neutral: `#C8D5DC`
- **7 Bidang Pemeriksaan & Pengujian K3 pada Website & PRD**:
  1. **PAA**: Pesawat Angkat dan Pesawat Angkut (Overhead Crane, Forklift, Mobile Crane, Excavator, Hoist)
  2. **PTP**: Pesawat Tenaga dan Produksi (Genset, Motor Diesel, Mesin Produksi, Kompresor)
  3. **PUBT**: Pesawat Uap dan Bejana Tekan (Ketel Uap/Boiler, Bejana Tekan, Air Receiver Tank, Tangki Timbun)
  4. **LIS**: Instalasi Listrik (Panel Tegangan Rendah/Menengah, Transformator, Pembumian/Grounding)
  5. **IPP**: Instalasi Penyalur Petir (Konvensional & Elektrostatis)
  6. **LE**: Elevator dan Eskalator (Lift Penumpang, Lift Barang, Eskalator)
  7. **IPK**: Instalasi Proteksi Kebakaran (Hydrant, Sprinkler, Fire Alarm System, APAR)

## 3. Ketentuan Identitas & Kepatuhan Branding

1. Nama aplikasi dan identitas utama yang ditampilkan di seluruh antarmuka, halaman login, header, dokumen PDF, dan dokumentasi adalah **PT Upaya Riksa Daya**.
2. Nama "SIRUK3" dari draf awal PRD **tidak digunakan sama sekali** pada UI, judul halaman, logo, maupun komponen aplikasi sesuai instruksi wajib pengguna.
3. Berkas `logo-urd.png` disalin ke `frontend/src/assets/logo-urd.png` untuk digunakan pada halaman Login dan sidebar navigasi aplikasi, serta dibaca oleh generator PDF backend untuk kop surat resmi LHPP dan Surat Tugas. Berkas sumber asli di root direktori tidak diubah.

