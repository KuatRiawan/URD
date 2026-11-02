# Hasil Workflow End-to-End

## Skenario tiga unit

| Unit | Kondisi | Hasil yang terbukti |
|---|---|---|
| A | Selesai | Dapat menghasilkan LHPP/BAP, diproses, dan didistribusikan |
| B | Perlu revisi | Status `PERLU_REVISI` tersedia pada agregasi workflow |
| C | Belum dijadwalkan | Tetap `BELUM_DIJADWALKAN` dan tidak mengubah A/B |

Backend test membuktikan PO tiga unit, assignment, inspeksi, LHPP, BAP, distribusi, histori, reminder, dan gate `SELESAI` setelah seluruh unit aktif selesai.

## Batasan

Test otomatis belum menjalankan satu fixture lengkap dengan A selesai, B revisi, dan C pending pada semua jalur UI secara simultan. Karena itu hasil agregasi dinyatakan PASS WITH LIMITATION, bukan UAT UI penuh.

## Keputusan bisnis

Cancel, correction, dan reissue dokumen terbit tetap BLOCKED sampai owner menyetujui lifecycle, versioning, nomor revisi, dan approver.
