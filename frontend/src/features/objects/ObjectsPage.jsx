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
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/FeedbackProvider.jsx';
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
  const toast = useToast();
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
    equipmentTypeId: '',
    equipmentSubtypeId: '',
    inspectionTypeCode: 'BERKALA',
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
      const msg = 'Klien, nama alat/objek, dan nomor seri wajib diisi.';
      setFormErr(msg);
      toast(msg, 'error');
      return;
    }
    try {
      setSaving(true);
      await api.post('/objects', {
        ...formData,
        categoryId: Number(formData.categoryId),
        manufactureYear: formData.manufactureYear ? Number(formData.manufactureYear) : null
      });
      toast(`Unit alat ${formData.name} berhasil didaftarkan.`, 'success');
      setFormOpen(false);
      loadObjects();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setFormErr(msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCsvImport = async (e) => {
    e.preventDefault();
    setCsvFeedback('');
    if (!csvClientId) {
      const msg = 'Pilih perusahaan klien terlebih dahulu.';
      setCsvFeedback(msg);
      toast(msg, 'error');
      return;
    }
    try {
      const res = await api.post('/objects/import-csv', {
        clientId: csvClientId,
        csvText
      });
      const msg = `Berhasil mengimpor ${res.data.imported} objek uji K3.`;
      setCsvFeedback(msg);
      toast(msg, 'success');
      setCsvOpen(false);
      loadObjects();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setCsvFeedback(msg);
      toast(msg, 'error');
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
              <Button
                type="button"
                variant="secondary"
                size="md"
                icon={UploadSimple}
                onClick={() => setCsvOpen(true)}
              >
                Impor CSV
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={Plus}
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
              >
                Tambah Objek Uji
              </Button>
            </div>
          )
        }
      />

      {/* Ringkasan Populasi Objek Uji K3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Total Populasi Alat
          </p>
          <p className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums mt-1">
            {total || items.length}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Unit alat &amp; pesawat terdaftar</p>
        </div>
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Bidang Regulasi K3
          </p>
          <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 tabular-nums mt-1">
            {categories.length || 5}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Kategori Permenaker aktif</p>
        </div>
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Unit Ditampilkan Aktif
          </p>
          <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {activeObjCount}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Siap dijadwalkan riksa uji</p>
        </div>
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Mitra Perusahaan
          </p>
          <p className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums mt-1">
            {clients.length}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Klien pemilik objek uji</p>
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
