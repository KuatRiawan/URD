import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { query } from '../database/pool.js';
import { env } from '../config/env.js';

const SAMPLE_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('Admin Kantor Workspace V2 - End-to-End QC, LHPP, BAP, Suket, QR, BAST & Distribution Suite', () => {
  let adminKantorToken;
  let inspectorToken;
  let pimpinanToken;
  let marketingToken;
  let inspectorUser;
  let adminKantorUser;

  let clientId;
  let orderId;
  let unit1Id;
  let unit2Id;
  let insp1Id;
  let insp2Id;
  let lhpp1Id;
  let bap1Id;
  let suket1Id;
  let suketQrToken;
  let dist1Id;

  beforeAll(async () => {
    const makeToken = (id, role, name) =>
      jwt.sign({ sub: id, role, fullName: name, tokenVersion: 1 }, env.jwtSecret, {
        expiresIn: '1h'
      });

    const { rows: users } = await query(
      'SELECT id, role, full_name FROM users WHERE is_active = true'
    );

    adminKantorUser = users.find((u) => u.role === 'ADMIN_KANTOR') || users.find((u) => u.role === 'ADMIN_SISTEM');
    inspectorUser = users.find((u) => u.role === 'AHLI_K3' || u.role === 'INSPECTOR');
    const pimpinanUser = users.find((u) => u.role === 'PIMPINAN');
    const marketingUser = users.find((u) => u.role === 'MARKETING');

    adminKantorToken = makeToken(
      adminKantorUser.id,
      'ADMIN_KANTOR',
      adminKantorUser.full_name || 'Admin Kantor URD'
    );
    inspectorToken = makeToken(
      inspectorUser.id,
      inspectorUser.role,
      inspectorUser.full_name || 'Ahli K3 URD'
    );
    pimpinanToken = makeToken(
      pimpinanUser?.id || adminKantorUser.id,
      'PIMPINAN',
      pimpinanUser?.full_name || 'Direktur URD'
    );
    marketingToken = makeToken(
      marketingUser?.id || adminKantorUser.id,
      'MARKETING',
      marketingUser?.full_name || 'Marketing URD'
    );

    // Pastikan inspector memiliki baris inspectors dan kompetensi PAA (category_id = 1)
    await query(
      `INSERT INTO inspectors (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [inspectorUser.id]
    );
    await query(
      `INSERT INTO inspector_competencies (inspector_id, category_id, certificate_no, valid_from, valid_until)
       VALUES ($1, 1, 'SKP-PAA-TEST-V2', '2024-01-01', '2028-12-31')
       ON CONFLICT DO NOTHING`,
      [inspectorUser.id]
    );
  });

  it('1. menyiapkan PO multi-unit (2 unit alat PAA) dan menjadwalkan Ahli K3', async () => {
    const suffix = Date.now().toString().slice(-6);
    const clientRes = await request(app)
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({
        name: `PT Uji Presisi V2 ${suffix}`,
        industry: 'Manufaktur Baja',
        address: 'Kawasan Industri Jababeka Cikarang',
        city: 'Bekasi',
        npwp: `01.234.${suffix.slice(0, 3)}.8-${suffix.slice(3, 6)}.000`
      });
    expect(clientRes.status).toBe(201);
    clientId = clientRes.body.client.id;

    const u1Res = await request(app)
      .post('/api/v1/objects')
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({
        clientId,
        categoryId: 1,
        name: `Overhead Crane Unit A ${suffix}`,
        brand: 'Konecranes',
        model: 'CXT-10T',
        serialNumber: `SN-V2-A-${suffix}`,
        capacity: '10',
        capacityUnit: 'Ton',
        installLocation: 'Hall Produksi A'
      });
    expect(u1Res.status).toBe(201);
    unit1Id = u1Res.body.object.id;

    const u2Res = await request(app)
      .post('/api/v1/objects')
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({
        clientId,
        categoryId: 1,
        name: `Forklift Diesel Unit B ${suffix}`,
        brand: 'Toyota',
        model: '8FD30',
        serialNumber: `SN-V2-B-${suffix}`,
        capacity: '3',
        capacityUnit: 'Ton',
        installLocation: 'Gudang Logistik B'
      });
    expect(u2Res.status).toBe(201);
    unit2Id = u2Res.body.object.id;

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({
        clientId,
        poNumber: `PO-URD-V2-${suffix}`,
        poDate: '2026-11-05',
        serviceType: 'PEMERIKSAAN_BERKALA',
        source: 'DOKUMEN_PO',
        objectIds: [unit1Id, unit2Id],
        notes: 'Pengujian multi-unit V2'
      });
    expect(orderRes.status).toBe(201);
    orderId = orderRes.body.order.id;

    const slotOffsetMs = (Number(suffix) % 40000) * 600000;
    const startAt = new Date(Date.UTC(2027, 0, 1) + slotOffsetMs).toISOString();
    const endAt = new Date(Date.UTC(2027, 0, 1) + slotOffsetMs + 300000).toISOString();
    const schedRes = await request(app)
      .post(`/api/v1/orders/${orderId}/schedule`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({
        startAt,
        endAt,
        notes: 'Jadwal pengujian V2'
      });
    expect([200, 201]).toContain(schedRes.status);

    for (const objectId of [unit1Id, unit2Id]) {
      const assignRes = await request(app)
        .post(`/api/v1/orders/${orderId}/assignments`)
        .set('Authorization', `Bearer ${adminKantorToken}`)
        .send({
          objectId,
          inspectorIds: [inspectorUser.id]
        });
      expect([200, 201]).toContain(assignRes.status);
    }
  });

  it('2. Ahli K3 menyelesaikan dan mengirim hasil inspeksi kedua unit', async () => {
    const completeInspection = async (objectId) => {
      const startRes = await request(app)
        .post('/api/v1/inspections/start')
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({ orderId, objectId });
      expect([200, 201]).toContain(startRes.status);
      const inspId = startRes.body.inspection.id;

      const detailRes = await request(app)
        .get(`/api/v1/inspections/${inspId}`)
        .set('Authorization', `Bearer ${inspectorToken}`);
      expect(detailRes.status).toBe(200);
      const items = detailRes.body.items || [];

      const resultsPayload = items.map((it) => ({
        itemId: it.id,
        choiceValue: it.input_type === 'CHOICE' ? 'SESUAI' : null,
        numberValue: it.input_type === 'NUMBER' ? (it.min_value ?? 10) : null,
        textValue: it.input_type === 'TEXT' ? 'Kondisi Baik' : null,
        note: 'OK'
      }));

      const draftRes = await request(app)
        .put(`/api/v1/inspections/${inspId}/draft`)
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          conclusion: 'MEMENUHI_SYARAT_DENGAN_CATATAN',
          conclusionNotes: 'Laik operasi dengan pemeliharaan berkala.',
          scopeItems: ['Pemeriksaan Visual', 'Pengujian Fungsi'],
          results: resultsPayload,
          objectAttributes: { lifting_height_m: '8', span_m: '15' }
        });
      expect(draftRes.status).toBe(200);

      // Tanda tangan Inspector & Klien
      const sig1 = await request(app)
        .post(`/api/v1/inspections/${inspId}/signatures`)
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          signerRole: 'AHLI_K3',
          signerName: inspectorUser.full_name || 'Ahli K3',
          signerTitle: 'Ahli K3 Spesialis PAA',
          dataUrl: SAMPLE_PNG_DATA_URL
        });
      expect(sig1.status).toBe(201);

      const sig2 = await request(app)
        .post(`/api/v1/inspections/${inspId}/signatures`)
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          signerRole: 'PERWAKILAN_KLIEN',
          signerName: 'Ir. Hendra Kusuma',
          signerTitle: 'HSE Manager',
          dataUrl: SAMPLE_PNG_DATA_URL
        });
      expect(sig2.status).toBe(201);

      // Unggah 2 foto wajib sebelum submit
      const pngBuf = Buffer.from(SAMPLE_PNG_DATA_URL.split(',')[1], 'base64');
      for (let idx = 1; idx <= 2; idx++) {
        const upRes = await request(app)
          .post(`/api/v1/inspections/${inspId}/photos`)
          .set('Authorization', `Bearer ${inspectorToken}`)
          .field('caption', `Foto Pemeriksaan Lapangan #${idx}`)
          .attach('photo', pngBuf, `foto-lapangan-${idx}.png`);
        expect(upRes.status).toBe(201);
      }

      const subRes = await request(app)
        .post(`/api/v1/inspections/${inspId}/submit`)
        .set('Authorization', `Bearer ${inspectorToken}`);
      expect(subRes.status).toBe(200);
      return {
        inspId,
        lhppId: subRes.body.lhpp?.id,
        bapId: subRes.body.bap?.id
      };
    };

    const r1 = await completeInspection(unit1Id);
    const r2 = await completeInspection(unit2Id);
    insp1Id = r1.inspId;
    lhpp1Id = r1.lhppId;
    bap1Id = r1.bapId;
    insp2Id = r2.inspId;
    expect(insp1Id).toBeTruthy();
    expect(lhpp1Id).toBeTruthy();
    expect(insp2Id).toBeTruthy();
  });

  it('3. Admin Kantor meminta revisi pada Unit 1 dengan targetSection tanpa memblokir Unit 2 di PO yang sama', async () => {
    const reopenRes = await request(app)
      .post(`/api/v1/inspections/${insp1Id}/reopen`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({
        targetSection: 'Dokumentasi Foto Lapangan',
        reason: 'Foto nameplate kurang tajam, mohon unggah ulang foto beresolusi jelas.'
      });

    expect(reopenRes.status).toBe(200);
    expect(reopenRes.body.inspection.status).toBe('DRAF');
    expect(reopenRes.body.inspection.revision_no).toBe(1);

    // Pastikan unit_status Unit 1 menjadi PERLU_REVISI, sedangkan Unit 2 tetap tidak terganggu
    const { rows: unitStatuses } = await query(
      'SELECT object_id, unit_status FROM order_objects WHERE order_id = $1',
      [orderId]
    );
    const u1Status = unitStatuses.find((u) => u.object_id === unit1Id)?.unit_status;
    const u2Status = unitStatuses.find((u) => u.object_id === unit2Id)?.unit_status;
    expect(u1Status).toBe('PERLU_REVISI');
    expect(u2Status).not.toBe('PERLU_REVISI');

    // Pastikan LHPP Unit 1 berstatus DIKEMBALIKAN dengan catatan yang memuat bagian revisi
    const lhppRes = await request(app)
      .get(`/api/v1/lhpp/${lhpp1Id}`)
      .set('Authorization', `Bearer ${adminKantorToken}`);
    expect(lhppRes.status).toBe(200);
    expect(lhppRes.body.lhpp.status).toBe('DIKEMBALIKAN');
    expect(lhppRes.body.lhpp.review_notes).toContain('[Bagian: Dokumentasi Foto Lapangan]');
  });

  it('4. Ahli K3 mengirim ulang hasil revisi Unit 1 dan mengajukan LHPP ke Admin Kantor (submit-finalization)', async () => {
    const subRes = await request(app)
      .post(`/api/v1/inspections/${insp1Id}/submit`)
      .set('Authorization', `Bearer ${inspectorToken}`);
    expect(subRes.status).toBe(200);

    // Uji endpoint submit-finalization oleh role AHLI_K3 / INSPECTOR
    const subLhppRes = await request(app)
      .post(`/api/v1/lhpp/${lhpp1Id}/submit-finalization`)
      .set('Authorization', `Bearer ${inspectorToken}`);
    expect(subLhppRes.status).toBe(200);
    expect(subLhppRes.body.lhpp.status).toBe('SIAP_PREVIEW');
  });

  it('5. menolak finalisasi BAP sebelum LHPP difinalisasi (Urutan Dokumen LHPP -> BAP)', async () => {
    if (!bap1Id) {
      const { rows } = await query('SELECT id FROM bap_documents WHERE inspection_id = $1', [insp1Id]);
      bap1Id = rows[0]?.id;
    }
    if (bap1Id) {
      const res = await request(app)
        .post(`/api/v1/bap/${bap1Id}/finalize`)
        .set('Authorization', `Bearer ${adminKantorToken}`);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('LHPP_NOT_FINALIZED');
    }
  });

  it('6. Admin Kantor melakukan pratinjau PDF & DOCX LHPP sebelum finalisasi dan menolak Pimpinan/Marketing memfinalisasi LHPP', async () => {
    const pdfRes = await request(app)
      .get(`/api/v1/lhpp/${lhpp1Id}/pdf`)
      .set('Authorization', `Bearer ${adminKantorToken}`);
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    expect(pdfRes.body.length).toBeGreaterThan(1000);

    const docxRes = await request(app)
      .get(`/api/v1/lhpp/${lhpp1Id}/docx`)
      .set('Authorization', `Bearer ${adminKantorToken}`);
    expect(docxRes.status).toBe(200);
    expect(docxRes.headers['content-type']).toContain('officedocument.wordprocessingml.document');

    // Pimpinan & Marketing ditolak (403)
    const pimpFinalize = await request(app)
      .post(`/api/v1/lhpp/${lhpp1Id}/finalize`)
      .set('Authorization', `Bearer ${pimpinanToken}`)
      .send({ note: 'Percobaan tanpa hak akses' });
    expect(pimpFinalize.status).toBe(403);

    const mktFinalize = await request(app)
      .post(`/api/v1/lhpp/${lhpp1Id}/finalize`)
      .set('Authorization', `Bearer ${marketingToken}`)
      .send({ note: 'Percobaan tanpa hak akses' });
    expect(mktFinalize.status).toBe(403);
  });

  it('7. Admin Kantor memfinalisasi LHPP Unit 1, mengunci LHPP permanen, dan menghasilkan draf BAP otomatis', async () => {
    const finRes = await request(app)
      .post(`/api/v1/lhpp/${lhpp1Id}/finalize`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({ note: 'Data checklist, pengukuran, dan foto lengkap sesuai standar K3 PAA.' });
    expect(finRes.status).toBe(200);
    expect(finRes.body.lhpp.status).toBe('FINAL');
    expect(finRes.body.lhpp.lhpp_no).toBeTruthy();
    expect(finRes.body.lhpp.document_hash).toBeTruthy();
    expect(finRes.body.bap).toBeTruthy();
    bap1Id = finRes.body.bap.id;

    // Uji idempotensi jika diklik dua kali
    const dupRes = await request(app)
      .post(`/api/v1/lhpp/${lhpp1Id}/finalize`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({});
    expect(dupRes.status).toBe(200);
    expect(dupRes.body.lhpp.lhpp_no).toBe(finRes.body.lhpp.lhpp_no);

    // Uji ketertutupan dokumen final (tidak boleh dikembalikan ke revisi atau dibuka ulang)
    const retRes = await request(app)
      .post(`/api/v1/lhpp/${lhpp1Id}/return`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({ note: 'Coba kembalikan setelah final' });
    expect(retRes.status).toBe(409);

    const reopInsp = await request(app)
      .post(`/api/v1/inspections/${insp1Id}/reopen`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({ reason: 'Coba buka ulang inspeksi setelah LHPP final' });
    expect(reopInsp.status).toBe(409);
  });

  it('8. Admin Kantor memperbarui draf BAP, mempratinjau PDF BAP, dan memfinalisasi BAP Unit 1', async () => {
    const updBap = await request(app)
      .put(`/api/v1/bap/${bap1Id}/draft`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({
        inspectionDate: '2026-11-05',
        scopeItems: ['Pemeriksaan Dokumen Teknik', 'Pemeriksaan Visual', 'Uji Beban Dinamis'],
        isCompliant: true,
        inspectionNotes: 'Seluruh pengujian fungsi dan rem darurat memenuhi standar K3.'
      });
    expect(updBap.status).toBe(200);

    // Inspector tidak boleh memfinalisasi BAP (403)
    const inspFinBap = await request(app)
      .post(`/api/v1/bap/${bap1Id}/finalize`)
      .set('Authorization', `Bearer ${inspectorToken}`);
    expect(inspFinBap.status).toBe(403);

    // Admin Kantor memfinalisasi BAP
    const finBap = await request(app)
      .post(`/api/v1/bap/${bap1Id}/finalize`)
      .set('Authorization', `Bearer ${adminKantorToken}`);
    expect(finBap.status).toBe(200);
    expect(finBap.body.bap.status).toBe('FINAL');
    expect(finBap.body.bap.document_hash).toBeTruthy();
  });

  it('9. Admin Kantor mengelola Suket K3, mengunggah Scan Disnaker, mencetak Stiker QR, dan memverifikasi endpoint publik QR', async () => {
    const createSuket = await request(app)
      .post('/api/v1/suket')
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({
        objectId: unit1Id,
        lhppId: lhpp1Id,
        suketNo: `560-SUKET-PAA-${Date.now().toString().slice(-4)}-2026`,
        status: 'TERBIT',
        submittedDate: '2026-11-05',
        issuedDate: '2026-11-05',
        validUntil: '2027-11-05',
        issuer: 'Disnakertrans Provinsi Jawa Barat',
        statusNotes: 'Suket K3 resmi terbit'
      });
    expect(createSuket.status).toBe(201);
    suket1Id = createSuket.body.suket.id;
    suketQrToken = createSuket.body.suket.suket_no;
    expect(suketQrToken).toBeTruthy();

    // Unggah scan Suket
    const pngBuf = Buffer.from(SAMPLE_PNG_DATA_URL.split(',')[1], 'base64');
    const scanRes = await request(app)
      .post(`/api/v1/suket/${suket1Id}/scan`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .attach('file', pngBuf, 'scan-suket-disnaker.png');
    expect([200, 201]).toContain(scanRes.status);
    expect(scanRes.body.file.id).toBeTruthy();

    // Cetak Stiker QR PDF
    const qrPdfRes = await request(app)
      .get(`/api/v1/suket/${suket1Id}/qr-sticker.pdf`)
      .set('Authorization', `Bearer ${adminKantorToken}`);
    expect(qrPdfRes.status).toBe(200);
    expect(qrPdfRes.headers['content-type']).toContain('application/pdf');
    expect(qrPdfRes.body.length).toBeGreaterThan(800);

    // Verifikasi QR publik berdasarkan ID Suket maupun Nomor Suket
    const verifyRes = await request(app).get(`/api/v1/verify/${suket1Id}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.verified).toBe(true);
    expect(verifyRes.body.documentType).toBe('SUKET');
    expect(verifyRes.body.documentNo).toBe(createSuket.body.suket.suket_no);
  });

  it('10. Admin Kantor mempratinjau BAST PDF dan memperbarui status distribusi dengan validasi bukti kirim', async () => {
    const bastRes = await request(app)
      .get(`/api/v1/distributions/orders/${orderId}/bast/pdf`)
      .set('Authorization', `Bearer ${adminKantorToken}`);
    expect(bastRes.status).toBe(200);
    expect(bastRes.headers['content-type']).toContain('application/pdf');
    expect(bastRes.headers['content-disposition']).toContain('inline');
    expect(bastRes.body.length).toBeGreaterThan(1000);

    const listDist = await request(app)
      .get(`/api/v1/distributions?orderId=${orderId}`)
      .set('Authorization', `Bearer ${adminKantorToken}`);
    expect(listDist.status).toBe(200);
    expect(listDist.body.items.length).toBeGreaterThan(0);
    dist1Id = listDist.body.items[0].id;
    expect(listDist.body.items[0].recipient_target).toBeTruthy();

    // Menolak perubahan ke DITERIMA tanpa bukti/resi dan tanpa catatan (400)
    const failDist = await request(app)
      .patch(`/api/v1/distributions/${dist1Id}/status`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({
        status: 'DITERIMA',
        dispatchMedia: 'KURIR_FISIK',
        trackingReference: '',
        notes: ''
      });
    expect(failDist.status).toBe(400);
    expect(failDist.body.error.code).toBe('DELIVERY_EVIDENCE_REQUIRED');

    // Berhasil ketika dilengkapi nomor resi & catatan penerima
    const okDist = await request(app)
      .patch(`/api/v1/distributions/${dist1Id}/status`)
      .set('Authorization', `Bearer ${adminKantorToken}`)
      .send({
        status: 'DITERIMA',
        dispatchMedia: 'KURIR_FISIK',
        trackingReference: 'JNE-URD-20261105',
        notes: 'Diterima oleh Bpk. Hendra (HSE)'
      });
    expect(okDist.status).toBe(200);
    expect(okDist.body.distribution.status).toBe('DITERIMA');
    expect(okDist.body.distribution.tracking_number).toBe('JNE-URD-20261105');
  });
});
