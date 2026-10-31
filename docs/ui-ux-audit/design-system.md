# Standar Design System & Token Desain
PT Upaya Riksa Daya

## 1. Identitas Visual & Filosofi Desain

Design system PT Upaya Riksa Daya dirancang dengan prinsip enterprise-grade K3: akurat, berintegritas, bersih, responsif, dan ergonomis untuk penggunaan lapangan maupun manajemen kantor.

### Karakteristik Utama:
- Identitas Resmi: PT Upaya Riksa Daya (PJK3 Riksa Uji K3).
- Palet Warna Korporat: Merah URD (`#C81E1E`) sebagai aksen identitas dipadukan dengan latar kanvas netral (`#F8FAFC` pada light mode, `#0B0F19` pada dark mode enterprise).
- Ikonografi Tunggal: `@phosphor-icons/react` dengan konsistensi stroke dan fill.
- Bebas Karakter Slop: Tidak menggunakan em dash (`—`) pada teks UI atau dokumentasi.

## 2. Sistem Warna (Color System)

| Token Nama | Nilai Light Mode | Nilai Dark Mode | Penggunaan |
|---|---|---|---|
| `--color-brand-primary` | `#C81E1E` | `#E02424` | Tombol primer, aksen aktif, identitas URD |
| `--color-brand-hover` | `#A11616` | `#C81E1E` | Keadaan hover & active tombol primer |
| `--color-brand-subtle` | `#FEF2F2` | `rgba(224, 36, 36, 0.15)` | Latar belakang badge / card beraksen merah |
| `--color-canvas-bg` | `#F8FAFC` | `#0B0F19` | Latar belakang utama seluruh halaman |
| `--color-surface` | `#FFFFFF` | `#111827` | Latar kartu (card), kontainer data, modal |
| `--color-surface-subtle`| `#F1F5F9` | `#1F2937` | Latar input nonaktif, header tabel |
| `--color-text-primary` | `#0F172A` | `#F8FAFC` | Judul, label utama, angka metrik |
| `--color-text-secondary`| `#475569` | `#94A3B8` | Deskripsi, teks pendukung, breadcrumb |
| `--color-border` | `#E2E8F0` | `#1F2937` | Garis pembatas kartu dan tabel |
| `--color-status-success`| `#10B981` | `#34D399` | Status Selesai, Terbit, Memenuhi Syarat |
| `--color-status-warning`| `#F59E0B` | `#FBBF24` | Status Dalam Proses, Menunggu Tindakan |
| `--color-status-danger` | `#EF4444` | `#F87171` | Status Ditolak, Tidak Memenuhi Syarat |
| `--color-status-info` | `#0EA5E9` | `#38BDF8` | Status Terjadwal, Terkonfirmasi, Ditugaskan |

## 3. Tipografi & Skala Hierarki (Typography)

Font keluarga tunggal: **Plus Jakarta Sans** (Variable).

| Tingkat Hierarki | Kelas Tailwind | Ukuran (px) | Berat (Weight) | Penggunaan |
|---|---|---|---|---|
| H1 (Page Title) | `text-xl sm:text-2xl` | 20px / 24px | Extrabold (800) | Judul halaman utama di PageHeader |
| H2 (Section Title)| `text-sm sm:text-base` | 14px / 16px | Bold (700) | Judul bagian kartu atau modal |
| H3 (Card Subhead)| `text-xs sm:text-sm` | 12px / 14px | Bold (700) | Sub-judul metrik, nama objek di kartu |
| Body Text | `text-xs sm:text-sm` | 12px / 14px | Normal (400) / Medium (500) | Paragraf penjelasan, formulir |
| Caption / Help | `text-[11px]` | 11px | Normal (400) | Keterangan tambahan di bawah input |
| Monospace Text | `font-mono text-xs` | 12px | Bold (700) | Nomor PO, Order, Serial Number, Suket |
| Badge Label | `text-[10px] sm:text-xs`| 10px / 12px | Bold (700) | Status operasional dan jenis alat |

## 4. Spacing, Radius & Elevasi

- **Padding Halaman**: `p-3.5 sm:p-6 lg:p-7 pb-24 lg:pb-7` (memastikan konten mobile tidak tertutup bottom bar).
- **Radius Sistem**:
  - Tombol Primer / Sekunder: `rounded-lg` (8px).
  - Badge Status & Avatar: `rounded-full` (9999px).
  - Kartu & Panel Kontainer: `rounded-xl` (12px) atau `rounded-2xl` (16px).
  - Modal Bottom Sheet Mobile: `rounded-t-[28px]` atas di mobile, `rounded-2xl` di desktop.
- **Elevasi / Bayangan**:
  - Kartu standar: `shadow-2xs` atau `shadow-xs`.
  - Floating Bottom Nav: `shadow-[0_12px_32px_rgba(0,0,0,0.12)]`.
  - Popover & Drawer: `shadow-pop` (20px blur, penegasan kedalaman visual).

## 5. Breakpoint Standar Responsif

| Breakpoint | Target Layar | Perilaku Layout |
|---|---|---|
| `< 640px` (Default Mobile) | Ponsel pintar (360×800, 390×844, 430×932) | Mode kartu touch-friendly, Bottom bar 5-tab, full-width modal |
| `640px - 767px` (`sm`) | Ponsel layar lebar / tablet mini | Transisi dari kartu ke tabel kompak, 2 kolom grid |
| `768px - 1023px` (`md` / `lg`) | Tablet portrait & landscape (768×1024, 1024×768) | Tabel tabular lengkap, 3 kolom metrik |
| `>= 1024px` (`lg` / `xl`) | Laptop & Desktop (1366×768, 1440×900, 1920×1080) | Sidebar navigasi samping tetap, top header breadcrumb |

