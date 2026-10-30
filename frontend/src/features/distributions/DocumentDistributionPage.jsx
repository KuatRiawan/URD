import { useCallback, useEffect, useState } from 'react';
import {
  ArrowClockwise,
  Buildings,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  MagnifyingGlass,
  PaperPlaneTilt,
  ShareNetwork,
  Truck,
  X
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import {
  formatDateTime,
  DISTRIBUTION_DOC_TYPE_LABELS,
  DISTRIBUTION_STATUS_LABELS,
  DISTRIBUTION_TARGET_LABELS
} from '../../lib/utils/format.js';

const STATUS_TONES = {
  MENUNGGU_DOKUMEN: 'neutral',
  SIAP_DIKIRIM: 'warning',
  DIKIRIM: 'info',
  DITERIMA: 'success'
};

const DISPATCH_MEDIA_OPTIONS = [
  { value: 'KURIR', label: 'Kurir / Ekspedisi (JNE, TIKI, dsb)' },
  { value: 'SERAH_TERIMA_LANGSUNG', label: 'Serah Terima Langsung di Lokasi' },
  { value: 'EMAIL', label: 'Email Resmi Perusahaan' },
  { value: 'WHATSAPP', label: 'WhatsApp / WABA Resmi' },
  { value: 'PORTAL_KLIEN', label: 'Unduhan Portal Klien' }
];

export function DocumentDistributionPage() {
  const { user } = useAuth();
  const isMarketingOrAdmin = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING'].includes(user?.role);
  const isReadOnly = ['PIMPINAN', 'MANAGER'].includes(user?.role);

  const [distributions, setDistributions] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    siapKirim: 0,
    dikirim: 0,
    diterima: 0,
    targetKlien: 0,
    targetDisnaker: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Update Status Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('DIKIRIM');
  const [dispatchMedia, setDispatchMedia] = useState('KURIR');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [listRes, summaryRes] = await Promise.all([
        api.get('/distributions', {
          params: {
            q: searchQuery || undefined,
            target: targetFilter || undefined,
            status: statusFilter || undefined
          }
        }),
        api.get('/distributions/summary')
      ]);

      setDistributions(listRes.data?.distributions || []);
      setSummary(summaryRes.data?.summary || {
        total: 0,
        siapKirim: 0,
        dikirim: 0,
        diterima: 0,
        targetKlien: 0,
        targetDisnaker: 0
      });
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Gagal memuat data distribusi dokumen.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, targetFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openUpdateModal = (item) => {
    setSelectedItem(item);
    setUpdateStatus(item.status === 'SIAP_DIKIRIM' ? 'DIKIRIM' : 'DITERIMA');
    setDispatchMedia(item.dispatch_media || 'KURIR');
    setTrackingNumber(item.tracking_number || '');
    setDispatchNotes(item.notes || '');
    setModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSubmitting(true);
      await api.patch(`/distributions/${selectedItem.id}/status`, {
        status: updateStatus,
        dispatchMedia,
        trackingNumber: trackingNumber.trim() || undefined,
        notes: dispatchNotes.trim() || undefined
      });

      setFeedback(`Status distribusi dokumen berhasil diperbarui menjadi ${DISTRIBUTION_STATUS_LABELS[updateStatus] || updateStatus}.`);
      setModalOpen(false);
      setSelectedItem(null);
      loadData(true);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Gagal memperbarui status pengiriman.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isReadOnly ? 'Monitoring Distribusi Dokumen' : 'Distribusi Dokumen K3'}
        subtitle="Pelacakan pengiriman Berita Acara (BAP) kepada Klien serta berkas LHPP & BAP ke Disnaker"
        actions={
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors"
          >
            <ArrowClockwise size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>Perbarui Data</span>
          </button>
        }
      />

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={() => loadData(true)} />}

      {/* Ringkasan Status Distribusi */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Berkas
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            {summary.total}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Siap Dikirim
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-800 dark:text-amber-300">
            {summary.siapKirim}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            Dalam Pengiriman
          </p>
          <p className="mt-1 text-2xl font-extrabold text-blue-800 dark:text-blue-300">
            {summary.dikirim}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Diterima
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">
            {summary.diterima}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Target Klien
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            {summary.targetKlien}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Target Disnaker
          </p>
          <p className="mt-1 text-2xl font-extrabold text-[#C81E1E] dark:text-rose-400">
            {summary.targetDisnaker}
          </p>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor resi, PO, BAP, klien, atau objek uji..."
            className="w-full min-h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="min-h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Semua Target Penerima</option>
            <option value="KLIEN">Target: Klien</option>
            <option value="DISNAKER">Target: Disnaker</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Semua Status Pengiriman</option>
            <option value="SIAP_DIKIRIM">Siap Dikirim</option>
            <option value="DIKIRIM">Dalam Pengiriman</option>
            <option value="DITERIMA">Telah Diterima</option>
          </select>
        </div>
      </div>

      {/* Tabel Distribusi Dokumen */}
      {loading ? (
        <LoadingState message="Memuat daftar distribusi dokumen..." />
      ) : distributions.length === 0 ? (
        <EmptyState
          icon={ShareNetwork}
          title="Belum Ada Dokumen Siap Kirim"
          message="Dokumen BAP dan LHPP yang telah difinalisasi akan otomatis masuk ke dalam antrean distribusi resmi ini."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3.5">Dokumen & Target</th>
                  <th scope="col" className="px-4 py-3.5">Perusahaan Klien & PO</th>
                  <th scope="col" className="px-4 py-3.5">Unit Objek Uji</th>
                  <th scope="col" className="px-4 py-3.5">Nomor Referensi</th>
                  <th scope="col" className="px-4 py-3.5">Ekspedisi & Resi</th>
                  <th scope="col" className="px-4 py-3.5">Status Pengiriman</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {distributions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {DISTRIBUTION_DOC_TYPE_LABELS[item.document_type] || item.document_type}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          item.recipient_target === 'DISNAKER'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-[#C81E1E] dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                        }`}>
                          <Buildings size={12} weight="bold" />
                          <span>Penerima: {DISTRIBUTION_TARGET_LABELS[item.recipient_target] || item.recipient_target}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.client_name || '-'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {item.po_number || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {item.object_name || 'Unit Alat'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          SN: {item.serial_number || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1 text-[11px] font-mono">
                        {item.bap_no && (
                          <span className="block text-slate-700 dark:text-slate-300">
                            BAP: {item.bap_no}
                          </span>
                        )}
                        {item.lhpp_no && (
                          <span className="block text-slate-700 dark:text-slate-300">
                            LHPP: {item.lhpp_no}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {item.dispatch_media ? (
                            DISPATCH_MEDIA_OPTIONS.find((o) => o.value === item.dispatch_media)?.label || item.dispatch_media
                          ) : (
                            <span className="text-slate-400 italic">Belum dikirim</span>
                          )}
                        </p>
                        {item.tracking_number && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                            Resi: {item.tracking_number}
                          </p>
                        )}
                        {item.dispatched_at && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Kirim: {formatDateTime(item.dispatched_at)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={STATUS_TONES[item.status] || 'neutral'}>
                        {DISTRIBUTION_STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {isMarketingOrAdmin && item.status !== 'DITERIMA' ? (
                        <button
                          type="button"
                          onClick={() => openUpdateModal(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-[#C81E1E] hover:border-[#C81E1E] hover:text-white transition-colors"
                        >
                          <PaperPlaneTilt size={14} weight="bold" />
                          <span>Update Kirim</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.status === 'DITERIMA' ? 'Tuntas' : 'Monitoring'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Update Status Pengiriman */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Pembaruan Status Pengiriman Dokumen"
        size="md"
      >
        {selectedItem && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-1.5 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-900 dark:text-white">
                {DISTRIBUTION_DOC_TYPE_LABELS[selectedItem.document_type] || selectedItem.document_type}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Penerima: <strong className="text-slate-800 dark:text-slate-200">{DISTRIBUTION_TARGET_LABELS[selectedItem.recipient_target]}</strong> ({selectedItem.client_name})
              </p>
              <p className="text-slate-500 dark:text-slate-400 font-mono">
                No. PO: {selectedItem.po_number || '-'} | Unit: {selectedItem.object_name} (SN: {selectedItem.serial_number})
              </p>
            </div>

            <div>
              <label htmlFor="dist-status" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Status Baru Pengiriman
              </label>
              <select
                id="dist-status"
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500"
              >
                <option value="DIKIRIM">Dalam Pengiriman (DIKIRIM)</option>
                <option value="DITERIMA">Telah Diterima (DITERIMA)</option>
              </select>
            </div>

            <div>
              <label htmlFor="dist-media" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Media / Saluran Pengiriman
              </label>
              <select
                id="dist-media"
                value={dispatchMedia}
                onChange={(e) => setDispatchMedia(e.target.value)}
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500"
              >
                {DISPATCH_MEDIA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dist-tracking" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nomor Resi / Bukti Ekspedisi / Kode AWB
              </label>
              <input
                id="dist-tracking"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Contoh: JNE-0291823901 atau Surat Jalan No. 102"
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="dist-notes" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Catatan Pengiriman (Opsional)
              </label>
              <textarea
                id="dist-notes"
                rows={3}
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="Nama penerima paket, foto tanda terima, atau keterangan serah terima..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-10 rounded-lg bg-[#C81E1E] px-4 py-2 font-bold text-white hover:bg-[#a11616] disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

