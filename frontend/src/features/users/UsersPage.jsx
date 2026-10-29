import { useCallback, useEffect, useState } from 'react';
import {
  MagnifyingGlass,
  PencilSimple,
  Plus,
  UserCheck,
  UserMinus
} from '@phosphor-icons/react';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { formatDateTime, ROLE_LABELS } from '../../lib/utils/format.js';

export function UsersPage() {
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    role: 'ADMIN_KANTOR',
    phone: '',
    employeeNo: '',
    password: ''
  });
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    role: 'ADMIN_KANTOR',
    phone: '',
    isActive: true,
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users', {
        params: { q: q || undefined, role: roleFilter || undefined, limit: 50 }
      });
      setUsers(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar akun pengguna internal.');
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/users', createForm);
      setCreateOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        role: 'ADMIN_KANTOR',
        phone: '',
        employeeNo: '',
        password: ''
      });
      setFeedback('Akun pengguna internal baru berhasil ditambahkan.');
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan akun pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditUser = (u) => {
    setEditUser(u);
    setEditForm({
      fullName: u.fullName,
      role: u.role,
      phone: u.phone || '',
      isActive: u.isActive,
      password: ''
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        fullName: editForm.fullName,
        role: editForm.role,
        phone: editForm.phone,
        isActive: editForm.isActive
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }
      await api.patch(`/users/${editUser.id}`, payload);
      setEditUser(null);
      setFeedback(`Data pengguna ${editForm.fullName} berhasil diperbarui.`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui akun pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u) => {
    const ok = await confirm({
      title: u.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun',
      message: u.isActive
        ? `Akun ${u.fullName} tidak akan dapat masuk ke sistem setelah dinonaktifkan.`
        : `Akun ${u.fullName} akan dapat kembali masuk ke sistem.`,
      confirmLabel: u.isActive ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
      tone: u.isActive ? 'danger' : 'default'
    });
    if (!ok) return;
    setError('');
    try {
      await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
      setFeedback(
        `Status akun ${u.fullName} berhasil diubah menjadi ${!u.isActive ? 'Aktif' : 'Nonaktif'}.`
      );
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah status keaktifan akun.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna Internal (RBAC)"
        subtitle="Kelola akun personel PT Upaya Riksa Daya, hak akses berbasis peran (Admin Sistem, Admin Kantor, Ahli K3, Pimpinan), dan status keaktifan."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616]"
          >
            <Plus size={16} weight="bold" />
            <span>Tambah Pengguna Baru</span>
          </button>
        }
      />

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={loadUsers} />}

      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama lengkap atau alamat email personel..."
            className="w-full min-h-11 pl-10 pr-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-[#C81E1E] focus:outline-none"
          />
        </div>
        <select
          aria-label="Filter Peran Pengguna"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="min-h-11 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
        >
          <option value="">Semua Peran RBAC</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState label="Memuat daftar pengguna internal..." />
      ) : users.length === 0 ? (
        <EmptyState
          title="Tidak ada pengguna ditemukan"
          description="Belum ada akun yang sesuai dengan kriteria pencarian."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Nama Lengkap & Email</th>
                  <th className="py-3 px-4">Peran Sistem</th>
                  <th className="py-3 px-4">Telepon</th>
                  <th className="py-3 px-4">Login Terakhir</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{u.fullName}</div>
                      <div className="font-mono text-slate-500 dark:text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {ROLE_LABELS[u.role] || u.role}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">{u.phone || '-'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Belum pernah login'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge tone={u.isActive ? 'success' : 'danger'}>
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditUser(u)}
                          className="min-h-9 inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <PencilSimple size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          className={`min-h-9 inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-bold text-white ${
                            u.isActive ? 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500' : 'bg-emerald-700 hover:bg-emerald-800'
                          }`}
                        >
                          {u.isActive ? <UserMinus size={14} /> : <UserCheck size={14} />}
                          <span>{u.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah Pengguna */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tambah Akun Pengguna Internal"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={createForm.fullName}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Email Perusahaan *
            </label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="nama@upayariksadaya.com"
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Peran RBAC *</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">No. Telepon</label>
              <input
                type="text"
                value={createForm.phone}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          {createForm.role === 'AHLI_K3' && (
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nomor Induk Pegawai (NIP) Ahli K3
              </label>
              <input
                type="text"
                value={createForm.employeeNo}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, employeeNo: e.target.value }))
                }
                placeholder="Contoh: URD-AK3-009"
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Kata Sandi Awal (Min. 8 Karakter) *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={createForm.password}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616]"
            >
              {submitting ? 'Menyimpan...' : 'Buat Akun'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Pengguna */}
      <Modal
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        title={editUser ? `Perbarui Pengguna: ${editUser.fullName}` : 'Perbarui Pengguna'}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={editForm.fullName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Peran RBAC *</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">No. Telepon</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Reset Kata Sandi Baru (Kosongkan jika tidak diubah)
            </label>
            <input
              type="password"
              minLength={8}
              value={editForm.password}
              onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditUser(null)}
              className="min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616]"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
