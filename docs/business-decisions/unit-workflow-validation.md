# Validasi Workflow Unit

`order_objects` menyimpan status per unit dan `computePoUnitProgress` menghitung:

- total unit;
- unit aktif;
- belum dijadwalkan;
- terjadwal;
- sedang diperiksa;
- menunggu dokumen/revisi;
- selesai;
- dibatalkan.

PO hanya menjadi `SELESAI` jika seluruh unit aktif selesai. Unit yang selesai dapat melanjutkan dokumennya tanpa menunggu unit lain. Unit revisi atau pending tetap berada pada antrean masing-masing.

Test multi-unit backend membuktikan tiga unit dalam satu PO dapat bergerak melalui inspeksi, LHPP, BAP, distribusi, dan penyelesaian tanpa menimpa relasi unit lain.

## UI

Work queue dan detail PO sudah menggunakan data unit, tetapi format ringkasan eksplisit seperti `1 Selesai | 1 Perlu Revisi | 1 Pending Perbaikan` masih perlu dipastikan pada halaman PO utama. Ini adalah peningkatan UX, bukan perubahan status backend.
