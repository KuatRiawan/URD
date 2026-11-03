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

export async function testSmtpConnection(customConfig = null) {
  const conf = customConfig || (await getSmtpConfig());
  if (env.isTest || !conf.host) {
    if (!conf.host || !conf.user) {
      throw new Error('Konfigurasi SMTP belum lengkap: Host dan User wajib diisi.');
    }
    return {
      success: true,
      message: `Konfigurasi SMTP ${conf.host}:${conf.port || 587} berhasil divalidasi.`
    };
  }

  const testTransporter = nodemailer.createTransport({
    host: conf.host,
    port: Number(conf.port || 587),
    secure: Boolean(conf.secure),
    auth: { user: conf.user, pass: conf.pass },
    connectionTimeout: 5000
  });

  await testTransporter.verify();
  return {
    success: true,
    message: `Koneksi SMTP ke ${conf.host}:${conf.port} berhasil diverifikasi!`
  };
}

export async function testWhatsAppConnection(customConfig = null) {
  const conf = customConfig || (await getWhatsAppConfig());
  if (env.isTest || !conf.token) {
    if (!conf.apiUrl || !conf.token) {
      throw new Error('Konfigurasi WhatsApp belum lengkap: URL API dan Token/API Key wajib diisi.');
    }
    return {
      success: true,
      message: `Konfigurasi WhatsApp Gateway (${conf.provider || 'FONNTE'}) berhasil divalidasi.`
    };
  }

  const res = await fetch(conf.apiUrl, {
    method: 'POST',
    headers: { Authorization: conf.token },
    body: new URLSearchParams({ target: '6280000000000', message: 'URD Gateway Ping Test' })
  });

  // Fonnte returns JSON even on validation fail or balance checks
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status >= 500) {
    throw new Error(`Server WhatsApp Gateway merespon dengan error HTTP ${res.status}`);
  }
  return {
    success: true,
    message: `Koneksi Gateway WhatsApp (${conf.provider || 'Gateway'}) berhasil terhubung. Status API: ${res.status}`
  };
}
