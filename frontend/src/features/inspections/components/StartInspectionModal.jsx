import { useEffect, useMemo } from 'react';
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
  // Seluruh template yang memiliki versi aktif siap dipilih
  const activeTemplates = useMemo(() => {
    return templates.filter((t) => Boolean(t.active_version_id));
  }, [templates]);

  const selectedObject = useMemo(() => {
    return orderObjects.find((o) => o.id === startForm.objectId);
  }, [orderObjects, startForm.objectId]);

  // Otomatis pasangkan template checklist jika unit yang dipilih cocok dengan bidang/tipe alat
  useEffect(() => {
    if (!selectedObject) return;

    // Cari kecocokan paling spesifik
    const matched =
      activeTemplates.find(
        (t) =>
          selectedObject.equipment_type_id &&
          t.equipment_type_id === selectedObject.equipment_type_id
      ) ||
      activeTemplates.find(
        (t) =>
          selectedObject.name &&
          t.name.toLowerCase().includes(selectedObject.name.toLowerCase())
      ) ||
      activeTemplates.find(
        (t) =>
          selectedObject.category_code &&
          t.category_code === selectedObject.category_code
      ) ||
      activeTemplates.find(
        (t) =>
          selectedObject.category_id &&
          t.category_id === selectedObject.category_id
      );

    if (matched?.active_version_id) {
      setStartForm((prev) => {
        if (prev.templateVersionId === matched.active_version_id) return prev;
        return { ...prev, templateVersionId: matched.active_version_id };
      });
    }
  }, [selectedObject, activeTemplates, setStartForm]);

  const footerActions = (
    <div className="flex items-center justify-end gap-2.5 w-full">
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
        form="start-inspection-form"
        variant="primary"
        size="md"
        disabled={submitting || !startForm.orderId || !startForm.objectId || !startForm.templateVersionId}
        loading={submitting}
      >
        Buka Form Inspeksi
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mulai Lembar Kerja Inspeksi Lapangan"
      subtitle="Pilih order, objek uji K3 yang ditugaskan, dan template checklist riksa uji"
      size="md"
      footer={footerActions}
    >
      <form id="start-inspection-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Order Pemeriksaan *
          </label>
          <select
            required
            value={startForm.orderId}
            onChange={(e) => onSelectOrder(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
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
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Objek Uji K3 dalam Order *
          </label>
          <select
            required
            value={startForm.objectId}
            disabled={!startForm.orderId || orderObjects.length === 0}
            onChange={(e) => setStartForm((prev) => ({ ...prev, objectId: e.target.value }))}
            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400 disabled:opacity-60"
          >
            <option value="">
              {!startForm.orderId
                ? 'Pilih Order terlebih dahulu...'
                : orderObjects.length === 0
                ? 'Tidak ada objek uji dalam order ini'
                : 'Pilih Objek Uji...'}
            </option>
            {orderObjects.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.name} (SN: {obj.serial_number} · {obj.category_code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Template Checklist Tervalidasi *
          </label>
          <select
            required
            value={startForm.templateVersionId}
            onChange={(e) =>
              setStartForm((prev) => ({ ...prev, templateVersionId: e.target.value }))
            }
            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          >
            <option value="">Pilih Template Checklist...</option>
            {activeTemplates.map((t) => (
              <option key={t.id} value={t.active_version_id}>
                {t.category_code ? `${t.category_code} · ` : ''}
                {t.name} (v{t.active_version || 1})
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}

