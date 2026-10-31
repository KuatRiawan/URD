import { FileCsv, Trash } from '@phosphor-icons/react';

export function StepPoUnits({
  clientMode,
  createForm,
  setCreateForm,
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
    <div className="space-y-4">
      {/* Opsi 1: Pilih dari unit terdaftar */}
      {clientMode === 'EXISTING' && (
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            A. Pilih dari Unit Alat Klien yang Sudah Terdaftar ({createForm.objectIds.length} dipilih)
          </label>
          {!createForm.clientId ? (
            <p className="text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-md p-3">
              Pilih perusahaan klien terlebih dahulu pada Langkah 2 untuk menampilkan unit terdaftar.
            </p>
          ) : clientObjects.length === 0 ? (
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-md p-3">
              Klien ini belum memiliki unit terdaftar sebelumnya. Silakan tambahkan unit baru di bawah.
            </p>
          ) : (
            <div className="max-h-40 overflow-y-auto border border-slate-300 dark:border-slate-700 rounded-md divide-y divide-slate-200 dark:divide-slate-800">
              {clientObjects.map((obj) => (
                <label
                  key={obj.id}
                  className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={createForm.objectIds.includes(obj.id)}
                    onChange={() => toggleObjectSelection(obj.id)}
                    className="h-4 w-4 rounded border-slate-300 text-[#C81E1E]"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 dark:text-white">{obj.name}</span>
                    <span className="ml-2 text-slate-500 font-mono">({obj.serial_number})</span>
                    <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      {obj.category_code}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Opsi 2: Tambah unit baru langsung */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white">
            B. Tambah Unit Alat Baru Langsung ke PO
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenCsvImport(null)}
              className="min-h-8 inline-flex items-center gap-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <FileCsv size={15} weight="bold" />
              <span>Impor CSV Unit</span>
            </button>
            <span className="text-xs font-bold text-[#C81E1E]">
              {createForm.units.length} unit baru ditambahkan
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kategori K3
            </label>
            <select
              value={newUnitRow.categoryId}
              onChange={(e) => setNewUnitRow({ ...newUnitRow, categoryId: Number(e.target.value) })}
              className="w-full min-h-[40px] px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
              className="w-full min-h-[40px] px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
            </input>
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
              className="w-full min-h-[40px] px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
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
              className="w-full min-h-[40px] px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
              className="w-full min-h-[40px] px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                className="w-20 min-h-[40px] px-2 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center font-bold"
              />
              <button
                type="button"
                onClick={handleAddInlineUnit}
                className="flex-1 min-h-[40px] px-3 py-2 text-xs font-bold text-white bg-[#C81E1E] hover:bg-[#a11616] rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                + Tambah Unit
              </button>
            </div>
          </div>
        </div>

        {createForm.units.length > 0 && (
          <div className="space-y-1.5 pt-2">
            {createForm.units.map((u, idx) => (
              <div
                key={`${u.serialNumber}-${idx}`}
                className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{u.name}</span> · SN:{' '}
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {u.serialNumber}
                  </span>{' '}
                  · Kapasitas: {u.capacity || '-'} · Lokasi: {u.installLocation || '-'} ·{' '}
                  <strong className="text-[#C81E1E]">{u.quantity} Unit</strong>
                </div>
                <button
                  type="button"
                  onClick={() => removeInlineUnit(idx)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                >
                  <Trash size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

