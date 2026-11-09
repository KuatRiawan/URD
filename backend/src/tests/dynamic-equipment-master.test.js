import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { query } from '../database/pool.js';
import { seedDatabase } from '../../seeds/seed.js';

describe('Dynamic Equipment Master & Checklist Engine', () => {
  const TEST_PW = 'TestPassURD2026!';
  let adminToken;
  let marketingToken;
  let inspectorToken;

  beforeAll(async () => {
    await seedDatabase({ password: TEST_PW });
  });

  it('1. Login sebagai Admin Sistem, Marketing, dan Inspector', async () => {
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.sistem@upayariksadaya.com', password: TEST_PW });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.accessToken;

    const mktRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'marketing@upayariksadaya.com', password: TEST_PW });
    expect(mktRes.status).toBe(200);
    marketingToken = mktRes.body.accessToken;

    const inspRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ahlik3.paa@upayariksadaya.com', password: TEST_PW });
    expect(inspRes.status).toBe(200);
    inspectorToken = inspRes.body.accessToken;
  });

  it('2. GET /api/v1/equipment-types/domains mengembalikan 7 bidang K3 resmi URD', async () => {
    const res = await request(app)
      .get('/api/v1/equipment-types/domains')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.domains).toBeDefined();
    expect(res.body.domains.length).toBeGreaterThanOrEqual(7);

    const codes = res.body.domains.map((d) => d.code);
    expect(codes).toContain('PAPA');
    expect(codes).toContain('PUBT');
    expect(codes).toContain('PTP');
    expect(codes).toContain('ILPP');
    expect(codes).toContain('IPK');
    expect(codes).toContain('ELEVATOR_ESKALATOR');
    expect(codes).toContain('ANCHOR_LIFELINE');
  });

  it('3. GET /api/v1/equipment-types/inspection-types mengembalikan 4 jenis riksa resmi', async () => {
    const res = await request(app)
      .get('/api/v1/equipment-types/inspection-types')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const codes = res.body.inspectionTypes.map((t) => t.code);
    expect(codes).toEqual(expect.arrayContaining(['PERTAMA', 'BERKALA', 'KHUSUS', 'ULANG']));
  });

  it('4. GET /api/v1/equipment-types mendukung filtering per domain dan pencarian', async () => {
    const res = await request(app)
      .get('/api/v1/equipment-types?domainCode=PAPA')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    const allPapa = res.body.items.every((i) => i.domain_code === 'PAPA');
    expect(allPapa).toBe(true);
  });

  let createdTypeId;
  it('5. POST /api/v1/equipment-types: Super Admin dapat menambah jenis unit baru', async () => {
    const uniqueCode = `TEST_UNIT_${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/equipment-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        domainCode: 'PAPA',
        code: uniqueCode,
        name: 'Unit Uji Coba Otomatis',
        description: 'Unit testing otomatis',
        attributeSchema: [
          { key: 'test_attr', label: 'Atribut Uji', unit: 'unit', required: true }
        ],
        isActive: true,
        displayOrder: 99
      });

    expect(res.status).toBe(201);
    expect(res.body.item.id).toBeDefined();
    expect(res.body.item.code).toBe(uniqueCode);
    createdTypeId = res.body.item.id;
  });

  it('6. POST /api/v1/equipment-types: Menolak peran non-Super Admin (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/equipment-types')
      .set('Authorization', `Bearer ${marketingToken}`)
      .send({
        domainCode: 'PAPA',
        code: 'FORBIDDEN_UNIT',
        name: 'Unit Terlarang'
      });

    expect(res.status).toBe(403);
  });

  it('7. PUT & PATCH /api/v1/equipment-types/:id: Ubah data dan toggle status aktif', async () => {
    const updateRes = await request(app)
      .put(`/api/v1/equipment-types/${createdTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Unit Uji Coba Otomatis (Revisi)',
        description: 'Deskripsi yang diperbarui'
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.item.name).toBe('Unit Uji Coba Otomatis (Revisi)');

    // Toggle nonaktif
    const statusRes = await request(app)
      .patch(`/api/v1/equipment-types/${createdTypeId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.item.is_active).toBe(false);
  });

  it('8. DELETE /api/v1/equipment-types/:id: Unit belum direferensikan berhasil dihapus', async () => {
    const delRes = await request(app)
      .delete(`/api/v1/equipment-types/${createdTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
  });

  it('9. DELETE /api/v1/equipment-types/:id: Unit yang telah direferensikan dilindungi dari penghapusan (409 Conflict)', async () => {
    // CRANE a1000000-0000-0000-0000-000000000002 memiliki 4 subjenis aktif
    const delRes = await request(app)
      .delete('/api/v1/equipment-types/a1000000-0000-0000-0000-000000000002')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.status).toBe(409);
    expect(delRes.body.error.code).toBe('CANNOT_DELETE_REFERENCED');
    expect(delRes.body.error.message).toMatch(/tidak dapat dihapus permanen/i);
    expect(delRes.body.error.details.subtypesCount).toBeGreaterThan(0);
  });

  it('10. GET /api/v1/inspections/templates/resolve: Resolver dinamis menemukan template aktif yang sesuai', async () => {
    const resolveRes = await request(app)
      .get('/api/v1/inspections/templates/resolve?domainCode=PAPA&equipmentTypeId=a1000000-0000-0000-0000-000000000001&inspectionTypeCode=BERKALA')
      .set('Authorization', `Bearer ${inspectorToken}`);

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.template).toBeDefined();
    expect(resolveRes.body.versionId).toBeDefined();
    expect(resolveRes.body.items.length).toBeGreaterThan(0);
  });
});
