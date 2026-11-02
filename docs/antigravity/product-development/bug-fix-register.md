# Bug Fix Register
**PT Upaya Riksa Daya (URD) — Register Perbaikan Bug & Defect**

---

## Daftar Bug & Resolusi Teknis

| ID Defect | Tingkat Keparahan | Komponen | Deskripsi Masalah | Akar Penyebab (Root Cause) | Solusi & Tindakan Teknis | Status |
|---|---|---|---|---|---|---|
| **BUG-001** | **P0 — Critical** | Backend Test Harness | Uji automated backend mengalami `deadlock detected` pada PostgreSQL saat menjalankan `api.test.js` dan `uat-e2e.test.js`. | Vitest secara default mengeksekusi berkas uji secara paralel di beberapa worker threads, sehingga transaksi pembersihan tabel saling mengunci baris data di database pengujian bersama. | Memperbarui skrip `test` di `backend/package.json` menjadi `vitest run --fileParallelism=false` agar pengujian berjalan sekuensial dan atomik. | **RESOLVED** (103/103 Pass) |
| **BUG-002** | **P0 — Critical** | Field Inspection Checklist | Adanya fungsi `handleAutoFillAllStandard` yang menandai seluruh butir checklist menjadi "SESUAI" secara otomatis. | Peninggalan fungsi prototipe yang melanggar aturan bisnis K3 murni: *"Jangan pernah mengisi checklist menjadi SESUAI secara otomatis"*. | Menghapus permanen `handleAutoFillAllStandard` dari `useInspectionDetailForm.js` dan `InspectionDetailModal.jsx`. Ahli K3 wajib memeriksa tiap butir empiris. | **RESOLVED** |
| **BUG-003** | **P1 — High** | Verification Nameplate Gap | Tidak tersedianya antarmuka terstruktur di awal tahapan checklist untuk mencocokkan nomor seri dan spesifikasi fisik nameplate unit alat di lapangan. | Checklist langsung dimulai dari pemeriksaan visual komponen tanpa verifikasi awal identitas unit. | Mengintegrasikan kartu verifikasi nameplate fisik unit di awal Step 1 checklist dengan unggah foto kamera langsung dan integrasi antrean offline. | **RESOLVED** |
| **BUG-004** | **P1 — High** | Work Queue Completeness | Antrean kerja dasbor Admin Kantor tidak mencakup tahapan pemrosesan BAP, pencatatan nomor Suket Disnaker, dan distribusi dokumen. | Kueri SQL di `dashboard-files.js` hanya memantau penugasan, penjadwalan, dan review LHPP. | Menambahkan kueri dan generator item aksi untuk `BAP_PROCESSING`, `SUKET_RECORDING`, `DOCUMENT_DISTRIBUTION`, dan `OPERATIONAL_ISSUE`. | **RESOLVED** |
| **BUG-005** | **P2 — Medium** | LHPP Test Category Scope | Berkas uji `lhpp-pdf-generator.test.js` tidak menguji kategori `LE` (Elevator dan Eskalator). | Kategori `LE` terlewatkan dalam pemetaan loop pengujian bidang K3. | Menambahkan kategori `LE` pada uji skema data teknis dan menambahkan pengujian rendering multi-halaman F4 tanpa galat. | **RESOLVED** |
| **BUG-006** | **P2 — Medium** | PO Unit Form Reset | Pengisian multi-unit pada pembuatan PO mereset seluruh kolom termasuk lokasi pabrik (*installLocation*), memperlambat entri Marketing. | Fungsi `handleAddInlineUnit` mereset `installLocation` menjadi string kosong. | Mempertahankan `installLocation` sebelumnya pada state `newUnitRow` dan menambahkan tombol aksi *Duplikasi* (*Copy*). | **RESOLVED** |

---

## Defect Terbuka & Ketergantungan Eksternal

| ID | Kategori | Keterangan | Pemblokir | Tindakan yang Dibutuhkan |
|---|---|---|---|---|
| **ENV-001** | Infrastruktur | Deployment ke server staging remote belum dapat dilakukan. | Ketiadaan VPS Ubuntu dan DNS domain aktif dari pihak manajemen URD. | Menunggu penyediaan kredensial VPS/SSH dan konfigurasi DNS staging dari owner. |

