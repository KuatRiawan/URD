# Validasi Schema Reminder

## Temuan dan perbaikan

`renewal_followups` memiliki `suket_id` dan `object_id` nullable. `suket_id` menghubungkan follow-up dengan Suket terbit, sedangkan `object_id` mendukung follow-up unit sebelum Suket diterbitkan melalui migration 006.

Query sekarang:

1. mencari Suket terbit untuk unit;
2. menghubungkan follow-up melalui `rf.suket_id = s.id` atau `rf.object_id = t.id`;
3. mengambil follow-up terbaru untuk unit tersebut, termasuk unit tanpa Suket;
4. menekan reminder hanya untuk status follow-up yang memang sudah ditandai selesai/ditunda.

Perbaikan tidak memilih jadwal reminder resmi. Konflik H90/H60/H30/H14/H0 versus H7/H14/H30 tetap `PENDING OWNER DECISION`.

## Bukti

Test API end-to-end menjalankan dispatch reminder, memastikan tidak ada error kolom schema, idempotensi log, serta renewal tidak menggandakan order aktif. Audit lanjutan juga memverifikasi migration 006 sebagai sumber kolom `object_id` dan memperbaiki query scheduler agar mengikuti kedua relasi tersebut.

## Catatan operasional

Scheduler harian tetap mencatat kegagalan secara eksplisit. Penyatuan atau pemisahan scheduler internal dan eksternal harus menunggu keputusan owner.
