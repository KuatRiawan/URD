import { formatDate, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';

export function StepPoReview({
  createForm,
  clientMode,
  clients,
  inspectors
}) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Ringkasan Data Purchase Order (PO)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1 font-semibold uppercase">Identitas PO</div>
            <div className="font-mono font-bold text-slate-900 dark:text-white">
              {createForm.poNumber || 'Nomor PO Otomatis'}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              Tanggal PO: {createForm.poDate || '-'}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              Layanan: {SERVICE_TYPE_LABELS[createForm.serviceType] || createForm.serviceType}
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1 font-semibold uppercase">Perusahaan Klien & Lokasi</div>
            <div className="font-bold text-slate-900 dark:text-white">
              {clientMode === 'NEW'
                ? `${createForm.newClientName} (Klien Baru)`
                : clients.find((c) => c.id === createForm.clientId)?.name || '-'}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              Lokasi: {createForm.locationName || createForm.locationAddress || '-'}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              PIC: {createForm.contactName || '-'} ({createForm.contactPhone || '-'})
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <div className="text-slate-400 text-[11px] mb-1.5 font-semibold uppercase">
            Daftar Unit Alat K3 yang Didaftarkan ({createForm.objectIds.length + createForm.units.length} Unit)
          </div>
          <div className="space-y-1">
            {createForm.objectIds.length > 0 && (
              <div className="text-slate-700 dark:text-slate-300">
                • {createForm.objectIds.length} Unit dipilih dari unit terdaftar klien
              </div>
            )}
            {createForm.units.map((u, i) => (
              <div key={i} className="text-slate-700 dark:text-slate-300">
                • <strong>{u.name}</strong> (SN: {u.serialNumber}) · Kapasitas: {u.capacity || '-'} · Jumlah: {u.quantity} unit
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1 font-semibold uppercase">Tim Ahli K3</div>
            <div className="text-slate-700 dark:text-slate-300">
              {createForm.inspectorIds.length > 0
                ? createForm.inspectorIds
                    .map((id) => inspectors.find((i) => i.id === id)?.fullName)
                    .filter(Boolean)
                    .join(', ')
                : 'Belum ditentukan (dapat dijadwalkan kemudian)'}
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1 font-semibold uppercase">Target Pelaksanaan</div>
            <div className="text-slate-700 dark:text-slate-300">
              {createForm.requestedDate ? formatDate(createForm.requestedDate) : 'Sesuai kesepakatan'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

