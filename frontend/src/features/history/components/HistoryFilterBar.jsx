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
    <div className="bg-white dark:bg-[#151821] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
        <select
          aria-label="Filter Perusahaan Klien"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="h-9 px-3 text-xs border border-black/[0.10] dark:border-white/[0.12] rounded-[10px] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer focus:outline-hidden focus:border-[#C81E1E]"
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
          className="h-9 px-3 text-xs border border-black/[0.10] dark:border-white/[0.12] rounded-[10px] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer focus:outline-hidden focus:border-[#C81E1E]"
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Cari Unit, No. Seri, PO, Klien"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Unit, No. Seri, PO, Klien..."
            className="w-full h-9 pl-9 pr-3 text-xs border border-black/[0.10] dark:border-white/[0.12] rounded-[10px] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-hidden focus:bg-white dark:focus:bg-[#1C1F2B] focus:border-[#C81E1E]"
          />
        </div>
        <button
          type="submit"
          className="h-9 px-3.5 text-xs font-semibold bg-[#C81E1E] text-white rounded-[10px] hover:bg-[#AD1919] transition-colors cursor-pointer shadow-[0_1px_2px_rgba(200,30,30,0.2)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E]"
        >
          Cari
        </button>
      </form>
    </div>
  );
}

