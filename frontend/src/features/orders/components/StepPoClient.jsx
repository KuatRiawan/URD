export function StepPoClient({
  createForm,
  setCreateForm,
  clientMode,
  setClientMode,
  clients,
  handleClientChange,
  setError
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Perusahaan Klien *
            </label>
            <button
              type="button"
              onClick={() => {
                setClientMode((prev) => (prev === 'EXISTING' ? 'NEW' : 'EXISTING'));
                setError('');
              }}
              className="text-xs font-bold text-[#C81E1E] dark:text-red-400 hover:underline cursor-pointer"
            >
              {clientMode === 'EXISTING'
                ? '+ Input Klien Baru Sekaligus'
                : 'Pilih dari Klien Terdaftar'}
            </button>
          </div>
          {clientMode === 'EXISTING' ? (
            <select
              value={createForm.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="">Pilih Klien Terdaftar...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={createForm.newClientName}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, newClientName: e.target.value }))
              }
              placeholder="Ketik Nama Perusahaan Klien Baru *"
              className="w-full min-h-11 rounded-md border border-[#C81E1E] bg-red-50/20 dark:bg-red-950/20 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
            />
          )}
        </div>

        {clientMode === 'NEW' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Bidang Industri Klien Baru
              </label>
              <input
                type="text"
                value={createForm.newClientIndustry}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, newClientIndustry: e.target.value }))
                }
                placeholder="Contoh: Manufaktur, Konstruksi, Logistik..."
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Alamat Kantor / Perusahaan Klien
              </label>
              <input
                type="text"
                value={createForm.newClientAddress}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, newClientAddress: e.target.value }))
                }
                placeholder="Alamat lengkap perusahaan..."
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Lokasi Pabrik / Site Pelaksanaan Pemeriksaan
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lokasi / Site
              </label>
              <input
                type="text"
                value={createForm.locationName}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, locationName: e.target.value }))
                }
                placeholder="Mis: Plant Cikarang / Workshop A"
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Lokasi Pemeriksaan
              </label>
              <input
                type="text"
                value={createForm.locationAddress}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, locationAddress: e.target.value }))
                }
                placeholder="Jl. Industri Raya No..."
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kota / Kabupaten Lokasi
              </label>
              <input
                type="text"
                value={createForm.locationCity}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, locationCity: e.target.value }))
                }
                placeholder="Mis: Bekasi / Karawang"
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Kontak PIC K3 / HSE Klien
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Kontak PIC
              </label>
              <input
                type="text"
                value={createForm.contactName}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, contactName: e.target.value }))
                }
                placeholder="Mis: Bpk. Hendra"
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. WhatsApp / Telepon PIC
              </label>
              <input
                type="text"
                value={createForm.contactPhone}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, contactPhone: e.target.value }))
                }
                placeholder="Mis: 081234567890"
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email PIC Klien
              </label>
              <input
                type="email"
                value={createForm.contactEmail}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, contactEmail: e.target.value }))
                }
                placeholder="Mis: hse@klien.co.id"
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

