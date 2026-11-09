import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { useToast } from '../../components/ui/FeedbackProvider.jsx';
import {
  EmptyState,
  ErrorState,
  LoadingState
} from '../../components/feedback/StateViews.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { api } from '../../lib/api/axios.js';
import { extractErrorMessage } from '../../lib/utils/format.js';
import { ClientFilterBar } from './components/ClientFilterBar.jsx';
import { ClientTable } from './components/ClientTable.jsx';
import { ClientFormModal } from './components/ClientFormModal.jsx';
import { ClientDetailModal } from './components/ClientDetailModal.jsx';

export function ClientsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
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
    internalNotes: '',
    isActive: true
  });
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);

  const [detailData, setDetailData] = useState(null);
  const [portalTokens, setPortalTokens] = useState([]);
  const [locForm, setLocForm] = useState({ name: '', address: '', city: '' });
  const [picForm, setPicForm] = useState({ name: '', position: '', phone: '', email: '' });
  const [subFeedback, setSubFeedback] = useState('');

  useEffect(() => {
    if (subFeedback) {
      const isErr = /gagal|error|tidak|invalid/i.test(subFeedback);
      toast(subFeedback, isErr ? 'error' : 'success');
      setSubFeedback('');
    }
  }, [subFeedback, toast]);
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
      internalNotes: '',
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
      internalNotes: client.internal_notes || '',
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
      const [{ data }, tokenRes] = await Promise.all([
        api.get(`/clients/${clientId}`),
        api.get(`/portal/tokens/client/${clientId}`).catch(() => ({ data: { items: [] } }))
      ]);
      setDetailData(data);
      setPortalTokens(tokenRes.data?.items || []);
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

  const handleUpdateContact = async (contactId, form) => {
    if (!detailData?.client?.id || !contactId) return;
    try {
      await api.patch(`/clients/${detailData.client.id}/contacts/${contactId}`, form);
      setSubFeedback('Kontak PIC berhasil diperbarui.');
      openDetail(detailData.client.id);
    } catch (err) {
      setSubFeedback(extractErrorMessage(err));
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!detailData?.client?.id || !contactId) return;
    try {
      await api.delete(`/clients/${detailData.client.id}/contacts/${contactId}`);
      setSubFeedback('Kontak PIC berhasil dinonaktifkan.');
      openDetail(detailData.client.id);
    } catch (err) {
      setSubFeedback(extractErrorMessage(err));
    }
  };

  const handleSetPrimaryContact = async (contactId) => {
    if (!detailData?.client?.id || !contactId) return;
    try {
      await api.patch(`/clients/${detailData.client.id}/contacts/${contactId}`, { isPrimary: true });
      setSubFeedback('PIC Utama berhasil diperbarui.');
      openDetail(detailData.client.id);
    } catch (err) {
      setSubFeedback(extractErrorMessage(err));
    }
  };

  const handleSetReminderRecipientContact = async (contactId) => {
    if (!detailData?.client?.id || !contactId) return;
    try {
      await api.patch(`/clients/${detailData.client.id}/contacts/${contactId}`, { isReminderRecipient: true });
      setSubFeedback('Penerima Reminder K3 berhasil diperbarui.');
      openDetail(detailData.client.id);
    } catch (err) {
      setSubFeedback(extractErrorMessage(err));
    }
  };

  const handleCreateRenewalOrder = async (objectId, _objectName) => {
    if (!detailData?.client?.id || !objectId) return;
    try {
      const res = await api.post(`/reminders/units/${objectId}/create-renewal-order`);
      const order = res.data?.order || res.data;
      setSubFeedback(`Draft PO Perpanjangan berhasil dibuat: ${order.po_number || order.order_no || ''}`);
      setDetailData(null);
      navigate('/app/orders');
    } catch (err) {
      setSubFeedback(extractErrorMessage(err));
    }
  };

  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(user?.role);
  const activeClientsCount = items.filter((c) => c.is_active !== false).length;
  const totalClientObjects = items.reduce((acc, c) => acc + Number(c.object_count || 0), 0);
  const totalClientOrders = items.reduce((acc, c) => acc + Number(c.order_count || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={isPimpinan ? 'Monitoring Portofolio Klien' : 'Data Klien & PIC'}
        subtitle={
          isPimpinan
            ? 'Direktori mitra perusahaan, sebaran lokasi site, dan kepatuhan K3.'
            : 'Direktori perusahaan klien, lokasi site, dan kontak PIC.'
        }
        actions={
          canEdit && (
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={Plus}
              onClick={openCreate}
            >
              Tambah Klien
            </Button>
          )
        }
      />

      {/* Ringkasan Portofolio Mitra Klien */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Total Mitra Klien
          </p>
          <p className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums mt-1">
            {total || items.length}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Perusahaan terdaftar</p>
        </div>
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Klien Berstatus Aktif
          </p>
          <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {activeClientsCount}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Pada halaman saat ini</p>
        </div>
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Populasi Alat Klien
          </p>
          <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 tabular-nums mt-1">
            {totalClientObjects}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Unit alat dimiliki klien</p>
        </div>
        <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Volume Order PO
          </p>
          <p className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums mt-1">
            {totalClientOrders}
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">Akumulasi PO riksa uji</p>
        </div>
      </div>

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
        portalTokens={portalTokens}
        onClose={() => setDetailData(null)}
        canEdit={canEdit}
        onOpenEdit={openEdit}
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
        onUpdateContact={handleUpdateContact}
        onDeleteContact={handleDeleteContact}
        onSetPrimaryContact={handleSetPrimaryContact}
        onSetReminderRecipientContact={handleSetReminderRecipientContact}
        onCreateRenewalOrder={handleCreateRenewalOrder}
      />
    </div>
  );
}
