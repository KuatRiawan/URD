import { formatDate } from '../../../lib/utils/format.js';

export function normalizePhoneForWhatsApp(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function buildReminderMessage(item) {
  const effectiveValidity =
    item.suket_valid_until || item.next_inspection_date || item.recommended_valid_until;
  const picLabel = item.contact_name ? `Bapak/Ibu ${item.contact_name}` : 'Bapak/Ibu PIC K3';
  const inspectedDate = formatDate(item.inspected_at || item.submitted_at);
  const validDate = effectiveValidity ? formatDate(effectiveValidity) : 'Jadwal Berkala Berikutnya';

  return [
    `Yth. ${picLabel} (${item.client_name || 'Perusahaan Klien'}),`,
    '',
    'Kami dari PT Upaya Riksa Daya ingin menyampaikan informasi riwayat pemeriksaan dan pengingat jadwal riksa uji berkala untuk unit peralatan K3 berikut:',
    `- Unit Alat: ${item.object_name || '-'} (${item.category_code || '-'})`,
    `- Nomor Seri / Kapasitas: ${item.serial_number || '-'} / ${item.capacity_value ? `${item.capacity_value} ${item.capacity_unit || ''}` : '-'}`,
    `- Nomor PO: ${item.po_number || item.order_no || '-'}`,
    `- Nomor BAP / LHPP: ${item.bap_no || '-'} / ${item.lhpp_no || '-'}`,
    `- Tanggal Pemeriksaan Terakhir: ${inspectedDate}`,
    `- Masa Berlaku / Jadwal Riksa Uji Berikutnya: ${validDate}`,
    '',
    'Apabila Bapak/Ibu memerlukan penjadwalan pemeriksaan berkala (perpanjangan) atau konsultasi dokumen K3, silakan menghubungi tim operasional PT Upaya Riksa Daya.',
    '',
    'Terima kasih atas kerja samanya.',
    'PT Upaya Riksa Daya'
  ].join('\n');
}

export function buildWhatsAppUrl(item) {
  const phone = normalizePhoneForWhatsApp(item.contact_phone || item.client_phone);
  const text = encodeURIComponent(buildReminderMessage(item));
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function buildEmailUrl(item) {
  const email = item.contact_email || item.client_email || '';
  const subject = encodeURIComponent(
    `Pengingat Riksa Uji Berkala K3 - ${item.object_name || 'Unit Alat'} (${item.client_name || ''})`
  );
  const body = encodeURIComponent(buildReminderMessage(item));
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
