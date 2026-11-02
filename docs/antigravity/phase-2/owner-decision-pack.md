# Paket Keputusan Manajemen (Owner Decision Pack) — URD Phase 2

Tanggal: 2 November 2026  
Status Dokumen: **PENDING EXECUTIVE APPROVAL (MEMBUTUHKAN PERSETUJUAN DIREKSI)**  
Rujukan Aturan: `AGENTS.md` (Product-Engineering Mindset & Governance Rules)  
Disiapkan oleh: Principal Product Engineer & Software Architect  
Ditujukan kepada: Direktur Utama / Manajemen PT Upaya Riksa Daya  

---

## 1. Pengantar & Tujuan Dokumen

Sistem operasional digital PT Upaya Riksa Daya telah menyelesaikan pengujian integrasi database, penegakan hak akses (*Least Privilege*), pengujian ketahanan offline, dan simulasi operasional end-to-end (UAT) dengan skor kelulusan 100%.

Sebelum sistem dideploy ke lingkungan produksi untuk melayani klien nyata, terdapat 5 area kebijakan bisnis dan operasional yang tidak boleh diputuskan secara sepihak oleh tim rekayasa perangkat lunak. Dokumen ini menyajikan analisis komprehensif, opsi keputusan, rekomendasi teknis, serta dampak operasional untuk memfasilitasi keputusan cepat dan tepat dari Manajemen.

---

## 2. Paket Keputusan Strategis

---

### KEPUTUSAN 1: Jadwal, Interval & Penanggung Jawab Reminder Perpanjangan

#### A. Masalah Bisnis
Suket K3 dan sertifikat pengujian alat industri memiliki masa berlaku hukum 1 tahun (atau sesuai kategori alat). Klien korporat umumnya membutuhkan waktu 30 hingga 60 hari untuk proses persetujuan anggaran dan penerbitan Purchase Order (PO) baru. Jika pengingat terlambat dikirim, alat klien berisiko beroperasi tanpa izin sah (melanggar UU No. 1 Tahun 1970) dan PT Upaya Riksa Daya berisiko kehilangan pendapatan berulang (*recurring revenue*).

#### B. Kondisi Sistem Saat Ini
- Kode scheduler pada `backend/src/services/client-reminders.js` dan tabel `renewal_followups` secara teknis siap mengirimkan pesan otomatis melalui Email dan WhatsApp.
- Interval default yang saat ini terpasang di kode adalah **H-30, H-14, dan H-7**.
- Belum ada penunjukan peran (*ownership*) yang bertanggung jawab melakukan panggilan telepon langsung apabila pesan otomatis H-7 tidak direspons oleh klien.

#### C. Pilihan Keputusan yang Tersedia
- **Opsi A (Standard 30 Hari):** Notifikasi dikirim pada H-30, H-14, dan H-7.
- **Opsi B (Enterprise 60 Hari - Rekomendasi):** Notifikasi dikirim pada H-60 (Email resmi penawaran awal), H-30 (WhatsApp ke PIC teknis), H-14 (WhatsApp & Email reminder), dan H-7 (Eskalasi ke Marketing).
- **Opsi C (Kustom per Kategori Risiko):** H-60 untuk alat berisiko tinggi (PUBT/Bejana Tekan & Boiler), H-30 untuk alat utilitas umum (Genset/PTP dan Instalasi Listrik).

#### D. Rekomendasi Teknis
Memilih **Opsi B**. Interval 60 hari memberikan ruang yang memadai bagi tim procurement klien untuk memproses penawaran harga hingga PO terbit, serta mengurangi risiko inspeksi terburu-buru di masa kedaluwarsa.

#### E. Dampak Operasional
- Marketing memiliki waktu 2 bulan untuk menindaklanjuti kontrak perpanjangan.
- Mengurangi lonjakan beban kerja darurat bagi Ahli K3 akibat permintaan inspeksi mendadak di akhir masa berlaku.

#### F. Dampak terhadap Database & Sistem
- Penyesuaian konstanta interval pada konfigurasi scheduler `backend/src/services/client-reminders.js`.
- Tidak memerlukan perubahan skema tabel PostgreSQL.

#### G. Risiko jika Ditunda
Notifikasi akan berjalan menggunakan default H-30. Klien dengan birokrasi pengadaan panjang berpotensi terlambat menerbitkan PO baru.

#### H. Pihak Penandatangan Persetujuan
- Direktur Operasional & Manajer Marketing.

---

### KEPUTUSAN 2: SOP Pembatalan, Koreksi & Reissue Dokumen Resmi (LHPP & BAP)

#### A. Masalah Bisnis
Setelah LHPP dan BAP difinalisasi oleh Admin Kantor, dokumen tersebut berstatus legal dan nomor surat resmi tercatat di database serta dapat diverifikasi publik melalui stiker QR. Dalam operasional riil, terkadang terjadi kesalahan ketik data nameplate (misalnya nomor seri alat tertukar satu digit) atau adanya permintaan koreksi administratif dari pengawas ketenagakerjaan Disnaker setempat setelah laporan fisik diserahkan.

#### B. Kondisi Sistem Saat Ini
- Sistem mendukung revisi draf sebelum finalisasi (`POST /api/v1/inspections/:id/reopen`).
- Begitu dokumen difinalisasi (`status: FINAL / TERBIT`), sistem mengunci record secara permanen (*immutable*) guna mencegah manipulasi data.
- Belum ada alur resmi untuk pembatalan (*cancel*) atau penerbitan ulang (*reissue*) dokumen yang sudah terbit.

#### C. Pilihan Keputusan yang Tersedia
- **Opsi A (Penerbitan Dokumen Revisi dengan Akhiran Nomor):** Dokumen lama ditandai `DIBATALKAN`, dokumen baru diterbitkan dengan nomor referensi baru berakhiran `-REV1` (contoh: `001/LHPP-URD/XI/2026-REV1`). QR lama dialihkan ke dokumen revisi terbaru.
- **Opsi B (Berita Acara Pembatalan / Addendum Teknis):** Nomor LHPP asli tetap berlaku, namun sistem menerbitkan lembar lampiran resmi "Berita Acara Perubahan / Addendum" yang ditandatangani Ahli K3 dan Pimpinan.
- **Opsi C (Pencabutan Total & Penerbitan Nomor Baru Penuh):** Dokumen lama dicabut izin edarnya, QR menampilkan peringatan "DOKUMEN DIBATALKAN / TIDAK BERLAKU", dan PO diproses ulang dengan nomor registrasi baru.

#### D. Rekomendasi Teknis
Memilih **Opsi A**. Pendekatan ini mempertahankan jejak audit forensik yang jelas, menjaga integritas nomor seri dokumen, dan memastikan pemindai QR di lapangan diarahkan ke dokumen perbaikan yang sah.

#### E. Dampak Operasional
- Admin Kantor memiliki SOP yang jelas dan terstandarisasi saat menghadapi koreksi Disnaker.
- Mencegah timbulnya dokumen ganda yang beredar di lapangan.

#### F. Dampak terhadap Database & Sistem
- Menambahkan endpoint `POST /api/v1/lhpp/:id/reissue` dan kolom `superseded_by_id` pada tabel `lhpp_documents`.
- Memperbarui halaman verifikasi publik agar menampilkan status jika dokumen telah direvisi.

#### G. Risiko jika Ditunda
Koreksi data pasca-finalisasi harus dilakukan manual di luar sistem, yang berisiko merusak integritas verifikasi QR dan pencatatan riwayat alat.

#### H. Pihak Penandatangan Persetujuan
- Penanggung Jawab Teknis PJK3 & Kepala Kantor Administrasi.

---

### KEPUTUSAN 3: Kebijakan Retensi Berkas Digital & Penanganan Legal Hold

#### A. Masalah Bisnis
Dokumen riksa uji K3 merupakan dokumen kepatuhan hukum yang dapat dijadikan alat bukti di pengadilan apabila terjadi kecelakaan kerja fatal di fasilitas klien. Penyimpanan seluruh foto mentah resolusi tinggi tanpa batas waktu akan membebani kapasitas media penyimpanan, sedangkan penghapusan berkas terlalu dini dapat melanggar hukum pembuktian.

#### B. Kondisi Sistem Saat Ini
- File PDF laporan, lembar BAP, foto temuan inspeksi, dan log audit tersimpan tanpa batas waktu di server.
- Belum ada aturan formal mengenai batas usia simpan dokumen (*retention period*) maupun mekanisme pembekuan data (*legal hold*).

#### C. Pilihan Keputusan yang Tersedia
- **Opsi A (Retensi Minimum 5 Tahun):** Seluruh file aktif disimpan selama 5 tahun (mengikuti masa kedaluwarsa dokumen ketenagakerjaan umum). Setelah 5 tahun, dipindahkan ke arsip dingin (*cold storage*).
- **Opsi B (Retensi 10 Tahun dengan Legal Hold Otomatis - Rekomendasi):** PDF laporan, BAP, dan BAST disimpan permanen (selamanya). Foto temuan inspeksi lapangan disimpan aktif 5 tahun lalu diarsipkan dingin selama 5 tahun (total 10 tahun). Tersedia fitur *Legal Hold* untuk membekukan riwayat unit jika ada investigasi insiden.
- **Opsi C (Simpan Selamanya Tanpa Arsip):** Seluruh data dan foto dipertahankan di storage utama tanpa ada prosedur pengarsipan.

#### D. Rekomendasi Teknis
Memilih **Opsi B**. Dokumen hukum utama (LHPP/BAP) berukuran kecil (PDF beberapa MB) dan wajib dipertahankan selamanya, sedangkan foto visual berukuran gigabyte dapat dioptimalkan siklus simpannya tanpa mengorbankan kepatuhan hukum.

#### E. Dampak Operasional
- Menjamin ketersediaan dokumen riksa uji saat klien diaudit oleh Kemenaker atau asuransi kecelakaan.
- Memberikan kepastian hukum bagi manajemen PT Upaya Riksa Daya.

#### F. Dampak terhadap Database & Sistem
- Konfigurasi lifecycle storage pada server staging/produksi.
- Penambahan flag `is_legal_hold` pada tabel `order_objects`.

#### G. Risiko jika Ditunda
Server storage berpotensi penuh dalam jangka panjang, dan ketiadaan fitur legal hold menimbulkan kerentanan kepatuhan bila terjadi sengketa hukum di pengadilan.

#### H. Pihak Penandatangan Persetujuan
- Direktur Utama & Legal Counsel Perusahaan.

---

### KEPUTUSAN 4: Pemetaan Akun Produksi & Provisioning Personil Nyata

#### A. Masalah Bisnis
Sistem saat ini menggunakan akun percontohan (`admin.sistem`, `marketing`, `inspector.a`, `inspector.b`, `admin.kantor`, `pimpinan`). Peluncuran operasional nyata membutuhkan data otentik personil karyawan, alamat email resmi perusahaan, dan kredensial WhatsApp Gateway.

#### B. Kondisi Sistem Saat Ini
- Struktur database RBAC dan otorisasi telah teruji 100% aman.
- Pengisian data personil nyata ditunda agar tidak mengotori database testing dan menghindari kebocoran nomor kontak pribadi ke log pengujian.

#### C. Pilihan Keputusan yang Tersedia
- **Opsi A (Provisioning Bertahap):** Mendaftarkan 1 akun perwakilan per departemen untuk masa uji coba operasional 2 minggu pertama.
- **Opsi B (Provisioning Lengkap Menyeluruh - Rekomendasi):** Mengumpulkan seluruh data otentik karyawan (Marketing, Admin Kantor, Ahli K3 beserta nomor SKP Kemnaker, Pimpinan) dan memasukkannya ke konfigurasi migration produksi resmi.

#### D. Rekomendasi Teknis
Memilih **Opsi B**. Pendaftaran menyeluruh mencegah jeda waktu operasional saat sistem dialihkan ke produksi penuh dan memastikan penugasan Ahli K3 langsung mencakup seluruh bidang K3 yang dilayani perusahaan.

#### E. Formulir Data yang Wajib Diserahkan Manajemen:
1. Daftar Nama Lengkap, NIK, dan Email resmi `@upayariksadaya.com`.
2. Nomor handphone aktif personil untuk penerimaan kode OTP / notifikasi penugasan WhatsApp.
3. Nomor Surat Keputusan Penunjukan (SKP) Ahli K3, bidang spesialisasi K3, dan tanggal masa berlaku sertifikat fisik.
4. Kredensial akun resmi penyedia WhatsApp Business API dan akun SMTP korporat.

#### F. Risiko jika Ditunda
Deployment produksi tidak dapat dilakukan karena sistem tidak memiliki data pengguna sah yang berhak mengoperasikan alur kerja K3.

#### G. Pihak Penandatangan Persetujuan
- HR & General Affairs Manager bersama Direktur Utama.

---

### KEPUTUSAN 5: Ketentuan Masa Berlaku SKP Ahli K3 & Kebijakan Toleransi (Grace Period)

#### A. Masalah Bisnis
Sesuai regulasi Kemnaker, Ahli K3 hanya berhak menandatangani LHPP jika SKP miliknya berstatus aktif. Namun dalam realitas birokrasi, proses perpanjangan SKP di Kemnaker sering memakan waktu 1 hingga 3 bulan sementara Surat Keterangan Proses Perpanjangan telah diterbitkan oleh kementerian.

#### B. Kondisi Sistem Saat Ini
- Logika sistem pada `backend/src/modules/inspectors/routes.js` secara otomatis memblokir penugasan jika tanggal pemeriksaan melampaui kolom `valid_until` pada database.
- Belum ada fasilitas dispensasi formal.

#### C. Pilihan Keputusan yang Tersedia
- **Opsi A (Zero Tolerance / Blokir Mutlak):** Penugasan ditolak tanpa pengecualian jika SKP kedaluwarsa, tanpa melihat surat keterangan proses kementerian.
- **Opsi B (Dispensasi Terkendali dengan Izin Direktur - Rekomendasi):** Sistem mengizinkan perpanjangan masa tenggang maksimal 60 hari hanya jika diunggah "Surat Tanda Terima Berkas Perpanjangan Kemnaker" resmi dan disetujui secara tertulis melalui otorisasi khusus Super Admin.
- **Opsi C (Pemberitahuan Peringatan Saja):** Sistem hanya menampilkan pesan peringatan tanpa memblokir tombol penugasan.

#### D. Rekomendasi Teknis
Memilih **Opsi B**. Memberikan fleksibilitas operasional yang realistis bagi PJK3 tanpa melanggar kepatuhan hukum, karena setiap dispensasi wajib memiliki bukti dokumen kementerian dan persetujuan manajemen tingkat atas.

#### E. Dampak Operasional
- Menghindari terhentinya layanan riksa uji perusahaan saat ada personil Ahli K3 yang sedang dalam proses perpanjangan berkas di kementerian.

#### F. Dampak terhadap Database & Sistem
- Penambahan kolom `grace_period_until` dan `dispensation_doc_id` pada tabel `user_competencies`.

#### G. Risiko jika Ditunda
Ahli K3 yang berkasnya sedang diproses di kementerian akan langsung terblokir dari penugasan lapangan di sistem.

#### H. Pihak Penandatangan Persetujuan
- Penanggung Jawab Teknis PJK3 & Direktur Operasional.

---

## 3. Matriks Lembar Pengesahan Keputusan

| No | Area Keputusan | Pilihan Rekomendasi | Status Persetujuan | Catatan Direksi |
|:---:|:---|:---|:---:|:---|
| 1 | Jadwal & Interval Reminder | **Opsi B (Enterprise H-60, H-30, H-14, H-7)** | `MENUNGGU PERSETUJUAN` | |
| 2 | SOP Reissue & Pembatalan Dokumen | **Opsi A (Penomoran Revisi -REV1 & Redirect QR)** | `MENUNGGU PERSETUJUAN` | |
| 3 | Kebijakan Retensi & Legal Hold | **Opsi B (PDF Selamanya, Foto 10 Tahun, Legal Hold)** | `MENUNGGU PERSETUJUAN` | |
| 4 | Pemetaan Akun Produksi | **Opsi B (Pengisian Formulir Personil Lengkap)** | `MENUNGGU PERSETUJUAN` | |
| 5 | Toleransi SKP Ahli K3 | **Opsi B (Dispensasi Maks 60 Hari Berbasis Surat Kemnaker)** | `MENUNGGU PERSETUJUAN` | |

> **Instruksi Tindak Lanjut:** Manajemen dapat membubuhkan persetujuan atau catatan penyesuaian pada masing-masing poin di atas. Tim rekayasa perangkat lunak tidak akan mengubah skema database produksi sebelum keputusan tertulis diterbitkan.

