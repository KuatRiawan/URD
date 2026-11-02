import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  enqueueOfflineDraft,
  listOfflineDrafts,
  removeOfflineDraft,
  performAutoSync,
  getPendingSyncSummary
} from './offline-sync.js';

describe('Offline Sync Utility (PT Upaya Riksa Daya)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores and retrieves offline drafts via fallback when indexedDB is unavailable', async () => {
    const inspectionId = 'insp-test-001';
    const payload = {
      findings: [{ item: 'Visual check', result: 'BAIK' }],
      generalNotes: 'Pemeriksaan lapangan aman'
    };

    await enqueueOfflineDraft(inspectionId, payload);

    const drafts = await listOfflineDrafts();
    expect(drafts.length).toBeGreaterThanOrEqual(1);
    const found = drafts.find((d) => d.inspectionId === inspectionId);
    expect(found).toBeDefined();
    expect(found.payload.generalNotes).toBe('Pemeriksaan lapangan aman');

    const summary = await getPendingSyncSummary();
    expect(summary.pendingDraftsCount).toBeGreaterThanOrEqual(1);

    await removeOfflineDraft(inspectionId);
    const afterRemove = await listOfflineDrafts();
    const foundAfter = afterRemove.find((d) => d.inspectionId === inspectionId);
    expect(foundAfter).toBeUndefined();
  });

  it('auto-sync drains drafts to backend API instance and dispatches event', async () => {
    const inspectionId = 'insp-sync-002';
    const payload = { test: true };
    await enqueueOfflineDraft(inspectionId, payload);

    const mockApi = {
      put: vi.fn().mockResolvedValue({ data: { success: true } }),
      post: vi.fn().mockResolvedValue({ data: { success: true } })
    };

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const syncResult = await performAutoSync(mockApi);
    expect(syncResult.success).toBe(true);
    expect(syncResult.syncedDrafts).toBeGreaterThanOrEqual(1);
    expect(mockApi.put).toHaveBeenCalledWith(
      `/inspections/${inspectionId}/draft`,
      payload
    );

    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('retains failed items in queue when network error occurs and retries on subsequent sync', async () => {
    const inspectionId = 'insp-sync-fail-003';
    const payload = { testRetry: true };
    await enqueueOfflineDraft(inspectionId, payload);

    const failingApi = {
      put: vi.fn().mockRejectedValue(new Error('Network connection timeout')),
      post: vi.fn()
    };

    const firstResult = await performAutoSync(failingApi);
    expect(firstResult.success).toBe(true);
    expect(firstResult.syncedDrafts).toBe(0);
    expect(firstResult.errors.length).toBe(1);

    // Verify draft is STILL in queue (not dropped)
    const pendingAfterFailure = await listOfflineDrafts();
    const stillPresent = pendingAfterFailure.find((d) => d.inspectionId === inspectionId);
    expect(stillPresent).toBeDefined();

    // Now network recovers: succeeding API
    const succeedingApi = {
      put: vi.fn().mockResolvedValue({ data: { success: true } }),
      post: vi.fn()
    };

    const secondResult = await performAutoSync(succeedingApi);
    expect(secondResult.syncedDrafts).toBeGreaterThanOrEqual(1);

    // Verify draft is now removed from queue
    const pendingAfterRecovery = await listOfflineDrafts();
    const removedAfterRecovery = pendingAfterRecovery.find((d) => d.inspectionId === inspectionId);
    expect(removedAfterRecovery).toBeUndefined();
  });

  it('skips auto-sync when device is explicitly offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true
    });

    const mockApi = { put: vi.fn(), post: vi.fn() };
    const result = await performAutoSync(mockApi);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('offline');
    expect(mockApi.put).not.toHaveBeenCalled();

    // Restore online
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true
    });
  });
});

