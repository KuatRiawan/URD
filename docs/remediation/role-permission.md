# Role dan Permission

Role yang ditemukan mencakup `ADMIN_SISTEM`, `ADMIN_KANTOR`, `AHLI_K3`, dan `PIMPINAN`, dengan alias bisnis seperti Marketing, Inspector, Admin, dan Manager. Endpoint module menggunakan autentikasi dan otorisasi berbasis role.

Akses read-only untuk Pimpinan dan batas finalisasi Inspector dipertahankan pada alur dokumen. Relasi kewenangan Marketing versus Admin Kantor, Ahli K3 versus Inspector, dan Manager versus Pimpinan belum diputuskan sebagai nomenklatur bisnis final.

Keputusan tersebut perlu menjadi satu permission matrix yang dipakai backend dan frontend, bukan hanya label navigasi.
