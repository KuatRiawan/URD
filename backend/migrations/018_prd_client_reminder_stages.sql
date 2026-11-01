-- Migrasi 018: Tahap reminder klien mengikuti PRD v0.1 (H-30, H-14, H-7).
-- Nilai tahap lama dipertahankan agar riwayat pengiriman tetap dapat dibaca.
ALTER TABLE client_reminder_log
  DROP CONSTRAINT IF EXISTS client_reminder_log_stage_check;

ALTER TABLE client_reminder_log
  ADD CONSTRAINT client_reminder_log_stage_check
  CHECK (stage IN ('H90', 'H60', 'H30', 'H14', 'H7', 'H0'));
