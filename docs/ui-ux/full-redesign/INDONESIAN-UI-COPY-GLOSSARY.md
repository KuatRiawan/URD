# URD — Standardized Bahasa Indonesia UI Copy Glossary

**Project:** PT Upaya Riksa Daya (URD)  
**Purpose:** Single source of truth for natural, professional, consistent Indonesian UI copy across all 5 roles, pages, tables, forms, modals, and status badges.

---

## 1. Preserved Official K3 & Business Terms

These official Indonesian K3 regulatory and operational abbreviations must never be translated into casual slang or English:

| Official Term | Full Meaning | Usage Context |
|---|---|---|
| **Riksa Uji K3** | Pemeriksaan dan Pengujian Keselamatan & Kesehatan Kerja | General service terminology |
| **PO** | Purchase Order / Kontrak Pekerjaan | Commercial contract containing 1 or more equipment units |
| **Surat Tugas** | Surat Tugas Pelaksanaan Riksa Uji | Official assignment document for Inspector (`Ahli K3`) |
| **BAP** | Berita Acara Pemeriksaan dan Pengujian | Field examination record signed by Inspector and Client PIC |
| **LHPP** | Laporan Hasil Pemeriksaan dan Pengujian | Complete technical inspection report |
| **Suket K3** | Surat Keterangan Keselamatan dan Kesehatan Kerja (Disnaker) | Government-issued K3 eligibility certificate |
| **SKP** | Surat Keputusan Penunjukan Ahli K3 | Inspector's official Ministry of Manpower competency license |
| **BAST** | Berita Acara Serah Terima Dokumen | Handover proof for physical/digital deliverables to client |
| **PIC** | Person in Charge / Penanggung Jawab Lokasi | Client representative at the inspection site |

---

## 2. Navigation & Workspace Titles

| Route | Standardized Navigation Label | Standardized Page Header Title |
|---|---|---|
| `/app/dashboard` | Dasbor | Dasbor Operasional / Ringkasan Eksekutif / Konsol Sistem |
| `/app/orders` | Purchase Order | Manajemen Purchase Order (PO) |
| `/app/clients` | Data Klien | Direktori Perusahaan Klien |
| `/app/objects` | Objek Riksa Uji | Inventaris Objek & Peralatan K3 |
| `/app/schedule` | Penjadwalan | Jadwal Penugasan & Kompetensi Ahli K3 |
| `/app/inspections` | Lembar Kerja | Lembar Kerja Riksa Uji Lapangan |
| `/app/bap` | Berita Acara (BAP) | Berita Acara Pemeriksaan (BAP) |
| `/app/lhpp` | Laporan (LHPP) | Laporan Hasil Pemeriksaan & Pengujian (LHPP) |
| `/app/suket` | Suket K3 | Pengawalan Penerbitan Suket K3 Disnaker |
| `/app/distributions` | Distribusi Dokumen | Distribusi & Serah Terima Dokumen (BAST) |
| `/app/history` | Riwayat Pekerjaan | Arsip & Riwayat Pemeriksaan |
| `/app/reminders` | Pengingat Masa Berlaku | Pengingat Masa Berlaku Alat & SKP |
| `/app/issues` | Kendala Lapangan | Pemantauan Kendala Operasional |
| `/app/notifications` | Notifikasi | Pusat Notifikasi |
| `/app/users` | Manajemen Pengguna | Manajemen Pengguna, Kompetensi & Hak Akses |
| `/app/audit-logs` | Log Audit | Catatan Audit Sistem |
| `/app/settings` | Pengaturan | Pengaturan Akun & Preferensi Sistem |

---

## 3. Standardized Action Labels (Buttons & Menus)

| Intent | Standardized Indonesian Label | Avoid (Inconsistent / Mixed) |
|---|---|---|
| Create new record | `+ Buat [Entitas]` / `+ Tambah [Entitas]` | `Create New`, `Add Data`, `Input Baru` |
| Save changes | `Simpan Perubahan` / `Simpan` | `Submit Data`, `Save`, `Update` |
| Cancel modal/form | `Batal` | `Cancel`, `Close Modal`, `Tutup Form` |
| Close read-only view | `Tutup` | `Exit`, `Kembali Tutup` |
| Export CSV | `Ekspor CSV` | `Download CSV`, `Export Data` |
| Import CSV | `Impor CSV` | `Upload CSV`, `Import File` |
| Download PDF | `Unduh PDF` | `Download File PDF` |
| Preview PDF | `Pratinjau PDF` | `View PDF`, `Preview` |
| Reset filters | `Reset Filter` / `Atur Ulang Filter` | `Clear All`, `Hapus Pencarian` |
| Refresh data | `Muat Ulang` | `Reload Page`, `Refresh` |
| Confirm destructive action | `Hapus` / `Nonaktifkan` / `Cabut Akses` | `Delete Forever`, `Remove` |

---

## 4. Standardized Status Labels

| System Status Code | Standardized UI Label | Semantic Tone |
|---|---|---|
| `DRAFT` | Draf | Neutral (`slate`) |
| `SCHEDULED` / `ASSIGNED` | Terjadwal | Info (`blue`) |
| `IN_PROGRESS` / `ON_SITE` | Sedang Diuji | Info (`blue`) |
| `PENDING_REVIEW` / `SUBMITTED` | Menunggu Evaluasi | Warning (`amber`) |
| `REVISION_REQUIRED` / `REJECTED` | Perlu Revisi | Danger (`red`) |
| `APPROVED` / `COMPLETED` / `LAYAK` | Selesai / Layak K3 | Success (`emerald`) |
| `TIDAK_LAYAK` | Tidak Layak K3 | Danger (`red`) |
| `EXPIRED` | Kedaluwarsa | Danger (`red`) |
| `EXPIRING_SOON` | Segera Berakhir | Warning (`amber`) |

