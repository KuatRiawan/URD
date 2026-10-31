# Inspector: perjalanan pengguna

Login sebagai Inspector melalui form normal, buka tugas, temukan PO uji, periksa daftar unit, terima tugas, lalu mulai draf Fire Alarm dan Overhead Crane. SQL mengonfirmasi satu assignment berstatus diterima, dua inspeksi berstatus `DRAF`; Forklift tetap `DITUGASKAN`. Form menampilkan checklist terpisah per inspeksi.

Saat inspeksi pertama dibuka, form lama mengisi kesimpulan dan sebagian nilai default seolah hasil lapangan. Perbaikan mengosongkan hasil/kesimpulan baru dan mengubah aksi isi otomatis agar hanya berlaku pada item pilihan. Draf baru menunjukkan progres 0/23 serta kesimpulan kosong. Data yang sudah tersimpan dari sesi sebelum perbaikan tidak di-submit. Lihat [hasil uji](test-results.md) dan [temuan](bugs-found.md).
