import {
  BellRinging,
  Buildings,
  CheckCircle,
  MapPin,
  Plus,
  Star,
  User
} from '@phosphor-icons/react';

export function StepPoClient({
  createForm,
  setCreateForm,
  clientMode,
  setClientMode,
  clients = [],
  clientLocations = [],
  clientContacts = [],
  handleClientChange,
  setError
}) {
  const activeContacts = clientContacts.filter((c) => c.is_active !== false);

  const handleSelectLocation = (locId) => {
    if (!locId) {
      setCreateForm((prev) => ({
        ...prev,
        locationId: '',
        locationName: '',
        locationAddress: '',
        locationCity: ''
      }));
      return;
    }
    const loc = clientLocations.find((l) => l.id === locId);
    if (loc) {
      setCreateForm((prev) => ({
        ...prev,
        locationId: loc.id,
        locationName: loc.name,
        locationAddress: loc.address,
        locationCity: loc.city || ''
      }));
    }
  };

  const handleSelectContact = (ctId) => {
    if (!ctId) {
      setCreateForm((prev) => ({
        ...prev,
        contactId: '',
        contactName: '',
        contactPosition: 'PIC K3 / HSE',
        contactPhone: '',
        contactEmail: ''
      }));
      return;
    }
    const ct = clientContacts.find((c) => c.id === ctId);
    if (ct) {
      setCreateForm((prev) => ({
        ...prev,
        contactId: ct.id,
        contactName: ct.name,
        contactPosition: ct.position || 'PIC K3 / HSE',
        contactPhone: ct.phone || '',
        contactEmail: ct.email || ''
      }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-4">
        {/* Pilih atau Input Klien */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Buildings size={16} className="text-[#C81E1E]" weight="bold" />
              <span>Perusahaan Klien *</span>
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
              className="w-full min-h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              <option value="">Pilih Klien Terdaftar...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.industry ? `· ${c.industry}` : ''}
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
              className="w-full min-h-11 rounded-lg border border-[#C81E1E] bg-red-50/20 dark:bg-red-950/20 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
            />
          )}
        </div>

        {/* Input Tambahan Klien Baru */}
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
                placeholder="Alamat lengkap kantor..."
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Bagian Lokasi Pabrik / Site Pelaksanaan Pemeriksaan */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin size={16} className="text-[#C81E1E]" weight="bold" />
              <span>Lokasi Pabrik / Site Pelaksanaan Riksa Uji</span>
            </div>
            {clientMode === 'EXISTING' && clientLocations.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-500">
                {clientLocations.length} lokasi terdaftar
              </span>
            )}
          </div>

          {clientMode === 'EXISTING' && clientLocations.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih dari Lokasi Cabang / Site Terdaftar:
              </label>
              <select
                value={createForm.locationId || ''}
                onChange={(e) => handleSelectLocation(e.target.value)}
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 mb-2"
              >
                <option value="">+ Input Lokasi / Site Baru Manual...</option>
                {clientLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.city ? `(${loc.city})` : ''} · {loc.address}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lokasi / Site *
              </label>
              <input
                type="text"
                value={createForm.locationName}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    locationName: e.target.value,
                    locationId: ''
                  }))
                }
                placeholder="Mis: Plant Cikarang / Site A"
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
                  setCreateForm((prev) => ({
                    ...prev,
                    locationAddress: e.target.value,
                    locationId: ''
                  }))
                }
                placeholder="Jl. Industri Raya Blok..."
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kota / Kabupaten
              </label>
              <input
                type="text"
                value={createForm.locationCity}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    locationCity: e.target.value,
                    locationId: ''
                  }))
                }
                placeholder="Mis: Bekasi / Karawang"
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Bagian Kontak PIC K3 / HSE Klien */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User size={16} className="text-[#C81E1E]" weight="bold" />
              <span>Kontak PIC K3 / HSE Klien (Untuk Komunikasi &amp; Reminder)</span>
            </div>
            {clientMode === 'EXISTING' && activeContacts.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-500">
                {activeContacts.length} kontak terdaftar
              </span>
            )}
          </div>

          {clientMode === 'EXISTING' && activeContacts.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih dari Kontak PIC Terdaftar:
              </label>
              <select
                value={createForm.contactId || ''}
                onChange={(e) => handleSelectContact(e.target.value)}
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 mb-2"
              >
                <option value="">+ Input Kontak PIC Baru Manual...</option>
                {activeContacts.map((ct) => {
                  const tags = [];
                  if (ct.is_primary) tags.push('★ PIC Utama');
                  if (ct.is_reminder_recipient) tags.push('🔔 Reminder');
                  const tagStr = tags.length ? `[${tags.join(', ')}] ` : '';
                  return (
                    <option key={ct.id} value={ct.id}>
                      {tagStr}{ct.name} · {ct.position || 'PIC'} ({ct.phone || 'No telp -'})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Kontak PIC *
              </label>
              <input
                type="text"
                value={createForm.contactName}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    contactName: e.target.value,
                    contactId: ''
                  }))
                }
                placeholder="Mis: Bpk. Hendra"
                className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. WhatsApp / Telepon PIC *
              </label>
              <input
                type="text"
                value={createForm.contactPhone}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    contactPhone: e.target.value,
                    contactId: ''
                  }))
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
                  setCreateForm((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                    contactId: ''
                  }))
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
