/**
 * URD — EXECUTION PHASE 1: END-TO-END UAT SIMULATION
 *
 * Skenario UAT Operasional PT Upaya Riksa Daya:
 * Klien: PT Demo UAT URD
 * PIC: Hendra Wijaya (HSE Manager)
 * PO: PO-URD-UAT-001
 *
 * 3 Unit Uji:
 * - Unit A: Overhead Crane 15T (Kategori: PAA) -> Sampai Selesai & Terdistribusi
 * - Unit B: Air Receiver Tank 2000L (Kategori: PUBT) -> Mengalami QC Return / Revisi lalu Resubmit
 * - Unit C: Genset 500 kVA (Kategori: PTP) -> Dibiarkan Belum Dijadwalkan (Buktikan Independensi Unit)
 *
 * Peran yang diuji:
 * - Marketing: Siti Rahmawati
 * - Admin Kantor: Rina Wahyuni
 * - Inspector A: Ir. Budi Santoso (Ahli K3 PAA & PUBT)
 * - Inspector B: Rizky Pratama (Ahli K3 PUBT & LIS)
 * - Inspector C: Inspector Kedaluwarsa (Non-kompeten)
 * - Pimpinan: Kuat Riawan (Read-Only)
 * - Super Admin: Administrator Sistem
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pool } from '../database/pool.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import bcrypt from 'bcryptjs';

describe('URD Phase 1: End-to-End Operational UAT Test Suite', () => {
  const TEST_PW = 'UATPass@2026';
  let pwHash;

  // Tokens & User IDs
  const tokens = {};
  const userIds = {};
  let catMap = {};

  // UAT Entities
  let clientId;
  let _contactId;
  let unitAId; // Overhead Crane 15T (PAA)
  let unitBId; // Air Receiver Tank 2000L (PUBT)
  let unitCId; // Genset 500 kVA (PTP)
  let orderId;
  let asgAId;
  let asgBId;
  let inspectionAId;
  let inspectionBId;
  let lhppAId;
  let lhppANo;
  let bapAId;
  let suketAId;
  let distributionAId;

  const DUMMY_SIGNATURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  function signToken(user) {
    return jwt.sign(
      { sub: user.id, email: user.email, role: user.role, fullName: user.full_name },
      env.jwtSecret,
      { expiresIn: '2h' }
    );
  }

  beforeAll(async () => {
    pwHash = await bcrypt.hash(TEST_PW, 6);

    // Pastikan master data kategori K3 termuat
    const { rows: cats } = await pool.query('SELECT id, code FROM object_categories');
    catMap = Object.fromEntries(cats.map(c => [c.code, c.id]));

    // Bersihkan data transaksi uji spesifik jika ada dari run sebelumnya (urutan aman cascade FK)
    await pool.query(`
      UPDATE orders SET renewal_of_suket = NULL WHERE po_number LIKE 'PO-URD-UAT%' OR client_id IN (SELECT id FROM clients WHERE name = 'PT Demo UAT URD');
      DELETE FROM client_reminder_log WHERE object_id IN (SELECT id FROM test_objects WHERE client_id IN (SELECT id FROM clients WHERE name = 'PT Demo UAT URD'));
      DELETE FROM renewal_followups WHERE object_id IN (SELECT id FROM test_objects WHERE client_id IN (SELECT id FROM clients WHERE name = 'PT Demo UAT URD'));
      DELETE FROM operational_issues WHERE order_id IN (SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001');
      DELETE FROM order_revisions WHERE order_id IN (SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001');
      DELETE FROM lhpp_revisions WHERE lhpp_id IN (
        SELECT id FROM lhpp_documents WHERE inspection_id IN (
          SELECT id FROM inspections WHERE order_id IN (
            SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001'
          )
        )
      );
      DELETE FROM document_distributions WHERE order_id IN (SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001');
      DELETE FROM suket_documents WHERE object_id IN (
        SELECT id FROM test_objects WHERE client_id IN (SELECT id FROM clients WHERE name = 'PT Demo UAT URD')
      );
      DELETE FROM bap_revisions WHERE bap_id IN (
        SELECT id FROM bap_documents WHERE inspection_id IN (
          SELECT id FROM inspections WHERE order_id IN (
            SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001'
          )
        )
      );
      DELETE FROM bap_documents WHERE inspection_id IN (
        SELECT id FROM inspections WHERE order_id IN (
          SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001'
        )
      );
      DELETE FROM lhpp_documents WHERE inspection_id IN (
        SELECT id FROM inspections WHERE order_id IN (
          SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001'
        )
      );
      DELETE FROM inspection_signatures WHERE inspection_id IN (
        SELECT id FROM inspections WHERE order_id IN (
          SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001'
        )
      );
      DELETE FROM inspection_findings WHERE inspection_id IN (
        SELECT id FROM inspections WHERE order_id IN (
          SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001'
        )
      );
      DELETE FROM inspection_results WHERE inspection_id IN (
        SELECT id FROM inspections WHERE order_id IN (
          SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001'
        )
      );
      DELETE FROM inspection_revisions WHERE inspection_id IN (
        SELECT id FROM inspections WHERE order_id IN (
          SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001'
        )
      );
      DELETE FROM inspections WHERE order_id IN (SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001');
      DELETE FROM assignments WHERE order_id IN (SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001');
      DELETE FROM schedules WHERE order_id IN (SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001');
      DELETE FROM order_objects WHERE order_id IN (SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001');
      DELETE FROM order_status_history WHERE order_id IN (SELECT id FROM orders WHERE po_number = 'PO-URD-UAT-001');
      DELETE FROM orders WHERE po_number = 'PO-URD-UAT-001';
      DELETE FROM client_portal_tokens WHERE client_id IN (SELECT id FROM clients WHERE name = 'PT Demo UAT URD');
      DELETE FROM client_locations WHERE client_id IN (SELECT id FROM clients WHERE name = 'PT Demo UAT URD');
      DELETE FROM client_contacts WHERE client_id IN (SELECT id FROM clients WHERE name = 'PT Demo UAT URD');
      DELETE FROM test_objects WHERE client_id IN (SELECT id FROM clients WHERE name = 'PT Demo UAT URD');
      DELETE FROM clients WHERE name = 'PT Demo UAT URD';
    `);

    // Siapkan akun-akun peran UAT
    const usersToUpsert = [
      { email: 'admin.sistem.uat@upayariksadaya.com', name: 'Super Admin UAT', role: 'ADMIN_SISTEM', key: 'ADMIN_SISTEM' },
      { email: 'marketing.uat@upayariksadaya.com', name: 'Siti Rahmawati (Marketing)', role: 'MARKETING', key: 'MARKETING' },
      { email: 'admin.kantor.uat@upayariksadaya.com', name: 'Rina Wahyuni (Admin Kantor)', role: 'ADMIN_KANTOR', key: 'ADMIN_KANTOR' },
      { email: 'inspector.a.uat@upayariksadaya.com', name: 'Ir. Budi Santoso (Ahli K3 PAA)', role: 'INSPECTOR', key: 'INSPECTOR_A' },
      { email: 'inspector.b.uat@upayariksadaya.com', name: 'Rizky Pratama (Ahli K3 PUBT)', role: 'INSPECTOR', key: 'INSPECTOR_B' },
      { email: 'inspector.expired.uat@upayariksadaya.com', name: 'Deni Expired (Non-Kompeten)', role: 'INSPECTOR', key: 'INSPECTOR_EXPIRED' },
      { email: 'pimpinan.uat@upayariksadaya.com', name: 'Kuat Riawan (Pimpinan)', role: 'PIMPINAN', key: 'PIMPINAN' }
    ];

    for (const u of usersToUpsert) {
      const { rows } = await pool.query(
        `INSERT INTO users (email, full_name, role, password_hash, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash, is_active = true
         RETURNING id, email, full_name, role`,
        [u.email, u.name, u.role, pwHash]
      );
      const user = rows[0];
      userIds[u.key] = user.id;
      tokens[u.key] = signToken(user);

      // Pastikan tabel inspectors memiliki baris
      if (['INSPECTOR', 'AHLI_K3'].includes(user.role)) {
        await pool.query(
          `INSERT INTO inspectors (user_id)
           VALUES ($1)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.id]
        );
      }
    }

    // Set kompetensi Inspector A: PAA dan PUBT aktif sampai 2028
    await pool.query('DELETE FROM inspector_competencies WHERE inspector_id = $1', [userIds.INSPECTOR_A]);
    await pool.query(
      `INSERT INTO inspector_competencies (inspector_id, category_id, certificate_no, valid_from, valid_until)
       VALUES ($1, $2, 'SKP-UAT-PAA-001', '2024-01-01', '2028-12-31'),
              ($1, $3, 'SKP-UAT-PUBT-001', '2024-01-01', '2028-12-31')`,
      [userIds.INSPECTOR_A, catMap.PAA, catMap.PUBT]
    );

    // Set kompetensi Inspector B: PUBT dan LIS aktif sampai 2028
    await pool.query('DELETE FROM inspector_competencies WHERE inspector_id = $1', [userIds.INSPECTOR_B]);
    await pool.query(
      `INSERT INTO inspector_competencies (inspector_id, category_id, certificate_no, valid_from, valid_until)
       VALUES ($1, $2, 'SKP-UAT-PUBT-002', '2024-01-01', '2028-12-31'),
              ($1, $3, 'SKP-UAT-LIS-002', '2024-01-01', '2028-12-31')`,
      [userIds.INSPECTOR_B, catMap.PUBT, catMap.LIS]
    );

    // Set kompetensi Inspector Expired: PAA kedaluwarsa pada 2023
    await pool.query('DELETE FROM inspector_competencies WHERE inspector_id = $1', [userIds.INSPECTOR_EXPIRED]);
    await pool.query(
      `INSERT INTO inspector_competencies (inspector_id, category_id, certificate_no, valid_from, valid_until)
       VALUES ($1, $2, 'SKP-UAT-PAA-EXPIRED', '2020-01-01', '2023-01-01')`,
      [userIds.INSPECTOR_EXPIRED, catMap.PAA]
    );
  });

  afterAll(async () => {
    // Teardown handled by process exit
  });

  // ===========================================================================
  // TAHAP 1 — MARKETING (Alur Komersial & Pendaftaran Unit PO)
  // ===========================================================================
  describe('Tahap 1 — Marketing: Registrasi Klien, PIC, Objek & Pembuatan PO', () => {
    it('1.1 Marketing login dan menerima token JWT valid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'marketing.uat@upayariksadaya.com', password: TEST_PW });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('MARKETING');
    });

    it('1.2 Marketing membuat klien baru "PT Demo UAT URD"', async () => {
      const res = await request(app)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${tokens.MARKETING}`)
        .send({
          name: 'PT Demo UAT URD',
          address: 'Kawasan Industri MM2100 Blok C-12, Cikarang, Bekasi',
          city: 'Bekasi',
          postalCode: '17530',
          phone: '021-89901234',
          email: 'contact@demouaturd.co.id',
          npwp: '01.234.567.8-012.000',
          industrySector: 'Manufaktur Alat Berat'
        });

      expect(res.status).toBe(201);
      expect(res.body.client.id).toBeDefined();
      expect(res.body.client.name).toBe('PT Demo UAT URD');
      clientId = res.body.client.id;
    });

    it('1.3 Marketing menambahkan PIC Klien (Hendra Wijaya - HSE Manager)', async () => {
      const res = await request(app)
        .post(`/api/v1/clients/${clientId}/contacts`)
        .set('Authorization', `Bearer ${tokens.MARKETING}`)
        .send({
          name: 'Hendra Wijaya',
          position: 'HSE Manager',
          phone: '081298765432',
          email: 'hendra@demouaturd.co.id'
        });

      expect(res.status).toBe(201);
      expect(res.body.contact.id).toBeDefined();
      expect(res.body.contact.name).toBe('Hendra Wijaya');
      _contactId = res.body.contact.id;
    });

    it('1.4 Marketing menambahkan 3 Unit Objek Uji ke Klien', async () => {
      // Unit A: Overhead Crane 15T (PAA)
      const resA = await request(app)
        .post('/api/v1/objects')
        .set('Authorization', `Bearer ${tokens.MARKETING}`)
        .send({
          clientId,
          categoryId: catMap.PAA,
          name: 'Overhead Crane 15T',
          serialNumber: 'CRN-UAT-001',
          brand: 'Mitsubishi',
          model: 'OHC-15TON',
          capacity: '15 Ton',
          installLocation: 'Workshop Bay 3'
        });
      expect(resA.status).toBe(201);
      unitAId = resA.body.object.id;

      // Unit B: Air Receiver Tank 2000L (PUBT)
      const resB = await request(app)
        .post('/api/v1/objects')
        .set('Authorization', `Bearer ${tokens.MARKETING}`)
        .send({
          clientId,
          categoryId: catMap.PUBT,
          name: 'Air Receiver Tank 2000L',
          serialNumber: 'TNK-UAT-002',
          brand: 'PressurePro',
          model: 'ART-2000',
          capacity: '2000 Liter',
          installLocation: 'Compressor House A'
        });
      expect(resB.status).toBe(201);
      unitBId = resB.body.object.id;

      // Unit C: Genset 500 kVA (PTP)
      const resC = await request(app)
        .post('/api/v1/objects')
        .set('Authorization', `Bearer ${tokens.MARKETING}`)
        .send({
          clientId,
          categoryId: catMap.PTP,
          name: 'Genset 500 kVA',
          serialNumber: 'GEN-UAT-003',
          brand: 'Cummins',
          model: 'QSK19-G4',
          capacity: '500 kVA',
          installLocation: 'Power House Utility'
        });
      expect(resC.status).toBe(201);
      unitCId = resC.body.object.id;
    });

    it('1.5 Marketing membuat PO komersial dengan 3 unit (PO-URD-UAT-001)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokens.MARKETING}`)
        .send({
          clientId,
          serviceType: 'PEMERIKSAAN_PERTAMA',
          source: 'DOKUMEN_PO',
          poNumber: 'PO-URD-UAT-001',
          poDate: '2026-11-02',
          notes: 'Pemeriksaan rutin K3 tahunan 3 unit pabrik',
          objectIds: [unitAId, unitBId, unitCId]
        });

      expect(res.status).toBe(201);
      expect(res.body.order.id).toBeDefined();
      expect(res.body.order.po_number).toBe('PO-URD-UAT-001');
      orderId = res.body.order.id;
    });

    it('1.6 Verifikasi data tersimpan di PostgreSQL dan unit memiliki status BELUM_DIJADWALKAN', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${tokens.MARKETING}`);

      expect(res.status).toBe(200);
      expect(res.body.objects).toHaveLength(3);
      for (const obj of res.body.objects) {
        expect(obj.unit_status).toBe('BELUM_DIJADWALKAN');
      }
    });

    it('1.7 Segregasi Peran: Akses Marketing ke QC, LHPP, BAP & Distribusi DITOLAK (403)', async () => {
      // Coba akses finalisasi LHPP
      const resLhpp = await request(app)
        .post('/api/v1/lhpp/00000000-0000-0000-0000-000000000000/finalize')
        .set('Authorization', `Bearer ${tokens.MARKETING}`)
        .send({ note: 'Marketing bypass' });
      expect(resLhpp.status).toBe(403);

      // Coba akses finalisasi BAP
      const resBap = await request(app)
        .post('/api/v1/bap/00000000-0000-0000-0000-000000000000/finalize')
        .set('Authorization', `Bearer ${tokens.MARKETING}`)
        .send({ notes: 'Marketing bypass' });
      expect(resBap.status).toBe(403);

      // Coba akses distribusi dokumen
      const resDist = await request(app)
        .post('/api/v1/distributions')
        .set('Authorization', `Bearer ${tokens.MARKETING}`)
        .send({ orderId, objectId: unitAId });
      expect(resDist.status).toBe(403);
    });
  });

  // ===========================================================================
  // TAHAP 2 — PENJADWALAN & VALIDASI KOMPETENSI (Admin Kantor)
  // ===========================================================================
  describe('Tahap 2 — Penjadwalan & Validasi Kompetensi oleh Admin Kantor', () => {
    it('2.1 Admin Kantor menetapkan tanggal rentang jadwal inspeksi PO', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${orderId}/schedule`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          startAt: '2026-11-15T08:00:00.000Z',
          endAt: '2026-11-15T17:00:00.000Z',
          notes: 'Jadwal pemeriksaan riksa uji unit di Cikarang'
        });

      expect(res.status).toBe(200);
      expect(res.body.schedule.order_id).toBe(orderId);
    });

    it('2.2 Validasi Kompetensi: Menolak penugasan Inspector dengan sertifikat kedaluwarsa / non-kompeten', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${orderId}/assignments`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          objectId: unitAId, // Kategori PAA
          inspectorIds: [userIds.INSPECTOR_EXPIRED]
        });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('COMPETENCY_INVALID');
    });

    it('2.3 Deteksi Konflik Jadwal: Menolak penugasan jika Inspector telah memiliki jadwal di order lain', async () => {
      // 1. Buat order kedua dengan jadwal identik
      const { rows: o2Rows } = await pool.query(
        `INSERT INTO orders (client_id, service_type, source, order_no, po_number, status, created_by)
         VALUES ($1, 'PEMERIKSAAN_PERTAMA', 'DOKUMEN_PO', 'ORD-CONFLICT-TEST', 'PO-CONFLICT-TEST', 'TERDAFTAR', $2)
         RETURNING id`,
        [clientId, userIds.MARKETING]
      );
      const confOrderId = o2Rows[0].id;

      await pool.query(
        `INSERT INTO schedules (order_id, start_at, end_at, notes, created_by)
         VALUES ($1, '2026-11-15T08:00:00.000Z', '2026-11-15T17:00:00.000Z', 'Jadwal tumpang tindih', $2)`,
        [confOrderId, userIds.ADMIN_KANTOR]
      );

      // Kaitkan unit PAA ke order kedua
      await pool.query(
        "INSERT INTO order_objects (order_id, object_id, unit_status) VALUES ($1, $2, 'TERJADWAL')",
        [confOrderId, unitAId]
      );

      // Tugaskan Inspector A ke order kedua
      await pool.query(
        `INSERT INTO assignments (order_id, inspector_id, status, assigned_by)
         VALUES ($1, $2, 'DITERIMA', $3)`,
        [confOrderId, userIds.INSPECTOR_A, userIds.ADMIN_KANTOR]
      );

      // 2. Sekarang coba tugaskan Inspector A ke orderId pada rentang waktu yang sama
      const res = await request(app)
        .post(`/api/v1/orders/${orderId}/assignments`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          objectId: unitAId,
          inspectorIds: [userIds.INSPECTOR_A]
        });

      expect(res.status).toBe(409);
      expect(res.body.error?.code).toBe('SCHEDULE_CONFLICT');

      // Bersihkan data bentrok buatan
      await pool.query('DELETE FROM orders WHERE id = $1', [confOrderId]);
    });

    it('2.4 Admin Kantor menugaskan Inspector yang kompeten: Unit A -> Inspector A, Unit B -> Inspector B', async () => {
      // Tugaskan Inspector A untuk Unit A (Overhead Crane - PAA)
      const resA = await request(app)
        .post(`/api/v1/orders/${orderId}/assignments`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          objectId: unitAId,
          inspectorIds: [userIds.INSPECTOR_A]
        });
      expect(resA.status).toBe(201);
      asgAId = resA.body.assignments[0].id;

      // Tugaskan Inspector B untuk Unit B (Air Receiver Tank - PUBT)
      const resB = await request(app)
        .post(`/api/v1/orders/${orderId}/assignments`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          objectId: unitBId,
          inspectorIds: [userIds.INSPECTOR_B]
        });
      expect(resB.status).toBe(201);
      asgBId = resB.body.assignments[0].id;
    });

    it('2.5 Verifikasi Status Independen: Unit A & B "DITUGASKAN", Unit C tetap "BELUM_DIJADWALKAN" / "TERJADWAL"', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);

      expect(res.status).toBe(200);
      const objects = res.body.objects;
      const objA = objects.find(o => o.id === unitAId);
      const objB = objects.find(o => o.id === unitBId);
      const objC = objects.find(o => o.id === unitCId);

      expect(objA.unit_status).toBe('DITUGASKAN');
      expect(objB.unit_status).toBe('DITUGASKAN');
      expect(['BELUM_DIJADWALKAN', 'TERJADWAL']).toContain(objC.unit_status);
      expect(res.body.order.status).toBe('DITUGASKAN');
    });
  });

  // ===========================================================================
  // TAHAP 3 — PELAKSANAAN INSPEKSI LAPANGAN (Inspector A & Inspector B)
  // ===========================================================================
  describe('Tahap 3 — Pelaksanaan Inspeksi Lapangan, Checklist Dinamis, Bukti Foto & TTD Digital', () => {
    it('3.1 Inspector A & B menerima penugasan masing-masing', async () => {
      const resA = await request(app)
        .post(`/api/v1/orders/${orderId}/assignments/${asgAId}/respond`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
        .send({ decision: 'DITERIMA' });
      expect(resA.status).toBe(200);

      const resB = await request(app)
        .post(`/api/v1/orders/${orderId}/assignments/${asgBId}/respond`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
        .send({ decision: 'DITERIMA' });
      expect(resB.status).toBe(200);
    });

    it('3.2 Inspector A memulai inspeksi Unit A (Overhead Crane) & Inspector B memulai Unit B (Tank)', async () => {
      const resA = await request(app)
        .post('/api/v1/inspections/start')
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
        .send({ orderId, objectId: unitAId });
      expect(resA.status).toBe(201);
      inspectionAId = resA.body.inspection.id;

      const resB = await request(app)
        .post('/api/v1/inspections/start')
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
        .send({ orderId, objectId: unitBId });
      expect(resB.status).toBe(201);
      inspectionBId = resB.body.inspection.id;
    });

    it('3.3 Keamanan Akses: Inspector A DITOLAK saat mencoba membuka/mengedit inspeksi milik Inspector B', async () => {
      // Read access ditolak
      const readRes = await request(app)
        .get(`/api/v1/inspections/${inspectionBId}`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`);
      expect(readRes.status).toBe(403);

      // Write access ditolak
      const writeRes = await request(app)
        .put(`/api/v1/inspections/${inspectionBId}/draft`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
        .send({ results: [] });
      expect(writeRes.status).toBe(403);
    });

    it('3.4 Inspector A mengisi checklist Unit A (PAA), tanda tangan & submit -> Lolos Memenuhi Syarat', async () => {
      // Ambil template items untuk Unit A
      const detailRes = await request(app)
        .get(`/api/v1/inspections/${inspectionAId}`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`);
      expect(detailRes.status).toBe(200);
      const items = detailRes.body.items;

      const results = items.map(item => ({
        itemId: item.id,
        choiceValue: 'SESUAI',
        textValue: 'Kondisi baik dan terawat',
        note: 'Pemeriksaan visual & fungsi normal'
      }));

      // Simpan draft
      const draftRes = await request(app)
        .put(`/api/v1/inspections/${inspectionAId}/draft`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
        .send({
          conclusion: 'MEMENUHI_SYARAT',
          conclusionNotes: 'Overhead Crane 15T laik operasi sesuai Permenaker No. 08/2020.',
          results
        });
      expect(draftRes.status).toBe(200);

      // Tambahkan tanda tangan Inspector
      const sigInsp = await request(app)
        .post(`/api/v1/inspections/${inspectionAId}/signatures`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
        .send({
          signerRole: 'AHLI_K3',
          signerName: 'Ir. Budi Santoso',
          dataUrl: DUMMY_SIGNATURE
        });
      expect(sigInsp.status).toBe(201);

      // Tambahkan tanda tangan PIC Klien
      const sigClient = await request(app)
        .post(`/api/v1/inspections/${inspectionAId}/signatures`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
        .send({
          signerRole: 'PERWAKILAN_KLIEN',
          signerName: 'Hendra Wijaya',
          dataUrl: DUMMY_SIGNATURE
        });
      expect(sigClient.status).toBe(201);

      // Submit inspeksi
      const submitRes = await request(app)
        .post(`/api/v1/inspections/${inspectionAId}/submit`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
        .send({
          scopeItems: ['Pemeriksaan Visual Struktur', 'Pengujian Beban Defleksi', 'Uji Fungsi Safety Device']
        });
      expect(submitRes.status).toBe(200);
    });

    it('3.5 Inspector B mengisi Unit B (PUBT) dengan temuan "TIDAK_SESUAI", tanda tangan & submit', async () => {
      // Ambil template items untuk Unit B
      const detailRes = await request(app)
        .get(`/api/v1/inspections/${inspectionBId}`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`);
      const items = detailRes.body.items;

      const results = items.map((item, idx) => ({
        itemId: item.id,
        choiceValue: idx === 0 ? 'TIDAK_SESUAI' : 'SESUAI',
        textValue: idx === 0 ? 'Safety valve belum dikalibrasi ulang' : 'Visual shell baik',
        note: idx === 0 ? 'Masa berlaku kalibrasi safety valve habis' : null
      }));

      await request(app)
        .put(`/api/v1/inspections/${inspectionBId}/draft`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
        .send({
          conclusion: 'MEMENUHI_SYARAT_DENGAN_CATATAN',
          conclusionNotes: 'Air Receiver Tank memerlukan kalibrasi safety valve sebelum izin terbit.',
          results
        });

      // Tambahkan temuan ketidaksesuaian
      await request(app)
        .post(`/api/v1/inspections/${inspectionBId}/findings`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
        .send({
          itemSeq: 1,
          severity: 'SEDANG',
          description: 'Safety valve belum dikalibrasi berkala',
          recommendation: 'Lakukan kalibrasi safety valve oleh bengkel bersertifikat'
        });

      // TTD
      await request(app)
        .post(`/api/v1/inspections/${inspectionBId}/signatures`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
        .send({
          signerRole: 'AHLI_K3',
          signerName: 'Rizky Pratama',
          dataUrl: DUMMY_SIGNATURE
        });

      await request(app)
        .post(`/api/v1/inspections/${inspectionBId}/signatures`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
        .send({
          signerRole: 'PERWAKILAN_KLIEN',
          signerName: 'Hendra Wijaya',
          dataUrl: DUMMY_SIGNATURE
        });

      // Submit inspeksi Unit B
      const submitRes = await request(app)
        .post(`/api/v1/inspections/${inspectionBId}/submit`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
        .send({
          scopeItems: ['Pemeriksaan Visual Shell & Head', 'Pengukuran Ketebalan Ultrasonik', 'Uji Tekan Hidrostastik']
        });
      expect(submitRes.status).toBe(200);
    });

    it('3.6 Verifikasi Unit C tetap tidak tersentuh (BELUM_DIJADWALKAN / TERJADWAL)', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);

      const objC = res.body.objects.find(o => o.id === unitCId);
      expect(['BELUM_DIJADWALKAN', 'TERJADWAL']).toContain(objC.unit_status);
      expect(objC.unit_inspector_id || objC.inspector_id).toBeFalsy();
    });
  });

  // ===========================================================================
  // TAHAP 4 — QC & ADMINISTRASI DOKUMEN (Admin Kantor)
  // ===========================================================================
  describe('Tahap 4 — QC & Penerbitan Dokumen (LHPP, BAP, Suket, QR & Revisi)', () => {
    it('4.1 Admin Kantor memverifikasi Unit A lolos QC, memfinalisasi LHPP & BAP', async () => {
      // Ambil ID LHPP Unit A
      const { rows: lhppRows } = await pool.query(
        'SELECT id FROM lhpp_documents WHERE inspection_id = $1',
        [inspectionAId]
      );
      expect(lhppRows[0]).toBeDefined();
      lhppAId = lhppRows[0].id;

      // Finalisasi LHPP Unit A
      const finLhppRes = await request(app)
        .post(`/api/v1/lhpp/${lhppAId}/finalize`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({ note: 'Hasil QC teknis lengkap dan sesuai standar K3' });
      expect(finLhppRes.status).toBe(200);
      expect(finLhppRes.body.lhpp.lhpp_no).toBeDefined();
      lhppANo = finLhppRes.body.lhpp.lhpp_no;

      // Ambil ID BAP Unit A
      const { rows: bapRows } = await pool.query(
        'SELECT id FROM bap_documents WHERE inspection_id = $1',
        [inspectionAId]
      );
      expect(bapRows[0]).toBeDefined();
      bapAId = bapRows[0].id;

      // Finalisasi BAP Unit A
      const finBapRes = await request(app)
        .post(`/api/v1/bap/${bapAId}/finalize`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({ notes: 'BAP resmi disetujui bersama klien' });
      expect(finBapRes.status).toBe(200);
    });

    it('4.2 Admin Kantor menerbitkan Suket Disnaker untuk Unit A dengan kode QR', async () => {
      const suketRes = await request(app)
        .post('/api/v1/suket')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          objectId: unitAId,
          lhppId: lhppAId,
          suketNo: '566/123/DISNAKER-BKS/PAA/2026',
          status: 'TERBIT',
          issuedDate: '2026-11-16',
          validUntil: '2027-11-16',
          issuer: 'Dinas Tenaga Kerja dan Transmigrasi Kabupaten Bekasi',
          statusNotes: 'Suket resmi disahkan'
        });

      expect(suketRes.status).toBe(201);
      expect(suketRes.body.suket.suket_no).toBe('566/123/DISNAKER-BKS/PAA/2026');
      suketAId = suketRes.body.suket.id;
    });

    it('4.3 Alur Revisi Unit B: Admin Kantor mengembalikan LHPP Unit B dengan catatan perbaikan', async () => {
      const { rows: lhppBRows } = await pool.query(
        'SELECT id FROM lhpp_documents WHERE inspection_id = $1',
        [inspectionBId]
      );
      const lhppBId = lhppBRows[0].id;

      // Admin Kantor mengembalikan LHPP Unit B
      const returnRes = await request(app)
        .post(`/api/v1/lhpp/${lhppBId}/return`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          note: 'Mohon lampirkan sertifikat kalibrasi safety valve yang terbaru dan perbaiki foto plate tank.'
        });
      expect(returnRes.status).toBe(200);
      expect(returnRes.body.lhpp.status).toBe('DIKEMBALIKAN');

      // Status Unit B otomatis menjadi PERLU_REVISI
      const { rows: unitBRows } = await pool.query(
        'SELECT unit_status FROM order_objects WHERE order_id = $1 AND object_id = $2',
        [orderId, unitBId]
      );
      expect(unitBRows[0].unit_status).toBe('PERLU_REVISI');
    });

    it('4.4 Inspector B membuka revisi Unit B, memperbaiki data teknis & submit ulang', async () => {
      // Reopen inspection form
      const reopenRes = await request(app)
        .post(`/api/v1/inspections/${inspectionBId}/reopen`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
        .send({
          reason: 'Melampirkan sertifikat kalibrasi safety valve dan foto nameplate baru sesuai arahan QC'
        });
      expect(reopenRes.status).toBe(200);
      expect(reopenRes.body.inspection.status).toBe('DRAF');

      // Update temuan menjadi teratasi / diperbaiki
      await request(app)
        .put(`/api/v1/inspections/${inspectionBId}/draft`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
        .send({
          conclusion: 'MEMENUHI_SYARAT',
          conclusionNotes: 'Safety valve telah dikalibrasi ulang oleh bengkel resmi (Sertifikat No. CAL-SV-2026-99).',
          results: []
        });

      // Submit kembali form inspeksi Unit B
      const resubmitRes = await request(app)
        .post(`/api/v1/inspections/${inspectionBId}/submit`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
        .send({
          scopeItems: ['Pemeriksaan Visual Shell & Head', 'Pengukuran Ketebalan Ultrasonik', 'Uji Tekan Hidrostastik']
        });
      expect(resubmitRes.status).toBe(200);
    });

    it('4.5 Independensi Terbukti: Dokumen Unit A siap distribusi tanpa harus menunggu Unit B atau C selesai', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);

      const objA = res.body.objects.find(o => o.id === unitAId);
      const objB = res.body.objects.find(o => o.id === unitBId);
      const objC = res.body.objects.find(o => o.id === unitCId);

      // Unit A sudah melewati BAP_FINAL / LHPP_TERBIT / SIAP_DISTRIBUSI
      expect(['BAP_FINAL', 'LHPP_TERBIT', 'SIAP_DISTRIBUSI', 'SELESAI']).toContain(objA.unit_status);
      // Unit B baru selesai re-submit (BAP_DRAF / LHPP_SIAP_PREVIEW / MENUNGGU_REVIEW)
      expect(['BAP_DRAF', 'FORM_TERKIRIM', 'PERLU_REVISI', 'LHPP_SIAP_PREVIEW', 'MENUNGGU_REVIEW']).toContain(objB.unit_status);
      // Unit C tetap belum dijadwalkan
      expect(['BELUM_DIJADWALKAN', 'TERJADWAL']).toContain(objC.unit_status);
    });
  });

  // ===========================================================================
  // TAHAP 5 — DISTRIBUSI DOKUMEN & BAST (Admin Kantor)
  // ===========================================================================
  describe('Tahap 5 — Distribusi Dokumen Unit A (LHPP, BAP, Suket, BAST) ke Klien', () => {
    it('5.1 Admin Kantor memproses distribusi dokumen LHPP Unit A via Email & Kurir Fisik (BAST)', async () => {
      const distRes = await request(app)
        .post('/api/v1/distributions')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          documentType: 'LHPP',
          documentId: lhppAId,
          documentNo: lhppANo,
          orderId,
          objectId: unitAId,
          targetDestination: 'KLIEN',
          recipientName: 'Hendra Wijaya (HSE Manager)',
          dispatchMedia: 'KURIR_FISIK',
          trackingReference: 'BAST-URD-2026-001',
          status: 'DIKIRIM',
          notes: 'Dokumen fisik LHPP, BAP, dan Suket Asli dikirimkan dengan BAST terlampir'
        });

      expect(distRes.status).toBe(201);
      expect(distRes.body.distribution.id).toBeDefined();
      distributionAId = distRes.body.distribution.id;
    });

    it('5.2 Admin Kantor mengonfirmasi tanda terima dokumen (Status: DITERIMA / SELESAI)', async () => {
      const updRes = await request(app)
        .patch(`/api/v1/distributions/${distributionAId}/status`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          status: 'DITERIMA',
          trackingReference: 'BAST-URD-2026-001-SIGNED',
          notes: 'BAST fisik telah ditandatangani dan diterima oleh PIC Klien'
        });

      expect(updRes.status).toBe(200);
      expect(updRes.body.distribution.status).toBe('DITERIMA');

      // Tandai unit A sebagai SELESAI
      await request(app)
        .patch(`/api/v1/orders/${orderId}/units/${unitAId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          unitStatus: 'SELESAI',
          unitNotes: 'Dokumen lengkap telah diterima klien dengan BAST'
        });

      const { rows } = await pool.query(
        'SELECT unit_status FROM order_objects WHERE order_id = $1 AND object_id = $2',
        [orderId, unitAId]
      );
      expect(rows[0].unit_status).toBe('SELESAI');
    });

    it('5.3 Admin Kantor mencetak Berita Acara Serah Terima (BAST PDF - Dokumen #7 PRD)', async () => {
      const bastOrderRes = await request(app)
        .get(`/api/v1/orders/${orderId}/bast.pdf`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);

      expect(bastOrderRes.status).toBe(200);
      expect(bastOrderRes.headers['content-type']).toContain('application/pdf');
      expect(bastOrderRes.body.subarray(0, 5).toString()).toBe('%PDF-');

      const bastDistRes = await request(app)
        .get(`/api/v1/distributions/orders/${orderId}/bast/pdf`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);

      expect(bastDistRes.status).toBe(200);
      expect(bastDistRes.headers['content-type']).toContain('application/pdf');
      expect(bastDistRes.body.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('5.4 Admin Kantor mencetak Stiker QR Code Objek & Suket (Dokumen #6 PRD)', async () => {
      const objQrRes = await request(app)
        .get(`/api/v1/objects/${unitAId}/qr-sticker.pdf`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);

      expect(objQrRes.status).toBe(200);
      expect(objQrRes.headers['content-type']).toContain('application/pdf');
      expect(objQrRes.body.subarray(0, 5).toString()).toBe('%PDF-');

      const suketQrRes = await request(app)
        .get(`/api/v1/suket/${suketAId}/qr-sticker.pdf`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);

      expect(suketQrRes.status).toBe(200);
      expect(suketQrRes.headers['content-type']).toContain('application/pdf');
      expect(suketQrRes.body.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('5.5 Unduh Lembar Temuan & Rekomendasi K3 (Dokumen #3 PRD Corrective Action Notice)', async () => {
      const recRes = await request(app)
        .get(`/api/v1/inspections/${inspectionBId}/recommendation-letter.pdf`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);

      expect(recRes.status).toBe(200);
      expect(recRes.headers['content-type']).toContain('application/pdf');
      expect(recRes.body.subarray(0, 5).toString()).toBe('%PDF-');
    });
  });

  // ===========================================================================
  // TAHAP 6 — PIMPINAN / MANAGEMENT REVIEW (Strict Read-Only)
  // ===========================================================================
  describe('Tahap 6 — Pimpinan Monitoring & Strict Read-Only Verification', () => {
    it('6.1 Pimpinan dapat melihat ringkasan order dan progres ketiga unit yang berbeda', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`);

      expect(res.status).toBe(200);
      const objects = res.body.objects;
      const objA = objects.find(o => o.id === unitAId);
      const objB = objects.find(o => o.id === unitBId);
      const objC = objects.find(o => o.id === unitCId);

      // Verifikasi perbedaan status unit di mata manajemen
      expect(objA.unit_status).toBe('SELESAI');
      expect(['BAP_DRAF', 'FORM_TERKIRIM', 'PERLU_REVISI', 'LHPP_SIAP_PREVIEW', 'MENUNGGU_REVIEW']).toContain(objB.unit_status);
      expect(['BELUM_DIJADWALKAN', 'TERJADWAL']).toContain(objC.unit_status);
    });

    it('6.2 Pimpinan secara ketat DITOLAK melakukan mutasi (POST, PUT, PATCH, DELETE)', async () => {
      // 1. Ditolak membuat order
      const postRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({ clientId, poNumber: 'PO-ILLEGAL' });
      expect(postRes.status).toBe(403);
      expect(postRes.body.error?.code).toBe('MANAGER_READ_ONLY');

      // 2. Ditolak mengubah status unit
      const patchRes = await request(app)
        .patch(`/api/v1/orders/${orderId}/units/${unitAId}`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({ unitStatus: 'DIBATALKAN' });
      expect(patchRes.status).toBe(403);
      expect(patchRes.body.error?.code).toBe('MANAGER_READ_ONLY');

      // 3. Ditolak memfinalisasi LHPP
      const finRes = await request(app)
        .post(`/api/v1/lhpp/${lhppAId}/finalize`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({ note: 'Pimpinan bypass' });
      expect(finRes.status).toBe(403);
      expect(finRes.body.error?.code).toBe('MANAGER_READ_ONLY');
    });
  });

  // ===========================================================================
  // TAHAP 7 — SUPER ADMIN AUDIT TRAIL & DATA INTEGRITY
  // ===========================================================================
  describe('Tahap 7 — Super Admin Audit Log & Verifikasi Integritas Relasi PostgreSQL', () => {
    it('7.1 Seluruh rantai aktivitas operasional tercatat di tabel audit_logs', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs?limit=100')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      const actions = res.body.items.map(i => i.action);

      // Verifikasi aksi-aksi kritis tercatat
      expect(actions).toContain('ORDER_CREATE');
      expect(actions.some(a => a === 'ORDER_SCHEDULE' || a === 'ORDER_RESCHEDULE')).toBe(true);
      expect(actions).toContain('ORDER_ASSIGN_INSPECTORS');
      expect(actions).toContain('INSPECTION_START');
      expect(actions).toContain('LHPP_FINALIZE');
      expect(actions).toContain('BAP_FINALIZE');
      expect(actions).toContain('DOCUMENT_DISTRIBUTION_CREATE');
    });

    it('7.2 Verifikasi Keutuhan Relasi Database PostgreSQL (Integritas Foreign Key & Triggers)', async () => {
      // 1. Relasi Klien -> Kontak -> Objek -> Order
      const { rows: orderCheck } = await pool.query(
        `SELECT o.id, o.po_number, c.name AS client_name, count(oo.object_id)::int AS unit_count
         FROM orders o
         JOIN clients c ON c.id = o.client_id
         JOIN order_objects oo ON oo.order_id = o.id
         WHERE o.id = $1
         GROUP BY o.id, o.po_number, c.name`,
        [orderId]
      );
      expect(orderCheck[0].unit_count).toBe(3);
      expect(orderCheck[0].client_name).toBe('PT Demo UAT URD');

      // 2. Relasi Unit A -> Inspeksi -> LHPP -> BAP -> Suket -> Distribusi
      const { rows: unitACheck } = await pool.query(
        `SELECT i.id AS inspection_id, l.id AS lhpp_id, b.id AS bap_id, s.id AS suket_id
         FROM inspections i
         LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
         LEFT JOIN bap_documents b ON b.inspection_id = i.id
         LEFT JOIN suket_documents s ON s.object_id = i.object_id
         WHERE i.id = $1`,
        [inspectionAId]
      );
      expect(unitACheck[0].inspection_id).toBe(inspectionAId);
      expect(unitACheck[0].lhpp_id).toBe(lhppAId);
      expect(unitACheck[0].bap_id).toBe(bapAId);
      expect(unitACheck[0].suket_id).toBe(suketAId);

      const { rows: distRows } = await pool.query(
        'SELECT id, status FROM document_distributions WHERE order_id = $1 AND object_id = $2',
        [orderId, unitAId]
      );
      expect(distRows.length).toBeGreaterThanOrEqual(1);
      const distA = distRows.find(d => d.id === distributionAId);
      expect(distA).toBeDefined();
      expect(distA.status).toBe('DITERIMA');
    });
  });
});
