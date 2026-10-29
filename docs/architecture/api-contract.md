# Kontrak REST API (`/api/v1`): PT Upaya Riksa Daya

Seluruh endpoint berada di bawah prefix `/api/v1` dan menggunakan format respons JSON terstandarisasi.

## 1. Format Respons Standar

- **Sukses (`200 OK`, `201 Created`)**:
  ```json
  {
    "data": { ... },
    "meta": { "total": 10, "page": 1, "limit": 25 }
  }
  ```
- **Error (`400`, `401`, `403`, `404`, `409`, `422`, `500`)**:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Data masukan tidak valid.",
      "details": [{ "field": "email", "message": "\"email\" must be a valid email" }]
    }
  }
  ```

## 2. Daftar Endpoint Utama per Modul

### A. Autentikasi & Sesi (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Autentikasi email & kata sandi; mengembalikan `accessToken`, profil `user`, dan menyetel cookie `urd_refresh_token` (`HttpOnly`).
- `POST /api/v1/auth/refresh`: Rotasi sesi refresh token dan penerbitan `accessToken` baru (memerlukan header `X-Requested-With: XMLHttpRequest`).
- `POST /api/v1/auth/logout`: Pencabutan sesi refresh di database dan penghapusan cookie.
- `GET /api/v1/auth/me`: Mengambil profil pengguna yang sedang aktif.

### B. Manajemen Pengguna (`/api/v1/users`) — *Khusus `ADMIN_SISTEM`*
- `GET /api/v1/users`: Daftar pengguna internal dengan filter pencarian dan peran.
- `POST /api/v1/users`: Membuat akun pengguna baru (kata sandi di-hash dengan bcrypt).
- `PATCH /api/v1/users/:id`: Memperbarui profil, peran, atau status aktif pengguna.

### C. Manajemen Klien (`/api/v1/clients`)
- `GET /api/v1/clients`: Daftar perusahaan klien beserta jumlah lokasi, PIC, dan objek uji.
- `GET /api/v1/clients/:id`: Detail perusahaan klien beserta lokasi site, PIC, daftar peralatan, dan riwayat order.
- `POST /api/v1/clients` & `PUT /api/v1/clients/:id`: Tambah/perbarui data perusahaan klien.
- `POST /api/v1/clients/:id/locations` & `POST /api/v1/clients/:id/contacts`: Tambah lokasi kerja dan kontak PIC klien.

### D. Master Objek Uji K3 (`/api/v1/objects`)
- `GET /api/v1/objects/categories`: Daftar 7 bidang K3 (`PAA`, `PTP`, `PUBT`, `LIS`, `IPP`, `LE`, `IPK`).
- `GET /api/v1/objects`: Daftar peralatan/objek uji dengan filter klien, kategori, status, dan pencarian nomor seri.
- `GET /api/v1/objects/:id`: Detail peralatan beserta riwayat inspeksi, riwayat LHPP, daftar Suket K3, dan gambar QR Code (`data:image/png;base64`).
- `POST /api/v1/objects` & `PUT /api/v1/objects/:id`: Tambah/perbarui objek uji (menolak nomor seri duplikat pada klien yang sama dengan `409 DUPLICATE_SERIAL_NUMBER`).
- `POST /api/v1/objects/import-csv`: Impor massal objek uji dari data CSV.

### E. Ahli K3 & Matriks Kompetensi (`/api/v1/inspectors`)
- `GET /api/v1/inspectors`: Daftar personel Ahli K3 beserta daftar sertifikat kompetensi aktif.
- `POST /api/v1/inspectors`: Tambah personel Ahli K3.
- `POST /api/v1/inspectors/:id/competencies` & `DELETE /api/v1/inspectors/:id/competencies/:compId`: Kelola sertifikat kompetensi SKP per bidang K3.

### F. Order, Penjadwalan & Penugasan (`/api/v1/orders` & `/api/v1/schedules`)
- `GET /api/v1/orders`, `POST /api/v1/orders`, `GET /api/v1/orders/:id`: Daftar, pembuatan, dan detail order riksa uji.
- `PATCH /api/v1/orders/:id/status`: Perubahan status order beserta pencatatan `order_status_history`.
- `POST /api/v1/orders/:id/schedule`: Penetapan atau penjadwalan ulang pelaksanaan lapangan (memvalidasi bentrok jadwal Ahli K3 dengan `409 SCHEDULE_CONFLICT`).
- `POST /api/v1/orders/:id/assign`: Penugasan tim Ahli K3 (memvalidasi kecocokan kompetensi SKP dengan `422 COMPETENCY_MISMATCH` dan bentrok jadwal dengan `409 SCHEDULE_CONFLICT`).
- `POST /api/v1/orders/:id/assignments/:assignmentId/confirm`: Konfirmasi `DITERIMA` atau `DITOLAK` oleh Ahli K3.
- `GET /api/v1/orders/:id/assignment-letter.pdf`: Unduh dokumen **Surat Tugas PDF** resmi berlogo PT Upaya Riksa Daya.
- `GET /api/v1/schedules`: Kalender jadwal operasional dengan filter rentang tanggal dan personel Ahli K3.

### G. Pelaksanaan Inspeksi Digital (`/api/v1/inspections`)
- `GET /api/v1/inspections/templates`: Daftar template checklist K3 beserta status validasi Ahli K3 (`is_validated`).
- `POST /api/v1/inspections/templates/versions/:versionId/validate`: Validasi template oleh Ahli K3.
- `POST /api/v1/inspections/start`: Membuka lembar kerja inspeksi untuk objek uji pada order.
- `GET /api/v1/inspections/:id`: Detail lembar kerja inspeksi beserta item parameter, temuan, foto, dan tanda tangan.
- `PUT /api/v1/inspections/:id/draft`: Simpan draft hasil pemeriksaan (menolak perubahan dengan `409 INSPECTION_LOCKED` apabila sudah dikunci).
- `POST /api/v1/inspections/:id/findings` & `POST /api/v1/inspections/:id/findings/:findingId/photos`: Catat temuan dan unggah foto dokumentasi.
- `POST /api/v1/inspections/:id/signatures`: Simpan tanda tangan digital `AHLI_K3` dan `PERWAKILAN_KLIEN`.
- `POST /api/v1/inspections/:id/submit`: Mengunci lembar kerja inspeksi dan secara otomatis membuat draf dokumen LHPP.
- `POST /api/v1/inspections/:id/reopen`: Membuka kembali kunci inspeksi dengan alasan revisi wajib.

### H. LHPP, Suket K3, Pengingat & Audit (`/api/v1/lhpp`, `/api/v1/suket`, `/api/v1/reminders`, `/api/v1/audit-logs`)
- `GET /api/v1/lhpp`, `GET /api/v1/lhpp/:id`, `PUT /api/v1/lhpp/:id/draft`: Kelola dokumen LHPP.
- `POST /api/v1/lhpp/:id/submit-review`: Kirim draf LHPP ke review teknis.
- `POST /api/v1/lhpp/:id/review`: Keputusan review Pimpinan (`APPROVE_TECHNICAL`, `APPROVE_FINAL`, atau `RETURN` dengan catatan wajib). Saat `APPROVE_FINAL`, sistem menghasilkan nomor unik `LHPP/<BIDANG>/<BULAN_ROMAWI>/<TAHUN>/<URUT>`.
- `GET /api/v1/lhpp/:id/pdf`: Unduh dokumen **LHPP PDF** resmi dengan logo PT Upaya Riksa Daya dan QR Code verifikasi.
- `POST /api/v1/lhpp/:id/deliveries`: Catat bukti serah terima LHPP ke klien.
- `GET /api/v1/suket`, `POST /api/v1/suket`, `GET /api/v1/suket/:id`, `POST /api/v1/suket/:id/scan`, `POST /api/v1/suket/:id/followups`: Registri Suket K3, unggah scan, dan catatan follow-up perpanjangan.
- `GET /api/v1/reminders`, `POST /api/v1/reminders/run-dispatch`, `POST /api/v1/reminders/:suketId/create-renewal-order`: Pantau jatuh tempo, jalankan pengingat `H-90/H-60/H-30/H-14/H0`, dan buat order riksa uji perpanjangan dalam 1 klik.
- `GET /api/v1/dashboard/summary`, `GET /api/v1/notifications`, `GET /api/v1/audit-logs`, `GET /api/v1/files/:id/download`: Ringkasan KPI, notifikasi, audit trail, dan unduhan berkas terproteksi.

