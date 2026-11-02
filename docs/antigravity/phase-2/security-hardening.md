# Laporan Pengerasan Keamanan Sistem (Security Hardening) — URD Phase 2

Tanggal: 2 November 2026  
Status: **VERIFIED & ENFORCED**  
Rujukan Standar: OWASP Top 10 API Security & PJK3 Data Integrity Standard  
Pelaksana: Application Security Engineer & Software Architect  

---

## 1. Ikhtisar Penegakan Keamanan

Sistem operasional PT Upaya Riksa Daya menangani data kepatuhan hukum Keselamatan dan Kesehatan Kerja (K3), mencakup laporan hasil uji teknik, temuan kerusakan mesin industri, catatan kalibrasi, dan tanda tangan digital sah. Oleh karena itu, pengerasan keamanan (*security hardening*) diterapkan berlapis dari level transport jaringan, middleware HTTP, layer aplikasi, hingga database PostgreSQL.

---

## 2. Rincian Pengerasan Keamanan Berlapis

### A. Keamanan Sesi & Kredensial JWT
1. **Entropi Kunci JWT:** Kunci `JWT_SECRET` wajib memiliki entropi minimal 256-bit (di-generate via `openssl rand -hex 32`). Server menolak aktif jika kunci kurang dari 24 karakter pada staging/produksi.
2. **Short-Lived Access Token:** Access token JWT dibatasi masa berlakunya hanya **15 menit** (`JWT_ACCESS_TTL=15m`) untuk meminimalkan risiko pencurian token.
3. **Penyimpanan Cookie HttpOnly:**
   - Refresh token disimpan dalam cookie berstatus `httpOnly: true` (tidak dapat diakses oleh skrip JavaScript/XSS).
   - Pada staging/produksi ber-HTTPS, cookie diberi atribut `secure: true` dan `sameSite: 'strict'` (atau `'lax'` untuk navigasi awal).

### B. Proteksi Lintas Situs (CSRF & CORS)
1. **Perlindungan CSRF Kustom:**
   - Diterapkan pada `backend/src/app.js`: untuk setiap request mutasi (`POST`, `PUT`, `PATCH`, `DELETE`) yang membawa cookie sesi, server mewajibkan keberadaan custom header:
     - `Authorization: Bearer <token>`, atau
     - `X-Requested-With: XMLHttpRequest`.
   - Browser modern melarang situs pihak ketiga menyisipkan custom header tanpa izin preflight CORS, sehingga serangan CSRF berbasis form HTML otomatis gagal.
2. **CORS Whitelist Terbatas:**
   - Parameter `CORS_ORIGIN` hanya memvalidasi domain resmi staging (contoh: `https://staging.upayariksadaya.com`). Request dari origin di luar whitelist langsung ditolak dengan respon HTTP 403 `CORS_FORBIDDEN`.

### C. Pembatasan Laju Permintaan (Rate Limiting)
1. **Anti-Brute Force Login:**
   - Endpoint `/api/v1/auth/login` dilindungi dengan `express-rate-limit`: maksimal 25 percobaan per 15 menit per alamat IP.
   - Pelanggaran batas akan mengembalikan status HTTP 429 `RATE_LIMITED`.

### D. Pengamanan Unggah Berkas & Media Lapangan
1. **Validasi Tipe Berkas (MIME Whitelist):**
   - Hanya menerima tipe MIME: `image/jpeg`, `image/png`, `image/webp`, dan `application/pdf`. Berkas biner eksekusi (`.exe`, `.sh`, `.php`, `.js`) ditolak saat pembacaan header buffer.
2. **Pencegahan Serangan Path Traversal:**
   - Nama berkas asli pengguna tidak digunakan sebagai nama berkas di disk.
   - Nama penyimpanan di-generate menggunakan `Date.now() + crypto.randomUUID() + ext` ke dalam direktori persisten terisolasi.
3. **Akses Berkas Terotorisasi:**
   - Direktori `storage/uploads` tidak dibuka sebagai static folder publik. Seluruh berkas diakses melalui router `/api/v1/dashboard/files/:id` yang memvalidasi otentikasi JWT dan keterikatan penugasan Ahli K3 (`inspectorCanAccessAttachment`).

### E. Penanganan Error & Pencegahan Kebocoran Informasi (Information Leakage)
1. **Sanitasi Respon Error (`error-handler.js`):**
   - Pesan error internal server (HTTP 500) disanitasi menjadi pesan ramah publik: `"Terjadi kesalahan pada server. Silakan coba kembali."` tanpa pernah membocorkan *stack trace*, path direktori server, maupun konfigurasi database kepada klien.
   - Error integritas database PostgreSQL dipetakan secara bersih:
     - Error `23505` -> `409 DUPLICATE_RECORD`
     - Error `23503` -> `400 REFERENCE_ERROR`
     - Multer Limit -> `400 LIMIT_FILE_SIZE`
2. **Sanitasi Log Server:**
   - Password pengguna, token JWT lengkap, dan kredensial eksternal di-mask dan tidak dicatat ke log konsol.

### F. HTTP Security Headers (Helmet)
Aplikasi Express mengaktifkan suite pengaman header HTTP:
- `X-Content-Type-Options: nosniff` (Mencegah MIME sniffing).
- `X-Frame-Options: SAMEORIGIN` (Mencegah serangan Clickjacking).
- `Cross-Origin-Resource-Policy: same-site` (Membatasi pembacaan resource antar origin).
- `Strict-Transport-Security` (HSTS) ditegakkan melalui layer reverse proxy Nginx.

### G. Keamanan Database PostgreSQL (Prinsip Least Privilege)
1. **User Aplikasi Non-Superuser:**
   - Akun database untuk aplikasi staging (`urd_staging_app`) hanya diberikan hak akses data operasional (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) pada tabel public.
   - Hak destruktif seperti `DROP DATABASE`, `DROP SCHEMA`, atau modifikasi hak akses user database ditutup.
2. **Parameter Hash Kata Sandi:**
   - Penyimpanan password pengguna menggunakan algoritma `bcryptjs` dengan *salt rounds* standar industri (faktor biaya 10).

---

## 3. Matriks Hasil Audit Keamanan

| Kategori Pengerasan | Mekanisme Penegakan | Status Verifikasi |
|:---|:---|:---:|
| **Injeksi SQL** | Parameterized query via `pg` (`$1, $2, ...`) | **PASS (100% Parameterized)** |
| **XSS (Cross-Site Scripting)** | React escaping otomatis & Content-Type JSON | **PASS** |
| **CSRF** | Header `X-Requested-With` & Origin Check | **PASS** |
| **Brute Force Autentikasi** | Rate limit 25 req / 15 min | **PASS** |
| **Broken Object Level Auth** | Penegakan kepemilikan di level unit database | **PASS** |
| **Path Traversal Upload** | UUID renaming & isolasi folder penyimpanan | **PASS** |
| **Kebocoran Stack Trace** | Error handler global tersanitasi | **PASS** |
| **Bypass Sandbox Eksternal** | Sandbox/mock mode untuk WA & Email | **PASS** |

