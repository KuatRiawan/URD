import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

export function isEmailConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass) && !env.isTest;
}

export function isWhatsAppConfigured() {
  return Boolean(env.whatsapp.token) && !env.isTest;
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
  if (!isEmailConfigured()) return { mode: 'SIMULASI' };
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    });
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, text });
  return { mode: 'TERKIRIM' };
}

export async function sendWhatsApp({ to, message }) {
  if (!isWhatsAppConfigured()) return { mode: 'SIMULASI' };
  const body = new URLSearchParams({ target: to, message, countryCode: '62' });
  const res = await fetch(env.whatsapp.apiUrl, {
    method: 'POST',
    headers: { Authorization: env.whatsapp.token },
    body
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.status === false) {
    throw new Error(payload.reason || payload.detail || `Gateway WhatsApp menolak permintaan (${res.status})`);
  }
  return { mode: 'TERKIRIM' };
}

