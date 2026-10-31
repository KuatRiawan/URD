# Audit Keamanan Akses Modul Inspector
**PT Upaya Riksa Daya**

---

## 1. Kontrol Autentikasi & Otorisasi
- **Prinsip Least Privilege**:
  Inspector (`INSPECTOR` / `AHLI_K3`) hanya memiliki akses terhadap penugasan objek uji yang diberikan kepada dirinya.
- **Pemeriksaan Kepemilikan Data (`assertEditableInspection`)**:
  Setiap modifikasi (draf, unggah foto, simpan tanda tangan, pengiriman final) memverifikasi bahwa `inspection.inspector_id === req.user.id`. Percobaan manipulasi data oleh pihak lain ditolak dengan kode status `403 FORBIDDEN`.
- **Penguncian Formulir (Tamper-Proof Lock)**:
  Formulir yang telah dikirimkan (`TERKIRIM` atau `SELESAI`) secara ketat dikunci dan tidak dapat diubah tanpa pembukaan revisi resmi tercatat (`409 INSPECTION_LOCKED`).

---

## 2. Keamanan Berkas & Tanda Tangan
- **Validasi Data URL**:
  Tanda tangan digital divalidasi menggunakan ekspresi reguler terhadap skema data URL PNG/JPEG sebelum di-decode menjadi buffer biner.
- **Isolasi Berkas Lapangan**:
  Berkas foto dan tanda tangan disimpan di direktori terisolasi dengan penamaan unik berbasis UUID v4, mencegah eksploitasi path traversal atau penimpaan berkas.

