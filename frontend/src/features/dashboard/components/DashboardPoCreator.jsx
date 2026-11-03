import { useEffect } from 'react';
import { CreatePoWizardModal } from '../../orders/components/CreatePoWizardModal.jsx';
import { CsvImportModal } from '../../orders/components/CsvImportModal.jsx';
import { useOrderManagement } from '../../orders/hooks/useOrderManagement.js';

export function DashboardPoCreator({ open, onClose }) {
  const orderManagement = useOrderManagement();
  const { setCreateOpen, setError, setPoWizardStep } = orderManagement;

  useEffect(() => {
    if (open) {
      setError('');
      setCreateOpen(true);
      setPoWizardStep(1);
    }
  }, [open, setCreateOpen, setError, setPoWizardStep]);

  return (
    <>
      <CreatePoWizardModal
        open={orderManagement.createOpen}
        onClose={() => {
          orderManagement.setCreateOpen(false);
          onClose();
        }}
        poWizardStep={orderManagement.poWizardStep}
        setPoWizardStep={orderManagement.setPoWizardStep}
        createForm={orderManagement.createForm}
        setCreateForm={orderManagement.setCreateForm}
        clientMode={orderManagement.clientMode}
        setClientMode={orderManagement.setClientMode}
        clients={orderManagement.clients}
        clientObjects={orderManagement.clientObjects}
        clientLocations={orderManagement.clientLocations}
        clientContacts={orderManagement.clientContacts}
        categories={orderManagement.categories}
        inspectors={orderManagement.inspectors}
        newUnitRow={orderManagement.newUnitRow}
        setNewUnitRow={orderManagement.setNewUnitRow}
        handleClientChange={orderManagement.handleClientChange}
        toggleObjectSelection={orderManagement.toggleObjectSelection}
        handleAddInlineUnit={orderManagement.handleAddInlineUnit}
        removeInlineUnit={orderManagement.removeInlineUnit}
        handleOpenCsvImport={orderManagement.handleOpenCsvImport}
        handleWizardNext={orderManagement.handleWizardNext}
        handleCreateOrder={orderManagement.handleCreateOrder}
        submitting={orderManagement.submitting}
        error={orderManagement.error}
        setError={orderManagement.setError}
      />
      <CsvImportModal
        open={orderManagement.csvModalOpen}
        onClose={() => orderManagement.setCsvModalOpen(false)}
        csvTargetOrderId={orderManagement.csvTargetOrderId}
        csvText={orderManagement.csvText}
        setCsvText={orderManagement.setCsvText}
        handleImportCsv={orderManagement.handleImportCsv}
        submitting={orderManagement.submitting}
      />
    </>
  );
}
