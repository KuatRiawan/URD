# Dampak Integrasi Frontend, Backend dan Database

## Kendala

```text
Aksi Inspector/Marketing
  → IssuesPage / InspectionDetailModal
  → klien API
  → Express /api/v1/issues
  → authenticate + role/assignment checks + Joi
  → transaksi PostgreSQL (issue, event, audit, notification)
  → secure file storage + ownership link (untuk bukti)
  → response API
  → daftar/detail/timeline UI dan global search
```

Migrasi `016_operational_issues_and_order_revisions.sql` menambah tabel `operational_issues`, `operational_issue_events`, `operational_issue_evidence`, `order_revisions` dan jenis kepemilikan bukti. Event kendala dan audit disimpan, sedangkan notifikasi menggunakan tabel notifikasi yang sudah ada.

## Revisi PO dan jadwal

Service snapshot mengambil keadaan PO, klien dan unit saat versi dicatat. Perubahan jadwal memakai tabel histori yang sudah ada dan mengirim notifikasi kepada Inspector aktif.

## Error dan batasan

Validasi terjadi sebelum akses tulis; update multi-entitas menggunakan transaksi. Upload mengikuti batas dan penyimpanan yang ada. Fitur monitoring kapasitas storage, backup/restore dan antrean job tidak dibuat di perubahan ini. Uji jaringan browser nyata belum dilakukan.
