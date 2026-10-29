# Audit Database

## Skema dan integritas yang diperiksa
Migrasi bernomor mengelola PostgreSQL. `refresh_sessions.user_id` memiliki foreign key dengan `ON DELETE CASCADE`; indeks sesi pengguna dan keluarga tersedia. `audit_logs` memiliki trigger yang menolak `UPDATE` dan `DELETE`, tetapi superuser database tetap dapat mengubah atau menonaktifkan kontrol tersebut.

`file_attachments.owner_id` bersifat polimorfik dan tidak memiliki foreign key ke tabel pemilik. Constraint `owner_type` membatasi nilai yang diterima; migrasi 006 dan 010 mencakup `PO_ATTACHMENT`, `BAP_*`, dan `LHPP_PHOTO`.

## Temuan yang diperbaiki
Endpoint unggah lampiran PO sebelumnya menulis `owner_type = 'ORDER_PO'`, nilai yang ditolak oleh constraint yang berlaku. Kode sekarang memakai `PO_ATTACHMENT`, nilai yang diizinkan migrasi. Tes integrasi untuk unggah ini telah ditambahkan, tetapi belum dijalankan karena suite backend mereset schema database.

Rotasi refresh token kini mengunci baris sesi di dalam transaksi agar dua request tidak dapat sama-sama menerbitkan token pengganti dari sesi yang sama.

Endpoint konflik jadwal dan pengelolaan dokumen kini memeriksa identitas Ahli K3 terhadap inspector atau resource yang diminta. Ini adalah pemeriksaan di lapisan aplikasi; tidak ada perubahan skema atau kebijakan database baru.

## Batasan dan validasi
Tidak ada migrasi skema baru yang diperlukan. Perbaikan akses lampiran membatasi pembacaan berdasarkan relasi domain di aplikasi, bukan menambahkan foreign key untuk model pemilik polimorfik. Database tidak di-reset atau diubah dalam validasi ini. Backend lint lulus; test backend dilewati karena perintahnya menjalankan `DROP SCHEMA public CASCADE`.
