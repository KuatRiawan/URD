# Checklist Kesiapan Operasional

| Check | Status | Catatan |
|---|---|---|
| Marketing/Admin Kantor terpisah di backend | PASS | Route dokumen tetap terproteksi |
| Marketing dapat menjalankan alur komersial | PASS | Route client/order/reminder diselaraskan |
| Pimpinan read-only | PASS | Middleware mutation guard |
| Kompetensi Inspector kategori/tanggal | PASS | Assignment validation dan test |
| Unit PO independen | PASS WITH LIMITATION | Agregasi dan multi-unit lulus; skenario paralel penuh perlu test tambahan |
| Renewal/Suket | PASS WITH CONDITION | Relasi konsisten; policy final pending |
| Reminder | PASS WITH CONDITION | Query diperbaiki; jadwal resmi pending |
| Dokumen terbit immutable/reissue | NOT READY | Lifecycle generik belum tersedia |
| Retensi dan backup | NOT READY | Policy dan restore test belum tersedia |
| Security baseline | PASS | Tidak ada temuan security-review |
| Desktop/mobile | PARTIALLY VERIFIED | Static review; belum ada browser/device validation |
| Test/lint/build | PASS | Bukti pada `test-evidence.md` |

## Keputusan rilis

Gunakan sistem untuk operasional terbatas dengan owner acknowledgement atas kondisi pending. Jangan menyatakan READY penuh sebelum lifecycle dokumen, retensi, jadwal reminder, dan validasi responsive diselesaikan.
