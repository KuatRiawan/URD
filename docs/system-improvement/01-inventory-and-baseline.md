# PT Upaya Riksa Daya (URD) — Inventarisasi Route, Halaman & Status Baseline

Dokumen ini mencatat inventarisasi menyeluruh frontend routes, role layouts, navigation menus, dan backend services sebagai baseline sistem perbaikan terintegrasi.

---

## 1. Inventarisasi Frontend Route & Hak Akses Peran

| Path | Komponen Halaman | Peran yang Diizinkan (Allowed Roles) | Nav Group | Status Integrasi |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | Publik (Unauthenticated) | - | Terintegrasi (JWT + HttpOnly Cookie) |
| `/verify/:code` | `VerificationPage` | Publik (Tanpa Login) | - | Terintegrasi (Validasi SHA-256 BAP/LHPP) |
| `/portal/access/:token` | `ClientPortalPage` | Klien Ber-Token | - | Terintegrasi (Akses Status PO & Dokumen) |
| `/app/dashboard` | `DashboardPage` | Semua 5 Peran (`ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR`, `INSPECTOR`, `PIMPINAN`) | Utama | Terintegrasi (Tampilan spesifik per peran) |
| `/app/orders` | `OrdersPage` | Semua 5 Peran | Operasional | Terintegrasi (PO Multi-Unit, Import CSV, Gate) |
| `/app/clients` | `ClientsPage` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR`, `PIMPINAN` | Operasional | Terintegrasi (Klien, Multi-Lokasi, Multi-PIC) |
| `/app/objects` | `ObjectsPage` | Semua 5 Peran | Operasional | Terintegrasi (Objek Uji, Riwayat Unit, QR Sticker) |
| `/app/schedule` | `SchedulePage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `INSPECTOR`, `PIMPINAN` | Operasional | Terintegrasi (Jadwal Riksa Uji, Deteksi Konflik) |
| `/app/inspections`| `InspectionsPage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `INSPECTOR`, `PIMPINAN` | Operasional | Terintegrasi (Checklist Dinamis, TTD, Offline-First) |
| `/app/lhpp` | `LhppPage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `INSPECTOR`, `PIMPINAN` | Dokumen | Terintegrasi (Evaluasi Teknis, Finalisasi Admin Kantor) |
| `/app/bap` | `BapPage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `INSPECTOR`, `PIMPINAN` | Dokumen | Terintegrasi (Diterbitkan setelah LHPP, PDF Satuan/Batch) |
| `/app/distributions` | `DocumentDistributionPage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `PIMPINAN` | Dokumen | Terintegrasi (Pelacakan Pengiriman Klien & Disnaker) |
| `/app/history` | `HistoryPage` | Semua 5 Peran | Dokumen | Terintegrasi (Riwayat Pemeriksaan Alat K3 Lengkap) |
| `/app/suket` | `SuketPage` | `ADMIN_SISTEM`, `ADMIN_KANTOR`, `PIMPINAN` | Dokumen | Terintegrasi (Registri Suket Disnaker & QR K3) |
| `/app/reminders` | `RemindersPage` | `ADMIN_SISTEM`, `MARKETING`, `ADMIN_KANTOR`, `PIMPINAN` | Pemantauan | Terintegrasi (Pengingat H-30/14/7, Log Simulasi, Repeat PO) |
| `/app/issues` | `IssuesPage` | Semua 5 Peran | Pemantauan | Terintegrasi (Pelaporan Kendala Lapangan & Tindak Lanjut) |
| `/app/users` | `UsersPage` | `ADMIN_SISTEM` | Administrasi | Terintegrasi (Manajemen Pengguna, Profil Ahli K3) |
| `/app/audit-logs` | `AuditLogPage` | `ADMIN_SISTEM`, `PIMPINAN` | Administrasi | Terintegrasi (Log Audit Tak Terubah / Append-Only) |
| `/app/settings` | `SettingsPage` | Semua 5 Peran | Pengaturan | Terintegrasi (Pengaturan Profil, Master Data, Gateways) |

---

## 2. Inventarisasi Database & Constraint Status

- **Tabel Basis Data**: 45 tabel aktif pada schema `public`.
- **Status PO (`orders.status`)**:
  - `TERDAFTAR` (Status awal default)
  - `TERJADWAL`
  - `DITUGASKAN`
  - `SEDANG_DIPERIKSA`
  - `MENUNGGU_LAPORAN`
  - `MENUNGGU_DOKUMEN`
  - `SELESAI` (Hanya dapat dicapai jika semua unit di dalam PO tuntas)
  - `DIBATALKAN` (Terminal status)
- **Status Unit Alat (`order_objects.unit_status`)**:
  - 22 status check-constraint resmi didukung secara sinkron di frontend (`format.js`, `orderConstants.js`, dan `Badge.jsx`).
- **Log Audit**: Trigger PostgreSQL `trg_audit_logs_append_only` aktif mencegah modifikasi (`UPDATE` / `DELETE`).

