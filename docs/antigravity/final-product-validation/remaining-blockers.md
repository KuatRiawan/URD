# PT Upaya Riksa Daya (URD) — Remaining Blockers & Required Business Decisions

> **Status:** TRANSPARENT DISCLOSURE — NO FABRICATED DEPLOYMENT  
> **Klasifikasi:** Kendala Eksternal (Infrastruktur) & Keputusan Bisnis Menunggu Pemilik (Owner)  
> **Tanggal Pembaruan:** 2 November 2026

---

## 1. Kendala Eksternal Infrastruktur (Staging Deployment: BLOCKED)

Sesuai instruksi non-negosiasi pada `AGENTS.md`, tim pengembang **dilarang memanipulasi atau mengklaim bahwa staging remote telah selesai** selama prasarana fisik server dan domain belum disediakan oleh manajemen PT Upaya Riksa Daya.

| Komponen Infrastruktur | Kebutuhan Minimum | Status Saat Ini | Dampak Operasional | Tindakan Diperlukan |
|---|---|:---:|---|---|
| **Virtual Private Server (VPS)** | 2 vCPU, 4GB RAM, 40GB SSD (Ubuntu 22.04 LTS / 24.04 LTS) | **BLOCKED** (Belum disediakan) | Aplikasi hanya dapat dijalankan pada lingkungan lokal / simulasi jaringan internal. | Manajemen memesan dan menyediakan kredensial akses VPS (IP, SSH Key). |
| **Domain & DNS Records** | `app.upayariksadaya.com` (Frontend) & `api.upayariksadaya.com` (Backend) | **BLOCKED** (Belum dikonfigurasi) | Pengujian sertifikat SSL publik Let's Encrypt belum dapat dieksekusi. | Tim IT mendaftarkan A Record DNS mengarah ke IP publik VPS. |
| **Email SMTP / Mailer Gateway** | Akun SMTP resmi (`no-reply@upayariksadaya.com` atau SendGrid/Mailgun) | **MOCK / SIMULATED** (Tersedia fallback konsol) | Notifikasi email saat ini dicatat pada database & log tanpa dikirim ke inbox klien nyata. | Menyediakan kredensial host, port, user, dan password SMTP resmi. |
| **WhatsApp Business API Gateway** | Provider WhatsApp resmi (Fonnte / Woowa / Meta Cloud API) | **SIMULATED** | Pengingat jadwal WA disimulasikan pada tabel notifikasi internal. | Menentukan vendor WhatsApp gateway dan mendaftarkan token API. |

---

## 2. Keputusan Bisnis Menunggu Persetujuan Pemilik (`DECISION REQUIRED`)

Sesuai aturan operasional PJK3, kebijakan legalitas dan relasi klien berikut **tidak boleh diputuskan sepihak oleh engineer** tanpa persetujuan Direksi PT URD. Implementasi teknis telah disiapkan secara fleksibel (*configurable*) dan siap diaktifkan setelah keputusan disetujui:

### 1. Kebijakan Interval Pengingat Riksa Ulang Klien (*Client Reminder Cadence*)
- **Status:** `DECISION REQUIRED`
- **Pilihan Opsi:**
  - *Opsi A (Agresif):* Pengingat otomatis dikirim pada H-90, H-60, H-30, H-14, dan H-7 sebelum masa berlaku Suket habis.
  - *Opsi B (Moderat - Rekomendasi):* Pengingat otomatis dikirim pada H-60 dan H-30 melalui Email, serta H-14 melalui WhatsApp ke PIC Klien.
  - *Opsi C (Konservatif):* Pengingat hanya muncul pada dashboard internal Marketing tanpa pesan otomatis ke klien.

### 2. Pemetaan Akun Produksi & Personel Resmi
- **Status:** `DECISION REQUIRED`
- **Pilihan Opsi:**
  - Menetapkan nama lengkap, NIK/NIP, alamat email resmi kantor, dan nomor lisensi SKP asli dari Kementerian Ketenagakerjaan untuk masing-masing Ahli K3 spesialis yang bertugas (PAA, PUBT, Listrik, Elevator, dll.).

### 3. Kebijakan Koreksi & Penerbitan Ulang Dokumen (*Cancel / Correction / Reissue Workflow*)
- **Status:** `DECISION REQUIRED`
- **Pilihan Opsi:**
  - *Opsi A (Ketat):* Dokumen LHPP atau Suket yang telah berstatus `FINAL` atau `TERBIT` terkunci mutlak. Jika terjadi kesalahan ketik dari pihak Disnaker, wajib dibuat dokumen revisi baru dengan nomor versi increment (`v2`) dan mencatat alasan pembatalan versi sebelumnya pada audit log.
  - *Opsi B (Toleran):* Admin Kantor berhak melakukan pembetulan salah ketik minor (*minor typo correction*) pada nama perusahaan atau nomor seri dalam jangka waktu 7 hari kerja tanpa mengubah nomor dokumen utama.

### 4. Kebijakan Retensi Arsip & Legal Hold (*Data Retention Policy*)
- **Status:** `DECISION REQUIRED`
- **Pilihan Opsi:**
  - *Opsi A:* Retensi arsip digital berkas pemeriksaan disimpan selamanya (*indefinite retention*).
  - *Opsi B:* Retensi aktif 5 tahun sesuai batas audit reguler K3, kemudian dipindahkan ke cold storage (*deep archive*) untuk penghematan ruang penyimpanan server.

### 5. Kebijakan Toleransi Kedaluwarsa SKP Ahli K3 (*Inspector License Expiry Tolerance*)
- **Status:** `DECISION REQUIRED`
- **Pilihan Opsi:**
  - *Opsi A (Paling Aman):* Sistem otomatis memblokir penugasan Ahli K3 jika masa berlaku lisensi SKP pada sistem telah melewati tanggal jatuh tempo ($H=0$).
  - *Opsi B (Grace Period):* Sistem memberikan masa tenggang (*grace period*) 30 hari jika proses perpanjangan SKP di Kementerian Ketenagakerjaan sedang dalam proses (*Surat Keterangan Dalam Proses Perpanjangan* terlampir).

---

## 3. Rencana Tindak Lanjut Pasca Penyediaan Server (Deployment Runbook)

Segera setelah VPS dan DNS diserahkan oleh manajemen, tim pengembang akan mengeksekusi tahapan berikut:

1. **Provisioning Server:** Menjalankan script setup otomatisasi Docker / Nginx / Node.js pada VPS.
2. **Setup SSL:** Memasang sertifikat TLS Let's Encrypt via Certbot dengan auto-renewal.
3. **Migrasi Database:** Menjalankan `npm run migrate` dan migrasi data awal pada instance PostgreSQL remote.
4. **Validasi Staging Smoke Test:** Menguji alur login, pembuatan PO, pengisian formulir, dan unduhan dokumen PDF/DOCX pada domain staging publik.
5. **Serah Terima Operasional (UAT Final):** Melakukan peninjauan langsung bersama para perwakilan peran (Marketing, Ahli K3, Admin Kantor, dan Pimpinan).

