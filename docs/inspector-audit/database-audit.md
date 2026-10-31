# Audit Database Modul Inspector
**PT Upaya Riksa Daya**

---

## 1. Skema & Relasi Data yang Diaudit
Tabel inti yang berhubungan dengan modul Inspector:
- `orders`: Data PO dan perusahaan klien.
- `order_assignments`: Penugasan Ahli K3 dan konfirmasi jadwal pelaksanaan riksa uji.
- `test_objects`: Objek uji K3, nomor seri, kapasitas, lokasi, dan kolom JSONB `attributes` untuk parameter teknis Bab II LHPP.
- `inspections`: Formulir inspeksi lapangan, kesimpulan status, catatan, dan lifecycle status (`DRAF`, `TERKIRIM`).
- `inspection_results`: Hasil evaluasi per butir checklist (pilihan `SESUAI`/`TIDAK_SESUAI`, angka terukur, dan catatan khusus).
- `inspection_signatures`: Tanda tangan digital Ahli K3 dan perwakilan klien (PIC) dengan relasi file attachment.
- `inspection_photos`: Dokumentasi foto temuan atau butir checklist.
- `lhpp_documents` & `bap_documents`: Dokumen keluaran resmi yang terbit otomatis setelah riksa uji diselesaikan.

---

## 2. Integritas Relasi & Constraint
1. **Constraint Tanda Tangan (`inspection_signatures_signer_role_check`)**:
   Mendukung peran penandatangan: `AHLI_K3`, `INSPECTOR`, `PERWAKILAN_KLIEN`, `PIC_KLIEN`.
2. **Kunci Unik (`UNIQUE (inspection_id, signer_role)`)**:
   Mencegah duplikasi data tanda tangan untuk peran yang sama dalam satu pemeriksaan riksa uji.
3. **Immutability Log Audit**:
   Trigger `trg_audit_logs_immutable` menjamin seluruh aksi penandatanganan dan pengiriman tercatat secara permanen dan tidak dapat diubah atau dihapus.

