# Hasil Pengujian

## Cakupan yang sudah dijalankan

- Backend API suite menggunakan database uji terpisah `urd_user_sim_regression_20261031`: **53/53 lulus**.
- Tes mencakup snapshot PO awal/tambah unit, histori perubahan jadwal dan notifikasi, alur kendala, pembatasan assignment Inspector, read-only Pimpinan, tindak lanjut Admin, timeline, audit, lampiran dan akses file, serta pencarian global kendala.
- Simulasi browser memakai DB dedicated `urd_user_sim_20261031`: Inspector masuk dari inspeksi aktif, mengirim kendala `UNIT_MISMATCH` dengan PO/unit terisi otomatis; Marketing menindaklanjuti; Pimpinan memantau read-only.
- Pada viewport 375 px, pemeriksaan lebar dokumen menunjukkan `scrollWidth=clientWidth=375` pada halaman kendala.
- Frontend test: **4/4 lulus**. Production build: **lulus**.
- ESLint backend: **lulus**. ESLint modul kendala, pencarian global dan CTA laporan inspeksi: **lulus**. ESLint frontend penuh: **gagal** pada 29 error dan 2 warning yang tersebar di provider, layout dan modul lain (daftar lengkap dapat diperoleh dengan `./node_modules/.bin/eslint src` dari direktori `frontend/`).
- `git diff --check`: **lulus**.

## Belum diuji / jangan dianggap lulus

Perubahan change-order dan persetujuan klien, pembatalan parsial, penggantian Inspector, kondisi unit tidak tersedia/tidak aman, PIC absen/menolak, gangguan jaringan dan retry, koreksi setelah submit, overload, dokumen terlambat, kegagalan PDF/notifikasi/storage/database, dan backup/restore tidak disimulasikan satu per satu pada putaran ini. Ini adalah tindak lanjut, bukan klaim keberhasilan.

## Batas lingkungan

Simulasi browser memakai server lokal terpisah pada port 4002 dan 5177, serta database uji khusus. DB existing tidak di-reset. Tidak ada data produksi, tanda tangan nyata atau dokumen klien yang digunakan.

## Temuan saat membuka project pada 31 Oktober 2026

Screenshot menunjukkan halaman Kendala menerima error dari server. Pemeriksaan menemukan database pengembangan `urd_dev` masih di migrasi 014 dan belum memiliki tabel `operational_issues`. Migrasi 015 dan 016 kemudian diterapkan melalui runner migrasi normal tanpa reset. Endpoint backend merespons 401 saat diuji tanpa sesi, sesuai proteksi autentikasi; verifikasi terautentikasi harus dilakukan dengan menyegarkan halaman di browser yang sedang login.
