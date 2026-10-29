# Desain Keamanan Aplikasi (Application Security Design): PT Upaya Riksa Daya

## 1. Kontrol Autentikasi & Manajemen Sesi
- **Hashing Kata Sandi**: Seluruh kata sandi disimpan sebagai hash `bcryptjs` (cost factor 10). Tidak ada kata sandi plaintext di kode maupun database.
- **Dual-Token Hybrid Session**:
  - `accessToken` JWT berumur pendek (`15m`) hanya disimpan di memori RAM aplikasi React (`memoryAccessToken`), mencegah pencurian token dari `localStorage` apabila terjadi XSS.
  - `refreshToken` disimpan sebagai hash SHA-256 pada tabel `refresh_sessions` dan dikirim melalui cookie `HttpOnly; SameSite=Lax; Path=/api/v1/auth`.
  - Mendukung **Refresh Token Rotation** dan deteksi penggunaan ulang (token reuse detection) yang langsung mencabut seluruh keluarga sesi (`family_id`).
- **Rate Limiting**: Endpoint `/api/v1/auth/login` dilindungi oleh `express-rate-limit` untuk memitigasi serangan brute-force, sementara seluruh endpoint `/api/v1/*` memiliki rate limit global.

## 2. Otorisasi Berbasis Peran (Server-Side RBAC)
- Penegakan hak akses tidak hanya dilakukan dengan menyembunyikan menu di frontend (`RequireRole`), melainkan diverifikasi pada setiap route backend menggunakan middleware `authorize(...allowedRoles)`.
- Percobaan akses oleh peran yang tidak berwenang menghasilkan HTTP `403 FORBIDDEN` dan dicatat.

## 3. Perlindungan terhadap Injeksi & Validasi Masukan
- **Parameterized SQL Queries**: Seluruh akses database PostgreSQL menggunakan parameter `$1, $2, ...` melalui driver `pg`. Tidak ada konkatenasi string langsung dari input pengguna ke dalam perintah SQL.
- **Validasi Skema Joi**: Seluruh body, query, dan parameter URL divalidasi dan disanitasi menggunakan middleware `validate(schema)` berbasis `Joi` (`stripUnknown: true`).

## 4. Keamanan Unggahan & Unduhan Berkas
- **Validasi Tipe & Ukuran**: `multer` membatasi ukuran unggahan (maksimal 10 MB secara default) dan memfilter hanya MIME type serta ekstensi yang diizinkan (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
- **Penyimpanan Terisolasi & Nama Acak**: Berkas yang diunggah diberi nama acak berbasis UUID + timestamp dan disimpan disertai hash integritas SHA-256 pada tabel `file_attachments`.
- **Unduhan Terautentikasi**: Berkas bukti temuan dan scan Suket K3 tidak diekspos sebagai direktori publik terbuka, melainkan hanya dapat diakses melalui endpoint terautentikasi `GET /api/v1/files/:id/download` dengan header `X-Content-Type-Options: nosniff`.

## 5. Integritas Audit Trail (Append-Only)
- Tabel `audit_logs` dilindungi oleh trigger level database PostgreSQL (`trg_audit_logs_immutable`) yang menolak setiap perintah `UPDATE` dan `DELETE` dengan exception `audit_logs bersifat append-only dan tidak dapat diubah atau dihapus`.
- Seluruh aktivitas kritikal (login, gagal login, perubahan status order, penjadwalan, penugasan Ahli K3, submit/reopen inspeksi, persetujuan/pengembalian LHPP, penerbitan Suket K3, pengiriman pengingat, dan pembuatan order perpanjangan) tercatat otomatis beserta identitas pelaku dan alamat IP.

