const CHOICE_INPUT_TYPES = new Set(['CHOICE', 'CONFORMITY']);
const NUMBER_INPUT_TYPES = new Set(['NUMBER', 'MEASUREMENT']);
const PHOTO_INPUT_TYPES = new Set(['PHOTO', 'FILE']);

const FIELD_RELEVANT_KEYWORDS = [
  'foto',
  'dokumentasi',
  'temuan',
  'finding',
  'ukur',
  'dimensi',
  'defleksi',
  'uji beban',
  'uji fungsi',
  'load test',
  'seri',
  'merk',
  'pabrik',
  'kapasitas',
  'model',
  'tipe',
  'tahun',
  'kesimpulan',
  'kelayakan',
  'catatan',
  'garpu',
  'rem',
  'hidrolik',
  'bocoran',
  'tekanan',
  'tegangan',
  'tahanan',
  'grounding'
];

/**
 * Normalize template item input type to uppercase canonical code.
 */
export function normalizeInputType(item) {
  return String(item?.input_type || 'CHOICE').trim().toUpperCase();
}

/**
 * Normalize SELECT / RADIO option definitions into `{ value, label }` pairs.
 */
export function parseSelectOptions(item) {
  const raw = item?.options_json ?? item?.options ?? item?.choices;
  let parsed = raw;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } else {
      parsed = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((entry) => {
      if (entry && typeof entry === 'object') {
        const value = String(entry.value ?? entry.code ?? entry.label ?? '').trim();
        const label = String(entry.label ?? entry.name ?? value).trim();
        return value ? { value, label: label || value } : null;
      }
      const str = String(entry ?? '').trim();
      return str ? { value: str, label: str } : null;
    })
    .filter(Boolean);
}

/**
 * Parse a MULTI_SELECT textValue (JSON array or comma-separated string) into array.
 */
export function parseMultiSelectValue(rawValue) {
  if (Array.isArray(rawValue)) {
    return rawValue.map((v) => String(v).trim()).filter(Boolean);
  }
  const str = String(rawValue ?? '').trim();
  if (!str) return [];
  if (str.startsWith('[')) {
    try {
      const arr = JSON.parse(str);
      if (Array.isArray(arr)) {
        return arr.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      // Fallback to comma-separated parsing
    }
  }
  return str
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Serialize MULTI_SELECT array into textValue string (empty string if none selected).
 */
export function serializeMultiSelectValue(values) {
  const cleaned = Array.isArray(values)
    ? values.map((v) => String(v).trim()).filter(Boolean)
    : [];
  return cleaned.length > 0 ? JSON.stringify(cleaned) : '';
}

/**
 * Check whether an uploaded photo attachment belongs to a given checklist item.
 */
export function doesPhotoMatchItem(photo, item) {
  if (!photo || !item) return false;
  if (photo.item_id && item.id && String(photo.item_id) === String(item.id)) {
    return true;
  }

  const caption = String(photo.caption || '').trim().toLowerCase();
  const label = String(item.label || item.item_label || '').trim().toLowerCase();
  const section = String(item.section || '').trim().toLowerCase();
  if (!caption || !label) return false;

  if (caption.includes(label)) return true;

  // Match "[Section] ..." tags when prefix matches first 24 chars of item label
  const shortLabel = label.slice(0, 24);
  if (section && caption.includes(`[${section}]`) && shortLabel.length >= 6 && caption.includes(shortLabel)) {
    return true;
  }

  return false;
}

/**
 * Check whether a checklist item has a non-empty answer in local draft state or photos.
 */
export function isChecklistItemFilled(item, row, photos = []) {
  if (!item) return false;
  const inputType = normalizeInputType(item);

  if (CHOICE_INPUT_TYPES.has(inputType)) {
    return Boolean(row?.choiceValue);
  }

  if (NUMBER_INPUT_TYPES.has(inputType)) {
    return (
      row?.numberValue !== '' &&
      row?.numberValue !== null &&
      row?.numberValue !== undefined &&
      !Number.isNaN(Number(row.numberValue))
    );
  }

  if (inputType === 'DATE') {
    return Boolean(row?.dateValue && String(row.dateValue).trim());
  }

  if (inputType === 'MULTI_SELECT') {
    return parseMultiSelectValue(row?.textValue).length > 0;
  }

  if (PHOTO_INPUT_TYPES.has(inputType)) {
    if (row?.textValue && String(row.textValue).trim()) return true;
    return Array.isArray(photos) && photos.some((photo) => doesPhotoMatchItem(photo, item));
  }

  return Boolean(row?.textValue && String(row.textValue).trim());
}

/**
 * Build fast lookup map of checklist items keyed by `seq_no` (both numeric and string).
 */
export function buildItemsBySeqMap(items = []) {
  const map = new Map();
  for (const item of items) {
    if (item?.seq_no !== null && item?.seq_no !== undefined) {
      map.set(Number(item.seq_no), item);
      map.set(String(item.seq_no), item);
    }
  }
  return map;
}

function getEffectiveItemValue(item, row) {
  if (!item || !row) return '';
  const inputType = normalizeInputType(item);
  if (CHOICE_INPUT_TYPES.has(inputType)) return String(row.choiceValue || '').trim();
  if (NUMBER_INPUT_TYPES.has(inputType)) {
    return row.numberValue !== '' && row.numberValue !== null && row.numberValue !== undefined
      ? String(row.numberValue).trim()
      : '';
  }
  if (inputType === 'DATE') return String(row.dateValue || '').trim();
  return String(row.textValue || '').trim();
}

/**
 * Determine whether a conditional checklist item should be active and evaluated.
 */
export function isConditionalItemVisible(item, itemsBySeq, draftResults = {}, visited = new Set()) {
  if (!item) return false;
  const parentSeq = item.condition_parent_seq;
  if (parentSeq === null || parentSeq === undefined || parentSeq === '') {
    return true;
  }

  const seqKey = Number(item.seq_no);
  if (visited.has(seqKey)) return true;
  visited.add(seqKey);

  const parentItem =
    itemsBySeq instanceof Map
      ? itemsBySeq.get(Number(parentSeq)) || itemsBySeq.get(String(parentSeq))
      : itemsBySeq?.[parentSeq];

  if (!parentItem) return true;
  if (!isConditionalItemVisible(parentItem, itemsBySeq, draftResults, visited)) {
    return false;
  }

  const parentVal = getEffectiveItemValue(parentItem, draftResults[parentItem.id]);
  if (!parentVal) return false;

  const expectedRaw = String(item.condition_expected_value ?? '').trim();
  if (!expectedRaw) return Boolean(parentVal);

  const expectedValues = expectedRaw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (normalizeInputType(parentItem) === 'MULTI_SELECT') {
    const selectedUpper = parseMultiSelectValue(parentVal).map((v) => v.toUpperCase());
    return expectedValues.some((exp) => selectedUpper.includes(exp));
  }

  return expectedValues.includes(parentVal.toUpperCase());
}

/**
 * Serialize draftResults into backend `results[]` payload respecting DB constraints per input type.
 */
export function buildInspectionResultPayload(items = [], draftResults = {}) {
  return (items || []).map((item) => {
    const row = draftResults[item.id] || {};
    const inputType = normalizeInputType(item);

    if (CHOICE_INPUT_TYPES.has(inputType)) {
      return {
        itemId: item.id,
        choiceValue: row.choiceValue || null,
        numberValue: null,
        textValue: null,
        dateValue: null,
        note: row.note || ''
      };
    }

    if (NUMBER_INPUT_TYPES.has(inputType)) {
      const hasNum =
        row.numberValue !== '' &&
        row.numberValue !== null &&
        row.numberValue !== undefined &&
        !Number.isNaN(Number(row.numberValue));
      return {
        itemId: item.id,
        choiceValue: null,
        numberValue: hasNum ? Number(row.numberValue) : null,
        textValue: null,
        dateValue: null,
        note: row.note || ''
      };
    }

    if (inputType === 'DATE') {
      const trimmedDate = row.dateValue ? String(row.dateValue).trim().slice(0, 10) : '';
      return {
        itemId: item.id,
        choiceValue: null,
        numberValue: null,
        textValue: null,
        dateValue: trimmedDate || null,
        note: row.note || ''
      };
    }

    if (inputType === 'MULTI_SELECT') {
      const serialized = serializeMultiSelectValue(parseMultiSelectValue(row.textValue));
      return {
        itemId: item.id,
        choiceValue: null,
        numberValue: null,
        textValue: serialized || null,
        dateValue: null,
        note: row.note || ''
      };
    }

    const trimmedText = row.textValue !== null && row.textValue !== undefined ? String(row.textValue).trim() : '';
    return {
      itemId: item.id,
      choiceValue: null,
      numberValue: null,
      textValue: trimmedText || null,
      dateValue: null,
      note: row.note || ''
    };
  });
}

/**
 * Identify items particularly relevant during Phase 1 (Field Inspection).
 */
export function isFieldRelevantItem(item) {
  if (!item) return false;
  const inputType = normalizeInputType(item);
  if (
    NUMBER_INPUT_TYPES.has(inputType) ||
    PHOTO_INPUT_TYPES.has(inputType) ||
    inputType === 'LONG_TEXT'
  ) {
    return true;
  }
  if (item.is_critical === true) return true;

  const haystack = `${item.section || ''} ${item.label || item.item_label || ''} ${item.unit || ''}`.toLowerCase();
  return FIELD_RELEVANT_KEYWORDS.some((kw) => haystack.includes(kw));
}

/** Butir yang berlaku pada fase kerja aktif inspector. */
export function filterItemsForPhase(items = [], workPhase = 'OFFICE') {
  return workPhase === 'FIELD' ? items.filter(isFieldRelevantItem) : items;
}

/**
 * Compute completion & conformity counters for a checklist section.
 */
export function computeSectionProgress(sectionItems = [], itemsBySeq, draftResults = {}, photos = []) {
  const visibleItems = (sectionItems || []).filter((item) =>
    isConditionalItemVisible(item, itemsBySeq, draftResults)
  );
  let filled = 0;
  let nonConforming = 0;

  for (const item of visibleItems) {
    const row = draftResults[item.id];
    if (isChecklistItemFilled(item, row, photos)) {
      filled += 1;
    }
    const inputType = normalizeInputType(item);
    if (CHOICE_INPUT_TYPES.has(inputType) && row?.choiceValue === 'TIDAK_SESUAI') {
      nonConforming += 1;
    } else if (inputType === 'YES_NO' && String(row?.textValue || '').toUpperCase() === 'TIDAK') {
      nonConforming += 1;
    }
  }

  const total = visibleItems.length;
  const missing = Math.max(0, total - filled);
  const percent = total > 0 ? Math.round((filled / total) * 100) : 100;

  return {
    total,
    filled,
    missing,
    nonConforming,
    percent,
    visibleItems
  };
}
