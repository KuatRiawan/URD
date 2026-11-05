import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Certificate,
  Plus,
  ShieldCheck,
  Users
} from '@phosphor-icons/react';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
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
  const confirm = useConfirm();
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
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
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
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, loadUsers]);

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
        role: 'MARKETING',
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
    setError('');
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
      title: u.isActive ? 'Nonaktifkan Akun Pengguna' : 'Aktifkan Akun Pengguna',
      message: u.isActive
        ? `Akun ${u.fullName} tidak akan dapat masuk ke sistem setelah dinonaktifkan. Seluruh sesi aktif akan dihentikan.`
        : `Akun ${u.fullName} akan dapat kembali masuk ke sistem dengan peran ${u.role}.`,
      confirmLabel: u.isActive ? 'Ya, Nonaktifkan Akun' : 'Ya, Aktifkan Akun',
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Manajemen Pengguna & Hak Akses (RBAC)"
        subtitle="Kelola akun personel, verifikasi kompetensi SKP Ahli K3, dan pantau matriks wewenang operasional PJK3."
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

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={loadUsers} />}

      {/* Navigasi Tab Manajemen Pengguna */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto scrollbar-none pb-px">
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-[#C81E1E] text-[#C81E1E] dark:border-rose-500 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Users size={16} weight={activeTab === 'users' ? 'bold' : 'regular'} />
          <span>Daftar Akun Pengguna</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('rbac_matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rbac_matrix'
              ? 'border-[#C81E1E] text-[#C81E1E] dark:border-rose-500 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck size={16} weight={activeTab === 'rbac_matrix' ? 'bold' : 'regular'} />
          <span>Matriks Peran & Hak Akses (RBAC)</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('competencies')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'competencies'
              ? 'border-[#C81E1E] text-[#C81E1E] dark:border-rose-500 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
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
          ) : users.length === 0 ? (
            <EmptyState
              title="Tidak ada pengguna ditemukan"
              description="Belum ada akun yang sesuai dengan kriteria pencarian atau filter yang dipilih."
            />
          ) : (
            <UserTable
              users={users}
              onEditUser={openEditUser}
              onToggleActive={handleToggleActive}
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
        onClose={() => { setCreateOpen(false); setError(''); }}
        createForm={createForm}
        setCreateForm={setCreateForm}
        submitting={submitting}
        onSubmit={handleCreateUser}
        error={createOpen ? error : ''}
      />

      <EditUserModal
        editUser={editUser}
        onClose={() => { setEditUser(null); setError(''); }}
        editForm={editForm}
        setEditForm={setEditForm}
        submitting={submitting}
        onSubmit={handleUpdateUser}
        error={editUser ? error : ''}
      />

      <UserDetailDrawer
        user={viewUser}
        open={Boolean(viewUser)}
        onClose={() => setViewUser(null)}
        onEdit={(u) => {
          setViewUser(null);
          openEditUser(u);
        }}
      />
    </div>
  );
}
