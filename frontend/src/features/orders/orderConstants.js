export const STATUS_TONE = {
  ORDER_BARU: 'info',
  TERJADWAL: 'info',
  DITUGASKAN: 'warning',
  SEDANG_DIPERIKSA: 'warning',
  MENUNGGU_LAPORAN: 'warning',
  MENUNGGU_DOKUMEN: 'warning',
  SELESAI: 'success',
  DIBATALKAN: 'danger'
};

export const UNIT_STATUS_LABELS = {
  BELUM_DIJADWALKAN: 'Belum Dijadwalkan',
  TERJADWAL: 'Sudah Dijadwalkan',
  DITUGASKAN: 'Ditugaskan ke Inspector',
  SEDANG_DIPERIKSA: 'Sedang Diperiksa',
  FORM_TERKIRIM: 'Form Terkirim',
  BAP_DRAF: 'Draf BAP',
  BAP_FINAL: 'BAP Final',
  LHPP_DRAF: 'Draf LHPP',
  LHPP_SIAP_PREVIEW: 'LHPP Siap Finalisasi',
  PERLU_REVISI: 'Perlu Revisi',
  LHPP_TERBIT: 'LHPP Terbit',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan'
};

export const ALLOWED_NEXT_STATUS = {
  ORDER_BARU: ['TERJADWAL', 'DIBATALKAN'],
  TERJADWAL: ['DITUGASKAN', 'DIBATALKAN'],
  DITUGASKAN: ['SEDANG_DIPERIKSA', 'TERJADWAL', 'DIBATALKAN'],
  SEDANG_DIPERIKSA: ['MENUNGGU_LAPORAN', 'DIBATALKAN'],
  MENUNGGU_LAPORAN: ['MENUNGGU_DOKUMEN', 'SEDANG_DIPERIKSA'],
  SELESAI: [],
  DIBATALKAN: []
};

export const PO_WIZARD_STEPS = [
  'Info PO & Layanan',
  'Data Klien & PIC',
  'Unit Alat K3',
  'Jadwal & Ahli K3',
  'Review & Simpan'
];

