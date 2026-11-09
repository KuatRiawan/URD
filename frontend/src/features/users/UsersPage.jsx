import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Certificate,
  Plus,
  ShieldCheck,
  Users
} from '@phosphor-icons/react';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { useConfirm, useToast } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { api } from '../../lib/api/axios.js';
import { UserFilterBar } from './components/UserFilterBar.jsx';
import { UserTable } from './components/UserTable.jsx';
import { CreateUserModal } from './components/CreateUserModal.jsx';
import { EditUserModal } from './components/EditUserModal.jsx';
import { RbacMatrixTab } from './components/RbacMatrixTab.jsx';
import { InspectorCompetencyTab } from './components/InspectorCompetencyTab.jsx';
import { UserDetailDrawer } from './components/UserDetailDrawer.jsx';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = (searchParams.get('tab') || 'users').toLowerCase();
  const activeTab =
    rawTab === 'competency' || rawTab === 'competencies'
      ? 'competencies'
      : rawTab === 'rbac_matrix' || rawTab === 'rbac'
        ? 'rbac_matrix'
        : 'users';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals & Drawers
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    role: 'MARKETING',
    phone: '',
    employeeNo: '',
    password: ''
  });

  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    role: 'MARKETING',
    phone: '',
    employeeNo: '',
    isActive: true,
    password: ''
  });

  const [viewUser, setViewUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setTab = (tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.get('/users', {
        params: { q: q || undefined, role: roleFilter || undefined, limit: 50 }
      });
      setUsers(res.data?.items || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Gagal memuat daftar akun pengguna internal.');
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, loadUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', createForm);
      setCreateOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        role: 'MARKETING',
        phone: '',
        employeeNo: '',
        password: ''
      });
      toast('Akun pengguna baru berhasil ditambahkan.', 'success');
      await loadUsers();
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menambahkan akun pengguna.', 'error');
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
      employeeNo: u.employeeNo || '',
      isActive: u.isActive,
      password: ''
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    if (editForm.role !== editUser.role) {
      const ok = await confirm({
        title: 'Konfirmasi Perubahan Peran RBAC',
        message: `Anda akan mengubah peran akun ${editUser.fullName} dari ${editUser.role} menjadi ${editForm.role}. Hak akses menu dan otorisasi API akan disesuaikan secara otomatis. Lanjutkan?`,
        confirmLabel: 'Ya, Ubah Peran RBAC',
        tone: 'default'
      });
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: editForm.fullName,
        role: editForm.role,
        phone: editForm.phone,
        isActive: editForm.isActive
      };
      if (['INSPECTOR', 'AHLI_K3'].includes(editForm.role) || editForm.employeeNo !== undefined) {
        payload.employeeNo = editForm.employeeNo;
      }
      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }
      await api.patch(`/users/${editUser.id}`, payload);
      setEditUser(null);
      toast(`Data pengguna ${editForm.fullName} berhasil diperbarui.`, 'success');
      await loadUsers();
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal memperbarui akun pengguna.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u) => {
    if (u.id === currentUser?.id) {
      toast('Anda tidak dapat menonaktifkan akun Anda sendiri.', 'error');
      return;
    }
    const ok = await confirm({
      title: u.isActive ? 'Nonaktifkan Akun Pengguna' : 'Aktifkan Akun Pengguna',
      message: u.isActive
        ? `Akun ${u.fullName} tidak akan dapat masuk ke sistem setelah dinonaktifkan. Seluruh sesi aktif akan dihentikan.`
        : `Akun ${u.fullName} akan dapat kembali masuk ke sistem dengan peran ${u.role}.`,
      confirmLabel: u.isActive ? 'Ya, Nonaktifkan Akun' : 'Ya, Aktifkan Akun',
      tone: u.isActive ? 'danger' : 'default'
    });
    if (!ok) return;
    try {
      await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
      toast(
        `Status akun ${u.fullName} berhasil diubah menjadi ${!u.isActive ? 'Aktif' : 'Nonaktif'}.`,
        'success'
      );
      setViewUser((prev) => (prev && prev.id === u.id ? { ...prev, isActive: !prev.isActive } : prev));
      await loadUsers();
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal mengubah status keaktifan akun.', 'error');
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.id === currentUser?.id) {
      toast('Anda tidak dapat menghapus akun Anda sendiri.', 'error');
      return;
    }
    const ok = await confirm({
      title: 'Hapus Akun Pengguna',
      message: `Apakah Anda yakin ingin menghapus akun ${u.fullName} (${u.email}) secara permanen? Data yang telah dihapus tidak dapat dipulihkan.`,
      confirmLabel: 'Ya, Hapus Akun',
      tone: 'danger'
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/users/${u.id}`);
      setViewUser(null);
      toast(res.data?.message || `Akun ${u.fullName} berhasil dihapus permanen.`, 'success');
      await loadUsers();
    } catch (err) {
      toast(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Gagal menghapus akun pengguna.',
        'error'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Manajemen Pengguna & Hak Akses (RBAC)"
        subtitle="Kelola akun pengguna, penugasan peran RBAC, dan verifikasi SKP Ahli K3."
        actions={
          activeTab === 'users' ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setCreateOpen(true)}
            >
              Tambah Pengguna Baru
            </Button>
          ) : null
        }
      />

      {/* Navigasi Tab Manajemen Pengguna */}
      <div className="flex items-center gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl w-full max-w-2xl overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[9px] transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
          }`}
        >
          <Users size={16} weight={activeTab === 'users' ? 'bold' : 'regular'} />
          <span>Daftar Akun Pengguna</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('rbac_matrix')}
          className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[9px] transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rbac_matrix'
              ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
          }`}
        >
          <ShieldCheck size={16} weight={activeTab === 'rbac_matrix' ? 'bold' : 'regular'} />
          <span>Matriks Peran & Hak Akses (RBAC)</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('competencies')}
          className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[9px] transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'competencies'
              ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
          }`}
        >
          <Certificate size={16} weight={activeTab === 'competencies' ? 'bold' : 'regular'} />
          <span>Kredensial Ahli K3 & SKP</span>
        </button>
      </div>

      {/* Tab 1: Akun Pengguna Internal */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <UserFilterBar
            q={q}
            setQ={setQ}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
          />

          {loading ? (
            <LoadingState label="Memuat daftar pengguna internal..." />
          ) : loadError ? (
            <ErrorBanner message={loadError} onRetry={loadUsers} />
          ) : users.length === 0 ? (
            <EmptyState
              title="Tidak ada pengguna ditemukan"
              description="Belum ada akun yang sesuai dengan kriteria pencarian atau filter yang dipilih."
            />
          ) : (
            <UserTable
              users={users}
              onViewUser={(u) => setViewUser(u)}
            />
          )}
        </div>
      )}

      {/* Tab 2: Matriks Peran & Akses RBAC */}
      {activeTab === 'rbac_matrix' && <RbacMatrixTab />}

      {/* Tab 3: Rekam Kompetensi & SKP */}
      {activeTab === 'competencies' && <InspectorCompetencyTab />}

      {/* Modals & Drawers */}
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

      <UserDetailDrawer
        user={viewUser}
        open={Boolean(viewUser)}
        onClose={() => setViewUser(null)}
        onEdit={(u) => {
          setViewUser(null);
          openEditUser(u);
        }}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteUser}
        isCurrentUser={viewUser?.id === currentUser?.id}
      />
    </div>
  );
}
