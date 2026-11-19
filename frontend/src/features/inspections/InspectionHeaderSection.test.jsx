import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InspectionHeaderSection } from './components/InspectionHeaderSection.jsx';

describe('InspectionHeaderSection Date Handling', () => {
  const dummyDetail = {
    inspection: {
      id: 'insp-123',
      order_no: 'PO-2026-001',
      po_number: 'PO-2026-001',
      object_name: 'Forklift Diesel 5T',
      equipment_type_name: 'Forklift',
      serial_number: 'FL-0982',
      client_name: 'PT Maju Terus',
      install_location: 'Gudang Cikarang',
      status: 'DRAF'
    }
  };

  it('renders safely when lastSavedAt is a native JavaScript Date object', () => {
    const testDate = new Date(2026, 10, 19, 14, 30, 0);
    render(
      <InspectionHeaderSection
        activeDetail={dummyDetail}
        lastSavedAt={testDate}
        isInspector={true}
        user={{ role: 'ADMIN_KANTOR' }}
      />
    );

    expect(screen.getByText(/Forklift/i)).toBeInTheDocument();
    expect(screen.getByText(/Tersimpan:/i)).toBeInTheDocument();
    // Verify it formatted into hours:minutes (e.g. 14:30 or 14.30)
    expect(screen.getByText(/14[:.]30/i)).toBeInTheDocument();
  });

  it('renders safely when lastSavedAt is an ISO string date', () => {
    render(
      <InspectionHeaderSection
        activeDetail={dummyDetail}
        lastSavedAt="2026-11-19T14:45:00.000Z"
        isInspector={true}
        user={{ role: 'ADMIN_KANTOR' }}
      />
    );

    expect(screen.getByText(/Tersimpan:/i)).toBeInTheDocument();
  });

  it('renders safely without Tersimpan badge when lastSavedAt is null', () => {
    render(
      <InspectionHeaderSection
        activeDetail={dummyDetail}
        lastSavedAt={null}
        isInspector={true}
        user={{ role: 'ADMIN_KANTOR' }}
      />
    );

    expect(screen.getByText(/Forklift/i)).toBeInTheDocument();
    expect(screen.queryByText(/Tersimpan:/i)).not.toBeInTheDocument();
  });
});

