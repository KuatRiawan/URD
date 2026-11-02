# PT Upaya Riksa Daya (URD) — UI/UX Product Engineering & Design Evaluation

> **Evaluator:** Principal Product Designer & Senior Frontend Engineer  
> **Standar Desain:** StyleSeed / UI/UX Pro Max, Mobile-First, Touch-First ($\ge 44\text{px}$), Anti-Slop Guidelines  
> **Target Pengguna:** Marketing, Ahli K3 Lapangan (Inspector), Admin Kantor, Pimpinan, Super Admin  
> **Status:** PASSED & POLISHED

---

## 1. Filosofi Desain & Prinsip Human-Centered Engineering

Dalam bisnis Jasa K3 Riksa Uji, keselamatan kerja dan integritas data teknis adalah taruhan utama. Desain antarmuka URD dibangun atas prinsip berikut:
1. **Kejelasan Hierarki Tugas (Task Clarity):** Setiap halaman berfokus pada pekerjaan utama pengguna tanpa tombol atau widget dekoratif yang membingungkan.
2. **Ergonomi Lapangan (Field Usability):** Inspector bekerja di area pabrik, ruang mesin, dan ketinggian. Antarmuka mobile wajib memiliki kontras tinggi, tombol besar yang mudah ditekan dengan satu tangan atau sarung tangan kerja, serta status koneksi yang jelas.
3. **Integritas Pemeriksaan (Anti-Slop Data Integrity):** Checklist pemeriksaan **tidak boleh secara otomatis terisi "SESUAI"**. Setiap item membutuhkan verifikasi nyata oleh Ahli K3.
4. **Pencegahan Kesalahan (Poka-Yoke):** Tombol aksi berisiko tinggi (finalisasi, pembatalan) memiliki dialog konfirmasi eksplisit, sementara alur kerja bertahap memandu pengguna dari draf hingga terbit.

---

## 2. Peningkatan Antarmuka Berdasarkan Peran Pengguna

### A. Peran Marketing
- **Tantangan Lama:** Formulir PO yang panjang dan membosankan, kesulitan menambahkan banyak unit alat sejenis, dan manajemen kontak PIC klien yang terpencar.
- **Solusi & Peningkatan:**
  - **PO Creation Wizard Multi-Unit:** Marketing dapat menambahkan unit secara bertahap dalam satu PO, masing-masing dengan kategori K3, merek, kapasitas, dan lokasi pasang yang spesifik.
  - **Fitur Duplikasi Unit (Quick Duplicate):** Untuk order yang melibatkan banyak unit sejenis (misal: 10 unit forklift atau 5 unit overhead crane), Marketing cukup mengisi spesifikasi satu unit lalu menekan tombol *"Duplikasi"* untuk menyalin parameter teknis tanpa mengetik ulang dari awal.
  - **Manajemen Multi-PIC:** Halaman profil klien menyajikan kartu PIC lengkap (nama, jabatan, nomor WhatsApp, email), memudahkan komunikasi teknis saat tim operasional turun ke lapangan.
- **Bukti Visual:** Tangkapan layar `01-marketing-dashboard.png`, `01b-marketing-clients.png`, `01c-marketing-po-wizard.png`.

---

### B. Peran Inspector (Ahli K3 Lapangan — Mobile-First 390x844)
- **Tantangan Lama:** Halaman desktop yang dipaksakan mengecil di layar ponsel, tombol kecil yang sulit ditekan, formulir isian teknis yang tidak sesuai kategori K3, dan bahaya hilangnya data saat jaringan seluler di pabrik terputus.
- **Solusi & Peningkatan:**
  - **Tata Letak Khusus Mobile:** Didesain dengan viewport acuan iPhone/Android standar (390 $\times$ 844 px). Komponen navigasi bawah (*Bottom Navigation Bar*) memudahkan perpindahan antarpenugasan dengan ibu jari.
  - **Touch Target $\ge 44\text{px}$:** Seluruh tombol navigasi, tab section, dan pilihan radio button checklist dirancang dengan area sentuh minimal 44 $\times$ 44 pixel untuk kenyamanan navigasi lapangan.
  - **Verifikasi Nameplate Fisik:** Sebelum mengisi lembar uji, form mewajibkan verifikasi data nameplate (nomor seri, pabrik pembuat, kapasitas) agar temuan lapangan langsung tercocokkan dengan dokumen perizinan terdahulu.
  - **Pemberantasan Auto-Fill "SESUAI":** Checklist disajikan dalam status belum terisi (*unselected*). Inspector wajib memilih secara sadar (`SESUAI`, `TIDAK_SESUAI`, `TIDAK_DIPERIKSA`) dan menambahkan catatan aktual untuk temuan kritis.
  - **Indikator Mode Offline & Queue Synchronization:** Ketika koneksi terputus di dalam ruang tertutup pabrik, banner indikator offline aktif secara halus. Tombol simpan draf menyimpan data ke *IndexedDB/LocalStorage*. Saat jaringan pulih, data disinkronkan secara otomatis tanpa data hilang.
- **Bukti Visual:** Tangkapan layar `02-inspector-mobile-assignments.png`, `02b-inspector-mobile-checklist.png`.

---

### C. Peran Admin Kantor
- **Tantangan Lama:** Antrean kerja tercecer di berbagai menu terpisah sehingga berkas tertunda (*bottleneck*) sulit terdeteksi.
- **Solusi & Peningkatan:**
  - **Prioritized Work Queue (5 Tab Operasional):** Admin Kantor memiliki pusat kendali terpadu yang membagi pekerjaan ke dalam 5 status siap tindak lanjut:
    1. *Verifikasi PO:* PO baru yang membutuhkan penjadwalan & penunjukan Ahli K3.
    2. *Draf LHPP:* Laporan lapangan dari Inspector yang siap di-review QC.
    3. *BAP:* Berita acara pemeriksaan yang menunggu pengesahan & tanda tangan.
    4. *Suket Disnaker:* Dokumen yang siap diajukan ke dinas terkait atau dicatat nomor suketnya.
    5. *Distribusi Dokumen:* Bundel dokumen final yang siap diserahkan ke klien via kurir/email.
  - **Siklus QC Tegas:** Admin dapat langsung menyetujui dan memfinalisasi LHPP (`/finalize`) atau mengembalikan laporan yang kurang lengkap kepada Inspector dengan catatan revisi spesifik (`/return`).
  - **Penerbitan BAST Terintegrasi:** Setelah seluruh berkas fisik diserahkan, Admin mencatat bukti serah terima dan mengunduh BAST PDF bertanda tangan lengkap.
- **Bukti Visual:** Tangkapan layar `03-admin-workqueue.png`, `03b-admin-distributions.png`.

---

### D. Peran Pimpinan (Monitoring Read-Only)
- **Tantangan Lama:** Tampilan operasional bercampur dengan kontrol edit yang berisiko tertekan secara tidak sengaja oleh pihak eksekutif.
- **Solusi & Peningkatan:**
  - **Executive Pipeline Dashboard:** Menyajikan metrik kunci secara bersih: total PO aktif, distribusi unit per bidang K3, unit mendekati jatuh tempo inspeksi berkala, serta persentase penyelesaian laporan.
  - **Pembersihan Kontrol Aksi (Strict Read-Only):** Seluruh tombol *"Tambah Klien"*, *"Buat PO"*, *"Jadwalkan"*, dan *"Edit"* dinonaktifkan dan disembunyikan untuk peran Pimpinan. Pimpinan menikmati antarmuka monitoring murni yang cepat dan bebas risiko salah tekan.
- **Bukti Visual:** Tangkapan layar `04-pimpinan-executive-pipeline.png`, `04b-pimpinan-orders-readonly.png`.

---

### E. Peran Super Admin
- **Tantangan Lama:** Manajemen user yang kaku dan kesulitan melacak riwayat tindakan sistem untuk audit forensik.
- **Solusi & Peningkatan:**
  - **Manajemen Pengguna Dinamis:** Tabel user lengkap dengan filter peran, nomor telepon, status keaktifan, dan dialog reset kata sandi atau penonaktifan akun instan.
  - **Jejak Audit Kekal (*Immutable Audit Trail*):** Menampilkan log aktivitas lengkap (waktu, nama user, tipe aksi, entitas terdampak, alamat IP, dan ringkasan payload) yang tidak dapat dimanipulasi melalui antarmuka.
- **Bukti Visual:** Tangkapan layar `05-superadmin-users.png`, `05b-superadmin-audit-logs.png`.

---

### F. Halaman Verifikasi Publik QR Code (`/verifikasi/:code`)
- **Tantangan Lama:** Halaman verifikasi publik generik yang kaku dan tidak mengindikasikan status legalitas dokumen keselamatan kerja.
- **Solusi & Peningkatan:**
  - Badge verifikasi resmi berwarna hijau emerald (*Official Verified Badge*) dengan ikon tanda centang proteksi.
  - Menampilkan jenis dokumen (LHPP, BAP, atau Suket K3 Disnaker), nomor resmi, tanggal pengesahan, masa berlaku, instansi penerbit, nama unit, nomor seri, dan nama perusahaan pemilik.
  - Responsive di perangkat ponsel klien saat stiker QR code discan di lapangan.
- **Bukti Visual:** Tangkapan layar `06-public-qr-verification.png`.

---

### G. Uji Responsivitas Perangkat Tablet (768x1024)
- **Evaluasi:**
  - Menampilkan layout tabel data dan filter bar pada resolusi iPad/Tablet Portrait tanpa tumpang tindih (*text wrapping* dan *horizontal scroll table* berjalan mulus).
- **Bukti Visual:** Tangkapan layar `07-responsive-tablet-layout.png`.

