# Integration Matrix

| Fitur | Frontend | Backend | Database | Bukti tindak lanjut |
|---|---|---|---|---|
| Login / refresh | `LoginPage` + `AuthProvider` | `/api/v1/auth/*` | `users`, `refresh_sessions` | Kode diperiksa; regresi concurrency ditambahkan, belum dijalankan |
| Route guard | `router.jsx` | `authenticate` middleware | n/a | 4 tes frontend lulus; bukan uji semua route |
| Client master | `ClientsPage` | `clients/routes.js` | tabel klien | Tidak diuji ulang pada tindak lanjut |
| Object master | `ObjectsPage` | `objects/routes.js` | tabel objek uji | Tidak diuji ulang pada tindak lanjut |
| Order lifecycle | `OrdersPage` | `orders/routes.js` | tabel order dan unit | Unggah PO diperbaiki; regresi ditambahkan, belum dijalankan |
| Scheduling | `SchedulePage` / `OrdersPage` | `scheduling/routes.js` | tabel penjadwalan | Validasi akses konflik diperbaiki; regresi belum dijalankan |
| Inspections | `InspectionsPage` | `inspections/routes.js` | tabel inspeksi dan temuan | Otorisasi unduhan lampiran diperbaiki; regresi belum dijalankan |
| BAP | `BapPage` | `bap/routes.js` | tabel BAP | Akses Ahli K3 ke batch PDF dibatasi; regresi belum dijalankan |
| LHPP | `LhppPage` | `lhpp/routes.js` | tabel LHPP | Akses foto dibatasi pada pemilik; regresi belum dijalankan |
| Audit trail | `AuditLogPage` | `audit-log/routes.js` | `audit_logs` | Trigger diperiksa di migrasi, tidak diuji ulang |
| Reminders | `RemindersPage` | `reminders/routes.js` | tabel pengingat | Tidak diuji ulang pada tindak lanjut |
| Client portal | `ClientPortalPage` + `VerificationPage` | `portal/routes.js` | token portal | Route publik read-only; tidak diuji ulang pada tindak lanjut |

## Catatan
Matriks ini adalah peta kode, bukan bukti bahwa setiap workflow berhasil di runtime. Tes backend tidak dijalankan karena suite menghapus schema database yang dikonfigurasi.
