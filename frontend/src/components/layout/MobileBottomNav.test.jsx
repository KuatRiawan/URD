import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MobileBottomNav } from './MobileBottomNav.jsx';
import { getMobileNavConfig } from './navConfig.js';

// Mock useAuth
vi.mock('../../app/providers/AuthProvider.jsx', () => ({
  useAuth: () => ({
    user: {
      id: 'mock-user-1',
      fullName: 'Budi Santoso',
      role: 'ADMIN_SISTEM',
      email: 'admin.sistem@upayariksadaya.com'
    }
  })
}));

describe('MobileBottomNav and MobileNavDrawer Integration', () => {
  it('opens the drawer, traps focus, and restores focus when closed', async () => {
    render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <MobileBottomNav />
      </MemoryRouter>
    );

    // Initial state: Drawer should not be visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click "Lainnya" tab
    const moreBtn = screen.getByRole('button', { name: /Tampilkan menu lainnya/i });
    expect(moreBtn).toBeInTheDocument();
    moreBtn.focus();
    fireEvent.click(moreBtn);

    // After click: Drawer dialog should open and be visible
    const dialog = screen.getByRole('dialog', { name: /Menu Lengkap Layanan PT Upaya Riksa Daya/i });
    expect(dialog).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement.getAttribute('aria-label')).toMatch(/Ubah tema tampilan/i));

    // Verify secondary menu items are rendered inside the drawer
    expect(screen.getByText(/Master Data & Klien/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Klien/i)).toBeInTheDocument();
    expect(screen.getByText(/Objek Uji K3/i)).toBeInTheDocument();

    // Click close button inside drawer
    const closeBtn = screen.getByRole('button', { name: /Tutup menu/i });
    fireEvent.click(closeBtn);

    // Drawer should now be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(moreBtn));
  });

  it('keeps four primary destinations and routes every role menu to a known page', () => {
    const knownRoutes = new Set([
      '/app/dashboard', '/app/orders', '/app/schedule', '/app/lhpp', '/app/inspections',
      '/app/issues', '/app/history', '/app/objects', '/app/clients', '/app/bap',
      '/app/distributions', '/app/suket', '/app/reminders', '/app/audit-logs',
      '/app/notifications', '/app/settings', '/app/users'
    ]);

    for (const role of ['ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN', 'ADMIN_SISTEM']) {
      const config = getMobileNavConfig(role);
      const routes = [
        ...config.primary.map(({ to }) => to),
        ...config.moreGroups.flatMap(({ items }) => items.map(({ to }) => to))
      ];
      expect(config.primary).toHaveLength(4);
      expect(new Set(routes).size).toBe(routes.length);
      expect(routes.every((route) => knownRoutes.has(route))).toBe(true);
    }
  });
});

