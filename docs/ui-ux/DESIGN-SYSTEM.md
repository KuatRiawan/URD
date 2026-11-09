# URD Design System — Apple-Inspired Native Enterprise Utility
**PT Upaya Riksa Daya — Sistem Operasional Terpadu Riksa Uji K3**

Dokumen ini adalah acuan resmi desain dan implementasi antarmuka (UI/UX) untuk aplikasi operasional PT Upaya Riksa Daya. Sistem ini mengombinasikan keanggunan **macOS Tahoe / System Settings / Finder** untuk pengalaman desktop dan kesederhanaan **iOS 26 / Apple HIG** untuk pengalaman mobile lapangan, sambil **mempertahankan 100% identitas merek resmi PT Upaya Riksa Daya**.

---

## 1. Filosofi Desain & Pelestarian Identitas Merek (Brand Preservation)

Sebagai aplikasi teknis keselamatan kerja dan kepatuhan regulasi Kementerian Ketenagakerjaan RI, URD mengutamakan:
1. **Pelestarian Identitas Resmi PT Upaya Riksa Daya:**
   - Logo resmi (`frontend/src/assets/logo-urd.png`) dengan simbol geometris Hitam-Merah-Hitam dan teks `PT. UPAYA RIKSA DAYA` wajib tampil utuh di atas latar putih bersih tanpa distorsi rasio, tanpa filter warna, dan tanpa efek kaca pada logo.
   - Palet merek utama menggunakan **URD Black (`#1D1D1F`)**, **URD Red (`#C81E1E`)**, **White (`#FFFFFF`)**, dan **Neutral Gray (`#F5F5F7` / `#6E6E73`)**. Aksen merah resmi URD tidak boleh diganti dengan biru sistem Apple.
2. **Refined Light Interface sebagai Arah Visual Utama:**
   - Tampilan default menggunakan kanvas terang `#F5F5F7` dengan permukaan kartu putih murni `#FFFFFF`, batas hairline halus `rgba(0,0,0,0.06)`, dan ruang kosong (whitespace) yang tenang.
3. **Selective Liquid Glass (Material Translusen Terkendali):**
   - Material kaca (`backdrop-filter: blur() saturate(180%)`) hanya diterapkan secara selektif pada navigasi melayang/sidebar (`.urd-glass-sidebar`), toolbar atas (`.urd-glass-toolbar`), dan tab bar bawah mobile (`.urd-glass-bottom-bar`).
   - Dilarang menerapkan efek kaca pada setiap kartu, tabel data, atau formulir. Tersedia fallback solid otomatis untuk `@media (prefers-reduced-transparency: reduce)`.
4. **Ketertiban Aksi (Action Discipline):**
   - Satu area kerja hanya memiliki **satu aksi utama (Primary CTA)**. Aksi sekunder berbobot visual tenang, dan aksi berisiko tinggi wajib melalui dialog konfirmasi eksplisit.
5. **Mobile-First Ergonomis untuk Lapangan (iOS-Inspired):**
   - Ahli K3 bekerja di area industri; kontrol interaktif memiliki target sentuh minimal 44×44px, daftar berkelompok bergaya iOS Inset Grouped, dan lembar kerja bebas gangguan.

---

## 2. Fondasi Visual (Design Tokens)

### A. Palet Warna (Color System)
Semua warna bersumber dari token semantik di `frontend/src/styles/index.css`:

| Token | Nilai Light (Default) | Nilai Dark | Penggunaan |
|---|---|---|---|
| `--urd-brand-red` | `#C81E1E` (URD Crimson) | `#E02424` | Aksen identitas URD, Primary CTA, status aktif |
| `--urd-brand-red-hover` | `#A11616` | `#C81E1E` | State hover/tekan tombol utama |
| `--urd-brand-black` | `#1D1D1F` | `#F5F5F7` | Struktur kontras utama & tipografi primer |
| `--urd-bg` | `#F5F5F7` | `#0B0D11` | Kanvas latar belakang aplikasi |
| `--urd-surface` | `#FFFFFF` | `#151821` | Panel, kartu, tabel, modal |
| `--urd-surface-subtle` | `#F2F2F7` | `#1E222D` | Latar grup sekunder, baris hover, kontrol |
| `--urd-border` | `rgba(0, 0, 0, 0.07)` | `rgba(255, 255, 255, 0.08)` | Garis batas struktural hairline |
| `--urd-text-primary` | `#1D1D1F` | `#F5F5F7` | Judul, label penting, data utama |
| `--urd-text-secondary` | `#6E6E73` | `#98989D` | Teks pendukung, metadata, timestamp |

### B. Warna Semantik Status (Status Tones)
Warna status membawa makna kepatuhan regulasi K3:
- **Sukses / Memenuhi Syarat (`emerald`):** Digunakan untuk status `SELESAI`, `TERBIT`, `DISETUJUI_FINAL`, `MEMENUHI_SYARAT_K3`.
- **Peringatan / Menunggu (`amber`):** Digunakan untuk status `MENUNGGU_QC`, `PERLU_REVISI`, `CHECKLIST_BELUM_LENGKAP`, `SEGERA_HABIS`.
- **Bahaya / Kritis / Ditolak (`rose` / `red`):** Digunakan untuk status `TIDAK_MEMENUHI_SYARAT`, `DIBATALKAN`, `KEDALUWARSA`, `KRITIS`.
- **Informasi / Terjadwal (`sky` / `blue`):** Digunakan untuk status `TERJADWAL`, `DITUGASKAN`, `SEDANG_DIPERIKSA`, `LHPP_DRAF`.
- **Netral (`slate`):** Digunakan untuk status `DRAF` awal, `BELUM_DIJADWALKAN`.

### C. Tipografi Sistem Bergaya Apple (System Typography)
- **Font Sans:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", "Plus Jakarta Sans Variable", sans-serif`
- **Font Mono:** `"SF Mono", ui-monospace, SFMono-Regular, Menlo, monospace` dengan `tabular-nums` untuk nomor seri alat, nomor order/PO, nomor LHPP/BAP, nilai ukur teknis, dan tanggal.
- **Hirarki & Tracking:**
  - `Page Title (h1)`: `18px–19px`, `font-bold`, `letter-spacing: -0.022em`.
  - `Section / Modal Title (h2/h3)`: `14px–17px`, `font-semibold` / `font-bold`, `letter-spacing: -0.015em`.
  - `Sidebar & Navigation`: `13px`, `font-medium` (aktif `font-semibold`), label grup tenang (`11px`) tanpa huruf kapital berlebih yang bising.
  - `Table Header`: `11px`, `font-semibold`, warna sekunder `#6E6E73`.

---

## 3. Disiplin Komponen (macOS + iOS Component Language)

### A. Sidebar & Toolbar (macOS Desktop Shell)
- **Sidebar (`SidebarNav.jsx`):** Menggunakan `.urd-glass-sidebar` (`rgba(246, 246, 248, 0.86)` dengan `backdrop-filter: blur(24px)`), item navigasi `rounded-[10px]`, state aktif menggunakan aksen merah resmi URD `#C81E1E` dengan teks putih.
- **Toolbar (`TopHeader.jsx`):** Menggunakan `.urd-glass-toolbar` (`rgba(255, 255, 255, 0.80)` dengan `backdrop-filter: blur(20px)`), pencarian cepat bergaya Spotlight (`⌘K`), pusat notifikasi popover, dan menu profil ringkas.

### B. Navigasi Bawah & Sheet Mobile (iOS Mobile Shell)
- **Bottom Tab Bar (`MobileBottomNav.jsx`):** Menggunakan `.urd-glass-bottom-bar` melayang di atas area aman (`safe-area-inset-bottom`), menampilkan 4 rute utama sesuai peran ditambah tab `"Lainnya"`. Automatically disembunyikan saat lembar kerja inspeksi lapangan (`?inspectionId=...`) sedang terbuka.
- **More Sheet (`MobileNavDrawer.jsx`):** Lembar bawah (`rounded-t-[28px]`) dengan daftar grup bergaya iOS Inset Grouped di atas kanvas `#F5F5F7`.

### C. Tombol (`Button.jsx`)
- Geometri sudut konsisten `rounded-[10px]` (`md`/`lg`) dan `rounded-xl` untuk mode sentuh (`touch`).
- Umpan balik tekan halus `active:scale-[0.985]`.
- Varian `primary` menggunakan `#C81E1E`; varian `secondary` menggunakan permukaan putih dengan batas hairline `border-black/[0.09]`.

### D. Kartu (`Card.jsx`) & Tabel (`TableWrapper.jsx`)
- Permukaan putih murni `#FFFFFF`, sudut `rounded-2xl`, batas hairline `border-black/[0.06]`, dan bayangan lembut multi-lapis.
- Tabel mendukung scroll horizontal rapi tanpa memicu overflow pada halaman utama (`html`/`body`).

---

## 4. Standar Responsif & Verifikasi Visual

| Perangkat | Lebar Viewport | Penyesuaian Antarmuka |
|---|---|---|
| **Mobile Ringkas** | `360px – 390px` | Navigasi tab bar iOS bawah, kartu unit vertikal, bottom sheet modal, target sentuh `>= 44px`, `0px` horizontal overflow |
| **Tablet** | `768px` | Tata letak grid 2 kolom adaptif, toolbar responsif |
| **Desktop Standar** | `1366px` | Sidebar macOS permanen (dapat diciutkan ke `76px`), tabel lengkap, ruang kerja terfokus |
| **Desktop Lebar** | `1920px` | Kontainer utama dibatasi `max-w-[92rem] mx-auto` dengan proporsi seimbang |
