import { describe, expect, it, vi } from 'vitest';
import { canAccessBap } from '../modules/bap/routes.js';
import { canAccessLhpp } from '../modules/lhpp/routes.js';

const inspectorId = '11111111-1111-4111-8111-111111111111';
const assignedInspectorId = '22222222-2222-4222-8222-222222222222';
const orderId = '33333333-3333-4333-8333-333333333333';

describe('ownership dokumen teknis', () => {
  it.each([
    ['LHPP', canAccessLhpp],
    ['BAP', canAccessBap]
  ])('%s menolak akses berdasarkan kemiripan identitas tanpa assignment', async (_label, canAccess) => {
    const db = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const allowed = await canAccess(db, {
      inspector_id: assignedInspectorId,
      order_id: orderId
    }, {
      id: inspectorId,
      role: 'INSPECTOR',
      fullName: 'Nama yang sama',
      phone: '081234567890',
      email: 'hendra@example.test'
    });

    expect(allowed).toBe(false);
    expect(db.query).toHaveBeenCalledOnce();
    expect(db.query.mock.calls[0][0]).not.toMatch(/full_name|split_part|u1\.phone/);
    expect(db.query.mock.calls[0][1]).toEqual([orderId, inspectorId]);
  });

  it.each([
    ['LHPP', canAccessLhpp],
    ['BAP', canAccessBap]
  ])('%s mengizinkan Inspector yang memiliki assignment aktif', async (_label, canAccess) => {
    const db = { query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }) };
    const allowed = await canAccess(db, {
      inspector_id: assignedInspectorId,
      order_id: orderId
    }, { id: inspectorId, role: 'INSPECTOR' });

    expect(allowed).toBe(true);
    expect(db.query.mock.calls[0][1]).toEqual([orderId, inspectorId]);
  });
});
