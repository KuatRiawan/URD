# Validasi visual LHPP dan BAP

## Berkas sumber yang ditemukan

Di `docs/` ditemukan tujuh contoh LHPP: PAA Gantry Crane; PUBT Air Pressure Tank; IPP Instalasi Petir; dua PTP (Line 8 RGB dan Motor Diesel); IPK Fire Alarm; dan LIS Instalasi Listrik. Contoh LE tidak ditemukan pada direktori yang diperiksa. Sumber BAP: `BAP-URD-X-2026-0001.pdf`. Tidak ditemukan template `.docx` LHPP terpisah.

## Fungsi PDF

- Unit test generator LHPP memeriksa kategori PAA/PUBT/PTP/IPP/LIS/IPK dan multi-page output.
- Finalisasi menyimpan PDF dan SHA-256. Endpoint preview/unduh final kini membaca attachment tersebut. API menguji digest body sama dengan `document_hash` di DB.
- QR BAP sebelumnya dibuat tetapi tak dipakai; sekarang QR verifikasi dicetak pada kop.
- Render halaman BAP generator dan halaman pertama BAP sumber: `assets/bap-generated.png`, `assets/bap-template-original.png`.

## Batas visual

- Sumber BAP menempatkan QR di area bawah dekat pengesahan; renderer kini memakai ruang kanan atas. QR terbaca pada render, tetapi kecocokan posisi template belum disepakati.
- Data render uji tidak menyertakan gambar tanda tangan. API test menguji simpan tanda tangan, bukan tampilan goresan.
- Belum ada render/compare seluruh halaman untuk tujuh sumber LHPP, foto, tanda tangan, footer, page number, overflow, print, serta download browser.

Status: QR BAP diperbaiki dan hash final terverifikasi. Template semua kategori belum sign-off.
