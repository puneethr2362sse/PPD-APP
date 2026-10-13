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
  const id = String(req.params.id || '');
  const rawEmail = req.query.email;
  const email = (typeof rawEmail === 'string' ? rawEmail : Array.isArray(rawEmail) ? String(rawEmail[0]) : '').trim().toLowerCase();

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

// 4. GET USER STATS (Real persisted user verification metrics)
historyRouter.get('/stats', (req: Request, res: Response): void => {
  const email = (req.query.email as string || '').trim().toLowerCase();
  if (!email) {
    res.json({
      success: true,
      stats: {
        totalScans: 0,
        realCount: 0,
        fakeCount: 0,
        unverifiedCount: 0,
        trustRating: 0,
      }
    });
    return;
  }

  const allScans = firestoreDB.getScansByUser(email);

  // Preloaded sample cards, hardcoded examples, trending feed items, and demo content must not increase stats
  const userScans = allScans.filter((s: any) =>
    !s.isSample &&
    !s.isDemo &&
    !String(s.id).startsWith('scan_puneeth_') &&
    !String(s.id).startsWith('sample_')
  );

  const totalScans = userScans.length;
  // TRUE or REAL verdicts count as Real Verified
  const realCount = userScans.filter((s: any) => s.verdict === 'REAL' || s.verdict === 'TRUE').length;
  // FALSE or FAKE verdicts count as Fakes Detected
  const fakeCount = userScans.filter((s: any) => s.verdict === 'FAKE' || s.verdict === 'FALSE').length;
  // NOT ENOUGH EVIDENCE or UNVERIFIED are kept separate; never classified as TRUE or FALSE
  const unverifiedCount = userScans.filter((s: any) => s.verdict === 'UNVERIFIED' || s.verdict === 'NOT ENOUGH EVIDENCE').length;

  // Legitimate Trust Rating calculated from genuine persisted verification data
  let trustRating = 0;
  if (totalScans > 0) {
    const totalConfidence = userScans.reduce((sum: number, s: any) => {
      const conf = typeof s.confidence === 'number' && !isNaN(s.confidence)
        ? s.confidence
        : (s.verdict === 'REAL' || s.verdict === 'TRUE' ? 95 : s.verdict === 'FAKE' || s.verdict === 'FALSE' ? 90 : 50);
      return sum + conf;
    }, 0);
    trustRating = Math.round(totalConfidence / totalScans);
  }

  res.json({
    success: true,
    stats: {
      totalScans,
      realCount,
      fakeCount,
      unverifiedCount,
      trustRating,
    }
  });
});
