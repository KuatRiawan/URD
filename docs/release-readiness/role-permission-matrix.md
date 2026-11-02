# Matriks Role dan Permission

| Area | Marketing | Admin Kantor | Inspector/Ahli K3 | Pimpinan/Manager | Admin Sistem |
|---|---|---|---|---|---|
| Klien, PIC, PO, unit | Kelola komersial | Kelola/operasional kompatibel | Baca sesuai assignment | Baca | Kelola |
| Checklist, foto, pengukuran | Tidak mengubah | QC/revisi sesuai endpoint | Isi dan submit assignment sendiri | Baca | Dukungan/audit |
| LHPP, BAP, Suket, distribusi | Status/permintaan klien | Kelola proses dokumen | Data teknis dan revisi sendiri | Baca | Kelola |
| Reminder/follow-up | Kelola follow-up | Kelola operasional | Tidak menjadi owner | Baca | Job/config |
| User/role/audit | Tidak | Tidak | Tidak | Audit read-only | Kelola |

## Bukti enforcement

- Backend memakai `authenticate` dan `authorize` pada module route.
- Pimpinan diblokir pada semua HTTP mutation oleh middleware, bukan hanya melalui UI.
- Frontend route guard kini mencakup Marketing pada halaman komersial dan reminder, sementara halaman distribusi tidak lagi membuka akses Marketing.
- Inspector dibatasi pada assignment dan ownership query yang relevan.

## Keterbatasan pengujian

Negative test eksplisit untuk setiap kombinasi Marketing/Admin Kantor belum lengkap. Test API yang ada membuktikan beberapa penolakan role dan ownership, tetapi matriks penuh terhadap seluruh endpoint masih menjadi pekerjaan QA berikutnya.
