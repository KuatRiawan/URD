# Log remediasi

| ID | Berkas | Perubahan | Status |
|---|---|---|---|
| SEC-01 | `backend/src/modules/dashboard-files.js` | Batasi aktivitas Inspector ke audit event user aktif. | FIXED & TESTED |
| SEC-02/03 | `backend/src/modules/inspections/routes.js` | Periksa ownership sebelum respons submit idempotent; hapus fallback identitas nonunik. | FIXED & TESTED |
| SEC-01/02 | `backend/src/tests/search-and-workqueue.test.js`, `backend/src/tests/api.test.js` | Test regresi kebocoran aktivitas dan submit silang Inspector. | FIXED & TESTED |
| SEC-04 | `backend/src/config/env.js` | Hapus secret statis; random development, test-only untuk test, fail-fast environment lain. | FIXED & TESTED |
| SEC-04 | `backend/src/tests/config-env.test.js` | Test konfigurasi development dan staging. | FIXED & TESTED |
| UX-01 | `frontend/src/features/auth/LoginPage.jsx` | Ubah tagline dan hapus typewriter sambil mempertahankan state form. | FIXED & TESTED |
| BUS-01 | `backend/src/modules/dashboard-files.js`, `backend/src/modules/lhpp/routes.js` | Jadikan work queue Pimpinan read-only dan arahkan notifikasi finalisasi ke Admin Kantor. | FIXED & TESTED |

Perubahan lokal yang sudah ada sebelum audit pada seed, migrasi, route inspeksi/order/LHPP, PDF generator, halaman Inspector/Marketing, dan navigasi tidak di-reset atau ditimpa secara menyeluruh.
