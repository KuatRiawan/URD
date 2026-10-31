# Audit Fungsional URD

Tanggal: 31 Oktober 2026. Cakupan: inspeksi repository, test otomatis yang tersedia, dan uji browser terarah pada database `urd_test`.

## Hasil singkat

**LULUS DENGAN CATATAN.** Alur PO sampai LHPP, BAP, dan distribusi lulus dalam integration test. Empat jenis akun berhasil login di browser. Dua masalah UI ditemukan dan diperbaiki, lalu diverifikasi ulang. Audit ini belum mencakup setiap tombol, validasi, API, dan ukuran layar yang diminta pada master prompt, jadi hasilnya bukan klaim bahwa semua fitur telah lulus.

| Ukuran | Hasil |
|---|---:|
| Role utama dicoba di browser | 4 dari 4 |
| Kelompok route backend | 18 |
| Halaman aplikasi internal | 17 |
| Test otomatis setelah perubahan | 62 PASS, 0 FAIL |
| Browser finding | 2 ditemukan, 2 diperbaiki dan diuji ulang |
| Blocked | 0 |
| Cakupan yang belum dijalankan | Dicatat per dokumen; banyak skenario validasi dan CRUD |

## Berkas

- [Inventaris fitur dan test](test-inventory.md)
- [Marketing](role-marketing.md), [Inspector](role-inspector.md), [Pimpinan](role-pimpinan.md), [Super Admin](role-super-admin.md)
- [End-to-end](end-to-end-testing.md), [otorisasi](authorization-testing.md), [responsif](responsive-testing.md)
- [Temuan bug](bug-report.md), [regresi](regression-testing.md), [laporan akhir](final-test-report.md)

## Batas audit

Test dijalankan menggunakan fixture terisolasi `urd_test`; kredensial dan token tidak disimpan di dokumen. Belum ada audit performa beban, pemeriksaan pixel visual semua PDF, uji email/SMTP sungguhan, atau seluruh CRUD setiap role. `NOT RUN` berarti belum dijalankan, bukan berarti gagal atau berhasil.
