import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MobileBottomNav } from './MobileBottomNav.jsx';

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
  it('opens drawer when Lainnya button is clicked and closes on close button', () => {
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
    fireEvent.click(moreBtn);

    // After click: Drawer dialog should open and be visible
    const dialog = screen.getByRole('dialog', { name: /Menu Lengkap Layanan PT Upaya Riksa Daya/i });
    expect(dialog).toBeInTheDocument();

    // Verify secondary menu items are rendered inside the drawer
    expect(screen.getByText(/Master Data & Klien/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Klien/i)).toBeInTheDocument();
    expect(screen.getByText(/Objek Uji K3/i)).toBeInTheDocument();

    // Click close button inside drawer
    const closeBtn = screen.getByRole('button', { name: /Tutup menu/i });
    fireEvent.click(closeBtn);

    // Drawer should now be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

