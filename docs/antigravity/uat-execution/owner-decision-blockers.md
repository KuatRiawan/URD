# Catatan Keputusan Pemilik & Item Tertunda (Owner Decision Blockers) — URD Phase 1

Tanggal: 2 November 2026  
Status Dokumen: **PENDING OWNER DECISION / DECISION REQUIRED**  
Rujukan Aturan: `AGENTS.md` (Product-Engineering Mindset & Non-Negotiable Rules)  
Pelaksana: Principal Product Engineer & Software Architect  

---

## 1. Prinsip Penanganan Keputusan Bisnis

Sesuai instruksi tata kelola rekayasa perangkat lunak PT Upaya Riksa Daya:
> *"Jangan menentukan sendiri jadwal reminder, mapping akun produksi, pembatalan/reissue dokumen, retensi, legal hold, atau kebijakan formal pembekuan kompetensi. Gunakan PRD, SOP, dan keputusan bisnis resmi. Catat keputusan yang belum disepakati sebagai `DECISION REQUIRED` dan lanjutkan pekerjaan independen lainnya."*

Dokumen ini mendokumentasikan 5 area strategis yang membutuhkan keputusan formal dari Manajemen / Pemilik PT Upaya Riksa Daya sebelum peluncuran sistem ke lingkungan produksi penuh.

---

## 2. Daftar Keputusan Strategis yang Dibutuhkan

### Area 1: Jadwal, Interval & Penanggung Jawab Reminder Perpanjangan
- **Status:** `DECISION REQUIRED`
- **Kondisi Teknis Saat Ini:**
  - Kode di `backend/src/services/client-reminders.js` dan tabel `renewal_followups` saat ini membaca interval default H-30, H-14, dan H-7 sebelum masa berlaku Suket habis.
  - Pengiriman pesan multi-channel mencakup email dan WhatsApp.
- **Poin Keputusan yang Dibutuhkan dari Owner:**
  1. Apakah interval notifikasi eksternal ke klien cukup H-30, H-14, H-7, atau perlu dimulai lebih awal (misalnya H-60) mengingat proses penganggaran PO di klien korporat membutuhkan waktu persetujuan internal?
  2. Siapa role internal yang ditunjuk sebagai penanggung jawab utama jika notifikasi otomatis ke klien tidak direspons hingga H-7 (apakah Account Executive Marketing atau Admin Kantor)?
  3. Apakah ada perbedaan frekuensi reminder untuk unit berisiko tinggi (kategori PUBT/Bejana Tekan) dibandingkan unit utilitas umum (Genset/PTP)?

---

### Area 2: SOP Pembatalan, Koreksi & Penerbitan Ulang Dokumen Terbit (Cancel & Reissue)
- **Status:** `DECISION REQUIRED`
- **Kondisi Teknis Saat Ini:**
  - Sistem memiliki alur pengembalian revisi draf inspeksi (`POST /inspections/:id/reopen`) sebelum dokumen disahkan.
  - Namun begitu LHPP atau BAP difinalisasi oleh Admin Kantor, status terkunci menjadi `FINAL` dan nomor surat resmi diterbitkan ke publik/klien.
- **Poin Keputusan yang Dibutuhkan dari Owner:**
  1. Jika ditemukan kekeliruan administratif fatal pasca-finalisasi (misalnya salah ketik nomor seri pabrik pada nameplate alat atau koreksi dari pengawas Disnaker setempat), bagaimana format penomoran dokumen revisi:
     - Apakah menerbitkan nomor baru dengan akhiran revisi (contoh: `001/LHPP-URD/XI/2026-REV1`), atau
     - Menerbitkan Berita Acara Koreksi Teknis (Addendum) terpisah tanpa mengubah nomor LHPP asli?
  2. Apakah dokumen lama yang dibatalkan harus dicabut kode verifikasi QR-nya dan menampilkan watermark "DIBATALKAN / TIDAK BERLAKU" saat dipindai oleh pihak ketiga?

---

### Area 3: Kebijakan Retensi Berkas Digital & Penanganan Legal Hold
- **Status:** `DECISION REQUIRED`
- **Kondisi Teknis Saat Ini:**
  - Seluruh file PDF LHPP, BAP, BAST, foto temuan resolusi penuh, dan riwayat audit log tersimpan permanen di database PostgreSQL dan media penyimpanan lokal.
- **Poin Keputusan yang Dibutuhkan dari Owner:**
  1. Berapa lama batas retensi penyimpanan berkas foto inspeksi lapangan (misalnya 5 tahun, 10 tahun, atau selamanya) sejalan dengan ketentuan UU Keselamatan Kerja dan standar audit ISO PJK3?
  2. Bagaimana kebijakan teknis *Legal Hold*: jika suatu saat terjadi insiden kecelakaan kerja pada alat yang diperiksa dan aparat penegak hukum meminta data forensik, apakah sistem perlu tombol pembekuan status (*data freeze*) agar riwayat pengujian alat tersebut tidak dapat diubah oleh peran apa pun termasuk Super Admin?

---

### Area 4: Pemetaan Akun Produksi & Provisioning Karyawan Nyata
- **Status:** `DECISION REQUIRED`
- **Kondisi Teknis Saat Ini:**
  - Database pengujian menggunakan akun percontohan (`admin.sistem`, `marketing`, `inspector.a`, `inspector.b`, `admin.kantor`, `pimpinan`).
- **Poin Keputusan yang Dibutuhkan dari Owner:**
  1. Daftar nama lengkap, NIK, alamat email resmi perusahaan (`@upayariksadaya.com`), dan nomor telepon seluler untuk seluruh personil operasional nyata yang akan dimasukkan ke sistem produksi.
  2. Nomor Surat Keputusan Penunjukan (SKP) Ahli K3 Kemnaker dan masa berlaku sertifikat resmi masing-masing inspektur untuk dimasukkan ke tabel `user_competencies`.
  3. Konfigurasi kredensial resmi WhatsApp Business API / SMTP gateway perusahaan untuk pengiriman pesan nyata.

---

### Area 5: Kebijakan Masa Tenggang (Grace Period) Perpanjangan SKP Ahli K3
- **Status:** `DECISION REQUIRED`
- **Kondisi Teknis Saat Ini:**
  - Logika penugasan inspeksi saat ini secara tegas menolak penugasan jika tanggal pengujian melampaui tanggal `valid_until` pada SKP Ahli K3.
- **Poin Keputusan yang Dibutuhkan dari Owner:**
  1. Dalam praktik lapangan PJK3, perpanjangan SKP di Kementerian Ketenagakerjaan terkadang membutuhkan waktu administrasi beberapa minggu sementara surat tanda terima berkas perpanjangan telah terbit.
  2. Apakah sistem diizinkan memberikan toleransi dispensasi penugasan (*override permission*) oleh Super Admin berdasarkan unggahan "Surat Keterangan Proses Perpanjangan Kemnaker", ataukah sistem harus tetap memblokir total hingga sertifikat SKP fisik baru terbit?

---

## 3. Rencana Tindak Lanjut

Seluruh area teknis yang tidak bergantung pada kelima keputusan di atas telah diselesaikan 100% pada Phase 1. 

Begitu arahan tertulis mengenai poin-poin di atas ditetapkan oleh Manajemen PT Upaya Riksa Daya:
1. Konfigurasi jadwal reminder dapat langsung diaktifkan pada modul scheduler.
2. Skrip migrasi data akun produksi nyata dapat dieksekusi tanpa risiko keamanan.
3. Alur cancel & reissue dokumen dapat dikembangkan mengikuti format penomoran yang disepakati.

