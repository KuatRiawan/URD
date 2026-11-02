# UX Improvement Log
**PT Upaya Riksa Daya (URD) — Catatan Perbaikan Pengalaman Pengguna (UI/UX)**

---

## 1. Filosofi Desain

Mengacu pada prinsip keahlian UI/UX (UI/UX Pro Max, Ponytail, dan Anti-Slop):
1. **Mengurangi Beban Kognitif (Cognitive Load Reduction)**: Menampilkan informasi penting yang dapat ditindaklanjuti terlebih dahulu. Menghindari "kartu statistik kosong" yang tidak memberikan nilai operasional.
2. **Desain Mobile-First untuk Lapangan (Inspector Focus)**: Ahli K3 menggunakan ponsel atau tablet di lokasi industri/pabrik (sering kali dengan koneksi tidak stabil dan menggunakan sarung tangan keselamatan). Elemen tombol dibuat berukuran minimal 40px (*touch-target friendly*), interaksi satu ketukan (*one-tap*), dan dialog yang ringkas.
3. **Hirarki Visual Tegas & Metis Theme Consistency**: Menggunakan aksen warna primer URD `#C81E1E` (Crimson Red), badge urgensi berbasis kontras tinggi, serta kompatibilitas penuh tema terang (*light mode*) dan gelap (*dark mode*).

---

## 2. Rincian Perubahan UX per Modul

### A. Mobile Inspector Experience (Pemeriksaan Lapangan)
* **Sebelum**:
  - Terdapat tombol "Isi Semua Sesuai" yang berisiko disalahgunakan untuk melompati pemeriksaan fisik.
  - Verifikasi kesesuaian fisik unit (nameplate) belum terstruktur rapi di awal tahapan checklist.
* **Sesudah**:
  - Tombol pengisian otomatis dihapus sepenuhnya.
  - Kartu **Verifikasi Fisik Nameplate Unit (Object & Nameplate Matching)** hadir sebagai blok pertama di Langkah 1.
  - Indikator status visual foto nameplate: hijau bila sudah terunggah, abu-abu bergaris putus-putus bila belum.
  - Satu ketukan untuk mengunggah dari kamera dengan dukungan kompresi otomatis dan antrean offline jika jaringan terputus.
  - Tautan langsung ke pelaporan ketidaksesuaian nomor seri tanpa harus bolak-balik menu.

### B. Admin Kantor Work Queue (Antrean Tugas Operasional)
* **Sebelum**:
  - Antrean kerja hanya menampilkan dua tab: *Semua* dan *Tinggi*.
  - Tidak ada pemilahan antara tugas dokumen hukum (BAP), penerbitan LHPP, maupun kendala lapangan.
* **Sesudah**:
  - Tab kategori operasional dinamis: *Semua ({total})*, *Tinggi ({highCount})*, *LHPP & BAP ({lhppBapCount})*, *Suket & Distribusi ({suketDistCount})*, dan *Kendala ({issueCount})*.
  - Label badge warna spesifik untuk tiap tipe:
    - `Kendala Lapangan`: Rose
    - `Proses BAP`: Purple
    - `Pencatatan Suket`: Indigo
    - `Distribusi Dokumen`: Emerald
    - `Review LHPP`: Blue
    - `Revisi LHPP`: Amber
    - `Penugasan Lapangan`: Sky
  - Tombol aksi kontekstual ("Tinjau LHPP", "Proses BAP", "Catat Suket", "Kirim Dokumen").

### C. Pimpinan Executive Monitoring Dashboard
* **Sebelum**:
  - Hanya menampilkan 4 kartu metrik umum dan grafik tren bulanan.
  - Pimpinan tidak dapat melihat ringkasan tahapan unit secara langsung dalam satu tampilan dasbor.
* **Sesudah**:
  - Bilah peringatan darurat kendala lapangan (*Operational Issues Alert Banner*) jika terdapat isu belum tuntas.
  - Widget *Executive Operational Pipeline*:
    - Kotak statistik 4 tahapan unit: Menunggu, Inspeksi, Perlu Revisi, Selesai.
    - Kotak status 4 dokumen resmi: BAP Final (beserta draf), LHPP Terbit (beserta antrean QC), Suket Disnaker Tercatat, dan Distribusi (Terkirim vs Siap Kirim).
  - Tampilan sepenuhnya *read-only* tanpa tombol aksi mutasi yang tidak relevan.

### D. Marketing PO Multi-Unit Wizard
* **Sebelum**:
  - Menambah beberapa unit sejenis memerlukan pengisian ulang kategori K3, nama alat, SWL, dan lokasi pabrik dari awal.
* **Sesudah**:
  - Tombol duplikasi spesifikasi (*Copy*) di setiap baris unit yang telah ditambahkan. Sekali klik, seluruh spesifikasi tersalin ke formulir entri dan pengguna tinggal menyesuaikan nomor seri atau nomor unit.
  - Form entri mempertahankan *installLocation* sebelumnya secara otomatis.

