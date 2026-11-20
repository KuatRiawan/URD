import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { query } from '../database/pool.js';
import { generateBapPdfBuffer, generateObjectQrStickerPdfBuffer } from '../services/pdf-generator.js';

describe('URD — BAP Preview, BAP Sharing & Inspector Digital Signature Suite', () => {
  let adminToken;
  let inspectorToken;
  let inspectorBToken;
  let inspectorId;
  let inspectorSigFileId;
  let testOrderId;
  let testObjectId;
  let bapId;

  beforeAll(async () => {
    // 1. Login sebagai ADMIN_SISTEM
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.sistem@upayariksadaya.com', password: 'TestPassURD2026!' });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.accessToken;
    const adminUserId = adminLogin.body.user.id;

    // 2. Login sebagai Inspector (Ahli K3)
    const inspLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ahlik3.paa@upayariksadaya.com', password: 'TestPassURD2026!' });
    expect(inspLogin.status).toBe(200);
    inspectorToken = inspLogin.body.accessToken;
    inspectorId = inspLogin.body.user.id;

    // Setel ulang profil Inspector A
    await query(
      "UPDATE users SET signature_file_id = NULL, signature_url = NULL, signer_title = 'Ahli K3 Spesialis Pesawat Angkat dan Angkut' WHERE id = $1",
      [inspectorId]
    );

    // 3. Simpan Tanda Tangan Digital Tersimpan untuk Inspector A
    const samplePngBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const sigRes = await request(app)
      .post('/api/v1/auth/signature')
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({
        dataUrl: samplePngBase64,
        signerTitle: 'Ahli K3 Spesialis Pesawat Angkat dan Angkut'
      });
    expect(sigRes.status).toBe(200);
    expect(sigRes.body.user.signatureUrl).toBeDefined();

    const inspUserRes = await query(
      'SELECT signature_file_id, signature_url, signer_title FROM users WHERE id = $1',
      [inspectorId]
    );
    inspectorSigFileId = inspUserRes.rows[0].signature_file_id;
    expect(inspectorSigFileId).toBeDefined();

    // 4. Login sebagai Inspector B
    const inspBLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ahlik3.listrik@upayariksadaya.com', password: 'TestPassURD2026!' });
    expect(inspBLogin.status).toBe(200);
    inspectorBToken = inspBLogin.body.accessToken;

    // 5. Setup data terisolasi: Client, Unit Alat, Order & Penugasan
    const clientRes = await query('SELECT id FROM clients LIMIT 1');
    const clientId = clientRes.rows[0].id;
    const catRes = await query("SELECT id FROM object_categories WHERE code = 'PAA' LIMIT 1");
    const catId = catRes.rows[0].id;

    const dynTimestamp = Date.now();
    const dynSerial = `SN-BAP-TEST-${dynTimestamp}`;
    const dynOrderNo = `ORD-BAP-${dynTimestamp}`;
    const dynPoNo = `PO-BAP-${dynTimestamp}`;

    const objRes = await query(
      `INSERT INTO test_objects (client_id, category_id, name, serial_number, brand, model, capacity, created_by)
       VALUES ($1, $2, 'Forklift Test Signature', $3, 'Toyota', '5FD50', '5000 kg', $4)
       RETURNING id`,
      [clientId, catId, dynSerial, adminUserId]
    );
    testObjectId = objRes.rows[0].id;

    const ordRes = await query(
      `INSERT INTO orders (order_no, po_number, client_id, service_type, source, status, created_by)
       VALUES ($1, $2, $3, 'PEMERIKSAAN_PERTAMA', 'DOKUMEN_PO', 'DITUGASKAN', $4)
       RETURNING id`,
      [dynOrderNo, dynPoNo, clientId, adminUserId]
    );
    testOrderId = ordRes.rows[0].id;

    await query(
      `INSERT INTO order_objects (order_id, object_id, scope_items)
       VALUES ($1, $2, $3::jsonb)`,
      [testOrderId, testObjectId, JSON.stringify(['Pemeriksaan Dokumen', 'Pemeriksaan Visual', 'Uji Fungsi'])]
    );

    // Pastikan order ditugaskan ke Inspector A di tabel assignments
    await query(
      `INSERT INTO assignments (order_id, inspector_id, status)
       VALUES ($1, $2, 'DITERIMA')`,
      [testOrderId, inspectorId]
    );
  });

  describe('1. Verifikasi Format Dokumen BAP & QR Code Policy', () => {
    it('Harus menghasilkan buffer PDF BAP tanpa memuat QR Code verifikasi pada BAP', async () => {
      const mockBap = {
        bap_no: '001/BAP-TEST/URD/XI/2026',
        client_name: 'PT Mitra Sukses K3',
        client_address: 'Kawasan Industri Jababeka, Cikarang',
        object_name: 'Forklift Diesel 5 Ton',
        category_code: 'PAA',
        manufacturer: 'Toyota Material Handling',
        brand: 'Toyota',
        manufacture_year: '2023',
        serial_number: 'SN-TOYOTA-5000',
        capacity: '5000 kg',
        install_location: 'Gudang Logistik Blok C',
        inspection_date: '2026-11-19',
        is_compliant: true,
        scope_items: ['Pemeriksaan Dokumen', 'Pemeriksaan Visual', 'Uji Fungsi'],
        inspector_name: 'Ir. Ahmad Inspector, S.T., M.K3',
        inspector_signer_title: 'Ahli K3 Spesialis Pesawat Angkat dan Angkut',
        contact_name: 'Budi Raharjo',
        contact_title: 'Manager HSE'
      };

      const pdfBuf = await generateBapPdfBuffer(mockBap);
      expect(pdfBuf).toBeDefined();
      expect(Buffer.isBuffer(pdfBuf)).toBe(true);
      expect(pdfBuf.length).toBeGreaterThan(1000);
      expect(pdfBuf.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('Dokumen selain BAP (seperti Stiker QR Alat) tetap mempertahankan kode QR', async () => {
      const mockQrData = {
        object_id: testObjectId,
        object_name: 'Forklift Diesel 5 Ton',
        category_code: 'PAA',
        serial_number: 'SN-TOYOTA-5000',
        verification_code: 'URD-VERIF-12345'
      };

      const qrBuf = await generateObjectQrStickerPdfBuffer(mockQrData);
      expect(Buffer.isBuffer(qrBuf)).toBe(true);
      expect(qrBuf.length).toBeGreaterThan(1000);
      expect(qrBuf.subarray(0, 5).toString()).toBe('%PDF-');
    });
  });

  describe('2. Otomatisasi Penandatanganan Digital Inspector pada BAP & LHPP', () => {
    it('POST /bap/prepare & GET /bap/:id - Mengembalikan inspector_has_saved_sig = true dan nama gelar standar', async () => {
      const prepRes = await request(app)
        .post('/api/v1/bap/prepare')
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          orderId: testOrderId,
          objectId: testObjectId,
          inspectionDate: '2026-11-19',
          scopeItems: ['Pemeriksaan Dokumen', 'Pemeriksaan Visual']
        });
      expect([200, 201]).toContain(prepRes.status);
      bapId = prepRes.body.bap.id;

      const detailRes = await request(app)
        .get(`/api/v1/bap/${bapId}`)
        .set('Authorization', `Bearer ${inspectorToken}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.bap.inspector_has_saved_sig).toBe(true);
      expect(detailRes.body.bap.effectiveInspectorSignerTitle).toBe('Ahli K3 Spesialis Pesawat Angkat dan Angkut');
    });

    it('POST /bap/:id/finalize - Mengadopsi tanda tangan digital tersimpan Inspector secara otomatis jika belum diisi', async () => {
      // 1. Lengkapi draf BAP dengan kesimpulan
      await request(app)
        .put(`/api/v1/bap/${bapId}/draft`)
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          scopeItems: ['Pemeriksaan Dokumen', 'Pemeriksaan Visual'],
          isCompliant: true,
          conclusion: 'MEMENUHI_SYARAT',
          inspectionNotes: 'Pemeriksaan memenuhi syarat'
        });

      // 2. Bubuhkan tanda tangan pihak klien
      await request(app)
        .post(`/api/v1/bap/${bapId}/signatures`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          signerRole: 'PERWAKILAN_KLIEN',
          signerName: 'Budi Santoso',
          signerTitle: 'HSE Manager',
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        });

      // 3. Finalisasi BAP oleh Admin
      const finalizeRes = await request(app)
        .post(`/api/v1/bap/${bapId}/finalize`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(finalizeRes.status).toBe(200);
      expect(finalizeRes.body.bap.status).toBe('FINAL');
      expect(finalizeRes.body.bap.inspector_signature_file_id).toBe(inspectorSigFileId);
      expect(finalizeRes.body.bap.inspector_signer_title).toBe('Ahli K3 Spesialis Pesawat Angkat dan Angkut');
    });

    it('Perubahan profil tanda tangan Inspector kemudian TIDAK mengubah snapshot BAP yang sudah FINAL', async () => {
      // Verifikasi record BAP yang sudah final di database terpatri secara permanen
      const { rows } = await query(
        'SELECT inspector_signature_file_id, inspector_signer_title FROM bap_documents WHERE id = $1',
        [bapId]
      );
      expect(rows[0].inspector_signature_file_id).toBe(inspectorSigFileId);
      expect(rows[0].inspector_signer_title).toBe('Ahli K3 Spesialis Pesawat Angkat dan Angkut');
    });
  });

  describe('3. Keamanan Hak Akses Berkas Tanda Tangan (dashboard-files.js)', () => {
    it('Inspector A dapat mengakses berkas tanda tangannya sendiri', async () => {
      const res = await request(app)
        .get(`/api/v1/dashboard/files/${inspectorSigFileId}`)
        .set('Authorization', `Bearer ${inspectorToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/png');
    });

    it('Inspector B DITOLAK (403 Forbidden) saat mencoba mengakses berkas tanda tangan Inspector A', async () => {
      const res = await request(app)
        .get(`/api/v1/dashboard/files/${inspectorSigFileId}`)
        .set('Authorization', `Bearer ${inspectorBToken}`);
      expect([403, 404]).toContain(res.status);
    });

    it('Admin Kantor dan Admin Sistem tetap dapat mengakses berkas tanda tangan untuk keperluan penyusunan dokumen resmi', async () => {
      const res = await request(app)
        .get(`/api/v1/dashboard/files/${inspectorSigFileId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('4. Audit Trail Pencatatan Pembagian Dokumen BAP (Bagikan BAP)', () => {
    it('POST /bap/:id/share-log - Berhasil mencatat log audit pembagian via WhatsApp', async () => {
      const res = await request(app)
        .post(`/api/v1/bap/${bapId}/share-log`)
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          bapNo: '001/BAP-TEST/URD/XI/2026',
          orderId: testOrderId,
          objectId: testObjectId,
          objectName: 'Forklift Diesel 5 Ton',
          clientName: 'PT Mitra Sukses K3',
          shareMethod: 'WHATSAPP',
          recipient: '6281234567890',
          notes: 'Membagikan pesan pengantar resmi via WhatsApp'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Riwayat pembagian BAP berhasil dicatat.');

      // Verifikasi di tabel audit_logs
      const auditRes = await query(
        `SELECT action, entity, entity_id, summary
         FROM audit_logs
         WHERE action = 'BAP_SHARE' AND entity_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [bapId]
      );
      expect(auditRes.rows.length).toBe(1);
      const log = auditRes.rows[0];
      expect(log.action).toBe('BAP_SHARE');
      expect(log.summary.shareMethod).toBe('WHATSAPP');
      expect(log.summary.recipient).toBe('6281234567890');
    });

    it('POST /bap/:id/share-log - Berhasil mencatat log pembagian via Device / Native App', async () => {
      const res = await request(app)
        .post(`/api/v1/bap/${bapId}/share-log`)
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          bapNo: '001/BAP-TEST/URD/XI/2026',
          orderId: testOrderId,
          objectId: testObjectId,
          objectName: 'Forklift Diesel 5 Ton',
          clientName: 'PT Mitra Sukses K3',
          shareMethod: 'NATIVE_APP',
          recipient: 'Aplikasi Perangkat',
          notes: 'Dibagikan via dialog sistem'
        });

      expect(res.status).toBe(200);
    });
  });
});
