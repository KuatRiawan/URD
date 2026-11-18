import { ArrowLeft, ArrowRight, Check, CheckCircle } from '@phosphor-icons/react';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ErrorBanner } from '../../../components/feedback/StateViews.jsx';
import { PO_WIZARD_STEPS } from '../orderConstants.js';
import { StepPoIdentity } from './StepPoIdentity.jsx';
import { StepPoClient } from './StepPoClient.jsx';
import { StepPoUnits } from './StepPoUnits.jsx';
import { StepPoSchedule } from './StepPoSchedule.jsx';
import { StepPoReview } from './StepPoReview.jsx';

export function CreatePoWizardModal({
  open,
  onClose,
  poWizardStep,
  setPoWizardStep,
  createForm,
  setCreateForm,
  clientMode,
  setClientMode,
  clients,
  clientObjects,
  clientLocations = [],
  clientContacts = [],
  categories,
  inspectors,
  newUnitRow,
  setNewUnitRow,
  handleClientChange,
  toggleObjectSelection,
  handleAddInlineUnit,
  removeInlineUnit,
  handleOpenCsvImport,
  handleWizardNext,
  handleCreateOrder,
  submitting,
  error,
  setError,
  user: propUser
}) {
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser;

  const modalFooter = (
    <div className="flex items-center justify-between gap-3 w-full">
      {poWizardStep > 1 ? (
        <Button
          type="button"
          variant="secondary"
          size="md"
          icon={ArrowLeft}
          onClick={() => {
            setError('');
            setPoWizardStep((prev) => prev - 1);
          }}
        >
          Kembali
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onClose}
        >
          Batal
        </Button>
      )}

      {poWizardStep < 5 ? (
        <Button
          type="button"
          variant="primary"
          size="md"
          icon={ArrowRight}
          onClick={handleWizardNext}
        >
          Lanjut
        </Button>
      ) : (
        <Button
          type="button"
          variant="primary"
          size="md"
          icon={CheckCircle}
          disabled={submitting}
          loading={submitting}
          onClick={handleCreateOrder}
        >
          {submitting ? 'Menyimpan...' : 'Simpan Purchase Order'}
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Purchase Order (PO)"
      subtitle={`Langkah ${poWizardStep} dari 5: ${PO_WIZARD_STEPS[poWizardStep - 1]}`}
      maxWidth="max-w-4xl"
      size="xl"
      footer={modalFooter}
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-200 pb-2">
        {/* Modern Minimalist Stepper */}
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
          {/* Desktop/Tablet Stepper: Horizontal steps with status */}
          <div className="hidden sm:flex items-center justify-between gap-2">
            {PO_WIZARD_STEPS.map((stepName, idx) => {
              const stepNumber = idx + 1;
              const isCompleted = stepNumber < poWizardStep;
              const isCurrent = stepNumber === poWizardStep;

              return (
                <div key={stepName} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-[#C81E1E] text-white shadow-sm ring-2 ring-[#C81E1E]/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check size={12} weight="bold" /> : stepNumber}
                    </span>
                    <span
                      className={`hidden lg:inline text-xs whitespace-nowrap transition-colors ${
                        isCurrent
                          ? 'text-slate-900 dark:text-white font-semibold'
                          : isCompleted
                          ? 'text-slate-600 dark:text-slate-300 font-medium'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {stepName}
                    </span>
                  </div>
                  {idx < PO_WIZARD_STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 min-w-3 transition-colors ${
                        stepNumber < poWizardStep
                          ? 'bg-emerald-500/80 dark:bg-emerald-500/60'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Minimalist Stepper */}
          <div className="sm:hidden space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">
                Tahap {poWizardStep} dari 5: {PO_WIZARD_STEPS[poWizardStep - 1]}
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                {Math.round((poWizardStep / 5) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#C81E1E] h-full rounded-full transition-all duration-300"
                style={{ width: `${(poWizardStep / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {error && <ErrorBanner message={error} onRetry={() => setError('')} />}

        {poWizardStep === 1 && (
          <StepPoIdentity
            createForm={createForm}
            setCreateForm={setCreateForm}
          />
        )}

        {poWizardStep === 2 && (
          <StepPoClient
            createForm={createForm}
            setCreateForm={setCreateForm}
            clientMode={clientMode}
            setClientMode={setClientMode}
            clients={clients}
            clientLocations={clientLocations}
            clientContacts={clientContacts}
            handleClientChange={handleClientChange}
            setError={setError}
          />
        )}

        {poWizardStep === 3 && (
          <StepPoUnits
            clientMode={clientMode}
            createForm={createForm}
            setCreateForm={setCreateForm}
            clientObjects={clientObjects}
            toggleObjectSelection={toggleObjectSelection}
            newUnitRow={newUnitRow}
            setNewUnitRow={setNewUnitRow}
            categories={categories}
            handleAddInlineUnit={handleAddInlineUnit}
            removeInlineUnit={removeInlineUnit}
            handleOpenCsvImport={handleOpenCsvImport}
          />
        )}

        {poWizardStep === 4 && (
          <StepPoSchedule
            createForm={createForm}
            setCreateForm={setCreateForm}
            inspectors={inspectors}
            user={currentUser}
          />
        )}

        {poWizardStep === 5 && (
          <StepPoReview
            createForm={createForm}
            clientMode={clientMode}
            clients={clients}
            inspectors={inspectors}
            user={currentUser}
          />
        )}
      </div>
    </Modal>
  );
}
