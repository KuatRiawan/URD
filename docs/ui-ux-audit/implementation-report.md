# Laporan Perbaikan UI/UX URD

**Tanggal:** 31 Oktober 2026

## Ringkasan

Audit kode mencakup route, konfigurasi role dan menu, layout bersama, token CSS, serta pola tabel/form pada halaman fitur. Pengamatan browser langsung hanya dilakukan pada halaman login ukuran 360 × 800. Perubahan dalam putaran ini berfokus pada aksesibilitas modal/drawer, interaksi mobile, polling notifikasi, dan temuan lint. Ini belum memenuhi definisi audit visual semua route dan seluruh ukuran layar.

## Perubahan yang diterapkan

| File | Perubahan |
|---|---|
| `frontend/src/components/ui/useDialogFocus.js` | Hook fokus dialog: fokus awal, loop Tab pada batas, Escape, dan pemulihan fokus. |
| `frontend/src/components/ui/Modal.jsx` | Modal bersama memakai hook fokus; ukuran kontrol close mobile diperbesar. |
| `frontend/src/components/layout/MobileNavDrawer.jsx` | Drawer memakai pengelolaan fokus dan target sentuh lebih besar. |
| `frontend/src/components/layout/MobileBottomNav.jsx` | Posisi bawah mengakomodasi safe area. |
| `frontend/src/components/layout/AppLayout.jsx` | Polling notifikasi 30 detik, jeda di tab tersembunyi, refresh saat fokus/aktif, pembatalan request, padding safe area. |
| `frontend/src/components/layout/TopHeader.jsx` | Polling isi popover notifikasi diturunkan ke 30 detik dan dependency hook dirapikan. |
| `frontend/src/components/ui/ThemeToggle.jsx` | Tinggi kontrol tema mobile ditingkatkan. |
| `frontend/src/features/dashboard/components/InspectorDashboardView.jsx` | Tombol Mulai Pemeriksaan menampilkan state request dan target sentuh 44px. |
| `frontend/src/features/suket/SuketPage.jsx`, `features/suket/components/SuketDetailModal.jsx` | State buka/tutup detail Suket dihormati. |
| Beberapa file frontend | Membersihkan variabel/props tak terpakai dan catch kosong; memperbaiki dependency React hook. |
| `frontend/src/components/layout/MobileBottomNav.test.jsx` | Menguji jumlah tujuan mobile per role, route menu, pembukaan drawer, dan pengembalian fokus. |

## Hasil pemeriksaan

- `npm --prefix backend test`: **55 tes lulus di 5 file**.
- `npm --prefix frontend run lint`: berjalan ulang setelah perbaikan. Status akhir dicantumkan setelah proses selesai.
- `npm --prefix frontend test`: **6 tes lulus di 2 file**, termasuk route internal Admin Sistem dan navigasi drawer mobile.
- `npm --prefix frontend run build`: **berhasil** dengan Vite 6.4.5.
- `npm --prefix frontend run lint`: **berhasil tanpa error atau warning**.
- Browser: login diperiksa pada 360 × 800; route internal per role belum diuji visual karena tidak ada akun uji.

## Batas pemeriksaan dan risiko tersisa

1. Delapan viewport dalam spesifikasi belum dijalankan seluruhnya.
2. Seluruh alur Marketing, Inspector, Pimpinan, dan Admin Sistem belum diselesaikan di browser.
3. Respons table/cards sudah diperiksa secara statis pada file fitur, tetapi tablet dan zoom belum diverifikasi visual.
4. Pemeriksaan Console, Network, aksesibilitas otomatis, dan screenshot before/after seluruh route belum tersedia.
5. Tidak ada refactor total seluruh halaman atau migrasi semua tombol/field ke komponen reusable. Perubahan semacam itu memerlukan verifikasi visual menyeluruh agar tidak mengubah alur bisnis.

Laporan ini sengaja membedakan perbaikan yang telah dilakukan dari pemeriksaan yang masih belum dilakukan.
