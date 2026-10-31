import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { FileCsv, Plus } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { api } from '../../lib/api/axios.js';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { useConfirm, useToast } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { ALLOWED_NEXT_STATUS } from './orderConstants.js';
import { OrderFilterBar } from './components/OrderFilterBar.jsx';
import { OrderTable } from './components/OrderTable.jsx';
import { CreatePoWizardModal } from './components/CreatePoWizardModal.jsx';
import { OrderDetailModal } from './components/OrderDetailModal.jsx';
import { CsvImportModal } from './components/CsvImportModal.jsx';
import { useOrderManagement } from './hooks/useOrderManagement.js';

export function OrdersPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const { user } = useAuth();
  const canManage = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING'].includes(user?.role);

  const {
    orders,
    clients,
    categories,
    inspectors,
    loading,
    error,
    setError,
    feedback,
    setFeedback,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    loadOrders,
    createOpen,
    setCreateOpen,
    poWizardStep,
    setPoWizardStep,
    clientMode,
    setClientMode,
    clientObjects,
    createForm,
    setCreateForm,
    newUnitRow,
    setNewUnitRow,
    submitting,
    handleClientChange,
    toggleObjectSelection,
    handleAddInlineUnit,
    removeInlineUnit,
    handleWizardNext,
    handleCreateOrder,
    detailData,
    detailOpen,
    setDetailOpen,
    openOrderDetail,
    scheduleConflicts,
    scheduleForm,
    setScheduleForm,
    selectedInspectorIds,
    setSelectedInspectorIds,
    statusNote,
    setStatusNote,
    rejectReason,
    setRejectReason,
    handleSaveSchedule,
    handleAssignInspectors,
    handleRespondAssignment,
    handleStatusChange,
    checkConflicts,
    csvModalOpen,
    setCsvModalOpen,
    csvText,
    setCsvText,
    csvTargetOrderId,
    handleOpenCsvImport,
    handleImportCsv,
    handleDownloadAssignmentPdf,
    handleDownloadBatchBapPdf,
    handleDownloadUnitPdf
  } = useOrderManagement({ user, confirm, toast });

  const [searchParams, setSearchParams] = useSearchParams();
  const paramOrderNo = searchParams.get('orderNo') || searchParams.get('orderId') || searchParams.get('q');
  const openedParamRef = useRef(null);
  const userClosedRef = useRef(false);

  // Otomatis deteksi parameter URL dari notifikasi untuk membuka detail PO secara instan
  useEffect(() => {
    if (!paramOrderNo) {
      userClosedRef.current = false;
      openedParamRef.current = null;
      return;
    }
    // Jika pengguna sudah sengaja menutup modal, jangan buka kembali secara otomatis
    if (userClosedRef.current) return;
    if (openedParamRef.current === paramOrderNo && detailOpen) return;

    setQ(paramOrderNo);

    // Cek apakah parameter berupa UUID orderId
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paramOrderNo);
    if (isUuid) {
      openedParamRef.current = paramOrderNo;
      openOrderDetail(paramOrderNo);
      return;
    }

    // Cari dari list lokal
    const matched = orders.find(
      (o) =>
        o.id === paramOrderNo ||
        o.order_no?.toLowerCase() === paramOrderNo.toLowerCase() ||
        o.po_number?.toLowerCase() === paramOrderNo.toLowerCase()
    );

    if (matched) {
      openedParamRef.current = paramOrderNo;
      openOrderDetail(matched.id);
      return;
    }

    // Jika belum ditemukan di list lokal, lakukan fetch langsung ke endpoint
    let isCurrent = true;
    api
      .get('/orders', { params: { q: paramOrderNo, limit: 1 } })
      .then((res) => {
        const found = res.data?.items?.[0];
        if (isCurrent && found && !userClosedRef.current) {
          openedParamRef.current = paramOrderNo;
          openOrderDetail(found.id);
        }
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [paramOrderNo, orders, detailOpen, openOrderDetail, setQ]);

  // Listener event global ketika notifikasi diklik saat pengguna sudah berada di halaman PO
  useEffect(() => {
    const handleCustomOpen = (e) => {
      const targetIdOrNo = e.detail?.identifier;
      if (!targetIdOrNo) return;
      userClosedRef.current = false;
      openedParamRef.current = null;
      setQ(targetIdOrNo);

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetIdOrNo);
      if (isUuid) {
        openOrderDetail(targetIdOrNo);
        return;
      }

      const local = orders.find(
        (o) =>
          o.order_no?.toLowerCase() === targetIdOrNo.toLowerCase() ||
          o.po_number?.toLowerCase() === targetIdOrNo.toLowerCase()
      );
      if (local) {
        openOrderDetail(local.id);
        return;
      }

      api
        .get('/orders', { params: { q: targetIdOrNo, limit: 1 } })
        .then((res) => {
          const found = res.data?.items?.[0];
          if (found) {
            openOrderDetail(found.id);
          }
        })
        .catch(() => {});
    };

    window.addEventListener('urd:open-order-detail', handleCustomOpen);
    return () => window.removeEventListener('urd:open-order-detail', handleCustomOpen);
  }, [orders, openOrderDetail, setQ]);

  // Realtime sinkronisasi berkala daftar order di latar belakang
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(true);
    }, 6000);

    const handleFocus = () => loadOrders(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadOrders]);

  const activeOrder = detailData?.order;
  const unitProgress = detailData?.unitProgress || activeOrder?.unitProgress || {
    totalUnits: 0,
    unscheduled: 0,
    scheduled: 0,
    inspecting: 0,
    waitingDocs: 0,
    completed: 0,
    canCompletePo: false
  };
  const nextStatuses = activeOrder ? ALLOWED_NEXT_STATUS[activeOrder.status] || [] : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="PO &amp; Order Pemeriksaan Riksa Uji K3"
        subtitle="Pengelolaan Purchase Order resmi, pendaftaran alat K3 multi-unit, alokasi Ahli K3, dan pemantauan progres berkas LHPP"
        actions={
          canManage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCsvImport(null)}
                className="min-h-11 inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                <FileCsv size={16} weight="bold" />
                <span>Impor Unit CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setCreateOpen(true);
                  setPoWizardStep(1);
                }}
                className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] cursor-pointer"
              >
                <Plus size={16} weight="bold" />
                <span>Buat PO / Order Baru</span>
              </button>
            </div>
          )
        }
      />

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={loadOrders} />}

      <OrderFilterBar
        q={q}
        setQ={setQ}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {loading ? (
        <LoadingState label="Memuat daftar PO &amp; order pemeriksaan..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Belum ada PO pemeriksaan"
          description="Purchase Order (PO) pemeriksaan riksa uji K3 yang terdaftar akan tampil di halaman ini."
        />
      ) : (
        <OrderTable
          orders={orders}
          openOrderDetail={(id) => {
            userClosedRef.current = false;
            openOrderDetail(id);
          }}
          handleDownloadAssignmentPdf={handleDownloadAssignmentPdf}
        />
      )}

      {/* Modal Buat PO & Order Multi-Unit (Guided 5-Step Wizard) */}
      <CreatePoWizardModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        poWizardStep={poWizardStep}
        setPoWizardStep={setPoWizardStep}
        createForm={createForm}
        setCreateForm={setCreateForm}
        clientMode={clientMode}
        setClientMode={setClientMode}
        clients={clients}
        clientObjects={clientObjects}
        categories={categories}
        inspectors={inspectors}
        newUnitRow={newUnitRow}
        setNewUnitRow={setNewUnitRow}
        handleClientChange={handleClientChange}
        toggleObjectSelection={toggleObjectSelection}
        handleAddInlineUnit={handleAddInlineUnit}
        removeInlineUnit={removeInlineUnit}
        handleOpenCsvImport={handleOpenCsvImport}
        handleWizardNext={handleWizardNext}
        handleCreateOrder={handleCreateOrder}
        submitting={submitting}
        error={error}
        setError={setError}
      />

      {/* Modal Detail & Pengelolaan PO */}
      <OrderDetailModal
        open={detailOpen}
        onClose={() => {
          userClosedRef.current = true;
          setDetailOpen(false);
          openedParamRef.current = null;
          if (searchParams.has('orderNo') || searchParams.has('orderId')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('orderNo');
            nextParams.delete('orderId');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        activeOrder={activeOrder}
        detailData={detailData}
        unitProgress={unitProgress}
        nextStatuses={nextStatuses}
        canManage={canManage}
        user={user}
        inspectors={inspectors}
        scheduleConflicts={scheduleConflicts}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        selectedInspectorIds={selectedInspectorIds}
        setSelectedInspectorIds={setSelectedInspectorIds}
        statusNote={statusNote}
        setStatusNote={setStatusNote}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        submitting={submitting}
        error={error}
        setError={setError}
        handleOpenCsvImport={handleOpenCsvImport}
        handleDownloadBatchBapPdf={handleDownloadBatchBapPdf}
        handleDownloadAssignmentPdf={handleDownloadAssignmentPdf}
        handleDownloadUnitPdf={handleDownloadUnitPdf}
        handleSaveSchedule={handleSaveSchedule}
        handleAssignInspectors={handleAssignInspectors}
        handleRespondAssignment={handleRespondAssignment}
        handleStatusChange={handleStatusChange}
        checkConflicts={checkConflicts}
      />

      {/* Modal Impor CSV Unit */}
      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        csvTargetOrderId={csvTargetOrderId}
        csvText={csvText}
        setCsvText={setCsvText}
        handleImportCsv={handleImportCsv}
        submitting={submitting}
      />
    </div>
  );
}
