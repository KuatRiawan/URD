import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { SuperAdminDashboardView } from './components/SuperAdminDashboardView.jsx';
import { RbacMatrixTab } from '../users/components/RbacMatrixTab.jsx';
import { InspectorCompetencyTab } from '../users/components/InspectorCompetencyTab.jsx';
import { UserDetailDrawer } from '../users/components/UserDetailDrawer.jsx';
import { UserTable } from '../users/components/UserTable.jsx';
import { CompanyProfileSection } from '../settings/components/CompanyProfileSection.jsx';
import { DocumentNumberingSection } from '../settings/components/DocumentNumberingSection.jsx';
import { DatabaseBackupsSection } from '../settings/components/DatabaseBackupsSection.jsx';
import { GatewaysSection } from '../settings/components/GatewaysSection.jsx';
import { SystemInfoSection } from '../settings/components/SystemInfoSection.jsx';
import { EquipmentMasterSection } from '../settings/components/EquipmentMasterSection.jsx';
import { ChecklistBuilderSection } from '../settings/components/ChecklistBuilderSection.jsx';
import { api } from '../../lib/api/axios.js';

// Mock axios instance
vi.mock('../../lib/api/axios.js', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    patch: vi.fn()
  }
}));

describe('Super Admin Workspace Redesign Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. SuperAdminDashboardView', () => {
    const mockUser = {
      id: 'usr-admin-1',
      fullName: 'Super Administrator URD',
      role: 'ADMIN_SISTEM'
    };

    const mockDashboardData = {
      systemInfo: {
        databaseSize: '42.8 MB',
        totalBackups: 5
      },
      metrics: {
        totalUsers: 14,
        totalInspectors: 6,
        totalBackups: 5,
        totalAuditLogs: 1420
      },
      recentAudits: [
        {
          id: 'log-101',
          action: 'AUTH_LOGIN',
          created_at: new Date().toISOString(),
          user_name: 'Budi Santoso',
          user_role: 'ADMIN_SISTEM',
          summary: 'Login berhasil via web console internal',
          ip_address: '127.0.0.1'
        },
        {
          id: 'log-102',
          action: 'SETTINGS_UPDATE',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          user_name: 'Super Administrator URD',
          user_role: 'ADMIN_SISTEM',
          summary: 'Pembaruan template penomoran dokumen LHPP',
          ip_address: '127.0.0.1'
        }
      ]
    };

    it('renders system telemetry status, 4 high-signal stats cards, and administration hubs', () => {
      render(
        <BrowserRouter>
          <SuperAdminDashboardView
            user={mockUser}
            data={mockDashboardData}
            loadSummary={vi.fn()}
            refreshing={false}
          />
        </BrowserRouter>
      );

      // System Telemetry Header & Bar
      expect(screen.getByText(/(Ruang Kerja|Workspace) Administrasi Sistem & Keamanan/i)).toBeDefined();
      expect(screen.getByText(/PostgreSQL 16/i)).toBeDefined();
      expect(screen.getByText(/(Pemicu Tak Terubah|Immutable Trigger) Aktif/i)).toBeDefined();
      expect(screen.getByText(/42.8 MB/i)).toBeDefined();

      // 4 Metric cards
      expect(screen.getByText(/Pengguna Sistem & RBAC/i)).toBeDefined();
      expect(screen.getByText(/Ahli K3 & Lisensi SKP/i)).toBeDefined();
      expect(screen.getByText(/Master Bidang & Ceklis/i)).toBeDefined();
      expect(screen.getByText(/Rekam Jejak Audit/i)).toBeDefined();

      // 6 Administration Hub items
      expect(screen.getByText(/Manajemen Pengguna & RBAC/i)).toBeDefined();
      expect(screen.getByText(/Master 7 Bidang K3 & Ceklis/i)).toBeDefined();
      expect(screen.getByText(/Format Penomoran Dokumen/i)).toBeDefined();
      expect(screen.getByText(/Profil Resmi Lembaga PJK3/i)).toBeDefined();
      expect(screen.getByText(/WhatsApp Gateway & SMTP Email/i)).toBeDefined();
      expect(screen.getByText(/Pencadangan Database & Recovery/i)).toBeDefined();

      // Recent Activity
      expect(screen.getByText(/Aktivitas Audit & Keamanan Terkini/i)).toBeDefined();
      expect(screen.getByText(/Pembaruan template penomoran dokumen LHPP/i)).toBeDefined();
    });
  });

  describe('2. User Management, RBAC Matrix & Inspector Competency', () => {
    it('UserTable renders desktop table and mobile cards with correct role labels and actions', () => {
      const mockUsers = [
        {
          id: 'usr-1',
          fullName: 'Ahmad Fauzi',
          email: 'ahmad.f@urd.co.id',
          role: 'ADMIN_SISTEM',
          isActive: true,
          phone: '081234567890',
          lastLoginAt: new Date().toISOString()
        },
        {
          id: 'usr-2',
          fullName: 'Bambang Sudarsono',
          email: 'bambang.s@urd.co.id',
          role: 'PIMPINAN',
          isActive: false,
          phone: '081298765432',
          lastLoginAt: null
        }
      ];

      const onEdit = vi.fn();
      const onToggle = vi.fn();
      const onView = vi.fn();

      render(
        <UserTable
          users={mockUsers}
          onEditUser={onEdit}
          onToggleActive={onToggle}
          onViewUser={onView}
        />
      );

      // Verify names, emails, and roles
      expect(screen.getAllByText(/Ahmad Fauzi/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/bambang.s@urd.co.id/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Admin Sistem/i).length).toBeGreaterThan(0);

      // Trigger view button
      const viewButtons = screen.getAllByText(/Detail/i);
      fireEvent.click(viewButtons[0]);
      expect(onView).toHaveBeenCalledWith(mockUsers[0]);

      // Trigger edit button
      const editButtons = screen.getAllByText(/Ubah|Edit/i);
      fireEvent.click(editButtons[0]);
      expect(onEdit).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('RbacMatrixTab renders 5 roles across operational modules with security notices', () => {
      render(<RbacMatrixTab />);

      expect(screen.getByText(/Arsitektur Keamanan Peran & Hak Akses/i)).toBeDefined();
      expect(screen.getByText(/Integritas Keamanan Server-Side:/i)).toBeDefined();
      expect(screen.getByText(/Matriks Distribusi Hak Akses Antarmodul/i)).toBeDefined();

      // Check module categories & items
      expect(screen.getByText(/Operasional Lapangan & PO/i)).toBeDefined();
      expect(screen.getByText(/PO & Order Pemeriksaan/i)).toBeDefined();
      expect(screen.getByText(/Dokumen LHPP \(Laporan Riksa Uji\)/i)).toBeDefined();
      expect(screen.getByText(/Registri Suket K3 Disnaker/i)).toBeDefined();
    });

    it('InspectorCompetencyTab loads inspectors from API, renders SKP list, and opens modal', async () => {
      const mockInspectors = [
        {
          id: 'insp-1',
          fullName: 'Ir. Ahmad Zarkasih, M.T.',
          email: 'ahmad.z@urd.co.id',
          employeeNo: 'K3-2021-0089',
          isActive: true,
          competencies: [
            {
              id: 'comp-1',
              category_code: 'PAA',
              category_name: 'Pesawat Angkat & Pesawat Angkut',
              certificateNo: '5/102/AS.02.04/X/2023',
              validUntil: '2027-10-15',
              isValid: true
            }
          ]
        }
      ];

      api.get.mockResolvedValueOnce({ data: { items: mockInspectors } });

      render(<InspectorCompetencyTab />);

      // Await loading completion
      await waitFor(() => {
        expect(screen.getByText(/Ir. Ahmad Zarkasih, M.T./i)).toBeDefined();
      });

      expect(screen.getByText(/K3-2021-0089/i)).toBeDefined();
      expect(screen.getByText(/5\/102\/AS.02.04\/X\/2023/i)).toBeDefined();

      // Click tambah bidang
      const addBtn = screen.getByText(/Tambah Lisensi SKP/i);
      fireEvent.click(addBtn);

      // Verify modal is open
      expect(screen.getByText(/Tambah Lisensi SKP: Ir. Ahmad Zarkasih, M.T./i)).toBeDefined();
      expect(screen.getByText(/Nomor Surat Keputusan Penunjukan \(SKP\) \/ Sertifikat \*/i)).toBeDefined();
    });

    it('UserDetailDrawer renders user credentials, role badge, and inspector details if applicable', () => {
      const mockUser = {
        id: 'usr-99',
        fullName: 'Siti Rahmawati',
        email: 'siti.r@urd.co.id',
        role: 'ADMIN_KANTOR',
        isActive: true,
        phone: '081234567890',
        nip: 'ADM-2024-0012',
        createdAt: '2025-01-10T08:00:00Z',
        updatedAt: '2026-02-14T10:00:00Z'
      };

      const onClose = vi.fn();
      render(<UserDetailDrawer user={mockUser} open={true} onClose={onClose} onEdit={vi.fn()} />);

      expect(screen.getByText(/Dossier Akun Pengguna/i)).toBeDefined();
      expect(screen.getAllByText(/Siti Rahmawati/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/siti.r@urd.co.id/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Admin Kantor/i).length).toBeGreaterThan(0);

      // Trigger close
      const closeBtn = screen.getByLabelText(/Tutup panel detail/i);
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('3. Settings & Master Data Sections', () => {
    it('CompanyProfileSection displays legal identity, SKP PJK3, and live header preview', () => {
      const mockProfile = {
        company_name: 'PT UPAYA RIKSA DAYA',
        pjk3_license_no: 'KEP.543/BINWASK3-PNK3/VI/2023',
        address: 'Jl. Pemuda No. 45, Rawamangun, Jakarta Timur 13220',
        phone: '021-47869921',
        email: 'admin@urd.co.id',
        director_name: 'H. Bambang Sudarsono, S.T., M.M.'
      };

      const onSave = vi.fn((e) => e.preventDefault());
      render(
        <CompanyProfileSection
          companyForm={mockProfile}
          setCompanyForm={vi.fn()}
          handleSaveCompanyProfile={onSave}
          savingKey=""
        />
      );

      expect(screen.getByText(/Profil Resmi & Identitas Lembaga PJK3/i)).toBeDefined();
      expect(screen.getByDisplayValue(/PT UPAYA RIKSA DAYA/i)).toBeDefined();
      expect(screen.getByDisplayValue(/KEP.543\/BINWASK3-PNK3\/VI\/2023/i)).toBeDefined();
      expect(screen.getByText(/Pratinjau Kop Surat Dokumen \(Header Preview\)/i)).toBeDefined();
    });

    it('DocumentNumberingSection displays numbering formats and live dynamic token evaluator', () => {
      const mockNumbering = {
        order_prefix: 'PO-URD/{YEAR}/{MONTH}/{COUNTER}',
        assignment_prefix: 'ST-URD/{YEAR}/{ROMAN_MONTH}/{COUNTER}',
        bap_prefix: 'BAP/URD/{ROMAN_MONTH}/{YEAR}/{COUNTER}',
        lhpp_prefix: '{COUNTER}/INSP-{BIDANG_CODE}/PJK3-URD/{ROMAN_MONTH}/{YEAR}',
        suket_prefix: '566/{COUNTER}/DTKT/{YEAR}',
        bast_prefix: 'BAST-URD/{YEAR}/{MONTH}/{COUNTER}'
      };

      render(
        <DocumentNumberingSection
          numberingForm={mockNumbering}
          setNumberingForm={vi.fn()}
          handleSaveNumbering={vi.fn()}
          savingKey=""
        />
      );

      expect(screen.getByText(/Standar Format Penomoran Dokumen Otomatis/i)).toBeDefined();
      expect(screen.getByText(/Daftar Tag Token Dinamis yang Didukung:/i)).toBeDefined();
      expect(screen.getByText(/Pola Nomor Surat Tugas Ahli K3 \(ST\) \*/i)).toBeDefined();
      expect(screen.getAllByText(/Simulasi Hasil:/i).length).toBeGreaterThan(0);
    });

    it('DatabaseBackupsSection displays authentic PostgreSQL snapshot capabilities and DR runbook', () => {
      const mockBackups = [
        {
          id: 'bk-1',
          backup_code: 'URD-DB-20261103-020000',
          filename: 'urd_db_backup_20261103_020000.sql.gz',
          file_size_bytes: 42800000,
          created_at: '2026-11-03T02:00:00Z',
          status: 'COMPLETED',
          backup_type: 'SNAPSHOT_TRANSACTION',
          created_by_name: 'Super Admin'
        }
      ];

      const onCreateBackup = vi.fn();
      render(
        <DatabaseBackupsSection
          backups={mockBackups}
          creatingBackup={false}
          handleCreateBackup={onCreateBackup}
          handleDownloadBackup={vi.fn()}
        />
      );

      expect(screen.getByText(/Pencadangan Database & Manajemen Arsip SQL Relasional/i)).toBeDefined();
      expect(screen.getByText(/urd_db_backup_20261103_020000.sql.gz/i)).toBeDefined();

      const runbookToggle = screen.getByText(/Buka Panduan Teknis CLI/i);
      fireEvent.click(runbookToggle);

      expect(screen.getByText(/Runbook Pemulihan Database \(Disaster Recovery\)/i)).toBeDefined();
      expect(screen.getByText(/pg_restore -U postgres/i)).toBeDefined();

      const createBtn = screen.getByText(/Buat Snapshot Cadangan Sekarang/i);
      fireEvent.click(createBtn);
      expect(onCreateBackup).toHaveBeenCalled();
    });

    it('EquipmentMasterSection renders K3 categories and calibration tools CRUD interface', () => {
      const mockCategories = [
        {
          id: 1,
          code: 'PAA',
          name: 'Pesawat Angkat & Pesawat Angkut',
          default_bap_scopes: ['Pemeriksaan Visual', 'Pengujian Beban Kerja Aman (SWL)'],
          attribute_schema: [
            { key: 'kapasitas_angkut', label: 'Kapasitas Angkut (SWL)', required: true }
          ]
        }
      ];
      const mockTools = [
        {
          code: 'CAL-001',
          name: 'Ultrasonic Thickness Gauge',
          brand: 'Olympus 45MG',
          serialNo: 'SN-OLY-88412',
          category: 'PUBT',
          certNo: 'KAL/2025/KAN-0912',
          validUntil: '2027-08-15',
          validityStatus: 'VALID',
          daysRemaining: 280
        }
      ];

      render(
        <EquipmentMasterSection
          categories={mockCategories}
          calibrationTools={mockTools}
          onRefreshData={vi.fn()}
          onFeedback={vi.fn()}
          onError={vi.fn()}
        />
      );

      expect(screen.getByText(/Master 7 Kategori Objek Uji K3 & Skema Atribut Teknis/i)).toBeDefined();
      expect(screen.getAllByText(/Pesawat Angkat & Pesawat Angkut/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Registri Alat Ukur Riksa Uji & Sertifikat Kalibrasi KAN/i)).toBeDefined();
      expect(screen.getByText(/Ultrasonic Thickness Gauge/i)).toBeDefined();
    });

    it('ChecklistBuilderSection renders active template version, Copy-on-Write version controls, and items', () => {
      const mockCategory = {
        id: 1,
        code: 'PAA',
        name: 'Pesawat Angkat & Pesawat Angkut',
        active_version_id: 'ver-paa-1',
        active_version_code: 'PAA-TPL-V1',
        active_version_title: 'Checklist Riksa Uji PAA Standar Permenaker 08/2020'
      };
      const mockItems = [
        {
          id: 'item-1',
          version_id: 'ver-paa-1',
          section: 'Pemeriksaan Dokumen',
          label: 'Gambar Konstruksi / Manual Book',
          input_type: 'CHOICE',
          is_required: true,
          sort_order: 10
        }
      ];

      const onPublishVersion = vi.fn();
      render(
        <ChecklistBuilderSection
          checklistsData={{
            categories: [mockCategory],
            versions: [
              {
                id: 'ver-paa-1',
                category_id: 1,
                code: 'PAA-TPL-V1',
                title: 'Checklist Riksa Uji PAA Standar Permenaker 08/2020',
                version: 1,
                status: 'AKTIF'
              }
            ],
            items: mockItems
          }}
          selectedCategory={mockCategory}
          setSelectedCategory={vi.fn()}
          filteredItems={mockItems}
          onOpenCreateItem={vi.fn()}
          onOpenEditItem={vi.fn()}
          onDeleteItem={vi.fn()}
          onPublishNewVersion={onPublishVersion}
          publishingVersion={false}
        />
      );

      expect(screen.getByText(/Master 7 Bidang K3 & Dynamic Checklist Builder/i)).toBeDefined();
      expect(screen.getByText(/Gambar Konstruksi \/ Manual Book/i)).toBeDefined();
      const publishBtn = screen.getByText(/Terbitkan Versi Baru/i);
      fireEvent.click(publishBtn);
      expect(onPublishVersion).toHaveBeenCalled();
    });

    it('GatewaysSection provides real testing triggers for WhatsApp and SMTP', async () => {
      const mockWa = {
        api_url: 'https://api.fonnte.com/send',
        api_key: 'fonnte-secret-xyz',
        is_active: true
      };
      const mockSmtp = {
        host: 'smtp.mailgun.org',
        port: 587,
        username: 'postmaster@mg.urd.co.id',
        from: 'noreply@urd.co.id',
        is_active: true
      };

      const onTestWa = vi.fn();
      const onTestEmail = vi.fn();

      render(
        <GatewaysSection
          waForm={mockWa}
          setWaForm={vi.fn()}
          smtpForm={mockSmtp}
          setSmtpForm={vi.fn()}
          handleSaveGateways={vi.fn()}
          savingKey=""
          handleTestWhatsApp={onTestWa}
          handleTestEmail={onTestEmail}
          testingConnection=""
        />
      );

      expect(screen.getByText(/Gateway Notifikasi WhatsApp & Server Email SMTP/i)).toBeDefined();
      expect(screen.getByDisplayValue(/https:\/\/api.fonnte.com\/send/i)).toBeDefined();
      expect(screen.getByDisplayValue(/smtp.mailgun.org/i)).toBeDefined();

      const testButtons = screen.getAllByText(/Uji Koneksi/i);
      expect(testButtons.length).toBeGreaterThanOrEqual(2);

      // WhatsApp test button (first)
      fireEvent.click(testButtons[0]);
      expect(onTestWa).toHaveBeenCalled();

      // SMTP test button (second)
      fireEvent.click(testButtons[1]);
      expect(onTestEmail).toHaveBeenCalled();
    });

    it('SystemInfoSection renders technical telemetry, immutable triggers, and DB engine', () => {
      const mockSystemOverview = {
        systemInfo: {
          databaseVersion: 'PostgreSQL 16.2 on x86_64',
          databaseSize: '42.8 MB',
          totalTables: 28,
          totalBackups: 5
        }
      };

      render(<SystemInfoSection systemOverview={mockSystemOverview} />);

      expect(screen.getByText(/Keandalan Database & Integritas Data/i)).toBeDefined();
      expect(screen.getByText(/PostgreSQL 16.2 on x86_64/i)).toBeDefined();
      expect(screen.getByText(/trg_audit_logs_immutable \(Aktif\)/i)).toBeDefined();
      expect(screen.getByText(/Arsitektur Peran Sistem \(Separation of Duties\)/i)).toBeDefined();
      expect(screen.getByText(/ADMIN_SISTEM \(Super Admin\)/i)).toBeDefined();
    });
  });
});
