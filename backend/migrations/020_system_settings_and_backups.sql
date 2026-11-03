-- 020_system_settings_and_backups.sql
-- Tabel konfigurasi sistem terpadu untuk Super Admin & rekam jejak backup database

CREATE TABLE IF NOT EXISTS system_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  description text,
  updated_by  uuid REFERENCES users(id),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS database_backups (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename         text NOT NULL,
  file_size_bytes  bigint NOT NULL DEFAULT 0,
  backup_type      text NOT NULL DEFAULT 'METADATA_AND_DATA',
  status           text NOT NULL DEFAULT 'SUCCESS',
  summary          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by       uuid REFERENCES users(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_database_backups_created ON database_backups(created_at DESC);

-- Data Awal Konfigurasi Sistem
INSERT INTO system_settings (key, value, description)
VALUES
  (
    'company_profile',
    '{
      "name": "PT Upaya Riksa Daya",
      "legal_name": "PT UPAYA RIKSA DAYA",
      "service_type": "Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PJK3)",
      "skp_pjk3": "560/URD/PJK3-RIKSALAP/2024",
      "address": "Jl. Pondasi No. 50B Kel. Kayu Putih Kec. Pulo Gadung Jakarta Timur 13210",
      "phone": "021-4891409, 4715699",
      "fax": "021-47865925",
      "email": "urd@upayariksadaya.com",
      "website": "www.upayariksadaya.com"
    }'::jsonb,
    'Profil resmi lembaga PJK3 PT Upaya Riksa Daya'
  ),
  (
    'auto_numbering',
    '{
      "po_prefix": "PO-URD",
      "po_pattern": "PO-URD-{YYYY}-{SEQ:4}",
      "bap_prefix": "BAP-URD",
      "bap_pattern": "BAP-URD-{YYYY}{MM}-{SEQ:4}",
      "lhpp_prefix": "LHPP-URD",
      "lhpp_pattern": "LHPP-URD-{CAT}-{YYYY}-{SEQ:4}",
      "suket_prefix": "560/URD/SUKET-K3",
      "suket_pattern": "560/URD/SUKET-K3/{YYYY}/{SEQ:4}"
    }'::jsonb,
    'Standar penomoran otomatis dokumen operasional'
  ),
  (
    'notification_channels',
    '{
      "whatsapp_enabled": true,
      "whatsapp_provider": "FONNTE",
      "whatsapp_sender_number": "081284567890",
      "email_enabled": true,
      "email_smtp_host": "smtp.gmail.com",
      "email_smtp_port": 587,
      "email_sender_name": "PT Upaya Riksa Daya - Riksa Uji K3",
      "email_sender_address": "notifikasi@upayariksadaya.com"
    }'::jsonb,
    'Konfigurasi gateway pengiriman WhatsApp dan Email SMTP'
  ),
  (
    'reminder_templates',
    '{
      "h30_subject": "Pemberitahuan Pengingat Riksa Uji K3 (H-30) - PT Upaya Riksa Daya",
      "h30_message": "Yth. Pimpinan / Bagian K3 {COMPANY_NAME},\n\nKami menginformasikan bahwa masa berlaku Suket K3 untuk unit {OBJECT_NAME} (No. Seri: {SERIAL_NUMBER}) akan berakhir pada {VALID_UNTIL} (30 hari lagi).\n\nUntuk menjamin keselamatan kerja dan kepatuhan terhadap regulasi ketenagakerjaan, mohon segera menjadwalkan pemeriksaan dan pengujian berkala bersama tim ahli K3 kami.\n\nTerima kasih,\nPT Upaya Riksa Daya",
      "h14_subject": "PERINGATAN PENTING: Masa Berlaku Suket K3 Berakhir dalam 14 Hari (H-14)",
      "h14_message": "PENTING: Yth. Bagian K3 {COMPANY_NAME},\n\nMasa berlaku Suket K3 unit {OBJECT_NAME} (No. Seri: {SERIAL_NUMBER}) tersisa 14 hari lagi s/d {VALID_UNTIL}.\n\nSilakan konfirmasi jadwal riksa uji perpanjangan agar operasional tidak terhenti.\n\nPT Upaya Riksa Daya",
      "h7_subject": "PERINGATAN MENDESAK: Masa Berlaku Suket K3 Berakhir dalam 7 Hari (H-7)",
      "h7_message": "MENDESAK: Yth. Bagian K3 {COMPANY_NAME},\n\nMasa berlaku Suket K3 unit {OBJECT_NAME} (No. Seri: {SERIAL_NUMBER}) akan berakhir dalam 7 HARI ({VALID_UNTIL}).\n\nHubungi tim marketing kami segera untuk penerbitan SPK/PO perpanjangan.\n\nPT Upaya Riksa Daya"
    }'::jsonb,
    'Template naskah pengingat berkala H-30, H-14, dan H-7'
  )
ON CONFLICT (key) DO NOTHING;

