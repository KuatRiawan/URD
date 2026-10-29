# Status Remediasi Audit

## Perbaikan yang diterapkan
1. **Tinggi, rotasi refresh token non-atomik:** kunci baris sesi dalam transaksi; deteksi penggunaan ulang dan cabut keluarga sesi.
2. **Tinggi, akses lampiran lintas penugasan:** validasi akses Ahli K3 terhadap relasi pemilik lampiran.
3. **Sedang, unggah lampiran PO ditolak database:** gunakan `PO_ATTACHMENT` yang diizinkan migrasi.
4. **Tinggi, kata sandi seed default diketahui:** hapus fallback tetap, minta konfigurasi eksplisit untuk seed produksi, dan jangan cetak kredensial di log produksi.
5. **Tinggi, kebocoran metadata konflik jadwal lintas inspector:** batasi route dan validasi input serta kepemilikan ID.
6. **Tinggi, akses batch BAP dan foto lintas resource:** batasi ke inspector pemilik dan validasi hubungan lampiran dengan inspeksi/LHPP.
7. **Rendah, kegagalan pemeriksaan konflik ditelan UI:** tampilkan pesan error yang bisa ditindaklanjuti.

Tes regresi backend untuk alur tersebut ditambahkan, tetapi belum dieksekusi karena test suite saat ini menghapus schema database yang dikonfigurasi. Validasi lanjutan memerlukan database disposable yang dipastikan terpisah dari data pengguna.

## Rekomendasi non-blocking
Global search, work queue, versioning, autosave, bulk action, dan E2E lintas workflow tidak diverifikasi sebagai kebutuhan atau cacat. Item tersebut tetap opsi produk, bukan kewajiban remediasi keamanan.
