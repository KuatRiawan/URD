import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { pool } from '../database/pool.js';
import { seedDatabase } from '../../seeds/seed.js';

const TEST_PW = 'TestPassURD2026!';

describe('Negative Permission & Security Enforcement Test Suite', () => {
  const tokens = {};
  let client1Id;
  let order1Id;
  let object1Id;
  let inspectionInspAId;
  let inspectionInspBId;
  let lhppId;
  let deactivatedUserId;

  beforeAll(async () => {
    // Refresh seed data without dropping schema
    await pool.query(`
      TRUNCATE TABLE users, clients, file_attachments, audit_logs CASCADE;
      ALTER SEQUENCE IF EXISTS order_no_seq RESTART WITH 1;
      ALTER SEQUENCE IF EXISTS lhpp_no_seq RESTART WITH 1;
      ALTER SEQUENCE IF EXISTS bap_no_seq RESTART WITH 1;
      ALTER SEQUENCE IF EXISTS suket_no_seq RESTART WITH 1;
    `);
    await seedDatabase({ password: TEST_PW });

    // Login each canonical role
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

    // Buat data dasar untuk pengujian hak akses
    // 1. Marketing membuat Klien & Objek
    const clRes = await request(app)
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({
        name: 'PT Klien Pengujian Keamanan',
        address: 'Jl. Riksa Uji No. 99, Jakarta',
        phone: '021-99887766',
        email: 'kontak@klienuji.com',
        npwp: '01.999.888.7-001.000'
      });
    expect(clRes.status).toBe(201);
    client1Id = clRes.body.client.id;

    // Ambil kategori PAA & LIS
    const { rows: cats } = await pool.query("SELECT id, code FROM object_categories WHERE code IN ('PAA', 'LIS')");
    const catMap = Object.fromEntries(cats.map(c => [c.code, c.id]));

    // Objek 1 (PAA) & Objek 2 (LIS)
    const obj1Res = await request(app)
      .post('/api/v1/objects')
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({
        clientId: client1Id,
        categoryId: catMap.PAA,
        name: 'Overhead Crane Testing 20T',
        serialNumber: 'CRN-SEC-001',
        brand: 'Hitachi',
        model: 'HC-20',
        capacity: '20 Ton'
      });
    expect(obj1Res.status).toBe(201);
    object1Id = obj1Res.body.object.id;

    const obj2Res = await request(app)
      .post('/api/v1/objects')
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({
        clientId: client1Id,
        categoryId: catMap.LIS,
        name: 'Panel Listrik Distribusi LVMDP',
        serialNumber: 'LIS-SEC-002',
        brand: 'Schneider',
        capacity: '500 kVA'
      });
    expect(obj2Res.status).toBe(201);
    const object2Id = obj2Res.body.object.id;

    // PO dibuat oleh Marketing
    const poRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({
        clientId: client1Id,
        serviceType: 'PEMERIKSAAN_PERTAMA',
        source: 'DOKUMEN_PO',
        poNumber: 'PO-SEC-001',
        poDate: '2026-11-01',
        objectIds: [object1Id, object2Id]
      });
    expect(poRes.status).toBe(201);
    order1Id = poRes.body.order.id;

    // Admin Kantor menjadwalkan & menugaskan:
    // Unit 1 (PAA) -> Inspector A (Budi Santoso - PAA)
    // Unit 2 (LIS) -> Inspector B (Rizky Pratama - Listrik)
    const { rows: inspUsers } = await pool.query(
      "SELECT id, email FROM users WHERE email IN ('ahlik3.paa@upayariksadaya.com', 'ahlik3.listrik@upayariksadaya.com')"
    );
    const inspMap = Object.fromEntries(inspUsers.map(u => [u.email, u.id]));

    const schedRes = await request(app)
      .post(`/api/v1/orders/${order1Id}/schedule`)
      .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
      .send({
        startAt: '2026-11-10T08:00:00.000Z',
        endAt: '2026-11-10T17:00:00.000Z',
        notes: 'Penjadwalan 2 unit beda spesialis'
      });
    expect(schedRes.status).toBe(200);

    // Tugaskan Inspector A untuk Unit 1
    const assignARes = await request(app)
      .post(`/api/v1/orders/${order1Id}/assignments`)
      .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
      .send({
        objectId: object1Id,
        inspectorIds: [inspMap['ahlik3.paa@upayariksadaya.com']]
      });
    expect(assignARes.status).toBe(201);

    // Tugaskan Inspector B untuk Unit 2
    const assignBRes = await request(app)
      .post(`/api/v1/orders/${order1Id}/assignments`)
      .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
      .send({
        objectId: object2Id,
        inspectorIds: [inspMap['ahlik3.listrik@upayariksadaya.com']]
      });
    expect(assignBRes.status).toBe(201);

    // Inspector A mulai inspeksi Unit 1
    const startInspARes = await request(app)
      .post('/api/v1/inspections/start')
      .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
      .send({ orderId: order1Id, objectId: object1Id });
    expect(startInspARes.status).toBe(201);
    inspectionInspAId = startInspARes.body.inspection.id;

    // Inspector B mulai inspeksi Unit 2
    const startInspBRes = await request(app)
      .post('/api/v1/inspections/start')
      .set('Authorization', `Bearer ${tokens.INSPECTOR_B}`)
      .send({ orderId: order1Id, objectId: object2Id });
    expect(startInspBRes.status).toBe(201);
    inspectionInspBId = startInspBRes.body.inspection.id;

    // Buat draf LHPP untuk Unit 1
    const { rows: lhppRows } = await pool.query(
      `INSERT INTO lhpp_documents (inspection_id, lhpp_no, status, version)
       VALUES ($1, 'LHPP/2026/SEC/001', 'SIAP_PREVIEW', 1)
       RETURNING id`,
      [inspectionInspAId]
    );
    lhppId = lhppRows[0].id;

    // Buat akun non-aktif untuk pengujian deactivation
    const { rows: deactRows } = await pool.query(
      `INSERT INTO users (email, full_name, role, password_hash, is_active)
       VALUES ('nonaktif@upayariksadaya.com', 'Mantan Karyawan', 'MARKETING', 'hash', false)
       RETURNING id`
    );
    deactivatedUserId = deactRows[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  // ---------------------------------------------------------------------------
  // Skenario 1: Marketing mencoba finalisasi LHPP (Harus 403 Forbidden)
  // ---------------------------------------------------------------------------
  it('1. Marketing mencoba mengakses endpoint finalisasi LHPP -> ditolak 403', async () => {
    const res = await request(app)
      .post(`/api/v1/lhpp/${lhppId}/finalize`)
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({ note: 'Mencoba finalisasi oleh marketing' });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('FORBIDDEN');
  });

  // ---------------------------------------------------------------------------
  // Skenario 2: Marketing mencoba mengakses endpoint BAP (Harus 403 Forbidden)
  // ---------------------------------------------------------------------------
  it('2. Marketing mencoba mengakses endpoint BAP -> ditolak 403', async () => {
    const res = await request(app)
      .post('/api/v1/bap/00000000-0000-0000-0000-000000000000/finalize')
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({
        notes: 'Marketing mencoba finalisasi BAP'
      });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('FORBIDDEN');
  });

  // ---------------------------------------------------------------------------
  // Skenario 3: Marketing mencoba memproses distribusi (Harus 403 Forbidden)
  // ---------------------------------------------------------------------------
  it('3. Marketing mencoba memproses distribusi dokumen -> ditolak 403', async () => {
    const res = await request(app)
      .post('/api/v1/distributions')
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({
        orderId: order1Id,
        objectId: object1Id,
        lhppId,
        recipientName: 'Budi Client',
        recipientRole: 'PIC',
        channel: 'EMAIL',
        notes: 'Mencoba kirim dokumen'
      });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('FORBIDDEN');
  });

  // ---------------------------------------------------------------------------
  // Skenario 4: Marketing mencoba mengubah checklist inspeksi (Harus 403 Forbidden)
  // ---------------------------------------------------------------------------
  it('4. Marketing mencoba mengubah checklist / draf inspeksi -> ditolak 403', async () => {
    const res = await request(app)
      .put(`/api/v1/inspections/${inspectionInspAId}/draft`)
      .set('Authorization', `Bearer ${tokens.MARKETING}`)
      .send({
        results: { item_1: 'SESUAI' },
        objectAttributes: { swl: '25 Ton' }
      });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('FORBIDDEN');
  });

  // ---------------------------------------------------------------------------
  // Skenario 5: Inspector A mencoba membuka penugasan Inspector B (Harus dibatasi/403)
  // ---------------------------------------------------------------------------
  it('5. Inspector A mencoba membuka penugasan inspeksi milik Inspector B -> ditolak / dilarang', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionInspBId}`)
      .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`);

    // Inspector hanya boleh membaca assignment miliknya sendiri
    expect([403, 404]).toContain(res.status);
  });

  // ---------------------------------------------------------------------------
  // Skenario 6: Inspector A mencoba memodifikasi draf inspeksi milik Inspector B
  // ---------------------------------------------------------------------------
  it('6. Inspector A mencoba memodifikasi hasil inspeksi milik Inspector B -> ditolak 403', async () => {
    const res = await request(app)
      .put(`/api/v1/inspections/${inspectionInspBId}/draft`)
      .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
      .send({
        results: [],
        conclusionNotes: 'Inspector A mencoba mengubah draf orang lain'
      });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('FORBIDDEN');
  });

  // ---------------------------------------------------------------------------
  // Skenario 7: Inspector mencoba memfinalisasi LHPP (Harus 403 Forbidden)
  // ---------------------------------------------------------------------------
  it('7. Inspector mencoba memfinalisasi LHPP -> ditolak 403 (wewenang Admin Kantor)', async () => {
    const res = await request(app)
      .post(`/api/v1/lhpp/${lhppId}/finalize`)
      .set('Authorization', `Bearer ${tokens.INSPECTOR_A}`)
      .send({ note: 'Inspector mencoba memfinalisasi sendiri' });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('FORBIDDEN');
  });

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Skenario 8: Pimpinan diblokir dari seluruh aksi mutasi (Strict Read-Only) -> 403 MANAGER_READ_ONLY
  // ---------------------------------------------------------------------------
  describe('8. Pimpinan diblokir dari seluruh aksi mutasi (Strict Read-Only)', () => {
    it('Pimpinan POST klien baru -> 403 MANAGER_READ_ONLY', async () => {
      const res = await request(app)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({ name: 'PT Klien Dilarang Pimpinan', address: 'Jakarta' });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('MANAGER_READ_ONLY');
    });

    it('Pimpinan PUT draf inspeksi -> 403 MANAGER_READ_ONLY', async () => {
      const res = await request(app)
        .put(`/api/v1/inspections/${inspectionInspAId}/draft`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({ results: {} });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('MANAGER_READ_ONLY');
    });

    it('Pimpinan PATCH status order -> 403 MANAGER_READ_ONLY', async () => {
      const res = await request(app)
        .patch(`/api/v1/orders/${order1Id}/status`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({ status: 'DIBATALKAN', note: 'Dibatalkan oleh pimpinan' });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('MANAGER_READ_ONLY');
    });

    it('Pimpinan DELETE foto inspeksi -> 403 MANAGER_READ_ONLY', async () => {
      const res = await request(app)
        .delete(`/api/v1/inspections/${inspectionInspAId}/photos/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`);

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('MANAGER_READ_ONLY');
    });
  });

  // ---------------------------------------------------------------------------
  // Skenario 9: Akun nonaktif mencoba mengakses API
  // ---------------------------------------------------------------------------
  it('9. Akun nonaktif mencoba login / akses API -> ditolak (401)', async () => {
    // 1. Login langsung ditolak
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonaktif@upayariksadaya.com', password: TEST_PW });
    expect(loginRes.status).toBe(401);

    // 2. Token buatan untuk user non-aktif tetap ditolak karena authenticate() reload user dari DB
    const jwt = (await import('jsonwebtoken')).default;
    const { env } = await import('../config/env.js');
    const forgedToken = jwt.sign(
      { sub: deactivatedUserId, role: 'MARKETING' },
      env.jwtSecret,
      { expiresIn: '1h' }
    );

    const apiRes = await request(app)
      .get('/api/v1/clients')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect([401, 403]).toContain(apiRes.status);
    expect(apiRes.body.error?.code).toMatch(/UNAUTHENTICATED|USER_INACTIVE|ACCOUNT_INACTIVE/);
  });

  // ---------------------------------------------------------------------------
  // Skenario 10: Pengaksesan data klien/objek yang tidak sah dengan manipulasi ID
  // ---------------------------------------------------------------------------
  it('10. User mencoba mengakses resource fiktif / tidak sah -> 404 / 403', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/v1/clients/${fakeId}`)
      .set('Authorization', `Bearer ${tokens.MARKETING}`);

    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------------------------
  // Skenario 11: Admin Kantor mencoba fungsi manajemen akun pengguna
  // ---------------------------------------------------------------------------
  it('11. Admin Kantor mencoba mengakses endpoint manajemen akun users -> ditolak 403', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
      .send({
        email: 'user.baru@example.com',
        fullName: 'User Baru',
        role: 'MARKETING',
        phone: '0812345678'
      });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('FORBIDDEN');
  });

  // ---------------------------------------------------------------------------
  // Skenario 12: Super Admin (ADMIN_SISTEM) menggunakan fungsi administratif yang diizinkan
  // ---------------------------------------------------------------------------
  it('12. Super Admin (ADMIN_SISTEM) berhasil mengakses fungsi administratif', async () => {
    // 1. Membaca daftar pengguna
    const usersRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
    expect(usersRes.status).toBe(200);
    expect(Array.isArray(usersRes.body.items)).toBe(true);

    // 2. Membaca audit logs
    const auditRes = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
    expect(auditRes.status).toBe(200);
    expect(Array.isArray(auditRes.body.items)).toBe(true);
  });
});
