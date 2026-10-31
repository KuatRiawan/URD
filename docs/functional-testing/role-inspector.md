# Pengujian Role Inspector

Role inspeksi pada kode: `INSPECTOR` dan alias kompetensi lama `AHLI_K3`.

| Skenario | Status | Hasil |
|---|---|---|
| Login pada browser uji | PASS | Akun Ahli K3 masuk dan melihat dashboard tugas |
| Lihat semua tugas | PASS | Filter Semua menampilkan 4 unit fixture; filter Hari Ini kosong sesuai data tanggal |
| Buka halaman Pengujian | PASS | Route `/app/inspections` dapat dibuka |
| Akses langsung `/app/users` | PASS | UI menolak dengan Akses Ditolak |
| Simpan draft, temuan, tanda tangan, submit | PASS | Test API/integration backend |
| Manipulasi ID unit / dokumen | PASS | Test kepemilikan dan penolakan akses backend tersedia |
| Semua variasi checklist/foto offline di browser | NOT RUN | Belum menguji setiap bidang, file, dan kondisi jaringan |
| Pemulihan saat upload gagal / duplikasi submit | NOT RUN | Belum diuji lengkap |

Perbedaan filter Hari Ini bergantung tanggal fixture dan tidak dicatat sebagai bug.
