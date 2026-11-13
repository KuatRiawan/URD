import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { query } from '../database/pool.js';
import { env } from '../config/env.js';

const activityPayload = (objectId, inspectionTypeCode, start, end, notes = null) => ({
  objectId,
  inspectionTypeCode,
  plannedStartAt: start ? new Date(start).toISOString() : null,
  plannedEndAt: end ? new Date(end).toISOString() : null,
  notes
});

describe('Aktivitas Pemeriksaan Mandiri, Persetujuan Jadwal & BAP Awal', () => {
  let marketingToken;
  let pimpinanToken;
  let adminKantorToken;
  let inspectorToken;
  let inspectorId;
  let categoryId;
  let clientId;
  let orderId;

  const auth = (token) => ({ Authorization: `Bearer ${token}` });

  const makeToken = (user, role) =>
    jwt.sign({ sub: user.id, role, fullName: user.full_name, tokenVersion: 1 }, env.jwtSecret, {
      expiresIn: '1h'
    });

  const activityByType = async (orderIdValue, type) => {
    const { rows } = await query(
      `SELECT * FROM inspection_activities WHERE order_id = $1 AND inspection_type_code = $2 ORDER BY created_at ASC`,
      [orderIdValue, type]
    );
    return rows;
  };

  beforeAll(async () => {
    const { rows: users } = await query('SELECT id, role, full_name FROM users WHERE is_active = true');
    const admin = users.find((u) => u.role === 'ADMIN_SISTEM');
    const marketing = users.find((u) => u.role === 'MARKETING');
    const pimpinan = users.find((u) => u.role === 'PIMPINAN');
    const { rows: newInspectorRows } = await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, '$2b$10$abcdefghijklmnopqrstuu', 'Inspector Aktivitas Uji', 'INSPECTOR', true)
       ON CONFLICT (email) DO UPDATE SET is_active = true
       RETURNING id, role, full_name`,
      [`inspector.activities.${Date.now()}@upayariksadaya.com`]
    );
    const inspector = newInspectorRows[0];
    await query(
      `INSERT INTO inspectors (user_id, employee_no) VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [inspector.id, `EMP-ACT-${Date.now()}`]
    );

    const { rows: kantorRows } = await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ('adminkantor.activities@upayariksadaya.com', '$2b$10$abcdefghijklmnopqrstuu', 'Admin Kantor Aktivitas', 'ADMIN_KANTOR', true)
       ON CONFLICT (email) DO UPDATE SET is_active = true, role = 'ADMIN_KANTOR'
       RETURNING id, full_name`
    );
    const kantor = kantorRows[0];

    marketingToken = makeToken(marketing, 'MARKETING');
    pimpinanToken = makeToken(pimpinan, 'PIMPINAN');
    adminKantorToken = makeToken(kantor, 'ADMIN_KANTOR');
    inspectorToken = makeToken(inspector, inspector.role);
    inspectorId = inspector.id;

    const { rows: categories } = await query('SELECT id FROM object_categories ORDER BY id ASC LIMIT 1');
    categoryId = categories[0].id;

    // Pastikan Ahli K3 memiliki kompetensi aktif pada bidang unit yang diuji.
    await query(
      `INSERT INTO inspector_competencies (inspector_id, category_id, certificate_no, valid_from, valid_until)
       VALUES ($1, $2, $3, DATE '2020-01-01', DATE '2035-12-31')
       ON CONFLICT (inspector_id, category_id, certificate_no) DO NOTHING`,
      [inspectorId, categoryId, `SKP-ACT-${Date.now()}`]
    );

    // Pastikan tersedia template inspeksi aktif untuk memulai pemeriksaan & BAP awal.
    const { rows: activeTpl } = await query(
      `SELECT tv.id FROM inspection_templates t
       JOIN inspection_template_versions tv ON tv.template_id = t.id
       WHERE t.category_id = $1 AND tv.status = 'AKTIF' LIMIT 1`,
      [categoryId]
    );
    if (!activeTpl[0]) {
      const { rows: tpl } = await query(
        `INSERT INTO inspection_templates (category_id, name, created_by)
         VALUES ($1, $2, $3) RETURNING id`,
        [categoryId, `Template Aktivitas ${Date.now()}`, admin.id]
      );
      const { rows: ver } = await query(
        `INSERT INTO inspection_template_versions (template_id, version, status, is_validated, published_at, created_by)
         VALUES ($1, 1, 'AKTIF', true, now(), $2) RETURNING id`,
        [tpl[0].id, admin.id]
      );
      await query(
        `INSERT INTO inspection_template_items (version_id, seq, section, label, input_type, is_required)
         VALUES ($1, 1, 'Pemeriksaan Visual', 'Kondisi umum unit', 'CHOICE', true)`,
        [ver[0].id]
      );
    }

    const { rows: client } = await query(
      `INSERT INTO clients (name, npwp, address, phone, email, is_active)
       VALUES ($1, $2, 'Kawasan Industri Aktivitas', '021-77770001', 'aktivitas@klien.test', true)
       RETURNING id`,
      [`PT Klien Aktivitas ${Date.now()}`, `09.${Date.now().toString().slice(-8)}`]
    );
    clientId = client[0].id;
  });

  it('membuat satu PO dengan banyak unit dan banyak aktivitas pemeriksaan berbeda jadwal', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set(auth(marketingToken))
      .send({
        poNumber: `PO-URD-ACT-${Date.now()}`,
        poDate: '2026-01-02',
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        clientId,
        serviceType: 'PEMERIKSAAN_BERKALA',
        source: 'DOKUMEN_PO',
        units: [
          { categoryId, name: 'Forklift Unit A', serialNumber: `ACT-A-${Date.now()}` },
          { categoryId, name: 'Mobile Crane Unit B', serialNumber: `ACT-B-${Date.now()}` }
        ]
      });

    expect(res.status).toBe(201);
    orderId = res.body.order.id;
    expect(res.body.order.valid_from).toBeTruthy();
    expect(res.body.order.valid_until).toBeTruthy();

    const detail = await request(app).get(`/api/v1/orders/${orderId}`).set(auth(marketingToken));
    expect(detail.status).toBe(200);
    expect(detail.body.objects).toHaveLength(2);
    expect(detail.body.activities).toHaveLength(0);

    const [unitA, unitB] = detail.body.objects;

    const first = await request(app)
      .post(`/api/v1/orders/${orderId}/activities`)
      .set(auth(marketingToken))
      .send(activityPayload(unitA.id, 'PERTAMA', '2026-02-10T08:00:00.000Z', '2026-02-10T16:00:00.000Z'));
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    expect(first.body.activity.inspection_type_code).toBe('PERTAMA');

    const second = await request(app)
      .post(`/api/v1/orders/${orderId}/activities`)
      .set(auth(marketingToken))
      .send(activityPayload(unitB.id, 'BERKALA', '2026-03-12T08:00:00.000Z', '2026-03-12T16:00:00.000Z'));
    expect(second.status).toBe(201);
    expect(second.body.activity.schedule_status).toBe('DIUSULKAN');
    expect(second.body.activity.status).toBe('MENUNGGU_PERSETUJUAN');

    const third = await request(app)
      .post(`/api/v1/orders/${orderId}/activities`)
      .set(auth(marketingToken))
      .send(activityPayload(unitA.id, 'KHUSUS', '2026-06-15T08:00:00.000Z', '2026-06-15T16:00:00.000Z'));
    expect(third.status).toBe(201);

    const detail2 = await request(app).get(`/api/v1/orders/${orderId}`).set(auth(marketingToken));
    const types = detail2.body.activities.map((a) => a.inspection_type_code);
    expect(new Set(types).size).toBe(3);
    expect(detail2.body.activities).toHaveLength(3);

    const duplicate = await request(app)
      .post(`/api/v1/orders/${orderId}/activities`)
      .set(auth(marketingToken))
      .send(activityPayload(unitA.id, 'PERTAMA', '2026-04-10T08:00:00.000Z', '2026-04-10T16:00:00.000Z'));
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_ACTIVITY');
  });

  it('menolak jadwal di luar masa berlaku PO dan mencatat riwayat perubahan jadwal', async () => {
    const detail = await request(app).get(`/api/v1/orders/${orderId}`).set(auth(marketingToken));
    const unit = detail.body.objects[0];
    const outside = await request(app)
      .post(`/api/v1/orders/${orderId}/activities`)
      .set(auth(marketingToken))
      .send(activityPayload(unit.id, 'ULANG', '2027-02-10T08:00:00.000Z', '2027-02-10T16:00:00.000Z'));
    expect(outside.status).toBe(400);
    expect(outside.body.error.code).toBe('SCHEDULE_OUTSIDE_PO_VALIDITY');

    const activity = (await activityByType(orderId, 'KHUSUS'))[0];
    const reschedule = await request(app)
      .patch(`/api/v1/orders/${orderId}/activities/${activity.id}/schedule`)
      .set(auth(adminKantorToken))
      .send({
        startAt: new Date('2026-07-01T08:00:00.000Z').toISOString(),
        endAt: new Date('2026-07-01T16:00:00.000Z').toISOString(),
        reason: 'Permintaan perubahan jadwal dari PIC klien'
      });
    expect(reschedule.status).toBe(200);

    const { rows: history } = await query(
      `SELECT action, note, snapshot FROM inspection_activity_history
       WHERE activity_id = $1 ORDER BY id ASC`,
      [activity.id]
    );
    expect(history.some((h) => h.action === 'SCHEDULE_CHANGED')).toBe(true);
    const changed = history.find((h) => h.action === 'SCHEDULE_CHANGED');
    expect(changed.snapshot.previous.startAt).toBeTruthy();
    expect(changed.note).toContain('PIC klien');
  });

  it('Manager hanya dapat menyetujui/menolak jadwal dan wajib memberi alasan penolakan', async () => {
    const berkala = (await activityByType(orderId, 'BERKALA'))[0];

    const noReason = await request(app)
      .post(`/api/v1/orders/${orderId}/activities/${berkala.id}/approval`)
      .set(auth(pimpinanToken))
      .send({ decision: 'DITOLAK' });
    expect(noReason.status).toBe(400);

    const rejected = await request(app)
      .post(`/api/v1/orders/${orderId}/activities/${berkala.id}/approval`)
      .set(auth(pimpinanToken))
      .send({ decision: 'DITOLAK', reason: 'Unit belum siap dioperasikan pada tanggal tersebut' });
    expect(rejected.status).toBe(200);
    expect(rejected.body.activity.schedule_status).toBe('DITOLAK');
    expect(rejected.body.activity.rejection_reason).toContain('belum siap');

    const khusus = (await activityByType(orderId, 'KHUSUS'))[0];
    const approved = await request(app)
      .post(`/api/v1/orders/${orderId}/activities/${khusus.id}/approval`)
      .set(auth(pimpinanToken))
      .send({ decision: 'DISETUJUI' });
    expect(approved.status).toBe(200);
    expect(approved.body.activity.schedule_status).toBe('DISETUJUI');
    expect(approved.body.activity.status).toBe('TERJADWAL');

    const inspectorAttempt = await request(app)
      .post(`/api/v1/orders/${orderId}/activities/${khusus.id}/approval`)
      .set(auth(inspectorToken))
      .send({ decision: 'DISETUJUI' });
    expect(inspectorAttempt.status).toBe(403);

    // Manager tidak memiliki wewenang teknis/dokumen.
    const statusAttempt = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(auth(pimpinanToken))
      .send({ status: 'SELESAI' });
    expect(statusAttempt.status).toBe(403);

    const { rows: history } = await query(
      `SELECT action, schedule_status FROM inspection_activity_history WHERE activity_id = $1 ORDER BY id ASC`,
      [berkala.id]
    );
    expect(history.some((h) => h.action === 'SCHEDULE_REJECTED')).toBe(true);
  });

  it('menjaga progres unit tetap mandiri setelah satu jadwal disetujui dan lainnya ditolak', async () => {
    const { rows: units } = await query(
      `SELECT oo.object_id, oo.unit_status, t.name
       FROM order_objects oo JOIN test_objects t ON t.id = oo.object_id
       WHERE oo.order_id = $1 ORDER BY t.name ASC`,
      [orderId]
    );
    const activeStatuses = units.map((u) => u.unit_status);
    expect(activeStatuses).toContain('TERJADWAL');
    expect(activeStatuses).toContain('BELUM_DIJADWALKAN');
    // Unit yang jadwalnya dikembalikan tidak memblokir unit lain yang sudah terjadwal.
    expect(new Set(activeStatuses).size).toBeGreaterThan(1);
  });

  it('penugasan Ahli K3 hanya setelah jadwal disetujui dan bukan oleh Marketing', async () => {
    const khusus = (await activityByType(orderId, 'KHUSUS'))[0];

    const marketingAssign = await request(app)
      .post(`/api/v1/orders/${orderId}/activities/${khusus.id}/assign`)
      .set(auth(marketingToken))
      .send({ inspectorId });
    expect(marketingAssign.status).toBe(403);

    const pending = (await activityByType(orderId, 'PERTAMA'))[0];
    const beforeApproval = await request(app)
      .post(`/api/v1/orders/${orderId}/activities/${pending.id}/assign`)
      .set(auth(adminKantorToken))
      .send({ inspectorId });
    expect(beforeApproval.status).toBe(409);
    expect(beforeApproval.body.error.code).toBe('SCHEDULE_NOT_APPROVED');

    const assigned = await request(app)
      .post(`/api/v1/orders/${orderId}/activities/${khusus.id}/assign`)
      .set(auth(adminKantorToken))
      .send({ inspectorId });
    expect(assigned.status, JSON.stringify(assigned.body)).toBe(200);
    expect(assigned.body.activity.status).toBe('DITUGASKAN');
    expect(assigned.body.activity.inspector_id).toBe(inspectorId);
  });

  it('Inspector dapat memproses BAP sebelum checklist selesai tanpa menandai pemeriksaan selesai', async () => {
    const khusus = (await activityByType(orderId, 'KHUSUS'))[0];

    const prepared = await request(app)
      .post('/api/v1/bap/prepare')
      .set(auth(inspectorToken))
      .send({ orderId, activityId: khusus.id });
    expect(prepared.status).toBe(201);
    expect(prepared.body.bap.status).toBe('DRAF');
    expect(prepared.body.bap.bap_no).toBeTruthy();

    const { rows: inspectionRows } = await query(
      'SELECT status, activity_id FROM inspections WHERE activity_id = $1',
      [khusus.id]
    );
    expect(inspectionRows[0].status).toBe('DRAF');

    const { rows: activityRows } = await query('SELECT status FROM inspection_activities WHERE id = $1', [
      khusus.id
    ]);
    expect(activityRows[0].status).not.toBe('SELESAI');

    const { rows: unitRows } = await query(
      `SELECT unit_status FROM order_objects WHERE order_id = $1 AND object_id = $2`,
      [orderId, khusus.object_id]
    );
    expect(unitRows[0].unit_status).not.toBe('SELESAI');
  });

  it('memulai pemeriksaan berdasarkan aktivitas dan menandai aktivitas sedang diperiksa', async () => {
    const khusus = (await activityByType(orderId, 'KHUSUS'))[0];
    const res = await request(app)
      .post('/api/v1/inspections/start')
      .set(auth(inspectorToken))
      .send({ activityId: khusus.id });
    expect(res.status).toBe(201);
    expect(res.body.inspection.activity_id).toBe(khusus.id);

    const { rows } = await query('SELECT status FROM inspection_activities WHERE id = $1', [khusus.id]);
    expect(rows[0].status).toBe('SEDANG_DIPERIKSA');
  });

  it('LHPP dapat diperbaiki dan diajukan ulang setelah dikembalikan Admin Kantor', async () => {
    const khusus = (await activityByType(orderId, 'KHUSUS'))[0];
    const { rows: inspRows } = await query('SELECT id FROM inspections WHERE activity_id = $1', [khusus.id]);
    const inspectionId = inspRows[0].id;

    const { rows: lhppRows } = await query(
      `INSERT INTO lhpp_documents (inspection_id, lhpp_no, status, version, method_summary, prepared_by)
       VALUES ($1, $2, 'SIAP_PREVIEW', 1, 'Metode pemeriksaan awal sesuai standar K3', $3)
       ON CONFLICT (inspection_id) DO UPDATE SET status = 'SIAP_PREVIEW'
       RETURNING id`,
      [inspectionId, `LHPP/ACT/${Date.now()}`, inspectorId]
    );
    const lhppId = lhppRows[0].id;

    const returned = await request(app)
      .post(`/api/v1/lhpp/${lhppId}/return`)
      .set(auth(adminKantorToken))
      .send({ note: 'Lengkapi hasil pengukuran dan perbaiki narasi kesimpulan teknis.' });
    expect(returned.status).toBe(200);
    expect(returned.body.lhpp.status).toBe('DIKEMBALIKAN');

    const edited = await request(app)
      .put(`/api/v1/lhpp/${lhppId}/draft`)
      .set(auth(inspectorToken))
      .send({
        methodSummary: 'Metode pemeriksaan telah diperbaiki sesuai catatan Admin Kantor',
        recommendations: 'Lakukan pengujian ulang pada periode berikutnya'
      });
    expect(edited.status).toBe(200);

    const resubmitted = await request(app)
      .post(`/api/v1/lhpp/${lhppId}/submit-finalization`)
      .set(auth(inspectorToken));
    expect(resubmitted.status).toBe(200);
    expect(resubmitted.body.lhpp.status).toBe('SIAP_PREVIEW');
    expect(resubmitted.body.lhpp.version).toBe(2);

    const { rows: history } = await query(
      `SELECT action FROM lhpp_revisions WHERE lhpp_id = $1 ORDER BY id ASC`,
      [lhppId]
    );
    expect(history.some((h) => h.action === 'RETURNED')).toBe(true);
    expect(history.some((h) => h.action === 'SUBMIT_FINALIZATION')).toBe(true);
  });
});
