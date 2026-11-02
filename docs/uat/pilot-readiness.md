# Kesiapan Pilot Terkendali

## Keputusan

**UAT PASSED WITH CONDITIONS**

## Layak untuk pilot terbatas

- Admin Sistem: akun, role, audit, dan dukungan operasional dasar.
- Admin Kantor: alur hasil inspeksi, dokumen, distribusi, reminder internal, dengan batasan lifecycle dokumen.
- Inspector: assignment, kompetensi, checklist, foto, tanda tangan, dan submit online. Offline perlu validasi perangkat sebelum lapangan.
- Pimpinan: monitoring read-only.
- Marketing: klien, PIC, PO, unit, progres, dan follow-up komersial.

## Syarat pilot

1. Gunakan database dan akun pilot terpisah.
2. Tandai semua dokumen sebagai TEST/UAT dan jangan gunakan sebagai dokumen legal.
3. Nonaktifkan pengiriman Email/WhatsApp nyata.
4. Tetapkan owner yang memantau error, sync offline, reminder, dan distribusi.
5. Catat setiap pekerjaan yang memerlukan koreksi dokumen secara manual.
6. Sediakan rollback operasional dan backup sebelum memasukkan data pilot.

## Wajib selesai sebelum go-live

- Backup dan restore test berhasil.
- Uji responsive pada browser/perangkat Inspector.
- Keputusan jadwal reminder resmi.
- Mapping akun produksi Marketing/Admin Kantor.
- Lifecycle cancel/correction/reissue dokumen.
- Negative test matrix endpoint selesai.
- Kebijakan retensi dan legal hold disetujui.

## Kesimpulan

Sistem belum READY penuh. Sistem dapat masuk pilot internal terbatas dengan pengendalian dan persetujuan owner atas kondisi di atas.
