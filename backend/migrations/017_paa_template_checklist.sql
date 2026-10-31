-- Checklist PAA dipecah mengikuti kelompok komponen dan butir pada contoh LHPP Gantry Crane.
DO $$
DECLARE
  v_category_id smallint;
  v_template_id uuid;
  v_admin_id uuid;
  v_version integer;
  v_version_id uuid;
  v_item record;
BEGIN
  SELECT id INTO v_category_id FROM object_categories WHERE code = 'PAA';
  SELECT id INTO v_template_id FROM inspection_templates WHERE category_id = v_category_id ORDER BY created_at LIMIT 1;
  SELECT id INTO v_admin_id FROM users WHERE role = 'ADMIN_SISTEM' ORDER BY created_at LIMIT 1;
  IF v_category_id IS NULL OR v_template_id IS NULL OR v_admin_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_version
  FROM inspection_template_versions WHERE template_id = v_template_id;
  UPDATE inspection_template_versions SET status = 'ARSIP'
  WHERE template_id = v_template_id AND status = 'AKTIF';
  INSERT INTO inspection_template_versions (template_id, version, status, is_validated, published_at, created_by)
  VALUES (v_template_id, v_version, 'AKTIF', false, now(), v_admin_id)
  RETURNING id INTO v_version_id;

  FOR v_item IN
    SELECT * FROM jsonb_to_recordset($items$
    [
      {"seq":1,"section":"Konstruksi: Baut Pengikat","label":"Korosi"},
      {"seq":2,"section":"Konstruksi: Baut Pengikat","label":"Keretakan"},
      {"seq":3,"section":"Konstruksi: Baut Pengikat","label":"Perubahan bentuk"},
      {"seq":4,"section":"Konstruksi: Baut Pengikat","label":"Kekencangan"},
      {"seq":5,"section":"Konstruksi: Kolom / Rangka","label":"Korosi"},
      {"seq":6,"section":"Konstruksi: Kolom / Rangka","label":"Keretakan"},
      {"seq":7,"section":"Konstruksi: Kolom / Rangka","label":"Perubahan bentuk"},
      {"seq":8,"section":"Konstruksi: Kolom / Rangka","label":"Pengikatan"},
      {"seq":9,"section":"Konstruksi: Kolom / Rangka","label":"Penguat melintang"},
      {"seq":10,"section":"Konstruksi: Kolom / Rangka","label":"Penguat diagonal"},
      {"seq":11,"section":"Tangga","label":"Korosi"},
      {"seq":12,"section":"Tangga","label":"Keretakan"},
      {"seq":13,"section":"Tangga","label":"Perubahan bentuk"},
      {"seq":14,"section":"Tangga","label":"Pengikat"},
      {"seq":15,"section":"Lantai Kerja","label":"Korosi"},
      {"seq":16,"section":"Lantai Kerja","label":"Keretakan"},
      {"seq":17,"section":"Lantai Kerja","label":"Perubahan bentuk"},
      {"seq":18,"section":"Lantai Kerja","label":"Pengikat"},
      {"seq":19,"section":"Beam Dudukan Rel","label":"Korosi"},
      {"seq":20,"section":"Beam Dudukan Rel","label":"Keretakan"},
      {"seq":21,"section":"Beam Dudukan Rel","label":"Perubahan bentuk"},
      {"seq":22,"section":"Beam Dudukan Rel","label":"Pengikat"},
      {"seq":23,"section":"Rel Travelling","label":"Korosi"},
      {"seq":24,"section":"Rel Travelling","label":"Keretakan"},
      {"seq":25,"section":"Rel Travelling","label":"Sambungan rel"},
      {"seq":26,"section":"Rel Travelling","label":"Kelurusan rel"},
      {"seq":27,"section":"Rel Travelling","label":"Kelurusan antara rel"},
      {"seq":28,"section":"Rel Travelling","label":"Kerataan antar rel"},
      {"seq":29,"section":"Rel Travelling","label":"Jarak antar sambungan rel"},
      {"seq":30,"section":"Rel Travelling","label":"Pengikat rel"},
      {"seq":31,"section":"Rel Travelling","label":"Rel stopper"},
      {"seq":32,"section":"Rel Traversing","label":"Korosi"},
      {"seq":33,"section":"Rel Traversing","label":"Keretakan"},
      {"seq":34,"section":"Rel Traversing","label":"Sambungan rel"},
      {"seq":35,"section":"Rel Traversing","label":"Kelurusan rel"},
      {"seq":36,"section":"Rel Traversing","label":"Kelurusan antara rel"},
      {"seq":37,"section":"Rel Traversing","label":"Kerataan antar rel"},
      {"seq":38,"section":"Rel Traversing","label":"Jarak antar sambungan rel"},
      {"seq":39,"section":"Rel Traversing","label":"Pengikat rel"},
      {"seq":40,"section":"Rel Traversing","label":"Rel stopper"},
      {"seq":41,"section":"Girder","label":"Korosi"},
      {"seq":42,"section":"Girder","label":"Keretakan"},
      {"seq":43,"section":"Girder","label":"Kecembungan"},
      {"seq":44,"section":"Girder","label":"Sambungan girder"},
      {"seq":45,"section":"Girder","label":"Sambungan ujung girder"},
      {"seq":46,"section":"Pembawa Girder: Rumah Roda Gigi","label":"Korosi"},
      {"seq":47,"section":"Pembawa Girder: Rumah Roda Gigi","label":"Keretakan"},
      {"seq":48,"section":"Pembawa Girder: Rumah Roda Gigi","label":"Minyak pelumas"},
      {"seq":49,"section":"Pembawa Girder: Rumah Roda Gigi","label":"Oil seal"},
      {"seq":50,"section":"Pembawa Girder: Roda Penggerak","label":"Keausan"},
      {"seq":51,"section":"Pembawa Girder: Roda Penggerak","label":"Keretakan"},
      {"seq":52,"section":"Pembawa Girder: Roda Penggerak","label":"Perubahan bentuk"},
      {"seq":53,"section":"Pembawa Girder: Roda Penggerak","label":"Kondisi flens"},
      {"seq":54,"section":"Pembawa Girder: Roda Penggerak","label":"Kondisi rantai"},
      {"seq":55,"section":"Pembawa Girder: Roda Idle","label":"Keausan"},
      {"seq":56,"section":"Pembawa Girder: Roda Idle","label":"Keretakan"},
      {"seq":57,"section":"Pembawa Girder: Roda Idle","label":"Perubahan bentuk"},
      {"seq":58,"section":"Pembawa Girder: Roda Idle","label":"Kondisi flens"},
      {"seq":59,"section":"Penghubung Roda / Bogie / Gardan","label":"Kelurusan"},
      {"seq":60,"section":"Penghubung Roda / Bogie / Gardan","label":"Cross joint"},
      {"seq":61,"section":"Penghubung Roda / Bogie / Gardan","label":"Pelumasan"},
      {"seq":62,"section":"Stopper Bumper","label":"Kondisi flens"},
      {"seq":63,"section":"Pembawa Trolley: Rumah Roda Gigi","label":"Pengikatan"},
      {"seq":64,"section":"Pembawa Trolley: Rumah Roda Gigi","label":"Korosi"},
      {"seq":65,"section":"Pembawa Trolley: Rumah Roda Gigi","label":"Keretakan"},
      {"seq":66,"section":"Pembawa Trolley: Rumah Roda Gigi","label":"Minyak pelumas"},
      {"seq":67,"section":"Pembawa Trolley: Rumah Roda Gigi","label":"Oil seal"},
      {"seq":68,"section":"Pembawa Trolley: Roda Penggerak","label":"Keausan"},
      {"seq":69,"section":"Pembawa Trolley: Roda Penggerak","label":"Keretakan"},
      {"seq":70,"section":"Pembawa Trolley: Roda Penggerak","label":"Perubahan bentuk"},
      {"seq":71,"section":"Pembawa Trolley: Roda Penggerak","label":"Kondisi flens"},
      {"seq":72,"section":"Pembawa Trolley: Roda Penggerak","label":"Kondisi rantai"},
      {"seq":73,"section":"Pembawa Trolley: Roda Idle","label":"Keausan"},
      {"seq":74,"section":"Pembawa Trolley: Roda Idle","label":"Keretakan"},
      {"seq":75,"section":"Pembawa Trolley: Roda Idle","label":"Perubahan bentuk"},
      {"seq":76,"section":"Pembawa Trolley: Roda Idle","label":"Kondisi flens"},
      {"seq":77,"section":"Penghubung Roda Trolley","label":"Kelurusan"},
      {"seq":78,"section":"Penghubung Roda Trolley","label":"Cross joint"},
      {"seq":79,"section":"Penghubung Roda Trolley","label":"Pelumasan"},
      {"seq":80,"section":"Stopper Bumper Trolley","label":"Kondisi flens"},
      {"seq":81,"section":"Drum Tromol Gulung","label":"Alur"},
      {"seq":82,"section":"Drum Tromol Gulung","label":"Bibir alur"},
      {"seq":83,"section":"Drum Tromol Gulung","label":"Flens-flensa"},
      {"seq":84,"section":"Rem","label":"Keausan"},
      {"seq":85,"section":"Rem","label":"Penyetelan"},
      {"seq":86,"section":"Hoist Gear Box","label":"Pelumasan"},
      {"seq":87,"section":"Hoist Gear Box","label":"Oil seal"},
      {"seq":88,"section":"Kait Utama","label":"Keausan"},
      {"seq":89,"section":"Kait Utama","label":"Kerenggangan mulut kait"},
      {"seq":90,"section":"Kait Utama","label":"Mur & bantalan putar (swivel)"},
      {"seq":91,"section":"Kait Utama","label":"Trunion"},
      {"seq":92,"section":"Kait Tambahan","label":"Keausan"},
      {"seq":93,"section":"Kait Tambahan","label":"Kerenggangan mulut kait"},
      {"seq":94,"section":"Kait Tambahan","label":"Mur & bantalan putar (swivel)"},
      {"seq":95,"section":"Kait Tambahan","label":"Trunion"},
      {"seq":96,"section":"Tali Kawat Baja (Utama, Tambahan)","label":"Korosi"},
      {"seq":97,"section":"Tali Kawat Baja (Utama, Tambahan)","label":"Keausan"},
      {"seq":98,"section":"Tali Kawat Baja (Utama, Tambahan)","label":"Putus"},
      {"seq":99,"section":"Tali Kawat Baja (Utama, Tambahan)","label":"Perubahan bentuk"},
      {"seq":100,"section":"Rantai (Utama, Tambahan)","label":"Korosi"},
      {"seq":101,"section":"Rantai (Utama, Tambahan)","label":"Keausan"},
      {"seq":102,"section":"Rantai (Utama, Tambahan)","label":"Keratakan / putus"},
      {"seq":103,"section":"Rantai (Utama, Tambahan)","label":"Perubahan bentuk"},
      {"seq":104,"section":"Ruang Operator (Cabin) / Pendant","label":"Tangga pengaman"},
      {"seq":105,"section":"Ruang Operator (Cabin) / Pendant","label":"Pintu"},
      {"seq":106,"section":"Ruang Operator (Cabin) / Pendant","label":"Jendela"},
      {"seq":107,"section":"Ruang Operator (Cabin) / Pendant","label":"Kipas / AC"},
      {"seq":108,"section":"Ruang Operator (Cabin) / Pendant","label":"Tuas / tombol control"},
      {"seq":109,"section":"Ruang Operator (Cabin) / Pendant","label":"Pendant control"},
      {"seq":110,"section":"Ruang Operator (Cabin) / Pendant","label":"Penerangan"},
      {"seq":111,"section":"Ruang Operator (Cabin) / Pendant","label":"Klakson"},
      {"seq":112,"section":"Ruang Operator (Cabin) / Pendant","label":"Pengaman lebur"},
      {"seq":113,"section":"Ruang Operator (Cabin) / Pendant","label":"Alat komunikasi"},
      {"seq":114,"section":"Ruang Operator (Cabin) / Pendant","label":"Pemadam Api (APAR)"},
      {"seq":115,"section":"Ruang Operator (Cabin) / Pendant","label":"Tanda-tanda pengoperasian"},
      {"seq":116,"section":"Ruang Operator (Cabin) / Pendant","label":"Kunci kontak"},
      {"seq":117,"section":"Ruang Operator (Cabin) / Pendant","label":"Lampu rotary"},
      {"seq":118,"section":"Ruang Operator (Cabin) / Pendant","label":"Sirine operasi"},
      {"seq":119,"section":"Outrigger","label":"Korosi"},
      {"seq":120,"section":"Outrigger","label":"Ulir"},
      {"seq":121,"section":"Outrigger","label":"Bantalan"},
      {"seq":122,"section":"Outrigger","label":"Silinder / as"},
      {"seq":123,"section":"Outrigger","label":"Tuas pemutar"},
      {"seq":124,"section":"Limit Switch (LS)","label":"LS Travelling"},
      {"seq":125,"section":"Limit Switch (LS)","label":"LS Traversing"},
      {"seq":126,"section":"Limit Switch (LS)","label":"LS Lifting"},
      {"seq":127,"section":"Komponen Listrik Tegangan 220/380 V / Phase / Hz","label":"Penyambung penghantar panel (PHB)"},
      {"seq":128,"section":"Komponen Listrik Tegangan 220/380 V / Phase / Hz","label":"Pelindung penghantar"},
      {"seq":129,"section":"Komponen Listrik Tegangan 220/380 V / Phase / Hz","label":"Sistem pengaman instalasi dari motor"},
      {"seq":130,"section":"Komponen Listrik Tegangan 220/380 V / Phase / Hz","label":"Sistem pembumian"},
      {"seq":131,"section":"Komponen Listrik Tegangan 220/380 V / Phase / Hz","label":"Instalasi"}
    ]
    $items$::jsonb) AS item(seq integer, section text, label text)
  LOOP
    INSERT INTO inspection_template_items
      (version_id, seq, section, label, input_type, is_required)
    VALUES (v_version_id, v_item.seq, v_item.section, v_item.label, 'CHOICE', true);
  END LOOP;
END $$;
