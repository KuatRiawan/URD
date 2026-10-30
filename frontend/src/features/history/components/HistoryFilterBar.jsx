import { MagnifyingGlass } from '@phosphor-icons/react';

export function HistoryFilterBar({
  search,
  setSearch,
  clientFilter,
  setClientFilter,
  categoryFilter,
  setCategoryFilter,
  clients,
  categories,
  onSearchSubmit
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
        >
          <option value="">Semua Perusahaan Klien</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
        >
          <option value="">Semua Kategori Alat K3</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.code} - {cat.name}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1 sm:w-64">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Unit, No. Seri, PO, Klien..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-[#C81E1E] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white rounded-md hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
        >
          Cari Riwayat
        </button>
      </form>
    </div>
  );
}

