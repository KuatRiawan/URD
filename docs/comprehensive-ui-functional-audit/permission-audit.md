# Audit Permission Backend
## PT Upaya Riksa Daya - Pemeriksaan Endpoint API

**Tanggal:** 2025-07-15

---

## Catatan Sistem

### Middleware Global
- **authenticate.js** - Verifikasi JWT dan mengisi `req.user`
- **authorize.js** - Memvalidasi role dengan dukungan alias role (AHLI_K3 = INSPECTOR, ADMIN_KANTOR = MARKETING, PIMPINAN = MANAGER)
- **validate.js** - Validasi skema Joi sebelum handler dijalankan
- **CSRF Protection** - Middleware di app.js: mutasi via cookie wajib header `X-Requested-With: XMLHttpRequest`
- **Rate Limiting** - `/api/v1/auth/login`: 25 req per 15 menit

### Aturan Khusus
PIMPINAN/MANAGER diblokir dari **semua** endpoint mutasi (POST/PUT/PATCH/DELETE) secara global di `authorize.js`, kecuali endpoint yang tidak memerlukan authorization.

---

## Tabel Endpoint per Modul

### Modul: auth (`/api/v1/auth`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| /login | POST | Tidak (publik) | - | UNPROTECTED (disengaja) |
| /refresh | POST | Tidak (publik - via cookie) | - | UNPROTECTED (disengaja) |
| /logout | POST | Tidak (publik) | - | UNPROTECTED (disengaja) |
| /me | GET | authenticate | Semua | PROTECTED |
| /profile | PUT | authenticate | Semua | PROTECTED |
| /password | PUT | authenticate | Semua | PROTECTED |

### Modul: users (`/api/v1/users`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| / | GET | authenticate | ADMIN_SISTEM | PROTECTED |
| / | POST | authenticate | ADMIN_SISTEM | PROTECTED |
| /:id | GET | authenticate | ADMIN_SISTEM | PROTECTED |
| /:id | PATCH | authenticate | ADMIN_SISTEM | PROTECTED |

### Modul: clients (`/api/v1/clients`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| / | GET | authenticate | Semua | PROTECTED |
| /:id | GET | authenticate | Semua | PROTECTED |
| / | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id | PUT/PATCH | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id (toggle aktif) | PATCH | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |

### Modul: objects (`/api/v1/objects`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| /categories | GET | authenticate | Semua | PROTECTED |
| /history/all | GET | authenticate | Semua | PROTECTED |
| / | GET | authenticate | Semua | PROTECTED |
| /:id | GET | authenticate | Semua | PROTECTED |
| /:id/qr | GET | authenticate | Semua | PROTECTED |
| / | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id | PATCH | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/deactivate | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/reactivate | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |

### Modul: inspectors (`/api/v1/inspectors`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| / | GET | authenticate | Semua | PROTECTED |
| /:id/competencies | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/competencies/:compId | DELETE | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |

### Modul: orders (`/api/v1/orders`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| / | GET | authenticate | Semua | PROTECTED |
| /:id | GET | authenticate | Semua | PROTECTED |
| / | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/schedule | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/assign | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR, AHLI_K3 | PROTECTED |
| /:id/assignments/:asgId/respond | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/status | PATCH | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/objects/csv | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/cancel | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/assignment-letter.pdf | GET | authenticate | Semua | PROTECTED |

### Modul: scheduling (`/api/v1/schedules`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| /conflicts | GET | authenticate | ADMIN_SISTEM, ADMIN_KANTOR, AHLI_K3, PIMPINAN | PROTECTED |
| / | GET | authenticate | Semua | PROTECTED |

### Modul: inspections (`/api/v1/inspections`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| / | GET | authenticate | Semua | PROTECTED |
| /templates | GET | authenticate | Semua | PROTECTED |
| /:id | GET | authenticate | Semua | PROTECTED |
| /templates/:id/validate | POST | authenticate | ADMIN_SISTEM, PIMPINAN | PROTECTED |
| /templates/:id/invalidate | POST | authenticate | ADMIN_SISTEM, PIMPINAN | PROTECTED |
| /start | POST | authenticate | AHLI_K3 (+ alias INSPECTOR) | PROTECTED |
| /:id/draft | PUT | authenticate | AHLI_K3, INSPECTOR, ADMIN_SISTEM | PROTECTED |
| /:id/findings | POST | authenticate | AHLI_K3 | PROTECTED |
| /:id/findings/:fId/attachments | POST | authenticate | AHLI_K3, INSPECTOR, ADMIN_SISTEM | PROTECTED |
| /:id/signature | POST | authenticate | AHLI_K3, ADMIN_KANTOR, ADMIN_SISTEM | PROTECTED |
| /:id/client-signature | POST | authenticate | INSPECTOR, AHLI_K3, ADMIN_KANTOR, ADMIN_SISTEM | PROTECTED |
| /:id/submit | POST | authenticate | AHLI_K3, INSPECTOR, ADMIN_SISTEM | PROTECTED |
| /:id/pdf | GET | authenticate | ADMIN_SISTEM, PIMPINAN, AHLI_K3 | PROTECTED |

### Modul: bap (`/api/v1/bap`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| /scopes | GET | authenticate | Semua | PROTECTED |
| / | GET | authenticate | Semua | PROTECTED |
| /:id | GET | authenticate | Semua | PROTECTED |
| /:id | PUT | authenticate | AHLI_K3, INSPECTOR, ADMIN_SISTEM | PROTECTED |
| /:id/signature | POST | authenticate | AHLI_K3, INSPECTOR, ADMIN_SISTEM | PROTECTED |
| /:id/reopen | POST | authenticate | ADMIN_SISTEM, MARKETING | PROTECTED |
| /:id/finalize | POST | authenticate | MARKETING, ADMIN_SISTEM | PROTECTED |
| /:id/pdf | GET | authenticate | Semua | PROTECTED |
| /order/:orderId/batch-pdf | GET | authenticate | Semua | PROTECTED |

### Modul: lhpp (`/api/v1/lhpp`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| / | GET | authenticate | Semua | PROTECTED |
| /:id | GET | authenticate | Semua | PROTECTED |
| /:id/draft | PUT | authenticate | AHLI_K3, INSPECTOR, ADMIN_SISTEM | PROTECTED |
| /:id/photos | POST | authenticate | AHLI_K3, INSPECTOR, ADMIN_SISTEM | PROTECTED |
| /:id/photos/:photoId | DELETE | authenticate | AHLI_K3, INSPECTOR, ADMIN_SISTEM | PROTECTED |
| /:id/submit-finalization | POST | authenticate | INSPECTOR (+ alias AHLI_K3) | PROTECTED |
| /:id/finalize | POST | authenticate | MARKETING, ADMIN_SISTEM | PROTECTED |
| /:id/return | POST | authenticate | MARKETING, ADMIN_SISTEM (via finalize flow) | PROTECTED |
| /:id/pdf | GET | authenticate | Semua | PROTECTED |
| /:id/deliveries | POST | authenticate | ADMIN_KANTOR, ADMIN_SISTEM | PROTECTED |
| /:id/review (legacy) | POST | authenticate | ADMIN_SISTEM, MARKETING (returns 410) | PROTECTED |

### Modul: suket (`/api/v1/suket`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| / | GET | authenticate | ADMIN_SISTEM, ADMIN_KANTOR, PIMPINAN | PROTECTED |
| /:id | GET | authenticate | ADMIN_SISTEM, ADMIN_KANTOR, PIMPINAN | PROTECTED |
| / | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/publish | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/revoke | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/extend | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |

### Modul: reminders (`/api/v1/reminders`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| Semua route | ALL | authenticate | ADMIN_SISTEM, ADMIN_KANTOR, PIMPINAN | PROTECTED |
| /run-dispatch | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |

### Modul: distributions (`/api/v1/distributions`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| / | GET | authenticate | Semua | PROTECTED |
| /:id | GET | authenticate | Semua | PROTECTED |
| /:id/status | PATCH | authenticate | MARKETING, ADMIN_KANTOR, ADMIN_SISTEM | PROTECTED |
| /:id/receive | POST | authenticate | MARKETING, ADMIN_KANTOR, ADMIN_SISTEM | PROTECTED |

### Modul: operational-issues (`/api/v1/issues`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| / | GET | authenticate | Semua | PROTECTED |
| /:id | GET | authenticate | Semua | PROTECTED |
| / | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR, INSPECTOR | PROTECTED |
| /:id | PATCH | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /:id/evidence | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR, INSPECTOR | PROTECTED |

### Modul: notifications (`/api/v1/notifications`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| Semua route | ALL | authenticate | Semua | PROTECTED |

### Modul: search (`/api/v1/search`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| / | GET | authenticate | Semua | PROTECTED |

### Modul: audit-log (`/api/v1/audit-logs`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| / | GET | authenticate | ADMIN_SISTEM, PIMPINAN | PROTECTED |

### Modul: portal (`/api/v1/portal`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| /tokens | POST | authenticate | ADMIN_SISTEM, ADMIN_KANTOR | PROTECTED |
| /tokens/client/:id | GET | authenticate | ADMIN_SISTEM, ADMIN_KANTOR, PIMPINAN | PROTECTED |
| /access/:token | GET | Tidak (publik terproteksi token) | Token based | UNPROTECTED (disengaja) |

### Modul: verify (`/api/v1/verify`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| /:code | GET | Tidak (publik) | - | UNPROTECTED (disengaja) |

### Modul: dashboard-files (`/api/v1/dashboard`)

| Endpoint | Method | Auth | Roles | Status |
|---|---|---|---|---|
| /summary | GET | authenticate | Semua | PROTECTED |
| /work-queue | GET | authenticate | Semua | PROTECTED |
| /export-recap.csv | GET | authenticate | ADMIN_SISTEM, ADMIN_KANTOR, PIMPINAN | PROTECTED |
| /files/:fileId | GET | authenticate | Semua (akses file per user) | PROTECTED |

### Endpoint Publik (`/api/v1/health`)

| Endpoint | Method | Auth | Status |
|---|---|---|---|
| /api/v1/health | GET | Tidak | UNPROTECTED (disengaja - health check) |

---

## Ringkasan

| Kategori | Jumlah |
|---|---|
| Endpoint PROTECTED | 60+ |
| Endpoint UNPROTECTED (disengaja publik) | 5 |
| Endpoint yang DIPERBAIKI | 0 |

### Endpoint Publik yang Disengaja

1. `POST /api/v1/auth/login` - Login publik (rate limited)
2. `POST /api/v1/auth/refresh` - Refresh token via cookie
3. `POST /api/v1/auth/logout` - Logout (hapus session)
4. `GET /api/v1/verify/:code` - Verifikasi dokumen publik (QR code)
5. `GET /api/v1/portal/access/:token` - Akses portal klien via token
6. `GET /api/v1/health` - Health check

Semua endpoint publik di atas adalah disengaja dan aman karena tidak mengekspos data sensitif tanpa token/autentikasi yang valid.

---

## Kesimpulan Permission

**Tidak ditemukan endpoint yang seharusnya terlindungi tetapi tidak dilindungi.** Semua modul backend menggunakan `router.use(authenticate)` sebagai lapisan pertama, dengan `authorize(roles)` per endpoint untuk pembatasan lebih spesifik. Middleware alias role di `authorize.js` memastikan AHLI_K3, ADMIN_KANTOR, dan MANAGER dikenali sebagai sinonim dari INSPECTOR, MARKETING, dan PIMPINAN.
