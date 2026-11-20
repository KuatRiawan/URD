import { useRef, useState } from 'react';
import {
  CaretDown,
  CheckCircle,
  Clock,
  Eraser,
  Eye,
  FileDoc,
  FilePdf,
  IdentificationBadge,
  Info,
  LockKey,
  LockKeyOpen,
  PencilSimple,
  PenNib,
  SealCheck,
  ShareNetwork,
  User,
  WarningCircle,
  Wrench
} from '@phosphor-icons/react';
import { LoadingState } from '../../../components/feedback/StateViews.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ActionMenu } from '../../../components/ui/ActionMenu.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { formatDateTime } from '../../../lib/utils/format.js';

export function BapDetailModal({
  user = null,
  selectedBap,
  onClose,
  detailLoading,
  canManage,
  canFinalize,
  bapEditForm,
  setBapEditForm,
  toggleScopeItem,
  scopeCatalog = [],
  handleSaveDraft,
  sigForm,
  setSigForm,
  handleSaveSignature,
  handleFinalizeBap,
  reopenReason,
  setReopenReason,
  handleReopenBap,
  handlePreviewPdf,
  handleDownloadPdf,
  handleDownloadDocx,
  handleDownloadBatchPoPdf,
  onShareBap,
  submitting,
  navigate
}) {
  const canvasRef = useRef(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [sigError, setSigError] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isReSigningPic, setIsReSigningPic] = useState(false);
  const isDrawingRef = useRef(false);

  const handleTriggerPreview = async () => {
    if (!selectedBap) return;
    if (isEditable && handleSaveDraft && bapEditForm) {
      try {
        await handleSaveDraft(null, bapEditForm);
      } catch {
        // Lanjutkan pratinjau data terakhir
      }
    }
    handlePreviewPdf(selectedBap.id, bapEditForm?.bap_no || selectedBap.bap_no);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      e.target.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSigError('');
  };

  const onSubmitPicSignature = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      setSigError('Goreskan tanda tangan digital perwakilan klien pada kotak tanda tangan.');
      return;
    }
    if (!sigForm?.signerName?.trim()) {
      setSigError('Nama perwakilan klien / PIC penanda tangan wajib diisi.');
      return;
    }
    setSigError('');
    const dataUrl = canvas.toDataURL('image/png');
    handleSaveSignature(e, dataUrl);
    clearCanvas();
    setIsReSigningPic(false);
  };

  if (!selectedBap) return null;

  const isEditable = ['DRAF', 'REVISI'].includes(selectedBap.status) && (canManage || canFinalize);
  const form = bapEditForm || {};

  const handleFieldChange = (key, value) => {
    if (setBapEditForm) {
      setBapEditForm((prev) => ({
        ...(prev || {}),
        [key]: value
      }));
    }
  };

  const equipmentTitle = String(
    form.object_name ||
    selectedBap.equipment_subtype_name ||
    selectedBap.equipment_type_name ||
    selectedBap.object_name ||
    'UNIT ALAT K3'
  ).toUpperCase();

  const isPicSigned = Boolean(selectedBap.client_sig_file_id);
  const showPicSignatureCanvas = isEditable && (!isPicSigned || isReSigningPic);

  return (
    <Modal
      isOpen={Boolean(selectedBap)}
      onClose={onClose}
      title={`Berita Acara Riksa Uji: ${form.bap_no || selectedBap.bap_no}`}
      size="xl"
      fullScreenMobile={true}
      footer={
        <div className="flex w-full items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Status: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedBap.status}</span> · Versi #{selectedBap.version || 1}
          </div>
          <Button variant="secondary" size="md" onClick={onClose}>
            Tutup
          </Button>
        </div>
      }
    >
      {detailLoading ? (
        <LoadingState message="Memuat lembar Berita Acara Riksa Uji..." />
      ) : (
        <div className="space-y-5">
          {/* AREA 1: IDENTITAS ALAT & STATUS BAP */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={selectedBap.status === 'FINAL' ? 'success' : selectedBap.status === 'REVISI' ? 'warning' : 'neutral'}>
                  {selectedBap.status}
                </Badge>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  1 Unit = 1 BAP
                </span>
                {selectedBap.category_code && (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {selectedBap.category_code}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                {equipmentTitle}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {form.bap_no || selectedBap.bap_no}
                </span>
                <span>•</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {form.client_name || selectedBap.client_name}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-500">
                  PO: {selectedBap.po_number || selectedBap.order_no || '-'}
                </span>
              </div>
            </div>

            {/* AREA 2: INFORMASI UNIT & PERUSAHAAN (READOUT & EDIT) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <IdentificationBadge size={16} className="text-[#C81E1E] shrink-0" />
                  <span>Informasi Dokumen BAP</span>
                </h4>
                {isEditable && (
                  <Button
                    type="button"
                    variant={isEditingInfo ? 'secondary' : 'outline'}
                    size="xs"
                    icon={isEditingInfo ? CheckCircle : PencilSimple}
                    onClick={() => setIsEditingInfo(!isEditingInfo)}
                    className="shrink-0 whitespace-nowrap"
                  >
                    {isEditingInfo ? 'Selesai Edit' : 'Edit Informasi'}
                  </Button>
                )}
              </div>

              {isEditingInfo ? (
                /* FORM EDIT INFORMASI DOKUMEN BAP */
                <div className="space-y-3.5 p-3.5 sm:p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20">
                  <div className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                    Perubahan data di bawah disimpan khusus pada dokumen BAP ini (snapshot dokumen) tanpa mengubah master PO atau data peralatan klien lainnya.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Nama / Jenis Objek Alat *
                      </label>
                      <input
                        type="text"
                        value={form.object_name || ''}
                        onChange={(e) => handleFieldChange('object_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Nama Perusahaan / Klien *
                      </label>
                      <input
                        type="text"
                        value={form.client_name || ''}
                        onChange={(e) => handleFieldChange('client_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Alamat Perusahaan *
                      </label>
                      <input
                        type="text"
                        value={form.client_address || ''}
                        onChange={(e) => handleFieldChange('client_address', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Pabrik Pembuat / Merek
                      </label>
                      <input
                        type="text"
                        value={form.manufacturer || form.brand || ''}
                        onChange={(e) => {
                          handleFieldChange('manufacturer', e.target.value);
                          handleFieldChange('brand', e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Tahun Pembuatan
                      </label>
                      <input
                        type="text"
                        value={form.manufacture_year || ''}
                        onChange={(e) => handleFieldChange('manufacture_year', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Nomor Seri (Serial Number) *
                      </label>
                      <input
                        type="text"
                        value={form.serial_number || ''}
                        onChange={(e) => handleFieldChange('serial_number', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Kapasitas Beban / Kerja
                      </label>
                      <input
                        type="text"
                        value={form.capacity || ''}
                        onChange={(e) => handleFieldChange('capacity', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Lokasi Pemeriksaan Unit
                      </label>
                      <input
                        type="text"
                        value={form.install_location || ''}
                        onChange={(e) => handleFieldChange('install_location', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Nomor Dokumen BAP *
                      </label>
                      <input
                        type="text"
                        value={form.bap_no || ''}
                        onChange={(e) => handleFieldChange('bap_no', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Nama PIC Perwakilan Klien (Otomatis dari PO, dapat diedit)
                      </label>
                      <input
                        type="text"
                        value={form.contact_name || ''}
                        onChange={(e) => handleFieldChange('contact_name', e.target.value)}
                        placeholder="Nama lengkap PIC / perwakilan klien..."
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* READOUT INFORMASI UNIT & PERUSAHAAN (MODERN CLEAN SPECS) */
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:p-4 text-xs divide-y divide-slate-200/70 dark:divide-slate-800">
                  {/* Blok 1: Unit & Klien */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3">
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                        Objek Alat yang Diperiksa
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {form.object_name || selectedBap.object_name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {selectedBap.category_code} · {selectedBap.category_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                        Nama Perusahaan / Klien
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {form.client_name || selectedBap.client_name}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                        {form.client_address || selectedBap.client_address || selectedBap.location_address || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Blok 2: Spesifikasi Teknis */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3">
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                        Pabrik Pembuat & Tahun
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {form.manufacturer || form.brand || selectedBap.manufacturer || selectedBap.brand || '-'} ({form.manufacture_year || selectedBap.manufacture_year || '-'})
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                        Nomor Seri & Kapasitas
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {form.serial_number || selectedBap.serial_number || '-'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Kapasitas: {form.capacity || selectedBap.capacity || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                        Lokasi Pemeriksaan & PO
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {form.install_location || selectedBap.install_location || selectedBap.location_name || '-'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                        PO: {selectedBap.po_number || selectedBap.order_no || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Blok 3: Pihak Penanda Tangan */}
                  <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400">PIC Klien:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                        {form.contact_name || selectedBap.client_signer_name || selectedBap.contact_name || '-'}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <SealCheck size={15} className="text-[#C81E1E] shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400">Ahli K3 URD:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                        {selectedBap.inspector_signer_name || selectedBap.inspector_name || 'Ahli K3 Pemeriksa'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AREA 4: RUANG LINGKUP PEMERIKSAAN & KESIMPULAN K3 */}
          <form onSubmit={(e) => handleSaveDraft(e, form)} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Ruang Lingkup Riksa Uji (Centang yang Dilaksanakan)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Terpilih {form.scope_items?.length || 0} dari {scopeCatalog.length} item ruang lingkup standar Permenaker.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tanggal Pelaksanaan:</label>
                <input
                  type="date"
                  disabled={!isEditable}
                  value={form.inspection_date || ''}
                  onChange={(e) => handleFieldChange('inspection_date', e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto">
              {scopeCatalog.map((scopeName) => {
                const checked = form.scope_items?.includes(scopeName);
                return (
                  <label
                    key={scopeName}
                    className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'bg-red-50/70 dark:bg-red-950/40 border-[#C81E1E] font-semibold text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!isEditable}
                      checked={checked}
                      onChange={() => toggleScopeItem(scopeName)}
                      className="rounded text-[#C81E1E] focus:ring-[#C81E1E]"
                    />
                    <span>{scopeName}</span>
                  </label>
                );
              })}
            </div>

            {/* Hasil Riksa Uji & Catatan Lapangan */}
            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Hasil Riksa Uji (Pernyataan Resmi BAP)
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pilih salah satu kesimpulan resmi
                </span>
              </div>

              {/* 3 Choice Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    form.is_compliant === true
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-bold ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="isCompliant"
                    disabled={!isEditable}
                    checked={form.is_compliant === true}
                    onChange={() => handleFieldChange('is_compliant', true)}
                    className="text-emerald-600 focus:ring-emerald-500 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[11px] sm:text-xs leading-tight">MEMENUHI PERSYARATAN K3</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">Laik operasional</span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    form.is_compliant === false
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-100 font-bold ring-1 ring-red-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="isCompliant"
                    disabled={!isEditable}
                    checked={form.is_compliant === false}
                    onChange={() => handleFieldChange('is_compliant', false)}
                    className="text-red-600 focus:ring-red-500 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[11px] sm:text-xs leading-tight">TIDAK MEMENUHI PERSYARATAN K3</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">Perlu perbaikan</span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    form.is_compliant === null
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 font-bold ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="isCompliant"
                    disabled={!isEditable}
                    checked={form.is_compliant === null}
                    onChange={() => handleFieldChange('is_compliant', null)}
                    className="text-amber-600 focus:ring-amber-500 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[11px] sm:text-xs leading-tight">BELUM DITETAPKAN</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">TTD Situasional</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Pemeriksaan Lapangan
                </label>
                <textarea
                  rows={3}
                  disabled={!isEditable}
                  value={form.inspection_notes || ''}
                  onChange={(e) => handleFieldChange('inspection_notes', e.target.value)}
                  placeholder="Catatan hasil riksa uji, temuan penting, atau kondisi operasional unit..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {isEditable && (
                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submitting}
                    loading={submitting}
                  >
                    Simpan Perubahan Dokumen BAP
                  </Button>
                </div>
              )}
            </div>
          </form>

          {/* AREA 4: TANDA TANGAN PERWAKILAN KLIEN / PEMILIK ALAT */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <PenNib size={16} weight="bold" className="text-[#C81E1E]" />
                <span>Tanda Tangan Perwakilan Klien / Pemilik Alat</span>
              </h4>
              <Badge variant={isPicSigned ? 'success' : 'warning'}>
                {isPicSigned ? 'Sudah TTD PIC' : 'Belum TTD PIC'}
              </Badge>
            </div>

            {isPicSigned && !isReSigningPic ? (
              /* READOUT TANDA TANGAN PIC YANG SUDAH DITANDATANGANI */
              <div className="p-2.5 sm:p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Penanda Tangan: </span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {selectedBap.client_signer_name || form.contact_name || 'Perwakilan Klien'}
                    </strong>
                  </div>
                  {selectedBap.client_signed_at && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {formatDateTime(selectedBap.client_signed_at)}
                    </div>
                  )}
                </div>

                <div className="h-16 sm:h-20 w-full flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5">
                  {selectedBap.client_signature_url ? (
                    <img
                      src={selectedBap.client_signature_url}
                      alt="Tanda Tangan PIC Klien"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallbackEl = document.getElementById('pic-sig-fallback');
                        if (fallbackEl) fallbackEl.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    id="pic-sig-fallback"
                    style={{ display: selectedBap.client_signature_url ? 'none' : 'flex' }}
                    className="items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle size={15} weight="fill" />
                    <span>Berkas Tanda Tangan Digital Tersimpan</span>
                  </div>
                </div>

                {isEditable && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      icon={Eraser}
                      onClick={() => {
                        setIsReSigningPic(true);
                        setHasDrawn(false);
                        setSigError('');
                      }}
                    >
                      Tanda Tangan Ulang PIC
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* FORM TANDA TANGAN DIGITAL KHUSUS PIC PERWAKILAN KLIEN */
              <form onSubmit={onSubmitPicSignature} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nama PIC Penanda Tangan (Perwakilan Klien / Pemilik Alat) *
                  </label>
                  <input
                    type="text"
                    required
                    value={sigForm.signerName}
                    onChange={(e) => setSigForm({ ...sigForm, signerName: e.target.value })}
                    placeholder="Nama lengkap PIC klien..."
                    className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Goreskan Tanda Tangan PIC (Jari / Stylus):
                    </span>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-red-600 cursor-pointer font-medium"
                    >
                      <Eraser size={13} />
                      Hapus Coretan
                    </button>
                  </div>

                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden bg-white shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={130}
                      onPointerDown={startDrawing}
                      onPointerMove={draw}
                      onPointerUp={stopDrawing}
                      onPointerLeave={stopDrawing}
                      className="w-full h-28 touch-none cursor-crosshair block bg-white"
                    />
                    {!hasDrawn && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400">
                        Tanda tangani di sini dengan jari atau stylus
                      </div>
                    )}
                  </div>

                  {sigError && (
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <WarningCircle size={14} />
                      <span>{sigError}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {isReSigningPic ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReSigningPic(false);
                        clearCanvas();
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Batal
                    </button>
                  ) : <span />}
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={PenNib}
                    disabled={submitting || !hasDrawn}
                    loading={submitting}
                  >
                    Simpan Tanda Tangan PIC
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* AREA 5: TINDAKAN DOKUMEN BAP & FINALISASI (KOMPAK 1 BARIS) */}
          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Tindakan Dokumen BAP
              </span>
            </div>

            {/* Tombol Aksi Sejajar 1 Baris Kompak (Unduh, Pratinjau, Bagikan, dan Menu Aksi Lainnya) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={FilePdf}
                onClick={() => handleDownloadPdf(selectedBap.id, form.bap_no || selectedBap.bap_no)}
                className="flex-1 justify-center whitespace-nowrap text-xs"
              >
                Unduh PDF
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Eye}
                onClick={handleTriggerPreview}
                className="flex-1 justify-center whitespace-nowrap text-xs"
              >
                Pratinjau
              </Button>
              {onShareBap && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={ShareNetwork}
                  onClick={() => onShareBap(selectedBap)}
                  className="flex-1 justify-center whitespace-nowrap text-xs"
                >
                  Bagikan
                </Button>
              )}
              <ActionMenu
                label="Aksi Lainnya"
                size="sm"
                items={[
                  handleDownloadDocx && {
                    label: 'Unduh Word (.docx)',
                    icon: FileDoc,
                    onClick: () => handleDownloadDocx(selectedBap.id, form.bap_no || selectedBap.bap_no)
                  },
                  {
                    label: 'Cetak Gabungan BAP 1 PO',
                    icon: FilePdf,
                    onClick: () => handleDownloadBatchPoPdf(selectedBap.order_id, selectedBap.po_number || selectedBap.order_no)
                  },
                  selectedBap.lhpp_id && {
                    label: `Buka Dokumen LHPP (${selectedBap.lhpp_status || 'DRAF'})`,
                    icon: SealCheck,
                    onClick: () => {
                      onClose();
                      navigate(`/app/lhpp?lhppId=${selectedBap.lhpp_id}`);
                    }
                  }
                ]}
              />
            </div>

            {/* Tombol Finalisasi BAP Mandiri */}
            {['DRAF', 'REVISI'].includes(selectedBap.status) && canFinalize && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={LockKey}
                  disabled={submitting}
                  loading={submitting}
                  onClick={handleFinalizeBap}
                  className="w-full justify-center text-xs"
                >
                  Finalisasi &amp; Kunci Berita Acara Riksa Uji (BAP)
                </Button>
              </div>
            )}

            {/* Buka Kunci Revisi jika Status FINAL */}
            {selectedBap.status === 'FINAL' && canFinalize && (
              <form onSubmit={handleReopenBap} className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Buka Kunci BAP untuk Revisi
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    minLength={5}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Alasan pembukaan revisi..."
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-md cursor-pointer shrink-0"
                  >
                    <LockKeyOpen size={13} weight="bold" />
                    Buka
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* AREA 6: RIWAYAT REVISI BAP (COLLAPSIBLE ACCORDION AGAR HEMAT TEMPAT) */}
          {selectedBap.revisions?.length > 0 && (
            <details className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 overflow-hidden">
              <summary className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer list-none select-none hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <Clock size={14} className="text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                    Riwayat Versi &amp; Revisi BAP ({selectedBap.revisions.length})
                  </span>
                  {selectedBap.revisions[0] && (
                    <span className="text-[11px] text-slate-400 hidden xs:inline truncate">
                      · Terakhir: {formatDateTime(selectedBap.revisions[0].created_at)}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-slate-500 shrink-0 flex items-center gap-1 ml-2">
                  <span className="group-open:hidden">Lihat</span>
                  <span className="hidden group-open:inline">Tutup</span>
                  <CaretDown size={13} className="text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                </span>
              </summary>
              <div className="p-3 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5 max-h-44 overflow-y-auto">
                {selectedBap.revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Versi #{rev.version} · {rev.action}
                      </span>
                      {rev.reason && (
                        <span className="text-slate-600 dark:text-slate-400 ml-1">
                          : {rev.reason}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono shrink-0">
                      {rev.actor_name || 'Sistem'} · {formatDateTime(rev.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </Modal>
  );
}
