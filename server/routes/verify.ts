import { Router, Request, Response } from 'express';
import { firestoreDB } from '../firebaseConfig.js';
import { realtimeVerifier } from '../services/realtimeVerifier.js';
import { imageVerifier } from '../services/imageVerifier.js';

export const verifyRouter = Router();

// Helper to format date like "Today, 10:30 PM"
function formatScanTimestamp(date: Date = new Date()): string {
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `Today, ${timeStr}`;
}

// 1. TEXT VERIFICATION ENDPOINT (Real-time Web Search & Gemini Grounding)
verifyRouter.post('/text', async (req: Request, res: Response): Promise<void> => {
  const { text, claim, email } = req.body;
  const rawText = text || claim;

  if (!rawText || !rawText.trim()) {
    res.status(400).json({ success: false, error: 'Text content is required for verification.' });
    return;
  }

  const cleanEmail = email ? email.trim().toLowerCase() : 'demo@example.com';
  const cleanText = rawText.trim();

  try {
    // Perform real-time live web evidence gathering and Gemini evaluation
    const analysis = await realtimeVerifier.verifyClaim(cleanText);

    const preview = cleanText.length > 90 ? cleanText.substring(0, 87) + '...' : cleanText;

    const scanRecord = {
      id: 'scan_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userEmail: cleanEmail,
      type: 'TEXT' as const,
      timestamp: new Date().toISOString(),
      formattedDate: formatScanTimestamp(new Date()),
      score: analysis.score,
      verdict: analysis.verdict,
      verdictLabel: analysis.verdictLabel,
      claimStatus: analysis.claimStatus,
      claimStatusLabel: analysis.claimStatusLabel,
      timeline: analysis.timeline,
      claim: cleanText,
      originalClaim: cleanText,
      preview,
      fullContent: cleanText,
      explanation: analysis.explanation,
      reasoning: analysis.reasoning,
      confidence: analysis.confidence,
      directAnswer: analysis.directAnswer,
      queryType: analysis.queryType,
      isLiveWebVerified: analysis.isLiveWebVerified,
      searchTimestamp: analysis.searchTimestamp,
      aiAnalysisStatus: analysis.aiAnalysisStatus,
      aiNotice: analysis.aiNotice,
      signals: analysis.signals,
      sources: analysis.sources,
    };

    // Commit scan directly to Firestore
    firestoreDB.addScan(scanRecord as any);

    res.json({
      success: true,
      result: scanRecord,
    });
  } catch (err: any) {
    console.error('[Verify Route] Text verification error:', err);
    res.status(503).json({
      success: false,
      error: 'Live verification is currently unavailable. Please try again.',
    });
  }
});

// 2. REAL IMAGE VERIFICATION ENDPOINT (Multimodal Gemini Vision + 4 Modules)
verifyRouter.post('/image', async (req: Request, res: Response): Promise<void> => {
  const { name, dataUrl, width, height, email } = req.body;

  if (!dataUrl) {
    res.status(400).json({ success: false, error: 'Image data is required for verification.' });
    return;
  }

  try {
    const scanRecord = await imageVerifier.verifyImage({
      name,
      dataUrl,
      width,
      height,
      email,
    });

    res.json({
      success: true,
      result: scanRecord,
    });
  } catch (err: any) {
    const msg = err.message || 'Image verification failed.';
    const isClientErr = msg.includes('format') || msg.includes('large') || msg.includes('encoding') || msg.includes('corrupted');
    const isRateLimit = msg.includes('quota') || msg.includes('rate limit');
    const statusCode = isClientErr ? 400 : isRateLimit ? 429 : 500;

    res.status(statusCode).json({
      success: false,
      error: msg,
    });
  }
});
