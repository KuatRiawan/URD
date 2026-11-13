import { query } from '../database/pool.js';
import { AppError } from '../utils/http.js';

/**
 * Resolves the most specific active LHPP template and effective version
 * Hierarchy:
 * 1. equipment_subtype_id + inspection_type_code
 * 2. equipment_subtype_id (any inspection type)
 * 3. equipment_type_id + inspection_type_code
 * 4. equipment_type_id (any inspection type)
 * 5. domain_code + inspection_type_code
 * 6. domain_code (any inspection type)
 */
const DOMAIN_ALIAS_MAP = {
  PAA: 'PAPA',
  IPP: 'ILPP',
  LIS: 'ILPP',
  ELEVATOR: 'ELEVATOR_ESKALATOR',
  LIFT: 'ELEVATOR_ESKALATOR',
  ANCHOR: 'ANCHOR_LIFELINE'
};

export async function resolveLhppTemplate(dbOrQuery, {
  domainCode,
  equipmentGroupId: inputGroupId,
  equipmentTypeId: inputTypeId,
  equipmentNameId: inputNameId,
  equipmentSubtypeId,
  inspectionTypeCode
}) {
  const runner = typeof dbOrQuery === 'function' ? dbOrQuery : (dbOrQuery?.query ? dbOrQuery.query.bind(dbOrQuery) : query);
  const normalizedDomain = DOMAIN_ALIAS_MAP[domainCode] || domainCode || 'PAPA';

  const equipmentTypeId = inputNameId || inputTypeId || null;

  let equipmentGroupId = inputGroupId || null;
  if (!equipmentGroupId && equipmentTypeId) {
    const { rows: egRows } = await runner('SELECT group_id FROM equipment_types WHERE id = $1', [equipmentTypeId]);
    equipmentGroupId = egRows[0]?.group_id || null;
  }

  const { rows } = await runner(
    `SELECT t.id, t.code, t.name, t.description, t.domain_code,
            t.equipment_group_id, t.equipment_type_id, t.equipment_name_id, t.equipment_subtype_id, t.inspection_type_code,
            t.output_format, t.is_active, t.active_version_id,
            v.id AS version_id, v.version_number, v.version_code, v.title AS version_title,
            v.regulation_reference, v.layout_config, v.field_mappings, v.sections, v.effective_date,
            CASE
              WHEN t.equipment_subtype_id IS NOT NULL AND t.inspection_type_code IS NOT NULL THEN 1
              WHEN t.equipment_subtype_id IS NOT NULL THEN 2
              WHEN (t.equipment_name_id IS NOT NULL OR t.equipment_type_id IS NOT NULL) AND t.inspection_type_code IS NOT NULL THEN 3
              WHEN (t.equipment_name_id IS NOT NULL OR t.equipment_type_id IS NOT NULL) THEN 4
              WHEN t.equipment_group_id IS NOT NULL AND t.inspection_type_code IS NOT NULL THEN 5
              WHEN t.equipment_group_id IS NOT NULL THEN 6
              WHEN t.domain_code IS NOT NULL AND t.inspection_type_code IS NOT NULL THEN 7
              ELSE 8
            END AS specificity_rank
     FROM lhpp_templates t
     JOIN lhpp_template_versions v ON v.id = t.active_version_id
     WHERE t.is_active = true
       AND v.is_active = true
       AND v.effective_date <= CURRENT_DATE
       AND (
         (t.equipment_subtype_id IS NOT NULL AND t.equipment_subtype_id = $1)
         OR
         ((t.equipment_name_id = $2 OR t.equipment_type_id = $2) AND t.equipment_subtype_id IS NULL)
         OR
         (t.equipment_group_id IS NOT NULL AND t.equipment_group_id = $3 AND t.equipment_type_id IS NULL AND t.equipment_subtype_id IS NULL)
         OR
         (t.domain_code = $4 AND t.equipment_group_id IS NULL AND t.equipment_type_id IS NULL AND t.equipment_subtype_id IS NULL)
       )
       AND (
         t.inspection_type_code IS NULL
         OR t.inspection_type_code = $5
       )
     ORDER BY specificity_rank ASC, v.version_number DESC
     LIMIT 1`,
    [equipmentSubtypeId || null, equipmentTypeId || null, equipmentGroupId || null, normalizedDomain, inspectionTypeCode || null]
  );

  if (!rows[0]) {
    // Check if domain exists
    const domainCheck = await runner('SELECT name FROM inspection_domains WHERE code = $1', [normalizedDomain]);
    const domainName = domainCheck.rows[0]?.name || normalizedDomain;
    throw new AppError(
      404,
      'TEMPLATE_NOT_CONFIGURED',
      `Template LHPP belum dikonfigurasi atau belum aktif untuk bidang ${domainName} (${domainCode}). Silakan hubungi Super Admin untuk mengonfigurasi template dokumen.`
    );
  }

  return rows[0];
}

/**
 * Validates full LHPP context against the resolved template version
 * Distinguishes:
 * - missing: required data not provided (blocks finalization)
 * - not applicable / optional: empty is allowed
 */
export function validateLhppDocumentData(fullContext, templateVersion) {
  const missingFields = [];
  const warnings = [];

  const mappings = Array.isArray(templateVersion.field_mappings) ? templateVersion.field_mappings : [];
  const sections = Array.isArray(templateVersion.sections) ? templateVersion.sections : [];

  // 1. Validate Core Identity
  if (!fullContext.client_name) {
    missingFields.push({ section: 'I. Data Umum', field: 'client_name', label: 'Nama Perusahaan Pemilik' });
  }
  if (!fullContext.serial_number && !fullContext.object_name) {
    missingFields.push({ section: 'I. Data Umum', field: 'serial_number', label: 'Nomor Seri / Identitas Unit' });
  }

  // 2. Validate Field Mappings defined in Template
  const technical = fullContext.technical_data || {};
  for (const m of mappings) {
    if (m.required) {
      let val;
      if (m.source.startsWith('technical.')) {
        const key = m.source.replace('technical.', '');
        val = technical[key];
      } else if (m.source.startsWith('client.')) {
        const key = m.source.replace('client.', '');
        val = fullContext[key] || fullContext[`client_${key}`];
      } else if (m.source.startsWith('object.')) {
        const key = m.source.replace('object.', '');
        val = fullContext[key] || fullContext[`object_${key}`];
      } else {
        val = fullContext[m.target];
      }

      if (val === undefined || val === null || String(val).trim() === '') {
        missingFields.push({
          section: 'II. Data Teknis',
          field: m.target,
          label: m.label || m.target
        });
      }
    }
  }

  // 3. Validate Checklist Results if section is enabled
  const checklistSec = sections.find((s) => s.key === 'checklist' && s.enabled);
  if (checklistSec && (!Array.isArray(fullContext.results) || fullContext.results.length === 0)) {
    warnings.push({
      section: 'III. Pemeriksaan Visual',
      message: 'Hasil checklist pengujian belum terekam dari inspeksi lapangan.'
    });
  }

  // 4. Validate Conclusion
  if (!fullContext.conclusion) {
    missingFields.push({
      section: 'VI. Kesimpulan',
      field: 'conclusion',
      label: 'Kesimpulan Teknis Kelayakan K3'
    });
  }

  // 5. Validate Inspector Signature / Verification
  if (!fullContext.inspector_name) {
    missingFields.push({
      section: 'Pengesahan',
      field: 'inspector_name',
      label: 'Ahli K3 Spesialis Pemeriksa'
    });
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}

/**
 * Builds an immutable data snapshot for the finalized LHPP document
 */
export function buildLhppDataSnapshot(fullContext, templateVersion, companyProfile = null) {
  return {
    snapshot_at: new Date().toISOString(),
    template_version: {
      id: templateVersion.version_id || templateVersion.id,
      code: templateVersion.code,
      name: templateVersion.name,
      version_code: templateVersion.version_code,
      version_number: templateVersion.version_number,
      title: templateVersion.version_title || templateVersion.title,
      regulation_reference: templateVersion.regulation_reference
    },
    company_profile: {
      name: companyProfile?.company_name || 'PT. UPAYA RIKSA DAYA',
      tagline: companyProfile?.tagline || 'Perusahaan Jasa K3 (PJK3) Bidang Pemeriksaan dan Pengujian',
      address: companyProfile?.address || 'Jl. Pondasi No. 50B Kampung Ambon, Jakarta Timur 13210',
      email: companyProfile?.email || 'urd@upayariksadaya.com',
      phone: companyProfile?.phone || '(021) 489 1409',
      website: companyProfile?.website || 'https://upayariksadaya.com'
    },
    client: {
      id: fullContext.client_id,
      name: fullContext.client_name,
      address: fullContext.client_address,
      contact_name: fullContext.contact_name,
      contact_phone: fullContext.contact_phone
    },
    po: {
      order_id: fullContext.order_id,
      order_no: fullContext.order_no,
      po_number: fullContext.po_number,
      po_date: fullContext.po_date
    },
    equipment: {
      id: fullContext.object_id,
      name: fullContext.object_name,
      domain_code: fullContext.domain_code || fullContext.category_code,
      domain_name: fullContext.domain_name || fullContext.category_name,
      equipment_type_id: fullContext.equipment_type_id,
      equipment_type_name: fullContext.equipment_type_name,
      equipment_subtype_name: fullContext.equipment_subtype_name,
      brand: fullContext.brand,
      model: fullContext.model,
      manufacturer: fullContext.manufacturer,
      manufacture_year: fullContext.manufacture_year,
      serial_number: fullContext.serial_number,
      capacity: fullContext.capacity,
      capacity_unit: fullContext.capacity_unit,
      install_location: fullContext.install_location,
      previous_permit_no: fullContext.previous_permit_no,
      technical_data: fullContext.technical_data || {}
    },
    inspection: {
      id: fullContext.inspection_id,
      inspection_type: fullContext.inspection_type_code || fullContext.inspection_type || 'BERKALA',
      inspected_at: fullContext.inspected_at || fullContext.inspection_date,
      submitted_at: fullContext.submitted_at,
      inspector_id: fullContext.inspector_id,
      inspector_name: fullContext.inspector_name,
      conclusion: fullContext.conclusion,
      conclusion_notes: fullContext.conclusion_notes,
      method_summary: fullContext.method_summary,
      technical_notes: fullContext.technical_notes,
      recommendations: fullContext.recommendations,
      recommended_valid_until: fullContext.recommended_valid_until
    },
    results: Array.isArray(fullContext.results) ? fullContext.results.map((r) => ({
      seq: r.seq,
      section: r.section,
      label: r.label,
      input_type: r.input_type,
      unit: r.unit,
      value_choice: r.value_choice,
      value_numeric: r.value_numeric,
      value_text: r.value_text,
      notes: r.notes
    })) : [],
    findings: Array.isArray(fullContext.findings) ? fullContext.findings.map((f) => ({
      id: f.id,
      category: f.category,
      description: f.description,
      recommendation: f.recommendation,
      severity: f.severity,
      created_at: f.created_at
    })) : [],
    photos: Array.isArray(fullContext.photos) ? fullContext.photos.map((p) => ({
      id: p.id,
      originalName: p.originalName || p.original_name,
      caption: p.caption,
      mimeType: p.mimeType || p.mime_type,
      storageKey: p.storageKey || p.storage_key
    })) : []
  };
}
