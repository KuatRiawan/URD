import { useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { useConfirm, useToast } from '../../../components/ui/FeedbackProvider.jsx';
import { useInspectionDetailForm } from '../hooks/useInspectionDetailForm.js';
import { InspectionHeaderSection } from './InspectionHeaderSection.jsx';
import { InspectionStepNav } from './InspectionStepNav.jsx';
import { StepChecklist } from './StepChecklist.jsx';
import { StepConclusion } from './StepConclusion.jsx';
import { StepPhotosFindings } from './StepPhotosFindings.jsx';
import { StepSignatures } from './StepSignatures.jsx';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, FloppyDisk, PaperPlaneTilt, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button.jsx';
import { api } from '../../../lib/api/axios.js';

export function InspectionDetailModal({
  inspectionId,
  onClose,
  isInspector: propIsInspector,
  user,
  onSaved,
  onPreviewPdf
}) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const isInspector = Boolean(
    propIsInspector || ['AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM'].includes(user?.role)
  );

  const {
    activeDetail,
    error,
    setError,
    feedback,
    setFeedback,
    submitting,
    draftResults,
    setDraftResults,
    draftConclusion,
    draftConclusionNotes,
    setDraftConclusionNotes,
    draftScopes,
    setDraftScopes,
    draftObjectAttributes,
    setDraftObjectAttributes,
    workPhase,
    setWorkPhase,
    formStep,
    setFormStep,
    lastSavedAt,
    photoFile,
    setPhotoFile,
    photoCaption,
    setPhotoCaption,
    online,
    queuedPhotoCount,
    findingForm,
    setFindingForm,
    signatures,
    handleSaveDraft,
    handleSaveFieldProgressAndBap,
    handleDiscardDraft,
    handleAddFinding,
    handleChecklistResultChange,
    handleConclusionSelect,
    handleUploadPhoto,
    handleUploadPhotoDirect,
    handleUpdatePhotoCaption,
    handleDeletePhoto,
    handleUploadItemInlinePhoto,
    handleUploadNameplatePhoto,
    handleSubmitFinal,
    handleReopenInspection,
    totalItems,
    evaluatedItems,
    missingItems,
    photosCount,
    inspectorSig,
    clientSig,
    canSubmit
  } = useInspectionDetailForm({ inspectionId, user, onSaved, confirm });

  useEffect(() => {
    if (feedback && !feedback.includes('dipulihkan')) {
      toast(feedback, 'success');
      setFeedback('');
    }
  }, [feedback, toast, setFeedback]);

  if (!inspectionId || !activeDetail?.inspection) return null;

  const handleDownloadDocx = async (endpointPath, filename) => {
    try {
      const response = await api.get(endpointPath, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunduh file DOCX.');
    }
  };

  const handleAddFindingFromItem = (item, noteText) => {
    const itemLabel = item?.label || item?.item_label || 'Parameter Inspeksi';
    const desc = `[${item?.section || 'Teknis'}] ${itemLabel}${noteText ? `: ${noteText}` : ' — Tidak sesuai standar K3'}`;
    setFindingForm((prev) => ({
      ...(prev || { severity: 'MAYOR', recommendation: '' }),
      description: desc
    }));
    toast('Temuan disiapkan di bagian Daftar Temuan Lapangan — lengkapi & klik Tambah.', 'success');
    setTimeout(() => {
      document.getElementById('inspection-findings-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const isDraftStatus = activeDetail.inspection.status === 'DRAF';
  const submitLabel = submitting
    ? 'Mengirim...'
    : !draftConclusion
    ? 'Pilih Kesimpulan Terlebih Dahulu'
    : !inspectorSig
    ? 'Tanda Tangan Ahli K3 Diperlukan'
    : !clientSig
    ? 'Tanda Tangan Klien Diperlukan'
    : 'Selesaikan Pemeriksaan Lapangan & Buat BAP';

  const modalFooter = (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 w-full">
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
        {formStep > 1 && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={ArrowLeft}
            onClick={() => setFormStep(formStep - 1)}
          >
            {formStep === 2 ? 'Kembali ke Data Umum' : 'Kembali ke Foto Lapangan'}
          </Button>
        )}
        {isInspector && isDraftStatus && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            icon={FloppyDisk}
            disabled={submitting}
            loading={submitting}
            onClick={handleSaveDraft}
          >
            Simpan Draf
          </Button>
        )}
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline font-medium">
          {lastSavedAt
            ? `Tersimpan ${lastSavedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
            : 'Autosave aktif'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        {formStep === 1 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={ArrowRight}
            className="w-full sm:w-auto"
            onClick={() => setFormStep(2)}
          >
            Lanjut: Dokumentasi Foto (Bagian 8)
          </Button>
        )}
        {formStep === 2 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={ArrowRight}
            className="w-full sm:w-auto"
            onClick={() => setFormStep(3)}
          >
            Lanjut: Tanda Tangan &amp; BAP
          </Button>
        )}
        {formStep === 3 && (
          <>
            {isInspector && isDraftStatus && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                icon={FloppyDisk}
                disabled={submitting}
                onClick={handleSaveFieldProgressAndBap}
                className="w-full sm:w-auto"
              >
                Simpan Progres Lapangan &amp; Siapkan BAP
              </Button>
            )}
            {isInspector && isDraftStatus ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={PaperPlaneTilt}
                disabled={submitting || !canSubmit}
                loading={submitting}
                className="w-full sm:w-auto"
                onClick={handleSubmitFinal}
              >
                {submitLabel}
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full sm:w-auto"
                onClick={onClose}
              >
                Tutup Formulir
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      open={Boolean(inspectionId)}
      onClose={onClose}
      title={`Form Inspeksi: ${activeDetail.inspection.object_name} (${activeDetail.inspection.order_no})`}
      size="xl"
      closeOnBackdrop={false}
      closeOnEscape={false}
      fullScreenMobile={true}
      footer={modalFooter}
    >
      <div className="space-y-5 text-sm">
        {isInspector && (
          <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-950 dark:text-amber-100">Ada kondisi di lapangan yang menghambat pemeriksaan?</p>
            <Button
              variant="outline"
              icon={WarningCircle}
              onClick={() => {
                const issueUrl = `/app/issues?orderId=${encodeURIComponent(activeDetail.inspection.order_id)}&objectId=${encodeURIComponent(activeDetail.inspection.object_id)}&inspectionId=${encodeURIComponent(activeDetail.inspection.id)}`;
                onClose();
                navigate(issueUrl);
              }}
            >
              Laporkan kendala
            </Button>
          </div>
        )}
        <InspectionHeaderSection
          activeDetail={activeDetail}
          lastSavedAt={lastSavedAt}
          error={error}
          setError={setError}
          feedback={feedback}
          setFeedback={setFeedback}
          isInspector={isInspector}
          user={user}
          online={online}
          queuedPhotoCount={queuedPhotoCount}
          workPhase={workPhase}
          setWorkPhase={setWorkPhase}
          onPreviewPdf={onPreviewPdf}
          onDownloadDocx={handleDownloadDocx}
          onDiscardDraft={handleDiscardDraft}
          onReopenInspection={handleReopenInspection}
          totalItems={totalItems}
          evaluatedItems={evaluatedItems}
          missingItems={missingItems}
          photosCount={photosCount}
          inspectorSig={inspectorSig}
          clientSig={clientSig}
          draftResults={draftResults}
          draftObjectAttributes={draftObjectAttributes}
          draftConclusion={draftConclusion}
          setFormStep={setFormStep}
        />

        <InspectionStepNav
          formStep={formStep}
          setFormStep={setFormStep}
          photosCount={photosCount}
          inspectorSig={inspectorSig}
          clientSig={clientSig}
          bapNo={activeDetail.inspection.bap_no}
        />

        {formStep === 1 && (
          <div key="step-1" className="space-y-6 animate-section-in">
            <StepChecklist
              inspection={activeDetail.inspection}
              items={activeDetail.items || []}
              draftResults={draftResults}
              setDraftResults={setDraftResults}
              onResultChange={handleChecklistResultChange}
              draftObjectAttributes={draftObjectAttributes}
              setDraftObjectAttributes={setDraftObjectAttributes}
              attributeSchema={activeDetail.inspection?.attribute_schema || []}
              categoryCode={activeDetail.inspection?.category_code || ''}
              categoryName={activeDetail.inspection?.category_name || ''}
              workPhase={workPhase}
              onUploadInlinePhoto={handleUploadItemInlinePhoto}
              onDeletePhoto={handleDeletePhoto}
              onUploadNameplatePhoto={handleUploadNameplatePhoto}
              onAddFindingFromItem={handleAddFindingFromItem}
              readOnly={!isInspector || activeDetail.inspection.status !== 'DRAF'}
              missingItems={missingItems}
              evaluatedItems={evaluatedItems}
              totalItems={totalItems}
              isInspector={isInspector}
              status={activeDetail.inspection.status}
              photos={activeDetail.photos || []}
              onNext={() => setFormStep(2)}
            />
          </div>
        )}

        {formStep === 2 && (
          <div key="step-2" className="space-y-6 animate-section-in">
            <StepPhotosFindings
              photos={activeDetail.photos || []}
              findings={activeDetail.findings || []}
              findingForm={findingForm}
              setFindingForm={setFindingForm}
              workPhase={workPhase}
              isInspector={isInspector}
              status={activeDetail.inspection.status}
              readOnly={!isInspector || activeDetail.inspection.status !== 'DRAF'}
              submitting={submitting}
              onUploadPhoto={handleUploadPhoto}
              onUploadPhotoDirect={handleUploadPhotoDirect}
              onUpdatePhotoCaption={handleUpdatePhotoCaption}
              onDeletePhoto={handleDeletePhoto}
              onAddFinding={handleAddFinding}
              onSaveDraft={handleSaveDraft}
              onBack={() => setFormStep(1)}
              onNext={() => setFormStep(3)}
              hideInlineActions={true}
            />
          </div>
        )}

        {formStep === 3 && (
          <div key="step-3" className="space-y-6 animate-section-in">
            <StepConclusion
              draftConclusion={draftConclusion}
              setDraftConclusion={handleConclusionSelect}
              draftConclusionNotes={draftConclusionNotes}
              setDraftConclusionNotes={setDraftConclusionNotes}
              draftScopes={draftScopes}
              setDraftScopes={setDraftScopes}
              scopeCatalog={activeDetail.scopeCatalog || []}
              workPhase={workPhase}
              isInspector={isInspector}
              status={activeDetail.inspection.status}
              submitting={submitting}
              onSaveDraft={handleSaveDraft}
            />

            <StepSignatures
              inspectorSig={inspectorSig}
              clientSig={clientSig}
              inspectorSigName={signatures.inspectorSigName}
              setInspectorSigName={signatures.setInspectorSigName}
              inspectorSigTitle={signatures.inspectorSigTitle}
              setInspectorSigTitle={signatures.setInspectorSigTitle}
              clientSigName={signatures.clientSigName}
              setClientSigName={signatures.setClientSigName}
              clientSigTitle={signatures.clientSigTitle}
              setClientSigTitle={signatures.setClientSigTitle}
              inspectorCanvasRef={signatures.inspectorCanvasRef}
              clientCanvasRef={signatures.clientCanvasRef}
              onInspectorPointerDown={signatures.handleInspectorPointerDown}
              onInspectorPointerMove={signatures.handleInspectorPointerMove}
              onInspectorPointerUp={signatures.handleInspectorPointerUp}
              onClientPointerDown={signatures.handleClientPointerDown}
              onClientPointerMove={signatures.handleClientPointerMove}
              onClientPointerUp={signatures.handleClientPointerUp}
              onClearInspectorCanvas={signatures.clearInspectorCanvas}
              onClearClientCanvas={signatures.clearClientCanvas}
              onSaveInspectorSignature={signatures.handleSaveInspectorSignature}
              onSaveClientSignature={signatures.handleSaveClientSignature}
              reSigningInspector={signatures.reSigningInspector}
              setReSigningInspector={signatures.setReSigningInspector}
              reSigningClient={signatures.reSigningClient}
              setReSigningClient={signatures.setReSigningClient}
              savingInspector={signatures.savingInspector}
              savingClient={signatures.savingClient}
              sigErrorInspector={signatures.sigErrorInspector}
              sigErrorClient={signatures.sigErrorClient}
              sigFeedbackInspector={signatures.sigFeedbackInspector}
              sigFeedbackClient={signatures.sigFeedbackClient}
              isInspector={isInspector}
              status={activeDetail.inspection.status}
              submitting={submitting}
              canSubmit={canSubmit}
              missingItems={missingItems}
              evaluatedItems={evaluatedItems}
              totalItems={totalItems}
              photosCount={photosCount}
              draftConclusion={draftConclusion}
              bapId={activeDetail.inspection.bap_id}
              bapNo={activeDetail.inspection.bap_no}
              lhppId={activeDetail.inspection.lhpp_id}
              lhppNo={activeDetail.inspection.lhpp_no}
              onPrepareBapDraft={handleSaveFieldProgressAndBap}
              onPreviewBapPdf={(id) =>
                onPreviewPdf(
                  `/bap/${id}/pdf`,
                  `Pratinjau BAP - ${activeDetail.inspection.bap_no || 'BAP'}`,
                  `${(activeDetail.inspection.bap_no || 'BAP').replace(/[/\s]/g, '-')}.pdf`
                )
              }
              onPreviewBapDocx={(id) =>
                handleDownloadDocx(
                  `/bap/${id}/docx`,
                  `${(activeDetail.inspection.bap_no || 'BAP').replace(/[/\s]/g, '-')}.docx`
                )
              }
              onSubmitFinal={handleSubmitFinal}
              onBack={() => setFormStep(2)}
              onSaveDraft={handleSaveDraft}
              onCloseModal={onClose}
              onPreviewPdf={onPreviewPdf}
              hideInlineActions={true}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
