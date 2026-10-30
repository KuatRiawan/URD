# Audit Arsitektur & Skema Database
## PT Upaya Riksa Daya

Dokumen ini memaparkan audit arsitektur basis data PostgreSQL pada sistem operasional PT Upaya Riksa Daya, integritas relasional, kepatuhan migrasi, dan performa query.

---

## 1. Skema Basis Data & Entitas Utama

Sistem dirancang di atas PostgreSQL dengan membagi alur operasional ke dalam tabel-tabel utama:

1. **Master Klien & Lokasi (`clients`, `client_locations`, `client_contacts`):**
   - Menyimpan data perusahaan pengguna jasa K3, alamat kantor pusat/cabang, dan kontak penanggung jawab teknis (PIC).
2. **Master Objek Uji K3 (`test_objects`, `object_categories`):**
   - 7 kategori resmi: PAA (Pesawat Angkat & Angkut), PUBT (Pesawat Uap & Bejana Tekan), PTP (Pesawat Tenaga & Produksi), IPP (Instalasi Penyalur Petir & Pembumian), LIS (Instalasi Listrik & Proteksi Kebakaran), LE (Lift & Eskalator), IPK (Instalasi Proteksi Kebakaran).
   - Pencegahan duplikasi nomor seri per kategori menggunakan indeks unik dan validasi integritas.
3. **Purchase Order Multi-Unit (`orders`, `order_objects`, `order_status_history`):**
   - Satu nomor PO dari klien dapat memuat satu atau banyak unit alat yang diperiksa pada lokasi dan jadwal berbeda.
   - Tabel `order_objects` mencatat status individual tiap unit (`unit_status`), lingkup riksa uji (`scope_items`), dan tanggal usulan riksa uji.
4. **Penjadwalan & Penugasan Ahli K3 (`schedules`, `assignments`):**
   - Menghubungkan PO dan unit alat dengan Ahli K3 yang memiliki SKP penunjukan resmi.
   - Mendukung deteksi konflik jadwal antar-lokasi.
5. **Formulir Inspeksi & Checklist Digital (`inspections`, `inspection_results`, `inspection_findings`):**
   - Berbasis versi template checklist aktif (`inspection_template_versions`).
   - Menyimpan nilai hasil pemeriksaan (`choice_value`, `number_value`, `text_value`, `out_of_range`).
   - Mencatat temuan ketidaksesuaian teknis lapangan beserta tingkat keparahannya (Kritis, Mayor, Minor).
6. **Lampiran Berkas & Tanda Tangan (`file_attachments`, `inspection_signatures`):**
   - Menyimpan metadata berkas bukti fisik, dokumen PO, foto temuan, dan goresan tanda tangan digital base64/PNG.
   - Mendukung mekanisme soft-delete (`deleted_at`) agar berkas tidak terhapus permanen sebelum konfirmasi audit.
7. **Dokumen Resmi K3 (`bap_documents`, `lhpp_documents`, `suket_records`):**
   - Menyimpan nomor surat resmi, status finalisasi, catatan review, serta masa berlaku Suket K3 (pengingat 90 hari dan 30 hari).
8. **Distribusi Dokumen (`document_distributions`):**
   - Melacak pengiriman Berita Acara ke Klien dan bundle Berkas LHPP + BAP ke Dinas Tenaga Kerja (Disnaker).
9. **Log Audit Tidak Dapat Diubah (`audit_logs`):**
   - Append-only log yang dilindungi oleh trigger PostgreSQL.

---

## 2. Integritas Keamanan & Audit Log Immutability

Tabel `audit_logs` dilindungi langsung pada level basis data:

```sql
CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. Modifying or deleting audit records is prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_tampering();
```

Bukti keamanan:
- Setiap operasi UPDATE atau DELETE pada tabel `audit_logs` akan memicu error fatal dan dibatalkan secara otomatis oleh PostgreSQL.

---

## 3. Disiplin Parameterized SQL

Sesuai aturan arsitektur PT Upaya Riksa Daya (`AGENTS.md` Bagian 2):
- Seluruh query database diwajibkan menggunakan parameter SQL `$1, $2, ...` melalui modul `backend/src/database/pool.js`.
- Tidak ada query yang menggunakan konkatenasi string mentah atau injeksi variabel langsung ke dalam klausa SQL.
- Transaksi database dijalankan menggunakan helper `withTransaction` yang mengelola `BEGIN`, `COMMIT`, dan `ROLLBACK` secara otomatis ketika terjadi kegagalan.

---

## 4. Status Migrasi Database

Seluruh perubahan skema dikelola melalui berkas migrasi bernomor urut di `backend/migrations/`:
- `001_initial_schema.sql` sampai migrasi multi-unit dan distribusi dokumen.
- Skema terverifikasi berjalan lancar pada engine PostgreSQL 18.
- Status migrasi: **Lengkap & Terverifikasi**.
