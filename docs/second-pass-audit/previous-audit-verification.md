# Verifikasi audit putaran pertama

Tanggal: 31 Oktober 2026. Sumber: dokumentasi putaran pertama, PRD v2.0, source aktif, test suite, dan katalog PostgreSQL read-only.

| Klaim sebelumnya | Verifikasi source/test | Hasil putaran kedua |
|---|---|---|
| SEC-01 dashboard Inspector membatasi aktivitas ke user | Query memakai `WHERE a.user_id = $1`; regression memeriksa parameter | Terverifikasi pada API/query; browser belum dites. |
| SEC-02 submit idempotent cek owner | Owner/assignment diperiksa sebelum mengembalikan data lama; test lintas Inspector mengharapkan 403 | Terverifikasi pada API. |
| SEC-03 fallback identitas dihapus | Fallback sudah hilang dari inspeksi, tetapi masih ada di helper LHPP dan BAP | Klaim awal tidak lengkap. Fallback dokumen dihapus dan diuji pada putaran ini. |
| SEC-04 JWT staging fail-fast | `env.js` memakai secret acak di development dan fail-fast pada environment lain; subprocess test | Terverifikasi pada test konfigurasi. Secret production tidak diaudit. |
| UX-01 headline login Indonesia | Copy statis Indonesia dan logo resmi; test/browser lama | Terverifikasi untuk login saja. |
| BUS-01 Pimpinan tidak mendapat aksi review | Queue read-only, namun `/lhpp/:id/review` masih melakukan approval, Inspector dapat finalize, BAP finalize menerima Inspector | Klaim awal tidak lengkap. Route legacy dinonaktifkan; finalisasi LHPP/BAP dibatasi ke Marketing/Admin Sistem. |
| Status approval lama sudah dibersihkan | Migration 011 masih mengizinkan status approval | Migration 015 memetakan status aktif dan membatasi check; histori disimpan. Belum diterapkan ke DB lokal. |
| PDF final tervalidasi karena generator test lulus | Endpoint PDF mengenerate ulang dan tidak menyajikan file yang di-hash | Klaim awal tidak cukup. Endpoint kini mengembalikan attachment final; hash API cocok. |
| QR BAP ada | Buffer QR dibuat tetapi tidak dipakai renderer | Temuan baru, QR kini ditampilkan dan diperiksa. |
| Bundle lama 848 kB | Build sebelumnya 848.46 kB | Route lazy loading menurunkan chunk utama ke 278.18 kB, tanpa warning 500 kB. |

## Hasil uji ulang

- Backend 51/51, 5 file suite, pada database sementara yang dihapus setelah pengujian.
- Frontend 4/4; production build berhasil.
- Backend lint lulus. Frontend lint masih gagal dengan 30 error dan 2 warning.
- Browser seluruh role, seluruh halaman responsive, serta semua template PDF belum mendapat sign-off.

Tidak ada reset atau write ke `urd_dev`/`urd_test`. `urd_dev` dibaca dalam transaksi read-only; snapshot migration berakhir pada 014. Migration 015 wajib dijalankan melalui deployment migration normal.
