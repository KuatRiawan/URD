# Desain Database Relasional (PostgreSQL): PT Upaya Riksa Daya

Seluruh skema database didefinisikan dalam berkas migrasi SQL murni di `backend/migrations/` (`001_core.sql` s/d `005_lhpp_suket_reminders.sql`) dan diakses menggunakan driver `pg` dengan parameterized query (`$1, $2, ...`).

## 1. Daftar Tabel & Domain (24 Tabel)

### A. Domain Inti, Autentikasi & Audit (`001_core.sql`)
1. `schema_migrations`: Pencatatan versi migrasi SQL yang telah dijalankan.
2. `users`: Akun pengguna internal (`id`, `full_name`, `email` UNIQUE, `phone`, `password_hash`, `role` CHECK `ADMIN_SISTEM | ADMIN_KANTOR | AHLI_K3 | PIMPINAN`, `is_active`, `last_login_at`).
3. `refresh_sessions`: Penyimpanan sesi refresh token ber-rotasi (`id`, `user_id`, `token_hash` UNIQUE, `family_id`, `expires_at`, `revoked_at`, `replaced_by`).
4. `file_attachments`: Metadata berkas unggahan terproteksi (`id`, `original_name`, `stored_name`, `mime_type`, `size_bytes`, `storage_path`, `sha256_hash`, `uploaded_by`).
5. `notifications`: Notifikasi dalam aplikasi (`id`, `user_id`, `title`, `message`, `category`, `reference_type`, `reference_id`, `is_read`, `read_at`).
6. `audit_logs`: Jejak audit permanen (`id`, `actor_id`, `actor_email`, `actor_role`, `action`, `entity_type`, `entity_id`, `before_data` JSONB, `after_data` JSONB, `ip_address`, `user_agent`, `created_at`). Dilindungi oleh trigger PostgreSQL `trg_audit_logs_immutable` yang menolak operasi `UPDATE` dan `DELETE`.

### B. Domain Klien & Master Objek Uji K3 (`002_clients_objects.sql`)
7. `object_categories`: 7 kategori peralatan K3 (`PAA`, `PTP`, `PUBT`, `LIS`, `IPP`, `LE`, `IPK`) beserta dasar regulasi Kemnaker RI.
8. `clients`: Data perusahaan klien (`id`, `code` UNIQUE, `company_name`, `industry_sector`, `npwp`, `head_office_address`, `city`, `province`, `status`).
9. `client_locations`: Lokasi pabrik/site kerja klien (`id`, `client_id`, `location_name`, `address`, `city`, `province`, `latitude`, `longitude`, `is_primary`).
10. `client_contacts`: Kontak PIC klien (`id`, `client_id`, `location_id`, `full_name`, `job_title`, `email`, `phone`, `is_primary`).
11. `test_objects`: Master peralatan/objek uji (`id`, `client_id`, `location_id`, `category_id`, `asset_code`, `name`, `brand`, `model_type`, `serial_number`, `manufacture_year`, `country_of_origin`, `capacity`, `area_unit`, `technical_specs` JSONB, `qr_token` UNIQUE, `status`). Memiliki constraint `UNIQUE (client_id, serial_number)` untuk mencegah duplikasi nomor seri pada klien yang sama.

### C. Domain Order, Jadwal & Penugasan Ahli K3 (`003_orders_scheduling.sql`)
12. `inspectors`: Profil personel Ahli K3 (`id`, `user_id` UNIQUE, `employee_code` UNIQUE, `full_name`, `email`, `phone`, `skp_number`, `skp_expiry_date`, `is_active`).
13. `inspector_competencies`: Matriks sertifikat kompetensi Ahli K3 per kategori objek uji (`id`, `inspector_id`, `category_id`, `certificate_number`, `issued_date`, `expiry_date`, `status`), dengan `UNIQUE (inspector_id, category_id)`.
14. `orders`: Transaksi order riksa uji (`id`, `order_number` UNIQUE, `client_id`, `location_id`, `contact_id`, `service_type`, `source`, `renewal_from_suket_id`, `status`, `planned_start_date`, `planned_end_date`, `special_notes`).
15. `order_objects`: Relasi objek uji yang diperiksa dalam suatu order (`id`, `order_id`, `object_id`), dengan `UNIQUE (order_id, object_id)`.
16. `order_status_history`: Riwayat perubahan status order (`id`, `order_id`, `from_status`, `to_status`, `note`, `changed_by`).
17. `schedules`: Jadwal pelaksanaan lapangan (`id`, `order_id`, `location_id`, `start_time`, `end_time`, `status`, `notes`), dilengkapi indeks GiST pada `tstzrange(start_time, end_time)` untuk deteksi bentrok jadwal cepat.
18. `schedule_changes`: Log alasan perubahan jadwal/reschedule (`id`, `schedule_id`, `previous_start`, `previous_end`, `new_start`, `new_end`, `reason`, `changed_by`).
19. `assignments`: Penugasan Ahli K3 pada order & jadwal (`id`, `order_id`, `schedule_id`, `inspector_id`, `role_in_order`, `confirmation_status`, `rejection_reason`, `confirmed_at`, `assignment_letter_number`).

### D. Domain Pelaksanaan Inspeksi Digital (`004_inspections.sql`)
20. `inspection_templates`: Master template lembar kerja per kategori K3 (`id`, `category_id`, `code` UNIQUE, `name`, `regulation_reference`).
21. `inspection_template_versions`: Versi template lembar kerja (`id`, `template_id`, `version_number`, `is_validated`, `validated_by`, `validated_at`, `validation_notes`).
22. `inspection_template_items`: Parameter pemeriksaan & pengukuran dalam versi template (`id`, `template_version_id`, `section_name`, `item_code`, `label`, `input_type`, `unit`, `min_value`, `max_value`, `standard_reference`, `is_mandatory`, `sort_order`).
23. `inspections`: Transaksi lembar kerja inspeksi lapangan (`id`, `order_id`, `object_id`, `inspector_id`, `template_version_id`, `status`, `is_locked`, `inspection_date`, `latitude`, `longitude`, `weather_condition`, `overall_recommendation`, `summary_notes`, `submitted_at`, `locked_at`).
24. `inspection_results`: Nilai hasil pemeriksaan per item parameter (`id`, `inspection_id`, `template_item_id`, `choice_value`, `numeric_value`, `text_value`, `date_value`, `is_within_threshold`, `note`).
25. `inspection_findings`, `inspection_finding_photos`, `inspection_signatures`, `inspection_revisions`: Pencatatan temuan ketidaksesuaian, foto bukti, tanda tangan digital (`AHLI_K3` & `PERWAKILAN_KLIEN`), serta log pembukaan kunci revisi.

### E. Domain LHPP, Suket K3 & Pengingat (`005_lhpp_suket_reminders.sql`)
26. `lhpp_documents`: Dokumen Laporan Hasil Pemeriksaan dan Pengujian (`id`, `lhpp_number` UNIQUE, `inspection_id` UNIQUE, `order_id`, `client_id`, `object_id`, `inspector_id`, `status`, `revision_number`, `conclusion_text`, `technical_recommendations`, `disnaker_submission_date`, `disnaker_reference_number`, `qr_verification_token` UNIQUE, `approved_by`, `approved_at`, `return_notes`).
27. `lhpp_revisions` & `delivery_logs`: Riwayat revisi/approval LHPP dan bukti distribusi/serah terima ke klien.
28. `suket_documents`: Registri Surat Keterangan K3 (`id`, `suket_number` UNIQUE, `lhpp_id`, `order_id`, `client_id`, `object_id`, `issuing_authority`, `issued_date`, `expiry_date`, `status`, `scan_file_id`, `followup_status`, `renewal_order_id`).
29. `renewal_followups` & `reminder_dispatches`: Log komunikasi follow-up perpanjangan dan log pengiriman pengingat (`H90`, `H60`, `H30`, `H14`, `H0`) dengan constraint `UNIQUE (target_type, target_id, stage)` untuk mencegah duplikasi pengiriman.

