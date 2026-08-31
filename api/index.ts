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

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/history', historyRouter);
app.use('/api/news', newsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: 'Vercel Serverless / Cloud Functions',
    database: 'Firebase / Firestore',
    timestamp: new Date().toISOString()
  });
});

export default app;
