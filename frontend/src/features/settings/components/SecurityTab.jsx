import { useState } from 'react';
import { ShieldCheck, Key, Eye, EyeSlash } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';

export function SecurityTab({
  passwordForm,
  setPasswordForm,
  passwordLoading,
  passwordSuccess,
  passwordError,
  onChangePassword
}) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Ganti Kata Sandi</CardTitle>
          <CardDescription>
            Pastikan akun terlindungi dengan kombinasi kata sandi kuat minimal 8 karakter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordSuccess && (
            <div className="mb-4">
              <Notice variant="success">{passwordSuccess}</Notice>
            </div>
          )}
          {passwordError && (
            <div className="mb-4">
              <Notice variant="error">{passwordError}</Notice>
            </div>
          )}

          <form onSubmit={onChangePassword} className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Masukkan kata sandi lama Anda"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Minimal 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Ulangi kata sandi baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button type="submit" variant="primary" loading={passwordLoading}>
                Perbarui Kata Sandi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Standar Keamanan Sesi */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle>Keamanan Sesi &amp; Kriptografi</CardTitle>
          <CardDescription>Standar proteksi akun PT Upaya Riksa Daya</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" weight="fill" />
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-300">Rotasi Token JWT Otomatis</p>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                Sesi dilindungi oleh token ganda dengan deteksi penggunaan ulang (*token replay detection*) dan tersimpan pada *cookie HttpOnly*.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <Key size={18} className="text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-200">Enkripsi Kata Sandi Bcrypt</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Setiap kata sandi diamankan dengan algoritma hashing bcrypt 10 rounds dan tidak pernah disimpan dalam bentuk teks biasa.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

