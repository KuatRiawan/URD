# Analisis Kesenjangan Inspector

## Temuan

| Aktivitas / kondisi lapangan | Kondisi saat ini | Risiko / kesenjangan | Kebutuhan / tindakan |
|---|---|---|---|
| Membuka tugas, inspeksi, checklist, dokumentasi dan submit | Alur inspeksi digital, checklist, foto, temuan, tanda tangan, penyimpanan draf tersedia. | Seluruh alur normal belum dijalankan ulang lintas kategori pada audit ini. | Pertahankan satu alur inspeksi dan uji ulang mobile lintas kategori sebelum rilis. |
| Unit tidak cocok / unit tambahan | Halaman Kendala menerima jenis `UNIT_MISMATCH`; terkait PO/unit/inspeksi; mendukung deskripsi, prioritas dan bukti. Inspector hanya boleh melaporkan pada PO yang ditugaskan. | Input identitas aktual terstruktur belum disediakan; kendala tidak mengubah identitas PO. | P1: tambah kolom identitas aktual dan proses usulan perubahan administratif. |
| Unit tidak ada, belum siap, lokasi berubah, pekerjaan dihentikan | Taksonomi kendala mendukung pelaporan kategori operasional dan pencatatan status. | Resume/penjadwalan ulang dan setiap skenario belum diuji lewat UI. | P1: perlu status tindak lanjut spesifik serta tautan kembali ke inspeksi/jadwal. |
| Kondisi tidak aman | Kendala prioritas tinggi ditangani melalui antrean; UI mengarahkan pengguna mengikuti prosedur perusahaan. | Tidak ada instruksi teknis otomatis dan status “hentikan sementara” terpisah. | P1: aksi jeda eksplisit dengan alasan dan otoritas melanjutkan yang jelas. |
| Checklist atau alat ukur tidak sesuai | Form inspeksi menyimpan checklist dan temuan; isu dapat dilaporkan terpisah. | Klarifikasi template, alat ukur bermasalah dan validasi rentang belum diuji komprehensif pada skenario ini. | SHOULD: catatan tambahan terstruktur dan permintaan klarifikasi tanpa mengubah template master. |
| PIC tidak hadir / menolak tanda tangan | Form tanda tangan tersedia. | Status penolakan, alasan, dan status PIC tidak hadir belum diverifikasi tersedia sebagai alur formal. | P1: status khusus dan alasan; jangan menganggap tanda tangan lengkap. |
| Koneksi terputus | Aplikasi memiliki mekanisme draf/antrian lokal dari implementasi terdahulu. | Simulasi jaringan putus, retry, pemulihan dan pencegahan duplikasi tidak dilakukan kali ini. | P0: uji offline/online nyata sebelum menyatakan jaminan sinkronisasi. |
| Salah input setelah submit | Pemeriksaan tersimpan dan audit tersedia. | Proses revisi setelah submit/terbit perlu dikonfirmasi per jenis dokumen. | P1: koreksi melalui revisi terdokumentasi, bukan perubahan diam-diam. |

## Simulasi UI

Pada viewport ponsel, Inspector membuka inspeksi Fire Alarm dari dashboard, menekan “Laporkan kendala”, dan form terbuka dengan PO serta unit terpilih. Laporan `UNIT_MISMATCH` tersimpan sebagai KDL-202610-00001 bersama unit SIM-FA-003. Marketing menindaklanjuti, lalu Pimpinan melihat timeline tanpa kontrol perubahan.

## Prioritas

- **MUST HAVE:** pelaporan kendala terhubung ke PO/unit/inspeksi, bukti, pembatasan assignment dan histori.
- **SHOULD HAVE:** jeda dan lanjut inspeksi berizin, status PIC, identitas aktual dan unit tambahan melalui persetujuan administratif.
- **NICE TO HAVE:** pengiriman ulang bukti yang tahan koneksi buruk setelah mekanisme idempotensi diuji.
- **NOT NEEDED:** pengubahan template checklist master dari perangkat Inspector.
