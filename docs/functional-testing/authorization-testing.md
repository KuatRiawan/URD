# Pengujian Otorisasi

| Pemeriksaan | Status | Bukti |
|---|---|---|
| Middleware authenticate/authorize pada API modules | PASS (static review + suite) | Routes backend dan API tests |
| Inspector membuka route Admin `/app/users` | PASS | Browser langsung menampilkan Akses Ditolak; App test mencakup guard |
| Peran Marketing, Inspector, Pimpinan, Admin Sistem dapat login | PASS | Login browser dan backend auth tests |
| Pemisahan data berdasarkan ID / ownership | PASS pada test tersedia | `document-ownership.test.js` dan kasus ID API |
| Pimpinan tidak mengubah/finalisasi LHPP yang dibatasi | PASS | Integration test manager read-only |
| Setiap role × setiap endpoint HTTP verb | NOT RUN | Matriks lengkap belum dijalankan |
| Uji manipulasi seluruh ID dan token kedaluwarsa/replay | NOT RUN | Bukan cakupan menyeluruh |

Audit log append-only diuji melalui constraint/trigger database pada suite. Tidak ada data autentikasi dicantumkan di sini.
