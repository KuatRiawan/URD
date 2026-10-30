# Audit Integrasi Frontend, Backend & Database
## PT Upaya Riksa Daya

Dokumen ini memvalidasi kontrak integrasi antarkomponen aplikasi (Frontend React, Backend Express.js REST API, dan Basis Data PostgreSQL) pada PT Upaya Riksa Daya.

---

## 1. Arsitektur Kontrak API & Komunikasi Data

Aplikasi menggunakan pola komunikasi RESTful API berbasis JSON dengan pemisahan direktori yang ketat:
- **Klien HTTP:** Axios instance terpusat (`frontend/src/lib/api/axios.js`) dengan prefix `/api/v1`.
- **Manajemen Sesi:** Token JWT disimpan dalam memori dan diamankan dengan HTTP cookie refresh token yang mendukung rotasi token otomatis saat sesi berakhir.
- **Validasi Permintaan:** Setiap request body divalidasi oleh skema `Joi` pada lapisan middleware backend sebelum dieksekusi oleh controller.

---

## 2. Matriks Integrasi Alur Bisnis Inti

| Alur Kerja Operasional | Aksi Frontend | Endpoint Backend | Operasi Database PostgreSQL | Status Integrasi |
| :--- | :--- | :--- | :--- | :---: |
| **Pencatatan PO Multi-Unit** | Form Input PO Baru (`OrdersPage.jsx`) | `POST /api/v1/orders` | Insert ke `orders`, `order_objects`, `test_objects`, dan `order_status_history` dalam satu transaksi | **Terhubung & Valid** |
| **Penugasan Ahli K3** | Modal Penugasan (`SchedulePage.jsx` / `OrdersPage.jsx`) | `POST /api/v1/scheduling/assign` | Insert ke `assignments` dan update status order ke `DITUGASKAN` | **Terhubung & Valid** |
| **Pengisian Checklist Digital** | Lembar Riksa Uji (`InspectionsPage.jsx`) | `PUT /api/v1/inspections/:id/draft` | Upsert ke `inspection_results` dan update `inspections` | **Terhubung & Valid** |
| **Unggah Foto Dokumentasi** | Kamera / File Picker Inline (`InspectionsPage.jsx`) | `POST /api/v1/inspections/:id/photos` | Simpan binary ke disk lokal & catat metadata ke `file_attachments` | **Terhubung & Valid** |
| **Hapus Foto Dokumentasi** | Tombol Tempat Sampah (`InspectionsPage.jsx`) | `DELETE /api/v1/inspections/:id/photos/:photoId` | Soft-delete `deleted_at = now()` pada `file_attachments` | **Terhubung & Valid** |
| **Tanda Tangan Digital** | Kanvas TTD Interaktif (`InspectionsPage.jsx`) | `POST /api/v1/inspections/:id/signatures` | Simpan PNG tanda tangan ke storage & catat ke `inspection_signatures` | **Terhubung & Valid** |
| **Penyelesaian Riksa Uji** | Modal Rangkuman Pra-Kirim (`InspectionsPage.jsx`) | `POST /api/v1/inspections/:id/submit` | Kunci `inspections` ke `TERKIRIM`, terbitkan `bap_documents` (FINAL), buat draf `lhpp_documents`, dan sync `unit_status` | **Terhubung & Valid** |
| **Generator Dokumen PDF** | Tombol Unduh BAP / LHPP | `GET /api/v1/bap/:id/pdf`<br>`GET /api/v1/lhpp/:id/pdf` | Baca relasi data dan render berkas PDF resmi F4 secara streaming | **Terhubung & Valid** |
| **Distribusi Berkas K3** | Form Pengiriman Berkas (`DocumentDistributionPage.jsx`) | `POST /api/v1/distributions` | Insert ke `document_distributions` dan perbarui status unit ke `SELESAI` bila seluruh berkas terkirim | **Terhubung & Valid** |
| **Pencarian Global Terpadu** | Dialog Shortcut `Cmd+K` (`GlobalSearchDialog.jsx`) | `GET /api/v1/search?q=...` | Query gabungan cepat berparameter ke tabel `orders`, `clients`, `test_objects`, `bap_documents`, dan `lhpp_documents` | **Terhubung & Valid** |

---

## 3. Ketahanan Jaringan & Mekanisme Pemulihan Draf (Offline-First)

1. **Penyimpanan Draf Lokal (`draft-storage.js`):**
   - Setiap perubahan checklist disimpan otomatis ke `localStorage` browser. Jika koneksi terputus atau halaman tidak sengaja di-refresh, data pengujian dipulihkan secara instan tanpa kehilangan input.
2. **Antrean Sinkronisasi Otomatis (`offline-sync.js`):**
   - Foto dan draf hasil inspeksi yang diambil saat inspector tidak mendapatkan sinyal internet di lokasi pabrik secara otomatis masuk ke IndexedDB / storage antrean.
   - Saat perangkat kembali terhubung ke internet, listener event `online` memicu proses background auto-sync ke backend tanpa intervensi manual.
