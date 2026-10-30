import {
  Buildings,
  CalendarCheck,
  ClipboardText,
  ClockCounterClockwise,
  Cube,
  FileText,
  Gauge,
  Gear,
  Scroll,
  ShareNetwork,
  ShieldCheck,
  Users,
  WarningOctagon
} from '@phosphor-icons/react';

export const ROLE_ALIASES = {
  ADMIN_KANTOR: 'MARKETING',
  MARKETING: 'ADMIN_KANTOR',
  AHLI_K3: 'INSPECTOR',
  INSPECTOR: 'AHLI_K3',
  MANAGER: 'PIMPINAN',
  PIMPINAN: 'MANAGER'
};

export const NAV_ITEMS = [
  {
    to: '/app/dashboard',
    group: 'Utama',
    label: 'Dasbor Operasional',
    icon: Gauge,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/orders',
    group: 'Operasional',
    label: 'PO & Order Pemeriksaan',
    icon: ClipboardText,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/clients',
    group: 'Operasional',
    label: 'Data Klien',
    icon: Buildings,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/objects',
    group: 'Operasional',
    label: 'Objek Uji K3',
    icon: Cube,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/schedule',
    group: 'Operasional',
    label: 'Jadwal & Penugasan',
    icon: CalendarCheck,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/inspections',
    group: 'Operasional',
    label: 'Form Pengujian Lapangan',
    icon: FileText,
    roles: ['ADMIN_SISTEM', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/lhpp',
    group: 'Dokumen & Sertifikasi',
    label: 'Dokumen LHPP',
    icon: Scroll,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/bap',
    group: 'Dokumen & Sertifikasi',
    label: 'Berita Acara (BAP)',
    icon: ClipboardText,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/distributions',
    group: 'Dokumen & Sertifikasi',
    label: 'Distribusi Dokumen',
    icon: ShareNetwork,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/history',
    group: 'Dokumen & Sertifikasi',
    label: 'Riwayat Pengujian',
    icon: ClockCounterClockwise,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/suket',
    group: 'Dokumen & Sertifikasi',
    label: 'Registri Suket K3',
    icon: WarningOctagon,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/reminders',
    group: 'Pemantauan',
    label: 'Pengingat Perpanjangan',
    icon: ShieldCheck,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/users',
    group: 'Administrasi',
    label: 'Manajemen Pengguna',
    icon: Users,
    roles: ['ADMIN_SISTEM']
  },
  {
    to: '/app/audit-logs',
    group: 'Administrasi',
    label: 'Log Audit',
    icon: ClockCounterClockwise,
    roles: ['ADMIN_SISTEM', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/settings',
    group: 'Pengaturan',
    label: 'Pengaturan Akun',
    icon: Gear,
    roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  }
];

export function getVisibleNav(role) {
  if (!role) return [];

  // 1. Menu khusus Inspector / Ahli K3: Ultra-sederhana 4 menu utama lapangan
  if (['AHLI_K3', 'INSPECTOR'].includes(role)) {
    return [
      {
        to: '/app/dashboard',
        group: 'Tugas Utama',
        label: 'Tugas Saya',
        icon: Gauge
      },
      {
        to: '/app/inspections',
        group: 'Tugas Utama',
        label: 'Form Pengujian',
        icon: FileText
      },
      {
        to: '/app/history',
        group: 'Arsip & Dokumen',
        label: 'Riwayat Pekerjaan',
        icon: ClockCounterClockwise
      },
      {
        to: '/app/settings',
        group: 'Akun',
        label: 'Pengaturan Akun',
        icon: Gear
      }
    ];
  }

  // 2. Menu khusus Pimpinan / Manager: Monitoring Eksekutif Read-Only
  if (['PIMPINAN', 'MANAGER'].includes(role)) {
    return [
      {
        to: '/app/dashboard',
        group: 'Eksekutif',
        label: 'Dasbor Eksekutif',
        icon: Gauge
      },
      {
        to: '/app/orders',
        group: 'Monitoring Operasional',
        label: 'Monitoring PO & Status',
        icon: ClipboardText
      },
      {
        to: '/app/schedule',
        group: 'Monitoring Operasional',
        label: 'Monitoring Jadwal Tim',
        icon: CalendarCheck
      },
      {
        to: '/app/lhpp',
        group: 'Dokumen & Kepatuhan',
        label: 'Dokumen LHPP & BAP',
        icon: Scroll
      },
      {
        to: '/app/suket',
        group: 'Dokumen & Kepatuhan',
        label: 'Registri Suket K3',
        icon: WarningOctagon
      },
      {
        to: '/app/reminders',
        group: 'Dokumen & Kepatuhan',
        label: 'Pengingat Masa Berlaku',
        icon: ShieldCheck
      },
      {
        to: '/app/audit-logs',
        group: 'Jejak Audit',
        label: 'Log Audit Operasional',
        icon: ClockCounterClockwise
      },
      {
        to: '/app/settings',
        group: 'Akun',
        label: 'Pengaturan Akun',
        icon: Gear
      }
    ];
  }

  // 3. Menu khusus Marketing / Admin Kantor: Tertata rapi per kelompok kerja
  if (['MARKETING', 'ADMIN_KANTOR'].includes(role)) {
    return [
      {
        to: '/app/dashboard',
        group: 'Utama',
        label: 'Dasbor Operasional',
        icon: Gauge
      },
      {
        to: '/app/orders',
        group: 'Order & Klien',
        label: 'PO & Order Pemeriksaan',
        icon: ClipboardText
      },
      {
        to: '/app/clients',
        group: 'Order & Klien',
        label: 'Data Klien',
        icon: Buildings
      },
      {
        to: '/app/objects',
        group: 'Order & Klien',
        label: 'Objek Uji K3',
        icon: Cube
      },
      {
        to: '/app/schedule',
        group: 'Pelaksanaan',
        label: 'Jadwal & Penugasan',
        icon: CalendarCheck
      },
      {
        to: '/app/lhpp',
        group: 'Penerbitan Dokumen',
        label: 'Penerbitan Dokumen (LHPP)',
        icon: Scroll
      },
      {
        to: '/app/bap',
        group: 'Penerbitan Dokumen',
        label: 'Berita Acara (BAP)',
        icon: ClipboardText
      },
      {
        to: '/app/distributions',
        group: 'Penerbitan Dokumen',
        label: 'Distribusi Dokumen',
        icon: ShareNetwork
      },
      {
        to: '/app/suket',
        group: 'Pemantauan',
        label: 'Registri Suket K3',
        icon: WarningOctagon
      },
      {
        to: '/app/reminders',
        group: 'Pemantauan',
        label: 'Pengingat Perpanjangan',
        icon: ShieldCheck
      },
      {
        to: '/app/settings',
        group: 'Akun',
        label: 'Pengaturan Akun',
        icon: Gear
      }
    ];
  }

  // 4. Admin Sistem: Navigasi lengkap untuk semua modul sistem
  return NAV_ITEMS.filter((item) => {
    const alias = ROLE_ALIASES[role];
    return item.roles.includes(role) || (alias && item.roles.includes(alias));
  });
}
