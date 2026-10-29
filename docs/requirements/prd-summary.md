# Ringkasan Kebutuhan Produk (PRD Summary): PT Upaya Riksa Daya

Dokumen ini merangkum kebutuhan fungsional dan nonfungsional dari `PRODUCT REQUIREMENTS DOCUMENT - PT UPAYA RIKSA DAYA V.0.1.pdf` (19 halaman, 25 Maret 2026) yang disesuaikan dengan arsitektur teknis wajib proyek.

## 1. Tujuan Bisnis & Operasional

Membangun aplikasi web internal **PT Upaya Riksa Daya** untuk mendigitalisasi siklus operasional Perusahaan Jasa K3 (PJK3) bidang Pemeriksaan dan Pengujian (Riksa Uji K3) dari hulu ke hilir:
1. Mengeliminasi keterlambatan penyusunan Laporan Hasil Pemeriksaan dan Pengujian (LHPP) akibat pencatatan kertas di lapangan.
2. Mencegah bentrok jadwal penugasan Ahli K3 dan memastikan setiap Ahli K3 yang ditugaskan memiliki SKP/sertifikat kompetensi aktif yang sesuai dengan bidang objek uji.
3. Memantau seluruh Surat Keterangan (Suket) K3 milik klien dan mengirimkan pengingat otomatis (`H-90`, `H-60`, `H-30`, `H-14`, `H0`) agar peluang repeat order perpanjangan tidak terlewat.
4. Menyediakan jejak audit (audit trail) permanen untuk setiap aktivitas kritikal.

## 2. Peran Pengguna (RBAC)

| Kode Peran | Nama Peran | Tanggung Jawab Utama |
|---|---|---|
| `ADMIN_SISTEM` | Administrator Sistem | Mengelola akun pengguna internal, konfigurasi template, akses penuh ke seluruh modul operasional dan audit trail. |
| `ADMIN_KANTOR` | Admin Kantor / Operasional | Mengelola database klien & objek uji, membuat order riksa uji, menjadwalkan dan menugaskan Ahli K3, mengelola registri Suket K3, serta menindaklanjuti pengingat perpanjangan. |
| `AHLI_K3` | Ahli K3 / Inspektur Lapangan | Menerima/menolak penugasan, mengunduh Surat Tugas, mengisi lembar kerja inspeksi digital di lapangan, mengunggah foto temuan, membubuhkan tanda tangan digital, dan menyusun draf LHPP. |
| `PIMPINAN` | Pimpinan / Reviewer Teknis | Memantau KPI eksekutif pada dashboard, melakukan review teknis dan persetujuan final LHPP (atau mengembalikan untuk revisi), serta memeriksa audit log. |

## 3. Modul Fungsional Utama

1. **Autentikasi, Sesi & RBAC**: Login dengan email & kata sandi, JWT access token + HttpOnly refresh session rotation, proteksi route frontend & endpoint backend.
2. **Manajemen Klien & Master Objek Uji K3**: CRUD perusahaan klien, multi-lokasi kerja (plant/site), multi-kontak PIC, CRUD peralatan/objek uji pada 7 bidang K3 (`PAA`, `PTP`, `PUBT`, `LIS`, `IPP`, `LE`, `IPK`), validasi nomor seri unik per klien, impor CSV, dan generator label QR Code peralatan.
3. **Manajemen Order Riksa Uji**: Pembuatan order (`PERTAMA`, `BERKALA`, `KHUSUS`, `ULANG`), pemilihan multi-objek uji, pelacakan status (`DRAFT` -> `TERKONFIRMASI` -> `DIJADWALKAN` -> `DALAM_PELAKSANAAN` -> `MENUNGGU_LHPP` -> `MENUNGGU_REVIEW` -> `MENUNGGU_SUKET` -> `SELESAI` / `DIBATALKAN`), dan riwayat perubahan status.
4. **Penjadwalan & Penugasan Ahli K3**: Kalender jadwal harian/mingguan/bulanan, deteksi bentrok jadwal otomatis (`409 SCHEDULE_CONFLICT`), verifikasi kompetensi SKP Ahli K3 terhadap kategori objek uji (`422 COMPETENCY_MISMATCH`), konfirmasi terima/tolak oleh Ahli K3, dan cetak Surat Tugas PDF.
5. **Pelaksanaan Inspeksi Digital (Mobile-First)**: Template checklist K3 ber-versi dengan penanda validasi Ahli K3, auto-save draft lokal (`localStorage`) dan sinkronisasi server, validasi ambang batas numerik otomatis, pencatatan temuan (`KRITIS`, `MAYOR`, `MINOR`) beserta unggah foto, tanda tangan digital (`AHLI_K3` dan `PERWAKILAN_KLIEN`), penguncian pasca-submit, dan prosedur pembukaan kunci dengan alasan revisi.
6. **Penyusunan LHPP & Alur Persetujuan**: Pembuatan draf LHPP otomatis dari hasil inspeksi terkunci, pengajuan review teknis, keputusan Pimpinan (`APPROVE_TECHNICAL`, `APPROVE_FINAL`, `RETURN` dengan catatan wajib), penomoran otomatis unik (`LHPP/<KATEGORI>/<BULAN_ROMAWI>/<TAHUN>/<URUT>`), ekspor PDF resmi ber-QR Code verifikasi, dan pencatatan bukti serah terima ke klien.
7. **Registri Suket K3 & Pengingat Masa Berlaku**: Pencatatan nomor Suket Disnaker, tanggal terbit & jatuh tempo, unggah scan PDF/foto Suket, evaluasi otomatis pengingat `H-90`, `H-60`, `H-30`, `H-14`, dan `H0` tanpa duplikasi, log tindak lanjut (follow-up), serta pembuatan order riksa uji perpanjangan dalam 1 klik.
8. **Dashboard Operasional & Audit Trail**: Ringkasan KPI waktu nyata, distribusi status order, peringatan jatuh tempo Suket K3, pusat notifikasi dalam aplikasi, dan tabel `audit_logs` bersifat append-only.

