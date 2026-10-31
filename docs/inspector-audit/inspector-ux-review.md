# Ulasan UX & Standar Desain Modul Inspector
**PT Upaya Riksa Daya**
Mengacu pada Standar UI/UX Pro Max, Anti-Slop, dan React Native UI Templates

---

## 1. Konsep Desain: Mobile-First Field Inspection Workspace
Inspeksi K3 merupakan pekerjaan lapangan dengan kondisi lingkungan dinamis (kebisingan, pencahayaan luar ruangan, sarung tangan, atau perangkat tablet/smartphone). Antarmuka didesain dengan prinsip:
- **Ketukan Jari Jelas (Touch Target > 48px)**: Setiap kontrol aksi memiliki ukuran minimal 46-48px dengan radius rounded-2xl yang modern.
- **Hierarki Informasi Terfokus**: Task card mengedepankan nama alat, nomor seri, nomor PO, dan status pelaksanaan. Informasi tambahan (nomor telepon, tombol WhatsApp, alamat instalasi) diletakkan secara terstruktur dan terpadu.
- **Satu Aksi Utama per Status**: Tidak ada kebingungan memilih tombol. Tombol aksi berganti secara prediktif antara "Mulai Pemeriksaan", "Lanjutkan Pemeriksaan", dan "Lihat Hasil".
- **Zero AI-Slop**: Menghilangkan tombol mati, card generik, dan statistik dekoratif palsu. Semua data terhubung langsung ke PostgreSQL.

---

## 2. Adaptasi Inspirasi Desain
- **Pola Kartu Item**: Mengadaptasi kartu bersih dengan tag kategori berkode warna lembut (rose, amber, sky, purple) dan status badge yang tegas.
- **Pola Guided Step-by-Step Flow**: Formulir riksa uji disederhanakan menjadi 2 langkah terarah:
  - **Langkah 1**: Data Teknis & Pengukuran Fisik Alat + Dynamic Checklist K3 + Temuan & Dokumentasi Foto.
  - **Langkah 2**: Kesimpulan Kelaikan Operasional + Tanda Tangan Digital (Ahli K3 & PIC Klien) + Kirim Laporan Final.

