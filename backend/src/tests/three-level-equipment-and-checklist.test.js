import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { query } from '../database/pool.js';
import { seedDatabase } from '../../seeds/seed.js';

describe('Three-Level Equipment Classification & Independent Dynamic Checklists', () => {
  const TEST_PW = 'TestPassURD2026!';
  let adminToken;
  let marketingToken;
  let inspectorToken;

  let papaDomain;
  let forkliftGroup; // Jenis Alat
  let forkliftName;  // Nama Alat FORKLIFT
  let reachStackerName; // Nama Alat REACH STACKER

  let forkliftTemplateId;
  let reachStackerTemplateId;
  let forkliftInitialVer;
  let reachStackerInitialVer;
  let forkliftNewVer;

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

  describe('1. Three-Level Equipment Catalog Retrieval', () => {
    it('Level 1: returns all official inspection domains', async () => {
      const res = await request(app)
        .get('/api/v1/equipment-types/domains')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      const codes = res.body.items.map((d) => d.code);
      expect(codes).toContain('PAPA');
      expect(codes).toContain('PUBT');
      expect(codes).toContain('PTP');
      expect(codes).toContain('ILPP');
      expect(codes).toContain('IPK');

      papaDomain = res.body.items.find((d) => d.code === 'PAPA');
      expect(papaDomain).toBeDefined();
    });

    it('Level 2: returns Jenis Alat (Equipment Types) filtered by domain', async () => {
      const res = await request(app)
        .get('/api/v1/equipment-types/types?domainCode=PAPA')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBeGreaterThanOrEqual(11);

      const typeNames = res.body.items.map((t) => t.name);
      expect(typeNames).toContain('Forklift');
      expect(typeNames).toContain('Mobile Crane');
      expect(typeNames).toContain('Overhead Crane');

      forkliftGroup = res.body.items.find((t) => t.name === 'Forklift');
      expect(forkliftGroup).toBeDefined();
    });

    it('Level 3: returns Nama Alat (Equipment Names) belonging to Jenis Alat', async () => {
      const res = await request(app)
        .get(`/api/v1/equipment-types/names?groupId=${forkliftGroup.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      const names = res.body.items.map((n) => n.name);
      expect(names).toContain('FORKLIFT');
      expect(names).toContain('REACH STACKER');
      expect(names).toContain('LIFTTRUCK');
      expect(names).toContain('CONTAINER HANDLER');

      forkliftName = res.body.items.find((n) => n.name === 'FORKLIFT');
      reachStackerName = res.body.items.find((n) => n.name === 'REACH STACKER');

      expect(forkliftName).toBeDefined();
      expect(reachStackerName).toBeDefined();
    });
  });

  describe('2. Separation of Jenis Alat and Nama Alat Records', () => {
    it('maintains distinct records for same name (Jenis: Forklift vs Nama: FORKLIFT)', async () => {
      expect(forkliftGroup.id).not.toBe(forkliftName.id);
      expect(forkliftName.group_id).toBe(forkliftGroup.id);

      // Verify directly in database tables
      const { rows: grpRows } = await query('SELECT * FROM equipment_groups WHERE id = $1', [forkliftGroup.id]);
      const { rows: nameRows } = await query('SELECT * FROM equipment_types WHERE id = $1', [forkliftName.id]);

      expect(grpRows.length).toBe(1);
      expect(nameRows.length).toBe(1);
      expect(grpRows[0].name).toBe('Forklift');
      expect(nameRows[0].name).toBe('FORKLIFT');
      expect(nameRows[0].group_id).toBe(grpRows[0].id);
    });
  });

  describe('3. Independent Checklist Configuration per Nama Alat', () => {
    it('creates independent checklist template for FORKLIFT', async () => {
      const payload = {
        name: 'Checklist Riksa Uji FORKLIFT Lapangan',
        domainCode: 'PAPA',
        equipmentGroupId: forkliftGroup.id,
        equipmentTypeId: forkliftName.id,
        equipmentNameId: forkliftName.id,
        isValidated: true,
        items: [
          {
            seq: 1,
            section: 'Pemeriksaan Visual & Fisik',
            label: 'Kondisi fisik garpu (fork) dan backrest pengaman',
            inputType: 'CHOICE',
            isRequired: true,
            requiresPhoto: true,
            requiresNote: true
          },
          {
            seq: 2,
            section: 'Pemeriksaan Rantai & Mast',
            label: 'Keregangan dan keausan rantai pengangkat mast',
            inputType: 'NUMBER',
            unit: 'mm',
            minValue: 10,
            maxValue: 30,
            isRequired: true
          },
          {
            seq: 3,
            section: 'Uji Fungsi',
            label: 'Sistem rem kaki dan rem parkir',
            inputType: 'CHOICE',
            isRequired: true
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/inspections/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.template).toBeDefined();
      expect(res.body.template.equipment_name_id).toBe(forkliftName.id);
      expect(res.body.version.version).toBeGreaterThanOrEqual(1);
      expect(res.body.items.length).toBe(3);

      forkliftTemplateId = res.body.template.id;
      forkliftInitialVer = res.body.version.version;
    });

    it('creates independent checklist template for REACH STACKER with different items', async () => {
      const payload = {
        name: 'Checklist Riksa Uji REACH STACKER Kontainer',
        domainCode: 'PAPA',
        equipmentGroupId: forkliftGroup.id,
        equipmentTypeId: reachStackerName.id,
        equipmentNameId: reachStackerName.id,
        isValidated: true,
        items: [
          {
            seq: 1,
            section: 'Pemeriksaan Spreader Kontainer',
            label: 'Kondisi mekanisme twist-lock spreader kontainer 20/40 feet',
            inputType: 'CHOICE',
            isRequired: true,
            requiresPhoto: true
          },
          {
            seq: 2,
            section: 'Boom Telescoping',
            label: 'Panjang ekstensi teleskopik boom',
            inputType: 'NUMBER',
            unit: 'meter',
            minValue: 5,
            maxValue: 25,
            isRequired: true
          },
          {
            seq: 3,
            section: 'Sistem Indikator Beban (LMI)',
            label: 'Akurasi Load Moment Indicator kabin',
            inputType: 'CHOICE',
            isRequired: true,
            requiresNote: true
          },
          {
            seq: 4,
            section: 'Uji Fungsi Beban',
            label: 'Pengujian angkat kontainer berbeban penuh',
            inputType: 'CHOICE',
            isRequired: true
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/inspections/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.template).toBeDefined();
      expect(res.body.template.equipment_name_id).toBe(reachStackerName.id);
      expect(res.body.version.version).toBeGreaterThanOrEqual(1);
      expect(res.body.items.length).toBe(4);

      reachStackerTemplateId = res.body.template.id;
      reachStackerInitialVer = res.body.version.version;
    });
  });

  describe('4. Isolated Copy-on-Write Versioning per Nama Alat', () => {
    it('publishes a new version for FORKLIFT without affecting REACH STACKER', async () => {
      const pubRes = await request(app)
        .post(`/api/v1/inspections/templates/${forkliftTemplateId}/versions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(pubRes.status).toBe(201);
      forkliftNewVer = pubRes.body.newVersion || pubRes.body.version.version;
      expect(forkliftNewVer).toBe(forkliftInitialVer + 1);

      // Verify FORKLIFT version history shows new version as AKTIF and previous as ARSIP
      const forkHistRes = await request(app)
        .get(`/api/v1/inspections/templates/${forkliftTemplateId}/versions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(forkHistRes.status).toBe(200);
      expect(forkHistRes.body.versions.length).toBeGreaterThanOrEqual(2);
      expect(forkHistRes.body.versions[0].version).toBe(forkliftNewVer);
      expect(forkHistRes.body.versions[0].status).toBe('AKTIF');

      // Verify REACH STACKER version is completely unchanged
      const reachHistRes = await request(app)
        .get(`/api/v1/inspections/templates/${reachStackerTemplateId}/versions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(reachHistRes.status).toBe(200);
      expect(reachHistRes.body.versions[0].version).toBe(reachStackerInitialVer);
      expect(reachHistRes.body.versions[0].status).toBe('AKTIF');
    });
  });

  describe('5. Inspector Automatic Checklist Resolution', () => {
    it('resolves the FORKLIFT checklist for a FORKLIFT unit', async () => {
      const res = await request(app)
        .get('/api/v1/inspections/templates/resolve')
        .query({
          equipmentNameId: forkliftName.id,
          equipmentGroupId: forkliftGroup.id,
          domainCode: 'PAPA'
        })
        .set('Authorization', `Bearer ${inspectorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.template.equipment_name_id).toBe(forkliftName.id);
      expect(res.body.version).toBe(forkliftNewVer);
      expect(res.body.items.some((i) => i.label.includes('garpu'))).toBe(true);
      expect(res.body.items.some((i) => i.label.includes('twist-lock'))).toBe(false);
    });

    it('resolves the REACH STACKER checklist for a REACH STACKER unit', async () => {
      const res = await request(app)
        .get('/api/v1/inspections/templates/resolve')
        .query({
          equipmentNameId: reachStackerName.id,
          equipmentGroupId: forkliftGroup.id,
          domainCode: 'PAPA'
        })
        .set('Authorization', `Bearer ${inspectorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.template.equipment_name_id).toBe(reachStackerName.id);
      expect(res.body.version).toBe(reachStackerInitialVer);
      expect(res.body.items.some((i) => i.label.includes('twist-lock'))).toBe(true);
      expect(res.body.items.some((i) => i.label.includes('garpu'))).toBe(false);
    });
  });

  describe('6. Marketing Unit Creation with 3-Level Cascade', () => {
    it('creates test object with domain, equipment_group_id, and equipment_name_id', async () => {
      // Find a client
      const { rows: clientRows } = await query('SELECT id FROM clients LIMIT 1');
      const clientId = clientRows[0].id;

      const serialNo = `TYT-FL-${Date.now()}`;
      const payload = {
        clientId,
        domainCode: 'PAPA',
        equipmentGroupId: forkliftGroup.id,
        equipmentNameId: forkliftName.id,
        name: 'Forklift Toyota 3-Ton Unit 01',
        serialNumber: serialNo,
        capacity: 3000,
        capacityUnit: 'kg',
        manufacturer: 'Toyota Material Handling',
        model: '8FD30',
        yearOfManufacture: 2022
      };

      const res = await request(app)
        .post('/api/v1/objects')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      const createdObj = res.body.object || res.body;
      expect(createdObj.equipment_name_id).toBe(forkliftName.id);
      expect(createdObj.equipment_group_id).toBe(forkliftGroup.id);

      // Verify GET /objects/:id returns the joined equipment_name and equipment_type_name
      const getRes = await request(app)
        .get(`/api/v1/objects/${createdObj.id}`)
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(getRes.status).toBe(200);
      const fetchedObj = getRes.body.object || getRes.body;
      expect(fetchedObj.equipment_name_id).toBe(forkliftName.id);
      expect(fetchedObj.equipment_name).toBe('FORKLIFT');
      expect(fetchedObj.equipment_type_name).toBe('Forklift');
      expect(fetchedObj.domain_name).toBeDefined();
    });
  });

  describe('7. Safe Deletion & Reference Protection', () => {
    it('rejects deletion of domain if referenced by equipment groups', async () => {
      const res = await request(app)
        .delete('/api/v1/equipment-types/domains/PAPA')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DOMAIN_REFERENCED');
    });

    it('rejects deletion of equipment group if referenced by equipment names', async () => {
      const res = await request(app)
        .delete(`/api/v1/equipment-types/groups/${forkliftGroup.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CANNOT_DELETE_REFERENCED');
    });
  });
});
