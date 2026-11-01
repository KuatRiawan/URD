# Audit Peran: PIMPINAN / MANAGER
## PT Upaya Riksa Daya

**Role name di database:** `PIMPINAN` (alias: `MANAGER`)
**Tanggal:** 2025-07-15

---

## 1. Halaman yang Dapat Diakses

| Halaman | Route | Status Akses |
|---|---|---|
| Dasbor Eksekutif | /app/dashboard | PASS |
| Monitoring PO & Status | /app/orders | PASS |
| Monitoring Jadwal Tim | /app/schedule | PASS |
| Kendala Operasional | /app/issues | PASS |
| Objek Uji K3 | /app/objects | PASS |
| Data Klien | /app/clients | PASS |
| Dokumen LHPP & BAP | /app/lhpp | PASS |
| Berita Acara (BAP) | /app/bap | PASS |
| Registri Suket K3 | /app/suket | PASS |
| Pengingat Masa Berlaku | /app/reminders | PASS |
| Distribusi Dokumen | /app/distributions | PASS |
| Log Audit Operasional | /app/audit-logs | PASS |
| Pengaturan Akun | /app/settings | PASS |
| Notifikasi | /app/notifications | PASS |
| Riwayat Pengujian | /app/history | PASS |

**Halaman yang TIDAK dapat diakses (benar):**
- /app/users - ForbiddenPage
- /app/inspections - akses ada tapi tidak masuk menu Pimpinan

---

## 2. Navigasi Sidebar Desktop (Pimpinan)

| Item | Grup | Status |
|---|---|---|
| Dasbor Eksekutif | Eksekutif | PASS |
| Monitoring PO & Status | Monitoring Operasional | PASS |
| Monitoring Jadwal Tim | Monitoring Operasional | PASS |
| Objek Uji K3 | Monitoring Operasional | PASS |
| Data Klien | Monitoring Operasional | PASS |
| Kendala Operasional | Pelaksanaan | PASS |
| Dokumen LHPP & BAP | Dokumen & Kepatuhan | PASS |
| Berita Acara (BAP) | Dokumen & Kepatuhan | PASS |
| Registri Suket K3 | Dokumen & Kepatuhan | PASS |
| Pengingat Masa Berlaku | Dokumen & Kepatuhan | PASS |
| Distribusi Dokumen | Dokumen & Kepatuhan | PASS |
| Log Audit Operasional | Jejak Audit | PASS |
| Pengaturan Akun | Akun | PASS |

## 3. Navigasi Bottom Bar Mobile (Pimpinan)

**Primary (4 item):** Dasbor, Monitoring PO, Jadwal Tim, Dokumen - PASS

**Drawer "Lainnya" (3 kelompok):**
- Monitoring Operasional: Objek Uji K3, Data Klien, Kendala Operasional
- Dokumen & Kepatuhan: BAP, Suket K3, Pengingat, Distribusi, Riwayat
- Pengawasan & Akun: Log Audit, Notifikasi, Pengaturan

Status: PASS

---

## 4. Audit Dasbor Eksekutif (ManagementDashboardView)

| Fitur | Status | Catatan |
|---|---|---|
| Kartu metrik ringkasan | PASS | Total order, order aktif, selesai, klien, objek |
| Grafik tren bulanan (SplineAreaChart) | PASS | Data 6 bulan dari backend |
| Peta regional (IndonesiaMapWidget) | PASS | Distribusi order per wilayah |
| Distribusi kategori alat K3 | PASS | categoryDistribution dari backend |
| Beban kerja Inspector | PASS | inspectorWorkload dari backend |
| Order terbaru | PASS | recentOrders dari backend |
| Aktivitas terbaru | PASS | recentActivities dari audit_logs |
| Filter periode (7H/30H/90H/1T) | PASS | setPeriod memperbarui tampilan |
| Tombol refresh | PASS | loadSummary(true) |
| Work Queue widget | PASS | WorkQueueWidget dari /dashboard/work-queue |
| Polling 30 detik otomatis | PASS | setInterval di DashboardPage |
| Semua angka dari database nyata | PASS | Tidak ada angka fiktif |
| Unduh CSV rekap | PASS | /dashboard/export-recap.csv - PIMPINAN termasuk |

---

## 5. Batasan Read-Only Pimpinan (Diverifikasi)

Middleware `authorize.js` memblokir semua mutasi (POST/PUT/PATCH/DELETE) untuk role PIMPINAN/MANAGER secara global, kecuali endpoint yang tidak memerlukan authorize.

| Aksi | Status |
|---|---|
| Lihat data (GET) | PASS - diizinkan |
| Buat/Edit/Hapus data | PASS - diblokir 403 MANAGER_READ_ONLY |
| Distribusi Dokumen | PASS - UI menampilkan isReadOnly flag, tombol update disembunyikan |
| LHPP detail | PASS - tombol finalisasi tidak muncul untuk Pimpinan |
| Suket K3 | PASS - read-only via router.use(authenticate, authorize(...)) |
| Pengingat | PASS - read-only via router level authorize |

---

## 6. Audit Log Audit (perspektif Pimpinan)

| Fitur | Status | Catatan |
|---|---|---|
| Lihat semua log | PASS | Akses diizinkan via router.use(authenticate, authorize('ADMIN_SISTEM', 'PIMPINAN')) |
| Filter berdasarkan aksi | PASS | Input pencarian actionFilter |
| Filter berdasarkan modul | PASS | Select entityFilter |
| Loading, Empty, Error state | PASS | Semua tiga state |

---

## 7. Audit Validasi Template Checklist (perspektif Pimpinan)

| Fitur | Status | Catatan |
|---|---|---|
| Lihat Master Template | PASS | Tab Templates di InspectionsPage |
| Tombol Validasi Template | PASS | canValidateTemplate: ADMIN_SISTEM/PIMPINAN |
| POST /inspections/templates/:id/validate | PASS | authorize('ADMIN_SISTEM', 'PIMPINAN') di backend |

---

## 8. Temuan Spesifik Role PIMPINAN

| ID | Severity | Deskripsi | Status |
|---|---|---|---|
| PM-01 | INFO | PIMPINAN bisa akses /app/inspections via URL langsung (tidak ada di sidebar) - diizinkan router RequireRole dengan ['AHLI_K3', 'PIMPINAN'] | PASS by design |
| PM-02 | INFO | Distribusi Dokumen - isReadOnly flag aktif untuk PIMPINAN/MANAGER, tombol "Perbarui Status" disembunyikan | PASS |
| PM-03 | INFO | Backend authorize blokir semua mutasi PIMPINAN secara global di middleware | PASS |

---

## 9. Kesimpulan

Role PIMPINAN/MANAGER memiliki akses monitoring lengkap ke semua data operasional dalam mode read-only. Dasbor eksekutif menampilkan ringkasan berbasis data nyata. Pembatasan mutasi diterapkan di dua lapisan: middleware backend dan UI frontend. Tidak ada celah aksi tulis yang ditemukan untuk role ini.
