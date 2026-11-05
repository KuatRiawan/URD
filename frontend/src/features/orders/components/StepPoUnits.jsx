import { Copy, FileCsv, Trash } from '@phosphor-icons/react';

export function StepPoUnits({
  clientMode,
  createForm,
  setCreateForm: _setCreateForm,
  clientObjects,
  toggleObjectSelection,
  newUnitRow,
  setNewUnitRow,
  categories,
  handleAddInlineUnit,
  removeInlineUnit,
  handleOpenCsvImport
}) {
  return (
    <div className="space-y-4 text-xs">
      {/* Opsi 1: Pilih dari unit terdaftar */}
      {clientMode === 'EXISTING' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800 dark:text-slate-200">
              A. Ambil dari Riwayat Alat Klien Terdaftar ({createForm.objectIds.length} dipilih)
            </label>
            {clientObjects.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const allIds = clientObjects.map((o) => o.id);
                  const allSelected = allIds.every((id) => createForm.objectIds.includes(id));
                  allIds.forEach((id) => {
                    if (allSelected) {
                      if (createForm.objectIds.includes(id)) toggleObjectSelection(id);
                    } else {
                      if (!createForm.objectIds.includes(id)) toggleObjectSelection(id);
                    }
                  });
                }}
                className="text-[11px] font-bold text-[#C81E1E] dark:text-red-400 hover:underline cursor-pointer"
              >
                {clientObjects.every((o) => createForm.objectIds.includes(o.id))
                  ? 'Batal Pilih Semua'
                  : 'Pilih Semua Unit'}
              </button>
            )}
          </div>
          {!createForm.clientId ? (
            <p className="text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/20">
              Pilih perusahaan klien terlebih dahulu pada Langkah 2 untuk menampilkan riwayat unit terdaftar.
            </p>
          ) : clientObjects.length === 0 ? (
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
              Klien ini belum memiliki unit terdaftar sebelumnya. Silakan tambahkan unit baru pada bagian B di bawah.
            </p>
          ) : (
            <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              {clientObjects.map((obj) => {
                const isSelected = createForm.objectIds.includes(obj.id);
                return (
                  <label
                    key={obj.id}
                    className={`flex items-start gap-3 p-3 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50/60 dark:bg-rose-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleObjectSelection(obj.id)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C81E1E] focus:ring-[#C81E1E] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {obj.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {obj.category_code}
                        </span>
                        {obj.serial_number && (
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            SN: {obj.serial_number}
                          </span>
                        )}
                        {obj.capacity && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            · SWL: {obj.capacity}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {obj.suket_no ? (
                          <span className="font-mono">
                            Suket: {obj.suket_no}
                            {obj.suket_valid_until && ` (s/d ${new Date(obj.suket_valid_until).toLocaleDateString('id-ID')})`}
                          </span>
                        ) : (
                          <span>Belum ada Suket tercatat</span>
                        )}
                        {obj.last_po_number && (
                          <span>· PO Terakhir: {obj.last_po_number}</span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Opsi 2: Tambah unit baru langsung */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="font-bold text-slate-900 dark:text-white">
            B. Tambah Unit Alat Baru Langsung ke PO
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenCsvImport(null)}
              className="h-8.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
            >
              <FileCsv size={15} weight="bold" />
              <span>Impor CSV Unit</span>
            </button>
            <span className="text-xs font-bold text-[#C81E1E]">
              {createForm.units.length} unit baru ditambahkan
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kategori K3
            </label>
            <select
              value={newUnitRow.categoryId}
              onChange={(e) => setNewUnitRow({ ...newUnitRow, categoryId: Number(e.target.value) })}
              className="w-full h-10 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.code} - {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Objek Alat
            </label>
            <input
              type="text"
              value={newUnitRow.name}
              onChange={(e) => setNewUnitRow({ ...newUnitRow, name: e.target.value })}
              placeholder="Contoh: Overhead Crane 10 Ton"
              className="w-full h-10 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nomor Seri / Tag Unit (Opsional)
            </label>
            <input
              type="text"
              value={newUnitRow.serialNumber}
              onChange={(e) => setNewUnitRow({ ...newUnitRow, serialNumber: e.target.value })}
              placeholder="Contoh: CR-2024-001"
              className="w-full h-10 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kapasitas / Beban Maksimal (SWL)
            </label>
            <input
              type="text"
              value={newUnitRow.capacity}
              onChange={(e) => setNewUnitRow({ ...newUnitRow, capacity: e.target.value })}
              placeholder="Contoh: 10 Ton / 10.000 kg"
              className="w-full h-10 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lokasi Area Kerja / Pabrik
            </label>
            <input
              type="text"
              value={newUnitRow.installLocation}
              onChange={(e) => setNewUnitRow({ ...newUnitRow, installLocation: e.target.value })}
              placeholder="Contoh: Workshop Bay 2"
              className="w-full h-10 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jumlah &amp; Tambahkan
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={20}
                value={newUnitRow.quantity}
                onChange={(e) => setNewUnitRow({ ...newUnitRow, quantity: Number(e.target.value) })}
                title="Jumlah Unit"
                className="w-20 h-10 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center font-bold focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="button"
                onClick={handleAddInlineUnit}
                className="flex-1 h-10 px-3 text-xs font-bold text-white bg-[#C81E1E] hover:bg-[#a11616] rounded-lg transition-colors cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E]"
              >
                + Tambah Unit
              </button>
            </div>
          </div>
        </div>

        {createForm.units.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
            {createForm.units.map((u, idx) => (
              <div
                key={`${u.serialNumber}-${idx}`}
                className="flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 shadow-2xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{u.name}</span> · SN:{' '}
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {u.serialNumber || '-'}
                  </span>{' '}
                  · Kapasitas: {u.capacity || '-'} · Lokasi: {u.installLocation || '-'} ·{' '}
                  <strong className="text-[#C81E1E]">{u.quantity} Unit</strong>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setNewUnitRow({
                        categoryId: u.categoryId,
                        name: u.name,
                        manufacturer: u.manufacturer || '',
                        serialNumber: '',
                        capacity: u.capacity || '',
                        installLocation: u.installLocation || '',
                        quantity: 1,
                        attributes: u.attributes || {}
                      });
                    }}
                    title="Duplikasi spesifikasi unit ini ke form input"
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#C81E1E] hover:border-[#C81E1E] dark:hover:text-[#C81E1E] transition-all cursor-pointer shadow-2xs"
                  >
                    <Copy size={14} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeInlineUnit(idx)}
                    title="Hapus unit dari PO"
                    className="p-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-all cursor-pointer shadow-2xs"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
