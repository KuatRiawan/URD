import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import * as poolModule from '../database/pool.js';
import { app } from '../app.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

describe('Search and Work Queue API Modules', () => {
  const adminId = '11111111-1111-1111-1111-111111111111';
  const inspectorId = '22222222-2222-2222-2222-222222222222';
  const managerId = '33333333-3333-4333-8333-333333333333';

  const adminToken = jwt.sign(
    { sub: adminId, role: 'ADMIN_KANTOR', fullName: 'Admin URD' },
    env.jwtSecret,
    { expiresIn: '1h' }
  );

  const inspectorToken = jwt.sign(
    { sub: inspectorId, role: 'AHLI_K3', fullName: 'Budi Santoso' },
    env.jwtSecret,
    { expiresIn: '1h' }
  );

  const managerToken = jwt.sign(
    { sub: managerId, role: 'PIMPINAN', fullName: 'Pimpinan URD' },
    env.jwtSecret,
    { expiresIn: '1h' }
  );

  it('menolak akses global search tanpa autentikasi (401)', async () => {
    const res = await request(app).get('/api/v1/search?q=Crane');
    expect(res.status).toBe(401);
  });

  it('mengembalikan array kosong jika query kurang dari 2 karakter', async () => {
  const querySpy = vi.spyOn(poolModule, 'query').mockImplementation(async (sql, _params) => {
      if (sql.includes('FROM users WHERE id = $1')) {
        return {
          rows: [
            {
              id: adminId,
              email: 'admin.kantor@upayariksadaya.com',
              full_name: 'Admin URD',
              role: 'ADMIN_KANTOR',
              phone: '08123456789',
              is_active: true
            }
          ]
        };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .get('/api/v1/search?q=a')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.results).toEqual([]);

    querySpy.mockRestore();
  });

  it('menjalankan pencarian global dan mengelompokkan kategori hasil dengan benar', async () => {
    const querySpy = vi.spyOn(poolModule, 'query').mockImplementation(async (sql) => {
      if (sql.includes('FROM users WHERE id = $1')) {
        return {
          rows: [
            {
              id: adminId,
              email: 'admin.kantor@upayariksadaya.com',
              full_name: 'Admin URD',
              role: 'ADMIN_KANTOR',
              phone: '08123456789',
              is_active: true
            }
          ]
        };
      }
      if (sql.includes('FROM orders o')) {
        return {
          rows: [
            {
              id: 'ord-1',
              order_no: 'ORD-2026-001',
              po_number: 'PO-2026-99',
              status: 'SEDANG_DIPERIKSA',
              client_name: 'PT Mitra Sukses',
              service_type: 'BERKALA'
            }
          ]
        };
      }
      if (sql.includes('FROM clients')) {
        return {
          rows: [
            {
              id: 'cl-1',
              name: 'PT Mitra Sukses',
              address: 'Jl. Industri No. 5',
              phone: '021-123456',
              is_active: true
            }
          ]
        };
      }
      if (sql.includes('FROM test_objects t')) {
        return {
          rows: [
            {
              id: 'obj-1',
              name: 'Overhead Crane 10 Ton',
              serial_number: 'CRN-888',
              category_code: 'PAA',
              client_name: 'PT Mitra Sukses'
            }
          ]
        };
      }
      if (sql.includes('FROM bap_documents b')) {
        return {
          rows: [
            {
              id: 'bap-1',
              bap_no: 'BAP/URD/2026/001',
              status: 'FINAL',
              object_name: 'Overhead Crane 10 Ton',
              client_name: 'PT Mitra Sukses'
            }
          ]
        };
      }
      if (sql.includes('FROM lhpp_documents l')) {
        return {
          rows: [
            {
              id: 'lhpp-1',
              lhpp_no: '001/INSP-PAA/URD/2026',
              status: 'TERBIT',
              conclusion: 'MEMENUHI_SYARAT_K3',
              object_name: 'Overhead Crane 10 Ton',
              client_name: 'PT Mitra Sukses'
            }
          ]
        };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .get('/api/v1/search?q=Mitra')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    expect(res.body.results.some((r) => r.type === 'ORDER')).toBe(true);
    expect(res.body.results.some((r) => r.type === 'CLIENT')).toBe(true);
    expect(res.body.results.some((r) => r.type === 'OBJECT')).toBe(true);
    expect(res.body.results.some((r) => r.type === 'BAP')).toBe(true);
    expect(res.body.results.some((r) => r.type === 'LHPP')).toBe(true);

    querySpy.mockRestore();
  });

  it('mengambil antrean pekerjaan terpadu (Work Queue) dengan benar untuk Admin', async () => {
    const querySpy = vi.spyOn(poolModule, 'query').mockImplementation(async (sql) => {
      if (sql.includes('FROM users WHERE id = $1')) {
        return {
          rows: [
            {
              id: adminId,
              email: 'admin.kantor@upayariksadaya.com',
              full_name: 'Admin URD',
              role: 'ADMIN_KANTOR',
              phone: '08123456789',
              is_active: true
            }
          ]
        };
      }
      if (sql.includes("o.status = 'ORDER_BARU'")) {
        return {
          rows: [
            {
              id: 'ord-new-1',
              order_no: 'ORD-NEW-001',
              po_number: 'PO-NEW-01',
              created_at: new Date().toISOString(),
              client_name: 'PT Klien Baru',
              service_type: 'PERTAMA'
            }
          ]
        };
      }
      if (sql.includes("a.status = 'MENUNGGU'")) {
        return {
          rows: [
            {
              id: 'asg-1',
              order_id: 'ord-1',
              created_at: new Date().toISOString(),
              order_no: 'ORD-001',
              po_number: 'PO-01',
              client_name: 'PT Klien A',
              inspector_name: 'Budi Santoso'
            }
          ]
        };
      }
      if (sql.includes("i.status = 'DRAF'")) {
        return {
          rows: [
            {
              id: 'insp-1',
              order_id: 'ord-1',
              created_at: new Date().toISOString(),
              order_no: 'ORD-001',
              object_name: 'Forklift',
              client_name: 'PT Klien A',
              inspector_name: 'Budi Santoso'
            }
          ]
        };
      }
      if (sql.includes("l.status = 'SIAP_PREVIEW'")) {
        return {
          rows: [
            {
              id: 'lhpp-rev-1',
              lhpp_no: 'LHPP-DRAF',
              status: 'SIAP_PREVIEW',
              created_at: new Date().toISOString(),
              object_name: 'Boiler',
              client_name: 'PT Klien A',
              inspector_name: 'Budi Santoso'
            }
          ]
        };
      }
      if (sql.includes("l.status = 'DIKEMBALIKAN'")) {
        return { rows: [] };
      }
      if (sql.includes("s.status = 'TERBIT'")) {
        return {
          rows: [
            {
              id: 'suk-1',
              suket_no: 'SUKET-001',
              valid_until: new Date(Date.now() + 10 * 86400000).toISOString(),
              object_name: 'Boiler',
              client_name: 'PT Klien A',
              days_remaining: 10
            }
          ]
        };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .get('/api/v1/dashboard/work-queue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    expect(res.body.items.some((i) => i.type === 'ORDER_SCHEDULING')).toBe(true);
    expect(res.body.items.some((i) => i.type === 'ASSIGNMENT_CONFIRMATION')).toBe(true);
    expect(res.body.items.some((i) => i.type === 'INSPECTION_DRAFT')).toBe(true);
    expect(res.body.items.some((i) => i.type === 'LHPP_REVIEW')).toBe(true);
    expect(res.body.items.some((i) => i.type === 'SUKET_EXPIRING')).toBe(true);

    querySpy.mockRestore();
  });

  it('mengembalikan summary dashboard lengkap dengan recentActivities untuk admin', async () => {
    const querySpy = vi.spyOn(poolModule, 'query').mockImplementation(async (sql) => {
      if (sql.includes('FROM users WHERE id = $1')) {
        return {
          rows: [
            {
              id: adminId,
              email: 'admin.kantor@upayariksadaya.com',
              full_name: 'Admin URD',
              role: 'ADMIN_KANTOR',
              is_active: true
            }
          ]
        };
      }
      if (sql.includes('FROM audit_logs a')) {
        return {
          rows: [
            {
              id: '1',
              action: 'LOGIN',
              entity: 'auth',
              entity_id: 'usr-1',
              summary: { note: 'Login berhasil' },
              created_at: new Date().toISOString(),
              user_name: 'Admin URD',
              user_role: 'ADMIN_KANTOR'
            }
          ]
        };
      }
      if (sql.includes('FROM orders o') && sql.includes('LIMIT 8')) {
        return {
          rows: [
            {
              id: 'ord-1',
              order_no: 'ORD-2026-001',
              status: 'TERJADWAL',
              service_type: 'PEMERIKSAAN_BERKALA',
              created_at: new Date().toISOString(),
              client_name: 'PT Klien A'
            }
          ]
        };
      }
      if (sql.includes('round(avg(EXTRACT(EPOCH')) {
        return {
          rows: [
            {
              total: 5,
              new_orders: 1,
              active_orders: 3,
              completed_orders: 1,
              avg_completion_hours: 24.5
            }
          ]
        };
      }
      if (sql.includes('FROM lhpp_documents')) {
        return {
          rows: [
            {
              total: 4,
              ready_finalize: 2,
              published: 2,
              returned: 0
            }
          ]
        };
      }
      if (sql.includes('FROM suket_documents')) {
        return {
          rows: [
            {
              within_30_days: 1,
              within_90_days: 3
            }
          ]
        };
      }
      if (sql.includes('active_clients')) {
        return {
          rows: [
            {
              active_clients: 10,
              active_objects: 25
            }
          ]
        };
      }
      if (sql.includes('overdue_count')) {
        return { rows: [{ overdue_count: 0 }] };
      }
      if (sql.includes('object_categories oc')) {
        return {
          rows: [
            { code: 'PAA', name: 'Pesawat Angkat & Angkut', unit_count: 10 }
          ]
        };
      }
      if (sql.includes('region_name')) {
        return {
          rows: [
            { region_name: 'Jakarta', order_count: 2, unit_count: 5, client_count: 2 }
          ]
        };
      }
      if (sql.includes('generate_series')) {
        return {
          rows: [
            { month_key: '2026-01', month_label: 'Jan', order_count: 2, completed_count: 1 }
          ]
        };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
    expect(res.body.metrics.activeOrders).toBe(3);
    expect(res.body.recentActivities).toBeDefined();
    expect(res.body.recentActivities.length).toBe(1);
    expect(res.body.recentActivities[0].action).toBe('LOGIN');

    querySpy.mockRestore();
  });

  it('membatasi aktivitas terbaru dashboard Inspector ke audit log miliknya sendiri', async () => {
    let recentActivityQuery;
    let recentActivityParams;
    const querySpy = vi.spyOn(poolModule, 'query').mockImplementation(async (sql, params) => {
      if (sql.includes('FROM users WHERE id = $1')) {
        return {
          rows: [{
            id: inspectorId,
            email: 'inspector@upayariksadaya.com',
            full_name: 'Inspector URD',
            role: 'AHLI_K3',
            is_active: true
          }]
        };
      }
      if (sql.includes('FROM audit_logs a')) {
        recentActivityQuery = sql;
        recentActivityParams = params;
        return { rows: [] };
      }
      if (sql.includes('FROM inspections WHERE inspector_id')) {
        return { rows: [{ draft_count: 0, submitted_count: 0 }] };
      }
      if (sql.includes('FROM lhpp_documents l')) {
        return { rows: [{ returned_count: 0, published_count: 0 }] };
      }
      if (sql.includes('FROM bap_documents b')) {
        return { rows: [{ draft_bap_count: 0, final_bap_count: 0 }] };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${inspectorToken}`);

    expect(res.status).toBe(200);
    expect(recentActivityQuery).toMatch(/WHERE a\.user_id = \$1/);
    expect(recentActivityParams).toEqual([inspectorId]);
    expect(res.body.recentActivities).toEqual([]);

    querySpy.mockRestore();
  });

  it('menampilkan antrean LHPP sebagai pemantauan untuk Pimpinan tanpa aksi review', async () => {
    const querySpy = vi.spyOn(poolModule, 'query').mockImplementation(async (sql) => {
      if (sql.includes('FROM users WHERE id = $1')) {
        return {
          rows: [{
            id: managerId,
            email: 'pimpinan@upayariksadaya.com',
            full_name: 'Pimpinan URD',
            role: 'PIMPINAN',
            is_active: true
          }]
        };
      }
      if (sql.includes('FROM lhpp_documents l') && sql.includes("l.status = 'SIAP_PREVIEW'")) {
        return {
          rows: [{
            id: '55555555-5555-4555-8555-555555555555',
            status: 'SIAP_PREVIEW',
            created_at: new Date().toISOString(),
            object_name: 'Overhead Crane',
            client_name: 'PT Klien A',
            inspector_name: 'Inspector URD'
          }]
        };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .get('/api/v1/dashboard/work-queue')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    const lhpp = res.body.items.find((item) => item.type === 'LHPP_REVIEW');
    expect(lhpp.actionLabel).toBe('Pantau Status');
    expect(lhpp.title).toContain('LHPP Siap Finalisasi');
    expect(lhpp.title).not.toContain('Persetujuan Pimpinan');

    querySpy.mockRestore();
  });

});
