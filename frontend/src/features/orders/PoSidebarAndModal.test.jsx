import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SidebarNav } from '../../components/layout/SidebarNav.jsx';
import { getVisibleNav, PO_SUBMENUS } from '../../components/layout/navConfig.js';
import { CreatePoWizardModal } from './components/CreatePoWizardModal.jsx';

// Mock AuthProvider
vi.mock('../../app/providers/AuthProvider.jsx', () => ({
  useAuth: () => ({
    user: {
      id: 'mock-user-admin',
      fullName: 'Admin Kantor URD',
      role: 'ADMIN_KANTOR',
      email: 'admin.kantor@upayariksadaya.com'
    }
  })
}));

describe('PO Sidebar Dropdown & Modal Verification', () => {
  it('SidebarNav renders PO & Order Masuk with expandable submenus', () => {
    const navItems = getVisibleNav('ADMIN_KANTOR');
    const poItem = navItems.find((item) => item.to === '/app/orders');

    expect(poItem).toBeDefined();
    expect(poItem.label).toBe('PO & Order Masuk');
    expect(poItem.submenus).toHaveLength(6);

    render(
      <MemoryRouter initialEntries={['/app/orders?status=TERJADWAL']}>
        <SidebarNav items={navItems} />
      </MemoryRouter>
    );

    // Parent item is rendered
    const parentBtn = screen.getByRole('button', { name: /PO & Order Masuk/i });
    expect(parentBtn).toBeInTheDocument();
    expect(parentBtn).toHaveAttribute('aria-expanded', 'true');

    // All 6 submenus are visible
    expect(screen.getByRole('menuitem', { name: /Semua PO/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /PO Baru/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Terjadwal/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Diperiksa/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Tunggu Dokumen/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Selesai/i })).toBeInTheDocument();

    // Clicking parent button collapses the submenu
    fireEvent.click(parentBtn);
    expect(screen.queryByRole('menuitem', { name: /Semua PO/i })).not.toBeInTheDocument();

    // Clicking parent button again expands it
    fireEvent.click(parentBtn);
    expect(screen.getByRole('menuitem', { name: /Semua PO/i })).toBeInTheDocument();
  });

  it('CreatePoWizardModal renders with centered modal hierarchy and accessible footer', () => {
    const mockOnClose = vi.fn();
    const mockHandleWizardNext = vi.fn();
    const mockHandleCreateOrder = vi.fn();

    const createForm = {
      poNumber: 'PO-TEST-001',
      poDate: '2026-11-17',
      validFrom: '2026-11-17',
      validUntil: '2027-11-17',
      serviceType: 'PEMERIKSAAN_BERKALA',
      source: 'DOKUMEN_PO',
      clientId: '',
      objectIds: [],
      units: [],
      inspectorIds: []
    };

    render(
      <MemoryRouter>
        <CreatePoWizardModal
          open={true}
          onClose={mockOnClose}
          poWizardStep={1}
          setPoWizardStep={vi.fn()}
          createForm={createForm}
          setCreateForm={vi.fn()}
          clientMode="EXISTING"
          setClientMode={vi.fn()}
          clients={[]}
          clientObjects={[]}
          clientLocations={[]}
          clientContacts={[]}
          categories={[]}
          inspectors={[]}
          newUnitRow={{}}
          setNewUnitRow={vi.fn()}
          handleClientChange={vi.fn()}
          toggleObjectSelection={vi.fn()}
          handleAddInlineUnit={vi.fn()}
          removeInlineUnit={vi.fn()}
          handleOpenCsvImport={vi.fn()}
          handleWizardNext={mockHandleWizardNext}
          handleCreateOrder={mockHandleCreateOrder}
          submitting={false}
          error=""
          setError={vi.fn()}
        />
      </MemoryRouter>
    );

    // Dialog is visible
    const dialog = screen.getByRole('dialog', { name: /Buat Purchase Order \(PO\)/i });
    expect(dialog).toBeInTheDocument();

    // Header context & close button
    expect(screen.getByText(/Langkah 1 dari 5: Info PO & Layanan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tutup dialog/i })).toBeInTheDocument();

    // Content fields are rendered
    expect(screen.getByLabelText(/Nomor PO Pelanggan \(Opsional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tanggal PO \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Jenis Layanan Riksa Uji \*/i)).toBeInTheDocument();

    // Footer buttons: Batal and Lanjut
    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    const nextBtn = screen.getByRole('button', { name: /Lanjut/i });
    expect(cancelBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();

    // Clicking Lanjut fires next step handler
    fireEvent.click(nextBtn);
    expect(mockHandleWizardNext).toHaveBeenCalledTimes(1);

    // Clicking Batal fires close
    fireEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

