import React, { useCallback, useEffect, useState } from 'react';
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Pengujian Klien"
        subtitle="Arsip riksa uji unit alat, BAP, LHPP, dan masa berlaku."
      />

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
