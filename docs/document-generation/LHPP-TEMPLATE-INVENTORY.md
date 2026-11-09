# INVENTARISASI TEMPLATE DOKUMEN LHPP PT UPAYA RIKSA DAYA (URD)

Dokumen ini mencatat inventarisasi artefak fisik resmi, struktur teknis dokumen, dan konfigurasi template LHPP (*Laporan Hasil Pemeriksaan dan Pengujian*) yang ditemukan dalam repositori PT Upaya Riksa Daya.

---

## 1. Artefak Sumber Dokumen Resmi (Verified Source Documents)

| No | Nama Dokumen Sumber | Bidang K3 (Domain) | Jenis Unit / Subtipe | Format Penomoran Resmi | Format Berkas |
|:---|:---|:---|:---|:---|:---:|
| 1 | `PT CCBI Cibitung_Manual Gantry Crane (K3 CRN TRVL 601)_C19080724_AH.pdf` | **PAPA** | Crane / Manual Gantry Crane | `.../INSP-PAA/PJK3-URD/[Bulan]/[Tahun]` | PDF (1.24 MB) |
| 2 | `PT CCBI, Cibitung_Air Pressure Tank (K3 BTU 001)_TMH-3013-21_MS.pdf` | **PUBT** | Bejana Tekan / Air Pressure Tank | `.../INSP-PUBT/PJK3-URD/[Bulan]/[Tahun]` | PDF (2.57 MB) |
| 3 | `PT CCBI, Cibitung_Instalasi Petir_K3 DC IPP 107_Area IPP Pengisian_BK.pdf` | **ILPP** | Penyalur Petir / Konvensional / ESE | `.../INSP-IPP/PJK3-URD/[Bulan]/[Tahun]` | PDF (2.13 MB) |
| 4 | `PT CCBI, Cibitung_LINE 8 RGB_HD (1).pdf` | **PTP** | Mesin Produksi / Line Produksi RGB | `.../INSP-PTP/PJK3-URD/[Bulan]/[Tahun]` | PDF (2.19 MB) |
| 5 | `PT PDG Data Centres JB01_Fire Alarm_HD.pdf` | **IPK** | Proteksi Kebakaran / Fire Alarm System | `.../INSP-IPK-IA/PJK3-URD/[Bulan]/[Tahun]` | PDF (2.33 MB) |
| 6 | `PT PDG Data Centres JB01_Instalasi Listrik_HD.pdf` | **ILPP** | Instalasi Listrik / Trafo & Switchgear | `.../INSP-IL/PJK3-URD/[Bulan]/[Tahun]` | PDF (2.98 MB) |
| 7 | `PT PDG Data Centres JB01_Motor Diesel 4_ 25350903_MS.pdf` | **PTP** | Penggerak Mula / Motor Diesel Genset | `.../INSP-PTP/PJK3-URD/[Bulan]/[Tahun]` | PDF (2.39 MB) |

---

## 2. Status Template Bidang Lainnya (Missing Source Documents)

| No | Bidang K3 (Domain) | Regulasi Terkait | Status Sampel Fisik | Tindakan Sistem |
|:---|:---|:---|:---|:---|
| 8 | **Elevator / Eskalator** | Permenaker No. 06 Tahun 2017 | **Belum Ada Contoh PDF Fisik** | Menggunakan konfigurasi dinamis fallback bidang `ELEVATOR_ESKALATOR` dengan skema atribut nameplate standar; Super Admin dapat mengonfigurasi atau mengunggah template spesifik melalui UI. |
| 9 | **Anchor / Lifeline** | Permenaker No. 09 Tahun 2016 | **Belum Ada Contoh PDF Fisik** | Menggunakan konfigurasi dinamis fallback bidang `ANCHOR_LIFELINE` dengan skema uji tarik; Super Admin dapat mengonfigurasi atau mengunggah template spesifik melalui UI. |

---

## 3. Struktur Anatomi Dokumen LHPP Resmi URD

Setiap dokumen LHPP resmi yang diterbitkan PT Upaya Riksa Daya mengikuti tata letak standar bertaraf hukum Disnaker:

1. **Halaman Sampul (Cover Page)**:
   - Tahun Terbit (Header besar)
   - Judul Dokumen: `LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN SERTIFIKASI [BIDANG K3]`
   - Metadata Ringkas: Nama Perusahaan Klien, Item No, Jenis Unit & Subtipe, Nomor Seri Unit & Kapasitas, Lokasi Pemasangan/Pabrik, Tanggal Pemeriksaan, dan Tanggal Rekomendasi Riksa Uji Ulang (*Re-Inspection Date*).
   - Foto Representatif Unit Alat Utama.
   - Identitas Legalitas & Alamat Resmi PT. Upaya Riksa Daya.

2. **Kop Surat Resmi (Header) & Penomoran Dokumen**:
   - Logo Resmi URD berresolusi tinggi di kiri atas.
   - Nama Perusahaan: `PT. UPAYA RIKSA DAYA` dengan tagline PJK3 resmi.
   - Garis pemisah kop merah marun (#C81E1E / #8B262B).
   - Barcode QR Verifikasi Keaslian Dokumen di pojok kanan atas (mengarah ke `https://upayariksadaya.com/verifikasi/{verification_code}`).
   - Nomor Resmi LHPP sesuai pola bidang: `{SEQ}/INSP-{KODE_BIDANG}/PJK3-URD/{BULAN_ROMAWI}/{TAHUN}`.

3. **Bagian I — Data Umum & Legalitas**:
   - Pemilik Unit (Badan Usaha / Klien).
   - Alamat Perusahaan Pemilik & Lokasi Pemakaian Unit.
   - Pengurus / Penanggung Jawab K3 Klien (PIC).
   - Operator Unit (Nomor SIO / Lisensi K3).
   - Nomor Izin Pemakaian Lama (bila riksa berkala/ulang).
   - Jenis Pemeriksaan (`PERTAMA`, `BERKALA`, `KHUSUS`, `ULANG`).
   - Tanggal Pelaksanaan Riksa Uji.
   - Nama Ahli K3 Spesialis Pemeriksa & Nomor SKP / Lisensi Kemenaker RI.

4. **Bagian II — Data Teknis Spesifik Nameplate**:
   - Disesuaikan secara dinamis per jenis alat:
     * **Crane/PAPA**: Kapasitas Angkat (SWL), Bentang (Span), Panjang Lintasan, Kecepatan Angkat, Tipe Hoist, Dimensi Wire Rope.
     * **Bejana Tekan/PUBT**: Tekanan Desain, Tekanan Kerja Maksimum (MAWP), Volume/Kapasitas, Dimensi Shell & Head, Media Fluida, Suhu Desain.
     * **Motor Diesel/PTP**: Daya Nominal (kVA/kW), RPM, Diameter Silinder, Tipe Bahan Bakar, Merk Generator.
     * **Penyalur Petir/ILPP**: Radius Proteksi, Tipe Air Terminal, Sambungan Ukur, Tinggi Tiang.
     * **Instalasi Listrik/ILPP**: Daya Terpasang PLN, Kapasitas Trafo, Tegangan Kerja, Jenis Panel Distribusi.

5. **Bagian III & IV — Hasil Pemeriksaan Visual, Checklist, & Pengujian**:
   - Tabel dinamis item pemeriksaan: Bagian yang Diperiksa, Kriteria Standar/Toleransi, Hasil Pemeriksaan Aktual (`MEMENUHI SYARAT`, `TIDAK MEMENUHI SYARAT`, `TIDAK DAPAT DIPERIKSA`), serta Catatan Teknis.
   - Tabel Hasil Pengukuran Khusus:
     * NDT (Non-Destructive Testing) Liquid Penetrant / MPI.
     * Ultrasonic Wall Thickness Measurement (pubt/bejana tekan).
     * Earth Grounding Resistance (listrik & petir dalam Ohm $\le 5\,\Omega$).
     * Sound Level Meter & Vibration Measurement (ptp/mesin).
     * Defleksi Uji Beban Dinamis & Statis 100%–125% (crane/forklift).

6. **Bagian V & VI — Kesimpulan Teknis & Saran / Rekomendasi**:
   - Kesimpulan Kelayakan Operasional K3 sesuai regulasi perundangan (Disnaker/Kemenaker RI).
   - Syarat-syarat K3 dan rekomendasi perbaikan berkala.
   - Batas waktu rekomendasi riksa uji berikutnya.

7. **Bagian Tanda Tangan & Pengesahan**:
   - Kolom Tanda Tangan Ahli K3 Spesialis Pemeriksa (Nama, Nomor SKP, QR Verifikasi).
   - Kolom Mengetahui / Menyetujui: Penanggung Jawab Teknis PJK3 PT Upaya Riksa Daya.
   - Kolom Perwakilan Klien / PIC Pemilik Unit.

8. **Lampiran Dokumen Resmi (Appendix)**:
   - Lampiran Foto Dokumentasi Riksa Uji Lapangan (beserta *caption* teknis dan posisi pengujian).
   - Lampiran Sertifikat Kalibrasi Alat Ukur KAN yang digunakan.
   - Lampiran Salinan SKP Ahli K3 dan SKP PJK3 PT Upaya Riksa Daya.

---

## 4. Pemisahan Konseptual: Checklist vs. LHPP Template

- **Checklist Template**: Dipakai oleh Inspector saat pengujian lapangan melalui mobile/tablet untuk mencatat jawaban, angka pengukuran, catatan ketidaksesuaian, dan mengunggah foto.
- **LHPP Template**: Dokumen resmi yang dihasilkan oleh sistem untuk Admin Kantor melakukan telaah Quality Control (QC), memvalidasi kelengkapan, mencocokkan data teknis, memetakan variabel ke laporan formal, dan menerbitkan berkas PDF/DOCX yang sah secara hukum.

