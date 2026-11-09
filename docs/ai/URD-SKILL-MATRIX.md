# URD AI Skill Usage Matrix & Project Capability Catalog

PT Upaya Riksa Daya (URD) — Sistem Informasi Terpadu Pemeriksaan dan Pengujian K3 (PJK3)

---

## 1. Executive Summary & Purpose

This matrix maps the specialized Antigravity engineering skills installed from the official repository into the **PT Upaya Riksa Daya (URD)** workspace. 

Every skill is tailored to URD's actual enterprise architecture, technology stack, and operational reality:
- **Frontend Stack**: React 18+ (SPA), Vite, Tailwind CSS, `@phosphor-icons/react`, Axios, Vitest, Testing Library.
- **Backend Stack**: Node.js, Express, PostgreSQL, Joi Validation, JSON Web Tokens (JWT).
- **Domain Context**: K3 PJK3 inspection workflows, regulatory certification (SKP Kemenaker), multi-unit inspection orders (PO), 7 inspection domains (PAPA, PUBT, PTP, ILPP, IPK, Elevator/Eskalator, Anchor/Lifeline), and field inspector reporting.
- **Design Philosophy**: Minimalist, high-density, Apple Human Interface Guidelines-inspired enterprise aesthetic with high contrast (Clean White background, Dark text, URD Corporate Red accent `#C81E1E` / `#dc2626`).

---

## 2. Installed Skills Directory & Inventory

The skills have been installed and verified in:
- Primary workspace location: `.agents/skills/`
- Compatibility location: `.agent/skills/`

| # | Skill Identifier | Domain Category | Target Subagent | Primary URD Scope |
|---|---|---|---|---|
| 1 | `ui-ux-designer` | UI / UX | `ui-designer` | User flows, wireframes, hierarchical grid navigation, interaction hierarchy |
| 2 | `ui-visual-validator` | UI / QA | `ui-ux-tester` | Visual regression, token compliance, mobile/desktop viewport audits |
| 3 | `tailwind-design-system` | Frontend / Styling | `frontend-developer`, `ui-designer` | Tailwind token management, component primitives, dark mode, responsive utilities |
| 4 | `frontend-developer` | Frontend | `frontend-developer` | React 18 components, client state, data fetching, loading/empty/error states |
| 5 | `javascript-testing-patterns` | Quality Engineering | `frontend-developer`, `code-reviewer` | Vitest, React Testing Library, mock service worker, unit & integration test suites |
| 6 | `accessibility-compliance-accessibility-audit` | Quality Engineering / A11y | `frontend-developer`, `ui-ux-tester` | WCAG 2.1 AA audits, keyboard navigation, focus indicators, field device usability |
| 7 | `backend-architect` | Backend / Architecture | `backend-developer`, `api-designer` | Service boundaries, error handling middleware, logging, transaction management |
| 8 | `api-design-principles` | Backend / API | `api-designer`, `backend-developer` | RESTful route standards, Joi request schemas, pagination, envelope consistency |
| 9 | `database-architect` | Database / Modeling | `postgres-pro`, `backend-developer` | Relational schema modeling, multi-unit PO constraints, cascading rules, foreign keys |
| 10 | `database-migrations-sql-migrations` | Database / DevOps | `postgres-pro` | Zero-downtime PostgreSQL migrations, expand-contract pattern, safe indexing |
| 11 | `database-optimizer` | Database / Performance | `postgres-pro` | PostgreSQL query tuning, `EXPLAIN ANALYZE`, composite indexing, N+1 elimination |
| 12 | `security-auditor` | Security / DevSecOps | `security-auditor` | RBAC verification, JWT lifecycle, SQLi/XSS prevention, audit logging integrity |
| 13 | `full-stack-orchestration-full-stack-feature` | Full-Stack | `backend-developer`, `frontend-developer` | End-to-end coordination: Schema -> API Route -> React View -> Vitest |

---

## 3. Skill Profiles & URD Application Mapping

### 3.1 UI & UX Engineering

#### 1. `ui-ux-designer`
- **Location**: `.agents/skills/ui-ux-designer/SKILL.md`
- **When to Activate**:
  - Designing new multi-level navigation patterns (e.g. Hierarchical Grid for Checklist & Equipment Catalog).
  - Eliminating visual clutter, consolidating crowded action toolbars, establishing action hierarchy.
  - Designing field-friendly responsive experiences for inspectors on mobile phones and tablets.
- **URD Application**:
  - Structure the 4-level navigation: *Bidang Riksa Uji* (Level 1) $\rightarrow$ *Jenis Alat* (Level 2) $\rightarrow$ *Nama Alat* (Level 3) $\rightarrow$ *Checklist Template* (Level 4).
  - Design contextual modals for adding/editing equipment classification without leaving the flow.
  - Preserve clear breadcrumbs and single-level focus at any given step.
- **Complements**: `tailwind-design-system`, `ui-visual-validator`.

#### 2. `ui-visual-validator`
- **Location**: `.agents/skills/ui-visual-validator/SKILL.md`
- **When to Activate**:
  - Verifying UI changes after frontend refactoring or feature implementation.
  - Checking visual compliance against URD brand standards (Apple-inspired clean aesthetic, red accents).
  - Auditing responsive layouts across desktop (sidebar navigation) and mobile viewports (bottom navigation `MobileBottomNav` + drawer `MobileNavDrawer`).
- **URD Application**:
  - Verify touch targets are $\ge 44 \times 44\text{px}$ for mobile inspector views.
  - Ensure contrast ratios meet WCAG AA standards against white backgrounds.
  - Confirm buttons use proper semantic variants: primary action (`bg-[#C81E1E]`), secondary action (`border border-neutral-300`), destructive action (`bg-red-700`).

#### 3. `tailwind-design-system`
- **Location**: `.agents/skills/tailwind-design-system/SKILL.md`
- **Resources**: `resources/implementation-playbook.md`
- **When to Activate**:
  - Implementing or refactoring shared component primitives in `frontend/src/components/ui/` (`Button`, `Card`, `Badge`, `Modal`, `TableWrapper`).
  - Standardizing spacing, typography scales, border radii, and color token usage in `frontend/tailwind.config.js`.
  - Replacing inline CSS styles or unstandardized hex colors with Tailwind theme tokens.
- **URD Application**:
  - Enforce consistent corporate tokens: `urd-red` (`#C81E1E` / `#b91c1c`), `urd-dark` (`#111827`), `urd-muted` (`#6b7280`).
  - Maintain consistent elevation, cards, and modal backdrop blur effects across all 6 portal roles.

---

### 3.2 Frontend Engineering & Testing

#### 4. `frontend-developer`
- **Location**: `.agents/skills/frontend-developer/SKILL.md`
- **When to Activate**:
  - Implementing new React pages, nested views, or dynamic form interfaces.
  - Integrating frontend views with backend endpoints via Axios in `frontend/src/lib/api/axios.js`.
  - Managing complex UI state, client-side pagination, search debouncing, and filter synchronization.
- **URD Application**:
  - Build equipment catalog views with server-side/client-side pagination and filter chips.
  - Handle complete UI states: loading skeletons (`LoadingView`), empty states (`EmptyView`), and error recovery with retry prompts (`ErrorView`).
  - Synchronize user profile updates (avatar, name, phone) with global header and auth context (`AuthProvider.jsx`).

#### 5. `javascript-testing-patterns`
- **Location**: `.agents/skills/javascript-testing-patterns/SKILL.md`
- **Resources**: `resources/implementation-playbook.md`
- **When to Activate**:
  - Writing automated unit and integration tests using Vitest and React Testing Library.
  - Mocking API responses and testing edge cases (network failure, 401 unauthorized, validation errors).
  - Regression testing before deployment.
- **URD Application**:
  - Run suite: `npm --prefix frontend test -- --run`.
  - Test critical user journeys: Authentication flow, Dynamic Checklist creation, Equipment Catalog navigation, Profile update photo sync.
  - Test helper functions and formatting utilities in `frontend/src/lib/utils.js`.

#### 6. `accessibility-compliance-accessibility-audit`
- **Location**: `.agents/skills/accessibility-compliance-accessibility-audit/SKILL.md`
- **Resources**: `resources/implementation-playbook.md`
- **When to Activate**:
  - Auditing interactive components for keyboard navigation (`Tab`, `Enter`, `Escape`, `Arrow` keys).
  - Checking ARIA roles, states, and screen reader labels on icon-only buttons.
  - Validating form labels, error messages, and color contrast.
- **URD Application**:
  - Ensure all modals trap focus and dismiss on `Escape`.
  - Ensure action buttons have visible focus rings: `focus-visible:ring-2 focus-visible:ring-[#C81E1E]`.
  - Audit inspection form checklists to ensure field inspectors can navigate and check items efficiently on touchscreen or keyboard.

---

### 3.3 Backend & API Engineering

#### 7. `backend-architect`
- **Location**: `.agents/skills/backend-architect/SKILL.md`
- **When to Activate**:
  - Structuring new backend service modules, controller layers, or background job routines.
  - Establishing centralized error handling, transactional consistency, and application logging.
  - Setting service boundaries between commercial (PO/Billing), technical (Inspection/Checklists), and compliance (Suket/LHPP/BAST) domains.
- **URD Application**:
  - Refactor Node.js/Express controllers and service layers in `backend/src/`.
  - Ensure transaction isolation for multi-unit PO processing (either all units update or transaction rolls back cleanly).
  - Ensure structured audit logging for administrative actions in `backend/src/db/` and audit middleware.

#### 8. `api-design-principles`
- **Location**: `.agents/skills/api-design-principles/SKILL.md`
- **References & Assets**:
  - `assets/api-design-checklist.md`
  - `references/rest-best-practices.md`
  - `resources/implementation-playbook.md`
- **When to Activate**:
  - Defining or updating REST API endpoints in `backend/src/routes/`.
  - Designing request validation schemas with Joi in `backend/src/middleware/validator.js`.
  - Standardizing JSON response payloads, pagination metadata, and HTTP status codes.
- **URD Application**:
  - Consistent response envelope:
    ```json
    {
      "success": true,
      "data": [ ... ],
      "meta": {
        "page": 1,
        "limit": 10,
        "total": 45,
        "totalPages": 5
      }
    }
    ```
  - Standardized error schema with field-level validation errors:
    ```json
    {
      "success": false,
      "message": "Validation failed",
      "errors": [
        { "field": "nama_alat", "message": "\"nama_alat\" is required" }
      ]
    }
    ```

---

### 3.4 Database Engineering & Optimization

#### 9. `database-architect`
- **Location**: `.agents/skills/database-architect/SKILL.md`
- **When to Activate**:
  - Designing new database tables, relational schemas, foreign key constraints, and cascade behaviors.
  - Modeling multi-unit PO workflows where one PO has multiple inspection items progressing independently.
  - Normalizing equipment classification hierarchy (Bidang $\rightarrow$ Jenis Alat $\rightarrow$ Nama Alat $\rightarrow$ Checklist Template).
- **URD Application**:
  - Maintain data integrity across `orders`, `order_units`, `checklist_templates`, `checklist_sections`, and `checklist_items`.
  - Prevent orphaned records when deleting or archiving draft templates.
  - Design audit log tables to track changes to critical inspection data and certificate numbers.

#### 10. `database-migrations-sql-migrations`
- **Location**: `.agents/skills/database-migrations-sql-migrations/SKILL.md`
- **Resources**: `resources/implementation-playbook.md`
- **When to Activate**:
  - Authoring new SQL schema migrations in `backend/src/db/migrations/`.
  - Modifying table structures on active PostgreSQL databases without causing table locks or downtime.
  - Backfilling or migrating existing checklist data to new schema versions.
- **URD Application**:
  - Use expand-contract pattern when renaming columns or splitting entities.
  - Add indexes using `CREATE INDEX CONCURRENTLY` in production environments.
  - Include deterministic `UP` and `DOWN` rollback steps in migration scripts.

#### 11. `database-optimizer`
- **Location**: `.agents/skills/database-optimizer/SKILL.md`
- **When to Activate**:
  - Optimizing slow SQL queries identified in dashboard analytics or report generation.
  - Eliminating N+1 queries when loading POs with multiple units and inspector assignments.
  - Tuning PostgreSQL indexes on heavily queried columns (`status`, `bidang_id`, `client_id`, `created_at`).
- **URD Application**:
  - Analyze query plans using `EXPLAIN (ANALYZE, BUFFERS)`.
  - Add composite indexes for common multi-column filters (e.g., `(bidang_id, jenis_alat_id)`).
  - Optimize marketing and management dashboard aggregation queries for 7-day, 30-day, and quarterly date ranges.

---

### 3.5 Security & Full-Stack Coordination

#### 12. `security-auditor`
- **Location**: `.agents/skills/security-auditor/SKILL.md`
- **When to Activate**:
  - Auditing API routes for proper Role-Based Access Control (RBAC) and object-level ownership checks.
  - Reviewing JWT token authentication, expiration, and refresh mechanisms.
  - Preventing OWASP Top 10 risks: SQL injection (parameterized queries), Cross-Site Scripting (XSS), IDOR, and unauthorized data tampering.
- **URD Application**:
  - Verify that inspectors cannot modify finalized/approved certificates or BAST documents.
  - Ensure marketing users cannot access internal technical inspection calculation sheets.
  - Verify backend authorization guards: never rely solely on frontend button hiding for security.
  - Audit file upload routes (e.g., profile photos, equipment photos, LHPP attachments) for MIME type and file extension validation.

#### 13 | `full-stack-orchestration-full-stack-feature`
- **Location**: `.agents/skills/full-stack-orchestration-full-stack-feature/SKILL.md`
- **When to Activate**:
  - Coordinating end-to-end features spanning database schema, backend API routes, frontend React views, and automated tests.
  - Preventing cross-layer drift (mismatched field names between database columns, Joi schemas, API responses, and React state).
- **URD Application**:
  - Step 1: Database migration (`database-migrations-sql-migrations`).
  - Step 2: Backend repository & route implementation (`backend-architect`, `api-design-principles`).
  - Step 3: Security & permission verification (`security-auditor`).
  - Step 4: Frontend UI implementation (`frontend-developer`, `tailwind-design-system`).
  - Step 5: Visual and UX review (`ui-ux-designer`, `ui-visual-validator`).
  - Step 6: Automated regression testing (`javascript-testing-patterns`).

---

## 4. Relationship with Existing Project Skills

The newly installed skills work seamlessly alongside existing workspace skills without overwriting or conflicting with them:

| Existing Skill | Role | Integration with New Skills |
|---|---|---|
| `urd-product-engineering` (Project Core) | Business logic, PJK3 standards, domain inspection rules (PAPA, PUBT, etc.) | Acts as the **master product context**. All technical skills defer to URD business rules defined here. |
| `ponytail` | Strict verification, zero hallucination, evidence-backed implementation | Enforces rigorous proof standards on `javascript-testing-patterns` and `ui-visual-validator`. |
| `antislop` | Anti-boilerplate, clean idiomatic code, avoiding generic AI slop | Keeps `frontend-developer`, `backend-architect`, and `tailwind-design-system` code concise and readable. |
| `fixing-accessibility` | Targeted accessibility repairs | Works as a quick-fix utility alongside the comprehensive WCAG audit in `accessibility-compliance-accessibility-audit`. |
| `ui-review` | Quick heuristic UI checks | Complemented by `ui-visual-validator` for deep screenshot and responsive token verification. |

---

## 5. Practical Combination Workflows for Common URD Tasks

### Workflow A: Hierarchical Grid Checklist Management Redesign
1. **`ui-ux-designer`**: Define the 4-level navigation architecture (Bidang $\rightarrow$ Jenis Alat $\rightarrow$ Nama Alat $\rightarrow$ Checklist Template). Eliminate horizontal tab overload.
2. **`tailwind-design-system`**: Create clean responsive grid tiles, active/hover states, and breadcrumbs following Apple-inspired minimalist design tokens.
3. **`frontend-developer`**: Implement the React component hierarchy, breadcrumb routing state, and search filtering.
4. **`api-design-principles`**: Ensure backend endpoints support nested hierarchy querying with consistent response envelopes.
5. **`ui-visual-validator`**: Verify responsive behavior on both desktop and mobile viewports.

### Workflow B: Equipment Catalog Pagination & Filtering
1. **`api-design-principles`**: Implement `page`, `limit`, `search`, `bidang`, and `status` query parameters on `/api/equipment-catalog`.
2. **`database-optimizer`**: Ensure `LIMIT`/`OFFSET` queries use indexed columns and execute under 50ms.
3. **`frontend-developer`**: Build reusable pagination controls in `frontend/src/components/ui/Pagination.jsx` and bind to URL search params.
4. **`javascript-testing-patterns`**: Add Vitest tests verifying pagination controls, page bounds, and data refetching.

### Workflow C: Marketing & Management Dashboard Chart Filtering Bug Fix
1. **`frontend-developer`**: Inspect date-range filter state (7 days, 30 days, quarter) and ensure state changes trigger re-render and API refetch.
2. **`api-design-principles`**: Verify date boundary parameters (`startDate`, `endDate`) sent to backend.
3. **`database-optimizer`**: Validate aggregation queries perform grouping efficiently across timestamp columns.
4. **`ui-visual-validator`**: Verify chart renders consistently with identical styling across Marketing and Pimpinan portals.

### Workflow D: Profile Picture Upload & Header Avatar Synchronization
1. **`security-auditor`**: Validate image upload endpoint (file size limit, MIME types `image/png`, `image/jpeg`, sanitization).
2. **`backend-architect`**: Persist avatar URL in `users` table and return updated user object in response.
3. **`frontend-developer`**: Update `AuthProvider` user state so header avatar and settings avatar synchronize instantly without full page reload.
4. **`accessibility-compliance-accessibility-audit`**: Ensure avatar button has accessible `alt` and `aria-label` text.

---

## 6. Verification and Maintenance

To verify that all installed skills remain valid and conform to Antigravity standards:
```bash
# Verify skill files and SKILL.md presence
node -e '
const fs = require("fs");
const path = require("path");
const manifest = JSON.parse(fs.readFileSync(".agents/skills/.antigravity-install-manifest.json"));
manifest.entries.forEach(s => {
  const p = path.join(".agents/skills", s, "SKILL.md");
  if (!fs.existsSync(p)) console.error("Missing SKILL.md for:", s);
});
console.log("Verified", manifest.entries.length, "skills in .agents/skills/");
'
```

All 13 skills are verified, documented, and fully integrated for immediate use by developers and autonomous subagents in the URD workspace.

