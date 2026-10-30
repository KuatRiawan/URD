import { useCallback, useEffect, useState } from 'react';
import { MagnifyingGlass, Plus, ShareNetwork, Copy, Check } from '@phosphor-icons/react';
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
import { extractErrorMessage } from '../../lib/utils/format.js';

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
              className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#991B1B] shadow-xs"
            >
              <Plus size={16} weight="bold" aria-hidden="true" />
              <span>Tambah Klien Baru</span>
            </button>
          )
        }
      />

      {/* Pencarian */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Cari nama klien, bidang usaha, atau NPWP"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Cari nama perusahaan klien, bidang usaha, atau NPWP..."
            className="w-full min-h-11 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

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
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold">Nama Perusahaan</th>
                  <th className="py-3 px-4 font-bold">Bidang Usaha</th>
                  <th className="py-3 px-4 font-bold">NPWP</th>
                  <th className="py-3 px-4 font-bold">Lokasi / Alat</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{c.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {c.address || '-'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{c.industry || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-900 dark:text-slate-200">{c.npwp || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{c.location_count}</span> lokasi ·{' '}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{c.object_count}</span> objek
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={c.is_active ? 'SESUAI' : 'DIBATALKAN'}
                        label={c.is_active ? 'Aktif' : 'Nonaktif'}
                      />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openDetail(c.id)}
                        className="min-h-9 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Lokasi & PIC
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="min-h-9 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 font-semibold text-white hover:bg-neutral-800 dark:hover:bg-slate-600"
                        >
                          Ubah
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} limit={15} total={total} onPageChange={setPage} />
        </div>
      )}

      {/* Modal Tambah / Ubah Klien */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Ubah Data Klien: ${editing.name}` : 'Tambah Perusahaan Klien'}
      >
        <form onSubmit={handleSaveClient} className="space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
          {formErr && (
            <Notice tone="error">{formErr}</Notice>
          )}
          <div>
            <label htmlFor="client-name" className="block font-bold mb-1">
              Nama Perusahaan Klien *
            </label>
            <input
              id="client-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="client-npwp" className="block font-bold mb-1">
                NPWP
              </label>
              <input
                id="client-npwp"
                type="text"
                value={formData.npwp}
                onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="client-industry" className="block font-bold mb-1">
                Bidang Usaha
              </label>
              <input
                id="client-industry"
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label htmlFor="client-address" className="block font-bold mb-1">
              Alamat Kantor Utama
            </label>
            <textarea
              id="client-address"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="client-email" className="block font-bold mb-1">
                Email Perusahaan
              </label>
              <input
                id="client-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="client-phone" className="block font-bold mb-1">
                Telepon
              </label>
              <input
                id="client-phone"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          {editing && (
            <label className="flex items-center gap-2 font-semibold pt-1">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Status Klien Aktif</span>
            </label>
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
              {saving ? 'Menyimpan...' : 'Simpan Data Klien'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Lokasi & Kontak PIC (M1-02) */}
      <Modal
        open={Boolean(detailData)}
        onClose={() => setDetailData(null)}
        title={detailData ? `Detail Klien: ${detailData.client.name}` : 'Detail Klien'}
        maxWidth="max-w-3xl"
      >
        {detailData && (
          <div className="space-y-6 text-xs text-slate-800 dark:text-slate-200">
            {subFeedback && (
              <Notice tone="success">{subFeedback}</Notice>
            )}

            {/* Bagian Bagikan Portal Klien (Fitur 9) */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShareNetwork size={16} className="text-[#C81E1E]" weight="bold" />
                    <span>Portal Baca Khusus Klien (Read-Only)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Berikan tautan berproteksi token kepada klien untuk memantau status riksa uji dan mengunduh BAP/LHPP resmi tanpa perlu akun staf.
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleGeneratePortalToken}
                    disabled={portalLoading}
                    className="shrink-0 min-h-9 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 disabled:opacity-50"
                  >
                    {portalLoading ? 'Memproses...' : 'Buat Tautan Akses'}
                  </button>
                )}
              </div>

              {portalUrl && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    readOnly
                    value={portalUrl}
                    className="flex-1 min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 font-mono text-xs text-slate-700 dark:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPortalUrl}
                    className="min-h-9 inline-flex items-center gap-1 px-3 py-1 rounded bg-[#C81E1E] font-bold text-white hover:bg-red-800"
                  >
                    {portalCopied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                    <span>{portalCopied ? 'Tersalin' : 'Salin Tautan'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Lokasi / Cabang */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Daftar Lokasi / Cabang ({detailData.locations.length})
                </h3>
                <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-md">
                  {!detailData.locations.length ? (
                    <li className="p-3 text-slate-500 dark:text-slate-400">Belum ada lokasi terdaftar.</li>
                  ) : (
                    detailData.locations.map((loc) => (
                      <li key={loc.id} className="p-3">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {loc.name} {loc.city ? `(${loc.city})` : ''}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">{loc.address}</p>
                      </li>
                    ))
                  )}
                </ul>

                {canEdit && (
                  <form
                    onSubmit={handleAddLocation}
                    className="space-y-2 rounded-md bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-700"
                  >
                    <p className="font-bold text-slate-900 dark:text-white">Tambah Lokasi / Cabang</p>
                    <div>
                      <label htmlFor="loc-name" className="block font-semibold mb-1">
                        Nama Lokasi / Plant *
                      </label>
                      <input
                        id="loc-name"
                        type="text"
                        required
                        value={locForm.name}
                        onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                        className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="loc-addr" className="block font-semibold mb-1">
                        Alamat Lokasi *
                      </label>
                      <input
                        id="loc-addr"
                        type="text"
                        required
                        value={locForm.address}
                        onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
                        className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="loc-city" className="block font-semibold mb-1">
                        Kota / Kabupaten
                      </label>
                      <input
                        id="loc-city"
                        type="text"
                        value={locForm.city}
                        onChange={(e) => setLocForm({ ...locForm, city: e.target.value })}
                        className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      className="min-h-10 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600"
                    >
                      Simpan Lokasi
                    </button>
                  </form>
                )}
              </div>

              {/* Kontak PIC */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Daftar Kontak PIC ({detailData.contacts.length})
                </h3>
                <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-md">
                  {!detailData.contacts.length ? (
                    <li className="p-3 text-slate-500 dark:text-slate-400">Belum ada kontak PIC terdaftar.</li>
                  ) : (
                    detailData.contacts.map((ct) => (
                      <li key={ct.id} className="p-3">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {ct.name} {ct.position ? `· ${ct.position}` : ''}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                          {ct.phone || '-'} · {ct.email || '-'}
                        </p>
                      </li>
                    ))
                  )}
                </ul>

                {canEdit && (
                  <form
                    onSubmit={handleAddContact}
                    className="space-y-2 rounded-md bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-700"
                  >
                    <p className="font-bold text-slate-900 dark:text-white">Tambah Kontak PIC</p>
                    <div>
                      <label htmlFor="pic-name" className="block font-semibold mb-1">
                        Nama Lengkap *
                      </label>
                      <input
                        id="pic-name"
                        type="text"
                        required
                        value={picForm.name}
                        onChange={(e) => setPicForm({ ...picForm, name: e.target.value })}
                        className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="pic-pos" className="block font-semibold mb-1">
                          Jabatan
                        </label>
                        <input
                          id="pic-pos"
                          type="text"
                          value={picForm.position}
                          onChange={(e) => setPicForm({ ...picForm, position: e.target.value })}
                          className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label htmlFor="pic-phone" className="block font-semibold mb-1">
                          No. Telepon / WA
                        </label>
                        <input
                          id="pic-phone"
                          type="text"
                          value={picForm.phone}
                          onChange={(e) => setPicForm({ ...picForm, phone: e.target.value })}
                          className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="pic-email" className="block font-semibold mb-1">
                        Email
                      </label>
                      <input
                        id="pic-email"
                        type="email"
                        value={picForm.email}
                        onChange={(e) => setPicForm({ ...picForm, email: e.target.value })}
                        className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      className="min-h-10 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600"
                    >
                      Simpan Kontak
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

