import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { query } from '../database/pool.js';

describe('URD Independent BAP & Inspector LHPP Workflow Redesign', () => {
  let adminToken;
  let testOrderId;
  let testObjectId;
  let bapId;

  beforeAll(async () => {
    // 1. Login as ADMIN_SISTEM
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.sistem@upayariksadaya.com', password: 'TestPassURD2026!' });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.accessToken;

    // 2. Find an active order with test objects directly from database
    const objRes = await query(
      `SELECT oo.order_id, oo.object_id 
       FROM order_objects oo
       JOIN orders o ON o.id = oo.order_id
       JOIN test_objects t ON t.id = oo.object_id
       LIMIT 1`
    );
    expect(objRes.rows.length).toBeGreaterThan(0);
    testOrderId = objRes.rows[0].order_id;
    testObjectId = objRes.rows[0].object_id;

    // Fixture deterministik: suite lain (mis. saved-digital-signature) dapat memfinalisasi
    // BAP pada unit yang sama. Tanpa reset, prepare mengembalikan BAP FINAL dan rangkaian
    // test ini gagal bukan karena regresi produk. Hanya menyentuh database test.
    await query(
      `UPDATE bap_documents SET status = 'DRAF' WHERE order_id = $1 AND object_id = $2`,
      [testOrderId, testObjectId]
    );
  });

  it('1. POST /api/v1/bap/prepare - Mempersiapkan draf BAP mandiri per unit (1 Unit = 1 BAP)', async () => {
    const res = await request(app)
      .post('/api/v1/bap/prepare')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        orderId: testOrderId,
        objectId: testObjectId,
        inspectionDate: '2026-11-19',
        scopeItems: ['Pemeriksaan Dokumen', 'Pemeriksaan Visual', 'Uji Fungsi']
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.bap).toBeDefined();
    expect(res.body.bap.id).toBeDefined();
    expect(res.body.bap.status).toBe('DRAF');
    bapId = res.body.bap.id;
  });

  it('2. PUT /api/v1/bap/:id/draft - Menyimpan perubahan informasi BAP di document_data tanpa mengubah master tabel', async () => {
    // Get master client before edit
    const beforeClientRes = await query(
      `SELECT c.name FROM clients c
       JOIN orders o ON o.client_id = c.id
       WHERE o.id = $1`,
      [testOrderId]
    );
    const originalClientName = beforeClientRes.rows[0].name;

    const customBapNo = `0999/BAP-TEST/URD/XI/2026`;
    const res = await request(app)
      .put(`/api/v1/bap/${bapId}/draft`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bapNo: customBapNo,
        inspectionDate: '2026-11-20',
        scopeItems: ['Pemeriksaan Dokumen', 'Pemeriksaan Visual', 'Uji Fungsi', 'Uji Beban SWL'],
        isCompliant: true,
        inspectionNotes: 'Pemeriksaan berjalan lancar dan aman.',
        documentData: {
          client_name: 'PT Modifikasi Nama Khusus BAP',
          object_name: 'Forklift Custom 3.5 Ton BAP',
          serial_number: 'SN-CUSTOM-BAP-999',
          capacity: '3500 kg',
          bap_no: customBapNo
        }
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.bap.bap_no).toBe(customBapNo);

    // Verify master table clients did NOT change
    const afterClientRes = await query(
      `SELECT c.name FROM clients c
       JOIN orders o ON o.client_id = c.id
       WHERE o.id = $1`,
      [testOrderId]
    );
    expect(afterClientRes.rows[0].name).toBe(originalClientName);
    expect(afterClientRes.rows[0].name).not.toBe('PT Modifikasi Nama Khusus BAP');

    // Verify GET /api/v1/bap/:id returns merged documentData
    const getRes = await request(app)
      .get(`/api/v1/bap/${bapId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.bap.client_name).toBe('PT Modifikasi Nama Khusus BAP');
    expect(getRes.body.bap.object_name).toBe('Forklift Custom 3.5 Ton BAP');
    expect(getRes.body.bap.serial_number).toBe('SN-CUSTOM-BAP-999');
    expect(getRes.body.bap.raw_source.client_name).toBe(originalClientName);
  });

  it('3. POST /api/v1/bap/:id/finalize - Mengizinkan finalisasi BAP mandiri tanpa memblokir status LHPP', async () => {
    const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    await request(app)
      .post(`/api/v1/bap/${bapId}/signatures`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        signerRole: 'AHLI_K3',
        signerName: 'Ir. Ahmad Zulkarnain, ST',
        signerTitle: 'Ahli K3 Spesialis PAA',
        dataUrl: samplePng
      });

    await request(app)
      .post(`/api/v1/bap/${bapId}/signatures`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        signerRole: 'PERWAKILAN_KLIEN',
        signerName: 'Bambang Sudarsono',
        signerTitle: 'Factory Manager',
        dataUrl: samplePng
      });

    const finalizeRes = await request(app)
      .post(`/api/v1/bap/${bapId}/finalize`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Must be 200 FINAL without LHPP_NOT_FINALIZED error
    expect(finalizeRes.status).toBe(200);
    expect(finalizeRes.body.bap.status).toBe('FINAL');
  });

  it('4. GET /api/v1/bap/:id/pdf - Mengunduh dokumen PDF BAP dengan data override', async () => {
    const pdfRes = await request(app)
      .get(`/api/v1/bap/${bapId}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    expect(pdfRes.body.length).toBeGreaterThan(1000);
  });
});
