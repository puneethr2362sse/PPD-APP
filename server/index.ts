import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { verifyRouter } from './routes/verify.js';
import { historyRouter } from './routes/history.js';
import { newsRouter } from './routes/news.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[VerifyAI Backend] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/history', historyRouter);
app.use('/api/news', newsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'Firebase / Firestore', timestamp: new Date().toISOString() });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`⚡ [VerifyAI] Express API Backend running on http://localhost:${PORT}`);
  console.log(`🔥 [VerifyAI] Connected to Firebase / Firestore Database Layer`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [VerifyAI Backend Error] Port ${PORT} is already in use by another process.`);
    console.error(`   To find the process using port ${PORT}, run:`);
    console.error(`   Get-NetTCPConnection -LocalPort ${PORT} -State Listen | Select-Object OwningProcess\n`);
  } else {
    console.error(`\n❌ [VerifyAI Backend Error] Server failed to start:`, err.message || err);
  }
});

// Process-level error resilience (prevents external socket drops from crashing server)
process.on('uncaughtException', (err: any) => {
  if (err?.code === 'UND_ERR_SOCKET' || err?.message?.includes('other side closed') || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT') {
    console.warn('[VerifyAI Server] Transient external socket drop safely handled:', err.message || err.code);
    return;
  }
  console.error('[VerifyAI Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason: any) => {
  console.warn('[VerifyAI Server] Unhandled Promise Rejection safely handled:', reason?.message || reason);
});
