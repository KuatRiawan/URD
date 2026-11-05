import { ArrowLeft, ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
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
            <button
              type="button"
              onClick={() => {
                setError('');
                setPoWizardStep((prev) => prev - 1);
              }}
              className="h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              <ArrowLeft size={15} weight="bold" />
              <span>Kembali</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              Batal
            </button>
          )}

          {poWizardStep < 5 ? (
            <button
              type="button"
              onClick={handleWizardNext}
              className="h-10 inline-flex items-center gap-1.5 rounded-lg bg-[#C81E1E] px-4.5 text-xs font-bold text-white hover:bg-[#a11616] cursor-pointer shadow-2xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E]"
            >
              <span>Lanjut</span>
              <ArrowRight size={15} weight="bold" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleCreateOrder}
              className="h-10 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-5 text-xs font-bold text-white shadow-2xs disabled:opacity-50 cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <CheckCircle size={16} weight="bold" />
              <span>{submitting ? 'Menyimpan...' : 'Simpan Purchase Order'}</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
