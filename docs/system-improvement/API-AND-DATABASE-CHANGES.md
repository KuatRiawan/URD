# PT Upaya Riksa Daya (URD) — API & Database Modifications Log

Dokumen ini mencatat seluruh perubahan teknis, perbaikan bug, penguatan skema validasi, dan penyempurnaan basis data yang diterapkan selama inisiatif perbaikan komprehensif sistem URD.

---

## 1. Perubahan & Perbaikan Backend API

### A. Validasi Format UUID pada Parameter Endpoint BAP & LHPP
- **Berkas**: `backend/src/modules/bap/routes.js` dan `backend/src/modules/lhpp/routes.js`
- **Masalah Asal**: Saat pemanggil API mengirimkan nilai `:id` yang bernilai string `"undefined"`, nilai kosong, atau UUID tidak terformat dengan benar, fungsi `fetchFullBapContext` dan `fetchFullLhppContext` mengeksekusi kueri langsung ke PostgreSQL. Hal ini memicu kesalahan fatal `error: invalid input syntax for type uuid: "undefined"` (HTTP 500 Internal Server Error).
- **Perbaikan**: Ditambahkan validasi ekspresi reguler `UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`. Jika parameter bukan UUID sah, fungsi segera mengembalikan `null`, sehingga route handler secara anggun merespons dengan HTTP 404 `NOT_FOUND` / `AppError` yang rapi tanpa menyebabkan crash PostgreSQL.

### B. Sinkronisasi Kontrak Rute Frontend-Backend untuk Array Routes
- **Berkas**: `backend/src/tests/frontend-api-contract.test.js`
- **Masalah Asal**: Modul `equipment-types/routes.js` mendaftarkan rute Express menggunakan array path (misal: `router.get(['/groups', '/types'], ...)` dan `router.post(['/', '/names'], ...)`). Test suite kontrak API sebelumnya menggabungkan string langsung dengan `layer.route.path` tanpa memeriksa apakah bernilai Array, menghasilkan string terdistorsi seperti `/api/v1/equipment-types/groups,/types` dan memicu kegagalan false-positive.
- **Perbaikan**: Menggunakan normalisasi `Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path]` untuk mengiterasi setiap rute turunan secara independen. Hasilnya, pengujian kontrak API frontend-backend lolos 100% dan memverifikasi bahwa tidak ada rute frontend yang gagal 404 di backend.

---

## 2. Perubahan & Perbaikan Basis Data & Seeder

### A. Idempotensi Seeder Template Dokumen LHPP Resmi
- **Berkas**: `backend/seeds/seed.js`
- **Masalah Asal**: Pada saat suite pengujian menjalankan pembersihan tabel (`TRUNCATE users CASCADE`), data pada tabel `lhpp_template_versions` ikut terhapus karena memiliki foreign key `created_by` ke `users(id)`. Hal ini menyebabkan foreign key `active_version_id` pada `lhpp_templates` menjadi terputus (*null*), sehingga resolver template LHPP melempar HTTP 404 `TEMPLATE_NOT_CONFIGURED` pada tahap finalisasi dokumen.
- **Perbaikan**: Dibuat fungsi idempoten `seedOfficialLhppTemplates(db, adminUserId)` di dalam `backend/seeds/seed.js`. Fungsi ini memeriksa dan memulihkan seluruh 11 template LHPP resmi (PAPA, PUBT, PTP, ILPP, IPK, Elevator, dsb.) beserta versi V1 aktifnya yang lengkap dengan skema JSON seksi dan field mapping.

### B. Koreksi Skema Kolom Klien pada Seeder Basis Data
- **Berkas**: `backend/seeds/seed.js`
- **Masalah Asal**: Seeder sebelumnya mencoba melakukan `INSERT INTO clients (name, address, city, postal_code, pic_name, pic_phone, pic_email, created_by)`, padahal menurut migrasi `002_clients_objects.sql`, kolom `city` berada pada tabel `client_locations`, dan data kontak berada pada tabel `client_contacts`. Hal ini memicu kegagalan fatal `error: column "city" of relation "clients" does not exist`.
- **Perbaikan**: Kueri seeder dinormalisasi sesuai arsitektur skema resmi:
  1. `INSERT INTO clients (name, address, email, phone, created_by)`
  2. `INSERT INTO client_locations (client_id, name, address, city)`
  3. `INSERT INTO client_contacts (client_id, name, phone, email, position)`

### C. Penanganan Siklus Hidup Pool Koneksi Pengujian (Vitest Teardown)
- **Berkas**: `uat-e2e.test.js`, `security-hardening.test.js`, `role-permission-negative.test.js`, `api.test.js`
- **Masalah Asal**: Empat test suite memanggil `await pool.end()` di dalam hook `afterAll`. Ketika Vitest menjalankan test suite secara sekuensial dalam proses yang sama, penghentian pool oleh file pertama menyebabkan seluruh kueri database pada file berikutnya melempar error `Error: Cannot use a pool after calling end on the pool` atau gagal mengautentikasi user (HTTP 401).
- **Perbaikan**: Dihilangkan pemanggilan prematur `pool.end()` pada hook `afterAll` file individu. Pelepasan koneksi pool ditangani secara otomatis oleh runner Vitest pada saat seluruh proses pengujian selesai.

---

## 3. Isolasi Pengujian Runner Backend
- **Berkas Baru**: `backend/vitest.config.js`
- **Konfigurasi**:
  ```javascript
  import { defineConfig } from 'vitest/config';

  export default defineConfig({
    test: {
      include: ['src/tests/**/*.test.js'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      testTimeout: 30000,
      hookTimeout: 30000,
      fileParallelism: false,
      environment: 'node'
    }
  });
  ```
- **Tujuan**: Mencegah runner Vitest backend memindai atau menjalankan pengujian antarmuka frontend React/jsdom yang berada di direktori induk atau folder `frontend/`, menjaga isolasi lingkungan eksekusi Node.js murni.

