# Audit role Manager/Pimpinan

## Bukti

- Suite API membuktikan finalisasi LHPP oleh Pimpinan ditolak 403 `MANAGER_READ_ONLY`, sedangkan baca detail LHPP dan ringkasan distribusi diizinkan.
- Frontend LHPP menyediakan mode pantau; `canManage` tidak memasukkan Pimpinan.

## Isu

- Dashboard backend masih membaca status legacy `REVIEW_TEKNIS` dan `PERSETUJUAN_PIMPINAN`; label status lama dipetakan ke “Menunggu Finalisasi LHPP” dan aksi Pimpinan kini “Pantau Status”. Regression test memeriksa kedua hal tersebut.
- Notifikasi `LHPP_WAIT_REVIEW` dan status legacy belum dimigrasikan. Data historis perlu transisi aman yang mempertahankan histori.
- Drill-down dashboard Manager belum diuji langsung di browser.

## Status

- API read-only serta label/action work queue: FIXED & TESTED.
- Status legacy dan field histori masih menggunakan nama `PERSETUJUAN_PIMPINAN`; transisi data historis belum dimigrasikan. Label baru tidak membuat tahap approval baru.
