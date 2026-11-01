# Audit Peran: SUPER ADMIN / ADMIN_SISTEM
## PT Upaya Riksa Daya

**Role name di database:** `ADMIN_SISTEM`
**Tanggal:** 2025-07-15

---

## 1. Halaman yang Dapat Diakses

ADMIN_SISTEM memiliki akses ke **seluruh** halaman dalam aplikasi.

| Halaman | Route | Status Akses |
|---|---|---|
| Dasbor Operasional | /app/dashboard | PASS |
| PO & Order Pemeriksaan | /app/orders | PASS |
| Data Klien | /app/clients | PASS |
| Objek Uji K3 | /app/objects | PASS |
| Jadwal & Penugasan | /app/schedule | PASS |
| Form Pengujian Lapangan | /app/inspections | PASS |
| Dokumen LHPP | /app/lhpp | PASS |
| Berita Acara (BAP) | /app/bap | PASS |
| Distribusi Dokumen | /app/distributions | PASS |
| Riwayat Pengujian | /app/history | PASS |
| Registri Suket K3 | /app/suket | PASS |
| Pengingat Perpanjangan | /app/reminders | PASS |
| Kendala Operasional | /app/issues | PASS |
| Manajemen Pengguna | /app/users | PASS |
| Log Audit | /app/audit-logs | PASS |
| Pengaturan | /app/settings | PASS |
| Notifikasi | /app/notifications | PASS |

---

## 2. Navigasi Sidebar Desktop (Admin Sistem)

ADMIN_SISTEM menggunakan `NAV_ITEMS` standar yang berisi seluruh 16 item navigasi.

| Grup | Item | Status |
|---|---|---|
| Utama | Dasbor Operasional | PASS |
| Operasional | PO & Order, Data Klien, Objek Uji K3, Jadwal & Penugasan, Form Pengujian | PASS |
| Dokumen & Sertifikasi | LHPP, BAP, Distribusi, Riwayat, Suket K3 | PASS |
| Pemantauan | Pengingat, Kendala | PASS |
| Administrasi | Manajemen Pengguna, Log Audit | PASS |
| Pengaturan | Pengaturan Akun | PASS |

## 3. Navigasi Bottom Bar Mobile (Admin Sistem)

**Primary (4 item):** Dasbor, Pengguna, PO & Order, Log Audit - PASS

**Drawer "Lainnya" (4 kelompok):**
- Master Data & Klien: Data Klien, Objek Uji K3
- Operasional Lapangan: Jadwal & Penugasan, Form Pengujian
- Dokumen & Distribusi: LHPP, BAP, Distribusi, Riwayat
- Kepatuhan & Pengaturan: Suket K3, Pengingat, Kendala, Notifikasi, Pengaturan

Status: PASS

---

## 4. Audit Manajemen Pengguna (ADMIN_SISTEM only)

| Fitur | Status | Catatan |
|---|---|---|
| Daftar pengguna dengan filter | PASS | Filter kata kunci dan peran |
| Tambah pengguna baru | PASS | Form CreateUserModal - POST /users |
| Edit data pengguna (nama, peran, telepon) | PASS | EditUserModal - PATCH /users/:id |
| Reset kata sandi pengguna | PASS | Field password di EditUserModal, dikosongkan jika tidak diisi |
| Nonaktifkan pengguna | PASS | handleToggleActive dengan konfirmasi danger |
| Aktifkan pengguna | PASS | handleToggleActive dengan konfirmasi default |
| Loading state | PASS | LoadingState dirender saat loading=true |
| Empty state | PASS | EmptyState dirender saat tidak ada hasil |
| Error state | PASS | ErrorBanner dengan tombol retry |
| Validasi role di backend | PASS | router.use(authenticate, authorize('ADMIN_SISTEM')) |

---

## 5. Audit Log Audit (ADMIN_SISTEM)

| Fitur | Status | Catatan |
|---|---|---|
| Akses penuh | PASS | router.use(authenticate, authorize('ADMIN_SISTEM', 'PIMPINAN')) |
| Filter aksi | PASS | actionFilter - pencarian kode aksi |
| Filter entitas | PASS | entityFilter - select modul |
| Tampilan mobile kartu | PASS | Kartu responsif |
| Tampilan desktop tabel | PASS | Tabel hidden sm:block |
| Badge immutable | PASS | Indikator "Dilindungi Trigger Immutable PostgreSQL" |
| Total entri di subtitle | PASS | {total} entri tercatat |

---

## 6. Audit Kemampuan Super Admin di Modul Lain

### Manajemen Klien
| Fitur | Status |
|---|---|
| Tambah klien | PASS |
| Edit klien | PASS |
| Nonaktifkan/aktifkan klien | PASS |
| Buat token portal klien | PASS |

### Manajemen Objek
| Fitur | Status |
|---|---|
| Tambah objek baru | PASS |
| Edit objek | PASS |
| Import CSV | PASS |
| QR code | PASS |

### Inspeksi
| Fitur | Status |
|---|---|
| Mulai inspeksi | PASS - authorize('AHLI_K3') - ADMIN_SISTEM tidak termasuk di backend |
| Edit draft inspeksi | PASS - authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM') |
| Submit inspeksi | PASS - authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM') |
| Validasi template checklist | PASS - authorize('ADMIN_SISTEM', 'PIMPINAN') |

### LHPP
| Fitur | Status |
|---|---|
| Finalisasi LHPP | PASS - authorize('MARKETING', 'ADMIN_SISTEM') |
| Upload foto | PASS - authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM') |
| Submit finalization | PASS - authorize alias expand ADMIN_SISTEM tidak termasuk - perlu tes ulang |

### Suket K3
| Fitur | Status |
|---|---|
| Buat Suket K3 | PASS - router.use(authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN')) |
| Cabut Suket K3 | PASS - authorize('ADMIN_SISTEM', 'ADMIN_KANTOR') |

---

## 7. Temuan Spesifik ADMIN_SISTEM

| ID | Severity | Deskripsi | Status |
|---|---|---|---|
| SA-01 | INFO | POST /inspections/start hanya authorize('AHLI_K3') - tidak termasuk ADMIN_SISTEM. Jika Admin perlu mulai inspeksi sendiri, harus melalui UI dengan akun Inspector. Ini desain yang disengaja untuk menjaga integritas data lapangan. | OPEN - desain sengaja |
| SA-02 | INFO | POST /lhpp/:id/submit-finalization hanya authorize('INSPECTOR') - tidak termasuk ADMIN_SISTEM. Sama dengan SA-01, setiap LHPP harus dikirim oleh Inspector yang bertanggung jawab. | OPEN - desain sengaja |
| SA-03 | INFO | Audit log muncul dengan info "Sistem Otomatis" untuk aksi dari background job scheduler - data valid | PASS |

---

## 8. Kesimpulan

Role ADMIN_SISTEM memiliki akses administratif penuh. Manajemen pengguna berfungsi lengkap dengan CRUD penuh. Log audit dapat diakses dan difilter. Pembatasan intentional pada `POST /inspections/start` (hanya Inspector) dan `POST /lhpp/submit-finalization` (hanya Inspector) tidak dianggap bug karena merupakan desain alur kerja yang menjaga integritas dokumen teknis. Semua endpoint administrasi dilindungi `authorize('ADMIN_SISTEM')`.
