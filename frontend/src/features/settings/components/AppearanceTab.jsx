import { Sun, Moon, Desktop, Check } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card.jsx';

export function AppearanceTab({ theme, setTheme }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tema Antarmuka Pengguna</CardTitle>
          <CardDescription>
            Pilih skema warna yang paling nyaman untuk visibilitas saat bekerja di kantor atau di lapangan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Mode Terang */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-36 cursor-pointer ${
                theme === 'light'
                  ? 'border-brand-600 bg-brand-50/20 dark:bg-rose-950/20 ring-2 ring-brand-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Sun size={18} weight="bold" />
                </span>
                {theme === 'light' && (
                  <span className="h-5 w-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                    <Check size={12} weight="bold" />
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Mode Terang</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Permukaan bersih putih dan abu netral kontras tinggi
                </p>
              </div>
            </button>

            {/* Mode Gelap */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-36 cursor-pointer ${
                theme === 'dark'
                  ? 'border-brand-600 bg-brand-50/20 dark:bg-rose-950/20 ring-2 ring-brand-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
                  <Moon size={18} weight="bold" />
                </span>
                {theme === 'dark' && (
                  <span className="h-5 w-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                    <Check size={12} weight="bold" />
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Mode Gelap</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Latar gelap slate nyaman untuk pencahayaan rendah
                </p>
              </div>
            </button>

            {/* Ikuti Sistem */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-36 cursor-pointer ${
                theme === 'system'
                  ? 'border-brand-600 bg-brand-50/20 dark:bg-rose-950/20 ring-2 ring-brand-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center">
                  <Desktop size={18} weight="bold" />
                </span>
                {theme === 'system' && (
                  <span className="h-5 w-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                    <Check size={12} weight="bold" />
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Ikuti Sistem</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Menyesuaikan otomatis dengan preferensi OS perangkat Anda
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Standarisasi Format &amp; Regional</CardTitle>
          <CardDescription>Format angka, tanggal, dan terminologi yang digunakan aplikasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Format Tanggal</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">DD MMMM YYYY</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Contoh: 29 Oktober 2026</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mata Uang</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">Rupiah Indonesia (IDR)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Format: Rp 1.500.000</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Zona Waktu Operasional</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">Waktu Indonesia Barat (WIB)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">UTC+07:00 (Jakarta)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

