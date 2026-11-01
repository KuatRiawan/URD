# Audit Modal & Dialog — PT Upaya Riksa Daya

Tanggal audit: implementasi P0/P1 dari workflow audit menyeluruh UI/UX.

---

## Ringkasan Temuan & Perbaikan

### Akar Masalah P0

File: `frontend/src/components/ui/Modal.jsx`

Class `h-[90dvh]` pada elemen panel modal diterapkan ke **semua** ukuran modal di tampilan mobile tanpa terkecuali. Akibatnya, modal konfirmasi sederhana (seperti dialog "Keluar dari Sistem") mengambil 90% tinggi layar meskipun kontennya hanya beberapa baris teks dan dua tombol. Class `sm:h-auto` hanya memperbaiki tampilan desktop, bukan mobile.

Perbaikan: hapus `h-[90dvh] sm:h-auto` dari class panel. `max-h-[92dvh]` yang sudah ada cukup untuk membatasi modal dengan konten panjang. Modal kini menggunakan tinggi berdasarkan konten (`height: auto` secara efektif).

### P1 — Tone Dialog Logout

File: `frontend/src/components/layout/AppLayout.jsx`

Konfirmasi logout menggunakan `tone: 'warning'` (amber) padahal tindakan logout adalah tindakan destruktif terhadap sesi pengguna. Tone yang tepat adalah `'danger'` (merah) sesuai dengan semantik tindakan.

Perbaikan: ubah `tone: 'warning'` menjadi `tone: 'danger'`.

---

## Inventarisasi Lengkap Modal & Dialog

| Modal / Dialog | File | Ukuran | Masalah Ditemukan | Perbaikan | Status |
|---|---|---|---|---|---|
| ConfirmDialog (logout, hapus, dll) | `components/ui/FeedbackProvider.jsx` | `sm` | h-[90dvh] memaksa tinggi penuh di mobile | Hapus `h-[90dvh]` dari Modal.jsx (global fix) | FIXED |
| Modal (komponen dasar) | `components/ui/Modal.jsx` | sm/md/lg/xl | `h-[90dvh] sm:h-auto` berlaku di semua mobile | Hapus `h-[90dvh] sm:h-auto`, pertahankan `max-h-[92dvh]` | FIXED |
| Tone logout dialog | `components/layout/AppLayout.jsx` | - | `tone: 'warning'` (amber) kurang tepat untuk tindakan destruktif | Ubah ke `tone: 'danger'` | FIXED |
| ObjectQrModal | `features/objects/components/ObjectQrModal.jsx` | default (`md`) | Tidak ada masalah; konten pendek, tinggi kini auto | - | OK |
| ObjectDetailModal | `features/objects/components/ObjectDetailModal.jsx` | `xl` | Konten panjang, scroll sudah benar | - | OK |
| ObjectCsvModal | `features/objects/components/ObjectCsvModal.jsx` | `md` | Konten form sedang, tidak ada masalah | - | OK |
| CreateObjectModal | `features/objects/components/CreateObjectModal.jsx` | `md` | Konten form panjang, sudah ada scroll via `flex-1 overflow-y-auto` | - | OK |
| ClientFormModal | `features/clients/components/ClientFormModal.jsx` | `md` | Form sedang, tidak ada masalah | - | OK |
| ClientDetailModal | `features/clients/components/ClientDetailModal.jsx` | `lg` | Konten detail panjang, scroll benar | - | OK |
| BapDetailModal | `features/bap/components/BapDetailModal.jsx` | `xl` | Konten dokumen panjang, scroll benar | - | OK |
| LhppDetailModal | `features/lhpp/components/LhppDetailModal.jsx` | `xl` | Konten dokumen panjang, scroll benar | - | OK |
| OrderDetailModal | `features/orders/components/OrderDetailModal.jsx` | `xl` | Konten detail panjang, scroll benar | - | OK |
| CreatePoWizardModal | `features/orders/components/CreatePoWizardModal.jsx` | `xl` | Wizard multi-langkah, scroll benar | - | OK |
| CsvImportModal | `features/orders/components/CsvImportModal.jsx` | `md` | Form upload, tidak ada masalah | - | OK |
| InspectionDetailModal | `features/inspections/components/InspectionDetailModal.jsx` | `xl` | Form inspeksi panjang, scroll benar | - | OK |
| StartInspectionModal | `features/inspections/components/StartInspectionModal.jsx` | `sm` | Konfirmasi sederhana, tinggi kini auto | - | OK |
| PdfPreviewModal | `features/inspections/components/PdfPreviewModal.jsx` | `xl` | Preview PDF, butuh tinggi besar, max-h-[92dvh] sudah tepat | - | OK |
| RejectAssignmentModal | `features/dashboard/components/RejectAssignmentModal.jsx` | `sm` | Form singkat, tinggi kini auto | - | OK |
| WorkQueueWidget (inline Modal) | `features/dashboard/WorkQueueWidget.jsx` | `md` | Konfirmasi penugasan, tinggi kini auto | - | OK |
| SuketDetailModal | `features/suket/components/SuketDetailModal.jsx` | default | Konten detail, tidak ada masalah | - | OK |
| CreateSuketModal | `features/suket/components/CreateSuketModal.jsx` | default | Form, tidak ada masalah | - | OK |
| UpdateDistributionModal | `features/distributions/components/UpdateDistributionModal.jsx` | default | Form update, tidak ada masalah | - | OK |
| UnitValidityModal | `features/reminders/components/UnitValidityModal.jsx` | default | Detail validitas, tidak ada masalah | - | OK |
| AddCompetencyModal | `features/scheduling/components/AddCompetencyModal.jsx` | `sm` | Form singkat, tinggi kini auto | - | OK |
| HistoryDetailModal | `features/history/components/HistoryDetailModal.jsx` | default | Detail riwayat, tidak ada masalah | - | OK |
| IssuesPage inline Modal | `features/issues/IssuesPage.jsx` | default | Modal inline, tidak ada masalah | - | OK |
| GlobalSearchDialog | `components/search/GlobalSearchDialog.jsx` | full-screen | Komponen terpisah, bukan Modal.jsx; layout full-screen disengaja untuk UX pencarian | - | OK |

---

## Catatan Teknis

- Perubahan `Modal.jsx` bersifat global: satu penghapusan class memperbaiki **semua** modal di seluruh aplikasi sekaligus.
- `max-h-[92dvh]` tetap dipertahankan untuk mencegah modal konten panjang melampaui layar.
- `flex-1 overflow-y-auto` pada area konten modal sudah ada sebelumnya dan bekerja benar untuk scroll konten panjang.
- `pb-safe` pada panel tetap dipertahankan untuk menghormati safe area perangkat mobile.
- Handle bar (`sm:hidden`) tetap ditampilkan untuk memberi petunjuk visual bottom-sheet di mobile.
