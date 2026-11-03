import { query } from '../database/pool.js';
import { env } from '../config/env.js';

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const DEFAULT_COMPANY_PROFILE = {
  company_name: 'PT UPAYA RIKSA DAYA',
  legal_name: 'PT Upaya Riksa Daya',
  brand_name: 'URD',
  tagline: 'Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PJK3)',
  address: 'Jl. Pondasi No. 50B RT. 003 RW. 002, Kel. Kayu Putih, Kec. Pulo Gadung, Jakarta Timur 13210',
  phone: '(021) 489 1409',
  email: 'urd@upayariksadaya.com',
  website: 'https://upayariksadaya.com',
  pjk3_license_no: 'KEP.5/123/AS.01.03/I/2024',
  director_name: 'Direktur PT Upaya Riksa Daya'
};

const DEFAULT_AUTO_NUMBERING = {
  order_prefix: 'PO-URD/{YEAR}/{MONTH}/{COUNTER}',
  assignment_prefix: 'ST-URD/{YEAR}/{ROMAN_MONTH}/{COUNTER}',
  bap_prefix: 'BAP/URD/{ROMAN_MONTH}/{YEAR}/{COUNTER}',
  lhpp_prefix: '{COUNTER}/INSP-{BIDANG_CODE}/PJK3-URD/{ROMAN_MONTH}/{YEAR}',
  suket_prefix: '566/{COUNTER}/DTKT/{YEAR}',
  bast_prefix: 'BAST-URD/{YEAR}/{MONTH}/{COUNTER}'
};

let cachedSettings = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000; // 15 detik

export function invalidateSettingsCache() {
  cachedSettings = null;
  lastCacheTime = 0;
}

export async function getAllSystemSettings() {
  const now = Date.now();
  if (cachedSettings && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const { rows } = await query('SELECT key, value FROM system_settings');
    const map = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }
    cachedSettings = map;
    lastCacheTime = now;
    return map;
  } catch {
    return cachedSettings || {};
  }
}

export async function getCompanyProfile() {
  const settings = await getAllSystemSettings();
  const stored = settings.company_profile;
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_COMPANY_PROFILE };
  }
  return {
    ...DEFAULT_COMPANY_PROFILE,
    ...stored
  };
}

export async function getAutoNumbering() {
  const settings = await getAllSystemSettings();
  const stored = settings.auto_numbering;
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_AUTO_NUMBERING };
  }
  return {
    ...DEFAULT_AUTO_NUMBERING,
    ...stored
  };
}

export async function formatDocumentNumber(docType, { counter, categoryCode = 'K3', date = new Date() }) {
  const numbering = await getAutoNumbering();
  const d = date instanceof Date ? date : new Date(date);
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const romanMonth = ROMAN_MONTHS[d.getMonth()] || 'I';
  const paddedCounter = String(counter || 1).padStart(4, '0');

  let template = numbering[`${docType}_prefix`] || DEFAULT_AUTO_NUMBERING[`${docType}_prefix`];
  if (!template) {
    if (docType === 'bap') template = DEFAULT_AUTO_NUMBERING.bap_prefix;
    else if (docType === 'lhpp') template = DEFAULT_AUTO_NUMBERING.lhpp_prefix;
    else if (docType === 'order') template = DEFAULT_AUTO_NUMBERING.order_prefix;
    else if (docType === 'assignment') template = DEFAULT_AUTO_NUMBERING.assignment_prefix;
    else if (docType === 'suket') template = DEFAULT_AUTO_NUMBERING.suket_prefix;
    else if (docType === 'bast') template = DEFAULT_AUTO_NUMBERING.bast_prefix;
    else template = `${docType.toUpperCase()}-URD/{YEAR}/{COUNTER}`;
  }

  if (!template.includes('{COUNTER}')) {
    template = `${template}/{YEAR}/{ROMAN_MONTH}/{COUNTER}`;
  }

  return template
    .replace(/\{COUNTER\}/g, paddedCounter)
    .replace(/\{YEAR\}/g, year)
    .replace(/\{MONTH\}/g, month)
    .replace(/\{ROMAN_MONTH\}/g, romanMonth)
    .replace(/\{BIDANG_CODE\}/g, String(categoryCode || 'K3').toUpperCase());
}

export async function getSmtpConfig() {
  const settings = await getAllSystemSettings();
  const stored = settings.smtp_configuration || {};
  return {
    host: stored.host || env.smtp?.host,
    port: Number(stored.port || env.smtp?.port || 587),
    secure: stored.secure !== undefined ? Boolean(stored.secure) : Boolean(env.smtp?.secure),
    user: stored.user || env.smtp?.user,
    pass: stored.pass || env.smtp?.pass,
    from: stored.from || env.smtp?.from || 'URD Operasional <noreply@upayariksadaya.com>'
  };
}

export async function getWhatsAppConfig() {
  const settings = await getAllSystemSettings();
  const stored = settings.whatsapp_gateway || {};
  return {
    provider: stored.provider || 'FONNTE',
    apiUrl: stored.api_url || env.whatsapp?.apiUrl || 'https://api.fonnte.com/send',
    token: stored.api_key || stored.token || env.whatsapp?.token,
    senderNumber: stored.sender_number || ''
  };
}
