# Glosarium Terminologi UI Bahasa Indonesia
**PT Upaya Riksa Daya — Standar Bahasa & Komunikasi Antarmuka**

Dokumen ini adalah acuan baku peristilahan antarmuka (UI Copy) untuk seluruh modul, tabel, tombol, formulir, dan pesan sistem di aplikasi PT Upaya Riksa Daya. Seluruh antarmuka harus menggunakan istilah yang konsisten dan profesional sesuai regulasi K3 Kementerian Ketenagakerjaan RI.

---

## 1. Entitas Bisnis & Konsep Utama

| Istilah Baku | Istilah Tidak Baku / Dilarang | Definisi & Konteks Penggunaan |
|---|---|---|
| **Klien** | Customer, Pelanggan, User, Client | Perusahaan pemberi kerja atau pemilik alat uji K3. |
| **PIC (Person in Charge)** | Kontak, Contact Person, Narahubung | Perwakilan resmi dari perusahaan klien yang menangani proses riksa uji. |
| **PO (Purchase Order)** | Pesanan, Order Penjualan, SPK | Dokumen kontrak pemesanan riksa uji yang diterbitkan oleh klien. |
| **Order Pemeriksaan** | Tiket, Request, Job | Rekaman internal sistem URD yang mencakup satu PO dan seluruh unit alat di dalamnya. |
| **Objek Uji K3** | Mesin, Barang, Asset, Alat | Objek, mesin, instalasi, atau peralatan kerja yang wajib diuji sesuai norma K3. |
| **Unit Alat** | Item, Unit Mesin, Pcs | Satuan individual objek uji yang diperiksa secara terpisah dalam satu PO. |
| **Ahli K3** | Inspector, Pemeriksa, Petugas Lapangan | Tenaga ahli K3 bersertifikat SKP resmi Disnaker/Kemnaker yang bertugas menguji alat di lapangan. |
| **Surat Tugas** | SPK Inspector, Penugasan | Surat resmi penugasan Ahli K3 untuk melaksanakan pemeriksaan di lokasi klien. |
| **Jadwal & Agenda** | Scheduling, Kalender | Perencanaan tanggal, lokasi, dan Ahli K3 yang ditugaskan ke lapangan. |
| **Form Pengujian Lapangan** | Inspection Form, Lembar Uji | Formulir teknis digital (checklist, pengukuran, temuan) yang diisi Ahli K3 di lokasi uji. |
| **Checklist & Pengukuran** | Checklist, Pengujian | Butir pemeriksaan visual dan pengukuran teknis sesuai standar regulasi K3. |
| **Temuan & Rekomendasi K3** | Finding, Masalah, Kerusakan | Catatan ketidaksesuaian teknis dan rekomendasi perbaikan berbasis regulasi. |
| **BAP (Berita Acara Pemeriksaan)** | Berita Acara, BAP Lapangan | Dokumen ringkasan hasil pemeriksaan yang ditandatangani Ahli K3 dan perwakilan klien di lapangan. |
| **LHPP (Laporan Hasil Pemeriksaan & Pengujian)** | Laporan Inspeksi, Report | Laporan teknis lengkap dan komprehensif yang telah melalui proses QC dan siap diterbitkan. |
| **Suket K3** | Suket, Sertifikat, Izin Alat | Surat Keterangan K3 resmi yang diterbitkan oleh instansi Ketenagakerjaan (Disnaker/Kemnaker). |
| **BAST (Berita Acara Serah Terima)** | Tanda Terima Dokumen | Dokumen bukti penyerahan berkas fisik (LHPP, Suket K3, dan Stiker QR) kepada klien. |
| **Stiker QR** | QR Code, Barcode | Stiker fisik ber-QR yang ditempelkan pada unit alat untuk verifikasi keabsahan secara digital. |
| **QC (Quality Control)** | Tinjauan QC, Verifikasi Admin | Proses audit mutu teknis dan verifikasi kelengkapan dokumen oleh Admin Kantor sebelum terbit. |
| **Revisi** | Koreksi, Perbaikan | Pengembalian berkas pengujian kepada Ahli K3 disertai catatan spesifik yang perlu diperbaiki. |

---

## 2. Aksi Antarmuka (Button & Action Labels)

| Aksi Baku | Padanan Bahasa Inggris | Penggunaan |
|---|---|---|
| **Simpan** | Save | Menyimpan perubahan formulir atau pengaturan. |
| **Simpan Draf** | Save Draft | Menyimpan progres pemeriksaan lapangan tanpa mengunci dokumen. |
| **Kirim Hasil Uji** | Submit Final | Mengunci formulir pemeriksaan lapangan dan menyerahkan ke antrean QC. |
| **Ubah** | Edit | Membuka modal/formulir pengubahan data. |
| **Hapus** | Delete | Menghapus rekaman (wajib dialog konfirmasi). |
| **Batal** | Cancel | Membatalkan input formulir atau menutup modal tanpa menyimpan. |
| **Unduh PDF** | Download PDF | Mengunduh berkas dokumen resmi dalam format PDF. |
| **Pratinjau Dokumen** | Preview Document | Menampilkan tampilan cetak dokumen di dalam aplikasi. |
| **Buka Kunci untuk Revisi** | Reopen for Revision | Mengembalikan lembar uji ke status draf untuk perbaikan teknis. |
| **Muat Ulang** | Retry / Reload | Memanggil ulang data saat terjadi galat jaringan. |
| **Tutup** | Close | Menutup dialog atau notifikasi. |
| **Impor CSV** | Import CSV | Mengunggah daftar objek uji atau PO secara massal. |
| **Cari** | Search | Kolom pencarian data. |
| **Aksi** | Action | Judul kolom tabel aksi (bukan "Tindakan"). |

---

## 3. Label Status Bisnis (Status Labels)

### Status Order & PO
- `ORDER_BARU`: **Order Baru** (menunggu penjadwalan)
- `TERDAFTAR`: **PO Terdaftar**
- `TERJADWAL`: **Terjadwal**
- `DITUGASKAN`: **Ditugaskan**
- `SEDANG_DIPERIKSA`: **Sedang Diperiksa**
- `MENUNGGU_LAPORAN`: **Menunggu Laporan**
- `MENUNGGU_DOKUMEN`: **Menunggu Dokumen**
- `SELESAI`: **Selesai**
- `DIBATALKAN`: **Dibatalkan**

### Status Dokumen LHPP & BAP
- `DRAF`: **Draf**
- `SIAP_PREVIEW`: **Siap Pratinjau**
- `FINAL`: **Final (Terkunci)**
- `TERBIT`: **Terbit (Terkunci)**
- `DIKEMBALIKAN`: **Perlu Revisi (QC)**

### Kesimpulan Kelayakan K3
- `MEMENUHI_SYARAT`: **Memenuhi Syarat K3**
- `MEMENUHI_SYARAT_DENGAN_CATATAN`: **Memenuhi Syarat dengan Catatan**
- `TIDAK_MEMENUHI_SYARAT`: **Tidak Memenuhi Syarat**

---

## 4. Pola Pesan Sistem (Notifications & Errors)

- **Pesan Berhasil:** Langsung, informatif, dan tanpa tanda seru berlebihan.
  - *Contoh:* "Data klien PT Nusantara Power berhasil diperbarui."
  - *Contoh:* "Checklist dan foto pemeriksaan unit Crane-01 telah tersimpan."
- **Pesan Galat (Error):** Menjelaskan kendala secara manusiawi dan memberikan solusi pemulihan.
  - *Contoh:* "Gagal memuat jadwal tim. Periksa koneksi internet Anda lalu klik Muat Ulang."
  - *Bukan:* "Oops! Terjadi error 500."
- **Pesan Kosong (Empty State):** Memberikan konteks dan satu langkah selanjutnya yang jelas.
  - *Contoh:* "Belum ada PO pemeriksaan terdaftar. Klik + Buat PO untuk menambahkan order baru."

