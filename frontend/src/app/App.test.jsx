import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from './providers/AuthProvider.jsx';
import { AppRoutes } from './router.jsx';
import { api } from '../lib/api/axios.js';

vi.mock('../lib/api/axios.js', () => {
  const api = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  };
  return {
    api,
    setAccessToken: vi.fn(),
    setOnUnauthorized: vi.fn(),
    performRefresh: vi.fn(async () => {
      const res = await api.post('/auth/refresh');
      return res.data;
    }),
    getErrorMessage: (err) => err?.message || 'Terjadi kesalahan'
  };
});

describe('PT Upaya Riksa Daya Frontend Routing, Auth & Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects unauthenticated root path (/) directly to /login without public landing page', async () => {
    api.post.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /PT Upaya Riksa Daya/i })).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Masuk ke Sistem Operasional Pemeriksaan & Pengujian K3/i)
    ).toBeInTheDocument();
    expect(screen.getByAltText(/Logo Resmi PT Upaya Riksa Daya/i)).toBeInTheDocument();

    // Ensure forbidden product name SIRUK3 never appears
    expect(screen.queryByText(/SIRUK3/i)).not.toBeInTheDocument();

    // Ensure no demo accounts or default passwords are shown on the login page
    expect(screen.queryByText(/Password123/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Demo Account/i)).not.toBeInTheDocument();
  });

  it('validates empty login submission and toggles password visibility', async () => {
    api.post.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Masuk ke Sistem Internal/i })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Masuk ke Sistem Internal/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Masukkan alamat email kerja yang valid/i
    );

    const passwordInput = screen.getByLabelText(/Kata Sandi/i, { selector: 'input' });
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /Tampilkan kata sandi/i });
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('blocks unauthorized role from ADMIN_SISTEM route (/app/users) with 403 Akses Ditolak', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        accessToken: 'mock-jwt-token',
        user: {
          id: '11111111-1111-4111-8111-111111111113',
          fullName: 'Ir. Hendra Wijaya, ST',
          email: 'ahlik3.paa@upayariksadaya.com',
          role: 'AHLI_K3'
        }
      }
    });
    api.get.mockResolvedValue({ data: { items: [], unreadCount: 0 } });

    render(
      <MemoryRouter initialEntries={['/app/users']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Akses Ditolak/i })).toBeInTheDocument();
    });
  });

  it('renders all internal feature pages without blank screens when authenticated as ADMIN_SISTEM', async () => {
    const pagesToVerify = [
      { path: '/app/orders', heading: /PO & Order Pemeriksaan Riksa Uji K3/i },
      { path: '/app/schedule', heading: /Jadwal Pemeriksaan & Matriks Kompetensi Ahli K3/i },
      { path: '/app/inspections', heading: /Form Inspeksi Lapangan & Checklist K3/i },
      { path: '/app/bap', heading: /Berita Acara Riksa Uji \(BAP\)/i },
      { path: '/app/lhpp', heading: /Laporan Hasil Pemeriksaan dan Pengujian \(LHPP\)/i },
      { path: '/app/suket', heading: /Registri Surat Keterangan \(Suket\) K3/i },
      { path: '/app/history', heading: /Riwayat Pengujian Unit K3/i },
      { path: '/app/reminders', heading: /Pengingat Perpanjangan Unit K3, Suket & SKP Ahli K3/i },
      { path: '/app/users', heading: /Manajemen Pengguna Internal \(RBAC\)/i },
      { path: '/app/notifications', heading: /Pusat Notifikasi Operasional/i },
      { path: '/app/audit-logs', heading: /Log Audit Sistem \(Immutable Append-Only\)/i },
      { path: '/app/settings', heading: /Pengaturan/i }
    ];

    for (const page of pagesToVerify) {
      api.post.mockResolvedValueOnce({
        data: {
          accessToken: 'mock-admin-jwt',
          user: {
            id: '11111111-1111-4111-8111-111111111111',
            fullName: 'Budi Santoso',
            email: 'admin.sistem@upayariksadaya.com',
            role: 'ADMIN_SISTEM'
          }
        }
      });

      api.get.mockImplementation((url) => {
        if (url.startsWith('/reminders')) {
          return Promise.resolve({
            data: {
              unitReminders: [],
              missingValidityItems: [],
              suketItems: [],
              competencyItems: []
            }
          });
        }
        if (url.startsWith('/bap/scopes')) {
          return Promise.resolve({ data: { scopes: [] } });
        }
        if (url.startsWith('/objects/categories')) {
          return Promise.resolve({ data: { categories: [] } });
        }
        return Promise.resolve({
          data: { items: [], page: 1, limit: 50, total: 0, unreadCount: 0 }
        });
      });

      const { unmount } = render(
        <MemoryRouter initialEntries={[page.path]}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: page.heading })).toBeInTheDocument();
      });

      unmount();
    }
  });
});
