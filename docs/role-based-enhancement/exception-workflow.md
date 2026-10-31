# Alur Penanganan Kendala Operasional

## Alur yang tersedia

1. Inspector membuka form kendala dari inspeksi aktif. PO, unit dan inspeksi dapat diprefill; backend memeriksa assignment dan konsistensi relasi.
2. Inspector memilih jenis, judul, deskripsi dan prioritas, lalu mengirim laporan. Kondisi tidak aman ditandai prioritas tinggi. Form tidak memberi instruksi teknis K3 otomatis.
3. Bukti dapat dilampirkan melalui penyimpanan file yang sudah ada. Akses file mengikuti kepemilikan laporan/assignment.
4. Marketing/Admin melihat antrean, mengubah status, menetapkan penanggung jawab operasional dan menulis catatan tindakan.
5. Pelapor dan pihak terkait menerima notifikasi. Event tindakan, lampiran, audit dan waktu disimpan.
6. Pimpinan dapat memantau rincian/timeline; perubahan oleh Pimpinan ditolak.

Status yang digunakan mencakup dilaporkan, sedang ditangani, menunggu informasi, siap dilanjutkan, selesai dan tidak dapat dilanjutkan. Status transisi divalidasi oleh backend.

## Batasan yang harus dipahami

- Kendala tidak sama dengan hasil checklist dan tidak mengubah data master PO.
- Unit tambahan belum masuk sebagai change order yang meminta persetujuan klien.
- Melaporkan kondisi tidak aman belum otomatis menghentikan sesi inspeksi; Inspector tetap mengikuti prosedur URD.
- Alur penjadwalan ulang, penggantian Inspector, PIC absen/menolak tanda tangan, dan lanjut setelah kendala belum dibuktikan end-to-end.

## Bukti uji

Tes API memverifikasi pembuatan, penolakan akses Inspector yang tidak ditugaskan, hak baca Pimpinan, larangan perubahan Pimpinan, tindak lanjut Admin, timeline, audit, lampiran dan akses file. Simulasi browser membuat satu `UNIT_MISMATCH`, Marketing mengubah status dan penanggung jawab, dan Pimpinan melihat timeline read-only.
