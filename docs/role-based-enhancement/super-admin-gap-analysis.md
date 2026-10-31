# Analisis Kesenjangan Super Admin

| Area | Kondisi saat ini | Yang belum dibuktikan / kesenjangan | Prioritas |
|---|---|---|---|
| Akun dan role | Manajemen pengguna, aktif/nonaktif dan kontrol akses tersedia. | Dampak menonaktifkan Inspector yang masih memiliki assignment, sesi aktif, dan reset akses tidak diuji. | P1: peringatan assignment terbuka dan proses pemindahan tanggung jawab. |
| Master data dan template | Master objek/kategori dan template checklist/dokumen telah tersedia; migrasi menambah cakupan checklist dan menjaga versi terpakai. | Kegagalan berkas template, kategori tanpa template, dan substitusi versi lama tidak disimulasikan. | P1: validasi pratinjau dan pemeriksaan referensi sebelum aktivasi. |
| Penomoran dokumen | Generator dokumen tersedia. | Konflik nomor dan pemulihan setelah kegagalan generator tidak diuji dalam putaran ini. | P0: constraint unik, transaksi, dan uji retry/idempotensi. |
| Audit | Audit trail tersedia dan tabel append-only dilindungi trigger. | Pemeriksaan eksplisit trigger immutable tidak diulang pada simulasi ini. | MUST: pertahankan trigger dan akses baca audit terbatas. |
| Kesehatan layanan | Tidak ada perubahan monitoring kapasitas, storage, koneksi DB, job, atau backup pada implementasi ini. | Kegagalan storage, PDF, notifikasi dan database belum disimulasikan. | P1: health check dan error/job monitoring terpisah dengan runbook. |
| Integritas histori | Revisi snapshot PO dan event kendala tercatat. | Pemulihan bencana, backup/restore, retensi file belum diuji. | P0: uji backup/restore pada lingkungan uji sebelum menetapkan kesiapan produksi. |

## Kesimpulan operasional

Fitur yang diimplementasikan tidak memberi Super Admin jalur untuk mengubah hasil inspeksi atau tanda tangan historis. Kesiapan infrastruktur produksi belum dapat disimpulkan dari test suite aplikasi saja.

## Prioritas

- **MUST HAVE:** pembatasan role, histori tak dapat diubah, dan validasi konfigurasi.
- **SHOULD HAVE:** pemantauan job, storage dan kegagalan generator dengan prosedur pemulihan.
- **NICE TO HAVE:** panel konfigurasi kesehatan terpadu setelah metrik operasional ditentukan.
- **NOT NEEDED:** hak istimewa untuk memodifikasi hasil historis secara langsung.
