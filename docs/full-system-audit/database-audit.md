# Audit PostgreSQL

- `urd_dev` dibaca tanpa mutasi: 39 tabel publik, 89 FK, dan 97 primary/unique/check constraints.
- Migrasi repository bernomor 001 sampai 014.
- `urd_test` ternyata berisi data. Karena migrasi test menjalankan reset schema, suite dijalankan pada DB sementara baru dan DB sementara dibuang sesudahnya.
- Tidak ada reset, migrasi, atau write ke `urd_dev` maupun `urd_test` pada sesi ini.
- API suite menguji migrasi dari nol dan workflow database pada DB sementara.

Audit semua nullability, index query, orphan historis, backup/restore, dan diff schema produksi masih perlu dilakukan.
