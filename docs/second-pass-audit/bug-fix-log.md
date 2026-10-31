# Log temuan dan remediasi putaran kedua

| ID | Severity | Root cause/bukti | Perubahan | Pengujian |
|---|---|---|---|---|
| SEC-03B | P1 | Helper akses LHPP/BAP memakai kemiripan identitas | Owner/assignment aktif saja | 4 unit tests + API suite |
| BUS-02 | P1 | Inspector dapat finalize; Marketing dapat mengubah foto/signature teknis | Finalize Marketing/Admin Sistem; edit bukti dibatasi | Regression API 403 |
| BUS-03 | P1 | `/lhpp/:id/review` masih mengubah status approval | Route legacy 410; status submit baru tanpa approval | Regression API 410/status |
| DATA-01 | P1 | Check constraint masih memuat status approval lama | Migration 015 map data aktif, simpan histori | Migration fresh + suite disposable |
| DOC-01 | P1 | Unduhan final di-regenerate setelah hashing | Sajikan file final tersimpan | SHA-256 LHPP/BAP cocok |
| DOC-02 | P1 | QR BAP dibuat tetapi tak dirender | QR ditambahkan ke kop | PDF image check + render |
| PERF-01 | P2 | Semua route diimpor statis | Route-level lazy loading | Main chunk 278.18 kB, build tanpa warning |
| QUAL-01 | P2 | Frontend lint gagal | Belum dibereskan seluruhnya | 30 error, 2 warning masih ada |

Severity menilai dampak bug yang ditemukan; bukan klaim seluruh bug sudah diketahui.
