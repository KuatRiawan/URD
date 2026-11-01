# Audit Peran: INSPECTOR / AHLI_K3
## PT Upaya Riksa Daya

**Role name di database:** `AHLI_K3` (alias: `INSPECTOR`)
**Tanggal:** 2025-07-15

---

## 1. Halaman yang Dapat Diakses

| Halaman | Route | Status Akses |
|---|---|---|
| Tugas Saya (Dasbor Lapangan) | /app/dashboard | PASS |
| Form Pengujian Lapangan | /app/inspections | PASS |
| Kendala Lapangan | /app/issues | PASS |
| Objek Uji K3 | /app/objects | PASS |
| Riwayat Pekerjaan | /app/history | PASS |
| Pengaturan Akun | /app/settings | PASS |
| Notifikasi | /app/notifications | PASS |
| PO & Order (via Lainnya di mobile) | /app/orders | PASS |
| Jadwal & Agenda (via Lainnya) | /app/schedule | PASS |
| Dokumen LHPP (via Lainnya) | /app/lhpp | PASS |
| Berita Acara BAP (via Lainnya) | /app/bap | PASS |

**Halaman yang TIDAK dapat diakses (benar):**
- /app/users - ForbiddenPage
- /app/audit-logs - ForbiddenPage
- /app/suket - ForbiddenPage
- /app/reminders - ForbiddenPage
- /app/distributions - di router hanya untuk MARKETING/PIMPINAN/ADMIN_SISTEM

---

## 2. Navigasi Sidebar Desktop (Inspector)

| Item | Grup | Status |
|---|---|---|
| Tugas Saya | Tugas Utama | PASS |
| Form Pengujian Lapangan | Tugas Utama | PASS |
| Kendala Lapangan | Pelaksanaan | PASS |
| Objek Uji K3 | Pelaksanaan | PASS |
| Riwayat Pekerjaan | Arsip & Dokumen | PASS |
| Pengaturan Akun | Akun | PASS |

Jumlah menu dikurangi secara sengaja agar fokus pada alur lapangan.

## 3. Navigasi Bottom Bar Mobile (Inspector)

**Primary (4 item):** Tugas Saya, Pengujian, Kendala, Riwayat - PASS

**Drawer "Lainnya":**
- Pelaksanaan Lapangan: Objek Uji K3, PO & Order Riksa, Jadwal & Agenda
- Dokumen Teknis: Dokumen LHPP, Berita Acara (BAP)
- Akun & Notifikasi: Notifikasi, Pengaturan Akun & SKP

Status: PASS

---

## 4. Audit Dasbor Inspector (InspectorDashboardView)

| Fitur | Status | Catatan |
|---|---|---|
| Tab "Konfirmasi" (penugasan menunggu) | PASS | confirmationList dari assignedUnits |
| Tab "Hari Ini" (jadwal hari ini) | PASS | Klasifikasi berdasar tanggal scheduleDateStr |
| Tab "Tertunda" | PASS | Unit terjadwal melewati deadline tanpa selesai |
| Tab "Mendatang" | PASS | Unit dengan jadwal di masa depan |
| Tab "Selesai" | PASS | Unit dengan status terminal LHPP_FINAL, SELESAI, dll |
| Tombol Terima Penugasan | PASS | handleRespondAssignment decision='DITERIMA' |
| Tombol Tolak Penugasan | PASS | Modal RejectAssignmentModal dengan alasan |
| Kartu unit dengan info lengkap | PASS | InspectorUnitCard: nama, SN, klien, jadwal |
| Mode tampilan kartu/tabel | PASS | Toggle fieldViewMode CARDS/TABLE |
| Pencarian unit | PASS | Filter fieldSearch pada filteredUnitsForTab |
| Metrik ringkasan (InspectorMetricCards) | PASS | activeAssignments, draftInspections, dll |
| Polling 30 detik | PASS | setInterval di DashboardPage |
| Refresh saat tab aktif | PASS | visibilitychange dan focus handler |

---

## 5. Audit Form Inspeksi Lapangan

### Form Mulai Inspeksi (StartInspectionModal)

| Fitur | Status | Catatan |
|---|---|---|
| Pilih Order dari dropdown | PASS | Hanya order yang tersedia untuk inspector |
| Pilih Objek dari order terpilih | PASS | handleSelectOrder memuat order objects |
| Pilih Template Checklist | PASS | Dropdown template tervalidasi |
| Validasi field wajib | PASS | Error jika orderId/objectId/templateVersionId kosong |
| Loading saat submit | PASS | `submitting` state |
| Auto-buka lembar kerja setelah create | PASS | setActiveInspectionId(res.data.inspection.id) |
| Auto-buka dari URL parameter dashboard | PASS | useEffect baca qOrderId dan qObjectId |

### Lembar Kerja Inspeksi (InspectionDetailModal, 4 langkah)

| Fitur | Status | Catatan |
|---|---|---|
| **Step 1: Checklist K3** | | |
| Isi setiap butir checklist (OK/Tidak OK/NA) | PASS | StepChecklist - setiap item dapat diklik |
| Catatan per butir | PASS | Field input catatan per item |
| Simpan draf | PASS | PUT /inspections/:id/draft |
| **Step 2: Temuan & Foto** | | |
| Tambah temuan/foto lapangan | PASS | StepPhotosFindings |
| Upload foto bukti temuan | PASS | multipart/form-data upload |
| Daftar temuan yang sudah diinput | PASS | List dengan tombol hapus |
| **Step 3: Kesimpulan Teknis** | | |
| Pilih kesimpulan (MS/TMS/Bersyarat) | PASS | StepConclusion - radio/select |
| Catatan teknis bebas | PASS | Textarea |
| **Step 4: Tanda Tangan** | | |
| Signature pad inspector | PASS | StepSignatures - canvas signature pad |
| Tanda tangan klien | PASS | Signature pad kedua |
| Clear signature | PASS | Tombol hapus signature |
| Submit final hasil inspeksi | PASS | POST /inspections/:id/submit |
| Konfirmasi sebelum submit | PASS | useConfirm dialog |
| Loading saat submit | PASS | `submitting` state |

### LHPP (perspektif Inspector)

| Fitur | Status | Catatan |
|---|---|---|
| Isi narasi teknis draf LHPP | PASS | handleSaveDraft - hanya inspector |
| Upload foto dokumentasi LHPP | PASS | handleUploadPhoto |
| Kirim LHPP ke Marketing | PASS | handleSubmitReview - konfirmasi, authorize('INSPECTOR') di backend |
| Lihat status LHPP | PASS | Badge status di LhppTable |
| Revisi LHPP yang dikembalikan | PASS | LHPP status DIKEMBALIKAN muncul di work queue |
| Pratinjau PDF LHPP | PASS | handlePreviewPdf |

### BAP (perspektif Inspector)

| Fitur | Status | Catatan |
|---|---|---|
| Isi/edit draf BAP | PASS | canManage: ADMIN_SISTEM/AHLI_K3/INSPECTOR |
| Pilih scope items BAP | PASS | Dropdown dari scopeCatalog |
| Input tanda tangan Inspector | PASS | Signature pad di form BAP |
| Pratinjau PDF BAP | PASS | handlePreviewBapPdf |
| Lihat BAP yang sudah final | PASS | Badge status FINAL |

---

## 6. Audit Objek Uji K3 (perspektif Inspector)

| Fitur | Status | Catatan |
|---|---|---|
| Lihat daftar objek | PASS | Akses read untuk semua authenticated |
| Lihat QR code | PASS | ObjectQrModal |
| Lihat detail riwayat | PASS | ObjectDetailModal |
| TIDAK DAPAT tambah/edit objek | PASS by design | authorize ADMIN_SISTEM/ADMIN_KANTOR di backend |

---

## 7. Audit Pengaturan (perspektif Inspector)

| Fitur | Status | Catatan |
|---|---|---|
| Update profil | PASS | handleUpdateProfile |
| Ganti kata sandi | PASS | handleChangePassword |
| Tab Kredensial Ahli K3 | PASS | RoleSettingsTab menampilkan SKP inspector |
| Lihat daftar SKP | PASS | Data dari /auth/me |

---

## 8. Temuan Spesifik Role INSPECTOR

| ID | Severity | Deskripsi | Status |
|---|---|---|---|
| IN-01 | INFO | INSPECTOR tidak termasuk di router untuk /app/distributions - sesuai desain, distribusi dikelola Marketing | PASS by design |
| IN-02 | INFO | InspectionDetailModal auto-buka dari dashboard via URL params `?orderId=&objectId=` berfungsi dengan baik | PASS |
| IN-03 | INFO | Signature pad menggunakan canvas HTML5 - tidak ada library eksternal tambahan, konsisten | PASS |

---

## 9. Kesimpulan

Role INSPECTOR/AHLI_K3 memiliki akses yang terfokus pada alur kerja lapangan. Seluruh fitur utama lapangan (checklist, temuan, foto, tanda tangan, submit) berfungsi. Dasbor Inspector menampilkan unit yang ditugaskan dengan kategorisasi jelas. Tidak ada tombol mati yang ditemukan.
