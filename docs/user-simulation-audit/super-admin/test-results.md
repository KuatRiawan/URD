# Admin Sistem: hasil uji

| Skenario | Hasil | Bukti/batasan |
|---|---|---|
| Login dan buka manajemen pengguna | Lulus | Login normal sebagai Admin Sistem. |
| Filter role kanonis dan alias | Lulus | Filter Marketing memuat akun `MARKETING` dan alias `ADMIN_KANTOR`. |
| Buat akun Inspector | Lulus | UI sukses; DB memiliki role `INSPECTOR`, aktif. Setelah sukses, modal baru dibuka untuk verifikasi nilai role default `MARKETING`. |
| Profil Inspector opsional NIP | Sebagian | Tabel profil dibuat; employee number boleh null sesuai skema. |
| Edit, nonaktifkan, aktifkan, reset password | Belum diuji | Tidak mengubah akun seed/pengguna lain. |
| Master data dan template | Belum diuji | Tidak termasuk sesi browser ini. |
