import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { LoadingState, ErrorState, EmptyState, PaginationBar } from '../../components/feedback/StateViews.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { HistoryFilterBar } from './components/HistoryFilterBar.jsx';
import { HistoryTable } from './components/HistoryTable.jsx';
import { HistoryDetailModal } from './components/HistoryDetailModal.jsx';

export function HistoryPage() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (search.trim()) params.q = search.trim();
      if (clientFilter) params.clientId = clientFilter;
      if (categoryFilter) params.categoryId = categoryFilter;

      const [histRes, cliRes, catRes] = await Promise.all([
        api.get('/objects/history/all', { params }),
        api.get('/clients?limit=100'),
        api.get('/objects/categories')
      ]);
      setItems(histRes.data.items || []);
      setTotal(histRes.data.total || 0);
      setClients(cliRes.data.items || []);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Gagal memuat riwayat pengujian unit K3.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, clientFilter, categoryFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFilterChange = (setter) => (val) => {
    setPage(1);
    setter(val);
  };

  const downloadPdf = async (endpoint, filename) => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // Abaikan jika gagal unduh
    }
  };

  const { user } = useAuth();
  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(user?.role);

  const passedCount = items.filter((i) => i.conclusion === 'MEMENUHI_SYARAT').length;
  const withLhppCount = items.filter((i) => Boolean(i.lhpp_no || i.bap_no)).length;
  const withSuketCount = items.filter((i) => Boolean(i.suket_no)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isPimpinan ? 'Monitoring Riwayat Pengujian K3' : 'Riwayat Pengujian Klien'}
        subtitle={
          isPimpinan
            ? 'Arsip pengawasan riksa uji unit alat K3, riwayat dokumen BAP, LHPP, dan siklus masa berlaku.'
            : 'Arsip riksa uji unit alat, BAP, LHPP, dan masa berlaku.'
        }
      />

      {/* Ringkasan Riwayat Pengujian */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Total Arsip Pengujian
          </p>
          <p className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums mt-1">
            {total || items.length}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Rekam jejak pemeriksaan unit</p>
        </div>
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Memenuhi Syarat K3
          </p>
          <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {passedCount}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Unit laik operasi pada halaman ini</p>
        </div>
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Dokumen BAP / LHPP
          </p>
          <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 tabular-nums mt-1">
            {withLhppCount}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Memiliki berkas uji resmi</p>
        </div>
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Suket K3 Terbit
          </p>
          <p className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums mt-1">
            {withSuketCount}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Tersertifikasi Disnaker</p>
        </div>
      </div>

      <HistoryFilterBar
        search={search}
        setSearch={handleFilterChange(setSearch)}
        clientFilter={clientFilter}
        setClientFilter={handleFilterChange(setClientFilter)}
        categoryFilter={categoryFilter}
        setCategoryFilter={handleFilterChange(setCategoryFilter)}
        clients={clients}
        categories={categories}
        onSearchSubmit={() => {
          setPage(1);
          fetchHistory();
        }}
      />

      {loading ? (
        <LoadingState message="Memuat riwayat pengujian unit K3..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchHistory} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum Ada Riwayat Pengujian"
          description="Riwayat pengujian unit akan tercatat secara otomatis setiap kali pemeriksaan dilaksanakan pada suatu PO."
        />
      ) : (
        <div className="space-y-4">
          <HistoryTable
            items={items}
            downloadPdf={downloadPdf}
            onSelectRecord={setSelectedRecord}
          />
          <PaginationBar
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
          />
        </div>
      )}

      <HistoryDetailModal
        selectedRecord={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
