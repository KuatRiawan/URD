import { useCallback, useEffect, useState } from 'react';
import {
  ArrowsClockwise,
  CheckCircle,
  ClockCounterClockwise,
  CloudCheck,
  Copy,
  Database,
  DownloadSimple,
  Eye,
  FileText,
  Image as ImageIcon,
  Queue,
  Trash,
  WarningCircle,
  WifiHigh,
  WifiSlash,
  X,
  XCircle
} from '@phosphor-icons/react';
import { api } from '../../../lib/api/axios.js';
import {
  clearSyncLogs,
  exportOfflineDraftJson,
  getPendingSyncSummary,
  listSyncLogs,
  performAutoSync,
  removeOfflineDraft,
  removeOfflinePhoto
} from '../../../lib/utils/offline-sync.js';
import { formatDateTime } from '../../../lib/utils/format.js';

export function OfflineSyncDrawer({ isOpen, onClose, onSyncComplete }) {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'history' | 'drafts'
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [summary, setSummary] = useState({
    pendingDraftsCount: 0,
    pendingPhotosCount: 0,
    totalPending: 0,
    drafts: [],
    photos: []
  });
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [inspectDraft, setInspectDraft] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  const refreshSummary = useCallback(async () => {
    try {
      const [data, logs] = await Promise.all([
        getPendingSyncSummary(),
        listSyncLogs()
      ]);
      setSummary(data);
      setSyncLogs(logs);
    } catch {
      setSummary({
        pendingDraftsCount: 0,
        pendingPhotosCount: 0,
        totalPending: 0,
        drafts: [],
        photos: []
      });
      setSyncLogs([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshSummary();
      setSyncResult(null);
      setErrorMsg('');
      setInspectDraft(null);
      setCopyFeedback('');
    }
  }, [isOpen, refreshSummary]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!online) {
      setErrorMsg('Perangkat saat ini tidak terhubung ke internet. Sinkronisasi membutuhkan koneksi aktif.');
      return;
    }
    setSyncing(true);
    setErrorMsg('');
    setSyncResult(null);
    try {
      const res = await performAutoSync(api, 'MANUAL');
      setSyncResult(res);
      await refreshSummary();
      if (onSyncComplete) onSyncComplete(res);
    } catch (err) {
      setErrorMsg(err.message || 'Sinkronisasi gagal. Coba beberapa saat lagi.');
    } finally {
      setSyncing(false);
    }
  };

  const handleRemoveDraft = async (inspectionId) => {
    if (window.confirm('Hapus draf lokal ini? Data yang belum tersinkron ke server akan hilang.')) {
      await removeOfflineDraft(inspectionId);
      if (inspectDraft?.inspectionId === inspectionId) setInspectDraft(null);
      await refreshSummary();
    }
  };

  const handleRemovePhoto = async (photoId) => {
    if (window.confirm('Hapus antrean foto ini dari penyimpanan lokal?')) {
      await removeOfflinePhoto(photoId);
      await refreshSummary();
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm('Bersihkan seluruh riwayat sinkronisasi?')) {
      await clearSyncLogs();
      setSyncLogs([]);
    }
  };

  const handleDownloadDraftJson = async (inspectionId) => {
    try {
      const jsonStr = await exportOfflineDraftJson(inspectionId);
      if (!jsonStr) {
        setErrorMsg('Data draf tidak ditemukan.');
        return;
      }
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `urd_backup_inspection_${inspectionId.slice(0, 8)}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg('Gagal mengekspor data draf: ' + (err.message || 'Terjadi kesalahan sistem.'));
    }
  };

  const handleCopyDraftJson = async (inspectionId) => {
    try {
      const jsonStr = await exportOfflineDraftJson(inspectionId);
      if (!jsonStr) return;
      await navigator.clipboard.writeText(jsonStr);
      setCopyFeedback(`Tersalin! (${inspectionId.slice(0, 8)}...)`);
      setTimeout(() => setCopyFeedback(''), 2500);
    } catch {
      setCopyFeedback('Gagal menyalin ke clipboard');
      setTimeout(() => setCopyFeedback(''), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 overflow-hidden border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${online ? 'bg-emerald-600' : 'bg-amber-600'}`}>
              {online ? <WifiHigh size={20} weight="bold" /> : <WifiSlash size={20} weight="bold" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Penyimpanan &amp; Sinkronisasi
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pusat data offline-first &amp; antrean lokal URD
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel sinkronisasi"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Queue size={14} weight="bold" />
              <span>Antrean ({summary.totalPending})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ClockCounterClockwise size={14} weight="bold" />
              <span>Riwayat ({syncLogs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('drafts')}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'drafts'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database size={14} weight="bold" />
              <span>Draf ({summary.pendingDraftsCount})</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: ANTREAN SINKRONISASI */}
          {activeTab === 'queue' && (
            <>
              {/* Status Jaringan Kartu */}
              <div className={`p-4 rounded-2xl border transition-all ${
                online
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-100'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-xs font-black uppercase tracking-wider">
                      {online ? 'Online (Terhubung)' : 'Offline (Sinyal Terputus)'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80">
                    {summary.totalPending} Antrean
                  </span>
                </div>
                <p className="text-xs mt-2 leading-relaxed opacity-90">
                  {online
                    ? 'Koneksi ke server PT Upaya Riksa Daya aktif. Semua draf dan foto dapat disinkronkan langsung.'
                    : 'Pemeriksaan tetap dapat berjalan normal. Hasil ceklis, catatan kelayakan, dan foto disimpan aman di IndexedDB perangkat ini.'}
                </p>
              </div>

              {/* Tombol Aksi Sinkronkan Sekarang */}
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing || !online || summary.totalPending === 0}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-[#C81E1E] text-white font-extrabold text-xs shadow-md hover:bg-[#a61717] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowsClockwise size={18} weight="bold" className={syncing ? 'animate-spin' : ''} />
                <span>
                  {syncing
                    ? 'Menyinkronkan Data ke Server...'
                    : summary.totalPending === 0
                    ? 'Semua Data Telah Tersinkron'
                    : `Sinkronkan Sekarang (${summary.totalPending} Item)`}
                </span>
              </button>

              {/* Feedback & Hasil Sinkronisasi */}
              {syncResult && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  syncResult.errors?.length > 0
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {syncResult.errors?.length > 0 ? (
                      <WarningCircle size={16} weight="fill" className="text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle size={16} weight="fill" className="text-emerald-600 shrink-0" />
                    )}
                    <span>
                      {syncResult.errors?.length > 0
                        ? 'Sinkronisasi selesai dengan beberapa catatan'
                        : 'Sinkronisasi berhasil sepenuhnya!'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Terkirim: {syncResult.syncedDrafts || 0} formulir draf, {syncResult.syncedPhotos || 0} foto lapangan.
                  </p>
                  {syncResult.errors?.map((err, i) => (
                    <div key={i} className="text-[10px] text-rose-700 dark:text-rose-300 font-mono">
                      &bull; {err.type}: {err.error || 'Gagal terkirim'}
                    </div>
                  ))}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <WarningCircle size={16} weight="bold" className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Antrean Draf Formulir Inspeksi */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText size={15} weight="bold" className="text-[#C81E1E]" />
                    <span>Draf Formulir Lokal ({summary.pendingDraftsCount})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">IndexedDB</span>
                </div>

                {summary.drafts.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    Tidak ada draf formulir yang tertahan di penyimpanan lokal.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {summary.drafts.map((d) => (
                      <div
                        key={d.inspectionId}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-slate-900 dark:text-white truncate">
                            ID: {d.inspectionId.slice(0, 14)}...
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Tersimpan: {d.updatedAt ? formatDateTime(d.updatedAt) : 'Baru saja'}
                          </div>
                          <div className="text-[10px] text-[#C81E1E] dark:text-rose-400 font-semibold mt-0.5">
                            {d.payload?.results ? Object.keys(d.payload.results).length : 0} Butir ceklis tercatat
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDownloadDraftJson(d.inspectionId)}
                            title="Unduh cadangan JSON"
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                          >
                            <DownloadSimple size={15} weight="bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDraft(d.inspectionId)}
                            title="Hapus draf dari penyimpanan lokal"
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash size={15} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Antrean Foto Lapangan */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon size={15} weight="bold" className="text-[#C81E1E]" />
                    <span>Antrean Foto Lapangan ({summary.pendingPhotosCount})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Menunggu Unggah</span>
                </div>

                {summary.photos.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    Tidak ada foto tertunda dalam antrean unggah.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {summary.photos.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0 overflow-hidden">
                            {p.file ? (
                              <img
                                src={URL.createObjectURL(p.file)}
                                alt="Pratinjau antrean"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={20} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {p.caption || 'Foto Riksa Uji'}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {p.file?.name} &bull; {p.file ? Math.round(p.file.size / 1024) : 0} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(p.id)}
                          title="Hapus foto dari antrean lokal"
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash size={15} weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: RIWAYAT SINKRONISASI */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Log Riwayat Sinkronisasi
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Catatan sinkronisasi otomatis &amp; manual
                  </p>
                </div>
                {syncLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Trash size={13} />
                    Bersihkan Riwayat
                  </button>
                )}
              </div>

              {syncLogs.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
                  <ClockCounterClockwise size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Belum ada riwayat sinkronisasi
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Setiap proses sinkronisasi offline ke server akan otomatis tercatat di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {syncLogs.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    const isPartial = log.status === 'PARTIAL';
                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold">
                            {isSuccess ? (
                              <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
                            ) : isPartial ? (
                              <WarningCircle size={15} weight="fill" className="text-amber-600 shrink-0" />
                            ) : (
                              <XCircle size={15} weight="fill" className="text-rose-600 shrink-0" />
                            )}
                            <span className={isSuccess ? 'text-emerald-700 dark:text-emerald-400' : isPartial ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}>
                              {isSuccess ? 'Berhasil Penuh' : isPartial ? 'Sebagian Berhasil' : 'Gagal'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.timestamp ? formatDateTime(log.timestamp) : ''}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                          <span>
                            Draf: <b>{log.syncedDrafts || 0}</b> &bull; Foto: <b>{log.syncedPhotos || 0}</b>
                          </span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {log.trigger || 'AUTO'}
                          </span>
                        </div>

                        {log.errors?.length > 0 && (
                          <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[10px] text-rose-800 dark:text-rose-300 space-y-0.5">
                            {log.errors.map((err, i) => (
                              <div key={i} className="font-mono">
                                &bull; {err.type}: {err.error || 'Koneksi gagal'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DRAF LOKAL & EKSPOR CADANGAN */}
          {activeTab === 'drafts' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Manajemen Draf &amp; Cadangan Darurat
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Inspeksi data mentah isian ceklis yang tersimpan di memori browser ini.
                </p>
              </div>

              {copyFeedback && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 text-center">
                  {copyFeedback}
                </div>
              )}

              {summary.drafts.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  Tidak ada draf lokal yang tersimpan.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.drafts.map((d) => (
                    <div
                      key={d.inspectionId}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ID: {d.inspectionId}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {d.updatedAt ? formatDateTime(d.updatedAt) : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div>
                          Butir Ceklis: <b>{d.payload?.results ? Object.keys(d.payload.results).length : 0}</b>
                        </div>
                        <div>
                          Kesimpulan: <b>{d.payload?.conclusion || 'Belum dipilih'}</b>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setInspectDraft(inspectDraft?.inspectionId === d.inspectionId ? null : d)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer text-[11px]"
                        >
                          <Eye size={13} />
                          {inspectDraft?.inspectionId === d.inspectionId ? 'Tutup Pratinjau' : 'Lihat Data JSON'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyDraftJson(d.inspectionId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-[11px]"
                        >
                          <Copy size={13} />
                          Salin
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadDraftJson(d.inspectionId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors cursor-pointer text-[11px]"
                        >
                          <DownloadSimple size={13} />
                          Unduh JSON
                        </button>
                      </div>

                      {/* Expandable JSON Inspector */}
                      {inspectDraft?.inspectionId === d.inspectionId && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
                          <pre>{JSON.stringify(d.payload, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <CloudCheck size={16} className="text-slate-400" />
            <span>Penyimpanan Aman Browser (URD Field-First)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
