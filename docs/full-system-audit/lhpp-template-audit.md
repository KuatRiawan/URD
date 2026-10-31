# Audit template dan generator LHPP

Folder `docs/` memuat PDF contoh sumber berbagai kategori. `backend/src/services/pdf-generator.js` membangun PDF F4 dari data laporan. Test generator memeriksa field dan kategori PAA, PUBT, PTP, IPP, LIS, IPK, serta keluaran multi-halaman.

Sesi ini tidak merender PDF untuk tiap template sumber dan tidak membandingkan tiap halaman secara visual. Margin, tabel, logo, page break, tanda tangan, print, dan unduhan browser per kategori belum disign-off.

Status: generator FIXED & TESTED untuk test buffer yang tersedia; kesesuaian visual semua template NOT FULLY TESTED.
