# Rencana UAT URD

## Tujuan

Membuktikan bahwa alur kerja utama PT Upaya Riksa Daya dapat dijalankan oleh Marketing, Inspector, Admin Kantor, Pimpinan, dan Admin Sistem tanpa mengubah data produksi atau mengaktifkan reminder nyata.

## Environment dan batasan

- Environment: lokal development/test.
- Database test: `TEST_DATABASE_URL`, PostgreSQL lokal port 5433.
- Suite backend mereset schema database test sebelum seed.
- Data: akun dan data simulasi dari seed, bukan data produksi.
- Pengiriman Email/WhatsApp klien: tidak diaktifkan ke penerima nyata.
- Browser automation/perangkat nyata: tidak tersedia di repository.
- Backup/restore: tidak ada mekanisme atau script yang tersedia di repository.

## Skenario

Satu klien memiliki satu PO dengan tiga unit: Unit A selesai, Unit B perlu revisi, dan Unit C belum dijadwalkan. Kategori unit harus berasal dari master kategori dan Inspector harus memiliki kompetensi yang sesuai.

## Status

- PASS: perilaku dieksekusi dan expected result terbukti.
- CODE REVIEWED: pemeriksaan kode atau schema, belum uji perilaku penuh.
- BLOCKED: membutuhkan environment, keputusan owner, atau fitur yang belum ada.
- NOT TESTED: belum tersedia bukti yang memadai.
