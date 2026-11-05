import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { query } from '../database/pool.js';

describe('Marketing Workflow & Features Verification', () => {
  let marketingToken;
  let _marketingUserId;
  let clientId;
  let contactId;

  beforeAll(async () => {
    let { rows: users } = await query("SELECT id, role, full_name FROM users WHERE role = 'MARKETING' AND is_active = true LIMIT 1");
    if (!users[0]) {
      const ins = await query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active)
         VALUES ('marketing.wf@upayariksadaya.com', '$2b$10$abcdefghijklmnopqrstuu', 'Siti Marketing', 'MARKETING', true)
         ON CONFLICT (email) DO UPDATE SET is_active = true, role = 'MARKETING'
         RETURNING id, role, full_name`
      );
      users = ins.rows;
    }
    const mkt = users[0];
    _marketingUserId = mkt.id;
    marketingToken = jwt.sign(
      { sub: mkt.id, role: 'MARKETING', fullName: mkt.full_name, tokenVersion: 1 },
      env.jwtSecret,
      { expiresIn: '1h' }
    );

    let { rows: clients } = await query('SELECT id FROM clients WHERE is_active = true LIMIT 1');
    if (!clients[0]) {
      const insCli = await query(
        `INSERT INTO clients (name, address, is_active)
         VALUES ('PT Test Client Marketing', 'Jakarta', true)
         RETURNING id`
      );
      clients = insCli.rows;
    }
    clientId = clients[0].id;
  });

  describe('1. Marketing Dashboard Summary & Analytics', () => {
    it('mengembalikan metrics lengkap dan analytics regional mapping serta monthly trend untuk Marketing', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('MARKETING');
      expect(res.body.metrics).toBeDefined();
      expect(typeof res.body.metrics.managedClients).toBe('number');
      expect(typeof res.body.metrics.newOrders).toBe('number');
      expect(typeof res.body.metrics.remindersH7).toBe('number');

      // Verifikasi Analytics
      expect(res.body.analytics).toBeDefined();
      expect(Array.isArray(res.body.analytics.monthlyTrend)).toBe(true);
      expect(Array.isArray(res.body.analytics.regionalMapping)).toBe(true);
    });
  });

  describe('2. Pengelolaan Kontak PIC Klien (POST, PATCH, DELETE)', () => {
    it('Marketing dapat menambahkan kontak PIC baru untuk klien', async () => {
      const res = await request(app)
        .post(`/api/v1/clients/${clientId}/contacts`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          name: 'Budi Santoso PIC',
          position: 'HSE Manager',
          phone: '081234567890',
          email: 'budi.hse@example.com'
        });

      expect(res.status).toBe(201);
      expect(res.body.contact).toBeDefined();
      expect(res.body.contact.name).toBe('Budi Santoso PIC');
      contactId = res.body.contact.id;
    });

    it('Marketing dapat memperbarui kontak PIC klien via PATCH', async () => {
      const res = await request(app)
        .patch(`/api/v1/clients/${clientId}/contacts/${contactId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          position: 'Senior HSE Director',
          isPrimary: true,
          isReminderRecipient: true
        });

      expect(res.status).toBe(200);
      expect(res.body.contact.position).toBe('Senior HSE Director');
      expect(res.body.contact.is_primary).toBe(true);
      expect(res.body.contact.is_reminder_recipient).toBe(true);
    });

    it('Marketing dapat menonaktifkan kontak PIC klien via DELETE', async () => {
      const res = await request(app)
        .delete(`/api/v1/clients/${clientId}/contacts/${contactId}`)
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
      expect(res.body.contact.is_active).toBe(false);
    });
  });

  describe('3. Profil Pengguna & Avatar URL', () => {
    it('mengembalikan avatarUrl pada GET /auth/me dan mendukung pembaruan via PUT /auth/profile', async () => {
      const testAvatarUrl = 'https://example.com/avatar.jpg';
      const updateRes = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          fullName: 'Marketing URD Senior',
          phone: '081199887766',
          avatarUrl: testAvatarUrl
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.user.fullName).toBe('Marketing URD Senior');
      expect(updateRes.body.user.avatarUrl).toBe(testAvatarUrl);

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.avatarUrl).toBe(testAvatarUrl);
    });
  });

  describe('4. Akses Riwayat Pengujian untuk Marketing', () => {
    it('Marketing dapat membaca riwayat pengujian lintas unit K3 dengan paginasi', async () => {
      const res = await request(app)
        .get('/api/v1/objects/history/all?page=1&limit=10')
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(typeof res.body.total).toBe('number');
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
    });
  });
});

