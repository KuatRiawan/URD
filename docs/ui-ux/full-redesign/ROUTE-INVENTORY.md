# URD — Complete Route, Role & Component Inventory

**Project:** PT Upaya Riksa Daya (URD) — Enterprise K3 Inspection Management Platform  
**Design Direction:** Apple-Inspired Native Experience (macOS Tahoe + iOS 26) × Original URD Brand Identity  
**Source of Truth:** `frontend/src/app/router.jsx` & `frontend/src/components/layout/navConfig.js`

---

## 1. Public & Authentication Routes

| # | Route Path | Primary Page Component | Supporting Components / Modals | Accessible Roles | Key User Workflow |
|---|---|---|---|---|---|
| 1 | `/login` | `features/auth/LoginPage.jsx` | `ThemeToggle.jsx`, `logo-urd.png` | Public / Unauthenticated | Employee authentication into internal URD portal |
| 2 | `/verifikasi/:code` | `features/public/VerificationPage.jsx` | Public QR Verification Badge, Document Summary Card | Public (QR Scanner / Client / Disnaker) | Real-time verification of K3 document authenticity (`BAP`, `LHPP`, `Suket K3`) |
| 3 | `/portal/:token` | `features/public/ClientPortalPage.jsx` | `<TableWrapper>`, Document Download Links | Client via Secure Magic Token | External client monitoring of PO inspection progress and official document download |
| 4 | `*` (403 Guard) | `features/auth/ForbiddenPage.jsx` | `<Button>` return navigation | Authenticated (Unauthorized Role) | Clean access-restricted boundary with safe return to workspace |

---

## 2. Authenticated Application Shell (`/app/*`)

| Component | File Path | Responsibility |
|---|---|---|
| `AppLayout` | `components/layout/AppLayout.jsx` | macOS-inspired window canvas (`#F5F5F7` light / `#0B0D11` dark), floating translucent sidebar integration, responsive viewport container |
| `SidebarNav` | `components/layout/SidebarNav.jsx` | macOS Tahoe-inspired translucent sidebar (`.urd-glass-sidebar`), untouched `logo-urd.png` in white container, sentence-case navigation groups, URD Red (`#C81E1E`) active state |
| `TopHeader` | `components/layout/TopHeader.jsx` | Translucent application toolbar (`.urd-glass-toolbar`), Spotlight-style search trigger (`⌘K`), notifications popover, theme toggle, user profile popover |
| `MobileBottomNav` | `components/layout/MobileBottomNav.jsx` | iOS 26-inspired floating translucent tab bar (`.urd-glass-bottom-bar`) with 4 primary role tabs + "Lainnya" sheet trigger |
| `MobileNavDrawer` | `components/layout/MobileNavDrawer.jsx` | iOS Inset Grouped navigation sheet on `#F5F5F7` canvas with profile card, grouped routes, and safe logout action |
| `GlobalSearchDialog` | `components/search/GlobalSearchDialog.jsx` | macOS Spotlight-style (`⌘K`) cross-entity search dialog (PO, Klien, Alat/Unit, LHPP, BAP) |

---

## 3. Authenticated Workspace Routes (`/app/*`)

| # | Route Path | Page Component | Sub-Views / Modals / Drawers / Tabs | Roles Permitted |
|---|---|---|---|---|
| 5 | `/app/dashboard` | `features/dashboard/DashboardPage.jsx` | **5 Role-Specific Views:**<br>• `MarketingDashboardView.jsx` (`MARKETING`)<br>• `InspectorDashboardView.jsx` + `InspectorMetricCards.jsx`, `InspectorUnitCard.jsx`, `InspectorUnitTable.jsx`, `AssignmentDetailModal.jsx`, `RejectAssignmentModal.jsx` (`AHLI_K3`)<br>• `ManagementDashboardView.jsx` + `DashboardPoCreator.jsx`, `WorkQueueWidget.jsx`, `SplineAreaChart.jsx`, `IndonesiaMapWidget.jsx` (`ADMIN_KANTOR`)<br>• `ExecutiveDashboardView.jsx` (`PIMPINAN`)<br>• `SuperAdminDashboardView.jsx` (`ADMIN_SISTEM`) | All 5 Roles (`MARKETING`, `AHLI_K3`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM`) |
| 6 | `/app/orders` | `features/orders/OrdersPage.jsx` | `OrderFilterBar.jsx`, `OrderTable.jsx`, `CreatePoWizardModal.jsx` (`StepPoIdentity`, `StepPoClient`, `StepPoUnits`, `StepPoSchedule`, `StepPoReview`), `OrderDetailModal.jsx`, `CsvImportModal.jsx` | `MARKETING`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` |
| 7 | `/app/clients` | `features/clients/ClientsPage.jsx` | `ClientFilterBar.jsx`, `ClientTable.jsx`, `ClientFormModal.jsx`, `ClientDetailModal.jsx` (Lokasi, Kontak PIC, Portal Klien, Daftar Alat & Perpanjangan PO) | `MARKETING`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` |
| 8 | `/app/objects` | `features/objects/ObjectsPage.jsx` | `ObjectFilterBar.jsx`, `ObjectTable.jsx`, `CreateObjectModal.jsx`, `ObjectDetailModal.jsx`, `ObjectCsvModal.jsx`, `ObjectQrModal.jsx` | All 5 Roles |
| 9 | `/app/schedule` (`/app/scheduling`) | `features/scheduling/SchedulePage.jsx` | `ScheduleAgendaSection.jsx`, `InspectorCompetencySection.jsx`, `AddCompetencyModal.jsx`, Surat Tugas PDF generator | All 5 Roles |
| 10 | `/app/inspections` | `features/inspections/InspectionsPage.jsx` | `StartInspectionModal.jsx`, `InspectionDetailModal.jsx`, `InspectionHeaderSection.jsx`, `InspectionStepNav.jsx`, `StepChecklist.jsx`, `StepPhotosFindings.jsx`, `StepConclusion.jsx`, `StepSignatures.jsx`, `PdfPreviewModal.jsx`, `OfflineSyncDrawer.jsx` | `AHLI_K3`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` |
| 11 | `/app/bap` | `features/bap/BapPage.jsx` | `BapTable.jsx`, `BapDetailModal.jsx` (Signature pad, approval/revision, PDF preview/download) | `AHLI_K3`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` |
| 12 | `/app/lhpp` | `features/lhpp/LhppPage.jsx` | `LhppTable.jsx`, `LhppDetailModal.jsx`, `LhppTechnicalForm.jsx`, `LhppPhotosSection.jsx`, `LhppDeliverySection.jsx` | `AHLI_K3`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` |
| 13 | `/app/suket` | `features/suket/SuketPage.jsx` | `SuketTable.jsx`, `CreateSuketModal.jsx`, `SuketDetailModal.jsx` (Lifecycle tracking: Pengajuan → Evaluasi → Penerbitan → Distribusi) | `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` |
| 14 | `/app/distributions` | `features/distributions/DocumentDistributionPage.jsx` | `DistributionSummaryCards.jsx`, `DistributionFilterBar.jsx`, `DistributionTable.jsx`, `UpdateDistributionModal.jsx` | `MARKETING`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` |
| 15 | `/app/history` | `features/history/HistoryPage.jsx` | `HistoryFilterBar.jsx`, `HistoryTable.jsx`, `HistoryDetailModal.jsx` | All 5 Roles |
| 16 | `/app/reminders` | `features/reminders/RemindersPage.jsx` | `ExpiringUnitsSection.jsx`, `MissingValiditySection.jsx`, `ClientDispatchSection.jsx`, `CompetencyRemindersSection.jsx`, `UnitValidityModal.jsx` | `MARKETING`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` |
| 17 | `/app/issues` | `features/issues/IssuesPage.jsx` | Summary KPI strip, Status filter bar, Issue cards with resolution actions | All 5 Roles |
| 18 | `/app/notifications` | `features/notifications/NotificationsPage.jsx` | Unread filter, Mark-all-read action, Grouped notification feed | All 5 Roles |
| 19 | `/app/users` | `features/users/UsersPage.jsx` | `UserFilterBar.jsx`, `UserTable.jsx`, `CreateUserModal.jsx`, `EditUserModal.jsx`, `UserDetailDrawer.jsx`, `InspectorCompetencyTab.jsx`, `RbacMatrixTab.jsx` | `ADMIN_SISTEM` |
| 20 | `/app/audit-logs` (`/app/audit-log`) | `features/audit-log/AuditLogPage.jsx` | Filter bar (Actor, Action, Entity, Date), Expandable JSON payload diff rows | `ADMIN_SISTEM`, `PIMPINAN` |
| 21 | `/app/settings` | `features/settings/SettingsPage.jsx` | **Standard Role Tabs:** `ProfileTab.jsx`, `SecurityTab.jsx`, `AppearanceTab.jsx`, `RoleSettingsTab.jsx`<br>**SuperAdmin Console (`SuperAdminConsole.jsx`):** `CompanyProfileSection.jsx`, `DocumentNumberingSection.jsx`, `EquipmentMasterSection.jsx`, `ChecklistBuilderSection.jsx`, `ReminderTemplatesSection.jsx`, `GatewaysSection.jsx`, `DatabaseBackupsSection.jsx`, `SystemInfoSection.jsx` | All 5 Roles (`SuperAdminConsole` for `ADMIN_SISTEM`) |

