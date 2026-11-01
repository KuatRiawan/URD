# Audit Visual UI -- PT Upaya Riksa Daya

Tanggal audit: 2025-07-14
Auditor: Agen AI (workflow step visual-konsistensi)

---

## Ringkasan Temuan

| Prioritas | Kategori | Status |
|---|---|---|
| P0 | Modal mobile terlalu tinggi (h-[90dvh]) | Sudah diperbaiki di langkah sebelumnya |
| P2 | Warna tone konfirmasi logout (warning → danger) | Sudah diperbaiki |
| P2 | Dashboard polling interval (5s → 30s) | Diperbaiki |
| P3 | Ikon duplikat (ShieldCheck untuk Reminders & Suket) | Diperbaiki |
| P3 | Button radius tidak konsisten (rounded-md vs rounded-lg) | Diperbaiki |
| P3 | Notice `variant=` salah prop (seharusnya `tone=`) | Diperbaiki |
| P3 | Modal form tanpa error display | Diperbaiki |

---

## A. Spacing

Sistem spacing menggunakan Tailwind 4 dengan skala 4/8 dp yang konsisten:
- Padding halaman: `p-3.5 sm:p-6 lg:p-7`
- Gap komponen: `space-y-5` atau `space-y-6` antar section
- Padding kartu: `p-4 sm:p-5 sm:p-6`
- Gap form field: `space-y-4`

**Status:** Konsisten. Tidak ada spacing yang arbitrary atau tidak sesuai sistem.

---

## B. Border Radius

**Temuan:** Terdapat inkonsistensi antara `rounded-md` dan `rounded-lg` pada tombol.

- Komponen `Button` resmi menggunakan `rounded-lg`
- Beberapa halaman menggunakan raw `<button>` dengan `rounded-md`

**Perbaikan yang dilakukan:**
- `UsersPage`: tombol "Tambah Pengguna Baru" diubah ke `rounded-lg`
- `CreateUserModal`, `EditUserModal`: semua input, select, dan tombol diubah ke `rounded-lg`
- `AddCompetencyModal`: tombol submit diubah ke `rounded-lg`
- `CreateSuketModal`: tombol submit diubah ke `rounded-lg`
- `IssuesPage`: tombol aksi diubah ke `rounded-lg`
- `OrdersPage`: tombol "Buat PO" diubah ke `rounded-lg`
- `ObjectsPage`: tombol "Tambah Objek Uji" diubah ke `rounded-lg`
- `ClientsPage`: tombol "Tambah Klien" diubah ke `rounded-lg`
- `CreatePoWizardModal`: tombol navigasi wizard diubah ke `rounded-lg`
- `SuketPage`: tombol "Daftarkan Pengajuan" diubah ke `rounded-lg`
- `RemindersPage`: tombol dispatch diubah ke `rounded-lg`
- `ErrorBoundary`: tombol reset diubah ke `rounded-lg`

---

## C. Shadow

Shadow menggunakan token yang konsisten: `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow-card`, `shadow-pop`.
Tidak ditemukan shadow arbitrary.

---

## D. Warna

Warna merah URD konsisten menggunakan token:
- `#C81E1E` (brand-600) sebagai primary CTA
- `#A11616` atau `#991B1B` untuk hover state
- CSS custom property `--urd-brand-red: #C81E1E`

**Tidak ditemukan** penggunaan warna non-URD pada elemen interaktif utama.

---

## E. Ikon

Library: `@phosphor-icons/react` secara konsisten. Tidak ada import dari library lain.

**Duplikat ikon yang ditemukan dan diperbaiki:**
- `ShieldCheck` digunakan untuk dua menu berbeda: "Registri Suket K3" DAN "Pengingat Perpanjangan"
- Perbaikan: Menu "Pengingat Perpanjangan" diubah ke `Alarm` (sudah tersedia di imports)

**Sisa duplikat yang masih ada (dianalisa, tidak diubah karena konteks berbeda):**
- `ClockCounterClockwise`: digunakan untuk "Riwayat Pengujian" di sidebar desktop dan "Riwayat" di mobile nav
  - Duplikat ini bisa diterima karena kedua menu merujuk konsep yang sama (riwayat/history)
- `WarningOctagon`: digunakan untuk "Kendala Lapangan" dan "Kendala Operasional" di role berbeda
  - Sama-sama menu kendala, duplikat ini semantis konsisten

---

## F. Tipografi

Hierarki heading konsisten:
- `text-xl sm:text-2xl font-extrabold` untuk `PageHeader` title
- `text-base sm:text-lg font-extrabold` untuk modal title
- `text-xs font-bold` untuk label form
- `text-xs` atau `text-[11px]` untuk caption/metadata

---

## G. Empty State

Setiap halaman daftar sudah memiliki `EmptyState` dengan judul dan deskripsi. Komponen `EmptyState` global ada di `StateViews.jsx`.

---

## H. Loading State

Komponen `LoadingState` dan `ErrorState` global digunakan secara konsisten di seluruh halaman. Tabel dan daftar menampilkan spinner selama fetch data.

---

## I. Error Display pada Modal Form

**Temuan:** `CreateUserModal` dan `EditUserModal` sebelumnya tidak menampilkan pesan error dari server di dalam modal. Error hanya tampil di page-level banner yang tertutup modal.

**Perbaikan:** Kedua modal kini menerima prop `error` dan menampilkan `Notice tone="error"` di bagian atas form ketika ada error submit.

---

## J. Notice Props Salah

**Temuan:** `ProfileTab.jsx` dan `SecurityTab.jsx` menggunakan `<Notice variant="success">` padahal komponen hanya mendukung `tone="success"`. Akibatnya fallback ke `tone="info"` (biru) bukan hijau.

**Perbaikan:** Diubah ke `tone="success"` dan `tone="error"` pada kedua file tersebut.
