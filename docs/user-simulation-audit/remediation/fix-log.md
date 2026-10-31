# Log remediasi

| Prioritas | Perubahan | File utama | Verifikasi |
|---|---|---|---|
| P1 | Hapus nilai/kesimpulan teknis default; cegah fallback hasil saat submit; batasi isi otomatis ke item pilihan; validasi data dan tanda tangan wajib | `frontend/src/features/inspections/hooks/useInspectionDetailForm.js`, `StepChecklist.jsx`, `StepSignatures.jsx`, `backend/src/modules/inspections/routes.js` | Browser draf baru kosong; backend suite menguji validasi tanda tangan. Submit UI belum dijalankan. |
| P2 | Pimpinan mendapat panel jadwal dan riwayat baca saja; kontrol perubahan hanya role berwenang | `frontend/src/features/orders/components/OrderDetailModal.jsx` | Browser dan API 403; status DB tetap. |
| P2 | Satukan pilihan role ke role kanonis dan pertahankan pemetaan alias saat filter | `frontend/src/features/users/*`, `frontend/src/lib/utils/format.js`, `backend/src/modules/users/routes.js` | Browser filter; test backend setelah fixture diperbaiki. |
| P3 | Reset form create user ke `MARKETING` | `frontend/src/features/users/UsersPage.jsx` | Perubahan kode; retest reset form belum dilakukan. |
| P3 | Pindahkan efek samping toggle notifikasi keluar dari updater state; hilangkan emoji sapaan | `frontend/src/components/layout/TopHeader.jsx`, `frontend/src/features/dashboard/components/InspectorDashboardView.jsx` | Perlu retest console browser setelah edit terakhir. |
| Test fixture | Ganti alamat test yang ditolak validator Joi dengan alamat email valid | `backend/src/tests/api.test.js` | Backend suite diulang. |

Daftar ini berada di atas perubahan audit sebelumnya yang sudah ada di working tree; tidak ada perubahan terdahulu yang direset atau dihapus.
