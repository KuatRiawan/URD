# Laporan Bug - Audit Komprehensif
## PT Upaya Riksa Daya

**Tanggal:** 2025-07-15

---

## Format Laporan

Setiap entri menggunakan format:
- **ID:** Kode unik bug
- **Severity:** CRITICAL / HIGH / MEDIUM / LOW / INFO
- **Lokasi:** File dan komponen terkait
- **Deskripsi:** Penjelasan masalah
- **Steps to Reproduce:** Langkah reproduksi
- **Status:** FIXED / OPEN / NOT A BUG (desain sengaja)

---

## Bug yang Sudah FIXED (dari sesi sebelumnya)

### BUG-001
- **ID:** BUG-001
- **Severity:** HIGH
- **Lokasi:** `frontend/src/components/ui/Modal.jsx`
- **Deskripsi:** Modal di mobile memiliki tinggi hampir seluruh layar (`h-[90dvh]`) terlepas dari ukuran konten. Modal konfirmasi sederhana (logout, hapus) memiliki ruang kosong berlebihan karena modal memaksa tinggi penuh.
- **Steps to Reproduce:** Buka aplikasi di mobile (atau DevTools mobile). Klik "Keluar Sesi". Modal logout mengisi hampir seluruh layar meski konten hanya 4-5 baris.
- **Perbaikan:** Ubah pendekatan dari fixed height ke `max-h-[92dvh]` dengan layout flex column, konten scroll otomatis. Modal menyesuaikan tinggi berdasarkan isi.
- **Status:** FIXED

### BUG-002
- **ID:** BUG-002
- **Severity:** LOW
- **Lokasi:** `frontend/src/app/router.jsx`
- **Deskripsi:** Route `/app/scheduling` duplikat dengan `/app/schedule` (route lama tidak dihapus).
- **Status:** FIXED - Route `/app/scheduling` sekarang redirect ke `/app/schedule`.

### BUG-003
- **ID:** BUG-003
- **Severity:** LOW
- **Lokasi:** `frontend/src/app/router.jsx`
- **Deskripsi:** Route `/app/audit-log` (tanpa 's') dapat menyebabkan kebingungan.
- **Status:** FIXED - Route `/app/audit-log` sekarang redirect ke `/app/audit-logs`.

### BUG-004
- **ID:** BUG-004
- **Severity:** LOW
- **Lokasi:** `frontend/src/components/layout/AppLayout.jsx`
- **Deskripsi:** Dialog konfirmasi logout menggunakan tone `warning` (amber) yang secara semantik kurang tepat untuk aksi menutup sesi.
- **Status:** FIXED - Diubah ke tone `danger`.

### BUG-005
- **ID:** BUG-005
- **Severity:** LOW
- **Lokasi:** `frontend/src/features/dashboard/DashboardPage.jsx`
- **Deskripsi:** Dashboard polling interval 5 detik terlalu agresif untuk produksi.
- **Status:** FIXED - Diubah ke 30 detik.

---

## Bug OPEN yang Ditemukan dalam Audit Ini

### BUG-006
- **ID:** BUG-006
- **Severity:** LOW
- **Lokasi:** `frontend/src/components/layout/navConfig.js` - NAV_ITEMS
- **Deskripsi:** Ikon `ClipboardText` dari `@phosphor-icons/react` digunakan dua kali dalam daftar menu ADMIN_SISTEM: untuk "PO & Order Pemeriksaan" dan "Berita Acara (BAP)". Ini bukan bug fungsional tetapi membingungkan secara visual.
- **Steps to Reproduce:** Login sebagai ADMIN_SISTEM. Perhatikan sidebar: kedua menu "PO & Order" dan "Berita Acara (BAP)" menggunakan ikon yang identik.
- **Status:** OPEN - Pertimbangkan mengganti ikon BAP ke ikon yang lebih spesifik (contoh: `Signature`, `FileBadge`, atau `Newspaper`).

### BUG-007
- **ID:** BUG-007
- **Severity:** LOW
- **Lokasi:** `frontend/src/features/lhpp/LhppPage.jsx` baris `handleDeletePhoto`
- **Deskripsi:** Properti `danger: true` digunakan pada `useConfirm` tetapi API `useConfirm` menggunakan `tone: 'danger'`. Properti `danger` tidak dikenali sehingga dialog muncul dengan tone default.
- **Steps to Reproduce:** Login sebagai Inspector. Buka LHPP detail. Upload foto. Klik hapus foto. Dialog konfirmasi muncul tanpa warna merah (tone default, bukan danger).
- **Status:** OPEN

### BUG-008
- **ID:** BUG-008
- **Severity:** INFO
- **Lokasi:** `backend/src/modules/inspections/routes.js`
- **Deskripsi:** `POST /inspections/start` menggunakan `authorize('AHLI_K3')` yang via alias expand ke AHLI_K3+INSPECTOR, tetapi tidak termasuk ADMIN_SISTEM. Jika skenario pengujian/demo memerlukan admin memulai inspeksi langsung, ini perlu diubah.
- **Steps to Reproduce:** Login sebagai ADMIN_SISTEM. Buka InspectionsPage. Klik "Mulai Inspeksi Baru". Isi semua field dan submit. Backend mengembalikan 403.
- **Status:** OPEN - Disengaja sesuai desain alur kerja. Tidak dianggap bug kecuali ada kebutuhan admin untuk bypass.

### BUG-009
- **ID:** BUG-009
- **Severity:** INFO
- **Lokasi:** `frontend/src/features/orders/OrdersPage.jsx`
- **Deskripsi:** Polling interval sinkronisasi daftar PO adalah 6 detik (berbeda dari dashboard 30 detik). Untuk halaman dengan data yang sering berubah ini mungkin disengaja, tetapi bisa memberikan beban ekstra ke server.
- **Steps to Reproduce:** Buka tab Network di DevTools saat di halaman PO. Amati request ke /orders setiap 6 detik.
- **Status:** OPEN - Pertimbangkan menaikkan ke 15-30 detik jika beban server menjadi masalah.

### BUG-010
- **ID:** BUG-010
- **Severity:** LOW
- **Lokasi:** `frontend/src/features/audit-log/AuditLogPage.jsx`
- **Deskripsi:** Field pencarian memiliki placeholder yang sangat panjang yang terpotong di layar kecil. Input tidak memiliki label `<label>` yang terkait (hanya placeholder).
- **Steps to Reproduce:** Buka AuditLogPage di mobile. Perhatikan input pencarian aksi.
- **Status:** OPEN - Aksesibilitas: tambahkan `<label>` tersembunyi atau `aria-label` yang lebih deskriptif.

---

## Bukan Bug (Desain Sengaja)

### NOT-A-BUG-01
- **ID:** NBA-01
- **Lokasi:** `backend/src/modules/inspections/routes.js`
- **Deskripsi:** ADMIN_SISTEM tidak dapat mulai inspeksi (`POST /start`). Ini disengaja agar setiap form inspeksi selalu dimiliki oleh Inspector yang bertanggung jawab secara profesional.
- **Status:** NOT A BUG

### NOT-A-BUG-02
- **ID:** NBA-02
- **Lokasi:** `backend/src/modules/lhpp/routes.js`
- **Deskripsi:** ADMIN_SISTEM tidak termasuk dalam `authorize` untuk `POST /lhpp/:id/submit-finalization`. Alias middleware mengexpand INSPECTOR ke AHLI_K3 sehingga keduanya dapat submit. ADMIN_SISTEM tidak bisa karena kirim LHPP harus dilakukan Inspector yang memeriksa.
- **Status:** NOT A BUG

### NOT-A-BUG-03
- **ID:** NBA-03
- **Lokasi:** `frontend/src/app/router.jsx` - /app/distributions route
- **Deskripsi:** Route distributions mengizinkan MARKETING (alias ADMIN_KANTOR) tapi tidak termasuk INSPECTOR/AHLI_K3. Inspector tidak perlu mengelola distribusi dokumen.
- **Status:** NOT A BUG

### NOT-A-BUG-04
- **ID:** NBA-04
- **Lokasi:** `backend/src/modules/verify/routes.js`
- **Deskripsi:** `GET /verify/:code` adalah endpoint publik tanpa autentikasi. Ini disengaja agar QR code di dokumen resmi dapat diverifikasi oleh siapa saja (termasuk Disnaker).
- **Status:** NOT A BUG

### NOT-A-BUG-05
- **ID:** NBA-05
- **Lokasi:** `backend/src/modules/portal/routes.js`
- **Deskripsi:** `GET /portal/access/:token` adalah endpoint publik. Ini disengaja agar klien dapat melihat status order mereka tanpa perlu akun internal.
- **Status:** NOT A BUG

---

## Ringkasan

| Severity | FIXED | OPEN |
|---|---|---|
| CRITICAL | 0 | 0 |
| HIGH | 1 | 0 |
| MEDIUM | 0 | 0 |
| LOW | 4 | 3 |
| INFO | 0 | 2 |
| **Total** | **5** | **5** |
