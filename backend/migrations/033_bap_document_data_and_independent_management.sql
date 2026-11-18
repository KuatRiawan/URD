-- Migration 033: BAP Document Data & Independent Management
-- Allows BAP-specific information edits without altering master PO, clients, or test_objects records.

ALTER TABLE bap_documents
  ADD COLUMN IF NOT EXISTS document_data JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Index for querying custom overrides
CREATE INDEX IF NOT EXISTS idx_bap_documents_document_data ON bap_documents USING gin (document_data);

