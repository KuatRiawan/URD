export const BAP_SCOPE_CATALOG = [
  'Pemeriksaan Data & Gambar',
  'Pemeriksaan Visual',
  'Uji Fungsi',
  'Uji Beban',
  'Pengukuran Dimensi',
  'NDT PT/MPI',
  'Pemeriksaan Area/Lokasi',
  'Pengukuran Kebisingan',
  'Pengukuran Getaran',
  'Pengukuran Pencahayaan',
  'Pengukuran Thermal',
  'Pengukuran Grounding',
  'Pemeriksaan Down Conductor',
  'Pemeriksaan Air Terminal',
  'PengujianAPAR',
  'Pengujian Alarm Kebakaran',
  'Pengujian Sprinkler',
  'Pengujian Hydrant',
  'Pemeriksaan Ruang Mesin',
  'Pemeriksaan Atas Sangkar',
  'Pemeriksaan Pit',
  'Pemeriksaan Ruang Luncur',
  'Pengujian Wall Thickness',
  'Pengujian Safety Device',
  'Uji Tarik Angkur/Lifeline',
  'Pemeriksaan Pillar & Nozzle',
  'Pemeriksaan Panel MCFA',
  'Pemeriksaan ARD'
].map((s) => (s === 'PengujianAPAR' ? 'Pengujian APAR' : s));

export function computePoUnitProgress(units = []) {
  const totalUnits = units.length;
  let unscheduledUnits = 0;
  let scheduledUnits = 0;
  let inProgressUnits = 0;
  let waitingBapLhppUnits = 0;
  let completedUnits = 0;
  let cancelledUnits = 0;

  for (const u of units) {
    const st = u.unit_status || 'BELUM_DIJADWALKAN';
    if (st === 'DIBATALKAN') {
      cancelledUnits += 1;
    } else if (st === 'BELUM_DIJADWALKAN') {
      unscheduledUnits += 1;
    } else if (st === 'TERJADWAL' || st === 'DITUGASKAN') {
      scheduledUnits += 1;
    } else if (st === 'SEDANG_DIPERIKSA') {
      inProgressUnits += 1;
    } else if (
      [
        'FORM_TERKIRIM',
        'BAP_DRAF',
        'BAP_FINAL',
        'LHPP_DRAF',
        'MENUNGGU_REVIEW',
        'PERLU_REVISI',
        'DISETUJUI'
      ].includes(st)
    ) {
      waitingBapLhppUnits += 1;
    } else if (st === 'LHPP_TERBIT' || st === 'SELESAI') {
      completedUnits += 1;
    }
  }

  const activeUnits = totalUnits - cancelledUnits;
  const canCompletePo = activeUnits > 0 && completedUnits === activeUnits;

  let poProgressLabel = 'Terdaftar';
  if (totalUnits > 0 && cancelledUnits === totalUnits) {
    poProgressLabel = 'Dibatalkan';
  } else if (canCompletePo) {
    poProgressLabel = 'Selesai';
  } else if (completedUnits > 0 && completedUnits < activeUnits) {
    poProgressLabel = 'Sebagian Selesai';
  } else if (waitingBapLhppUnits > 0) {
    poProgressLabel = 'Menunggu Penyelesaian Dokumen';
  } else if (inProgressUnits > 0) {
    poProgressLabel = 'Sedang Berjalan';
  } else if (scheduledUnits > 0) {
    poProgressLabel = 'Terjadwal';
  } else if (unscheduledUnits > 0) {
    poProgressLabel = 'Siap Dijadwalkan';
  }

  return {
    totalUnits,
    activeUnits,
    unscheduledUnits,
    scheduledUnits,
    inProgressUnits,
    waitingBapLhppUnits,
    completedUnits,
    cancelledUnits,
    unscheduled: unscheduledUnits,
    scheduled: scheduledUnits,
    inspecting: inProgressUnits,
    waitingDocs: waitingBapLhppUnits,
    completed: completedUnits,
    cancelled: cancelledUnits,
    canCompletePo,
    poProgressLabel
  };
}

export async function syncOrderUnitStatus(
  db,
  { orderId, objectId, unitStatus, inspectorId, actorId }
) {
  if (objectId && unitStatus) {
    await db.query(
      `UPDATE order_objects
       SET unit_status = $1,
           inspector_id = COALESCE($2, inspector_id),
           updated_at = now()
       WHERE order_id = $3 AND object_id = $4`,
      [unitStatus, inspectorId || null, orderId, objectId]
    );
  }

  const { rows: unitRows } = await db.query(
    'SELECT unit_status FROM order_objects WHERE order_id = $1',
    [orderId]
  );
  const { rows: ordRows } = await db.query(
    'SELECT status FROM orders WHERE id = $1',
    [orderId]
  );
  if (!ordRows[0] || ordRows[0].status === 'DIBATALKAN') {
    return computePoUnitProgress(unitRows);
  }

  const progress = computePoUnitProgress(unitRows);
  const currentOrderStatus = ordRows[0].status;
  let nextOrderStatus = currentOrderStatus;

  if (progress.canCompletePo) {
    nextOrderStatus = 'SELESAI';
  } else if (unitRows.some((u) => u.unit_status === 'MENUNGGU_REVIEW')) {
    nextOrderStatus = 'MENUNGGU_REVIEW';
  } else if (progress.waitingBapLhppUnits > 0 || progress.completedUnits > 0) {
    nextOrderStatus = 'MENUNGGU_LAPORAN';
  } else if (progress.inProgressUnits > 0) {
    nextOrderStatus = 'SEDANG_DIPERIKSA';
  } else if (unitRows.some((u) => u.unit_status === 'DITUGASKAN')) {
    nextOrderStatus = 'DITUGASKAN';
  } else if (unitRows.some((u) => u.unit_status === 'TERJADWAL')) {
    nextOrderStatus = 'TERJADWAL';
  }

  if (nextOrderStatus !== currentOrderStatus) {
    await db.query(
      `UPDATE orders
       SET status = $1::order_status,
           completed_at = CASE WHEN $1::order_status = 'SELESAI'::order_status THEN now() ELSE completed_at END,
           updated_at = now()
       WHERE id = $2`,
      [nextOrderStatus, orderId]
    );
    await db.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by)
       VALUES ($1, $2::order_status, $3::order_status, $4, $5)`,
      [
        orderId,
        currentOrderStatus,
        nextOrderStatus,
        `Status PO diperbarui otomatis berdasarkan progres unit (${progress.completedUnits}/${progress.activeUnits} unit selesai)`,
        actorId || null
      ]
    );
  }

  return progress;
}
