# Dampak Permission

| Aksi | Inspector | Marketing/Admin | Pimpinan |
|---|---|---|---|
| Melihat antrean kendala | Kendala sendiri / PO yang ditugaskan sesuai aturan backend | Semua kendala operasional dalam cakupan | Baca untuk monitoring |
| Membuat kendala | Ya, pada assignment/PO yang sah | Ya sesuai akses route | Tidak menjadi pelapor operasional pada alur ini |
| Mengunggah bukti | Kendala yang boleh diakses | Kendala yang boleh dikelola | Tidak ada aksi perubahan |
| Mengubah status/penanggung jawab | Tidak | Ya, Marketing/Admin aktif sesuai aturan | Ditolak (403) |
| Mencari kendala | Hasil dibatasi pada aksesnya | Hasil sesuai akses role | Hasil baca sesuai akses |
| Mengubah histori inspeksi/tanda tangan | Tidak lewat modul kendala | Tidak lewat modul kendala | Tidak |

Semua route berada di bawah autentikasi, memvalidasi parameter/body/query dengan Joi, menggunakan SQL berparameter melalui pool, dan mencatat operasi penting. Bukti memakai layanan file yang sudah ada dan pemeriksaan kepemilikan.

Snapshot revisi PO tidak memperluas hak edit PO. Rute PO tetap menggunakan permission yang sudah ada. Pimpinan dapat membaca revisi dari detail PO yang diizinkan.
