# Audit Peran: MARKETING / ADMIN_KANTOR
## PT Upaya Riksa Daya

**Role name di database:** `ADMIN_KANTOR` (alias: `MARKETING`)
**Tanggal:** 2025-07-15

---

## 1. Halaman yang Dapat Diakses

| Halaman | Route | Status Akses |
|---|---|---|
| Dasbor Operasional | /app/dashboard | PASS |
| PO & Order Pemeriksaan | /app/orders | PASS |
| Data Klien | /app/clients | PASS |
| Objek Uji K3 | /app/objects | PASS |
| Jadwal & Penugasan | /app/schedule | PASS |
| Kendala Operasional | /app/issues | PASS |
| Penerbitan Dokumen LHPP | /app/lhpp | PASS |
| Berita Acara (BAP) | /app/bap | PASS |
| Distribusi Dokumen | /app/distributions | PASS |
| Registri Suket K3 | /app/suket | PASS |
| Pengingat Perpanjangan | /app/reminders | PASS |
| Riwayat Pengujian | /app/history | PASS |
| Pengaturan Akun | /app/settings | PASS |
| Notifikasi | /app/notifications | PASS |

**Halaman yang TIDAK dapat diakses (benar):**
- /app/users - dialihkan ke ForbiddenPage
- /app/audit-logs - dialihkan ke ForbiddenPage

---

## 2. Navigasi Sidebar Desktop

| Item | Grup | Status |
|---|---|---|
| Dasbor Operasional | Utama | PASS |
| PO & Order Pemeriksaan | Order & Klien | PASS |
| Data Klien | Order & Klien | PASS |
| Objek Uji K3 | Order & Klien | PASS |
| Jadwal & Penugasan | Pelaksanaan | PASS |
| Kendala Operasional | Pelaksanaan | PASS |
| Penerbitan Dokumen (LHPP) | Penerbitan Dokumen | PASS |
| Berita Acara (BAP) | Penerbitan Dokumen | PASS |
| Distribusi Dokumen | Penerbitan Dokumen | PASS |
| Registri Suket K3 | Pemantauan | PASS |
| Pengingat Perpanjangan | Pemantauan | PASS |
| Riwayat Pengujian | Pemantauan | PASS |
| Pengaturan Akun | Akun | PASS |

## 3. Navigasi Bottom Bar Mobile

**Primary (4 item):** Dasbor, Purchase Order, Jadwal, Dokumen - PASS

**Drawer "Lainnya" (4 kelompok):**
- Data Klien & Alat K3: Klien, Objek Uji
- Dokumen & Distribusi: BAP, Distribusi, Riwayat
- Pemantauan & Kepatuhan: Kendala, Suket K3, Pengingat
- Akun & Notifikasi: Notifikasi, Pengaturan

Status: PASS

---

## 4. Audit Tombol & Fitur Utama

### Halaman PO & Order

| Fitur | Status | Catatan |
|---|---|---|
| Tombol "Buat PO / Order Baru" | PASS | Hanya tampil untuk MARKETING/ADMIN_KANTOR/ADMIN_SISTEM |
| Wizard 5 Langkah Buat PO | PASS | Pilih klien, identitas PO, unit, jadwal, review |
| Tombol "Impor Unit CSV" | PASS | Tersedia untuk role canManage |
| Tabel PO dengan klik detail | PASS | openOrderDetail mengisi detailData |
| Filter pencarian PO | PASS | Filter berdasarkan keyword dan status |
| Loading state saat fetch | PASS | LoadingState dirender saat loading=true |
| Empty state saat tidak ada PO | PASS | EmptyState dirender saat orders.length===0 |
| Error state saat gagal fetch | PASS | ErrorBanner dirender dengan tombol retry |
| Tombol download Surat Tugas PDF | PASS | handleDownloadAssignmentPdf |
| Tombol download Batch BAP PDF | PASS | handleDownloadBatchBapPdf |
| Jadwalkan order (set jadwal) | PASS | handleSaveSchedule - hanya untuk canManage |
| Tugaskan Inspector ke order | PASS | handleAssignInspectors - hanya untuk canManage |
| Ubah status order | PASS | handleStatusChange - hanya untuk canManage |
| Konfirmasi modal sebelum hapus/ubah | PASS | useConfirm digunakan |
| Sinkronisasi realtime setiap 6 detik | PASS | setInterval di useEffect |
| Auto-buka PO dari parameter URL | PASS | Dipakai dari notifikasi |
| Prevent double submission | PASS | State `submitting` dikunci saat proses |

### Halaman Data Klien

| Fitur | Status | Catatan |
|---|---|---|
| Daftar klien dengan filter | PASS | Filter kata kunci dan status aktif/nonaktif |
| Tambah klien baru | PASS | Hanya ADMIN_SISTEM/ADMIN_KANTOR |
| Edit data klien | PASS | Hanya ADMIN_SISTEM/ADMIN_KANTOR |
| Nonaktifkan klien | PASS | Modal konfirmasi danger tone |
| Aktifkan klien | PASS | Modal konfirmasi default tone |
| Detail klien (lihat lokasi, kontak) | PASS | Modal detail lengkap |
| Loading, Empty, Error state | PASS | Semua tiga state diimplementasi |

### Halaman Objek Uji K3

| Fitur | Status | Catatan |
|---|---|---|
| Daftar objek dengan filter | PASS | Filter kata kunci, kategori, status |
| Tambah objek baru | PASS | Hanya ADMIN_SISTEM/ADMIN_KANTOR |
| Edit data objek | PASS | Hanya ADMIN_SISTEM/ADMIN_KANTOR |
| QR Code objek | PASS | Modal QR untuk cetak/unduh |
| Detail riwayat inspeksi objek | PASS | Panel history per unit |
| Import CSV multi-unit | PASS | Modal ObjectCsvModal |
| Loading, Empty, Error state | PASS | Semua tiga state diimplementasi |

### Halaman Jadwal & Penugasan

| Fitur | Status | Catatan |
|---|---|---|
| Tampilkan agenda jadwal | PASS | ScheduleAgendaSection |
| Matriks kompetensi Inspector | PASS | InspectorCompetencySection |
| Tambah SKP/Kompetensi Ahli K3 | PASS | Hanya ADMIN_SISTEM/ADMIN_KANTOR (canManage) |
| Hapus kompetensi | PASS | Konfirmasi danger, hanya canManage |
| Loading state | PASS | LoadingState dirender |
| Error state dengan retry | PASS | ErrorBanner dengan onRetry |

### Halaman LHPP (Penerbitan Dokumen)

| Fitur | Status | Catatan |
|---|---|---|
| Daftar LHPP dengan filter status | PASS | Filter dropdown status LHPP |
| Buka detail LHPP | PASS | openDetail memuat data dari API |
| Pratinjau PDF LHPP | PASS | handlePreviewPdf |
| Unduh PDF LHPP | PASS | handleDownloadPdf dengan blob |
| Finalisasi LHPP | PASS | handleFinalizeLhpp - hanya canManage |
| Catat pengiriman dokumen ke klien | PASS | handleRecordDelivery - hanya canDeliver |
| Upload foto dokumentasi | PASS | handleUploadPhoto multipart/form-data |
| Hapus foto dokumentasi | PASS | handleDeletePhoto dengan konfirmasi |
| Loading, Empty, Error state | PASS | Semua tiga state diimplementasi |
| Pratinjau BAP dari LHPP | PASS | handlePreviewBapPdf |

### Halaman BAP

| Fitur | Status | Catatan |
|---|---|---|
| Daftar BAP dengan filter & search | PASS | Filter status, filter pencarian |
| Detail BAP | PASS | Muat detail via API |
| Finalisasi BAP | PASS | canFinalize: ADMIN_SISTEM/ADMIN_KANTOR/MARKETING |
| Pratinjau PDF BAP | PASS | Modal PDF preview |
| Unduh PDF BAP | PASS | Blob download |
| Loading, Empty, Error state | PASS | Semua tiga state |

### Halaman Distribusi Dokumen

| Fitur | Status | Catatan |
|---|---|---|
| Kartu ringkasan distribusi | PASS | DistributionSummaryCards |
| Tabel distribusi dengan filter | PASS | Filter target (klien/Disnaker) dan status |
| Update status distribusi | PASS | Modal UpdateDistributionModal - hanya isMarketingOrAdmin |
| PIMPINAN hanya read-only | PASS | isReadOnly flag, modal tidak memunculkan aksi edit |
| Refresh manual | PASS | Tombol ArrowClockwise memanggil loadData(true) |
| Loading, Empty, Error state | PASS | Semua tiga state diimplementasi |

### Halaman Suket K3

| Fitur | Status | Catatan |
|---|---|---|
| Daftar Suket K3 | PASS | Filter status |
| Buat Suket K3 baru | PASS | Hanya ADMIN_SISTEM/ADMIN_KANTOR (from router) |
| Terbitkan Suket K3 | PASS | Modal konfirmasi |
| Cabut Suket K3 | PASS | Modal konfirmasi danger |
| Loading, Empty, Error state | PASS | Semua tiga state |

### Halaman Pengingat Perpanjangan

| Fitur | Status | Catatan |
|---|---|---|
| Bagian unit K3 mendekati kedaluwarsa | PASS | ExpiringUnitsSection |
| Bagian kompetensi Inspector | PASS | CompetencyRemindersSection |
| Bagian pengiriman surat ke klien | PASS | ClientDispatchSection |
| Bagian unit tanpa masa berlaku | PASS | MissingValiditySection |
| Tombol dispatch e-mail pengingat | PASS | handleRunDispatch - hanya ADMIN_KANTOR |
| Validitas modal per unit | PASS | UnitValidityModal |

### Halaman Riwayat Pengujian

| Fitur | Status | Catatan |
|---|---|---|
| Daftar riwayat dengan filter | PASS | Filter klien, kategori, pencarian |
| Detail riwayat | PASS | HistoryDetailModal |
| Unduh PDF per unit | PASS | downloadPdf mengambil blob |
| Loading, Empty, Error state | PASS | Semua tiga state |

### Pengaturan Akun

| Fitur | Status | Catatan |
|---|---|---|
| Update profil (nama, telepon) | PASS | handleUpdateProfile ke /auth/profile |
| Ganti kata sandi | PASS | handleChangePassword ke /auth/password |
| Validasi client-side kata sandi | PASS | Cek konfirmasi dan minimal 8 karakter |
| Tab tampilan & tema | PASS | AppearanceTab dengan toggle dark/light |
| Tab konfigurasi peran | PASS | RoleSettingsTab adaptif per peran |

---

## 5. Temuan Spesifik Role MARKETING

| ID | Severity | Deskripsi | Status |
|---|---|---|---|
| MK-01 | INFO | Halaman `Inspeksi` tidak muncul di sidebar Marketing (desain sengaja) - INSPECTOR yang isi form | PASS by design |
| MK-02 | INFO | `canFinalize` BAP: ADMIN_SISTEM/ADMIN_KANTOR/MARKETING - konsisten | PASS |
| MK-03 | INFO | `submit-finalization` LHPP oleh Inspector menggunakan `authorize('INSPECTOR')` - backend expand AHLI_K3 otomatis via alias | PASS |

---

## 6. Kesimpulan

Role MARKETING/ADMIN_KANTOR memiliki akses lengkap ke seluruh fitur operasional. Semua tombol utama berfungsi, semua form memiliki loading state, error state, dan empty state. Tidak ada tombol mati (dead button) yang ditemukan.
