# Register Cacat Staging & Kontrol Perubahan Kode (Staging Defect Register)

Tanggal: 2 November 2026  
Status Defect: **100% RESOLVED & VERIFIED (0 OPEN DEFECTS)**  
Penyusun: QA Automation Lead, Senior Full-Stack Engineer & Release Manager  

---

## 1. Ringkasan Status Cacat Sistem (Defect Summary)

Seluruh cacat yang ditemukan sejak Phase 1 hingga Phase 2B telah dicatat, dianalisis akar masalahnya, diperbaiki secara terarah tanpa bloat (prinsip Ponytail), dan diverifikasi melalui pengujian regresi (*regression testing*).

| Tingkat Keparahan (Severity) | Total Ditemukan | Selesai Diperbaiki & Lolos Verifikasi | Terbuka / Pending |
|:---|:---:|:---:|:---:|
| **CRITICAL** | 1 | 1 | 0 |
| **HIGH** | 2 | 2 | 0 |
| **MEDIUM** | 3 | 3 | 0 |
| **LOW** | 2 | 2 | 0 |
| **TOTAL** | **8** | **8** | **0** |

---

## 2. Rincian Buku Register Cacat (Detailed Defect Register)

### DEF-001: Eksekusi Destruktif Drop Schema pada Suite Pengujian Database
- **Severity:** HIGH (Keamanan Lingkungan)
- **Modul:** `backend/src/tests/api.test.js`
- **Akar Masalah:** Helper `beforeAll` menjalankan `runMigrations({ reset: true })` yang memanggil `DROP SCHEMA public CASCADE`. Jika dijalankan di database non-isolasi, seluruh tabel terhapus.
- **Tindakan Perbaikan:** Mengganti reset skema destruktif dengan pembersihan selektif non-destruktif (`TRUNCATE TABLE ... RESTART IDENTITY CASCADE`).
- **File Berubah:** `backend/src/tests/api.test.js`
- **Verifikasi:** Test berjalan bersih tanpa menghapus definisi skema (`PASS`).

---

### DEF-002: Penolakan Akses Role Marketing pada Pendaftaran Unit Objek (HTTP 403)
- **Severity:** HIGH (Operational Blocker)
- **Modul:** `backend/src/modules/objects/routes.js`
- **Akar Masalah:** Middleware `authorize(['ADMIN_SISTEM', 'ADMIN_KANTOR', 'INSPECTOR'])` belum menyertakan role `MARKETING`, padahal SOP bisnis URD menetapkan Marketing mendaftarkan inventaris alat dan membuat PO.
- **Tindakan Perbaikan:** Menambahkan `'MARKETING'` ke array otorisasi endpoint pembuatan, pengeditan, dan impor objek.
- **File Berubah:** `backend/src/modules/objects/routes.js`
- **Verifikasi:** Role Marketing berhasil mendaftarkan 3 unit objek dalam simulasi UAT (`PASS`).

---

### DEF-003: Kebocoran Akses Antar-Inspector pada Unit Berbeda dalam PO yang Sama
- **Severity:** CRITICAL (Pelanggaran Isolasi Data & Least Privilege)
- **Modul:** `backend/src/modules/inspections/routes.js`
- **Akar Masalah:** Validasi kepemilikan inspeksi lama hanya memeriksa relasi tingkat PO, bukan relasi penugasan tingkat unit (`order_objects`). Akibatnya, Inspector A dapat membuka detail dan mengubah checklist Unit B.
- **Tindakan Perbaikan:** Memperketat middleware `assertInspectionOwnership` dengan validasi kepemilikan assignment unit:
  ```sql
  SELECT a.id FROM assignments a 
  JOIN order_objects oo ON oo.id = a.order_object_id 
  WHERE oo.id = $1 AND a.inspector_id = $2;
  ```
- **File Berubah:** `backend/src/modules/inspections/routes.js`
- **Verifikasi:** Inspector A ditolak saat mencoba mengakses atau memutasi checklist Unit B (`PASS`).

---

### DEF-004: Bypass Validasi Penjadwalan PO Tanpa Rentang Tanggal
- **Severity:** MEDIUM (Integritas Data)
- **Modul:** `backend/src/modules/scheduling/routes.js`
- **Akar Masalah:** Endpoint konfirmasi jadwal tidak memvalidasi apakah tanggal mulai (`start_date`) lebih awal dari tanggal selesai (`end_date`).
- **Tindakan Perbaikan:** Menambahkan validasi logika tanggal di layer middleware `validate.js` sebelum menulis ke tabel `assignments`.
- **File Berubah:** `backend/src/modules/scheduling/routes.js`
- **Verifikasi:** Request jadwal dengan tanggal mundur ditolak dengan `HTTP 400 Bad Request` (`PASS`).

---

### DEF-005: Inkonsistensi Kueri Relasi Pengingat Masa Berlaku Suket Disnaker
- **Severity:** MEDIUM (Logika Bisnis)
- **Modul:** `backend/src/services/client-reminders.js`
- **Akar Masalah:** Kueri reminder membaca `objects.next_inspection_date` lama tanpa mengutamakan relasi `suket_registrations.valid_until` yang paling baru diterbitkan oleh Disnaker.
- **Tindakan Perbaikan:** Memperbarui kueri dengan `COALESCE(ls.valid_until, t.next_inspection_date, li.recommended_valid_until)`.
- **File Berubah:** `backend/src/services/client-reminders.js`
- **Verifikasi:** Pengingat menghitung tanggal jatuh tempo unit secara presisi dari Suket terakhir (`PASS`).

---

### DEF-006: Template PDF LHPP Belum Memuat Lampiran Halaman SKP Ahli K3
- **Severity:** LOW (Kelengkapan Dokumen Legalitas)
- **Modul:** `backend/src/services/pdf-generator.js`
- **Akar Masalah:** Pembangkitan PDF F4 baru merender 5 bagian laporan teknis, tetapi belum menyertakan halaman legalitas penunjukan SKP Ahli K3 dan Lisensi PJK3 dari Kemnaker RI.
- **Tindakan Perbaikan:** Menambahkan generator lampiran halaman legalitas resmi yang disesuaikan secara dinamis dengan kategori K3 objek (`assets/lhpp/skp`).
- **File Berubah:** `backend/src/services/pdf-generator.js`
- **Verifikasi:** 8 test case di `lhpp-pdf-generator.test.js` memverifikasi seluruh kategori K3 menghasilkan lampiran legalitas lengkap (`PASS`).

---

### DEF-007: Kerentanan Balapan (Race Condition) pada Sinkronisasi Offline Inspector
- **Severity:** MEDIUM (Stabilitas Lapangan)
- **Modul:** `frontend/src/lib/utils/offline-sync.js`
- **Akar Masalah:** Saat koneksi seluler berfluktuasi di lapangan, event `online` dipancarkan beberapa kali dalam 1 detik, memicu proses flush paralel yang berpotensi menduplikasi pengiriman data checklist.
- **Tindakan Perbaikan:** Mengimplementasikan mutex flusher lock (`isFlushing`) dan wrapper `flushQueue` yang bersifat idempoten.
- **File Berubah:** `frontend/src/lib/utils/offline-sync.js`
- **Verifikasi:** 4 test case di `offline-sync.test.js` membuktikan mutasi ganda berhasil dicegah (`PASS`).

---

### DEF-008: Pemotongan Paginasi Log Audit pada Pengujian E2E UAT
- **Severity:** LOW (Test Suite Reliability)
- **Modul:** `backend/src/tests/uat-e2e.test.js`
- **Akar Masalah:** Default pagination limit endpoint audit log adalah 30 entri. Setelah melewati langkah 7 dalam pengujian E2E, total aksi audit melampaui 30, menyebabkan aksi `ORDER_SCHEDULE` terdorong ke halaman 2 dan memicu assertion failure.
- **Tindakan Perbaikan:** Mengatur parameter kueri menjadi `GET /api/v1/audit-logs?limit=100` pada pengujian UAT.
- **File Berubah:** `backend/src/tests/uat-e2e.test.js`
- **Verifikasi:** 29 asertasi UAT lulus 100% tanpa kegagalan paginasi (`PASS`).

---

## 3. Kesimpulan Kontrol Perubahan Kode

Seluruh perbaikan kode mematuhi prinsip **Ponytail**: perbaikan dilakukan pada akar masalah bersama (*shared code*) dengan diff sesingkat mungkin, tanpa abstraksi berlebihan, dan dilengkapi dengan pengujian regresi otomatis.

