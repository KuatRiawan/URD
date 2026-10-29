import { env } from '../config/env.js';
import { query } from '../database/pool.js';
import { isValidEmail, normalizePhone, sendEmail, sendWhatsApp } from './notifier.js';

const STAGES = [
  { code: 'H0', maxDays: 0 },
  { code: 'H14', maxDays: 14 },
  { code: 'H30', maxDays: 30 },
  { code: 'H60', maxDays: 60 },
  { code: 'H90', maxDays: 90 }
];

export function resolveClientStage(daysRemaining) {
  if (daysRemaining === null || daysRemaining === undefined || daysRemaining > 90) return null;
  return STAGES.find((s) => daysRemaining <= s.maxDays) || null;
}

function formatDateId(value) {
  const d = new Date(value);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function buildReminderMessage(unit) {
  const pic = unit.contact_name ? `Bapak/Ibu ${unit.contact_name}` : 'Bapak/Ibu PIC K3';
  const expired = unit.days_remaining < 0;
  const timing = expired
    ? 'telah melewati masa berlaku'
    : unit.days_remaining === 0
      ? 'jatuh tempo hari ini'
      : `akan jatuh tempo dalam ${unit.days_remaining} hari`;
  return [
    `Yth. ${pic} (${unit.client_name}),`,
    '',
    `Kami dari PT Upaya Riksa Daya menginformasikan bahwa riksa uji berkala unit berikut ${timing}:`,
    `- Unit Alat: ${unit.object_name} (${unit.category_code})`,
    `- Nomor Seri: ${unit.serial_number}`,
    `- Batas Masa Berlaku: ${formatDateId(unit.valid_until)}`,
    '',
    'Agar operasional tetap memenuhi ketentuan K3, silakan hubungi kami untuk penjadwalan pemeriksaan perpanjangan.',
    '',
    'Terima kasih.',
    'PT Upaya Riksa Daya',
    'Telp. (021) 489 1409 | urd@upayariksadaya.com'
  ].join('\n');
}

async function loadCandidates() {
  const { rows } = await query(
    `SELECT t.id AS object_id, t.name AS object_name, t.serial_number,
            oc.code AS category_code, c.name AS client_name,
            ct.name AS contact_name,
            COALESCE(NULLIF(ct.phone, ''), NULLIF(c.phone, '')) AS phone,
            COALESCE(NULLIF(ct.email, ''), NULLIF(c.email, '')) AS email,
            COALESCE(ls.valid_until, t.next_inspection_date, li.recommended_valid_until) AS valid_until,
            (COALESCE(ls.valid_until, t.next_inspection_date, li.recommended_valid_until) - CURRENT_DATE)::int AS days_remaining
     FROM test_objects t
     JOIN clients c ON c.id = t.client_id
     JOIN object_categories oc ON oc.id = t.category_id
     LEFT JOIN LATERAL (
       SELECT name, phone, email FROM client_contacts
       WHERE client_id = c.id ORDER BY created_at DESC LIMIT 1
     ) ct ON true
     LEFT JOIN LATERAL (
       SELECT s.valid_until FROM suket_documents s
       WHERE s.object_id = t.id AND s.status = 'TERBIT'
       ORDER BY s.valid_until DESC NULLS LAST LIMIT 1
     ) ls ON true
     LEFT JOIN LATERAL (
       SELECT l.recommended_valid_until
       FROM inspections i JOIN lhpp_documents l ON l.inspection_id = i.id
       WHERE i.object_id = t.id ORDER BY i.created_at DESC LIMIT 1
     ) li ON true
     WHERE t.is_active = true
       AND c.is_active = true
       AND COALESCE(ls.valid_until, t.next_inspection_date, li.recommended_valid_until) IS NOT NULL
       AND (COALESCE(ls.valid_until, t.next_inspection_date, li.recommended_valid_until) - CURRENT_DATE) <= 90
       AND COALESCE(
             (SELECT rf.status::text FROM renewal_followups rf
              WHERE rf.object_id = t.id ORDER BY rf.created_at DESC LIMIT 1),
             ''
           ) NOT IN ('SUDAH_JADI_PO_BARU', 'DITUNDA')`
  );
  return rows;
}

async function recordAttempt({ unit, stage, channel, recipient, status, error }) {
  await query(
    `INSERT INTO client_reminder_log
       (object_id, stage, channel, valid_until, recipient, status, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (object_id, valid_until, stage, channel) DO UPDATE SET
       recipient = EXCLUDED.recipient,
       status = EXCLUDED.status,
       error_message = EXCLUDED.error_message,
       attempts = client_reminder_log.attempts + 1,
       updated_at = now()`,
    [unit.object_id, stage, channel, unit.valid_until, recipient || null, status, error || null]
  );
}

// Idempoten: unit yang sudah TERKIRIM pada tahap dan masa berlaku yang sama tidak dikirim ulang.
export async function dispatchClientReminders() {
  const summary = { evaluated: 0, sent: 0, simulated: 0, failed: 0, skipped: 0 };
  if (!env.clientRemindersEnabled) return summary;

  const units = await loadCandidates();
  for (const unit of units) {
    const stage = resolveClientStage(unit.days_remaining);
    if (!stage) continue;

    const { rows: done } = await query(
      `SELECT channel FROM client_reminder_log
       WHERE object_id = $1 AND valid_until = $2 AND stage = $3 AND status = 'TERKIRIM'`,
      [unit.object_id, unit.valid_until, stage.code]
    );
    const doneChannels = new Set(done.map((r) => r.channel));
    const message = buildReminderMessage(unit);
    const subject = `Pengingat Perpanjangan Riksa Uji K3: ${unit.object_name}`;

    const attempts = [
      {
        channel: 'EMAIL',
        recipient: isValidEmail(unit.email) ? unit.email.trim() : '',
        send: (to) => sendEmail({ to, subject, text: message })
      },
      {
        channel: 'WHATSAPP',
        recipient: normalizePhone(unit.phone),
        send: (to) => sendWhatsApp({ to, message })
      }
    ];

    for (const attempt of attempts) {
      if (doneChannels.has(attempt.channel)) continue;
      summary.evaluated += 1;
      const base = { unit, stage: stage.code, channel: attempt.channel, recipient: attempt.recipient };
      if (!attempt.recipient) {
        await recordAttempt({ ...base, status: 'DILEWATI', error: 'Kontak klien belum tersedia' });
        summary.skipped += 1;
        continue;
      }
      try {
        const result = await attempt.send(attempt.recipient);
        await recordAttempt({ ...base, status: result.mode });
        if (result.mode === 'TERKIRIM') summary.sent += 1;
        else summary.simulated += 1;
      } catch (err) {
        await recordAttempt({ ...base, status: 'GAGAL', error: String(err.message).slice(0, 300) });
        summary.failed += 1;
      }
    }
  }
  return summary;
}

