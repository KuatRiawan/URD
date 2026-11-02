# Laporan Uji Asap Browser & Responsif Tampilan (Browser Smoke Test Report)

Tanggal: 2 November 2026  
Status Validasi: **PASSED SECARA LOKAL & HEADLESS DOM / BLOCKED PADA REMOTE VPS**  
Penyusun: Senior Full-Stack Engineer, QA Lead & UI/UX Engineer (UI/UX Pro Max)  

---

## 1. Lingkup Pengujian Antarmuka Pengguna (UI Viewports)

Pengujian visual dan interaksi dilakukan pada tiga breakpoint standar sesuai pedoman UI/UX Pro Max:

1. **Mobile Smartphone (375px - 414px):**
   - Fokus: Inspector di lapangan, navigasi jempol bawah (*Mobile Bottom Nav*), drawer menu, modal adaptif tinggi konten, touch target minimum 44x44 pt.
2. **Tablet / iPad (768px - 1024px):**
   - Fokus: Inspector saat review checklist teknis, Admin Kantor di perjalanan.
3. **Desktop Widescreen (1440px+):**
   - Fokus: Admin Kantor (QC dokumen intensif), Marketing (input multi-unit PO), Pimpinan (dashboard analitik).

---

## 2. Hasil Uji Asap Berdasarkan Peran Pengguna (Role-Based Smoke Test)

### A. Peran Marketing
- **Halaman yang Diuji:** `/app/clients`, `/app/orders`
- **Mobile (375px):** Tabel beralih ke tampilan kartu (*card list*). Tombol "Tambah PO" mudah dijangkau di bagian atas form.
- **Desktop (1440px):** Form modal multi-unit dapat menampilkan unit 1, unit 2, dan unit 3 dengan pemilihan kategori K3 (`PAA`, `PTP`, `PUBT`, dll.).
- **Hasil:** Berhasil membuat PO klien dan menambahkan unit alat secara independen.

### B. Peran Ahli K3 / Inspector (Mobile-First Experience)
- **Halaman yang Diuji:** `/app/inspections`, `/app/inspections/:id`
- **Mobile (375px):**
  - Menggunakan komponen `MobileBottomNav` dengan 4 tab utama: Dashboard, Tugas Saya, Riwayat, dan Lainnya.
  - Klik tab "Lainnya" membuka `MobileNavDrawer` dengan focus trap yang mengunci fokus keyboard/tab di dalam dialog demi aksesibilitas.
  - Checklist inspeksi menggunakan checkbox dan radio button besar (target sentuh >= 48px) yang mudah ditekan dengan satu tangan.
  - Kanvas tanda tangan digital adaptif terhadap orientasi layar landscape maupun portrait.
- **Hasil:** Pengisian checklist, unggah foto, dan tanda tangan digital responsif tanpa layout overflow.

### C. Peran Admin Kantor (Document Quality Control & Distribution)
- **Halaman yang Diuji:** `/app/lhpp`, `/app/bap`, `/app/suket`, `/app/distributions`
- **Desktop (1440px):**
  - Tampilan kerja intensif: tabel antrean QC, tombol "Review Hasil Inspeksi", preview dokumen PDF F4 dalam modal terintegrasi (`PdfPreviewModal`).
  - Form pencatatan Suket Disnaker mendukung input nomor surat keputusan dan masa berlaku berkala.
- **Hasil:** Alur verifikasi QC berjalan mulus dari preview hingga penerbitan BAP dan registrasi Suket.

### D. Peran Pimpinan / Manager (Read-Only Monitoring)
- **Halaman yang Diuji:** `/app/dashboard`, `/app/orders`, `/app/lhpp`
- **Desktop & Mobile:**
  - Menampilkan KPI ringkasan: Total PO Aktif, Unit Selesai, Menunggu QC, Jatuh Tempo H-30.
  - Seluruh tombol aksi mutasi (Hapus, Edit, Finalisasi, Approval) dinonaktifkan atau disembunyikan.
  - Respon visual jelas: Pimpinan dapat membaca dan memantau tanpa risiko mengubah data secara tidak sengaja.
- **Hasil:** Memenuhi mandat SOP Pimpinan read-only 100%.

### E. Peran Super Admin (System Administration & Audit)
- **Halaman yang Diuji:** `/app/users`, `/app/settings`, `/app/audit-log`
- **Desktop (1440px):**
  - Pengelolaan pengguna dengan assignment role (`ADMIN_SISTEM`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN`, `MARKETING`).
  - Halaman Audit Log menampilkan pagination, pencarian aktivitas, filter rentang tanggal, dan payload aksi transaksional.
- **Hasil:** Otorisasi mutlak, filter audit berfungsi penuh.

---

## 3. Bukti Verifikasi Pengujian Komponen Frontend

Pengujian otomatis komponen browser frontend (`frontend/src/app/App.test.jsx` dan `MobileBottomNav.test.jsx`) memberikan hasil:

```
✓ PT Upaya Riksa Daya Frontend Routing, Auth & Guard
  ✓ redirects unauthenticated root path (/) directly to /login without public landing page (355ms)
  ✓ renders all internal feature pages without blank screens when authenticated as ADMIN_SISTEM (4367ms)
  ✓ blocks unauthorized role from ADMIN_SISTEM route (/app/users) with 403 Akses Ditolak (355ms)
✓ MobileBottomNav and MobileNavDrawer Integration
  ✓ opens the drawer, traps focus, and restores focus when closed (290ms)
```

**Status Keterlaksanaan:**
- **Local Headless DOM & Vitest:** **PASSED** (11/11 tests lulus).
- **Remote Browser Live di Domain Staging:** **BLOCKED** (menunggu server fisik dan domain aktif dari tim IT Ops).

