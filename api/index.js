import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';
import adminRouter from './routes/admin.route.js';
import { getFirebaseConfig, initFirebaseStore } from './utils/firebaseStore.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const clientDist = path.join(rootDir, 'client', 'dist');
const adminDist = path.join(rootDir, 'admin-app', 'dist');

// Non-blocking build check to ensure immediate port binding on dev startup
if (!fs.existsSync(clientDist) || !fs.existsSync(adminDist)) {
  console.log('[Backend] Dist artifacts missing; triggering background build...');
  exec('npm run build', { cwd: rootDir }, (err) => {
    if (err) {
      console.warn('[Backend] Background build notice:', err.message);
    } else {
      console.log('[Backend] Background build completed.');
    }
  });
}

const app = express();
const firebaseConfig = getFirebaseConfig();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Permissive CORS middleware for dev server / preview iframe
app.use((req, res, next) => {
  const origin = req.headers.origin?.replace(/\/+$/, '');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    const isOnline = await initFirebaseStore();
    return res.status(200).json({
      status: 'ok',
      database: isOnline ? 'firestore' : 'local-storage',
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
    });
  } catch (_error) {
    return res.status(200).json({
      status: 'ok',
      database: 'local-storage',
      message: 'Running with local persistent store.',
    });
  }
});

// Primary backend API routers
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);
app.use('/api/admin', adminRouter);

// Catch-all for undefined /api routes
app.all('/api/*', (req, res) => {
  return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// Centralized error handler
app.use((err, req, res, _next) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      statusCode: 413,
      message: 'Uploaded payload or image is too large. Please select a compressed or smaller image.',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) {
    console.error(`[Backend] ${req.method} ${req.path} failed:`, err.message);
  } else {
    console.warn(`[Backend] ${req.method} ${req.path} (${statusCode}):`, err.message);
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || 'Internal Server Error',
  });
});

// Serve Admin App at /admin
app.use('/admin', express.static(adminDist));
app.get(['/admin', '/admin/*'], (_req, res) => {
  const adminIndexHtml = path.join(adminDist, 'index.html');
  if (fs.existsSync(adminIndexHtml)) {
    return res.sendFile(adminIndexHtml);
  }
  return res.status(200).send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="2"><title>Loading Chento Admin...</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head><body><div style="text-align:center"><h2 style="font-size:24px;margin-bottom:8px">Loading Chento Admin...</h2></div></body></html>`);
});

// Serve Client App at root (with SPA fallback)
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
  }
  const clientIndexHtml = path.join(clientDist, 'index.html');
  if (fs.existsSync(clientIndexHtml)) {
    return res.sendFile(clientIndexHtml);
  }
  return res.status(200).send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="2"><title>Starting chento 100...</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#030712;color:#f9fafb;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head><body><div style="text-align:center"><h2 style="font-size:24px;margin-bottom:8px">Starting chento 100...</h2><p style="color:#9ca3af;font-size:14px">Preparing assets, will reload in a moment...</p></div></body></html>`);
});

initFirebaseStore().catch((error) => console.log('[Backend] Storage initialized:', error.message));

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port} (0.0.0.0).`);
});

server.on('error', (err) => {
  console.error('[Backend Server Error]', err);
});

export { app };
export default app;
