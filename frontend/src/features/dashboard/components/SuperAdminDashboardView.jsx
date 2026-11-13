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
import { formatAuditAction, formatAuditSummary, groupConsecutiveAudit } from '../../../lib/utils/audit.js';

export function SuperAdminDashboardView({
  user: _user,
  data,
  loadSummary,
  refreshing
}) {
  const m = data?.metrics || {};
  const [_filterPeriod, _setFilterPeriod] = useState('ALL');

  const recentAudits =
    Array.isArray(data?.recentAudits) && data.recentAudits.length > 0
      ? data.recentAudits
      : Array.isArray(data?.recentActivities) && data.recentActivities.length > 0
        ? data.recentActivities
        : [];

  const auditRows = groupConsecutiveAudit(recentAudits);
  const expiredSkp = Number(m.expiredSkpCount || 0);
  const expiringSkp = Number(m.expiringSkpCount || 0);
  const validSkp = Number(m.validSkpCount || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto urd-stagger">
      {/* 1. Header Ruang Kerja Super Admin */}
      <PageHeader
        title="Ruang Kerja Administrasi Sistem & Keamanan"
        subtitle="Kendali akses pengguna RBAC, master data riksa uji K3, dan integritas sistem."
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
      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 pr-3 border-r border-black/[0.08] dark:border-white/[0.08]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Status Sistem:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Operasional Normal</span>
            </div>

            <div className="flex items-center gap-1.5 text-[#6E6E73] dark:text-[#98989D]">
              <HardDrives size={15} className="text-[#6E6E73]" />
              <span>Mesin Basis Data: <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">PostgreSQL 16</strong></span>
            </div>

            <span className="text-black/20 dark:text-white/20">·</span>

            <div className="flex items-center gap-1.5 text-[#6E6E73] dark:text-[#98989D]">
              <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" weight="bold" />
              <span>Jejak Audit: <strong className="text-emerald-700 dark:text-emerald-400">Pemicu Tak Terubah Aktif</strong></span>
            </div>

            <span className="text-black/20 dark:text-white/20">·</span>

            <div className="flex items-center gap-1.5 text-[#6E6E73] dark:text-[#98989D]">
              <Database size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span>Ukuran Basis Data: <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{data?.systemInfo?.databaseSize || '14 MB'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto text-xs">
            <Link
              to="/app/settings?tab=BACKUPS"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] bg-[#F5F5F7] dark:bg-white/[0.06] hover:bg-black/[0.06] transition-colors"
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
          className="group bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.14] transition-all block"
        >
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                Pengguna Sistem & RBAC
              </p>
              <div className="text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none tracking-[-0.02em]">
                {m.totalUsers ?? 0} Akun
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
          className="group bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.14] transition-all block"
        >
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                Ahli K3 & Lisensi SKP
              </p>
              <div className="text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none tracking-[-0.02em]">
                {m.totalInspectors ?? 0} Personel
              </div>
              <div className={`text-xs font-semibold flex items-center gap-1 mt-1.5 ${
                expiredSkp > 0
                  ? 'text-[#C81E1E] dark:text-rose-400'
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
          className="group bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.14] transition-all block"
        >
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ListChecks size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                Master Bidang & Ceklis
              </p>
              <div className="text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none tracking-[-0.02em]">
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
          className="group bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.14] transition-all block"
        >
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Article size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                Rekam Jejak Audit
              </p>
              <div className="text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none tracking-[-0.02em]">
                {m.totalAuditLogs ?? 0} Catatan
              </div>
              <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] flex items-center gap-1 mt-1.5">
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
          <h2 className="text-sm font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
            Pusat Konfigurasi & Modul Administrasi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Hub 1: Pengguna & RBAC */}
          <Link
            to="/app/users"
            className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] hover:border-black/[0.14] dark:hover:border-white/[0.14] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all flex items-center justify-between gap-3.5 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users size={18} weight="bold" />
              </div>
              <h3 className="font-semibold text-[13px] text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                Manajemen Pengguna & RBAC
              </h3>
            </div>
            <ArrowRight size={14} weight="bold" className="text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Hub 2: Master 7 Bidang K3 & Checklist */}
          <Link
            to="/app/settings?tab=CHECKLISTS"
            className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] hover:border-black/[0.14] dark:hover:border-white/[0.14] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all flex items-center justify-between gap-3.5 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <ListChecks size={18} weight="bold" />
              </div>
              <h3 className="font-semibold text-[13px] text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                Master 7 Bidang K3 & Ceklis
              </h3>
            </div>
            <ArrowRight size={14} weight="bold" className="text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Hub 3: Standar Penomoran Dokumen */}
          <Link
            to="/app/settings?tab=NUMBERING"
            className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] hover:border-black/[0.14] dark:hover:border-white/[0.14] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all flex items-center justify-between gap-3.5 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileText size={18} weight="bold" />
              </div>
              <h3 className="font-semibold text-[13px] text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                Format Penomoran Dokumen
              </h3>
            </div>
            <ArrowRight size={14} weight="bold" className="text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Hub 4: Profil Perusahaan PJK3 */}
          <Link
            to="/app/settings?tab=COMPANY"
            className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] hover:border-black/[0.14] dark:hover:border-white/[0.14] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all flex items-center justify-between gap-3.5 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Buildings size={18} weight="bold" />
              </div>
              <h3 className="font-semibold text-[13px] text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                Profil Resmi Lembaga PJK3
              </h3>
            </div>
            <ArrowRight size={14} weight="bold" className="text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Hub 5: Integrasi WhatsApp & SMTP */}
          <Link
            to="/app/settings?tab=GATEWAYS"
            className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] hover:border-black/[0.14] dark:hover:border-white/[0.14] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all flex items-center justify-between gap-3.5 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <WhatsappLogo size={18} weight="bold" />
              </div>
              <h3 className="font-semibold text-[13px] text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                WhatsApp Gateway & SMTP Email
              </h3>
            </div>
            <ArrowRight size={14} weight="bold" className="text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Hub 6: Cadangan Database */}
          <Link
            to="/app/settings?tab=BACKUPS"
            className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] hover:border-black/[0.14] dark:hover:border-white/[0.14] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all flex items-center justify-between gap-3.5 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400 flex items-center justify-center shrink-0">
                <Database size={18} weight="bold" />
              </div>
              <h3 className="font-semibold text-[13px] text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                Pencadangan Database & Recovery
              </h3>
            </div>
            <ArrowRight size={14} weight="bold" className="text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
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
                  <th className="py-2.5 px-4 text-right hidden xl:table-cell">Alamat IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      Belum ada aktivitas audit tercatat.
                    </td>
                  </tr>
                ) : (
                  auditRows.map((audit) => (
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
                          {formatAuditAction(audit.action)}
                          {audit.count > 1 && (
                            <span className="ml-1 text-slate-500">&times;{audit.count}</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {formatAuditSummary(audit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap hidden xl:table-cell">
                        {audit.ip_address || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

