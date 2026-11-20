-- Migrasi 035: Pastikan 1 PO Unit Alat = 1 BAP (Idempoten & Unik)
-- Menghilangkan duplikasi BAP per unit alat pada suatu Purchase Order

CREATE UNIQUE INDEX IF NOT EXISTS bap_documents_order_object_uq ON bap_documents (order_id, object_id);

