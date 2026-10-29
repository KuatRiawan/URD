# Audit Keamanan

## Temuan dan perbaikan

### Rotasi refresh token bersamaan
Sebelumnya handler membaca status sesi sebelum memulai transaksi. Dua request dengan refresh token yang sama dapat lolos pemeriksaan sebelum salah satunya mencabut token lama. Pembacaan kini memakai `SELECT ... FOR UPDATE` dalam transaksi; pemakaian ulang mencabut sesi lain dalam keluarga yang sama. Tes regresi concurrency ditambahkan, tetapi belum dijalankan karena test suite mereset schema database.

### Otorisasi unduhan lampiran
`GET /api/v1/dashboard/files/:fileId` hanya memeriksa autentikasi dan sebelumnya membatasi Ahli K3 dari lampiran Suket saja. UUID lampiran milik pekerjaan lain dapat digunakan untuk mengunduh bukti inspeksi, tanda tangan, dan dokumen. Akses Ahli K3 kini dicocokkan dengan inspeksi atau penugasan aktif untuk pemilik lampiran; peran internal lain tetap mengikuti kebijakan yang ada.

### Pemeriksaan jadwal dan dokumen lintas penugasan
Endpoint konflik jadwal menerima ID Ahli K3 bebas dan mengembalikan nama klien, order, dan jadwal. Endpoint ini kini hanya tersedia untuk admin kantor/sistem dan Ahli K3 yang meminta jadwal dirinya sendiri. Endpoint batch BAP dan pengelolaan foto LHPP/inspeksi kini memeriksa hubungan pemilik; unggah foto temuan juga memastikan temuan tersebut benar-benar milik inspeksi di URL.

### Kredensial seed
Konfigurasi sebelumnya menyediakan kata sandi fallback yang tetap untuk seluruh akun seed. Fallback tersebut dihapus. Seed produksi tanpa argumen kata sandi atau `SEED_DEFAULT_PASSWORD` sekarang berhenti sebelum migrasi, dan CLI produksi tidak mencetak kredensial.

## Kontrol yang diperiksa
- Middleware autentikasi memverifikasi JWT dan memuat peran akun aktif dari database.
- Token refresh disimpan sebagai hash di database dan cookie diberi atribut `HttpOnly` serta `SameSite=Lax`.
- Query akses database yang diperiksa menggunakan parameter.
- CORS, Helmet, batas ukuran unggahan, dan daftar MIME diperiksa pada konfigurasi yang relevan.
- Endpoint portal dengan token dan endpoint verifikasi dokumen memang publik dan read-only; klaim bahwa setiap endpoint selalu memerlukan autentikasi tidak tepat.

## Validasi dan batasan
Backend dan frontend ESLint lulus. Test frontend lulus 4/4 dan build lulus. Tes backend tidak dijalankan karena sebelum test dimulai ia menjalankan `DROP SCHEMA public CASCADE` melalui opsi reset migrasi. Regresi backend untuk temuan di atas telah ditambahkan, tetapi belum dijalankan. Audit ini tidak mencakup deployment, proxy, penyimpanan secret di luar repository, atau uji penetrasi. Hasilnya tidak membuktikan keamanan absolut.
