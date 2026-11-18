-- 031_support_photo_and_long_text_checklist_inputs.sql
-- Memperluas check constraint input_type pada inspection_template_items
-- agar mendukung PHOTO, LONG_TEXT, FILE, dan tipe input lainnya yang didukung frontend & backend.

ALTER TABLE inspection_template_items
  DROP CONSTRAINT IF EXISTS inspection_template_items_input_type_check;

ALTER TABLE inspection_template_items
  ADD CONSTRAINT inspection_template_items_input_type_check
  CHECK (input_type IN (
    'CHOICE',
    'NUMBER',
    'TEXT',
    'LONG_TEXT',
    'DATE',
    'PHOTO',
    'FILE',
    'YES_NO',
    'CONFORMITY',
    'MEASUREMENT',
    'SINGLE_SELECT',
    'MULTI_SELECT'
  ));

