import { useState } from 'react';
import { Eye, EyeSlash, ShieldCheck, User } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';
import { ROLE_OPTIONS, ROLE_LABELS } from '../../../lib/utils/format.js';

export function CreateUserModal({
  open,
  onClose,
  createForm,
  setCreateForm,
  submitting,
  onSubmit,
  error
}) {
  const [showPassword, setShowPassword] = useState(false);

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
      open={open}
      onClose={onClose}
      title="Tambah Akun Pengguna Internal (RBAC)"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        {error && <Notice tone="error">{error}</Notice>}

        {/* Seksi 1: Data Identitas & Kontak */}
        <div className="space-y-3">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <User size={14} />
            <span>Identitas Personal & Kontak Kantor</span>
          </h4>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap & Gelar *
            </label>
            <input
              type="text"
              required
              value={createForm.fullName}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Contoh: Ir. Budi Santoso, ST, MT"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-medium focus:border-[#C81E1E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Email Perusahaan *
              </label>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="nama@upayariksadaya.com"
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-[#C81E1E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={createForm.phone}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="081234567890"
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-[#C81E1E] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Seksi 2: Peran RBAC & Otorisasi */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <ShieldCheck size={14} />
            <span>Penugasan Peran RBAC & Otorisasi Operasional</span>
          </h4>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Peran Sistem *
            </label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:border-[#C81E1E] focus:outline-none"
            >
              {ROLE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label} ({value})
                </option>
              ))}
            </select>
            <div className="mt-1.5 p-2 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
              <strong className="text-slate-800 dark:text-slate-200">Kewenangan:</strong> {roleDescriptions[createForm.role] || 'Hak akses sesuai konfigurasi sistem.'}
            </div>
          </div>

          {['INSPECTOR', 'AHLI_K3'].includes(createForm.role) && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Induk Pegawai (NIP) / KTA Ahli K3
              </label>
              <input
                type="text"
                value={createForm.employeeNo}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, employeeNo: e.target.value }))
                }
                placeholder="Contoh: URD-AK3-009"
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-[#C81E1E] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Seksi 3: Kata Sandi Awal */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Kata Sandi Awal (Minimal 8 Karakter) *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={createForm.password}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••••••"
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
            Pengguna dapat memperbarui kata sandi mandiri melalui Pengaturan Akun setelah masuk pertama kali.
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
                <span>Menyimpan Akun...</span>
              </>
            ) : 'Buat Akun Pengguna'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
