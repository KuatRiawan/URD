# Audit Workflow End-to-End

## Alur yang terbukti

1. Order memiliki satu atau lebih `order_objects`.
2. Assignment memeriksa Inspector aktif, kategori unit, dan masa berlaku kompetensi.
3. Inspector mengisi draft, foto, temuan, tanda tangan, lalu submit.
4. LHPP/BAP dibuat dan diproses per unit.
5. Distribusi memvalidasi pasangan dokumen, order, dan unit.
6. `computePoUnitProgress` mengagregasi status unit menjadi status PO.
7. Reminder Suket dan reminder klien memakai relasi unit serta log idempotensi.

## Multi-unit

Test existing membuktikan pembuatan PO tiga unit, progres unit, dokumen, distribusi, dan gate selesai. Namun skenario paralel eksplisit `A selesai, B revisi, C belum dijadwalkan` belum seluruhnya diuji dalam satu assertion test. Secara kode, status disimpan pada `order_objects.unit_status`, sehingga status unit tidak saling menimpa.

## Risiko workflow

- Status PO adalah agregasi, bukan persetujuan bisnis terpisah. Kebijakan billing atau partial completion belum dikonfirmasi.
- Cancel/reissue dokumen terbit belum tersedia; koreksi manual berisiko memutus histori jika dilakukan di luar workflow.
- Reminder internal dan reminder klien memiliki daftar tahap berbeda dan belum memiliki keputusan owner yang sama.
