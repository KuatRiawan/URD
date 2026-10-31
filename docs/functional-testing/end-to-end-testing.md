# Pengujian End-to-End

## Alur bisnis yang tercakup

Integration test backend membuat dan memproses order multi-unit untuk bidang PAA, PTP, dan PUBT, menjadwalkan serta menugaskan Inspector, memproses inspeksi dan temuan, membuat/finalisasi dokumen, menghasilkan BAP PDF, mengatur distribusi, portal token, histori, pencarian, dan aturan completion gate. SKP terlampir dalam skenario PDF LHPP. Test memakai data seed di database `urd_test`.

**Status: PASS** untuk alur yang disusun dalam integration test. Bukti utama: `backend/src/tests/api.test.js` dan test PDF terkait.

## Belum tercakup

- Seluruh langkah dilakukan manual melalui UI dalam satu sesi browser.
- Seluruh 7 bidang/template dibandingkan secara visual dengan PDF referensi.
- Pengiriman email atau integrasi eksternal nyata.
- Pemulihan seluruh langkah setelah kegagalan jaringan, timeout, atau file invalid.
- Semua kemungkinan status parsial dan konkurensi dua pengguna.
