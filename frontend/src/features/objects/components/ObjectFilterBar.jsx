import { MagnifyingGlass } from '@phosphor-icons/react';

export function ObjectFilterBar({
  q,
  setQ,
  categoryId,
  setCategoryId,
  clientId,
  setClientId,
  categories,
  clients,
  onResetPage
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Cari nama objek, merek, atau nomor seri"
          value={q}
          onChange={(e) => {
            onResetPage();
            setQ(e.target.value);
          }}
          placeholder="Cari nama alat, merek, atau nomor seri..."
          className="w-full h-9 rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] pl-9 pr-3 text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-hidden focus:bg-white dark:focus:bg-[#1C1F2B] focus:border-[#C81E1E]"
        />
      </div>
      <div>
        <select
          aria-label="Filter kategori objek K3"
          value={categoryId}
          onChange={(e) => {
            onResetPage();
            setCategoryId(e.target.value);
          }}
          className="w-full h-9 rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] px-3 bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer focus:outline-hidden focus:border-[#C81E1E]"
        >
          <option value="">Semua Kategori Objek K3</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              [{cat.code}] {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          aria-label="Filter perusahaan klien"
          value={clientId}
          onChange={(e) => {
            onResetPage();
            setClientId(e.target.value);
          }}
          className="w-full h-9 rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] px-3 bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer focus:outline-hidden focus:border-[#C81E1E]"
        >
          <option value="">Semua Perusahaan Klien</option>
          {clients.map((cl) => (
            <option key={cl.id} value={cl.id}>
              {cl.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

