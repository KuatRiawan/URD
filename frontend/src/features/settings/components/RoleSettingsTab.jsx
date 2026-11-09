import { CheckCircle } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card.jsx';
import { formatDate } from '../../../lib/utils/format.js';
import { SuperAdminConsole } from './SuperAdminConsole.jsx';

export function RoleSettingsTab({ user, meData }) {
  return (
    <div className="space-y-6">
      {/* A. Role: ADMIN_SISTEM */}
      {user?.role === 'ADMIN_SISTEM' && <SuperAdminConsole />}

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
                <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7]/70 dark:bg-white/[0.03]">
                  <span className="text-[11px] font-semibold text-[#6E6E73] dark:text-slate-400">Nomor Pegawai / KTA</span>
                  <p className="font-semibold text-sm text-[#1D1D1F] dark:text-slate-100 mt-1">
                    {meData?.inspector?.employeeNo || 'Belum tercatat'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7]/70 dark:bg-white/[0.03]">
                  <span className="text-[11px] font-semibold text-[#6E6E73] dark:text-slate-400">Otorisasi Form Pengujian</span>
                  <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle size={15} weight="fill" />
                    Diizinkan Entry Data &amp; TTD BAP
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 mb-2">
                  Bidang Kompetensi Riksa Uji Terdaftar:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {meData?.inspector?.competencies?.length > 0 ? (
                    meData.inspector.competencies.map((comp, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1E26] text-xs"
                      >
                        <span className="font-semibold text-[#1D1D1F] dark:text-slate-100 block">
                          {comp.categoryName}
                        </span>
                        <span className="text-[11px] font-mono text-[#6E6E73] dark:text-slate-400 block mt-0.5">
                          No. {comp.certificateNo}
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-1">
                          Berlaku s/d: {formatDate(comp.validUntil)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1E26] text-xs">
                        <span className="font-semibold text-[#1D1D1F] dark:text-slate-100 block">Pesawat Angkat &amp; Angkut (PAA)</span>
                        <span className="text-[11px] text-[#6E6E73] dark:text-slate-400 block mt-0.5">SKP Ahli K3 Spesialis</span>
                      </div>
                      <div className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1E26] text-xs">
                        <span className="font-semibold text-[#1D1D1F] dark:text-slate-100 block">Pesawat Tenaga &amp; Produksi (PTP)</span>
                        <span className="text-[11px] text-[#6E6E73] dark:text-slate-400 block mt-0.5">SKP Ahli K3 Spesialis</span>
                      </div>
                      <div className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1E26] text-xs">
                        <span className="font-semibold text-[#1D1D1F] dark:text-slate-100 block">Bejana Tekan &amp; Tangki Timbun (PUBT)</span>
                        <span className="text-[11px] text-[#6E6E73] dark:text-slate-400 block mt-0.5">SKP Ahli K3 Spesialis</span>
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
              <CardTitle>Monitoring Operasional &amp; Executive Oversight</CardTitle>
              <CardDescription>Hak pengawasan kinerja, kepatuhan K3, dan evaluasi ketercapaian SLA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Mode Akses Dashboard</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  Read-Only Executive Monitoring
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Kewenangan Review/QC Teknis</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Admin Kantor (Operasional)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Audit Rekapitulasi Riksa Uji</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Akses Eksekutif Penuh</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integritas Tata Kelola PJK3</CardTitle>
              <CardDescription>Pemisahan tanggung jawab operasional dan fungsi pengawasan independen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Sesuai tata kelola operasional URD, Pimpinan berperan sebagai pihak pengawas independen (Executive Oversight) untuk memastikan beban kerja Inspector seimbang, SLA penyelesaian laporan terjaga, dan tidak terjadi bottleneck pada penerbitan Suket Disnaker.
              </p>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 block">Kepatuhan Regulasi &amp; SOP</span>
                <span className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-0.5 block">
                  Finalisasi teknis dilakukan oleh Admin Kantor dan Ahli K3 bersertifikat Kemnaker R.I. tanpa intervensi komersial.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* E. Role: MARKETING */}
      {user?.role === 'MARKETING' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Kewenangan &amp; Ruang Lingkup Komersial</CardTitle>
              <CardDescription>Hak akses dan wewenang operasional peran Marketing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Pendaftaran PO &amp; Multi-Unit</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  Akses Penuh
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Database Klien &amp; Kontak PIC</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  Kelola &amp; Tetapkan PIC
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">PO Perpanjangan / Repeat Order</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  Otomatis dari Histori
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Follow-Up &amp; Dispatch Pengingat</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  Catat &amp; Evaluasi H-30/14/7
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Batasan Kepatuhan Regulasi K3</CardTitle>
              <CardDescription>Pemisahan tanggung jawab komersial dan independensi teknis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Untuk menjamin objektivitas pengujian sesuai regulasi Kemnaker R.I. dan standar PJK3 PT Upaya Riksa Daya, Marketing tidak memiliki kewenangan mengubah data teknis hasil inspeksi lapangan, nilai pengukuran, atau keputusan kelayakan alat.
              </p>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Independensi Hasil Riksa Uji</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 block">
                  Keputusan teknis dan penerbitan berkas LHPP merupakan wewenang mutlak Ahli K3 dan Quality Control Admin Kantor.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

