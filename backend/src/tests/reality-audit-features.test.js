import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { query } from '../database/pool.js';
import {
  formatDocumentNumber,
  getCompanyProfile,
  invalidateSettingsCache
} from '../services/system-settings-service.js';
import {
  generateBapPdfBuffer,
  generateAssignmentLetterPdfBuffer
} from '../services/pdf-generator.js';
import { generateBapDocxBuffer } from '../services/docx-generator.js';

describe('Reality Audit & Product Reengineering Verification', () => {
  let adminSistemToken;
  let adminKantorToken;
  let marketingToken;
  let sampleVersionId;

  beforeAll(async () => {
    const makeToken = (id, role, name) =>
      jwt.sign({ sub: id, role, fullName: name, tokenVersion: 1 }, env.jwtSecret, {
        expiresIn: '1h'
      });

    const { rows: users } = await query('SELECT id, role, full_name FROM users');
    const asUser = users.find((u) => u.role === 'ADMIN_SISTEM');
    const akUser = users.find((u) => u.role === 'ADMIN_KANTOR');
    const mktUser = users.find((u) => u.role === 'MARKETING');

    adminSistemToken = makeToken(asUser?.id || '00000000-0000-0000-0000-000000000001', 'ADMIN_SISTEM', 'Admin Sistem');
    adminKantorToken = makeToken(akUser?.id || '00000000-0000-0000-0000-000000000002', 'ADMIN_KANTOR', 'Admin Kantor');
    marketingToken = makeToken(mktUser?.id || '00000000-0000-0000-0000-000000000003', 'MARKETING', 'Marketing URD');

    // 2. Ambil version_id checklist aktif
    const { rows: vRows } = await query(
      "SELECT id FROM inspection_template_versions WHERE status = 'AKTIF' LIMIT 1"
    );
    sampleVersionId = vRows[0]?.id;
  });

  describe('1. Dynamic Document Numbering & Company Profile Service', () => {
    it('mengubah tag dinamis penomoran surat {COUNTER}, {YEAR}, {MONTH}, {ROMAN_MONTH}, {BIDANG_CODE}', async () => {
      const fixedDate = new Date('2026-11-15T10:00:00Z');

      const bapNo = await formatDocumentNumber('bap', {
        counter: 42,
        categoryCode: 'PUBT',
        date: fixedDate
      });
      expect(bapNo).toContain('0042');
      expect(bapNo).toContain('2026');
      expect(bapNo).toContain('XI');

      const lhppNo = await formatDocumentNumber('lhpp', {
        counter: 7,
        categoryCode: 'PAA',
        date: fixedDate
      });
      expect(lhppNo).toContain('0007');
      expect(lhppNo).toContain('PAA');
      expect(lhppNo).toContain('2026');
      expect(lhppNo).toContain('XI');
    });

    it('memuat profil perusahaan resmi dari system_settings', async () => {
      invalidateSettingsCache();
      const profile = await getCompanyProfile();
      expect(profile).toHaveProperty('company_name');
      expect(profile).toHaveProperty('phone');
      expect(profile).toHaveProperty('email');
      expect(profile.company_name).toContain('UPAYA RIKSA DAYA');
    });
  });

  describe('2. Dynamic Checklist Builder API (Super Admin)', () => {
    let createdItemId;

    it('menolak role selain ADMIN_SISTEM menambah butir checklist', async () => {
      const res = await request(app)
        .post('/api/v1/system-settings/checklists/items')
        .set('Authorization', `Bearer ${adminKantorToken}`)
        .send({
          version_id: sampleVersionId,
          section: 'Pemeriksaan Khusus',
          label: 'Uji visual tanpa izin',
          input_type: 'CHOICE'
        });

      expect(res.status).toBe(403);
    });

    it('ADMIN_SISTEM dapat menambah butir pertanyaan checklist baru', async () => {
      const res = await request(app)
        .post('/api/v1/system-settings/checklists/items')
        .set('Authorization', `Bearer ${adminSistemToken}`)
        .send({
          version_id: sampleVersionId,
          section: 'Pemeriksaan Visual Khusus',
          label: 'Kondisi fisik safety valve dan segel kalibrasi',
          input_type: 'CHOICE',
          unit: 'bar',
          min_value: 0,
          max_value: 16,
          is_required: true
        });

      expect(res.status).toBe(201);
      expect(res.body.item).toHaveProperty('id');
      expect(res.body.item.label).toBe('Kondisi fisik safety valve dan segel kalibrasi');
      createdItemId = res.body.item.id;
    });

    it('ADMIN_SISTEM dapat mengedit butir pertanyaan checklist', async () => {
      const res = await request(app)
        .put(`/api/v1/system-settings/checklists/items/${createdItemId}`)
        .set('Authorization', `Bearer ${adminSistemToken}`)
        .send({
          label: 'Kondisi fisik safety valve dan segel kalibrasi (Revisi Uji)',
          is_required: false
        });

      expect(res.status).toBe(200);
      expect(res.body.item.label).toContain('(Revisi Uji)');
      expect(res.body.item.is_required).toBe(false);
    });

    it('ADMIN_SISTEM dapat menghapus butir pertanyaan checklist', async () => {
      const res = await request(app)
        .delete(`/api/v1/system-settings/checklists/items/${createdItemId}`)
        .set('Authorization', `Bearer ${adminSistemToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('berhasil dihapus');
    });
  });

  describe('3. WhatsApp & SMTP Connection Tests', () => {
    it('menguji validasi koneksi SMTP email', async () => {
      const res = await request(app)
        .post('/api/v1/system-settings/test-email')
        .set('Authorization', `Bearer ${adminSistemToken}`)
        .send({
          config: {
            host: 'smtp.test.urd',
            port: 587,
            user: 'test@urd.com',
            pass: 'secret'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('menguji validasi koneksi WhatsApp Gateway', async () => {
      const res = await request(app)
        .post('/api/v1/system-settings/test-whatsapp')
        .set('Authorization', `Bearer ${adminSistemToken}`)
        .send({
          config: {
            provider: 'FONNTE',
            apiUrl: 'https://api.fonnte.com/send',
            token: 'test_token_urd_123'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Database Backup Snapshot & Download', () => {
    let backupId;

    it('ADMIN_SISTEM dapat membuat snapshot backup dan mengunduh filenya', async () => {
      const createRes = await request(app)
        .post('/api/v1/system-settings/backups')
        .set('Authorization', `Bearer ${adminSistemToken}`);

      expect(createRes.status).toBe(201);
      expect(createRes.body.backup).toHaveProperty('id');
      backupId = createRes.body.backup.id;

      const dlRes = await request(app)
        .get(`/api/v1/system-settings/backups/${backupId}/download`)
        .set('Authorization', `Bearer ${adminSistemToken}`);

      expect(dlRes.status).toBe(200);
      expect(dlRes.headers['content-type']).toContain('sql');
      expect(dlRes.headers['content-disposition']).toContain('attachment');
      expect(dlRes.text).toContain('PT UPAYA RIKSA DAYA');
    });
  });

  describe('5. Dynamic Company Profile Integration into PDF & DOCX', () => {
    it('menghasilkan BAP PDF dan Surat Tugas PDF tanpa error', async () => {
      const bapBuffer = await generateBapPdfBuffer({
        bap_no: 'BAP/TEST/XI/2026/0001',
        inspection_date: '2026-11-02',
        object_name: 'Overhead Crane',
        serial_number: 'SN-TEST-99',
        client_name: 'PT Mitra Sukses',
        conclusion: 'MEMENUHI_SYARAT'
      });
      expect(Buffer.isBuffer(bapBuffer)).toBe(true);
      expect(bapBuffer.length).toBeGreaterThan(1000);

      const stBuffer = await generateAssignmentLetterPdfBuffer({
        order_no: 'PO-TEST-01',
        po_number: 'PO-CLIENT-99',
        service_type: 'BERKALA',
        client_name: 'PT Mitra Sukses',
        location_address: 'Kawasan Industri GIIC',
        inspector_name: 'Inspector Budi',
        inspector_nip: 'SKP-PAA-01',
        objects: [{ name: 'Overhead Crane', category_name: 'PAA' }]
      });
      expect(Buffer.isBuffer(stBuffer)).toBe(true);
      expect(stBuffer.length).toBeGreaterThan(1000);
    });

    it('menghasilkan BAP DOCX buffer yang valid', async () => {
      const docxBuffer = await generateBapDocxBuffer({
        bap_no: 'BAP/TEST/XI/2026/0001',
        inspection_date: '2026-11-02',
        object_name: 'Overhead Crane',
        serial_number: 'SN-TEST-99',
        client_name: 'PT Mitra Sukses',
        conclusion: 'MEMENUHI_SYARAT',
        inspector_name: 'Inspector Budi'
      });
      expect(Buffer.isBuffer(docxBuffer)).toBe(true);
      expect(docxBuffer.length).toBeGreaterThan(500);
    });
  });
});
