import { useState } from 'react';
import {
  ArrowRight,
  Buildings,
  CheckCircle,
  Clock,
  DownloadSimple,
  FileDoc,
  FileText,
  IdentificationBadge,
  MapPin,
  PencilSimple,
  ShieldCheck,
  User,
  Wrench
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button.jsx';
import { api } from '../../../lib/api/axios.js';

export function StepChecklist({
  inspection = {},
  draftObjectAttributes = {},
  setDraftObjectAttributes,
  readOnly = false,
  onNext
}) {
  const [isEditingDataUmum, setIsEditingDataUmum] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState('');

  const attrs = draftObjectAttributes || {};

  const handleAttrChange = (key, value) => {
    if (setDraftObjectAttributes) {
      setDraftObjectAttributes((prev) => ({
        ...(prev || {}),
        [key]: value
      }));
    }
  };

  const handleDownloadLhppDocx = async () => {
    try {
      setDownloadingDocx(true);
      setDownloadFeedback('');
      const res = await api.get(`/inspections/${inspection.id}/lhpp/docx`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Blangko-LHPP-${(inspection.object_name || 'Alat').replace(/\s+/g, '-')}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setDownloadFeedback('Blangko Word LHPP berhasil diunduh.');
    } catch {
      setDownloadFeedback('Gagal mengunduh blangko Word LHPP.');
    } finally {
      setDownloadingDocx(false);
    }
  };

  // Values combining master data and user edits
  const clientName = attrs.owner_name || inspection.client_name || '-';
  const clientAddress = attrs.owner_address || inspection.client_address || '-';
  const userName = attrs.user_name || inspection.location_name || inspection.client_name || '-';
  const userAddress = attrs.user_address || inspection.location_address || inspection.client_address || '-';
  const picName = attrs.pic_name || inspection.pic_name || '-';
  const installLocation = attrs.install_location || inspection.install_location || '-';

  const domainName = inspection.domain_name || 'Pesawat Angkat & Pesawat Angkut';
  const categoryName = inspection.category_name || 'Forklift';
  const objectName = inspection.equipment_type_name || inspection.object_name || 'Forklift Industri';
  const serialNo = attrs.serial_number || inspection.serial_number || '-';
  const brand = attrs.brand || inspection.brand || '-';
  const model = attrs.model || inspection.model || '-';
  const year = attrs.manufacture_year || inspection.manufacture_year || '-';
  const capacity = attrs.capacity || inspection.capacity || '-';
  const capacityUnit = attrs.capacity_unit || inspection.capacity_unit || 'kg';
  const attachment = attrs.attachment || attrs.perlengkapan || 'Reguler Fork';

  const standardUsed = attrs.standard_used || 'Permenaker No. 8 Tahun 2020';
  const usagePurpose = attrs.usage_purpose || 'Operasional Pabrik / Industri';
  const inspDate = attrs.inspection_date || inspection.inspected_at ? String(attrs.inspection_date || inspection.inspected_at).slice(0, 10) : new Date().toISOString().slice(0, 10);
  const serviceType = inspection.service_type || 'Pemeriksaan Berkala';
  const permitNo = attrs.previous_permit_no || inspection.previous_permit_no || '-';
  const inspectorName = inspection.inspector_name || '-';
  const inspectorSkp = inspection.inspector_skp_no || '-';

  return (
    <div className="space-y-6">
      {/* 1. BAGIAN I: DATA UMUM */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-[#C81E1E] dark:text-red-400 flex items-center justify-center font-bold text-base shrink-0">
              1
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                DATA UMUM
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Sumber Utama BAP &amp; LHPP
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data otomatis dari PO, Klien, dan Master Alat. Verifikasi sebelum penandatanganan BAP.
              </p>
            </div>
          </div>

          {!readOnly && (
            <Button
              type="button"
              variant={isEditingDataUmum ? 'primary' : 'outline'}
              size="sm"
              icon={PencilSimple}
              onClick={() => setIsEditingDataUmum(!isEditingDataUmum)}
            >
              {isEditingDataUmum ? 'Selesai Ubah' : 'Sesuaikan Data'}
            </Button>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* Sub-A: Data Kepemilikan & Klien */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <Buildings size={14} weight="bold" /> Data Pemilik &amp; Pemakai Alat
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Pemilik Alat</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{clientName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Alamat Pemilik</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 text-xs line-clamp-2">{clientAddress}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Pemakai / Pengguna</span>
                {isEditingDataUmum ? (
                  <input
                    type="text"
                    value={attrs.user_name || userName}
                    onChange={(e) => handleAttrChange('user_name', e.target.value)}
                    className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                ) : (
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{userName}</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Alamat Pemakai</span>
                {isEditingDataUmum ? (
                  <input
                    type="text"
                    value={attrs.user_address || userAddress}
                    onChange={(e) => handleAttrChange('user_address', e.target.value)}
                    className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                ) : (
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-xs line-clamp-2">{userAddress}</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Pengurus / PIC Klien</span>
                {isEditingDataUmum ? (
                  <input
                    type="text"
                    value={attrs.pic_name || picName}
                    onChange={(e) => handleAttrChange('pic_name', e.target.value)}
                    className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                ) : (
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                    <User size={14} className="text-slate-400" /> {picName}
                  </span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Lokasi Unit Terpasang</span>
                {isEditingDataUmum ? (
                  <input
                    type="text"
                    value={attrs.install_location || installLocation}
                    onChange={(e) => handleAttrChange('install_location', e.target.value)}
                    className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                ) : (
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#C81E1E]" /> {installLocation}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sub-B: Identitas Objek & Spesifikasi */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <Wrench size={14} weight="bold" /> Identitas Objek &amp; Spesifikasi Nameplate
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Bidang / Jenis Alat</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs block truncate">{domainName}</span>
                <span className="text-[11px] text-slate-500">{categoryName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Nama / Jenis Pesawat</span>
                <span className="font-bold text-[#C81E1E] dark:text-red-400 text-sm block truncate">{objectName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Nomor Seri Unit</span>
                {isEditingDataUmum ? (
                  <input
                    type="text"
                    value={attrs.serial_number || serialNo}
                    onChange={(e) => handleAttrChange('serial_number', e.target.value)}
                    className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                ) : (
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{serialNo}</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Merek / Model</span>
                {isEditingDataUmum ? (
                  <div className="flex gap-1.5 mt-1">
                    <input
                      type="text"
                      placeholder="Merek"
                      value={attrs.brand || brand}
                      onChange={(e) => handleAttrChange('brand', e.target.value)}
                      className="w-1/2 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Model"
                      value={attrs.model || model}
                      onChange={(e) => handleAttrChange('model', e.target.value)}
                      className="w-1/2 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                ) : (
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{brand} / {model}</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Tahun Pembuatan</span>
                {isEditingDataUmum ? (
                  <input
                    type="text"
                    value={attrs.manufacture_year || year}
                    onChange={(e) => handleAttrChange('manufacture_year', e.target.value)}
                    className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                ) : (
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{year}</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Kapasitas Angkat / SWL</span>
                {isEditingDataUmum ? (
                  <div className="flex gap-1 mt-1">
                    <input
                      type="text"
                      value={attrs.capacity || capacity}
                      onChange={(e) => handleAttrChange('capacity', e.target.value)}
                      className="w-2/3 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                    <input
                      type="text"
                      value={attrs.capacity_unit || capacityUnit}
                      onChange={(e) => handleAttrChange('capacity_unit', e.target.value)}
                      className="w-1/3 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                ) : (
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{capacity} {capacityUnit}</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 col-span-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Perlengkapan / Attachment</span>
                {isEditingDataUmum ? (
                  <input
                    type="text"
                    value={attrs.attachment || attachment}
                    onChange={(e) => handleAttrChange('attachment', e.target.value)}
                    className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                ) : (
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{attachment}</span>
                )}
              </div>
            </div>
          </div>

          {/* Sub-C: Informasi Riksa Uji K3 */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <ShieldCheck size={14} weight="bold" /> Informasi Pelaksanaan Riksa Uji
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 col-span-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Standar K3 Acuan</span>
                {isEditingDataUmum ? (
                  <input
                    type="text"
                    value={attrs.standard_used || standardUsed}
                    onChange={(e) => handleAttrChange('standard_used', e.target.value)}
                    className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                ) : (
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{standardUsed}</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 col-span-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Tujuan Penggunaan</span>
                {isEditingDataUmum ? (
                  <input
                    type="text"
                    value={attrs.usage_purpose || usagePurpose}
                    onChange={(e) => handleAttrChange('usage_purpose', e.target.value)}
                    className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                ) : (
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">{usagePurpose}</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Tanggal Riksa Uji</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1 mt-0.5">
                  <Clock size={12} className="text-slate-400" /> {inspDate}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Jenis Riksa Uji</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{serviceType}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 col-span-3">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Nomor Izin / Suket Sebelumnya</span>
                {isEditingDataUmum ? (
                  <input
                    type="text"
                    value={attrs.previous_permit_no || permitNo}
                    onChange={(e) => handleAttrChange('previous_permit_no', e.target.value)}
                    className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                ) : (
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">{permitNo}</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 col-span-3">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Ahli K3 Pemeriksa</span>
                <span className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <IdentificationBadge size={14} className="text-[#C81E1E]" /> {inspectorName}
                  {inspectorSkp && inspectorSkp !== '-' && (
                    <span className="text-[11px] text-slate-400 font-normal">({inspectorSkp})</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BAGIAN 2 s/d 7: PENYUSUNAN TEKNIS LHPP DI KANTOR (WORD DOCX) */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 dark:from-blue-950/20 dark:via-slate-900 dark:to-blue-950/10 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileDoc size={22} weight="bold" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                BAGIAN II s/d VII: DETAIL TEKNIS LHPP
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Tersedia di Word (.docx)
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Disiapkan otomatis sebagai tabel kerja blangko rapi di Microsoft Word untuk diselesaikan di kantor tanpa beban ketik di HP.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="md"
            icon={DownloadSimple}
            loading={downloadingDocx}
            disabled={downloadingDocx}
            onClick={handleDownloadLhppDocx}
            className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            Unduh Blangko Word (.docx)
          </Button>
        </div>

        {downloadFeedback && (
          <div className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {downloadFeedback}
          </div>
        )}

        {/* 6 Bagian yang Disiapkan di Word */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[11px] flex items-center justify-center font-bold">II</span>
              Data Teknis Alat
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Spesifikasi, motor penggerak bakar/listrik, dimensi fisik, ukuran &amp; tekanan roda.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[11px] flex items-center justify-center font-bold">III</span>
              Pemeriksaan Visual &amp; Fungsi
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tabel 6 kolom standar (Lokasi, Komponen, Pemeriksaan, Memenuhi, Tidak Memenuhi, Keterangan).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[11px] flex items-center justify-center font-bold">IV</span>
              Mesin Hidup &amp; Dinamis
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Starter, instrumen, transmisi, rem, hidrolik, kebocoran fluida, dan kebisingan abnormal.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[11px] flex items-center justify-center font-bold">V</span>
              Pengujian &amp; Defleksi Garpu
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Uji tanpa beban, uji beban SWL, rumus defleksi garpu (1/33 L Permenaker 8/2020), &amp; NDT/MPI.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[11px] flex items-center justify-center font-bold">VI</span>
              Kesimpulan Riksa Uji
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pernyataan kelayakan K3 resmi yang dapat diedit langsung oleh Ahli K3 di kantor.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[11px] flex items-center justify-center font-bold">VII</span>
              Syarat-Syarat K3
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Rekomendasi teknis bernomor untuk operator, perawatan berkala, dan kepatuhan norma K3.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Fokus lapangan: Ambil foto dokumentasi 5 kategori dan siapkan BAP untuk penandatanganan klien.
          </p>
          {onNext && (
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={onNext}
            >
              Lanjut ke Dokumentasi Lapangan (Bagian 8)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
