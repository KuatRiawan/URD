import { env } from '../config/env.js';
import { query } from '../database/pool.js';
import { isValidEmail, normalizePhone, sendEmail, sendWhatsApp } from './notifier.js';

const STAGES = [
  { code: 'H7', maxDays: 7 },
  { code: 'H14', maxDays: 14 },
  { code: 'H30', maxDays: 30 }
];

export function resolveClientStage(daysRemaining) {
  if (
    daysRemaining === null ||
    daysRemaining === undefined ||
    daysRemaining < 0 ||
    daysRemaining > 30
  ) {
    return null;
  }
  return STAGES.find((s) => daysRemaining <= s.maxDays) || null;
}

function formatDateId(value) {
  const d = new Date(value);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function buildReminderMessage(group) {
  const firstUnit = group.units[0];
  const pic = firstUnit.contact_name ? `Bapak/Ibu ${firstUnit.contact_name}` : 'Bapak/Ibu PIC K3';
  const timing = `akan jatuh tempo dalam ${firstUnit.days_remaining} hari`;
  const units = group.units
    .map(
      (unit, index) =>
        `${index + 1}. ${unit.object_name} (${unit.category_code}) | No. Seri: ${unit.serial_number} | Batas: ${formatDateId(unit.valid_until)}`
    )
    .join('\n');

  return [
    `Yth. ${pic} (${firstUnit.client_name}),`,
    '',
    `Kami dari PT Upaya Riksa Daya menginformasikan bahwa masa berlaku riksa uji berkala peralatan berikut ${timing}:`,
    units,
    '',
    'Agar operasional tetap memenuhi ketentuan K3, silakan hubungi kami untuk penjadwalan pemeriksaan perpanjangan.',
    '',
    'Terima kasih.',
    'PT Upaya Riksa Daya',
    'Telp. (021) 489 1409 | urd@upayariksadaya.com'
  ].join('\n');
}

export async function loadCandidates() {
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
       WHERE client_id = c.id AND is_active = true
       ORDER BY is_reminder_recipient DESC, is_primary DESC, created_at DESC LIMIT 1
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
     LEFT JOIN LATERAL (
       SELECT rf.status::text AS status
       FROM renewal_followups rf
       WHERE rf.suket_id IN (
         SELECT s.id FROM suket_documents s WHERE s.object_id = t.id
       )
          OR rf.object_id = t.id
       ORDER BY rf.created_at DESC
       LIMIT 1
     ) latest_followup ON true
     WHERE t.is_active = true
       AND c.is_active = true
       AND COALESCE(ls.valid_until, t.next_inspection_date, li.recommended_valid_until) IS NOT NULL
       AND (COALESCE(ls.valid_until, t.next_inspection_date, li.recommended_valid_until) - CURRENT_DATE) <= 90
       AND COALESCE(latest_followup.status, '')
           NOT IN ('SUDAH_JADI_PO_BARU', 'DITUNDA')`
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
  const groups = new Map();
  for (const unit of units) {
    const stage = resolveClientStage(unit.days_remaining);
    if (!stage) continue;
    const key = `${unit.client_name}|${unit.valid_until}|${stage.code}`;
    const group = groups.get(key) || { stage: stage.code, units: [] };
    group.units.push(unit);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    const firstUnit = group.units[0];
    const { rows: done } = await query(
      `SELECT channel, count(*)::int AS completed
       FROM client_reminder_log
       WHERE object_id = ANY($1::uuid[])
         AND valid_until = $2
         AND stage = $3
         AND status = 'TERKIRIM'
       GROUP BY channel`,
      [group.units.map((unit) => unit.object_id), firstUnit.valid_until, group.stage]
    );
    const doneChannels = new Set(
      done.filter((row) => row.completed === group.units.length).map((row) => row.channel)
    );
    const message = buildReminderMessage(group);
    const subject = `Pengingat Perpanjangan Riksa Uji K3: ${firstUnit.client_name}`;

    const attempts = [
      {
        channel: 'EMAIL',
        recipient: isValidEmail(firstUnit.email) ? firstUnit.email.trim() : '',
        send: (to) => sendEmail({ to, subject, text: message })
      },
      {
        channel: 'WHATSAPP',
        recipient: normalizePhone(firstUnit.phone),
        send: (to) => sendWhatsApp({ to, message })
      }
    ];

    for (const attempt of attempts) {
      if (doneChannels.has(attempt.channel)) continue;
      const status = !attempt.recipient ? 'DILEWATI' : await (async () => {
        try {
          const result = await attempt.send(attempt.recipient);
          if (result.mode === 'TERKIRIM') summary.sent += 1;
          else summary.simulated += 1;
          return result.mode;
        } catch (err) {
          summary.failed += 1;
          return { mode: 'GAGAL', error: String(err.message).slice(0, 300) };
        }
      })();

      for (const unit of group.units) {
        summary.evaluated += 1;
        const result = typeof status === 'string' ? { mode: status } : status;
        await recordAttempt({
          unit,
          stage: group.stage,
          channel: attempt.channel,
          recipient: attempt.recipient,
          status: result.mode,
          error: result.error || (!attempt.recipient ? 'Kontak klien belum tersedia' : null)
        });
        if (result.mode === 'DILEWATI') {
          summary.skipped += 1;
        }
      }
    }
  }
  return summary;
}
