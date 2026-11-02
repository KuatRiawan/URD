# Daftar Cacat & Perbaikan Sistem (Defect Register) — URD Phase 1

Tanggal: 2 November 2026  
Status Defect: **100% Resolved & Verified**  
Pelaksana: Senior Full-Stack Engineer, QA Lead & Security Architect  

---

## 1. Ringkasan Status Defect

Selama pelaksanaan Phase 1 (Pengujian Integrasi Database, Validasi Otorisasi, dan UAT End-to-End), ditemukan sejumlah isu yang telah dianalisis akar masalahnya, diperbaiki secara terisolasi, dan diverifikasi melalui *regression testing*.

| Severity | Total Ditemukan | Selesai (Fixed & Verified) | Tertunda (Open) |
|:---|:---:|:---:|:---:|
| **CRITICAL** | 1 | 1 | 0 |
| **HIGH** | 2 | 2 | 0 |
| **MEDIUM** | 3 | 3 | 0 |
| **LOW** | 2 | 2 | 0 |
| **TOTAL** | **8** | **8** | **0** |

---

## 2. Rincian Defect & Solusi Rekayasa

### DEF-001: Eksekusi Destruktif Drop Schema pada Suite Pengujian Database
- **Severity:** HIGH (Keamanan Lingkungan)
- **Komponen:** `backend/src/tests/api.test.js`
- **Gejala / Bukti:** Helper `beforeAll` menjalankan `runMigrations({ reset: true })` yang mengeksekusi perintah SQL berbahaya `DROP SCHEMA public CASCADE`. Jika dijalankan di lingkungan non-isolasi, seluruh tabel dan data terhapus.
- **Akar Masalah:** Konfigurasi pembersihan test lama dirancang destruktif alih-alih transaksional atau berbasis truncating.
- **Tindakan Perbaikan:**
  - Mengganti opsi `reset: true` dengan pembersihan selektif non-destruktif:
    ```sql
    TRUNCATE TABLE audit_logs, document_distributions, suket_registrations, 
                   lhpp, bap, inspection_photos, inspection_results, 
                   inspections, order_revisions, assignments, order_objects, 
                   orders, client_contacts, objects, clients 
    RESTART IDENTITY CASCADE;
    ```
- **Verifikasi:** Test berjalan bersih tanpa menghapus definisi skema database (`PASS`).

---

### DEF-002: Penolakan Akses Role Marketing pada Pendaftaran Unit Objek (HTTP 403)
- **Severity:** HIGH (Operational Blocker)
- **Komponen:** `backend/src/modules/objects/routes.js` (Baris 334, 403, 478)
- **Gejala / Bukti:** Pengguna dengan peran `MARKETING` menerima respon `403 Forbidden` saat mencoba mendaftarkan unit alat baru (`POST /api/v1/objects`) atau mengimpor objek klien.
- **Akar Masalah:** Middleware `authorize(['ADMIN_SISTEM', 'ADMIN_KANTOR', 'INSPECTOR'])` belum mencantumkan role `MARKETING`, padahal SOP bisnis URD menetapkan Marketing bertanggung jawab atas pencatatan inventaris unit dan pembuatan PO klien.
- **Tindakan Perbaikan:**
  - Menambahkan `'MARKETING'` ke dalam array peran yang diizinkan pada endpoint pendaftaran objek, penyuntingan objek, dan import CSV:
    ```javascript
    authorize(['ADMIN_SISTEM', 'ADMIN_KANTOR', 'INSPECTOR', 'MARKETING'])
    ```
- **Verifikasi:** Marketing berhasil mendaftarkan 3 unit objek dalam simulasi UAT (`PASS`).

---

### DEF-003: Kebocoran Akses Antar-Inspector pada Unit Berbeda dalam PO yang Sama
- **Severity:** CRITICAL (Pelanggaran Isolasi Data & Least Privilege)
- **Komponen:** `backend/src/modules/inspections/routes.js` (`GET /:id` dan `assertInspectionOwnership`)
- **Gejala / Bukti:** Pada PO yang memuat multi-unit dengan Ahli K3 berbeda (misalnya Unit Crane ke Inspector A dan Unit Boiler ke Inspector B), Inspector A dapat membuka detail dan mengubah checklist Unit B.
- **Akar Masalah:** Query pengecekan kepemilikan sebelumnya mengevaluasi penugasan di level PO (`assignments.order_id`), sehingga setiap inspektur yang terdaftar di PO yang sama dianggap berhak mengakses seluruh unit di dalam PO tersebut.
- **Tindakan Perbaikan:**
  - Mengubah logika verifikasi agar mengevaluasi penugasan spesifik di level unit (`order_objects.inspector_id`):
    ```sql
    SELECT id, order_id, unit_status, inspector_id 
    FROM order_objects 
    WHERE id = $1 AND inspector_id = $2
    ```
- **Verifikasi:** Pengujian `role-permission-negative.test.js` skenario 05 & 06 mengonfirmasi bahwa percobaan Inspector A mengakses Unit B menghasilkan `403 Forbidden` (`PASS`).

---

### DEF-004: Penolakan Form Submit Akibat Ketidaklengkapan Butir Checklist
- **Severity:** MEDIUM (Validasi Konsistensi Data)
- **Komponen:** `backend/src/modules/inspections/routes.js` (`POST /:id/submit`)
- **Gejala / Bukti:** Submission inspeksi mengembalikan pesan error `INCOMPLETE_FORM` jika tidak semua butir aktif dalam template terisi nilai kelayakan.
- **Akar Masalah:** Aturan validasi ketat backend mewajibkan seluruh item checklist terisi status (`BAIK`, `RUSAK`, atau `TIDAK_DIPERIKSA`), sementara pengujian simulasi awal hanya mengirim sampel sebagian kecil item.
- **Tindakan Perbaikan:**
  - Mengintegrasikan pembacaan versi template aktif secara dinamis dalam test suite sehingga seluruh butir wajib tersubmit dengan status evaluasi yang valid.
- **Verifikasi:** Draf inspeksi berhasil disubmit dan divalidasi 100% lengkap (`PASS`).

---

### DEF-005: Diskrepansi Nomor Dokumen pada Modul Distribusi
- **Severity:** MEDIUM (Integritas Relasi Dokumen)
- **Komponen:** `backend/src/modules/distributions/routes.js`
- **Gejala / Bukti:** Pembuatan antrean distribusi dokumen gagal dengan error `DOCUMENT_NUMBER_MISMATCH`.
- **Akar Masalah:** Modul distribusi mewajibkan nomor LHPP yang diinputkan sama persis dengan nomor resmi yang dihasilkan oleh proses finalisasi LHPP sebelumnya.
- **Tindakan Perbaikan:**
  - Mengalirkan nomor LHPP dinamis hasil respon `POST /lhpp/:id/finalize` ke payload pembuatan distribusi.
- **Verifikasi:** Distribusi dokumen fisik dan digital terhubung akurat dengan nomor LHPP terbitan resmi (`PASS`).

---

### DEF-006: Otomasi Transisi Status Unit Selesai Pasca-Tanda Tangan BAST
- **Severity:** MEDIUM (Otomasi Alur Bisnis)
- **Komponen:** `backend/src/modules/distributions/routes.js`
- **Gejala / Bukti:** Ketika dokumen fisik diserahkan dan BAST bertanda tangan diunggah (`status: DITERIMA`), status unit pada `order_objects` tidak otomatis bertransisi ke `SELESAI`.
- **Akar Masalah:** Update status distribusi hanya memperbarui tabel `document_distributions` tanpa trigger atau query lanjutan untuk memeriksa apakah seluruh dokumen unit telah diserahkan.
- **Tindakan Perbaikan:**
  - Menambahkan pengecekan otomatis saat status distribusi berubah menjadi `DITERIMA`. Jika tidak ada lagi distribusi pending untuk unit tersebut, status `order_objects.unit_status` diperbarui menjadi `'SELESAI'`.
- **Verifikasi:** Terbukti pada UAT Unit A: status unit langsung berubah menjadi `SELESAI` saat BAST diterima (`PASS`).

---

### DEF-007: Batas Waktu Timeout Pengujian Navigasi Frontend (5000ms Vitest Limit)
- **Severity:** LOW (Keandalan Test Otomasi)
- **Komponen:** `frontend/src/app/App.test.jsx`
- **Gejala / Bukti:** Pengujian rendering 13 halaman internal mengalami error `Test timed out in 5000ms`.
- **Akar Masalah:** Vitest menetapkan timeout default 5 detik per test, sementara pemuatan dan pengujian 13 komponen halaman secara berurutan dalam jsdom membutuhkan waktu sekitar 5,5 hingga 6 detik.
- **Tindakan Perbaikan:**
  - Menambahkan parameter timeout eksplisit 20000ms pada blok pengujian tersebut:
    ```javascript
    it('renders all internal feature pages...', async () => { ... }, 20000);
    ```
- **Verifikasi:** Test suite frontend berjalan 100% lulus dalam 10 detik (`PASS`).

---

### DEF-008: Variabel Tak Terpakai pada File Uji Baru (Eslint Violations)
- **Severity:** LOW (Standar Kualitas Kode)
- **Komponen:** `backend/src/tests/role-permission-negative.test.js` & `backend/src/tests/uat-e2e.test.js`
- **Gejala / Bukti:** Linter mendeteksi variabel `crypto`, `query`, dan `contactId` yang dideklarasikan tetapi tidak dipanggil.
- **Akar Masalah:** Sisa impor helper saat penyusunan skenario pengujian baru.
- **Tindakan Perbaikan:**
  - Menghapus impor yang tidak terpakai dan memberi prefiks garis bawah `_contactId` sesuai aturan eslint regex `/^_/u`.
- **Verifikasi:** `npm --prefix backend run lint` menghasilkan 0 error (`PASS`).

---

## 3. Kesimpulan Verifikasi Regresi

Seluruh 8 defect telah dituntaskan dengan prinsip solusi terkecil yang tepat (*Ponytail / Least New Code*), mempertahankan arsitektur existing, mematuhi standar *Anti-Slop*, dan diverifikasi melalui 102 test backend serta 9 test frontend yang lulus 100%.

