-- Fase kerja inspector (Lapangan / Kantor) harus tersimpan di server.
--
-- Sebelumnya fase ini hanya hidup di localStorage perangkat dan di body request,
-- sehingga setelah membuka ulang di perangkat lain inspector kembali ke mode
-- lapangan, progres pada navigasi tidak cocok dengan daftar butir yang tampil,
-- dan klaim fase lapangan dapat dipakai untuk melewati validasi butir wajib.
--
-- Migrasi ini aditif: tidak mengubah data hasil pemeriksaan, hanya menambah
-- kolom fase kerja dan jejak serah-terima Word beserta backfill status aman.

ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS work_phase text NOT NULL DEFAULT 'FIELD';

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_work_phase_check;
ALTER TABLE inspections
  ADD CONSTRAINT inspections_work_phase_check CHECK (work_phase IN ('FIELD', 'OFFICE'));

ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS word_handoff_at timestamptz;

-- Inspeksi yang sudah dikirim diselesaikan pada fase kantor (atau diserahkan ke
-- Word); hanya draf yang boleh tetap ditandai sebagai fase lapangan.
UPDATE inspections
SET work_phase = 'OFFICE'
WHERE status <> 'DRAF' AND work_phase = 'FIELD';
