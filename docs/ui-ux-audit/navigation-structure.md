# Struktur Navigasi Existing per Role

Sumber: `frontend/src/components/layout/navConfig.js`, `MobileBottomNav.jsx`, `MobileNavDrawer.jsx`, dan izin route dalam `frontend/src/app/router.jsx`.

## Perilaku lintas perangkat

- Sidebar desktop muncul mulai breakpoint `lg`; sidebar dapat collapse/expand.
- Navigasi bawah digunakan sebelum `lg`, berisi empat tautan utama dan satu tombol Lainnya.
- Lainnya membuka drawer berisi kelompok menu yang ditentukan oleh role.
- Navigasi menutup drawer saat route berubah; Escape menutup drawer; fokus dipindah dan dikembalikan ke kontrol pemicu.
- Menu yang ditampilkan tidak menggantikan pemeriksaan izin route. Route tetap melindungi modul melalui `RequireRole` dan aplikasi tetap memakai autentikasi.

## Marketing / Admin Kantor

Nama role implementasi: `MARKETING` dan alias lama `ADMIN_KANTOR`.

**Desktop:** Dasbor Operasional; PO & Order Pemeriksaan; Data Klien; Objek Uji K3; Jadwal & Penugasan; Kendala Operasional; LHPP; BAP; Distribusi Dokumen; Suket; Pengingat; Riwayat; Pengaturan Akun.

**Mobile utama:** Dasbor (`/app/dashboard`), Purchase Order (`/app/orders`), Jadwal (`/app/schedule`), Dokumen (`/app/lhpp`).

**Lainnya:** Data Klien, Objek Uji; BAP, Distribusi, Riwayat; Kendala, Suket, Pengingat; Notifikasi, Pengaturan Akun.

## Inspector / Ahli K3

Nama role implementasi: `INSPECTOR` dan alias lama `AHLI_K3`.

**Desktop:** Tugas Saya, Form Pengujian Lapangan, Kendala Lapangan, Objek Uji, Riwayat Pekerjaan, Pengaturan Akun.

**Mobile utama:** Tugas Saya, Pengujian, Kendala, Riwayat.

**Lainnya:** Objek Uji, PO & Order Riksa, Jadwal & Agenda; LHPP, BAP; Notifikasi, Pengaturan Akun & SKP.

## Pimpinan / Manager

Nama role implementasi: `PIMPINAN` dan alias lama `MANAGER`.

**Desktop:** Dasbor Eksekutif, Monitoring PO & Status, Monitoring Jadwal Tim, Kendala Operasional, Objek Uji, Riwayat Pekerjaan, LHPP/BAP, Suket, Pengingat, Distribusi, Audit Log, Pengaturan.

**Mobile utama:** Dasbor, Monitoring PO, Jadwal Tim, Dokumen LHPP.

**Lainnya:** Objek Uji, Data Klien, Kendala; BAP, Suket, Pengingat, Distribusi, Riwayat; Audit Log, Notifikasi, Pengaturan.

Route Pimpinan umumnya memberi akses baca dan pemantauan; route UI tidak memberikan fungsi approval teknis melalui navigasi. Hak setiap aksi harus tetap dinilai dari implementasi handler dan backend, bukan hanya label menu.

## Admin Sistem / Super Admin

Nama role implementasi: `ADMIN_SISTEM`.

**Desktop:** seluruh NAV_ITEMS yang diizinkan Admin Sistem.

**Mobile utama:** Dasbor, Pengguna, PO & Order, Log Audit.

**Lainnya:** Klien dan Objek Uji; Jadwal dan Form Pengujian; LHPP, BAP, Distribusi, Riwayat; Suket, Pengingat, Kendala, Notifikasi, Pengaturan Sistem.

Route `/app/users` Admin Sistem saja. Route `/app/audit-logs` Admin Sistem dan Pimpinan. Alias `/app/audit-log` mengarah ke halaman sama.

## Batasan yang dicatat

- Notifikasi didefinisikan tanpa `RequireRole` spesifik, tetapi tetap berada di dalam layout `/app` yang memerlukan login.
- Struktur navigasi ini memuat route yang ada sekarang, tidak mengklaim semua fungsi tiap route dapat digunakan oleh semua role.
- Verifikasi klik semua item dan role belum dijalankan lewat browser dengan akun autentikasi per role.
