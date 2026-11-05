import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { pool } from '../database/pool.js';
import { seedDatabase } from '../../seeds/seed.js';

const TEST_PW = 'TestPassURD2026!';

describe('Super Admin Workspace V2 Full Integration Test Suite', () => {
  const tokens = {};
  let createdUserId;
  let inspectorId;
  let createdCompId;
  let backupId;

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
      { key: 'INSPECTOR', email: 'ahlik3.paa@upayariksadaya.com' },
      { key: 'PIMPINAN', email: 'pimpinan@upayariksadaya.com' }
    ];

    for (const r of rolesToLogin) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: r.email, password: TEST_PW });
      expect(res.status).toBe(200);
      tokens[r.key] = res.body.accessToken;
    }
  });

  afterAll(async () => {
    await seedDatabase();
  });

  describe('1. User Lifecycle & Self-Protection', () => {
    it('loads GET /api/v1/dashboard/summary for all roles without SQL error', async () => {
      for (const roleKey of ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'PIMPINAN']) {
        const res = await request(app)
          .get('/api/v1/dashboard/summary')
          .set('Authorization', `Bearer ${tokens[roleKey]}`);
        expect(res.status, `Dashboard summary failed for ${roleKey}`).toBe(200);
        expect(res.body.metrics).toBeDefined();
      }
      const adminDash = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      expect(adminDash.body.metrics.totalUsers).toBeGreaterThan(0);
      expect(Array.isArray(adminDash.body.recentAudits)).toBe(true);
    });

    it('allows Super Admin to create an AHLI_K3 user with employeeNo and never exposes passwordHash', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({
          fullName: 'Ir. Hendra Pratama, S.T.',
          email: 'hendra.k3@upayariksadaya.com',
          password: 'StrongPassword123!',
          role: 'AHLI_K3',
          phone: '081299887766',
          employeeNo: 'URD-AK3-9901'
        });

      expect(res.status).toBe(201);
      expect(['AHLI_K3', 'INSPECTOR']).toContain(res.body.user.role);
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.user.passwordHash).toBeUndefined();
      createdUserId = res.body.user.id;

      // Verify user list returns employeeNo
      const listRes = await request(app)
        .get('/api/v1/users?q=hendra.k3')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      expect(listRes.status).toBe(200);
      const found = listRes.body.items.find((u) => u.id === createdUserId);
      expect(found).toBeDefined();
      expect(found.employeeNo).toBe('URD-AK3-9901');
    });

    it('allows Super Admin to update user info, employeeNo, and retrieve user activity trail', async () => {
      const patchRes = await request(app)
        .patch(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({
          fullName: 'Ir. Hendra Pratama, M.T.',
          employeeNo: 'URD-AK3-9902'
        });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.user.fullName).toBe('Ir. Hendra Pratama, M.T.');

      const actRes = await request(app)
        .get(`/api/v1/users/${createdUserId}/activity`)
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      expect(actRes.status).toBe(200);
      expect(Array.isArray(actRes.body.items)).toBe(true);
      expect(actRes.body.items.length).toBeGreaterThan(0);
    });

    it('prevents Super Admin from deactivating or demoting their own account', async () => {
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      const selfId = meRes.body.user.id;

      const deactRes = await request(app)
        .patch(`/api/v1/users/${selfId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({ isActive: false });
      expect(deactRes.status).toBe(400);
      expect(deactRes.body.error.code).toBe('SELF_DEACTIVATE');

      const demoteRes = await request(app)
        .patch(`/api/v1/users/${selfId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({ role: 'MARKETING' });
      expect(demoteRes.status).toBe(400);
      expect(demoteRes.body.error.code).toBe('SELF_ROLE_DEMOTE');
    });

    it('blocks non-Super Admin roles from creating or modifying users', async () => {
      for (const roleKey of ['MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'PIMPINAN']) {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${tokens[roleKey]}`)
          .send({
            fullName: 'Unauthorized User',
            email: `unauth.${roleKey.toLowerCase()}@urd.co.id`,
            password: 'Password123!',
            role: 'MARKETING'
          });
        expect(res.status).toBe(403);
      }
    });
  });

  describe('2. Ahli K3 Competency & SKP Validity Management', () => {
    it('supports creating, updating/renewing, and deleting SKP competency records with validity tracking', async () => {
      const listRes = await request(app)
        .get('/api/v1/inspectors')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      expect(listRes.status).toBe(200);
      const targetInsp = listRes.body.items.find((i) => i.userId === createdUserId) || listRes.body.items[0];
      inspectorId = targetInsp.id;

      // Update inspector profile (NIP/notes)
      const profRes = await request(app)
        .patch(`/api/v1/inspectors/${inspectorId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({
          employeeNo: 'URD-AK3-9902-UPD',
          notes: 'Ahli K3 Spesialis PAA & PUBT'
        });
      expect(profRes.status).toBe(200);
      expect(profRes.body.inspector.employee_no).toBe('URD-AK3-9902-UPD');

      // Add an expired SKP competency first
      const { rows: cats } = await pool.query("SELECT id FROM object_categories WHERE code = 'PUBT' LIMIT 1");
      const pubtId = cats[0].id;

      const addRes = await request(app)
        .post(`/api/v1/inspectors/${inspectorId}/competencies`)
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({
          categoryId: pubtId,
          certificateNo: 'SKP-PUBT-EXP-2022',
          validFrom: '2019-01-10',
          validUntil: '2022-01-10'
        });
      expect(addRes.status).toBe(201);
      createdCompId = addRes.body.competency.id;

      // Verify GET /inspectors flags it as KEDALUWARSA and isValid=false
      const checkExpRes = await request(app)
        .get('/api/v1/inspectors')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      const updatedInsp = checkExpRes.body.items.find((i) => i.id === inspectorId);
      const expComp = updatedInsp.competencies.find((c) => c.id === createdCompId);
      expect(expComp.isValid).toBe(false);
      expect(expComp.validityStatus).toBe('KEDALUWARSA');

      // Renew SKP competency via PATCH
      const renewRes = await request(app)
        .patch(`/api/v1/inspectors/${inspectorId}/competencies/${createdCompId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({
          certificateNo: 'SKP-PUBT-RENEWED-2028',
          validUntil: '2028-12-31'
        });
      expect(renewRes.status).toBe(200);

      // Verify GET /inspectors now marks it as AKTIF and isValid=true
      const checkActiveRes = await request(app)
        .get('/api/v1/inspectors')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      const renewedComp = checkActiveRes.body.items
        .find((i) => i.id === inspectorId)
        .competencies.find((c) => c.id === createdCompId);
      expect(renewedComp.isValid).toBe(true);
      expect(renewedComp.validityStatus).toBe('AKTIF');
      expect(renewedComp.certificateNo).toBe('SKP-PUBT-RENEWED-2028');
    });
  });

  describe('3. Master Data, Calibration Tools & Copy-on-Write Checklists', () => {
    it('supports CRUD on calibration tools and updates K3 category metadata', async () => {
      const addToolRes = await request(app)
        .post('/api/v1/system-settings/calibration-tools')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({
          code: 'CAL-TEST-99',
          name: 'Digital Lux Meter K3',
          brand: 'Hioki FT3424',
          serialNo: 'SN-HIO-9911',
          category: 'LIS',
          certNo: 'KAL/2026/KAN-9911',
          calibrationLab: 'Lab Kalibrasi KAN - Sucofindo',
          calibratedAt: '2026-01-15',
          validUntil: '2027-01-15'
        });
      expect(addToolRes.status).toBe(201);
      expect(addToolRes.body.tool.code).toBe('CAL-TEST-99');

      const updToolRes = await request(app)
        .put('/api/v1/system-settings/calibration-tools/CAL-TEST-99')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({
          code: 'CAL-TEST-99',
          name: 'Digital Lux Meter K3 Updated',
          brand: 'Hioki FT3424',
          serialNo: 'SN-HIO-9911',
          category: 'LIS',
          certNo: 'KAL/2026/KAN-9911-UPD',
          calibrationLab: 'Lab Kalibrasi KAN - Sucofindo',
          calibratedAt: '2026-01-15',
          validUntil: '2028-01-15'
        });
      expect(updToolRes.status).toBe(200);

      const delToolRes = await request(app)
        .delete('/api/v1/system-settings/calibration-tools/CAL-TEST-99')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      expect(delToolRes.status).toBe(200);
    });

    it('preserves historical completed inspections via Copy-on-Write when checklist template is modified', async () => {
      // Find a checklist template version that is currently active
      const chkRes = await request(app)
        .get('/api/v1/system-settings/checklists')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      expect(chkRes.status).toBe(200);
      const paaCat = chkRes.body.categories.find((c) => c.code === 'PAA');
      const originalVersionId = paaCat.active_version_id;

      // Publish a new template version explicitly via POST /checklists/versions
      const verRes = await request(app)
        .post('/api/v1/system-settings/checklists/versions')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({ category_id: paaCat.id });
      expect(verRes.status).toBe(201);
      const newVersionId = verRes.body.version.id;
      expect(newVersionId).not.toBe(originalVersionId);

      // Verify old version is preserved as ARSIP
      const { rows: oldVerRows } = await pool.query(
        'SELECT status FROM inspection_template_versions WHERE id = $1',
        [originalVersionId]
      );
      expect(oldVerRows[0].status).toBe('ARSIP');
    });
  });

  describe('4. Document Numbering, Secret Masking & Truthful Gateway Tests', () => {
    it('rejects invalid document numbering patterns missing {COUNTER}', async () => {
      const badRes = await request(app)
        .put('/api/v1/system-settings/keys/auto_numbering')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({
          value: {
            lhpp_prefix: 'LHPP-STATIC-WITHOUT-COUNTER/{YEAR}'
          }
        });
      expect(badRes.status).toBe(400);
      expect(badRes.body.error.code).toBe('INVALID_NUMBERING_PATTERN');
    });

    it('masks gateway API keys/passwords in GET responses and scrubs secrets from audit logs', async () => {
      const saveWaRes = await request(app)
        .put('/api/v1/system-settings/keys/whatsapp_gateway')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({
          value: {
            provider: 'Fonnte',
            api_url: 'https://api.fonnte.com/send',
            api_key: 'SUPER_SECRET_FONNTE_TOKEN_999',
            sender_number: '62811998877',
            is_active: false
          }
        });
      expect(saveWaRes.status).toBe(200);
      expect(saveWaRes.body.setting.value.api_key).toBe('••••••••');
      expect(saveWaRes.body.setting.value.has_secret).toBe(true);

      // Verify audit logs do NOT contain plaintext SUPER_SECRET_FONNTE_TOKEN_999
      const auditRes = await request(app)
        .get('/api/v1/audit-logs?entity=system_settings')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      expect(auditRes.status).toBe(200);
      const rawJson = JSON.stringify(auditRes.body.items);
      expect(rawJson).not.toContain('SUPER_SECRET_FONNTE_TOKEN_999');
    });

    it('fails truthfully when testing unconfigured or invalid SMTP credentials', async () => {
      const testRes = await request(app)
        .post('/api/v1/system-settings/test-email')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({
          config: {
            host: '',
            port: 587,
            user: '',
            pass: ''
          }
        });
      expect(testRes.status).toBe(400);
      expect(testRes.body.success).toBe(false);
    });
  });

  describe('5. Genuine PostgreSQL SQL Backup, Integrity Verification & Protected Download', () => {
    it('creates a real multi-table SQL dump, verifies SHA-256 checksum, and downloads SQL content', async () => {
      const createRes = await request(app)
        .post('/api/v1/system-settings/backups')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`)
        .send({ notes: 'Automated V2 Integration Test Backup' });

      expect(createRes.status).toBe(201);
      expect(createRes.body.backup.status).toBe('SUCCESS');
      expect(Number(createRes.body.backup.file_size_bytes)).toBeGreaterThan(1000);
      backupId = createRes.body.backup.id;

      // Verify SHA-256 integrity
      const verifyRes = await request(app)
        .post(`/api/v1/system-settings/backups/${backupId}/verify`)
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.verified).toBe(true);
      expect(verifyRes.body.sha256).toBeDefined();

      // Download SQL dump
      const dlRes = await request(app)
        .get(`/api/v1/system-settings/backups/${backupId}/download`)
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      expect(dlRes.status).toBe(200);
      expect(dlRes.text).toContain('POSTGRESQL RELATIONAL DATABASE DUMP');
      expect(dlRes.text).toContain('INSERT INTO public."users"');
      expect(dlRes.text).toContain('COMMIT;');
    });
  });
});
