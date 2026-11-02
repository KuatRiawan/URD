# Proposal Kebijakan Retensi Data

Dokumen ini bukan klaim masa retensi legal. Angka dan pengecualian harus ditetapkan owner bersama legal/compliance dan SOP perusahaan.

## Klasifikasi dan konfigurasi yang diperlukan

| Data | Perlakuan yang disarankan | Keputusan owner |
|---|---|---|
| Audit log | Append-only, tidak dihapus oleh aplikasi; retensi dan archive terpisah | PENDING OWNER DECISION |
| Checklist, pengukuran, temuan | Dipertahankan bersama inspection revision dan template version | PENDING OWNER DECISION |
| Foto lapangan dan tanda tangan | Dipertahankan bersama inspection/document lineage; jangan orphan saat dokumen direvisi | PENDING OWNER DECISION |
| LHPP, BAP, Suket | Simpan versi terbit dan status pengganti; jangan overwrite | PENDING OWNER DECISION |
| Distribusi dan bukti penerimaan | Simpan bersama versi dokumen dan recipient | PENDING OWNER DECISION |
| Token portal | Token legacy dipensiunkan setelah migrasi/link expiry; hash baru dipertahankan hanya sesuai kebutuhan akses/audit | PENDING OWNER DECISION |
| Log notifikasi/reminder | Simpan status terkirim, gagal, skipped, attempts, recipient, dan stage | PENDING OWNER DECISION |
| Backup | RPO/RTO, enkripsi, restore test, dan legal hold harus dikonfigurasi | PENDING OWNER DECISION |

## Guard wajib sebelum penghapusan

1. Data memiliki `retention_class` atau policy yang jelas.
2. Tidak ada legal hold, sengketa, audit, atau order aktif.
3. Backup dan restore point yang dipersyaratkan tersedia.
4. Penghapusan menghasilkan audit event dan tidak menghapus audit log itu sendiri.
5. File orphan dan referensi dokumen diperiksa sebelum purge.
6. Penghapusan token tidak menghapus histori akses atau pencabutan.

## Risiko

Penghapusan terlalu cepat dapat menghilangkan bukti inspeksi, memutus pembuktian QR, menyulitkan sengketa klien, menghilangkan alasan reminder, dan membuat analisis kinerja tidak dapat dipercaya. Penyimpanan tanpa klasifikasi juga menimbulkan biaya, risiko akses, dan kesulitan memenuhi permintaan penghapusan yang sah.

## Rencana implementasi

Setelah owner menyetujui klasifikasi dan jangka waktu, tambahkan konfigurasi retention policy, job dry-run, laporan kandidat purge, approval dua pihak, archive tier, dan test restore. Jangan membuat migration penghapusan sebelum policy disetujui.
