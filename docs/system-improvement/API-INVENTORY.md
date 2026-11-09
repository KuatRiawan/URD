# PT Upaya Riksa Daya (URD) — Backend REST API Inventory

Dokumen ini memetakan seluruh endpoint API REST yang tersedia pada backend Express.js PT Upaya Riksa Daya (`/api/v1/*`), lengkap dengan metode HTTP, middleware otorisasi (*Role Guard*), dan fungsionalitas bisnisnya.

---

## 1. Modul Autentikasi & Sesi (`/api/v1/auth`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis & Kontrak |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Publik (Rate-Limited: 25 req/15m) | Masuk sistem dengan email & password. Mengembalikan user profile dan set HTTP-only cookie (`urd_access`, `urd_refresh`) atau payload token. |
| `POST` | `/api/v1/auth/refresh` | Publik (Valid Refresh Cookie/Body) | Rotasi token sesi. Mencegah race condition dan mencabut seluruh keluarga token (*token family*) jika token yang telah dipakai dicoba kembali. |
| `POST` | `/api/v1/auth/logout` | Terautentikasi | Keluar dari sesi, mencabut token aktif, dan membersihkan cookie keamanan. |
| `GET` | `/api/v1/auth/me` | Terautentikasi | Mengambil profil user aktif (id, nama, email, role, avatarUrl, lisensi SKP jika Inspector). |
| `PUT` | `/api/v1/auth/profile` | Terautentikasi | Memperbarui informasi profil mandiri (nama, no telepon, avatarUrl). |
| `PUT` | `/api/v1/auth/change-password` | Terautentikasi | Mengubah kata sandi dengan verifikasi kata sandi lama dan validasi kekuatan kata sandi baru. |

---

## 2. Modul Pengguna & Akun (`/api/v1/users`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | `ADMIN_SISTEM` | Mengambil daftar seluruh pengguna sistem dengan filter role dan status aktif. |
| `POST` | `/api/v1/users` | `ADMIN_SISTEM` | Menambahkan pengguna baru (Marketing, Inspector, Admin Kantor, Pimpinan). Password di-hash menggunakan bcrypt. |
| `GET` | `/api/v1/users/:id` | `ADMIN_SISTEM` | Mengambil rincian akun pengguna beserta jejak riwayat aktivitasnya. |
| `PUT` | `/api/v1/users/:id` | `ADMIN_SISTEM` | Memperbarui data pengguna, nomor pegawai (employeeNo), dan penugasan peran. Menolak deaktifasi diri sendiri oleh Super Admin. |
| `PATCH`| `/api/v1/users/:id/status`| `ADMIN_SISTEM` | Mengaktifkan / menonaktifkan akun pengguna. Akun nonaktif langsung ditolak saat mencoba login atau mengakses API. |

---

## 3. Modul Klien & PIC Kontak (`/api/v1/clients`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/clients` | Semua Peran | Mengambil daftar perusahaan klien terdaftar dengan fitur pencarian dan paginasi. |
| `POST` | `/api/v1/clients` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Mendaftarkan perusahaan klien baru beserta lokasi utama dan kontak PIC primer. Menolak jika diakses oleh Inspector/Pimpinan. |
| `GET` | `/api/v1/clients/:id` | Semua Peran | Rincian lengkap perusahaan klien, daftar cabang/lokasi, kontak PIC, dan riwayat PO. |
| `PUT` | `/api/v1/clients/:id` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Memperbarui informasi legalitas klien (nama, NPWP, alamat industri, email resmi). |
| `POST` | `/api/v1/clients/:id/locations` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Menambahkan lokasi operasional atau pabrik cabang klien. |
| `GET` | `/api/v1/clients/:id/pics` | Semua Peran | Mengambil seluruh kontak PIC terdaftar untuk klien yang bersangkutan. |
| `POST` | `/api/v1/clients/:id/pics` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Menambahkan kontak PIC baru (HSE Manager, Facility Head, Admin K3, dsb). |
| `PATCH`| `/api/v1/clients/:id/pics/:picId` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Memperbarui data kontak PIC (nama, jabatan, nomor WA, status penerima pengingat sertifikat). |
| `DELETE`| `/api/v1/clients/:id/pics/:picId` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Menonaktifkan kontak PIC klien. |
| `GET` | `/api/v1/clients/:id/equipment-history` | Semua Peran | Menampilkan riwayat riksa uji seluruh alat yang dimiliki klien lintas PO. |

---

## 4. Modul Objek Uji K3 (`/api/v1/objects`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/objects` | Semua Peran | Menampilkan inventaris alat uji K3 dengan filter klien, bidang, kelompok alat, dan status. |
| `POST` | `/api/v1/objects` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Mendaftarkan unit alat baru dengan hierarki 3-level (*Domain → Kelompok/Jenis Alat → Nama/Tipe Alat*). Menolak duplikasi nomor seri untuk klien yang sama. |
| `GET` | `/api/v1/objects/:id` | Semua Peran | Rincian spesifikasi teknis unit, riwayat pemeriksaan, sertifikat Suket K3, dan QR code verifikasi. |
| `PUT` | `/api/v1/objects/:id` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Memperbarui spesifikasi teknis alat (kapasitas, nomor seri, manufaktur, lokasi pemasangan). |
| `POST` | `/api/v1/objects/bulk-import` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Impor massal ratusan unit alat sekaligus melalui berkas CSV terstruktur. |
| `GET` | `/api/v1/objects/:id/qr` | Semua Peran | Menghasilkan kode QR resmi untuk stiker fisik yang ditempel pada badan alat di pabrik klien. |

---

## 5. Modul Master Taksonomi 3-Level (`/api/v1/equipment-types`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/equipment-types/domains` | Semua Peran | Mengambil daftar 7 Bidang Riksa Uji resmi (PAA/PAPA, PUBT, PTP, ILPP, IPK, ELEVATOR_ESKALATOR, ANCHOR_LIFELINE). |
| `POST` | `/api/v1/equipment-types/domains` | `ADMIN_SISTEM` | Menambahkan bidang riksa uji baru. |
| `PUT` | `/api/v1/equipment-types/domains/:code` | `ADMIN_SISTEM` | Mengubah informasi bidang riksa uji. |
| `PATCH`| `/api/v1/equipment-types/domains/:code/status` | `ADMIN_SISTEM` | Toggle status aktif bidang riksa uji. |
| `DELETE`| `/api/v1/equipment-types/domains/:code` | `ADMIN_SISTEM` | Menghapus bidang jika belum direferensikan oleh kelompok alat. |
| `GET` | `/api/v1/equipment-types/groups` | Semua Peran | Mengambil daftar Kelompok / Jenis Alat (Level 2) terfilter per domain (misal: Forklift, Mobile Crane). |
| `POST` | `/api/v1/equipment-types/groups` | `ADMIN_SISTEM` | Menambahkan kelompok alat baru. |
| `GET` | `/api/v1/equipment-types/groups/:id` | Semua Peran | Rincian kelompok alat beserta seluruh nama alat di bawahnya. |
| `PUT` | `/api/v1/equipment-types/groups/:id` | `ADMIN_SISTEM` | Memperbarui data kelompok alat. |
| `PATCH`| `/api/v1/equipment-types/groups/:id/status` | `ADMIN_SISTEM` | Toggle status aktif kelompok alat. |
| `DELETE`| `/api/v1/equipment-types/groups/:id` | `ADMIN_SISTEM` | Menghapus kelompok alat jika belum menaungi nama alat aktif (409 Conflict protection). |
| `GET` | `/api/v1/equipment-types` (atau `/names`) | Semua Peran | Mengambil daftar Nama / Tipe Alat (Level 3) (misal: REACH STACKER, OVERHEAD CRANE). |
| `POST` | `/api/v1/equipment-types` (atau `/names`) | `ADMIN_SISTEM` | Mendaftarkan nama alat baru lengkap dengan skema atribut teknis. |
| `GET` | `/api/v1/equipment-types/:id` | Semua Peran | Rincian nama alat spesifik. |
| `PUT` | `/api/v1/equipment-types/:id` | `ADMIN_SISTEM` | Memperbarui spesifikasi nama alat. |
| `PATCH`| `/api/v1/equipment-types/:id/status` | `ADMIN_SISTEM` | Toggle status aktif nama alat. |
| `DELETE`| `/api/v1/equipment-types/:id` | `ADMIN_SISTEM` | Menghapus nama alat jika belum digunakan pada objek uji aktif. |
| `GET` | `/api/v1/equipment-types/inspection-types` | Semua Peran | Mengambil 4 jenis riksa resmi (Pertama, Berkala, Khusus, Ulang). |

---

## 6. Modul Order & Purchase Order Multi-Unit (`/api/v1/orders`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/orders` | Semua Peran | Menampilkan daftar PO dengan status progres agregat, filter klien, tanggal, dan status. |
| `POST` | `/api/v1/orders` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Membuat PO baru dengan multi-unit alat sekaligus. Menolak duplikasi nomor PO. |
| `GET` | `/api/v1/orders/:id` | Semua Peran | Rincian lengkap PO: metadata komersial, daftar unit alat, status independen per unit, penugasan inspector, dan berkas terlampir. |
| `PATCH`| `/api/v1/orders/:id` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Memperbarui informasi PO (catatan, tanggal target, lampiran SPK/PO). |
| `POST` | `/api/v1/orders/:id/units` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Menambahkan unit alat baru ke dalam PO yang sedang berjalan tanpa mengganggu unit yang sudah berproses. |
| `PATCH`| `/api/v1/orders/:id/units/:objectId` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Memperbarui jadwal usulan atau catatan khusus pada unit tertentu di dalam PO. |
| `DELETE`| `/api/v1/orders/:id/units/:objectId` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Menghapus unit dari PO jika unit belum dimulai inspeksinya. |
| `PATCH`| `/api/v1/orders/:id/cancel` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR` | Membatalkan PO berstatus awal (TERDAFTAR) dan mencatat alasan pembatalan ke log audit. |

---

## 7. Modul Penjadwalan & Penugasan Inspector (`/api/v1/schedules`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/schedules` | Semua Peran | Mengambil agenda kalender jadwal riksa uji. |
| `POST` | `/api/v1/schedules` | `ADMIN_SISTEM`, `ADMIN_KANTOR` | Menetapkan tanggal pelaksanaan inspeksi untuk order / unit alat. |
| `POST` | `/api/v1/schedules/assign` | `ADMIN_SISTEM`, `ADMIN_KANTOR` | Menugaskan Inspector/Ahli K3 ke unit alat tertentu. Memverifikasi keabsahan lisensi SKP Ahli K3 dan mendeteksi jadwal bentrok (*conflict detection*). |
| `GET` | `/api/v1/schedules/conflicts` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `AHLI_K3` | Mengecek ketersediaan jadwal Ahli K3 pada rentang jam/tanggal tertentu. |
| `GET` | `/api/v1/schedules/assignments/:id/letter` | Terautentikasi (Penugasan Terkait) | Menghasilkan dan mengunduh berkas PDF Surat Tugas resmi untuk Ahli K3. |

---

## 8. Modul Pemeriksaan Lapangan & Checklist (`/api/v1/inspections`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/inspections` | Semua Peran Terautentikasi | Mengambil antrean inspeksi. Inspector dibatasi hanya melihat tugas miliknya sendiri; Admin & Pimpinan melihat semua. |
| `GET` | `/api/v1/inspections/templates/resolve` | Terautentikasi | Resolver otomatis: menemukan checklist template aktif paling spesifik sesuai Nama Alat, Kelompok Alat, dan Jenis Pemeriksaan. |
| `POST` | `/api/v1/inspections/:id/start` | `AHLI_K3` (Penugasan Sah) | Memulai inspeksi lapangan untuk unit terkait (status unit berubah: `SEDANG_DIINSPEKSI`). |
| `PUT` | `/api/v1/inspections/:id/draft` | `AHLI_K3` (Penugasan Sah) | Menyimpan draf isian checklist, nilai pengukuran dimensi/beban, dan catatan sementara. Mendukung penyimpanan bertahap dari mode offline. |
| `POST` | `/api/v1/inspections/:id/findings` | `AHLI_K3` (Penugasan Sah) | Mencatat temuan ketidaksesuaian teknis dan rekomendasi perbaikan K3. |
| `POST` | `/api/v1/inspections/:id/signatures`| `AHLI_K3` (Penugasan Sah) | Mengunggah tanda tangan digital (Ahli K3 & Perwakilan Klien) format PNG Base64. |
| `POST` | `/api/v1/inspections/:id/photos` | `AHLI_K3` (Penugasan Sah) | Mengunggah foto dokumentasi visual alat (pelat nama, tampak keseluruhan, komponen kritis, temuan cacat). Menolak berkas executable/skrip (.exe, .sh). |
| `POST` | `/api/v1/inspections/:id/submit` | `AHLI_K3` (Penugasan Sah) | Mengirimkan hasil inspeksi ke Admin Kantor untuk QC. Otomatis menghasilkan draf awal LHPP & BAP. Unit terkunci dari modifikasi lebih lanjut oleh Inspector kecuali diminta revisi. |

---

## 9. Modul Template & Dokumen LHPP (`/api/v1/lhpp` & `/api/v1/lhpp-templates`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/lhpp-templates` | Semua Peran | Mengambil katalog template LHPP dinamis beserta versi aktifnya. |
| `GET` | `/api/v1/lhpp-templates/resolve` | Terautentikasi | Menyelesaikan template LHPP resmi berdasarkan bidang dan kelompok unit. |
| `POST` | `/api/v1/lhpp-templates` | `ADMIN_SISTEM` | Membuat template LHPP dinamis baru. |
| `POST` | `/api/v1/lhpp-templates/:id/versions` | `ADMIN_SISTEM` | Menerbitkan versi baru (*Copy-on-Write Versioning*) tanpa merusak riwayat dokumen lampau. |
| `GET` | `/api/v1/lhpp/:id` | Terautentikasi | Mengambil data draf LHPP, nilai teknis, dan riwayat revisi. |
| `POST` | `/api/v1/lhpp/:id/request-revision` | `ADMIN_KANTOR`, `ADMIN_SISTEM` | Meminta perbaikan teknis/administratif kepada Inspector dengan target seksi spesifik (`targetSection`). |
| `POST` | `/api/v1/lhpp/:id/resubmit` | `AHLI_K3` (Penugasan Sah) | Inspector mengirim kembali hasil revisi setelah memperbaiki seksi yang diminta. |
| `GET` | `/api/v1/lhpp/:id/preview` | `ADMIN_KANTOR`, `ADMIN_SISTEM` | Menghasilkan pratinjau berkas PDF atau DOCX LHPP yang identik dengan cetak fisik resmi. |
| `POST` | `/api/v1/lhpp/:id/finalize` | `ADMIN_KANTOR`, `ADMIN_SISTEM` | Finalisasi resmi LHPP: menerbitkan nomor resmi, mengunci berkas permanen (immutability snapshot), menghitung hash SHA-256, dan menerbitkan draf BAP otomatis. Inspector dan Pimpinan ditolak 403. |
| `GET` | `/api/v1/lhpp/:id/download` | Terautentikasi | Mengunduh berkas resmi PDF/DOCX LHPP yang telah difinalisasi. |

---

## 10. Modul Berita Acara Pemeriksaan BAP (`/api/v1/bap`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/bap` | Terautentikasi | Mengambil daftar dokumen BAP dengan filter nomor PO, klien, dan status kelulusan. |
| `GET` | `/api/v1/bap/:id` | Terautentikasi | Mengambil rincian berkas BAP. |
| `PATCH`| `/api/v1/bap/:id` | `ADMIN_KANTOR`, `ADMIN_SISTEM` | Memperbarui kesimpulan hasil pengujian BAP dan tanggal penandatanganan. |
| `GET` | `/api/v1/bap/:id/preview` | `ADMIN_KANTOR`, `ADMIN_SISTEM` | Pratinjau PDF & DOCX BAP sebelum difinalisasi. |
| `POST` | `/api/v1/bap/:id/finalize` | `ADMIN_KANTOR`, `ADMIN_SISTEM` | Finalisasi resmi BAP. Mewajibkan LHPP unit bersangkutan difinalisasi terlebih dahulu (Urutan Dokumen LHPP → BAP). |
| `GET` | `/api/v1/bap/:id/pdf` | Terautentikasi | Mengunduh PDF resmi BAP satuan. |
| `GET` | `/api/v1/bap/orders/:orderId/batch-pdf`| Terautentikasi | Mengunduh seluruh berkas BAP unit dalam satu bundle PDF PO. |

---

## 11. Modul Suket K3 & Stiker QR (`/api/v1/suket` & `/api/v1/verify`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/suket` | Terautentikasi | Registri Surat Keterangan K3 dari Disnaker beserta masa berlaku sertifikasi. |
| `POST` | `/api/v1/suket` | `ADMIN_KANTOR`, `ADMIN_SISTEM` | Mendaftarkan nomor Suket resmi, masa berlaku, dan mengunggah berkas scan SK Disnaker. |
| `GET` | `/api/v1/suket/:id/qr-sticker`| `ADMIN_KANTOR`, `ADMIN_SISTEM` | Menghasilkan dokumen cetak Stiker QR tahan air untuk ditempel pada unit alat. |
| `GET` | `/api/v1/verify/:code` | Publik (Tanpa Autentikasi) | Mengembalikan metadata validitas dokumen (perusahaan, nama alat, tanggal pengujian, masa berlaku, status laik pakai) tanpa membocorkan kredensial. |

---

## 12. Modul Distribusi Berkas & BAST (`/api/v1/distributions`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/distributions` | Terautentikasi | Mengambil antrean pelacakan pengiriman berkas ke Klien dan Disnaker. |
| `POST` | `/api/v1/distributions` | `ADMIN_KANTOR`, `ADMIN_SISTEM` | Membuat berkas distribusi untuk unit atau PO tertentu via email / kurir fisik. Pimpinan ditolak 403. |
| `PATCH`| `/api/v1/distributions/:id/status`| `ADMIN_KANTOR`, `ADMIN_SISTEM` | Memperbarui status distribusi (DIKIRIM, DITERIMA) dengan wajib menyertakan bukti tanda terima / nomor resi pengiriman. |
| `GET` | `/api/v1/distributions/:id/bast-pdf`| Terautentikasi | Menghasilkan dan mengunduh Berita Acara Serah Terima (BAST PDF resmi). |

---

## 13. Modul Pencarian Global & Antrean Kerja (`/api/v1/search`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/search` | Terautentikasi | Pencarian terpadu lintas PO, Nomor Seri Alat, Klien, Nomor Dokumen LHPP/BAP, dan Suket. Minimal 2 karakter. |
| `GET` | `/api/v1/search/work-queue` | Terautentikasi | Mengambil antrean kerja terpadu (Work Queue) yang diurutkan berdasarkan urgensi tertinggi (Overdue, Pending QC, Siap Finalisasi). |

---

## 14. Modul Pengaturan Sistem, Penomoran & Backup (`/api/v1/system-settings`)

| Metode | Endpoint | Guard / Otorisasi | Fungsi Bisnis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/system-settings` | `ADMIN_SISTEM` | Mengambil konfigurasi lengkap sistem: profil perusahaan, kop surat, pola penomoran surat otomatis, dan status koneksi gateway. Menyamarkan (*masking*) rahasia API key / password. |
| `PUT` | `/api/v1/system-settings` | `ADMIN_SISTEM` | Memperbarui parameter sistem dan pola penomoran surat. Wajib menyertakan tag `{COUNTER}`. |
| `POST` | `/api/v1/system-settings/test-smtp` | `ADMIN_SISTEM` | Menguji konektivitas server SMTP email. Melaporkan kegagalan secara jujur jika kredensial tidak valid. |
| `POST` | `/api/v1/system-settings/test-wa` | `ADMIN_SISTEM` | Menguji konektivitas WhatsApp Gateway. |
| `POST` | `/api/v1/system-settings/backups` | `ADMIN_SISTEM` | Menghasilkan snapshot backup database SQL PostgreSQL utuh beserta checksum SHA-256. |
| `GET` | `/api/v1/system-settings/backups/:id/download` | `ADMIN_SISTEM` | Mengunduh berkas backup database SQL terproteksi hak akses Super Admin. |

