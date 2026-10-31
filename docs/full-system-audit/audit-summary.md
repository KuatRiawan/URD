# Ringkasan audit sistem URD

Tanggal: 31 Oktober 2026. Status ini berdasarkan workspace lokal, bukan sertifikasi produksi.

## Baseline

- Root `/Users/mac/Project/URD`, branch `main`.
- Pada awal audit terdapat banyak perubahan lokal belum di-commit: 36 berkas terlacak berubah, satu terhapus, dan delapan berkas baru. Area mencakup Inspector, PO/Marketing, PDF, seed, migrasi 013/014, serta navigasi. Perubahan itu dipertahankan.
- Stack aktual: React/Vite/Tailwind/Axios/React Router dan Express/Joi/JWT/PostgreSQL `pg`.
- Database `urd_dev` dibaca tanpa mutasi: 39 tabel, 89 foreign key, 97 primary/unique/check constraints. Migrasi 001 sampai 014 tersedia.
- `urd_test` berisi data saat ditemukan: 4 inspeksi, 4 LHPP, 4 BAP, 53 audit log. Suite backend menjalankan reset schema. Suite penuh dijalankan pada DB sementara `urd_audit_tmp_20261031`, lalu DB sementara dihapus. `urd_test` tidak berubah.

## Temuan dan status

| ID | Severity | Temuan | Status |
|---|---|---|---|
| SEC-01 | P1 | Dashboard Inspector menerima aktivitas audit global. | FIXED & TESTED |
| SEC-02 | P1 | Submit ulang inspeksi terkirim mengembalikan data sebelum pemeriksaan kepemilikan. | FIXED & TESTED |
| SEC-03 | P1 | Kemiripan nama/telepon/prefiks email dipakai sebagai pengganti assignment dan dapat memindahkan owner. | FIXED & TESTED |
| SEC-04 | P1 | Environment selain development/test dapat memakai secret JWT statis bila kosong. | FIXED & TESTED |
| UX-01 | P2 | Headline login desktop berbahasa Inggris dan typewriter menghapus/mengetik teks berulang. | FIXED & TESTED |
| BUS-01 | P2 | Work queue Pimpinan menampilkan aksi “Review & Terbitkan” pada item LHPP. | FIXED & TESTED |
| QUAL-01 | P2 | Bundle utama 849.74 kB sebelum gzip melewati ambang peringatan 500 kB. | NOT FIXED |

**Status keseluruhan: PARTIALLY FIXED.** E2E backend PO multi-unit sampai dokumen lulus pada suite. Uji browser semua role, responsive halaman internal, dan perbandingan visual seluruh template PDF belum selesai. Tidak ada klaim aplikasi bebas bug.

## Pengujian

- Backend penuh: 47/47 test lulus pada DB sementara terisolasi.
- Frontend: 4/4 test lulus; production build berhasil dengan peringatan chunk utama 848.62 kB.
- Browser memeriksa halaman login pada 375, 390, 430, 768, 1280, dan 1440 px, light dan dark. Ini bukan responsive sign-off halaman internal.
