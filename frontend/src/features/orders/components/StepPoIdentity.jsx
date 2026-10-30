import { SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';

export function StepPoIdentity({ createForm, setCreateForm }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Nomor PO Pelanggan (Opsional)
          </label>
          <input
            type="text"
            value={createForm.poNumber}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, poNumber: e.target.value }))}
            placeholder="Contoh: PO-URD-2026-001"
            className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
          />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Bila dikosongkan, nomor order internal akan digunakan sebagai referensi.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Tanggal PO *
          </label>
          <input
            type="date"
            required
            value={createForm.poDate}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, poDate: e.target.value }))}
            className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Jenis Layanan Riksa Uji *
          </label>
          <select
            value={createForm.serviceType}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, serviceType: e.target.value }))
            }
            className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          >
            {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Sumber Permohonan *
          </label>
          <select
            value={createForm.source}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, source: e.target.value }))}
            className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
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
