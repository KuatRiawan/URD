# Architecture Map

## Struktur proyek aktual
```text
URD/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   ├── database/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── modules/
│   │   └── utils/
│   ├── migrations/
│   ├── seeds/
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/
├── scripts/
├── README.md
├── AGENTS.md
└── package.json
```

## Frontend
Frontend berfungsi sebagai SPA React yang membangun route utama melalui `frontend/src/app/App.jsx` dan `frontend/src/app/router.jsx`.

Pola utama:
- `App` membungkus `BrowserRouter` dan `AuthProvider`.
- `RootRedirect` memaksa user tidak terautentikasi ke `/login`.
- `RequireAuth` dan `RequireRole` membatasi route internal.
- `AppLayout` membungkus shell navigasi aplikasi.
- Feature modules: `clients`, `objects`, `orders`, `schedule`, `inspections`, `bap`, `lhpp`, `suket`, `reminders`, `notifications`, `audit-log`, `users`.

## Backend
Backend dibangun dengan Express dan route modular per domain. Router dirangkum di `backend/src/app.js` dan dipetakan ke endpoint `/api/v1/...`.

Pola utama:
- `app.use('/api/v1/auth', authRoutes)`
- `app.use('/api/v1/orders', orderRoutes)`
- `app.use('/api/v1/inspections', inspectionRoutes)`
- `app.use('/api/v1/bap', bapRoutes)`
- `app.use('/api/v1/lhpp', lhppRoutes)`
- `app.use('/api/v1/portal', portalRoutes)`
- `app.use('/api/v1/dashboard', dashboardAndFileRoutes)`

## Data flow real
```text
UI Form / Page
  -> frontend/src/lib/api/axios.js
  -> axios request withCredentials + auth header
  -> backend API router
  -> authenticate + authorize middleware
  -> Joi validation + controller logic
  -> Postgres query through database pool
  -> JSON response
  -> React state update / render UI
```

## Database core
Database schema dijaga di migration dengan relasi yang jelas dan constraint penting. Inti utama ada di `001_core.sql`, termasuk:
- `users`
- `refresh_sessions`
- `file_attachments`
- `notifications`
- `audit_logs`

Trigger append-only:
- `audit_logs_no_update`
- `audit_logs_block_mutation()`

## Integrasi yang sudah aktif
- Login/logout + refresh session
- Role-aware navigation
- Object master data, orders, schedule, inspections
- BAP dan LHPP generation
- Notification and audit trail
- Client portal verification

## Integrasi yang masih perlu enhancement
- Global search across PO/client/unit/documents
- Unified work queue for pending actions
- Document versioning / comparison
- Draft autosave and recoverability

## Risiko arsitektur yang tersisa
- Fitur enhancement masih tersebar di beberapa halaman, belum sepenuhnya tercentralisasi dalam satu query/pattern.
- Operasional dashboard dan global search belum dibentuk sebagai domain modular penuh.
- Endpoint unduhan lampiran bersifat terautentikasi; akses Ahli K3 kini diperiksa terhadap relasi penugasan atau inspeksi pemilik file.
- Route portal berbasis token dan verifikasi dokumen memang publik. Keduanya tidak mengikuti pola autentikasi umum.
- Belum ada review E2E lintas modul yang dijalankan dalam tindak lanjut ini. Suite backend melakukan reset schema database.
