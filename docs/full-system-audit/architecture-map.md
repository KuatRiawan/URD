# Peta arsitektur aktual

## Komponen

- `frontend/`: React + Vite, React Router, Axios, Tailwind, Phosphor icons.
- `backend/`: Express, route per domain, middleware authentication/authorization/Joi, service workflow/PDF/notifikasi, storage, scheduler, PostgreSQL `pg`.
- `backend/migrations/`: migrasi SQL 001 sampai 014. API suite menjalankan reset schema sehingga target harus database disposable.

```mermaid
flowchart LR
  UI[React UI] --> AX[Axios /api/v1]
  AX --> R[Express routes]
  R --> M[Auth + roles + Joi]
  M --> S[Workflow, PDF, storage]
  S --> DB[(PostgreSQL via pg)]
  S --> FS[File storage]
  DB --> R --> AX --> UI
```

```mermaid
erDiagram
  CLIENTS ||--o{ ORDERS : memiliki
  ORDERS ||--o{ ORDER_OBJECTS : memuat
  TEST_OBJECTS ||--o{ ORDER_OBJECTS : ditautkan
  ORDERS ||--o{ ASSIGNMENTS : menugaskan
  USERS ||--o{ ASSIGNMENTS : menerima
  ORDERS ||--o| SCHEDULES : dijadwalkan
  ORDERS ||--o{ INSPECTIONS : diproses
  TEST_OBJECTS ||--o{ INSPECTIONS : diperiksa
  INSPECTIONS ||--o{ INSPECTION_RESULTS : menyimpan
  INSPECTIONS ||--o{ INSPECTION_FINDINGS : mencatat
  INSPECTIONS ||--o{ INSPECTION_SIGNATURES : ditandatangani
  INSPECTIONS ||--o| LHPP_DOCUMENTS : menghasilkan
  INSPECTIONS ||--o| BAP_DOCUMENTS : menghasilkan
  LHPP_DOCUMENTS ||--o{ LHPP_REVISIONS : merevisi
  BAP_DOCUMENTS ||--o{ BAP_REVISIONS : merevisi
  ORDERS ||--o{ DOCUMENT_DISTRIBUTIONS : didistribusikan
  USERS ||--o{ AUDIT_LOGS : mencatat
```

Katalog `urd_dev` menunjukkan 39 tabel publik, 89 foreign key, dan 97 primary/unique/check constraints. ERD ini merangkum relasi inti; belum memetakan seluruh kolom dan index.
