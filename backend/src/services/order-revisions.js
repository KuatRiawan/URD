export async function recordOrderRevision(db, { orderId, actorId, reason, version }) {
  const { rows } = await db.query(
    `SELECT jsonb_build_object(
       'order', to_jsonb(o),
       'client', jsonb_build_object('id', c.id, 'name', c.name, 'address', c.address, 'email', c.email, 'phone', c.phone),
       'units', COALESCE((
         SELECT jsonb_agg(jsonb_build_object(
           'orderObjectId', oo.id, 'objectId', t.id, 'name', t.name, 'serialNumber', t.serial_number,
           'brand', t.brand, 'model', t.model, 'capacity', t.capacity, 'installLocation', t.install_location,
           'category', oc.name, 'unitStatus', oo.unit_status, 'scopeItems', oo.scope_items,
           'proposedDate', oo.proposed_date, 'inspectorId', oo.inspector_id
         ) ORDER BY t.serial_number)
         FROM order_objects oo JOIN test_objects t ON t.id = oo.object_id
         JOIN object_categories oc ON oc.id = t.category_id WHERE oo.order_id = o.id
       ), '[]'::jsonb)
     ) AS snapshot
     FROM orders o JOIN clients c ON c.id = o.client_id WHERE o.id = $1`,
    [orderId]
  );
  if (!rows[0]) return null;
  const { rows: inserted } = await db.query(
    `INSERT INTO order_revisions (order_id, version, reason, snapshot, actor_id)
     VALUES ($1,$2,$3,$4::jsonb,$5)
     ON CONFLICT (order_id, version) DO UPDATE SET reason = EXCLUDED.reason,
       snapshot = EXCLUDED.snapshot, actor_id = EXCLUDED.actor_id
     RETURNING *`,
    [orderId, version, reason, JSON.stringify(rows[0].snapshot), actorId]
  );
  return inserted[0];
}
