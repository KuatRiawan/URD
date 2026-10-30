# Audit Matriks Peran dan Izin Akses (RBAC)
## PT Upaya Riksa Daya

Dokumen ini memetakan implementasi kontrol akses berbasis peran (Role-Based Access Control / RBAC) pada aplikasi internal PT Upaya Riksa Daya untuk 4 peran operasional utama: **Marketing**, **Inspector**, **Pimpinan**, dan **Admin Sistem**.

---

## 1. Definisi Peran & Tanggung Jawab Operasional

| Peran Sistem | Peran Operasional | Tanggung Jawab Utama | Batasan & Aturan Keamanan |
| :--- | :--- | :--- | :--- |
| `MARKETING` / `ADMIN_KANTOR` | Petugas Administrasi & Marketing PO | Penerimaan PO dari klien, pendaftaran data perusahaan klien, input unit alat riksa uji, pemilihan lokasi dan PIC, pemantauan jadwal lapangan, pelacakan dokumen BAP dan LHPP, serta pencatatan distribusi dokumen. | Dilarang melakukan riksa uji teknis lapangan, dilarang mengisi checklist butir uji sebagai inspector, dan dilarang mengesahkan kesimpulan teknis. |
| `INSPECTOR` / `AHLI_K3` | Ahli K3 Spesialis & Pemeriksa Lapangan | Pelaksana riksa uji lapangan, verifikasi data fisik alat di lokasi, pengisian lembar kerja checklist digital, dokumentasi foto bukti teknis, pembuatan temuan ketidaksesuaian, pembubuhan tanda tangan basah digital, serta penerbitan draf LHPP dan finalisasi BAP bersama klien. | Hanya dapat mengakses order dan unit yang ditugaskan kepada dirinya atau timnya. Dilarang mengubah data klien/PO secara sewenang-wenang. |
| `PIMPINAN` / `MANAGER` | Manajemen Eksekutif & Monitoring | Pemantauan operasional riksa uji, evaluasi volume dan tren pemeriksaan berkala, monitoring masa berlaku Suket K3 (< 90 hari / < 30 hari), penelusuran detail order, checklist, dokumentasi foto, dan arsip dokumen. | Strictly Read-Only (hanya monitoring). Sistem secara otomatis memblokir mutasi (POST, PUT, PATCH, DELETE) dengan error 403 `MANAGER_READ_ONLY`. Tidak menjadi bottleneck verifikasi atau approval checklist teknis. |
| `ADMIN_SISTEM` | Administrator Sistem & IT | Manajemen akun pengguna, pengaturan hak peran (RBAC), konfigurasi master data kategori alat K3, validasi versi template checklist, pengawasan log audit append-only, dan pemeliharaan sistem. | Memiliki akses penuh terhadap konfigurasi sistem, namun tetap tercatat dalam log audit yang tidak dapat diubah (immutable). |

---

## 2. Matriks Akses Endpoint Backend

| Modul / Fitur | Endpoint API | Marketing | Inspector | Pimpinan | Admin Sistem |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Autentikasi** | `POST /auth/login` | Ya | Ya | Ya | Ya |
| | `POST /auth/logout` | Ya | Ya | Ya | Ya |
| | `GET /auth/me` | Ya | Ya | Ya | Ya |
| **Dasbor** | `GET /dashboard/summary` | Ya (Metis) | Ya (Field) | Ya (Metis Read-Only) | Ya (Metis) |
| | `GET /dashboard/work-queue` | Ya | Ya | Ya (Read-Only) | Ya |
| | `GET /dashboard/files/:id` | Ya | Ya (Terkait Tugas) | Ya (Read-Only) | Ya |
| **Purchase Order** | `GET /orders` | Ya | Ya (Terkait Tugas) | Ya (Read-Only) | Ya |
| | `POST /orders` | Ya | Tidak | Tidak (403) | Ya |
| | `GET /orders/:id` | Ya | Ya | Ya (Read-Only) | Ya |
| | `PUT /orders/:id` | Ya | Tidak | Tidak (403) | Ya |
| | `POST /orders/:id/units` | Ya | Tidak | Tidak (403) | Ya |
| | `PATCH /orders/:id/units/:objectId` | Ya | Ya (Status Uji) | Tidak (403) | Ya |
| **Jadwal & Tugas** | `GET /scheduling` | Ya | Ya | Ya (Read-Only) | Ya |
| | `POST /scheduling/assign` | Ya | Tidak | Tidak (403) | Ya |
| | `PATCH /scheduling/assignments/:id` | Tidak | Ya (Terima/Tolak) | Tidak (403) | Ya |
| **Riksa Uji / Form** | `GET /inspections` | Ya (Read-Only) | Ya | Ya (Read-Only) | Ya |
| | `POST /inspections/start` | Tidak | Ya | Tidak (403) | Ya |
| | `GET /inspections/:id` | Ya (Read-Only) | Ya | Ya (Read-Only) | Ya |
| | `PUT /inspections/:id/draft` | Tidak | Ya (Draf Sendiri) | Tidak (403) | Ya |
| | `POST /inspections/:id/photos` | Tidak | Ya (Draf Sendiri) | Tidak (403) | Ya |
| | `DELETE /inspections/:id/photos/:photoId` | Tidak | Ya (Draf Sendiri) | Tidak (403) | Ya |
| | `POST /inspections/:id/signatures` | Tidak | Ya (Draf Sendiri) | Tidak (403) | Ya |
| | `POST /inspections/:id/submit` | Tidak | Ya (Draf Sendiri) | Tidak (403) | Ya |
| **BAP** | `GET /bap` | Ya | Ya | Ya (Read-Only) | Ya |
| | `GET /bap/:id` | Ya | Ya | Ya (Read-Only) | Ya |
| | `GET /bap/:id/pdf` | Ya | Ya | Ya | Ya |
| | `POST /bap/:id/signatures` | Tidak | Ya | Tidak (403) | Ya |
| | `POST /bap/:id/finalize` | Tidak | Ya | Tidak (403) | Ya |
| **LHPP** | `GET /lhpp` | Ya | Ya | Ya (Read-Only) | Ya |
| | `GET /lhpp/:id` | Ya | Ya | Ya (Read-Only) | Ya |
| | `GET /lhpp/:id/pdf` | Ya | Ya | Ya | Ya |
| | `PUT /lhpp/:id` | Tidak | Ya (Revisi/Draf) | Tidak (403) | Ya |
| | `POST /lhpp/:id/finalize` | Tidak | Ya | Tidak (403) | Ya |
| | `POST /lhpp/:id/return` | Ya | Tidak | Tidak (403) | Ya |
| **Distribusi** | `GET /distributions` | Ya | Ya (Read-Only) | Ya (Read-Only) | Ya |
| | `POST /distributions` | Ya | Tidak | Tidak (403) | Ya |
| | `PATCH /distributions/:id` | Ya | Tidak | Tidak (403) | Ya |
| **Pengguna & Log** | `GET /users` | Tidak | Tidak | Tidak (403) | Ya |
| | `POST /users` | Tidak | Tidak | Tidak (403) | Ya |
| | `GET /audit-log` | Tidak | Tidak | Ya (Read-Only) | Ya |

---

## 3. Mekanisme Proteksi & Validasi Keamanan

1. **Middleware `authorize.js`**:
   - Menerapkan pemetaan alias otomatis (`INSPECTOR` setara dengan `AHLI_K3`, `MARKETING` setara dengan `ADMIN_KANTOR`, `PIMPINAN` setara dengan `MANAGER`).
   - Mencegah bypass dengan validasi token JWT simetris dan blacklist rotasi token.
   - Memeriksa HTTP Method: bila peran pengguna adalah `PIMPINAN` atau `MANAGER` dan melakukan mutasi data (POST, PUT, PATCH, DELETE), sistem mengembalikan HTTP status 403 `MANAGER_READ_ONLY`.

2. **Mitigasi Akses Lintas Penugasan (Horizontal Privilege Escalation)**:
   - Ahli K3 hanya diizinkan mengakses data formulir inspeksi, mengunggah foto, membubuhkan tanda tangan, atau memfinalisasi dokumen pada order yang secara resmi ditugaskan kepada dirinya di tabel `assignments` atau `order_objects`.
   - Endpoint file lampiran diverifikasi melalui fungsi `inspectorCanAccessAttachment`.

3. **Integritas Audit Log**:
   - Seluruh mutasi operasional (login, pembuatan PO, penugasan, pelaksanaan riksa uji, penghapusan foto draf, tanda tangan, finalisasi BAP dan LHPP) otomatis dicatat ke tabel `audit_logs`.
   - Trigger database PostgreSQL `trg_audit_logs_immutable` memblokir operasi UPDATE dan DELETE pada tabel `audit_logs`.
