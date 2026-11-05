import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { pool } from '../database/pool.js';
import { env } from '../config/env.js';
import { generateBapDocxBuffer } from '../services/docx-generator.js';

describe('URD Reengineering Features & Endpoint Suite', () => {
  let adminToken;
  let marketingToken;
  let _inspectorToken;
  let _pimpinanToken;
  let sampleClientId;
  let sampleBapId;
  let sampleSuketId;

  beforeAll(async () => {
    // Generate valid JWT tokens for test roles
    const makeToken = (id, role, name) =>
      jwt.sign({ sub: id, role, fullName: name, tokenVersion: 1 }, env.jwtSecret, {
        expiresIn: '1h'
      });

    // Cari user nyata dari database
    const { rows: users } = await pool.query(
      "SELECT id, role, full_name FROM users WHERE is_active = true"
    );

    const adminUser = users.find((u) => u.role === 'ADMIN_SISTEM') || {
      id: '00000000-0000-4000-8000-000000000001',
      role: 'ADMIN_SISTEM',
      full_name: 'Super Admin'
    };
    const marketingUser = users.find((u) => u.role === 'MARKETING') || {
      id: '00000000-0000-4000-8000-000000000002',
      role: 'MARKETING',
      full_name: 'Marketing Staff'
    };
    const inspectorUser = users.find((u) => u.role === 'AHLI_K3' || u.role === 'INSPECTOR') || {
      id: '00000000-0000-4000-8000-000000000003',
      role: 'AHLI_K3',
      full_name: 'Inspector Ahli K3'
    };
    const pimpinanUser = users.find((u) => u.role === 'PIMPINAN') || {
      id: '00000000-0000-4000-8000-000000000004',
      role: 'PIMPINAN',
      full_name: 'Direktur URD'
    };

    adminToken = makeToken(adminUser.id, adminUser.role, adminUser.full_name);
    marketingToken = makeToken(marketingUser.id, marketingUser.role, marketingUser.full_name);
    _inspectorToken = makeToken(inspectorUser.id, inspectorUser.role, inspectorUser.full_name);
    _pimpinanToken = makeToken(pimpinanUser.id, pimpinanUser.role, pimpinanUser.full_name);

    // Ambil sample client
    const { rows: clients } = await pool.query('SELECT id FROM clients LIMIT 1');
    if (clients[0]) sampleClientId = clients[0].id;

    // Ambil sample BAP
    const { rows: baps } = await pool.query('SELECT id FROM bap_documents LIMIT 1');
    if (baps[0]) sampleBapId = baps[0].id;

    // Ambil sample Suket
    const { rows: sukets } = await pool.query('SELECT id FROM suket_documents LIMIT 1');
    if (sukets[0]) sampleSuketId = sukets[0].id;

    // Pastikan data default system_settings tersedia
    await pool.query(`
      INSERT INTO system_settings (key, value, description)
      VALUES
        ('company_profile', '{"name": "PT Upaya Riksa Daya"}'::jsonb, 'Profil resmi'),
        ('auto_numbering', '{"po_prefix": "PO-URD", "bap_prefix": "BAP-URD"}'::jsonb, 'Format penomoran'),
        ('notification_channels', '{"whatsapp_enabled": true}'::jsonb, 'Kanal notifikasi')
      ON CONFLICT (key) DO NOTHING
    `);
  });

  describe('1. BAP DOCX Generation Service', () => {
    it('menghasilkan buffer file DOCX yang valid dengan header ZIP (PK)', async () => {
      const dummyBap = {
        bap_no: 'BAP-URD-202611-0001',
        inspection_date: '2026-11-02',
        client_name: 'PT Mitra Uji Sejahtera',
        client_address: 'Kawasan Industri Pulogadung',
        location_name: 'Workshop Utama',
        object_name: 'Overhead Crane 15T',
        category_name: 'Pesawat Angkat dan Angkut (PAA)',
        brand: 'Kito',
        model: 'ER2-050',
        manufacturer: 'Kito Corp',
        serial_number: 'CR-15T-2022',
        manufacture_year: 2022,
        capacity: '15',
        capacity_unit: 'Ton',
        po_number: 'PO-URD-2026-0099',
        scope_items: [
          'Pemeriksaan Dokumen & Gambar Teknik',
          'Pemeriksaan Visual Konstruksi',
          'Uji Fungsi & Beban Defleksi'
        ],
        conclusion: 'MEMENUHI_SYARAT',
        notes: 'Semua limit switch dan rem berfungsi baik.',
        inspector_signer_name: 'Ir. Budi Santoso',
        client_signer_name: 'Bpk. Hendra'
      };

      const buffer = await generateBapDocxBuffer(dummyBap);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      // Format DOCX adalah zip file yang diawali 'PK\x03\x04'
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4b); // 'K'
      expect(buffer[2]).toBe(0x03);
      expect(buffer[3]).toBe(0x04);
    });

    if (sampleBapId) {
      it('GET /api/v1/bap/:id/docx mengembalikan berkas docx untuk role Admin', async () => {
        const res = await request(app)
          .get(`/api/v1/bap/${sampleBapId}/docx`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('officedocument.wordprocessingml.document');
        expect(res.headers['content-disposition']).toContain('.docx');
      });
    }
  });

  describe('2. Client Equipment History Endpoint', () => {
    it('GET /api/v1/clients/:id/equipment-history mengembalikan daftar riwayat alat klien', async () => {
      if (!sampleClientId) return;

      const res = await request(app)
        .get(`/api/v1/clients/${sampleClientId}/equipment-history`)
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('client');
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(typeof res.body.total).toBe('number');
    });

    it('menolak akses bila ID klien tidak ditemukan', async () => {
      const res = await request(app)
        .get('/api/v1/clients/00000000-0000-0000-0000-000000000000/equipment-history')
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('3. Marketing Renewal PO Authorization', () => {
    it('mengizinkan role MARKETING untuk memicu perpanjangan Suket', async () => {
      if (!sampleSuketId) return;

      const res = await request(app)
        .post(`/api/v1/reminders/${sampleSuketId}/create-renewal-order`)
        .set('Authorization', `Bearer ${marketingToken}`);

      // Bisa 200/201 (berhasil buat atau reuse yang sudah ada)
      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('order');
    });
  });

  describe('4. Super Admin System Settings & Backups', () => {
    it('GET /api/v1/system-settings mengembalikan konfigurasi lengkap & info sistem', async () => {
      const res = await request(app)
        .get('/api/v1/system-settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('settings');
      expect(res.body.settings).toHaveProperty('auto_numbering');
      expect(res.body.settings).toHaveProperty('company_profile');
      expect(res.body.settings).toHaveProperty('notification_channels');
      expect(res.body).toHaveProperty('systemInfo');
      expect(res.body.systemInfo).toHaveProperty('databaseVersion');
      expect(res.body.systemInfo).toHaveProperty('totalTables');
    });

    it('GET /api/v1/system-settings/checklists mengembalikan 7 kategori K3 & template ceklis', async () => {
      const res = await request(app)
        .get('/api/v1/system-settings/checklists')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('categories');
      expect(res.body.categories.length).toBeGreaterThanOrEqual(7);
      expect(res.body).toHaveProperty('templateItems');
    });

    it('POST /api/v1/system-settings/backups membuat snapshot metadata backup', async () => {
      const res = await request(app)
        .post('/api/v1/system-settings/backups')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('backup');
      expect(res.body.backup).toHaveProperty('filename');
      expect(res.body.backup.filename).toContain('urd_backup_');
      expect(res.body.backup.status).toBe('SUCCESS');
    });

    it('menolak peran non-admin (MARKETING / INSPECTOR) mengubah system settings', async () => {
      const res = await request(app)
        .put('/api/v1/system-settings/keys/company_profile')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({ value: { name: 'Hacked' } });

      expect(res.status).toBe(403);
    });
  });
});
