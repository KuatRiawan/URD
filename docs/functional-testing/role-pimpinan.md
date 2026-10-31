# Pengujian Role Pimpinan / Manager

Role kode: `PIMPINAN`; label mencakup Manager.

| Skenario | Status | Hasil |
|---|---|---|
| Login pada browser uji | PASS | Akun Pimpinan masuk |
| Buka PO, jadwal, isu operasional, LHPP, BAP, distribusi, riwayat, notifikasi, pengaturan | PASS | Sembilan route merender tanpa horizontal overflow pada 360px |
| Buka Audit Log | PASS setelah perbaikan | Halaman sebelumnya crash ketika field tampil berisi objek; saat ini halaman dan 65 entri tampil |
| LHPP finalisasi oleh Pimpinan | PASS | Backend mengunci perubahan untuk role baca saja sesuai tes integrasi |
| Setiap aksi persetujuan pada seluruh modul | NOT RUN | Belum menguji seluruh skenario persetujuan dan batas transisi status |
| Audit log filter dan pagination | NOT RUN | Belum diuji seluruh kombinasi |

Temuan render Audit Log dijelaskan pada [laporan bug](bug-report.md).
