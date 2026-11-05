import { useCallback, useEffect, useState } from 'react';
import {
  Article,
  CheckCircle,
  Copy,
  Eye,
  MagnifyingGlass,
  ShieldCheck,
  WarningCircle,
  X
} from '@phosphor-icons/react';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { api } from '../../lib/api/axios.js';
import { formatDateTime, ROLE_LABELS } from '../../lib/utils/format.js';

export function displayValue(value, fallback = '-') {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    return value.full_name || value.name || value.email || value.role || value.label || fallback;
  }
  return fallback;
}

export function getRoleLabel(value) {
  const role = displayValue(typeof value === 'object' ? value?.role : value);
  return ROLE_LABELS[role] || role;
}

export function AuditLogPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copied, setCopied] = useState(false);

  const categories = [
    { id: 'ALL', label: 'Semua Aktivitas' },
    { id: 'AUTH', label: 'Autentikasi & Akun', prefixes: ['USER_', 'LOGIN_'] },
    { id: 'COMP', label: 'Kompetensi & SKP', prefixes: ['INSPECTOR_'] },
    { id: 'ORDER', label: 'PO & Order Riksa', prefixes: ['ORDER_'] },
    { id: 'INSP', label: 'Inspeksi & QC', prefixes: ['INSPECTION_', 'CHECKLIST_'] },
    { id: 'LHPP', label: 'LHPP & Suket K3', prefixes: ['LHPP_', 'SUKET_'] },
    { id: 'SYSTEM', label: 'Konfigurasi & Master Data', prefixes: ['SYSTEM_', 'MASTER_', 'CALIBRATION_'] },
    { id: 'BACKUP', label: 'Cadangan Database', prefixes: ['DATABASE_'] }
  ];

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const searchQ = actionFilter.trim() || undefined;

      const res = await api.get('/audit-logs', {
        params: {
          limit: 100,
          q: searchQ,
          entity: entityFilter || undefined
        }
      });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat rekam jejak audit sistem.');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredItems = items.filter((log) => {
    if (categoryFilter === 'ALL') return true;
    const cat = categories.find((c) => c.id === categoryFilter);
    if (!cat?.prefixes) return true;
    const act = String(log.action || '');
    return cat.prefixes.some((p) => act.startsWith(p));
  });

  const getActionBadgeTone = (action) => {
    const act = String(action || '').toUpperCase();
    if (act.includes('DELETE') || act.includes('REJECT') || act.includes('FAIL')) return 'danger';
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('REVISION')) return 'warning';
    if (act.includes('CREATE') || act.includes('PUBLISH') || act.includes('APPROVE') || act.includes('SUCCESS')) return 'success';
    return 'info';
  };

  const handleCopyJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Log Audit Operasional"
        subtitle={`Rekam jejak seluruh perubahan data, autentikasi sesi, persetujuan dokumen, dan penerbitan Suket K3 (${total} entri tercatat).`}
        actions={
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck size={16} weight="bold" />
            <span>Jejak Audit Terverifikasi (Permanen / Tak Terubah)</span>
          </div>
        }
      />

      {error && <ErrorBanner message={error} onRetry={loadLogs} />}

      {/* Filter Bar & Quick Category Chips */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Cari kode aksi sistem (contoh: LOGIN_SUCCESS, ORDER_CREATED, SYSTEM_SETTING_UPDATE)..."
              className="w-full h-10 pl-9 pr-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#C81E1E] focus:outline-none transition-colors"
            />
          </div>

          <select
            aria-label="Filter Entitas Audit"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-10 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:border-[#C81E1E] focus:outline-none transition-colors"
          >
            <option value="">Semua Modul Entitas</option>
            <option value="users">Pengguna (users)</option>
            <option value="inspectors">Profil Ahli K3 (inspectors)</option>
            <option value="inspector_competencies">SKP & Kompetensi K3 (inspector_competencies)</option>
            <option value="master_categories">Master Kategori K3 (master_categories)</option>
            <option value="calibration_tools">Alat Kalibrasi (calibration_tools)</option>
            <option value="inspection_template_versions">Versi Template Ceklis (inspection_template_versions)</option>
            <option value="inspection_template_items">Item Template Ceklis (inspection_template_items)</option>
            <option value="clients">Klien (clients)</option>
            <option value="inspection_objects">Objek Uji K3 (inspection_objects)</option>
            <option value="orders">Purchase Order (orders)</option>
            <option value="inspections">Form Inspeksi Lapangan (inspections)</option>
            <option value="lhpp">Laporan LHPP (lhpp)</option>
            <option value="suket">Registri Suket K3 (suket)</option>
            <option value="system_settings">Konfigurasi Sistem (system_settings)</option>
            <option value="database_backups">Cadangan Database (database_backups)</option>
          </select>
        </div>

        {/* Action Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 mr-1">
            Kategori Aksi:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 text-white dark:bg-rose-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Memuat catatan log audit..." />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="Belum ada entri log audit"
          description="Aktivitas operasional yang tercatat akan ditampilkan secara kronologis di halaman ini."
        />
      ) : (
        <div className="space-y-4">
          {/* Tampilan Mobile: Kartu Riwayat Jejak Audit */}
          <div className="sm:hidden space-y-3">
            {filteredItems.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-2.5 active:bg-slate-50 dark:active:bg-slate-800/60 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Badge tone={getActionBadgeTone(log.action)}>{displayValue(log.action)}</Badge>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {displayValue(log.summary)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pelaku: <strong className="text-slate-700 dark:text-slate-300">{displayValue(log.user_name, 'Sistem')}</strong> ({getRoleLabel(log.user_role)})
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Entitas: {displayValue(log.entity)}</span>
                  <span>IP: {displayValue(log.ip_address)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tampilan Desktop & Tablet: Tabel Lengkap */}
          <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4 min-w-[150px]">Waktu Kejadian</th>
                    <th className="py-3 px-4 min-w-[180px]">Pelaku / Pengguna</th>
                    <th className="py-3 px-4 min-w-[180px]">Aksi Sistem</th>
                    <th className="py-3 px-4">Ringkasan Aktivitas</th>
                    <th className="py-3 px-4 text-center">Entitas</th>
                    <th className="py-3 px-4 text-right">Alamat IP</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredItems.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {displayValue(log.user_name, 'Sistem Internal')}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {getRoleLabel(log.user_role)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {displayValue(log.action)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {displayValue(log.summary)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {displayValue(log.entity)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {displayValue(log.ip_address)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Inspeksi Detail Rekam Jejak"
                        >
                          <Eye size={15} weight="bold" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Inspeksi Audit Log */}
      {selectedLog && (
        <Modal
          open={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title="Detail Rekam Jejak Audit Sistem"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  ID: {selectedLog.id}
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {formatDateTime(selectedLog.created_at)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pelaku:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {displayValue(selectedLog.user_name, 'Sistem Internal')}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {getRoleLabel(selectedLog.user_role)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Alamat IP:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {displayValue(selectedLog.ip_address)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Kode Aksi:</span>
                  <span className="font-mono font-bold text-[#C81E1E]">
                    {displayValue(selectedLog.action)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Entitas Terkait:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {displayValue(selectedLog.entity)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Ringkasan Aktivitas:
              </span>
              <p className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {displayValue(selectedLog.summary)}
              </p>
            </div>

            {selectedLog.summary && typeof selectedLog.summary === 'object' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Data Payload JSON:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.summary, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
