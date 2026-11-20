import { useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { useConfirm, useToast } from '../../../components/ui/FeedbackProvider.jsx';
import { useInspectionDetailForm } from '../hooks/useInspectionDetailForm.js';
import { InspectionHeaderSection } from './InspectionHeaderSection.jsx';
import { InspectionStepNav } from './InspectionStepNav.jsx';
import { StepChecklist } from './StepChecklist.jsx';
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
    draftConclusion,
    draftConclusionNotes,
    setDraftConclusionNotes,
    draftObjectAttributes,
    setDraftObjectAttributes,
    workPhase,
    setWorkPhase,
    formStep,
    setFormStep,
    lastSavedAt,
    online,
    queuedPhotoCount,
    findingForm,
    setFindingForm,
    signatures,
    handleSaveDraft,
    handleDiscardDraft,
    handleAddFinding,
    handleConclusionSelect,
    handleUploadPhoto,
    handleUploadPhotoDirect,
    handleUpdatePhotoCaption,
    handleDeletePhoto,
    handleSubmitFinal,
    handleReopenInspection,
    totalItems,
    evaluatedItems,
    missingItems,
    photosCount,
    inspectorSig,
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

  const isDraftStatus = activeDetail.inspection.status === 'DRAF';
  const submitLabel = submitting
    ? 'Mengajukan Draf LHPP...'
    : !inspectorSig
    ? 'Tanda Tangan Ahli K3 Diperlukan'
    : 'Selesaikan & Ajukan Draf LHPP ke Admin Kantor';

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
            Sebelumnya: Bagian {formStep - 1}
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
        {formStep < 8 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={ArrowRight}
            className="w-full sm:w-auto"
            onClick={() => setFormStep(formStep + 1)}
          >
            Selanjutnya: Bagian {formStep + 1}
          </Button>
        )}
        {formStep === 8 && (
          <>
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
        />

        {formStep >= 1 && formStep <= 7 && (
          <div key={`section-${formStep}`} className="space-y-6 animate-section-in">
            <StepChecklist
              inspection={activeDetail.inspection}
              draftObjectAttributes={draftObjectAttributes}
              setDraftObjectAttributes={setDraftObjectAttributes}
              readOnly={!isInspector || activeDetail.inspection.status !== 'DRAF'}
              formStep={formStep}
              setFormStep={setFormStep}
              draftConclusion={draftConclusion}
              setDraftConclusion={handleConclusionSelect}
              draftConclusionNotes={draftConclusionNotes}
              setDraftConclusionNotes={setDraftConclusionNotes}
              onNext={() => setFormStep(formStep + 1)}
            />
          </div>
        )}

        {formStep === 8 && (
          <div key="section-8" className="space-y-6 animate-section-in">
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
              onBack={() => setFormStep(7)}
              onNext={() => {}}
              hideInlineActions={true}
            />

            <StepSignatures
              user={user}
              inspectorSig={inspectorSig}
              inspectorSigName={signatures.inspectorSigName}
              setInspectorSigName={signatures.setInspectorSigName}
              inspectorSigTitle={signatures.inspectorSigTitle}
              setInspectorSigTitle={signatures.setInspectorSigTitle}
              inspectorCanvasRef={signatures.inspectorCanvasRef}
              onInspectorPointerDown={signatures.handleInspectorPointerDown}
              onInspectorPointerMove={signatures.handleInspectorPointerMove}
              onInspectorPointerUp={signatures.handleInspectorPointerUp}
              onClearInspectorCanvas={signatures.clearInspectorCanvas}
              onApplySavedSignature={signatures.handleApplySavedSignature}
              onSaveInspectorSignature={signatures.handleSaveInspectorSignature}
              reSigningInspector={signatures.reSigningInspector}
              setReSigningInspector={signatures.setReSigningInspector}
              savingInspector={signatures.savingInspector}
              sigErrorInspector={signatures.sigErrorInspector}
              sigFeedbackInspector={signatures.sigFeedbackInspector}
              isInspector={isInspector}
              status={activeDetail.inspection.status}
              submitting={submitting}
              canSubmit={canSubmit}
              photosCount={photosCount}
              draftConclusion={draftConclusion}
              onSubmitFinal={handleSubmitFinal}
              onBack={() => setFormStep(7)}
              onSaveDraft={handleSaveDraft}
              onCloseModal={onClose}
              hideInlineActions={true}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
