# Aturan Bisnis Renewal

## Rekomendasi utama

1. Renewal dilacak pada level `order_objects`, bukan hanya level PO.
2. Setiap unit renewal menunjuk Suket terbit sumber yang menjadi dasar masa berlaku.
3. Satu PO renewal dapat memuat beberapa unit dari klien yang sama, termasuk subset unit dari PO sebelumnya.
4. Unit yang batal atau belum siap tidak boleh menghalangi unit lain untuk diproses.
5. Duplikasi aktif dicegah per unit dan Suket sumber, bukan dengan melarang renewal sah setelah order lama selesai atau dibatalkan.
6. Pembatalan renewal mengubah status dan mencatat alasan serta actor; histori dan relasi lama tetap ada.
7. Reminder berhenti untuk unit yang sudah memiliki renewal aktif yang valid, tetapi kembali berjalan bila renewal dibatalkan atau tidak lagi aktif sesuai kebijakan owner.

## Kondisi implementasi

`orders.renewal_of_suket` sudah tersedia dan route reminder menautkan Suket terbaru serta mengembalikan order aktif saat retry. `renewal_followups` menyimpan `suket_id` dan, melalui migration 006, `object_id` nullable untuk unit yang belum memiliki Suket. Query reminder kini membaca kedua relasi tersebut. Relasi order ke banyak unit dan kebijakan beberapa renewal aktif tetap perlu keputusan/validasi owner.

## Status model yang disarankan

- `DRAFT`: PO renewal belum siap.
- `TERDAFTAR`: permintaan tercatat.
- `DIJADWALKAN` / `DITUGASKAN`: operasi disiapkan.
- status unit mengikuti inspeksi dan dokumen.
- `SELESAI`: hanya bila seluruh unit aktif pada PO tersebut selesai.
- `DIBATALKAN`: order dihentikan dengan alasan; tidak menghapus histori.

Status ini adalah rekomendasi domain. Penamaan final dan transisi legal perlu owner.

## Dampak implementasi

- **Frontend:** tampilkan Suket sumber dan status per unit; jangan hanya menampilkan satu status PO.
- **Backend/API:** terima daftar unit renewal, validasi ownership klien, Suket terbit, idempotensi per unit, dan cancellation semantics.
- **Database:** tambahkan relasi unit renewal eksplisit bila query saat ini hanya mengandalkan `order_objects`; lakukan backfill sebelum constraint baru.
- **Permission:** Marketing membuat/follow-up komersial; Admin Kantor memproses dokumen; Pimpinan read-only.
- **Notifikasi/scheduler:** gunakan event status unit dan valid_until, dengan suppression yang dapat dijelaskan.
- **Test:** multi-unit subset, satu unit batal, retry bersamaan, renewal setelah pembatalan, reminder berhenti/aktif kembali.
