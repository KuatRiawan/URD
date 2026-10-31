import {
  Alarm,
  Bell,
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
  SquaresFour,
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
    to: '/app/issues',
    group: 'Pemantauan',
    label: 'Kendala Operasional',
    icon: WarningOctagon,
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

  // 1. Menu khusus Inspector / Ahli K3: Fokus alur riksa uji lapangan dan pelaporan
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
        label: 'Form Pengujian Lapangan',
        icon: FileText
      },
      {
        to: '/app/issues',
        group: 'Pelaksanaan',
        label: 'Kendala Lapangan',
        icon: WarningOctagon
      },
      {
        to: '/app/objects',
        group: 'Pelaksanaan',
        label: 'Objek Uji K3',
        icon: Cube
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
        to: '/app/issues',
        group: 'Pelaksanaan',
        label: 'Kendala Operasional',
        icon: WarningOctagon
      },
      {
        to: '/app/objects',
        group: 'Monitoring Operasional',
        label: 'Objek Uji K3',
        icon: Cube
      },
      {
        to: '/app/clients',
        group: 'Monitoring Operasional',
        label: 'Data Klien',
        icon: Buildings
      },
      {
        to: '/app/lhpp',
        group: 'Dokumen & Kepatuhan',
        label: 'Dokumen LHPP & BAP',
        icon: Scroll
      },
      {
        to: '/app/bap',
        group: 'Dokumen & Kepatuhan',
        label: 'Berita Acara (BAP)',
        icon: ClipboardText
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
        to: '/app/distributions',
        group: 'Dokumen & Kepatuhan',
        label: 'Distribusi Dokumen',
        icon: ShareNetwork
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
        to: '/app/issues',
        group: 'Pelaksanaan',
        label: 'Kendala Operasional',
        icon: WarningOctagon
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
        to: '/app/history',
        group: 'Pemantauan',
        label: 'Riwayat Pengujian',
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

  // 4. Admin Sistem: Navigasi lengkap untuk semua modul sistem
  return NAV_ITEMS.filter((item) => {
    const alias = ROLE_ALIASES[role];
    return item.roles.includes(role) || (alias && item.roles.includes(alias));
  });
}

/**
 * Konfigurasi navigasi mobile adaptif per peran:
 * Menyediakan 4 item navigasi primer untuk bottom bar,
 * serta menu sekunder yang dikelompokkan secara terstruktur untuk lembar "Lainnya".
 */
export function getMobileNavConfig(role) {
  if (['AHLI_K3', 'INSPECTOR'].includes(role)) {
    return {
      primary: [
        { to: '/app/dashboard', label: 'Tugas Saya', icon: Gauge },
        { to: '/app/inspections', label: 'Pengujian', icon: FileText },
        { to: '/app/issues', label: 'Kendala', icon: WarningOctagon },
        { to: '/app/history', label: 'Riwayat', icon: ClockCounterClockwise }
      ],
      moreGroups: [
        {
          title: 'Pelaksanaan Lapangan',
          items: [
            { to: '/app/objects', label: 'Objek Uji K3', icon: Cube },
            { to: '/app/orders', label: 'PO & Order Riksa', icon: ClipboardText },
            { to: '/app/schedule', label: 'Jadwal & Agenda', icon: CalendarCheck }
          ]
        },
        {
          title: 'Dokumen Teknis',
          items: [
            { to: '/app/lhpp', label: 'Dokumen LHPP', icon: Scroll },
            { to: '/app/bap', label: 'Berita Acara (BAP)', icon: ClipboardText }
          ]
        },
        {
          title: 'Akun & Notifikasi',
          items: [
            { to: '/app/notifications', label: 'Notifikasi', icon: Bell },
            { to: '/app/settings', label: 'Pengaturan Akun & SKP', icon: Gear }
          ]
        }
      ]
    };
  }

  if (['PIMPINAN', 'MANAGER'].includes(role)) {
    return {
      primary: [
        { to: '/app/dashboard', label: 'Dasbor', icon: Gauge },
        { to: '/app/orders', label: 'Monitoring PO', icon: ClipboardText },
        { to: '/app/schedule', label: 'Jadwal Tim', icon: CalendarCheck },
        { to: '/app/lhpp', label: 'Dokumen', icon: Scroll }
      ],
      moreGroups: [
        {
          title: 'Monitoring Operasional',
          items: [
            { to: '/app/objects', label: 'Objek Uji K3', icon: Cube },
            { to: '/app/clients', label: 'Data Klien', icon: Buildings },
            { to: '/app/issues', label: 'Kendala Operasional', icon: WarningOctagon }
          ]
        },
        {
          title: 'Dokumen & Kepatuhan',
          items: [
            { to: '/app/bap', label: 'Berita Acara (BAP)', icon: ClipboardText },
            { to: '/app/suket', label: 'Registri Suket K3', icon: ShieldCheck },
            { to: '/app/reminders', label: 'Pengingat Masa Berlaku', icon: Alarm },
            { to: '/app/distributions', label: 'Distribusi Dokumen', icon: ShareNetwork },
            { to: '/app/history', label: 'Riwayat Pekerjaan', icon: ClockCounterClockwise }
          ]
        },
        {
          title: 'Pengawasan & Akun',
          items: [
            { to: '/app/audit-logs', label: 'Log Audit Operasional', icon: ClockCounterClockwise },
            { to: '/app/notifications', label: 'Notifikasi', icon: Bell },
            { to: '/app/settings', label: 'Pengaturan Akun', icon: Gear }
          ]
        }
      ]
    };
  }

  if (['ADMIN_SISTEM'].includes(role)) {
    return {
      primary: [
        { to: '/app/dashboard', label: 'Dasbor', icon: Gauge },
        { to: '/app/users', label: 'Pengguna', icon: Users },
        { to: '/app/orders', label: 'PO & Order', icon: ClipboardText },
        { to: '/app/audit-logs', label: 'Log Audit', icon: ClockCounterClockwise }
      ],
      moreGroups: [
        {
          title: 'Master Data & Klien',
          items: [
            { to: '/app/clients', label: 'Data Klien', icon: Buildings },
            { to: '/app/objects', label: 'Objek Uji K3', icon: Cube }
          ]
        },
        {
          title: 'Operasional Lapangan',
          items: [
            { to: '/app/schedule', label: 'Jadwal & Penugasan', icon: CalendarCheck },
            { to: '/app/inspections', label: 'Form Pengujian', icon: FileText }
          ]
        },
        {
          title: 'Dokumen & Distribusi',
          items: [
            { to: '/app/lhpp', label: 'Dokumen LHPP', icon: Scroll },
            { to: '/app/bap', label: 'Berita Acara (BAP)', icon: ClipboardText },
            { to: '/app/distributions', label: 'Distribusi Dokumen', icon: ShareNetwork },
            { to: '/app/history', label: 'Riwayat Pengujian', icon: ClockCounterClockwise }
          ]
        },
        {
          title: 'Kepatuhan & Pengaturan',
          items: [
            { to: '/app/suket', label: 'Registri Suket K3', icon: ShieldCheck },
            { to: '/app/reminders', label: 'Pengingat Perpanjangan', icon: Alarm },
            { to: '/app/issues', label: 'Kendala Operasional', icon: WarningOctagon },
            { to: '/app/notifications', label: 'Notifikasi', icon: Bell },
            { to: '/app/settings', label: 'Pengaturan Sistem', icon: Gear }
          ]
        }
      ]
    };
  }

  // Default: Marketing / Admin Kantor
  return {
    primary: [
      { to: '/app/dashboard', label: 'Dasbor', icon: Gauge },
      { to: '/app/orders', label: 'Purchase Order', icon: ClipboardText },
      { to: '/app/schedule', label: 'Jadwal', icon: CalendarCheck },
      { to: '/app/lhpp', label: 'Dokumen', icon: Scroll }
    ],
    moreGroups: [
      {
        title: 'Data Klien & Alat K3',
        items: [
          { to: '/app/clients', label: 'Data Klien', icon: Buildings },
          { to: '/app/objects', label: 'Objek Uji K3', icon: Cube }
        ]
      },
      {
        title: 'Dokumen & Distribusi',
        items: [
          { to: '/app/bap', label: 'Berita Acara (BAP)', icon: ClipboardText },
          { to: '/app/distributions', label: 'Distribusi Dokumen', icon: ShareNetwork },
          { to: '/app/history', label: 'Riwayat Pengujian', icon: ClockCounterClockwise }
        ]
      },
      {
        title: 'Pemantauan & Kepatuhan',
        items: [
          { to: '/app/issues', label: 'Kendala Operasional', icon: WarningOctagon },
          { to: '/app/suket', label: 'Registri Suket K3', icon: ShieldCheck },
          { to: '/app/reminders', label: 'Pengingat Perpanjangan', icon: Alarm }
        ]
      },
      {
        title: 'Akun & Notifikasi',
        items: [
          { to: '/app/notifications', label: 'Notifikasi', icon: Bell },
          { to: '/app/settings', label: 'Pengaturan Akun', icon: Gear }
        ]
      }
    ]
  };
}

