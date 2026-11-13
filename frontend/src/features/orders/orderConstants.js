export const STATUS_TONE = {
  TERDAFTAR: 'info',
  ORDER_BARU: 'info',
  TERJADWAL: 'info',
  DITUGASKAN: 'warning',
  SEDANG_DIPERIKSA: 'warning',
  MENUNGGU_LAPORAN: 'warning',
  MENUNGGU_DOKUMEN: 'warning',
  SELESAI: 'success',
  DIBATALKAN: 'danger'
};

import { UNIT_STATUS_LABELS } from '../../lib/utils/format.js';

export { UNIT_STATUS_LABELS };

export const ALLOWED_NEXT_STATUS = {
  // TERDAFTAR adalah status awal PO saat ini; ORDER_BARU dipertahankan untuk data lama.
  TERDAFTAR: ['TERJADWAL', 'DIBATALKAN'],
  ORDER_BARU: ['TERJADWAL', 'DIBATALKAN'],
  TERJADWAL: ['DITUGASKAN', 'DIBATALKAN'],
  DITUGASKAN: ['SEDANG_DIPERIKSA', 'TERJADWAL', 'DIBATALKAN'],
  SEDANG_DIPERIKSA: ['MENUNGGU_LAPORAN', 'DIBATALKAN'],
  MENUNGGU_LAPORAN: ['MENUNGGU_DOKUMEN', 'SEDANG_DIPERIKSA'],
  SELESAI: [],
  DIBATALKAN: []
};

export const ACTIVITY_STATUS_LABELS = {
  BELUM_DIJADWALKAN: 'Belum Dijadwalkan',
  MENUNGGU_PERSETUJUAN: 'Menunggu Persetujuan',
  TERJADWAL: 'Terjadwal',
  DITUGASKAN: 'Ditugaskan',
  SEDANG_DIPERIKSA: 'Sedang Diperiksa',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan'
};

export const SCHEDULE_STATUS_LABELS = {
  BELUM_DIUSULKAN: 'Jadwal Belum Diajukan',
  DIUSULKAN: 'Menunggu Persetujuan Manager',
  DISETUJUI: 'Jadwal Disetujui',
  DITOLAK: 'Jadwal Ditolak'
};

export const PO_WIZARD_STEPS = [
  'Info PO & Layanan',
  'Data Klien & PIC',
  'Unit Alat K3',
  'Target Waktu & Catatan PO',
  'Review & Simpan'
];

