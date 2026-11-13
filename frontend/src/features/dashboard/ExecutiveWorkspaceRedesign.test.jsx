import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView.jsx';
import { OrderTable } from '../orders/components/OrderTable.jsx';
import { ScheduleAgendaSection } from '../scheduling/components/ScheduleAgendaSection.jsx';
import { InspectorCompetencySection } from '../scheduling/components/InspectorCompetencySection.jsx';
import { getVisibleNav, getMobileNavConfig } from '../../components/layout/navConfig.js';

describe('Executive Management Workspace Redesign Tests', () => {
  const mockSummary = {
    activeClients: 12,
    activeObjects: 45,
    totalOrders: 30,
    newOrders: 4,
    activeOrders: 15,
    completedOrders: 11,
    avgCompletionHours: 36,
    lhppWaitingReview: 3,
    lhppPublished: 24,
    lhppReturned: 1,
    suketExpiring30d: 2,
    suketExpiring90d: 5,
    overdueUnits: 0,
    totalUnits: 50,
    waitingInspectionUnits: 8,
    inspectingUnits: 12,
    revisionUnits: 2,
    completedUnits: 28,
    openIssues: 3,
    highPriorityIssues: 1,
    documentPipeline: {
      bapDraft: 4,
      bapFinal: 26,
      lhppDraft: 2,
      lhppReview: 3,
      lhppFinal: 25,
      suketSubmitted: 5,
      suketIssued: 20
    },
    analytics: {
      monthlyTrend: [
        { label: 'Jan', orders: 10, units: 25, completedUnits: 20 },
        { label: 'Feb', orders: 15, units: 35, completedUnits: 30 }
      ],
      regionalMapping: [
        { region: 'DKI Jakarta', count: 18, percentage: 60 }
      ]
    },
    inspectorWorkload: [
      { id: 'insp-1', name: 'Ir. Budi', activeOrders: 2, completedOrders: 10, totalUnitsAssigned: 5 }
    ],
    recentOrders: [
      {
        id: 'ord-1',
        po_number: 'PO-URD-2026-001',
        order_no: 'ORD-001',
        client_name: 'PT Petro Kimia Nusantara',
        service_type: 'BARU',
        status: 'DALAM_PROSES',
        object_count: 5,
        unitProgress: { completed: 3, totalUnits: 5 }
      }
    ],
    recentActivities: [
      {
        id: 'act-1',
        title: 'LHPP Diterbitkan',
        summary: 'LHPP untuk unit Overhead Crane telah disahkan.',
        created_at: new Date().toISOString()
      },
      {
        id: 'act-2',
        action: 'LOGIN',
        entity: 'USER',
        user_name: 'Kuat',
        user_role: 'PIMPINAN',
        summary: { role: 'PIMPINAN', email: 'pimpinan@upayariksadaya.com' },
        created_at: new Date().toISOString()
      }
    ]
  };

  it('ExecutiveDashboardView: renders executive summary KPIs, health badge, and perspective tabs', () => {
    render(
      <BrowserRouter>
        <ExecutiveDashboardView
          data={{ metrics: mockSummary, ...mockSummary }}
          loadSummary={vi.fn()}
          onNewOrder={vi.fn()}
        />
      </BrowserRouter>
    );

    // Health Badge (shows Perhatian Diperlukan because openIssues = 3)
    expect(screen.getByText(/Perhatian Diperlukan/i)).toBeDefined();

    // 4 Core Executive Metric Cards
    expect(screen.getByText(/PO Aktif Diproses/i)).toBeDefined();
    expect(screen.getByText(/Unit Sedang Riksa Uji/i)).toBeDefined();
    expect(screen.getAllByText(/Unit Perlu Revisi/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Suket Habis/i)).toBeDefined();

    // Pipeline Tracker
    expect(screen.getByText(/Jalur Siklus Operasional Unit & Dokumen/i)).toBeDefined();

    // Perspective Navigation Tabs
    expect(screen.getByText(/Ringkasan Eksekutif/i)).toBeDefined();
    expect(screen.getByText(/Monitoring PO & Unit/i)).toBeDefined();
    expect(screen.getByText(/Beban Kerja Tim K3/i)).toBeDefined();
    expect(screen.getByText(/Dokumen & Kepatuhan/i)).toBeDefined();
    expect(screen.getByText(/Jejak Aktivitas/i)).toBeDefined();
  });

  it('ExecutiveDashboardView: switches tabs cleanly without error', () => {
    render(
      <BrowserRouter>
        <ExecutiveDashboardView
          data={{ metrics: mockSummary, ...mockSummary }}
          loadSummary={vi.fn()}
          onNewOrder={vi.fn()}
        />
      </BrowserRouter>
    );

    // Switch to ORDERS tab
    fireEvent.click(screen.getByText(/Monitoring PO & Unit/i));
    expect(screen.getByText('PT Petro Kimia Nusantara')).toBeDefined();
    expect(screen.getByText(/3 \/ 5 Unit Selesai/i)).toBeDefined();

    // Switch to WORKLOAD tab
    fireEvent.click(screen.getByText(/Beban Kerja Tim K3/i));
    expect(screen.getByText('Ir. Budi')).toBeDefined();
    expect(screen.getByText(/5 Unit/i)).toBeDefined();

    // Switch to DOCUMENTS tab
    fireEvent.click(screen.getByText(/Dokumen & Kepatuhan/i));
    expect(screen.getByText(/Berita Acara \(BAP\)/i)).toBeDefined();
    expect(screen.getByText(/Laporan LHPP/i)).toBeDefined();
    expect(screen.getByText(/Suket K3 Disnaker/i)).toBeDefined();
    expect(screen.getByText(/Distribusi & BAST/i)).toBeDefined();

    // Switch to ACTIVITIES tab
    fireEvent.click(screen.getByText(/Jejak Aktivitas/i));
    expect(screen.getByText(/LHPP Diterbitkan/i)).toBeDefined();
    expect(screen.getByText(/Masuk ke sistem/i)).toBeDefined();
    expect(screen.getByText(/Akun: pimpinan@upayariksadaya\.com/i)).toBeDefined();
  });

  it('navConfig: exposes complete Pimpinan/Manager routes including inspections and history', () => {
    const desktopNav = getVisibleNav('PIMPINAN');
    const paths = desktopNav.map((item) => item.to);
    expect(paths).toContain('/app/dashboard');
    expect(paths).toContain('/app/orders');
    expect(paths).toContain('/app/schedule');
    expect(paths).toContain('/app/inspections');
    expect(paths).toContain('/app/issues');
    expect(paths).toContain('/app/objects');
    expect(paths).toContain('/app/clients');
    expect(paths).toContain('/app/lhpp');
    expect(paths).toContain('/app/bap');
    expect(paths).toContain('/app/suket');
    expect(paths).toContain('/app/reminders');
    expect(paths).toContain('/app/distributions');
    expect(paths).toContain('/app/history');
    expect(paths).toContain('/app/audit-logs');
    expect(paths).toContain('/app/settings');

    const mobileNav = getMobileNavConfig('MANAGER');
    const allMobilePaths = [
      ...mobileNav.primary.map((i) => i.to),
      ...mobileNav.moreGroups.flatMap((g) => g.items.map((i) => i.to))
    ];
    expect(allMobilePaths).toContain('/app/inspections');
    expect(allMobilePaths).toContain('/app/history');
  });

  it('OrderTable: renders visual unit progress bar and completion percentage', () => {
    const orders = [
      {
        id: 'ord-10',
        po_number: 'PO-TEST-001',
        order_no: 'ORD-010',
        client_name: 'PT Multi Structure',
        service_type: 'BERKALA',
        status: 'DALAM_PROSES',
        object_count: 4,
        unitProgress: { completed: 2, totalUnits: 4 }
      }
    ];

    render(
      <BrowserRouter>
        <OrderTable
          orders={orders}
          openOrderDetail={vi.fn()}
          handleDownloadAssignmentPdf={vi.fn()}
          handleDownloadBastPdf={vi.fn()}
          page={1}
          limit={15}
          total={1}
          onPageChange={vi.fn()}
          user={{ role: 'PIMPINAN' }}
        />
      </BrowserRouter>
    );

    // Verifies unit progress display
    expect(screen.getAllByText(/2 \/ 4 Unit Selesai/i).length).toBeGreaterThan(0);
    expect(screen.getByText('50%')).toBeDefined();
  });

  it('ScheduleAgendaSection: renders executive agenda metrics and status tabs', () => {
    const schedules = [
      {
        id: 'sch-1',
        order_no: 'ORD-001',
        order_status: 'TERJADWAL',
        client_name: 'PT Semen Indonesia',
        start_at: '2026-11-15T08:00:00Z',
        end_at: '2026-11-15T16:00:00Z',
        assignments: [{ id: 'asg-1', fullName: 'Ir. Budi', status: 'DITERIMA' }]
      },
      {
        id: 'sch-2',
        order_no: 'ORD-002',
        order_status: 'TERJADWAL',
        client_name: 'PT Waskita',
        start_at: '2026-11-16T08:00:00Z',
        end_at: '2026-11-16T16:00:00Z',
        assignments: [{ id: 'asg-2', fullName: 'Drs. Agus', status: 'DITOLAK' }]
      }
    ];

    render(
      <BrowserRouter>
        <ScheduleAgendaSection schedules={schedules} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Agenda Jadwal Pemeriksaan Lapangan \(2\)/i)).toBeDefined();
    expect(screen.getByText('2 Order')).toBeDefined(); // Total Terjadwal
    expect(screen.getAllByText('1 Order').length).toBeGreaterThan(0); // Siap Uji & Re-alokasi
  });

  it('InspectorCompetencySection: categorizes active, expiring, and expired licenses', () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 60 * 86400000).toISOString();
    const expiringDate = new Date(now.getTime() + 10 * 86400000).toISOString();
    const pastDate = new Date(now.getTime() - 10 * 86400000).toISOString();

    const inspectors = [
      {
        id: 'insp-1',
        fullName: 'Ir. Ahmad Zarkasi',
        email: 'ahmad@example.test',
        competencies: [
          { id: 'c-1', categoryCode: 'PAA', certificateNo: 'SKP-PAA-001', validUntil: futureDate, isValid: true },
          { id: 'c-2', categoryCode: 'PUBT', certificateNo: 'SKP-PUBT-002', validUntil: expiringDate, isValid: true },
          { id: 'c-3', categoryCode: 'ELEVATOR', certificateNo: 'SKP-ELV-003', validUntil: pastDate, isValid: false }
        ]
      }
    ];

    render(
      <InspectorCompetencySection
        inspectors={inspectors}
        canManage={false}
        onOpenAddCompetency={vi.fn()}
        onDeleteCompetency={vi.fn()}
      />
    );

    expect(screen.getByText(/Matriks Kesiapan & SKP Penunjukan Ahli K3/i)).toBeDefined();
    expect(screen.getByText('Aktif')).toBeDefined();
    expect(screen.getByText(/Segera Habis/i)).toBeDefined();
    expect(screen.getByText('Kedaluwarsa')).toBeDefined();
  });
});
