# Audit End-to-End: Alur Kerja Lengkap
## PT Upaya Riksa Daya

**Tanggal:** 2025-07-15

Dokumen ini memetakan alur kerja penuh dari pembuatan Purchase Order hingga distribusi dokumen ke Disnaker, meliputi semua peran yang terlibat.

---

## Alur Kerja Utama

```
Marketing buat PO
  -> Tambah unit dalam PO
  -> Atur jadwal inspeksi
  -> Tugaskan Inspector
    -> Inspector konfirmasi penugasan
    -> Inspector isi checklist
    -> Inspector input pengukuran/temuan
    -> Inspector upload foto
    -> Inspector buat tanda tangan
    -> Inspector submit hasil
  -> LHPP dibuat otomatis
    -> Inspector isi narasi teknis LHPP
    -> Inspector kirim ke Marketing
  -> Marketing pratinjau & finalisasi LHPP
  -> BAP diterbitkan otomatis
  -> Suket K3 dibuat
  -> Distribusi ke Klien & Disnaker
    -> Pimpinan monitoring
    -> Super Admin audit log
```

---

## Rincian Tahap per Tahap

### Tahap 1: Marketing Buat PO Baru

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Klik "Buat PO / Order Baru" | OrdersPage - tombol canManage | PASS |
| Step 1 Wizard: Pilih Klien | StepPoClient - pilih klien existing atau isi baru | PASS |
| Step 2 Wizard: Identitas PO | StepPoIdentity - nomor PO, tanggal, jenis layanan | PASS |
| Step 3 Wizard: Tambah Unit | StepPoUnits - toggle objek existing atau unit inline baru | PASS |
| Step 4 Wizard: Atur Jadwal | StepPoSchedule - tanggal mulai dan selesai | PASS |
| Step 5 Wizard: Review & Submit | StepPoReview - konfirmasi semua data | PASS |
| POST /orders | Backend | PASS |
| PO muncul di daftar dengan status ORDER_BARU | OrderTable | PASS |
| Work Queue menampilkan PO baru | WorkQueueWidget | PASS |

### Tahap 2: Tambah Unit Tambahan ke PO (opsional)

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Import CSV multi-unit | CsvImportModal - POST /orders/:id/objects/csv | PASS |
| Tambah unit satu per satu di step wizard | StepPoUnits | PASS |
| Unit muncul di daftar unitProgress PO | OrderDetailModal - tab unit | PASS |

### Tahap 3: Atur Jadwal Inspeksi

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Buka detail PO | openOrderDetail | PASS |
| Isi form jadwal (tanggal, waktu) | scheduleForm di OrderDetailModal | PASS |
| Cek konflik jadwal | checkConflicts - GET /schedules/conflicts | PASS |
| Simpan jadwal | handleSaveSchedule - POST /orders/:id/schedule | PASS |
| Status PO berubah ke TERJADWAL | Badge status di tabel | PASS |
| Jadwal muncul di SchedulePage | ScheduleAgendaSection | PASS |

### Tahap 4: Tugaskan Inspector

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Pilih Inspector dari daftar tersedia | MultiSelect Inspector di OrderDetailModal | PASS |
| Cek kompetensi Inspector | InspectorCompetencySection | PASS |
| Tugaskan | handleAssignInspectors - POST /orders/:id/assign | PASS |
| Status PO berubah ke DITUGASKAN | Badge status | PASS |
| Inspector menerima notifikasi | Notifikasi di NotificationsPage | PASS |
| Inspector muncul di Work Queue | Item ASSIGNMENT_CONFIRMATION | PASS |

### Tahap 5: Inspector Konfirmasi Penugasan

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Inspector melihat penugasan di dasbor | Tab "Konfirmasi" InspectorDashboardView | PASS |
| Klik "Terima" | handleRespondAssignment decision='DITERIMA' | PASS |
| Klik "Tolak" dengan alasan | RejectAssignmentModal - POST /orders/:id/assignments/:id/respond | PASS |
| Status assignment berubah | Badge di OrderDetailModal | PASS |

### Tahap 6: Inspector Isi Form Inspeksi Lapangan

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Inspector buka InspectionsPage | Route /app/inspections | PASS |
| Klik "Mulai Inspeksi Baru" atau auto dari dashboard | StartInspectionModal / URL params | PASS |
| Pilih Order, Object, Template | Dropdown di StartInspectionModal | PASS |
| POST /inspections/start | Backend - AHLI_K3 only | PASS |
| Lembar kerja dibuat dan dibuka | InspectionDetailModal | PASS |
| **Step 1 - Isi Checklist** | StepChecklist - setiap butir OK/Tidak OK/NA | PASS |
| Simpan draf checklist | PUT /inspections/:id/draft | PASS |
| **Step 2 - Temuan & Foto** | StepPhotosFindings | PASS |
| Upload foto temuan | POST /inspections/:id/findings/:id/attachments | PASS |
| **Step 3 - Kesimpulan Teknis** | StepConclusion | PASS |
| Pilih MS / TMS / Bersyarat | Radio/select kesimpulan | PASS |
| **Step 4 - Tanda Tangan** | StepSignatures | PASS |
| Signature pad Inspector | Canvas HTML5 | PASS |
| Signature pad klien/perwakilan | Canvas kedua | PASS |
| Submit hasil inspeksi final | POST /inspections/:id/submit | PASS |
| Status inspeksi berubah ke TERKIRIM | Badge TERKIRIM | PASS |
| LHPP dibuat otomatis oleh backend | Workflow trigger di workflow.js | PASS |
| BAP draf dibuat otomatis | Backend | PASS |

### Tahap 7: Inspector Isi Narasi Teknis LHPP

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Inspector buka LhppPage | Route /app/lhpp | PASS |
| LHPP muncul dengan status DRAF | LhppTable - badge status | PASS |
| Klik detail LHPP | openDetail - GET /lhpp/:id | PASS |
| Isi metode, catatan teknis, rekomendasi | draftForm di LhppDetailModal | PASS |
| Upload foto dokumentasi tambahan | handleUploadPhoto - POST /lhpp/:id/photos | PASS |
| Set tanggal masa berlaku yang direkomendasikan | draftForm.recommendedValidUntil | PASS |
| Simpan draf | handleSaveDraft - PATCH /lhpp/:id/draft | PASS |
| Kirim ke Marketing | handleSubmitReview - POST /lhpp/:id/submit-finalization | PASS |
| Status LHPP berubah ke SIAP_PREVIEW | LhppTable badge | PASS |
| Marketing menerima notifikasi | Work Queue item LHPP_REVIEW | PASS |

### Tahap 8: Marketing Pratinjau dan Finalisasi LHPP

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Marketing buka LhppPage | Route /app/lhpp | PASS |
| LHPP muncul di daftar status SIAP_PREVIEW | LhppTable | PASS |
| Klik detail | openDetail | PASS |
| Pratinjau PDF LHPP | handlePreviewPdf - GET /lhpp/:id/pdf | PASS |
| Unduh PDF | handleDownloadPdf | PASS |
| Klik "Finalisasi & Terbitkan BAP" | handleFinalizeLhpp - POST /lhpp/:id/finalize | PASS |
| Konfirmasi modal sebelum finalisasi | useConfirm dialog tone='success' | PASS |
| LHPP berubah ke TERBIT | Badge TERBIT | PASS |
| BAP diterbitkan otomatis dengan nomor BAP | Notifikasi feedback | PASS |

### Tahap 9: Generate BAP dan Tanda Tangan

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| BAP muncul di BapPage | BapTable | PASS |
| Edit draf BAP | PUT /bap/:id | PASS |
| Tambah tanda tangan Inspector | POST /bap/:id/signature | PASS |
| Tambah tanda tangan klien | POST /bap/:id/signature (client) | PASS |
| Finalisasi BAP | POST /bap/:id/finalize - canFinalize: MARKETING/ADMIN_SISTEM | PASS |
| Pratinjau PDF BAP | GET /bap/:id/pdf | PASS |
| Unduh PDF BAP | Blob download | PASS |
| Download Batch BAP per PO | GET /bap/order/:orderId/batch-pdf | PASS |

### Tahap 10: Distribusi Dokumen

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Buka DocumentDistributionPage | Route /app/distributions | PASS |
| Daftar dokumen siap kirim muncul | DistributionTable | PASS |
| Kartu ringkasan distribusi | DistributionSummaryCards | PASS |
| Update status distribusi (DIKIRIM) | Modal UpdateDistributionModal | PASS |
| Input nomor resi/tracking | trackingNumber field | PASS |
| Update status diterima (DITERIMA) | Status DITERIMA | PASS |
| Distribusi ke klien vs Disnaker | targetFilter | PASS |

### Tahap 11: Catat Pengiriman LHPP ke Klien

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Buka detail LHPP | openDetail | PASS |
| Isi form pengiriman (penerima, channel, tanggal) | deliveryForm di LhppDetailModal | PASS |
| POST /lhpp/:id/deliveries | Backend - ADMIN_KANTOR/ADMIN_SISTEM | PASS |
| Riwayat pengiriman tampil di detail | Panel pengiriman | PASS |

### Tahap 12: Pimpinan Monitoring

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Pimpinan buka dasbor | ManagementDashboardView | PASS |
| Lihat semua metrik order | Kartu metrik | PASS |
| Lihat workload Inspector | Tabel beban kerja | PASS |
| Pantau tren bulanan | SplineAreaChart | PASS |
| Monitor jadwal tim | SchedulePage - read-only | PASS |
| Monitor distribusi | DocumentDistributionPage - isReadOnly | PASS |
| Lihat laporan riwayat | HistoryPage | PASS |
| Export CSV rekap | GET /dashboard/export-recap.csv | PASS |

### Tahap 13: Super Admin Audit Log

| Langkah | Komponen/Endpoint | Status |
|---|---|---|
| Admin buka AuditLogPage | Route /app/audit-logs | PASS |
| Lihat semua aktivitas tercatat | Tabel/kartu audit log | PASS |
| Filter berdasarkan aksi | actionFilter | PASS |
| Filter berdasarkan modul | entityFilter | PASS |
| Semua aksi di atas tercatat di audit_logs | Tabel immutable | PASS |

---

## Ringkasan Status Alur End-to-End

| Tahap | Status |
|---|---|
| 1. Marketing buat PO | PASS |
| 2. Tambah unit ke PO | PASS |
| 3. Atur jadwal inspeksi | PASS |
| 4. Tugaskan Inspector | PASS |
| 5. Inspector konfirmasi | PASS |
| 6. Inspector isi form inspeksi | PASS |
| 7. Inspector isi narasi LHPP | PASS |
| 8. Marketing finalisasi LHPP | PASS |
| 9. Generate & finalisasi BAP | PASS |
| 10. Distribusi dokumen | PASS |
| 11. Catat pengiriman ke klien | PASS |
| 12. Pimpinan monitoring | PASS |
| 13. Super Admin audit log | PASS |

**Seluruh alur end-to-end: PASS**
