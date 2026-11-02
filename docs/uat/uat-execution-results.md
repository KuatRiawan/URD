# Hasil Eksekusi UAT

## Hasil otomatis

| Command | Actual result | Status |
|---|---|---|
| `npm --prefix backend test` | 6 file, 58 test lulus | PASS |
| `npm --prefix backend run lint` | ESLint lulus | PASS |
| `npm --prefix frontend test` | 3 file, 7 test lulus | PASS |
| `npm --prefix frontend run lint` | ESLint lulus | PASS |
| `npm --prefix frontend run build` | Vite production build lulus | PASS |
| `git diff --check` | Tidak ada whitespace error | PASS |
| `npm --prefix backend run db:status` | PostgreSQL lokal aktif, PID 3073, port 5433 | PASS |

## Bukti schema

Query read-only pada database test menunjukkan:

- 19 migration telah diterapkan.
- Tabel `users`, `clients`, `orders`, `order_objects`, `renewal_followups`, `suket_documents`, `client_reminder_log`, dan `audit_logs` tersedia.
- `renewal_followups` memiliki `suket_id` dan `object_id`.
- Migration terakhir: 017, 018, dan 019.

## Ringkasan aktual

Alur API autentikasi, RBAC, ownership, assignment kompetensi, inspeksi, dokumen, multi-unit, reminder idempotensi, portal token, search, dan work queue terbukti melalui test. UAT interaktif lintas layar belum dapat dinyatakan PASS karena tidak ada browser automation atau perangkat nyata.
