import { useCallback, useEffect, useState } from 'react';
import { Plus, UploadSimple } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import {
  EmptyState,
  ErrorState,
  LoadingState
} from '../../components/feedback/StateViews.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { extractErrorMessage } from '../../lib/utils/format.js';
import { ObjectFilterBar } from './components/ObjectFilterBar.jsx';
import { ObjectTable } from './components/ObjectTable.jsx';
import { CreateObjectModal } from './components/CreateObjectModal.jsx';
import { ObjectDetailModal } from './components/ObjectDetailModal.jsx';
import { ObjectCsvModal } from './components/ObjectCsvModal.jsx';
import { ObjectQrModal } from './components/ObjectQrModal.jsx';

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
    if (!file || !detailData?.object?.id) return;
    try {
      setUploadingFile(true);
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/objects/${detailData.object.id}/attachments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      openDetail(detailData.object.id);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Objek Uji K3"
        subtitle="Registri alat, pesawat, instalasi, dan riwayat pemeriksaan K3 PT Upaya Riksa Daya."
        actions={
          canEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCsvOpen(true)}
                className="min-h-11 inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
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
                className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#991B1B] shadow-xs cursor-pointer"
              >
                <Plus size={16} weight="bold" aria-hidden="true" />
                <span>Tambah Objek Uji</span>
              </button>
            </div>
          )
        }
      />

      <ObjectFilterBar
        q={q}
        setQ={setQ}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        clientId={clientId}
        setClientId={setClientId}
        categories={categories}
        clients={clients}
        onResetPage={() => setPage(1)}
      />

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
        <ObjectTable
          items={items}
          page={page}
          total={total}
          setPage={setPage}
          openQr={openQr}
          openDetail={openDetail}
        />
      )}

      <CreateObjectModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        handleSaveObject={handleSaveObject}
        formData={formData}
        setFormData={setFormData}
        formErr={formErr}
        saving={saving}
        clients={clients}
        categories={categories}
        selectedCatMeta={selectedCatMeta}
      />

      <ObjectCsvModal
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        handleCsvImport={handleCsvImport}
        csvClientId={csvClientId}
        setCsvClientId={setCsvClientId}
        csvText={csvText}
        setCsvText={setCsvText}
        csvFeedback={csvFeedback}
        clients={clients}
      />

      <ObjectDetailModal
        detailData={detailData}
        onClose={() => setDetailData(null)}
        canEdit={canEdit}
        uploadingFile={uploadingFile}
        handleUploadAttachment={handleUploadAttachment}
      />

      <ObjectQrModal qrModal={qrModal} onClose={() => setQrModal(null)} />
    </div>
  );
}
