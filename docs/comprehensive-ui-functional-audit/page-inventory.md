# Inventarisasi Halaman per Role — PT Upaya Riksa Daya

Tanggal audit: 2025-07-11  
Sumber: `frontend/src/app/router.jsx`, `frontend/src/components/layout/navConfig.js`

---

## Status Route

| Path | Komponen | Status |
|---|---|---|
| `/` | RootRedirect | OK — redirect ke /login atau /app/dashboard |
| `/login` | LoginPage | OK |
| `/verifikasi/:code` | VerificationPage | OK — publik |
| `/portal/:token` | ClientPortalPage | OK — publik |
| `/app/dashboard` | DashboardPage | OK |
| `/app/clients` | ClientsPage | OK |
| `/app/objects` | ObjectsPage | OK |
| `/app/orders` | OrdersPage | OK |
| `/app/schedule` | SchedulePage | OK (canonical) |
| `/app/scheduling` | Navigate → /app/schedule | FIXED — redirect ke canonical |
| `/app/inspections` | InspectionsPage | OK |
| `/app/bap` | BapPage | OK |
| `/app/lhpp` | LhppPage | OK |
| `/app/history` | HistoryPage | OK |
| `/app/distributions` | DocumentDistributionPage | OK |
| `/app/suket` | SuketPage | OK |
| `/app/reminders` | RemindersPage | OK |
| `/app/notifications` | NotificationsPage | OK |
| `/app/issues` | IssuesPage | OK |
| `/app/users` | UsersPage | OK (ADMIN_SISTEM only) |
| `/app/audit-logs` | AuditLogPage | OK (canonical) |
| `/app/audit-log` | Navigate → /app/audit-logs | FIXED — redirect ke canonical |
| `/app/settings` | SettingsPage | OK |
| `/*` | RootRedirect | OK — fallback |

**Route duplikat dihapus:** `/app/scheduling` dan `/app/audit-log` sebelumnya me-render komponen yang sama dengan route canonical tanpa redirect. Diganti menjadi `<Navigate replace>` agar URL tetap konsisten.

---

## Akses per Role

Role dalam sistem menggunakan alias dua arah:
- `MARKETING` = `ADMIN_KANTOR`
- `INSPECTOR` = `AHLI_K3`
- `PIMPINAN` = `MANAGER`

### MARKETING / ADMIN_KANTOR

| Halaman | Path | Akses |
|---|---|---|
| Dasbor Operasional | /app/dashboard | Ya |
| PO & Order Pemeriksaan | /app/orders | Ya |
| Data Klien | /app/clients | Ya |
| Objek Uji K3 | /app/objects | Ya |
| Jadwal & Penugasan | /app/schedule | Ya |
| Form Pengujian Lapangan | /app/inspections | Tidak |
| Dokumen LHPP | /app/lhpp | Ya |
| Berita Acara (BAP) | /app/bap | Ya |
| Distribusi Dokumen | /app/distributions | Ya |
| Riwayat Pengujian | /app/history | Ya |
| Registri Suket K3 | /app/suket | Ya |
| Pengingat Perpanjangan | /app/reminders | Ya |
| Notifikasi | /app/notifications | Ya |
| Kendala Operasional | /app/issues | Ya |
| Manajemen Pengguna | /app/users | Tidak |
| Log Audit | /app/audit-logs | Tidak |
| Pengaturan Akun | /app/settings | Ya |

### INSPECTOR / AHLI_K3

| Halaman | Path | Akses |
|---|---|---|
| Dasbor (Tugas Saya) | /app/dashboard | Ya |
| Form Pengujian Lapangan | /app/inspections | Ya |
| Objek Uji K3 | /app/objects | Ya |
| PO & Order (baca) | /app/orders | Ya |
| Jadwal & Penugasan | /app/schedule | Ya |
| Dokumen LHPP | /app/lhpp | Ya |
| Berita Acara (BAP) | /app/bap | Ya |
| Riwayat Pekerjaan | /app/history | Ya |
| Kendala Lapangan | /app/issues | Ya |
| Notifikasi | /app/notifications | Ya |
| Pengaturan Akun | /app/settings | Ya |
| Data Klien | /app/clients | Tidak (route guard) |
| Registri Suket K3 | /app/suket | Tidak |
| Pengingat Perpanjangan | /app/reminders | Tidak |
| Manajemen Pengguna | /app/users | Tidak |
| Log Audit | /app/audit-logs | Tidak |

### PIMPINAN / MANAGER

| Halaman | Path | Akses |
|---|---|---|
| Dasbor Eksekutif | /app/dashboard | Ya |
| Monitoring PO & Status | /app/orders | Ya |
| Monitoring Jadwal Tim | /app/schedule | Ya |
| Objek Uji K3 | /app/objects | Ya |
| Data Klien | /app/clients | Ya |
| Dokumen LHPP | /app/lhpp | Ya |
| Berita Acara (BAP) | /app/bap | Ya |
| Registri Suket K3 | /app/suket | Ya |
| Pengingat Masa Berlaku | /app/reminders | Ya |
| Distribusi Dokumen | /app/distributions | Ya |
| Riwayat Pengujian | /app/history | Ya |
| Kendala Operasional | /app/issues | Ya |
| Log Audit Operasional | /app/audit-logs | Ya |
| Notifikasi | /app/notifications | Ya |
| Pengaturan Akun | /app/settings | Ya |
| Form Pengujian Lapangan | /app/inspections | Tidak |
| Manajemen Pengguna | /app/users | Tidak |

### ADMIN_SISTEM (SUPER ADMIN)

| Halaman | Path | Akses |
|---|---|---|
| Semua halaman di atas | semua | Ya |
| Manajemen Pengguna | /app/users | Ya (eksklusif) |
| Log Audit | /app/audit-logs | Ya |

---

## Navigasi Mobile (Bottom Nav)

Setiap role memiliki 4 item primary di bottom nav + grup "Lainnya" yang dapat digeser.

### INSPECTOR / AHLI_K3 — Bottom Nav Primary
1. Tugas Saya → /app/dashboard
2. Pengujian → /app/inspections
3. Kendala → /app/issues
4. Riwayat → /app/history

### PIMPINAN / MANAGER — Bottom Nav Primary
1. Dasbor → /app/dashboard
2. Monitoring PO → /app/orders
3. Jadwal Tim → /app/schedule
4. Dokumen → /app/lhpp

### ADMIN_SISTEM — Bottom Nav Primary
1. Dasbor → /app/dashboard
2. Pengguna → /app/users
3. PO & Order → /app/orders
4. Log Audit → /app/audit-logs

### MARKETING / ADMIN_KANTOR — Bottom Nav Primary
1. Dasbor → /app/dashboard
2. Purchase Order → /app/orders
3. Jadwal → /app/schedule
4. Dokumen → /app/lhpp

---

## Ikon Navigasi (setelah perbaikan duplikasi)

| Menu | Ikon | Catatan |
|---|---|---|
| Dasbor | Gauge | Unik |
| PO & Order | ClipboardText | Unik (juga dipakai BAP, tapi beda grup) |
| Data Klien | Buildings | Unik |
| Objek Uji K3 | Cube | Unik |
| Jadwal | CalendarCheck | Unik |
| Form Pengujian | FileText | Unik |
| LHPP | Scroll | Unik |
| BAP | ClipboardText | Dipakai bersama PO (berbeda grup, konteks berbeda) |
| Distribusi | ShareNetwork | Unik |
| Riwayat | ClockCounterClockwise | Unik (Log Audit kini pakai Article) |
| Registri Suket K3 | ShieldCheck | FIXED — sebelumnya WarningOctagon (duplikat) |
| Pengingat | Alarm | FIXED — sebelumnya ShieldCheck (bertukar posisi) |
| Kendala Operasional | WarningOctagon | Unik |
| Manajemen Pengguna | Users | Unik |
| Log Audit | Article | FIXED — sebelumnya ClockCounterClockwise (duplikat) |
| Pengaturan Akun | Gear | Unik |
