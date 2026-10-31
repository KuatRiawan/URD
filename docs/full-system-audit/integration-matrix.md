# Matriks integrasi FE, BE, DB

| Modul | Frontend | Backend | Database | Hasil |
|---|---|---|---|---|
| Authentication | Login/guard diuji | JWT, refresh, akun aktif diuji | users, refresh_sessions | FIXED & TESTED pada suite |
| Marketing/PO | Wizard dibaca; browser role belum dijalankan | Create PO, unit dan assignment diuji | orders, order_objects, assignments | FIXED & TESTED pada E2E API |
| Multi-unit | Step unit dibaca | Penyimpanan unit individual diuji | Relasi objek/order/inspeksi | FIXED & TESTED untuk 3 unit skenario |
| Scheduling | Halaman dibaca | Conflict dan assignment diuji | schedules, assignments | FIXED & TESTED pada kasus suite |
| Inspector tasks | UI dibaca | Ownership dan dashboard diuji | assignments, audit_logs | FIXED & TESTED |
| Checklist | Komponen langkah dibaca | Simpan/submit diuji | inspection_results | FIXED & TESTED pada kasus suite |
| Foto dan signature | UI dibaca | Upload/delete/sign diuji | file_attachments, inspection_signatures | FIXED & TESTED pada kasus suite |
| LHPP | Daftar/detail dibaca | Generator/finalisasi diuji | lhpp_documents/revisions | PARTIALLY FIXED, perbandingan visual template belum lengkap |
| BAP | Halaman/preview dibaca | Setelah LHPP dan finalisasi diuji | bap_documents/revisions | FIXED & TESTED pada kasus suite |
| History | Halaman dibaca | Detail unit/history diuji | Join order, inspection, dokumen | FIXED & TESTED pada kasus suite |
| Reminder | Halaman dibaca | Pengingat/dispatch diuji | reminder tables | FIXED & TESTED pada kasus suite |
| Distribusi | Halaman dibaca | Status dan summary diuji | document_distributions | FIXED & TESTED pada kasus suite |

Status berlaku untuk kasus test yang ada, bukan semua variasi produksi.
