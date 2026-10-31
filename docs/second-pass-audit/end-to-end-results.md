# Hasil E2E dan regresi

## Backend/PostgreSQL

- Suite memakai database baru `urd_second_pass_audit_20261031`; runner menolak memakai database dengan nama yang sudah ada.
- Migration 001-015, seed test, API workflow, PDF dan security dijalankan.
- Hasil: 5 file, 51/51 test lulus.
- Database sementara dihapus sesudah suite. `urd_dev` dan `urd_test` tidak berubah.

## Frontend dan lint

- `npm --prefix frontend test -- --run`: 4/4 lulus.
- `npm --prefix frontend run build`: berhasil, chunk utama 278.18 kB, tanpa warning 500 kB.
- `npm --prefix backend run lint`: lulus.
- `npm --prefix frontend run lint`: gagal, 30 error dan 2 warning.

## Tidak diuji

- Browser E2E login dan seluruh klik untuk semua role.
- HP/kamera, print dialog OS, email/WhatsApp, seluruh enam viewport per halaman.
- Visual per halaman semua template LHPP.
- Migration 015 pada DB lokal yang sudah ada.
