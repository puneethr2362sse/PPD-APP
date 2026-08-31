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
app.listen(PORT, () => {
  console.log(`⚡ [VerifyAI] Express API Backend running on http://localhost:${PORT}`);
  console.log(`🔥 [VerifyAI] Connected to Firebase / Firestore Database Layer`);
});
