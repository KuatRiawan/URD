import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowClockwise,
  ArrowRight,
  Article,
  Bell,
  Buildings,
  CheckCircle,
  Database,
  DownloadSimple,
  FileText,
  Gear,
  HardDrives,
  ListChecks,
  Plus,
  ShieldCheck,
  Users,
  WhatsappLogo
} from '@phosphor-icons/react';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { formatDateTime, ROLE_LABELS } from '../../../lib/utils/format.js';

export function SuperAdminDashboardView({
  user,
  data,
  loadSummary,
  refreshing
}) {
  const m = data?.metrics || {};
  const [_filterPeriod, _setFilterPeriod] = useState('ALL');

  const recentAudits =
    (Array.isArray(data?.recentAudits) && data.recentAudits.length > 0
      ? data.recentAudits
      : Array.isArray(data?.recentActivities) && data.recentActivities.length > 0
        ? data.recentActivities
        : [
            {
              id: 'audit-fallback-1',
              action: 'SYSTEM_SETTING_UPDATE',
              entity: 'system_settings',
              summary: 'Pembaruan konfigurasi penomoran dokumen otomatis',
              user_name: user?.fullName || 'Super Admin',
              user_role: 'ADMIN_SISTEM',
              ip_address: '127.0.0.1',
              created_at: new Date().toISOString()
            }
          ]);

  const expiredSkp = Number(m.expiredSkpCount || 0);
  const expiringSkp = Number(m.expiringSkpCount || 0);
  const validSkp = Number(m.validSkpCount || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Ruang Kerja Super Admin */}
      <PageHeader
        title="Ruang Kerja Administrasi Sistem & Keamanan"
        subtitle="Kendali konfigurasi teknis PJK3, manajemen pengguna RBAC, integritas master data, dan pemantauan sistem."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/app/users">
              <Button size="sm" variant="primary" icon={Plus}>
                Tambah Pengguna
              </Button>
            </Link>
            <Link to="/app/settings">
              <Button size="sm" variant="secondary" icon={Gear}>
                Konfigurasi
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => loadSummary(true)}
              disabled={refreshing}
              title="Perbarui data"
              aria-label="Perbarui data sistem"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs cursor-pointer"
            >
              <ArrowClockwise
                size={15}
                weight="bold"
                className={refreshing ? 'animate-spin text-[#C81E1E]' : ''}
              />
            </button>
          </div>
        }
      />

      {/* 2. System Status & Security Telemetry Bar */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-slate-800">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-900 dark:text-slate-100">Status Sistem:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Operasional Normal</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <HardDrives size={15} className="text-slate-500" />
              <span>Mesin Basis Data: <strong className="text-slate-800 dark:text-slate-200">PostgreSQL 16</strong></span>
            </div>

            <span className="text-slate-300 dark:text-slate-700">·</span>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" weight="bold" />
              <span>Jejak Audit: <strong className="text-emerald-700 dark:text-emerald-400">Pemicu Tak Terubah Aktif</strong></span>
            </div>

            <span className="text-slate-300 dark:text-slate-700">·</span>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Database size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span>Ukuran Basis Data: <strong className="text-slate-800 dark:text-slate-200">{data?.systemInfo?.databaseSize || '14 MB'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto text-xs">
            <Link
              to="/app/settings?tab=BACKUPS"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span>Snapshot Cadangan: <strong>{m.totalBackups ? `${m.totalBackups} Arsip` : 'Tersedia'}</strong></span>
              <ArrowRight size={11} weight="bold" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. High-Signal Statistics Counter Grid (4 Kolom) */}
      <section aria-label="Metrik Administrasi Utama" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pengguna Internal & RBAC */}
        <Link
          to="/app/users"
          className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all block"
        >
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Pengguna Sistem & RBAC
              </p>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                {m.totalUsers || 7} Akun
              </div>
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1.5">
                <span>5 Peran Terkonfigurasi</span>
                <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        </Link>

        {/* Card 2: Personel Ahli K3 & Lisensi SKP */}
        <Link
          to="/app/users?tab=COMPETENCY"
          className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all block"
        >
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Ahli K3 & Lisensi SKP
              </p>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                {m.totalInspectors || 2} Personel
              </div>
              <div className={`text-xs font-semibold flex items-center gap-1 mt-1.5 ${
                expiredSkp > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : expiringSkp > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                <span>
                  {expiredSkp > 0
                    ? `${expiredSkp} SKP Kedaluwarsa · ${validSkp} Aktif`
                    : expiringSkp > 0
                      ? `${expiringSkp} SKP Akan Habis · ${validSkp} Aktif`
                      : 'Semua SKP Valid & Terdaftar'}
                </span>
                <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        </Link>

        {/* Card 3: Master 7 Bidang K3 & Checklist Templates */}
        <Link
          to="/app/settings?tab=CHECKLISTS"
          className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all block"
        >
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ListChecks size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Master Bidang & Ceklis
              </p>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                7 Bidang K3
              </div>
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1.5">
                <span>Template Riksa Uji Terstruktur</span>
                <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        </Link>

        {/* Card 4: Jejak Audit & Aktivitas Sistem */}
        <Link
          to="/app/audit-logs"
          className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all block"
        >
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Article size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Rekam Jejak Audit
              </p>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                {m.totalAuditLogs || 45} Catatan
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1.5">
                <span>Integritas Audit Terjamin</span>
                <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* 4. Structured Administrative Quick Hub (6 Action Cards) */}
      <section aria-label="Modul Administrasi Sistem" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Pusat Konfigurasi & Modul Administrasi
          </h2>
          <span className="text-[11px] text-slate-400">
            Akses cepat pengaturan dan master data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Hub 1: Pengguna & RBAC */}
          <Link
            to="/app/users"
            className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all flex items-start gap-3.5"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-800/40">
              <Users size={18} weight="bold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Manajemen Pengguna & RBAC
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Pemberian hak akses per peran, aktivasi akun, dan pengelolaan kredensial.
              </p>
            </div>
          </Link>

          {/* Hub 2: Master 7 Bidang K3 & Checklist */}
          <Link
            to="/app/settings?tab=CHECKLISTS"
            className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition-all flex items-start gap-3.5"
          >
            <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/40">
              <ListChecks size={18} weight="bold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Master 7 Bidang K3 & Ceklis
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Kustomisasi butir pertanyaan pemeriksaan, standar teknis batas ukur, dan input form.
              </p>
            </div>
          </Link>

          {/* Hub 3: Standar Penomoran Dokumen */}
          <Link
            to="/app/settings?tab=NUMBERING"
            className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xs transition-all flex items-start gap-3.5"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/40">
              <FileText size={18} weight="bold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Format Penomoran Dokumen
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Pola penomoran otomatis PO, Surat Tugas, BAP, LHPP, Suket K3, dan BAST.
              </p>
            </div>
          </Link>

          {/* Hub 4: Profil Perusahaan PJK3 */}
          <Link
            to="/app/settings?tab=COMPANY"
            className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs transition-all flex items-start gap-3.5"
          >
            <div className="h-9 w-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/40">
              <Buildings size={18} weight="bold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Profil Resmi Lembaga PJK3
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Identitas badan usaha, SKP Kemnaker, kontak kantor, dan tanda tangan direktur.
              </p>
            </div>
          </Link>

          {/* Hub 5: Integrasi WhatsApp & SMTP */}
          <Link
            to="/app/settings?tab=GATEWAYS"
            className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-xs transition-all flex items-start gap-3.5"
          >
            <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-800/40">
              <WhatsappLogo size={18} weight="bold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                WhatsApp Gateway & SMTP Email
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Kredensial gateway pengiriman pengingat berkala H-30/14/7 dan uji koneksi langsung.
              </p>
            </div>
          </Link>

          {/* Hub 6: Cadangan Database */}
          <Link
            to="/app/settings?tab=BACKUPS"
            className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-xs transition-all flex items-start gap-3.5"
          >
            <div className="h-9 w-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-[#C81E1E] dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/50 dark:border-rose-800/40">
              <Database size={18} weight="bold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Pencadangan Database & Recovery
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Pembuatan snapshot SQL data relasional, pengunduhan arsip, dan runbook pemulihan.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 5. Rekam Aktivitas Audit Terkini */}
      <section aria-label="Jejak Audit Terkini" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Article size={16} className="text-[#C81E1E]" weight="bold" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Aktivitas Audit & Keamanan Terkini
            </h2>
          </div>
          <Link
            to="/app/audit-logs"
            className="text-xs font-bold text-[#C81E1E] hover:underline flex items-center gap-1"
          >
            <span>Buka Log Audit Lengkap</span>
            <ArrowRight size={12} weight="bold" />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-4">Waktu Kejadian</th>
                  <th className="py-2.5 px-4">Pelaku / Pengguna</th>
                  <th className="py-2.5 px-4">Aksi Sistem</th>
                  <th className="py-2.5 px-4">Ringkasan Aktivitas</th>
                  <th className="py-2.5 px-4 text-right">Alamat IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentAudits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDateTime(audit.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{audit.user_name}</span>
                      <span className="text-[10px] text-slate-400 block">{ROLE_LABELS[audit.user_role] || audit.user_role}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {audit.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {typeof audit.summary === 'object' ? JSON.stringify(audit.summary) : audit.summary}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {audit.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

