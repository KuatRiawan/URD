import { useState } from 'react';
import {
  Bell,
  CheckCircle,
  Eye,
  EyeSlash,
  FloppyDisk,
  PaperPlaneTilt,
  WarningCircle,
  WhatsappLogo
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function GatewaysSection({
  waForm,
  setWaForm,
  smtpForm,
  setSmtpForm,
  handleSaveGateways,
  savingKey,
  handleTestWhatsApp,
  handleTestEmail,
  testingConnection
}) {
  const [showWaKey, setShowWaKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const isWaConfigured = Boolean(waForm.has_secret || (waForm.api_key && String(waForm.api_key).trim()));
  const isSmtpConfigured = Boolean(smtpForm.has_secret || (smtpForm.pass && String(smtpForm.pass).trim()));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-[#C81E1E]" weight="bold" />
          <CardTitle>Gateway Notifikasi WhatsApp & Server Email SMTP</CardTitle>
        </div>
        <CardDescription>
          Kredensial dan endpoint server untuk pengiriman pengingat berkala masa berlaku Suket K3 (H-30, H-14, H-7), pembaruan status jadwal, dan notifikasi operasional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveGateways} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. WhatsApp Gateway Card */}
            <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <WhatsappLogo size={18} weight="bold" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      WhatsApp Gateway API
                    </h4>
                    <span
                      className={`text-[10px] font-bold inline-flex items-center gap-1 ${
                        isWaConfigured
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isWaConfigured ? (
                        <>
                          <CheckCircle size={12} weight="fill" />
                          <span>Token API Tersimpan</span>
                        </>
                      ) : (
                        <>
                          <WarningCircle size={12} weight="fill" />
                          <span>Token Belum Dikonfigurasi</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  loading={testingConnection === 'whatsapp'}
                  onClick={handleTestWhatsApp}
                  icon={PaperPlaneTilt}
                >
                  Uji Koneksi
                </Button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Provider WhatsApp Gateway *
                </label>
                <input
                  type="text"
                  required
                  value={waForm.provider}
                  onChange={(e) => setWaForm({ ...waForm, provider: e.target.value })}
                  placeholder="FONNTE / QONTAK / WABLAS"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Endpoint URL API *
                </label>
                <input
                  type="text"
                  required
                  value={waForm.api_url}
                  onChange={(e) => setWaForm({ ...waForm, api_url: e.target.value })}
                  placeholder="https://api.fonnte.com/send"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  API Key / Token Otorisasi
                </label>
                <div className="relative">
                  <input
                    type={showWaKey ? 'text' : 'password'}
                    value={waForm.api_key}
                    onChange={(e) => setWaForm({ ...waForm, api_key: e.target.value })}
                    placeholder="Masukkan token API gateway..."
                    className="w-full px-3 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWaKey(!showWaKey)}
                    aria-label={showWaKey ? 'Sembunyikan API Key' : 'Tampilkan API Key'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showWaKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Kredensial yang tersimpan ditampilkan tersembunyi (••••••••) demi keamanan. Biarkan tetap tersembunyi bila tidak ingin mengganti token.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Telepon Pengirim Terdaftar
                </label>
                <input
                  type="text"
                  value={waForm.sender_number}
                  onChange={(e) => setWaForm({ ...waForm, sender_number: e.target.value })}
                  placeholder="Contoh: 081284567890"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
                />
              </div>
            </div>

            {/* 2. SMTP Email Card */}
            <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                    <Bell size={18} weight="bold" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      Server SMTP Email Kantor
                    </h4>
                    <span
                      className={`text-[10px] font-bold inline-flex items-center gap-1 ${
                        isSmtpConfigured
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isSmtpConfigured ? (
                        <>
                          <CheckCircle size={12} weight="fill" />
                          <span>Sandi SMTP Tersimpan</span>
                        </>
                      ) : (
                        <>
                          <WarningCircle size={12} weight="fill" />
                          <span>Sandi Belum Dikonfigurasi</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  loading={testingConnection === 'email'}
                  onClick={handleTestEmail}
                  icon={PaperPlaneTilt}
                >
                  Uji Koneksi
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Host Server SMTP *
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Port *
                  </label>
                  <input
                    type="number"
                    required
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username / Email Autentikasi *
                </label>
                <input
                  type="text"
                  required
                  value={smtpForm.user}
                  onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                  placeholder="notifikasi@upayariksadaya.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password / App Password SMTP
                </label>
                <div className="relative">
                  <input
                    type={showSmtpPass ? 'text' : 'password'}
                    value={smtpForm.pass}
                    onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    aria-label={showSmtpPass ? 'Sembunyikan sandi SMTP' : 'Tampilkan sandi SMTP'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showSmtpPass ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Sandi SMTP dilindungi dari eksposur API. Isi hanya bila ingin memperbarui sandi baru.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama & Email Pengirim (From Header) *
                </label>
                <input
                  type="text"
                  required
                  value={smtpForm.from}
                  onChange={(e) => setSmtpForm({ ...smtpForm, from: e.target.value })}
                  placeholder="URD Operasional <notifikasi@upayariksadaya.com>"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:border-[#C81E1E] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <Button
              type="submit"
              size="md"
              loading={savingKey === 'gateways'}
              icon={FloppyDisk}
            >
              Simpan Konfigurasi Gateway & Server Email
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

