# Audit frontend

- Route `/` mengarahkan sesi anonim ke `/login`; login tidak menampilkan akun demo atau sandi default.
- API client memakai Axios `/api/v1`, menangani refresh dan error.
- Test frontend mencakup root redirect, validasi login, route guard, dan render internal.
- Browser memeriksa login dan logo resmi pada 375, 390, 430, 768, 1280, 1440 px, serta light/dark.
- Saat UI diverifikasi setelah edit copy, browser sempat mereproduksi blank page akibat impor `useState` terhapus. Impor dipulihkan, halaman dibuka ulang, dan form kembali terlihat.
- Build produksi memberi peringatan chunk utama lebih dari 500 kB.

Halaman dashboard, tabel, modal, checklist, upload, signature, PDF preview dan role UI belum diuji manual pada sesi browser aktif.
