import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from '../server/routes/auth.js';
import { verifyRouter } from '../server/routes/verify.js';
import { historyRouter } from '../server/routes/history.js';
import { newsRouter } from '../server/routes/news.js';

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Safe request logger & path normalizer for Vercel Serverless
app.use((req, _res, next) => {
  // If Vercel rewrote the subpath into edge headers, normalize req.url
  const forwardedUri = (req.headers['x-forwarded-uri'] || req.headers['x-matched-path'] || req.headers['x-vercel-matched-path']) as string;
  if (forwardedUri && (req.url === '/api/index' || req.url === '/api' || req.url === '/' || req.url.startsWith('/api/index?') || req.url.startsWith('/api?') || req.url.startsWith('/?'))) {
    const queryIdx = req.url.indexOf('?');
    const queryPart = queryIdx !== -1 ? req.url.substring(queryIdx) : '';
    req.url = forwardedUri.includes('?') ? forwardedUri : `${forwardedUri}${queryPart}`;
  }
  // Safe diagnostic log (method & sanitized path only, never log body or headers)
  console.log(`[Vercel Serverless] ${req.method} ${req.path}`);
  next();
});

// API Routes (Mounted on both /api/* and root /* to guarantee matching across all Vercel rewrite modes)
app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/verify', '/verify'], verifyRouter);
app.use(['/api/history', '/history'], historyRouter);
app.use(['/api/news', '/news'], newsRouter);

// Health check
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'ok',
    environment: 'Vercel Serverless / Cloud Functions',
    database: 'Firebase / Firestore',
    timestamp: new Date().toISOString()
  });
});

export default app;
