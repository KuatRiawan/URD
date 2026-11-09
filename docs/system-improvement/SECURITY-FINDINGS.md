# PT Upaya Riksa Daya (URD) — Application Security Assessment & Verification Findings

Dokumen ini mendokumentasikan hasil pengujian penetrasi, audit postur keamanan aplikasi, kerentanan yang teridentifikasi, mitigasi pertahanan yang diterapkan, serta bukti verifikasi keamanan (*Automated Security Verification*).

---

## 1. Ringkasan Postur Keamanan Sistem

Sistem operasional PT Upaya Riksa Daya telah diuji terhadap vektor serangan umum OWASP Top 10 dan skenario penetrasi khusus industri PJK3:

| Vektor Keamanan / Kerentanan | Status Perlindungan | Bukti Pengujian |
| :--- | :---: | :--- |
| **SQL Injection (SQLi)** | ✅ **Kebal (Immune)** | `security-hardening.test.js` (Bagian 4) |
| **Broken Object Level Auth (BOLA / IDOR)** | ✅ **Dicegah Penuh** | `security-hardening.test.js` (Bagian 2) |
| **Cross-Site Request Forgery (CSRF)** | ✅ **Dicegah Penuh** | Middleware `app.js` (X-Requested-With & Bearer check) |
| **Brute Force & Credential Stuffing** | ✅ **Dicegah Penuh** | `app.js` rateLimit (25 req / 15 menit pada `/api/v1/auth/login`) |
| **Kebocoran Kredensial Sensitif (Secret Leaks)**| ✅ **Dicegah Penuh** | `super-admin-v2-workspace.test.js` (Bagian 4 secret masking) |
| **Malicious File Upload / Code Execution** | ✅ **Dicegah Penuh** | `security-hardening.test.js` (Bagian 6 MIME & Ext check) |
| **Manipulasi Jejak Audit (Audit Tampering)** | ✅ **Kekal (Immutable)** | `api.test.js` (Bagian 6 trigger anti-UPDATE/DELETE) |
| **Kebocoran Data Verifikasi Publik** | ✅ **Privasi Terlindungi** | `security-hardening.test.js` (Bagian 5 GET /verify/:code) |
| **Penyalahgunaan Akun Nonaktif** | ✅ **Dicegah Penuh** | `role-permission-negative.test.js` (Bagian 9) |

---

## 2. Rincian Temuan & Mekanisme Pertahanan

### A. Resistansi Terhadap Parameter SQL Injection
- **Pengujian**: Mengirimkan payload berbahaya pada parameter kueri filter:
  - `'' OR 1=1 --`
  - `''; DROP TABLE clients; --`
  - `'1' UNION SELECT null, null, null, null--`
  - `'' OR 'a'='a'`
- **Mekanisme Pertahanan**: Seluruh kueri basis data pada Express repository dan service menggunakan *parameterized queries* (`$1, $2, ...`) via pg connection pool. Tidak ada interpolasi string langsung (`${input}`) ke dalam klausa SQL.
- **Hasil**: Seluruh payload dinetralisir menjadi string literal pencarian biasa; tidak terjadi SQL crash maupun kebocoran tabel.

### B. Pencegahan IDOR / BOLA pada Penugasan Inspector
- **Skenario Risiko**: Inspector A mencoba menyimpan draf inspeksi, mengunggah foto, atau men-submit unit yang secara resmi ditugaskan kepada Inspector B.
- **Mekanisme Pertahanan**: Lapangan penugasan divalidasi pada lapisan middleware dan kueri:
  ```javascript
  // Memeriksa kepemilikan penugasan
  const { rows: asg } = await query(
    'SELECT id FROM inspector_assignments WHERE order_id = $1 AND object_id = $2 AND inspector_id = $3',
    [orderId, objectId, req.user.id]
  );
  if (!asg[0] && !['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(req.user.role)) {
    throw new AppError(403, 'FORBIDDEN_INSPECTOR_ACCESS', 'Anda tidak ditugaskan untuk memeriksa unit ini.');
  }
  ```
- **Hasil**: Akses ditolak dengan HTTP 403 Forbidden. Pengujian membuktikan isolasi total antar-inspector.

### C. Mitigasi CSRF pada Penyimpanan Token HttpOnly Cookie
- **Mekanisme Pertahanan**: Pada `backend/src/app.js`, Express memeriksa setiap request mutasi (`POST`, `PUT`, `PATCH`, `DELETE`) yang membawa cookie sesi `urd_access` / `urd_refresh`. Jika request tidak menyertakan header otentikasi Bearer atau custom header `X-Requested-With: XMLHttpRequest`, sistem menolak permintaan dengan HTTP 403 `CSRF_PROTECTED`. Hal ini mencegah serangan pemanggilan API lintas situs dari peramban pihak ketiga.

### D. Penyamaran Rahasia Gateway & Kredensial Sensitif
- **Mekanisme Pertahanan**: Pada endpoint `GET /api/v1/system-settings`, konfigurasi server SMTP (kata sandi email) dan WhatsApp Gateway (API Token) secara otomatis disamarkan (*masked*) menjadi `••••••••••••`. Log audit juga secara ketat membersihkan nilai kata sandi dari kolom metadata payload JSON.

### E. Keamanan Unggah Berkas & Binary Whitelisting
- **Pengujian**: Mencoba mengunggah berkas biner berbahaya atau skrip eksekusi (`.exe`, `.sh`, `.bat`, `.php`, `.js`) sebagai lampiran foto inspeksi lapangan.
- **Mekanisme Pertahanan**: Multer dan file validation middleware memvalidasi ekstensi berkas dan MIME type yang diizinkan hanya format gambar terverifikasi (`image/jpeg`, `image/png`, `image/webp`).
- **Hasil**: Permintaan dengan ekstensi dilarang langsung ditolak dengan HTTP 400 Bad Request.

### F. Kekekalan Jejak Audit Basis Data (Database Trigger Guard)
- **Mekanisme Pertahanan**: Tabel `audit_logs` dilindungi oleh fungsi trigger PL/pgSQL pada PostgreSQL:
  ```sql
  CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
  RETURNS trigger AS $$
  BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are forbidden.';
  END;
  $$ LANGUAGE plpgsql;
  ```
- **Hasil**: Setiap upaya `UPDATE` atau `DELETE` pada tabel `audit_logs` akan ditolak oleh basis data dengan runtime database exception.

### G. Privasi Rute Verifikasi Publik (`GET /api/v1/verify/:code`)
- **Mekanisme Pertahanan**: Endpoint publik untuk pemindaian QR code stiker fisik mengembalikan hanya metadata legalitas dan keselamatan K3 (nama klien, merek alat, nomor seri, tanggal uji, masa berlaku Suket, status laik/tidak laik). Endpoint ini secara tegas memfilter dan tidak pernah mengekspos ID internal user, alamat email teknis, token, maupun data komersial harga.

