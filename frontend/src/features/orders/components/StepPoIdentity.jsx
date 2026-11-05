import { SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';

export function StepPoIdentity({ createForm, setCreateForm }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label htmlFor="po-number" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Nomor PO Pelanggan (Opsional)
          </label>
          <input
            id="po-number"
            type="text"
            value={createForm.poNumber}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, poNumber: e.target.value }))}
            placeholder="Contoh: PO-URD-2026-001"
            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Bila dikosongkan, nomor order internal sistem akan otomatis digunakan sebagai acuan.
          </p>
        </div>

        <div>
          <label htmlFor="po-date" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Tanggal PO *
          </label>
          <input
            id="po-date"
            type="date"
            required
            value={createForm.poDate}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, poDate: e.target.value }))}
            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div>
          <label htmlFor="po-service-type" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Jenis Layanan Riksa Uji *
          </label>
          <select
            id="po-service-type"
            value={createForm.serviceType}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, serviceType: e.target.value }))
            }
            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          >
            {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="po-source" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Sumber Permohonan *
          </label>
          <select
            id="po-source"
            value={createForm.source}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, source: e.target.value }))}
            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          >
            <option value="DOKUMEN_PO">Dokumen PO Resmi</option>
            <option value="EMAIL">Email Resmi</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="TELEPON">Telepon Kantor</option>
            <option value="LANGSUNG">Kunjungan Langsung</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
        </div>
      </div>
    </div>
  );
}
