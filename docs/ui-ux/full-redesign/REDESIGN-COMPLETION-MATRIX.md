# URD — Full Application Redesign Completion Matrix

**Project:** PT Upaya Riksa Daya (URD)  
**Design Direction:** Apple-Inspired Native Experience (macOS Tahoe + iOS 26) × Original URD Brand Identity

---

## 1. Shared Foundation & Application Shell

| Component / Module | File Path | Status | Key Apple × URD Updates |
|---|---|---|---|
| Theme & CSS Tokens | `styles/index.css`, `ThemeProvider.jsx` | `IMPLEMENTED` | Default light mode (`#F5F5F7` canvas, `#FFFFFF` surface), Apple system font stack, hairline borders (`rgba(0,0,0,0.06)`), selective `.urd-glass-*` with reduced-transparency fallback |
| Desktop Shell | `AppLayout.jsx`, `SidebarNav.jsx`, `TopHeader.jsx` | `IMPLEMENTED` | macOS-inspired translucent sidebar & toolbar, untouched `logo-urd.png` in white container, sentence-case nav groups, URD Red (`#C81E1E`) active state |
| Mobile Shell | `MobileBottomNav.jsx`, `MobileNavDrawer.jsx` | `IMPLEMENTED` | iOS 26 floating translucent tab bar + iOS Inset Grouped navigation sheet |
| Core UI Primitives | `PageHeader.jsx`, `Card.jsx`, `Button.jsx`, `TableWrapper.jsx`, `Modal.jsx`, `ThemeToggle.jsx`, `Notice.jsx` | `IMPLEMENTED` | `rounded-2xl` cards/tables/modals, `rounded-[10px]` tactile buttons, Finder-inspired sticky table headers |
| Global Feedback & Search | `StateViews.jsx`, `ErrorBoundary.jsx`, `FeedbackProvider.jsx`, `GlobalSearchDialog.jsx` | `IN PROGRESS` | Spotlight search dialog (`⌘K`), calm loading/empty/error states, Apple alert dialog |

---

## 2. Route-by-Route Redesign & Verification Matrix

| # | Route | Role(s) | Page & Supporting Components | Redesign Status | Visual Verification | Functional Verification |
|---|---|---|---|---|---|---|
| 1 | `/login` | Public | `LoginPage.jsx` | `IMPLEMENTED` | Pending Screenshot | Verified |
| 2 | `/verifikasi/:code` | Public | `VerificationPage.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 3 | `/portal/:token` | Public Client | `ClientPortalPage.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 4 | `*` (403 Guard) | All Roles | `ForbiddenPage.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 5a | `/app/dashboard` | `MARKETING` | `MarketingDashboardView.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 5b | `/app/dashboard` | `AHLI_K3` | `InspectorDashboardView.jsx`, `InspectorMetricCards.jsx`, `InspectorUnitCard.jsx`, `InspectorUnitTable.jsx`, `AssignmentDetailModal.jsx`, `RejectAssignmentModal.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 5c | `/app/dashboard` | `ADMIN_KANTOR` | `ManagementDashboardView.jsx`, `DashboardPoCreator.jsx`, `WorkQueueWidget.jsx`, `SplineAreaChart.jsx`, `IndonesiaMapWidget.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 5d | `/app/dashboard` | `PIMPINAN` | `ExecutiveDashboardView.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 5e | `/app/dashboard` | `ADMIN_SISTEM` | `SuperAdminDashboardView.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 6 | `/app/orders` | `MARKETING`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` | `OrdersPage.jsx`, `OrderFilterBar.jsx`, `OrderTable.jsx`, `CreatePoWizardModal.jsx`, `OrderDetailModal.jsx`, `CsvImportModal.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 7 | `/app/clients` | `MARKETING`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` | `ClientsPage.jsx`, `ClientFilterBar.jsx`, `ClientTable.jsx`, `ClientFormModal.jsx`, `ClientDetailModal.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 8 | `/app/objects` | All 5 Roles | `ObjectsPage.jsx`, `ObjectFilterBar.jsx`, `ObjectTable.jsx`, `CreateObjectModal.jsx`, `ObjectDetailModal.jsx`, `ObjectCsvModal.jsx`, `ObjectQrModal.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 9 | `/app/schedule` | All 5 Roles | `SchedulePage.jsx`, `ScheduleAgendaSection.jsx`, `InspectorCompetencySection.jsx`, `AddCompetencyModal.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 10 | `/app/inspections` | `AHLI_K3`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` | `InspectionsPage.jsx`, `StartInspectionModal.jsx`, `InspectionDetailModal.jsx`, `StepChecklist.jsx`, `StepPhotosFindings.jsx`, `StepConclusion.jsx`, `StepSignatures.jsx`, `PdfPreviewModal.jsx`, `OfflineSyncDrawer.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 11 | `/app/bap` | `AHLI_K3`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` | `BapPage.jsx`, `BapTable.jsx`, `BapDetailModal.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 12 | `/app/lhpp` | `AHLI_K3`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` | `LhppPage.jsx`, `LhppTable.jsx`, `LhppDetailModal.jsx`, `LhppTechnicalForm.jsx`, `LhppPhotosSection.jsx`, `LhppDeliverySection.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 13 | `/app/suket` | `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` | `SuketPage.jsx`, `SuketTable.jsx`, `CreateSuketModal.jsx`, `SuketDetailModal.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 14 | `/app/distributions` | `MARKETING`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` | `DocumentDistributionPage.jsx`, `DistributionSummaryCards.jsx`, `DistributionFilterBar.jsx`, `DistributionTable.jsx`, `UpdateDistributionModal.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 15 | `/app/history` | All 5 Roles | `HistoryPage.jsx`, `HistoryFilterBar.jsx`, `HistoryTable.jsx`, `HistoryDetailModal.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 16 | `/app/reminders` | `MARKETING`, `ADMIN_KANTOR`, `PIMPINAN`, `ADMIN_SISTEM` | `RemindersPage.jsx`, `ExpiringUnitsSection.jsx`, `MissingValiditySection.jsx`, `ClientDispatchSection.jsx`, `CompetencyRemindersSection.jsx`, `UnitValidityModal.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 17 | `/app/issues` | All 5 Roles | `IssuesPage.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 18 | `/app/notifications` | All 5 Roles | `NotificationsPage.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 19 | `/app/users` | `ADMIN_SISTEM` | `UsersPage.jsx`, `UserFilterBar.jsx`, `UserTable.jsx`, `CreateUserModal.jsx`, `EditUserModal.jsx`, `UserDetailDrawer.jsx`, `InspectorCompetencyTab.jsx`, `RbacMatrixTab.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 20 | `/app/audit-logs` | `ADMIN_SISTEM`, `PIMPINAN` | `AuditLogPage.jsx` | `IN PROGRESS` | Pending Screenshot | Pending |
| 21 | `/app/settings` | All 5 Roles | `SettingsPage.jsx`, `ProfileTab.jsx`, `SecurityTab.jsx`, `AppearanceTab.jsx`, `RoleSettingsTab.jsx`, `SuperAdminConsole.jsx` + 8 sections | `IN PROGRESS` | Pending Screenshot | Pending |

