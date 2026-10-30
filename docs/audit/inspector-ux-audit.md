# Audit Desain & Pengalaman Pengguna (UX) Inspector Lapangan
## PT Upaya Riksa Daya

Dokumen ini mengevaluasi dan merinci perbaikan antarmuka pengguna (UI) dan alur kerja (workflow) khusus peran **Inspector (Ahli K3)** pada aplikasi PT Upaya Riksa Daya.

---

## 1. Prinsip Desain Field-First (Ramah Lapangan)

Inspector bekerja di lingkungan industri, pabrik, proyek konstruksi, dan fasilitas teknis. Oleh karena itu, antarmuka khusus Inspector dirancang dengan prinsip:

1. **Responsif Multi-Device (Mobile & Tablet):**
   - Mendukung resolusi layar ponsel 375px (iPhone SE/standar), 390px, 430px (iPhone Pro Max), serta tablet lapangan iPad/Galaxy Tab (768px - 1024px).
   - Elemen interaktif memiliki target sentuh minimal 44 x 44 piksel agar mudah dioperasikan saat menggunakan sarung tangan keselamatan K3.

2. **Kontras Visual Tinggi & Anti-Silau:**
   - Tipografi menggunakan font Plus Jakarta Sans dengan bobot tebal (extrabold/bold) pada label penting, nomor seri, dan status alat.
   - Status diidentifikasi melalui warna standar keselamatan: Merah Marun (`#C81E1E`) untuk penanganan kritis/perlu diperiksa, Biru untuk dalam proses, Kuning/Amber untuk menunggu dokumen, dan Hijau Zamrud untuk riksa uji selesai.

3. **Tanpa Grafik Kompleks di Tampilan Inspector:**
   - Inspector tidak membutuhkan diagram kurva atau grafik tren makro. Tampilan difokuskan langsung pada daftar unit alat yang harus diuji, lokasi, kontak PIC, dan form checklist.

---

## 2. Struktur 3 Area Operasional Dasbor Inspector

Dasbor Inspector disusun ke dalam 3 area operasional jelas:

```
+-------------------------------------------------------------------------+
|                  DASBOR LAPANGAN INSPECTOR (PT URD)                     |
+-------------------------------------------------------------------------+
|  [ 1. Hari Ini (X) ]  [ 2. Belum Selesai (Y) ]  [ 3. Mendatang (Z) ]     |
+-------------------------------------------------------------------------+
|  Kolom Pencarian Cepat: [ Nama alat, no seri, klien, PO, atau lokasi... ]|
+-------------------------------------------------------------------------+
|                                                                         |
|  KARTU UNIT ALAT LAPANGAN:                                              |
|  +-------------------------------------------------------------------+  |
|  | [PUBT · Bejana Tekan]                         [SEDANG DIPERIKSA]  |  |
|  | Air Receiver Tank 5000L                                           |  |
|  | SN: ART-2024-0991 · Kapasitas: 5000 Liter                         |  |
|  |                                                                   |  |
|  | PO: PO/2026/10/004 · Pemeriksaan Berkala                          |  |
|  | PT Industri Manufaktur Jaya                                       |  |
|  | Lokasi: Pabrik Karawang Barat Blok C2                             |  |
|  | PIC: Ir. Hendra (0812-8899-1122) -> [Telepon] [WhatsApp]          |  |
|  |                                                                   |  |
|  | Jadwal: 30 Okt 2026               [ Kerjakan Uji Lapangan -> ]    |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

1. **Pekerjaan Hari Ini:**
   - Menampilkan unit yang dijadwalkan pada hari ini atau sedang dalam status aktif pemeriksaan.
   - Tombol utama merah marun mengarahkan inspector langsung ke lembar kerja riksa uji.

2. **Pekerjaan Belum Selesai:**
   - Menampilkan pekerjaan yang butir checklistnya belum lengkap, draf belum difinalisasi, menunggu tanda tangan digital klien, atau dikembalikan untuk revisi.
   - Kotak peringatan merah menampilkan catatan perbaikan dari manajemen atau klien.

3. **Pekerjaan Mendatang:**
   - Menampilkan jadwal penugasan untuk hari-hari berikutnya agar inspector dapat mempersiapkan peralatan ukur dan kalibrasi yang diperlukan.

4. **Riwayat Selesai:**
   - Menyimpan arsip unit yang telah selesai dan menyediakan tombol unduh cepat untuk dokumen BAP dan LHPP PDF resmi.

---

## 3. Alur Pengisian Lembar Riksa Uji Lapangan

Alur kerja dirancang berkesinambungan dalam satu antarmuka (single-flow):

1. **Verifikasi Identitas Unit Fisik:**
   - Inspector mencocokkan data nomor seri, merk, tipe, kapasitas, dan lokasi instalasi dengan kondisi faktual di lapangan.
2. **Pengisian Checklist Parameter Uji:**
   - Parameter disajikan berdasarkan kategori alat (PAA, PUBT, PTP, IPP, LIS, LE, IPK).
   - Opsi pilihan: `SESUAI` (Memenuhi), `TIDAK SESUAI` (Temuan), `TIDAK BERLAKU` (N/A).
   - Input numerik otomatis mengecek batas toleransi minimal/maksimal.
3. **Dokumentasi Foto Langsung (Inline):**
   - Inspector dapat memotret langsung per butir checklist melalui tombol kamera inline, atau mengunggah bukti fisik pada galeri dokumentasi.
   - Foto langsung tampil dalam galeri thumbnail dengan tombol hapus (ikon tempat sampah) jika foto buram atau keliru.
4. **Pencatatan Temuan Lapangan:**
   - Jika ditemukan anomali atau kerusakan fisik, dicatat dengan kategori Kritis, Mayor, atau Minor disertai rekomendasi perbaikan teknis.
5. **Penandatanganan Digital Bersama Klien:**
   - Kanvas sentuh interaktif untuk pembubuhan tanda tangan Ahli K3 dan PIC Perwakilan Klien di lokasi proyek.
   - Dilengkapi validasi ketat agar kanvas tidak dapat dikirim kosong.
6. **Gerbang Verifikasi Pra-Kirim (Pre-Submit Review Gate):**
   - Modal rekapitulasi menampilkan persentase kelengkapan checklist, daftar butir tidak sesuai, jumlah foto, dan status tanda tangan sebelum data dikunci.
7. **Penerbitan Otomatis Dokumen:**
   - Penekanan konfirmasi final otomatis mengunci form riksa uji, menerbitkan dokumen Berita Acara (BAP) final, dan men-generate draf Laporan Hasil Pemeriksaan dan Pengujian (LHPP).
