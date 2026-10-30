import { useCallback, useEffect, useState } from 'react';
import {
  ArrowsClockwise,
  BellRinging,
  CalendarPlus,
  Certificate,
  EnvelopeSimple,
  PaperPlaneTilt,
  WarningOctagon,
  WhatsappLogo
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { FOLLOWUP_STATUS_LABELS, formatDate } from '../../lib/utils/format.js';

function normalizePhoneForWhatsApp(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

function buildUnitReminderText(item) {
  const picLabel = item.contact_name ? `Bapak/Ibu ${item.contact_name}` : 'Bapak/Ibu PIC K3';
  const validDate = item.effective_valid_until
    ? formatDate(item.effective_valid_until)
    : 'Segera Jatuh Tempo';

  return [
    `Yth. ${picLabel} (${item.client_name || 'Perusahaan Klien'}),`,
    '',
    'Kami dari PT Upaya Riksa Daya ingin mengingatkan jadwal pemeriksaan dan pengujian (riksa uji) berkala untuk unit peralatan K3 berikut:',
    `- Unit Alat: ${item.object_name || '-'} (${item.category_code || '-'})`,
    `- Nomor Seri: ${item.serial_number || '-'}`,
    `- Lokasi Unit: ${item.location_name || item.location_city || '-'}`,
    `- Nomor LHPP / Suket Terakhir: ${item.last_lhpp_no || item.suket_no || '-'}`,
    `- Tanggal Jatuh Tempo Riksa Uji: ${validDate}`,
    '',
    'Untuk menjaga kepatuhan K3 dan kelangsungan operasional peralatan, kami siap membantu penjadwalan riksa uji perpanjangan unit tersebut.',
    '',
    'Terima kasih atas perhatian dan kerja samanya.',
    'PT Upaya Riksa Daya'
  ].join('\n');
}

function buildUnitWhatsAppUrl(item) {
  const phone = normalizePhoneForWhatsApp(item.contact_phone || item.client_phone);
  const text = encodeURIComponent(buildUnitReminderText(item));
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}

function buildUnitEmailUrl(item) {
  const email = item.contact_email || item.client_email || '';
  const subject = encodeURIComponent(
    `Pengingat Perpanjangan Riksa Uji K3 - ${item.object_name || 'Unit Alat'} (${item.client_name || ''})`
  );
  const body = encodeURIComponent(buildUnitReminderText(item));
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

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
      const poNo = res.data?.order?.po_number || res.data?.order?.order_no || 'Baru';
      setFeedback(
        `PO perpanjangan (${poNo}) berhasil dibuat otomatis untuk unit ${objectName || ''}.`
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
    if (!validityModalUnit) return;
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/reminders/units/${validityModalUnit.object_id}/validity`, {
        nextInspectionDate: validityForm.nextInspectionDate || null,
        followupStatus: validityForm.followupStatus || null,
        note: validityForm.note || null
      });
      setValidityModalUnit(null);
      setFeedback('Tanggal masa berlaku / status tindak lanjut unit berhasil diperbarui.');
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal menyimpan tanggal masa berlaku unit.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const datedUnits = unitReminders.filter(
    (u) => u.expiryState !== 'DATA_MASA_BERLAKU_BELUM_LENGKAP'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengingat Perpanjangan Unit K3, Suket & SKP Ahli K3"
        subtitle="Pantau unit alat yang akan kedaluwarsa, jatuh tempo pemeriksaan, sudah kedaluwarsa, maupun unit yang belum memiliki tanggal masa berlaku resmi."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Jendela Hari Pengingat"
              value={daysWindow}
              onChange={(e) => setDaysWindow(Number(e.target.value))}
              className="min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
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
                className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50"
              >
                <BellRinging size={16} weight="bold" />
                <span>Jalankan Dispatch Pengingat</span>
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
          {/* 0. Pengiriman otomatis ke klien */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PaperPlaneTilt size={20} className="text-[#C81E1E]" weight="bold" />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Pengiriman Otomatis ke Klien
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dikirim setiap hari pukul 07:00 pada H-90, H-60, H-30, H-14, dan H-0.
                  </p>
                </div>
              </div>
              {channels && (
                <div className="flex items-center gap-2">
                  <Badge tone={channels.email === 'AKTIF' ? 'success' : 'warning'}>
                    Email: {channels.email === 'AKTIF' ? 'Aktif' : 'Simulasi'}
                  </Badge>
                  <Badge tone={channels.whatsapp === 'AKTIF' ? 'success' : 'warning'}>
                    WhatsApp: {channels.whatsapp === 'AKTIF' ? 'Aktif' : 'Simulasi'}
                  </Badge>
                </div>
              )}
            </div>
            {channels && (channels.email !== 'AKTIF' || channels.whatsapp !== 'AKTIF') && (
              <div className="px-5 pt-4">
                <Notice tone="warning" title="Kanal belum terhubung">
                  Kanal berstatus Simulasi hanya dicatat pada log dan tidak dikirim ke klien.
                  Isi pengaturan SMTP dan token WhatsApp pada berkas .env server untuk mengaktifkan
                  pengiriman nyata.
                </Notice>
              </div>
            )}
            {clientLog.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Belum ada pengiriman"
                  description="Log muncul setelah evaluasi harian atau tombol Jalankan Dispatch Pengingat dijalankan."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Unit dan Klien</th>
                      <th className="py-3 px-4">Tahap</th>
                      <th className="py-3 px-4">Kanal dan Tujuan</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {clientLog.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDate(row.updated_at)}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{row.object_name}</div>
                          <div className="text-slate-500 dark:text-slate-400">{row.client_name}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{row.stage.replace('H', 'H-')}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {row.channel === 'EMAIL' ? 'Email' : 'WhatsApp'}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">{row.recipient || '-'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            tone={
                              row.status === 'TERKIRIM'
                                ? 'success'
                                : row.status === 'GAGAL'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {row.status === 'TERKIRIM'
                              ? 'Terkirim'
                              : row.status === 'GAGAL'
                                ? 'Gagal'
                                : row.status === 'SIMULASI'
                                  ? 'Simulasi'
                                  : 'Dilewati'}
                          </Badge>
                          {row.error_message && (
                            <div className="mt-1 text-[11px] text-red-700 dark:text-red-400">{row.error_message}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 1. Unit Alat dengan Tanggal Masa Berlaku Tercatat */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WarningOctagon size={20} className="text-[#C81E1E]" weight="bold" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Unit Alat Mendekati Jatuh Tempo / Kedaluwarsa ({datedUnits.length})
                </h2>
              </div>
            </div>

            {datedUnits.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Tidak ada unit jatuh tempo dalam jendela ini"
                  description="Unit yang memiliki tanggal masa berlaku atau jadwal pemeriksaan berikutnya dalam jendela hari ini akan tampil di sini."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Status Masa Berlaku</th>
                      <th className="py-3 px-4">Tanggal Jatuh Tempo</th>
                      <th className="py-3 px-4">Perusahaan Klien</th>
                      <th className="py-3 px-4">Unit Alat & Nomor Seri</th>
                      <th className="py-3 px-4">Tindak Lanjut</th>
                      <th className="py-3 px-4 text-right">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {datedUnits.map((item) => (
                      <tr key={item.object_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-xs">
                          <Badge
                            tone={
                              item.expiryState === 'SUDAH_KEDALUWARSA' ||
                              item.expiryState === 'JATUH_TEMPO_PEMERIKSAAN'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {EXPIRY_STATE_LABELS[item.expiryState] || item.expiryState}
                          </Badge>
                          <div className="mt-1 font-bold text-slate-900 dark:text-slate-100">
                            {item.days_remaining < 0
                              ? `Lewat ${Math.abs(item.days_remaining)} hari`
                              : item.days_remaining === 0
                              ? 'Jatuh tempo hari ini'
                              : `${item.days_remaining} hari lagi`}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {formatDate(item.effective_valid_until)}
                          </div>
                          {item.suket_no && (
                            <div className="font-mono text-slate-500 dark:text-slate-400">Suket: {item.suket_no}</div>
                          )}
                          {item.last_lhpp_no && (
                            <div className="font-mono text-slate-500 dark:text-slate-400">LHPP: {item.last_lhpp_no}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{item.client_name}</div>
                          <div className="text-slate-600 dark:text-slate-400">
                            PIC: {item.contact_name || '-'} · {item.contact_phone || item.client_phone || '-'}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {item.contact_email || item.client_email || '-'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{item.object_name}</div>
                          <div className="text-slate-500 dark:text-slate-400">
                            {item.category_code} · SN: {item.serial_number}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {FOLLOWUP_STATUS_LABELS[item.followup_status] || item.followup_status}
                          </div>
                          {item.last_followup_note && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {item.last_followup_note}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <span
                              title="Pengingat perpanjangan dikirimkan secara terjadwal otomatis melalui WhatsApp Business API dan Email resmi PT Upaya Riksa Daya"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold"
                            >
                              <WhatsappLogo size={13} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                              <EnvelopeSimple size={13} weight="bold" className="text-blue-600 dark:text-blue-400" />
                              <span>Otomatis (WABA + Email)</span>
                            </span>
                            {canManage && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValidityModalUnit(item);
                                    setValidityForm({
                                      nextInspectionDate: item.effective_valid_until
                                        ? String(item.effective_valid_until).slice(0, 10)
                                        : '',
                                      followupStatus: item.followup_status || 'SUDAH_DIHUBUNGI',
                                      note: item.last_followup_note || ''
                                    });
                                  }}
                                  className="min-h-9 inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  <CalendarPlus size={14} />
                                  <span>Catat Tindak Lanjut</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={() =>
                                    handleCreateUnitRenewalOrder(item.object_id, item.object_name)
                                  }
                                  className="min-h-9 inline-flex items-center gap-1.5 rounded bg-slate-800 dark:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-600"
                                >
                                  <ArrowsClockwise size={15} />
                                  <span>Buat PO Perpanjangan</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 2. Bagian 10: Unit yang Belum Memiliki Tanggal Masa Berlaku (Tanpa Mengarang Tanggal) */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-800/60 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WarningOctagon size={20} className="text-amber-700 dark:text-amber-400" weight="bold" />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Unit Belum Ada Tanggal Masa Berlaku / Data Masa Berlaku Belum Lengkap (
                    {missingValidityItems.length})
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Sistem tidak mengarang tanggal jatuh tempo bila tanggal berlaku resmi belum dicatat pada Suket, LHPP, atau data unit.
                  </p>
                </div>
              </div>
            </div>

            {missingValidityItems.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Seluruh unit aktif telah memiliki tanggal masa berlaku"
                  description="Tidak ada unit yang belum tercatat tanggal masa berlakunya."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Unit Alat & Kategori</th>
                      <th className="py-3 px-4">Perusahaan Klien</th>
                      <th className="py-3 px-4">Pemeriksaan Terakhir</th>
                      <th className="py-3 px-4">Status Data Masa Berlaku</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {missingValidityItems.map((u) => (
                      <tr key={u.object_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{u.object_name}</div>
                          <div className="text-slate-500 dark:text-slate-400">
                            {u.category_code} · SN: <span className="font-mono">{u.serial_number}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {u.client_name}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                          {u.last_inspected_at
                            ? `Tgl: ${formatDate(u.last_inspected_at)} (${u.last_po_number || u.last_order_no})`
                            : 'Belum pernah diperiksa'}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <Badge tone="warning">Belum Ada Tanggal Masa Berlaku</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => {
                                setValidityModalUnit(u);
                                setValidityForm({
                                  nextInspectionDate: '',
                                  followupStatus: 'BELUM_DITINDAKLANJUTI',
                                  note: ''
                                });
                              }}
                              className="min-h-9 inline-flex items-center gap-1.5 rounded bg-slate-900 dark:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-600"
                            >
                              <CalendarPlus size={15} />
                              <span>Tetapkan Tanggal Masa Berlaku</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 3. Pengingat SKP Ahli K3 */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Certificate size={20} className="text-slate-600 dark:text-slate-400" weight="bold" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Pengingat Masa Berlaku SKP / Lisensi Ahli K3 ({competencyItems.length})
                </h2>
              </div>
            </div>

            {competencyItems.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Seluruh SKP Ahli K3 masih berlaku"
                  description="Tidak ada SKP Ahli K3 yang jatuh tempo dalam jendela hari yang dipilih."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Tahap</th>
                      <th className="py-3 px-4">Nama Ahli K3</th>
                      <th className="py-3 px-4">Bidang K3</th>
                      <th className="py-3 px-4">Nomor SKP</th>
                      <th className="py-3 px-4">Berlaku Sampai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {competencyItems.map((comp) => (
                      <tr key={comp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 text-xs">
                          <Badge tone="warning">
                            {(comp.stage || 'H-90').replace('_', '-')} ({comp.days_remaining} hari)
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-slate-900 dark:text-slate-100">
                          {comp.inspector_name}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{comp.category_code}</span>{' '}
                          · {comp.category_name}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono">{comp.certificate_no}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold">
                          {formatDate(comp.valid_until)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal Tetapkan Tanggal Masa Berlaku & Status Tindak Lanjut Unit */}
      <Modal
        open={Boolean(validityModalUnit)}
        onClose={() => setValidityModalUnit(null)}
        title={
          validityModalUnit
            ? `Masa Berlaku & Tindak Lanjut: ${validityModalUnit.object_name}`
            : 'Masa Berlaku Unit'
        }
      >
        {validityModalUnit && (
          <form onSubmit={handleSaveUnitValidity} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Tanggal Masa Berlaku Resmi / Jadwal Pemeriksaan Berkala Berikutnya
              </label>
              <input
                type="date"
                value={validityForm.nextInspectionDate}
                onChange={(e) =>
                  setValidityForm((prev) => ({ ...prev, nextInspectionDate: e.target.value }))
                }
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Status Tindak Lanjut Perpanjangan
              </label>
              <select
                value={validityForm.followupStatus}
                onChange={(e) =>
                  setValidityForm((prev) => ({ ...prev, followupStatus: e.target.value }))
                }
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="BELUM_DITINDAKLANJUTI">Belum Ditindaklanjuti</option>
                <option value="SUDAH_DIHUBUNGI">Sudah Dihubungi</option>
                <option value="MENUNGGU_KONFIRMASI_KLIEN">Menunggu Konfirmasi Klien</option>
                <option value="SUDAH_JADI_PO_BARU">Sudah Jadi PO Baru</option>
                <option value="DITUNDA">Ditunda</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Catatan Tindak Lanjut / Dasar Masa Berlaku
              </label>
              <textarea
                rows={2}
                value={validityForm.note}
                onChange={(e) => setValidityForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Contoh: Tanggal berlaku berdasarkan Suket Disnaker / rekomendasi LHPP..."
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setValidityModalUnit(null)}
                className="min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-10 rounded bg-[#C81E1E] px-4 py-2 font-bold text-white hover:bg-[#a11616]"
              >
                Simpan Masa Berlaku
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
