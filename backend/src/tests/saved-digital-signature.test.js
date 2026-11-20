import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { query } from '../database/pool.js';

describe('URD Saved Digital Signature in Profile & 1-Click Signing', () => {
  let inspectorToken;
  let inspectorUserId;
  let testOrderId;
  let testObjectId;
  let bapId;
  let inspectionId;

  const samplePng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeAll(async () => {
    // 1. Login as AHLI_K3 (ahlik3.paa@upayariksadaya.com)
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ahlik3.paa@upayariksadaya.com', password: 'TestPassURD2026!' });
    expect(loginRes.status).toBe(200);
    inspectorToken = loginRes.body.accessToken;
    inspectorUserId = loginRes.body.user.id;

    // 2. Query an order and object assigned or available whose BAP is not already finalized
    const objRes = await query(
      `SELECT oo.order_id, oo.object_id
       FROM order_objects oo
       JOIN orders o ON o.id = oo.order_id
       LEFT JOIN bap_documents b ON b.order_id = oo.order_id AND b.object_id = oo.object_id
       WHERE b.id IS NULL OR b.status = 'DRAF'
       LIMIT 1`
    );
    expect(objRes.rows.length).toBeGreaterThan(0);
    testOrderId = objRes.rows[0].order_id;
    testObjectId = objRes.rows[0].object_id;
  });

  it('1. POST /api/v1/auth/signature - Menyimpan tanda tangan digital & gelar di profil pengguna', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signature')
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        dataUrl: samplePng,
        signerTitle: 'Ahli K3 Spesialis Pesawat Angkat dan Angkut'
      });

    expect(res.status).toBe(200);
    expect(res.body.signatureUrl).toBeDefined();
    expect(res.body.signatureUrl).toContain('/api/v1/dashboard/files/');
    expect(res.body.user.signerTitle).toBe('Ahli K3 Spesialis Pesawat Angkat dan Angkut');

    // Cek GET /auth/me mengembalikan data signature
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${inspectorToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.signatureUrl).toBe(res.body.signatureUrl);
    expect(meRes.body.user.signerTitle).toBe('Ahli K3 Spesialis Pesawat Angkat dan Angkut');
  });

  it('2. Siapkan BAP dan gunakan tanda tangan tersimpan (useSavedSignature: true)', async () => {
    // Siapkan BAP sebagai Admin Sistem terlebih dahulu
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.sistem@upayariksadaya.com', password: 'TestPassURD2026!' });
    const adminToken = adminLogin.body.accessToken;

    const prepRes = await request(app)
      .post('/api/v1/bap/prepare')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        orderId: testOrderId,
        objectId: testObjectId,
        inspectionDate: '2026-11-19',
        scopeItems: ['Pemeriksaan Dokumen', 'Pemeriksaan Visual']
      });
    expect([200, 201]).toContain(prepRes.status);
    bapId = prepRes.body.bap.id;
    inspectionId = prepRes.body.bap.inspection_id;

    // Pastikan inspector ditugaskan pada order/inspeksi
    await query(
      `INSERT INTO assignments (order_id, inspector_id, status)
       VALUES ($1, $2, 'DITERIMA')
       ON CONFLICT (order_id, inspector_id) WHERE status IN ('MENUNGGU', 'DITERIMA') DO NOTHING`,
      [testOrderId, inspectorUserId]
    );
    await query('UPDATE inspections SET inspector_id = $1 WHERE id = $2', [inspectorUserId, inspectionId]);

    // Tandatangani BAP menggunakan tanda tangan tersimpan profil
    const signRes = await request(app)
      .post(`/api/v1/bap/${bapId}/signatures`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        signerRole: 'AHLI_K3',
        signerName: 'Ir. Budi Santoso, ST',
        signerTitle: 'Ahli K3 Spesialis PAA',
        useSavedSignature: true
      });

    // Harus berhasil 201
    expect(signRes.status).toBe(201);
    expect(signRes.body.bap.inspector_signer_name).toBe('Ir. Budi Santoso, ST');
    expect(signRes.body.bap.inspector_signature_file_id).toBeDefined();
  });

  it('3. Gunakan tanda tangan tersimpan pada inspeksi lapangan (POST /api/v1/inspections/:id/signatures)', async () => {
    // Pastikan inspector ditugaskan pada inspeksi
    await query('UPDATE inspections SET inspector_id = $1 WHERE id = $2', [inspectorUserId, inspectionId]);

    const inspSignRes = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/signatures`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        signerRole: 'AHLI_K3',
        signerName: 'Ir. Budi Santoso, ST',
        signerTitle: 'Ahli K3 Spesialis PAA',
        useSavedSignature: true
      });

    expect(inspSignRes.status).toBe(201);
    expect(inspSignRes.body.signature.file_id).toBeDefined();
    expect(inspSignRes.body.signature.signer_name).toBe('Ir. Budi Santoso, ST');
  });

  it('4. DELETE /api/v1/auth/signature - Menghapus tanda tangan digital tersimpan', async () => {
    const delRes = await request(app)
      .delete('/api/v1/auth/signature')
      .set('Authorization', `Bearer ${inspectorToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.user.signatureUrl).toBeNull();

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${inspectorToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.signatureUrl).toBeNull();
  });
});
