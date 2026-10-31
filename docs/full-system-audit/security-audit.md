# Audit keamanan

| ID | Severity | Bukti | Perbaikan |
|---|---|---|---|
| SEC-01 | P1 | Summary Inspector membaca delapan audit event global. | Query memakai `WHERE a.user_id = $1`; test regresi memeriksa parameter user. |
| SEC-02 | P1 | Submit status terkirim mengembalikan inspection/LHPP/BAP sebelum owner check. | Ownership/assignment divalidasi sebelum idempotent response; test antar-Inspector ditambahkan. |
| SEC-03 | P1 | Kemiripan identitas nonunik memberi akses serta mengubah `inspector_id`. | Fallback dihapus; assignment aktif eksplisit tetap diterima. |
| SEC-04 | P1 | Secret JWT statis dipakai bila staging tidak mengatur secret. | Development memakai secret acak, test secret khusus test, environment lain fail-fast. |

Kontrol lain yang diperiksa: bcrypt, JWT verification, akun aktif pada request, read-only Pimpinan, parameterized query, trigger append-only audit log. Penetration test XSS/CSRF/CORS, rate limit, seluruh file path, secret produksi, dan revisi Super Admin belum dilakukan. Ini bukan security certification.
