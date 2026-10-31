# Matriks integrasi FE, BE, PostgreSQL

| Alur | Frontend | Backend | Database | Bukti/status |
|---|---|---|---|---|
| Login/guard | Login/route tests | JWT/auth/authorize | users/sessions | Test suite, bukan browser role lengkap |
| Marketing PO | Wizard source | Create, schedule, assignment | orders/units/assignments | E2E API lulus pada DB sementara |
| Checklist/temuan | Langkah inspeksi source | Save/submit/ownership | results/findings | API suite lulus |
| Foto/signature | Form upload/signature source | Upload handler dan role | attachments/signatures | API suite; perangkat nyata belum dites |
| Finalisasi LHPP | CTA role-based, preview | Marketing/Admin Sistem | LHPP/revisions/file | API lulus; hash unduhan cocok |
| Finalisasi BAP | Edit Inspector, finalisasi Marketing | Validasi signature dan role | BAP/file | API lulus; hash unduhan cocok |
| Manager | Menu monitoring | GET; mutasi 403 | Operasional | Sebagian API; browser belum dites |
| Super Admin | Users/settings source | Route user/Joi | users/templates/audit | API; konfigurasi browser belum dites |
| Distribusi/reminder | Halaman source | Tracking/job | distribution/reminder | API; kanal eksternal tidak dites |

`urd_dev`: 39 tabel dan 89 FK; tidak ada orphan pada empat join inti yang dihitung. Bukan bukti seluruh relasi histori.
