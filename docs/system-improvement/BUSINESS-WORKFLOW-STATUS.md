# PT Upaya Riksa Daya (URD) — Business Workflow Status & Verification Evidence

Dokumen ini mendokumentasikan status implementasi dan bukti verifikasi (*verification evidence*) dari seluruh alur kerja operasional bisnis PT Upaya Riksa Daya.

---

## 1. Matriks Status Alur Kerja Operasional

| No | Alur Kerja Bisnis | Aktor Utama | Status | Bukti Pengujian Otomatis |
| :---: | :--- | :--- | :---: | :--- |
| **WF-01** | **Registrasi Klien & Multi-PIC** | Marketing, Admin | **PASS** | `api.test.js` (Bagian 3), `uat-e2e.test.js` (Tahap 1), `marketing-workflow.test.js` |
| **WF-02** | **Pembuatan PO Multi-Unit** | Marketing, Admin | **PASS** | `api.test.js` (Bagian 7 Langkah 1), `marketing-order-multiunit.test.js`, `three-level-equipment-and-checklist.test.js` (Tes 6) |
| **WF-03** | **Penjadwalan & Cek Lisensi SKP Ahli K3** | Admin Kantor | **PASS** | `api.test.js` (Bagian 4), `uat-e2e.test.js` (Tahap 2.1 - 2.4), `super-admin-v2-workspace.test.js` (Bagian 2) |
| **WF-04** | **Deteksi Konflik Jadwal Ahli K3** | Admin Kantor | **PASS** | `api.test.js` (Bagian 4 M2-04), `uat-e2e.test.js` (Tahap 2.3) |
| **WF-05** | **Penerbitan Surat Tugas PDF** | Admin Kantor, Inspector | **PASS** | `api.test.js` (Bagian 4), `reality-audit-features.test.js` (Bagian 5), `uat-e2e.test.js` (Tahap 3.1) |
| **WF-06** | **Riksa Uji Lapangan & Ceklis Dinamis** | Inspector / Ahli K3 | **PASS** | `api.test.js` (Bagian 5), `uat-e2e.test.js` (Tahap 3.2 - 3.5), `three-level-equipment-and-checklist.test.js` (Tes 5) |
| **WF-07** | **Penyimpanan Luring (Offline-First IDB)**| Inspector / Ahli K3 | **PASS** | `frontend/src/lib/utils/offline-sync.test.js` (5 tes), `InspectionsPage` cache sync |
| **WF-08** | **Unggah Foto & Tanda Tangan Digital** | Inspector / Ahli K3 | **PASS** | `api.test.js` (Bagian 5), `security-hardening.test.js` (Bagian 6 file upload filter), `uat-e2e.test.js` (Tahap 3.4) |
| **WF-09** | **Pelaporan Kendala Lapangan (Issues)** | Inspector, Marketing | **PASS** | `api.test.js` (Bagian 4 kendala & tindak lanjut), `uat-e2e.test.js` |
| **WF-10** | **Quality Control & Revisi Terarah** | Admin Kantor, Inspector | **PASS** | `admin-kantor-v2-workflow.test.js` (Tes 3 & 4), `uat-e2e.test.js` (Tahap 4.3 - 4.4) |
| **WF-11** | **Pratinjau PDF & DOCX LHPP Resmi** | Admin Kantor | **PASS** | `lhpp-pdf-generator.test.js` (13 tes), `admin-kantor-v2-workflow.test.js` (Tes 6) |
| **WF-12** | **Finalisasi LHPP (Hash SHA-256)** | Admin Kantor | **PASS** | `dynamic-lhpp-engine.test.js` (Tes 7), `admin-kantor-v2-workflow.test.js` (Tes 7) |
| **WF-13** | **Otomasi Draf BAP Pasca-LHPP Final** | Admin Kantor | **PASS** | `admin-kantor-v2-workflow.test.js` (Tes 7), `dynamic-lhpp-engine.test.js` (Tes 7) |
| **WF-14** | **Urutan Rilis Dokumen (LHPP -> BAP)** | Admin Kantor | **PASS** | `admin-kantor-v2-workflow.test.js` (Tes 5: BAP ditolak jika LHPP belum final), `uat-e2e.test.js` |
| **WF-15** | **Finalisasi BAP & Pratinjau PDF/DOCX** | Admin Kantor | **PASS** | `admin-kantor-v2-workflow.test.js` (Tes 8), `reengineering-features.test.js` (Tes 1 DOCX buffer) |
| **WF-16** | **Registri Suket K3 & Scan Disnaker** | Admin Kantor | **PASS** | `admin-kantor-v2-workflow.test.js` (Tes 9), `uat-e2e.test.js` (Tahap 4.2) |
| **WF-17** | **Cetak Stiker QR Code Alat / Suket** | Admin Kantor | **PASS** | `admin-kantor-v2-workflow.test.js` (Tes 9), `uat-e2e.test.js` (Tahap 5.4), `api.test.js` (M1-11) |
| **WF-18** | **Verifikasi Publik Dokumen (No Login)**| Publik (Klien/Pemeriksa) | **PASS** | `security-hardening.test.js` (Bagian 5), `api.test.js` (Langkah 11) |
| **WF-19** | **Pembuatan Berkas BAST PDF** | Admin Kantor | **PASS** | `admin-kantor-v2-workflow.test.js` (Tes 10), `uat-e2e.test.js` (Tahap 5.3) |
| **WF-20** | **Pelacakan Distribusi Dokumen** | Admin Kantor | **PASS** | `admin-kantor-v2-workflow.test.js` (Tes 10), `uat-e2e.test.js` (Tahap 5.1 & 5.2) |
| **WF-21** | **Independensi Unit & PO Completion Gate**| Admin, Marketing | **PASS** | `api.test.js` (Langkah 8 & 9), `uat-e2e.test.js` (Tahap 4.5 & Tahap 6) |
| **WF-22** | **Pengingat Perpanjangan Suket Berkala** | Marketing, Sistem | **PASS** | `api.test.js` (Bagian 6 & Langkah 10), `marketing-order-multiunit.test.js` (Tes 6 & 7) |
| **WF-23** | **Pemantauan Eksekutif (Strict Read-Only)**| Pimpinan / Manager | **PASS** | `role-permission-negative.test.js` (Tes 1 - 8, 13), `uat-e2e.test.js` (Tahap 6), ADR 015 |
| **WF-24** | **Master Taksonomi 3-Level** | Super Admin | **PASS** | `three-level-equipment-and-checklist.test.js` (12 tes), `papa-equipment-taxonomy.test.js` (10 tes) |
| **WF-25** | **Checklist Builder (Copy-on-Write)** | Super Admin | **PASS** | `super-admin-v2-workspace.test.js` (Tes 3 & 8), `reality-audit-features.test.js` (Bagian 2) |
| **WF-26** | **LHPP Engine Builder (Copy-on-Write)** | Super Admin | **PASS** | `dynamic-lhpp-engine.test.js` (Tes 4 & 5) |
| **WF-27** | **Cadangan Database SQL & Checksum** | Super Admin | **PASS** | `super-admin-v2-workspace.test.js` (Tes 12), `reality-audit-features.test.js` (Bagian 4) |
| **WF-28** | **Jejak Audit Kekal Anti-Manipulasi** | Super Admin, Pimpinan | **PASS** | `api.test.js` (Bagian 6 penolakan UPDATE/DELETE pada `audit_logs`), `uat-e2e.test.js` (Tahap 7) |

---

## 2. Kesimpulan Integritas Alur Bisnis

Seluruh 28 alur kerja operasional telah diimplementasikan secara utuh dan terverifikasi secara nyata melalui kombinasi pengujian otomatis backend, pengujian komponen antarmuka React, dan pengujian alur kerja terpadu (*End-to-End Operational UAT*). Tidak ditemukan adanya fungsionalitas simulasi (*mock/stub*) pada alur kerja resmi PT Upaya Riksa Daya.

