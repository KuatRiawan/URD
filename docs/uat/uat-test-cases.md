# UAT Test Cases

| ID | Skenario | Role | Expected result | Status | Bukti |
|---|---|---|---|---|---|
| UAT-MKT-01 | Login dan akses dashboard | Marketing | Login berhasil dan dashboard terbuka | PASS | Backend `api.test.js`, frontend routing |
| UAT-MKT-02 | Kelola klien, PIC, unit, PO | Marketing | Data tersimpan dan dapat dibuka kembali | PASS | Route client/order dan backend regression |
| UAT-MKT-03 | Melihat progres unit dan follow-up | Marketing | Progres dan reminder unit dapat dibaca sesuai akses | CODE REVIEWED | Route reminder, work queue |
| UAT-MKT-04 | Marketing menjalankan QC/LHPP/BAP/distribusi | Marketing | Ditolak | CODE REVIEWED | Middleware dan route authorization |
| UAT-ASSIGN-01 | Kompetensi kategori sesuai dan masih berlaku | Admin Kantor | Assignment berhasil | PASS | `api.test.js` |
| UAT-ASSIGN-02 | Kompetensi salah kategori/kedaluwarsa/belum berlaku | Admin Kantor | Assignment ditolak | PASS | `api.test.js` |
| UAT-ASSIGN-03 | Inspector tidak aktif | Admin Kantor | Assignment ditolak | CODE REVIEWED | Query assignment dan active-user guard |
| UAT-INS-01 | Inspector membuka assignment sendiri | Inspector | Hanya assignment yang berhak terlihat | PASS | Ownership test dan `api.test.js` |
| UAT-INS-02 | Isi checklist, foto, pengukuran, temuan, tanda tangan | Inspector | Draft dan submit tersimpan | PASS | `api.test.js`, PDF tests |
| UAT-INS-03 | Auto-fill checklist | Inspector | Tidak tersedia; hasil berasal dari input aktual | PASS | `StepChecklist.jsx`, regression tests |
| UAT-INS-04 | Simpan offline dan sinkronisasi | Inspector | Draft/foto tersimpan lalu dikirim ulang saat online | CODE REVIEWED | `offline-sync.js`; full browser IndexedDB belum diuji |
| UAT-ADM-01 | Admin melihat hasil dan memproses QC/dokumen | Admin Kantor | Endpoint dan menu operasional tersedia | PASS | Backend API suite dan route review |
| UAT-ADM-02 | Unit A lanjut saat B revisi dan C pending | Admin Kantor | Status unit tidak saling mengunci | PASS WITH LIMITATION | Multi-unit test; kombinasi paralel penuh belum eksplisit |
| UAT-ADM-03 | Cancel/correction/reissue dokumen terbit | Admin Kantor | Workflow immutable dan penerbitan ulang tersedia | BLOCKED | Fitur belum diputuskan/diimplementasikan |
| UAT-PIM-01 | Monitoring PO, unit, jadwal, kendala, dokumen, reminder | Pimpinan | Data terbaca tanpa aksi teknis | PASS | Work queue/API tests |
| UAT-PIM-02 | Mutasi API langsung | Pimpinan | Semua POST/PUT/PATCH/DELETE ditolak | PASS | Middleware read-only dan API tests |
| UAT-ADM-SYS-01 | Kelola akun, role, audit log | Admin Sistem | Akses administratif tersedia | PASS | `api.test.js` |
| UAT-REN-01 | Follow-up berbasis Suket dan unit | Admin Kantor | Kedua relasi dibaca tanpa error schema | PASS | Schema query dan scheduler review |
| UAT-REN-02 | Duplikasi renewal aktif | Admin Kantor | Order aktif yang sama digunakan kembali | PASS | `api.test.js` |
| UAT-UI-01 | Desktop/tablet/mobile task completion | Semua role | Layout dan alur dapat diselesaikan | NOT TESTED | Tidak ada browser/device harness |
| UAT-BKP-01 | Backup dan restore database test | Admin Sistem | Data dapat dipulihkan lengkap | BLOCKED | Tidak ada tooling backup/restore |
