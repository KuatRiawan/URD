# Implementasi Role dan Permission

## Perubahan

- `MARKETING` dan `ADMIN_KANTOR` tidak lagi saling menjadi alias di middleware.
- Route yang memproses LHPP, BAP, distribusi, dan QC memakai `ADMIN_KANTOR`/`ADMIN_SISTEM`.
- Marketing tetap mendapat alur komersial dan follow-up, termasuk endpoint klien, PO, dan reminder yang memang menjadi tanggung jawabnya, tetapi tidak mendapat akses QC dokumen hanya karena role alias.
- Frontend tidak lagi menganggap Marketing dan Admin Kantor sebagai role yang sama untuk menu dokumen.
- Pimpinan/Manager tetap read-only.

## Legacy mapping

Seed test sekarang membuat akun `admin.kantor@upayariksadaya.com` sebagai `ADMIN_KANTOR`. Data produksi yang sebelumnya dikonversi migration lama menjadi `MARKETING` tidak boleh ditebak ulang.

Laporan manual yang diperlukan:

```sql
SELECT id, email, full_name, role, is_active
FROM users
WHERE role IN ('MARKETING', 'ADMIN_KANTOR')
ORDER BY role, full_name;
```

Owner harus menetapkan fungsi setiap akun ambiguous sebelum perubahan role. Selama belum dipetakan, akun tidak boleh diberi capability tambahan secara otomatis.

## Pending

Capability silang tertentu, seperti akses baca status dokumen atau pembatasan pembuatan PO oleh Admin Kantor, masih dipertahankan demi kompatibilitas operasional dan perlu konfirmasi owner bila ingin dipersempit lebih lanjut.
