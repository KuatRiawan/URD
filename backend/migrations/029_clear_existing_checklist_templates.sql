-- 029_clear_existing_checklist_templates.sql
-- Memungkinkan penghapusan checklist lama dan penyusunan manual dari awal oleh pengguna.

-- 1. Buat kolom template_version_id pada inspections menjadi nullable dengan ON DELETE SET NULL
ALTER TABLE inspections ALTER COLUMN template_version_id DROP NOT NULL;

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_template_version_id_fkey;
ALTER TABLE inspections ADD CONSTRAINT inspections_template_version_id_fkey
  FOREIGN KEY (template_version_id) REFERENCES inspection_template_versions(id) ON DELETE SET NULL;

-- 2. Pastikan foreign key inspection_results cascade ketika item checklist dihapus
ALTER TABLE inspection_results DROP CONSTRAINT IF EXISTS inspection_results_item_id_fkey;
ALTER TABLE inspection_results ADD CONSTRAINT inspection_results_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES inspection_template_items(id) ON DELETE CASCADE;

-- 3. Pastikan foreign key inspection_findings set null ketika item checklist dihapus
ALTER TABLE inspection_findings DROP CONSTRAINT IF EXISTS inspection_findings_item_id_fkey;
ALTER TABLE inspection_findings ADD CONSTRAINT inspection_findings_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES inspection_template_items(id) ON DELETE SET NULL;

-- 4. Bersihkan data respon hasil inspeksi bawaan/seed lama
DELETE FROM inspection_results;

-- 5. Lepaskan referensi template_version_id pada inspeksi yang ada
UPDATE inspections SET template_version_id = NULL;

-- 6. Hapus seluruh data template checklist: items, versions, dan templates
DELETE FROM inspection_template_items;
DELETE FROM inspection_template_versions;
DELETE FROM inspection_templates;

