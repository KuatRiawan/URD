# Validasi Penyimpanan Dokumen & Engine PDF (Storage & Document Engine Validation)

Tanggal: 2 November 2026  
Status Validasi: **PASSED (PENYIMPANAN PERSISTEN & ENGINE PDF F4 TERVERIFIKASI)**  
Penyusun: Senior Full-Stack Engineer, QA Automation Lead & Application Security Engineer  

---

## 1. Taksonomi & Struktur Penyimpanan Dokumen Persisten

Aplikasi PT Upaya Riksa Daya mengelola dokumen operasional legalitas K3 yang wajib dipertahankan integritasnya dan tidak boleh terhapus saat deployment ulang aplikasi.

Struktur direktori penyimpanan persisten di staging:

```
/var/urd/storage/uploads/
├── [timestamp]-[uuid].jpg     # Foto temuan lapangan & kondisi unit alat
├── [timestamp]-[uuid].png     # Dokumentasi nameplate & spesifikasi pabrik
├── [timestamp]-[uuid].png     # Tanda tangan digital Inspector & Penanggung Jawab
├── [timestamp]-[uuid].pdf     # Lampiran sertifikat kalibrasi & dokumen pendukung
└── lhpp-cache/                # Cache berkas F4 PDF terkompilasi
```

**Ketentuan Izin Berkas:**
- Pemilik: `urd:urd-app`.
- Hak Akses Direktori: `0750` (`rwxr-x---`).
- Hak Akses File: `0640` (`rw-r-----`).
- Direktori ini dipisahkan dari folder kode sumber git (`/var/urd/backend`), sehingga redeployment atau update repository tidak akan menghapus berkas unggahan pengguna.

---

## 2. Pengamanan Unggah Berkas (Upload Security Implementation)

Modul `backend/src/storage/file-storage.js` menerapkan multi-layer defense untuk mencegah serangan upload exploit:

1. **MIME Type Whitelist (Strict):**
   - Hanya menerima: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
   - Menolak ekstensi atau executable berbahaya (`.exe`, `.sh`, `.php`, `.js`, `.html`).
2. **Batas Ukuran Berkas (File Size Limit):**
   - Maksimum 10 MB per file (`MAX_UPLOAD_BYTES=10485760`).
   - Request melebihi batas ditolak dengan `HTTP 413 Payload Too Large` oleh Multer dan Nginx.
3. **Pemberian Nama Acak Kriptografis (UUID Naming):**
   - Menggunakan format: `${Date.now()}-${crypto.randomUUID()}${ext}`.
   - Mengeliminasi risiko *path traversal* (`../../etc/passwd`) dan *file collision*.
4. **Sanitasi Nama Asli:**
   - Nama asli dibersihkan menggunakan `path.basename(originalName).slice(0, 180)` sebelum dicatat ke database tabel `file_attachments`.
5. **Pencegahan Directory Listing:**
   - Nginx tidak mengaktifkan modul `autoindex`. Direktori upload tidak dapat di-browse secara publik.

---

## 3. Kontrol Akses Berkas (Private File Access & IDOR Protection)

Berkas unggahan tidak disajikan langsung sebagai static file publik tanpa otorisasi. Pengambilan file privat melewati route API terproteksi:

```http
GET /api/v1/inspections/:id/photos/:photoId
```

**Mekanisme Otorisasi:**
- Memvalidasi token JWT pengguna.
- Memeriksa apakah pengguna memiliki hak akses terhadap inspeksi tersebut (Admin, Pimpinan read-only, atau Inspector yang ditugaskan).
- Pengguna dari role lain yang mencoba menebak UUID berkas unit lain ditolak dengan respon `HTTP 403 Forbidden` atau `HTTP 404 Not Found`.

---

## 4. Validasi Engine Pembangkitan PDF LHPP & BAP

Pengujian mendalam telah dijalankan pada `backend/src/tests/lhpp-pdf-generator.test.js` (8 test case lulus 100%):

### A. Format Dokumen Standar F4 (Folio Indonesia)
- Dimensi halaman: `612 pt x 936 pt` (Standar 215 mm x 330 mm yang digunakan oleh Disnaker di Indonesia).
- Margin: 36 pt (0.5 inch) untuk efisiensi ruang cetak.
- Struktur Dokumen 5 Bagian Resmi:
  1. Bagian I: Data Umum Perusahaan & Lokasi Pemeriksaan.
  2. Bagian II: Data Teknis Objek / Nameplate Spesifikasi Pabrik.
  3. Bagian III: Hasil Pemeriksaan Visual & Checklist Pengujian.
  4. Bagian IV: Hasil Pengukuran Teknis & Pengujian Beban/Kelistrikan.
  5. Bagian V: Kesimpulan Kelayakan K3, Temuan & Rekomendasi Wajib.

### B. Cakupan 7 Kategori Bidang K3:
Engine PDF telah diverifikasi berhasil merender laporan untuk seluruh kategori objek:
1. `PAA` (Pesawat Angkat & Pesawat Angkut - Crane, Forklift, Excavator).
2. `PTP` (Pesawat Tenaga & Produksi - Genset, Mesin Bubut, Kompresor).
3. `PUBT` (Pesawat Uap & Bejana Tekan - Boiler, Tangki Timbun).
4. `ELEVATOR` (Elevator Penumpang, Dumbwaiter, Eskalator).
5. `INSTALASI_LISTRIK` (Panel Distribusi Listrik, Trafo).
6. `PROTEKSI_PETIR` (Sistem Penangkal Petir Konvensional/Elektrostatis).
7. `DAMKAR` (Instalasi Hydrant, Sprinkler, Alarm Kebakaran).

### C. Lampiran Halaman Legalitas SKP Ahli K3:
Engine PDF secara otomatis menyisipkan halaman lampiran resmi berupa SKP (Surat Keputusan Penunjukan) Ahli K3 dan Lisensi PJK3 PT Upaya Riksa Daya dari Kemnaker RI yang sesuai dengan bidang pemeriksaan.

---

## 5. Verifikasi QR Code & Token Portal Klien

1. **Pembangkitan QR Code:**
   - Menggunakan pustaka `qrcode` versi SVG/PNG resolusi tinggi (300 DPI).
   - URL yang disematkan mengarah ke domain staging:
     `https://staging.upayariksadaya.com/verify/doc/[hash]`
2. **Keamanan Token Portal:**
   - Diterapkan melalui migrasi `019_hashed_portal_tokens.sql`.
   - Token acak 32-byte diberikan kepada klien, tetapi di database disimpan hanya dalam bentuk hash SHA-256 (`token_hash`).
   - Mencegah kebocoran akses portal apabila database snapshot dicadangkan.

