import { Router } from 'express';
import { query } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

// Global Search endpoint: mencari nomor PO, klien, nomor seri unit, nomor BAP, dan nomor LHPP
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ query: q, total: 0, results: [] });
    }

    const searchTerm = `%${q.toLowerCase()}%`;
    const role = req.user.role;
    const userId = req.user.id;
    const isInspector = ['AHLI_K3', 'INSPECTOR'].includes(role);

    // 1. Cari PO / Orders
    const orderSql = isInspector
      ? `SELECT o.id, o.order_no, o.po_number, o.status, c.name AS client_name, o.service_type
         FROM orders o
         JOIN clients c ON c.id = o.client_id
         JOIN assignments a ON a.order_id = o.id
         WHERE a.inspector_id = $2
           AND (lower(o.order_no) LIKE $1 OR lower(coalesce(o.po_number, '')) LIKE $1 OR lower(c.name) LIKE $1)
         ORDER BY o.created_at DESC
         LIMIT 6`
      : `SELECT o.id, o.order_no, o.po_number, o.status, c.name AS client_name, o.service_type
         FROM orders o
         JOIN clients c ON c.id = o.client_id
         WHERE lower(o.order_no) LIKE $1 OR lower(coalesce(o.po_number, '')) LIKE $1 OR lower(c.name) LIKE $1
         ORDER BY o.created_at DESC
         LIMIT 6`;

    // 2. Cari Klien
    const clientSql = isInspector
      ? `SELECT DISTINCT c.id, c.name, c.address, c.phone, c.is_active
         FROM clients c
         JOIN orders o ON o.client_id = c.id
         JOIN assignments a ON a.order_id = o.id
         WHERE a.inspector_id = $2 AND lower(c.name) LIKE $1
         ORDER BY c.name ASC
         LIMIT 6`
      : `SELECT id, name, address, phone, is_active
         FROM clients
         WHERE lower(name) LIKE $1
         ORDER BY name ASC
         LIMIT 6`;

    // 3. Cari Objek Uji
    const objectSql = isInspector
      ? `SELECT DISTINCT t.id, t.name, t.serial_number, oc.code AS category_code, c.name AS client_name
         FROM test_objects t
         JOIN object_categories oc ON oc.id = t.category_id
         JOIN clients c ON c.id = t.client_id
         JOIN order_objects oo ON oo.object_id = t.id
         JOIN assignments a ON a.order_id = oo.order_id
         WHERE a.inspector_id = $2
           AND (lower(t.name) LIKE $1 OR lower(coalesce(t.serial_number, '')) LIKE $1)
         ORDER BY t.name ASC
         LIMIT 6`
      : `SELECT t.id, t.name, t.serial_number, oc.code AS category_code, c.name AS client_name
         FROM test_objects t
         JOIN object_categories oc ON oc.id = t.category_id
         JOIN clients c ON c.id = t.client_id
         WHERE lower(t.name) LIKE $1 OR lower(coalesce(t.serial_number, '')) LIKE $1
         ORDER BY t.name ASC
         LIMIT 6`;

    // 4. Cari Dokumen BAP
    const bapSql = isInspector
      ? `SELECT b.id, b.bap_no, b.status, t.name AS object_name, c.name AS client_name
         FROM bap_documents b
         JOIN inspections i ON i.id = b.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         WHERE i.inspector_id = $2 AND (lower(b.bap_no) LIKE $1 OR lower(t.name) LIKE $1)
         ORDER BY b.created_at DESC
         LIMIT 6`
      : `SELECT b.id, b.bap_no, b.status, t.name AS object_name, c.name AS client_name
         FROM bap_documents b
         JOIN inspections i ON i.id = b.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         WHERE lower(b.bap_no) LIKE $1 OR lower(t.name) LIKE $1
         ORDER BY b.created_at DESC
         LIMIT 6`;

    // 5. Cari Dokumen LHPP
    const lhppSql = isInspector
      ? `SELECT l.id, l.lhpp_no, l.status, i.conclusion, t.name AS object_name, c.name AS client_name
         FROM lhpp_documents l
         JOIN inspections i ON i.id = l.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         WHERE i.inspector_id = $2
           AND (lower(coalesce(l.lhpp_no, '')) LIKE $1 OR lower(t.name) LIKE $1 OR lower(c.name) LIKE $1)
         ORDER BY l.created_at DESC
         LIMIT 6`
      : `SELECT l.id, l.lhpp_no, l.status, i.conclusion, t.name AS object_name, c.name AS client_name
         FROM lhpp_documents l
         JOIN inspections i ON i.id = l.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         WHERE lower(coalesce(l.lhpp_no, '')) LIKE $1 OR lower(t.name) LIKE $1 OR lower(c.name) LIKE $1
         ORDER BY l.created_at DESC
         LIMIT 6`;

    const issueSql = isInspector
      ? `SELECT oi.id, oi.issue_no, oi.issue_type, oi.title, oi.status, oi.priority,
                o.po_number, o.order_no, c.name AS client_name, t.serial_number
         FROM operational_issues oi
         JOIN orders o ON o.id = oi.order_id JOIN clients c ON c.id = o.client_id
         LEFT JOIN test_objects t ON t.id = oi.object_id
         WHERE (oi.reported_by = $2 OR EXISTS (
           SELECT 1 FROM assignments ax WHERE ax.order_id = oi.order_id AND ax.inspector_id = $2
             AND ax.status IN ('MENUNGGU','DITERIMA')
         ))
           AND (lower(oi.issue_no) LIKE $1 OR lower(oi.title) LIKE $1 OR lower(o.po_number) LIKE $1
             OR lower(coalesce(t.serial_number, '')) LIKE $1)
         ORDER BY oi.updated_at DESC LIMIT 6`
      : `SELECT oi.id, oi.issue_no, oi.issue_type, oi.title, oi.status, oi.priority,
                o.po_number, o.order_no, c.name AS client_name, t.serial_number
         FROM operational_issues oi
         JOIN orders o ON o.id = oi.order_id JOIN clients c ON c.id = o.client_id
         LEFT JOIN test_objects t ON t.id = oi.object_id
         WHERE lower(oi.issue_no) LIKE $1 OR lower(oi.title) LIKE $1 OR lower(o.po_number) LIKE $1
           OR lower(coalesce(t.serial_number, '')) LIKE $1
         ORDER BY oi.updated_at DESC LIMIT 6`;

    const params = isInspector ? [searchTerm, userId] : [searchTerm];

    const [ordersRes, clientsRes, objectsRes, bapRes, lhppRes, issuesRes] = await Promise.all([
      query(orderSql, params),
      query(clientSql, params),
      query(objectSql, params),
      query(bapSql, params),
      query(lhppSql, params),
      query(issueSql, params)
    ]);

    const results = [];

    for (const r of ordersRes.rows) {
      results.push({
        category: 'PO / Order',
        type: 'ORDER',
        id: r.id,
        title: r.po_number ? `PO: ${r.po_number} (${r.order_no})` : `Order: ${r.order_no}`,
        subtitle: `${r.client_name} - Layanan: ${r.service_type}`,
        status: r.status,
        link: '/app/orders'
      });
    }

    for (const r of clientsRes.rows) {
      results.push({
        category: 'Klien',
        type: 'CLIENT',
        id: r.id,
        title: r.name,
        subtitle: r.address || 'Alamat belum diisi',
        status: r.is_active ? 'AKTIF' : 'NONAKTIF',
        link: '/app/clients'
      });
    }

    for (const r of objectsRes.rows) {
      results.push({
        category: 'Objek Uji K3',
        type: 'OBJECT',
        id: r.id,
        title: `${r.name} ${r.serial_number ? `(SN: ${r.serial_number})` : ''}`,
        subtitle: `Kategori: ${r.category_code} - Klien: ${r.client_name}`,
        status: 'TERDAFTAR',
        link: '/app/objects'
      });
    }

    for (const r of bapRes.rows) {
      results.push({
        category: 'Berita Acara (BAP)',
        type: 'BAP',
        id: r.id,
        title: r.bap_no,
        subtitle: `Objek: ${r.object_name} - Klien: ${r.client_name}`,
        status: r.status,
        link: '/app/bap'
      });
    }

    for (const r of lhppRes.rows) {
      results.push({
        category: 'Laporan LHPP',
        type: 'LHPP',
        id: r.id,
        title: r.lhpp_no || 'LHPP (Draf / Belum Bernomor)',
        subtitle: `Objek: ${r.object_name} - Klien: ${r.client_name}`,
        status: r.status,
        link: '/app/lhpp'
      });
    }

    for (const r of issuesRes.rows) {
      results.push({
        category: 'Kendala Operasional',
        type: 'ISSUE',
        id: r.id,
        title: `${r.issue_no}: ${r.title}`,
        subtitle: `${r.po_number || r.order_no} · ${r.client_name}${r.serial_number ? ` · ${r.serial_number}` : ''}`,
        status: r.status,
        link: `/app/issues?issueId=${r.id}`
      });
    }

    return res.json({
      query: q,
      total: results.length,
      results
    });
  } catch (err) {
    return next(err);
  }
});

export default router;

