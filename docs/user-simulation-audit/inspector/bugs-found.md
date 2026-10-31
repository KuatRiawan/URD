# Inspector: temuan

## P1: hasil inspeksi baru terisi seolah sesuai

**Reproduksi:** membuka form inspeksi yang belum dikerjakan; form menyimpan `SESUAI`/nilai kosong sebagai hasil dan kesimpulan `MEMENUHI_SYARAT` secara otomatis. Ini berisiko membuat rekam teknis tidak benar.

**Akar masalah:** nilai default serta fallback submit mengubah data yang belum diamati menjadi hasil lulus. **Perbaikan:** nilai baru kosong, submit tidak menyisipkan hasil pengganti, tombol pengisian otomatis hanya memilih item pilihan, dan submit memerlukan data wajib termasuk kesimpulan dan tanda tangan. Backend juga menolak submit tanpa tanda tangan Inspector dan PIC.

**Retest:** draf baru menampilkan 0/23 dan kesimpulan belum dipilih. Endpoint backend diuji lewat suite (setelah perbaikan fixture). Draf lama pada database simulasi tidak dikirim dan tidak dihapus. Status: **FIXED & TESTED untuk default form; alur submit browser end-to-end belum diuji.**
