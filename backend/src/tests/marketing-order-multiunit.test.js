import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { query } from '../database/pool.js';
import { loadCandidates } from '../services/client-reminders.js';

describe('Marketing Order Management & Multi-Unit Workflow', () => {
  let marketingToken;
  let _adminKantorToken;
  let clientId;
  let _contact1Id;
  let contact2Id;
  let testOrderId;
  let testObject1Id;
  let testObject2Id;
  let _testObject3Id;

  beforeAll(async () => {
    // 1. Setup marketing & admin user
    const { rows: mktRows } = await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ('marketing.multiunit@upayariksadaya.com', '$2b$10$abcdefghijklmnopqrstuu', 'Marketing MultiUnit', 'MARKETING', true)
       ON CONFLICT (email) DO UPDATE SET is_active = true, role = 'MARKETING'
       RETURNING id, full_name`
    );
    const mkt = mktRows[0];
    marketingToken = jwt.sign(
      { sub: mkt.id, role: 'MARKETING', fullName: mkt.full_name, tokenVersion: 1 },
      env.jwtSecret,
      { expiresIn: '1h' }
    );

    const { rows: admRows } = await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ('adminkantor.multiunit@upayariksadaya.com', '$2b$10$abcdefghijklmnopqrstuu', 'Admin Kantor MultiUnit', 'ADMIN_KANTOR', true)
       ON CONFLICT (email) DO UPDATE SET is_active = true, role = 'ADMIN_KANTOR'
       RETURNING id, full_name`
    );
    const adm = admRows[0];
    _adminKantorToken = jwt.sign(
      { sub: adm.id, role: 'ADMIN_KANTOR', fullName: adm.full_name, tokenVersion: 1 },
      env.jwtSecret,
      { expiresIn: '1h' }
    );

    // 2. Setup Client dengan 2 PIC (satu reminder recipient)
    const { rows: cliRows } = await query(
      `INSERT INTO clients (name, npwp, address, phone, email, is_active)
       VALUES ('PT Manufaktur Baja Sejahtera ${Date.now()}', '01.234.567.8-123.${Date.now().toString().slice(-3)}', 'Kawasan Industri Cikarang', '021-88889999', 'info@bajasejahtera.com', true)
       RETURNING id`
    );
    clientId = cliRows[0].id;

    const { rows: c1 } = await query(
      `INSERT INTO client_contacts (client_id, name, position, phone, email, is_primary, is_reminder_recipient, is_active)
       VALUES ($1, 'Ahmad Fauzi', 'General Admin', '08111111111', 'ahmad@bajasejahtera.com', false, false, true)
       RETURNING id`,
      [clientId]
    );
    _contact1Id = c1[0].id;

    const { rows: c2 } = await query(
      `INSERT INTO client_contacts (client_id, name, position, phone, email, is_primary, is_reminder_recipient, is_active)
       VALUES ($1, 'Bambang HSE', 'HSE Manager', '08222222222', 'hse@bajasejahtera.com', true, true, true)
       RETURNING id`,
      [clientId]
    );
    contact2Id = c2[0].id;

    // 3. Register 2 initial equipment objects
    const { rows: obj1 } = await query(
      `INSERT INTO test_objects (client_id, category_id, name, brand, serial_number, is_active)
       VALUES ($1, 1, 'Overhead Crane 10T', 'Konecranes', 'SN-CRANE-${Date.now()}', true)
       RETURNING id`,
      [clientId]
    );
    testObject1Id = obj1[0].id;

    const { rows: obj2 } = await query(
      `INSERT INTO test_objects (client_id, category_id, name, brand, serial_number, is_active)
       VALUES ($1, 2, 'Air Receiver Tank 1000L', 'Hitachi', 'SN-TANK-${Date.now()}', true)
       RETURNING id`,
      [clientId]
    );
    testObject2Id = obj2[0].id;
  });

  it('1. Marketing membuat PO baru berisi 2 unit alat sekaligus', async () => {
    const poNumber = `PO-TEST-MKT-${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${marketingToken}`)
      .send({
        clientId,
        contactId: contact2Id,
        poNumber,
        serviceType: 'PEMERIKSAAN_BERKALA',
        source: 'DOKUMEN_PO',
        requestedDate: '2026-12-01',
        notes: 'Uji riksa berkala tahunan pabrik',
        objectIds: [testObject1Id, testObject2Id]
      });

    expect(res.status).toBe(201);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.po_number).toBe(poNumber);
    expect(res.body.order.service_type).toBe('PEMERIKSAAN_BERKALA');
    expect(res.body.unitProgress.totalUnits).toBe(2);
    expect(res.body.unitProgress.unscheduled).toBe(2);

    testOrderId = res.body.order.id;
  });

  it('2. Marketing dapat memperbarui rincian PO via PATCH /orders/:id', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${testOrderId}`)
      .set('Authorization', `Bearer ${marketingToken}`)
      .send({
        serviceType: 'PERPANJANGAN',
        notes: 'Pembaruan instruksi: APD lengkap wajib dibawa tim',
        requestedDate: '2026-12-05'
      });

    expect(res.status).toBe(200);
    expect(res.body.order.service_type).toBe('PERPANJANGAN');
    expect(res.body.order.notes).toBe('Pembaruan instruksi: APD lengkap wajib dibawa tim');
    expect(new Date(res.body.order.requested_date).getDate()).toBe(5);
  });

  it('3. Menolak pembaruan PO dengan nomor PO duplikat (409 Conflict)', async () => {
    // Buat order lain
    const dupPoNumber = `PO-DUP-${Date.now()}`;
    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${marketingToken}`)
      .send({
        clientId,
        poNumber: dupPoNumber,
        serviceType: 'PEMERIKSAAN_PERTAMA',
        source: 'TELEPON',
        objectIds: [testObject1Id]
      });

    // Coba ganti nomor PO testOrderId menjadi dupPoNumber
    const res = await request(app)
      .patch(`/api/v1/orders/${testOrderId}`)
      .set('Authorization', `Bearer ${marketingToken}`)
      .send({
        poNumber: dupPoNumber
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_PO_NUMBER');
  });

  it('4. Marketing dapat menambahkan unit ke-3 ke PO yang sudah berjalan via POST /orders/:id/units', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${testOrderId}/units`)
      .set('Authorization', `Bearer ${marketingToken}`)
      .send({
        units: [
          {
            categoryId: 3,
            name: 'Genset Silent 250 kVA',
            brand: 'Perkins',
            serialNumber: `SN-GEN-${Date.now()}`,
            capacity: '250 kVA',
            installLocation: 'Power House 1'
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.addedObjectIds).toBeDefined();
    expect(res.body.addedObjectIds.length).toBe(1);
    _testObject3Id = res.body.addedObjectIds[0];

    // Verifikasi total unit pada PO menjadi 3
    const getRes = await request(app)
      .get(`/api/v1/orders/${testOrderId}`)
      .set('Authorization', `Bearer ${marketingToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.objects.length).toBe(3);
    expect(getRes.body.unitProgress.totalUnits).toBe(3);
  });

  it('5. Marketing dapat memperbarui tanggal usulan dan catatan unit alat via PATCH /orders/:id/units/:objectId', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${testOrderId}/units/${testObject1Id}`)
      .set('Authorization', `Bearer ${marketingToken}`)
      .send({
        proposedDate: '2026-12-10',
        unitNotes: 'Harap sediakan test weight 12.5 ton untuk load test'
      });

    expect(res.status).toBe(200);
    expect(new Date(res.body.unit.proposed_date).getDate()).toBe(10);
    expect(res.body.unit.unit_notes).toBe('Harap sediakan test weight 12.5 ton untuk load test');
  });

  it('6. Marketing dapat mencatat dan melihat riwayat follow-up renewal unit', async () => {
    // Buat follow-up baru
    const postRes = await request(app)
      .post(`/api/v1/reminders/units/${testObject1Id}/followups`)
      .set('Authorization', `Bearer ${marketingToken}`)
      .send({
        status: 'SUDAH_DIHUBUNGI',
        note: 'Menghubungi Pak Bambang HSE via WhatsApp, penawaran 3 unit crane telah dikirim.',
        contactPic: 'Bambang HSE'
      });

    expect(postRes.status).toBe(201);
    expect(postRes.body.followup).toBeDefined();
    expect(postRes.body.followup.status).toBe('SUDAH_DIHUBUNGI');
    expect(postRes.body.followup.contact_pic).toBe('Bambang HSE');

    // Ambil riwayat follow-up
    const getRes = await request(app)
      .get(`/api/v1/reminders/units/${testObject1Id}/followups`)
      .set('Authorization', `Bearer ${marketingToken}`);

    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body.items)).toBe(true);
    expect(getRes.body.items.length).toBeGreaterThanOrEqual(1);
    expect(getRes.body.items[0].status).toBe('SUDAH_DIHUBUNGI');
    expect(getRes.body.items[0].recorder_name).toBe('Marketing MultiUnit');
  });

  it('7. Client Reminders otomatis memprioritaskan PIC dengan is_reminder_recipient = true', async () => {
    // Set next_inspection_date unit agar masuk kriteria reminder
    const tomorrow = new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10);
    await query(
      'UPDATE test_objects SET next_inspection_date = $1 WHERE id = $2',
      [tomorrow, testObject1Id]
    );

    const candidates = await loadCandidates();
    const candidate = candidates.find((c) => c.object_id === testObject1Id);

    expect(candidate).toBeDefined();
    // Harus memilih Bambang HSE (is_reminder_recipient=true) bukan Ahmad Fauzi
    expect(candidate.contact_name).toBe('Bambang HSE');
    expect(candidate.phone).toBe('08222222222');
    expect(candidate.email).toBe('hse@bajasejahtera.com');
  });
});
