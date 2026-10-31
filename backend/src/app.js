import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import auditRoutes from './modules/audit-log/routes.js';
import authRoutes from './modules/auth/routes.js';
import bapRoutes from './modules/bap/routes.js';
import clientRoutes from './modules/clients/routes.js';
import dashboardAndFileRoutes from './modules/dashboard-files.js';
import distributionRoutes from './modules/distributions/routes.js';
import portalRoutes from './modules/portal/routes.js';
import searchRoutes from './modules/search/routes.js';
import verifyRoutes from './modules/verify/routes.js';
import inspectionRoutes from './modules/inspections/routes.js';
import inspectorRoutes from './modules/inspectors/routes.js';
import lhppRoutes from './modules/lhpp/routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import operationalIssueRoutes from './modules/operational-issues/routes.js';
import objectRoutes from './modules/objects/routes.js';
import orderRoutes from './modules/orders/routes.js';
import reminderRoutes from './modules/reminders/routes.js';
import scheduleRoutes from './modules/scheduling/routes.js';
import suketRoutes from './modules/suket/routes.js';
import userRoutes from './modules/users/routes.js';
import { AppError } from './utils/http.js';

export const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'same-site' }
  })
);

const allowedOrigins = env.corsOrigin.split(',').map((o) => o.trim());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new AppError(403, 'CORS_FORBIDDEN', 'Origin tidak diizinkan.'));
    },
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));

// Perlindungan CSRF untuk request mutasi yang mengandalkan cookie HttpOnly:
// mewajibkan custom header X-Requested-With atau Authorization Bearer, serta memeriksa Origin bila ada.
app.use((req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const usesCookies = Boolean(req.cookies?.urd_access || req.cookies?.urd_refresh);
  const hasBearer = Boolean(req.headers.authorization?.startsWith('Bearer '));
  const hasXhrHeader = req.headers['x-requested-with'] === 'XMLHttpRequest';

  if (usesCookies && !hasBearer && !hasXhrHeader) {
    return next(
      new AppError(
        403,
        'CSRF_PROTECTED',
        'Permintaan ditolak karena header keamanan X-Requested-With tidak disertakan.'
      )
    );
  }
  return next();
});

if (!env.isTest) {
  app.use(
    '/api/v1/auth/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 25,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: {
          code: 'RATE_LIMITED',
          message: 'Terlalu banyak percobaan masuk. Silakan coba kembali beberapa saat lagi.'
        }
      }
    })
  );
}

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'PT Upaya Riksa Daya API' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/objects', objectRoutes);
app.use('/api/v1/inspectors', inspectorRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/inspections', inspectionRoutes);
app.use('/api/v1/bap', bapRoutes);
app.use('/api/v1/lhpp', lhppRoutes);
app.use('/api/v1/suket', suketRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/portal', portalRoutes);
app.use('/api/v1/distributions', distributionRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/issues', operationalIssueRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/dashboard', dashboardAndFileRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/verify', verifyRoutes);

app.use(notFound);
app.use(errorHandler);

