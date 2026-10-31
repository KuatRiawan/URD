# Audit Backend Modul Inspector
**PT Upaya Riksa Daya**

---

## 1. Rute & Controller yang Diaudit
1. `backend/src/modules/inspections/routes.js`
   - `POST /inspections/start` (Mulai lembar riksa uji baru)
   - `GET /inspections/:id` (Memuat detail lembar riksa uji, checklist, foto, temuan, dan tanda tangan)
   - `PUT /inspections/:id/draft` (Autosave draf dan update parameter teknis objek)
   - `POST /inspections/:id/signatures` (Menyimpan data URL PNG tanda tangan digital)
   - `POST /inspections/:id/submit` (Submit final, penguncian data, dan penerbitan draf LHPP/BAP)
2. `backend/src/storage/file-storage.js`
   - `saveDataUrlPng` (Konversi base64 PNG menjadi file attachment aman)

---

## 2. Temuan & Remediasi Backend

### A. Endpoint Submit Final (`POST /inspections/:id/submit`)
- **Temuan**:
  Pada endpoint submit, backend hanya memperbarui kolom kesimpulan, catatan, dan hasil butir checklist pada tabel `inspections` dan `inspection_results`, namun belum memperbarui atribut teknis objek uji pada tabel `test_objects`.
- **Perbaikan**:
  Ditambahkan handler pembaruan parameter teknis objek uji (`test_objects.attributes`) secara transaksional di dalam endpoint `/submit`:
  ```javascript
  if (req.body?.objectAttributes && typeof req.body.objectAttributes === 'object') {
    await db.query(
      `UPDATE test_objects
       SET attributes = COALESCE(attributes, '{}'::jsonb) || $1::jsonb,
           updated_at = now()
       WHERE id = $2`,
      [JSON.stringify(req.body.objectAttributes), insp.object_id]
    );
  }
  ```

### B. Endpoint Simpan Tanda Tangan (`POST /inspections/:id/signatures`)
- **Validasi Keamanan**:
  - Middleware `authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM')` memastikan hanya pemeriksa yang berwenang yang dapat menyimpan tanda tangan.
  - `assertEditableInspection` menjamin integritas data: tanda tangan tidak dapat diubah setelah dokumen dikunci (`status: 'TERKIRIM'`), dan hanya inspector yang ditugaskan yang dapat mengaksesnya.
  - Penyimpanan file menggunakan hash SHA-256 dan validasi mimetype gambar yang ketat via `saveDataUrlPng`.

