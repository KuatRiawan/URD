# Defect Register UAT

| ID | Severity | Area | Kondisi | Status | Dampak |
|---|---|---|---|---|---|
| UAT-D-001 | High | Backup/recovery | Tidak ada mekanisme backup/restore yang dapat diuji | OPEN / BLOCKED | Risiko kehilangan histori dan dokumen |
| UAT-D-002 | Medium | Responsive UX | Tidak ada bukti browser/device test | OPEN / NOT TESTED | Risiko Inspector gagal bekerja di lapangan |
| UAT-D-003 | High | Document lifecycle | Cancel/correction/reissue belum tersedia | OPEN / PENDING OWNER DECISION | Dokumen terbit berisiko dikoreksi di luar histori resmi |
| UAT-D-004 | Medium | Reminder policy | Jadwal internal dan klien berbeda | OPEN / PENDING OWNER DECISION | Reminder dapat dianggap tidak konsisten |
| UAT-D-005 | Medium | Role testing | Negative matrix seluruh endpoint belum lengkap | OPEN / PARTIALLY TESTED | Risiko akses tidak sesuai pada endpoint yang belum diuji |

Tidak ditemukan defect Critical berdasarkan test dan pemeriksaan yang tersedia. Tidak ada perbaikan baru yang dilakukan pada tahap UAT karena defect terbuka di atas memerlukan environment atau keputusan owner.
