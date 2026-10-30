import {
  Eye,
  FilePdf,
  LockKey,
  LockKeyOpen,
  PenNib,
  SealCheck
} from '@phosphor-icons/react';
import logoUrd from '../../../assets/logo-urd.png';
import { LoadingState } from '../../../components/feedback/StateViews.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { formatDateTime } from '../../../lib/utils/format.js';

export function BapDetailModal({
  selectedBap,
  onClose,
  detailLoading,
  feedback,
  canManage,
  draftForm,
  setDraftForm,
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
  handleDownloadBatchPoPdf,
  submitting,
  navigate
}) {
  if (!selectedBap) return null;

  return (
    <Modal
      isOpen={Boolean(selectedBap)}
      onClose={onClose}
      title={`Berita Acara Riksa Uji: ${selectedBap.bap_no}`}
      size="xl"
    >
      {detailLoading ? (
        <LoadingState message="Memuat lembar Berita Acara Riksa Uji..." />
      ) : (
        <div className="space-y-6">
          {feedback && (
            <Notice tone={feedback.type === 'error' ? 'error' : 'success'}>{feedback.message}</Notice>
          )}

          {/* Kop Dokumen Resmi BAP */}
          <div className="border-2 border-slate-800 rounded-xl p-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#C81E1E] pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoUrd}
                  alt="Logo PT Upaya Riksa Daya"
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight">
                    PT UPAYA RIKSA DAYA
                  </h3>
                  <p className="text-xs font-semibold text-[#475569]">
                    Perusahaan Jasa K3 (PJK3) Bidang Pemeriksaan dan Pengujian
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded bg-[#0F172A] text-white text-xs font-extrabold tracking-wider uppercase">
                  BERITA ACARA RIKSA UJI
                </span>
                <div className="mt-1 text-xs font-mono font-bold text-slate-800">
                  Nomor: {selectedBap.bap_no}
                </div>
                <div className="text-[11px] text-slate-500">
                  Status: {selectedBap.status} · Revisi #{selectedBap.revision_no}
                </div>
              </div>
            </div>

            {/* Bagian Identitas Pemeriksaan sesuai Template BAP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs">
              <div>
                <span className="text-slate-500 block">1. Objek yang Diperiksa</span>
                <span className="font-bold text-slate-900">
                  {selectedBap.object_name} ({selectedBap.category_code} - {selectedBap.category_name})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">2. Nama Perusahaan / Klien</span>
                <span className="font-bold text-slate-900">{selectedBap.client_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">3. Alamat Perusahaan</span>
                <span className="font-medium text-slate-800">
                  {selectedBap.client_address || selectedBap.location_address || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">4. Pabrik Pembuat / Tahun</span>
                <span className="font-medium text-slate-800">
                  {selectedBap.manufacturer || selectedBap.brand || '-'} /{' '}
                  {selectedBap.manufacture_year || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">5. Nomor Seri / Kapasitas</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedBap.serial_number || '-'} / {selectedBap.capacity || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">6. Lokasi Pemeriksaan &amp; Referensi PO</span>
                <span className="font-medium text-slate-800">
                  {selectedBap.install_location || selectedBap.location_name || '-'} · PO:{' '}
                  <strong className="font-mono">{selectedBap.po_number || selectedBap.order_no}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Ruang Lingkup Riksa Uji */}
          <form onSubmit={handleSaveDraft} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Ruang Lingkup Riksa Uji (Centang yang Dilaksanakan)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Terpilih {draftForm.scopeItems.length} dari {scopeCatalog.length} item ruang lingkup pada template BAP.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tanggal Pelaksanaan:</label>
                <input
                  type="date"
                  disabled={selectedBap.status === 'FINAL' || !canManage}
                  value={draftForm.inspectionDate}
                  onChange={(e) => setDraftForm({ ...draftForm, inspectionDate: e.target.value })}
                  className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 max-h-72 overflow-y-auto">
              {scopeCatalog.map((scopeName) => {
                const checked = draftForm.scopeItems.includes(scopeName);
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
                      disabled={selectedBap.status === 'FINAL' || !canManage}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Hasil Riksa Uji (Pernyataan Resmi BAP)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 cursor-pointer">
                    <input
                      type="radio"
                      name="isCompliant"
                      disabled={selectedBap.status === 'FINAL' || !canManage}
                      checked={draftForm.isCompliant === true}
                      onChange={() => setDraftForm({ ...draftForm, isCompliant: true })}
                    />
                    MEMENUHI PERSYARATAN K3
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 cursor-pointer">
                    <input
                      type="radio"
                      name="isCompliant"
                      disabled={selectedBap.status === 'FINAL' || !canManage}
                      checked={draftForm.isCompliant === false}
                      onChange={() => setDraftForm({ ...draftForm, isCompliant: false })}
                    />
                    TIDAK MEMENUHI PERSYARATAN K3
                  </label>
                </div>
              </div>

              <div className="p-3 rounded bg-slate-100 dark:bg-slate-750 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 border-l-4 border-[#C81E1E]">
                &quot;Berdasarkan hasil riksa uji, dapat disimpulkan unit tersebut{' '}
                <span className={draftForm.isCompliant ? 'text-emerald-700 dark:text-emerald-400 underline' : 'text-red-700 dark:text-red-400 underline'}>
                  {draftForm.isCompliant ? 'MEMENUHI' : 'TIDAK MEMENUHI'}
                </span>{' '}
                Persyaratan Keselamatan dan Kesehatan Kerja.&quot;
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Pemeriksaan Lapangan
                </label>
                <textarea
                  rows={3}
                  disabled={selectedBap.status === 'FINAL' || !canManage}
                  value={draftForm.inspectionNotes}
                  onChange={(e) => setDraftForm({ ...draftForm, inspectionNotes: e.target.value })}
                  placeholder="Catatan hasil riksa uji, temuan penting, atau kondisi operasional unit..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md"
                />
              </div>

              {selectedBap.status === 'DRAF' && canManage && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 rounded-md disabled:opacity-50 cursor-pointer"
                  >
                    Simpan Perubahan Draf BAP
                  </button>
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
                      {selectedBap.inspector_signer_name || selectedBap.inspector_name} (
                      {selectedBap.inspector_signer_title || 'Ahli K3 Pemeriksa'})
                    </div>
                    {selectedBap.inspector_signed_at && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Ditandatangani: {formatDateTime(selectedBap.inspector_signed_at)}
                      </div>
                    )}
                  </div>
                  <Badge variant={selectedBap.inspector_sig_file_id ? 'success' : 'warning'}>
                    {selectedBap.inspector_sig_file_id ? 'Sudah TTD' : 'Belum TTD'}
                  </Badge>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Pemilik Alat / Unit (Perwakilan Klien)
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {selectedBap.client_signer_name || 'Belum diisi'} (
                      {selectedBap.client_signer_title || 'Perwakilan Klien'})
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

              {selectedBap.status === 'DRAF' && canManage && (
                <form onSubmit={handleSaveSignature} className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bubuhkan Tanda Tangan Digital pada BAP
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={sigForm.signerRole}
                      onChange={(e) => {
                        const role = e.target.value;
                        setSigForm({
                          signerRole: role,
                          signerName:
                            role === 'AHLI_K3'
                              ? selectedBap.inspector_signer_name || selectedBap.inspector_name || ''
                              : selectedBap.client_signer_name || selectedBap.contact_name || '',
                          signerTitle:
                            role === 'AHLI_K3'
                              ? 'Ahli K3 Pemeriksa'
                              : 'Pemilik Alat / Perwakilan Klien'
                        });
                      }}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="AHLI_K3">Inspector (Ahli K3)</option>
                      <option value="PERWAKILAN_KLIEN">Pemilik Alat / Perwakilan Klien</option>
                    </select>
                    <input
                      type="text"
                      required
                      value={sigForm.signerName}
                      onChange={(e) => setSigForm({ ...sigForm, signerName: e.target.value })}
                      placeholder="Nama lengkap penanda tangan..."
                      className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sigForm.signerTitle}
                      onChange={(e) => setSigForm({ ...sigForm, signerTitle: e.target.value })}
                      placeholder="Jabatan penanda tangan..."
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 rounded-md cursor-pointer"
                    >
                      <PenNib size={14} weight="bold" />
                      Simpan TTD
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Aksi Finalisasi & Berkas */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Tindakan Dokumen BAP &amp; Tautan LHPP
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Setelah ditandatangani oleh Inspector dan Perwakilan Klien, finalisasi BAP untuk mengunci dokumen serah terima dan menyelesaikan unit riksa uji.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePreviewPdf(selectedBap.id, selectedBap.bap_no)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer"
                  >
                    <Eye size={16} />
                    Pratinjau PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(selectedBap.id, selectedBap.bap_no)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#C81E1E] hover:bg-red-800 rounded-md cursor-pointer"
                  >
                    <FilePdf size={16} weight="bold" />
                    Unduh / Cetak PDF BAP Unit Ini
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadBatchPoPdf(
                        selectedBap.order_id,
                        selectedBap.po_number || selectedBap.order_no
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer"
                  >
                    <FilePdf size={16} weight="bold" />
                    Cetak Gabungan BAP 1 PO
                  </button>
                  {selectedBap.lhpp_id && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/app/lhpp');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md cursor-pointer"
                    >
                      <SealCheck size={16} weight="bold" />
                      Buka Dokumen LHPP ({selectedBap.lhpp_status})
                    </button>
                  )}
                </div>
              </div>

              {selectedBap.status === 'DRAF' && canManage && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinalizeBap}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md disabled:opacity-50 cursor-pointer"
                  >
                    <LockKey size={16} weight="bold" />
                    Finalisasi &amp; Kunci Berita Acara Riksa Uji (BAP)
                  </button>
                </div>
              )}

              {selectedBap.status === 'FINAL' && selectedBap.lhpp_status !== 'TERBIT' && (
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
        </div>
      )}
    </Modal>
  );
}

