# Renewal dan Reminder

Renewal berbasis unit mencari Suket terbit terbaru dan menyimpan relasinya pada `orders.renewal_of_suket`. Follow-up reminder menyimpan `suket_id` bila tersedia. Retry pembuatan renewal mengembalikan order aktif yang sama, sehingga tidak membuat duplikasi aktif.

Renewal berbasis Suket juga memiliki perlindungan idempotensi. Unit lain pada PO tetap diproses secara independen; satu unit bermasalah tidak boleh menghapus atau mengubah reminder unit lain.

Definisi final tentang satu atau beberapa renewal aktif, serta apakah setiap renewal wajib menunjuk tepat satu Suket, masih memerlukan konfirmasi bisnis.
