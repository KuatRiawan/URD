import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function StartInspectionModal({
  open,
  onClose,
  onSubmit,
  orders,
  orderObjects,
  templates,
  startForm,
  setStartForm,
  onSelectOrder,
  submitting
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mulai Lembar Kerja Inspeksi Lapangan"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
            Order Pemeriksaan *
          </label>
          <select
            required
            value={startForm.orderId}
            onChange={(e) => onSelectOrder(e.target.value)}
            className="w-full min-h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          >
            <option value="">Pilih Order...</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.order_no} ({o.client_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
            Objek Uji K3 dalam Order *
          </label>
          <select
            required
            value={startForm.objectId}
            onChange={(e) => setStartForm((prev) => ({ ...prev, objectId: e.target.value }))}
            className="w-full min-h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          >
            <option value="">Pilih Objek Uji...</option>
            {orderObjects.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.name} (SN: {obj.serial_number} · {obj.category_code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
            Template Checklist Tervalidasi *
          </label>
          <select
            required
            value={startForm.templateVersionId}
            onChange={(e) =>
              setStartForm((prev) => ({ ...prev, templateVersionId: e.target.value }))
            }
            className="w-full min-h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          >
            <option value="">Pilih Template Checklist...</option>
            {templates
              .filter((t) => t.is_validated && t.active_version_id)
              .map((t) => (
                <option key={t.id} value={t.active_version_id}>
                  {t.category_code} · {t.name} (v{t.active_version})
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting}
            loading={submitting}
          >
            Buka Form Inspeksi
          </Button>
        </div>
      </form>
    </Modal>
  );
}

