# Checklist Regresi Manual
## PT Upaya Riksa Daya

**Tanggal:** 2025-07-15
**Tujuan:** Verifikasi bahwa semua perbaikan dari audit ini berfungsi dan tidak merusak fitur yang sudah ada.

---

## Cara Penggunaan

Beri tanda centang pada setiap item yang telah diverifikasi. Catat tanggal dan penguji pada kolom catatan.

Format: [ ] Belum diuji | [x] PASS | [F] FAIL

---

## Bagian 1: Perbaikan P0 - Modal Mobile

### BUG-001: Modal tidak lagi mengisi seluruh layar di mobile

**Perangkat:** Smartphone (atau DevTools Chrome, ukuran 390x844 iPhone 14)**

- [ ] Buka aplikasi dan login
- [ ] Klik "Keluar Sesi" di sidebar/bottom bar
- [ ] VERIFIKASI: Modal konfirmasi hanya setinggi kontennya (tidak ada ruang kosong besar)
- [ ] VERIFIKASI: Tombol "Batal" dan "Ya, Keluar" dekat dengan pesan konfirmasi
- [ ] VERIFIKASI: Handle bar horizontal muncul di atas modal
- [ ] Buka halaman Klien dan klik hapus klien
- [ ] VERIFIKASI: Modal hapus juga kompak di mobile
- [ ] Buka halaman Users dan klik nonaktifkan user
- [ ] VERIFIKASI: Modal konfirmasi nonaktifkan juga kompak
- [ ] Buka halaman Order dan coba finalisasi/ubah status
- [ ] VERIFIKASI: Modal konfirmasi PO juga kompak

---

## Bagian 2: Route Redirect

### BUG-002 & BUG-003: Route lama redirect dengan benar

- [ ] Akses URL `/app/scheduling` di browser
- [ ] VERIFIKASI: Dialihkan otomatis ke `/app/schedule`
- [ ] Akses URL `/app/audit-log` (tanpa 's')
- [ ] VERIFIKASI: Dialihkan otomatis ke `/app/audit-logs`

---

## Bagian 3: Dialog Logout Tone Danger

### BUG-004: Dialog logout menggunakan warna merah (danger)

- [ ] Login sebagai pengguna manapun
- [ ] Klik "Keluar Sesi" dari sidebar atau TopHeader
- [ ] VERIFIKASI: Tombol konfirmasi "Ya, Keluar" berwarna merah
- [ ] VERIFIKASI: Ikon di dalam modal adalah ikon trash/danger (bukan warning amber)

---

## Bagian 4: Dashboard Polling

### BUG-005: Polling dashboard setiap 30 detik (bukan 5 detik)

- [ ] Login dan buka DevTools Network tab
- [ ] Buka halaman Dashboard
- [ ] Amati request ke `/api/v1/dashboard/summary`
- [ ] VERIFIKASI: Request terjadi kira-kira setiap 30 detik
- [ ] VERIFIKASI: Tidak ada request berulang setiap 5 detik

---

## Bagian 5: Perbaikan BUG-007 - Dialog Hapus Foto LHPP

### BUG-007: Dialog hapus foto LHPP menggunakan tone danger

- [ ] Login sebagai Inspector (AHLI_K3)
- [ ] Buka halaman LHPP
- [ ] Pilih LHPP yang memiliki foto dokumentasi
- [ ] Klik tombol hapus foto
- [ ] VERIFIKASI: Dialog konfirmasi muncul dengan tombol konfirmasi berwarna MERAH (danger)
- [ ] VERIFIKASI: Tidak menggunakan warna default (hitam/slate)

---

## Bagian 6: Alur End-to-End Utama

### Alur Marketing

- [ ] Login sebagai MARKETING/ADMIN_KANTOR
- [ ] Buat PO baru dengan wizard 5 langkah sampai selesai
- [ ] VERIFIKASI: PO muncul di daftar dengan status ORDER_BARU
- [ ] Buka detail PO, atur jadwal inspeksi
- [ ] VERIFIKASI: Status berubah ke TERJADWAL
- [ ] Tugaskan Inspector ke PO
- [ ] VERIFIKASI: Status berubah ke DITUGASKAN

### Alur Inspector

- [ ] Login sebagai INSPECTOR/AHLI_K3
- [ ] Buka Dasbor - pastikan tab "Konfirmasi" muncul
- [ ] Terima penugasan
- [ ] Buka InspectionsPage - klik "Mulai Inspeksi Baru"
- [ ] Isi semua 4 langkah form inspeksi
- [ ] Submit hasil inspeksi
- [ ] VERIFIKASI: Status inspeksi berubah ke TERKIRIM
- [ ] Buka LhppPage - isi narasi teknis
- [ ] Kirim LHPP ke Marketing
- [ ] VERIFIKASI: Status LHPP berubah ke SIAP_PREVIEW

### Alur Finalisasi Marketing

- [ ] Login kembali sebagai MARKETING
- [ ] Buka LhppPage - LHPP status SIAP_PREVIEW
- [ ] Pratinjau PDF LHPP
- [ ] Klik Finalisasi
- [ ] VERIFIKASI: Modal konfirmasi muncul dengan warna hijau (success)
- [ ] Konfirmasi finalisasi
- [ ] VERIFIKASI: LHPP status berubah ke TERBIT
- [ ] VERIFIKASI: BAP otomatis dibuat dengan nomor BAP

---

## Bagian 7: Permission Boundaries

### PIMPINAN hanya read-only

- [ ] Login sebagai PIMPINAN
- [ ] Buka halaman Klien - VERIFIKASI: tombol "Tambah Klien" tidak ada
- [ ] Buka halaman Distribusi - VERIFIKASI: tombol "Perbarui Status" tidak ada
- [ ] Coba akses `/app/users` via URL langsung
- [ ] VERIFIKASI: Muncul halaman ForbiddenPage (403)

### INSPECTOR tidak dapat mengelola distribusi

- [ ] Login sebagai INSPECTOR
- [ ] Coba akses `/app/distributions` via URL langsung
- [ ] VERIFIKASI: Muncul ForbiddenPage (karena route RequireRole membatasi)

---

## Bagian 8: Responsivitas Mobile

- [ ] Buka sidebar desktop - VERIFIKASI: muncul pada layar >= lg
- [ ] Di mobile - VERIFIKASI: bottom navigation tampil
- [ ] Klik "Lainnya" di bottom bar - VERIFIKASI: Drawer muncul dengan semua menu
- [ ] Navigasi ke halaman berbeda dari drawer - VERIFIKASI: drawer menutup otomatis
- [ ] Periksa tabel di halaman Order/Klien/Objek di mobile
- [ ] VERIFIKASI: Tabel hanya muncul pada sm:, mobile menampilkan kartu
- [ ] Safe area inset bottom pada notch iPhone diperhatikan

---

## Bagian 9: State Feedback

- [ ] Setiap form submit yang berhasil menampilkan pesan sukses (Notice hijau)
- [ ] Setiap fetch gagal menampilkan ErrorBanner dengan tombol retry
- [ ] Setiap halaman kosong menampilkan EmptyState (bukan blank)
- [ ] Setiap proses submit menampilkan tombol dalam state loading (disabled + spinner text)

---

## Hasil Pengujian

**Penguji:**
**Tanggal:**
**Perangkat:**
**Browser:**

| Bagian | Jumlah Item | PASS | FAIL | Catatan |
|---|---|---|---|---|
| 1. Modal Mobile | 10 | | | |
| 2. Route Redirect | 4 | | | |
| 3. Dialog Logout | 3 | | | |
| 4. Dashboard Polling | 4 | | | |
| 5. Dialog Hapus Foto | 3 | | | |
| 6. Alur End-to-End | 15 | | | |
| 7. Permission | 6 | | | |
| 8. Responsivitas | 8 | | | |
| 9. State Feedback | 4 | | | |
| **Total** | **57** | | | |
