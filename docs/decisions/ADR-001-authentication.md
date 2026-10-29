# ADR-001: Arsitektur Autentikasi, Manajemen Sesi JWT, dan Mitigasi CSRF

- **Status**: Diterima (Accepted)
- **Tanggal**: 28 Oktober 2026
- **Konteks Proyek**: Aplikasi Operasional Internal PT Upaya Riksa Daya

## 1. Konteks dan Permasalahan

Pada dokumen `PRODUCT REQUIREMENTS DOCUMENT - PT UPAYA RIKSA DAYA V.0.1.pdf` bagian 6.2 terdapat penyebutan platform cloud pihak ketiga ("Hercules Auth / Hercules Database"), sedangkan spesifikasi arsitektur proyek mewajibkan stack mandiri:
- Frontend: React + Vite + Axios + React Router
- Backend: Node.js + Express.js + PostgreSQL (`pg`) + Joi + JWT

Selain itu, penyimpanan JWT jangka panjang di dalam `localStorage` memiliki risiko keamanan apabila terjadi celah XSS, sedangkan penggunaan cookie membutuhkan perlindungan terhadap serangan Cross-Site Request Forgery (CSRF) dan mekanisme pencabutan sesi (revocation) saat pengguna logout atau dinonaktifkan.

## 2. Keputusan Arsitektur

Kami menerapkan arsitektur **Dual-Token Hybrid Session** berbasis Node.js, Express, PostgreSQL, dan `jsonwebtoken`:

1. **Short-Lived Access Token (JWT di Memori RAM Frontend)**:
   - Masa berlaku singkat (`15m` secara default).
   - Dikirimkan oleh backend pada body respons `POST /api/v1/auth/login` dan `POST /api/v1/auth/refresh`.
   - Disimpan hanya di dalam variabel memori JavaScript (`memoryAccessToken` pada `frontend/src/lib/api/axios.js`), **bukan** di `localStorage` atau `sessionStorage`.
   - Disertakan pada header `Authorization: Bearer <token>` untuk setiap request API.

2. **Rotating Refresh Session Token (`HttpOnly` Cookie + Tabel `refresh_sessions` PostgreSQL)**:
   - Token acak kriptografis (32 byte hex + session ID) yang disimpan sebagai hash SHA-256 di tabel `refresh_sessions`.
   - Dikirimkan ke peramban melalui cookie `urd_refresh_token` dengan atribut `HttpOnly; SameSite=Lax; Path=/api/v1/auth` (serta `Secure` pada lingkungan produksi).
   - Setiap kali `POST /api/v1/auth/refresh` dipanggil, sesi lama ditandai `revoked_at = NOW()` dan digantikan oleh sesi baru dalam `family_id` yang sama (**Refresh Token Rotation**).
   - Jika token yang sudah dicabut digunakan kembali (indikasi pencurian token), seluruh sesi dalam `family_id` tersebut langsung dicabut.

3. **Perlindungan CSRF untuk Endpoint Sesi**:
   - Seluruh endpoint mutasi sesi (`/api/v1/auth/refresh`, `/api/v1/auth/logout`) memeriksa keberadaan custom header `X-Requested-With: XMLHttpRequest` dan kecocokan header `Origin` terhadap `CORS_ORIGIN`. Karena permintaan lintas situs (cross-origin form submission) tidak dapat menyertakan custom header tanpa preflight CORS yang diizinkan, serangan CSRF dapat dicegah.

4. **Hashing Kata Sandi & Rate Limiting**:
   - Kata sandi pengguna di-hash menggunakan `bcryptjs` (cost factor 10).
   - Endpoint `POST /api/v1/auth/login` dilindungi oleh rate limiter (`express-rate-limit`) dan tidak membocorkan apakah email terdaftar atau tidak pada pesan kesalahan.

## 3. Konsekuensi

- **Positif**: Menggabungkan keamanan pencabutan sesi instan di database PostgreSQL dengan efisiensi verifikasi JWT pada setiap request operasional, serta mematuhi penuh stack wajib proyek tanpa ketergantungan layanan autentikasi eksternal.
- **Tindak Lanjut Operasional**: Saat tab peramban dimuat ulang (refresh), `AuthProvider` secara otomatis memanggil `POST /api/v1/auth/refresh` satu kali untuk memulihkan `accessToken` di memori tanpa mengharuskan pengguna login ulang selama sesi refresh masih aktif.

