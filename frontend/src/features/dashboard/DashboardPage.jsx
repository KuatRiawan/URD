import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { ErrorState, LoadingState } from '../../components/feedback/StateViews.jsx';
import { api } from '../../lib/api/axios.js';
import { extractErrorMessage } from '../../lib/utils/format.js';
import { InspectorDashboardView } from './components/InspectorDashboardView.jsx';
import { ManagementDashboardView } from './components/ManagementDashboardView.jsx';

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30D');

  // Inspector Field Dashboard Filters & Controls
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldTab, setFieldTab] = useState('TODAY'); // 'ALL' | 'CONFIRMATION' | 'TODAY' | 'PENDING' | 'UPCOMING' | 'COMPLETED'
  const [fieldViewMode, setFieldViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'
  const [displayMode, setDisplayMode] = useState('TABBED'); // 'TABBED' | 'STACKED'

  // Modal & state untuk konfirmasi terima / tolak / batal penugasan riksa uji
  const [rejectModalData, setRejectModalData] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadSummary = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const assignedUnits = useMemo(() => data?.assignedUnits || [], [data]);

  const handleRespondAssignment = async (orderId, assignmentId, decision, customReason = '') => {
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/orders/${orderId}/assignments/${assignmentId}/respond`, {
        decision,
        rejectReason: decision === 'DITOLAK' ? (customReason || rejectReason).trim() : undefined
      });
      setRejectModalData(null);
      setRejectReason('');
      await loadSummary(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Klasifikasi unit lapangan ke dalam area operasional utama
  const categorizedUnits = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const confirmationList = [];
    const todayList = [];
    const pendingList = [];
    const upcomingList = [];
    const completedList = [];

    assignedUnits.forEach((u) => {
      if (u.assignment_status === 'MENUNGGU') {
        confirmationList.push(u);
      }

      const isFinished = [
        'LHPP_FINAL',
        'LHPP_TERBIT',
        'BAP_FINAL',
        'SIAP_DISTRIBUSI',
        'SEBAGIAN_DOKUMEN_DIKIRIM',
        'SELESAI'
      ].includes(u.unit_status);

      if (isFinished) {
        completedList.push(u);
        return;
      }

      let scheduleDateStr = null;
      if (u.start_at) {
        const sDate = new Date(u.start_at);
        scheduleDateStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
      }

      const isInspectingNow = u.unit_status === 'SEDANG_DIPERIKSA';
      const isScheduledToday = scheduleDateStr === todayStr;

      if (isScheduledToday || isInspectingNow) {
        todayList.push(u);
        return;
      }

      const isFuture = scheduleDateStr && scheduleDateStr > todayStr;
      if (isFuture) {
        upcomingList.push(u);
        return;
      }

      pendingList.push(u);
    });

    return {
      confirmation: confirmationList,
      today: todayList,
      pending: pendingList,
      upcoming: upcomingList,
      completed: completedList
    };
  }, [assignedUnits]);

  // Filter pencarian pada unit yang ditugaskan
  const matchesSearch = useCallback(
    (u) => {
      if (!fieldSearch.trim()) return true;
      const q = fieldSearch.toLowerCase().trim();
      return (
        (u.object_name && String(u.object_name).toLowerCase().includes(q)) ||
        (u.serial_number && String(u.serial_number).toLowerCase().includes(q)) ||
        (u.client_name && String(u.client_name).toLowerCase().includes(q)) ||
        (u.po_number && String(u.po_number).toLowerCase().includes(q)) ||
        (u.order_no && String(u.order_no).toLowerCase().includes(q)) ||
        (u.location_name && String(u.location_name).toLowerCase().includes(q)) ||
        (u.location_address && String(u.location_address).toLowerCase().includes(q)) ||
        (u.category_code && String(u.category_code).toLowerCase().includes(q))
      );
    },
    [fieldSearch]
  );

  const filteredUnitsForTab = useMemo(() => {
    let list = [];
    if (fieldTab === 'CONFIRMATION') list = categorizedUnits.confirmation;
    else if (fieldTab === 'TODAY') list = categorizedUnits.today;
    else if (fieldTab === 'PENDING') list = categorizedUnits.pending;
    else if (fieldTab === 'UPCOMING') list = categorizedUnits.upcoming;
    else if (fieldTab === 'COMPLETED') list = categorizedUnits.completed;
    else list = assignedUnits;

    return list.filter(matchesSearch);
  }, [fieldTab, categorizedUnits, assignedUnits, matchesSearch]);

  if (loading) return <LoadingState message="Memuat ringkasan operasional PT Upaya Riksa Daya..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadSummary()} />;
  if (!data) return null;

  const isInspector = ['INSPECTOR', 'AHLI_K3'].includes(user?.role);

  if (isInspector) {
    return (
      <InspectorDashboardView
        refreshing={refreshing}
        loadSummary={loadSummary}
        categorizedUnits={categorizedUnits}
        assignedUnits={assignedUnits}
        fieldTab={fieldTab}
        setFieldTab={setFieldTab}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        fieldViewMode={fieldViewMode}
        setFieldViewMode={setFieldViewMode}
        fieldSearch={fieldSearch}
        setFieldSearch={setFieldSearch}
        filteredUnitsForTab={filteredUnitsForTab}
        matchesSearch={matchesSearch}
        onRespondAssignment={handleRespondAssignment}
        rejectModalData={rejectModalData}
        setRejectModalData={setRejectModalData}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        actionLoading={actionLoading}
      />
    );
  }

  return (
    <ManagementDashboardView
      user={user}
      data={data}
      loadSummary={loadSummary}
      refreshing={refreshing}
      period={period}
      setPeriod={setPeriod}
    />
  );
}
