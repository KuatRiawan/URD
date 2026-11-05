import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { getVisibleNav, getMobileNavConfig } from '../../components/layout/navConfig.js';
import { BapDetailModal } from '../bap/components/BapDetailModal.jsx';
import { DistributionTable } from '../distributions/components/DistributionTable.jsx';

describe('Admin Kantor Workspace V2 UI & Workflow Verification', () => {
  it('1. menyertakan rute /app/inspections (Tinjauan Hasil Inspeksi) pada menu navigasi desktop dan mobile ADMIN_KANTOR', () => {
    const desktopNav = getVisibleNav('ADMIN_KANTOR');
    const inspectionItem = desktopNav.find((item) => item.to === '/app/inspections');
    expect(inspectionItem).toBeDefined();
    expect(inspectionItem.label).toContain('Tinjauan Hasil Inspeksi');

    const mobileNav = getMobileNavConfig('ADMIN_KANTOR');
    const allMobileItems = [
      ...mobileNav.primary,
      ...mobileNav.moreGroups.flatMap((g) => g.items)
    ];
    expect(allMobileItems.some((item) => item.to === '/app/inspections')).toBe(true);
  });

  it('2. BapDetailModal menampilkan tombol Finalisasi BAP untuk ADMIN_KANTOR saat LHPP sudah FINAL dan menyembunyikannya untuk INSPECTOR', () => {
    const baseBap = {
      id: 'bap-1',
      bap_no: '0001/BAP-PAA/URD/XI/2026',
      status: 'DRAF',
      version: 1,
      object_name: 'Overhead Crane 10 Ton',
      category_code: 'PAA',
      category_name: 'Pesawat Angkat dan Angkut',
      client_name: 'PT Industri Baja Nusantara',
      serial_number: 'SN-PAA-001',
      po_number: 'PO-2026-001',
      order_no: 'ORD-2026-001',
      lhpp_id: 'lhpp-1',
      lhpp_status: 'FINAL',
      inspector_sig_file_id: 'sig-1',
      client_sig_file_id: 'sig-2',
      revisions: [
        {
          id: 'rev-1',
          version: 1,
          action: 'CREATED_FROM_LHPP',
          reason: 'Dibuat otomatis saat LHPP difinalisasi',
          actor_name: 'Admin Kantor',
          created_at: '2026-11-05T08:00:00Z'
        }
      ]
    };

    const noop = vi.fn();

    // Render sebagai ADMIN_KANTOR (canFinalize = true)
    const { unmount } = render(
      <MemoryRouter>
        <BapDetailModal
          selectedBap={baseBap}
          onClose={noop}
          detailLoading={false}
          feedback={null}
          canManage={true}
          canFinalize={true}
          draftForm={{
            inspectionDate: '2026-11-05',
            scopeItems: ['Pemeriksaan Visual'],
            isCompliant: true,
            inspectionNotes: 'Aman'
          }}
          setDraftForm={noop}
          toggleScopeItem={noop}
          scopeCatalog={['Pemeriksaan Visual']}
          handleSaveDraft={noop}
          sigForm={{ signerRole: 'AHLI_K3', signerName: 'Budi', signerTitle: 'Ahli K3' }}
          setSigForm={noop}
          handleSaveSignature={noop}
          handleFinalizeBap={noop}
          reopenReason=""
          setReopenReason={noop}
          handleReopenBap={noop}
          handlePreviewPdf={noop}
          handleDownloadPdf={noop}
          handleDownloadDocx={noop}
          handleDownloadBatchPoPdf={noop}
          submitting={false}
          navigate={noop}
        />
      </MemoryRouter>
    );

    const finalizeBtn = screen.getByRole('button', {
      name: /Finalisasi & Kunci Berita Acara Riksa Uji \(BAP\)/i
    });
    expect(finalizeBtn).toBeInTheDocument();
    expect(finalizeBtn).not.toBeDisabled();
    expect(screen.getAllByText(/Versi #1/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Riwayat Versi & Revisi BAP/i)).toBeInTheDocument();
    unmount();

    // Render sebagai INSPECTOR (canFinalize = false) -> tombol Finalisasi BAP tidak boleh muncul
    render(
      <MemoryRouter>
        <BapDetailModal
          selectedBap={baseBap}
          onClose={noop}
          detailLoading={false}
          feedback={null}
          canManage={true}
          canFinalize={false}
          draftForm={{
            inspectionDate: '2026-11-05',
            scopeItems: ['Pemeriksaan Visual'],
            isCompliant: true,
            inspectionNotes: 'Aman'
          }}
          setDraftForm={noop}
          toggleScopeItem={noop}
          scopeCatalog={['Pemeriksaan Visual']}
          handleSaveDraft={noop}
          sigForm={{ signerRole: 'AHLI_K3', signerName: 'Budi', signerTitle: 'Ahli K3' }}
          setSigForm={noop}
          handleSaveSignature={noop}
          handleFinalizeBap={noop}
          reopenReason=""
          setReopenReason={noop}
          handleReopenBap={noop}
          handlePreviewPdf={noop}
          handleDownloadPdf={noop}
          handleDownloadDocx={noop}
          handleDownloadBatchPoPdf={noop}
          submitting={false}
          navigate={noop}
        />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole('button', {
        name: /Finalisasi & Kunci Berita Acara Riksa Uji \(BAP\)/i
      })
    ).toBeNull();
  });

  it('3. BapDetailModal menonaktifkan tombol Finalisasi BAP jika LHPP masih SIAP_PREVIEW (belum FINAL)', () => {
    const noop = vi.fn();
    render(
      <MemoryRouter>
        <BapDetailModal
          selectedBap={{
            id: 'bap-2',
            bap_no: '0002/BAP-PUBT/URD/XI/2026',
            status: 'DRAF',
            version: 1,
            object_name: 'Steam Boiler 5 Ton',
            category_code: 'PUBT',
            category_name: 'Pesawat Uap dan Bejana Tekan',
            client_name: 'PT Energi Nusantara',
            lhpp_id: 'lhpp-2',
            lhpp_status: 'SIAP_PREVIEW'
          }}
          onClose={noop}
          detailLoading={false}
          feedback={null}
          canManage={true}
          canFinalize={true}
          draftForm={{
            inspectionDate: '2026-11-05',
            scopeItems: ['Pemeriksaan Visual'],
            isCompliant: true,
            inspectionNotes: ''
          }}
          setDraftForm={noop}
          toggleScopeItem={noop}
          scopeCatalog={['Pemeriksaan Visual']}
          handleSaveDraft={noop}
          sigForm={{ signerRole: 'AHLI_K3', signerName: '', signerTitle: '' }}
          setSigForm={noop}
          handleSaveSignature={noop}
          handleFinalizeBap={noop}
          reopenReason=""
          setReopenReason={noop}
          handleReopenBap={noop}
          handlePreviewPdf={noop}
          handleDownloadPdf={noop}
          handleDownloadDocx={noop}
          handleDownloadBatchPoPdf={noop}
          submitting={false}
          navigate={noop}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Urutan Dokumen Wajib:/i)).toBeInTheDocument();
    const finalizeBtn = screen.getByRole('button', {
      name: /Finalisasi & Kunci Berita Acara Riksa Uji \(BAP\)/i
    });
    expect(finalizeBtn).toBeDisabled();
  });

  it('4. DistributionTable menampilkan nomor dokumen kanonis, target penerima, resi, dan tombol Pratinjau BAST', () => {
    const onPreviewBast = vi.fn();
    const onDownloadBast = vi.fn();
    const onOpenUpdateModal = vi.fn();

    render(
      <DistributionTable
        distributions={[
          {
            id: 'dist-1',
            document_type: 'BAP',
            document_no: '0099/BAP-PAA/URD/XI/2026',
            target_destination: 'DISNAKER',
            recipient_name: 'Seksi Pengawasan K3 Disnaker',
            client_name: 'PT Maju Bersama',
            po_number: 'PO-MB-2026-01',
            order_id: 'order-99',
            object_name: 'Forklift 3 Ton',
            serial_number: 'FL-3T-99',
            dispatch_media: 'KURIR_FISIK',
            tracking_reference: 'JNE-88990011',
            dispatch_date: '2026-11-05T09:00:00Z',
            status: 'DIKIRIM'
          }
        ]}
        isMarketingOrAdmin={true}
        onOpenUpdateModal={onOpenUpdateModal}
        onPreviewBast={onPreviewBast}
        onDownloadBast={onDownloadBast}
      />
    );

    expect(screen.getAllByText(/0099\/BAP-PAA\/URD\/XI\/2026/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/JNE-88990011/i).length).toBeGreaterThan(0);

    const previewBtns = screen.getAllByRole('button', { name: /Pratinjau BAST/i });
    expect(previewBtns.length).toBeGreaterThan(0);
    fireEvent.click(previewBtns[0]);
    expect(onPreviewBast).toHaveBeenCalledWith('order-99', 'PO-MB-2026-01');
  });
});
