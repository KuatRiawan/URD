# PT Upaya Riksa Daya (URD) — Standar Desain Sistem & Glosarium Istilah UI

---

## 1. Standar Desain Sistem Terpadu (Unified Design System)

Mengacu pada instruksi PRD, Ponytail, UI/UX Promax, dan Anti-Slop:

### A. Palet Warna & Semantic Tones
- **Brand Primary Red**: `#C81E1E` (Hover: `#a61717`, Active scale `0.98`). Digunakan secara hemat dan bermakna hanya untuk tombol aksi utama (*Primary Call to Action*), header brand, dan indikator kritis.
- **Secondary Actions**: Menggunakan `bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200` dengan hover halus. Menghindari tombol gelap pekat (`bg-slate-900`) di light mode agar kontras dan hierarki visual tetap proporsional.
- **Badges & Indikator Status**:
  - `success`: Hijau zamrud lembut (`bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300`).
  - `warning`: Kuning amber lembut (`bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300`).
  - `danger`: Merah mawar lembut (`bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-300`).
  - `info`: Biru langit lembut (`bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300`).
  - `neutral`: Abu-abu netral (`bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300`).

### B. Aturan Anti-Slop & Ergonomi Tombol
- **Anti-Slop R-19**: Menghilangkan efek kedip animasi (`animate-pulse`) yang berputar tanpa henti pada status sistem atau badge statis. Animasi putar (`animate-spin`) hanya digunakan saat mutasi/proses aktif (loading state).
- **Hirarki Tombol Tabel & Baris**: Mengeliminasi kekacauan tombol (*button clutter*). Setiap baris data memprioritaskan 1 aksi kontekstual utama (`Detail` / `Perbarui`) dan aksi sekunder ringkas tanpa kompetisi visual.

---

## 2. Glosarium Standar Istilah UI (Bahasa Indonesia Baku)

Untuk menjaga konsistensi lintas 5 peran kerja:

| Istilah Sebelumnya / Campuran | Istilah Standar Disetujui | Konteks Pemakaian |
| :--- | :--- | :--- |
| `Workspace` | **Ruang Kerja** / **Dasbor** | Header halaman dan judul modul peran |
| `Engine: PostgreSQL` | **Mesin Basis Data: PostgreSQL** | Telemetri sistem Super Admin |
| `Database Size` | **Ukuran Basis Data** | Telemetri teknis basis data |
| `Immutable Trigger` | **Pemicu Tak Terubah** | Status pengamanan jejak audit append-only |
| `Edit` | **Ubah** | Tombol aksi pengubahan data / modal |
| `Update Kirim` | **Perbarui Status** / **Catat Pengiriman** | Tabel dan drawer distribusi dokumen |
| `Status Follow-Up` | **Tindak Lanjut** | Kolom dan pelacakan komunikasi klien di Suket K3 |
| `Belum Dijadwalkan` | **Belum Dijadwalkan** | Status unit baru dalam PO |
| `Terjadwal` | **Terjadwal** | Unit yang telah ditetapkan tanggal riksa uji |
| `Ditugaskan` | **Ditugaskan** | Penugasan Ahli K3/Inspector di lapangan |
| `Sedang Diperiksa` | **Sedang Diperiksa** | Pemeriksaan aktif oleh Inspector |
| `Perlu Revisi` | **Perlu Revisi** | Dokumen/temuan dikembalikan untuk perbaikan |
| `Selesai` | **Selesai** | Seluruh proses pengujian unit tuntas |
| `Dibatalkan` | **Dibatalkan** | Status terminal pembatalan order / unit |

