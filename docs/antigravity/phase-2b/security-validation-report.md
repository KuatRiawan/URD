# Laporan Validasi Keamanan Aplikasi (Security Validation Report)

Tanggal: 2 November 2026  
Status Keamanan: **PASSED (15 SKENARIO NEGATIF OTORISASI & AUDIT CELAH BERHASIL LULUS)**  
Penyusun: Application Security Engineer & Software Architect  

---

## 1. Mekanisme Autentikasi & Keamanan Sesi

Pengujian autentikasi dijalankan melalui suite pengujian otomatis `backend/src/tests/api.test.js` (Bagian 1):

1. **Penolakan Akses Tanpa Kredensial:** Endpoint privat mengembalikan `HTTP 401 Unauthorized`.
2. **Perlindungan Terhadap User Enumeration:** Kredensial yang salah mengembalikan respon seragam `Kredensial tidak valid` tanpa memberitahu apakah username terdaftar atau tidak.
3. **Rotasi Refresh Token (Token Family Rotation):**
   - Refresh token hanya dapat digunakan satu kali.
   - Menggunakan kembali refresh token yang sudah terpakai memicu deteksi pencurian token dan **mencabut seluruh sesi pengguna** secara otomatis.
4. **Keamanan Cookie:**
   - `HttpOnly`: Mencegah pembacaan token sesi melalui serangan XSS di JavaScript browser.
   - `Secure`: Cookie hanya dikirimkan melalui koneksi terenkripsi HTTPS (diaktifkan otomatis di staging/produksi).
   - `SameSite=Lax`: Mencegah serangan CSRF (*Cross-Site Request Forgery*) dari situs pihak ketiga.

---

## 2. Matriks Otorisasi Berbasis Peran (RBAC Validation)

Pengujian penolakan otorisasi negatif (`backend/src/tests/role-permission-negative.test.js`) memverifikasi 15 skenario pelanggaran hak akses di level HTTP API (bukan sekadar menyembunyikan tombol UI):

| ID Skenario | Peran yang Diuji | Tindakan yang Dicoba | Hasil yang Diharapkan | Status Hasil |
|:---:|---|---|:---:|:---:|
| **SEC-001** | `MARKETING` | Mengakses antrean Quality Control (QC) | HTTP 403 Forbidden | **PASSED** |
| **SEC-002** | `MARKETING` | Membuka endpoint administrasi pengguna | HTTP 403 Forbidden | **PASSED** |
| **SEC-003** | `MARKETING` | Melakukan finalisasi dokumen LHPP | HTTP 403 Forbidden | **PASSED** |
| **SEC-004** | `MARKETING` | Mendaftarkan nomor Suket Disnaker | HTTP 403 Forbidden | **PASSED** |
| **SEC-005** | `MARKETING` | Mengeksekusi distribusi berkas BAST | HTTP 403 Forbidden | **PASSED** |
| **SEC-006** | `INSPECTOR` | Mengedit profil klien komersial | HTTP 403 Forbidden | **PASSED** |
| **SEC-007** | `INSPECTOR` | Mengubah jadwal penugasan PO lain | HTTP 403 Forbidden | **PASSED** |
| **SEC-008** | `INSPECTOR` | Mengakses inspeksi unit milik Inspector lain | HTTP 403/404 Isolated | **PASSED** |
| **SEC-009** | `INSPECTOR` | Menyetujui hasil QC LHPP dirinya sendiri | HTTP 403 Forbidden | **PASSED** |
| **SEC-010** | `INSPECTOR` | Menerbitkan nomor BAP resmi | HTTP 403 Forbidden | **PASSED** |
| **SEC-011** | `ADMIN_KANTOR` | Menghapus log audit sistem | HTTP 403 Forbidden | **PASSED** |
| **SEC-012** | `ADMIN_KANTOR` | Mengubah role user lain menjadi Super Admin | HTTP 403 Forbidden | **PASSED** |
| **SEC-013** | `PIMPINAN` | Mengubah status checklist inspeksi unit | HTTP 403 Forbidden | **PASSED** |
| **SEC-014** | `PIMPINAN` | Menyetujui/menolak LHPP (Read-Only SOP) | HTTP 403 Forbidden | **PASSED** |
| **SEC-015** | `ANONYMOUS` | Mengakses detail Purchase Order tanpa token | HTTP 401 Unauthorized | **PASSED** |

**Prinsip Non-Negotiable:** Pimpinan bersifat *read-only monitoring*; otorisasi mutasi data pada level controller Express menolak seluruh permintaan mutasi (POST, PUT, PATCH, DELETE) dari role PIMPINAN.

---

## 3. Hasil Audit Celah Keamanan (Vulnerability Assessment)

1. **SQL Injection (SQLi):**
   - **Hasil:** Bersih (`0 vulnerabilities`).
   - **Bukti:** Seluruh kueri database pada 18 modul backend menggunakan parameter binding terkueri (`$1, $2, ...`) melalui driver `pg`. Tidak ada konkatenasi string SQL mentah pada input pengguna.
2. **Insecure Direct Object Reference (IDOR):**
   - **Hasil:** Terlindungi.
   - **Bukti:** Middleware `assertInspectionOwnership` memverifikasi bahwa Inspector hanya dapat mengakses unit objek yang tercantum dalam tabel `assignments` aktif atas namanya.
3. **Cross-Site Scripting (XSS):**
   - **Hasil:** Terlindungi.
   - **Bukti:** Frontend menggunakan React JSX yang secara otomatis meng-escape nilai variabel sebelum dirender ke DOM. Tidak ada penggunaan `dangerouslySetInnerHTML`.
4. **Brute Force & Rate Limiting:**
   - **Hasil:** Terproteksi.
   - **Bukti:** Modul `express-rate-limit` membatasi percobaan login maksimum 10 kali per 15 menit per alamat IP.
5. **Masking Error Produksi:**
   - **Hasil:** Aman.
   - **Bukti:** Pada mode non-development, middleware error handler menahan stack trace dan hanya mengembalikan pesan terstruktur: `{ error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan sistem' } }`.

