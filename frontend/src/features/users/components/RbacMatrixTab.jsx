import React, { Fragment } from 'react';
import {
  CheckCircle,
  Eye,
  Lock,
  PencilSimple,
  ShieldCheck,
  WarningCircle
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';

export function RbacMatrixTab() {
  const roles = [
    {
      code: 'ADMIN_SISTEM',
      name: 'Super Admin',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      description: 'Pengendali seluruh konfigurasi teknis sistem, manajemen akun pengguna, template ceklis, gateway integrasi, dan pemulihan data.'
    },
    {
      code: 'ADMIN_KANTOR',
      name: 'Admin Kantor (Operasional)',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      description: 'Koordinator operasional kantor: penjadwalan Ahli K3, review QC teknis LHPP, administrasi registrasi Suket K3 Disnaker, dan distribusi BAST.'
    },
    {
      code: 'AHLI_K3',
      name: 'Ahli K3 (Inspector)',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      description: 'Tenaga ahli lapangan bersertifikat Kemnaker: pemeriksaan visual, pengujian fungsi, pengukuran teknis, foto temuan, dan penandatanganan digital BAP.'
    },
    {
      code: 'PIMPINAN',
      name: 'Pimpinan / Manager',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      description: 'Monitoring eksekutif: pemantauan SLA siklus order, beban kerja Ahli K3, kepatuhan masa berlaku Suket, dan pengawasan audit trail independen.'
    },
    {
      code: 'MARKETING',
      name: 'Marketing (Komersial)',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      description: 'Manajemen hubungan klien (CRM), pencatatan PO & daftar unit riksa uji, pemantauan status order komersial, dan tindak lanjut perpanjangan Suket.'
    }
  ];

  const modules = [
    {
      category: 'Operasional Lapangan & PO',
      items: [
        {
          name: 'PO & Order Pemeriksaan',
          desc: 'Input PO, registrasi unit alat, dan pantau progres order',
          permissions: {
            ADMIN_SISTEM: { level: 'Penuh (CRUD)', tone: 'full' },
            ADMIN_KANTOR: { level: 'Kelola & Pantau', tone: 'manage' },
            AHLI_K3: { level: 'Lihat Ditugaskan', tone: 'view' },
            PIMPINAN: { level: 'Monitoring (Read-only)', tone: 'view' },
            MARKETING: { level: 'Buat & Edit PO', tone: 'manage' }
          }
        },
        {
          name: 'Jadwal & Penugasan Ahli K3',
          desc: 'Plotting jadwal riksa uji & verifikasi kompetensi SKP',
          permissions: {
            ADMIN_SISTEM: { level: 'Penuh (CRUD)', tone: 'full' },
            ADMIN_KANTOR: { level: 'Kelola Penugasan', tone: 'manage' },
            AHLI_K3: { level: 'Lihat Jadwal Saya', tone: 'view' },
            PIMPINAN: { level: 'Monitoring (Read-only)', tone: 'view' },
            MARKETING: { level: 'Lihat Estimasi', tone: 'view' }
          }
        },
        {
          name: 'Objek Uji K3 (Database Alat)',
          desc: 'Master data unit alat, nameplate, dan riwayat sertifikasi',
          permissions: {
            ADMIN_SISTEM: { level: 'Penuh (CRUD)', tone: 'full' },
            ADMIN_KANTOR: { level: 'Kelola Data Unit', tone: 'manage' },
            AHLI_K3: { level: 'Lihat & Verifikasi', tone: 'view' },
            PIMPINAN: { level: 'Monitoring (Read-only)', tone: 'view' },
            MARKETING: { level: 'Registrasi Unit Baru', tone: 'manage' }
          }
        },
        {
          name: 'Formulir Inspeksi Lapangan',
          desc: 'Entry checklist, input pengukuran teknis, foto temuan & TTD BAP',
          permissions: {
            ADMIN_SISTEM: { level: 'Penuh (CRUD)', tone: 'full' },
            ADMIN_KANTOR: { level: 'Review & Kembalikan', tone: 'manage' },
            AHLI_K3: { level: 'Entry & TTD Digital', tone: 'manage' },
            PIMPINAN: { level: 'Akses Ditolak', tone: 'denied' },
            MARKETING: { level: 'Akses Ditolak', tone: 'denied' }
          }
        }
      ]
    },
    {
      category: 'Dokumen Resmi & Sertifikasi',
      items: [
        {
          name: 'Dokumen LHPP (Laporan Riksa Uji)',
          desc: 'QC teknis, pratinjau draft, dan penerbitan dokumen resmi PDF/DOCX',
          permissions: {
            ADMIN_SISTEM: { level: 'Penuh (CRUD)', tone: 'full' },
            ADMIN_KANTOR: { level: 'Review QC & Terbitkan', tone: 'manage' },
            AHLI_K3: { level: 'Input Draft & Tinjau', tone: 'view' },
            PIMPINAN: { level: 'Monitoring (Read-only)', tone: 'view' },
            MARKETING: { level: 'Akses Ditolak', tone: 'denied' }
          }
        },
        {
          name: 'Berita Acara Pemeriksaan (BAP)',
          desc: 'Tanda tangan digital saksi klien & Inspector sesaat selesai riksa',
          permissions: {
            ADMIN_SISTEM: { level: 'Penuh (CRUD)', tone: 'full' },
            ADMIN_KANTOR: { level: 'Verifikasi & Unduh', tone: 'manage' },
            AHLI_K3: { level: 'TTD Lapangan', tone: 'manage' },
            PIMPINAN: { level: 'Monitoring (Read-only)', tone: 'view' },
            MARKETING: { level: 'Akses Ditolak', tone: 'denied' }
          }
        },
        {
          name: 'Registri Suket K3 Disnaker',
          desc: 'Pencatatan nomor surat keterangan resmi dan masa berlaku',
          permissions: {
            ADMIN_SISTEM: { level: 'Penuh (CRUD)', tone: 'full' },
            ADMIN_KANTOR: { level: 'Input & Registrasi', tone: 'manage' },
            AHLI_K3: { level: 'Akses Ditolak', tone: 'denied' },
            PIMPINAN: { level: 'Monitoring (Read-only)', tone: 'view' },
            MARKETING: { level: 'Lihat Status Terbit', tone: 'view' }
          }
        },
        {
          name: 'Distribusi Dokumen & BAST',
          desc: 'Ekspedisi berkas fisik/digital & konfirmasi serah terima klien',
          permissions: {
            ADMIN_SISTEM: { level: 'Penuh (CRUD)', tone: 'full' },
            ADMIN_KANTOR: { level: 'Kelola Pengiriman', tone: 'manage' },
            AHLI_K3: { level: 'Akses Ditolak', tone: 'denied' },
            PIMPINAN: { level: 'Monitoring (Read-only)', tone: 'view' },
            MARKETING: { level: 'Akses Ditolak', tone: 'denied' }
          }
        }
      ]
    },
    {
      category: 'Tata Kelola Sistem & Keamanan',
      items: [
        {
          name: 'Manajemen Pengguna & RBAC',
          desc: 'Pemberian role, aktivasi akun, dan reset sandi internal',
          permissions: {
            ADMIN_SISTEM: { level: 'Penuh (CRUD)', tone: 'full' },
            ADMIN_KANTOR: { level: 'Akses Ditolak', tone: 'denied' },
            AHLI_K3: { level: 'Akses Ditolak', tone: 'denied' },
            PIMPINAN: { level: 'Akses Ditolak', tone: 'denied' },
            MARKETING: { level: 'Akses Ditolak', tone: 'denied' }
          }
        },
        {
          name: 'Log Audit Operasional',
          desc: 'Jejak audit kronologis seluruh aksi, login, dan mutasi data',
          permissions: {
            ADMIN_SISTEM: { level: 'Audit Penuh & Filter', tone: 'full' },
            ADMIN_KANTOR: { level: 'Akses Ditolak', tone: 'denied' },
            AHLI_K3: { level: 'Akses Ditolak', tone: 'denied' },
            PIMPINAN: { level: 'Audit Oversight (View)', tone: 'view' },
            MARKETING: { level: 'Akses Ditolak', tone: 'denied' }
          }
        },
        {
          name: 'Konfigurasi Sistem & Backup',
          desc: 'Template ceklis, penomoran dokumen, profil PJK3, gateway, backup SQL',
          permissions: {
            ADMIN_SISTEM: { level: 'Penuh (CRUD)', tone: 'full' },
            ADMIN_KANTOR: { level: 'Lihat Format Dokumen', tone: 'view' },
            AHLI_K3: { level: 'Akses Ditolak', tone: 'denied' },
            PIMPINAN: { level: 'Akses Ditolak', tone: 'denied' },
            MARKETING: { level: 'Akses Ditolak', tone: 'denied' }
          }
        }
      ]
    }
  ];

  const getBadgeClass = (tone) => {
    switch (tone) {
      case 'full':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'manage':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'view':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
      case 'denied':
      default:
        return 'bg-rose-50/60 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 opacity-70';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Pengantar Model Keamanan RBAC URD */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#C81E1E]" weight="bold" />
            <CardTitle>Arsitektur Keamanan Peran & Hak Akses (Role-Based Access Control)</CardTitle>
          </div>
          <CardDescription>
            Sistem operasional PT Upaya Riksa Daya menerapkan prinsip pemisahan tugas (Separation of Duties). Setiap tindakan dan akses data diatur secara ketat di backend melalui middleware otentikasi JWT dan otorisasi peran.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {roles.map((r) => (
              <div
                key={r.code}
                className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {r.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${r.badge}`}>
                    {r.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {r.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
            <CheckCircle size={16} className="text-blue-600 shrink-0 mt-0.5" weight="fill" />
            <div>
              <strong className="block font-semibold">Integritas Keamanan Server-Side:</strong>
              <span>
                Penyembunyian antarmuka pada sisi frontend hanyalah bentuk kenyamanan navigasi. Seluruh validasi izin akses sesungguhnya diberlakukan secara independen di API backend Express menggunakan <code className="font-mono text-blue-700 dark:text-blue-200">authorize('ADMIN_SISTEM', ...)</code>.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Matriks Hak Akses Antarmodul */}
      <Card>
        <CardHeader>
          <CardTitle>Matriks Distribusi Hak Akses Antarmodul</CardTitle>
          <CardDescription>
            Daftar kewenangan operasional per modul untuk setiap peran dalam alur kerja Riksa Uji K3.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 min-w-[240px]">Modul Operasional</th>
                  <th className="py-3 px-3 min-w-[140px] text-center">Super Admin</th>
                  <th className="py-3 px-3 min-w-[140px] text-center">Admin Kantor</th>
                  <th className="py-3 px-3 min-w-[140px] text-center">Ahli K3</th>
                  <th className="py-3 px-3 min-w-[140px] text-center">Pimpinan</th>
                  <th className="py-3 px-3 min-w-[140px] text-center">Marketing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {modules.map((group, gIdx) => (
                  <React.Fragment key={`group-${gIdx}`}>
                    <tr>
                      <td
                        colSpan={6}
                        className="bg-slate-50 dark:bg-slate-850 px-4 py-2 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-t border-b border-slate-200/80 dark:border-slate-800"
                      >
                        {group.category}
                      </td>
                    </tr>
                    {group.items.map((item, iIdx) => (
                      <tr
                        key={`item-${gIdx}-${iIdx}`}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {item.desc}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${getBadgeClass(item.permissions.ADMIN_SISTEM.tone)}`}>
                            {item.permissions.ADMIN_SISTEM.level}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${getBadgeClass(item.permissions.ADMIN_KANTOR.tone)}`}>
                            {item.permissions.ADMIN_KANTOR.level}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${getBadgeClass(item.permissions.AHLI_K3.tone)}`}>
                            {item.permissions.AHLI_K3.level}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${getBadgeClass(item.permissions.PIMPINAN.tone)}`}>
                            {item.permissions.PIMPINAN.level}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${getBadgeClass(item.permissions.MARKETING.tone)}`}>
                            {item.permissions.MARKETING.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
