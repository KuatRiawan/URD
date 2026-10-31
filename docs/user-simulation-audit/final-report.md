# Laporan akhir simulasi pengguna URD

**Status: PARTIALLY FIXED.** Pengujian dilakukan pada database uji khusus dan browser dengan role sah. Skenario Marketing sampai pembuatan PO multi-unit dan penugasan berhasil; Inspector menerima tugas dan membuat draf; Pimpinan dapat memantau detail secara read-only; Admin Sistem membuat akun Inspector uji. P0 yang terkonfirmasi: 0. Satu bug P1 dan dua bug P2 diperbaiki dan diuji ulang pada cakupan terkait; satu P3 diperbaiki tanpa retest form reset.

## Kualitas dan regresi

- Frontend test: **4/4 lulus**.
- Frontend production build: **lulus**.
- Backend lint: **lulus**.
- Backend test: **52/52 lulus** pada database runner khusus. Run awal 51/52 karena fixture `@urd.test` ditolak Joi; fixture diganti alamat valid dan seluruh suite lulus.
- Frontend lint: **gagal, 30 error dan 2 warning**, termasuk empty catch block, unused variables dan hook dependency. Daftar mentah ada pada output runner; belum seluruhnya diperbaiki.
- Pimpinan mencoba patch status: **403 `MANAGER_READ_ONLY`**, status database tetap.

## Yang belum dibuktikan

Inspeksi fisik tidak diselesaikan dan tidak diisi dengan data rekaan. Akibatnya submit browser, tanda tangan tersimpan, foto/autosave/offline, LHPP dari template, preview/cetak, BAP, serta distribusi belum terbukti end-to-end. Tidak ada pengiriman eksternal. Admin Sistem belum menguji edit/nonaktifkan/aktifkan/reset password dan master template. Cakupan responsive mendalam hanya untuk daftar PO Pimpinan; seluruh dark/light mode dan screenshot tidak tersimpan. Maka tugas belum memenuhi Definition of Done dan tidak dapat dinyatakan selesai penuh.

Lihat direktori ini untuk rincian per role, bukti database, cakupan visual dan remediasi. Perubahan utama tercatat di [log remediasi](remediation/fix-log.md). Database `urd_user_sim_20261031` dan database runner regresi tetap ada; jangan dihapus.
