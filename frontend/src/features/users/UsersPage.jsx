import { useCallback, useEffect, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { UserFilterBar } from './components/UserFilterBar.jsx';
import { UserTable } from './components/UserTable.jsx';
import { CreateUserModal } from './components/CreateUserModal.jsx';
import { EditUserModal } from './components/EditUserModal.jsx';

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
            className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] cursor-pointer"
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

      <UserFilterBar
        q={q}
        setQ={setQ}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
      />

      {loading ? (
        <LoadingState label="Memuat daftar pengguna internal..." />
      ) : users.length === 0 ? (
        <EmptyState
          title="Tidak ada pengguna ditemukan"
          description="Belum ada akun yang sesuai dengan kriteria pencarian."
        />
      ) : (
        <UserTable
          users={users}
          onEditUser={openEditUser}
          onToggleActive={handleToggleActive}
        />
      )}

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        createForm={createForm}
        setCreateForm={setCreateForm}
        submitting={submitting}
        onSubmit={handleCreateUser}
      />

      <EditUserModal
        editUser={editUser}
        onClose={() => setEditUser(null)}
        editForm={editForm}
        setEditForm={setEditForm}
        submitting={submitting}
        onSubmit={handleUpdateUser}
      />
    </div>
  );
}
