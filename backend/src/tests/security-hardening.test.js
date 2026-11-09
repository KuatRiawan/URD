import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { pool } from '../database/pool.js';
import { seedDatabase } from '../../seeds/seed.js';

const TEST_PW = 'TestPassURD2026!';

describe('Security Hardening & Penetration Defense Test Suite', () => {
  const tokens = {};
  let client1Id;
  let order1Id;
  let object1Id;
  let object2Id;
  let inspectionInspAId;
  let inspectionInspBId;
  let suketNo;

  beforeAll(async () => {
    await pool.query(`
      TRUNCATE TABLE users, clients, file_attachments, audit_logs CASCADE;
      ALTER SEQUENCE IF EXISTS order_no_seq RESTART WITH 1;
      ALTER SEQUENCE IF EXISTS lhpp_no_seq RESTART WITH 1;
      ALTER SEQUENCE IF EXISTS bap_no_seq RESTART WITH 1;
      ALTER SEQUENCE IF EXISTS suket_no_seq RESTART WITH 1;
    `);
    await seedDatabase({ password: TEST_PW });

    const rolesToLogin = [
      { key: 'ADMIN_SISTEM', email: 'admin.sistem@upayariksadaya.com' },
      { key: 'MARKETING', email: 'marketing@upayariksadaya.com' },
      { key: 'ADMIN_KANTOR', email: 'admin.kantor@upayariksadaya.com' },
      { key: 'INSPECTOR_A', email: 'ahlik3.paa@upayariksadaya.com' },
      { key: 'INSPECTOR_B', email: 'ahlik3.listrik@upayariksadaya.com' },
      { key: 'PIMPINAN', email: 'pimpinan@upayariksadaya.com' }
    ];

    for (const r of rolesToLogin) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: r.email, password: TEST_PW });
      expect(res.status, `Login failed for ${r.email}`).toBe(200);
      tokens[r.key] = res.body.accessToken;
    }

    // Buat data dasar
    const clRes = await request(app)
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({
        name: 'PT Mitra Keamanan Terpadu',
        address: 'Kawasan Industri MM2100 Blok C-12, Cikarang',
        phone: '021-89898989',
        email: 'info@mitrakeamanan.co.id'
      });
    expect(clRes.status).toBe(201);
    client1Id = clRes.body.client.id;

    const { rows: cats } = await pool.query("SELECT id, code FROM object_categories WHERE code IN ('PAA', 'LIS')");
    const catMap = Object.fromEntries(cats.map(c => [c.code, c.id]));

    const obj1Res = await request(app)
      .post('/api/v1/objects')
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({
        clientId: client1Id,
        categoryId: catMap.PAA,
        name: 'Overhead Crane Hardened 10T',
        serialNumber: 'CRN-SEC-10T'
      });
    expect(obj1Res.status).toBe(201);
    object1Id = obj1Res.body.object.id;

    const obj2Res = await request(app)
      .post('/api/v1/objects')
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({
        clientId: client1Id,
        categoryId: catMap.LIS,
        name: 'Transformator 1000kVA',
        serialNumber: 'TRF-SEC-1000'
      });
    expect(obj2Res.status).toBe(201);
    object2Id = obj2Res.body.object.id;

    const poRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({
        clientId: client1Id,
        serviceType: 'PEMERIKSAAN_BERKALA',
        source: 'DOKUMEN_PO',
        poNumber: 'PO-SEC-HARDEN-01',
        poDate: '2026-11-01',
        objectIds: [object1Id, object2Id]
      });
    expect(poRes.status).toBe(201);
    order1Id = poRes.body.order.id;

    const { rows: inspUsers } = await pool.query(
      "SELECT id, email FROM users WHERE email IN ('ahlik3.paa@upayariksadaya.com', 'ahlik3.listrik@upayariksadaya.com')"
    );
    const inspMap = Object.fromEntries(inspUsers.map(u => [u.email, u.id]));

    await request(app)
      .post(`/api/v1/orders/${order1Id}/assignments`)
      .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
      .send({
        objectId: object1Id,
        inspectorIds: [inspMap['ahlik3.paa@upayariksadaya.com']]
      });

    await request(app)
      .post(`/api/v1/orders/${order1Id}/assignments`)
      .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
      .send({
        objectId: object2Id,
        inspectorIds: [inspMap['ahlik3.listrik@upayariksadaya.com']]
      });

    const startARes = await request(app)
      .post('/api/v1/inspections/start')
      .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
      .send({ orderId: order1Id, objectId: object1Id });
    expect(startARes.status).toBe(201);
    inspectionInspAId = startARes.body.inspection.id;

    const startBRes = await request(app)
      .post('/api/v1/inspections/start')
      .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
      .send({ orderId: order1Id, objectId: object2Id });
    expect(startBRes.status).toBe(201);
    inspectionInspBId = startBRes.body.inspection.id;

    // Masukkan dummy suket untuk testing public verify
    const { rows: suketRows } = await pool.query(`
      INSERT INTO suket_documents (
        object_id, suket_no, status, issued_date, valid_until, issuer
      ) VALUES (
        $1, '566/SKT-PAA/DISNAKER/XI/2026', 'TERBIT', '2026-11-02', '2027-11-02', 'Disnakertrans Prov. Jawa Barat'
      ) RETURNING suket_no
    `, [object1Id]);
    suketNo = suketRows[0].suket_no;
  });

  afterAll(async () => {
    // Teardown handled by process exit
  });

  // ---------------------------------------------------------------------------
  // 1. Unauthenticated Access Protection
  // ---------------------------------------------------------------------------
  describe('1. Unauthenticated Access Rejection (401)', () => {
    const protectedEndpoints = [
      { method: 'get', url: '/api/v1/orders' },
      { method: 'get', url: '/api/v1/inspections' },
      { method: 'get', url: '/api/v1/users' },
      { method: 'get', url: '/api/v1/suket' },
      { method: 'get', url: '/api/v1/distributions' },
      { method: 'get', url: '/api/v1/bap' },
      { method: 'get', url: '/api/v1/lhpp' },
      { method: 'get', url: '/api/v1/audit-logs' }
    ];

    for (const ep of protectedEndpoints) {
      it(`Tolak ${ep.method.toUpperCase()} ${ep.url} tanpa token -> 401`, async () => {
        const res = await request(app)[ep.method](ep.url);
        expect(res.status).toBe(401);
        expect(res.body.error?.code).toMatch(/UNAUTHENTICATED|TOKEN_MISSING/);
      });
    }

    it('Tolak request dengan token palsu/malformed -> 401', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', 'Bearer token_palsu_acak_12345');
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. IDOR / BOLA Prevention on Inspections
  // ---------------------------------------------------------------------------
  describe('2. IDOR / BOLA Prevention on Inspector Workflows', () => {
    it('Inspector A dilarang submit inspeksi milik Inspector B -> 403', async () => {
      const res = await request(app)
        .post(`/api/v1/inspections/${inspectionInspBId}/submit`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
        .send({
          notes: 'Upaya bypass IDOR oleh Inspector A'
        });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN');
    });

    it('Inspector B dilarang menyimpan draf inspeksi milik Inspector A -> 403', async () => {
      const res = await request(app)
        .put(`/api/v1/inspections/${inspectionInspAId}/draft`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
        .send({
          results: [],
          conclusionNotes: 'Diubah secara ilegal oleh Inspector B'
        });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN');
    });

    it('Inspector A dilarang mengakses unduhan laporan/rekomendasi milik Inspector B jika bukan penugasan miliknya -> 403/404', async () => {
      const res = await request(app)
        .get(`/api/v1/inspections/${inspectionInspBId}/recommendation-letter.pdf`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`);

      expect([403, 404]).toContain(res.status);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Strict Read-Only Pimpinan Enforcement
  // ---------------------------------------------------------------------------
  describe('3. Pimpinan Strict Read-Only Role Enforcement', () => {
    it('Pimpinan dilarang membuat order / PO -> 403 MANAGER_READ_ONLY', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({
          clientId: client1Id,
          serviceType: 'PEMERIKSAAN_PERTAMA',
          poNumber: 'PO-ILLEGAL-PIMPINAN'
        });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('MANAGER_READ_ONLY');
    });

    it('Pimpinan dilarang menjadwalkan order -> 403 MANAGER_READ_ONLY', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${order1Id}/schedule`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({
          startAt: '2026-12-01T08:00:00Z',
          endAt: '2026-12-01T17:00:00Z'
        });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('MANAGER_READ_ONLY');
    });

    it('Pimpinan dilarang membuat distribusi dokumen -> 403 MANAGER_READ_ONLY', async () => {
      const res = await request(app)
        .post('/api/v1/distributions')
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({
          orderId: order1Id,
          objectId: object1Id,
          recipientName: 'Klien URD',
          channel: 'EMAIL'
        });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('MANAGER_READ_ONLY');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. SQL Injection Resistance
  // ---------------------------------------------------------------------------
  describe('4. SQL Injection Parameter Resistance', () => {
    const sqliPayloads = [
      "' OR 1=1 --",
      "'; DROP TABLE clients; --",
      "1' UNION SELECT null, null, null, null--",
      "' OR 'a'='a"
    ];

    for (const payload of sqliPayloads) {
      it(`Filter query param: '${payload}' aman dari crash SQL error`, async () => {
        const res = await request(app)
          .get('/api/v1/orders')
          .query({ q: payload, status: payload })
          .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);

        // Sistem harus menangani aman: 200 dengan filter literal atau 400 validation error, TIDAK BOLEH 500
        expect([200, 400]).toContain(res.status);
        if (res.status === 200) {
          expect(Array.isArray(res.body.items)).toBe(true);
        }
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 5. Public QR Verification Privacy & Route Boundaries
  // ---------------------------------------------------------------------------
  describe('5. Public Verification Route Privacy & Method Hardening', () => {
    it('GET /api/v1/verify/:code mengembalikan metadata dokumen tanpa membocorkan kredensial', async () => {
      const res = await request(app).get(`/api/v1/verify/${encodeURIComponent(suketNo)}`);

      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
      expect(res.body.documentType).toBe('SUKET');
      expect(res.body.status).toBe('TERBIT_RESMI');
      expect(res.body.validUntil).toBe('2027-11-02');

      // Verifikasi TIDAK ADA kebocoran field sensitif
      const rawText = JSON.stringify(res.body);
      expect(rawText).not.toContain('password');
      expect(rawText).not.toContain('password_hash');
      expect(rawText).not.toContain('jwt');
      expect(rawText).not.toContain('token');
      expect(rawText).not.toContain('secret');
      expect(rawText).not.toContain('@upayariksadaya.com');
    });

    it('POST /api/v1/verify/:code ditolak (Metode tidak diizinkan)', async () => {
      const res = await request(app)
        .post(`/api/v1/verify/${encodeURIComponent(suketNo)}`)
        .send({ tamper: true });

      expect([404, 405]).toContain(res.status);
    });

    it('GET /api/v1/verify/:code kode acak mengembalikan 404 verified: false', async () => {
      const res = await request(app).get('/api/v1/verify/KODE_TIDAK_TERDAFTAR_99999');

      expect(res.status).toBe(404);
      expect(res.body.verified).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. File Upload / Payload Security
  // ---------------------------------------------------------------------------
  describe('6. File Upload & Binary Security', () => {
    it('Tolak unggah file executable / script (.exe, .sh) pada lampiran foto inspeksi -> 400', async () => {
      const res = await request(app)
        .post(`/api/v1/inspections/${inspectionInspAId}/photos`)
        .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
        .attach('photo', Buffer.from('#!/bin/bash\nrm -rf /'), 'malicious_script.sh');

      // Sistem menolak file non-gambar (400) atau unsupported media type (415)
      expect([400, 415]).toContain(res.status);
    });
  });
});
