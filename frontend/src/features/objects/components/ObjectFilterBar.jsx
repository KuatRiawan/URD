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
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
          className="w-full min-h-10 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
          className="w-full min-h-10 rounded border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
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
          className="w-full min-h-10 rounded border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
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
