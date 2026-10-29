import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDatabase } from '../../seeds/seed.js';
import { app } from '../app.js';
import { runMigrations } from '../database/migrate.js';
import { pool, query } from '../database/pool.js';

const TEST_PW = 'TestPassURD2026!';

describe('PT Upaya Riksa Daya - Full Backend API & Security Suite', () => {
  const tokens = {};
  const userIds = {};
  let clientId;
  let locationId;
  let contactId;
  let objectPaaId;
  let orderId;
  let assignmentId;
  let poAttachmentId;
  let inspectionId;
  let lhppId;
  let suketId;
  let unit1FindingId;

  beforeAll(async () => {
    await runMigrations({ reset: true });
    await seedDatabase({ password: TEST_PW });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('1. Autentikasi & Keamanan Sesi', () => {
    it('menolak akses endpoint privat tanpa autentikasi (401)', async () => {
      const res = await request(app).get('/api/v1/clients');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('menolak login dengan kredensial salah tanpa membocorkan detail akun (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin.sistem@upayariksadaya.com', password: 'WrongPassword123' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('berhasil login untuk keempat peran (ADMIN_SISTEM, ADMIN_KANTOR, AHLI_K3, PIMPINAN)', async () => {
      const rolesToEmails = {
        ADMIN_SISTEM: 'admin.sistem@upayariksadaya.com',
        ADMIN_KANTOR: 'admin.kantor@upayariksadaya.com',
        AHLI_K3_PAA: 'ahlik3.paa@upayariksadaya.com',
        AHLI_K3_LIS: 'ahlik3.listrik@upayariksadaya.com',
        PIMPINAN: 'pimpinan@upayariksadaya.com'
      };

      for (const [key, email] of Object.entries(rolesToEmails)) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({ email, password: TEST_PW });
        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeTruthy();
        expect(res.body.user.password_hash).toBeUndefined();
        tokens[key] = res.body.accessToken;
        userIds[key] = res.body.user.id;
      }
    });

    it('mendukung rotasi refresh token dan menolak token yang sudah di-logout', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin.kantor@upayariksadaya.com', password: TEST_PW });
      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies)
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toBeTruthy();

      const rotatedCookies = refreshRes.headers['set-cookie'];
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', rotatedCookies)
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(logoutRes.status).toBe(200);

      const afterLogout = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', rotatedCookies)
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(afterLogout.status).toBe(401);
    });

    it('menolak rotasi refresh token ganda secara bersamaan dan mencabut seluruh keluarga sesi', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin.kantor@upayariksadaya.com', password: TEST_PW });
      const cookies = loginRes.headers['set-cookie'];

      const concurrentRefreshes = await Promise.all(
        [0, 1].map(() =>
          request(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', cookies)
            .set('X-Requested-With', 'XMLHttpRequest')
        )
      );
      expect(concurrentRefreshes.map((res) => res.status).sort()).toEqual([200, 401]);

      const successfulRefresh = concurrentRefreshes.find((res) => res.status === 200);
      const replayedRefresh = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', successfulRefresh.headers['set-cookie'])
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(replayedRefresh.status).toBe(401);
      expect(replayedRefresh.body.error.code).toBe('SESSION_REUSED');
    });
  });

  describe('2. Otorisasi Berbasis Peran (RBAC)', () => {
    it('hanya ADMIN_SISTEM yang dapat mengelola daftar pengguna', async () => {
      const forbiddenRes = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(forbiddenRes.status).toBe(403);

      const allowedRes = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      expect(allowedRes.status).toBe(200);
      expect(allowedRes.body.items.length).toBeGreaterThanOrEqual(5);
    });

    it('menolak AHLI_K3 membuat klien baru (403)', async () => {
      const res = await request(app)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({ name: 'PT Tidak Diizinkan' });
      expect(res.status).toBe(403);
    });

    it('membatasi pemeriksaan konflik jadwal Ahli K3 pada jadwal miliknya sendiri', async () => {
      const res = await request(app)
        .get(
          `/api/v1/schedules/conflicts?inspectorId=${userIds.AHLI_K3_PAA}&startAt=2026-11-05T08:00:00.000Z&endAt=2026-11-05T09:00:00.000Z`
        )
        .set('Authorization', `Bearer ${tokens.AHLI_K3_LIS}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('3. Manajemen Klien, Lokasi, PIC, dan Objek Uji (M1)', () => {
    it('ADMIN_KANTOR dapat membuat klien beserta lokasi cabang dan kontak PIC', async () => {
      const clientRes = await request(app)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          name: 'PT Baja Konstruksi Nusantara',
          npwp: '01.234.567.8-091.000',
          address: 'Kawasan Industri Pulogadung Blok J-12, Jakarta Timur',
          industry: 'Manufaktur & Konstruksi Baja',
          email: 'hse@bajakonstruksi.co.id',
          phone: '021-4601234'
        });
      expect(clientRes.status).toBe(201);
      clientId = clientRes.body.client.id;

      const locRes = await request(app)
        .post(`/api/v1/clients/${clientId}/locations`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          name: 'Pabrik Plant 1 Cikarang',
          address: 'Jl. Jababeka Raya Kav. A-9',
          city: 'Bekasi'
        });
      expect(locRes.status).toBe(201);
      locationId = locRes.body.location.id;

      const picRes = await request(app)
        .post(`/api/v1/clients/${clientId}/contacts`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          name: 'Irwan Setiawan',
          position: 'HSE Supervisor',
          phone: '0811-900-2233',
          email: 'irwan.hse@bajakonstruksi.co.id'
        });
      expect(picRes.status).toBe(201);
      contactId = picRes.body.contact.id;
    });

    it('mencatat objek uji K3 dan menolak duplikasi nomor seri untuk klien yang sama (M1-08)', async () => {
      const createRes = await request(app)
        .post('/api/v1/objects')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          clientId,
          locationId,
          categoryId: 1, // PAA
          name: 'Overhead Travelling Crane 10 Ton',
          brand: 'Konecranes',
          model: 'CXT-10T',
          serialNumber: 'KC-2022-9981',
          manufactureYear: 2022,
          capacity: '10 Ton',
          installLocation: 'Hall Produksi Bay B',
          previousPermitNo: 'SUKET/PAA/2025/0089',
          attributes: { swl: '10' }
        });
      expect(createRes.status).toBe(201);
      objectPaaId = createRes.body.object.id;

      // Coba duplikasi nomor seri dengan huruf kecil/spasi
      const dupRes = await request(app)
        .post('/api/v1/objects')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          clientId,
          categoryId: 1,
          name: 'Overhead Crane Duplikat',
          serialNumber: '  kc-2022-9981 '
        });
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('DUPLICATE_SERIAL_NUMBER');

      // Tambah objek kedua kategori Instalasi Listrik (categoryId: 4)
      const lisRes = await request(app)
        .post('/api/v1/objects')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          clientId,
          locationId,
          categoryId: 4, // LIS
          name: 'Panel LVMDP Utama Plant 1',
          brand: 'Schneider',
          model: 'Prisma iPM',
          serialNumber: 'SCH-LV-7710',
          manufactureYear: 2023,
          capacity: '1250 kVA',
          installLocation: 'Ruang Panel Utama'
        });
      expect(lisRes.status).toBe(201);
      expect(lisRes.body.object.id).toBeTruthy();
    });

    it('mendukung impor massal CSV objek uji (M1-09) dan pembuatan QR code (M1-11)', async () => {
      const csvText = [
        'kategori,nama,merek,tipe,nomor_seri,tahun,kapasitas,lokasi',
        'PUBT,Bejana Tekan Air Receiver,Hitachi,AR-2000,HT-AR-5501,2021,2000 Liter,Area Compressor'
      ].join('\n');

      const impRes = await request(app)
        .post('/api/v1/objects/import-csv')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({ clientId, csvText });
      expect(impRes.status).toBe(201);
      expect(impRes.body.imported).toBe(1);

      const qrRes = await request(app)
        .get(`/api/v1/objects/${objectPaaId}/qr`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(qrRes.status).toBe(200);
      expect(qrRes.body.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('4. Order, Penjadwalan, Kompetensi Ahli K3 & Deteksi Konflik (M2)', () => {
    it('membuat order pemeriksaan, menjadwalkan, dan memverifikasi kompetensi Ahli K3', async () => {
      const ordRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          clientId,
          locationId,
          contactId,
          serviceType: 'PEMERIKSAAN_BERKALA',
          source: 'WHATSAPP',
          requestedDate: '2026-11-05',
          objectIds: [objectPaaId]
        });
      expect(ordRes.status).toBe(201);
      orderId = ordRes.body.order.id;
      expect(ordRes.body.order.status).toBe('ORDER_BARU');

      const schedRes = await request(app)
        .post(`/api/v1/orders/${orderId}/schedule`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          startAt: '2026-11-05T08:00:00.000Z',
          endAt: '2026-11-05T16:00:00.000Z',
          notes: 'Siapkan APD lengkap dan alat ukur beban'
        });
      expect(schedRes.status).toBe(200);

      // Coba tugaskan Ahli K3 Listrik (tidak punya kompetensi PAA) -> harus ditolak 400
      const wrongCompRes = await request(app)
        .post(`/api/v1/orders/${orderId}/assignments`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({ inspectorIds: [userIds.AHLI_K3_LIS] });
      expect(wrongCompRes.status).toBe(400);
      expect(wrongCompRes.body.error.code).toBe('COMPETENCY_INVALID');

      // Tugaskan Ahli K3 PAA yang kompeten -> berhasil
      const validAsgRes = await request(app)
        .post(`/api/v1/orders/${orderId}/assignments`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({ inspectorIds: [userIds.AHLI_K3_PAA] });
      expect(validAsgRes.status).toBe(201);
      assignmentId = validAsgRes.body.assignments[0].id;
    });

    it('mendeteksi jadwal bentrok saat Ahli K3 yang sama ditugaskan pada jam yang beririsan (M2-04)', async () => {
      const ord2 = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          clientId,
          serviceType: 'PEMERIKSAAN_BERKALA',
          source: 'EMAIL',
          objectIds: [objectPaaId]
        });
      const order2Id = ord2.body.order.id;

      await request(app)
        .post(`/api/v1/orders/${order2Id}/schedule`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          startAt: '2026-11-05T10:00:00.000Z',
          endAt: '2026-11-05T14:00:00.000Z'
        });

      const conflictRes = await request(app)
        .post(`/api/v1/orders/${order2Id}/assignments`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({ inspectorIds: [userIds.AHLI_K3_PAA] });
      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.error.code).toBe('SCHEDULE_CONFLICT');
    });

    it('Ahli K3 menerima penugasan & dapat mengunduh PDF Surat Tugas', async () => {
      const resp = await request(app)
        .post(`/api/v1/orders/${orderId}/assignments/${assignmentId}/respond`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({ decision: 'DITERIMA' });
      expect(resp.status).toBe(200);
      expect(resp.body.assignment.status).toBe('DITERIMA');

      const pdfRes = await request(app)
        .get(`/api/v1/orders/${orderId}/assignment-letter.pdf`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      expect(pdfRes.status).toBe(200);
      expect(pdfRes.headers['content-type']).toContain('application/pdf');
    });

    it('mencegah Ahli K3 lain yang tidak ditugaskan mengakses order ini (ID manipulation check)', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_LIS}`);
      expect(res.status).toBe(403);
    });
  });

  describe('5. Digital Inspection Form, Penguncian & Generator LHPP (M3 & M4)', () => {
    it('Ahli K3 memulai inspeksi, menyimpan draf, mencatat temuan, tanda tangan, dan mengirim form', async () => {
      const startRes = await request(app)
        .post('/api/v1/inspections/start')
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({ orderId, objectId: objectPaaId });
      expect(startRes.status).toBe(201);
      inspectionId = startRes.body.inspection.id;

      const detailRes = await request(app)
        .get(`/api/v1/inspections/${inspectionId}`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      expect(detailRes.status).toBe(200);
      const items = detailRes.body.items;
      expect(items.length).toBeGreaterThan(0);

      const draftPayload = {
        conclusion: 'MEMENUHI_SYARAT_DENGAN_CATATAN',
        conclusionNotes: 'Fungsi utama baik, perlu pengecatan ulang penandaan SWL pada girder.',
        results: items.map((it) => ({
          itemId: it.id,
          choiceValue: it.input_type === 'CHOICE' ? 'SESUAI' : null,
          textValue: it.input_type === 'TEXT' ? 'Pengujian beban 100% berjalan normal tanpa defleksi berlebih.' : null,
          numberValue: it.input_type === 'NUMBER' ? 10.0 : null,
          note: 'Diperiksa di lokasi'
        }))
      };

      const saveRes = await request(app)
        .put(`/api/v1/inspections/${inspectionId}/draft`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send(draftPayload);
      expect(saveRes.status).toBe(200);

      // Tambah temuan lapangan
      const findRes = await request(app)
        .post(`/api/v1/inspections/${inspectionId}/findings`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({
          itemId: items[1].id,
          severity: 'MINOR',
          description: 'Cat tulisan SWL 10 Ton pada sisi kanan girder mulai pudar.',
          recommendation: 'Lakukan pengecatan ulang tulisan kapasitas SWL dengan warna kontras.'
        });
      expect(findRes.status).toBe(201);
      unit1FindingId = findRes.body.finding.id;

      // Simpan tanda tangan berita acara (PNG 1x1 transparan base64)
      const onePxPng =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const sigRes = await request(app)
        .post(`/api/v1/inspections/${inspectionId}/signatures`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({
          signerRole: 'PERWAKILAN_KLIEN',
          signerName: 'Irwan Setiawan',
          signerTitle: 'HSE Supervisor',
          dataUrl: onePxPng
        });
      expect(sigRes.status).toBe(201);

      // Kirim form inspeksi -> mengunci form & membuat draf LHPP otomatis
      const subRes = await request(app)
        .post(`/api/v1/inspections/${inspectionId}/submit`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      expect(subRes.status).toBe(200);
      expect(subRes.body.inspection.status).toBe('TERKIRIM');
      expect(subRes.body.lhpp.id).toBeTruthy();
      lhppId = subRes.body.lhpp.id;

      // Pastikan form yang sudah terkirim terlindungi dari perubahan langsung (M3-11)
      const lockedEdit = await request(app)
        .put(`/api/v1/inspections/${inspectionId}/draft`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send(draftPayload);
      expect(lockedEdit.status).toBe(409);
      expect(lockedEdit.body.error.code).toBe('INSPECTION_LOCKED');
    });

    it('menjalankan alur review LHPP: pengembalian dengan catatan, pengajuan ulang, persetujuan Pimpinan, nomor unik & PDF', async () => {
      // Ahli K3 mengajukan draf LHPP ke Review Teknis
      const subRev = await request(app)
        .post(`/api/v1/lhpp/${lhppId}/submit-review`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      expect(subRev.status).toBe(200);
      expect(subRev.body.lhpp.status).toBe('REVIEW_TEKNIS');

      // Non-Pimpinan tidak boleh menyetujui LHPP
      const nonLeader = await request(app)
        .post(`/api/v1/lhpp/${lhppId}/review`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({ decision: 'APPROVE_FINAL' });
      expect(nonLeader.status).toBe(403);

      // Pimpinan mengembalikan LHPP dengan catatan revisi
      const retRes = await request(app)
        .post(`/api/v1/lhpp/${lhppId}/review`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({
          decision: 'RETURN',
          note: 'Lengkapi rincian alat ukur pada ringkasan metode pengujian.'
        });
      expect(retRes.status).toBe(200);
      expect(retRes.body.lhpp.status).toBe('DIKEMBALIKAN');

      // Ahli K3 memperbaiki draf dan mengajukan kembali (versi naik menjadi v2)
      await request(app)
        .put(`/api/v1/lhpp/${lhppId}/draft`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({
          methodSummary:
            'Pemeriksaan visual, pengujian fungsi limit switch, dan uji beban menggunakan load cell terkalibrasi.',
          technicalNotes: 'Seluruh parameter keselamatan mekanis dan elektrik berfungsi baik.',
          recommendations: '1. [MINOR] Cat ulang penandaan kapasitas SWL 10 Ton pada girder.'
        });

      const resub = await request(app)
        .post(`/api/v1/lhpp/${lhppId}/submit-review`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      expect(resub.status).toBe(200);
      expect(resub.body.lhpp.version).toBe(2);

      // Pimpinan menyetujui final -> Terbit dengan nomor unik & kode verifikasi
      const pubRes = await request(app)
        .post(`/api/v1/lhpp/${lhppId}/review`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({ decision: 'APPROVE_FINAL', note: 'Disetujui untuk diterbitkan.' });
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.lhpp.status).toBe('TERBIT');
      expect(pubRes.body.lhpp.lhpp_no).toMatch(/^\d{4}\/INSP-PAA\/PJK3-URD\/[IVX]+\/\d{4}$/);
      expect(pubRes.body.lhpp.verification_code).toMatch(/^URD-/);

      // Dokumen terbit tidak dapat diubah atau di-review ulang
      const mutatePublished = await request(app)
        .post(`/api/v1/lhpp/${lhppId}/review`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({ decision: 'RETURN', note: 'Coba ubah setelah terbit' });
      expect(mutatePublished.status).toBe(409);

      // Unduh PDF LHPP
      const pdfRes = await request(app)
        .get(`/api/v1/lhpp/${lhppId}/pdf`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(pdfRes.status).toBe(200);
      expect(pdfRes.headers['content-type']).toContain('application/pdf');
      expect(pdfRes.body.length).toBeGreaterThan(1000);

      // Catat pengiriman LHPP ke klien
      const delivRes = await request(app)
        .post(`/api/v1/lhpp/${lhppId}/deliveries`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          deliveredAt: new Date().toISOString(),
          channel: 'EMAIL',
          recipientName: 'Irwan Setiawan',
          recipientEmail: 'irwan.hse@bajakonstruksi.co.id',
          notes: 'PDF LHPP dikirimkan melalui email resmi'
        });
      expect(delivRes.status).toBe(201);
    });
  });

  describe('6. Registri Suket K3, Pengingat Anti-Duplikasi & Audit Trail (M4, M5, MP)', () => {
    it('mencatat Suket K3 yang akan kedaluwarsa, menjalankan pengingat tanpa duplikasi, dan membuat order perpanjangan', async () => {
      const in20Days = new Date(Date.now() + 20 * 86400 * 1000).toISOString().slice(0, 10);

      const sukRes = await request(app)
        .post('/api/v1/suket')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          objectId: objectPaaId,
          lhppId,
          suketNo: '566/SUKET-PAA/X/2026',
          status: 'TERBIT',
          submittedDate: '2025-11-10',
          issuedDate: '2025-11-18',
          validUntil: in20Days,
          issuer: 'Disnakertrans Provinsi Jawa Barat'
        });
      expect(sukRes.status).toBe(201);
      suketId = sukRes.body.suket.id;

      // Jalankan dispatch pengingat pertama kali -> harus mengirim pengingat H30
      const disp1 = await request(app)
        .post('/api/v1/reminders/run-dispatch')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(disp1.status).toBe(200);
      expect(disp1.body.dispatchedCount).toBeGreaterThanOrEqual(1);

      // Jalankan dispatch kedua kali pada hari yang sama -> tidak boleh ada duplikasi pengiriman (0 baru)
      const disp2 = await request(app)
        .post('/api/v1/reminders/run-dispatch')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(disp2.status).toBe(200);
      expect(disp2.body.dispatchedCount).toBe(0);

      // Catat tindak lanjut komunikasi dengan klien
      const folRes = await request(app)
        .post(`/api/v1/suket/${suketId}/followups`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          status: 'SETUJU_PERPANJANG',
          contactPic: 'Irwan Setiawan',
          note: 'Klien menyetujui jadwal riksa uji perpanjangan bulan depan.'
        });
      expect(folRes.status).toBe(201);

      // Buat order perpanjangan cepat dari pengingat
      const renRes = await request(app)
        .post(`/api/v1/reminders/${suketId}/create-renewal-order`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(renRes.status).toBe(201);
      expect(renRes.body.order.service_type).toBe('PERPANJANGAN');
    });

    it('mencatat jejak audit dan menolak upaya UPDATE/DELETE pada tabel audit_logs', async () => {
      const auditRes = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${tokens.ADMIN_SISTEM}`);
      expect(auditRes.status).toBe(200);
      expect(auditRes.body.items.length).toBeGreaterThan(5);

      await expect(
        query("DELETE FROM audit_logs WHERE action = 'AUTH_LOGIN'")
      ).rejects.toThrow(/append-only/);
    });
  });

  describe('7. End-to-End Multi-Unit PO, BAP, Category-Specific LHPP, Riwayat Unit & PO Completion Gate', () => {
    let poOrderId;
    let poUnitIds = [];
    let poAssignmentId;
    let unit1BapId;
    let unit1LhppId;
    const onePxPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    it('Langkah 1: Admin membuat 1 PO dengan 3 unit alat berbeda (Overhead Crane PAA, Forklift PTP, Bejana Tekan PUBT) dan menolak duplikasi nomor PO', async () => {
      const poRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          clientId,
          locationId,
          contactId,
          poNumber: 'PO-URD-2026-001',
          poDate: '2026-11-01',
          serviceType: 'PEMERIKSAAN_BERKALA',
          source: 'DOKUMEN_PO',
          requestedDate: '2026-11-12',
          notes: 'Pemeriksaan 3 unit alat produksi sesuai PO-URD-2026-001',
          units: [
            {
              categoryId: 1, // PAA
              name: 'Overhead Crane 15 Ton Bay C',
              brand: 'Demag',
              model: 'DR-Pro 15',
              serialNumber: 'DMG-OC-2026-01',
              manufactureYear: 2021,
              capacity: '15 Ton',
              installLocation: 'Workshop Bay C',
              quantity: 1,
              scopeItems: ['HOIST_CRANE']
            },
            {
              categoryId: 2, // PTP
              name: 'Forklift Diesel 5 Ton',
              brand: 'Toyota',
              model: '8FD50N',
              serialNumber: 'TYT-FL-2026-02',
              manufactureYear: 2022,
              capacity: '5 Ton',
              installLocation: 'Gudang Logistik',
              quantity: 1,
              scopeItems: ['FORKLIFT']
            },
            {
              categoryId: 3, // PUBT
              name: 'Bejana Tekan Air Receiver 3000L',
              brand: 'Atlas Copco',
              model: 'LV-3000',
              serialNumber: 'AC-BT-2026-03',
              manufactureYear: 2020,
              capacity: '3000 Liter / 12 Bar',
              installLocation: 'Utility Room',
              quantity: 1,
              scopeItems: ['BEJANA_TEKAN']
            }
          ]
        });
      expect(poRes.status).toBe(201);
      poOrderId = poRes.body.order.id;
      expect(poRes.body.order.po_number).toBe('PO-URD-2026-001');
      expect(poRes.body.unitProgress.totalUnits).toBe(3);
      expect(poRes.body.unitProgress.unscheduled).toBe(3);
      expect(poRes.body.unitProgress.canCompletePo).toBe(false);

      const attachmentRes = await request(app)
        .post(`/api/v1/orders/${poOrderId}/po-attachment`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .attach('file', Buffer.from('%PDF-1.4 test PO attachment'), {
          filename: 'po-urd-2026-001.pdf',
          contentType: 'application/pdf'
        });
      expect(attachmentRes.status).toBe(201);
      poAttachmentId = attachmentRes.body.attachment.id;

      const detailRes = await request(app)
        .get(`/api/v1/orders/${poOrderId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.objects.length).toBe(3);
      poUnitIds = detailRes.body.objects.map((o) => o.id);

      // Pastikan duplikasi nomor PO ditolak
      const dupPoRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          clientId,
          poNumber: 'po-urd-2026-001',
          serviceType: 'PEMERIKSAAN_BERKALA',
          source: 'DOKUMEN_PO',
          objectIds: [poUnitIds[0]]
        });
      expect(dupPoRes.status).toBe(409);
      expect(dupPoRes.body.error.code).toBe('DUPLICATE_PO_NUMBER');
    });

    it('Langkah 2: Admin menjadwalkan PO & menugaskan Ahli K3; unit berubah status menjadi DITUGASKAN', async () => {
      const schedRes = await request(app)
        .post(`/api/v1/orders/${poOrderId}/schedule`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          startAt: '2026-11-12T08:00:00.000Z',
          endAt: '2026-11-12T17:00:00.000Z',
          notes: 'Pemeriksaan 3 unit PO-URD-2026-001'
        });
      expect(schedRes.status).toBe(200);

      const asgRes = await request(app)
        .post(`/api/v1/orders/${poOrderId}/assignments`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({ inspectorIds: [userIds.AHLI_K3_PAA] });
      expect(asgRes.status).toBe(201);
      poAssignmentId = asgRes.body.assignments[0].id;

      const acceptRes = await request(app)
        .post(`/api/v1/orders/${poOrderId}/assignments/${poAssignmentId}/respond`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({ decision: 'DITERIMA' });
      expect(acceptRes.status).toBe(200);

      const poDetail = await request(app)
        .get(`/api/v1/orders/${poOrderId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(poDetail.body.unitProgress.scheduled).toBe(3);
      expect(poDetail.body.objects.every((u) => u.unit_status === 'DITUGASKAN')).toBe(true);

      const assignedInspectorFile = await request(app)
        .get(`/api/v1/dashboard/files/${poAttachmentId}`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      expect(assignedInspectorFile.status).toBe(200);
      expect(assignedInspectorFile.headers['content-type']).toContain('application/pdf');

      const unrelatedInspectorFile = await request(app)
        .get(`/api/v1/dashboard/files/${poAttachmentId}`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_LIS}`);
      expect(unrelatedInspectorFile.status).toBe(403);
    });

    it('Langkah 3: Ahli K3 membuka penugasan Unit 1 (Overhead Crane), menyimpan draf, menambah temuan, dan mengirim form -> otomatis menghasilkan Draf BAP & Draf LHPP', async () => {
      const startRes = await request(app)
        .post('/api/v1/inspections/start')
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({ orderId: poOrderId, objectId: poUnitIds[0] });
      expect(startRes.status).toBe(201);
      const u1InspId = startRes.body.inspection.id;

      const detRes = await request(app)
        .get(`/api/v1/inspections/${u1InspId}`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      const checklistItems = detRes.body.items;
      expect(checklistItems.length).toBeGreaterThan(0);

      await request(app)
        .put(`/api/v1/inspections/${u1InspId}/draft`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({
          conclusion: 'MEMENUHI_SYARAT',
          conclusionNotes: 'Overhead Crane 15 Ton beroperasi aman dan sesuai standar K3.',
          results: checklistItems.map((it) => ({
            itemId: it.id,
            choiceValue: it.input_type === 'CHOICE' ? 'SESUAI' : null,
            textValue: it.input_type === 'TEXT' ? 'Sesuai standar' : null,
            numberValue: it.input_type === 'NUMBER' ? 15.0 : null,
            note: 'OK'
          }))
        });

      await request(app)
        .post(`/api/v1/inspections/${u1InspId}/findings`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({
          itemId: checklistItems[0].id,
          severity: 'MINOR',
          description: 'Label tombol pendant agak aus.',
          recommendation: 'Pasang stiker penanda arah tombol pendant yang baru.'
        });

      const subRes = await request(app)
        .post(`/api/v1/inspections/${u1InspId}/submit`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      expect(subRes.status).toBe(200);
      expect(subRes.body.bap).toBeTruthy();
      expect(subRes.body.bap.bap_no).toMatch(/^BAP\/URD\/[IVX]+\/\d{4}\/\d{4}$/);
      expect(subRes.body.lhpp).toBeTruthy();
      expect(subRes.body.lhpp.bap_id).toBe(subRes.body.bap.id);

      unit1BapId = subRes.body.bap.id;
      unit1LhppId = subRes.body.lhpp.id;
    });

    it('Langkah 4: BAP dihasilkan sesuai template PT Upaya Riksa Daya, ditandatangani kedua pihak, difinalisasi, dan diunduh sebagai PDF (satuan & batch PO)', async () => {
      const bapGet = await request(app)
        .get(`/api/v1/bap/${unit1BapId}`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      expect(bapGet.status).toBe(200);
      expect(bapGet.body.scopeCatalog.length).toBe(28);

      // Update draf BAP dengan ruang lingkup HOIST_CRANE
      const bapDraft = await request(app)
        .put(`/api/v1/bap/${unit1BapId}/draft`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({
          inspectionDate: '2026-11-12',
          scopeItems: ['HOIST_CRANE'],
          visualCheckNotes: 'Konstruksi girder, wire rope, dan hook dalam kondisi baik.',
          dimensionMeasurementNotes: 'Bentang span 18 meter sesuai gambar teknis.',
          ndtTestingNotes: 'Dye penetrant pada hook tidak ditemukan retak.',
          loadFunctionTestNotes: 'Uji beban dinamis 100% dan statis 125% memenuhi syarat.',
          safetyDeviceCheckNotes: 'Upper/lower limit switch dan emergency stop berfungsi.',
          conclusion: 'MEMENUHI_SYARAT',
          notes: 'Pemeriksaan disaksikan oleh HSE Supervisor klien.'
        });
      expect(bapDraft.status).toBe(200);

      // Tanda tangan Inspector & Perwakilan Klien pada BAP
      const sigInsp = await request(app)
        .post(`/api/v1/bap/${unit1BapId}/signatures`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({
          signerRole: 'AHLI_K3',
          signerName: 'Hendra Wijaya, S.T.',
          signerTitle: 'Ahli K3 Spesialis PAA',
          dataUrl: onePxPng
        });
      expect(sigInsp.status).toBe(201);

      const sigClient = await request(app)
        .post(`/api/v1/bap/${unit1BapId}/signatures`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({
          signerRole: 'PERWAKILAN_KLIEN',
          signerName: 'Irwan Setiawan',
          signerTitle: 'HSE Supervisor',
          dataUrl: onePxPng
        });
      expect(sigClient.status).toBe(201);

      // Finalisasi BAP -> mengunci dokumen BAP
      const finRes = await request(app)
        .post(`/api/v1/bap/${unit1BapId}/finalize`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      expect(finRes.status).toBe(200);
      expect(finRes.body.bap.status).toBe('FINAL');

      // Unduh PDF BAP satuan
      const pdfSingle = await request(app)
        .get(`/api/v1/bap/${unit1BapId}/pdf`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(pdfSingle.status).toBe(200);
      expect(pdfSingle.headers['content-type']).toContain('application/pdf');
      expect(pdfSingle.body.length).toBeGreaterThan(1000);

      // Unduh PDF BAP gabungan per PO
      const pdfBatch = await request(app)
        .get(`/api/v1/bap/order/${poOrderId}/batch-pdf`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(pdfBatch.status).toBe(200);
      expect(pdfBatch.headers['content-type']).toContain('application/pdf');
      expect(pdfBatch.body.length).toBeGreaterThan(1000);

      const unrelatedInspectorBatch = await request(app)
        .get(`/api/v1/bap/order/${poOrderId}/batch-pdf`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_LIS}`);
      expect(unrelatedInspectorBatch.status).toBe(403);
    });

    it('Langkah 5 & 6: LHPP spesifik kategori diisi, direview, dikembalikan, direvisi, disetujui, diunduh PDF, dan dicatat pengirimannya', async () => {
      const nextYearDate = new Date(Date.now() + 25 * 86400 * 1000).toISOString().slice(0, 10);

      const ownPhoto = await request(app)
        .post(`/api/v1/lhpp/${unit1LhppId}/photos`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .attach('photo', Buffer.from('sample image'), {
          filename: 'lhpp-photo.png',
          contentType: 'image/png'
        });
      expect(ownPhoto.status).toBe(201);

      const unauthorizedUpload = await request(app)
        .post(`/api/v1/lhpp/${unit1LhppId}/photos`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_LIS}`)
        .attach('photo', Buffer.from('sample image'), {
          filename: 'unrelated-photo.png',
          contentType: 'image/png'
        });
      expect(unauthorizedUpload.status).toBe(403);

      const unauthorizedDelete = await request(app)
        .delete(`/api/v1/lhpp/${unit1LhppId}/photos/${ownPhoto.body.photo.id}`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_LIS}`);
      expect(unauthorizedDelete.status).toBe(403);

      // Isi parameter teknis spesifik kategori PAA beserta tanggal masa berlaku rekomendasi
      const draftLhpp = await request(app)
        .put(`/api/v1/lhpp/${unit1LhppId}/draft`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({
          methodSummary: 'Pemeriksaan visual, dimensi, NDT penetrant pada hook, dan uji beban 125% SWL.',
          technicalNotes: 'Defleksi girder 6.2 mm (di bawah batas maksimum L/800).',
          recommendations: 'Pasang stiker penanda tombol pendant baru.',
          recommendedValidUntil: nextYearDate,
          technicalData: {
            regulationRef: 'Permenaker No. 8 Tahun 2020',
            swlCapacity: '15 Ton',
            spanLengthM: '18 Meter',
            liftingHeightM: '9 Meter',
            wireRopeChainSpec: 'IWRC 6x36 dia 16 mm',
            hookCondition: 'Baik, bukaan throat 0% perubahan',
            brakeSystemResult: 'Rem elektromagnetik menahan beban 125% tanpa slip',
            limitSwitchResult: 'Upper & lower limit switch memutus arus dengan tepat',
            deflectionMeasurementMm: '6.2 mm',
            staticLoadTestPercent: '125% SWL (18.75 Ton)',
            dynamicLoadTestPercent: '100% SWL (15 Ton)',
            ndtHookMethod: 'Liquid Penetrant Test (Non-Crack)'
          }
        });
      expect(draftLhpp.status).toBe(200);
      expect(draftLhpp.body.lhpp.technical_data.swlCapacity).toBe('15 Ton');

      // Ajukan ke Review Teknis
      await request(app)
        .post(`/api/v1/lhpp/${unit1LhppId}/submit-review`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);

      // Pimpinan kembalikan untuk revisi
      const retRes = await request(app)
        .post(`/api/v1/lhpp/${unit1LhppId}/review`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({ decision: 'RETURN', note: 'Tambahkan nomor sertifikat kalibrasi load cell pada catatan teknis.' });
      expect(retRes.status).toBe(200);
      expect(retRes.body.lhpp.status).toBe('DIKEMBALIKAN');

      // Inspector perbaiki dan ajukan ulang
      await request(app)
        .put(`/api/v1/lhpp/${unit1LhppId}/draft`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
        .send({
          methodSummary: 'Pemeriksaan visual, dimensi, NDT penetrant pada hook, dan uji beban 125% SWL.',
          technicalNotes: 'Defleksi girder 6.2 mm. Load cell terkalibrasi No. CAL-2026-881.',
          recommendations: 'Pasang stiker penanda tombol pendant baru.',
          recommendedValidUntil: nextYearDate,
          technicalData: {
            regulationRef: 'Permenaker No. 8 Tahun 2020',
            swlCapacity: '15 Ton',
            spanLengthM: '18 Meter',
            deflectionMeasurementMm: '6.2 mm',
            staticLoadTestPercent: '125% SWL'
          }
        });

      await request(app)
        .post(`/api/v1/lhpp/${unit1LhppId}/submit-review`)
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);

      // Pimpinan setujui final -> TERBIT
      const pubRes = await request(app)
        .post(`/api/v1/lhpp/${unit1LhppId}/review`)
        .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
        .send({ decision: 'APPROVE_FINAL', note: 'Data teknis PAA lengkap dan disetujui.' });
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.lhpp.status).toBe('TERBIT');

      // Unduh PDF LHPP
      const lhppPdf = await request(app)
        .get(`/api/v1/lhpp/${unit1LhppId}/pdf`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(lhppPdf.status).toBe(200);
      expect(lhppPdf.headers['content-type']).toContain('application/pdf');

      // Catat pengiriman dokumen LHPP ke klien
      const deliv = await request(app)
        .post(`/api/v1/lhpp/${unit1LhppId}/deliveries`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          deliveredAt: new Date().toISOString(),
          channel: 'EMAIL',
          recipientName: 'Irwan Setiawan',
          recipientEmail: 'irwan.hse@bajakonstruksi.co.id',
          notes: 'Pengiriman LHPP Unit 1 Overhead Crane PO-URD-2026-001'
        });
      expect(deliv.status).toBe(201);
    });

    it('Langkah 7: Riwayat pengujian unit muncul lengkap dengan nomor PO, nomor BAP, nomor LHPP, temuan, pengiriman, dan masa berlaku', async () => {
      const objDetail = await request(app)
        .get(`/api/v1/objects/${poUnitIds[0]}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(objDetail.status).toBe(200);
      expect(objDetail.body.history.length).toBe(1);
      const record = objDetail.body.history[0];
      expect(record.po_number).toBe('PO-URD-2026-001');
      expect(record.bap_no).toMatch(/^BAP\/URD\//);
      expect(record.lhpp_no).toMatch(/^\d{4}\/INSP-PAA\/PJK3-URD\//);
      expect(record.findings_count).toBeGreaterThanOrEqual(1);
      expect(record.deliveries_count).toBe(1);

      const globalHist = await request(app)
        .get('/api/v1/objects/history/all?poNumber=PO-URD-2026-001')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(globalHist.status).toBe(200);
      expect(globalHist.body.items.length).toBeGreaterThanOrEqual(1);
      expect(globalHist.body.items[0].po_number).toBe('PO-URD-2026-001');
    });

    it('Langkah 8: Pengingat perpanjangan menampilkan masa berlaku Unit 1, memisahkan unit tanpa tanggal masa berlaku, dan menolak penutupan PO sebelum seluruh unit selesai', async () => {
      const remRes = await request(app)
        .get('/api/v1/reminders')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(remRes.status).toBe(200);

      // Unit 1 punya tanggal masa berlaku dari recommendedValidUntil
      const unit1Rem = remRes.body.unitReminders.find((u) => u.object_id === poUnitIds[0]);
      expect(unit1Rem).toBeTruthy();
      expect(unit1Rem.effective_valid_until).toBeTruthy();

      // Unit 2 & 3 belum punya tanggal masa berlaku -> harus masuk daftar missingValidityItems
      const unit2Missing = remRes.body.missingValidityItems.find((u) => u.object_id === poUnitIds[1]);
      const unit3Missing = remRes.body.missingValidityItems.find((u) => u.object_id === poUnitIds[2]);
      expect(unit2Missing).toBeTruthy();
      expect(unit2Missing.urgency).toBe('DATA_MASA_BERLAKU_BELUM_LENGKAP');
      expect(unit3Missing).toBeTruthy();

      // Cek progres PO saat baru 1 dari 3 unit selesai
      const poCheck = await request(app)
        .get(`/api/v1/orders/${poOrderId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(poCheck.body.unitProgress.totalUnits).toBe(3);
      expect(poCheck.body.unitProgress.completed).toBe(1);
      expect(poCheck.body.unitProgress.canCompletePo).toBe(false);
      expect(poCheck.body.order.status).not.toBe('SELESAI');

      // Upaya memaksa PO menjadi SELESAI saat Unit 2 & 3 belum selesai harus ditolak 400
      const forceClose = await request(app)
        .patch(`/api/v1/orders/${poOrderId}/status`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({ status: 'SELESAI' });
      expect(forceClose.status).toBe(400);
      expect(forceClose.body.error.code).toBe('PO_UNITS_INCOMPLETE');
    });

    it('Langkah 9: Menyelesaikan Unit 2 (Forklift PTP) dan Unit 3 (Bejana Tekan PUBT) membuat seluruh unit selesai dan status PO otomatis menjadi SELESAI', async () => {
      const futureValid = new Date(Date.now() + 365 * 86400 * 1000).toISOString().slice(0, 10);

      for (const unitId of [poUnitIds[1], poUnitIds[2]]) {
        const stRes = await request(app)
          .post('/api/v1/inspections/start')
          .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
          .send({ orderId: poOrderId, objectId: unitId });
        expect(stRes.status).toBe(201);
        const inspId = stRes.body.inspection.id;

        if (unitId === poUnitIds[1]) {
          const unrelatedFindingPhoto = await request(app)
            .post(`/api/v1/inspections/${inspId}/findings/${unit1FindingId}/photos`)
            .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
            .attach('photo', Buffer.from('sample image'), {
              filename: 'wrong-inspection-photo.png',
              contentType: 'image/png'
            });
          expect(unrelatedFindingPhoto.status).toBe(404);
          expect(unrelatedFindingPhoto.body.error.code).toBe('FINDING_NOT_FOUND');
        }

        const detRes = await request(app)
          .get(`/api/v1/inspections/${inspId}`)
          .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
        const items = detRes.body.items;

        await request(app)
          .put(`/api/v1/inspections/${inspId}/draft`)
          .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
          .send({
            conclusion: 'MEMENUHI_SYARAT',
            conclusionNotes: 'Unit layak operasi dan memenuhi persyaratan K3.',
            results: items.map((it) => ({
              itemId: it.id,
              choiceValue: it.input_type === 'CHOICE' ? 'SESUAI' : null,
              textValue: it.input_type === 'TEXT' ? 'Baik' : null,
              numberValue: it.input_type === 'NUMBER' ? 10 : null,
              note: 'Sesuai'
            }))
          });

        const subRes = await request(app)
          .post(`/api/v1/inspections/${inspId}/submit`)
          .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
        expect(subRes.status).toBe(200);
        const bId = subRes.body.bap.id;
        const lId = subRes.body.lhpp.id;

        // Tanda tangani & finalisasi BAP
        await request(app)
          .post(`/api/v1/bap/${bId}/signatures`)
          .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
          .send({
            signerRole: 'AHLI_K3',
            signerName: 'Hendra Wijaya, S.T.',
            signerTitle: 'Ahli K3',
            dataUrl: onePxPng
          });
        await request(app)
          .post(`/api/v1/bap/${bId}/signatures`)
          .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
          .send({
            signerRole: 'PERWAKILAN_KLIEN',
            signerName: 'Irwan Setiawan',
            signerTitle: 'HSE Supervisor',
            dataUrl: onePxPng
          });
        await request(app)
          .post(`/api/v1/bap/${bId}/finalize`)
          .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);

        // Isi masa berlaku LHPP, ajukan review, dan terbitkan
        await request(app)
          .put(`/api/v1/lhpp/${lId}/draft`)
          .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`)
          .send({
            methodSummary: 'Pemeriksaan visual dan pengujian fungsi keselamatan.',
            technicalNotes: 'Memenuhi syarat keselamatan kerja.',
            recommendations: 'Pertahankan perawatan berkala.',
            recommendedValidUntil: futureValid,
            technicalData: { regulationRef: 'Standar K3 Nasional' }
          });

        await request(app)
          .post(`/api/v1/lhpp/${lId}/submit-review`)
          .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);

        const pubRes = await request(app)
          .post(`/api/v1/lhpp/${lId}/review`)
          .set('Authorization', `Bearer ${tokens.PIMPINAN}`)
          .send({ decision: 'APPROVE_FINAL', note: 'Disetujui terbit.' });
        expect(pubRes.status).toBe(200);
      }

      // Periksa kembali status PO -> seluruh 3 unit selesai dan PO berstatus SELESAI
      const finalPo = await request(app)
        .get(`/api/v1/orders/${poOrderId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(finalPo.status).toBe(200);
      expect(finalPo.body.unitProgress.totalUnits).toBe(3);
      expect(finalPo.body.unitProgress.completed).toBe(3);
      expect(finalPo.body.unitProgress.canCompletePo).toBe(true);
      expect(finalPo.body.order.status).toBe('SELESAI');
    });

    it('Langkah 10: pengingat otomatis ke klien tercatat per kanal, bersifat simulasi tanpa kredensial, dan tidak menggandakan baris log', async () => {
      const channels = await request(app)
        .get('/api/v1/reminders/client-channels')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(channels.status).toBe(200);
      expect(channels.body.email).toBe('SIMULASI');
      expect(channels.body.whatsapp).toBe('SIMULASI');

      const run1 = await request(app)
        .post('/api/v1/reminders/run-dispatch')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(run1.status).toBe(200);
      expect(run1.body.clientReminders).toBeTruthy();
      expect(run1.body.clientReminders.sent).toBe(0);

      const log1 = await request(app)
        .get('/api/v1/reminders/client-log')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(log1.status).toBe(200);
      const unit1Rows = log1.body.items.filter((r) => r.serial_number && r.stage === 'H30');
      expect(unit1Rows.length).toBeGreaterThanOrEqual(1);
      for (const row of unit1Rows) {
        expect(['SIMULASI', 'DILEWATI']).toContain(row.status);
      }

      await request(app)
        .post('/api/v1/reminders/run-dispatch')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      const log2 = await request(app)
        .get('/api/v1/reminders/client-log')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(log2.body.items.length).toBe(log1.body.items.length);

      const forbidden = await request(app)
        .get('/api/v1/reminders/client-log')
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      expect(forbidden.status).toBe(403);
    });

    it('Langkah 11: Dokumen resmi memiliki hash SHA-256 dan kode verifikasi publik yang dapat divalidasi tanpa login', async () => {
      // 1. Dapatkan data BAP Unit 1 yang sudah final
      const bapRes = await request(app)
        .get(`/api/v1/bap/${unit1BapId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(bapRes.status).toBe(200);
      const bapCode = bapRes.body.bap.verification_code;
      expect(bapCode).toBeTruthy();
      expect(bapRes.body.bap.document_hash).toBeTruthy();

      // 2. Akses endpoint publik verifikasi BAP tanpa bearer token
      const verifyBap = await request(app).get(`/api/v1/verify/${bapCode}`);
      expect(verifyBap.status).toBe(200);
      expect(verifyBap.body.verified).toBe(true);
      expect(verifyBap.body.documentType).toBe('BAP');
      expect(verifyBap.body.documentHash).toBe(bapRes.body.bap.document_hash);

      // 3. Dapatkan data LHPP Unit 1 yang sudah terbit
      const lhppRes = await request(app)
        .get(`/api/v1/lhpp/${unit1LhppId}`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(lhppRes.status).toBe(200);
      const lhppCode = lhppRes.body.lhpp.verification_code;
      expect(lhppCode).toBeTruthy();
      expect(lhppRes.body.lhpp.document_hash).toBeTruthy();

      // 4. Akses endpoint publik verifikasi LHPP tanpa bearer token
      const verifyLhpp = await request(app).get(`/api/v1/verify/${lhppCode}`);
      expect(verifyLhpp.status).toBe(200);
      expect(verifyLhpp.body.verified).toBe(true);
      expect(verifyLhpp.body.documentType).toBe('LHPP');
      expect(verifyLhpp.body.documentHash).toBe(lhppRes.body.lhpp.document_hash);

      // 5. Cek kode tidak dikenal
      const fakeVerify = await request(app).get('/api/v1/verify/URD-NONEXISTENT');
      expect(fakeVerify.status).toBe(404);
      expect(fakeVerify.body.verified).toBe(false);
    });

    it('Langkah 12: Impor massal unit CSV ke PO, Deteksi konflik jadwal & Portal Klien Terproteksi Token', async () => {
      // Buat 1 PO draf baru untuk pengujian impor CSV
      const draftPoRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          clientId,
          locationId,
          contactId,
          poNumber: 'PO-URD-2026-BULK-002',
          poDate: '2026-11-05',
          serviceType: 'PEMERIKSAAN_PERTAMA',
          source: 'DOKUMEN_PO',
          requestedDate: '2026-11-20',
          notes: 'PO untuk pengujian impor CSV unit',
          units: [
            {
              categoryId: 1, // PAA
              name: 'Gantry Crane 5 Ton',
              brand: 'Konecranes',
              model: 'C-500',
              serialNumber: 'KC-GC-2026-INIT',
              manufactureYear: 2021,
              capacity: '5 Ton',
              installLocation: 'Workshop Bay A',
              quantity: 1,
              scopeItems: ['HOIST_CRANE']
            }
          ]
        });
      expect(draftPoRes.status).toBe(201);
      const testOrderId = draftPoRes.body.order.id;

      // 1. Impor massal unit via CSV ke testOrderId
      const csvData = [
        'KODE_KATEGORI,NAMA_UNIT,MEREK,MODEL,NOMOR_SERI,TAHUN,KAPASITAS,LOKASI_PASANG,CATATAN',
        'PUBT,Ketel Uap Boiler 5T,Miura,EX-500,BOILER-CSV-01,2022,5 Ton,Gedung Utilitas,Pemeriksaan Rutin',
        'PAA,Gantry Crane 10T,Demag,GC-10,CRANE-CSV-02,2021,10 Ton,Workshop Luar,Pemeriksaan Tahunan'
      ].join('\n');

      const importRes = await request(app)
        .post(`/api/v1/orders/${testOrderId}/import-units-csv`)
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({ csvText: csvData });
      expect(importRes.status).toBe(201);
      expect(importRes.body.count).toBe(2);

      // 2. Deteksi potensi konflik jadwal Ahli K3
      const conflictCheck = await request(app)
        .get('/api/v1/schedules/conflicts')
        .query({
          inspectorId: userIds.AHLI_K3_PAA,
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 86400000 + 4 * 3600000).toISOString()
        })
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(conflictCheck.status).toBe(200);
      expect(typeof conflictCheck.body.hasConflict).toBe('boolean');

      // 3. Portal Klien Terproteksi Token
      // Admin membuat token portal untuk klien
      const portalTokRes = await request(app)
        .post('/api/v1/portal/tokens')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`)
        .send({
          clientId,
          label: 'Akses Portal Tahunan Klien',
          expiresInDays: 30
        });
      expect(portalTokRes.status).toBe(201);
      const portalToken = portalTokRes.body.portalToken.token;
      expect(portalToken).toBeTruthy();

      // Klien membuka portal publik tanpa login
      const clientPortalRes = await request(app).get(`/api/v1/portal/access/${portalToken}`);
      expect(clientPortalRes.status).toBe(200);
      expect(clientPortalRes.body.client.name).toBe('PT Baja Konstruksi Nusantara');
      expect(Array.isArray(clientPortalRes.body.orders)).toBe(true);

      // Cek token portal tidak valid
      const fakePortal = await request(app).get('/api/v1/portal/access/tok-invalid-xyz');
      expect(fakePortal.status).toBe(404);
    });

    it('Langkah 13: Pencarian Global terpadu & Antrean Pekerjaan Terpadu (Work Queue)', async () => {
      // 1. Pencarian Global (/api/v1/search)
      const searchRes = await request(app)
        .get('/api/v1/search')
        .query({ q: 'Baja' })
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.total).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(searchRes.body.results)).toBe(true);

      // Pencarian dengan keyword pendek (< 2 karakter) mengembalikan kosong
      const shortSearch = await request(app)
        .get('/api/v1/search')
        .query({ q: 'a' })
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(shortSearch.status).toBe(200);
      expect(shortSearch.body.total).toBe(0);

      // 2. Antrean Pekerjaan Terpadu (/api/v1/dashboard/work-queue)
      const workQueueAdmin = await request(app)
        .get('/api/v1/dashboard/work-queue')
        .set('Authorization', `Bearer ${tokens.ADMIN_KANTOR}`);
      expect(workQueueAdmin.status).toBe(200);
      expect(typeof workQueueAdmin.body.total).toBe('number');
      expect(Array.isArray(workQueueAdmin.body.items)).toBe(true);

      const workQueueInspector = await request(app)
        .get('/api/v1/dashboard/work-queue')
        .set('Authorization', `Bearer ${tokens.AHLI_K3_PAA}`);
      expect(workQueueInspector.status).toBe(200);
      expect(typeof workQueueInspector.body.total).toBe('number');
      expect(Array.isArray(workQueueInspector.body.items)).toBe(true);
    });
  });
});
