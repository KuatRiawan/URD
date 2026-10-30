import { Truck } from '@phosphor-icons/react';
import { formatDateTime } from '../../../lib/utils/format.js';

export function LhppDeliverySection({
  detailLhpp,
  canDeliver,
  deliveryForm,
  setDeliveryForm,
  submitting,
  handleRecordDelivery
}) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-md p-4 space-y-3 bg-white dark:bg-slate-800">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
        <Truck size={16} />
        <span>
          Log Distribusi &amp; Serah Terima LHPP ({(detailLhpp.deliveries || []).length})
        </span>
      </h4>
      {(detailLhpp.deliveries || []).map((del) => (
        <div
          key={del.id}
          className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 flex justify-between text-slate-800 dark:text-slate-200"
        >
          <span>
            <strong>{del.channel}</strong> kepada <strong>{del.recipient_name}</strong>{' '}
            {del.recipient_email ? `(${del.recipient_email})` : ''}
          </span>
          <span className="text-slate-500 dark:text-slate-400">{formatDateTime(del.delivered_at)}</span>
        </div>
      ))}
      {canDeliver && (
        <form
          onSubmit={handleRecordDelivery}
          className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1"
        >
          <select
            value={deliveryForm.channel}
            onChange={(e) =>
              setDeliveryForm((prev) => ({ ...prev, channel: e.target.value }))
            }
            className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 text-xs"
          >
            <option value="EMAIL">Email</option>
            <option value="SERAH_TERIMA_LANGSUNG">Serah Terima Langsung</option>
            <option value="KURIR">Ekspedisi / Kurir</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
          <input
            type="text"
            required
            value={deliveryForm.recipientName}
            onChange={(e) =>
              setDeliveryForm((prev) => ({ ...prev, recipientName: e.target.value }))
            }
            placeholder="Nama penerima di klien..."
            className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 text-xs"
          />
          <input
            type="email"
            value={deliveryForm.recipientEmail}
            onChange={(e) =>
              setDeliveryForm((prev) => ({ ...prev, recipientEmail: e.target.value }))
            }
            placeholder="Email penerima..."
            className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 text-xs"
          />
          <button
            type="submit"
            disabled={submitting}
            className="min-h-9 rounded bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 px-3 text-xs font-bold text-white cursor-pointer"
          >
            Catat Pengiriman
          </button>
        </form>
      )}
    </div>
  );
}
