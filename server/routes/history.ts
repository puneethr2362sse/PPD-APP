import { Router, Request, Response } from 'express';
import { firestoreDB } from '../firebaseConfig.js';

export const historyRouter = Router();

// 1. GET USER HISTORY
historyRouter.get('/', (req: Request, res: Response): void => {
  const email = (req.query.email as string || '').trim().toLowerCase();
  if (!email) {
    res.json({ success: true, history: [] });
    return;
  }

  const scans = firestoreDB.getScansByUser(email);
  res.json({ success: true, history: scans });
});

// 2. DELETE SINGLE SCAN
historyRouter.delete('/:id', (req: Request, res: Response): void => {
  const id = req.params.id;
  const email = (req.query.email as string || '').trim().toLowerCase();

  const success = firestoreDB.deleteScan(id, email);
  res.json({ success, message: success ? 'Scan deleted.' : 'Scan not found.' });
});

// 3. CLEAR ALL USER SCANS
historyRouter.delete('/', (req: Request, res: Response): void => {
  const email = (req.query.email as string || '').trim().toLowerCase();
  if (!email) {
    res.status(400).json({ success: false, error: 'Email required.' });
    return;
  }

  const count = firestoreDB.clearUserScans(email);
  res.json({ success: true, clearedCount: count });
});

// 4. GET USER STATS
historyRouter.get('/stats', (req: Request, res: Response): void => {
  const email = (req.query.email as string || '').trim().toLowerCase();
  const scans = firestoreDB.getScansByUser(email);

  const totalScans = scans.length;
  const realCount = scans.filter((s: any) => s.verdict === 'REAL').length;
  const fakeCount = scans.filter((s: any) => s.verdict === 'FAKE').length;
  const trustRating = totalScans === 0 ? 98 : Math.round(90 + (fakeCount / Math.max(1, totalScans)) * 8);

  res.json({
    success: true,
    stats: {
      totalScans,
      realCount,
      fakeCount,
      trustRating,
    }
  });
});
