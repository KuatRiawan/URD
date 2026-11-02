# Verifikasi Implementasi

| Area | Status | Bukti |
|---|---|---|
| BD-01 Marketing/Admin Kantor | VERIFIED WITH CONDITION | Middleware terpisah di `backend/src/middleware/authorize.js`; route commercial dan reminder kini mengizinkan Marketing; route dokumen tetap membatasi Admin Kantor/Admin Sistem |
| BD-02 Inspector/kompetensi | VERIFIED | `backend/src/modules/orders/routes.js` memeriksa kategori, `valid_from`, `valid_until`, dan akun aktif saat assignment |
| BD-03 Pimpinan read-only | VERIFIED | `authorize.js` menolak POST/PUT/PATCH/DELETE untuk PIMPINAN/MANAGER; API test mencakup mutasi LHPP/BAP |
| BD-04 renewal | PARTIALLY VERIFIED | Relasi `orders.renewal_of_suket`, `order_objects`, dan idempotensi tersedia; kebijakan final renewal masih pending owner |
| BD-05 independensi unit | VERIFIED | `computePoUnitProgress` dan test multi-unit mengagregasi status unit tanpa menimpa unit lain |
| BD-06 lifecycle dokumen | NOT VERIFIED | Version/revision dan verification code ada, tetapi cancel/reissue generik belum tersedia |
| BD-07 retensi | NOT VERIFIED | Audit append-only tersedia; kebijakan purge/legal hold/restore belum dikonfigurasi |

## Catatan

Dokumentasi sebelumnya menyatakan `renewal_followups` hanya memiliki `suket_id`. Migration 006 juga menambahkan `object_id` nullable. Dokumentasi dan query scheduler telah diselaraskan dengan schema aktual.
