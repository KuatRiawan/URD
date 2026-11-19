import { useRef, useState } from 'react';
import {
  CheckCircle,
  Eraser,
  Eye,
  FileDoc,
  FilePdf,
  IdentificationBadge,
  LockKey,
  LockKeyOpen,
  PencilSimple,
  PenNib,
  SealCheck,
  ShareNetwork,
  WarningCircle,
  Wrench
} from '@phosphor-icons/react';
import logoUrd from '../../../assets/logo-urd.png';
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
  scopeCatalog,
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
    handlePreviewPdf(selectedBap.id, (bapEditForm?.bap_no) || selectedBap.bap_no);
  };

  const handleApplySavedSignature = () => {
    if (!user?.signatureUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSigForm((prev) => ({
      ...prev,
      signerRole: 'AHLI_K3',
      signerName: user.fullName || prev.signerName,
      signerTitle: user.signerTitle || prev.signerTitle || 'Ahli K3 Spesialis'
    }));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const padding = 10;
      const maxWidth = canvas.width - padding * 2;
      const maxHeight = canvas.height - padding * 2;
      let w = img.width;
      let h = img.height;
      const ratio = Math.min(maxWidth / w, maxHeight / h, 1);
      w *= ratio;
      h *= ratio;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      setHasDrawn(true);
      setSigError('');
    };
    img.onerror = () => {
      setSigError('Gagal memuat berkas tanda tangan tersimpan dari profil.');
    };
    img.src = user.signatureUrl;
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

  const onSubmitSignature = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      setSigError('Goreskan tanda tangan digital terlebih dahulu pada kotak tanda tangan.');
      return;
    }
    setSigError('');
    const dataUrl = canvas.toDataURL('image/png');
    handleSaveSignature(e, dataUrl);
    clearCanvas();
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
    'ALAT K3'
  ).toUpperCase();

  return (
    <Modal
      isOpen={Boolean(selectedBap)}
      onClose={onClose}
      title={`Berita Acara Riksa Uji: ${form.bap_no || selectedBap.bap_no}`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
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
        <div className="space-y-6">
          {/* Kop Dokumen Resmi BAP */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#C81E1E] pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoUrd}
                  alt="Logo PT Upaya Riksa Daya"
                  className="h-12 w-auto object-contain dark:brightness-110"
                />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    PT UPAYA RIKSA DAYA
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Perusahaan Jasa K3 (PJK3) Bidang Pemeriksaan dan Pengujian
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded bg-slate-900 dark:bg-slate-800 text-white text-xs font-extrabold tracking-wider uppercase">
                  BERITA ACARA RIKSA UJI
                </span>
                {/* Equipment Title langsung di bawah judul */}
                <div className="mt-1.5 text-sm font-extrabold tracking-wider uppercase text-[#C81E1E] dark:text-rose-400">
                  {equipmentTitle}
                </div>
                <div className="mt-0.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                  Nomor: {form.bap_no || selectedBap.bap_no}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Status: {selectedBap.status} · 1 Unit = 1 BAP
                </div>
              </div>
            </div>

            {/* Bagian Identitas BAP - Dengan Mode Edit Mandiri */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <IdentificationBadge size={16} className="text-[#C81E1E]" />
                  Identitas Objek &amp; Perusahaan pada BAP
                </h4>
                {isEditable && (
                  <Button
                    type="button"
                    variant={isEditingInfo ? 'secondary' : 'outline'}
                    size="xs"
                    icon={PencilSimple}
                    onClick={() => setIsEditingInfo(!isEditingInfo)}
                  >
                    {isEditingInfo ? 'Selesai Edit' : 'Edit Informasi BAP'}
                  </Button>
                )}
              </div>

              {isEditingInfo ? (
                /* Form Edit Informasi BAP */
                <div className="space-y-4 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20">
                  <div className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                    Perubahan informasi di bawah disimpan khusus pada dokumen BAP ini tanpa mengubah master PO atau data peralatan lain.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        1. Nama / Jenis Objek Alat *
                      </label>
                      <input
                        type="text"
                        value={form.object_name}
                        onChange={(e) => handleFieldChange('object_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        2. Nama Perusahaan / Klien *
                      </label>
                      <input
                        type="text"
                        value={form.client_name}
                        onChange={(e) => handleFieldChange('client_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        3. Alamat Perusahaan *
                      </label>
                      <input
                        type="text"
                        value={form.client_address}
                        onChange={(e) => handleFieldChange('client_address', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        4. Pabrik Pembuat / Merek
                      </label>
                      <input
                        type="text"
                        value={form.manufacturer || form.brand}
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
                        value={form.manufacture_year}
                        onChange={(e) => handleFieldChange('manufacture_year', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        5. Nomor Seri (Serial Number) *
                      </label>
                      <input
                        type="text"
                        value={form.serial_number}
                        onChange={(e) => handleFieldChange('serial_number', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Kapasitas Beban
                      </label>
                      <input
                        type="text"
                        value={form.capacity}
                        onChange={(e) => handleFieldChange('capacity', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        6. Lokasi Pemeriksaan Unit
                      </label>
                      <input
                        type="text"
                        value={form.install_location}
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
                        value={form.bap_no}
                        onChange={(e) => handleFieldChange('bap_no', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Nama PIC Perwakilan Klien
                      </label>
                      <input
                        type="text"
                        value={form.contact_name}
                        onChange={(e) => handleFieldChange('contact_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Jabatan PIC Klien
                      </label>
                      <input
                        type="text"
                        value={form.contact_title}
                        onChange={(e) => handleFieldChange('contact_title', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Tampilan Readout dengan Traceability */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">1. Objek yang Diperiksa</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {form.object_name || selectedBap.object_name} ({selectedBap.category_code} - {selectedBap.category_name})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">2. Nama Perusahaan / Klien</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {form.client_name || selectedBap.client_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">3. Alamat Perusahaan</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {form.client_address || selectedBap.client_address || selectedBap.location_address || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">4. Pabrik Pembuat / Tahun</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {form.manufacturer || form.brand || selectedBap.manufacturer || selectedBap.brand || '-'} /{' '}
                      {form.manufacture_year || selectedBap.manufacture_year || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">5. Nomor Seri / Kapasitas</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {form.serial_number || selectedBap.serial_number || '-'} / {form.capacity || selectedBap.capacity || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">6. Lokasi Pemeriksaan &amp; Referensi PO</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {form.install_location || selectedBap.install_location || selectedBap.location_name || '-'} · PO:{' '}
                      <strong className="font-mono text-slate-900 dark:text-slate-100">{selectedBap.po_number || selectedBap.order_no}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ruang Lingkup Riksa Uji */}
          <form onSubmit={(e) => handleSaveDraft(e, form)} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Ruang Lingkup Riksa Uji (Centang yang Dilaksanakan)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Terpilih {form.scope_items?.length || 0} dari {scopeCatalog.length} item ruang lingkup pada template BAP.
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 max-h-72 overflow-y-auto">
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

            {/* Hasil Riksa Uji & Catatan Pemeriksaan */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Hasil Riksa Uji (Pernyataan Resmi BAP)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 cursor-pointer">
                    <input
                      type="radio"
                      name="isCompliant"
                      disabled={!isEditable}
                      checked={form.is_compliant === true}
                      onChange={() => handleFieldChange('is_compliant', true)}
                    />
                    MEMENUHI PERSYARATAN K3
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 cursor-pointer">
                    <input
                      type="radio"
                      name="isCompliant"
                      disabled={!isEditable}
                      checked={form.is_compliant === false}
                      onChange={() => handleFieldChange('is_compliant', false)}
                    />
                    TIDAK MEMENUHI PERSYARATAN K3
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 cursor-pointer">
                    <input
                      type="radio"
                      name="isCompliant"
                      disabled={!isEditable}
                      checked={form.is_compliant === null}
                      onChange={() => handleFieldChange('is_compliant', null)}
                    />
                    BELUM DITETAPKAN (TTD Situasional)
                  </label>
                </div>
              </div>

              <div className="p-3 rounded bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 border-l-4 border-[#C81E1E]">
                {form.is_compliant === null ? (
                  <span>
                    &quot;Kesimpulan kelayakan K3{' '}
                    <span className="text-amber-700 dark:text-amber-400 underline">
                      BELUM DITETAPKAN
                    </span>{' '}
                    (BAP ditandatangani secara situasional; kesimpulan akhir menunggu hasil pengujian &amp; perhitungan teknis selesai).&quot;
                  </span>
                ) : (
                  <span>
                    &quot;Berdasarkan hasil riksa uji, dapat disimpulkan unit tersebut{' '}
                    <span
                      className={
                        form.is_compliant
                          ? 'text-emerald-700 dark:text-emerald-400 underline'
                          : 'text-red-700 dark:text-red-400 underline'
                      }
                    >
                      {form.is_compliant ? 'MEMENUHI' : 'TIDAK MEMENUHI'}
                    </span>{' '}
                    Persyaratan Keselamatan dan Kesehatan Kerja.&quot;
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Pemeriksaan Lapangan
                </label>
                <textarea
                  rows={3}
                  disabled={!isEditable}
                  value={form.inspection_notes || ''}
                  onChange={(e) => handleFieldChange('inspection_notes', e.target.value)}
                  placeholder="Catatan hasil riksa uji, temuan penting, atau kondisi operasional unit..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md"
                />
              </div>

              {isEditable && (
                <div className="flex justify-end">
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

          {/* Area Tanda Tangan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Status Tanda Tangan Berita Acara
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Inspector (PT Upaya Riksa Daya)
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {form.inspector_name || selectedBap.inspector_signer_name || selectedBap.inspector_name} (
                      {selectedBap.inspector_signer_title || 'Ahli K3 Pemeriksa'})
                    </div>
                    {selectedBap.inspector_signed_at && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Ditandatangani: {formatDateTime(selectedBap.inspector_signed_at)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={selectedBap.inspector_sig_file_id ? 'success' : selectedBap.inspector_has_saved_sig ? 'info' : 'warning'}>
                      {selectedBap.inspector_sig_file_id
                        ? 'Sudah TTD'
                        : selectedBap.inspector_has_saved_sig
                        ? 'Siap Digunakan'
                        : 'Belum TTD'}
                    </Badge>
                    {Boolean(!selectedBap.inspector_sig_file_id && selectedBap.inspector_has_saved_sig) && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Tersimpan di profil
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Pemilik Alat / Unit (Perwakilan Klien)
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {form.contact_name || selectedBap.client_signer_name || 'Belum diisi'} (
                      {form.contact_title || selectedBap.client_signer_title || 'Perwakilan Klien'})
                    </div>
                    {selectedBap.client_signed_at && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Ditandatangani: {formatDateTime(selectedBap.client_signed_at)}
                      </div>
                    )}
                  </div>
                  <Badge variant={selectedBap.client_sig_file_id ? 'success' : 'warning'}>
                    {selectedBap.client_sig_file_id ? 'Sudah TTD' : 'Belum TTD'}
                  </Badge>
                </div>
              </div>

              {isEditable && (
                <form onSubmit={onSubmitSignature} className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <PenNib size={15} className="text-[#C81E1E]" />
                      Bubuhkan Tanda Tangan Digital BAP
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Goreskan langsung di layar / pad
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Pihak Penanda Tangan
                      </label>
                      <select
                        value={sigForm.signerRole}
                        onChange={(e) => {
                          const role = e.target.value;
                          setSigForm({
                            signerRole: role,
                            signerName:
                              role === 'AHLI_K3'
                                ? form.inspector_name || selectedBap.inspector_signer_name || selectedBap.inspector_name || ''
                                : form.contact_name || selectedBap.client_signer_name || selectedBap.contact_name || '',
                            signerTitle:
                              role === 'AHLI_K3'
                                ? 'Ahli K3 Pemeriksa'
                                : form.contact_title || 'Pemilik Alat / Perwakilan Klien'
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="AHLI_K3">Inspector (Ahli K3)</option>
                        <option value="PERWAKILAN_KLIEN">Pemilik Alat / Perwakilan Klien</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Nama Penanda Tangan *
                      </label>
                      <input
                        type="text"
                        required
                        value={sigForm.signerName}
                        onChange={(e) => setSigForm({ ...sigForm, signerName: e.target.value })}
                        placeholder="Nama lengkap penanda tangan..."
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Jabatan Penanda Tangan
                    </label>
                    <input
                      type="text"
                      value={sigForm.signerTitle}
                      onChange={(e) => setSigForm({ ...sigForm, signerTitle: e.target.value })}
                      placeholder="Jabatan penanda tangan..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Kotak Tanda Tangan:
                        </span>
                        {sigForm.signerRole === 'AHLI_K3' && user?.signatureUrl && (
                          <button
                            type="button"
                            onClick={handleApplySavedSignature}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] font-bold text-[#C81E1E] dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                          >
                            <PenNib size={12} weight="bold" />
                            <span>Gunakan TTD Tersimpan</span>
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer font-medium"
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
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                        <WarningCircle size={14} />
                        <span>{sigError}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      icon={PenNib}
                      disabled={submitting || !hasDrawn}
                      loading={submitting}
                    >
                      Bubuhkan Tanda Tangan
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Aksi Finalisasi & Berkas */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Tindakan Dokumen BAP &amp; Tautan Berkas
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Setelah ditandatangani oleh Inspector dan Perwakilan Klien, finalisasi BAP untuk mengunci dokumen serah terima pemeriksaan unit.
                </p>

                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={FilePdf}
                    onClick={() => handleDownloadPdf(selectedBap.id, form.bap_no || selectedBap.bap_no)}
                  >
                    Unduh PDF BAP
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Eye}
                    onClick={handleTriggerPreview}
                  >
                    Pratinjau PDF
                  </Button>
                  {onShareBap && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={ShareNetwork}
                      onClick={() => onShareBap(selectedBap)}
                    >
                      Bagikan BAP
                    </Button>
                  )}
                  <ActionMenu
                    label="Aksi &amp; Berkas Lainnya"
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
              </div>

              {['DRAF', 'REVISI'].includes(selectedBap.status) && canFinalize && (
                <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2">
                  <div className="p-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-xs text-blue-900 dark:text-blue-200">
                    <strong>Penerbitan BAP Mandiri:</strong> Berita Acara Riksa Uji (BAP) dapat difinalisasi dan diterbitkan secara mandiri tanpa harus menunggu LHPP selesai.
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    icon={LockKey}
                    disabled={submitting}
                    loading={submitting}
                    onClick={handleFinalizeBap}
                    className="w-full justify-center"
                  >
                    Finalisasi &amp; Kunci Berita Acara Riksa Uji (BAP)
                  </Button>
                </div>
              )}

              {selectedBap.status === 'FINAL' && canFinalize && (
                <form onSubmit={handleReopenBap} className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Buka Kunci BAP untuk Revisi Tercatat
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      minLength={5}
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      placeholder="Alasan pembukaan kunci revisi BAP..."
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-md cursor-pointer"
                    >
                      <LockKeyOpen size={14} weight="bold" />
                      Buka Kunci
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {selectedBap.revisions?.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Riwayat Versi &amp; Revisi BAP ({selectedBap.revisions.length})
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {selectedBap.revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        Versi #{rev.version} · {rev.action}
                      </span>
                      {rev.reason && (
                        <span className="text-slate-600 dark:text-slate-400">: {rev.reason}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {rev.actor_name || 'Sistem'} · {formatDateTime(rev.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
