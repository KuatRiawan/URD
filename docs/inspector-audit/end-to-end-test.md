# Pengujian Integrasi End-to-End Modul Inspector
**PT Upaya Riksa Daya**

---

## 1. Skenario Pengujian Alur Lapangan Penuh
Pengujian end-to-end memvalidasi seluruh rantai kerja dari akun Ahli K3:
1. **Login Ahli K3**: Autentikasi dengan email `ahlik3.paa@upayariksadaya.com` mendapatkan token sesi JWT aktif.
2. **Melihat Tugas Saya**: Dasbor menampilkan unit riksa uji yang ditugaskan kepada pemeriksa.
3. **Membuka Lembar Riksa Uji**: Mengklik "Mulai Pemeriksaan" pada kartu unit membuka modal terpadu seketika.
4. **Verifikasi Data Teknis Bab II**: Mengisi spesifikasi aktual (SWL, bentang, kecepatan angkat, sistem rem).
5. **Evaluasi Checklist**: Menilai butir-butir checklist K3 sesuai standar regulasi Kemenaker.
6. **Dokumentasi Foto**: Melampirkan foto temuan/bukti uji visual secara inline.
7. **Kesimpulan & Tanda Tangan**:
   - Memilih kesimpulan kelaikan (Memenuhi Syarat).
   - Menggoreskan tanda tangan Ahli K3 -> klik "Simpan TTD Ahli K3" -> status inline terbit "Tanda tangan digital Ahli K3 berhasil disimpan."
   - Mengisi Nama PIC ("Bp. Teddy") dan tanda tangan PIC Klien -> klik "Simpan TTD Klien" -> status inline terbit "Tanda tangan digital PIC Klien berhasil disimpan."
8. **Submit Final**:
   - Menekan tombol "Kirim Laporan & Terbitkan BAP/LHPP".
   - Sistem mengunci formulir, memperbarui `test_objects`, dan menerbitkan draf BAP serta LHPP resmi dengan nomor registrasi unik.

---

## 2. Hasil Eksekusi Uji Otomatis
- **Backend Test Suite (`vitest run`)**: 43/43 tests lulus (100%).
- **Frontend Test Suite (`vitest run --run`)**: 4/4 tests lulus (100%).
- **Vite Production Build (`vite build`)**: Berhasil dikompilasi tanpa error.

