-- 030_unit_level_inspection_type_and_editing.sql
-- Mendukung jenis riksa uji per unit (Pertama, Berkala, Khusus, Ulang) dalam 1 PO
-- serta pengelolaan unit PO setelah diterbitkan.

ALTER TABLE order_objects
  ADD COLUMN IF NOT EXISTS inspection_type_code text DEFAULT 'BERKALA';

-- Sinkronisasi data unit yang sudah ada dari orders.service_type
UPDATE order_objects oo
SET inspection_type_code = CASE o.service_type
  WHEN 'PEMERIKSAAN_PERTAMA' THEN 'PERTAMA'
  WHEN 'PEMERIKSAAN_ULANG' THEN 'ULANG'
  WHEN 'PERPANJANGAN' THEN 'BERKALA'
  ELSE 'BERKALA'
END
FROM orders o
WHERE o.id = oo.order_id AND (oo.inspection_type_code IS NULL OR oo.inspection_type_code = 'BERKALA');

