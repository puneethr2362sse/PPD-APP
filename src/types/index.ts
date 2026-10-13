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
export type VerificationVerdict =
  | 'TRUE'
  | 'FALSE'
  | 'PARTLY_TRUE'
  | 'MISLEADING'
  | 'UNVERIFIED'
  | 'REAL'
  | 'FAKE';

export type VerificationVerdictLabel =
  | 'TRUE / SUPPORTED'
  | 'FALSE / CONTRADICTED'
  | 'PARTLY TRUE'
  | 'MISLEADING / OUT OF CONTEXT'
  | 'UNVERIFIED / INSUFFICIENT EVIDENCE'
  | "YES, IT'S TRUE"
  | "NO, IT'S NOT TRUE"
  | 'NOT ENOUGH EVIDENCE';

export interface ForensicSignal {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  score: number; // 0-100
  detail: string;
}

export type ClaimClassificationStatus =
  | 'CURRENTLY_SUPPORTED'
  | 'HISTORICAL_OUTDATED'
  | 'OFFICIALLY_SCHEDULED_FUTURE'
  | 'FALSE_CONTRADICTED'
  | 'PARTLY_TRUE'
  | 'MISLEADING_WRONG_CONTEXT'
  | 'UNVERIFIED_INSUFFICIENT_EVIDENCE'
  | 'SUPPORTED'
  | 'CONTRADICTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NO_CLAIM_DETECTED';

export interface TimelineData {
  eventDate?: string;
  publicationDate?: string;
  currentStatus?: string;
  temporalStatus?: 'past' | 'current' | 'future' | 'unknown';
}

export interface ImageAnalysisModules {
  imageDescription?: string;
  // Module 1: AI-generated image assessment
  aiGeneration: {
    status: 'INCONCLUSIVE' | 'POSSIBLE_AI' | 'UNLIKELY_AI' | 'LIKELY_AI' | 'LIKELY_REAL' | 'DIGITAL_GRAPHIC' | 'UNCERTAIN';
    label: string;
    observations: string;
    limitations: string;
    visualCategory?: 'LIKELY_AI' | 'LIKELY_REAL' | 'DIGITAL_GRAPHIC' | 'UNCERTAIN';
  };
  // Module 2: Image manipulation assessment
  manipulation: {
    status: 'INCONCLUSIVE' | 'POSSIBLE_EDIT' | 'NO_VISIBLE_EDITS' | 'NORMAL_DESIGN' | 'ORDINARY_EDITING' | 'POTENTIALLY_MISLEADING' | 'CONFIRMED_MANIPULATION';
    label: string;
    observations: string;
    limitations: string;
    manipulationCategory?: 'NORMAL_DESIGN' | 'ORDINARY_EDITING' | 'POTENTIALLY_MISLEADING' | 'CONFIRMED_MANIPULATION' | 'NO_VISIBLE_EDITS';
  };
  // Module 3: Source and provenance verification
  provenance: {
    dimensions?: { width: number; height: number };
    format?: string;
    fileSizeKB?: number;
    metadataFound: boolean;
    reverseSearchStatus: 'NOT_CONFIGURED';
    summary: string;
  };
  // Module 4: Image-based claim and news verification (multilingual OCR + web search)
  claimVerification: {
    extractedText?: string;
    cleanedReadableText?: string;
    detectedLanguage?: string;
    extractedClaim?: string;
    status: ClaimClassificationStatus;
    detailedStatus?: ClaimClassificationStatus;
    statusLabel?: string;
    label: string;
    evidenceSummary: string;
    timeline?: TimelineData;
    sources: Array<{ name: string; url: string; pubDate?: string; reliability?: number; snippet?: string; domain?: string }>;
    claims?: Array<{
      text: string;
      type: string;
      isVerifiable: boolean;
      temporalContext?: string;
      verdict?: string;
      statusLabel?: string;
    }>;
  };
}

export interface VerificationResult {
  id: string;
  userEmail: string;
  type: ScanType;
  timestamp: string; // ISO string
  formattedDate: string; // e.g. "Today, 10:30 PM"
  score: number; // 0-100
  verdict: VerificationVerdict;
  verdictLabel?: VerificationVerdictLabel | string;
  compoundVerdict?: string;
  imageAuthenticity?: 'AUTHENTIC' | 'POSSIBLE_AI' | 'EDITED' | 'NOT_VERIFIED';
  imageAuthenticityLabel?: string; // "IMAGE AUTHENTICITY: NOT VERIFIED" | "IMAGE AUTHENTICITY: AUTHENTIC PHOTO" etc.
  claimStatus?: ClaimClassificationStatus;
  claimStatusLabel?: string;
  imageDescription?: string;
  timeline?: TimelineData;
  technicalDetails?: {
    modelUsed?: string;
    searchTimestamp?: string;
    rawMimeType?: string;
    fileSizeKB?: number;
  };
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
  aiAnalysisStatus?: 'SUCCESS' | 'QUOTA_EXHAUSTED' | 'RATE_LIMIT_TRANSIENT' | 'INVALID_API_KEY' | 'UNAVAILABLE' | 'SKIPPED';
  aiNotice?: string;
  signals: ForensicSignal[];
  sources?: Array<{ name: string; url?: string; reliability?: number; snippet?: string; pubDate?: string; domain?: string }>;
  imageModules?: ImageAnalysisModules;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  timeAgo: string;
  summary: string;
  link?: string;
  pubDate?: string;
  verifiedVerdict?: VerificationVerdict;
  score?: number;
  claimText: string;
  imageUrl?: string;
  tags?: string[];
}
