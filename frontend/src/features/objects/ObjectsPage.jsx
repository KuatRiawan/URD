import { useCallback, useEffect, useState } from 'react';
import { MagnifyingGlass, Plus, QrCode, UploadSimple } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationBar
} from '../../components/feedback/StateViews.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { api } from '../../lib/api/axios.js';
import {
  CONCLUSION_LABELS,
  extractErrorMessage,
  formatDate,
  LHPP_STATUS_LABELS
} from '../../lib/utils/format.js';

export function ObjectsPage() {
  const { user } = useAuth();
  const canEdit = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING'].includes(user?.role);

  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    categoryId: 1,
    name: '',
    brand: '',
    model: '',
    serialNumber: '',
    manufactureYear: '',
    capacity: '',
    installLocation: '',
    previousPermitNo: '',
    attributes: {}
  });
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);

  const [csvOpen, setCsvOpen] = useState(false);
  const [csvClientId, setCsvClientId] = useState('');
  const [csvText, setCsvText] = useState(
    'kategori,nama,merek,tipe,nomor_seri,tahun,kapasitas,lokasi\nPAA,Overhead Crane 5T,Demag,ZKKE-5T,DMG-2024-101,2024,5 Ton,Workshop A'
  );
  const [csvFeedback, setCsvFeedback] = useState('');

  const [detailData, setDetailData] = useState(null);
  const [qrModal, setQrModal] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const loadObjects = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [catRes, objRes, cliRes] = await Promise.all([
        api.get('/objects/categories'),
        api.get('/objects', {
          params: { page, limit: 15, q, categoryId: categoryId || undefined, clientId: clientId || undefined }
        }),
        api.get('/clients', { params: { limit: 100 } })
      ]);
      setCategories(catRes.data?.categories || []);
      setItems(objRes.data?.items || []);
      setTotal(objRes.data?.total || 0);
      setClients(cliRes.data?.items || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, q, categoryId, clientId]);

  useEffect(() => {
    loadObjects();
  }, [loadObjects]);

  const selectedCatMeta = categories.find((c) => Number(c.id) === Number(formData.categoryId));

  const handleSaveObject = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!formData.clientId || !formData.name.trim() || !formData.serialNumber.trim()) {
      setFormErr('Klien, nama alat/objek, dan nomor seri wajib diisi.');
      return;
    }
    try {
      setSaving(true);
      await api.post('/objects', {
        ...formData,
        categoryId: Number(formData.categoryId),
        manufactureYear: formData.manufactureYear ? Number(formData.manufactureYear) : null
      });
      setFormOpen(false);
      loadObjects();
    } catch (err) {
      setFormErr(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCsvImport = async (e) => {
    e.preventDefault();
    setCsvFeedback('');
    if (!csvClientId) {
      setCsvFeedback('Pilih perusahaan klien terlebih dahulu.');
      return;
    }
    try {
      const res = await api.post('/objects/import-csv', {
        clientId: csvClientId,
        csvText
      });
      setCsvFeedback(`Berhasil mengimpor ${res.data.imported} objek uji.`);
      loadObjects();
    } catch (err) {
      setCsvFeedback(extractErrorMessage(err));
    }
  };

  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/objects/${id}`);
      setDetailData(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const openQr = async (id) => {
    try {
      const { data } = await api.get(`/objects/${id}/qr`);
      setQrModal(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleUploadAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !detailData) return;
    try {
      setUploadingFile(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('caption', file.name);
      await api.post(`/objects/${detailData.object.id}/attachments`, fd);
      openDetail(detailData.object.id);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Database Objek Uji K3 (Alat & Instalasi)"
        subtitle="Inventarisasi terpusat peralatan K3 beserta riwayat pemeriksaan, Suket aktif, dan pencegahan nomor seri ganda"
        actions={
          canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCsvClientId(clients[0]?.id || '');
                  setCsvFeedback('');
                  setCsvOpen(true);
                }}
                className="min-h-11 inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <UploadSimple size={16} weight="bold" aria-hidden="true" />
                <span>Impor CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    clientId: clients[0]?.id || '',
                    categoryId: categories[0]?.id || 1,
                    name: '',
                    brand: '',
                    model: '',
                    serialNumber: '',
                    manufactureYear: '',
                    capacity: '',
                    installLocation: '',
                    previousPermitNo: '',
                    attributes: {}
                  });
                  setFormErr('');
                  setFormOpen(true);
                }}
                className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#991B1B] shadow-xs"
              >
                <Plus size={16} weight="bold" aria-hidden="true" />
                <span>Tambah Objek Uji</span>
              </button>
            </div>
          )
        }
      />

      {/* Filter & Pencarian */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Cari nama objek, merek, atau nomor seri"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Cari nama alat, merek, atau nomor seri..."
            className="w-full min-h-10 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        <div>
          <select
            aria-label="Filter kategori objek K3"
            value={categoryId}
            onChange={(e) => {
              setPage(1);
              setCategoryId(e.target.value);
            }}
            className="w-full min-h-10 rounded border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="">Semua Kategori Objek K3</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                [{cat.code}] {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            aria-label="Filter perusahaan klien"
            value={clientId}
            onChange={(e) => {
              setPage(1);
              setClientId(e.target.value);
            }}
            className="w-full min-h-10 rounded border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="">Semua Perusahaan Klien</option>
            {clients.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Memuat daftar objek uji K3..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadObjects} />
      ) : !items.length ? (
        <EmptyState
          title="Belum Ada Objek Uji K3"
          description="Tambahkan objek uji secara manual atau gunakan fitur Impor CSV."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold">Kategori</th>
                  <th className="py-3 px-4 font-bold">Nama Objek &amp; Merek</th>
                  <th className="py-3 px-4 font-bold">Nomor Seri</th>
                  <th className="py-3 px-4 font-bold">Klien &amp; Lokasi</th>
                  <th className="py-3 px-4 font-bold">Suket K3 Aktif</th>
                  <th className="py-3 px-4 font-bold text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((obj) => (
                  <tr key={obj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {obj.category_code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{obj.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {obj.brand || '-'} {obj.model ? `· ${obj.model}` : ''}{' '}
                        {obj.capacity ? `· Kapasitas: ${obj.capacity}` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {obj.serial_number}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{obj.client_name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {obj.install_location || obj.location_name || '-'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      {obj.active_suket_no ? (
                        <div>
                          <p className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                            {obj.active_suket_no}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            s/d {formatDate(obj.active_suket_valid_until)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Belum ada</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openQr(obj.id)}
                        aria-label={`Tampilkan QR Code ${obj.name}`}
                        className="min-h-9 px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-1 font-semibold"
                      >
                        <QrCode size={15} aria-hidden="true" />
                        <span>QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openDetail(obj.id)}
                        className="min-h-9 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 text-white font-semibold hover:bg-neutral-800 dark:hover:bg-slate-600"
                      >
                        Riwayat &amp; Berkas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} limit={15} total={total} onPageChange={setPage} />
        </div>
      )}

      {/* Modal Tambah Objek Uji */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Tambah Objek Uji K3 Baru"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveObject} className="space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
          {formErr && (
            <Notice tone="error">{formErr}</Notice>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="obj-client" className="block font-bold mb-1">
                Perusahaan Klien *
              </label>
              <select
                id="obj-client"
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Pilih Klien --</option>
                {clients.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="obj-cat" className="block font-bold mb-1">
                Kategori Objek K3 *
              </label>
              <select
                id="obj-cat"
                required
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: Number(e.target.value), attributes: {} })
                }
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    [{cat.code}] {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="obj-name" className="block font-bold mb-1">
                Nama Alat / Objek Uji *
              </label>
              <input
                id="obj-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Overhead Travelling Crane 10 Ton"
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="obj-sn" className="block font-bold mb-1">
                Nomor Seri (Unik per Klien) *
              </label>
              <input
                id="obj-sn"
                type="text"
                required
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="obj-brand" className="block font-bold mb-1">
                Merek / Pabrikan
              </label>
              <input
                id="obj-brand"
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="obj-model" className="block font-bold mb-1">
                Tipe / Model
              </label>
              <input
                id="obj-model"
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="obj-year" className="block font-bold mb-1">
                Tahun Pembuatan
              </label>
              <input
                id="obj-year"
                type="number"
                min="1950"
                max="2100"
                value={formData.manufactureYear}
                onChange={(e) => setFormData({ ...formData, manufactureYear: e.target.value })}
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="obj-cap" className="block font-bold mb-1">
                Kapasitas
              </label>
              <input
                id="obj-cap"
                type="text"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Contoh: 10 Ton / 1250 kVA"
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="obj-loc" className="block font-bold mb-1">
                Lokasi Pemasangan
              </label>
              <input
                id="obj-loc"
                type="text"
                value={formData.installLocation}
                onChange={(e) => setFormData({ ...formData, installLocation: e.target.value })}
                placeholder="Contoh: Hall Produksi Bay B"
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="obj-prev" className="block font-bold mb-1">
                No. Suket Sebelumnya
              </label>
              <input
                id="obj-prev"
                type="text"
                value={formData.previousPermitNo}
                onChange={(e) => setFormData({ ...formData, previousPermitNo: e.target.value })}
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* M1-05: Atribut khusus per jenis objek */}
          {selectedCatMeta?.attribute_schema?.length > 0 && (
            <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-2">
              <p className="font-bold text-slate-900 dark:text-white">
                Atribut Teknis Khusus ({selectedCatMeta.name})
              </p>
              {selectedCatMeta.attribute_schema.map((attr) => (
                <div key={attr.key}>
                  <label htmlFor={`attr-${attr.key}`} className="block font-semibold mb-1">
                    {attr.label} ({attr.unit})
                  </label>
                  <input
                    id={`attr-${attr.key}`}
                    type="text"
                    value={formData.attributes[attr.key] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attributes: { ...formData.attributes, [attr.key]: e.target.value }
                      })
                    }
                    className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="min-h-11 px-4 py-2 rounded border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 px-4 py-2 rounded bg-[#C81E1E] font-bold text-white hover:bg-[#991B1B]"
            >
              {saving ? 'Menyimpan...' : 'Simpan Objek Uji'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Impor CSV */}
      <Modal
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        title="Impor Data Objek Uji Massal (CSV)"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCsvImport} className="space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
          {csvFeedback && (
            <div className="rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 font-semibold text-slate-900 dark:text-slate-100">
              {csvFeedback}
            </div>
          )}
          <div>
            <label htmlFor="csv-client" className="block font-bold mb-1">
              Pilih Perusahaan Klien *
            </label>
            <select
              id="csv-client"
              required
              value={csvClientId}
              onChange={(e) => setCsvClientId(e.target.value)}
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Pilih Klien --</option>
              {clients.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="csv-content" className="block font-bold mb-1">
              Data CSV (Header: kategori,nama,merek,tipe,nomor_seri,tahun,kapasitas,lokasi)
            </label>
            <textarea
              id="csv-content"
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setCsvOpen(false)}
              className="min-h-11 px-4 py-2 rounded border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="min-h-11 px-4 py-2 rounded bg-[#C81E1E] font-bold text-white hover:bg-[#991B1B]"
            >
              Validasi &amp; Impor Baris
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Garis Waktu Riwayat Pemeriksaan & Lampiran (M1-06 & M1-10) */}
      <Modal
        open={Boolean(detailData)}
        onClose={() => setDetailData(null)}
        title={
          detailData
            ? `[${detailData.object.category_code}] ${detailData.object.name} (S/N: ${detailData.object.serial_number})`
            : 'Detail Objek Uji'
        }
        maxWidth="max-w-3xl"
      >
        {detailData && (
          <div className="space-y-5 text-xs text-slate-800 dark:text-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-md bg-slate-50 dark:bg-slate-800/40 p-3.5 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Perusahaan Klien</p>
                <p className="font-bold text-slate-900 dark:text-white">{detailData.object.client_name}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Merek / Tipe</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {detailData.object.brand || '-'} / {detailData.object.model || '-'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Kapasitas / Tahun</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {detailData.object.capacity || '-'} ({detailData.object.manufacture_year || '-'})
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Suket Sebelumnya</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white">
                  {detailData.object.previous_permit_no || '-'}
                </p>
              </div>
            </div>

            {/* Garis Waktu Riwayat Pemeriksaan */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                Garis Waktu Riwayat Pemeriksaan ({detailData.history.length})
              </h3>
              {!detailData.history.length ? (
                <p className="text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 p-4">
                  Objek ini belum memiliki riwayat pemeriksaan tercatat.
                </p>
              ) : (
                <ol className="space-y-2.5 border-l-2 border-[#C81E1E] pl-4 ml-2">
                  {detailData.history.map((h) => (
                    <li
                      key={h.inspection_id}
                      className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Order {h.order_no} · {formatDate(h.inspected_at)}
                        </span>
                        <StatusBadge
                          status={h.conclusion || h.inspection_status}
                          label={CONCLUSION_LABELS[h.conclusion] || h.inspection_status}
                        />
                      </div>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Ahli K3 Pemeriksa: <strong className="text-slate-900 dark:text-white">{h.inspector_name}</strong>
                      </p>
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                        Nomor LHPP:{' '}
                        <strong className="font-mono text-slate-900 dark:text-white">{h.lhpp_no || 'Draf'}</strong> (
                        {LHPP_STATUS_LABELS[h.lhpp_status] || 'Belum diajukan'}) · Suket K3:{' '}
                        <strong className="font-mono text-slate-900 dark:text-white">{h.suket_no || '-'}</strong>
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Lampiran Dokumen Objek */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Lampiran Dokumen Teknis ({detailData.attachments.length})
                </h3>
                {canEdit && (
                  <label
                    htmlFor="obj-file-upload"
                    className="min-h-9 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 text-white font-semibold inline-flex items-center gap-1.5 hover:bg-neutral-800 dark:hover:bg-slate-600"
                  >
                    <UploadSimple size={14} aria-hidden="true" />
                    <span>{uploadingFile ? 'Mengunggah...' : 'Unggah Berkas (PDF/Gambar)'}</span>
                    <input
                      id="obj-file-upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleUploadAttachment}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
              {!detailData.attachments.length ? (
                <p className="text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 p-3">
                  Belum ada manual teknis atau dokumen lampiran.
                </p>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded">
                  {detailData.attachments.map((att) => (
                    <li key={att.id} className="p-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-900 dark:text-white">{att.original_name}</span>
                      <a
                        href={`/api/v1/dashboard/files/${att.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-[#C81E1E] hover:underline"
                      >
                        Buka / Unduh
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal QR Code Objek (M1-11) */}
      <Modal
        open={Boolean(qrModal)}
        onClose={() => setQrModal(null)}
        title="Kode QR Identitas Objek K3"
        maxWidth="max-w-sm"
      >
        {qrModal && (
          <div className="text-center space-y-3 text-xs text-slate-800 dark:text-slate-200">
            <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 dark:border-slate-700 mx-auto shadow-sm">
              <img
                src={qrModal.qrDataUrl}
                alt={`QR Code ${qrModal.object.name}`}
                width="200"
                height="200"
                className="mx-auto"
              />
            </div>
            <p className="font-bold text-sm text-slate-900 dark:text-white">{qrModal.object.name}</p>
            <p className="font-mono text-slate-500 dark:text-slate-400">S/N: {qrModal.object.serial_number}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pindai menggunakan perangkat staf yang telah masuk untuk membuka riwayat pemeriksaan alat ini.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

