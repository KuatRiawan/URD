# Aturan Siklus Hidup Dokumen

## Rekomendasi owner

Dokumen yang sudah `TERBIT` tidak boleh ditimpa. Koreksi harus membuat versi baru atau dokumen pengganti yang memiliki:

- `supersedes_document_id` atau relasi setara;
- nomor versi dan nomor dokumen baru bila diwajibkan SOP;
- alasan koreksi wajib;
- actor dan waktu koreksi;
- status dokumen lama `DIBATALKAN` atau `DIGANTIKAN`;
- audit event;
- verification code baru;
- hubungan distribusi lama dan distribusi ulang.

## Siklus yang disarankan

`DRAF -> SIAP_PREVIEW -> FINAL/TERBIT -> DIDISTRIBUSIKAN`

Cabang koreksi:

`TERBIT -> PERLU_KOREKSI -> DIBATALKAN/DIGANTIKAN`

Dokumen lama tetap dapat dibaca untuk histori, tetapi halaman verifikasi publik harus menampilkan bahwa dokumen tersebut digantikan atau dibatalkan dan menunjuk versi terbaru bila diizinkan.

## Kondisi aktual

LHPP dan BAP sudah memiliki `version`, tabel revision, snapshot, dan verification code. Distribusi memvalidasi status dan kecocokan dokumen. `order_revisions` juga tersedia untuk snapshot PO. Namun belum ada lifecycle generik untuk cancel/reissue, relasi versi dokumen pengganti, atau aturan QR untuk dokumen lama.

## Alternatif

- **Revisi pada record yang sama:** murah, tetapi merusak histori dan tidak disarankan untuk dokumen terbit.
- **Dokumen baru dengan relasi pengganti:** paling kuat untuk audit dan QR, tetapi membutuhkan migration/API/UI.
- **Koreksi manual di luar sistem:** cepat, tetapi menghilangkan traceability dan tidak boleh menjadi solusi permanen.

## Dampak implementasi setelah disetujui

- **Database:** migration additive untuk lifecycle, parent/superseded relation, reason, actor, timestamp, dan status; backfill dokumen lama sebagai versi awal.
- **API:** endpoint request-correction, cancel, reissue, verify; larang update field isi pada dokumen terbit.
- **Permission:** Inspector mengoreksi isi teknis melalui alur resmi; Admin Kantor mengelola QC/administrasi; Pimpinan hanya melihat; Super Admin tidak boleh bypass tanpa audit.
- **Frontend:** tampilkan banner versi, alasan koreksi, status QR, dan histori distribusi.
- **Dokumen/distribusi:** distribusi versi lama tetap tercatat; distribusi ulang wajib menunjuk versi baru.
- **Test:** immutable published document, QR revoked/superseded, duplicate reissue, permission, dan audit completeness.

Ini adalah **RECOMMENDED / PENDING OWNER DECISION**, bukan aturan yang boleh langsung dipaksakan.
