# Inventaris Fitur dan Test

## Inventaris repository

Frontend memiliki 17 halaman internal: dashboard, klien, objek, PO/order, penjadwalan, inspeksi, BAP, LHPP, riwayat, distribusi, Suket, pengingat, notifikasi, isu operasional, pengguna, audit log, dan pengaturan. Route `/app/scheduling` dan `/app/audit-log` adalah alias. Backend memiliki 19 kelompok route: auth, audit-log, BAP, clients, distributions, inspections, inspectors, LHPP, notifications, objects, operational-issues, orders, portal, reminders, scheduling, search, Suket, users, verify. Delapan belas kelompok bisnis tidak menghitung endpoint verifikasi publik.

### Status awal dari implementasi kode

| Area | Status awal | Bukti / catatan |
|---|---|---|
| Autentikasi dan route guard | Terimplementasi | AuthProvider, middleware authenticate/authorize, route tests |
| Klien, objek, PO/order | Terimplementasi | API dan UI; sebagian alur ada pada E2E integration |
| Jadwal, kompetensi, penugasan | Terimplementasi | scheduling / inspectors; E2E dan test API |
| Inspeksi, temuan, tanda tangan | Terimplementasi | test draft, findings, signatures, submit |
| LHPP, finalisasi, PDF/SKP | Terimplementasi | test PDF dan gate finalisasi; visual template belum diperiksa pixel-by-pixel |
| BAP dan PDF | Terimplementasi | E2E alur dan test PDF |
| Distribusi dan portal token | Terimplementasi | test status distribusi, token, riwayat |
| Suket dan pengingat | Terimplementasi | API tests |
| Dashboard dan notifikasi | Terimplementasi sebagian | halaman/endpoint ada; seluruh statistik dan perilaku realtime belum diverifikasi |
| Audit log immutable | Terimplementasi | trigger DB dan API test; browser menemukan lalu memperbaiki crash render data object |
| Pencarian / work queue | Terimplementasi | 7 test search/workqueue |
| Upload berkas dan foto | Belum dapat diverifikasi menyeluruh | belum ada matrix format, ukuran, dan kegagalan upload lengkap |
| Integrasi email/SMTP | Belum dapat diverifikasi | tidak mengirim email nyata saat audit |
| Responsif seluruh halaman | Terimplementasi sebagian | dashboard 8 ukuran; beberapa route diuji pada ponsel |

### Daftar route/kelompok fitur aktual

Status `Terimplementasi` di tabel ini berarti ada route/handler dan UI terkait di repository. Itu bukan bukti bahwa semua perilakunya sudah lolos uji.

| Permukaan | Fitur aktual | Status awal | Verifikasi audit |
|---|---|---|---|
| UI `/login`, `/` | Login dan redirect root | Terimplementasi | PASS: auth test dan browser |
| UI `/verifikasi/:code`, `/portal/:token` | Verifikasi dokumen dan portal klien | Terimplementasi | PASS parsial: API token; seluruh tampilan NOT RUN |
| UI `/app/dashboard` | Ringkasan operasi per role | Terimplementasi sebagian | PASS parsial: login/responsif; akurasi setiap KPI NOT RUN |
| UI `/app/clients` | Data klien | Terimplementasi | PASS route; CRUD UI NOT RUN |
| UI `/app/objects` | Objek uji | Terimplementasi | PASS parsial pada integration; seluruh CRUD UI NOT RUN |
| UI `/app/orders` | PO dan unit order | Terimplementasi | PASS E2E backend; seluruh form UI NOT RUN |
| UI `/app/schedule`, `/app/scheduling` | Jadwal dan kompetensi | Terimplementasi | PASS route/E2E; variasi UI NOT RUN |
| UI `/app/inspections` | Tugas inspeksi dan hasil pemeriksaan | Terimplementasi | PASS route dan API; seluruh checklist browser NOT RUN |
| UI `/app/lhpp` | Preview, finalisasi, dokumen LHPP | Terimplementasi | PASS alur/PDF test; pixel diff template NOT RUN |
| UI `/app/bap` | Berita Acara dan PDF | Terimplementasi | PASS integration/PDF |
| UI `/app/history` | Riwayat pengujian | Terimplementasi | PASS route Pimpinan; filter/pagination NOT RUN |
| UI `/app/distributions` | Distribusi dokumen | Terimplementasi | PASS route/responsive setelah fix |
| UI `/app/suket`, `/app/reminders` | Registri Suket dan pengingat | Terimplementasi | PASS API suite; seluruh browser form NOT RUN |
| UI `/app/notifications` | Notifikasi | Terimplementasi sebagian | Route PASS; seluruh aksi/baca-terima NOT RUN |
| UI `/app/issues` | Isu operasional | Terimplementasi | PASS API/E2E; semua aksi UI NOT RUN |
| UI `/app/users` | Pengguna dan role | Terimplementasi | Route PASS; CRUD browser NOT RUN |
| UI `/app/audit-logs`, `/app/audit-log` | Log audit | Terimplementasi | PASS setelah fix render object |
| UI `/app/settings` | Pengaturan dan profil | Terimplementasi | Route PASS; simpan pengaturan NOT RUN |
| API `auth`, `users` | Login, refresh, RBAC pengguna | Terimplementasi | PASS test auth/role tertentu |
| API `clients`, `objects`, `orders` | Klien, objek, PO dan unit | Terimplementasi | PASS API/integration terpilih |
| API `scheduling`, `inspectors` | Jadwal, kompetensi, penugasan | Terimplementasi | PASS integration terpilih |
| API `inspections`, `operational-issues` | Hasil inspeksi dan isu | Terimplementasi | PASS draft/temuan/submit/integration |
| API `lhpp`, `bap` | Dokumen dan finalisasi | Terimplementasi | PASS integration/PDF terpilih |
| API `distributions`, `portal`, `verify` | Distribusi, token, verifikasi | Terimplementasi | PASS integration terpilih |
| API `suket`, `reminders` | Surat keterangan dan pengingat | Terimplementasi | PASS test terkait |
| API `notifications`, `search` | Notifikasi, pencarian, work queue | Terimplementasi sebagian | PASS test search; seluruh notification flow NOT RUN |
| API `audit-log` | Query audit dan proteksi immutable | Terimplementasi | PASS API/database tests; UI crash regression diperbaiki |

Tidak ditemukan layanan eksternal wajib selain mekanisme email yang tersedia di source; pengiriman SMTP nyata tidak dilakukan. PDF generator tersedia dan diuji secara terstruktur, tetapi kesamaan visual dengan referensi tidak dibuktikan pada audit ini.

### Nama role yang dipakai

Seed saat ini memakai `ADMIN_SISTEM`, `MARKETING`, `INSPECTOR`, `PIMPINAN`. Kode tetap menerima alias `ADMIN_KANTOR`, `AHLI_K3`, dan `MANAGER` di sebagian route/UI. `ADMIN_KANTOR` ditampilkan sebagai Marketing, jadi bukan role kelima tersendiri dalam alur produk yang diuji.

## Bukti test otomatis

- Backend: 55 test PASS, 5 file. Termasuk 34 API, 7 search/workqueue, 8 PDF, 4 kepemilikan dokumen, 2 environment.
- Frontend setelah perubahan: 7 test PASS, 3 file. Termasuk auth/route guard (4), navigasi mobile (2), regresi Audit Log (1).
- Total yang dilaporkan: 62 PASS, 0 FAIL. Jumlah ini adalah test otomatis di suite, bukan semua skenario pada master prompt.
- `npm run lint`, `npm --prefix frontend run lint`, `npm --prefix frontend run build`: PASS. Test backend dijalankan pada run terpisah dan lulus sebelum perubahan frontend.

## Status area test

| Jenis | Status | Cakupan |
|---|---|---|
| Auth dan guard UI | PASS | redirect root, validasi login kosong, role Inspector dibatasi dari route pengguna |
| API bisnis / RBAC | PASS | API suite, role dan kepemilikan ID pada test yang tersedia |
| Integrasi PO sampai dokumen | PASS | multi-unit PAA/PTP/PUBT, BAP, LHPP, distribusi dan portal |
| PDF | PASS | pemeriksaan struktur dan lampiran SKP pada test generator |
| Browser login role | PASS | Marketing, Inspector, Pimpinan, Super Admin di `urd_test` |
| Browser CRUD/validasi menyeluruh | NOT RUN | bukan seluruh aksi untuk setiap modul dan role |
| Unggah file invalid/ukuran | NOT RUN | belum ada eksekusi matrix upload lengkap |
| Pixel compare seluruh template PDF | NOT RUN | tidak ada image diff 7 template |
| Beban/performance | NOT RUN | tidak menjalankan stress test |
