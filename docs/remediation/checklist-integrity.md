# Integritas Checklist

Aksi auto-fill yang menandai seluruh pilihan sebagai `SESUAI` telah dihapus dari alur Inspector. Nilai checklist harus berasal dari observasi pemeriksaan aktual.

Penghapusan aksi ini mencegah penyelesaian palsu, tetapi validasi server tetap menjadi kontrol utama. Test berikutnya perlu memastikan payload submit tidak dapat mengaktifkan kembali perilaku massal melalui field tersembunyi atau endpoint alternatif.
