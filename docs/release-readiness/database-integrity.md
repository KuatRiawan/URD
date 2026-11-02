# Audit Integritas Database

## Bukti positif

- Query aplikasi menggunakan parameter PostgreSQL `$1`, `$2`, dan seterusnya.
- Foreign key tersedia untuk order-unit, Suket-unit, follow-up, dokumen, audit, dan portal token.
- `renewal_followups` pada migration 006 mendukung `suket_id` nullable dan `object_id` nullable untuk unit tanpa Suket.
- `reminder_dispatches` dan `client_reminder_log` memiliki unique key untuk idempotensi.
- `audit_logs` dilindungi append-only oleh migration dan diuji pada API suite.
- Token portal baru disimpan sebagai SHA-256 hash pada migration 019; plaintext hanya dikembalikan saat pembuatan.

## Temuan dan tindakan

| ID | Status | Temuan |
|---|---|---|
| DB-01 | FIXED | Reminder scheduler tidak membaca follow-up berbasis `object_id`; query dashboard dan client reminder kini membaca `suket_id` atau `object_id` |
| DB-02 | OPEN | Belum ada retention/legal hold dan restore test |
| DB-03 | OPEN | Mapping akun hasil migration legacy harus dilakukan manual, tanpa UPDATE produksi otomatis |

Tidak ditemukan bukti query menggunakan kolom yang tidak tersedia setelah pemeriksaan migration 005-019.
