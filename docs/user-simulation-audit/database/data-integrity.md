# Integritas database simulasi

Semua query di bawah bersifat baca saja. Database `urd_user_sim_20261031` khusus simulasi; tidak ada reset/drop. PO `TEST-URD-2026-001` tercatat `SEDANG_DIPERIKSA`, berelasi dengan tiga `order_objects` dan satu assignment.

| Nomor seri | Unit status | Inspeksi | Baris hasil | Tanda tangan |
|---|---|---|---:|---:|
| SIM-CRN-001 | SEDANG_DIPERIKSA | DRAF | 23 item | 0 |
| SIM-FA-003 | SEDANG_DIPERIKSA | DRAF | 5 item | 0 |
| SIM-FLK-002 | DITUGASKAN | Belum dibuat | 0 | 0 |

Baris hasil draf tidak diperlakukan sebagai hasil lulus; draf Fire Alarm sempat menerima default lama sebelum perbaikan dan sengaja tidak disubmit. Hasil SQL mencatat ID individu tiap unit dan relasi inspection pada `order_id`/`object_id`. LHPP, BAP, tanda tangan, dan distribusi tidak ada untuk PO ini. Audit trail user create diuji melalui API suite; audit trail UI tidak ditelusuri manual. Belum dilakukan audit orphan umum seluruh skema.
