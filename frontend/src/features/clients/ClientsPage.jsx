import { useCallback, useEffect, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import {
  EmptyState,
  ErrorState,
  LoadingState
} from '../../components/feedback/StateViews.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { extractErrorMessage } from '../../lib/utils/format.js';
import { ClientFilterBar } from './components/ClientFilterBar.jsx';
import { ClientTable } from './components/ClientTable.jsx';
import { ClientFormModal } from './components/ClientFormModal.jsx';
import { ClientDetailModal } from './components/ClientDetailModal.jsx';

export function ClientsPage() {
  const { user } = useAuth();
  const canEdit = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING'].includes(user?.role);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    npwp: '',
    industry: '',
    address: '',
    email: '',
    phone: '',
    isActive: true
  });
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);

  const [detailData, setDetailData] = useState(null);
  const [locForm, setLocForm] = useState({ name: '', address: '', city: '' });
  const [picForm, setPicForm] = useState({ name: '', position: '', phone: '', email: '' });
  const [subFeedback, setSubFeedback] = useState('');
  const [portalUrl, setPortalUrl] = useState('');
  const [portalCopied, setPortalCopied] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/clients', { params: { page, limit: 15, q } });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const openCreate = () => {
    setEditing(null);
    setFormData({
      name: '',
      npwp: '',
      industry: '',
      address: '',
      email: '',
      phone: '',
      isActive: true
    });
    setFormErr('');
    setFormOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setFormData({
      name: client.name || '',
      npwp: client.npwp || '',
      industry: client.industry || '',
      address: client.address || '',
      email: client.email || '',
      phone: client.phone || '',
      isActive: client.is_active
    });
    setFormErr('');
    setFormOpen(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!formData.name.trim()) {
      setFormErr('Nama perusahaan klien wajib diisi.');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await api.patch(`/clients/${editing.id}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      setFormOpen(false);
      loadClients();
    } catch (err) {
      setFormErr(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (clientId) => {
    try {
      setSubFeedback('');
      setPortalUrl('');
      setPortalCopied(false);
      const { data } = await api.get(`/clients/${clientId}`);
      setDetailData(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleGeneratePortalToken = async () => {
    if (!detailData?.client?.id) return;
    setPortalLoading(true);
    setSubFeedback('');
    try {
      const res = await api.post('/portal/tokens', {
        clientId: detailData.client.id,
        label: `Akses Portal - ${detailData.client.name}`,
        expiresInDays: 90
      });
      const fullUrl = `${window.location.origin}${res.data.portalUrl}`;
      setPortalUrl(fullUrl);
      setSubFeedback('Tautan portal klien berhasil digenerate.');
    } catch (err) {
      setSubFeedback(extractErrorMessage(err));
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCopyPortalUrl = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setPortalCopied(true);
    setTimeout(() => setPortalCopied(false), 2500);
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!detailData || !locForm.name.trim() || !locForm.address.trim()) return;
    try {
      await api.post(`/clients/${detailData.client.id}/locations`, locForm);
      setLocForm({ name: '', address: '', city: '' });
      setSubFeedback('Lokasi cabang/site berhasil ditambahkan.');
      openDetail(detailData.client.id);
      loadClients();
    } catch (err) {
      setSubFeedback(extractErrorMessage(err));
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!detailData || !picForm.name.trim()) return;
    try {
      await api.post(`/clients/${detailData.client.id}/contacts`, picForm);
      setPicForm({ name: '', position: '', phone: '', email: '' });
      setSubFeedback('Kontak PIC berhasil ditambahkan.');
      openDetail(detailData.client.id);
    } catch (err) {
      setSubFeedback(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manajemen Data Klien"
        subtitle="Database perusahaan pengguna jasa K3 beserta lokasi cabang dan kontak PIC"
        actions={
          canEdit && (
            <button
              type="button"
              onClick={openCreate}
              className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#991B1B] shadow-xs cursor-pointer"
            >
              <Plus size={16} weight="bold" aria-hidden="true" />
              <span>Tambah Klien Baru</span>
            </button>
          )
        }
      />

      <ClientFilterBar
        q={q}
        onSearchChange={(val) => {
          setPage(1);
          setQ(val);
        }}
      />

      {loading ? (
        <LoadingState message="Memuat daftar klien..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadClients} />
      ) : !items.length ? (
        <EmptyState
          title="Belum Ada Data Klien"
          description="Tambahkan data perusahaan klien untuk mulai mengelola lokasi, kontak PIC, dan objek uji K3."
        />
      ) : (
        <ClientTable
          items={items}
          total={total}
          page={page}
          onPageChange={setPage}
          canEdit={canEdit}
          onOpenDetail={openDetail}
          onOpenEdit={openEdit}
        />
      )}

      <ClientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        formData={formData}
        setFormData={setFormData}
        formErr={formErr}
        saving={saving}
        onSave={handleSaveClient}
      />

      <ClientDetailModal
        detailData={detailData}
        onClose={() => setDetailData(null)}
        canEdit={canEdit}
        subFeedback={subFeedback}
        portalUrl={portalUrl}
        portalCopied={portalCopied}
        portalLoading={portalLoading}
        onGeneratePortalToken={handleGeneratePortalToken}
        onCopyPortalUrl={handleCopyPortalUrl}
        locForm={locForm}
        setLocForm={setLocForm}
        onAddLocation={handleAddLocation}
        picForm={picForm}
        setPicForm={setPicForm}
        onAddContact={handleAddContact}
      />
    </div>
  );
}
