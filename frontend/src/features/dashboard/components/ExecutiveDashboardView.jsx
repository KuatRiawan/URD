import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Alarm,
  ArrowClockwise,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Buildings,
  CalendarCheck,
  Certificate,
  ChartLineUp,
  CheckCircle,
  ClipboardText,
  Clock,
  Cube,
  DownloadSimple,
  Eye,
  FileText,
  HourglassMedium,
  MagnifyingGlass,
  MapPin,
  ShieldCheck,
  Truck,
  User,
  UsersThree,
  WarningCircle,
  WarningOctagon,
  Wrench
} from '@phosphor-icons/react';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Badge, statusTone } from '../../../components/ui/Badge.jsx';
import { SplineAreaChart } from '../SplineAreaChart.jsx';
import { IndonesiaMapWidget } from '../IndonesiaMapWidget.jsx';
import { WorkQueueWidget } from '../WorkQueueWidget.jsx';
import {
  formatDate,
  formatRelativeTime,
  ORDER_STATUS_LABELS,
  ROLE_LABELS,
  SERVICE_TYPE_LABELS
} from '../../../lib/utils/format.js';

const ACTION_LABELS = {
  LOGIN: 'Autentikasi Sesi Login',
  AUTH_LOGIN: 'Autentikasi Sesi Login',
  LOGOUT: 'Keluar Sesi Pengguna',
  AUTH_LOGOUT: 'Keluar Sesi Pengguna',
  USER_UPDATE_PROFILE: 'Pembaruan Profil Pengguna',
  USER_CHANGE_PASSWORD: 'Perubahan Kata Sandi Akun',
  CREATE_ORDER: 'Pendaftaran PO / Order Baru',
  ORDER_CREATE: 'Pendaftaran PO / Order Baru',
  UPDATE_ORDER: 'Pembaruan Rincian PO / Order',
  ORDER_UPDATE: 'Pembaruan Rincian PO / Order',
  SCHEDULE_CREATE: 'Penjadwalan Riksa Uji Lapangan',
  ASSIGNMENT_CONFIRM: 'Konfirmasi Penugasan Ahli K3',
  INSPECTION_SUBMIT: 'Pengiriman Checklist Hasil Uji',
  LHPP_REVIEW: 'Tinjauan QC Dokumen LHPP',
  LHPP_PUBLISH: 'Pengesahan Dokumen LHPP',
  BAP_FINALIZE: 'Finalisasi Berita Acara (BAP)',
  SUKET_PUBLISH: 'Penerbitan Suket K3 Disnaker',
  DISTRIBUTION_UPDATE: 'Pembaruan Distribusi Dokumen & BAST'
};

function formatActivityTitle(act) {
  if (!act) return 'Aktivitas Operasional';
  if (typeof act.title === 'string' && act.title.trim()) {
    return act.title.trim();
  }
  if (typeof act.action === 'string' && act.action.trim()) {
    const code = act.action.trim().toUpperCase();
    return ACTION_LABELS[code] || act.action.replace(/_/g, ' ');
  }
  if (typeof act.summary === 'string' && act.summary.trim()) {
    return act.summary.trim();
  }
  return 'Aktivitas Operasional';
}

function formatActivitySummary(act) {
  if (!act || !act.summary) return '';
  const summary = act.summary;
  if (typeof summary === 'string') {
    return summary.trim();
  }
  if (typeof summary === 'object' && summary !== null) {
    if (summary.message || summary.note) {
      return String(summary.message || summary.note);
    }
    const details = [];
    if (summary.poNumber || summary.po_number) details.push(`No. PO: ${summary.poNumber || summary.po_number}`);
    if (summary.orderNo || summary.order_no) details.push(`Order: ${summary.orderNo || summary.order_no}`);
    if (summary.clientName || summary.client_name) details.push(`Klien: ${summary.clientName || summary.client_name}`);
    if (summary.fullName || summary.full_name) details.push(`Nama: ${summary.fullName || summary.full_name}`);
    if (summary.email) details.push(`Akun: ${summary.email}`);
    if (summary.role) details.push(`Peran: ${ROLE_LABELS[summary.role] || summary.role}`);
    if (summary.status) details.push(`Status: ${summary.status}`);
    if (details.length > 0) {
      return details.join(' · ');
    }
    try {
      const fallbackParts = Object.entries(summary)
        .filter(([, val]) => typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean')
        .map(([key, val]) => `${key}: ${String(val)}`);
      return fallbackParts.join(' · ');
    } catch {
      return '';
    }
  }
  return String(summary);
}

export function ExecutiveDashboardView({
  _user,
  data,
  loadSummary,
  refreshing,
  period,
  setPeriod
}) {
  const m = data?.metrics || {};
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'ORDERS' | 'WORKLOAD' | 'DOCUMENTS' | 'ACTIVITIES'
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [inspectorFilter, setInspectorFilter] = useState('ALL'); // 'ALL' | 'OVERLOAD' | 'ACTIVE' | 'AVAILABLE'

  // Hitung status kesehatan operasional
  const hasUrgentAttention =
    Number(m.openIssues || 0) > 0 ||
    Number(m.revisionUnits || 0) > 0 ||
    Number(m.overdueUnits || 0) > 0 ||
    Number(m.suketExpiring30d || 0) > 0;

  // Filter daftar order terkini pada tab monitoring
  const filteredOrders = useMemo(() => {
    const list = data?.recentOrders || [];
    return list.filter((ord) => {
      if (orderStatusFilter && ord.status !== orderStatusFilter) return false;
      if (!orderSearch.trim()) return true;
      const q = orderSearch.toLowerCase();
      return (
        (ord.order_no || '').toLowerCase().includes(q) ||
        (ord.po_number || '').toLowerCase().includes(q) ||
        (ord.client_name || '').toLowerCase().includes(q) ||
        (ord.service_type || '').toLowerCase().includes(q)
      );
    });
  }, [data?.recentOrders, orderSearch, orderStatusFilter]);

  // Filter daftar workload inspector
  const workloadList = data?.inspectorWorkload || [];
  const filteredWorkload = useMemo(() => {
    const list = data?.inspectorWorkload || [];
    return list.filter((insp) => {
      const active = Number(insp.active_assignments ?? insp.activeOrders ?? 0);
      if (inspectorFilter === 'OVERLOAD') return active > 3;
      if (inspectorFilter === 'ACTIVE') return active > 0 && active <= 3;
      if (inspectorFilter === 'AVAILABLE') return active === 0;
      return true;
    });
  }, [data?.inspectorWorkload, inspectorFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Executive Header */}
      <PageHeader
        title="Dasbor Eksekutif & Pemantauan Operasional"
        subtitle="Pemantauan riksa uji K3, beban tim ahli, dan kepatuhan sertifikasi."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-2xs ${
                hasUrgentAttention
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                  : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${hasUrgentAttention ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
              />
              <span>{hasUrgentAttention ? 'Perhatian Diperlukan' : 'Operasional Berjalan Lancar'}</span>
            </span>
            <a
              href={period ? `/api/v1/dashboard/export-recap.csv?period=${encodeURIComponent(period)}` : '/api/v1/dashboard/export-recap.csv'}
              title="Unduh Rekapitulasi Operasional (CSV)"
              className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs"
            >
              <DownloadSimple size={15} weight="bold" aria-hidden="true" />
              <span className="hidden sm:inline">Unduh Rekap CSV</span>
            </a>
            <button
              type="button"
              onClick={() => loadSummary(true)}
              disabled={refreshing}
              title="Perbarui data operasional"
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs cursor-pointer"
            >
              <ArrowClockwise
                size={16}
                weight="bold"
                className={refreshing ? 'animate-spin text-[#C81E1E]' : ''}
              />
            </button>
          </div>
        }
      />

      {/* 2. Executive Navigation Tabs (Apple Segmented Control) */}
      <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.05] rounded-2xl w-full overflow-x-auto border border-black/[0.06] dark:border-white/[0.08]">
        {[
          { key: 'OVERVIEW', label: 'Ringkasan Eksekutif', icon: ChartLineUp },
          { key: 'ORDERS', label: 'Monitoring PO & Unit', icon: Briefcase, count: m.activeOrders },
          { key: 'WORKLOAD', label: 'Beban Kerja Tim K3', icon: UsersThree, count: workloadList.length },
          { key: 'DOCUMENTS', label: 'Dokumen & Kepatuhan', icon: ShieldCheck, count: m.lhppWaitingReview },
          { key: 'ACTIVITIES', label: 'Jejak Aktivitas', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-2 px-3.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              <Icon size={15} weight={isActive ? 'bold' : 'regular'} />
              <span>{tab.label}</span>
              {tab.count !== undefined && Number(tab.count) > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400'
                      : 'bg-black/[0.06] dark:bg-white/[0.08] text-[#6E6E73] dark:text-[#98989D]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* PERSPECTIVE 1: RINGKASAN EKSEKUTIF (OVERVIEW)             */}
      {/* ========================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* A. 4 Key Executive Operational Counters */}
          <section aria-label="Ringkasan Operasional Utama" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Order PO Aktif */}
            <Link
              to="/app/orders"
              className="group bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.14] transition-all block cursor-pointer"
            >
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Briefcase size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                    PO Aktif Diproses
                  </p>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none tracking-[-0.02em]">
                    {m.activeOrders || 0}
                  </div>
                  <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] flex items-center gap-1 mt-1.5">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{m.newOrders || 0} baru</span>
                    <span>·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{m.completedOrders || 0} selesai</span>
                    <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-slate-400 ms-auto" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 2: Unit Alat Dalam Proses */}
            <Link
              to="/app/inspections"
              className="group bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.14] transition-all block cursor-pointer"
            >
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Wrench size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                    Unit Sedang Riksa Uji
                  </p>
                  <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums leading-none tracking-[-0.02em]">
                    {(m.waitingInspectionUnits || 0) + (m.inspectingUnits || 0)}
                  </div>
                  <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] flex items-center gap-1 mt-1.5">
                    <span>{m.inspectingUnits || 0} diuji</span>
                    <span>·</span>
                    <span>{m.waitingInspectionUnits || 0} antre</span>
                    <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-slate-400 ms-auto" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 3: Unit Perlu Revisi / Antrean QC */}
            <Link
              to="/app/lhpp?status=DIKEMBALIKAN"
              className={`group bg-white dark:bg-[#151821] border rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] transition-all block cursor-pointer ${
                Number(m.revisionUnits || 0) > 0
                  ? 'border-amber-500/35 hover:border-amber-500/50'
                  : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.14]'
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                    Number(m.revisionUnits || 0) > 0
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : 'bg-[#F5F5F7] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#98989D]'
                  }`}
                >
                  <HourglassMedium size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                    Unit Perlu Revisi
                  </p>
                  <div
                    className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none tracking-[-0.02em] ${
                      Number(m.revisionUnits || 0) > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-[#1D1D1F] dark:text-[#F5F5F7]'
                    }`}
                  >
                    {m.revisionUnits || 0}
                  </div>
                  <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] flex items-center gap-1 mt-1.5">
                    <span>{m.lhppWaitingReview || 0} antre QC</span>
                    <span>·</span>
                    <span>{m.lhppPublished || 0} terbit</span>
                    <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-slate-400 ms-auto" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 4: Suket Habis <= 30 Hari (Urgensi Kepatuhan) */}
            <Link
              to="/app/suket"
              className={`group bg-white dark:bg-[#151821] border rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] transition-all block cursor-pointer ${
                Number(m.suketExpiring30d || 0) > 0
                  ? 'border-[#C81E1E]/35 hover:border-[#C81E1E]/55'
                  : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.14]'
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                    Number(m.suketExpiring30d || 0) > 0
                      ? 'bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <ShieldCheck size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                    Suket Habis &le; 30 Hari
                  </p>
                  <div
                    className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none tracking-[-0.02em] ${
                      Number(m.suketExpiring30d || 0) > 0
                        ? 'text-[#C81E1E] dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {m.suketExpiring30d || 0}
                  </div>
                  <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] flex items-center gap-1 mt-1.5">
                    <span>{m.suketExpiring90d || 0} pipeline &le; 90 hari</span>
                    <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-slate-400 ms-auto" />
                  </div>
                </div>
              </div>
            </Link>
          </section>

          {/* B. Operational Health & Bottlenecks Alert (If Action Required) */}
          {hasUrgentAttention && (
            <div className="rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <span className="h-9 w-9 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <WarningOctagon size={20} weight="bold" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Item Memerlukan Perhatian Manajemen
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {Number(m.openIssues || 0) > 0 && (
                        <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
                          <WarningCircle size={14} weight="bold" />
                          <span>{m.openIssues} Kendala Lapangan Terbuka {m.highPriorityIssues > 0 && `(${m.highPriorityIssues} Urgensi Tinggi)`}</span>
                        </span>
                      )}
                      {Number(m.revisionUnits || 0) > 0 && (
                        <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                          <HourglassMedium size={14} weight="bold" />
                          <span>{m.revisionUnits} Unit Perlu Revisi Teknis</span>
                        </span>
                      )}
                      {Number(m.overdueUnits || 0) > 0 && (
                        <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
                          <Clock size={14} weight="bold" />
                          <span>{m.overdueUnits} Unit Melewati Jadwal Pelaksanaan</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  {Number(m.openIssues || 0) > 0 && (
                    <Link
                      to="/app/issues"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a11616] transition-colors shadow-2xs"
                    >
                      <span>Tinjau Kendala</span>
                      <ArrowRight size={13} weight="bold" />
                    </Link>
                  )}
                  {Number(m.revisionUnits || 0) > 0 && (
                    <Link
                      to="/app/lhpp?status=DIKEMBALIKAN"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                    >
                      <span>Lihat Revisi</span>
                      <ArrowRight size={13} weight="bold" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* C. End-to-End Operational Pipeline Tracker */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Wrench size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                <span>Jalur Siklus Operasional Unit &amp; Dokumen</span>
              </h2>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Total {m.totalOrders || (m.activeOrders || 0) + (m.completedOrders || 0)} Order Aktif
              </span>
            </div>

            {/* Linear Pipeline Stages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {[
                { label: 'Order Baru', count: m.newOrders || 0, link: '/app/orders?status=ORDER_BARU', tone: 'neutral' },
                { label: 'Antre Jadwal', count: m.waitingInspectionUnits || 0, link: '/app/schedule', tone: 'neutral' },
                { label: 'Sedang Uji', count: m.inspectingUnits || 0, link: '/app/inspections', tone: 'blue' },
                { label: 'Review QC', count: m.lhppWaitingReview || 0, link: '/app/lhpp?status=SIAP_PREVIEW', tone: 'amber' },
                { label: 'Revisi', count: m.revisionUnits || 0, link: '/app/lhpp?status=DIKEMBALIKAN', tone: Number(m.revisionUnits || 0) > 0 ? 'amber' : 'neutral' },
                { label: 'LHPP Terbit', count: m.lhppPublished || 0, link: '/app/lhpp?status=FINAL', tone: 'emerald' },
                { label: 'Suket Disnaker', count: m.suketPublished || m.documentPipeline?.suket_published || 0, link: '/app/suket?status=TERBIT', tone: 'indigo' },
                { label: 'Siap Kirim', count: m.documentPipeline?.dist_pending ?? m.docsPendingDelivery ?? 0, link: '/app/distributions?status=SIAP_DIKIRIM', tone: 'emerald' }
              ].map((step, idx) => (
                <Link
                  key={step.label}
                  to={step.link}
                  className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs transition-all text-center block cursor-pointer"
                >
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {idx + 1}. {step.label}
                  </p>
                  <p className={`text-base font-extrabold mt-0.5 ${
                    step.tone === 'amber' && step.count > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : step.tone === 'blue' && step.count > 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : step.tone === 'emerald' && step.count > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : step.tone === 'indigo' && step.count > 0
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {step.count}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* D. Two-Column Analytics: Left (Chart & Throughput) + Right (Workload & Quick Summary) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8-cols: Real Monthly Trend Chart & SLA */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ChartLineUp size={18} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                    <span>Tren &amp; Volume Riksa Uji K3</span>
                  </h2>

                  {/* Period Filter Buttons */}
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs font-semibold self-start sm:self-center shadow-2xs">
                    {['7D', '30D', '90D', '1Y'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPeriod(p);
                          if (loadSummary) loadSummary(false, p);
                        }}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                          period === p
                            ? 'bg-[#C81E1E] text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 gap-2">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#C81E1E]" /> Total Order
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Riksa Uji Selesai
                      </span>
                    </div>
                  </div>

                  <SplineAreaChart
                    monthlyTrend={data?.analytics?.monthlyTrend || []}
                    period={period}
                  />

                  {/* Bottom Chart Efficiency Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Rata-Rata Siklus SLA
                      </p>
                      <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                        {m.avgCompletionHours ? `${m.avgCompletionHours} Jam` : 'Belum tercatat'}
                      </p>
                      <span className="text-[10px] text-slate-400">Order s/d selesai</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Unit Tersertifikasi
                      </p>
                      <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {m.completedUnits || 0}
                      </p>
                      <span className="text-[10px] text-slate-400">Unit alat tuntas</span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Total Volume Historis
                      </p>
                      <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                        {m.totalOrders || (m.activeOrders || 0) + (m.completedOrders || 0)}
                      </p>
                      <span className="text-[10px] text-slate-400">Order terdaftar</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Queue & Attention Items for Pimpinan */}
              <WorkQueueWidget onRefresh={() => loadSummary(true)} />
            </div>

            {/* Right 4-cols: Inspector Workload & Quick Oversight */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Inspector Workload Capacity */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UsersThree size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Beban Tim Ahli K3
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('WORKLOAD')}
                    className="text-[11px] font-bold text-[#C81E1E] dark:text-rose-400 hover:underline"
                  >
                    Detail Tim &rarr;
                  </button>
                </div>

                <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[340px] overflow-y-auto">
                  {workloadList.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                      Belum ada penugasan Ahli K3 tercatat.
                    </p>
                  ) : (
                    workloadList.slice(0, 6).map((insp) => {
                      const active = Number(insp.active_assignments || 0);
                      const isHigh = active > 3;
                      return (
                        <div key={insp.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {insp.full_name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {insp.completed_inspections || 0} riksa uji selesai
                            </p>
                          </div>
                          <Badge
                            tone={isHigh ? 'warning' : active > 0 ? 'info' : 'success'}
                            size="xs"
                          >
                            {active > 0 ? `${active} tugas aktif` : 'Tersedia'}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card 2: Pengawasan Kepatuhan Dokumen Links */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Pengawasan &amp; Regulasi
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Eksekutif</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Link
                    to="/app/audit-logs"
                    className="h-9 inline-flex items-center justify-between px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Clock size={14} className="text-slate-500" />
                      <span>Log Audit Operasional</span>
                    </span>
                    <ArrowRight size={13} weight="bold" className="text-slate-400" />
                  </Link>
                  <Link
                    to="/app/lhpp"
                    className="h-9 inline-flex items-center justify-between px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-slate-500" />
                      <span>Dokumen LHPP &amp; BAP</span>
                    </span>
                    <ArrowRight size={13} weight="bold" className="text-slate-400" />
                  </Link>
                  <Link
                    to="/app/suket"
                    className="h-9 inline-flex items-center justify-between px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Certificate size={14} className="text-slate-500" />
                      <span>Registri Suket Disnaker</span>
                    </span>
                    <ArrowRight size={13} weight="bold" className="text-slate-400" />
                  </Link>
                  <Link
                    to="/app/distributions"
                    className="h-9 inline-flex items-center justify-between px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Truck size={14} className="text-slate-500" />
                      <span>Distribusi Berkas &amp; BAST</span>
                    </span>
                    <ArrowRight size={13} weight="bold" className="text-slate-400" />
                  </Link>
                </div>
              </div>

              {/* Card 3: Recent Activity Log */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Log Aktivitas Terkini
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ACTIVITIES')}
                    className="text-[11px] font-bold text-[#C81E1E] dark:text-rose-400 hover:underline"
                  >
                    Semua ({ (data?.recentActivities || []).length }) &rarr;
                  </button>
                </div>

                <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[320px] overflow-y-auto">
                  {(data?.recentActivities || []).length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                      Belum ada aktivitas operasional tercatat hari ini.
                    </p>
                  ) : (
                    (data?.recentActivities || []).slice(0, 5).map((act) => {
                      const titleText = formatActivityTitle(act);
                      const detailText = formatActivitySummary(act);
                      const actorName = typeof act.user_name === 'string' && act.user_name ? act.user_name : 'Sistem';
                      const actorRole = typeof act.user_role === 'string' && act.user_role ? (ROLE_LABELS[act.user_role] || act.user_role) : '-';
                      return (
                        <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                            <User size={13} weight="bold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {titleText}
                            </p>
                            {detailText && detailText !== titleText && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                                {detailText}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {actorName} · {actorRole}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              {formatRelativeTime(act.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* E. Lower Section: Sebaran Wilayah Pengujian di Indonesia */}
          <section aria-label="Sebaran Geografis Lokasi Pengujian">
            <IndonesiaMapWidget regions={data?.analytics?.regionalMapping || []} />
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* PERSPECTIVE 2: MONITORING PO & PROGRESS UNIT              */}
      {/* ========================================================= */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Cari nomor PO, nomor order, nama klien, atau layanan..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter status order"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="">Semua Status Order</option>
                {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <Link
                to="/app/orders"
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a11616] transition-colors shadow-2xs shrink-0"
              >
                <span>Buka Registri PO</span>
                <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          </div>

          {/* Tabel Monitoring PO */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Nomor PO &amp; Order</th>
                    <th className="py-3 px-4">Klien &amp; Layanan</th>
                    <th className="py-3 px-4">Progres Unit Alat</th>
                    <th className="py-3 px-4">Tanggal Masuk</th>
                    <th className="py-3 px-4">Status Order</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                        Tidak ada order yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const totalUnits = Number(ord.unitProgress?.totalUnits ?? ord.object_count ?? 0);
                      const completedUnits = Number(ord.unitProgress?.completed ?? ord.completed_units ?? (ord.status === 'SELESAI' ? totalUnits : 0));
                      const revisionUnits = Number(ord.unitProgress?.revision ?? ord.revision_units ?? 0);
                      const waitingDocsUnits = Number(ord.unitProgress?.waitingDocs ?? ord.waiting_doc_units ?? 0);
                      const pct = totalUnits > 0 ? Math.min(100, Math.round((completedUnits / totalUnits) * 100)) : 0;
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                            <div className="text-[#C81E1E] dark:text-rose-400">{ord.po_number || ord.order_no}</div>
                            <div className="text-[11px] font-normal text-slate-500">Order: {ord.order_no}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{ord.client_name}</div>
                            <div className="text-slate-500 text-[11px]">{SERVICE_TYPE_LABELS[ord.service_type] || ord.service_type}</div>
                          </td>
                          <td className="py-3 px-4 min-w-[170px]">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              <span>{completedUnits} / {totalUnits} Unit Selesai</span>
                              <span className="tabular-nums text-slate-500">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct === 100 ? 'bg-emerald-500' : revisionUnits > 0 ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            {(revisionUnits > 0 || waitingDocsUnits > 0) && (
                              <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] font-semibold">
                                {revisionUnits > 0 && (
                                  <span className="text-amber-600 dark:text-amber-400">{revisionUnits} revisi</span>
                                )}
                                {waitingDocsUnits > 0 && (
                                  <span className="text-blue-600 dark:text-blue-400">{waitingDocsUnits} proses dokumen</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            <div>{formatDate(ord.created_at)}</div>
                            <div className="text-[10px] text-slate-400">{formatRelativeTime(ord.created_at)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge tone={statusTone(ord.status)} size="sm">
                              {ORDER_STATUS_LABELS[ord.status] || ord.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/app/orders?orderNo=${encodeURIComponent(ord.order_no)}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Eye size={13} />
                              <span>Detail</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PERSPECTIVE 3: BEBAN KERJA & KAPASITAS TIM AHLI K3        */}
      {/* ========================================================= */}
      {activeTab === 'WORKLOAD' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Beban Kerja:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'ALL', label: 'Semua Personel' },
                  { key: 'OVERLOAD', label: 'Beban Tinggi (>3 Tugas)' },
                  { key: 'ACTIVE', label: 'Aktif (1-3 Tugas)' },
                  { key: 'AVAILABLE', label: 'Tersedia (0 Tugas)' }
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setInspectorFilter(f.key)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                      inspectorFilter === f.key
                        ? 'bg-[#C81E1E] text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <Link
              to="/app/schedule"
              className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              <CalendarCheck size={14} weight="bold" />
              <span>Monitoring Jadwal Tim</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Nama Personel Ahli K3</th>
                    <th className="py-3 px-4 text-center">PO Aktif</th>
                    <th className="py-3 px-4 text-center">Unit Ditugaskan</th>
                    <th className="py-3 px-4 text-center">Draf / Revisi</th>
                    <th className="py-3 px-4 text-center">Riksa Uji Selesai</th>
                    <th className="py-3 px-4">Indikator Kapasitas</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredWorkload.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada personel Ahli K3 pada kategori filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkload.map((insp) => {
                      const active = Number(insp.active_assignments ?? insp.activeOrders ?? 0);
                      const assignedUnits = Number(insp.assigned_units ?? insp.totalUnitsAssigned ?? active);
                      const drafts = Number(insp.draft_inspections ?? 0);
                      const revisions = Number(insp.revision_count ?? 0);
                      const pendingConf = Number(insp.pending_confirmations ?? 0);
                      const completed = Number(insp.completed_inspections ?? insp.completedOrders ?? 0);
                      const validSkp = insp.valid_skp_count !== undefined ? Number(insp.valid_skp_count) : null;
                      const isOverloaded = active > 3 || assignedUnits > 8;
                      const isAvailable = active === 0 && assignedUnits === 0;
                      const inspectorName = insp.full_name || insp.name || 'Ahli K3';
                      return (
                        <tr key={insp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2.5">
                              <span className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 font-extrabold text-[11px]">
                                {inspectorName.slice(0, 2).toUpperCase() || 'K3'}
                              </span>
                              <div>
                                <div>{inspectorName}</div>
                                <div className="text-[10px] font-medium text-slate-500 flex items-center gap-2 mt-0.5">
                                  {validSkp !== null && <span>{validSkp} SKP Aktif</span>}
                                  {pendingConf > 0 && (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                                      · {pendingConf} Menunggu Konfirmasi
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-extrabold text-sm tabular-nums">
                            {active}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            {assignedUnits} Unit
                          </td>
                          <td className="py-3.5 px-4 text-center tabular-nums">
                            <span className="text-slate-600 dark:text-slate-400 font-semibold">{drafts} draf</span>
                            {revisions > 0 && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                                {revisions} revisi
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                            {completed}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              tone={isOverloaded ? 'warning' : isAvailable ? 'success' : 'info'}
                              size="sm"
                            >
                              {isOverloaded ? 'Beban Tinggi' : isAvailable ? 'Tersedia untuk Penugasan' : 'Kapasitas Normal'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to="/app/schedule"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              <span>Lihat Jadwal</span>
                              <ArrowRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PERSPECTIVE 4: JALUR DOKUMEN LHPP, BAP & SUKET DISNAKER   */}
      {/* ========================================================= */}
      {activeTab === 'DOCUMENTS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Berita Acara (BAP) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ClipboardText size={18} className="text-[#C81E1E]" weight="bold" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Berita Acara (BAP)
                  </h3>
                </div>
                <Link to="/app/bap" className="text-xs font-bold text-[#C81E1E] hover:underline">
                  Buka Modul &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Draf BAP</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                    {m.bapDraft ?? m.documentPipeline?.bap_draft ?? m.documentPipeline?.bapDraft ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 text-center">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">BAP Final</p>
                  <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                    {m.bapFinal ?? m.documentPipeline?.bap_final ?? m.documentPipeline?.bapFinal ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Dokumen LHPP */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" weight="bold" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Laporan LHPP
                  </h3>
                </div>
                <Link to="/app/lhpp" className="text-xs font-bold text-blue-600 hover:underline">
                  Buka Modul &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">Antre QC</p>
                  <p className="text-lg font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">{m.lhppWaitingReview || 0}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Revisi</p>
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{m.revisionUnits || m.lhppReturned || 0}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20">
                  <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Terbit</p>
                  <p className="text-lg font-extrabold text-blue-700 dark:text-blue-400 mt-0.5">{m.lhppPublished || 0}</p>
                </div>
              </div>
            </div>

            {/* Registri Suket Disnaker */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Certificate size={18} className="text-indigo-600" weight="bold" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Suket K3 Disnaker
                  </h3>
                </div>
                <Link to="/app/suket" className="text-xs font-bold text-indigo-600 hover:underline">
                  Buka Modul &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 text-center">
                  <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">Suket Terbit</p>
                  <p className="text-xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">
                    {m.suketPublished ?? m.documentPipeline?.suket_published ?? m.documentPipeline?.suketIssued ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 text-center">
                  <p className="text-[10px] font-bold text-[#C81E1E] dark:text-rose-400 uppercase">&le; 30 Hari</p>
                  <p className="text-xl font-extrabold text-[#C81E1E] dark:text-rose-400 mt-1">{m.suketExpiring30d || 0}</p>
                </div>
              </div>
            </div>

            {/* Distribusi Dokumen & BAST */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Truck size={18} className="text-emerald-600" weight="bold" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Distribusi &amp; BAST
                  </h3>
                </div>
                <Link to="/app/distributions" className="text-xs font-bold text-emerald-600 hover:underline">
                  Buka Modul &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Siap Kirim</p>
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                    {m.documentPipeline?.dist_pending ?? 0}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20">
                  <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Dikirim</p>
                  <p className="text-lg font-extrabold text-blue-700 dark:text-blue-400 mt-0.5">
                    {m.documentPipeline?.dist_dispatched ?? 0}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Diterima</p>
                  <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {m.documentPipeline?.dist_received ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PERSPECTIVE 5: JEJAK AKTIVITAS OPERASIONAL LENGKAP        */}
      {/* ========================================================= */}
      {activeTab === 'ACTIVITIES' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
              <span>Kronologi Jejak Aktivitas Operasional Terkini</span>
            </h2>
            <Link
              to="/app/audit-logs"
              className="text-xs font-bold text-[#C81E1E] dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <span>Buka Log Audit Lengkap</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(data?.recentActivities || []).length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-10">
                Belum ada aktivitas operasional tercatat.
              </p>
            ) : (
              (data?.recentActivities || []).map((act) => {
                const titleText = formatActivityTitle(act);
                const detailText = formatActivitySummary(act);
                const actorName = typeof act.user_name === 'string' && act.user_name ? act.user_name : 'Sistem';
                const actorRole = typeof act.user_role === 'string' && act.user_role ? (ROLE_LABELS[act.user_role] || act.user_role) : '-';
                const entityName = typeof act.entity === 'string' && act.entity ? act.entity : 'SISTEM';
                return (
                  <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                      <User size={15} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {titleText}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {formatRelativeTime(act.created_at)}
                        </span>
                      </div>
                      {detailText && detailText !== titleText && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {detailText}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Pelaku: <strong className="text-slate-700 dark:text-slate-300">{actorName}</strong> ({actorRole}) · Entitas: <span className="font-mono text-[10px]">{entityName}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
