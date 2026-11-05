import { useState } from 'react';
import {
  CheckCircle,
  Database,
  DownloadSimple,
  HardDrives,
  Info,
  ShieldCheck,
  TerminalWindow,
  WarningCircle
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDateTime } from '../../../lib/utils/format.js';

export function DatabaseBackupsSection({
  backups,
  creatingBackup,
  handleCreateBackup,
  handleDownloadBackup,
  handleVerifyBackup,
  verifyingId
}) {
  const [showRunbook, setShowRunbook] = useState(false);

  const computeTotalRows = (summary) => {
    if (!summary || typeof summary !== 'object') return null;
    if (typeof summary._meta?.totalRows === 'number') return summary._meta.totalRows;
    return Object.entries(summary)
      .filter(([k, v]) => k !== '_meta' && typeof v === 'number')
      .reduce((acc, [, v]) => acc + v, 0);
  };

  return (
    <div className="space-y-6">
      {/* 1. Panel Snapshot Database */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Database size={20} className="text-[#C81E1E]" weight="bold" />
                <CardTitle>Pencadangan Database & Manajemen Arsip SQL Relasional</CardTitle>
              </div>
              <CardDescription>
                Pembuatan arsip SQL dump PostgreSQL lengkap (skema metadata & statement INSERT seluruh tabel transaksi) untuk pemulihan bencana dan kepatuhan audit.
              </CardDescription>
            </div>
            <Button
              type="button"
              size="md"
              variant="primary"
              loading={creatingBackup}
              onClick={handleCreateBackup}
              icon={DownloadSimple}
            >
              Buat Snapshot Cadangan Sekarang
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {/* Transparent Technical Notice */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 space-y-2">
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" weight="bold" />
              <div>
                <strong className="block font-semibold">Cakupan Teknis Arsip SQL Dump Database:</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Setiap snapshot menghasilkan file dump SQL relasional lengkap (`BEGIN ... INSERT INTO ... COMMIT`) dari 24 tabel operasional (orders, unit alat, jadwal, inspeksi, BAP, LHPP, Suket K3, pengguna, dan audit logs) beserta verifikasi checksum integritas SHA-256.
                </p>
              </div>
            </div>
          </div>

          {/* Daftar Riwayat Snapshot Backup */}
          <div className="space-y-2">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Riwayat Snapshot Tersimpan ({backups.length} Entri)
            </h4>

            {backups.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Belum ada riwayat snapshot backup database tercatat. Klik tombol "Buat Snapshot Cadangan Sekarang" di atas untuk membuat snapshot pertama.
              </p>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {backups.map((b) => {
                  const totalRows = computeTotalRows(b.summary);
                  const sha256 = b.summary?._meta?.sha256;
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {b.filename}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Status: {b.status}
                          </span>
                          {totalRows !== null && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {totalRows} baris data
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Dibuat: <strong>{formatDateTime(b.created_at)}</strong> · Oleh: {b.created_by_name || 'Admin Sistem'} · Tipe: {b.backup_type}
                          {sha256 && (
                            <span className="font-mono text-[10px] text-slate-400 ml-2">
                              · SHA-256: {sha256.slice(0, 12)}...
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1">
                          {Math.max(1, Math.round((b.file_size_bytes || 0) / 1024))} KB
                        </span>
                        {handleVerifyBackup && (
                          <button
                            type="button"
                            disabled={verifyingId === b.id}
                            onClick={() => handleVerifyBackup(b)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800 disabled:opacity-50"
                            title="Verifikasi Integritas Checksum SQL"
                          >
                            <ShieldCheck size={14} weight="bold" />
                            <span>{verifyingId === b.id ? 'Memverifikasi...' : 'Verifikasi'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownloadBackup(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                          title="Unduh File Snapshot SQL"
                        >
                          <DownloadSimple size={14} weight="bold" />
                          <span>Unduh SQL</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Prosedur & Runbook Pemulihan Bencana (Disaster Recovery Runbook) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TerminalWindow size={20} className="text-slate-700 dark:text-slate-300" weight="bold" />
              <CardTitle>Runbook Pemulihan Database (Disaster Recovery)</CardTitle>
            </div>
            <button
              type="button"
              onClick={() => setShowRunbook(!showRunbook)}
              className="text-xs font-bold text-[#C81E1E] hover:underline cursor-pointer"
            >
              {showRunbook ? 'Sembunyikan Panduan' : 'Buka Panduan Teknis CLI'}
            </button>
          </div>
          <CardDescription>
            Demi keamanan data dan mencegah insiden kerusakan transaksi yang sedang berjalan, restorasi database PostgreSQL dilakukan melalui antarmuka baris perintah (CLI) oleh Administrator Infrastruktur, bukan melalui tombol otomatis di web browser.
          </CardDescription>
        </CardHeader>
        {showRunbook && (
          <CardContent className="space-y-4 text-xs pt-0">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono space-y-2">
              <span className="text-[11px] text-slate-400 block font-sans">
                Langkah 1: Hubungkan ke server PostgreSQL produksi via terminal:
              </span>
              <p className="text-emerald-400">$ pg_dump -U postgres -d urd_production -F c -b -v -f /var/backups/urd_full_backup.dump</p>

              <span className="text-[11px] text-slate-400 block font-sans pt-2">
                Langkah 2: Melakukan restorasi dari arsip snapshot cadangan:
              </span>
              <p className="text-amber-300">$ pg_restore -U postgres -d urd_production -v -c /var/backups/urd_full_backup.dump</p>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 space-y-1">
              <strong className="block font-semibold">Pemberitahuan Prosedur Keamanan:</strong>
              <p className="text-[11px] leading-snug">
                Restorasi database in-place secara instan melalui web sengaja ditiadakan untuk memitigasi risiko pembatalan sepihak data transaksi inspeksi lapangan yang sah. Segala proses pemulihan bencana wajib mengikuti SOP pemulihan data PJK3 PT Upaya Riksa Daya.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

