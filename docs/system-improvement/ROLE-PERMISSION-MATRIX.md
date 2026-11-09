# PT Upaya Riksa Daya (URD) — Role & Permission Matrix (RBAC)

Dokumen ini mendefinisikan matriks hak akses berbasis peran (*Role-Based Access Control*) pada sistem PT Upaya Riksa Daya, memetakan kewenangan setiap peran terhadap modul dan tindakan dalam sistem, serta menetapkan batas-batas terlarang (*Negative Permissions*) yang ditegakkan secara ketat pada lapisan API backend dan antarmuka pengguna.

---

## 1. Matriks Kewenangan CRUD Berdasarkan Peran

| Modul & Tindakan Sistem | Marketing (`MARKETING`) | Inspector (`AHLI_K3`) | Admin Kantor (`ADMIN_KANTOR`) | Pimpinan (`PIMPINAN`) | Super Admin (`ADMIN_SISTEM`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Kelola Pengguna & Akun (`/users`)** | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ✅ Full CRUD |
| **Profil Mandiri & Ganti Password** | ✅ Sendiri | ✅ Sendiri | ✅ Sendiri | ✅ Sendiri | ✅ Semua Akun |
| **Registrasi Klien & Cabang Lokasi** | ✅ Buat / Edit | 👁️ Lihat Saja | ✅ Buat / Edit | 👁️ Lihat Saja | ✅ Full CRUD |
| **Kelola Multi-PIC Klien** | ✅ Buat / Edit / Nonaktif | 👁️ Lihat Saja | ✅ Buat / Edit / Nonaktif | 👁️ Lihat Saja | ✅ Full CRUD |
| **Registrasi Objek Uji K3 (Alat)** | ✅ Buat / Edit / Impor | 👁️ Lihat Saja | ✅ Buat / Edit / Impor | 👁️ Lihat Saja | ✅ Full CRUD |
| **Buat Purchase Order (PO) Multi-Unit**| ✅ Buat / Edit / Tambah Unit | ❌ Ditolak | ✅ Buat / Edit / Tambah Unit | ❌ Ditolak | ✅ Full CRUD |
| **Batalkan PO (Status Terdaftar)** | ✅ Boleh | ❌ Ditolak | ✅ Boleh | ❌ Ditolak | ✅ Boleh |
| **Tetapkan Jadwal & Penugasan Inspector**| 👁️ Lihat Saja | ❌ Ditolak | ✅ Tetapkan & Deteksi Bentrok | ❌ Ditolak | ✅ Boleh |
| **Terima Penugasan & Surat Tugas PDF** | ❌ Ditolak | ✅ Unduh Milik Sendiri | 👁️ Pratinjau / Cetak | 👁️ Pratinjau / Cetak | ✅ Semua Penugasan |
| **Mulai Inspeksi & Simpan Draf Ceklis**| ❌ Ditolak | ✅ Unit Milik Sendiri | ❌ Ditolak | ❌ Ditolak | ✅ Boleh |
| **Unggah Foto Lapangan & Tanda Tangan**| ❌ Ditolak | ✅ Unit Milik Sendiri | ❌ Ditolak | ❌ Ditolak | ✅ Boleh |
| **Submit Hasil Inspeksi ke Admin** | ❌ Ditolak | ✅ Unit Milik Sendiri | ❌ Ditolak | ❌ Ditolak | ✅ Boleh |
| **Lapor Kendala Lapangan (`/issues`)** | ✅ Tindak Lanjut | ✅ Buat Laporan Kendala | ✅ Buat / Tindak Lanjut | 👁️ Lihat Saja | ✅ Full CRUD |
| **Quality Control (QC) & Minta Revisi**| ❌ Ditolak | ❌ Ditolak | ✅ Review & Minta Revisi | ❌ Ditolak | ✅ Boleh |
| **Kirim Ulang Revisi Hasil Inspeksi** | ❌ Ditolak | ✅ Unit Milik Sendiri | ❌ Ditolak | ❌ Ditolak | ✅ Boleh |
| **Pratinjau PDF / DOCX LHPP & BAP** | 👁️ Draf Saja | 👁️ Draf Saja | ✅ Pratinjau Lengkap | 👁️ Pratinjau Lengkap | ✅ Pratinjau Lengkap |
| **Finalisasi Dokumen Resmi LHPP** | ❌ Ditolak (403) | ❌ Ditolak (403) | ✅ Finalisasi Resmi | ❌ Ditolak (403) | ✅ Boleh |
| **Finalisasi Berita Acara (BAP)** | ❌ Ditolak (403) | ❌ Ditolak (403) | ✅ Finalisasi Resmi | ❌ Ditolak (403) | ✅ Boleh |
| **Kelola Registri Suket K3 Disnaker** | 👁️ Pantau Masa Berlaku | ❌ Ditolak | ✅ Input / Upload Scan | 👁️ Lihat Saja | ✅ Full CRUD |
| **Cetak Stiker QR Code Alat / Suket** | ❌ Ditolak | ❌ Ditolak | ✅ Cetak Stiker | 👁️ Lihat Saja | ✅ Cetak Stiker |
| **Kelola Distribusi Berkas & BAST PDF**| ❌ Ditolak | ❌ Ditolak | ✅ Buat / Update Resi | ❌ Ditolak (403) | ✅ Full CRUD |
| **Pemicu Pengingat Sertifikat (Renewal)**| ✅ Pemicu PO Baru | ❌ Ditolak | ✅ Pemicu PO Baru | 👁️ Pantau Saja | ✅ Boleh |
| **Pemantauan Eksekutif & Laporan CSV** | 👁️ Parsial Klien | 👁️ Parsial Tugas | 👁️ Parsial Berkas | ✅ Full Monitoring & CSV | ✅ Full Akses |
| **Master Data Taksonomi 3-Level** | 👁️ Pilih Saja | 👁️ Pilih Saja | 👁️ Pilih Saja | 👁️ Lihat Saja | ✅ Full CRUD |
| **Checklist Builder (Copy-on-Write)** | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ✅ Full Pengelolaan |
| **LHPP Template Manager (JSON Schema)**| ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ✅ Full Pengelolaan |
| **Konfigurasi Kop Surat & Penomoran** | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ✅ Full Pengaturan |
| **Cadangan Database SQL & Checksum** | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ✅ Backup & Unduh |
| **Jejak Audit Kekal (`audit_logs`)** | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | 👁️ Baca Saja | ✅ Baca Saja |

---

## 2. Penegakan Otorisasi Negatif Teruji (*Negative Permission Enforcement*)

Seluruh aturan di bawah ini telah diverifikasi melalui pengujian otomatis (*Automated Test Suite* `role-permission-negative.test.js` dan `security-hardening.test.js`):

1. **Prinsip Read-Only Ketat untuk Pimpinan/Manager (ADR 015)**:
   - Pimpinan secara tegas **DITOLAK** melakukan segala bentuk mutasi data transaksional (`POST`, `PUT`, `PATCH`, `DELETE`).
   - Mencoba membuat order/PO → HTTP 403 `MANAGER_READ_ONLY`.
   - Mencoba menjadwalkan order → HTTP 403 `MANAGER_READ_ONLY`.
   - Mencoba melakukan QC atau finalisasi LHPP/BAP → HTTP 403 `MANAGER_READ_ONLY`.
   - Mencoba membuat distribusi berkas → HTTP 403 `MANAGER_READ_ONLY`.
   - Mencoba menghapus foto atau data inspeksi → HTTP 403 `MANAGER_READ_ONLY`.

2. **Perlindungan Terhadap Akses Lintas Penugasan Inspector (IDOR / BOLA)**:
   - Inspector A dilarang mengakses, mengubah, atau mengirimkan draf inspeksi milik Inspector B (HTTP 403 `FORBIDDEN_INSPECTOR_ACCESS`).
   - Inspector A dilarang mengunduh dokumen temuan atau rekomendasi milik penugasan Inspector B (HTTP 403/404).

3. **Segregasi Peran Marketing Terhadap Ranah Dokumen Resmi**:
   - Marketing dilarang melakukan finalisasi dokumen teknis LHPP atau BAP (HTTP 403 `FORBIDDEN`).
   - Marketing dilarang mengubah status distribusi berkas (HTTP 403 `FORBIDDEN`).

4. **Perlindungan Akun Nonaktif & Sesi**:
   - Akun yang dinonaktifkan (`is_active = false`) oleh Super Admin langsung ditolak pada saat melakukan autentikasi maupun saat memanggil endpoint API ber-token (HTTP 401 `ACCOUNT_INACTIVE`).
   - Super Admin dicegah dari menonaktifkan atau mengubah peran akun dirinya sendiri demi menghindari penguncian sistem (*lock-out prevention*).

