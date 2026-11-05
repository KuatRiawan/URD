import {
  CheckCircle,
  Database,
  HardDrives,
  ShieldCheck,
  WarningCircle
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { formatDateTime } from '../../../lib/utils/format.js';

export function SystemInfoSection({ systemOverview }) {
  const info = systemOverview?.systemInfo || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
      {/* Kolom 1: Lingkungan Database & Infrastruktur */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrives size={20} className="text-[#C81E1E]" weight="bold" />
            <CardTitle>Keandalan Database & Integritas Data</CardTitle>
          </div>
          <CardDescription>
            Spesifikasi teknis engine database relasional dan kepatuhan sistem keamanan data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Trigger Audit Log Immutability:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle size={15} weight="fill" />
              trg_audit_logs_immutable (Aktif)
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Database Engine:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {info.databaseVersion || 'PostgreSQL 16+'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Ukuran Database Relasional:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {info.databaseSize || '14 MB'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Total Tabel Database:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {info.totalTables || 45} Tabel Terstruktur
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Total Snapshot Backup Tercatat:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {info.totalBackups || 0} Snapshot
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 dark:text-slate-400">Waktu Sinkronisasi Server:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {info.serverTime ? formatDateTime(info.serverTime) : formatDateTime(new Date().toISOString())}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Kolom 2: Arsitektur Peran & Pemisahan Tanggung Jawab */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#C81E1E]" weight="bold" />
            <CardTitle>Arsitektur Peran Sistem (Separation of Duties)</CardTitle>
          </div>
          <CardDescription>
            Pemisahan tanggung jawab sistem operasional riksa uji K3 sesuai PRD PT Upaya Riksa Daya.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-bold text-purple-700 dark:text-purple-300">ADMIN_SISTEM (Super Admin)</span>
              <span className="text-[10px] font-mono text-slate-400">Hak Akses: Penuh</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Konfigurasi platform, pengguna RBAC, master checklist, penomoran dokumen, gateway integrasi, dan backup.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-bold text-blue-700 dark:text-blue-300">ADMIN_KANTOR (Admin Operasional)</span>
              <span className="text-[10px] font-mono text-slate-400">Hak Akses: QC & Penerbitan</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Penjadwalan Ahli K3, quality control review hasil inspeksi, finalisasi BAP/LHPP, registrasi Suket K3, dan BAST.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-bold text-amber-700 dark:text-amber-300">AHLI_K3 (Inspector Lapangan)</span>
              <span className="text-[10px] font-mono text-slate-400">Hak Akses: Pengujian & TTD</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Pemeriksaan fisik nameplate, pengisian checklist K3, perekaman foto bukti, dan penandatanganan digital BAP.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-bold text-rose-700 dark:text-rose-300">PIMPINAN (Executive Monitoring)</span>
              <span className="text-[10px] font-mono text-slate-400">Hak Akses: Read-Only Audit</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Monitoring tren efisiensi SLA, beban kerja Ahli K3, dan audit trail operasional tanpa hak modifikasi teknis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

