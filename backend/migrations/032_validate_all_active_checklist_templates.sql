-- Migrasi 032: Pastikan seluruh versi template inspeksi yang berstatus 'AKTIF' memiliki is_validated = true
UPDATE inspection_template_versions
SET is_validated = true,
    validated_at = coalesce(validated_at, now())
WHERE status = 'AKTIF';

