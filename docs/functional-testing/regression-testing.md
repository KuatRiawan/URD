# Regression Testing

| Perubahan | Verifikasi | Status |
|---|---|---|
| Filter distribusi mobile | Browser 360px mengukur body/dokumen; dashboard diuji di delapan lebar | PASS |
| Normalisasi isi Audit Log | Unit/component test dengan `user_role: {role,email}` dan halaman Pimpinan di browser | PASS |
| App routing / auth guard | Frontend test route root, validasi login, penolakan Inspector, dan route admin | PASS |
| Navigasi mobile | Dua test drawer/fokus/rute | PASS |
| Backend business flow dan dokumen | 55 test backend sebelum perubahan frontend, termasuk E2E/PDF | PASS |
| Build dan lint setelah perubahan frontend | frontend lint, build dan test | PASS |

Tidak ada perubahan backend pada perbaikan di audit ini. Regression otomatis frontend terkini: 7 test, semuanya lulus. Test backend terakhir: 55 test lulus; dijalankan sebelum perbaikan frontend karena perubahan tidak menyentuh backend.
