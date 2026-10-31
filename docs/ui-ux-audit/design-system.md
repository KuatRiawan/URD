# Design System Existing URD

Dokumen ini merangkum token dan pola yang ditemukan di `frontend/src/styles/index.css` serta komponen bersama. Ini mencatat standar yang sudah ada, bukan nilai baru yang dipaksakan di setiap halaman.

## Identitas dan teknologi

- Nama: PT Upaya Riksa Daya.
- Logo: aset resmi `frontend/src/assets/logo-urd.png`.
- Font: Plus Jakarta Sans Variable, dengan fallback sistem.
- Ikon: `@phosphor-icons/react`.
- Framework gaya: Tailwind CSS v4, tema gelap melalui kelas `.dark`.
- Aksen merek: merah URD.

## Token warna aktual

| Token CSS | Light | Dark | Pemakaian |
|---|---|---|---|
| `--urd-brand-red` | `#C81E1E` | `#E02424` | Aksen utama / tombol identitas |
| `--urd-brand-red-hover` | `#A11616` | `#C81E1E` | Hover aksen |
| `--urd-bg` | `#F8FAFC` | `#0B0F19` | Latar aplikasi |
| `--urd-surface` | `#FFFFFF` | `#111827` | Permukaan komponen |
| `--urd-surface-subtle` | `#F1F5F9` | `#1F2937` | Permukaan sekunder |
| `--urd-text-primary` | `#0F172A` | `#F8FAFC` | Teks utama |
| `--urd-text-secondary` | `#475569` | `#94A3B8` | Teks pendukung |
| `--urd-border` | `#E2E8F0` | `#1F2937` | Garis batas |

Status success, warning, danger, dan info menggunakan kelas/utilitas warna di komponen, belum dipusatkan sebagai token CSS status khusus. Nilai warna status perlu dirasionalisasi sebelum komponen-komponen tersebut dimigrasikan.

## Tipografi

Font utama adalah Plus Jakarta Sans Variable. Skala yang lazim di komponen adalah judul halaman `text-xl` hingga `text-2xl`, heading bagian `text-sm` hingga `text-base`, body `text-xs` hingga `text-sm`, dan caption sekitar 10–12px. Sebagian halaman masih memakai skala lokal, sehingga konsistensi lintas semua fitur belum dinyatakan sempurna.

## Layout dan komponen

- Sidebar dan header dipakai oleh `AppLayout`; sidebar dapat disimpan dalam keadaan collapse.
- Mobile memakai empat tujuan utama dan tombol Lainnya; drawer menampilkan kelompok menu sesuai role.
- Tabel dengan banyak kolom pada banyak fitur memakai kartu mobile di bawah `sm` dan tabel dengan overflow horizontal pada ukuran lebih besar.
- Form kontrol global memiliki gaya light/dark, fokus, hover, disabled, dan checkbox/radio accent.
- Modal bersama berada di `components/ui/Modal.jsx`; menu bawah menggunakan sheet/drawer.
- Tombol dan kartu belum seluruhnya memakai satu komponen primitive; banyak halaman masih memakai utility class lokal.

## Breakpoint dan responsive behavior

Breakpoint bersumber dari konfigurasi Tailwind standar yang dipakai proyek: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px. Perilaku navigasi memakai `lg`; pergantian kartu/tabel pada beberapa fitur memakai `sm`. Kesesuaian visual di tiap breakpoint belum semuanya dibuktikan dengan browser.

## Aturan penggunaan

1. Gunakan logo resmi tanpa mengubah proporsinya.
2. Pertahankan merah URD untuk tindakan utama dan indikator identitas, bukan untuk semua elemen.
3. Gunakan font dan ikon yang sudah dipakai proyek.
4. Label status harus menyertakan teks, tidak hanya warna.
5. Beri state fokus keyboard yang terlihat.
6. Untuk tabel lebar, sediakan kartu atau strategi responsif yang terbaca.
7. Pertimbangkan target sentuh 44px untuk aksi utama mobile.
8. Pertahankan dukungan light dan dark mode.
9. Hindari em dash pada teks UI dan copywriting.

## Komponen yang belum memiliki standar tunggal penuh

Audit kode menemukan banyak pola lokal untuk tombol, field, badge, dan card. Sebelum membuat primitive baru, cek `components/ui` dan standardisasi bertahap dengan visual regression lintas fitur. Pekerjaan ini belum diselesaikan secara menyeluruh dalam perubahan ini.
