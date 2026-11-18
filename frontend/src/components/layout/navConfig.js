import {
  Alarm,
  Article,
  Bell,
  Buildings,
  CalendarCheck,
  ClipboardText,
  ClockCounterClockwise,
  Cube,
  FileText,
  Gauge,
  Gear,
  ListChecks,
  Scroll,
  ShareNetwork,
  ShieldCheck,
  Users,
  WarningOctagon
} from '@phosphor-icons/react';

export const ROLE_ALIASES = {
  AHLI_K3: 'INSPECTOR',
  INSPECTOR: 'AHLI_K3',
  MANAGER: 'PIMPINAN',
  PIMPINAN: 'MANAGER'
};

export const PO_SUBMENUS = [
  { to: '/app/orders', label: 'Semua PO', statusKey: '', isDefault: true },
  { to: '/app/orders?status=ORDER_BARU', label: 'PO Baru', statusKey: 'ORDER_BARU' },
  { to: '/app/orders?status=TERJADWAL', label: 'Terjadwal', statusKey: 'TERJADWAL' },
  { to: '/app/orders?status=SEDANG_DIPERIKSA', label: 'Diperiksa', statusKey: 'SEDANG_DIPERIKSA' },
  { to: '/app/orders?status=MENUNGGU_DOKUMEN', label: 'Tunggu Dokumen', statusKey: 'MENUNGGU_DOKUMEN' },
  { to: '/app/orders?status=SELESAI', label: 'Selesai', statusKey: 'SELESAI' }
];

export const EXECUTIVE_DASHBOARD_SUBMENUS = [
  { to: '/app/dashboard?tab=overview', label: 'Ringkasan Eksekutif', isDefault: true },
  { to: '/app/dashboard?tab=orders', label: 'Monitoring PO & Unit' },
  { to: '/app/dashboard?tab=workload', label: 'Beban Kerja Tim K3' },
  { to: '/app/dashboard?tab=documents', label: 'Dokumen & Kepatuhan' },
  { to: '/app/dashboard?tab=activities', label: 'Jejak Aktivitas' }
];

export const SCHEDULE_SUBMENUS = [
  { to: '/app/schedule', label: 'Semua Agenda', isDefault: true },
  { to: '/app/schedule?status=CONFIRMED', label: 'Terkonfirmasi' },
  { to: '/app/schedule?status=PENDING', label: 'Menunggu Respon' },
  { to: '/app/schedule?status=REJECTED', label: 'Perlu Re-alokasi' }
];

export const INSPECTION_SUBMENUS = [
  { to: '/app/inspections?tab=worksheets', label: 'Lembar Kerja', isDefault: true },
  { to: '/app/inspections?tab=templates', label: 'Master Template' }
];

export const LHPP_SUBMENUS = [
  { to: '/app/lhpp', label: 'Semua Dokumen', isDefault: true },
  { to: '/app/lhpp?status=SIAP_PREVIEW', label: 'Menunggu QC' },
  { to: '/app/lhpp?status=DIKEMBALIKAN', label: 'Dalam Revisi' },
  { to: '/app/lhpp?status=DRAF', label: 'Draf' },
  { to: '/app/lhpp?status=FINAL', label: 'Final / Terbit' }
];

export const BAP_SUBMENUS = [
  { to: '/app/bap', label: 'Semua BAP', isDefault: true },
  { to: '/app/bap?status=DRAF', label: 'Draf BAP' },
  { to: '/app/bap?status=FINAL', label: 'BAP Final' }
];

export const DISTRIBUTION_SUBMENUS = [
  { to: '/app/distributions', label: 'Semua Distribusi', isDefault: true },
  { to: '/app/distributions?status=SIAP_DIKIRIM', label: 'Siap Dikirim', aliases: ['menunggu_pengiriman'] },
  { to: '/app/distributions?status=DIKIRIM', label: 'Dalam Pengiriman' },
  { to: '/app/distributions?status=DITERIMA', label: 'Diterima' }
];

export const SUKET_SUBMENUS = [
  { to: '/app/suket', label: 'Semua Suket', isDefault: true },
  { to: '/app/suket?status=BERKAS_DISIAPKAN', label: 'Proses Berkas' },
  { to: '/app/suket?status=DIAJUKAN', label: 'Di Disnaker' },
  { to: '/app/suket?status=TERBIT', label: 'Suket Terbit' },
  { to: '/app/suket?status=EXPIRING_SOON', label: 'Segera Habis' }
];

export const ISSUE_SUBMENUS = [
  { to: '/app/issues', label: 'Semua Kendala', isDefault: true },
  { to: '/app/issues?tab=ACTION_NEEDED', label: 'Perlu Tindak Lanjut' },
  { to: '/app/issues?tab=HIGH_PRIORITY', label: 'Prioritas Tinggi' },
  { to: '/app/issues?tab=RESOLVED', label: 'Selesai' }
];

export const USERS_SUBMENUS = [
  { to: '/app/users?tab=users', label: 'Daftar Akun Pengguna', isDefault: true },
  { to: '/app/users?tab=rbac_matrix', label: 'Matriks Peran & Hak Akses', aliases: ['rbac'] },
  { to: '/app/users?tab=competencies', label: 'Kredensial Ahli K3 & SKP', aliases: ['competency'] }
];

export const AUDIT_SUBMENUS = [
  { to: '/app/audit-logs', label: 'Semua Aktivitas', isDefault: true },
  { to: '/app/audit-logs?category=AUTH', label: 'Autentikasi & Akun' },
  { to: '/app/audit-logs?category=ORDER', label: 'PO & Order Riksa' },
  { to: '/app/audit-logs?category=INSP', label: 'Inspeksi & QC' },
  { to: '/app/audit-logs?category=LHPP', label: 'LHPP & Suket K3' },
  { to: '/app/audit-logs?category=SYSTEM', label: 'Konfigurasi & Master' }
];

export const REMINDER_SUBMENUS = [
  { to: '/app/reminders?tab=expiring', label: 'Jatuh Tempo Suket', isDefault: true },
  { to: '/app/reminders?tab=log', label: 'Pengiriman Klien' },
  { to: '/app/reminders?tab=missing', label: 'Tanpa Tanggal Berlaku' },
  { to: '/app/reminders?tab=skp', label: 'SKP Ahli K3' },
  { to: '/app/reminders?tab=all', label: 'Semua Data' }
];

const ROLE_TAB_TITLES = {
  ADMIN_SISTEM: 'Konfigurasi Sistem PJK3',
  AHLI_K3: 'Kredensial Ahli K3',
  INSPECTOR: 'Kredensial Ahli K3',
  ADMIN_KANTOR: 'Operasional Kantor',
  PIMPINAN: 'Kebijakan & Approval',
  MANAGER: 'Kebijakan & Approval',
  MARKETING: 'Kewenangan Komersial'
};

export const SYSTEM_CONFIG_SUBMENUS = [
  {
    to: '/app/settings?tab=role_specific&subtab=company_profile',
    label: 'Profil Lembaga PJK3',
    aliases: ['company', 'company_profile', 'role_specific'],
    isDefault: true
  },
  {
    to: '/app/settings?tab=role_specific&subtab=checklists',
    label: 'Checklist Pemeriksaan',
    aliases: ['checklists']
  },
  {
    to: '/app/settings?tab=role_specific&subtab=equipment_master',
    label: 'Katalog Klasifikasi Alat',
    aliases: ['equipment', 'equipment_master']
  },
  {
    to: '/app/settings?tab=role_specific&subtab=lhpp_templates',
    label: 'Template Dokumen LHPP',
    aliases: ['lhpp', 'lhpp_templates']
  },
  {
    to: '/app/settings?tab=role_specific&subtab=numbering',
    label: 'Format Nomor Dokumen',
    aliases: ['numbering']
  },
  {
    to: '/app/settings?tab=role_specific&subtab=gateways',
    label: 'Gateway WA & SMTP',
    aliases: ['gateways']
  },
  {
    to: '/app/settings?tab=role_specific&subtab=reminders',
    label: 'Template Pengingat',
    aliases: ['reminders']
  },
  {
    to: '/app/settings?tab=role_specific&subtab=backups',
    label: 'Cadangan Database',
    aliases: ['backups']
  },
  {
    to: '/app/settings?tab=role_specific&subtab=system_info',
    label: 'Integritas Sistem',
    aliases: ['system', 'system_info']
  }
];

export function getSettingsSubmenus(role) {
  const isAdmin = role === 'ADMIN_SISTEM';
  const roleConfigItem = {
    to: '/app/settings?tab=role_specific',
    label: ROLE_TAB_TITLES[role] || 'Konfigurasi Peran',
    isDefault: isAdmin
  };

  if (isAdmin) {
    roleConfigItem.submenus = SYSTEM_CONFIG_SUBMENUS;
  }

  return [
    { to: '/app/settings?tab=profile', label: 'Profil Saya', isDefault: !isAdmin },
    { to: '/app/settings?tab=security', label: 'Keamanan & Sandi' },
    { to: '/app/settings?tab=appearance', label: 'Tampilan & Tema' },
    roleConfigItem
  ];
}

/**
 * Menempelkan submenu navigasi pada item sidebar agar seluruh sub-halaman
 * (tab yang dulu tampil di dalam halaman) dapat diakses dari sidebar.
 */
export function attachSubmenus(item, role) {
  const byPath = {
    '/app/dashboard': ['PIMPINAN', 'MANAGER'].includes(role) ? EXECUTIVE_DASHBOARD_SUBMENUS : null,
    '/app/orders': PO_SUBMENUS,
    '/app/schedule': SCHEDULE_SUBMENUS,
    '/app/inspections': INSPECTION_SUBMENUS,
    '/app/lhpp': LHPP_SUBMENUS,
    '/app/bap': BAP_SUBMENUS,
    '/app/distributions': DISTRIBUTION_SUBMENUS,
    '/app/suket': SUKET_SUBMENUS,
    '/app/reminders': REMINDER_SUBMENUS,
    '/app/issues': ISSUE_SUBMENUS,
    '/app/users': USERS_SUBMENUS,
    '/app/audit-logs': AUDIT_SUBMENUS,
    '/app/settings': getSettingsSubmenus(role)
  };

  const submenus = byPath[item.to];
  return submenus ? { ...item, submenus } : item;
}

/**
 * Menentukan submenu sidebar yang sedang aktif berdasarkan path dan query-nya.
 * Submenu dengan query paling spesifik menang atas submenu tanpa query.
 * Bila halaman dibuka tanpa parameter sub-halaman, submenu bertanda `isDefault`
 * (sub-halaman yang otomatis tampil) yang disorot agar navigasi tidak buta.
 */
export function resolveActiveSubmenu(submenus = [], location) {
  const current = new URLSearchParams(location.search);
  const rawTab = (current.get('tab') || '').toLowerCase();
  const rawSubtab = (current.get('subtab') || '').toLowerCase();
  const rawStatus = (current.get('status') || '').toLowerCase();
  const isPersonalSettingsTab =
    location.pathname === '/app/settings' && ['profile', 'security', 'appearance'].includes(rawTab);

  let bestTo = null;
  let bestScore = -1;

  for (const sub of submenus) {
    if (!sub?.to || sub.header) continue;

    if (Array.isArray(sub.submenus) && sub.submenus.length > 0 && !isPersonalSettingsTab) {
      const nestedMatch = resolveActiveSubmenu(sub.submenus, location);
      if (nestedMatch && 1 > bestScore) {
        bestScore = 1;
        bestTo = sub.to;
      }
    }

    const [pathname, search = ''] = sub.to.split('?');
    if (location.pathname !== pathname) continue;

    const params = new URLSearchParams(search);
    let matched = true;
    for (const [key, value] of params.entries()) {
      if ((current.get(key) || '').toLowerCase() !== value.toLowerCase()) {
        matched = false;
        break;
      }
    }

    let score = matched ? [...params.keys()].length : -1;

    if (!matched && Array.isArray(sub.aliases)) {
      const candidate = rawSubtab || (isPersonalSettingsTab ? '' : rawTab) || rawStatus;
      if (candidate && sub.aliases.includes(candidate)) {
        matched = true;
        score = Math.max([...params.keys()].length, 1);
      }
    }

    if (!matched) continue;

    if (score > bestScore) {
      bestScore = score;
      bestTo = sub.to;
    }
  }

  if (!bestTo && !isPersonalSettingsTab) {
    const fallback = submenus.find(
      (sub) => sub?.isDefault && sub.to && sub.to.split('?')[0] === location.pathname
    );
    bestTo = fallback?.to ?? null;
  }

  return bestTo;
}

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
    label: 'PO & Order Masuk',
    icon: ClipboardText,
    submenus: PO_SUBMENUS,
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
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/inspections',
    group: 'Operasional',
    label: 'Form Pengujian Lapangan',
    icon: FileText,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/lhpp',
    group: 'Dokumen & Sertifikasi',
    label: 'Dokumen LHPP',
    icon: Scroll,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/bap',
    group: 'Dokumen & Sertifikasi',
    label: 'Berita Acara (BAP)',
    icon: ClipboardText,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/distributions',
    group: 'Dokumen & Sertifikasi',
    label: 'Distribusi Dokumen',
    icon: ShareNetwork,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN', 'MANAGER']
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
    icon: ShieldCheck,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN', 'MANAGER']
  },
  {
    to: '/app/reminders',
    group: 'Pemantauan',
    label: 'Pengingat Perpanjangan',
    icon: Alarm,
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
    icon: Article,
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

function buildNav(role) {
  if (!role) return [];

  // 1. Menu khusus Inspector / Ahli K3: Fokus alur riksa uji lapangan, agenda, dan pelaporan
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
        to: '/app/schedule',
        group: 'Pelaksanaan Lapangan',
        label: 'Jadwal & Agenda',
        icon: CalendarCheck
      },
      {
        to: '/app/orders',
        group: 'Pelaksanaan Lapangan',
        label: 'PO & Order Masuk',
        icon: ClipboardText,
        submenus: PO_SUBMENUS
      },
      {
        to: '/app/objects',
        group: 'Pelaksanaan Lapangan',
        label: 'Objek Uji K3',
        icon: Cube
      },
      {
        to: '/app/issues',
        group: 'Pelaksanaan Lapangan',
        label: 'Kendala Lapangan',
        icon: WarningOctagon
      },
      {
        to: '/app/bap',
        group: 'Dokumen Teknis',
        label: 'Berita Acara (BAP)',
        icon: ClipboardText
      },
      {
        to: '/app/lhpp',
        group: 'Dokumen Teknis',
        label: 'Dokumen LHPP',
        icon: Scroll
      },
      {
        to: '/app/history',
        group: 'Dokumen Teknis',
        label: 'Riwayat Pekerjaan',
        icon: ClockCounterClockwise
      },
      {
        to: '/app/settings',
        group: 'Akun',
        label: 'Pengaturan Akun & SKP',
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
        label: 'PO & Order Masuk',
        icon: ClipboardText,
        submenus: PO_SUBMENUS
      },
      {
        to: '/app/schedule',
        group: 'Monitoring Operasional',
        label: 'Monitoring Jadwal Tim',
        icon: CalendarCheck
      },
      {
        to: '/app/inspections',
        group: 'Monitoring Operasional',
        label: 'Monitoring Pengujian',
        icon: FileText
      },
      {
        to: '/app/issues',
        group: 'Monitoring Operasional',
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
        icon: ShieldCheck
      },
      {
        to: '/app/reminders',
        group: 'Dokumen & Kepatuhan',
        label: 'Pengingat Masa Berlaku',
        icon: Alarm
      },
      {
        to: '/app/distributions',
        group: 'Dokumen & Kepatuhan',
        label: 'Distribusi Dokumen',
        icon: ShareNetwork
      },
      {
        to: '/app/history',
        group: 'Dokumen & Kepatuhan',
        label: 'Riwayat Pengujian',
        icon: ClockCounterClockwise
      },
      {
        to: '/app/audit-logs',
        group: 'Jejak Audit',
        label: 'Log Audit Operasional',
        icon: Article
      },
      {
        to: '/app/settings',
        group: 'Akun',
        label: 'Pengaturan Akun',
        icon: Gear
      }
    ];
  }

  // 3. Menu Komersial (Marketing): CRM, PO Multi-Unit, Client Relationship, Repeat Order Suket
  if (role === 'MARKETING') {
    return [
      {
        to: '/app/dashboard',
        group: 'Utama',
        label: 'Dasbor Komersial',
        icon: Gauge
      },
      {
        to: '/app/orders',
        group: 'Komersial & CRM',
        label: 'PO & Order Masuk',
        icon: ClipboardText,
        submenus: PO_SUBMENUS
      },
      {
        to: '/app/clients',
        group: 'Komersial & CRM',
        label: 'Data Klien & PIC',
        icon: Buildings
      },
      {
        to: '/app/objects',
        group: 'Komersial & CRM',
        label: 'Basis Objek Uji K3',
        icon: Cube
      },
      {
        to: '/app/reminders',
        group: 'Peluang & Layanan',
        label: 'Pengingat Suket Klien',
        icon: Alarm
      },
      {
        to: '/app/history',
        group: 'Peluang & Layanan',
        label: 'Riwayat Pengujian Klien',
        icon: ClockCounterClockwise
      },
      {
        to: '/app/issues',
        group: 'Peluang & Layanan',
        label: 'Kendala Operasional',
        icon: WarningOctagon
      },
      {
        to: '/app/settings',
        group: 'Akun',
        label: 'Pengaturan Akun',
        icon: Gear
      }
    ];
  }

  // 4. Menu Operasional Kantor (Admin Kantor): Jantung operasional, jadwal, penugasan SKP, QC, registri Suket, BAST
  if (role === 'ADMIN_KANTOR') {
    return [
      {
        to: '/app/dashboard',
        group: 'Utama',
        label: 'Dasbor Operasional',
        icon: Gauge
      },
      {
        to: '/app/orders',
        group: 'Operasional & Jadwal',
        label: 'PO & Order Masuk',
        icon: ClipboardText,
        submenus: PO_SUBMENUS
      },
      {
        to: '/app/schedule',
        group: 'Operasional & Jadwal',
        label: 'Jadwal & Penugasan K3',
        icon: CalendarCheck
      },
      {
        to: '/app/objects',
        group: 'Operasional & Jadwal',
        label: 'Objek Uji K3',
        icon: Cube
      },
      {
        to: '/app/clients',
        group: 'Operasional & Jadwal',
        label: 'Data Klien',
        icon: Buildings
      },
      {
        to: '/app/issues',
        group: 'Operasional & Jadwal',
        label: 'Kendala Lapangan',
        icon: WarningOctagon
      },
      {
        to: '/app/inspections',
        group: 'QC & Penerbitan Dokumen',
        label: 'Tinjauan Hasil Inspeksi',
        icon: FileText
      },
      {
        to: '/app/lhpp',
        group: 'QC & Penerbitan Dokumen',
        label: 'Dokumen LHPP (QC)',
        icon: Scroll
      },
      {
        to: '/app/bap',
        group: 'QC & Penerbitan Dokumen',
        label: 'Berita Acara (BAP)',
        icon: ClipboardText
      },
      {
        to: '/app/suket',
        group: 'QC & Penerbitan Dokumen',
        label: 'Registri Suket Disnaker',
        icon: ShieldCheck
      },
      {
        to: '/app/distributions',
        group: 'QC & Penerbitan Dokumen',
        label: 'Distribusi & BAST',
        icon: ShareNetwork
      },
      {
        to: '/app/history',
        group: 'QC & Penerbitan Dokumen',
        label: 'Riwayat Pengujian',
        icon: ClockCounterClockwise
      },
      {
        to: '/app/reminders',
        group: 'QC & Penerbitan Dokumen',
        label: 'Pengingat Perpanjangan',
        icon: Alarm
      },
      {
        to: '/app/settings',
        group: 'Akun',
        label: 'Pengaturan Akun',
        icon: Gear
      }
    ];
  }

  // 5. Admin Sistem: Navigasi lengkap untuk semua modul sistem
  if (role === 'ADMIN_SISTEM') {
    return [
      {
        to: '/app/dashboard',
        group: 'Utama',
        label: 'Dasbor Sistem',
        icon: Gauge
      },
      {
        to: '/app/users',
        group: 'Administrasi Sistem',
        label: 'Manajemen Pengguna',
        icon: Users
      },
      {
        to: '/app/audit-logs',
        group: 'Administrasi Sistem',
        label: 'Log Audit Lengkap',
        icon: Article
      },
      {
        to: '/app/orders',
        group: 'Operasional Lapangan',
        label: 'PO & Order Masuk',
        icon: ClipboardText,
        submenus: PO_SUBMENUS
      },
      {
        to: '/app/schedule',
        group: 'Operasional Lapangan',
        label: 'Jadwal & Penugasan',
        icon: CalendarCheck
      },
      {
        to: '/app/inspections',
        group: 'Operasional Lapangan',
        label: 'Form Pengujian Lapangan',
        icon: FileText
      },
      {
        to: '/app/objects',
        group: 'Operasional Lapangan',
        label: 'Objek Uji K3',
        icon: Cube
      },
      {
        to: '/app/clients',
        group: 'Operasional Lapangan',
        label: 'Data Klien',
        icon: Buildings
      },
      {
        to: '/app/lhpp',
        group: 'Dokumen & Sertifikasi',
        label: 'Dokumen LHPP',
        icon: Scroll
      },
      {
        to: '/app/bap',
        group: 'Dokumen & Sertifikasi',
        label: 'Berita Acara (BAP)',
        icon: ClipboardText
      },
      {
        to: '/app/distributions',
        group: 'Dokumen & Sertifikasi',
        label: 'Distribusi Dokumen & BAST',
        icon: ShareNetwork
      },
      {
        to: '/app/suket',
        group: 'Dokumen & Sertifikasi',
        label: 'Registri Suket K3',
        icon: ShieldCheck
      },
      {
        to: '/app/history',
        group: 'Dokumen & Sertifikasi',
        label: 'Riwayat Pengujian',
        icon: ClockCounterClockwise
      },
      {
        to: '/app/reminders',
        group: 'Pemantauan & Pengaturan',
        label: 'Pengingat Perpanjangan',
        icon: Alarm
      },
      {
        to: '/app/issues',
        group: 'Pemantauan & Pengaturan',
        label: 'Kendala Operasional',
        icon: WarningOctagon
      },
      {
        to: '/app/settings',
        group: 'Pemantauan & Pengaturan',
        label: 'Pengaturan Sistem',
        icon: Gear
      }
    ];
  }

  // Fallback default berdasarkan roles di NAV_ITEMS
  return NAV_ITEMS.filter((item) => {
    const alias = ROLE_ALIASES[role];
    return item.roles.includes(role) || (alias && item.roles.includes(alias));
  });
}

export function getVisibleNav(role) {
  return buildNav(role).map((item) => attachSubmenus(item, role));
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
            { to: '/app/orders', label: 'PO & Order Masuk', icon: ClipboardText, submenus: PO_SUBMENUS },
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
            { to: '/app/inspections', label: 'Monitoring Pengujian', icon: FileText },
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
            { to: '/app/audit-logs', label: 'Log Audit Operasional', icon: Article },
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
        { to: '/app/audit-logs', label: 'Log Audit', icon: Article }
      ],
      moreGroups: [
        {
          title: 'Master Data & Klien',
          items: [
            { to: '/app/clients', label: 'Data Klien', icon: Buildings },
            { to: '/app/objects', label: 'Objek Uji K3', icon: Cube },
            { to: '/app/settings?tab=role_specific&subtab=equipment_master', label: 'Master Jenis Unit & Bidang', icon: ListChecks }
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

  if (role === 'MARKETING') {
    return {
      primary: [
        { to: '/app/dashboard', label: 'Dasbor', icon: Gauge },
        { to: '/app/orders', label: 'Order PO', icon: ClipboardText },
        { to: '/app/clients', label: 'Data Klien', icon: Buildings },
        { to: '/app/reminders', label: 'Pengingat', icon: Alarm }
      ],
      moreGroups: [
        {
          title: 'Komersial & Objek Uji',
          items: [
            { to: '/app/objects', label: 'Basis Objek Uji K3', icon: Cube },
            { to: '/app/history', label: 'Riwayat Pengujian Klien', icon: ClockCounterClockwise }
          ]
        },
        {
          title: 'Layanan & Kendala',
          items: [
            { to: '/app/issues', label: 'Kendala Operasional', icon: WarningOctagon }
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

  if (role === 'ADMIN_KANTOR') {
    return {
      primary: [
        { to: '/app/dashboard', label: 'Dasbor', icon: Gauge },
        { to: '/app/orders', label: 'PO Masuk', icon: ClipboardText },
        { to: '/app/schedule', label: 'Jadwal K3', icon: CalendarCheck },
        { to: '/app/lhpp', label: 'QC Dokumen', icon: Scroll }
      ],
      moreGroups: [
        {
          title: 'Penerbitan Dokumen & BAST',
          items: [
            { to: '/app/inspections', label: 'Tinjauan Hasil Inspeksi', icon: FileText },
            { to: '/app/bap', label: 'Berita Acara (BAP)', icon: ClipboardText },
            { to: '/app/suket', label: 'Registri Suket Disnaker', icon: ShieldCheck },
            { to: '/app/distributions', label: 'Distribusi & BAST', icon: ShareNetwork },
            { to: '/app/history', label: 'Riwayat Pengujian', icon: ClockCounterClockwise }
          ]
        },
        {
          title: 'Operasional & Master Data',
          items: [
            { to: '/app/objects', label: 'Objek Uji K3', icon: Cube },
            { to: '/app/clients', label: 'Data Klien', icon: Buildings },
            { to: '/app/issues', label: 'Kendala Lapangan', icon: WarningOctagon },
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

  // Fallback default
  return {
    primary: [
      { to: '/app/dashboard', label: 'Dasbor', icon: Gauge },
      { to: '/app/orders', label: 'Purchase Order', icon: ClipboardText },
      { to: '/app/schedule', label: 'Jadwal', icon: CalendarCheck },
      { to: '/app/lhpp', label: 'Dokumen', icon: Scroll }
    ],
    moreGroups: [
      {
        title: 'Operasional & Data Klien',
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
