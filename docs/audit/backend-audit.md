# Audit Backend

## Hasil pemeriksaan
Backend memakai Express, modul route per domain, Joi pada sejumlah payload, serta query PostgreSQL berparameter. Tidak tepat menyatakan bahwa setiap endpoint memakai `authenticate`, `authorize`, dan Joi: login, refresh, health, portal klien berbasis token, dan verifikasi dokumen merupakan pengecualian publik atau alur khusus. Beberapa route juga hanya memerlukan autentikasi tanpa pembatasan peran.

## Temuan yang diperbaiki
- Refresh token dapat diputar dua kali secara bersamaan karena pemeriksaan dan rotasi tidak atomik. Baris sesi kini dikunci dalam transaksi; token yang dipakai ulang mencabut keluarganya.
- Unduhan lampiran hanya memiliki autentikasi umum dan larangan khusus Suket untuk Ahli K3. Sekarang akses Ahli K3 dicocokkan dengan penugasan atau inspeksi pemilik lampiran.
- Unggah PO memakai nilai tipe pemilik yang tidak ada pada constraint migrasi. Kode sekarang memakai `PO_ATTACHMENT`.
- Nilai kata sandi seed default yang diketahui dihapus; seed produksi perlu konfigurasi eksplisit dan tidak mencetak rahasia.
- Pemeriksaan konflik jadwal mengungkap detail order/klien untuk ID inspector arbitrer; endpoint kini membatasi peran dan Ahli K3 hanya dapat memeriksa dirinya sendiri.
- Unggah foto temuan tidak memvalidasi bahwa finding berada pada inspection id URL. Relasi tersebut kini diverifikasi. Endpoint foto inspeksi dan LHPP serta batch BAP juga memeriksa ownership Ahli K3.
- UI Orders sebelumnya mengosongkan konflik tanpa pesan ketika pemeriksaan jadwal gagal; sekarang kegagalan ditampilkan sebagai toast error.

Regresi backend untuk temuan tersebut ditambahkan pada `backend/src/tests/api.test.js`. Tes tersebut belum dijalankan karena suite menghapus schema database yang dikonfigurasi.

## Validasi
- `npm --prefix backend run lint`: lulus.
- `npm --prefix frontend run lint`: lulus.
- Tes backend tidak dijalankan karena `beforeAll` memanggil `runMigrations({ reset: true })`.

Pemeriksaan ini tidak mencakup seluruh route secara baris demi baris, deployment, atau perilaku beban produksi. Tidak ada dasar untuk menyebut backend production-ready hanya dari bukti ini.
