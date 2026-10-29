import { useCallback, useEffect, useState } from 'react';
import {
  CalendarCheck,
  Certificate,
  Plus,
  Trash,
  Users
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import {
  formatDate,
  formatDateTime,
  ORDER_STATUS_LABELS,
  SERVICE_TYPE_LABELS
} from '../../lib/utils/format.js';

export function SchedulePage() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const canManage = ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);

  const [schedules, setSchedules] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [compModalOpen, setCompModalOpen] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState(null);
  const [compForm, setCompForm] = useState({
    categoryId: '',
    certificateNo: '',
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [schedRes, inspRes, catRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/inspectors'),
        api.get('/objects/categories').catch(() => ({ data: { categories: [] } }))
      ]);
      setSchedules(schedRes.data?.items || []);
      setInspectors(inspRes.data?.items || []);
      setCategories(catRes.data?.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat jadwal dan matriks Ahli K3.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddCompetency = (inspector) => {
    setSelectedInspector(inspector);
    setCompForm({
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
      certificateNo: '',
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
    });
    setCompModalOpen(true);
  };

  const handleAddCompetency = async (e) => {
    e.preventDefault();
    if (!selectedInspector) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/inspectors/${selectedInspector.id}/competencies`, {
        categoryId: Number(compForm.categoryId),
        certificateNo: compForm.certificateNo,
        validFrom: compForm.validFrom || null,
        validUntil: compForm.validUntil
      });
      setCompModalOpen(false);
      setFeedback(`Kompetensi SKP untuk ${selectedInspector.fullName} berhasil disimpan.`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan kompetensi Ahli K3.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompetency = async (inspectorId, compId) => {
    const ok = await confirm({
      title: 'Hapus Kompetensi SKP',
      message: 'Data kompetensi ini akan dihapus dan Ahli K3 tidak dapat ditugaskan pada bidang tersebut.',
      confirmLabel: 'Ya, Hapus',
      tone: 'danger'
    });
    if (!ok) return;
    setError('');
    try {
      await api.delete(`/inspectors/${inspectorId}/competencies/${compId}`);
      setFeedback('Data kompetensi SKP telah dihapus.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus kompetensi Ahli K3.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Pemeriksaan & Matriks Kompetensi Ahli K3"
        subtitle="Pantau agenda inspeksi lapangan beserta masa berlaku SKP penunjukan Ahli K3 di setiap bidang riksa uji."
      />

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {loading ? (
        <LoadingState label="Memuat kalender jadwal dan matriks kompetensi..." />
      ) : (
        <div className="space-y-6">
          {/* Tabel Jadwal Inspeksi */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck size={20} className="text-[#C81E1E]" weight="bold" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Agenda Jadwal Pemeriksaan Lapangan ({schedules.length})
                </h2>
              </div>
            </div>

            {schedules.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Belum ada jadwal pemeriksaan"
                  description="Atur jadwal pemeriksaan melalui menu Order Pemeriksaan untuk menampilkannya di kalender ini."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Waktu Pelaksanaan</th>
                      <th className="py-3 px-4">No. Order & Layanan</th>
                      <th className="py-3 px-4">Klien & Lokasi</th>
                      <th className="py-3 px-4">Tim Ahli K3</th>
                      <th className="py-3 px-4">Status Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {schedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {formatDateTime(sch.start_at)}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">s/d {formatDateTime(sch.end_at)}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{sch.order_no}</div>
                          <div className="text-slate-600 dark:text-slate-400">
                            {SERVICE_TYPE_LABELS[sch.service_type] || sch.service_type}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{sch.client_name}</div>
                          <div className="text-slate-500 dark:text-slate-400">
                            {sch.location_name || 'Lokasi Utama'}
                            {sch.location_city ? ` · ${sch.location_city}` : ''}
                          </div>
                          {sch.notes && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sch.notes}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {(sch.assignments || []).length === 0 ? (
                            <span className="text-slate-400 dark:text-slate-500">Belum ada penugasan</span>
                          ) : (
                            <div className="space-y-1">
                              {(sch.assignments || []).map((asg) => (
                                <div key={asg.id} className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {asg.fullName}
                                  </span>
                                  <Badge
                                    tone={
                                      asg.status === 'DITERIMA'
                                        ? 'success'
                                        : asg.status === 'DITOLAK'
                                          ? 'danger'
                                          : 'warning'
                                    }
                                  >
                                    {asg.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge tone="info">
                            {ORDER_STATUS_LABELS[sch.order_status] || sch.order_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Matriks Kompetensi SKP Ahli K3 */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-slate-600 dark:text-slate-400" weight="bold" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Matriks Kompetensi & SKP Penunjukan Ahli K3 ({inspectors.length})
                </h2>
              </div>
            </div>

            {inspectors.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Belum ada personel Ahli K3"
                  description="Tambahkan pengguna dengan peran Ahli K3 pada menu Manajemen Pengguna."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {inspectors.map((insp) => (
                  <div
                    key={insp.id}
                    className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{insp.fullName}</span>
                        {insp.employeeNo && (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            NIP: {insp.employeeNo}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {insp.email} · {insp.phone || 'Tanpa nomor telepon'}
                      </p>
                    </div>

                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      {(insp.competencies || []).length === 0 ? (
                        <span className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 px-2.5 py-1 rounded">
                          Belum memiliki SKP terdaftar
                        </span>
                      ) : (
                        (insp.competencies || []).map((comp) => (
                          <div
                            key={comp.id}
                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs"
                          >
                            <Certificate
                              size={15}
                              className={comp.isValid ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {comp.categoryCode} · {comp.certificateNo}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Berlaku s/d {formatDate(comp.validUntil)}{' '}
                                {comp.isValid ? '(Aktif)' : '(Kedaluwarsa)'}
                              </div>
                            </div>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCompetency(insp.id, comp.id)}
                                aria-label={`Hapus SKP ${comp.certificateNo}`}
                                className="ml-1 p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                              >
                                <Trash size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {canManage && (
                      <div>
                        <button
                          type="button"
                          onClick={() => openAddCompetency(insp)}
                          className="min-h-10 inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          <Plus size={14} weight="bold" />
                          <span>Tambah SKP</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal Tambah Kompetensi SKP */}
      <Modal
        open={compModalOpen}
        onClose={() => setCompModalOpen(false)}
        title={
          selectedInspector
            ? `Tambah SKP Ahli K3: ${selectedInspector.fullName}`
            : 'Tambah SKP Ahli K3'
        }
      >
        <form onSubmit={handleAddCompetency} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Bidang Kompetensi K3 *
            </label>
            <select
              required
              value={compForm.categoryId}
              onChange={(e) => setCompForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            >
              <option value="">Pilih Bidang...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.code} ({cat.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Nomor SKP / Lisensi Kemnaker *
            </label>
            <input
              type="text"
              required
              value={compForm.certificateNo}
              onChange={(e) => setCompForm((prev) => ({ ...prev, certificateNo: e.target.value }))}
              placeholder="Contoh: KEP.412/NAKER-BINWASK3/2026"
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Tanggal Terbit
              </label>
              <input
                type="date"
                value={compForm.validFrom}
                onChange={(e) => setCompForm((prev) => ({ ...prev, validFrom: e.target.value }))}
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Berlaku Sampai *
              </label>
              <input
                type="date"
                required
                value={compForm.validUntil}
                onChange={(e) => setCompForm((prev) => ({ ...prev, validUntil: e.target.value }))}
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCompModalOpen(false)}
              className="min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan SKP'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
