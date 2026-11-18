import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Buildings,
  CheckCircle,
  Clock,
  DownloadSimple,
  Eye,
  FileDoc,
  FileText,
  IdentificationBadge,
  Lightning,
  ListChecks,
  MapPin,
  PencilSimple,
  Scales,
  SealCheck,
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
  formStep = 1,
  setFormStep,
  draftConclusion,
  setDraftConclusion,
  draftConclusionNotes,
  setDraftConclusionNotes,
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
      {/* BAGIAN I: DATA UMUM */}
      {formStep === 1 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-[#C81E1E] dark:text-red-400 flex items-center justify-center font-bold text-base shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  BAGIAN I: DATA UMUM
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Sumber Identitas LHPP
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data otomatis dari PO, Klien, dan Master Alat. Verifikasi kelengkapan identitas unit sebelum penyusunan LHPP.
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
      )}

      {/* BAGIAN II: DATA TEKNIS */}
      {formStep === 2 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  BAGIAN II: DATA TEKNIS PERALATAN
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Format Tabel Word (.docx)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tabel spesifikasi dimensi, mesin penggerak, tekanan roda, dan konstruksi fisik unit.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={DownloadSimple}
              loading={downloadingDocx}
              disabled={downloadingDocx}
              onClick={handleDownloadLhppDocx}
            >
              Unduh Blangko Word
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Struktur Tabel Kerja di Microsoft Word:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">A. Motor Penggerak / Sumber Tenaga</span>
                <p className="text-slate-500 text-[11px]">Tipe mesin (Diesel / Baterai Electric), nomor motor, daya mesin (kW/HP), putaran kerja (RPM), dan tegangan sistem.</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">B. Dimensi Fisik &amp; Kemampuan Kerja</span>
                <p className="text-slate-500 text-[11px]">Panjang, lebar, tinggi tiang (mast) saat tertutup/terbuka, tinggi angkat maksimum, radius putar, dan berat mati unit (deadweight).</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">C. Garpu / Attachment Angkat</span>
                <p className="text-slate-500 text-[11px]">Dimensi garpu (panjang × lebar × tebal), jarak bebas pusat beban (load center), dan kondisi pengunci garpu.</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">D. Sistem Roda &amp; Kemudi</span>
                <p className="text-slate-500 text-[11px]">Jenis roda (pneumatic/solid cushion), ukuran ban depan &amp; belakang, tekanan angin, dan sistem power steering.</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              * Bagian ini telah otomatis disiapkan dalam template Microsoft Word (.docx) dengan format titik-titik rapi agar mudah diketik atau diedit di kantor.
            </p>
          </div>
        </div>
      )}

      {/* BAGIAN III: PEMERIKSAAN VISUAL & FUNGSI */}
      {formStep === 3 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  BAGIAN III: PEMERIKSAAN VISUAL &amp; FUNGSI
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Tabel 6 Kolom Word
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pemeriksaan komponen struktur, mekanik, hidrolik, dan kelistrikan tanpa beban.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={DownloadSimple}
              loading={downloadingDocx}
              disabled={downloadingDocx}
              onClick={handleDownloadLhppDocx}
            >
              Unduh Blangko Word
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Item Pemeriksaan Visual (Tabel 6 Kolom: No, Komponen, Hasil Uji, Memenuhi, Tidak Memenuhi, Keterangan):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">1. Rangka Utama &amp; Chassis</span>
                <span className="text-[11px] text-slate-500">Kondisi fisik, las-lasan, retak, karat, counterweight.</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">2. Tiang Penuntun (Mast)</span>
                <span className="text-[11px] text-slate-500">Kelurusan channel tiang, roller bantalan, clearance mast.</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">3. Rantai Angkat (Leaf Chain)</span>
                <span className="text-[11px] text-slate-500">Pelumasan, elongasi rantai, anchor pin, keseimbangan tegangan.</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">4. Silinder Hidrolik &amp; Selang</span>
                <span className="text-[11px] text-slate-500">Kondisi rod piston lift/tilt, kebocoran seal, sambungan fitting hose.</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">5. Garpu &amp; Backrest</span>
                <span className="text-[11px] text-slate-500">Kondisi tumit garpu, pelindung beban sandaran (load backrest extension).</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">6. Perlengkapan Pengaman (OHG)</span>
                <span className="text-[11px] text-slate-500">Overhead guard (pelindung operator), spion, lampu kerja, sabuk pengaman.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BAGIAN IV: MESIN HIDUP / UJI OPERASIONAL */}
      {formStep === 4 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  BAGIAN IV: PEMERIKSAAN SAAT MESIN HIDUP / OPERASI
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Tabel Kerja Word
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uji fungsi operasional sistem gerak, kemudi, pengereman, instrumen panel, dan suara abnormal.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={DownloadSimple}
              loading={downloadingDocx}
              disabled={downloadingDocx}
              onClick={handleDownloadLhppDocx}
            >
              Unduh Blangko Word
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Sistem Rem &amp; Transmisi</span>
                <p className="text-slate-500 text-[11px]">Rem kaki utama (service brake), rem tangan parkir (parking brake), perpindahan transmisi maju/mundur, dan akselerasi.</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Instrumen Indikator &amp; Alarm</span>
                <p className="text-slate-500 text-[11px]">Klakson, alarm mundur, lampu rotary/strobe flash, indikator temperatur, tekanan oli, dan meter jam operasi (hour meter).</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Respon Tuas Hidrolik</span>
                <p className="text-slate-500 text-[11px]">Kecepatan angkat/turun, kemiringan mast maju/mundur (tilt), kehalusan gerakan tanpa hentakan, dan katup pelepas tekanan (relief valve).</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Kebocoran &amp; Suara Abnormal</span>
                <p className="text-slate-500 text-[11px]">Pemeriksaan kebocoran fluida oli mesin, solar/bensin, air radiator, oli hidrolik, serta getaran atau bunyi abnormal pompa hidrolik.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BAGIAN V: PENGUJIAN BEBAN & NDT */}
      {formStep === 5 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
                5
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  BAGIAN V: PENGUJIAN BEBAN &amp; NDT
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Formula &amp; Standar Permenaker
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uji beban dinamis/statis, pengukuran kelenturan/defleksi garpu (1/33 L), uji rem beban, dan NDT/MPI.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={DownloadSimple}
              loading={downloadingDocx}
              disabled={downloadingDocx}
              onClick={handleDownloadLhppDocx}
            >
              Unduh Blangko Word
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <Scales size={16} className="text-[#C81E1E]" />
                Rumus Defleksi Garpu Forklift Sesuai Permenaker No. 8 Tahun 2020:
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded font-mono text-xs border border-slate-200 dark:border-slate-700">
                f_izin = (1 / 33) × Panjang Garpu (L)
              </div>
              <p className="text-slate-500 text-[11px]">
                Tabel di Word telah memuat format otomatis untuk: Beban Uji (kg), Jarak Pusat Beban (mm), Posisi Garpu, Tinggi Angkat, dan Pengukuran Defleksi Kiri/Kanan dengan pembanding batas toleransi izin.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">Uji Non-Destructive Testing (NDT / MPI)</span>
              <p className="text-slate-500 text-[11px]">Pemeriksaan Magnetic Particle Inspection (MPI) atau Dye Penetrant pada tumit garpu (heel of fork) dan sambungan las mast untuk mendeteksi retak mikro.</p>
            </div>
          </div>
        </div>
      )}

      {/* BAGIAN VI: KESIMPULAN */}
      {formStep === 6 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
                6
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  BAGIAN VI: KESIMPULAN KELAYAKAN K3
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Rekomendasi Ahli K3
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pernyataan resmi hasil riksa uji mengenai kelayakan unit untuk diterbitkan Surat Keterangan K3.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={DownloadSimple}
              loading={downloadingDocx}
              disabled={downloadingDocx}
              onClick={handleDownloadLhppDocx}
            >
              Unduh Blangko Word
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">
                Status Kelayakan K3 Unit (Berdasarkan Hasil Pemeriksaan):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setDraftConclusion && setDraftConclusion('MEMENUHI_SYARAT')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    draftConclusion === 'MEMENUHI_SYARAT'
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold text-xs mb-0.5">MEMENUHI SYARAT K3</span>
                  <span className="text-[11px] text-slate-500 block">Unit laik operasi dengan pemeliharaan rutin.</span>
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setDraftConclusion && setDraftConclusion('MEMENUHI_SYARAT_DENGAN_CATATAN')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    draftConclusion === 'MEMENUHI_SYARAT_DENGAN_CATATAN'
                      ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold text-xs mb-0.5">MEMENUHI DENGAN CATATAN</span>
                  <span className="text-[11px] text-slate-500 block">Laik operasi bersyarat setelah temuan minor diperbaiki.</span>
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setDraftConclusion && setDraftConclusion('TIDAK_MEMENUHI_SYARAT')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    draftConclusion === 'TIDAK_MEMENUHI_SYARAT'
                      ? 'border-red-500 bg-red-50/80 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-bold ring-2 ring-red-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold text-xs mb-0.5">TIDAK MEMENUHI SYARAT</span>
                  <span className="text-[11px] text-slate-500 block">Unit tidak laik operasi dan harus diperbaiki/overhaul.</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Catatan / Dasar Pertimbangan Kesimpulan:
              </label>
              <textarea
                rows={3}
                disabled={readOnly}
                value={draftConclusionNotes || ''}
                onChange={(e) => setDraftConclusionNotes && setDraftConclusionNotes(e.target.value)}
                placeholder="Catatan hasil perhitungan teknis, faktor keamanan, atau ringkasan evaluasi Ahli K3..."
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* BAGIAN VII: SYARAT-SYARAT K3 */}
      {formStep === 7 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
                7
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  BAGIAN VII: PERSYARATAN / REKOMENDASI K3
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Ketentuan Permenaker
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daftar syarat keselamatan operasional dan pemeliharaan unit yang wajib ditaati oleh pemakai alat.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={DownloadSimple}
              loading={downloadingDocx}
              disabled={downloadingDocx}
              onClick={handleDownloadLhppDocx}
            >
              Unduh Blangko Word
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Daftar Ketentuan Standar di Blangko Word:
            </h4>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
              <li>Unit hanya boleh dioperasikan oleh operator yang memiliki Lisensi K3 (SIO) yang masih berlaku.</li>
              <li>Beban angkat tidak boleh melebihi kapasitas beban maksimum (SWL) sesuai load chart unit.</li>
              <li>Dilarang menggunakan forklift untuk mengangkat manusia tanpa perlengkapan work platform resmi yang disetujui.</li>
              <li>Lakukan pemeriksaan harian (pre-operational checklist) sebelum unit mulai dioperasikan setiap shift kerja.</li>
              <li>Lakukan perawatan dan pemeliharaan berkala sesuai petunjuk buku manual pabrik pembuat.</li>
              <li>Pemeriksaan dan pengujian ulang wajib dilakukan paling lambat 1 (satu) tahun sejak tanggal riksa uji ini.</li>
            </ol>
          </div>
        </div>
      )}

      {/* FOOTER NAVIGASI PER BAGIAN (Untuk Sections 1 s/d 7) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div>
          {formStep > 1 ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              icon={ArrowLeft}
              onClick={() => setFormStep && setFormStep(formStep - 1)}
            >
              Sebelumnya: Bagian {formStep - 1}
            </Button>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Bagian 1 dari 8 Bagian LHPP
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {formStep < 7 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={() => setFormStep && setFormStep(formStep + 1)}
            >
              Selanjutnya: Bagian {formStep + 1}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={() => {
                if (onNext) onNext();
                else if (setFormStep) setFormStep(8);
              }}
            >
              Lanjut ke Dokumentasi Foto &amp; Temuan (Bagian 8)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
