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
    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
        <select
          aria-label="Filter Perusahaan Klien"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="h-9 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
        >
          <option value="">Semua Perusahaan Klien</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter Kategori Alat K3"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
        >
          <option value="">Semua Kategori Alat K3</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              [{cat.code}] {cat.name}
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
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Cari Unit, No. Seri, PO, Klien"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Unit, No. Seri, PO, Klien..."
            className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <button
          type="submit"
          className="h-9 px-3.5 text-xs font-bold bg-[#C81E1E] text-white rounded-lg hover:bg-[#a11616] transition-colors cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E]"
        >
          Cari
        </button>
      </form>
    </div>
  );
}

