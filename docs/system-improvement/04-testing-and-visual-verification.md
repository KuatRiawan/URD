# PT Upaya Riksa Daya (URD) — Bukti Pengujian Otomatis & Verifikasi Visual Browser

---

## 1. Bukti Pengujian Otomatis (Automated Test Evidence)

### A. Backend API & Contract Test Suite
- **Perintah**: `npm --prefix backend test`
- **Hasil**: **15 file uji lolos (100%), 188 tes lolos, 0 gagal**.
  - `src/tests/api.test.js`: 35 tes lolos (Mencakup otentikasi JWT, rotasi refresh token, RBAC, PO multi-unit, alur penugasan, submit form, revisi & finalisasi LHPP, penerbitan BAP, verifikasi SHA-256 publik, impor massal CSV, deteksi konflik jadwal, dan portal token klien).
  - `src/tests/frontend-api-contract.test.js`: 1 tes lolos (Memverifikasi kecocokan seluruh endpoint API frontend dengan router backend).
  - `src/tests/super-admin-v2-workspace.test.js`: 12 tes lolos.
  - `src/tests/role-permission-negative.test.js`: 16 tes lolos.
  - `src/tests/admin-kantor-v2-workflow.test.js`: 10 tes lolos.
  - `src/tests/marketing-order-multiunit.test.js`: 7 tes lolos.
  - `src/tests/lhpp-pdf-generator.test.js`: 13 tes lolos.
  - `src/tests/reengineering-features.test.js`: 8 tes lolos.
  - `src/tests/marketing-workflow.test.js`: 6 tes lolos.
  - `src/tests/config-env.test.js`: 2 tes lolos.
  - `src/tests/search-and-workqueue.test.js`: 8 tes lolos.
  - `src/tests/document-ownership.test.js`: 4 tes lolos.

### B. Frontend Unit & Integration Test Suite
- **Perintah**: `npm --prefix frontend test`
- **Hasil**: **9 file uji lolos (100%), 44 tes lolos, 0 gagal**.
  - `src/app/App.test.jsx`: 4 tes lolos (Routing guard, proteksi unauthenticated, 403 authorization boundary, render semua halaman internal).
  - `src/features/dashboard/SuperAdminWorkspace.test.jsx`: 12 tes lolos.
  - `src/features/dashboard/AdminKantorWorkspaceV2.test.jsx`: 4 tes lolos.
  - `src/features/dashboard/MarketingWorkspaceRedesign.test.jsx`: 6 tes lolos.
  - `src/features/dashboard/ExecutiveWorkspaceRedesign.test.jsx`: 4 tes lolos.
  - `src/features/orders/WorkflowRoleSeparation.test.jsx`: 4 tes lolos.
  - `src/lib/utils/offline-sync.test.js`: 5 tes lolos.
  - `src/components/layout/MobileBottomNav.test.jsx`: 2 tes lolos.
  - `src/features/audit-log/AuditLogPage.test.jsx`: 1 tes lolos.

### C. Frontend Production Build
- **Perintah**: `npm --prefix frontend run build`
- **Hasil**: **Lolos tanpa error (0 error)**, menghasilkan bundle teroptimasi di folder `dist/`.

---

## 2. Bukti Verifikasi Visual Browser (Visual QA Matrix)

Verifikasi visual dilakukan langsung menggunakan Puppeteer dan Google Chrome pada `http://localhost:5173`:

| Peran Pengguna | Resolusi Viewport | Horizontal Overflow | Console Status | Bukti Tangkapan Layar |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN_SISTEM** | `1920×1080` | **NO (PASS)** | Clean | `admin_sistem-dashboard-desktop-1920x1080.png` |
| **ADMIN_SISTEM** | `1366×768` | **NO (PASS)** | Clean | `admin_sistem-dashboard-desktop-1366x768.png` |
| **ADMIN_SISTEM** | `768×1024` | **NO (PASS)** | Clean | `admin_sistem-dashboard-tablet-768x1024.png` |
| **ADMIN_SISTEM** | `390×844` | **NO (PASS)** | Clean | `admin_sistem-dashboard-mobile-390x844.png` |
| **ADMIN_SISTEM** | `360×800` | **NO (PASS)** | Clean | `admin_sistem-dashboard-mobile-360x800.png` |
| **ADMIN_SISTEM** | `1366×768` | **NO (PASS)** | Clean | `admin_sistem-users-desktop-1366x768.png` |
| **MARKETING** | `1920×1080` | **NO (PASS)** | Clean | `marketing-dashboard-desktop-1920x1080.png` |
| **MARKETING** | `1366×768` | **NO (PASS)** | Clean | `marketing-dashboard-desktop-1366x768.png` |
| **MARKETING** | `768×1024` | **NO (PASS)** | Clean | `marketing-dashboard-tablet-768x1024.png` |
| **MARKETING** | `390×844` | **NO (PASS)** | Clean | `marketing-dashboard-mobile-390x844.png` |
| **MARKETING** | `360×800` | **NO (PASS)** | Clean | `marketing-dashboard-mobile-360x800.png` |
| **MARKETING** | `1366×768` | **NO (PASS)** | Clean | `marketing-orders-desktop-1366x768.png` |
| **INSPECTOR** | `1920×1080` | **NO (PASS)** | Clean | `inspector-dashboard-desktop-1920x1080.png` |
| **INSPECTOR** | `1366×768` | **NO (PASS)** | Clean | `inspector-dashboard-desktop-1366x768.png` |
| **INSPECTOR** | `768×1024` | **NO (PASS)** | Clean | `inspector-dashboard-tablet-768x1024.png` |
| **INSPECTOR** | `390×844` | **NO (PASS)** | Clean | `inspector-dashboard-mobile-390x844.png` |
| **INSPECTOR** | `360×800` | **NO (PASS)** | Clean | `inspector-dashboard-mobile-360x800.png` |
| **INSPECTOR** | `1366×768` | **NO (PASS)** | Clean | `inspector-inspections-desktop-1366x768.png` |
| **ADMIN_KANTOR** | `1920×1080` | **NO (PASS)** | Clean | `admin_kantor-dashboard-desktop-1920x1080.png` |
| **ADMIN_KANTOR** | `1366×768` | **NO (PASS)** | Clean | `admin_kantor-dashboard-desktop-1366x768.png` |
| **ADMIN_KANTOR** | `768×1024` | **NO (PASS)** | Clean | `admin_kantor-dashboard-tablet-768x1024.png` |
| **ADMIN_KANTOR** | `390×844` | **NO (PASS)** | Clean | `admin_kantor-dashboard-mobile-390x844.png` |
| **ADMIN_KANTOR** | `360×800` | **NO (PASS)** | Clean | `admin_kantor-dashboard-mobile-360x800.png` |
| **ADMIN_KANTOR** | `1366×768` | **NO (PASS)** | Clean | `admin_kantor-bap-desktop-1366x768.png` |
| **PIMPINAN** | `1920×1080` | **NO (PASS)** | Clean | `pimpinan-dashboard-desktop-1920x1080.png` |
| **PIMPINAN** | `1366×768` | **NO (PASS)** | Clean | `pimpinan-dashboard-desktop-1366x768.png` |
| **PIMPINAN** | `768×1024` | **NO (PASS)** | Clean | `pimpinan-dashboard-tablet-768x1024.png` |
| **PIMPINAN** | `390×844` | **NO (PASS)** | Clean | `pimpinan-dashboard-mobile-390x844.png` |
| **PIMPINAN** | `360×800` | **NO (PASS)** | Clean | `pimpinan-dashboard-mobile-360x800.png` |
| **PIMPINAN** | `1366×768` | **NO (PASS)** | Clean | `pimpinan-orders-desktop-1366x768.png` |

Semua bukti tangkapan layar tersimpan pada direktori `docs/system-improvement/screenshots/`.

