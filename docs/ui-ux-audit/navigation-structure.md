# Struktur Navigasi Desktop & Mobile Berdasarkan Peran Pengguna
PT Upaya Riksa Daya

## 1. Prinsip Navigasi Lintas Perangkat

1. **Konsistensi Rute**: Rute URL `/app/*` tetap identik di seluruh ukuran layar; tidak ada pemotongan fitur saat pengguna membuka aplikasi melalui ponsel pintar.
2. **Navigasi Desktop (>= 1024px)**: Menggunakan Sidebar Navigasi di sebelah kiri yang mendukung mode collapse / expand, dengan pengelompokan menu fungsional.
3. **Navigasi Mobile (< 1024px)**: Menggunakan Floating Bottom Navigation Bar dengan maksimal 5 item (4 menu utama teratas + 1 tombol "Lainnya").
4. **Mekanisme Tombol "Lainnya"**: Membuka Bottom Sheet Drawer elegan yang menampilkan menu tambahan sesuai hak akses peran pengguna, dikelompokkan secara terstruktur lengkap dengan ikon dan penanda halaman aktif.

## 2. Struktur Navigasi Setiap Peran

### A. Marketing / Admin Kantor (`MARKETING` / `ADMIN_KANTOR`)

#### Desktop Sidebar
- **Utama**:
  - Dasbor Operasional (`/app/dashboard`)
- **Order & Klien**:
  - PO & Order Pemeriksaan (`/app/orders`)
  - Data Klien (`/app/clients`)
  - Objek Uji K3 (`/app/objects`)
- **Pelaksanaan**:
  - Jadwal & Penugasan (`/app/schedule`)
  - Kendala Operasional (`/app/issues`)
- **Penerbitan Dokumen**:
  - Dokumen LHPP (`/app/lhpp`)
  - Berita Acara BAP (`/app/bap`)
  - Distribusi Dokumen (`/app/distributions`)
- **Pemantauan**:
  - Registri Suket K3 (`/app/suket`)
  - Pengingat Perpanjangan (`/app/reminders`)
  - Riwayat Pengujian (`/app/history`)
- **Akun**:
  - Pengaturan Akun (`/app/settings`)

#### Mobile Bottom Bar (5 Slot Utama)
1. **Dasbor** (`/app/dashboard`)
2. **Purchase Order** (`/app/orders`)
3. **Jadwal** (`/app/schedule`)
4. **Dokumen LHPP** (`/app/lhpp`)
5. **Lainnya** (Memicu Sheet Drawer)

#### Isi Sheet Drawer "Lainnya" (Mobile Marketing)
- **Data & Objek K3**: Data Klien (`/app/clients`), Objek Uji K3 (`/app/objects`)
- **Dokumen & Distribusi**: Berita Acara BAP (`/app/bap`), Distribusi Dokumen (`/app/distributions`), Riwayat Pengujian (`/app/history`)
- **Kepatuhan & Pemantauan**: Kendala Operasional (`/app/issues`), Registri Suket K3 (`/app/suket`), Pengingat Perpanjangan (`/app/reminders`)
- **Pengaturan**: Pengaturan Akun (`/app/settings`)

---

### B. Admin Sistem (`ADMIN_SISTEM`)

#### Desktop Sidebar
- **Utama**: Dasbor Operasional (`/app/dashboard`)
- **Administrasi**: Manajemen Pengguna (`/app/users`), Log Audit Sistem (`/app/audit-logs`)
- **Operasional**: PO & Order (`/app/orders`), Data Klien (`/app/clients`), Objek Uji K3 (`/app/objects`), Jadwal & Penugasan (`/app/schedule`), Form Pengujian (`/app/inspections`)
- **Dokumen & Sertifikasi**: Dokumen LHPP (`/app/lhpp`), Berita Acara BAP (`/app/bap`), Distribusi Dokumen (`/app/distributions`), Riwayat Pengujian (`/app/history`), Registri Suket K3 (`/app/suket`)
- **Pemantauan & Pengaturan**: Pengingat Perpanjangan (`/app/reminders`), Kendala Operasional (`/app/issues`), Pengaturan Sistem (`/app/settings`)

#### Mobile Bottom Bar (5 Slot Utama)
1. **Dasbor** (`/app/dashboard`)
2. **Pengguna** (`/app/users`)
3. **Purchase Order** (`/app/orders`)
4. **Log Audit** (`/app/audit-logs`)
5. **Lainnya** (Memicu Sheet Drawer)

#### Isi Sheet Drawer "Lainnya" (Mobile Admin Sistem)
- **Master Data**: Data Klien (`/app/clients`), Objek Uji K3 (`/app/objects`)
- **Operasional Lapangan**: Jadwal & Penugasan (`/app/schedule`), Form Pengujian (`/app/inspections`)
- **Dokumen**: Dokumen LHPP (`/app/lhpp`), Berita Acara BAP (`/app/bap`), Distribusi Dokumen (`/app/distributions`), Riwayat Pengujian (`/app/history`)
- **Kepatuhan & Sistem**: Registri Suket K3 (`/app/suket`), Pengingat Perpanjangan (`/app/reminders`), Kendala Operasional (`/app/issues`), Pengaturan Sistem (`/app/settings`)

---

### C. Pimpinan / Manager (`PIMPINAN` / `MANAGER`)

#### Desktop Sidebar
- **Eksekutif**: Dasbor Eksekutif (`/app/dashboard`)
- **Monitoring Operasional**: Monitoring PO & Status (`/app/orders`), Monitoring Jadwal Tim (`/app/schedule`), Kendala Operasional (`/app/issues`), Objek Uji K3 (`/app/objects`), Data Klien (`/app/clients`)
- **Dokumen & Kepatuhan**: Dokumen LHPP & BAP (`/app/lhpp`), Berita Acara BAP (`/app/bap`), Registri Suket K3 (`/app/suket`), Pengingat Masa Berlaku (`/app/reminders`), Distribusi Dokumen (`/app/distributions`), Riwayat Pekerjaan (`/app/history`)
- **Jejak Audit & Akun**: Log Audit Operasional (`/app/audit-logs`), Pengaturan Akun (`/app/settings`)

#### Mobile Bottom Bar (5 Slot Utama)
1. **Dasbor** (`/app/dashboard`)
2. **Monitoring PO** (`/app/orders`)
3. **Jadwal Tim** (`/app/schedule`)
4. **Dokumen LHPP** (`/app/lhpp`)
5. **Lainnya** (Memicu Sheet Drawer)

#### Isi Sheet Drawer "Lainnya" (Mobile Pimpinan)
- **Monitoring Operasional**: Objek Uji K3 (`/app/objects`), Data Klien (`/app/clients`), Kendala Operasional (`/app/issues`)
- **Dokumen & Kepatuhan**: Berita Acara BAP (`/app/bap`), Registri Suket K3 (`/app/suket`), Pengingat Masa Berlaku (`/app/reminders`), Distribusi Dokumen (`/app/distributions`), Riwayat Pekerjaan (`/app/history`)
- **Audit & Akun**: Log Audit Operasional (`/app/audit-logs`), Pengaturan Akun (`/app/settings`)

---

### D. Ahli K3 / Inspector (`AHLI_K3` / `INSPECTOR`)

#### Desktop Sidebar
- **Tugas Utama**: Tugas Saya (`/app/dashboard`), Form Pengujian Lapangan (`/app/inspections`)
- **Pelaksanaan**: Kendala Lapangan (`/app/issues`), Objek Uji K3 (`/app/objects`), Jadwal & Penugasan (`/app/schedule`)
- **Arsip & Dokumen**: Riwayat Pekerjaan (`/app/history`), Dokumen LHPP (`/app/lhpp`), Berita Acara BAP (`/app/bap`)
- **Akun**: Pengaturan Akun & SKP (`/app/settings`)

#### Mobile Bottom Bar (5 Slot Utama)
1. **Tugas Saya** (`/app/dashboard`)
2. **Pengujian** (`/app/inspections`)
3. **Kendala** (`/app/issues`)
4. **Riwayat** (`/app/history`)
5. **Lainnya** (Memicu Sheet Drawer)

#### Isi Sheet Drawer "Lainnya" (Mobile Inspector)
- **Pelaksanaan & Objek**: Objek Uji K3 (`/app/objects`), PO & Order (`/app/orders`), Jadwal & Agenda (`/app/schedule`)
- **Dokumen Teknis**: Dokumen LHPP (`/app/lhpp`), Berita Acara BAP (`/app/bap`)
- **Akun**: Pengaturan Akun & SKP (`/app/settings`)

