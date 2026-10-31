# Pengujian Responsif

Browser test berjalan pada viewport 360×800 untuk route utama dan menggunakan pengukuran `scrollWidth` terhadap viewport.

| Area | Viewport | Status | Hasil |
|---|---|---|---|
| Dashboard Marketing | 360, 390, 430, 768, 1024, 1366, 1440, 1920px | PASS | Tidak ada overflow horizontal |
| Distribusi Marketing | 360px | PASS setelah perbaikan | Select disusun satu kolom pada layar sempit; lebar dokumen 360px |
| Halaman Inspector | 360px | PASS | Dashboard dan halaman inspeksi tidak melebar |
| Route Pimpinan: PO, jadwal, isu, LHPP, BAP, distribusi, riwayat, notifikasi, pengaturan | 360px | PASS | Tidak ada overflow horizontal pada route yang dicek |
| Audit Log Pimpinan | 360px | PASS setelah perbaikan | Render berhasil, termasuk entri role object |
| Halaman lain × semua ukuran | NOT RUN | Belum diperiksa |
| Zoom, keyboard, tablet landscape, dan print layout | NOT RUN | Belum diperiksa |

Bug distribusi awal: pada 360px konten melebar menjadi 404px karena dua select mempertahankan lebar intrinsik. Perbaikan dan uji ulang ada di [regression-testing.md](regression-testing.md).
