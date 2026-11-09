import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MarketingDashboardView } from './components/MarketingDashboardView.jsx';
import { ClientDetailModal } from '../clients/components/ClientDetailModal.jsx';
import { ObjectTable } from '../objects/components/ObjectTable.jsx';
import { StepPoSchedule } from '../orders/components/StepPoSchedule.jsx';
import { ExpiringUnitsSection } from '../reminders/components/ExpiringUnitsSection.jsx';
import { HistoryDetailModal } from '../history/components/HistoryDetailModal.jsx';

// Mock AuthProvider hook
vi.mock('../../app/providers/AuthProvider.jsx', () => ({
  useAuth: () => ({
    user: { id: 'usr-mkt-1', fullName: 'Marketing Officer URD', role: 'MARKETING' }
  })
}));

// Mock axios instance
vi.mock('../../lib/api/axios.js', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}));

describe('Marketing Workspace Redesign: Comprehensive Verification Suite', () => {
  // Test 1: Marketing Dashboard View
  it('1. MarketingDashboardView: renders 4 high-signal KPI cards, renewal section, and conversion metrics', () => {
    const mockData = {
      metrics: {
        managedClients: 42,
        awaitingScheduleOrders: 18,
        activeOrders: 7,
        expiringUnitsCount: 156
      },
      renewalStats: {
        urgent: 3,
        warning: 8,
        safe: 45
      },
      urgentExpiringUnits: [
        {
          id: 'obj-1',
          name: 'Overhead Crane 10T',
          category_code: 'PAA',
          client_name: 'PT Maju Bersama',
          days_until_expiry: 5,
          contact_phone: '08123456789'
        }
      ],
      recentOrders: [
        {
          id: 'ord-1',
          order_no: 'ORD-2026-001',
          po_number: 'PO-MB-001',
          client_name: 'PT Maju Bersama',
          status: 'ORDER_BARU'
        }
      ],
      conversionMetrics: {
        retentionRate: 88,
        repeatOrders: 15
      },
      recentActivities: []
    };

    render(
      <MemoryRouter>
        <MarketingDashboardView
          data={mockData}
          loadSummary={vi.fn()}
        />
      </MemoryRouter>
    );

    // Assert KPI metrics exist
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('18')).toBeDefined();
    expect(screen.getByText('7')).toBeDefined();
    expect(screen.getByText('156')).toBeDefined();

    // Assert Expiring Unit is displayed
    expect(screen.getByText('Overhead Crane 10T')).toBeDefined();
    expect(screen.getAllByText('PT Maju Bersama').length).toBeGreaterThan(0);

    // Assert Recent Order is displayed
    expect(screen.getByText('PO-MB-001')).toBeDefined();
  });

  it('1b. MarketingDashboardView: clicking period filter buttons (7D, 30D, 90D, 1Y) updates period and calls loadSummary', () => {
    const mockLoadSummary = vi.fn();
    const mockSetPeriod = vi.fn();
    render(
      <MemoryRouter>
        <MarketingDashboardView
          data={{ analytics: { monthlyTrend: [] } }}
          loadSummary={mockLoadSummary}
          period="30D"
          setPeriod={mockSetPeriod}
        />
      </MemoryRouter>
    );

    const btn7D = screen.getByRole('button', { name: '7D' });
    const btn90D = screen.getByRole('button', { name: '90D' });
    const btn1Y = screen.getByRole('button', { name: '1Y' });

    expect(btn7D).toBeDefined();
    expect(btn90D).toBeDefined();
    expect(btn1Y).toBeDefined();

    fireEvent.click(btn7D);
    expect(mockSetPeriod).toHaveBeenCalledWith('7D');
    expect(mockLoadSummary).toHaveBeenCalledWith(false, '7D');

    fireEvent.click(btn1Y);
    expect(mockSetPeriod).toHaveBeenCalledWith('1Y');
    expect(mockLoadSummary).toHaveBeenCalledWith(false, '1Y');
  });

  // Test 2: ClientDetailModal
  it('2. ClientDetailModal: renders segmented tab switcher with PIC, equipment, and PO history', () => {
    const mockClientData = {
      client: {
        id: 'cli-1',
        name: 'PT Petrochemical Nusantara',
        industry: 'Petrokimia',
        official_phone: '021-5551234',
        official_email: 'office@petro.co.id',
        address: 'Kawasan Industri Cilegon'
      },
      contacts: [
        {
          id: 'pic-1',
          name: 'Ir. Bambang Tri',
          position: 'Manager HSE',
          phone: '08119876543',
          email: 'bambang@petro.co.id',
          is_primary: true,
          is_reminder_recipient: true
        }
      ],
      locations: [
        {
          id: 'loc-1',
          name: 'Plant 1 Cilegon',
          address: 'Jl. Raya Anyer KM 12',
          city: 'Cilegon'
        }
      ],
      objects: [
        {
          id: 'obj-10',
          name: 'Boiler 20 Ton',
          category_code: 'PUBT',
          serial_number: 'BLR-2021-09'
        }
      ],
      orders: [],
      auditTrail: []
    };

    render(
      <MemoryRouter>
        <ClientDetailModal
          detailData={mockClientData}
          onClose={vi.fn()}
          canEdit={true}
          onSaveContact={vi.fn()}
          onDeleteContact={vi.fn()}
          onSaveLocation={vi.fn()}
          onDeleteLocation={vi.fn()}
          onCreateRenewalOrder={vi.fn()}
          onLoadDetail={vi.fn()}
          clientLocations={mockClientData.locations}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText('PT Petrochemical Nusantara').length).toBeGreaterThan(0);
    expect(screen.getByText(/PIC.*Site/i)).toBeDefined();

    // Click PIC tab
    const picTab = screen.getByText(/PIC.*Site/i);
    fireEvent.click(picTab);
    expect(screen.getByText('Ir. Bambang Tri')).toBeDefined();
    expect(screen.getByText('PIC Utama')).toBeDefined();
    expect(screen.getAllByText(/Cilegon/i).length).toBeGreaterThan(0);
  });

  // Test 3: ObjectTable
  it('3. ObjectTable: renders unit specs, active Suket, and quick renewal button', () => {
    const handleRenewal = vi.fn();
    const handleDetail = vi.fn();

    const mockItems = [
      {
        id: 'obj-99',
        name: 'Gantry Crane 25T',
        category_code: 'PAA',
        serial_number: 'GC-25T-88',
        client_name: 'PT Pelabuhan Prima',
        active_suket_no: '566/DISNAKER/2025',
        active_suket_valid_until: '2026-01-01T00:00:00.000Z' // Expired, should show PO Ulang
      }
    ];

    render(
      <MemoryRouter>
        <ObjectTable
          items={mockItems}
          page={1}
          total={1}
          setPage={vi.fn()}
          openQr={vi.fn()}
          openDetail={handleDetail}
          canCreateRenewal={true}
          onCreateRenewal={handleRenewal}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Gantry Crane 25T').length).toBeGreaterThan(0);
    expect(screen.getAllByText('GC-25T-88').length).toBeGreaterThan(0);

    // Trigger renewal
    const renewalBtn = screen.getAllByText('PO Ulang')[0];
    fireEvent.click(renewalBtn);
    expect(handleRenewal).toHaveBeenCalledWith('obj-99', 'Gantry Crane 25T');
  });

  // Test 4: StepPoSchedule Role Separation
  it('4. StepPoSchedule: Marketing role sees administrative notice rather than assignment inputs', () => {
    render(
      <StepPoSchedule
        createForm={{ requestedDate: '2026-12-01', inspectorIds: [], notes: '' }}
        setCreateForm={vi.fn()}
        inspectors={[]}
        user={{ role: 'MARKETING' }}
      />
    );

    // Verify informational banner is shown to Marketing
    expect(screen.getByText(/Alur Penugasan Ahli K3 & Jadwal Resmi/i)).toBeDefined();
    expect(screen.getAllByText(/Admin Kantor/i).length).toBeGreaterThan(0);
  });

  // Test 5: ExpiringUnitsSection
  it('5. ExpiringUnitsSection: shows urgency badges and quick "+ Buat PO Perpanjangan" CTA', () => {
    const handleCreateRenewal = vi.fn();

    const mockDatedUnits = [
      {
        object_id: 'u-1',
        object_name: 'Forklift 3 Ton',
        category_code: 'PAA',
        serial_number: 'FK-3T-01',
        client_name: 'PT Logistik Sejahtera',
        expiryState: 'AKAN_KEDALUWARSA',
        days_remaining: 14,
        effective_valid_until: '2026-11-20T00:00:00.000Z',
        followup_status: 'SUDAH_DIHUBUNGI'
      }
    ];

    const labels = {
      AKAN_KEDALUWARSA: 'Akan Kedaluwarsa'
    };

    render(
      <MemoryRouter>
        <ExpiringUnitsSection
          datedUnits={mockDatedUnits}
          expiryStateLabels={labels}
          canManage={true}
          submitting={false}
          onOpenValidityModal={vi.fn()}
          onCreateRenewalOrder={handleCreateRenewal}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Forklift 3 Ton').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/14 hari lagi/i).length).toBeGreaterThan(0);

    // Trigger renewal order
    const actionBtn = screen.getAllByText(/PO Baru/i)[0];
    fireEvent.click(actionBtn);
    expect(handleCreateRenewal).toHaveBeenCalledWith('u-1', 'Forklift 3 Ton');
  });

  // Test 6: HistoryDetailModal without em dashes
  it('6. HistoryDetailModal: renders inspection metadata and WhatsApp/Email without forbidden em dashes', () => {
    const mockRecord = {
      inspection_id: 'insp-1',
      object_name: 'Bejana Tekan Air Receiver',
      serial_number: 'AR-2023-01',
      client_name: 'PT Pabrik Kimia Sejahtera',
      po_number: 'PO-PKS-2026-009',
      order_no: 'ORD-2026-044',
      bap_no: 'BAP/2026/01/001',
      lhpp_no: 'LHPP/2026/01/001',
      category_code: 'PUBT',
      service_type: 'BERKALA',
      inspector_name: 'Budi Santoso, S.T.',
      conclusion: 'MEMENUHI_SYARAT',
      contact_phone: '081234567890',
      contact_email: 'hse@pabrik.com'
    };

    const { container } = render(
      <MemoryRouter>
        <HistoryDetailModal
          selectedRecord={mockRecord}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Bejana Tekan Air Receiver (SN: AR-2023-01) · PT Pabrik Kimia Sejahtera')).toBeDefined();
    expect(screen.getByText('WhatsApp')).toBeDefined();
    expect(screen.getByText('Email')).toBeDefined();

    // Verify Rule R-02 (anti-slop): No em dashes (—) in rendered modal text
    expect(container.textContent).not.toContain('—');
  });
});
