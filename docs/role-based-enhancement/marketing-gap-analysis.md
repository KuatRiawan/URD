# Analisis Kesenjangan Marketing

## Temuan berdasarkan implementasi dan verifikasi

| Aktivitas | Kondisi saat ini | Kesenjangan operasional | Kebutuhan / tindakan |
|---|---|---|---|
| Menerima PO, mengisi klien dan unit | Modul PO dan master klien/unit sudah tersedia; form PO mendukung banyak unit. | Peringatan kelengkapan sebelum pekerjaan dipublikasikan perlu ditinjau per bidang dan alur. Tidak diuji pada simulasi ini. | P0: validasi data wajib pada backend dan UI sebelum penugasan/publikasi; verifikasi seluruh kategori objek. |
| Revisi PO | Nomor revisi dan snapshot PO/klien/unit dicatat untuk pembuatan awal, penambahan unit dan impor CSV. | Belum ada perbandingan field per versi, persetujuan perubahan klien, maupun alur revisi dokumen final. Perubahan data umum PO belum seluruhnya menjadi revisi. | P1: change order dengan alasan, persetujuan administratif yang berwenang, dampak jadwal/penugasan, dan notifikasi. |
| Unit tambahan | Penambahan unit menghasilkan revisi dan audit trail. | Ini belum menjadi pengajuan perubahan pekerjaan terpisah; unit dapat masuk ke PO tanpa persetujuan klien yang terdokumentasi. | P1: status usulan, bukti persetujuan, lalu penerapan unit ke PO. |
| Perubahan jadwal | Endpoint menyimpan alasan dan riwayat; tes memastikan Inspector aktif menerima notifikasi. | UI simulasi perubahan jadwal dan penggantian Inspector belum dijalankan. Lokasi dan dampak penugasan belum diverifikasi. | Pertahankan riwayat; tambah UI dampak perubahan dan alur pengganti dengan kompetensi/ketersediaan. |
| Pembatalan PO | Status dan audit PO tersedia di sistem. | Belum diuji pembatalan setelah sebagian unit selesai, dampak dokumen terbit, atau notifikasi pihak terkait. | P1: pembatalan beralasan per pekerjaan dengan ringkasan unit dan dokumen historis yang tidak dihapus. |
| Progres dan distribusi dokumen | Dashboard, halaman dokumen, riwayat distribusi, notifikasi, dan global search tersedia. | Konsolidasi semua indikator per PO dan reminder tindak lanjut belum dibuktikan menyeluruh. | SHOULD: ringkasan per PO yang menunjukkan kendala, unit, dokumen, distribusi dan aksi berikutnya. |

## Simulasi yang benar-benar dilakukan

Inspector membuat kendala pada PO; Marketing mengubah status dan penanggung jawabnya melalui halaman Kendala. Pimpinan kemudian melihat timeline yang sama dalam mode baca saja. Perubahan jadwal diuji melalui API dan menghasilkan histori serta notifikasi.

## Prioritas

- **MUST HAVE:** perubahan PO yang terlacak dan tidak menimpa histori; validasi kelengkapan; alur pembatalan aman.
- **SHOULD HAVE:** change order dengan bukti persetujuan klien; penggantian Inspector dengan pemeriksaan kompetensi/ketersediaan; ringkasan progres per PO.
- **NICE TO HAVE:** ringkasan performa klien dan pengingat lanjutan otomatis setelah aturan operasional disepakati.
- **NOT NEEDED:** halaman kendala kedua yang menduplikasi antrean kendala lintas role.
