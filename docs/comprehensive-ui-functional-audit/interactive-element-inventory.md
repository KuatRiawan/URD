# Inventarisasi Elemen Interaktif -- PT Upaya Riksa Daya

Tanggal audit: 2025-07-14
Auditor: Agen AI (workflow step visual-konsistensi)

---

## Komponen UI Inti

### Button (`/components/ui/Button.jsx`)

| Variant | Deskripsi | Status |
|---|---|---|
| `primary` | Merah URD (#C81E1E) | Berfungsi, loading state ada |
| `secondary` | Slate-900 | Berfungsi, loading state ada |
| `outline` | Border slate, bg white | Berfungsi |
| `ghost` | Transparan | Berfungsi |
| `danger` | Rose-600 | Berfungsi, loading state ada |

Ukuran: `sm`, `md`, `lg`. Semua mendukung `loading`, `icon`, `disabled`.

### Modal (`/components/ui/Modal.jsx`)

- Mendukung `sm`, `md`, `lg`, `xl` size
- Bottom sheet di mobile, centered dialog di desktop
- Handle bar indikator di mobile
- Tutup dengan Escape, backdrop click, atau tombol X
- Focus trap aktif (`useDialogFocus`)
- Body scroll lock saat modal terbuka
- `max-h-[92dvh]` mencegah modal penuh layar di mobile

### Notice (`/components/ui/Notice.jsx`)

Props yang valid: `tone` (`success`, `error`, `warning`, `info`). **Bukan** `variant`.

### PageHeader (`/components/ui/PageHeader.jsx`)

Responsif: `flex-col md:flex-row` sehingga tombol aksi wrap ke bawah di mobile.

---

## Inventarisasi per Halaman

### MARKETING / ADMIN_KANTOR

| Halaman | Tombol Utama | Loading State | Error State | Empty State |
|---|---|---|---|---|
| Dasbor Operasional | Refresh (auto) | Ya | Ya (ErrorState) | N/A |
| PO & Order Pemeriksaan | Buat PO, Import CSV | Ya | Ya | Ya (EmptyState) |
| Data Klien | Tambah Klien, Edit | Ya | Ya | Ya |
| Objek Uji K3 | Tambah Objek, Import CSV, QR Code | Ya | Ya | Ya |
| Jadwal & Penugasan | - | Ya | Ya | Ya |
| Penerbitan Dokumen (LHPP) | Buka Detail, Simpan Draft | Ya | Ya | Ya |
| Berita Acara (BAP) | Buka Detail, Simpan Draft | Ya | Ya | Ya |
| Distribusi Dokumen | Update Status Distribusi | Ya | Ya | Ya |
| Registri Suket K3 | Daftarkan Pengajuan | Ya | Ya | Ya |
| Pengingat Perpanjangan | Dispatch Pengingat | Ya | Ya | Ya (per section) |
| Riwayat Pengujian | Download PDF | Ya | Ya | Ya |
| Kendala Operasional | Laporkan Kendala, Update Status | Ya | Ya | Ya |
| Pengaturan Akun | Simpan Profil, Ubah Password | Ya | Ya | N/A |

### INSPECTOR / AHLI_K3

| Halaman | Tombol Utama | Loading State | Error State | Empty State |
|---|---|---|---|---|
| Dasbor (Tugas Saya) | Terima/Tolak Penugasan | Ya | Ya | Ya (per tab) |
| Form Pengujian Lapangan | Mulai Inspeksi, Simpan Checklist | Ya | Ya | Ya |
| Objek Uji K3 | Lihat Detail | Ya | Ya | Ya |
| Riwayat Pekerjaan | Download | Ya | Ya | Ya |
| Kendala Lapangan | Laporkan Kendala | Ya | Ya | Ya |

### PIMPINAN / MANAGER

Semua halaman dalam mode monitoring read-only. Tidak ada tombol create/edit kecuali Log Audit.

### ADMIN_SISTEM

Semua halaman dari seluruh role, ditambah:
- Manajemen Pengguna: Tambah, Edit, Aktif/Nonaktif
- Log Audit: Read-only dengan filter

---

## Form Validation Coverage

| Form | Required fields | Frontend validation | Error display |
|---|---|---|---|
| Login | email, password | HTML5 required + pattern | Ya (error banner) |
| Tambah Pengguna | fullName, email, password | HTML5 required + minLength | Ya (Notice di modal) |
| Edit Pengguna | fullName | HTML5 required | Ya (Notice di modal) |
| Tambah Klien | name | Kustom (trim check) | Ya (Notice di modal) |
| Tambah Objek Uji | clientId, categoryId, name | Kustom | Ya (Notice di modal) |
| Buat PO Wizard | clientId, po_number | Kustom per step | Ya (Notice di wizard) |
| Tambah Kompetensi | categoryId, validFrom, validUntil | HTML5 required | Ya (Notice di modal) |
| Daftarkan Suket K3 | multiple required | HTML5 required | Ya (Notice di modal) |
| Profil | fullName | HTML5 required | Ya (Notice di form) |
| Ganti Password | currentPassword, newPassword (min 8) | HTML5 required + minLength | Ya (Notice di form) |
| Form Pengujian | inspectorName | HTML5 required | Ya (Notice di modal) |

---

## Navigasi

### Sidebar Desktop
- Semua route valid dan terdaftar di `router.jsx`
- Active state menggunakan `isActive` dari NavLink
- `/app/scheduling` diredirect ke `/app/schedule`
- `/app/audit-log` diredirect ke `/app/audit-logs`
- Sidebar dapat di-collapse (state persisted di localStorage)

### Bottom Navigation Mobile
- 4 item primer per role + tombol "Lainnya"
- "Lainnya" membuka MobileNavDrawer (bottom sheet)
- Active state konsisten dengan sidebar

### TopHeader
- Breadcrumb menampilkan group dan label halaman aktif
- Notifikasi popover dengan badge counter
- Profile dropdown dengan menu pengaturan dan logout

---

## Polling & Real-time Data

| Komponen | Interval | Event tambahan |
|---|---|---|
| AppLayout (notifikasi) | 30 detik | focus, visibilitychange |
| DashboardPage (dashboard) | 30 detik | focus, visibilitychange, online |
| TopHeader (notifikasi detail) | 30 detik saat popover terbuka | - |

Polling 30 detik adalah interval yang tepat untuk data operasional yang tidak perlu realtime ketat. Sinkronisasi instan tetap terjadi saat pengguna kembali ke tab.
