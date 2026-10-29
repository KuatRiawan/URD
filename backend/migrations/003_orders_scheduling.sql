-- Ahli K3, order, jadwal, penugasan.

CREATE TABLE inspectors (
  user_id      uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  employee_no  text UNIQUE,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inspector_competencies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id    uuid NOT NULL REFERENCES inspectors(user_id) ON DELETE CASCADE,
  category_id     smallint NOT NULL REFERENCES object_categories(id),
  certificate_no  text NOT NULL,
  valid_from      date,
  valid_until     date NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (inspector_id, category_id, certificate_no)
);
CREATE INDEX inspector_competencies_valid_idx ON inspector_competencies(valid_until);

CREATE TYPE order_status AS ENUM (
  'ORDER_BARU', 'TERJADWAL', 'DITUGASKAN', 'SEDANG_DIPERIKSA',
  'MENUNGGU_LAPORAN', 'MENUNGGU_REVIEW', 'SELESAI', 'DIBATALKAN'
);

CREATE TABLE orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no         text NOT NULL UNIQUE,
  client_id        uuid NOT NULL REFERENCES clients(id),
  location_id      uuid REFERENCES client_locations(id),
  contact_id       uuid REFERENCES client_contacts(id),
  service_type     text NOT NULL CHECK (service_type IN ('PEMERIKSAAN_PERTAMA', 'PEMERIKSAAN_BERKALA', 'PERPANJANGAN', 'PEMERIKSAAN_ULANG')),
  source           text NOT NULL CHECK (source IN ('TELEPON', 'EMAIL', 'WHATSAPP', 'LANGSUNG', 'LAINNYA')),
  requested_date   date,
  status           order_status NOT NULL DEFAULT 'ORDER_BARU',
  notes            text,
  cancel_reason    text,
  renewal_of_suket uuid,
  created_by       uuid REFERENCES users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  completed_at     timestamptz
);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_client_idx ON orders(client_id);

CREATE TABLE order_objects (
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  object_id  uuid NOT NULL REFERENCES test_objects(id),
  PRIMARY KEY (order_id, object_id)
);
CREATE INDEX order_objects_object_idx ON order_objects(object_id);

CREATE TABLE order_status_history (
  id          bigserial PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status   order_status NOT NULL,
  note        text,
  changed_by  uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_status_history_order_idx ON order_status_history(order_id);

CREATE SEQUENCE order_no_seq;

CREATE TABLE schedules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  start_at   timestamptz NOT NULL,
  end_at     timestamptz NOT NULL,
  notes      text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX schedules_range_idx ON schedules USING gist (tstzrange(start_at, end_at));

CREATE TABLE schedule_changes (
  id          bigserial PRIMARY KEY,
  schedule_id uuid NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  old_start   timestamptz NOT NULL,
  old_end     timestamptz NOT NULL,
  new_start   timestamptz NOT NULL,
  new_end     timestamptz NOT NULL,
  reason      text NOT NULL,
  changed_by  uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE assignment_status AS ENUM ('MENUNGGU', 'DITERIMA', 'DITOLAK', 'DIBATALKAN');

CREATE TABLE assignments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  inspector_id   uuid NOT NULL REFERENCES inspectors(user_id),
  status         assignment_status NOT NULL DEFAULT 'MENUNGGU',
  reject_reason  text,
  responded_at   timestamptz,
  assigned_by    uuid REFERENCES users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);
-- Satu Ahli K3 hanya boleh punya satu penugasan aktif per order.
CREATE UNIQUE INDEX assignments_active_uq ON assignments(order_id, inspector_id)
  WHERE status IN ('MENUNGGU', 'DITERIMA');
CREATE INDEX assignments_inspector_idx ON assignments(inspector_id, status);
