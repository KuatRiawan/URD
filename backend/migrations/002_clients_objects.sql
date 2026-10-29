-- Klien, lokasi, PIC, kategori objek, objek uji.

CREATE TABLE object_categories (
  id               smallserial PRIMARY KEY,
  code             text NOT NULL UNIQUE,
  name             text NOT NULL UNIQUE,
  -- Daftar atribut khusus: [{ "key": "swl", "label": "...", "unit": "ton" }]
  attribute_schema jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Tujuh kategori sesuai PRD M1-04. Atribut khusus hanya contoh yang disebut PRD M1-05;
-- atribut lain ditambahkan setelah divalidasi tim Ahli K3.
INSERT INTO object_categories (code, name, attribute_schema) VALUES
  ('PAA', 'Pesawat Angkat dan Angkut', '[{"key":"swl","label":"SWL (Safe Working Load)","unit":"ton"}]'),
  ('PTP', 'Pesawat Tenaga dan Produksi', '[]'),
  ('PUBT', 'Boiler dan Bejana Tekan', '[{"key":"working_pressure","label":"Tekanan kerja","unit":"bar"}]'),
  ('LIS', 'Instalasi Listrik', '[{"key":"installed_power","label":"Daya terpasang","unit":"kVA"}]'),
  ('IPP', 'Instalasi Penyalur Petir', '[]'),
  ('LE', 'Lift dan Eskalator', '[]'),
  ('IPK', 'Instalasi Proteksi Kebakaran', '[]');

CREATE TABLE clients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  npwp       text,
  address    text,
  industry   text,
  email      text,
  phone      text,
  is_active  boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX clients_npwp_uq ON clients(npwp) WHERE npwp IS NOT NULL;
CREATE INDEX clients_name_idx ON clients(lower(name));

CREATE TABLE client_locations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name       text NOT NULL,
  address    text NOT NULL,
  city       text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX client_locations_client_idx ON client_locations(client_id);

CREATE TABLE client_contacts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name       text NOT NULL,
  position   text,
  phone      text,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX client_contacts_client_idx ON client_contacts(client_id);

CREATE TABLE test_objects (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid NOT NULL REFERENCES clients(id),
  location_id         uuid REFERENCES client_locations(id),
  category_id         smallint NOT NULL REFERENCES object_categories(id),
  name                text NOT NULL,
  brand               text,
  model               text,
  serial_number       text NOT NULL,
  manufacture_year    smallint CHECK (manufacture_year BETWEEN 1900 AND 2100),
  capacity            text,
  install_location    text,
  previous_permit_no  text,
  attributes          jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active           boolean NOT NULL DEFAULT true,
  created_by          uuid REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
-- M1-08: nomor seri unik per klien (tidak peka huruf besar/kecil dan spasi tepi).
CREATE UNIQUE INDEX test_objects_client_serial_uq ON test_objects(client_id, lower(btrim(serial_number)));
CREATE INDEX test_objects_category_idx ON test_objects(category_id);
CREATE INDEX test_objects_serial_idx ON test_objects(lower(serial_number));

