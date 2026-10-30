import { Modal } from '../../../components/ui/Modal.jsx';
import { useConfirm } from '../../../components/ui/FeedbackProvider.jsx';
import { useInspectionDetailForm } from '../hooks/useInspectionDetailForm.js';
import { InspectionHeaderSection } from './InspectionHeaderSection.jsx';
import { InspectionStepNav } from './InspectionStepNav.jsx';
import { StepChecklist } from './StepChecklist.jsx';
import { StepConclusion } from './StepConclusion.jsx';
import { StepPhotosFindings } from './StepPhotosFindings.jsx';
import { StepSignatures } from './StepSignatures.jsx';

export function InspectionDetailModal({
  inspectionId,
  onClose,
  isInspector,
  user,
  onSaved,
  onPreviewPdf
}) {
  const confirm = useConfirm();

  const {
    activeDetail,
    loading,
    error,
    setError,
    feedback,
    setFeedback,
    submitting,
    draftResults,
    setDraftResults,
    draftConclusion,
    setDraftConclusion,
    draftConclusionNotes,
    setDraftConclusionNotes,
    draftScopes,
    setDraftScopes,
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
    handleAddFinding,
    handleUploadPhoto,
    handleDeletePhoto,
    handleUploadItemInlinePhoto,
    handleSubmitFinal,
    handleAutoFillAllStandard,
    totalItems,
    evaluatedItems,
    missingItems,
    photosCount,
    inspectorSig,
    clientSig,
    canSubmit
  } = useInspectionDetailForm({ inspectionId, user, onSaved, confirm });

  if (!inspectionId || !activeDetail?.inspection) return null;

  return (
    <Modal
      open={Boolean(inspectionId)}
      onClose={onClose}
      title={`Form Inspeksi: ${activeDetail.inspection.object_name} (${activeDetail.inspection.order_no})`}
      size="xl"
    >
      <div className="space-y-5 text-sm">
        <InspectionHeaderSection
          activeDetail={activeDetail}
          lastSavedAt={lastSavedAt}
          error={error}
          setError={setError}
          feedback={feedback}
          setFeedback={setFeedback}
          isInspector={isInspector}
          online={online}
          queuedPhotoCount={queuedPhotoCount}
          onPreviewPdf={onPreviewPdf}
        />

        <InspectionStepNav
          formStep={formStep}
          setFormStep={setFormStep}
          missingItems={missingItems}
          evaluatedItems={evaluatedItems}
          totalItems={totalItems}
          photosCount={photosCount}
          inspectorSig={inspectorSig}
        />

        {formStep === 1 && (
          <StepChecklist
            items={activeDetail.items || []}
            draftResults={draftResults}
            setDraftResults={setDraftResults}
            onUploadInlinePhoto={handleUploadItemInlinePhoto}
            readOnly={!isInspector || activeDetail.inspection.status !== 'DRAF'}
            missingItems={missingItems}
            evaluatedItems={evaluatedItems}
            totalItems={totalItems}
            onAutoFillStandard={handleAutoFillAllStandard}
            isInspector={isInspector}
            status={activeDetail.inspection.status}
            photos={activeDetail.photos || []}
            onNext={() => setFormStep(2)}
          />
        )}

        {formStep === 2 && (
          <StepConclusion
            draftConclusion={draftConclusion}
            setDraftConclusion={setDraftConclusion}
            draftConclusionNotes={draftConclusionNotes}
            setDraftConclusionNotes={setDraftConclusionNotes}
            draftScopes={draftScopes}
            setDraftScopes={setDraftScopes}
            scopeCatalog={activeDetail.scopeCatalog || []}
            isInspector={isInspector}
            status={activeDetail.inspection.status}
            submitting={submitting}
            onSaveDraft={handleSaveDraft}
            onBack={() => setFormStep(1)}
            onNext={() => setFormStep(3)}
          />
        )}

        {formStep === 3 && (
          <StepPhotosFindings
            photos={activeDetail.photos || []}
            findings={activeDetail.findings || []}
            photoFile={photoFile}
            setPhotoFile={setPhotoFile}
            photoCaption={photoCaption}
            setPhotoCaption={setPhotoCaption}
            findingForm={findingForm}
            setFindingForm={setFindingForm}
            isInspector={isInspector}
            status={activeDetail.inspection.status}
            submitting={submitting}
            onUploadPhoto={handleUploadPhoto}
            onDeletePhoto={handleDeletePhoto}
            onAddFinding={handleAddFinding}
            onSaveDraft={handleSaveDraft}
            onBack={() => setFormStep(2)}
            onNext={() => setFormStep(4)}
          />
        )}

        {formStep === 4 && (
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
            onSaveInspectorSignature={() => signatures.handleSaveInspectorSignature(signatures.setSubmitting)}
            onSaveClientSignature={() => signatures.handleSaveClientSignature(signatures.setSubmitting)}
            reSigningInspector={signatures.reSigningInspector}
            setReSigningInspector={signatures.setReSigningInspector}
            reSigningClient={signatures.reSigningClient}
            setReSigningClient={signatures.setReSigningClient}
            isInspector={isInspector}
            status={activeDetail.inspection.status}
            submitting={submitting}
            canSubmit={canSubmit}
            missingItems={missingItems}
            evaluatedItems={evaluatedItems}
            totalItems={totalItems}
            photosCount={photosCount}
            draftConclusion={draftConclusion}
            onAutoFillStandard={handleAutoFillAllStandard}
            onSubmitFinal={handleSubmitFinal}
            onBack={() => setFormStep(3)}
            onSaveDraft={handleSaveDraft}
            onCloseModal={onClose}
            onPreviewPdf={onPreviewPdf}
            bapId={activeDetail.inspection.bap_id}
            bapNo={activeDetail.inspection.bap_no}
            lhppId={activeDetail.inspection.lhpp_id}
            lhppNo={activeDetail.inspection.lhpp_no}
          />
        )}
      </div>
    </Modal>
  );
}
