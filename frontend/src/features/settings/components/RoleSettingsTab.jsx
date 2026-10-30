import { CheckCircle } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function RoleSettingsTab({ user, meData }) {
  return (
    <div className="space-y-6">
      {/* A. Role: ADMIN_SISTEM */}
      {user?.role === 'ADMIN_SISTEM' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Legalitas &amp; Lisensi PJK3</CardTitle>
              <CardDescription>Identitas perusahaan yang terdaftar di Kementerian Ketenagakerjaan RI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Nama Lembaga</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">PT Upaya Riksa Daya</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Jenis Layanan</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">PJK3 Bidang Riksa Uji K3</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Nomor SKP PJK3</span>
                <span className="font-mono font-bold text-brand-600 dark:text-rose-400">
                  560/URD/PJK3-RIKSALAP/2024
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Wilayah Kerja Operasional</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Seluruh Wilayah Republik Indonesia</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integritas Sistem &amp; Audit Trail</CardTitle>
              <CardDescription>Status proteksi tabel dan keandalan data transaksi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Status Trigger Audit Log</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  trg_audit_logs_immutable (Aktif)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Database Engine</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">PostgreSQL Pool (Parameterized SQL)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Retensi Log Audit</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">365 Hari (Append-Only)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* B. Role: AHLI_K3 */}
      {user?.role === 'AHLI_K3' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kredensial Penunjukan Ahli K3</CardTitle>
              <CardDescription>Surat Keputusan Penunjukan (SKP) dan kompetensi riksa uji yang diampu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Nomor Pegawai / KTA</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {meData?.inspector?.employeeNo || 'URD-EXP-2024-001'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Otorisasi Form Pengujian</span>
                  <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle size={15} weight="fill" />
                    Diizinkan Entry Data &amp; TTD BAP
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Bidang Kompetensi Riksa Uji Terdaftar:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {meData?.inspector?.competencies?.length > 0 ? (
                    meData.inspector.competencies.map((comp, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                      >
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {comp.categoryName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                          No. {comp.certificateNo}
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-1">
                          Berlaku s/d: {formatDate(comp.validUntil)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">Pesawat Angkat &amp; Angkut (PAA)</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">SKP Ahli K3 Spesialis</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">Pesawat Tenaga &amp; Produksi (PTP)</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">SKP Ahli K3 Spesialis</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">Bejana Tekan &amp; Tangki Timbun (PUBT)</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">SKP Ahli K3 Spesialis</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* C. Role: ADMIN_KANTOR */}
      {user?.role === 'ADMIN_KANTOR' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Standarisasi Dokumen &amp; Registrasi</CardTitle>
              <CardDescription>Format penomoran berkas resmi yang dihasilkan kantor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Format Order PO</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">PO-URD-YYYY-XXXX</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Format Berita Acara (BAP)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">BAP-URD-YYYYMM-XXXX</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Format Dokumen LHPP</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">LHPP-URD-[KAT]-YYYY-XXXX</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Pengingat Masa Berlaku Suket</span>
                <span className="font-bold text-brand-600 dark:text-rose-400">H-60 &amp; H-30 Hari</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alur Pengiriman Laporan ke Klien</CardTitle>
              <CardDescription>Status portal klien dan tracking pengiriman fisik</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Akses Portal Klien Mandiri</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Aktif (Via Token Aman)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Verifikasi Barcode Suket</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Tersedia Publik</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Ekspedisi Resi Dokumen</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Pencatatan Manual &amp; Otomatis</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* D. Role: PIMPINAN */}
      {user?.role === 'PIMPINAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Otorisasi &amp; Approval Gate</CardTitle>
              <CardDescription>Hak persetujuan akhir laporan dan dokumen kepatuhan K3</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Persetujuan Laporan LHPP</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  Hak Otorisasi Final
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Pengembalian LHPP Revisi</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Didukung Catatan Koreksi</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Audit Rekapitulasi Riksa Uji</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Akses Eksekutif Nasional</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tanda Tangan Pengesahan Digital</CardTitle>
              <CardDescription>Keabsahan hukum dokumen hasil pemeriksaan PT Upaya Riksa Daya</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Setiap dokumen LHPP yang disetujui Pimpinan secara otomatis dibubuhkan nomor unik terverifikasi, tanggal pengesahan, serta kode QR verifikasi publik yang sah di hadapan Pengawas Ketenagakerjaan (Disnaker).
              </p>
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
                <span className="font-bold text-rose-900 dark:text-rose-300 block">Kepatuhan Regulasi K3</span>
                <span className="text-[11px] text-rose-800/80 dark:text-rose-400/80 mt-0.5 block">
                  Mengacu pada Permenaker No. 08/2020 (PAA), Permenaker No. 38/2016 (PTP), dan Permenaker No. 37/2016 (PUBT).
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

