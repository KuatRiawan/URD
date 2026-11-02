# PT Upaya Riksa Daya (URD) — Security Assessment & Hardening Report

> **Evaluator:** Application Security & Infrastructure Engineer  
> **Target Sistem:** URD Backend (Express 5, Node.js 22) & Frontend (React 19, Vite 6)  
> **Status Asesmen:** SECURE — ZERO CRITICAL VULNERABILITIES  
> **Metode Pengujian:** Automated Penetration Test Suite (`security-hardening.test.js`, `role-permission-negative.test.js`) & Manual Endpoint Auditing.

---

## 1. Matriks Otorisasi Berbasis Peran (RBAC Matrix)

Pemisahan wewenang ditegakkan pada tingkat middleware backend (`authenticate.js` dan `authorize.js`), bukan hanya sekadar menyembunyikan tombol di antarmuka frontend.

| Modul / Operasi | Marketing | Inspector (Ahli K3) | Admin Kantor | Pimpinan | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| **Manajemen Klien & PIC** | CREATE, READ, UPDATE | READ | READ, UPDATE | READ ONLY | ALL (FULL) |
| **Pembuatan PO & Spesifikasi Unit** | CREATE, READ, UPDATE | READ | READ, UPDATE | READ ONLY | ALL (FULL) |
| **Penjadwalan & Penugasan Surat Tugas** | READ | READ | CREATE, READ, UPDATE | READ ONLY | ALL (FULL) |
| **Pengisian Lembar Kerja & Temuan** | FORBIDDEN (403) | CREATE, READ, UPDATE* | READ, QC NOTE | READ ONLY | ALL (FULL) |
| **Finalisasi Draf LHPP** | FORBIDDEN (403) | FORBIDDEN (403) | EXECUTE (200) | READ ONLY | ALL (FULL) |
| **Penerbitan & Pengesahan BAP** | FORBIDDEN (403) | SIGN ONLY | CREATE, SIGN, ISSUE | READ ONLY | ALL (FULL) |
| **Pencatatan Suket Disnaker** | FORBIDDEN (403) | FORBIDDEN (403) | CREATE, READ, UPDATE | READ ONLY | ALL (FULL) |
| **Pencatatan Distribusi Dokumen & BAST**| FORBIDDEN (403) | FORBIDDEN (403) | CREATE, READ, PRINT | READ ONLY | ALL (FULL) |
| **Manajemen Akun Pengguna** | FORBIDDEN (403) | FORBIDDEN (403) | FORBIDDEN (403) | FORBIDDEN (403)| ALL (FULL) |
| **Penelusuran Audit Logs** | FORBIDDEN (403) | FORBIDDEN (403) | FORBIDDEN (403) | FORBIDDEN (403)| ALL (FULL) |

*\*Catatan:* Inspector hanya memiliki hak akses pada inspeksi yang ditugaskan secara resmi kepada dirinya sendiri (proteksi BOLA/IDOR).

---

## 2. Pengujian Penetrasi & Temuan Keamanan

### 2.1. Proteksi BOLA / IDOR (Broken Object-Level Authorization)
- **Vektor Uji:**
  - Inspector A mencoba mengirimkan draf (`PUT /api/v1/inspections/:id/draft`) pada unit yang ditugaskan kepada Inspector B.
  - Inspector A mencoba melakukan submit hasil riksa uji (`POST /api/v1/inspections/:id/submit`) milik Inspector B.
  - Inspector A mencoba mengunduh lembar rekomendasi K3 milik inspeksi Inspector B.
- **Hasil Pengujian:**
  - Seluruh upaya manipulasi IDOR ditolak dengan kode respon **HTTP 403 Forbidden** (`code: FORBIDDEN`).
  - Kueri backend memvalidasi keterkaitan antara `req.user.id` dengan tabel relasi `inspection_assignments` sebelum mengizinkan mutasi data.

### 2.2. Penegakan Akses Read-Only Pimpinan (Strict Read-Only)
- **Vektor Uji:**
  - Akun Pimpinan mencoba memicu pembuatan klien baru (`POST /api/v1/clients`).
  - Akun Pimpinan mencoba memodifikasi draf checklist inspeksi (`PUT /api/v1/inspections/:id/draft`).
  - Akun Pimpinan mencoba mengubah status PO (`PATCH /api/v1/orders/:id/status`).
  - Akun Pimpinan mencoba menghapus berkas foto inspeksi (`DELETE /api/v1/inspections/:id/photos/:photoId`).
  - Akun Pimpinan mencoba mencatat distribusi dokumen (`POST /api/v1/distributions`).
- **Hasil Pengujian:**
  - Semua permintaan mutasi HTTP POST, PUT, PATCH, DELETE diblokir secara mutlak pada level middleware dengan kode respon **HTTP 403** (`code: MANAGER_READ_ONLY`).
  - Antarmuka frontend menyembunyikan seluruh tombol aksi operasional untuk akun Pimpinan sehingga pengalaman monitoring tetap bersih dan informatif.

### 2.3. Ketahanan Terhadap Injeksi SQL (SQL Injection Defense)
- **Vektor Uji:**
  - Pengiriman parameter kueri pencarian berbahaya pada `GET /api/v1/orders?q=...` dan `status=...`:
    1. `' OR 1=1 --`
    2. `'; DROP TABLE clients; --`
    3. `1' UNION SELECT null, null, null, null--`
    4. `'' OR 'a'='a'`
- **Hasil Pengujian:**
  - Parameter diproses sebagai nilai literal melalui mekanisme parameterized query PostgreSQL (`$1, $2, ...`).
  - Server mengembalikan respon normal **HTTP 200 OK** (daftar hasil kosong) atau **HTTP 400 Bad Request** jika skema validasi Joi menolak format karakter tertentu.
  - **Nol error 500** dan tidak ada kebocoran sintaks SQL maupun tabel database.

### 2.4. Keamanan Verifikasi Publik QR Code
- **Vektor Uji:**
  - Permintaan publik `GET /api/v1/verify/:code` menggunakan kode verifikasi LHPP atau nomor Suket resmi.
  - Percobaan manipulasi status dokumen melalui `POST /api/v1/verify/:code`.
- **Hasil Pengujian:**
  - Endpoint publik hanya mengembalikan data validitas dokumen resmi (tipe dokumen, nomor surat, tanggal terbit, masa berlaku, instansi penerbit, nama unit, dan nomor seri).
  - Data sensitif seperti `password_hash`, alamat email internal, token JWT, maupun kunci penyimpanan berkas **tidak pernah diekspos**.
  - Metode HTTP non-GET (POST, PUT, DELETE) ditolak dengan **HTTP 404/405**.

### 2.5. Integritas Unggahan Berkas (File Upload Security)
- **Vektor Uji:**
  - Percobaan unggah berkas berekstensi berbahaya atau script shell (`malicious_script.sh`, `executable.exe`) pada endpoint dokumentasi inspeksi (`POST /api/v1/inspections/:id/photos`).
- **Hasil Pengujian:**
  - Middleware `uploadMiddleware` (Multer) memeriksa mimetype berkas terhadap *whitelist* resmi: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
  - Berkas script langsung ditolak dengan respon **HTTP 400 Bad Request** (`code: INVALID_FILE_TYPE`).
  - Berkas yang lolos disimpan menggunakan penamaan acak (*crypto random UUID*) di luar direktori root web publik untuk mencegah eksekusi kode berbahaya.

### 2.6. Penanganan Akun Pengguna Tidak Aktif (Account Deactivation)
- **Vektor Uji:**
  - Percobaan login menggunakan akun karyawan yang telah dinonaktifkan (`is_active = false`).
  - Percobaan akses API menggunakan token JWT lama yang dibuat sebelum akun dinonaktifkan.
- **Hasil Pengujian:**
  - Login langsung ditolak dengan **HTTP 401 Unauthorized**.
  - Middleware `authenticate` selalu memeriksa status aktif pengguna pada basis data PostgreSQL untuk setiap permintaan masuk; token lama seketika ditolak dengan respon **HTTP 401/403** (`USER_INACTIVE`).

---

## 3. Rekomendasi Pengamanan Tambahan untuk Fase Staging Remote

Ketika VPS dan domain resmi telah tersedia, langkah pengamanan infrastruktur berikut wajib diterapkan:
1. Pemasangan sertifikat SSL/TLS dengan konfigurasi HTTPS ketat (*HSTS preload*).
2. Konfigurasi Reverse Proxy (Nginx / Caddy) dengan *rate limiting* pada endpoint login publik.
3. Rotasi berkala rahasia sesi (`JWT_SECRET`) dan penerapan *refresh token rotation*.
4. Isolasi akses basis data PostgreSQL hanya dari jaringan lokal (*private subnet* / Docker network internal).

