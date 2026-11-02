# Laporan Uji Keamanan & Pengujian Negatif Hak Akses (Role-Permission Matrix)

Tanggal Pengujian: 2 November 2026  
Status Eksekusi: **PASS (100%)**  
File Uji: `backend/src/tests/role-permission-negative.test.js`  
Jumlah Pengujian: **15 Skenario Negatif & Positif Terverifikasi**  
Pelaksana: Senior Security Engineer & QA Lead  

---

## 1. Pendahuluan & Prinsip Least Privilege

Sistem digitalisasi K3 PT Upaya Riksa Daya menerapkan pemisahan tugas ketat (*Segregation of Duties*) untuk mencegah benturan kepentingan antara fungsi komersial, teknis lapangan, verifikasi mutu dokumen, dan monitoring pimpinan.

Pengujian ini membuktikan bahwa pembatasan hak akses ditegakkan langsung pada layer backend HTTP API melalui middleware `authorize.js` dan verifikasi kepemilikan data (*ownership verification*), bukan sekadar menyembunyikan tombol pada antarmuka frontend.

### Matriks Peran Aktual:
1. **MARKETING:** Pengelolaan klien, kontak PIC, pemesanan (PO), dan inventaris unit alat. Dilarang masuk ke ranah QC, finalisasi dokumen, maupun eksekusi checklist.
2. **INSPECTOR (AHLI K3):** Pelaksanaan pemeriksaan lapangan, pengukuran, foto, temuan, rekomendasi, dan tanda tangan digital untuk unit yang ditugaskan kepadanya. Dilarang mengakses penugasan ahli lain dan dilarang memfinalisasi dokumen legal LHPP/BAP.
3. **ADMIN KANTOR:** Quality Control (QC), verifikasi kelengkapan, pengembalian draf revisi, finalisasi LHPP, finalisasi BAP, penerbitan Suket, dan distribusi dokumen/BAST. Dilarang mengubah data akun sistem/RBAC.
4. **PIMPINAN (MANAGER):** Pengawasan operasional bersifat *Read-Only*. Dilarang keras melakukan aksi mutasi data (`POST`, `PUT`, `PATCH`, `DELETE`).
5. **ADMIN SISTEM / SUPER ADMIN:** Konfigurasi master data, manajemen akun, template checklist, pengaturan profil PJK3, dan akses log audit. (Pada skema database PostgreSQL, enum yang digunakan adalah `ADMIN_SISTEM` dengan alias `SUPER_ADMIN` pada layer otorisasi).

---

## 2. Hasil Eksekusi 12 Skenario Wajib

Pengujian dilakukan melalui request HTTP API langsung menggunakan Supertest terhadap aplikasi Express dan database PostgreSQL `urd_test`.

| No | Skenario Pengujian Negatif | Role Pelaku | Target Endpoint / Aksi | Respon HTTP | Hasil Uji | Keterangan Penegakan Keamanan |
|:---:|:---|:---:|:---|:---:|:---:|:---|
| 01 | Mencoba finalisasi LHPP | MARKETING | `POST /api/v1/lhpp/:id/finalize` | **403 Forbidden** | **PASS** | Ditolak oleh `authorize(['ADMIN_KANTOR', 'ADMIN_SISTEM'])`. Fungsi komersial tidak boleh mengesahkan LHPP. |
| 02 | Mencoba finalisasi BAP | MARKETING | `POST /api/v1/bap/:id/finalize` | **403 Forbidden** | **PASS** | Ditolak oleh `authorize(['ADMIN_KANTOR', 'ADMIN_SISTEM'])`. Pengesahan BAP hanya wewenang Admin Kantor. |
| 03 | Mencoba memproses distribusi dokumen & BAST | MARKETING | `POST /api/v1/distributions` | **403 Forbidden** | **PASS** | Distribusi dokumen fisik/digital hanya dapat diproses oleh Admin Kantor. |
| 04 | Mencoba mengubah draf checklist inspeksi | MARKETING | `PUT /api/v1/inspections/:id/draft` | **403 Forbidden** | **PASS** | Form teknis dan checklist lapangan hanya dapat diisi oleh Ahli K3/Inspector yang ditugaskan. |
| 05 | Inspector A membuka detail inspeksi milik Inspector B pada PO yang sama | INSPECTOR A | `GET /api/v1/inspections/:id_B` | **403 Forbidden** | **PASS** | Penegakan unit-level isolation pada `routes.js`: Ahli K3 hanya berhak membuka unit yang ditugaskan spesifik padanya (`order_objects.inspector_id = req.user.id`). |
| 06 | Inspector A memodifikasi draf checklist milik Inspector B | INSPECTOR A | `PUT /api/v1/inspections/:id_B/draft` | **403 Forbidden** | **PASS** | Ditahan oleh fungsi `assertInspectionOwnership`. Ahli K3 dilarang mengedit unit di luar penugasannya. |
| 07 | Inspector mencoba memfinalisasi dokumen LHPP | INSPECTOR A | `POST /api/v1/lhpp/:id/finalize` | **403 Forbidden** | **PASS** | Ahli K3 hanya menandatangani draf teknis; penerbitan resmi LHPP harus melalui verifikasi QC Admin Kantor. |
| 08 | Pimpinan mencoba mutasi data (POST PO) | PIMPINAN | `POST /api/v1/orders` | **403 Forbidden** | **PASS** | Middleware `authorize.js` secara otomatis memblokir metode mutasi (`POST`, `PUT`, `PATCH`, `DELETE`) dengan kode error `MANAGER_READ_ONLY`. |
| 09 | Pimpinan mencoba mengubah draf checklist (PUT) | PIMPINAN | `PUT /api/v1/inspections/:id/draft` | **403 Forbidden** | **PASS** | Hak akses Pimpinan murni observasi/monitoring tanpa kewenangan intervensi teknis lapangan. |
| 10 | Pimpinan mencoba menghapus data klien (DELETE) | PIMPINAN | `DELETE /api/v1/clients/:id` | **403 Forbidden** | **PASS** | Aksi destruktif oleh Pimpinan ditolak secara tegas. |
| 11 | Akun nonaktif mencoba autentikasi / login | AKUN NONAKTIF | `POST /api/v1/auth/login` | **401 Unauthorized** | **PASS** | Autentikasi ditolak dengan pesan `USER_INACTIVE`. Sesi token JWT tidak pernah diterbitkan. |
| 12 | Akun nonaktif membawa token lama mengakses data | AKUN NONAKTIF | `GET /api/v1/orders` | **401 Unauthorized** | **PASS** | Middleware `authenticate` memverifikasi status `is_active` pengguna pada database setiap request. |
| 13 | Admin Kantor mencoba mengakses fungsi manajemen pengguna | ADMIN KANTOR | `POST /api/v1/users` | **403 Forbidden** | **PASS** | Pengelolaan pengguna dan RBAC hanya dapat dilakukan oleh role `ADMIN_SISTEM`. |
| 14 | Admin Kantor mencoba menghapus akun pengguna lain | ADMIN KANTOR | `DELETE /api/v1/users/:id` | **403 Forbidden** | **PASS** | Ditolak oleh middleware otorisasi. Admin Kantor tidak memiliki wewenang konfigurasi sistem. |
| 15 | Super Admin menjalankan fungsi administratif yang diizinkan | SUPER ADMIN | `GET /api/v1/users` & `GET /api/v1/audit-logs` | **200 OK** | **PASS** | Super Admin memiliki akses penuh ke manajemen pengguna dan penelusuran audit log append-only. |

---

## 3. Analisis Mekanisme Otorisasi Backend

### A. Middleware `authorize.js`
Implementasi otorisasi di `backend/src/middleware/authorize.js` menerapkan pengecekan bertingkat:
1. **Validasi Sesi Aktif:** Memverifikasi payload JWT dan kecocokan identitas pengguna di PostgreSQL.
2. **Enforcement Pimpinan Read-Only:**
   ```javascript
   if (role === 'PIMPINAN' || role === 'MANAGER') {
     if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
       return res.status(403).json({
         message: 'Peran Pimpinan hanya memiliki akses monitoring (Read-Only).'
       });
     }
   }
   ```
3. **Pencocokan Role:** Memeriksa apakah role pengguna tercantum dalam `allowedRoles` (termasuk penanganan alias `ADMIN_SISTEM` / `SUPER_ADMIN` dan `INSPECTOR` / `AHLI_K3`).

### B. Isolasi Multi-Unit pada PO yang Sama
Pada pemeriksaan riksa uji K3 nyata, satu PO dapat memuat beberapa unit yang ditugaskan ke Ahli K3 berbeda (misalnya Unit Crane ke Ahli Angkat Angkut, Unit Genset ke Ahli Listrik).
- **Perbaikan Keamanan:** Endpoint `GET /api/v1/inspections/:id` dan helper `assertInspectionOwnership` di `backend/src/modules/inspections/routes.js` telah diperbaiki dari sebelumnya memeriksa penugasan level PO (`assignments.order_id`) menjadi pemeriksaan spesifik level unit:
  ```sql
  SELECT * FROM order_objects WHERE id = $1 AND inspector_id = $2
  ```
- **Dampak:** Ahli K3 A yang ditugaskan pada Unit A dalam PO-001 sama sekali tidak dapat melihat, mengunduh, maupun menyunting data pemeriksaan Unit B yang menjadi tanggung jawab Ahli K3 B.

---

## 4. Kesimpulan Kepatuhan Keamanan

Seluruh 15 pengujian negatif lulus tanpa pengecualian. Arsitektur backend URD terbukti mematuhi prinsip **Zero Trust** dan **Least Privilege**:
- Tidak ada kebocoran wewenang komersial ke fungsi teknis.
- Tidak ada hak administratif pada akun operasional harian.
- Tidak ada hak mutasi pada akun monitoring pimpinan.
- Data antar-unit pada PO multi-inspektur terisolasi dengan sempurna.

