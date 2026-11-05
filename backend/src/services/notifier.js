import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { getSmtpConfig, getWhatsAppConfig } from './system-settings-service.js';

let transporter = null;

export function isEmailConfigured(smtpConfig = null) {
  const conf = smtpConfig || env.smtp;
  return Boolean(conf.host && conf.user && conf.pass) && !env.isTest;
}

export function isWhatsAppConfigured(waConfig = null) {
  const conf = waConfig || env.whatsapp;
  return Boolean(conf.token || conf.apiKey) && !env.isTest;
}

export function channelStatus() {
  return {
    enabled: env.clientRemindersEnabled,
    email: isEmailConfigured() ? 'AKTIF' : 'SIMULASI',
    whatsapp: isWhatsAppConfigured() ? 'AKTIF' : 'SIMULASI'
  };
}

// Nomor Indonesia: 08xx menjadi 628xx, hanya digit.
export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

// Mengembalikan { mode: 'TERKIRIM' | 'SIMULASI' }. Melempar error bila pengiriman gagal.
export async function sendEmail({ to, subject, text }) {
  const dynamicSmtp = await getSmtpConfig().catch(() => env.smtp);
  if (!isEmailConfigured(dynamicSmtp)) return { mode: 'SIMULASI' };

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: dynamicSmtp.host,
      port: dynamicSmtp.port,
      secure: dynamicSmtp.secure,
      auth: { user: dynamicSmtp.user, pass: dynamicSmtp.pass }
    });
  }
  await transporter.sendMail({ from: dynamicSmtp.from, to, subject, text });
  return { mode: 'TERKIRIM' };
}

export async function sendWhatsApp({ to, message }) {
  const dynamicWa = await getWhatsAppConfig().catch(() => env.whatsapp);
  if (!isWhatsAppConfigured(dynamicWa)) return { mode: 'SIMULASI' };

  const body = new URLSearchParams({ target: to, message, countryCode: '62' });
  const res = await fetch(dynamicWa.apiUrl, {
    method: 'POST',
    headers: { Authorization: dynamicWa.token },
    body
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.status === false) {
    throw new Error(payload.reason || payload.detail || `Gateway WhatsApp menolak permintaan (${res.status})`);
  }
  return { mode: 'TERKIRIM' };
}

const MASKED_SECRET = '••••••••';

export function isMaskedSecret(val) {
  return !val || val === MASKED_SECRET || /^•+$/.test(String(val).trim());
}

export async function testSmtpConnection(customConfig = null) {
  const stored = await getSmtpConfig();
  const conf = {
    host: customConfig?.host ?? stored.host,
    port: Number(customConfig?.port || stored.port || 587),
    secure: customConfig?.secure !== undefined ? Boolean(customConfig.secure) : Boolean(stored.secure),
    user: customConfig?.user ?? stored.user,
    pass: !isMaskedSecret(customConfig?.pass) ? customConfig.pass : stored.pass,
    from: customConfig?.from ?? stored.from
  };

  if (!conf.host || !conf.user) {
    throw new Error('Konfigurasi SMTP belum lengkap: Host dan Username autentikasi wajib diisi.');
  }
  if (isMaskedSecret(conf.pass)) {
    throw new Error('Password / App Password SMTP belum dikonfigurasi. Silakan isi password SMTP terlebih dahulu sebelum menguji koneksi.');
  }

  if (env.isTest) {
    return {
      success: true,
      mode: 'TEST_ENV',
      message: `Konfigurasi SMTP ${conf.host}:${conf.port} tervalidasi (mode pengujian).`
    };
  }

  const testTransporter = nodemailer.createTransport({
    host: conf.host,
    port: conf.port,
    secure: conf.secure,
    auth: { user: conf.user, pass: conf.pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000
  });

  await testTransporter.verify();
  return {
    success: true,
    mode: 'LIVE',
    message: `Koneksi SMTP ke ${conf.host}:${conf.port} berhasil diverifikasi.`
  };
}

export async function testWhatsAppConnection(customConfig = null) {
  const stored = await getWhatsAppConfig();
  const rawToken = customConfig?.token ?? customConfig?.api_key;
  const conf = {
    provider: customConfig?.provider || stored.provider || 'FONNTE',
    apiUrl: customConfig?.apiUrl || customConfig?.api_url || stored.apiUrl,
    token: !isMaskedSecret(rawToken) ? rawToken : stored.token,
    senderNumber: customConfig?.senderNumber || customConfig?.sender_number || stored.senderNumber
  };

  if (!conf.apiUrl) {
    throw new Error('Endpoint URL API WhatsApp Gateway wajib diisi.');
  }
  if (isMaskedSecret(conf.token)) {
    throw new Error('Token / API Key WhatsApp Gateway belum dikonfigurasi. Silakan isi API Key yang valid sebelum menguji koneksi.');
  }

  if (env.isTest) {
    return {
      success: true,
      mode: 'TEST_ENV',
      message: `Konfigurasi WhatsApp Gateway (${conf.provider}) tervalidasi (mode pengujian).`
    };
  }

  const res = await fetch(conf.apiUrl, {
    method: 'POST',
    headers: { Authorization: conf.token },
    body: new URLSearchParams({ target: conf.senderNumber || '081200000000', message: 'URD Gateway Connectivity Check' })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.reason || data.message || `Server WhatsApp Gateway menolak koneksi (HTTP ${res.status}).`);
  }
  if (data.status === false) {
    throw new Error(`Gateway WhatsApp (${conf.provider}) menolak otorisasi: ${data.reason || data.detail || 'Token API Key tidak valid atau perangkat belum terhubung.'}`);
  }

  return {
    success: true,
    mode: 'LIVE',
    message: `Koneksi Gateway WhatsApp (${conf.provider}) berhasil diverifikasi (HTTP ${res.status}).`
  };
}
