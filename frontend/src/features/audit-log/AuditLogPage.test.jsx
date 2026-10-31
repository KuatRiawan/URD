import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditLogPage } from './AuditLogPage.jsx';
import { api } from '../../lib/api/axios.js';

vi.mock('../../lib/api/axios.js', () => ({
  api: { get: vi.fn() }
}));

describe('AuditLogPage', () => {
  it('renders a role object from audit data without crashing', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        items: [{
          id: 'log-1',
          action: 'LOGIN_SUCCESS',
          entity: 'users',
          summary: 'Pengguna masuk',
          created_at: '2026-10-31T10:00:00.000Z',
          user_name: 'Kuat Riawan',
          user_email: 'pimpinan@example.test',
          user_role: { role: 'PIMPINAN', email: 'pimpinan@example.test' }
        }],
        total: 1
      }
    });

    render(<AuditLogPage />);

    expect(await screen.findAllByText(/Pimpinan \/ Manager/)).toHaveLength(2);
    expect(screen.getAllByText('Pengguna masuk')).toHaveLength(2);
  });
});
