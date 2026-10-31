# Hasil E2E dan regresi

## Backend

- Suite penuh dijalankan dari `backend/` dengan `npm test` pada database disposable baru `urd_audit_tmp_20261031`.
- DB `urd_test` berisi data, sehingga tidak dipakai oleh suite reset.
- Cakupan: API/security, search/workqueue, PDF generator, environment JWT, dan E2E multi-unit.
- Database sementara dihapus setelah suite berakhir.
- Hasil: 4 file suite, 47/47 test lulus. Tidak ada write ke `urd_dev` atau `urd_test`.

## Frontend

- `npm --prefix frontend test -- --run`: 4/4 lulus.
- `npm --prefix frontend run build`: berhasil; chunk utama 848.62 kB dan memberi peringatan di atas 500 kB.

## Browser

- Login aktual pada `/login`, logo resmi, tidak ada akun demo/sandi default.
- Light/dark dan lebar 375, 390, 430, 768, 1280, 1440 px diperiksa.
- Tidak login dengan role uji karena kredensial sesi browser tidak tersedia.

## Status acceptance

Workflow inti backend Marketing → PO multi-unit → Inspector → submit → LHPP → BAP/distribusi lulus kasus suite. Visual PDF per template sumber, E2E browser tiap role, dan responsive seluruh halaman: NOT FULLY TESTED.
