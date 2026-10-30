-- Migrasi 012: Konsolidasi ID Penugasan & Kompetensi Akun Inspector / Marketing Kanonik
-- PT Upaya Riksa Daya

DO $$
DECLARE
  v_old_paa uuid;
  v_new_paa uuid;
  v_old_listrik uuid;
  v_new_listrik uuid;
  v_old_kantor uuid;
  v_new_kantor uuid;
BEGIN
  SELECT id INTO v_old_paa FROM users WHERE email = 'ahlik3.paa@upayariksadaya.com';
  SELECT id INTO v_new_paa FROM users WHERE email = 'inspector.paa@upayariksadaya.com';
  SELECT id INTO v_old_listrik FROM users WHERE email = 'ahlik3.listrik@upayariksadaya.com';
  SELECT id INTO v_new_listrik FROM users WHERE email = 'inspector.listrik@upayariksadaya.com';
  SELECT id INTO v_old_kantor FROM users WHERE email = 'admin.kantor@upayariksadaya.com';
  SELECT id INTO v_new_kantor FROM users WHERE email = 'marketing@upayariksadaya.com';

  -- 1. Konsolidasi Akun PAA (Ir. Budi Santoso)
  IF v_old_paa IS NOT NULL AND v_new_paa IS NOT NULL THEN
    UPDATE inspections SET inspector_id = v_new_paa WHERE inspector_id = v_old_paa;
    UPDATE order_objects SET inspector_id = v_new_paa WHERE inspector_id = v_old_paa;
    UPDATE assignments SET inspector_id = v_new_paa WHERE inspector_id = v_old_paa;

    INSERT INTO inspector_competencies (inspector_id, category_id, certificate_no, valid_from, valid_until)
    SELECT v_new_paa, category_id, certificate_no, valid_from, valid_until
    FROM inspector_competencies
    WHERE inspector_id = v_old_paa
    ON CONFLICT (inspector_id, category_id, certificate_no) DO NOTHING;
  END IF;

  -- 2. Konsolidasi Akun Listrik (Rizky Pratama, S.T.)
  IF v_old_listrik IS NOT NULL AND v_new_listrik IS NOT NULL THEN
    UPDATE inspections SET inspector_id = v_new_listrik WHERE inspector_id = v_old_listrik;
    UPDATE order_objects SET inspector_id = v_new_listrik WHERE inspector_id = v_old_listrik;
    UPDATE assignments SET inspector_id = v_new_listrik WHERE inspector_id = v_old_listrik;

    INSERT INTO inspector_competencies (inspector_id, category_id, certificate_no, valid_from, valid_until)
    SELECT v_new_listrik, category_id, certificate_no, valid_from, valid_until
    FROM inspector_competencies
    WHERE inspector_id = v_old_listrik
    ON CONFLICT (inspector_id, category_id, certificate_no) DO NOTHING;
  END IF;

  -- 3. Konsolidasi Akun Marketing (Siti Rahmawati)
  IF v_old_kantor IS NOT NULL AND v_new_kantor IS NOT NULL THEN
    UPDATE orders SET created_by = v_new_kantor WHERE created_by = v_old_kantor;
    UPDATE clients SET created_by = v_new_kantor WHERE created_by = v_old_kantor;
  END IF;
END $$;
