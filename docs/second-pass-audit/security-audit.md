# Audit keamanan

| ID | Severity | Bukti | Perbaikan/status |
|---|---|---|---|
| SEC-01 | P1 | Query aktivitas Inspector dibatasi `user_id` | Sudah diperbaiki sebelumnya, API regression lulus. |
| SEC-02 | P1 | Submit idempotent cek owner sebelum respons | Test antar Inspector menghasilkan 403. |
| SEC-03B | P1 | LHPP/BAP masih membandingkan identitas nonunik | Dihapus; 4 unit tests menguji assignment aktif dan penolakan tanpa assignment. |
| SEC-05 | P1 | Marketing dapat upload foto LHPP; Inspector dapat finalisasi LHPP/BAP | Upload teknis dibatasi; finalisasi Marketing/Admin Sistem; API test 403. |
| SEC-06 | P1 | Endpoint review LHPP legacy menjalankan approve/return | Route lama dinonaktifkan; regression test 410. |
| DOC-01 | P1 | PDF unduhan tidak selalu PDF yang di-hash | Serve file final tersimpan; hash LHPP/BAP sama dengan DB. |
| DOC-02 | P1 | QR BAP dibuat tetapi tidak dirender | QR dicetak di kop; PDF test memeriksa image object. |

JWT/bcrypt, read-only Pimpinan, parameterized SQL dan trigger audit log diperiksa sebagian. Penetration test, secret production, seluruh IDOR/file path/MIME, CORS dan revisi Super Admin belum dicakup. Ini bukan sertifikasi keamanan.
