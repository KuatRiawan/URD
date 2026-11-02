# Business Decision Register URD

## Status key

- **CONFIRMED**: keputusan bisnis eksplisit dari arahan terbaru.
- **IMPLEMENTED**: sudah tercermin pada kode atau migrasi.
- **VERIFIED**: dibuktikan oleh test atau pemeriksaan repository.
- **RECOMMENDED**: rekomendasi analisis, belum menjadi kebijakan.
- **PENDING OWNER DECISION**: tidak boleh diubah sepihak sebelum pemilik proses menyetujui.

## Register

| ID | Keputusan | Status | Bukti kondisi sekarang | Keputusan operasional | Dampak utama |
|---|---|---|---|---|---|
| BD-01 | Marketing dan Admin Kantor dipisahkan | CONFIRMED, IMPLEMENTED, VERIFIED WITH CONDITION | Middleware dan menu tidak lagi alias silang; route komersial Marketing dan route operasional Admin Kantor dibedakan | Marketing mengurus relasi komersial; Admin Kantor mengurus operasi, QC, dokumen, distribusi, arsip | Permission, menu, endpoint, dashboard, notifikasi |
| BD-02 | Inspector dan Ahli K3 | CONFIRMED, RECOMMENDED | `inspectors` dan `inspector_competencies` sudah terpisah dari akun, tetapi role masih alias | Role akun menunjukkan fungsi kerja; kompetensi, bidang, SKP, masa berlaku, dan penugasan menjadi atribut terverifikasi | Assignment, validasi kompetensi, UI profil, scheduler |
| BD-03 | Manager/Pimpinan monitoring read-only | CONFIRMED, IMPLEMENTED, VERIFIED | Middleware memblokir mutasi; migration 015 menghapus approval teknis LHPP | Monitoring, drill-down, kendala, jadwal, kinerja, status dokumen, reminder; bukan verifikasi checklist | Pertahankan read-only; tambahkan observability, bukan approval teknis |
| BD-04 | Renewal dan relasi Suket | RECOMMENDED, PENDING OWNER DECISION | Renewal sudah menyimpan `renewal_of_suket` dan idempotensi aktif | Relasi per unit ke Suket sumber; satu PO renewal boleh memuat subset unit; pembatalan tidak menghapus histori | Model PO-item, status renewal, reminder, histori |
| BD-05 | Independensi unit dalam PO | CONFIRMED, IMPLEMENTED, VERIFIED | `order_objects.unit_status` dan agregasi workflow sudah tersedia | Setiap unit memiliki status sendiri; PO adalah ringkasan progres, bukan pengunci semua unit | Dashboard, queue, dokumen, billing policy |
| BD-06 | Revisi dokumen terbit | RECOMMENDED, PENDING OWNER DECISION | LHPP/BAP memiliki revision table/version dan verification code, tetapi belum ada lifecycle pembatalan/reissue yang lengkap | Dokumen terbit immutable; koreksi membuat revisi/penerbitan baru dengan alasan dan relasi | Skema lifecycle, API, QR verification, distribusi, audit |
| BD-07 | Retensi data | RECOMMENDED, PENDING OWNER DECISION | Audit append-only; data operasional dan file belum memiliki policy retention terkonfigurasi | Jangan hapus berdasarkan tebakan legal; tetapkan owner, klasifikasi, legal hold, backup, dan jadwal review | Storage, scheduler retention, backup, audit, portal |

## Keputusan yang sudah dapat dipersiapkan

BD-01, BD-02, BD-03, dan BD-05 memiliki arah bisnis yang jelas. Implementasinya tetap harus dilakukan melalui matriks permission, migrasi kompatibilitas, dan uji regresi, bukan dengan mengganti alias secara langsung.

## Keputusan yang belum boleh diubah sepihak

BD-04, BD-06, dan BD-07 memerlukan persetujuan owner karena memengaruhi kontrak bisnis, legal traceability, atau retensi bukti. Rekomendasi teknisnya dicatat pada dokumen masing-masing.

## Temuan lintas sumber

- PRD/komentar migrasi awal masih menyebut approval Pimpinan, tetapi migration 015 dan arahan terbaru menghapus approval teknis tersebut. Arahan terbaru menjadi sumber kebenaran.
- Migration 005 mendefinisikan tahap internal H90/H60/H30/H14/H0, sedangkan `client-reminders.js` mengirim tahap klien H7/H14/H30. Ini konflik kebijakan yang harus diputuskan sebelum jadwal reminder dianggap resmi.
- Tidak ada berkas PRD terpisah yang ditemukan pada repository; keputusan eksplisit terbaru dan migration menjadi bukti yang tersedia, bukan pengganti SOP perusahaan.
