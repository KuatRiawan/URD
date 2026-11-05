import {
  Buildings,
  MapPin,
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
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-4 text-xs">
        {/* Pilih atau Input Klien */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="po-client-select" className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
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
              id="po-client-select"
              value={createForm.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
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
              id="po-client-name"
              type="text"
              value={createForm.newClientName}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, newClientName: e.target.value }))
              }
              placeholder="Ketik Nama Perusahaan Klien Baru *"
              className="w-full h-10 rounded-lg border border-[#C81E1E] bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-[#C81E1E]"
            />
          )}
        </div>

        {/* Input Tambahan Klien Baru */}
        {clientMode === 'NEW' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
            <div>
              <label htmlFor="new-client-industry" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Bidang Industri Klien Baru
              </label>
              <input
                id="new-client-industry"
                type="text"
                value={createForm.newClientIndustry}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, newClientIndustry: e.target.value }))
                }
                placeholder="Contoh: Manufaktur, Konstruksi, Logistik..."
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label htmlFor="new-client-address" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Alamat Kantor Perusahaan Klien
              </label>
              <input
                id="new-client-address"
                type="text"
                value={createForm.newClientAddress}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, newClientAddress: e.target.value }))
                }
                placeholder="Alamat lengkap kantor pusat..."
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
        )}

        {/* Bagian Lokasi Pabrik / Site Pelaksanaan Pemeriksaan */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
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
              <label htmlFor="po-location-select" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih dari Lokasi Cabang / Site Terdaftar:
              </label>
              <select
                id="po-location-select"
                value={createForm.locationId || ''}
                onChange={(e) => handleSelectLocation(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
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
              <label htmlFor="po-location-name" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lokasi / Site *
              </label>
              <input
                id="po-location-name"
                type="text"
                value={createForm.locationName}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    locationName: e.target.value,
                    locationId: ''
                  }))
                }
                placeholder="Misal: Plant Cikarang / Workshop A"
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label htmlFor="po-location-address" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Alamat Lokasi Pemeriksaan
              </label>
              <input
                id="po-location-address"
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
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label htmlFor="po-location-city" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kota / Kabupaten
              </label>
              <input
                id="po-location-city"
                type="text"
                value={createForm.locationCity}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    locationCity: e.target.value,
                    locationId: ''
                  }))
                }
                placeholder="Misal: Bekasi / Karawang"
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Bagian Kontak PIC K3 / HSE Klien */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User size={16} className="text-[#C81E1E]" weight="bold" />
              <span>Kontak PIC K3 / HSE Klien</span>
            </div>
            {clientMode === 'EXISTING' && activeContacts.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-500">
                {activeContacts.length} kontak terdaftar
              </span>
            )}
          </div>

          {clientMode === 'EXISTING' && activeContacts.length > 0 && (
            <div>
              <label htmlFor="po-contact-select" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih dari Kontak PIC Terdaftar:
              </label>
              <select
                id="po-contact-select"
                value={createForm.contactId || ''}
                onChange={(e) => handleSelectContact(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              >
                <option value="">+ Input Kontak PIC Baru Manual...</option>
                {activeContacts.map((ct) => {
                  const tags = [];
                  if (ct.is_primary) tags.push('PIC Utama');
                  if (ct.is_reminder_recipient) tags.push('Reminder');
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
              <label htmlFor="po-contact-name" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Kontak PIC *
              </label>
              <input
                id="po-contact-name"
                type="text"
                value={createForm.contactName}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    contactName: e.target.value,
                    contactId: ''
                  }))
                }
                placeholder="Misal: Bpk. Hendra"
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label htmlFor="po-contact-phone" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                No. WhatsApp / Telepon PIC *
              </label>
              <input
                id="po-contact-phone"
                type="text"
                value={createForm.contactPhone}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    contactPhone: e.target.value,
                    contactId: ''
                  }))
                }
                placeholder="Misal: 081234567890"
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label htmlFor="po-contact-email" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email PIC Klien
              </label>
              <input
                id="po-contact-email"
                type="email"
                value={createForm.contactEmail}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                    contactId: ''
                  }))
                }
                placeholder="Misal: hse@klien.co.id"
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
