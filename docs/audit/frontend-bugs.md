# Audit Bug & Remediasi Frontend
## PT Upaya Riksa Daya

Dokumen ini mencatat daftar bug, inkonsistensi arsitektur, isu usability lapangan, serta langkah remediasi yang telah diselesaikan pada frontend React + Vite PT Upaya Riksa Daya.

---

## 1. Daftar Bug & Masalah yang Ditemukan

### Bug FE-01: React Hook Order Violation & ReferenceError useMemo pada Dasbor
- **Gejala:** Muncul tampilan error boundary *"Terjadi kendala saat memuat tampilan halaman ini. Rendered more hooks than during the previous render"* dan console log *"ReferenceError: useMemo is not defined at DashboardPage"*.
- **Akar Penyebab:** 
  1. Penggunaan `useMemo` tanpa diimpor dari modul `react` pada baris atas.
  2. Adanya early returns (`if (loading) return ...`, `if (error) return ...`) yang diletakkan sebelum kalkulasi hook turunan, sehingga urutan pemanggilan hook berubah drastis antara tahap loading dan tahap data tersedia.
- **Remediasi:** 
  - Seluruh hook (`useState`, `useCallback`, `useMemo`, `useEffect`) dipindahkan ke baris teratas fungsi komponen `DashboardPage` sebelum logika conditional return.
  - Impor `useMemo` ditambahkan pada baris pertama `frontend/src/features/dashboard/DashboardPage.jsx`.
- **Status:** **Terselesaikan (Verified)**.

### Bug FE-02: Inkonsistensi Pengecekan Role Inspector (`AHLI_K3` vs `INSPECTOR`)
- **Gejala:** Pengguna dengan role `INSPECTOR` tidak dapat melihat tombol aksi riksa uji lapangan pada beberapa halaman karena pengecekan hanya memeriksa string `'AHLI_K3'`.
- **Akar Penyebab:** Pada revisi peran bisnis terbaru, role canonical diperluas menjadi `INSPECTOR` dan `AHLI_K3`. Beberapa komponen (misalnya `InspectionsPage.jsx`, `OrdersPage.jsx`, `SettingsPage.jsx`) masih mengecek `user?.role === 'AHLI_K3'`.
- **Remediasi:** Semua pengecekan hak akses diubah menjadi `['AHLI_K3', 'INSPECTOR'].includes(user?.role)`.
- **Status:** **Terselesaikan (Verified)**.

### Bug FE-03: Alur Dokumentasi Foto Lapangan Terisolasi & Tanpa Fitur Hapus
- **Gejala:** Inspector di lapangan harus menggulir ke bagian paling bawah formulir riksa uji untuk mengunggah foto. Foto hanya ditampilkan sebagai tautan teks tanpa pratinjau thumbnail visual, dan tidak ada tombol untuk menghapus foto sebelum formulir diserahkan.
- **Akar Penyebab:** Tidak adanya trigger foto inline pada butir checklist, tampilan foto hanya menggunakan tag `<a>` generik, dan ketiadaan integrasi API delete foto.
- **Remediasi:**
  - Menambahkan tombol kamera inline pada setiap butir checklist teknis dengan prefill keterangan butir uji.
  - Mengganti daftar tautan teks foto dengan grid kartu thumbnail responsif (2 sampai 4 kolom) menggunakan gambar asli dari backend.
  - Menambahkan tombol hapus foto (ikon tempat sampah / `Trash`) dengan dialog konfirmasi yang terhubung ke endpoint backend `DELETE /inspections/:id/photos/:photoId`.
- **Status:** **Terselesaikan (Verified)**.

### Bug FE-04: Validasi Kanvas Tanda Tangan Memperbolehkan Pengiriman TTD Kosong
- **Gejala:** Inspector atau klien dapat menekan tombol simpan tanda tangan tanpa menggoreskan tanda tangan pada kanvas, yang mengakibatkan pengiriman gambar transparan 1x1 piksel dummy (`DEFAULT_SIGNATURE_PNG`).
- **Akar Penyebab:** Logika fallback `dataUrl = DEFAULT_SIGNATURE_PNG` jika `hasDrawnSig` bernilai false.
- **Remediasi:** Menambahkan validasi ketat `if (!hasDrawnSig || !sigCanvasRef.current)` yang menampilkan pesan peringatan jika kanvas masih kosong, serta mewajibkan goresan nyata di atas kanvas sebelum form disimpan.
- **Status:** **Terselesaikan (Verified)**.

### Bug FE-05: Tidak Ada Modal Rangkuman Verifikasi Pra-Kirim Riksa Uji
- **Gejala:** Penekanan tombol "Selesaikan Riksa Uji" langsung memicu finalisasi dokumen tanpa rekapitulasi butir uji yang belum terisi atau temuan ketidaksesuaian.
- **Akar Penyebab:** Pemanggilan langsung `handleSubmitInspection` melalui konfirmasi browser standar.
- **Remediasi:** Membuat modal baru `reviewModalOpen` (*Pre-Submit Review Summary Gate*) yang menyajikan:
  1. Ringkasan unit alat, kategori, dan klien.
  2. Audit kelengkapan butir checklist (persentase progres, jumlah butir terisi vs belum terisi, dan daftar butir dengan hasil TIDAK SESUAI).
  3. Total temuan ketidaksesuaian lapangan.
  4. Jumlah foto dokumentasi terlampir beserta galeri thumbnail mini.
  5. Status pembubuhan tanda tangan digital (Ahli K3 & Perwakilan Klien).
  6. Kesimpulan kelayakan K3 yang dipilih beserta catatan teknis.
  7. Tombol konfirmasi final untuk mengunci form dan menerbitkan BAP + draf LHPP.
- **Status:** **Terselesaikan (Verified)**.

### Bug FE-06: Usability Dasbor Inspector Belum Sesuai Kebutuhan Lapangan
- **Gejala:** Dasbor Inspector menampilkan tampilan generik yang membingungkan inspector saat berpindah antarlokasi proyek.
- **Akar Penyebab:** Unit yang ditugaskan bercampur tanpa pembagian waktu pelaksanaan yang tegas.
- **Remediasi:** Menata ulang Dasbor Inspector menjadi 3 area operasional jelas:
  1. **Pekerjaan Hari Ini:** Unit yang dijadwalkan hari ini atau sedang dalam status riksa uji aktif.
  2. **Pekerjaan Belum Selesai:** Unit yang checklistnya belum lengkap, draf belum difinalisasi, menunggu tanda tangan, atau dikembalikan untuk revisi.
  3. **Pekerjaan Mendatang:** Unit yang terjadwal untuk hari berikutnya.
  4. **Riwayat Selesai:** Arsip riksa uji yang telah terbit LHPP dan BAP final.
  - Dilengkapi tab switcher sentuh cepat, tombol panggil telepon dan WhatsApp langsung ke PIC Klien, serta tombol "Kerjakan Uji Lapangan" yang langsung membuka form riksa uji unit bersangkutan.
- **Status:** **Terselesaikan (Verified)**.

### Bug FE-07: Kepatuhan Standar Anti-Slop R-02 & Penanganan State
- **Gejala:** Terdapat kemungkinan penggunaan karakter em dash (`—`) pada teks antarmuka atau tombol mati tanpa aksi.
- **Akar Penyebab:** Template teks warisan dan event handler tanpa fungsi.
- **Remediasi:** 
  - Melakukan audit ketat: 0 karakter em dash di seluruh folder `frontend/src/`.
  - Memastikan seluruh kontrol UI memiliki aksi nyata, penanganan loading spinner, error alert dengan tombol muat ulang, dan empty state ramah pengguna.
- **Status:** **Terselesaikan (Verified)**.

---

## 2. Bukti Pengujian Frontend

```bash
# 1. Test Suite Vitest
npm --prefix frontend test
# Hasil: 4 passed (100%)

# 2. Production Bundle Compilation
npm --prefix frontend run build
# Hasil: ✓ built in 5.18s (Zero compilation errors)

# 3. Em-Dash Character Check
grep -rn "—" frontend/src/
# Hasil: 0 occurrences
```
