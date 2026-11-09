import { useCallback, useEffect, useState } from 'react';
import { BellRinging, CalendarCheck, Clock, ShieldCheck, WarningOctagon } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { useToast } from '../../components/ui/FeedbackProvider.jsx';
import { ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
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
  const toast = useToast();
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
  const [activeTab, setActiveTab] = useState('EXPIRING');

  useEffect(() => {
    if (feedback) {
      toast(feedback, 'success');
      setFeedback('');
    }
  }, [feedback, toast]);

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
        ? ` Pengingat klien: ${cr.sent} terkirim, ${cr.simulated} tercatat internal, ${cr.failed} gagal, ${cr.skipped} dilewati (kontak kosong).`
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
  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(user?.role);

  const TABS = [
    { id: 'EXPIRING', label: 'Jatuh Tempo Suket', count: datedUnits.length, icon: WarningOctagon },
    { id: 'LOG', label: 'Pengiriman Klien', count: clientLog.length, icon: BellRinging },
    { id: 'MISSING', label: 'Tanpa Tanggal', count: missingValidityItems.length, icon: Clock },
    { id: 'SKP', label: 'SKP Ahli K3', count: competencyItems.length, icon: ShieldCheck },
    { id: 'ALL', label: 'Semua', count: null, icon: null }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isPimpinan ? 'Monitoring Pengingat Masa Berlaku Suket' : 'Pengingat Suket Klien'}
        subtitle={
          isPimpinan
            ? 'Pengawasan siklus jatuh tempo perpanjangan Suket K3 klien (H-30, H-14, H-7), pengiriman notifikasi, dan repeat order.'
            : 'Monitoring siklus jatuh tempo H-30, H-14, H-7 dan perpanjangan Suket K3.'
        }
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <select
              aria-label="Jendela Hari Pengingat"
              value={daysWindow}
              onChange={(e) => setDaysWindow(Number(e.target.value))}
              className="h-9 rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-white dark:bg-[#151821] px-3 text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <option value={30}>Jendela H-30 Hari</option>
              <option value={60}>Jendela H-60 Hari</option>
              <option value={90}>Jendela H-90 Hari</option>
              <option value={180}>Jendela H-180 Hari</option>
              <option value={365}>Jendela H-365 Hari (1 Tahun)</option>
            </select>
            {canManage && (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={submitting}
                loading={submitting}
                icon={BellRinging}
                onClick={handleRunDispatch}
              >
                Jalankan Dispatch
              </Button>
            )}
          </div>
        }
      />

      {/* Segmented Control Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl w-full max-w-3xl overflow-x-auto border border-black/[0.06] dark:border-white/[0.08]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 px-3 text-xs font-semibold rounded-[9px] whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-black/[0.06] dark:bg-white/[0.10] text-[#1D1D1F] dark:text-[#F5F5F7]'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#98989D]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingState label="Memuat pengingat perpanjangan unit K3, Suket, dan SKP..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadData} />
      ) : (
        <div className="space-y-6">
          {(activeTab === 'ALL' || activeTab === 'EXPIRING') && (
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
          )}

          {(activeTab === 'ALL' || activeTab === 'LOG') && (
            <ClientDispatchSection channels={channels} clientLog={clientLog} />
          )}

          {(activeTab === 'ALL' || activeTab === 'MISSING') && (
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
          )}

          {(activeTab === 'ALL' || activeTab === 'SKP') && (
            <CompetencyRemindersSection competencyItems={competencyItems} />
          )}
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
