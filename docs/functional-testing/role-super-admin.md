# Pengujian Role Super Admin

Nama role aktual pada kode adalah `ADMIN_SISTEM`, bukan role baru bernama `SUPER_ADMIN`. Master prompt menggunakan Super Admin sebagai istilah fungsi; dokumen ini menguji akun `ADMIN_SISTEM`.

| Skenario | Status | Hasil |
|---|---|---|
| Login pada browser uji | PASS | Dashboard dan navigasi admin tampil |
| Buka Manajemen Pengguna | PASS | Tabel akun dan tombol tambah tampil |
| Buka Audit Log | PASS | Daftar entri tampil |
| Route internal utama | PASS | App test membuka seluruh halaman internal tanpa blank screen |
| CRUD pengguna, status nonaktif, dan role negatif | NOT RUN | UI tidak disubmit untuk menghindari fixture berubah di luar skenario |
| Semua master data dan setting | NOT RUN | Belum dieksekusi dari browser |
| Pembatasan Admin Sistem lintas seluruh endpoint | NOT RUN | Test suite punya pemeriksaan RBAC tertentu, bukan matriks semua endpoint |
