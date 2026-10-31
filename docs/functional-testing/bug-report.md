# Laporan Bug

## BUG-001 — Overflow horizontal pada filter Distribusi

- Role: Marketing; modul: Distribusi; viewport: 360px.
- Hasil aktual awal: lebar halaman terukur 404px, sehingga isi terpotong/harus digeser.
- Akar masalah: select target dan status berada pada flex row tanpa batas lebar minimum.
- Perbaikan: susun filter vertikal di viewport kecil dan beri `w-full min-w-0`; file `frontend/src/features/distributions/components/DistributionFilterBar.jsx`.
- Uji ulang: PASS, body dan dokumen 360px; dashboard tetap lulus pada delapan lebar.
- Status: CLOSED.

## BUG-002 — Audit Log Pimpinan crash saat render data berbentuk object

- Role: Pimpinan; route: `/app/audit-logs`.
- Hasil aktual awal: React error boundary menampilkan `Objects are not valid as a React child` untuk objek `{role, email}`.
- Akar yang terlihat: nilai pada field tabel dapat berupa object; UI langsung mengirimnya sebagai React child. SQL route menghasilkan kolom actor, tetapi bentuk konkret payload yang memicu kasus belum dibuktikan sebagai jalur produksi tertentu.
- Perbaikan: `AuditLogPage.jsx` menormalkan nilai primitive/object sebelum render dan mengekstrak role yang dikenal. Ditambah tes regresi untuk `user_role` berbentuk object.
- Uji ulang: PASS di test komponen dan browser dengan data audit terisi; halaman menampilkan baris log.
- Status: CLOSED untuk crash yang direproduksi. Bentuk payload sumber tetap perlu ditelusuri bila muncul lagi.
