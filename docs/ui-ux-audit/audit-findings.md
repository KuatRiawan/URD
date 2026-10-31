# Audit UI/UX Aplikasi PT Upaya Riksa Daya

**Tanggal:** 31 Oktober 2026  
**Cakupan:** pemeriksaan statis route, konfigurasi menu, layout bersama, token CSS, tabel, dan halaman fitur React. Pemeriksaan visual langsung dilakukan pada halaman masuk dengan browser pada 360 × 800. Halaman terautentikasi belum diperiksa secara visual karena sesi uji per role tidak tersedia.

## Ringkasan

Frontend menggunakan React 19, Vite, React Router, Tailwind CSS v4, Plus Jakarta Sans Variable, dan Phosphor Icons. Route utama berada di `frontend/src/app/router.jsx`; navigasi dan pembagian menu mobile berada di `frontend/src/components/layout/navConfig.js`. Layout menampilkan sidebar di desktop dan navigasi bawah hingga breakpoint `lg`; menu sekunder dimuat di drawer Lainnya.

Banyak tabel operasional sudah menyediakan kartu mobile tersendiri pada lebar di bawah `sm`, sementara tabel desktop berada dalam kontainer `overflow-x-auto`. Ini telah diverifikasi di kode, belum melalui uji visual di seluruh ukuran layar. Belum ada dasar untuk menyatakan seluruh halaman bebas overflow atau seluruh workflow per role telah lulus uji.

## Inventaris halaman dan pemeriksaan kode

| Modul / route | Role berdasarkan route | Pemeriksaan kode |
|---|---|---|
| Dasbor `/app/dashboard` | Semua role login | Variasi tampilan Inspector, Pimpinan, dan operasional diperiksa di `DashboardPage.jsx` dan komponen dashboard. |
| PO & Order `/app/orders` | Admin Sistem, Admin Kantor, Inspector, Pimpinan | Wizard PO, detail PO, tabel dan kartu mobile ditelusuri. |
| Klien `/app/clients` | Admin Sistem, Admin Kantor, Inspector, Pimpinan | Tabel/kartu mobile dan route diperiksa. |
| Objek Uji `/app/objects` | Admin Sistem, Admin Kantor, Inspector, Pimpinan | Tabel/kartu mobile dan route diperiksa. |
| Jadwal `/app/schedule`, alias `/app/scheduling` | Admin Sistem, Admin Kantor, Inspector, Pimpinan | Route dan menu per role ditelusuri. |
| Pengujian `/app/inspections` | Admin Sistem, Admin Kantor, Inspector, Pimpinan | Daftar responsif dan tahapan form inspeksi ditinjau secara statis. |
| BAP `/app/bap` | Admin Sistem, Admin Kantor, Inspector, Pimpinan | Route, tabel, detail, dan parameter pencarian notifikasi ditelusuri. |
| LHPP `/app/lhpp` | Admin Sistem, Admin Kantor, Inspector, Pimpinan | Route dan kartu/tabel daftar diperiksa. Renderer PDF berada di luar cakupan visual UI ini. |
| Riwayat `/app/history` | Semua role utama | Tampilan kartu dan tabel desktop ditinjau. |
| Distribusi `/app/distributions` | Admin Sistem, Marketing/Admin Kantor, Pimpinan | Tabel/kartu dan hak akses route ditinjau. |
| Suket `/app/suket` | Admin Sistem, Admin Kantor, Pimpinan | State pembuka modal detail ditemukan tidak digunakan; diperbaiki agar tombol tutup benar-benar menutup modal. |
| Pengingat `/app/reminders` | Admin Sistem, Admin Kantor, Pimpinan | Route dan akses menu ditinjau. |
| Kendala `/app/issues` | Semua role utama | Route dan konfigurasi menu ditinjau. |
| Notifikasi `/app/notifications` | Semua pengguna terautentikasi | Route tanpa pembatas role eksplisit; tetap berada di dalam layout terautentikasi. |
| Pengguna `/app/users` | Admin Sistem | Route dibatasi untuk Admin Sistem. |
| Audit `/app/audit-logs`, alias `/app/audit-log` | Admin Sistem, Pimpinan | Route dibatasi dan alias diperiksa. |
| Pengaturan `/app/settings` | Semua role utama | Route ada di dalam layout terautentikasi. |
| Login, verifikasi publik, portal klien | Publik / pengguna terkait | Login dilihat langsung pada 360 × 800; halaman publik lainnya hanya ditinjau secara statis. |

Inventaris tersebut memeriksa keberadaan route dan sumber komponennya. Ini bukan klaim bahwa setiap tombol, state API, atau semua role telah dijalankan lewat browser.

## Temuan dan perubahan

| Prioritas | Temuan | Dampak | Perubahan |
|---|---|---|---|
| Tinggi | Drawer navigasi dan modal belum memindahkan fokus, membatasi Tab, atau mengembalikan fokus pemicu. | Pengguna keyboard dapat kehilangan konteks dan fokus masuk ke halaman latar. | Menambahkan hook `useDialogFocus` dan menggunakannya pada drawer serta Modal bersama. |
| Sedang | Polling penghitung notifikasi layout berjalan sangat sering dan berulang saat navigasi. | Permintaan jaringan berulang ketika pengguna berpindah route. | Polling layout menjadi 30 detik, berhenti saat tab tersembunyi, refresh saat tab aktif, dan membatalkan request saat unmount. |
| Sedang | Bottom nav dan ruang konten tidak memperhitungkan safe area perangkat. | Kontrol dapat terlalu dekat dengan area gesture perangkat. | Menambahkan inset safe-area pada posisi navigasi dan padding bawah konten. |
| Sedang | Tombol Mulai Pemeriksaan tidak memberi state proses yang jelas. | Inspector dapat mengira aksi tidak berjalan dan menekan berulang. | Tombol menunjukkan status membuka, memiliki `aria-busy`, dinonaktifkan selama request, dan target sentuh minimal 44px. |
| Sedang | Modal detail Suket menampilkan berdasarkan isi data meski state `detailOpen` ditutup. | Aksi tutup tidak menutup modal. | State pembuka kini diteruskan sebagai kondisi `open`. |
| Rendah | Aksi drawer dan tombol tema terlalu kecil pada layar sentuh. | Lebih sulit digunakan dengan jari. | Target tombol yang diperiksa dinaikkan ke 44px. |
| Rendah | Lint menemukan catch kosong, assignment berulang yang tidak perlu, dan nilai/props tak digunakan. | Mengurangi keterbacaan dan menyembunyikan alasan fallback. | Catch diberi alasan; variabel/props mati dibersihkan; lint kini tanpa error dan warning. |

## Responsif yang ditemukan dalam kode

- Banyak tabel utama memiliki alternatif kartu untuk layar di bawah `sm`: klien, objek, PO, BAP, LHPP, distribusi, Suket, pengguna, audit log, riwayat, dan daftar inspeksi.
- Tabel desktop dibungkus dengan `overflow-x-auto`; pada tablet 640px ke atas pola tersebut kembali ke tabel. Keterbacaan setiap tabel pada tablet belum disahkan melalui screenshot.
- Navigasi bawah tampil sampai breakpoint `lg`; sidebar tampil pada ukuran `lg` ke atas. Tablet portrait menggunakan navigasi bawah.
- Drawer mempunyai batas tinggi berbasis `dvh`, konten drawer dapat di-scroll, dan body scroll dikunci saat terbuka.
- Pengujian ukuran 390, 430, 768, 1024, 1366, 1440, dan 1920px belum dilakukan melalui browser.

## Belum terverifikasi / pekerjaan lanjutan

1. Visual seluruh halaman pada delapan viewport yang diminta.
2. Alur interaktif setiap role dengan akun uji terpisah, termasuk permission dan error API.
3. Console, network, dan status gambar pada halaman terautentikasi.
4. Keterbacaan semua tabel pada tablet portrait dan landscape.
5. Lighthouse/aksesibilitas otomatis, kontras aktual, zoom 200%, dan penggunaan keyboard lintas halaman.

Akun uji tidak tersedia pada sesi ini. Keterbatasan tersebut dicatat agar hasil tidak disalahartikan sebagai audit visual menyeluruh.
