import { Modal } from '../../../components/ui/Modal.jsx';
import { useConfirm } from '../../../components/ui/FeedbackProvider.jsx';
import { useInspectionDetailForm } from '../hooks/useInspectionDetailForm.js';
import { InspectionHeaderSection } from './InspectionHeaderSection.jsx';
import { InspectionStepNav } from './InspectionStepNav.jsx';
import { StepChecklist } from './StepChecklist.jsx';
import { StepConclusion } from './StepConclusion.jsx';
import { StepPhotosFindings } from './StepPhotosFindings.jsx';
import { StepSignatures } from './StepSignatures.jsx';
import { useNavigate } from 'react-router';
import { WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button.jsx';

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
    setDraftConclusion,
    draftConclusionNotes,
    setDraftConclusionNotes,
    draftScopes,
    setDraftScopes,
    draftObjectAttributes,
    setDraftObjectAttributes,
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
          <div className="space-y-6">
            <StepChecklist
              items={activeDetail.items || []}
              draftResults={draftResults}
              setDraftResults={setDraftResults}
              draftObjectAttributes={draftObjectAttributes}
              setDraftObjectAttributes={setDraftObjectAttributes}
              attributeSchema={activeDetail.inspection?.attribute_schema || []}
              categoryCode={activeDetail.inspection?.category_code || ''}
              categoryName={activeDetail.inspection?.category_name || ''}
              onUploadInlinePhoto={handleUploadItemInlinePhoto}
              readOnly={!isInspector || activeDetail.inspection.status !== 'DRAF'}
              missingItems={missingItems}
              evaluatedItems={evaluatedItems}
              totalItems={totalItems}
              onAutoFillStandard={handleAutoFillAllStandard}
              isInspector={isInspector}
              status={activeDetail.inspection.status}
              photos={activeDetail.photos || []}
            />

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
              onNext={() => setFormStep(2)}
            />
          </div>
        )}

        {formStep === 2 && (
          <div className="space-y-6">
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
              onAutoFillStandard={handleAutoFillAllStandard}
              onSubmitFinal={handleSubmitFinal}
              onBack={() => setFormStep(1)}
              onSaveDraft={handleSaveDraft}
              onCloseModal={onClose}
              onPreviewPdf={onPreviewPdf}
              bapId={activeDetail.inspection.bap_id}
              bapNo={activeDetail.inspection.bap_no}
              lhppId={activeDetail.inspection.lhpp_id}
              lhppNo={activeDetail.inspection.lhpp_no}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
