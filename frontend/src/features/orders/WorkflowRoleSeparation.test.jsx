import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { StepPoSchedule } from './components/StepPoSchedule.jsx';
import { OrderDetailModal } from './components/OrderDetailModal.jsx';
import { ManagementDashboardView } from '../dashboard/components/ManagementDashboardView.jsx';

describe('URD Business Workflow & Role Separation Tests', () => {
  const sampleInspectors = [
    {
      id: 'insp-1',
      fullName: 'Ir. Budi Santoso',
      competencies: [{ isValid: true, categoryCode: 'PAPA' }]
    }
  ];

  it('StepPoSchedule: hides inspector assignment checkboxes and shows informative SOP notice for MARKETING', () => {
    const createForm = { requestedDate: '2026-11-10', inspectorIds: [], notes: '' };
    const setCreateForm = vi.fn();

    render(
      <StepPoSchedule
        createForm={createForm}
        setCreateForm={setCreateForm}
        inspectors={sampleInspectors}
        user={{ role: 'MARKETING' }}
      />
    );

    // Marketing sees the target date and the SOP note that Admin Kantor handles assignment
    expect(screen.getByText(/Target Tanggal Pemeriksaan Lapangan \(Permintaan Klien\)/i)).toBeDefined();
    expect(screen.getByText(/Alur Penugasan Ahli K3 & Jadwal Resmi/i)).toBeDefined();
    expect(screen.getAllByText(/Admin Kantor/i).length).toBeGreaterThan(0);

    // Marketing MUST NOT see inspector assignment checkboxes
    expect(screen.queryByText(/Tugaskan Inspector \/ Tim Ahli K3/i)).toBeNull();
  });

  it('StepPoSchedule: shows inspector assignment checkboxes for ADMIN_KANTOR', () => {
    const createForm = { requestedDate: '2026-11-10', inspectorIds: [], notes: '' };
    const setCreateForm = vi.fn();

    render(
      <StepPoSchedule
        createForm={createForm}
        setCreateForm={setCreateForm}
        inspectors={sampleInspectors}
        user={{ role: 'ADMIN_KANTOR' }}
      />
    );

    // Admin Kantor sees the assignment checkboxes
    expect(screen.getByText(/Tugaskan Inspector \/ Tim Ahli K3/i)).toBeDefined();
    expect(screen.getByText('Ir. Budi Santoso')).toBeDefined();
  });

  it('OrderDetailModal: displays Read-Only Monitoring view on Tab 2 for MARKETING without edit forms', async () => {
    const activeOrder = {
      id: 'ord-1',
      order_no: 'ORD/202611/0001',
      status: 'ORDER_BARU',
      requested_date: '2026-11-10'
    };
    const detailData = {
      order: activeOrder,
      schedule: null,
      assignments: [],
      objects: []
    };

    render(
      <BrowserRouter>
        <OrderDetailModal
          open={true}
          onClose={vi.fn()}
          activeOrder={activeOrder}
          detailData={detailData}
          canManage={true}
          canManageSchedule={false}
          canManageStatus={false}
          user={{ role: 'MARKETING' }}
          inspectors={sampleInspectors}
          scheduleConflicts={[]}
          scheduleForm={{ startAt: '', endAt: '', reason: '', notes: '' }}
          setScheduleForm={vi.fn()}
          selectedInspectorIds={[]}
          setSelectedInspectorIds={vi.fn()}
          statusNote=""
          setStatusNote={vi.fn()}
          rejectReason=""
          setRejectReason={vi.fn()}
          submitting={false}
          error=""
          setError={vi.fn()}
        />
      </BrowserRouter>
    );

    // Click tab Jadwal & Tim K3
    const tabBtn = screen.getByText(/Jadwal & Tim K3/i);
    tabBtn.click();

    // Verify Read-Only Notice for Marketing
    expect(await screen.findByText(/Mode Pemantauan Jadwal & Ahli K3/i)).toBeDefined();

    // Marketing MUST NOT see the buttons to save schedule or assign inspectors
    expect(screen.queryByText(/Simpan Jadwal Inspeksi/i)).toBeNull();
    expect(screen.queryByText(/Simpan Penugasan Ahli K3/i)).toBeNull();
  });

  it('ManagementDashboardView: renders dedicated Marketing Panel in right column without empty gap', () => {
    const sampleData = {
      metrics: {
        suketExpiring30d: 2,
        suketExpiring90d: 5,
        newOrders: 3,
        activeOrders: 4
      },
      recentOrders: [
        {
          id: 'ord-1',
          order_no: 'ORD/202611/0001',
          client_name: 'PT Aneka Kimia',
          status: 'TERDAFTAR',
          service_type: 'PEMERIKSAAN_BERKALA',
          created_at: new Date().toISOString()
        }
      ]
    };

    render(
      <BrowserRouter>
        <ManagementDashboardView
          user={{ role: 'MARKETING' }}
          data={sampleData}
          loadSummary={vi.fn()}
          refreshing={false}
          period="30D"
          setPeriod={vi.fn()}
        />
      </BrowserRouter>
    );

    // Verify right column elements for Marketing
    expect(screen.getByText(/Pengingat Suket \(Repeat Order\)/i)).toBeDefined();
    expect(screen.getByText(/PO Klien Terkini Dipantau/i)).toBeDefined();
    expect(screen.getByText(/Aksi Cepat Marketing/i)).toBeDefined();
    expect(screen.getByText('PT Aneka Kimia')).toBeDefined();
    expect(screen.getByText('ORD/202611/0001')).toBeDefined();
  });
});
