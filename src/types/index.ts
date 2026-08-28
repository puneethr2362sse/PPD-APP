export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface OTPState {
  email: string;
  code: string;
  expiresAt: number;
  purpose: 'login' | 'register';
  tempName?: string;
  tempPassword?: string;
  tempPhone?: string;
}

export type ScanType = 'TEXT' | 'IMAGE';
export type VerificationVerdict = 'REAL' | 'FAKE';

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
  score: 0 | 100;
  verdict: VerificationVerdict;
  preview: string; // Text snippet or image title
  fullContent?: string;
  imageUrl?: string;
  imageDimensions?: { width: number; height: number };
  explanation: string;
  confidence: number; // 90-99%
  signals: ForensicSignal[];
  sources?: Array<{ name: string; url?: string; reliability: number }>;
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
