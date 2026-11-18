import { useEffect, useState } from 'react';
import { Calendar, CheckCircle, FileText, Plus, Wrench, X } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { api } from '../../../lib/api/axios.js';

export function PrepareBapModal({
  open,
  onClose,
  onBapCreated,
  scopeCatalog = []
}) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedObjectId, setSelectedObjectId] = useState('');
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedScopes, setSelectedScopes] = useState([
    'Pemeriksaan Data & Gambar',
    'Pemeriksaan Visual',
    'Uji Fungsi'
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setSelectedOrderId('');
      setSelectedObjectId('');
      setError('');
      return;
    }
    const loadOrders = async () => {
      setLoadingOrders(true);
      setError('');
      try {
        const res = await api.get('/orders', { params: { limit: 100 } });
        setOrders(res.data.items || res.data.orders || []);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Gagal memuat daftar PO.');
      } finally {
        setLoadingOrders(false);
      }
    };
    loadOrders();
  }, [open]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const units = selectedOrder?.units || selectedOrder?.test_objects || [];

  const handleToggleScope = (scopeName) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeName)
        ? prev.filter((s) => s !== scopeName)
        : [...prev, scopeName]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setError('Pilih Purchase Order (PO) terlebih dahulu.');
      return;
    }
    if (!selectedObjectId) {
      setError('Pilih Unit Alat yang akan dibuatkan BAP.');
      return;
    }
    if (selectedScopes.length === 0) {
      setError('Pilih minimal 1 ruang lingkup pemeriksaan.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/bap/prepare', {
        orderId: selectedOrderId,
        objectId: selectedObjectId,
        inspectionDate,
        scopeItems: selectedScopes
      });
      const newBap = res.data.bap;
      onBapCreated(newBap);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Gagal menyiapkan Berita Acara (BAP).');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Siapkan Berita Acara Riksa Uji (BAP) Baru"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="secondary" size="md" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleSubmit}
            disabled={submitting || !selectedOrderId || !selectedObjectId}
            loading={submitting}
          >
            Buat Berita Acara (BAP)
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-blue-900 dark:text-blue-200">
          <strong>Prinsip 1 Unit = 1 BAP:</strong> Setiap unit alat riksa uji memiliki dokumen Berita Acara tersendiri. BAP dapat disiapkan dan ditandatangani kapan saja secara mandiri, termasuk sebelum pemeriksaan fisik dimulai.
        </div>

        {/* 1. Pilih PO */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            1. Pilih Purchase Order (PO) *
          </label>
          <select
            value={selectedOrderId}
            disabled={loadingOrders || submitting}
            onChange={(e) => {
              setSelectedOrderId(e.target.value);
              setSelectedObjectId('');
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          >
            <option value="">-- Pilih Nomor PO / Klien --</option>
            {orders.map((ord) => (
              <option key={ord.id} value={ord.id}>
                {ord.po_number || ord.order_no} · {ord.client_name || ord.client?.name || 'Klien'} ({ord.units?.length || ord.test_objects?.length || 0} unit)
              </option>
            ))}
          </select>
        </div>

        {/* 2. Pilih Unit Alat */}
        {selectedOrderId && (
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              2. Pilih Unit Alat Riksa Uji (1 BAP = 1 Unit) *
            </label>
            {units.length === 0 ? (
              <p className="text-slate-500 italic">Tidak ada unit alat terdaftar pada PO ini.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {units.map((u) => {
                  const isChecked = selectedObjectId === u.id;
                  return (
                    <label
                      key={u.id}
                      onClick={() => setSelectedObjectId(u.id)}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#C81E1E] bg-rose-50/70 dark:bg-rose-950/40 text-slate-900 dark:text-white shadow-2xs font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedUnit"
                        checked={isChecked}
                        onChange={() => setSelectedObjectId(u.id)}
                        className="mt-0.5 text-[#C81E1E] focus:ring-[#C81E1E]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs truncate">{u.name}</div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          SN: {u.serial_number || '-'} · {u.brand || u.model || ''}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Tanggal Pemeriksaan */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            3. Tanggal Pelaksanaan Riksa Uji
          </label>
          <input
            type="date"
            value={inspectionDate}
            onChange={(e) => setInspectionDate(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>

        {/* 4. Ruang Lingkup */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            4. Ruang Lingkup Pemeriksaan &amp; Pengujian (BAP)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
            {scopeCatalog.map((scope) => {
              const active = selectedScopes.includes(scope);
              return (
                <label
                  key={scope}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    active
                      ? 'bg-rose-50/70 dark:bg-rose-950/40 border-[#C81E1E] font-semibold text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => handleToggleScope(scope)}
                    className="rounded text-[#C81E1E] focus:ring-[#C81E1E]"
                  />
                  <span>{scope}</span>
                </label>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}

