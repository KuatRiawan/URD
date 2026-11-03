export function normalizePhoneForWhatsApp(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function buildInquiryMessage(item) {
  const picLabel = item.contact_name ? `Bapak/Ibu ${item.contact_name}` : 'Bapak/Ibu PIC K3';
  return [
    `Yth. ${picLabel} (${item.client_name || 'Perusahaan Klien'}),`,
    '',
    `Salam hormat dari PT Upaya Riksa Daya. Kami ingin mengonfirmasi dan berkoordinasi mengenai riwayat pemeriksaan unit K3 berikut:`,
    `- Unit Alat: ${item.object_name || '-'} (${item.category_code || '-'})`,
    `- Nomor Seri: ${item.serial_number || '-'}`,
    `- Nomor PO: ${item.po_number || item.order_no || '-'}`,
    `- Dokumen: BAP (${item.bap_no || '-'}) / LHPP (${item.lhpp_no || '-'})`,
    '',
    'Apabila ada informasi teknis atau dokumen yang perlu dikonfirmasikan lebih lanjut, silakan beri tahu kami.',
    '',
    'Terima kasih.',
    'PT Upaya Riksa Daya'
  ].join('\n');
}

export function buildWhatsAppUrl(item) {
  const phone = normalizePhoneForWhatsApp(item.contact_phone || item.client_phone);
  const text = encodeURIComponent(buildInquiryMessage(item));
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function buildEmailUrl(item) {
  const email = item.contact_email || item.client_email || '';
  const subject = encodeURIComponent(
    `Koordinasi Teknis Unit K3: ${item.object_name || 'Unit Alat'} - PO ${item.po_number || item.order_no || '-'}`
  );
  const body = encodeURIComponent(buildInquiryMessage(item));
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
