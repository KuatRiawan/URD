import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
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
  const navigate = useNavigate();
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

  const handleCreateRenewalOrder = async (objectId, _objectName) => {
    if (!objectId) return;
    try {
      setLoading(true);
      await api.post(`/reminders/units/${objectId}/create-renewal-order`);
      navigate('/app/orders');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(user?.role);
  const activeObjCount = items.filter((item) => item.is_active !== false).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isPimpinan ? 'Basis Data Objek Uji K3' : 'Basis Objek Uji K3'}
        subtitle={
          isPimpinan
            ? 'Pengawasan populasi alat uji teknik, status operasional, dan riwayat sertifikasi keselamatan kerja.'
            : 'Registri alat, pesawat, dan instalasi riksa uji K3.'
        }
        actions={
          canEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCsvOpen(true)}
                className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <UploadSimple size={15} weight="bold" aria-hidden="true" />
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
                className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#C81E1E] px-3.5 text-xs font-bold text-white hover:bg-[#a11616] shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E]"
              >
                <Plus size={15} weight="bold" aria-hidden="true" />
                <span>Tambah Objek Uji</span>
              </button>
            </div>
          )
        }
      />

      {/* Ringkasan Populasi Objek Uji K3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Populasi Alat
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            {total || items.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Unit alat &amp; pesawat terdaftar</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Bidang Regulasi K3
          </p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums mt-1">
            {categories.length || 5}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Kategori Permenaker aktif</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Unit Ditampilkan Aktif
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {activeObjCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Siap dijadwalkan riksa uji</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Mitra Perusahaan
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            {clients.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Klien pemilik objek uji</p>
        </div>
      </div>

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
          canCreateRenewal={canEdit}
          onCreateRenewal={handleCreateRenewalOrder}
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
        onCreateRenewal={handleCreateRenewalOrder}
      />

      <ObjectQrModal qrModal={qrModal} onClose={() => setQrModal(null)} />
    </div>
  );
}
