# Log Implementasi

## Kendala operasional

- **Masalah:** ketidaksesuaian unit dan hambatan lapangan tidak memiliki alur tindak lanjut lintas role.
- **Role:** Inspector melapor; Marketing/Admin menangani; Pimpinan memantau.
- **Solusi:** halaman Kendala, timeline event, status, penanggung jawab, catatan tindakan dan bukti.
- **Frontend:** `frontend/src/features/issues/IssuesPage.jsx`, router, navigasi, modal inspeksi dan pencarian global.
- **Backend:** `backend/src/modules/operational-issues/routes.js`, route API, akses file dan pencarian.
- **Database:** migrasi `016_operational_issues_and_order_revisions.sql` membuat kendala, event, bukti dan revisi PO.
- **Permission:** assignment Inspector diverifikasi; Marketing/Admin menindaklanjuti; Pimpinan read-only; seluruh operasi memerlukan autentikasi dan validasi Joi.
- **Testing:** suite API untuk akses, alur, event, audit, bukti dan pencarian; simulasi browser lintas tiga role.

## Histori PO

- **Masalah:** perubahan awal/unit tambahan perlu versi yang dapat ditelusuri.
- **Solusi:** snapshot JSONB bernomor versi untuk PO awal, tambah unit dan impor CSV; detail PO menampilkan riwayat.
- **Backend:** `backend/src/services/order-revisions.js` dan integrasi route PO.
- **Batasan:** bukan rekonstruksi setiap edit field PO; bukan proses persetujuan change order.

## Perubahan jadwal

- **Masalah:** perubahan perlu alasan dan pemberitahuan Inspector.
- **Solusi:** memakai histori jadwal dan notifikasi kepada Inspector aktif.
- **Testing:** tes API memastikan satu entri histori dan notifikasi.

## Perbaikan selama pengerjaan

Validasi query awalnya mencoba menetapkan `req.query` Express yang bersifat getter. Tes menemukan kegagalan itu; validasi diperbaiki agar memeriksa nilai query secara langsung sebelum operasi DB.
