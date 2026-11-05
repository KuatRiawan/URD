import { useState } from 'react';
import { Eye, EyeSlash, ShieldCheck, User } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';
import { ROLE_LABELS, ROLE_OPTIONS } from '../../../lib/utils/format.js';

export function EditUserModal({
  editUser,
  onClose,
  editForm,
  setEditForm,
  submitting,
  onSubmit,
  error
}) {
  const [showPassword, setShowPassword] = useState(false);

  const roleOptions = ROLE_OPTIONS.some(({ value }) => value === editForm.role)
    ? ROLE_OPTIONS
    : [...ROLE_OPTIONS, { value: editForm.role, label: `${ROLE_LABELS[editForm.role] || editForm.role} (historis)` }];

  const roleDescriptions = {
    ADMIN_SISTEM: 'Memiliki kewenangan penuh administrasi sistem, manajemen pengguna, template dokumen, dan cadangan database.',
    ADMIN_KANTOR: 'Bertanggung jawab atas penjadwalan Ahli K3, QC teknis berkas LHPP, registrasi Suket K3 Disnaker, dan serah terima BAST.',
    AHLI_K3: 'Petugas berwenang pengujian lapangan: pemeriksaan fisik, pengisian checklist K3, perekaman foto bukti, dan penandatanganan digital BAP.',
    INSPECTOR: 'Petugas inspeksi lapangan (ekuivalen Ahli K3) untuk pelaksanaan riksa uji dan pengisian form teknis.',
    PIMPINAN: 'Akses pengawasan eksekutif terhadap SLA pengerjaan, beban kerja Ahli K3, laporan riksa uji, dan log audit operasional.',
    MARKETING: 'Mengelola hubungan klien (CRM), pencatatan pesanan PO, registrasi unit baru, dan memantau perpanjangan masa berlaku Suket.'
  };

  return (
    <Modal
      open={Boolean(editUser)}
      onClose={onClose}
      title={editUser ? `Perbarui Akun: ${editUser.fullName}` : 'Perbarui Akun Pengguna'}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        {error && <Notice tone="error">{error}</Notice>}

        {/* Seksi 1: Data Identitas & Kontak */}
        <div className="space-y-3">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <User size={14} />
            <span>Identitas Personal & Kontak</span>
          </h4>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap & Gelar *
            </label>
            <input
              type="text"
              required
              value={editForm.fullName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-medium focus:border-[#C81E1E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Email (Akun Tetap)
              </label>
              <input
                type="text"
                disabled
                value={editUser?.email || ''}
                className="w-full min-h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="081234567890"
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-[#C81E1E] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Seksi 2: Peran RBAC & Status Keaktifan */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <ShieldCheck size={14} />
            <span>Peran RBAC & Status Keaktifan</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Peran Sistem (RBAC) *
              </label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:border-[#C81E1E] focus:outline-none"
              >
                {roleOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Keaktifan Akun *
              </label>
              <select
                value={editForm.isActive ? 'true' : 'false'}
                onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:border-[#C81E1E] focus:outline-none"
              >
                <option value="true">Aktif (Dapat Masuk Sistem)</option>
                <option value="false">Nonaktif (Akses Masuk Diblokir)</option>
              </select>
            </div>
          </div>

          <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
            <strong className="text-slate-800 dark:text-slate-200">Kewenangan Peran:</strong> {roleDescriptions[editForm.role] || 'Hak akses sesuai konfigurasi sistem.'}
          </div>

          {['INSPECTOR', 'AHLI_K3'].includes(editForm.role) && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Induk Pegawai (NIP) / KTA Ahli K3
              </label>
              <input
                type="text"
                value={editForm.employeeNo || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, employeeNo: e.target.value }))}
                placeholder="Contoh: URD-AK3-009"
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-[#C81E1E] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Seksi 3: Reset Kata Sandi Baru */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Reset Kata Sandi Baru (Kosongkan bila tidak ingin mengubah sandi)
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              value={editForm.password}
              onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Masukkan sandi baru jika ingin reset..."
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 pr-10 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-[#C81E1E] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <span className="text-[10px] text-slate-400 block">
            Bila diisi, sandi lama akan diganti dan pengguna dapat langsung masuk dengan sandi baru ini.
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {submitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
