# Keputusan yang Masih Memerlukan Persetujuan Owner

1. Apakah Marketing dan Admin Kantor memiliki pemisahan penuh capability seperti matriks target, atau ada capability silang tertentu?
2. Apakah `INSPECTOR` adalah role akun tunggal dan Ahli K3 hanya atribut kompetensi, atau ada kewenangan formal Ahli K3 yang berbeda?
3. Apakah Manager dan Pimpinan identik secara organisasi atau hanya alias tampilan?
4. Apakah satu unit boleh memiliki lebih dari satu renewal aktif pada kondisi tertentu?
5. Kapan reminder berhenti: saat PO dibuat, saat unit dijadwalkan, saat inspection dimulai, atau saat Suket baru terbit?
6. Jika renewal dibatalkan, apakah reminder lama langsung aktif kembali?
7. Apakah satu PO renewal boleh memproses subset unit dan menagih unit selesai secara independen?
8. Apakah koreksi dokumen terbit menghasilkan nomor dokumen baru, versi baru, atau keduanya?
9. Siapa yang boleh meminta, menyetujui, dan menerbitkan ulang dokumen yang dikoreksi?
10. Berapa retensi audit log, data inspeksi, foto, signature, dokumen, distribusi, reminder, token, dan backup?
11. Apakah scheduler reminder resmi memakai H90/H60/H30/H14/H0 atau H7/H14/H30?
12. Apakah query reminder harus berbasis Suket langsung, atau boleh memakai `next_inspection_date`/rekomendasi LHPP sebagai fallback?

## Bukti yang perlu diminta owner

- SOP atau keputusan tertulis tentang segregation of duties.
- Daftar kewenangan penandatangan dan kompetensi per bidang K3.
- Aturan komersial renewal dan pembatalan PO.
- SOP koreksi, pembatalan, penerbitan ulang, QR, dan distribusi dokumen.
- Kebijakan retensi, legal hold, backup, dan pemulihan.

Sebelum bukti tersebut tersedia, perubahan yang aman hanya berupa dokumentasi, observability, test, dan perbaikan bug yang tidak mengubah keputusan bisnis.
