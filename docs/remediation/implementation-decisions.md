# Keputusan Implementasi

- Perubahan dilakukan tanpa menghapus perubahan yang telah ada di worktree.
- Validasi lintas dokumen memakai `documentType` karena `document_distributions.document_id` bersifat polimorfik.
- BAP dapat didistribusikan saat `FINAL`; LHPP saat `FINAL` atau `TERBIT`.
- Renewal aktif didefinisikan sebagai `PERPANJANGAN` dengan status selain `DIBATALKAN` dan `SELESAI`.
- Token baru hanya dikembalikan sekali saat pembuatan. Token legacy tetap didukung selama transisi.
- Data offline yang gagal dikirim dipertahankan untuk retry dan kegagalan ditampilkan kepada Inspector.
- Checklist tidak lagi menyediakan auto-fill hasil pemeriksaan.
