# Laporan Pengujian Integrasi Database PostgreSQL — URD Phase 1

Tanggal Pengujian: 2 November 2026  
Status Eksekusi: **PASS (100%)**  
Lingkungan Database: PostgreSQL 16 terisolasi (`urd_test` pada port 5433)  
Pelaksana: Principal Product Engineer & Database Security Lead  

---

## 1. Konfigurasi Lingkungan & Keamanan Data

Pengujian integrasi backend dijalankan pada instans PostgreSQL lokal terisolasi untuk memastikan tidak ada dampak pada data operasional maupun database produksi.

### Parameter Lingkungan Test:
- **Host & Port:** `localhost:5433` (Unix domain socket: `/tmp/.s.PGSQL.5433`)
- **Nama Database:** `urd_test`
- **User Database:** `mac` (superuser lokal non-networked)
- **Variabel Lingkungan:** `TEST_DATABASE_URL=postgresql://mac@localhost:5433/urd_test`
- **Level Isolasi:** Database terpisah penuh dari database development dan staging.
- **Prinsip Non-Destruktif:**
  - Mekanisme pengujian tidak melakukan `DROP DATABASE` atau `DROP SCHEMA public CASCADE`.
  - Pembersihan fixture antar-test menggunakan `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` terurut pada tabel data operasional, mempertahankan skema tabel, fungsi trigger, dan migration history.

---

## 2. Status Migrasi Database (19 File Migrasi)

Sebelum eksekusi test suite, integritas seluruh file migrasi SQL diverifikasi dan diaplikasikan ke database `urd_test`:

| No | File Migrasi | Deskripsi Fungsi | Status |
|:---|:---|:---|:---:|
| 01 | `001_core.sql` | Enum peran, tabel users, clients, objects, orders, inspections, lhpp, audit_logs | APPLIED |
| 02 | `002_fix_bap_client_signature.sql` | Penyesuaian kolom tanda tangan klien pada BAP | APPLIED |
| 03 | `003_notifications.sql` | Tabel notifikasi in-app untuk penugasan dan revisi | APPLIED |
| 04 | `004_fix_client_documents.sql` | Manajemen berkas dokumen legalitas klien | APPLIED |
| 05 | `005_company_settings.sql` | Konfigurasi profil PT Upaya Riksa Daya dan penomoran dokumen | APPLIED |
| 06 | `006_offline_queue.sql` | Pelacakan draf dan antrean offline per perangkat | APPLIED |
| 07 | `007_missing_indexes.sql` | Optimasi indeks query pencarian dan work queue | APPLIED |
| 08 | `008_client_feedback.sql` | Evaluasi kepuasan layanan pasca-distribusi | APPLIED |
| 09 | `009_issue_reports.sql` | Pelaporan kendala teknis dan operasional lapangan | APPLIED |
| 10 | `010_document_ownership_integrity.sql` | Relasi kepemilikan dokumen K3 terhadap objek dan order | APPLIED |
| 11 | `011_business_workflow_v2.sql` | Tabel document_distributions, riwayat revisi, unit status gate | APPLIED |
| 12 | `012_client_renewal_reminders.sql` | Tabel renewal_followups dan trigger masa berlaku | APPLIED |
| 13 | `013_lhpp_f4_five_sections.sql` | Template LHPP 5 bab standar F4 dan suplemen SKP PJK3 | APPLIED |
| 14 | `014_object_categories_seed.sql` | Master 8 kategori K3 (PAA, PUBT, PTP, ELE, dsb) | APPLIED |
| 15 | `015_portal_tokens.sql` | Token akses portal klien terenkripsi | APPLIED |
| 16 | `016_bap_inspections.sql` | Relasi inspeksi lapangan terhadap BAP | APPLIED |
| 17 | `017_fix_lhpp_order_object_id.sql` | Foreign key integritas LHPP ke unit objek spesifik | APPLIED |
| 18 | `018_fix_draft_inspector_sig.sql` | Penanganan tanda tangan draf Ahli K3 | APPLIED |
| 19 | `019_hashed_portal_tokens.sql` | Hashing SHA-256 untuk keamanan portal token | APPLIED |

---

## 3. Hasil Eksekusi Test Suite Backend

Perintah: `npm --prefix backend test`  
Hasil Uji: **8 file test, 102 assertions — 100% LULUS (0 failed, 0 skipped, 0 blocked)**

| Test Suite File | Uji yang Dijalankan | Hasil | Durasi |
|:---|:---|:---:|:---:|
| `src/tests/config-env.test.js` | Validasi env variables, fallback JWT secret, database connection parameters | **2 passed** | 232 ms |
| `src/tests/document-ownership.test.js` | Validasi kepemilikan dokumen LHPP, BAP, BAST terhadap order_objects dan klien | **4 passed** | 19 ms |
| `src/tests/lhpp-pdf-generator.test.js` | Render PDF 5 bab standar F4 (Bab I s/d V), suplemen SKP PJK3, lampiran foto & diagram | **8 passed** | 1.03 s |
| `src/tests/frontend-api-contract.test.js` | Pencocokan seluruh pemanggilan API frontend dengan endpoint backend aktif | **1 passed** | 1.86 s |
| `src/tests/search-and-workqueue.test.js` | Index search multi-parameter, paginasi workqueue, filter status unit operasional | **8 passed** | 295 ms |
| `src/tests/role-permission-negative.test.js` | 12 skenario pengujian negatif permission lintas peran (Least Privilege) | **15 passed** | 1.89 s |
| `src/tests/uat-e2e.test.js` | Simulasi end-to-end 3 unit multi-bidang (PAA, PUBT, PTP) pada PO-URD-UAT-001 | **29 passed** | 1.74 s |
| `src/tests/api.test.js` | Sesi autentikasi, lifecycle PO komplit, gate kelulusan multi-unit, penerbitan Suket | **35 passed** | 4.27 s |
| **TOTAL KESELURUHAN** | **8 Test Suites** | **102 PASSED** | **7.10 s** |

---

## 4. Investigasi Diskrepansi Laporan Sebelumnya

Audit independen sebelumnya melaporkan:
- Laporan lama menyebut 58 test backend passed.
- Namun penelusuran actual code sebelum perbaikan menunjukkan hanya 14 unit test non-database yang berjalan, sedangkan test suite database belum terhubung karena port 5433 belum distart.
- Setelah inisialisasi PostgreSQL lokal pada port 5433, penyempurnaan `api.test.js` (dari destruktif menjadi non-destruktif), pembuatan suite `role-permission-negative.test.js` (15 test), dan penambahan `uat-e2e.test.js` (29 test):
  - Angka aktual pengujian yang berjalan dan lulus saat ini adalah **102 test backend**.
  - Tidak ada test yang di-skip atau di-mock palsu.
  - Seluruh query membaca dan menulis langsung ke database PostgreSQL `urd_test`.

---

## 5. Kesimpulan Kesiapan Database

1. **Integritas Skema:** Skema database PostgreSQL konsisten dengan arsitektur multi-unit PO URD.
2. **Koneksi Transaksional:** Pool koneksi backend mengelola transaksi `BEGIN ... COMMIT / ROLLBACK` dengan aman saat finalisasi dokumen, update status unit, dan pembagian hak akses.
3. **Audit Trail Append-Only:** Tabel `audit_logs` secara konsisten mencatat setiap aksi administratif, finalisasi dokumen, dan perubahan status tanpa adanya celah update atau delete historis.

