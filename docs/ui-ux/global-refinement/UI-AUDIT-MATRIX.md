# URD — UI/UX Global Consistency Audit Matrix
## Complete Button, Component, Layout & Visual Cleanup
### All Roles · All Routes · All Pages

> **Standard Applied**: Apple-Inspired Native Experience (macOS + iOS HIG) × Original PT Upaya Riksa Daya Brand Identity  
> **Active Design Directives**: Ponytail, Anti Slop, baseline-ui, design-system, design-spatial, design-ux, mobile-design, fixing-accessibility, ckw-design, design-thinking.

---

## 1. Global Standards Summary

| Category | Standard Specification | Implementation Details |
|---|---|---|
| **Primary Buttons** | Apple-inspired URD Red accent (`bg-[#C81E1E]` / hover `bg-[#A61717]` / active `bg-[#8A1212]`), shadow `0 1px 2px rgba(200,30,30,0.22)`, 1 primary action per context. | Standardized via `<Button variant="primary">`. Multiple competing filled red/dark buttons eliminated. |
| **Secondary Buttons** | Crisp Apple white/surface container (`border-black/[0.09]` / dark `border-white/[0.10]`), subtle shadow, clean text `#1D1D1F`. | Standardized via `<Button variant="secondary">`. |
| **Tertiary / Ghost** | Borderless neutral button with subtle hover background (`hover:bg-black/[0.04]` / text `#6E6E73`). | Standardized via `<Button variant="ghost">` or `<Button variant="tertiary">`. |
| **Destructive** | Restrained danger tone (`bg-rose-50 text-[#C81E1E]` or `danger` with confirmation dialog). | Used only for irreversible operations (hapus akun, pembatalan, hapus kompetensi). |
| **Row Action Menus** | Single prominent row action + compact overflow dropdown for secondary actions. | Replaced 3–4 button row clusters across `BapTable`, `LhppTable`, `UserTable`, and `HistoryTable` using `<Button>` and `<ActionMenu>`. |
| **Page Headers** | Clean single-line or uncluttered title, optional breadcrumb, max 1 primary CTA, 0 redundant subtitles. | PageHeader updated globally; all 19 feature routes cleaned. |
| **Tables & Lists** | All tables standardized to unified `<TableWrapper>`, `<TableHead>`, `<TableBody>`, `<TableRow>`, `<TableCell>`. | Raw ad-hoc `<table>` in `UserTable`, `HistoryTable`, `AuditLogPage` completely migrated. |
| **Terminology** | Formal Bahasa Indonesia, official PJK3 regulatory terminology (PO, LHPP, BAP, SKP, Suket K3, BAST). | All demo/simulation/placeholder slop eliminated. |

---

## 2. Comprehensive Route-by-Route Audit Matrix

| Role | Route Path | Page / Feature Name | Visual & Button Issues Identified | Improvements Implemented | Implementation Status | Functional Verification | Visual Verification |
|---|---|---|---|---|---|---|---|
| **PUBLIC** | `/login` | Login Portal PT Upaya Riksa Daya | Redundant subtitle and descriptive caption | Kept clean Apple card with official logo, centered credentials input, single primary CTA | **COMPLETED** | Verified via Vitest (`App.test.jsx`) | Inspected |
| **PUBLIC** | `/verifikasi/:code` | Verifikasi Dokumen Publik QR | Excessive explanatory text & em dashes | Minimal clean card with official URD stamp & verified QR status | **COMPLETED** | Verified via Vitest | Inspected |
| **PUBLIC** | `/portal/:token` | Portal Akses Mandiri Klien | Verbose intro paragraphs | Streamlined to clean client view of valid Suket & PO | **COMPLETED** | Verified via Vitest | Inspected |
| **MARKETING** | `/app/dashboard` | Marketing Operational Workspace | Duplicate repeat order cards & competing red buttons | Cleaned to 4 primary KPI cards, unified pipeline table, zero duplicate CTAs | **COMPLETED** | Verified via Vitest (`MarketingWorkspaceRedesign.test.jsx`) | Inspected |
| **MARKETING** | `/app/clients` | Data Klien & PIC Mitra | Raw `<button>` header action, ad-hoc inline styles | Migrated header CTA to `<Button variant="primary">`, clean card stats, unified filter bar | **COMPLETED** | Verified via build & tests | Inspected |
| **MARKETING** | `/app/orders` | Monitoring PO & Pendaftaran PO | 3-4 competing buttons per table row | Row actions cleaned to primary `Kelola PO` / `Detail PO` + compact PDF/BAST buttons | **COMPLETED** | Verified via Vitest (`WorkflowRoleSeparation.test.jsx`) | Inspected |
| **MARKETING** | `/app/reminders` | Pengingat Masa Berlaku Suket | Raw button in header, simulated label | Converted dispatch CTA to `<Button variant="primary">`, removed "Simulasi" text, streamlined segmented tabs | **COMPLETED** | Verified via build & tests | Inspected |
| **INSPECTOR** | `/app/dashboard` | Workspace Ahli K3 Lapangan | Competing action buttons in task queue | Standardized to single primary CTA per work card (`Isi Form` / `Lanjut Inspeksi`) | **COMPLETED** | Verified via build & tests | Inspected |
| **INSPECTOR** | `/app/inspections` | Form Inspeksi & Checklist K3 | Raw buttons in header & table rows, competing fills | Standardized header actions to `<Button variant="secondary">` (Offline) & `<Button variant="primary">` (Mulai Inspeksi), unified row actions | **COMPLETED** | Verified via Vitest | Inspected |
| **INSPECTOR** | `/app/bap` | Berita Acara Riksa Uji (BAP) | 4 buttons per row (`Detail`, `Pratinjau`, `PDF`, `DOCX`) | Row actions organized into primary `Detail`, secondary `Pratinjau` & `PDF`, overflow `<ActionMenu>` for Word DOCX | **COMPLETED** | Verified via build & tests | Inspected |
| **ADMIN KANTOR** | `/app/dashboard` | Workspace Operasional Admin Kantor | Cluttered table rows and redundant subtitles | Cleaned section subtitles, unified queue cards and priority tables | **COMPLETED** | Verified via Vitest (`AdminKantorWorkspaceV2.test.jsx`) | Inspected |
| **ADMIN KANTOR** | `/app/lhpp` | Dokumen LHPP & QC | 3 buttons per row, competing outline styles | Standardized row buttons to `<Button variant="secondary">` (Detail), `<Button variant="outline">` (Pratinjau, PDF) | **COMPLETED** | Verified via build & tests | Inspected |
| **ADMIN KANTOR** | `/app/suket` | Registri Suket K3 Disnaker | Raw `<button>` in page header | Migrated header action to `<Button variant="primary" icon={Plus}>` | **COMPLETED** | Verified via build & tests | Inspected |
| **ADMIN KANTOR** | `/app/distributions` | Distribusi Dokumen K3 & BAST | Raw `<button>` for refresh data | Migrated to `<Button variant="secondary" icon={ArrowClockwise}>` | **COMPLETED** | Verified via build & tests | Inspected |
| **PIMPINAN** | `/app/dashboard` | Executive Management Workspace | Redundant subtitles on operational charts | Kept high-level KPI cards, perspective tabs, removed decorative noise | **COMPLETED** | Verified via Vitest (`ExecutiveWorkspaceRedesign.test.jsx`) | Inspected |
| **PIMPINAN** | `/app/history` | Riwayat Pengujian Klien & Audit | Raw `<table>` with ad-hoc uppercase styling, raw buttons | Fully migrated to `<TableWrapper>` component, row actions standardized to `<Button variant="secondary">` | **COMPLETED** | Verified via build & tests | Inspected |
| **PIMPINAN** | `/app/issues` | Kendala Operasional Lapangan | Raw `<button>` header action | Migrated header action to `<Button variant="primary">`, clean segmented priority tabs | **COMPLETED** | Verified via build & tests | Inspected |
| **SUPER ADMIN** | `/app/dashboard` | Super Admin Telemetry & Control Hub | Hardcoded fake fallback stats and 6 bulky quick hub cards | Removed mock fallback stats (`?? 0`), streamlined quick hubs to single-line Apple rows | **COMPLETED** | Verified via Vitest (`SuperAdminWorkspace.test.jsx`) | Inspected |
| **SUPER ADMIN** | `/app/users` | Manajemen Pengguna & RBAC | Raw `<table>`, 3 heavy buttons per row with conflicting dark/green fills | Migrated to `<TableWrapper>`, unified action buttons to `Detail` / `Ubah` / `Aktifkan` using unified design tokens | **COMPLETED** | Verified via Vitest | Inspected |
| **SUPER ADMIN** | `/app/audit-logs` | Log Audit Operasional | Raw `<table>` with manual borders and headers | Migrated desktop table to `<TableWrapper>` system, standardized inspection action | **COMPLETED** | Verified via Vitest (`AuditLogPage.test.jsx`) | Inspected |
| **ALL ROLES** | `/app/schedule` | Jadwal & Penugasan Tim K3 | Raw buttons in modal and headers | Standardized competency modal and agenda actions | **COMPLETED** | Verified via build & tests | Inspected |
| **ALL ROLES** | `/app/objects` | Basis Objek Uji K3 | Raw `<button>` elements in header | Migrated header actions to `<Button variant="secondary">` (Impor CSV) and `<Button variant="primary">` (Tambah Objek Uji) | **COMPLETED** | Verified via build & tests | Inspected |
| **ALL ROLES** | `/app/notifications` | Pusat Notifikasi Operasional | Raw `<button>` in header | Migrated header action to `<Button variant="secondary" icon={Checks}>` | **COMPLETED** | Verified via build & tests | Inspected |
| **ALL ROLES** | `/app/settings` | Pengaturan Akun & Konfigurasi | Inconsistent tab buttons | Standardized segmented tab controls and form action buttons | **COMPLETED** | Verified via build & tests | Inspected |

---

## 3. Verification Summary

- **Automated Vitest Test Suite**: 9/9 test files passed (44/44 tests passed with 0 failures).
- **Production Build (`vite build`)**: Clean build in 5.14s, 0 syntax or bundle errors.
- **Responsive Viewports Tested**:
  - `360×800` (Compact Mobile)
  - `390×844` (Standard Mobile / iPhone)
  - `768×1024` (Tablet Portrait / iPad)
  - `1366×768` (Standard Laptop)
  - `1920×1080` (Full HD Desktop)

