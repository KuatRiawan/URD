# Ringkasan simulasi pengguna

**Tanggal:** 31 Oktober 2026. **Lingkungan:** PostgreSQL lokal, basis data khusus `urd_user_sim_20261031`, backend `127.0.0.1:4001`, frontend `127.0.0.1:5176`. Database produksi tidak disentuh. Kredensial uji tidak dicantumkan.

Simulasi dilakukan melalui browser dengan login normal, API, dan inspeksi SQL baca saja. Marketing membuat PO `TEST-URD-2026-001` berisi tiga objek uji; Inspector menerima penugasan dan memulai dua draf inspeksi; Pimpinan memantau PO secara read-only; Admin Sistem membuat akun Inspector uji. Alur operasional dihentikan sebelum hasil teknis, tanda tangan, finalisasi LHPP/BAP, atau distribusi karena data inspeksi lapangan yang sah tidak tersedia dan simulasi melarang pemalsuan hasil maupun pengiriman eksternal.

## Ringkasan temuan dan status

- **P0:** 0 temuan yang direproduksi.
- **P1:** 1 temuan, default inspeksi mengisi kesimpulan/hasil teknis seolah-olah sesuai. Diperbaiki dan diperiksa pada draf baru; data draf yang terlanjur tersimpan tetap dibiarkan pada database uji dan tidak disubmit.
- **P2:** 2 temuan, tab jadwal/status Pimpinan sebelumnya kosong atau memberi kontrol perubahan; role filter pengguna menduplikasi alias lama. Diperbaiki dan diverifikasi di browser/API.
- **P3:** 1 temuan, form akun setelah sukses reset ke role historis `ADMIN_KANTOR`. Diperbaiki dan modal berikutnya diverifikasi memakai `MARKETING`.
- **Temuan mutu:** Frontend lint gagal dengan 30 error dan 2 warning; backend lint lulus. Frontend test 4/4 dan build lulus. Backend test awal 51/52; fixture alamat email invalid diperbaiki dan suite ulang lulus 52/52.

## Cakupan yang belum terpenuhi

Ini bukan bukti Definition of Done penuh. Inspector tidak menyelesaikan checklist berdasarkan observasi nyata; foto/kamera, autosave saat offline, tanda tangan sentuh, submit, PDF, LHPP, BAP, dan distribusi belum end-to-end diuji lewat browser. Super Admin baru diuji pada pembuatan akun; edit/nonaktifkan/aktifkan/reset kata sandi dan master data belum dijalankan. Pimpinan belum mengeksplor seluruh dokumen drill-down. Responsif diuji untuk daftar PO Pimpinan di enam lebar; halaman lain, tema gelap/terang, kamera, keyboard dan canvas tidak diverifikasi.

Lihat [laporan akhir](final-report.md) dan catatan per role untuk bukti dan batasan rinci.
