_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



**PRODUCT REQUIREMENTS DOCUMENT (PRD)** 

# **Sistem Digitalisasi Dokumen Riksa Uji K3 & Pengingat Berkala** 



<!-- Start of picture text -->
PT. UPAYA RIKSA DAYA<br><!-- End of picture text -->

Versi Dokumen 0.1 Tanggal 01 November 2026 Penyusun Kuat Riawan Status Draft Pengguna sistem Karyawan internal PT Upaya Riksa Daya 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



## **DAFTAR ISI** 

|DAFTAR ISI................................................................................................................................... i|
|---|
|1. Informasi Umum...................................................................................................................... 1|
|1.1 Identitas Produk & Dokumen........................................................................................... 1|
|1.2 Riwayat Perubahan........................................................................................................... 1|
|1.3 Stakeholder / Tim Terkait................................................................................................. 1|
|2. Latar Belakang & Tujuan........................................................................................................ 3|
|2.1 Latar Belakang Bisnis & 7 Bidang Riksa Uji K3............................................................ 3|
|2.3 Tujuan Produk.................................................................................................................... 4|
|2.4 Non-Goals........................................................................................................................... 5|
|3. Pengguna, Alur Tugas, & Detail Halaman/Fitur per Role.................................................. 6|
|3.1 Penjelasan Tugas Admin & Manager di Sistem............................................................ 6|
|3.2 Rincian Halaman & Fitur untuk Masing-Masing Role................................................... 7|
|B. Halaman & Fitur untuk Role: INSPECTOR.................................................................. 8|
|C. Halaman & Fitur untuk Role: ADMIN............................................................................ 9|
|D. Halaman & Fitur untuk Role: MANAGER (PIMPINAN)............................................ 10|
|E. Halaman & Fitur untuk Role: SUPER ADMIN........................................................... 11|
|3.3 Ringkasan User Stories.................................................................................................. 12|
|4. Persyaratan Produk, Dokumen Output, & Struktur Database........................................ 13|
|4.1 Persyaratan Fungsional Utama..................................................................................... 13|
|4.2 Daftar 7 Dokumen yang Dihasilkan & Dikelola di Sistem.......................................... 14|
|4.3 Arsitektur Penyimpanan & Struktur 10 Tabel Database (ERD)................................ 15|
|Rincian 10 Tabel Utama di Dalam Database Sistem.................................................... 16|
|4.4 Aturan Pengingat Berkala Otomatis (H-30, H-14, H-7 via WhatsApp & Email)..... 18|
|4.5 Persyaratan Non-Fungsional......................................................................................... 19|
|5. Desain & Alur Pengguna (User Flow & Design)............................................................... 20|
|5.1 Diagram Alur Kerja Sistem dari Awal Sampai Akhir................................................... 20|
|5.2 Urutan 10 Status Pekerjaan di Dalam Sistem............................................................. 20|



i 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|5.3 Contoh Format Pesan Reminder Otomatis (WhatsApp & Email)............................. 21|
|---|
|7. Rencana Pengerjaan, Solusi Risiko, & Skenario Pengujian (UAT)............................... 24|
|7.1 Hal yang Perlu Disiapkan (Asumsi & Ketergantungan)............................................. 24|
|7.2 Kemungkinan Kendala & Solusinya (Risk & Mitigation)............................................ 24|
|7.3 Estimasi Jadwal Pengerjaan (Timeline 14–16 Minggu)............................................. 25|
|7.4 Lampiran Ceklis Skenario Pengujian Bersama Klien (UAT Checklist).................... 26|
|8. Glosarium (Daftar Istilah & Singkatan)............................................................................... 28|
|8.1 Istilah Operasional & Regulasi Riksa Uji K3 (PJK3)................................................... 28|
|8.2 Istilah Teknis Aplikasi & Sistem.................................................................................... 30|



ii 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



## **1. Informasi Umum** 

#### **1.1 Identitas Produk & Dokumen** 

|**Inform**|**asi**<br>**Keterangan**||
|---|---|---|
|**Judul**|**Produk / Sistem**<br>Sistem Digitalisasi Doku|men Riksa Uji & Pengingat Berkala|
|**Nama**<br>|**Perusahaan**<br>PT Upaya Riksa Daya -<br>dan Pengujian<br>|Perusahaan Jasa K3 Bidang Pemeriksaan<br>|
|**Alamat**<br>|**Kantor**<br>Jl. Pondasi No. 50 B, K<br>|ampung Ambon, Jakarta Timur<br>|
|**Versi D**<br>|**okumen**<br>Versi 0.1<br>||
|**Tangg**<br>|**al Pembuatan**<br>1 November 2026<br>||
|**Platfor**<br>|**m Sistem**<br>Mobile Web / PWA<br>||
|**1.2 Riw**<br>|**ayat Perubahan**<br>||
|**Versi**<br><br>|**Tanggal**<br>**Penulis / Penyusun**<br><br>|**Ringkasan Perubahan**<br><br>|
|**v0.1**<br><br>|01 November<br>2026<br>Kuat & Tim<br><br>~~T~~|Penyusunan draf awal (Versi 0.1) PRD<br>PT Upaya Riksa Daya. Mencakup alur<br>proses 5 role, detail halaman per role,<br>desain struktur tabel database (ERD),<br>daftar dokumen otomatis, alur temuan<br>alat belum layak, aturan reminder H-<br>30/14/7 WA & Email, dan skenario uji<br>(UAT).<br><br>~~T~~|
|**1.3 Stak**<br>|**eholder / Tim Terkait**<br>||
|Pengem<br>internal P|bangan dan pelaksanaan sistem  ini dikerjak<br>T Upaya Riksa Daya:|an secara ringkas dan terfokus oleh pihak<br>|



1 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Pihak Terlibat**|**Posisi / Peran**|**Tanggung Jawab dalam Proyek**|**Ini**|
|---|---|---|---|
|**1. Manager (Pimpinan)**|Manager<br>Operasional<br>/<br>Pimpinan PT Upaya Riksa<br>Daya|- Penentu kebijakan alur kerja<br>perusahaan.<br>- Pemberi persetujuan fitur sistem<br>kebutuhan).<br>- Pengawas jalannya proyek dan p<br>keputusan akhir.|riksa uji<br>(sign-off<br>engambil|
|**2. Karyawan**|Karyawan<br>Internal<br>PT<br>Upaya Riksa Daya|- Melakukan uji coba fitur dan men<br>pemakaian sistem bersama rekan k|dampingi<br>erja.|
|**3. Kuat & Tim**|Pengembang|- Menyusun dokumen kebutuha<br>(PRD) dan merancang alur halam<br>ke-5 role (Marketing, Inspector,<br>Manager, Super Admin).<br>- Mengembangkan/menyiapkan sist<br>database,<br>template<br>dokumen<br>(LHPP & BAP), serta integrasi<br>WhatsApp & Email.|n sistem<br>an untuk<br>Admin,<br>em web,<br>otomatis<br>reminder|



2 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



## **2. Latar Belakang & Tujuan** 

#### **2.1 Latar Belakang Bisnis & 7 Bidang Riksa Uji K3** 

PT Upaya Riksa Daya adalah Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PJK3) resmi yang melayani pemeriksaan dan pengujian (Riksa Uji) peralatan kerja di berbagai industri. Layanan utama perusahaan mencakup 7 bidang peralatan K3: 

**1. Pesawat Angkat dan Pesawat Angkut (PAPA):** Forklift, Mobile Crane, Overhead Crane, Gondola, Excavator, Loader, Manlift, dll. 

**2. Pesawat Uap, Bejana Tekan, dan Tangki Timbun (PUBT):** Boiler/Ketel Uap, Kompresor, Pressure Vessel, Tangki Timbun, dll. 

**3. Pesawat Tenaga dan Produksi (PTP):** Genset, Mesin Produksi, Turbin, Tanur/Furnace, dll. 

**4. Instalasi Listrik dan Penyalur Petir (ILPP):** Panel Tegangan Listrik, Grounding, dan Penangkal Petir. 

**5. Instalasi Proteksi Kebakaran (IPK):** Fire Alarm System, Fire Hydrant, dan Sprinkler. 

**6. Elevator dan Eskalator:** Lift Penumpang, Lift Barang, Eskalator, dan Travelator. 

**7. Anchor dan Lifeline:** Sistem pengaman kerja pada ketinggian. 

Saat ini, proses kerja mulai dari pencatatan PO klien oleh Marketing, pengisian ceklis dan pengambilan foto oleh Inspector di lapangan, penyusunan dokumen LHPP (Laporan Hasil Pemeriksaan dan Pengujian) serta BAP (Berita Acara Pemeriksaan), hingga pemantauan masa berlaku Surat Keterangan (Suket) K3 masih banyak dilakukan secara manual. Agar pekerjaan lebih cepat dan seluruh dokumen tersimpan rapi di satu database, dibutuhkan sistem  yang menghubungkan seluruh proses tersebut secara otomatis. 

#### **2.2 Pernyataan Masalah** 

|**Masalah Saat Ini**|**Dampak pada Pekerjaan Sehari-hari**|
|---|---|
|**1. Pembuatan LHPP & BAP Memakan Waktu**|Di lapangan, Inspector mencatat di kertas dan|
|**Lama**|memotret pakai HP. Saat kembali ke kantor, foto|
||harus dipindah satu per satu dan data diketik ulang|



3 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Masalah Saat Ini**|**Dampak pada Pekerjaan Sehari-hari**|
|---|---|
||ke Word/Excel. Cara ini butuh waktu 3–5 hari kerja<br>dan rawan salah ketik maupun nomor surat ganda.|
|**2. Pengecekan Berkas & Lampiran oleh Admin**<br>**Belum Tusat**|Admin<br>kesulitan<br>memantau<br>mana<br>laporan<br>Inspector yang sudah lengkap, harus mencari-cari<br>file lampiran (SKP Ahli K3 & sertifikat kalibrasi alat<br>ukur) secara manual, serta sulit melacak progres<br>pengurusan Suket K3 di Disnaker.|
|**3. Sering Terlewat Mengingatkan Klien Saat**|Alat K3 wajib diuji ulang secara berkala (biasanya|
|**Masa Berlaku Habis**|1 tahun sekali). Karena jadwal kedaluwarsa masih<br>dicatat manual di Excel, tim sering terlambat<br>mengingatkan klien sehingga kehilangan peluang<br>panjangan PO (repeat order).|
|**4. Pimpinan Sulit Melihat Progres Harian**<br>**Secara Langsung**|Manager harus menanyakan kabar secara manual<br>ke masing-masing staf untuk mengetahui berapa<br>PO yang sedang jalan, siapa Inspector yang<br>bertugas, atau dokumen mana yang belum selesai.|



### **2.3 Tujuan Produk** 

- **Mempercepat Pembuatan Dokumen Resmi (Surat Tugas, BAP, LHPP, Stiker QR, & BAST):** Begitu data diinput, sistem otomatis menyusun dokumen resmi berkop surat perusahaan tanpa perlu ketik ulang dari nol. 

- **Mengingatkan Klien Secara Otomatis (H-30, H-14, H-7):** Mengirimkan pesan pengingat otomatis melalui WhatsApp dan Email kepada klien tepat pada H-30, H- 14, dan H-7 sebelum masa berlaku riksa uji alatnya habis. 

- **Menyatukan Semua Dokumen & Database di Satu Sistem:** Menyimpan data klien, PO, inventaris alat klien, foto lapangan, LHPP, BAP, scan Suket K3 Disnaker, hingga masa berlaku SKP Inspector dan alat ukur internal di satu database tusat. 

- **Memudahkan Pemantauan oleh Pimpinan:** Menyediakan dashboard pantau bagi Manager untuk melihat progres kerja semua role secara langsung (real-time). 

4 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



#### **2.4 Non-Goals** 

- **Belum Mencakup Akuntansi & Pajak Lengkap:** Fokus versi 0.1 adalah kelancaran dokumen operasional riksa uji dan pengingat klien. Pembukuan akuntansi rumit (neraca, laba-rugi, pajak, atau payroll gaji) belum dimasukkan. 

- **Belum Terhubung Otomatis ke Web Pemerintah (Disnaker):** Karena sistem Disnaker belum menyediakan koneksi otomatis untuk pihak luar, pengajuan berkas ke Disnaker tetap dilakukan oleh Admin dan hasil Suket-nya diupload ke sistem . 

- **Belum Menggunakan Pembayaran Online (Payment Gateway):** Pembayaran PO dari klien tetap melalui transfer bank perusahaan seperti biasa. 

5 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



## **3. Pengguna, Alur Tugas, & Detail Halaman/Fitur per Role** 

#### **3.1 Penjelasan Tugas Admin & Manager di Sistem** 

Untuk melengkapi gambaran alur kerja dari Marketing dan Inspector, berikut adalah rincian tugas yang dikerjakan oleh Admin serta Manager (Pimpinan) di dalam sistem: 

#### **Apa Saja Tugas ADMIN di Sistem Ini?** 

**1. Mengecek & Memverifikasi Hasil Kerja Inspector:** Saat Inspector selesai mengisi form ceklis dan foto di lapangan, laporan masuk ke antrean Admin. Admin mengecek apakah datanya sudah lengkap dan fotonya jelas. Jika ada foto buram atau data kurang, Admin tinggal klik tombol 'Minta Revisi' disertai catatan bagian mana yang harus diperbaiki Inspector. 

**2. Mencetak & Merapikan Dokumen (Surat Tugas, LHPP, BAP, Stiker QR, & BAST):** Jika data Inspector sudah oke, sistem otomatis membuatkan file LHPP dan BAP (bisa diunduh dalam format Word maupun PDF) lengkap dengan nomor surat otomatis. Sistem juga otomatis menempelkan lampiran SKP Ahli K3 Inspector dan Sertifikat Kalibrasi Alat Ukur dari database. 

**3. Mengelola Alur Temuan Alat (Jika Alat Klien Perlu Perbaikan):** Jika hasil uji lapangan menunjukkan alat belum layak (ada komponen rusak/bahaya), Admin mengirimkan Lembar Rekomendasi Perbaikan ke klien dan mengubah status alat menjadi 'Pending Perbaikan Klien' sampai klien mengirimkan bukti perbaikan. 

**4. Mencatat Progres Suket Disnaker & Mengatur Masa Berlaku:** Setelah LHPP dan BAP disetujui Manager, Admin mengurus penerbitan Surat Keterangan (Suket) K3 ke Disnaker, mengupload file PDF Suket yang sudah terbit ke sistem, dan mengisi Tanggal Habis Masa Berlaku (yang otomatis mengaktifkan jadwal pengingat H-30, H-14, dan H-7). 

#### **Apa Saja Tugas MANAGER (PIMPINAN) di Sistem Ini?** 

6 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



**1. Menunjuk / Menyetujui Inspector yang Bertugas:** Saat Marketing selesai memasukkan PO baru, Manager melihat daftar alat yang akan diuji dan menunjuk siapa Inspector yang berangkat ke lokasi klien sesuai keahlian SKP dan jadwal kosongnya (sistem otomatis membuatkan Surat Tugas Inspector). 

**2. Memberikan Persetujuan Akhir (Approval LHPP & BAP):** Sebelum dokumen LHPP dan BAP dicetak resmi atau dikirim ke Disnaker/Klien, Manager melakukan pengecekan akhir dan klik tombol 'Approve / Setujui Dokumen' (otomatis membubuhkan tanda tangan digital dan QR Code keaslian dokumen). 

**3. Memantau Progres Kerja Semua Role & Kinerja Tim:** Melihat ringkasan seluruh PO yang sedang berjalan, mengetahui jika ada tahapan pekerjaan yang macet/terlambat, serta memantau berapa banyak klien yang mempanjang kontrak dari hasil reminder. 

#### **3.2 Rincian Halaman & Fitur untuk Masing-Masing Role** 

Berikut adalah daftar halaman (menu layar) beserta fitur-fitur utama yang dibutuhkan oleh masing-masing role saat membuka aplikasi: 

#### **A. Halaman & Fitur untuk Role: MARKETING** 

|**Nama Halaman / Menu**|**Fitur yang Tersedia di Halaman Tersebut**|
|---|---|
|**1. Halaman Dashboard Marketing**|- Ringkasan jumlah PO yang masuk bulan ini.<br>- Daftar PO milik kliennya beserta status terkininya<br>(Sedang Diinspeksi, Direview Admin, Pending<br>Perbaikan Klien, Proses Disnaker, atau Selesai).<br>- Daftar pengingat klien yang akan habis masa<br>berlakunya dalam 30, 14, dan 7 hari ke depan.|
|**2. Halaman Database Klien & Kontak PIC**|- Form tambah & edit data perusahaan klien (Nama<br>PT, NPWP, Alamat Kantor, Alamat Pabrik/Lokasi<br>Alat).|
||- Form input kontak PIC Klien (Nama, Jabatan,<br>Nomor WhatsApp aktif, dan Email). Bisa<br>menyimpan lebih dari 1 kontak PIC untuk satu<br>perusahaan.|



7 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Nama Halaman / Menu**|**Fitur yang Tersedia di Halaman Tersebut**|
|---|---|
|**3. Halaman Input PO & Daftar Unit Alat**|- Form pembuatan PO baru (Nomor PO, Tanggal<br>PO, upload file PDF/foto PO, dan rencana tanggal<br>pemeriksaan).|
||- Fitur tambah daftar unit alat di dalam PO tersebut<br>(pilih jenis alat dari 7 bidang K3, merk/tipe,<br>kapasitas, nomor seri, lokasi alat).<br>- Fitur 'Ambil dari Riwayat Alat Klien': jika klien<br>panjang dari tahun lalu, Marketing cukup centang<br>alat lama tanpa perlu ketik ulang spesifikasi dari<br>nol.|
|**4. Halaman Pantau Reminder & Follow-Up**<br>**Klien**|- Daftar klien yang sudah dikirimi WhatsApp &<br>Email reminder otomatis H-30, H-14, dan H-7.<br>- Tombol update status follow-up ('Sedang Dikirim<br>Penawaran', 'Menunggu PO', atau 'Sudah Terbit<br>PO Baru'). Jika sudah dibuatkan PO baru, sistem<br>otomatis menghentikan pengiriman reminder<br>berikutnya.|



#### **B. Halaman & Fitur untuk Role: INSPECTOR** 

|**Nama Halaman / Menu**|**Fitur yang Tersedia di Halaman Tersebut**|
|---|---|
|**1. Halaman Daftar Tugas Saya & Surat Tugas**|- Menampilkan daftar pekerjaan inspeksi yang<br>ditugaskan kepadanya (Nama Klien, Nomor PO,<br>Alamat Lokasi, Nama & WA PIC Lapangan, serta<br>daftar unit alat yang harus diperiksa).<br>- Tombol unduh/tampilkan 'Surat Tugas Resmi<br>(PDF)' di layar HP untuk ditunjukkan ke<br>Security/HSE pabrik klien saat masuk lokasi.|
|**2. Halaman Form Ceklis Pemeriksaan & Ukur**<br>**Teknis**|- Form ceklis digital yang otomatis menyesuaikan<br>dengan jenis alat (misal: form Forklift berbeda<br>dengan form Boiler atau Instalasi Listrik).<br>- Bagian input:<br>(a) Verifikasi Nameplate/Spesifikasi,<br>(b) Pilih Alat Ukur Internal yang dipakai,<br>(c) Ceklis Visual (Baik / Tidak Baik / N/A +<br>catatan),<br>(d) Hasil Ukur Teknis / NDT / Uji Beban (Load<br>Test), dan|



8 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Nama Halaman / Menu**|**Fitur yang Tersedia di Halaman Tersebut**|
|---|---|
||(e) Kesimpulan (Layak Operasi vs Belum Layak /<br>Perlu Perbaikan Klien).<br>- Fitur Mode Offline (Simpan di HP): tetap bisa<br>diisi walaupun di dalam pabrik tidak ada sinyal<br>internet, dan otomatis terkirim saat sinyal kembali<br>ada.|
|**3. Halaman Kamera & Upload Foto**<br>**Dokumentasi**|- Tombol buka kamera langsung pada setiap<br>bagian pemeriksaan (Foto Alat Keseluruhan, Foto<br>Nameplate, Foto Pengujian, Foto Temuan<br>Kerusakan).|
||- Fitur kompresi foto otomatis (ukuran file<br>diperkecil otomatis agar upload cepat tapi tulisan<br>di nameplate tetap tajam) dan kolom keterangan<br>singkat untuk tiap foto.|
|**4. Halaman Tanda Tangan BAP Lapangan &**<br>**Menu Revisi**|- Menampilkan ringkasan Berita Acara<br>Pemeriksaan (BAP) di layar HP setelah ceklis<br>selesai diisi.<br>- Kotak Tanda Tangan Layar Sentuh<br>(Touchscreen Signature) untuk ditandatangani<br>langsung oleh Inspector dan PIC Lapangan Klien.<br>- Daftar Revisi: menampilkan catatan dari Admin<br>jika ada foto atau data yang diminta untuk<br>diperbaiki.|



#### **C. Halaman & Fitur untuk Role: ADMIN** 

|**Nama Halaman / Menu**|**Fitur yang Tersedia di Halaman Tersebut**|
|---|---|
|**1. Halaman Dashboard &**|• Daftar laporan masuk dari Inspector yang berstatus 'Menunggu|
|**Antrean Verifikasi Admin**|Review Admin'.<br>• Daftar alat berstatus 'Pending Perbaikan Klien' dan berkas yang<br>sedang diproses di Disnaker.<br>• Peringatan jika ada Suket yang sudah terbit tapi belum diisi tanggal<br>habis masa berlakunya, atau jika ada SKP Inspector / Kalibrasi Alat<br>Ukur internal yang hampir mati.|
|**2. Halaman Review & QC**|• Tampilan layar terbagi dua: sebelah kiri menampilkan isian form ceklis|
|**Hasil Inspeksi (Split-Screen)**|& galeri foto dari Inspector (foto bisa diperbesar/zoom), sebelah kanan<br>menampilkan pratinjau dokumen LHPP & BAP.<br>• Fitur Edit Data (untuk merapikan salah ketik/typo dari lapangan).<br>• Tombol 'Minta Revisi ke Inspector' disertai kolom catatan bagian<br>mana yang kurang lengkap.|



9 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**3. Halaman Cetak Dokumen**|• Tombol Auto-Generate LHPP & BAP ke format Microsoft Word (.docx)|
|---|---|
|**Otomatis (LHPP, BAP, Surat**<br>**Tugas, Stiker QR, & BAST)**|dan PDF lengkap dengan Penomoran Surat Otomatis (Auto-<br>Numbering).<br>• Otomatis melampirkan file PDF SKP Ahli K3 Inspector dan Sertifikat<br>Kalibrasi Alat Ukur yang dipilih.<br>• Tombol cetak 'Stiker Label QR Code Alat' dan cetak 'Berita Acara<br>Serah Terima (BAST)' dokumen.|
|**4. Halaman Tracking**<br>**Disnaker & Upload Suket K3**|• Fitur update status proses Disnaker (Berkas Diajukan -> Verifikasi<br>Pengawas Disnaker -> Suket Terbit).<br>• Form Upload Scan PDF Suket K3 Resmi yang sudah keluar dari<br>Disnaker.<br>• Input Tanggal Terbit & Tanggal Habis Masa Berlaku Suket (begitu<br>disimpan, jadwal reminder H-30, H-14, dan H-7 langsung aktif secara<br>otomatis).|
|**5. Halaman Master**<br>**Database (Arsip Klien, Alat,**<br>**SKP, & Kalibrasi)**|• Tempat mencari dan mengunduh kembali seluruh dokumen lama<br>berdasarkan Nama Klien, Nomor PO, Jenis Alat, Nomor Seri, atau<br>Tahun.<br>• Menu untuk mengelola database masa berlaku SKP Inspector dan<br>Sertifikat Kalibrasi Alat Ukur milik PT Upaya Riksa Daya.|



#### **D. Halaman & Fitur untuk Role: MANAGER (PIMPINAN)** 

|**Nama Halaman / Menu**|**Fitur yang Tersedia di Halaman Tersebut**|
|---|---|
|**1. Halaman Dashboard Monitoring Pimpinan**|- Ringkasan total PO aktif, jumlah alat yang sedang<br>diperiksa, dokumen yang sedang direview Admin,<br>dan berkas di Disnaker.<br>- Papan pantau (status tracker) untuk melihat<br>pekerjaan mana yang lancar (Hijau) dan mana<br>yang terlambat/macet (Merah).|
|**2. Halaman Penjadwalan & Penugasan**<br>**Inspector**|- Melihat PO yang baru diinput oleh Marketing.<br>- Menunjuk/memilih Inspector yang akan bertugas<br>ke lapangan berdasarkan bidang keahlian SKP dan<br>jadwal kosong Inspector (sekaligus menerbitkan<br>Surat Tugas).|
|**3. Halaman Persetujuan Dokumen (Approval**<br>**LHPP & BAP)**|- Daftar dokumen LHPP dan BAP yang sudah<br>selesai diperiksa Admin dan siap disahkan.|



10 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Nama Halaman / Menu**|**Fitur yang Tersedia di Halaman Tersebut**|
|---|---|
||- Fitur baca pratinjau dokumen dan tombol 'Approve<br>/ Setujui' (otomatis membubuhkan tanda tangan<br>digital dan QR Code keaslian dokumen).|
|**4. Halaman Laporan Kinerja Tim & Konversi**|- Grafik rekap jumlah alat yang berhasil diperiksa|
|**Reminder**|per Inspector setiap bulan.<br>- Laporan hasil reminder berkala (berapa klien yang<br>jatuh tempo bulan ini dan berapa yang sudah<br>berhasil lanjut PO panjangan).|



#### **E. Halaman & Fitur untuk Role: SUPER ADMIN** 

|**Nama Halaman / Menu**|**Fitur yang Tersedia di Halaman Tersebut**|
|---|---|
|**1. Halaman Manajemen**<br>**User & Hak Akses (Role)**|- Tambah akun pengguna baru, edit data, nonaktifkan akun staf yang<br>keluar, dan fitur Reset Password.<br>- Pengaturan hak akses untuk 5 role (Super Admin, Manager, Admin,<br>Marketing, Inspector).|
|**2. Halaman Pengaturan**<br>**Master Alat, Form Ceklis, &**<br>**Format Nomor Surat**|- Fitur untuk menambah atau mengubah daftar pertanyaan ceklis untuk<br>tiap jenis alat K3 tanpa perlu mengubah kodingan program.<br>- Fitur upload master template Word/PDF LHPP & BAP serta<br>pengaturan format Nomor Surat Otomatis (misal: 001/LHPP-<br>PAPA/URD/XI/2026).|
|**3. Halaman Pengaturan**<br>**WhatsApp API & Email**|- Pengaturan koneksi WhatsApp Gateway (API Key, Nomor WA<br>Pengirim) dan konfigurasi server Email perusahaan.|
|**Reminder**|- Editor Template Pesan untuk mengatur isi kalimat pesan otomatis H-<br>30, H-14, dan H-7.|
|**4. Halaman Log Pengiriman,**<br>**Backup Database, & Audit**<br>**Sistem**|- Daftar riwayat pengiriman pesan WhatsApp dan Email harian (status:<br>Terkirim, Dibaca, atau Gagal) lengkap dengan tombol 'Kirim Ulang<br>(Retry)'.<br>- Menu Backup & Restore Database serta riwayat aktivitas pengguna<br>(Audit Log) untuk memudahkan problem solving.|



11 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



#### **3.3 Ringkasan User Stories** 

|**Kode**|**Role**|**Kebutuhan Pengguna**|
|---|---|---|
|**US-01**|Marketing|Sebagai Marketing, saya ingin memasukkan Nomor PO, data klien, kontak<br>WA/Email PIC, dan daftar unit alat dengan praktis (atau menarik data alat<br>dari PO tahun lalu), agar tim Inspector dan Admin langsung tahu detail<br>pekerjaan.|
|**US-02**|Marketing|Sebagai Marketing, saya ingin mendapat info saat klien dikirimi reminder<br>otomatis H-30, H-14, dan H-7, agar saya bisa langsung menghubungi klien<br>tersebut untuk menawarkan panjangan riksa uji.|
|**US-03**|Inspector|Sebagai Inspector, saya ingin mengunduh Surat Tugas, mengisi form ceklis<br>sesuai jenis alat, dan mengambil foto dokumentasi langsung di HP<br>(meskipun sinyal di dalam pabrik susah), agar saya tidak perlu mencatat di<br>kertas.|
|**US-04**|Inspector|Sebagai Inspector, saya ingin meminta tanda tangan PIC klien langsung di<br>layar HP untuk BAP lapangan dan menandai jika ada alat yang butuh<br>perbaikan terlebih dahulu oleh klien.|
|**US-05**|Admin|Sebagai Admin, saya ingin mengecek hasil input dan foto Inspector di satu<br>layar, meminta revisi jika ada yang kurang jelas, atau langsung mengunduh<br>LHPP & BAP berformat Word/PDF lengkap dengan nomor surat dan<br>lampiran SKP/Kalibrasi otomatis.|
|**US-06**|Admin|Sebagai Admin, saya ingin mengupload file Suket K3 yang sudah terbit dari<br>Disnaker beserta tanggal habis masa berlakunya dan mencetak stiker QR<br>Code alat, agar arsip tersimpan aman dan jadwal pengingat otomatis tahun<br>depan langsung aktif.|
|**US-07**|Manager|Sebagai Manager, saya ingin memantau progres semua PO secara<br>langsung, menunjuk Inspector yang bertugas, dan menyetujui dokumen<br>LHPP/BAP secara online dari mana saja.|
|**US-08**|Super Admin|Sebagai Super Admin, saya ingin mengelola akun user, mengatur template<br>form ceklis/dokumen, memantau backup database, dan mengecek log<br>pengiriman WhatsApp/Email, agar kendala teknis di sistem bisa cepat<br>diatasi.|



12 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



## **4. Persyaratan Produk, Dokumen Output, & Struktur Database** 

#### **4.1 Persyaratan Fungsional Utama** 

1. **Pencatatan PO & Multi-Unit Alat:** Satu Nomor PO bisa berisi banyak unit alat sekaligus dari berbagai bidang K3. Setiap unit alat memiliki status pengerjaan masing-masing sehingga jika ada 1 alat yang datanya perlu revisi atau menunggu perbaikan klien, alat lainnya di PO yang sama tetap bisa lanjut diproses sampai terbit Suket. 

2. **Alur Jika Alat Klien 'Belum Layak / Perlu Perbaikan Klien:** Jika saat diuji di lapangan ditemukan kerusakan/temuan bahaya (misal: rem forklift blong atau seling crane putus), Inspector dapat memilih status 'Perlu Perbaikan Klien'. Sistem akan mencetak Lembar Rekomendasi Temuan untuk diserahkan ke klien. Setelah klien memperbaiki alatnya dan mengirimkan foto bukti perbaikan, proses pembuatan LHPP & pengajuan Suket bisa dilanjutkan. 

3. **Penomoran Surat Otomatis (Auto-Numbering):** Sistem otomatis membuatkan nomor urut surat resmi untuk Surat Tugas, BAP, LHPP, dan BAST sesuai format PT Upaya Riksa Daya (contoh: 001/LHPP-PAPA/URD/XI/2026) sehingga Admin tidak perlu takut nomor surat ganda (double). 

4. **Notifikasi Internal Antar-Role:** Selain mengirim reminder ke klien, sistem juga mengirim notifikasi internal (lonceng web & WhatsApp internal): (a) Saat Marketing input PO baru -> notif ke Manager & Admin; (b) Saat Manager tunjuk Inspector -> notif ke Inspector; (c) Saat Inspector submit laporan -> notif ke Admin; (d) Saat Admin minta revisi -> notif ke Inspector; 

   - (e) Saat Admin selesai verifikasi -> notif ke Manager untuk Approve. 

5. **Pengingat Internal (Masa Berlaku SKP Inspector & Kalibrasi Alat Ukur):** Sistem juga memantau tanggal mati SKP Ahli K3 milik Inspector dan Sertifikat Kalibrasi Alat Uji internal perusahaan, serta memberi peringatan H-30 ke Admin & Manager sebelum masa berlakunya habis. 

13 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



#### **4.2 Daftar 7 Dokumen yang Dihasilkan & Dikelola di Sistem** 

Tabel berikut merangkum seluruh dokumen operasional riksa uji yang otomatis dibuat (auto-generate) maupun disimpan di dalam sistem : 

|**Nama Dokumen**|**Cara Pembuatan di**<br>**Sistem**|**Penanggung Jawab**|**Kegunaan Dokumen**|
|---|---|---|---|
|**1. Surat Tugas / SPK**<br>**Inspector**|Otomatis Dibuat Sistem<br>(PDF)|Manager / Admin|Diterbitkan otomatis<br>saat Manager<br>menunjuk Inspector<br>untuk dibawa ke lokasi<br>pabrik klien.|
|**2. Berita Acara**<br>**Pemeriksaan (BAP)**|Otomatis Dibuat Sistem<br>(PDF & Word)|Inspector & Admin|Ringkasan hasil<br>pemeriksaan di<br>lapangan yang memuat<br>tanda tangan layar<br>sentuh Inspector & PIC<br>Klien.|
|**3. Lembar Temuan /**<br>**Rekomendasi K3**|Otomatis Dibuat Sistem<br>(PDF)|Inspector & Admin|Dicetak jika ada alat<br>klien yang belum lulus<br>uji dan wajib diperbaiki<br>terlebih dahulu oleh<br>klien.|
|**4. Buku / Dokumen**<br>**LHPP Lengkap**|Otomatis Dibuat Sistem<br>(Word .docx & PDF)|Admin (Disetujui<br>Manager)|Laporan teknis lengkap<br>berisi data nameplate,<br>ceklis visual, hasil<br>ukur/NDT, uji beban,<br>foto lapangan rapi, QR<br>Sign-Off Manager,<br>serta lampiran otomatis<br>SKP & Kalibrasi.|
|**5. Surat Keterangan**<br>**(Suket) K3 Disnaker**|Di-upload ke Sistem<br>(Scan PDF)|Admin|File surat<br>izin/kelayakan resmi<br>dari Disnaker Provinsi<br>yang diupload Admin|



14 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Nama Dokumen**|**Cara Pembuatan di**<br>**Sistem**|**Penanggung Jawab**|**Kegunaan Dokumen**|
|---|---|---|---|
||||beserta input Tanggal<br>Habis Berlaku.|
|**6. Stiker / Label QR**<br>**Code Alat**|Otomatis Dibuat Sistem<br>(Siap Cetak)|Admin|Label stiker untuk<br>ditempel di fisik alat<br>klien; jika QR Code-nya<br>di-scan akan<br>menampilkan info<br>keaslian Suket &<br>tanggal jatuh tempo<br>riksa uji.|
|**7. Berita Acara Serah**<br>**Terima (BAST)**|Otomatis Dibuat Sistem<br>(PDF)|Admin|Bukti tanda terima<br>penyerahan bundel<br>dokumen asli (LHPP +<br>Suket K3) kepada klien.|



#### **4.3 Arsitektur Penyimpanan & Struktur 10 Tabel Database (ERD)** 

Untuk memastikan sistem berjalan cepat, aman, dan tidak mudah penuh meskipun menyimpan ribuan foto dan dokumen selama bertahun-tahun, penyimpanan data dibagi menjadi 2 tempat yang saling terhubung secara otomatis: 

1. **Database Utama (Relational Database PostgreSQL / MySQL):** Tempat menyimpan seluruh data teks, angka, akun pengguna, relasi Klien-PO-Alat, isian form ceklis, nomor surat otomatis, status pekerjaan, serta jadwal tanggal reminder H-30, H-14, dan H-7. 

2. **Penyimpanan File & Foto (Cloud Object Storage / File Server):** Tempat menyimpan seluruh file berukuran besar seperti ribuan foto lapangan dari Inspector, file PDF PO klien, file Word/PDF LHPP & BAP, serta scan Suket K3 Disnaker. Database utama hanya menyimpan tautan (link) ke file tersebut sehingga database tidak menjadi berat. 

15 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 





<!-- Start of picture text -->
Arsitektur Penyimpanan & Hubungan Antar-Tabel Database (Skema ERD Sistem URD-ERP)<br>1. MASTER USER & INTERNAL 2. DATABASE KLIEN & ALAT 3. TRANSAKSI PO & SPK 4, CEKLIS & FOTO LAPANGAN<br>+ + inspector_skpusers (5 Role &(MasaLogin)Berlaku) *+ client_pics clients (Profil (No Perusahaan)  WA & Email) ++ purchase_orderspo_items (Daftar (NoUnit PO)Diuji) ++ checklst_templatesinspections (Hasil Ukur(7 Bidang)& TTD)<br>calibration tools (Alat Uj) * client_equipments (Riwayat Alat) + work_orders (Surat Tugas) + inspection_photos (Link Foto)<br>'<br>'<br>i<br>8. AKSES MENU DATABASE 6. MESIN REMINDER & LOG 5. DOKUMEN & SUKET K3 7. CLOUD FILE STORAGE (S3)<br>+*+ MenuMenuMenu BackupArsipMaster DokumenKlienDB (Super&  K3AlatAdmin) +++ reminder_schedulesauditwa_emaillogs logs(Riwayat(Terkirim/Gagal)Aktivitas)(H-30/14/7) +++ doc_numbéringsuket_disnakergenerated_docs(Tal(No(LHPP/BAP/BAST) SuratKedaluwarsa) Otomatis| | +++ FileScanFoto WordLapanganPO, Suket(.docx)TerkompresiK3, & PDF LHPP/BAP& Kalibrasi<br><!-- End of picture text -->

_Gambar 1: Skema Arsitektur Penyimpanan & Hubungan Antar-Tabel Database (ERD) pada Sistem  PT Upaya Riksa Daya._ 

#### **Rincian 10 Tabel Utama di Dalam Database Sistem** 

|**Nama Tabel Database**|**Fungsi Penyimpanan**|**Kolom Data Utama yang**<br>**Disimpan**|
|---|---|---|
|**1. Tabel users & roles**|Data Pengguna & Hak Akses|id_user, nama, email, no_wa,<br>password_hash, role (Super<br>Admin / Manager / Admin /<br>Marketing / Inspector),<br>status_aktif.|
|**2. Tabel inspector_skp &**<br>**calibration_tools**|Database Legalitas Internal<br>(SKP & Alat Ukur)|id_skp / id_alat_ukur,<br>nama_inspector /<br>nama_alat_ukur, bidang_k3,<br>nomor_sertifikat,<br>tgl_habis_berlaku, file_pdf_url.|
|**3. Tabel clients & client_pics**|Database Perusahaan Klien &<br>Kontak PIC|id_client, nama_perusahaan,<br>npwp, alamat_kantor,<br>alamat_pabrik, id_pic,<br>nama_pic, jabatan, no_wa_aktif,<br>email_aktif.|
|**4. Tabel client_equipments**|Master Inventaris Unit Alat Milik<br>Klien|id_equipment, id_client,<br>bidang_k3 (1 s/d 7), jenis_alat<br>(Forklift/Boiler/dll), merk, tipe,<br>no_seri, kapasitas, tahun_buat,<br>lokasi_site.|
|**5. Tabel purchase_orders &**<br>**po_items**|Data PO Marketing & Daftar<br>Alat Diuji|id_po, id_client, id_marketing,<br>nomor_po, tgl_po, file_po_url,<br>jenis_riksa_uji<br>(Pertama/Berkala), id_po_item,<br>id_equipment, status_item.|



16 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Nama Tabel Database**|**Fungsi Penyimpanan**|**Kolom Data Utama yang**<br>**Disimpan**|
|---|---|---|
|**6. Tabel work_orders**|Penugasan & Surat Tugas<br>Inspector|id_wo, id_po, id_inspector,<br>id_manager_approver,<br>nomor_surat_tugas,<br>tgl_mulai_inspeksi, tgl_selesai,<br>file_surat_tugas_url.|
|**7. Tabel checklist_templates**|Master Pertanyaan Ceklis 7<br>Bidang K3|id_template, bidang_k3,<br>sub_jenis_alat, kategori_bagian<br>(Visual / NDT / Uji Beban),<br>daftar_pertanyaan_json.|
|**8. Tabel inspections &**<br>**inspection_photos**|Hasil Ceklis Lapangan, Foto, &<br>TTD BAP|id_inspection, id_po_item,<br>id_inspector,<br>data_nameplate_json,<br>hasil_ceklis_json,<br>hasil_ukur_json,<br>status_kelayakan,<br>ttd_inspector_url,<br>ttd_pic_klien_url, daftar_foto_url<br>& caption.|
|**9. Tabel generated_docs &**<br>**suket_disnaker**|Dokumen LHPP, BAP, BAST, &<br>Suket K3|id_doc, id_po_item,<br>no_surat_bap, no_surat_lhpp,<br>file_word_url, file_pdf_url,<br>tgl_approve_manager,<br>qr_code_hash,<br>no_suket_disnaker,<br>file_suket_url, tgl_terbit_suket,<br>tgl_habis_berlaku (Expiry Date).|
|**10. Tabel**<br>**reminder_schedules &**<br>**notification_logs**|Jadwal Reminder H-30/14/7 &<br>Log WA/Email|id_reminder, id_client,<br>id_po_item, tgl_habis_berlaku,<br>jadwal_h30, jadwal_h14,<br>jadwal_h7, status_reminder<br>(Aktif / Stop Karena Sudah<br>Panjang), waktu_kirim,<br>status_wa, status_email.|



17 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



#### **4.4 Aturan Pengingat Berkala Otomatis (H-30, H-14, H-7 via WhatsApp & Email)** 

|**Waktu**<br>**Pengiriman**|**Tahap Pengingat**|**Jalur Pengiriman**|**Tujuan Pengingat**|
|---|---|---|---|
|**H-30**|Pengingat Pertama|WhatsApp + Email ke|Memberi tahu klien lebih awal agar|
|**(30 Hari Sebelum**<br>**Habis)**|(Persiapan Jadwal)|PIC Klien|mereka punya waktu mengatur<br>jadwal penghentian alat sementara<br>(shutdown) dan pengajuan biaya<br>internal.|
|**H-14**<br>**(14 Hari Sebelum**<br>**Habis)**|Pengingat Kedua<br>(Follow-Up<br>Penawaran)|WhatsApp + Email +<br>Info ke Marketing|Mengingatkan kembali daftar alat<br>yang akan habis masa berlakunya<br>sekaligus memberi notifikasi ke<br>Marketing untuk mengirimkan surat<br>penawaran.|
|**H-7**|Pengingat|WhatsApp + Email +|Peringatan penting bahwa masa|
|**(7 Hari Sebelum**<br>**Habis)**|Mendesak<br>(1 Minggu Terakhir)|Tanda Merah di<br>Dashboard|berlaku Suket K3 tinggal 7 hari lagi<br>agar klien segera menjadwalkan<br>riksa uji ulang sebelum izin alatnya<br>mati.|



- **Penggabungan Pesan Otomatis (Anti-Spam):** Jika satu klien memiliki 10 alat yang masa berlakunya habis di tanggal yang sama, sistem menggabungkan daftar 10 alat tersebut ke dalam 1 pesan WhatsApp dan 1 Email yang rapi (tidak mengirim 10 pesan tisah). 

- **Otomatis Berhenti Jika Sudah Panjang:** Begitu klien menerbitkan PO panjangan baru (misalnya setelah pengingat H-30), maka pengingat H-14 dan H- 7 untuk alat tersebut otomatis dibatalkan oleh sistem. 

18 

|_PR_<br>|_D v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_<br>|
|---|---|
|**4.5 Persyaratan Non-Fun**<br>|**gsional**<br>|
|**Kategori**<br>|**Standar yang Diterapkan**<br>|
|**Kecepatan Sistem**<br>|- Waktu buka halaman di laptop maupun HP kurang dari 2 detik pada<br>jaringan internet normal.<br>- Proses pembuatan file Word/PDF LHPP & BAP otomatis selesai dalam<br>waktu kurang dari 10 detik.<br>|
|**Bisa Dipakai Tanpa Sinyal**<br>**(Mode Offline)**<br>|- Halaman Inspector di HP dilengkapi fitur penyimpanan lokal (Offline<br>PWA), sehingga saat berada di ruang boiler atau area pabrik yang tidak<br>ada sinyal, isian ceklis dan foto tetap aman tersimpan di HP dan baru di-<br>upload otomatis saat sinyal kembali stabil.<br>|
|**Kompresi Foto Otomatis**<br>|- Foto dari kamera HP (ukuran 5–12 MB) otomatis diperkecil menjadi<br>~350 KB saat diinput ke form tanpa mengurangi ketajaman tulisan pada<br>nameplate alat, sehingga kuota hemat dan penyimpanan server tidak<br>cepat penuh.<br>|
|**Keamanan & Backup**<br>**Rutin**<br>|- Setiap pengguna login menggunakan akun masing-masing dengan<br>pembatasan menu sesuai role.<br>- Seluruh database dan dokumen di-backup otomatis setiap malam pukul<br>01:00 WIB.<br>|



19 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



## **5. Desain & Alur Pengguna (User Flow & Design)** 

#### **5.1 Diagram Alur Kerja Sistem dari Awal Sampai Akhir** 

Gambar di bawah ini menunjukkan alur kerja yang saling menyambung antar-role di PT Upaya Riksa Daya, mulai dari PO masuk hingga pengiriman pengingat berkala ke klien: 



<!-- Start of picture text -->
Alur Kerja Sistem ERP PT Upaya Riksa Daya (Dari Input PO Sampai Reminder Berkala)<br>1. MARKETING 2. MANAGER 3. INSPECTOR 4. ADMIN 5. MANAGER & ADMIN<br>Input Data Klien, Cek PO Baru, Tunjuk 1s Form Cekiis & Foto Review QC, Generate Approve LHPP/BAP,<br>Kontak WalEmal PIC,<br>Nomor PO & Daftar Alat SuratInspector gas& Teritkan Otomatls TTDi HP (Bisa BAP dh Omtine) Lokas SKPMKabrasiLPP& BAP, 6Lampirkan Disnaker | | QRUpload Stiker Suet & To! Terbt.Cetak Kedeluwarsa<br>6. PENGINGAT OTOMATIS KE KLIEN VIA WHATSAPP & EMAIL (H-30, H-14, & H-7) + REMINDER INTERNAL<br>Sistem otomats mengiim WA & Email ke Kllen pada H-30, H-14, dan H-7 sebelum masa beriaku Suet habis<br>"S'Marketing dapat natificas! untuk foliow-up penawaran > Kllen perpanjang PO (Repeat Order)<br><!-- End of picture text -->

_Gambar 2: Alur Kerja End-to-End Sistem  PT Upaya Riksa Daya (Marketing -> Manager -> Inspector -> Admin -> Reminder_ 

_Otomatis)._ 

#### **5.2 Urutan 10 Status Pekerjaan di Dalam Sistem** 

|**Status Pekerjaan**|**Role Terkait**|**Keterangan Kondisi**|
|---|---|---|
|**1. PO Baru Masuk**|Marketing|PO dan daftar unit alat baru saja<br>disimpan oleh Marketing;<br>menunggu penjadwalan<br>Inspector.|
|**2. Terjadwal & Surat Tugas**<br>**Terbit**|Manager / Admin|Inspector yang bertugas sudah<br>ditunjuk dan Surat Tugas PDF<br>sudah siap diunduh di HP<br>Inspector.|
|**3. Proses Inspeksi Lapangan**|Inspector|Inspector sedang berada di<br>lokasi klien untuk mengisi ceklis,<br>mengambil foto, dan meminta<br>tanda tangan BAP.|
|**4. Pending Perbaikan Klien**<br>**(Opsional)**|Inspector / Admin|Jika saat diuji ditemukan<br>kerusakan pada alat yang wajib<br>diperbaiki klien terlebih dahulu<br>sebelum LHPP/Suket bisa<br>lanjut.|



20 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Status Pekerjaan**|**Role Terkait**|**Keterangan Kondisi**|
|---|---|---|
|**5. Menunggu Review Admin**|Inspector|Inspector sudah selesai submit<br>hasil lapangan; draf LHPP &<br>BAP otomatis terbentuk untuk<br>dicek Admin.|
|**6. Perlu Revisi Inspector**|Admin|Admin mengembalikan laporan<br>ke Inspector karena ada data<br>atau foto yang perlu diperbaiki.|
|**7. Menunggu Approval**<br>**Manager**|Admin|Admin sudah memverifikasi<br>LHPP & BAP serta melampirkan<br>SKP/Kalibrasi; menunggu<br>persetujuan akhir Manager.|
|**8. Proses Suket Disnaker**|Admin|LHPP & BAP sudah disetujui<br>Manager dan berkas sedang<br>diajukan ke Disnaker Provinsi.|
|**9. Selesai & Masa Berlaku**<br>**Aktif**|Admin|Suket K3 sudah terbit, file PDF<br>Suket sudah diupload, stiker QR<br>dicetak, dan tanggal habis masa<br>berlaku sudah disimpan.|
|**10. Masa Reminder (H-**<br>**30/14/7)**|Sistem Otomatis|Masa berlaku alat tinggal 30, 14,<br>atau 7 hari; sistem mengirim WA<br>& Email pengingat ke klien.|



#### **5.3 Contoh Format Pesan Reminder Otomatis (WhatsApp & Email)** 

**Contoh Pesan Pengingat WhatsApp / Email ke Klien (H-30, H-14, & H-7)** 

Halo Bapak/Ibu [Nama PIC] dari [Nama Perusahaan Klien], 

Kami dari PT Upaya Riksa Daya ingin menginformasikan bahwa masa berlaku Surat Keterangan (Suket) K3 untuk peralatan kerja di tempat Bapak/Ibu akan berakhir dalam [30 / 14 / 7] Hari lagi (Tanggal Habis Berlaku: [Tanggal Kedaluwarsa]), dengan rincian alat sebagai berikut: 

1. **[Nama Alat 1 - Merk/Kapasitas]** — No. Seri: [SN] | Lokasi: [Area Pabrik] 

2. **[Nama Alat 2 - Merk/Kapasitas]** — No. Seri: [SN] | Lokasi: [Area Pabrik] 

Untuk menjaga keselamatan kerja dan kepatuhan regulasi K3 Disnaker/Kemnaker, silakan hubungi tim Marketing kami ([Nama Marketing - Nomor WA]) atau balas pesan ini untuk penjadwalan riksa uji berkala. Terima kasih atas kerja samanya. 

21 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



## **6. Metrik & Analitik Keberhasilan (KPI)** 

Keberhasilan penggunaan sistem ini diukur dari seberapa besar waktu kerja yang berhasil dihemat dan seberapa efektif pengingat otomatis meningkatkan panjangan kontrak klien: 



<!-- Start of picture text -->
Perbandingan Waktu Kerja: Manual vs Sistem ERP Jadwal Pengingat Otomatis (H-30, H-14, H-7)<br>Input PO & oS Jem<br>Data Alat 4.0Jam<br>LHPPBuat Draf fim 25)lama 4-30 Had 7 H0<br>& BAP 32.0 Jam ° e © e@<br>Reviewoleh  &Admin Cek 1.0 'Jam 12.0 Jam PengingatSiapkanTHe Jadwal emai)PertamaUji Follow-UpPengingatWASEmall.”PenawaranKedua Pengingat1 Minggu"(WA MendesalfanggalEmail)Sebelum MasaSuket BertiHabisK3,<br>GAnggaran Klien oleh Marketing Masa Serlaku Habis<br>Rekap & Kirim 0.2 Jam Catatan: Jika klien sudah menerbitkan PO perpanjangan saat H-30 atau H-14,<br>Reminder Klien 6.0 jam mmSm PakaiCara ManualSistem (SaatERP Ini) | sistem ofomatis menghentikan pengiriman reminder berikutnya Supaya tidak spam.<br>0) 5 10 15 20 25 30 35<br>Rata-Rata Waktu Pengerjaan (Jam Kerja)<br><!-- End of picture text -->

_Gambar 3: (Kiri) Perbandingan Waktu Pengerjaan Manual vs Sistem ; (Kanan) Skema Waktu Pengiriman Reminder H-30, H-14, &_ 

_H-7._ 

|**Ukuran Keberhasilan**|**Kondisi Manual**|**Target dengan**|**Cara Mengukurnya**|
|---|---|---|---|
|**(KPI)**|**Saat Ini**|**Sistem**||
|**Waktu Pembuatan Draf**|3 – 5 hari kerja|Langsung jadi (< 2|Diukur dari selisih waktu|
|**LHPP & BAP**|setelah dari<br>lapangan|jam) setelah data<br>lapangan di-submit|selesai inspeksi sampai draf<br>dokumen muncul di layar<br>Admin.|
|**Waktu Pengecekan**|1 – 2 hari kerja per|Kurang dari 30 menit|Diukur dari waktu laporan|
|**oleh Admin**|laporan|per unit alat|masuk ke Admin sampai<br>selesai diverifikasi.|
|**Kelengkapan Data dari**|Sering ada|Minimal 90% laporan|Karena di HP Inspector|
|**Lapangan**|foto/data yang lupa<br>diambil|langsung lengkap<br>sekali jalan|sudah ada pengingat kolom<br>wajib isi sebelum bisa di-<br>submit.|
|**Ketepatan Pengiriman**|Sering terlewat|100% terkirim|Dipantau langsung dari|
|**Reminder**|karena cek manual<br>di Excel|otomatis tepat jadwal<br>H-30, H-14, H-7|halaman Log Pengiriman<br>WhatsApp & Email.|



22 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Kenaikan Repeat**|Banyak klien|Naik minimal 35%|Dihitung dari jumlah alat|
|---|---|---|---|
|**Order Klien**|terlambat dihubungi|klien mempanjang|jatuh tempo yang berlanjut|
|||tepat waktu|menjadi PO baru.|



23 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



## **7. Rencana Pengerjaan, Solusi Risiko, & Skenario Pengujian (UAT)** 

#### **7.1 Hal yang Perlu Disiapkan (Asumsi & Ketergantungan)** 

**1. Akun WhatsApp Resmi (WhatsApp Gateway):** Perusahaan menyiapkan akun layanan WhatsApp Gateway / Business API resmi agar pengiriman pesan pengingat otomatis berjalan lancar dan nomor tidak mudah terblokir. 

**2. Contoh File LHPP, BAP, Surat Tugas, & Ceklis Saat Ini:** Tim Admin dan Inspector memberikan contoh dokumen Word/Excel LHPP, BAP, serta ceklis dari ke-7 bidang K3 yang biasa dipakai sekarang agar cetakan otomatis di sistem persis sesuai standar PT Upaya Riksa Daya. 

|**3. Data Awal SKP Inspe**<br>K3 milik seluruh Inspec<br>database awal sistem.<br>**7.2 Kemungkinan Kendala &**|**ctor & Ala**<br>tor dan S<br> <br>**Solusin**|**t Ukur:**Admin mengumpulkan file PDF SKP Ahli<br>ertifikat Kalibrasi Alat Ukur untuk dimasukkan ke<br>**ya (Risk & Mitigation)**|
|---|---|---|
|**Kemungkinan Kendala /**<br>**Risiko**<br>|**Dampak**<br>|**Solusi yang Disiapkan di Sistem**<br>|
|**Di dalam pabrik klien tidak**<br>**ada sinyal internet saat**<br>**Inspector memeriksa alat.**<br>|Tinggi<br>|Halaman form Inspector dilengkapi Mode Offline,<br>sehingga isian ceklis dan foto tersimpan aman di<br>memori HP dan baru terkirim otomatis saat kembali<br>mendapat sinyal.<br>|
|**Nomor WhatsApp PIC Klien**<br>**sudah ganti atau tidak aktif**<br>**saat dikirimi reminder.**<br>|Sedang<br>|Reminder dikirim lewat 2 jalur sekaligus (WhatsApp +<br>Email) ke lebih dari satu kontak PIC, serta memberi<br>tanda peringatan di layar Marketing jika pesan gagal<br>terkirim.<br>|
|**Ada klien tertentu yang**<br>**meminta tambahan kalimat**<br>**khusus di laporan LHPP.**<br>|Sedang<br>|Selain format PDF, sistem menyediakan hasil unduhan<br>dalam bentuk Microsoft Word (.docx) supaya Admin<br>tetap bisa mengedit isi dokumen dengan bebas bila<br>diperlukan.<br>|
|**Memori server cepat penuh**<br>**karena ribuan foto**<br>|Sedang<br>|Sistem otomatis mengecilkan ukuran file foto (auto-<br>compress ke ~350 KB) saat diambil dari HP dan<br>|
|**dokumentasi dari lapangan.**||menyimpannya di Cloud Object Storage tisah.|



24 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Tim butuh waktu adaptasi**|Sedang|Tampilan dibuat sesederhana mungkin, diadakan sesi|
|---|---|---|
|**dari cara manual kertas ke**||latihan bersama (training), dan didampingi selama|
|**aplikasi baru.**||masa awal pemakaian.|



#### **7.3 Estimasi Jadwal Pengerjaan (Timeline 14–16 Minggu)** 

|**Tahap Pengerjaan**|**Perkiraan**<br>**Waktu**|**Fokus Pekerjaan & Hasil**|
|---|---|---|
|**Tahap 1: Pengumpulan**|Minggu 1 – 2|- Mengumpulkan contoh form ceklis, LHPP, dan BAP|
|**Template, Desain**||dari tim PT Upaya Riksa Daya.|
|**Database & UI/UX**||- Merancang tabel Database (ERD) dan desain<br>tampilan layar (mockup Figma) untuk 5 role.|
|**Tahap 2: Sistem Dasar,**|Minggu 3 – 5|- Membuat halaman Login, manajemen 5 Role, dan|
|**Pengaturan Role &**<br>**Halaman Marketing**||database SKP/Alat Ukur.<br>- Membuat halaman Data Klien, PIC, dan Input PO<br>beserta Daftar Alat untuk Marketing.<br>- Membuat fitur Penjadwalan & Surat Tugas Inspector<br>untuk Manager.|
|**Tahap 3: Halaman Mobile**<br>**Inspector (Ceklis, Foto &**|Minggu 6 – 9|- Membuat form ceklis digital di HP sesuai 7 bidang alat<br>K3.|
|**Offline)**||- Membuat fitur ambil foto langsung, kompresi otomatis,<br>simpan offline, dan tanda tangan BAP di layar HP.|
|**Tahap 4: Mesin Pembuat**<br>**LHPP/BAP & Halaman**<br>**Admin/Manager**|Minggu 10 –<br>12|- Membuat fitur auto-generate dokumen LHPP, BAP,<br>Stiker QR, & BAST ke format Word (.docx) dan PDF.<br>- Membuat halaman Review Admin, alur Revisi, upload<br>Suket Disnaker, dan Approval Manager.|
|**Tahap 5: Fitur Reminder**|Minggu 13 –|- Menghubungkan sistem dengan WhatsApp API dan|
|**Otomatis H-30, H-14, H-7**|14|Email.|
|**(WA & Email)**||- Mengatur jadwal pengiriman otomatis H-30, H-14, dan<br>H-7 serta halaman pantau Log Pengiriman.|
|**Tahap 6: Uji Coba**|Minggu 15 –|- Uji coba langsung memakai contoh PO asli bersama|
|**Bersama (UAT), Training &**<br>**Mulai Dipakai**|16|Marketing, Inspector, Admin, Manager, dan Super<br>Admin.<br>- Pelatihan singkat pemakaian sistem dan peluncuran<br>resmi (Go-Live).|



25 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



#### **7.4 Lampiran Ceklis Skenario Pengujian Bersama Klien (UAT Checklist)** 

Tabel di bawah ini digunakan sebagai panduan pengujian bersama (User Acceptance Test / UAT) saat aplikasi selesai dibuat untuk memastikan seluruh kebutuhan kelima role telah berjalan sesuai kesepakatan: 

|**Kode**<br>**Uji**|**Role Penguji**|**Skenario yang Diuji Coba**|**Hasil yang Diharapkan (Lulus**<br>**Uji)**|
|---|---|---|---|
|**UAT-01**|Super Admin|Membuat akun untuk 5 role,<br>mengupload data SKP Inspector &<br>Kalibrasi Alat Ukur, serta mengatur<br>template pesan WA/Email.|Akun berhasil login sesuai role<br>dan data master tersimpan di<br>database.|
|**UAT-02**|Marketing|Menginput data Klien baru, 2 kontak<br>PIC (WA & Email), Nomor PO, dan<br>menambahkan 3 unit alat berbeda di<br>dalam PO tersebut.|PO tersimpan di database,<br>muncul di dashboard Manager &<br>Admin.|
|**UAT-03**|Manager|Memilih Inspector untuk PO tersebut<br>dan menetapkan tanggal<br>pelaksanaan riksa uji.|Status berubah menjadi<br>'Terjadwal', Surat Tugas PDF<br>otomatis terbit, dan muncul di HP<br>Inspector.|
|**UAT-04**|Inspector|Mematikan sinyal internet HP (mode<br>offline), mengisi form ceklis,<br>memotret 5 foto alat, tanda tangan<br>BAP di layar, lalu menyalakan sinyal<br>kembali dan klik Submit.|Seluruh data ceklis, foto<br>terkompresi, dan tanda tangan<br>terkirim utuh ke server tanpa ada<br>yang hilang.|
|**UAT-05**|Admin|Mencoba klik 'Minta Revisi' pada 1<br>alat, lalu pada alat lainnya klik<br>'Generate LHPP & BAP' dalam<br>bentuk Word (.docx) dan PDF.|Notifikasi revisi masuk ke HP<br>Inspector; file Word & PDF<br>LHPP/BAP terunduh rapi dengan<br>nomor surat dan lampiran SKP<br>otomatis.|
|**UAT-06**|Manager &<br>Admin|Manager klik 'Approve' pada LHPP;<br>kemudian Admin mengupload PDF<br>Suket K3 Disnaker, mencetak Stiker|Dokumen LHPP memiliki QR<br>Sign-Off Manager; masa berlaku<br>Suket tersimpan dan masuk ke<br>antrean jadwal reminder.|



26 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Kode**|**Role Penguji**|**Skenario yang Diuji Coba**|**Hasil yang Diharapkan (Lulus**|
|---|---|---|---|
|**Uji**|||**Uji)**|
|||QR Code, dan mengisi Tanggal<br>Habis Masa Berlaku.||
|**UAT-07**|Sistem &|Menguji simulasi tanggal jatuh tempo|Pesan WA & Email terkirim|
||Marketing|tepat pada H-30, H-14, dan H-7, lalu|otomatis ke PIC Klien; saat PO|
|||Marketing membuat PO panjangan|baru dibuat, reminder tahap|
|||baru.|berikutnya otomatis berhenti.|



27 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



## **8. Glosarium (Daftar Istilah & Singkatan)** 

Bagian ini berisi penjelasan istilah-istilah operasional K3 dan istilah teknis aplikasi yang digunakan di dalam dokumen PRD ini, agar seluruh pihak memiliki pemahaman yang sama: 

#### **8.1 Istilah Operasional & Regulasi Riksa Uji K3 (PJK3)** 

|**Istilah / Singkatan**|**Penjelasan Arti & Penggunaan di Operasional**|
|---|---|
|**PJK3**|Perusahaan Jasa Keselamatan dan Kesehatan Kerja. Perusahaan resmi<br>(seperti PT Upaya Riksa Daya) yang ditunjuk oleh Kementerian<br>Ketenagakerjaan RI untuk melakukan pemeriksaan dan pengujian teknis alat<br>K3.|
|**Riksa Uji**|Pemeriksaan dan Pengujian K3. Kegiatan memeriksa kondisi fisik dan menguji<br>kelayakan fungsi peralatan kerja di lokasi klien agar aman dioperasikan dan<br>sesuai standar pemerintah.|
|**LHPP**|Laporan Hasil Pemeriksaan dan Pengujian. Buku/dokumen laporan teknis<br>lengkap yang disusun dari hasil ceklis, pengukuran, perhitungan teknis, dan<br>foto dokumentasi Inspector di lapangan.|
|**BAP**|Berita Acara Pemeriksaan. Dokumen bukti resmi bahwa pemeriksaan fisik di<br>lapangan telah selesai dilaksanakan pada tanggal tersebut, ditandatangani<br>oleh Inspector dan perwakilan (PIC) klien di lokasi.|
|**Suket K3 / SIA**|Surat Keterangan Kelayakan K3 / Surat Izin Alat. Sertifikat/surat izin resmi<br>yang diterbitkan oleh Dinas Tenaga Kerja (Disnaker) Provinsi yang<br>menyatakan suatu peralatan layak dan aman dioperasikan hingga tanggal<br>masa berlaku tertentu.|
|**Disnaker / Kemnaker**|Dinas Tenaga Kerja (tingkat Provinsi) dan Kementerian Ketenagakerjaan RI.<br>Instansi pemerintah yang mengawasi regulasi K3 dan menerbitkan Suket K3<br>serta SKP.|
|**SKP Ahli K3**|Surat Keputusan Penunjukan Ahli K3. Lisensi resmi dari Kemnaker yang wajib<br>dimiliki oleh setiap Inspector sesuai bidang keahliannya (misal: Ahli K3<br>Pesawat Angkat & Angkut, Ahli K3 Listrik, dll.).|



28 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Istilah / Singkatan**|**Penjelasan Arti & Penggunaan di Operasional**|
|---|---|
|**PAPA**|Pesawat Angkat dan Pesawat Angkut. Kelompok alat kerja untuk<br>mengangkat/memindahkan muatan seperti Forklift, Mobile Crane, Overhead<br>Crane, Gondola, Excavator, dan Manlift.|
|**PUBT**|Pesawat Uap, Bejana Tekan, dan Tangki Timbun. Kelompok peralatan<br>bertekanan atau bersuhu tinggi seperti Ketel Uap (Boiler), Kompresor, Air<br>Receiver Tank, dan Tangki Timbun.|
|**PTP**|Pesawat Tenaga dan Produksi. Kelompok mesin pembangkit tenaga atau<br>mesin produksi pabrik seperti Genset (Motor Diesel), Turbin, Mesin Perkakas,<br>dan Tanur (Furnace).|
|**ILPP & IPK**|Instalasi Listrik dan Penyalur Petir (ILPP) serta Instalasi Proteksi Kebakaran<br>(IPK, meliputi Fire Hydrant, Fire Alarm, dan Sprinkler).|
|**NDT**|Non-Destructive Test (Pengujian Tidak Merusak). Metode pengujian teknis<br>pada material alat tanpa merusak fisiknya, misalnya mengukur ketebalan pelat<br>besi dengan Ultrasonic Thickness Gauge atau mengecek retak las dengan<br>cairan Penetrant.|
|**Load Test & SWL**|Load Test adalah pengujian beban secara langsung pada alat angkat. SWL<br>(Safe Working Load) adalah batas beban kerja aman maksimum yang boleh<br>diangkat oleh alat tersebut.|
|**Nameplate**|Pelat identitas resmi yang menempel pada bodi mesin/alat kerja, berisi<br>informasi Pabrik Pembuat, Merk, Tipe/Model, Nomor Seri (Serial Number),<br>Tahun Pembuatan, dan Kapasitas.|
|**PO (Purchase Order)**|Dokumen surat pesanan kerja resmi dari perusahaan klien kepada PT Upaya<br>Riksa Daya yang menjadi dasar dimulainya pekerjaan riksa uji.|
|**PIC Klien**|Person In Charge. Perwakilan dari perusahaan klien (biasanya staf HSE,<br>Safety Officer, Maintenance, atau Purchasing) yang menjadi narahubung di<br>lokasi kerja dan penerima pesan reminder.|
|**Surat Tugas / SPK**|Surat Perintah Kerja resmi yang diterbitkan perusahaan untuk dibawa oleh<br>Inspector saat berkunjung ke lokasi pabrik klien.|
|**BAST**|Berita Acara Serah Terima. Dokumen tanda terima resmi saat bundel<br>dokumen akhir (Buku LHPP dan Suket K3 asli) diserahkan kepada klien.|



29 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



#### **8.2 Istilah Teknis Aplikasi & Sistem** 

|**Istilah Sistem / IT**|**Penjelasan Arti dalam Bahasa Sederhana**|
|---|---|
|**ERP**|Entrise Resource Planning. Sistem aplikasi tadu yang menghubungkan<br>pekerjaan berbagai divisi (Marketing, Inspector, Admin, Manager, dan Super<br>Admin) dalam satu tempat.|
|**PRD**|Product Requirements Document. Dokumen panduan utama ini yang<br>menjelaskan secara rinci fitur, alur kerja, tampilan halaman, dan aturan sistem<br>sebelum aplikasi dibuat.|
|**Role / RBAC**|Pembagian peran dan hak akses pengguna di dalam aplikasi. Setiap role<br>hanya bisa melihat menu dan tombol yang sesuai dengan tugasnya masing-<br>masing.|
|**PWA & Mode Offline**|Progressive Web App. Teknologi web modern yang membuat aplikasi bisa<br>dibuka dengan nyaman di HP seperti aplikasi biasa dan tetap bisa menyimpan<br>isian ceklis serta foto meskipun tidak ada sinyal internet di dalam pabrik.|
|**Auto-Generate**|Fitur pembuat dokumen otomatis. Sistem langsung mengubah data ceklis dan|
|**Document**|foto yang diinput Inspector menjadi file dokumen LHPP dan BAP berformat<br>Word (.docx) dan PDF tanpa perlu diketik manual.|
|**Auto-Numbering**|Penomoran surat otomatis oleh sistem agar setiap dokumen (Surat Tugas,<br>BAP, LHPP, BAST) memiliki nomor urut resmi yang rapi dan tidak pernah<br>ganda (double).|
|**Cronjob Reminder (H-**<br>**30, H-14, H-7)**|Mesin penjadwal otomatis di dalam server yang bekerja setiap pagi untuk<br>mengecek alat klien yang masa berlakunya tinggal 30 hari, 14 hari, atau 7 hari,<br>lalu mengirimkan pesan pengingat secara otomatis.|
|**WhatsApp**<br>**Business**<br>**API / Gateway**|Jalur koneksi resmi untuk mengirim pesan WhatsApp otomatis dari sistem<br>langsung ke nomor WhatsApp PIC Klien atas nama PT Upaya Riksa Daya.|
|**Auto-Compress Foto**|Fitur pengecil ukuran file foto otomatis di HP Inspector (dari ukuran besar 8–<br>10 MB menjadi ~350 KB) agar proses upload cepat dan hemat memori server<br>namun gambar tetap tajam.|
|**Database & ERD**|Database adalah tempat penyimpanan seluruh data di server. ERD (Entity<br>Relationship Diagram) adalah bagan yang menggambarkan hubungan antar-<br>tabel data (misal hubungan tabel Klien, PO, Alat, dan Suket).|



30 

_PRD v0.1 - Sistem Digitalisasi Dokumen & Riksa Uji | PT Upaya Riksa Daya_ 



|**Istilah Sistem / IT**<br>|**Penjelasan Arti dalam Bahasa Sederhana**<br>~~s~~|
|---|---|
|**Cloud Object Storage**<br>|Media penyimpanan file digital khusus untuk menampung ribuan foto<br>|
|**(S3)**|dokumentasi lapangan dan file PDF/Word berukuran besar agar database<br>utama tetap ringan dan cepat.|
|**UAT (User Acceptance**|Tahap uji coba aplikasi bersama pengguna asli (perwakilan Marketing,|
|**Test)**|Inspector, Admin, Manager, dan Super Admin) untuk memastikan semua fitur<br>sudah sesuai kebutuhan sebelum resmi dipakai.|



31 

