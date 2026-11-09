# PT Upaya Riksa Daya (URD) — Architectural & Business Decisions Registry

Dokumen ini mencatat keputusan arsitektur dan bisnis yang telah ditetapkan (*Resolved Decisions*), serta butir-butir yang memerlukan keputusan manajemen (*Decisions Required*) beserta rekomendasi keteknikannya.

---

## 1. Keputusan Bisnis & Arsitektur yang Telah Ditetapkan (*Resolved Decisions*)

### ADR-015: Penegakan Peran Pimpinan / Manager Strictly Read-Only
- **Latar Belakang**: Terdapat variasi pada dokumentasi awal di mana Pimpinan sempat digambarkan ikut menyetujui atau menolak LHPP.
- **Keputusan Resmi**: Sesuai ADR 015, peran Pimpinan/Manager adalah murni **pemantauan eksekutif *read-only***. Seluruh wewenang teknis Quality Control (QC), penolakan revisi, dan finalisasi dokumen resmi dipegang secara berintegritas oleh Admin Kantor dan Ahli K3 bersertifikat. Pimpinan dibebaskan dari beban approval operasional harian dan fokus pada dasbor analitik, utilisasi tim, dan pemantauan kepatuhan legalitas K3.
- **Status**: **RESOLVED & DIKUNCI DI KODE (RBAC)**.

### ADR-016: Independensi Siklus Hidup Multi-Unit dalam Satu PO
- **Latar Belakang**: Klien sering menerbitkan satu PO komersial yang mencakup berbagai alat dari bidang berbeda (misal: 1 Overhead Crane PAA, 2 Bejana Tekan PUBT, 1 Genset PTP).
- **Keputusan Resmi**: Setiap unit alat memiliki status progres independen (`unit_status`). Jika satu unit memerlukan revisi data teknis oleh Inspector, unit lain yang telah lolos QC dapat langsung difinalisasi LHPP/BAP-nya dan diserahkan kepada klien tanpa harus tertahan. Status PO secara agregat baru berubah menjadi `SELESAI` setelah 100% unit di dalamnya selesai.
- **Status**: **RESOLVED & TERUJI (UAT)**.

### ADR-017: Penegakan Urutan Penerbitan Dokumen (LHPP → BAP)
- **Latar Belakang**: Berita Acara Pemeriksaan (BAP) mencantumkan ringkasan legalitas dan kesimpulan dari Laporan Hasil Pemeriksaan & Pengujian (LHPP).
- **Keputusan Resmi**: Sistem mewajibkan LHPP difinalisasi terlebih dahulu sebelum dokumen BAP unit tersebut dapat difinalisasi. Upaya memfinalisasi BAP sebelum LHPP final ditolak dengan error 400 `URUTAN_DOKUMEN_LHPP_BAP`.
- **Status**: **RESOLVED & TERUJI (API)**.

### ADR-018: Taksonomi Alat 3-Level & Isolasi Checklist per Nama Alat
- **Latar Belakang**: Menghindari ambiguitas antara kelompok alat (misal: "Forklift") dan tipe alat spesifik (misal: "REACH STACKER", "COUNTERBALANCE FORKLIFT").
- **Keputusan Resmi**: Hirarki distandarisasi menjadi 3 tingkat:
  1. *Level 1*: Bidang Riksa Uji (`inspection_domains`, 7 Bidang).
  2. *Level 2*: Jenis / Kelompok Alat (`equipment_groups`, misal: Forklift, Mobile Crane).
  3. *Level 3*: Nama / Tipe Unit (`equipment_types`, misal: REACH STACKER, ROUGH TERRAIN CRANE).
  Checklist dinamis dikonfigurasi dan diisolasi secara spesifik per Nama Alat (Level 3).
- **Status**: **RESOLVED & TERUJI (API & FRONTEND)**.

### ADR-019: Prinsip Copy-on-Write Versioning pada Template
- **Latar Belakang**: Perubahan regulasi K3 atau penambahan butir checklist baru tidak boleh merusak atau mengubah secara retrospektif data inspeksi lampau yang telah selesai.
- **Keputusan Resmi**: Setiap modifikasi pada checklist atau template LHPP tidak menimpa baris yang ada, melainkan menerbitkan versi baru (`V2`, `V3`, dst.) dengan status `AKTIF`, sedangkan versi sebelumnya diarsipkan (`ARSIP`). Dokumen lampau tetap terhubung ke versi yang berlaku pada saat inspeksi dilakukan.
- **Status**: **RESOLVED & TERUJI (API & DATABASE)**.

---

## 2. Butir Keputusan Operasional Terbuka (*Decisions Required*)

Berikut adalah butir-butir yang memerlukan konfirmasi administratif atau penyediaan kredensial dari manajemen URD untuk lingkungan produksi (tidak memblokir kelayakan teknis aplikasi saat ini):

### DECISION REQUIRED #1: Kredensial Produksi SMTP & WhatsApp Gateway
- **Konteks**: Saat ini pengujian koneksi SMTP dan WhatsApp Gateway pada `system_settings` telah dilengkapi verifikasi ketat yang melaporkan kegagalan secara jujur (*truthful failure reporting*) jika kredensial belum diisi, dan berfungsi simulasi aman tanpa membocorkan rahasia.
- **Tindakan Diperlukan oleh Manajemen**:
  1. Menentukan penyedia SMTP resmi korporat (misal: Google Workspace SMTP Relay / SendGrid / AWS SES) dan memasukkan parameter pada `.env` server produksi.
  2. Menentukan vendor WhatsApp Gateway resmi (misal: Fonnte / Wablas / Twilio WhatsApp) untuk pengiriman notifikasi pengingat otomatis ke PIC Klien.
- **Dampak Keteknikan**: Nol risiko pada data; aplikasi saat ini berjalan stabil dan mencatat simulasi pengingat ke tabel `client_reminder_log`.

### DECISION REQUIRED #2: Penentuan Format Resmi Kode Penomoran Surat K3
- **Konteks**: Modul penomoran otomatis mendukung format dinamis dengan tag `{COUNTER}`, `{YEAR}`, `{MONTH}`, `{ROMAN_MONTH}`, dan `{BIDANG_CODE}` (misal: `{COUNTER}/URD-LHPP/{BIDANG_CODE}/{ROMAN_MONTH}/{YEAR}`).
- **Tindakan Diperlukan oleh Manajemen**:
  - Mengonfirmasi pola baku penomoran yang berlaku resmi di kantor operasional Cikarang/Bekasi untuk masing-masing berkas (Surat Tugas, LHPP, BAP, BAST).
- **Dampak Keteknikan**: Pola penomoran dapat diubah sewaktu-waktu oleh Super Admin melalui halaman `/app/settings` tanpa memerlukan perubahan kode (*code change*).

