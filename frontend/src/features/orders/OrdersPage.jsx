import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { FileCsv, Plus } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { api } from '../../lib/api/axios.js';
import { useToast } from '../../components/ui/FeedbackProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ALLOWED_NEXT_STATUS } from './orderConstants.js';
import { OrderFilterBar } from './components/OrderFilterBar.jsx';
import { OrderTable } from './components/OrderTable.jsx';
import { CreatePoWizardModal } from './components/CreatePoWizardModal.jsx';
import { OrderDetailModal } from './components/OrderDetailModal.jsx';
import { CsvImportModal } from './components/CsvImportModal.jsx';
import { useOrderManagement } from './hooks/useOrderManagement.js';

export function OrdersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(user?.role);
  const canCreatePo = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING'].includes(user?.role);
  const canManageSchedule = ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);
  const canManageStatus = ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);
  const canManage = canCreatePo;

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
    clientLocations,
    clientContacts,
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
    handleDownloadBastPdf,
    handleDownloadUnitPdf,
    handleUpdateOrder,
    handleAddUnitsToOrder,
    handleUploadPoAttachment,
    handleUpdateOrderUnit,
    page,
    setPage,
    limit,
    total
  } = useOrderManagement();

  const [searchParams, setSearchParams] = useSearchParams();
  const paramOrderNo = searchParams.get('orderNo') || searchParams.get('orderId') || searchParams.get('q');
  const openedParamRef = useRef(null);
  const userClosedRef = useRef(false);

  useEffect(() => {
    if (feedback) {
      toast(feedback, 'success');
      setFeedback('');
    }
  }, [feedback, toast, setFeedback]);

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

  const waitingScheduleCount = orders.filter((o) => ['ORDER_BARU', 'TERDAFTAR'].includes(o.status)).length;
  const inProgressPoCount = orders.filter((o) =>
    ['TERJADWAL', 'DITUGASKAN', 'SEDANG_DIPERIKSA', 'MENUNGGU_LAPORAN', 'MENUNGGU_DOKUMEN'].includes(o.status)
  ).length;
  const completedPoCount = orders.filter((o) => o.status === 'SELESAI').length;
  const totalUnitsOnPage = orders.reduce((acc, o) => acc + Number(o.object_count || o.unitProgress?.totalUnits || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isPimpinan ? "Monitoring PO & Order Pemeriksaan" : "PO & Order Pemeriksaan"}
        subtitle={isPimpinan ? "Pemantauan komprehensif progres riksa uji unit alat, status PO, dan sertifikasi klien." : "Pendaftaran dan monitoring Purchase Order riksa uji K3."}
        actions={
          canManage && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="md"
                icon={FileCsv}
                onClick={() => handleOpenCsvImport(null)}
                className="flex-1 sm:flex-initial"
              >
                Impor CSV
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => {
                  setError('');
                  setCreateOpen(true);
                  setPoWizardStep(1);
                }}
                className="flex-1 sm:flex-initial"
              >
                Buat PO Baru
              </Button>
            </div>
          )
        }
      />

      {/* Ringkasan Operasional PO & Unit */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { key: '', label: 'Total PO Terdaftar', value: total || orders.length, sub: `${totalUnitsOnPage} unit alat tercatat`, tone: 'slate' },
          { key: 'ORDER_BARU', label: 'PO Baru / Siap Jadwal', value: waitingScheduleCount, sub: 'Menunggu penjadwalan', tone: 'amber' },
          { key: 'SEDANG_DIPERIKSA', label: 'PO Sedang Berjalan', value: inProgressPoCount, sub: 'Lapangan & proses dokumen', tone: 'blue' },
          { key: 'SELESAI', label: 'PO Selesai', value: completedPoCount, sub: 'Seluruh unit tuntas', tone: 'emerald' }
        ].map((card) => {
          const isSelected = statusFilter === card.key;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => {
                setPage(1);
                setStatusFilter(card.key);
              }}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#C81E1E] bg-[#C81E1E]/[0.04] dark:bg-rose-950/20 shadow-[0_2px_10px_rgba(200,30,30,0.08)]'
                  : 'border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.15]'
              }`}
            >
              <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
                {card.label}
              </p>
              <p
                className={`text-2xl font-bold tracking-tight tabular-nums mt-1 ${
                  card.tone === 'amber' && card.value > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : card.tone === 'emerald' && card.value > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : card.tone === 'blue' && card.value > 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-[#1D1D1F] dark:text-[#F5F5F7]'
                }`}
              >
                {card.value}
              </p>
              <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">{card.sub}</p>
            </button>
          );
        })}
      </div>

      <OrderFilterBar
        q={q}
        setQ={setQ}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {loading ? (
        <LoadingState label="Memuat daftar PO &amp; order pemeriksaan..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadOrders} />
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
          handleDownloadBastPdf={handleDownloadBastPdf}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          user={user}
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
        clientLocations={clientLocations}
        clientContacts={clientContacts}
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
        user={user}
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
        canManageSchedule={canManageSchedule}
        canManageStatus={canManageStatus}
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
        handleDownloadBastPdf={handleDownloadBastPdf}
        handleDownloadUnitPdf={handleDownloadUnitPdf}
        handleSaveSchedule={handleSaveSchedule}
        handleAssignInspectors={handleAssignInspectors}
        handleRespondAssignment={handleRespondAssignment}
        handleStatusChange={handleStatusChange}
        checkConflicts={checkConflicts}
        handleUpdateOrder={handleUpdateOrder}
        handleAddUnitsToOrder={handleAddUnitsToOrder}
        handleUploadPoAttachment={handleUploadPoAttachment}
        handleUpdateOrderUnit={handleUpdateOrderUnit}
        categories={categories}
        clients={clients}
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
