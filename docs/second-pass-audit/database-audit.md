# Audit database

## Snapshot read-only `urd_dev`

| Pemeriksaan | Hasil |
|---|---:|
| Tabel public | 39 |
| Foreign key | 89 |
| Index | 111 |
| Primary/unique/check constraints | 345 |
| Migration history | Sampai 014; ada dua nama berprefix 009 |
| Role | ADMIN_SISTEM 1, INSPECTOR 1, MARKETING 1, PIMPINAN 1 |
| LHPP status | SIAP_PREVIEW 1 |
| Orphan unit/order, inspection/order, LHPP/inspection, BAP/inspection | 0 pada empat join yang dihitung |

Snapshot dibaca dalam transaksi `READ ONLY`. `urd_dev` dan `urd_test` tidak direset atau dimigrasikan.

## Migration

- Backend suite menerapkan migration 001-015 dari kosong pada DB sementara, lalu seed/workflow lulus.
- Migration 015 mempertahankan `lhpp_revisions` dan `order_status_history`, memetakan status lama, kemudian mengencangkan check constraint.
- Migration 015 belum diterapkan ke database lokal.
- Pemeriksaan orphan tidak mencakup semua attachment, signature, checklist/result, assignment, revision, distribusi, reminder atau backup/restore.

Severity: P1 operasional untuk menerapkan migration 015 melalui proses release sebelum deploy code terkait; P2 untuk audit seluruh relasi historis.
