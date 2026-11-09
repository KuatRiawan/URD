import { ArrowLeft, ArrowRight, CheckCircle } from '@phosphor-icons/react';
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Purchase Order (PO)"
      subtitle={`Langkah ${poWizardStep} dari 5: ${PO_WIZARD_STEPS[poWizardStep - 1]}`}
      size="xl"
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-200">
        {/* Stepper Progress Bar */}
        <div className="pb-1">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-900 dark:text-white">
              {PO_WIZARD_STEPS[poWizardStep - 1]}
            </span>
            <span className="font-bold font-mono text-[#C81E1E]">
              {Math.round((poWizardStep / 5) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#C81E1E] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(poWizardStep / 5) * 100}%` }}
            />
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

        {/* Tombol Navigasi Wizard */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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
              Simpan Purchase Order
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
