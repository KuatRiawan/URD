import { useCallback, useEffect, useState } from 'react';
import { BellRinging } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { ClientDispatchSection } from './components/ClientDispatchSection.jsx';
import { ExpiringUnitsSection } from './components/ExpiringUnitsSection.jsx';
import { MissingValiditySection } from './components/MissingValiditySection.jsx';
import { CompetencyRemindersSection } from './components/CompetencyRemindersSection.jsx';
import { UnitValidityModal } from './components/UnitValidityModal.jsx';

const EXPIRY_STATE_LABELS = {
  AKAN_KEDALUWARSA: 'Akan Kedaluwarsa',
  JATUH_TEMPO_PEMERIKSAAN: 'Jatuh Tempo Pemeriksaan',
  SUDAH_KEDALUWARSA: 'Sudah Kedaluwarsa',
  DATA_MASA_BERLAKU_BELUM_LENGKAP: 'Belum Ada Tanggal Masa Berlaku',
  MASIH_BERLAKU: 'Masih Berlaku'
};

export function RemindersPage() {
  const { user } = useAuth();
  const canManage = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING'].includes(user?.role);

  const [unitReminders, setUnitReminders] = useState([]);
  const [missingValidityItems, setMissingValidityItems] = useState([]);
  const [competencyItems, setCompetencyItems] = useState([]);
  const [channels, setChannels] = useState(null);
  const [clientLog, setClientLog] = useState([]);
  const [daysWindow, setDaysWindow] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [validityModalUnit, setValidityModalUnit] = useState(null);
  const [validityForm, setValidityForm] = useState({
    nextInspectionDate: '',
    followupStatus: 'SUDAH_DIHUBUNGI',
    note: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, chRes, logRes] = await Promise.all([
        api.get('/reminders', { params: { days: daysWindow } }),
        api.get('/reminders/client-channels').catch(() => ({ data: null })),
        api.get('/reminders/client-log', { params: { limit: 15 } }).catch(() => ({ data: null }))
      ]);
      setChannels(chRes.data || null);
      setClientLog(logRes.data?.items || []);
      setUnitReminders(res.data?.unitReminders || []);
      setMissingValidityItems(res.data?.missingValidityItems || []);
      setCompetencyItems(res.data?.competencyItems || []);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal memuat daftar pengingat perpanjangan.'
      );
    } finally {
      setLoading(false);
    }
  }, [daysWindow]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunDispatch = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/reminders/run-dispatch');
      const count = res.data?.dispatchedCount ?? 0;
      const cr = res.data?.clientReminders;
      const clientText = cr
        ? ` Pengingat klien: ${cr.sent} terkirim, ${cr.simulated} simulasi, ${cr.failed} gagal, ${cr.skipped} dilewati (kontak kosong).`
        : '';
      setFeedback(`Evaluasi pengingat dijalankan (${count} notifikasi internal baru).${clientText}`);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal menjalankan dispatch pengingat.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUnitRenewalOrder = async (objectId, objectName) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/reminders/units/${objectId}/create-renewal-order`);
      setFeedback(
        `PO Perpanjangan riksa uji baru (${res.data?.order?.po_number || res.data?.order?.order_no}) berhasil dibuat untuk unit ${objectName}.`
      );
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal membuat PO perpanjangan unit.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveUnitValidity = async (e) => {
    e.preventDefault();
    if (!validityModalUnit?.object_id) return;
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/reminders/units/${validityModalUnit.object_id}/validity`, validityForm);
      setFeedback(
        `Tanggal masa berlaku & tindak lanjut unit ${validityModalUnit.object_name} berhasil diperbarui.`
      );
      setValidityModalUnit(null);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal memperbarui masa berlaku unit.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const datedUnits = unitReminders.filter((u) => u.has_dated_validity !== false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengingat Suket Klien"
        subtitle="Monitoring siklus jatuh tempo H-30, H-14, H-7 dan perpanjangan Suket K3."
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <select
              aria-label="Jendela Hari Pengingat"
              value={daysWindow}
              onChange={(e) => setDaysWindow(Number(e.target.value))}
              className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <option value={30}>Jendela H-30 Hari</option>
              <option value={60}>Jendela H-60 Hari</option>
              <option value={90}>Jendela H-90 Hari</option>
              <option value={180}>Jendela H-180 Hari</option>
              <option value={365}>Jendela H-365 Hari (1 Tahun)</option>
            </select>
            {canManage && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleRunDispatch}
                className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C81E1E] px-3.5 text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E]"
              >
                <BellRinging size={15} weight="bold" />
                <span>Jalankan Dispatch</span>
              </button>
            )}
          </div>
        }
      />

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {loading ? (
        <LoadingState label="Memuat pengingat perpanjangan unit K3, Suket, dan SKP..." />
      ) : (
        <div className="space-y-6">
          <ClientDispatchSection channels={channels} clientLog={clientLog} />

          <ExpiringUnitsSection
            datedUnits={datedUnits}
            expiryStateLabels={EXPIRY_STATE_LABELS}
            canManage={canManage}
            submitting={submitting}
            onOpenValidityModal={(item) => {
              setValidityModalUnit(item);
              setValidityForm({
                nextInspectionDate: item.effective_valid_until
                  ? String(item.effective_valid_until).slice(0, 10)
                  : '',
                followupStatus: item.followup_status || 'SUDAH_DIHUBUNGI',
                note: item.last_followup_note || ''
              });
            }}
            onCreateRenewalOrder={handleCreateUnitRenewalOrder}
          />

          <MissingValiditySection
            missingValidityItems={missingValidityItems}
            canManage={canManage}
            onOpenValidityModal={(u) => {
              setValidityModalUnit(u);
              setValidityForm({
                nextInspectionDate: '',
                followupStatus: 'BELUM_DITINDAKLANJUTI',
                note: ''
              });
            }}
          />

          <CompetencyRemindersSection competencyItems={competencyItems} />
        </div>
      )}

      <UnitValidityModal
        validityModalUnit={validityModalUnit}
        onClose={() => setValidityModalUnit(null)}
        handleSaveUnitValidity={handleSaveUnitValidity}
        validityForm={validityForm}
        setValidityForm={setValidityForm}
        submitting={submitting}
      />
    </div>
  );
}
