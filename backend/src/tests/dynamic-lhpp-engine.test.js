import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../app.js';
import { query } from '../database/pool.js';
import { seedDatabase } from '../../seeds/seed.js';

const request = supertest(app);
const TEST_PW = 'TestPassURD2026!';

describe('Dynamic LHPP Document Generation Engine', () => {
  let adminSistemToken;
  let adminKantorToken;
  let inspectorToken;
  let marketingToken;
  let createdTplId;

  beforeAll(async () => {
    await seedDatabase({ password: TEST_PW });

    // Login sebagai Admin Sistem
    const resAdmin = await request
      .post('/api/v1/auth/login')
      .send({ email: 'admin.sistem@upayariksadaya.com', password: TEST_PW });
    adminSistemToken = resAdmin.body.accessToken;

    // Login sebagai Admin Kantor
    const resKantor = await request
      .post('/api/v1/auth/login')
      .send({ email: 'admin.kantor@upayariksadaya.com', password: TEST_PW });
    adminKantorToken = resKantor.body.accessToken;

    // Login sebagai Inspector
    const resInsp = await request
      .post('/api/v1/auth/login')
      .send({ email: 'ahlik3.paa@upayariksadaya.com', password: TEST_PW });
    inspectorToken = resInsp.body.accessToken;

    // Login sebagai Marketing
    const resMkt = await request
      .post('/api/v1/auth/login')
      .send({ email: 'marketing@upayariksadaya.com', password: TEST_PW });
    marketingToken = resMkt.body.accessToken;

    // Setup order, unit, inspection & LHPP untuk pengujian validasi & finalisasi
    const clientRes = await query('SELECT id FROM clients LIMIT 1');
    const clientId = clientRes.rows[0].id;

    const locRes = await query('SELECT id FROM client_locations WHERE client_id = $1 LIMIT 1', [clientId]);
    const locId = locRes.rows[0]?.id || null;

    const catRes = await query("SELECT id FROM object_categories WHERE code = 'PAA' LIMIT 1");
    const catId = catRes.rows[0].id;

    const inspUserRes = await query("SELECT id FROM users WHERE email = 'ahlik3.paa@upayariksadaya.com' LIMIT 1");
    const inspUserId = inspUserRes.rows[0].id;

    const adminUserRes = await query("SELECT id FROM users WHERE email = 'admin.sistem@upayariksadaya.com' LIMIT 1");
    const adminUserId = adminUserRes.rows[0].id;

    const dynSerial = `SN-DYN-${Date.now()}`;
    const dynOrderNo = `ORD-DYN-${Date.now()}`;
    const dynPoNo = `PO-DYN-${Date.now()}`;

    const objRes = await query(
      `INSERT INTO test_objects (client_id, category_id, name, serial_number, brand, model, capacity, created_by)
       VALUES ($1, $2, 'Overhead Crane Uji Dynamic', $3, 'Konecranes', 'C-15', '15 Ton', $4)
       RETURNING id`,
      [clientId, catId, dynSerial, adminUserId]
    );
    const objectId = objRes.rows[0].id;

    const orderRes = await query(
      `INSERT INTO orders (order_no, po_number, client_id, location_id, service_type, source, status, created_by)
       VALUES ($1, $2, $3, $4, 'PEMERIKSAAN_BERKALA', 'DOKUMEN_PO', 'BERLANGSUNG', $5)
       RETURNING id`,
      [dynOrderNo, dynPoNo, clientId, locId, adminUserId]
    );
    const orderId = orderRes.rows[0].id;

    await query(
      `INSERT INTO order_objects (order_id, object_id, unit_status, scope_items)
       VALUES ($1, $2, 'LHPP_SIAP_PREVIEW', '["VISUAL", "PENGUJIAN"]'::jsonb)`,
      [orderId, objectId]
    );

    const tplRes = await query('SELECT id FROM inspection_template_versions LIMIT 1');
    const tplVerId = tplRes.rows[0]?.id;

    const inspInsert = await query(
      `INSERT INTO inspections (order_id, object_id, inspector_id, template_version_id, status, conclusion, conclusion_notes)
       VALUES ($1, $2, $3, $4, 'TERKIRIM', 'MEMENUHI_SYARAT', 'Semua komponen crane memenuhi standar keselamatan K3.')
       RETURNING id`,
      [orderId, objectId, inspUserId, tplVerId]
    );
    const inspectionId = inspInsert.rows[0].id;

    const fileRes = await query(
      `INSERT INTO file_attachments (owner_type, owner_id, storage_key, original_name, mime_type, size_bytes, uploaded_by)
       VALUES ('INSPECTION_SIGNATURE', $1, 'sig.png', 'sig.png', 'image/png', 100, $2)
       RETURNING id`,
      [inspectionId, adminUserId]
    );
    const fileId = fileRes.rows[0].id;

    await query(
      `INSERT INTO inspection_signatures (inspection_id, signer_role, signer_name, signer_title, file_id)
       VALUES ($1, 'AHLI_K3', 'Ir. Inspector PAA', 'Ahli K3 Spesialis PAA', $2)`,
      [inspectionId, fileId]
    );

    await query(
      `INSERT INTO lhpp_documents (
         inspection_id, status, version,
         method_summary, technical_notes, recommendations, recommended_valid_until,
         technical_data
       ) VALUES (
         $1, 'SIAP_PREVIEW', 1,
         'Pemeriksaan visual, pengujian fungsi, dan NDT.', 'Semua komponen crane berfungsi normal.', 'Lakukan perawatan berkala setiap bulan.', CURRENT_DATE + INTERVAL '1 year',
         '{"capacity": "15 Ton"}'::jsonb
       )`,
      [inspectionId]
    );
  });

  it('1. GET /api/v1/lhpp-templates: Daftar template LHPP tersedia dengan rincian domain, versi aktif, dan jenis unit', async () => {
    const res = await request
      .get('/api/v1/lhpp-templates')
      .set('Authorization', `Bearer ${adminSistemToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.templates)).toBe(true);
    expect(res.body.templates.length).toBeGreaterThanOrEqual(7);

    const craneTpl = res.body.templates.find((t) => t.code === 'TPL-LHPP-PAPA-CRANE');
    expect(craneTpl).toBeDefined();
    expect(craneTpl.domain_code).toBe('PAPA');
    expect(craneTpl.active_version_code).toBeDefined();
    expect(craneTpl.output_format).toBe('BOTH');
  });

  it('2. GET /api/v1/lhpp-templates/resolve: Resolver dinamis menemukan template paling spesifik sesuai klasifikasi alat', async () => {
    // A. Resolve Crane
    const craneRes = await request
      .get('/api/v1/lhpp-templates/resolve?domainCode=PAPA')
      .set('Authorization', `Bearer ${adminKantorToken}`);
    expect(craneRes.status).toBe(200);
    expect(craneRes.body.template.domain_code).toBe('PAPA');

    // B. Resolve Bejana Tekan
    const pubtRes = await request
      .get('/api/v1/lhpp-templates/resolve?domainCode=PUBT')
      .set('Authorization', `Bearer ${adminKantorToken}`);
    expect(pubtRes.status).toBe(200);
    expect(pubtRes.body.template.code).toBe('TPL-LHPP-PUBT-TANK');

    // C. Resolve Penyalur Petir
    const ilppRes = await request
      .get('/api/v1/lhpp-templates/resolve?domainCode=ILPP')
      .set('Authorization', `Bearer ${adminKantorToken}`);
    expect(ilppRes.status).toBe(200);
    expect(['TPL-LHPP-ILPP-PETIR', 'TPL-LHPP-ILPP-LISTRIK']).toContain(ilppRes.body.template.code);
  });

  it('3. GET /api/v1/lhpp-templates/resolve: Menolak atau melaporkan 404 bila bidang tidak memiliki template aktif', async () => {
    const res = await request
      .get('/api/v1/lhpp-templates/resolve?domainCode=UNKNOWN_DOMAIN')
      .set('Authorization', `Bearer ${adminKantorToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('TEMPLATE_NOT_CONFIGURED');
  });

  it('4. POST /api/v1/lhpp-templates: Super Admin dapat membuat template LHPP baru beserta versi V1', async () => {
    const newTplCode = `TPL-TEST-${Date.now()}`;
    const payload = {
      code: newTplCode,
      name: 'Template Khusus Uji Stress Beban Tinggi',
      description: 'Template risksa uji beban ekstrem peralatan angkat khusus',
      domainCode: 'PAPA',
      outputFormat: 'BOTH',
      initialTitle: 'LAPORAN HASIL PENGUJIAN BEBAN TINGGI PESAWAT ANGKAT',
      regulationReference: 'Permenaker No. 08/2020 Lampiran Khusus Uji Beban',
      sections: [
        { key: 'cover', title: 'Halaman Sampul', type: 'COVER', enabled: true },
        { key: 'identity', title: 'I. Data Umum', type: 'IDENTITY_TABLE', enabled: true },
        { key: 'technical', title: 'II. Data Teknis', type: 'TECHNICAL_TABLE', enabled: true },
        { key: 'conclusion', title: 'III. Kesimpulan', type: 'CONCLUSION', enabled: true }
      ],
      fieldMappings: [
        { target: 'client_name', source: 'client.name', label: 'Perusahaan Pemilik', required: true },
        { target: 'serial_number', source: 'object.serial_number', label: 'Nomor Seri Unit', required: true }
      ]
    };

    const res = await request
      .post('/api/v1/lhpp-templates')
      .set('Authorization', `Bearer ${adminSistemToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.template.code).toBe(newTplCode);
    expect(res.body.template.active_version.version_code).toBe('V1');
    createdTplId = res.body.template.id;
  });

  it('5. POST /api/v1/lhpp-templates/:id/versions: Super Admin dapat menerbitkan versi baru (Copy-on-Write) tanpa merusak versi lama', async () => {
    const v2Payload = {
      title: 'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN CRANE REVISI STANDAR 2027',
      regulationReference: 'Permenaker No. 08 Tahun 2020 & SNI Crane Terbaru',
      effectiveDate: new Date().toISOString().slice(0, 10),
      sections: [
        { key: 'cover', title: 'Halaman Sampul Resmi V2', type: 'COVER', enabled: true },
        { key: 'identity', title: 'I. Data Umum V2', type: 'IDENTITY_TABLE', enabled: true },
        { key: 'technical', title: 'II. Data Teknis V2', type: 'TECHNICAL_TABLE', enabled: true },
        { key: 'conclusion', title: 'III. Kesimpulan V2', type: 'CONCLUSION', enabled: true }
      ],
      fieldMappings: [
        { target: 'client_name', source: 'client.name', label: 'Nama Perusahaan', required: true },
        { target: 'serial_number', source: 'object.serial_number', label: 'Nomor Seri Unit', required: true }
      ],
      changelog: 'Penyesuaian format laporan crane versi 2'
    };

    const res = await request
      .post(`/api/v1/lhpp-templates/${createdTplId}/versions`)
      .set('Authorization', `Bearer ${adminSistemToken}`)
      .send(v2Payload);

    expect(res.status).toBe(201);
    expect(res.body.version.version_code).toBe('V2');
    expect(res.body.version.version_number).toBe(2);

    // Verifikasi riwayat versi
    const detailRes = await request
      .get(`/api/v1/lhpp-templates/${createdTplId}`)
      .set('Authorization', `Bearer ${adminSistemToken}`);
    expect(detailRes.body.template.versions.length).toBeGreaterThanOrEqual(2);
    expect(detailRes.body.template.active_version.version_code).toBe('V2');
  });

  it('6. POST /api/v1/lhpp/:id/validate: Mendeteksi kelengkapan data dokumen sebelum finalisasi', async () => {
    // Cari satu draf LHPP yang ada di database
    const lhppRes = await query('SELECT id FROM lhpp_documents LIMIT 1');
    const targetLhppId = lhppRes.rows[0].id;

    const res = await request
      .post(`/api/v1/lhpp/${targetLhppId}/validate`)
      .set('Authorization', `Bearer ${adminKantorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.template).toBeDefined();
    expect(typeof res.body.isValid).toBe('boolean');
    expect(Array.isArray(res.body.missingFields)).toBe(true);
  });

  it('7. Workflow Finalisasi Admin Kantor: Menghasilkan PDF, DOCX, SHA-256 Hash, Snapshot Immutability, dan BAP Otomatis', async () => {
    // Siapkan inspeksi yang sudah disubmit oleh Inspector
    const inspRes = await query(
      `SELECT i.id, l.id AS lhpp_id
       FROM inspections i
       JOIN lhpp_documents l ON l.inspection_id = i.id
       WHERE i.status = 'TERKIRIM' AND l.status = 'SIAP_PREVIEW'
       LIMIT 1`
    );

    let testLhppId;
    if (inspRes.rows[0]) {
      testLhppId = inspRes.rows[0].lhpp_id;
    } else {
      // Set status draf pertama menjadi SIAP_PREVIEW dan inspeksinya TERKIRIM
      const anyLhpp = await query('SELECT id, inspection_id FROM lhpp_documents LIMIT 1');
      testLhppId = anyLhpp.rows[0].id;
      await query(
        "UPDATE inspections SET status = 'TERKIRIM', conclusion = 'MEMENUHI_SYARAT' WHERE id = $1",
        [anyLhpp.rows[0].inspection_id]
      );
      await query(
        "UPDATE lhpp_documents SET status = 'SIAP_PREVIEW', method_summary = 'Pemeriksaan visual, pengujian fungsi, dan NDT.' WHERE id = $1",
        [testLhppId]
      );
    }

    // Finalisasi LHPP oleh Admin Kantor
    const finalizeRes = await request
      .post(`/api/v1/lhpp/${testLhppId}/finalize`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({ note: 'Dokumen disetujui lengkap memenuhi syarat K3' });

    expect(finalizeRes.status).toBe(200);
    expect(finalizeRes.body.lhpp).toBeDefined();
    expect(finalizeRes.body.lhpp.lhpp_no).toBeTruthy();
    expect(finalizeRes.body.lhpp.lhpp_no.length).toBeGreaterThan(5);
    expect(finalizeRes.body.lhpp.status).toBe('FINAL');
    expect(finalizeRes.body.lhpp.pdf_file_id).toBeDefined();
    expect(finalizeRes.body.lhpp.document_hash).toBeDefined();

    // Verifikasi berkas PDF dapat diunduh
    const pdfRes = await request
      .get(`/api/v1/lhpp/${testLhppId}/pdf`)
      .set('Authorization', `Bearer ${adminKantorToken}`);
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    expect(pdfRes.body.length).toBeGreaterThan(1000);

    // Verifikasi berkas DOCX dapat diunduh
    const docxRes = await request
      .get(`/api/v1/lhpp/${testLhppId}/docx`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .buffer(true);
    expect(docxRes.status).toBe(200);
    expect(docxRes.headers['content-type']).toContain('wordprocessingml');
    expect(docxRes.body).toBeDefined();

    // Verifikasi Immutability: Ambil data snapshot dari database
    const snapRes = await query('SELECT data_snapshot FROM lhpp_documents WHERE id = $1', [testLhppId]);
    expect(snapRes.rows[0].data_snapshot).toBeDefined();
    const snap = snapRes.rows[0].data_snapshot;
    expect(snap.template_version).toBeDefined();
    expect(snap.client.name).toBeDefined();
    expect(snap.equipment.serial_number).toBeDefined();
  });

  it('8. RBAC: Inspector dilarang melakukan finalisasi dokumen LHPP resmi (403 Forbidden)', async () => {
    const anyLhpp = await query('SELECT id FROM lhpp_documents LIMIT 1');
    const targetLhppId = anyLhpp.rows[0].id;

    const res = await request
      .post(`/api/v1/lhpp/${targetLhppId}/finalize`)
      .set('Authorization', `Bearer ${inspectorToken}`)
      .send({ note: 'Inspector mencoba bypass finalisasi' });

    expect(res.status).toBe(403);
  });
});
