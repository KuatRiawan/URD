import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { query } from '../database/pool.js';
import { seedDatabase } from '../../seeds/seed.js';

describe('PAPA Equipment Taxonomy & Dynamic Equipment Groups', () => {
  const TEST_PW = 'TestPassURD2026!';
  let adminToken;
  let marketingToken;
  let inspectorToken;

  const EXPECTED_GROUPS = [
    {
      name: 'Forklift',
      code: 'GRP_PAPA_FORKLIFT',
      types: [
        'CONTAINER HANDLER',
        'FORKLIFT',
        'LIFTTRUCK',
        'PALLET MOVER /HAND PALLET',
        'REACH STACKER',
        'REACH/RACK STACKER',
        'TELEHANDLER'
      ]
    },
    {
      name: 'Mobile Crane',
      code: 'GRP_PAPA_MOBILE_CRANE',
      types: [
        'BARGE CRANE',
        'BORE PILE',
        'CARGO CRANE',
        'CRAWLER CRANE',
        'DERRICK CRANE',
        'DERRICK SHIP CRANE',
        'DREDGING CRANE',
        'FLOATING CRANE',
        'FLOATING DERRICK CRANE',
        'FLOATING SHIP CRANE',
        'HYDRAULIC DRILLING RIG',
        'HYDRAULIC STATIC PILE DRIVER',
        'KANGGURU CRANE',
        'LOCOMOTIVE CRANE',
        'LUFFING CRANE',
        'MOBILE CRANE',
        'PEDESTAL CRANE',
        'PILE DRIVER',
        'PONTON CRANE',
        'PORTAL CRANE',
        'RAILWAY CRANE',
        'SHIP CRANE',
        'SIDE BOOM CRANE/CRAB CRANE',
        'SPIDER CRANE',
        'STACKER CRANE',
        'TRACTOR CRANE',
        'TRUCK CRANE'
      ]
    },
    {
      name: 'Dongkrak',
      code: 'GRP_PAPA_DONGKRAK',
      types: [
        'DONGKRAK HIDROLIK',
        'DONGKRAK PNEUMATIK',
        'DONGKRAK POST LIFT',
        'DONGKRAK TRUCK/CAR LIFT',
        'LIER'
      ]
    },
    {
      name: 'Alat Angkat Pengatur Posisi Benda Kerja',
      code: 'GRP_PAPA_POSISI_BENDA',
      types: [
        'ROTATOR/ROBOTIK',
        'TAKEL'
      ]
    },
    {
      name: 'Personal Platform',
      code: 'GRP_PAPA_PERSONAL_PLATFORM',
      types: [
        'GONDOLA',
        'PASSENGER HOIST'
      ]
    },
    {
      name: 'Alat Berat',
      code: 'GRP_PAPA_ALAT_BERAT',
      types: [
        'ASPHALT FINISHER',
        'ASPHALT PAVER',
        'ASPHALT SPRAYER',
        'BACKHOE',
        'BULLDOZER',
        'Cold Milling Machine',
        'COMPACTOR ROROLLER'.replace('ROROLLER', 'ROLLER'),
        'CONCRETE PAVER',
        'Crank Logger',
        'EXCAVATOR',
        'EXCAVATOR GRAPPLE',
        'GRADER',
        'HORIZONTAL DIRECTIONAL DRILLING',
        'LOADER',
        'MACHINERY CAR',
        'PAVER',
        'Pneumatic Tire Roller',
        'RECYCLER',
        'Screeder',
        'SOIL STABILIZER',
        'STACKER RECLAIMER',
        'SURFACE MINER',
        'TRACTOR',
        'VACUUM SWEEPERS',
        'VIBRATOR ROLLER'
      ]
    },
    {
      name: 'Kereta',
      code: 'GRP_PAPA_KERETA',
      types: [
        'KERETA AYUN',
        'KERETA GANTUNG',
        'KERETA LADEL',
        'KERETA LONTAR',
        'KERETA LUNCUR',
        'KERETA PRODUKSI',
        'KERETA PUTAR VERTICAL/HORIZONTAL',
        'KERETA TROLI',
        'LOKOMOTIF'
      ]
    },
    {
      name: 'Personal Basket',
      code: 'GRP_PAPA_PERSONAL_BASKET',
      types: [
        'BOOM LIFT',
        'HYDRAULIC STAIRS',
        'MANLIFT',
        'SCISSOR LIFT'
      ]
    },
    {
      name: 'Robotik',
      code: 'GRP_PAPA_ROBOTIK',
      types: [
        'AUTOMATED GUIDED VEHICLE'
      ]
    },
    {
      name: 'TOWER CRANE',
      code: 'GRP_PAPA_TOWER_CRANE',
      types: [
        'TOWER CRANE'
      ]
    },
    {
      name: 'Overhead Crane',
      code: 'GRP_PAPA_OVERHEAD_CRANE',
      types: [
        'CARGO HOIST CRANE',
        'CHAIN BLOCK',
        'CONTAINER CRANE',
        'GANTRY CRANE',
        'GANTRY LUFFING CRANE',
        'HOIST CRANE',
        'JIB CRANE',
        'LAUNCHER GANTRY CRANE',
        'MONORAIL CRANE',
        'OVERHEAD CRANE',
        'OVERHEAD TRAVELLING CRANE',
        'RAIL MOUNTED GANTRY CRANE',
        'ROLLER GANTRY CRANE',
        'RUBBER TIRE GANTRY CRANE',
        'SEMI GANTRY CRANE',
        'SHIP UNLOADER CRANE',
        'WALL CRANE'
      ]
    }
  ];

  beforeAll(async () => {
    await seedDatabase({ password: TEST_PW });

    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.sistem@upayariksadaya.com', password: TEST_PW });
    adminToken = adminRes.body.accessToken;

    const mktRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'marketing@upayariksadaya.com', password: TEST_PW });
    marketingToken = mktRes.body.accessToken;

    const inspRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ahlik3.paa@upayariksadaya.com', password: TEST_PW });
    inspectorToken = inspRes.body.accessToken;
  });

  it('1. Memverifikasi tepat 11 Kelompok Alat Bidang PAPA terdaftar di database', async () => {
    const res = await request(app)
      .get('/api/v1/equipment-types/groups?domainCode=PAPA')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(res.body.items.length).toBe(11);

    const groupNames = res.body.items.map((g) => g.name);
    for (const exp of EXPECTED_GROUPS) {
      expect(groupNames).toContain(exp.name);
    }
  });

  it('2. Memverifikasi tepat 100 Jenis Unit Anak PAPA terdaftar dengan ejaan dan nama persis', async () => {
    const res = await request(app)
      .get('/api/v1/equipment-types?domainCode=PAPA&parentId=null')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const types = res.body.items;

    // Filter yang berasal dari kelompok resmi PAPA
    const papaOfficialTypes = types.filter((t) => t.code.startsWith('ET_PAPA_'));
    expect(papaOfficialTypes.length).toBe(100);

    // Verifikasi setiap kelompok menaungi jenis unit yang tepat
    for (const expectedGroup of EXPECTED_GROUPS) {
      const groupTypes = papaOfficialTypes
        .filter((t) => t.group_name === expectedGroup.name)
        .map((t) => t.name);

      expect(groupTypes.length).toBe(expectedGroup.types.length);
      for (const expectedTypeName of expectedGroup.types) {
        expect(groupTypes).toContain(expectedTypeName);
      }
    }
  });

  it('3. Memverifikasi perbedaan entitas antara Kelompok dan Jenis Unit yang memiliki nama sama', async () => {
    // Contoh: Kelompok Forklift vs Jenis Unit FORKLIFT
    const groupRes = await request(app)
      .get('/api/v1/equipment-types/groups?domainCode=PAPA&q=Forklift')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(groupRes.body.items.length).toBe(1);
    const forkliftGroup = groupRes.body.items[0];

    const typeRes = await request(app)
      .get(`/api/v1/equipment-types?groupId=${forkliftGroup.id}&q=FORKLIFT`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(typeRes.body.items.length).toBeGreaterThanOrEqual(1);

    const forkliftType = typeRes.body.items.find((t) => t.name === 'FORKLIFT');
    expect(forkliftType).toBeDefined();
    expect(forkliftType.id).not.toBe(forkliftGroup.id);
    expect(forkliftType.group_id).toBe(forkliftGroup.id);
  });

  let testGroupId;
  it('4. POST /groups: Super Admin dapat menambah kelompok alat baru secara dinamis', async () => {
    const code = `GRP_TEST_${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/equipment-types/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        domainCode: 'PAPA',
        code,
        name: 'Kelompok Uji Coba Dinamis',
        description: 'Kelompok alat baru tanpa ubah kode',
        isActive: true,
        displayOrder: 99
      });

    expect(res.status).toBe(201);
    expect(res.body.item.id).toBeDefined();
    expect(res.body.item.name).toBe('Kelompok Uji Coba Dinamis');
    testGroupId = res.body.item.id;
  });

  it('5. PUT & PATCH /groups: Super Admin dapat memperbarui nama dan status aktif kelompok alat', async () => {
    const updateRes = await request(app)
      .put(`/api/v1/equipment-types/groups/${testGroupId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Kelompok Uji Coba Dinamis (Revisi)',
        description: 'Deskripsi kelompok diperbarui'
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.item.name).toBe('Kelompok Uji Coba Dinamis (Revisi)');

    const toggleRes = await request(app)
      .patch(`/api/v1/equipment-types/groups/${testGroupId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.item.is_active).toBe(false);
  });

  let testChildTypeId;
  it('6. POST /api/v1/equipment-types: Super Admin dapat menambah jenis unit ke dalam kelompok', async () => {
    const code = `ET_TEST_${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/equipment-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        domainCode: 'PAPA',
        groupId: testGroupId,
        code,
        name: 'Jenis Unit Uji Coba',
        description: 'Jenis unit anak baru',
        isActive: true,
        displayOrder: 1
      });

    expect(res.status).toBe(201);
    expect(res.body.item.group_id).toBe(testGroupId);
    testChildTypeId = res.body.item.id;
  });

  it('7. DELETE /groups: Kelompok yang masih menaungi jenis unit dilindungi dari penghapusan (409 Conflict)', async () => {
    const delRes = await request(app)
      .delete(`/api/v1/equipment-types/groups/${testGroupId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.status).toBe(409);
    expect(delRes.body.error.code).toBe('CANNOT_DELETE_REFERENCED');
    expect(delRes.body.error.details.typesCount).toBeGreaterThan(0);
  });

  it('8. DELETE: Hapus jenis unit uji coba kemudian hapus kelompok alat uji coba dengan sukses', async () => {
    const delTypeRes = await request(app)
      .delete(`/api/v1/equipment-types/${testChildTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delTypeRes.status).toBe(200);

    const delGroupRes = await request(app)
      .delete(`/api/v1/equipment-types/groups/${testGroupId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delGroupRes.status).toBe(200);
  });

  it('9. POST /api/v1/objects: Marketing dapat membuat objek uji dengan hierarki Domain -> Kelompok -> Jenis Unit', async () => {
    // Ambil client id
    const { rows: clientRows } = await query('SELECT id FROM clients LIMIT 1');
    const clientId = clientRows[0].id;

    // Ambil salah satu unit PAPA (misal REACH STACKER dari kelompok Forklift)
    const { rows: typeRows } = await query(
      "SELECT id, group_id FROM equipment_types WHERE name = 'REACH STACKER' AND domain_code = 'PAPA' LIMIT 1"
    );
    const reachStacker = typeRows[0];
    expect(reachStacker).toBeDefined();

    const serialNumber = `SN-TEST-PAPA-${Date.now()}`;
    const createObjRes = await request(app)
      .post('/api/v1/objects')
      .set('Authorization', `Bearer ${marketingToken}`)
      .send({
        clientId,
        equipmentGroupId: reachStacker.group_id,
        equipmentTypeId: reachStacker.id,
        inspectionTypeCode: 'BERKALA',
        name: 'Unit Reach Stacker Baru Test',
        serialNumber,
        brand: 'Kalmar',
        model: 'DRG450',
        manufactureYear: 2024,
        capacity: '45',
        capacityUnit: 'ton'
      });

    expect(createObjRes.status).toBe(201);
    expect(createObjRes.body.object.equipment_type_id).toBe(reachStacker.id);
    expect(createObjRes.body.object.equipment_group_id).toBe(reachStacker.group_id);

    // Verifikasi pada query detail objek
    const detailRes = await request(app)
      .get(`/api/v1/objects/${createObjRes.body.object.id}`)
      .set('Authorization', `Bearer ${marketingToken}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.object.equipment_name || detailRes.body.object.equipment_type_name).toBe('REACH STACKER');
    expect(detailRes.body.object.equipment_group_name).toBe('Forklift');
  });

  it('10. GET /api/v1/inspections/templates/resolve: Dynamic Checklist Engine menyelesaikan checklist unit dengan aman', async () => {
    const { rows: typeRows } = await query(
      "SELECT id, group_id FROM equipment_types WHERE name = 'FORKLIFT' AND domain_code = 'PAPA' LIMIT 1"
    );
    const forkliftType = typeRows[0];

    const resolveRes = await request(app)
      .get(`/api/v1/inspections/templates/resolve?domainCode=PAPA&equipmentTypeId=${forkliftType.id}&inspectionTypeCode=BERKALA`)
      .set('Authorization', `Bearer ${inspectorToken}`);

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.template).toBeDefined();
    expect(resolveRes.body.versionId).toBeDefined();
  });
});

