export interface User {
  id: string; // Internal unique Firebase UID / database ID
  userId?: string; // User-chosen public User ID (e.g. puneeth123)
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  authProvider?: string;
  customDisplayName?: boolean;
  customPhoto?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface OTPState {
  email: string;
  code: string;
  expiresAt: number;
  purpose: 'login' | 'register';
  tempName?: string;
  tempUserId?: string; // User-selected User ID during registration
  tempPassword?: string;
  tempPhone?: string;
}

export type ScanType = 'TEXT' | 'IMAGE';
export type VerificationVerdict = 'REAL' | 'FAKE' | 'TRUE' | 'FALSE' | 'UNVERIFIED';

export interface ForensicSignal {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  score: number; // 0-100
  detail: string;
}

export interface VerificationResult {
  id: string;
  userEmail: string;
  type: ScanType;
  timestamp: string; // ISO string
  formattedDate: string; // e.g. "Today, 10:30 PM"
  score: number; // 0-100
  verdict: VerificationVerdict;
  verdictLabel?: string; // "YES, IT'S TRUE" | "NO, IT'S NOT TRUE" | "NOT ENOUGH EVIDENCE"
  claim?: string;
  originalClaim?: string;
  preview: string; // Text snippet or image title
  fullContent?: string;
  imageUrl?: string;
  imageDimensions?: { width: number; height: number };
  explanation: string;
  reasoning?: string; // 4-part evidence-to-claim contradiction breakdown
  confidence: number; // 0-100%
  directAnswer?: string; // Direct factual answer for questions
  queryType?: 'question' | 'claim';
  isLiveWebVerified?: boolean;
  searchTimestamp?: string;
  signals: ForensicSignal[];
  sources?: Array<{ name: string; url?: string; reliability?: number; snippet?: string; pubDate?: string }>;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  timeAgo: string;
  summary: string;
  verifiedVerdict: VerificationVerdict;
  score: 0 | 100;
  claimText: string;
  imageUrl?: string;
  tags: string[];
}
