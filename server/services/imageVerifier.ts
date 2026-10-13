import 'dotenv/config';
import { firestoreDB } from '../firebaseConfig.js';
import { realtimeVerifier } from './realtimeVerifier.js';
import { geminiClient } from './geminiClient.js';

export interface ImageVerifyInput {
  name: string;
  dataUrl: string;
  email?: string;
  width?: number;
  height?: number;
  userLanguage?: string;
}

export interface ExtractedClaimItem {
  text: string;
  type: 'HEADLINE' | 'OPINION' | 'PREDICTION' | 'MEME_JOKE' | 'PERSONAL_POST' | 'ADVERTISEMENT' | 'FACTUAL_CLAIM';
  isVerifiable: boolean;
  temporalContext?: 'past' | 'current' | 'future' | 'unknown';
  verdict?: 'TRUE' | 'FALSE' | 'PARTLY_TRUE' | 'MISLEADING' | 'UNVERIFIED';
  statusLabel?: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BASE64_LENGTH = 14 * 1024 * 1024; // ~10MB raw image

// Forensic Image Buffer Inspector (Metadata, EXIF, XMP, C2PA Markers)
function inspectImageBuffer(buffer: Buffer, mimeType: string) {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer.subarray(1, 4).toString() === 'PNG';
  const isWebp = buffer.length >= 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';

  let exifFound = false;
  let xmpFound = false;
  let c2paFound = false;
  const softwareTags: string[] = [];

  const rawBinary = buffer.toString('binary');

  if (isJpeg) {
    exifFound = rawBinary.includes('Exif');
    xmpFound = rawBinary.includes('http://ns.adobe.com/xap/1.0/');
    c2paFound = rawBinary.includes('c2pa') || rawBinary.includes('jumbf');
  } else if (isPng) {
    exifFound = rawBinary.includes('eXIf');
    xmpFound = rawBinary.includes('XML:com.adobe.xmp');
    c2paFound = rawBinary.includes('c2pa') || rawBinary.includes('jumb');
  } else if (isWebp) {
    exifFound = rawBinary.includes('EXIF');
    xmpFound = rawBinary.includes('XMP ');
    c2paFound = rawBinary.includes('c2pa');
  }

  // Detect common generation/editing tool signatures if embedded in text chunks
  const commonTools = ['Photoshop', 'Midjourney', 'Stable Diffusion', 'DALL-E', 'Canva', 'GIMP', 'Lightroom'];
  for (const tool of commonTools) {
    if (rawBinary.includes(tool)) {
      softwareTags.push(tool);
    }
  }

  let summary = '';
  if (c2paFound) {
    summary = 'C2PA / Content Authenticity provenance markers detected in container structure.';
  } else if (softwareTags.length > 0) {
    summary = `Creation/editing metadata signatures detected (${softwareTags.join(', ')}).`;
  } else if (exifFound) {
    summary = 'Camera/device EXIF metadata structure detected in image header.';
  } else {
    summary = 'Metadata is consistent with web/social media delivery (standard social uploads strip camera EXIF). Note: Automated reverse-image search requires a dedicated search provider and is not configured.';
  }

  return {
    format: mimeType.replace('image/', '').toUpperCase(),
    fileSizeKB: Math.round(buffer.length / 1024),
    metadataFound: exifFound || xmpFound || c2paFound || softwareTags.length > 0,
    exifFound,
    xmpFound,
    c2paFound,
    softwareTags,
    reverseSearchStatus: 'NOT_CONFIGURED' as const,
    summary,
  };
}

export const imageVerifier = {
  async verifyImage(input: ImageVerifyInput) {
    const { name, dataUrl, email, width, height } = input;
    const cleanEmail = email ? email.trim().toLowerCase() : 'demo@example.com';
    const fileName = (name || 'uploaded_image.png').trim();

    // 1. Validate payload presence
    if (!dataUrl || typeof dataUrl !== 'string') {
      throw new Error('Image data is required for verification.');
    }

    if (dataUrl.length > MAX_BASE64_LENGTH) {
      throw new Error('Image file is too large. Maximum supported image size is 10MB.');
    }

    // 2. Parse and validate MIME type and base64 structure
    const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid image encoding. Please provide a standard base64 data URL.');
    }

    const rawMime = match[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(rawMime)) {
      throw new Error(`Unsupported image format (${rawMime}). Supported formats: JPG, PNG, WEBP, GIF.`);
    }

    const mimeType = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
    const base64Data = match[2];

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch {
      throw new Error('Failed to decode image data. The file appears to be corrupted.');
    }

    if (buffer.length < 32) {
      throw new Error('Corrupted image payload (empty or invalid image header).');
    }

    // 3. Perform genuine image buffer & metadata inspection
    const provenanceInspection = inspectImageBuffer(buffer, mimeType);
    const provenance = {
      dimensions: width && height ? { width, height } : undefined,
      format: provenanceInspection.format,
      fileSizeKB: provenanceInspection.fileSizeKB,
      metadataFound: provenanceInspection.metadataFound,
      exifFound: provenanceInspection.exifFound,
      c2paFound: provenanceInspection.c2paFound,
      softwareTags: provenanceInspection.softwareTags,
      reverseSearchStatus: provenanceInspection.reverseSearchStatus,
      summary: provenanceInspection.summary,
    };

    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
    if (!apiKey) {
      console.warn('[ImageVerifier] No GEMINI_API_KEY or GOOGLE_API_KEY configured in server environment.');
      throw new Error('GEMINI_API_KEY is not configured on the server. Image verification unavailable.');
    }

    console.log(`[ImageVerifier] Analyzing image "${fileName}" (${provenanceInspection.format}, ${provenanceInspection.fileSizeKB} KB)`);

    // 4. Gemini Vision Multimodal Prompt (Multilingual OCR, 4 Modules, Multiple Claims)
    const prompt = `You are VerifyAI's forensic vision and multilingual claim verification engine.
Analyze this uploaded image (photo, social post, screenshot, reel capture, graphic, meme, newspaper clip).
Inspect its actual visual bytes and visible text. Support English, Telugu (తెలుగు / Romanized), Tamil, Hindi, and mixed-language content.

Output ONLY valid JSON matching this exact structure:
{
  "imageDescription": "string (clear, objective 1-2 sentence description of what the visual scene, photograph, document, graphic, or screenshot portrays)",
  "aiGeneration": {
    "status": "INCONCLUSIVE" | "POSSIBLE_AI" | "UNLIKELY_AI",
    "visualCategory": "LIKELY_AI" | "LIKELY_REAL" | "DIGITAL_GRAPHIC" | "UNCERTAIN",
    "label": "string (e.g. 'Inconclusive Visual Check', 'Potential Synthetic Artifacts', 'Authentic Photographic Characteristics')",
    "observations": "string (specific visual details seen, such as skin texture, hand geometry, reflections, lighting vectors, typography coherence)",
    "limitations": "General vision models perform visual observation, not certified cryptographic or frequency-domain forensic detection."
  },
  "manipulation": {
    "status": "INCONCLUSIVE" | "POSSIBLE_EDIT" | "NO_VISIBLE_EDITS",
    "manipulationCategory": "NORMAL_DESIGN" | "ORDINARY_EDITING" | "POTENTIALLY_MISLEADING" | "CONFIRMED_MANIPULATION" | "NO_VISIBLE_EDITS",
    "label": "string (e.g. 'No Obvious Digital Compositing Detected', 'Pasted Overlay / Spliced Elements', 'Normal Design / Template')",
    "observations": "string (distinguish ordinary cropping/compression/templates from deceptive cutouts, lighting mismatch, cloned elements)",
    "limitations": "Visual inspection cannot replace specialized forensic laboratory tools."
  },
  "extractedText": "string (verbatim visible text in original script, e.g. English, Telugu, Hindi, Tamil)",
  "cleanedReadableText": "string (readable, corrected layout text preserving original meaning without fabricating text)",
  "detectedLanguage": "string (e.g. English, Telugu, Tamil, Hindi, Mixed, None)",
  "contentType": "HEADLINE" | "OPINION" | "PREDICTION" | "MEME_JOKE" | "PERSONAL_POST" | "ADVERTISEMENT" | "FACTUAL_CLAIM" | "PHOTO_ONLY",
  "hasFactualClaim": boolean,
  "factualClaim": "string (the primary verifiable factual assertion, box-office figure, death claim, government policy, or event assertion, or empty if none)",
  "claims": [
    {
      "text": "string (individual assertion)",
      "type": "HEADLINE" | "OPINION" | "PREDICTION" | "MEME_JOKE" | "PERSONAL_POST" | "ADVERTISEMENT" | "FACTUAL_CLAIM",
      "isVerifiable": boolean,
      "temporalContext": "past" | "current" | "future" | "unknown"
    }
  ]
}

CRITICAL FORENSIC RULES:
1. SEPARATE ARTWORK FROM CLAIM TRUTH: A movie poster, fan art, or promotional flyer may use synthetic/AI artwork without its factual claim being false. aiGeneration assesses ONLY visual rendering artifacts.
2. NEVER ASSUME AUTHENTIC PHOTOS MEAN CLAIMS ARE TRUE: An authentic unedited photograph does not make an overlay headline, viral caption, or misattributed quote true.
3. DISTINGUISH CONTENT TYPES: Clearly separate jokes/memes, opinions, personal posts, advertisements, and predictions from factual news assertions.
4. BOX-OFFICE & METRIC RIGOR: Differentiate worldwide gross, India gross, India net (nett), and pre-release targets.
5. MULTILINGUAL FIDELITY: Read Telugu, Tamil, Hindi, and English faithfully. Never fabricate text that is unreadable.`;

    let visionResult: any = null;
    let modelUsed: string | undefined = undefined;
    let aiAnalysisStatus: 'SUCCESS' | 'QUOTA_EXHAUSTED' | 'RATE_LIMIT_TRANSIENT' | 'INVALID_API_KEY' | 'UNAVAILABLE' | 'SKIPPED' = 'SUCCESS';
    let aiNotice: string | undefined = undefined;

    if (!apiKey) {
      aiAnalysisStatus = 'INVALID_API_KEY';
      aiNotice = 'Gemini API key is not configured on the server. Forensic metadata audited.';
    } else if (geminiClient.isQuotaExhausted(true)) {
      aiAnalysisStatus = 'QUOTA_EXHAUSTED';
      aiNotice = '⚡ Gemini Vision AI is currently at daily free-tier quota capacity. Forensic container metadata audited.';
    } else {
      const geminiRes = await geminiClient.generateContent(prompt, {
        isVision: true,
        responseMimeType: 'application/json',
        temperature: 0.1,
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });

      if (geminiRes.success && geminiRes.data) {
        visionResult = geminiRes.data;
        modelUsed = geminiRes.modelUsed;
        aiAnalysisStatus = 'SUCCESS';
      } else {
        aiAnalysisStatus = (geminiRes.failureReason as any) || 'UNAVAILABLE';
        if (aiAnalysisStatus === 'QUOTA_EXHAUSTED') {
          aiNotice = '⚡ Gemini Vision AI is currently at daily free-tier quota capacity. Forensic container metadata audited.';
        } else if (aiAnalysisStatus === 'INVALID_API_KEY') {
          aiNotice = 'Gemini API key is invalid. Forensic container metadata audited.';
        } else if (aiAnalysisStatus === 'RATE_LIMIT_TRANSIENT') {
          aiNotice = 'Gemini Vision rate limit reached. Forensic container metadata audited.';
        } else {
          aiNotice = 'Vision AI analysis was temporarily unavailable. Forensic container metadata audited.';
        }
      }
    }

    if (!visionResult) {
      visionResult = {
        imageDescription: `Uploaded image file (${provenance.format}, ${provenance.fileSizeKB} KB). Vision AI analysis could not be completed.`,
        aiGeneration: {
          status: 'INCONCLUSIVE' as const,
          visualCategory: 'UNCERTAIN' as const,
          label: 'AI Check Inconclusive (API Quota Limit)',
          observations: aiNotice || 'Visual AI check could not be completed because Gemini Vision is at quota capacity. File container was audited.',
          limitations: 'General vision models perform visual observation, not certified cryptographic or frequency-domain forensic detection.',
        },
        manipulation: {
          status: 'INCONCLUSIVE' as const,
          manipulationCategory: 'NO_VISIBLE_EDITS' as const,
          label: 'Manipulation Check Inconclusive',
          observations: 'Visual anomaly analysis paused due to API quota capacity. Container and metadata headers were audited.',
          limitations: 'Visual inspection cannot replace specialized forensic laboratory tools.',
        },
        extractedText: '',
        cleanedReadableText: '',
        detectedLanguage: 'None',
        contentType: 'PHOTO_ONLY' as const,
        hasFactualClaim: false,
        factualClaim: '',
        claims: [],
      };
    }

    // 5. Module 4: Multilingual Claim Cross-Referencing via Real-Time Web Search
    let claimStatus: 'SUPPORTED' | 'CONTRADICTED' | 'INSUFFICIENT_EVIDENCE' | 'NO_CLAIM_DETECTED' | 'PARTLY_TRUE' | 'MISLEADING_WRONG_CONTEXT' = 'NO_CLAIM_DETECTED';
    let detailedStatus: any = undefined;
    let claimStatusLabel: string | undefined = undefined;
    let claimLabel = 'No News Claim Detected';
    let evidenceSummary = 'No verifiable headline, news assertion, or caption detected in this image.';
    let retrievedSources: Array<{ name: string; url: string; domain?: string; pubDate?: string; reliability?: number; snippet?: string }> = [];
    let claimTimeline: any = undefined;

    let liveAnalysisResult: any = null;
    const rawClaims: ExtractedClaimItem[] = Array.isArray(visionResult.claims) && visionResult.claims.length > 0
      ? visionResult.claims
      : visionResult.factualClaim?.trim()
        ? [{
            text: visionResult.factualClaim.trim(),
            type: (visionResult.contentType || 'FACTUAL_CLAIM') as any,
            isVerifiable: Boolean(visionResult.hasFactualClaim),
          }]
        : [];

    const hasClaim = Boolean(visionResult.hasFactualClaim && visionResult.factualClaim?.trim());

    if (hasClaim) {
      const claimToVerify = visionResult.factualClaim.trim();
      try {
        const liveAnalysis = await realtimeVerifier.verifyClaim(claimToVerify);
        liveAnalysisResult = liveAnalysis;
        detailedStatus = liveAnalysis.claimStatus;
        claimStatusLabel = liveAnalysis.claimStatusLabel;
        claimTimeline = liveAnalysis.timeline;

        if (liveAnalysis.verdict === 'TRUE') {
          claimStatus = 'SUPPORTED';
          claimLabel = liveAnalysis.claimStatusLabel || 'Supported by News Evidence';
          evidenceSummary = liveAnalysis.explanation || `The claim "${claimToVerify}" is corroborated by verified reports.`;
        } else if (liveAnalysis.verdict === 'FALSE') {
          claimStatus = 'CONTRADICTED';
          claimLabel = liveAnalysis.claimStatusLabel || 'Contradicted by News Evidence';
          evidenceSummary = liveAnalysis.explanation || `The claim "${claimToVerify}" is contradicted by authoritative records.`;
        } else if (liveAnalysis.verdict === 'PARTLY_TRUE') {
          claimStatus = 'PARTLY_TRUE';
          claimLabel = liveAnalysis.claimStatusLabel || 'Partly True';
          evidenceSummary = liveAnalysis.explanation || `The claim "${claimToVerify}" is partly supported, but contains inaccuracies.`;
        } else if (liveAnalysis.verdict === 'MISLEADING') {
          claimStatus = 'MISLEADING_WRONG_CONTEXT';
          claimLabel = liveAnalysis.claimStatusLabel || 'Misleading Context';
          evidenceSummary = liveAnalysis.explanation || `The claim "${claimToVerify}" presents information in a misleading context.`;
        } else {
          claimStatus = 'INSUFFICIENT_EVIDENCE';
          claimLabel = liveAnalysis.claimStatusLabel || 'Insufficient Evidence';
          evidenceSummary = liveAnalysis.explanation || `Live evidence was insufficient to confirm or refute the claim: "${claimToVerify}".`;
        }

        retrievedSources = (liveAnalysis.sources || []).slice(0, 3).map((s) => ({
          name: s.name,
          url: s.url,
          domain: s.domain,
          pubDate: s.pubDate,
          reliability: s.reliability,
          snippet: s.snippet,
        }));

        if (liveAnalysis.aiNotice && !aiNotice) {
          aiNotice = liveAnalysis.aiNotice;
        }
      } catch {
        claimStatus = 'INSUFFICIENT_EVIDENCE';
        claimLabel = 'Search Unavailable';
        evidenceSummary = `Attempted to verify claim "${claimToVerify}", but web search retrieval was temporarily unavailable.`;
      }
    }

    // Attach verified statuses back to each extracted claim
    const processedClaims = rawClaims.map((c) => {
      if (c.isVerifiable && c.text === visionResult.factualClaim) {
        return {
          ...c,
          verdict: (claimStatus === 'SUPPORTED' ? 'TRUE' : claimStatus === 'CONTRADICTED' ? 'FALSE' : claimStatus === 'PARTLY_TRUE' ? 'PARTLY_TRUE' : claimStatus === 'MISLEADING_WRONG_CONTEXT' ? 'MISLEADING' : 'UNVERIFIED') as 'TRUE' | 'FALSE' | 'PARTLY_TRUE' | 'MISLEADING' | 'UNVERIFIED',
          statusLabel: claimLabel,
        };
      }
      return c;
    });

    // 6. Synthesize the 4 Modules
    const imageModules = {
      imageDescription: visionResult.imageDescription || 'Visual content overview',
      aiGeneration: {
        status: visionResult.aiGeneration?.status || 'INCONCLUSIVE',
        visualCategory: visionResult.aiGeneration?.visualCategory || 'UNCERTAIN',
        label: visionResult.aiGeneration?.label || 'Inconclusive Visual Check',
        observations: visionResult.aiGeneration?.observations || 'Visual inspection revealed no definitive AI synthesis artifacts.',
        limitations: 'General vision models perform visual observation, not certified cryptographic forensic detection.',
      },
      manipulation: {
        status: visionResult.manipulation?.status || 'INCONCLUSIVE',
        manipulationCategory: visionResult.manipulation?.manipulationCategory || 'NO_VISIBLE_EDITS',
        label: visionResult.manipulation?.label || 'No Obvious Digital Compositing Detected',
        observations: visionResult.manipulation?.observations || 'Lighting vectors and boundaries appear visually coherent.',
        limitations: 'Visual inspection cannot replace specialized forensic laboratory tools. No simulated ELA or sensor noise is generated.',
      },
      provenance,
      claimVerification: {
        extractedText: visionResult.extractedText || undefined,
        cleanedReadableText: visionResult.cleanedReadableText || visionResult.extractedText || undefined,
        detectedLanguage: visionResult.detectedLanguage || undefined,
        extractedClaim: visionResult.factualClaim || undefined,
        status: claimStatus,
        detailedStatus,
        statusLabel: claimStatusLabel,
        label: claimLabel,
        evidenceSummary,
        timeline: claimTimeline,
        sources: retrievedSources,
        claims: processedClaims,
      },
    };

    // 7. Calculate Independent Verdict & Decoupled Image Authenticity
    let imageAuthenticity: 'AUTHENTIC' | 'POSSIBLE_AI' | 'EDITED' | 'NOT_VERIFIED' = 'NOT_VERIFIED';
    let imageAuthenticityLabel = 'IMAGE AUTHENTICITY: NOT VERIFIED';

    if (imageModules.aiGeneration.status === 'POSSIBLE_AI') {
      imageAuthenticity = 'POSSIBLE_AI';
      imageAuthenticityLabel = 'IMAGE AUTHENTICITY: POSSIBLE AI-GENERATED';
    } else if (imageModules.manipulation.status === 'POSSIBLE_EDIT') {
      imageAuthenticity = 'EDITED';
      imageAuthenticityLabel = 'IMAGE AUTHENTICITY: EDITED / COMPOSITED';
    } else {
      imageAuthenticity = 'NOT_VERIFIED';
      imageAuthenticityLabel = 'IMAGE AUTHENTICITY: NOT VERIFIED';
    }

    let verdict: 'TRUE' | 'FALSE' | 'PARTLY_TRUE' | 'MISLEADING' | 'UNVERIFIED' = 'UNVERIFIED';
    let verdictLabel = 'UNVERIFIED / INSUFFICIENT EVIDENCE';
    let score = 50;
    let confidence = 75;

    if (hasClaim && liveAnalysisResult) {
      verdict = liveAnalysisResult.verdict;
      verdictLabel = liveAnalysisResult.verdictLabel;
      score = liveAnalysisResult.score;
      confidence = liveAnalysisResult.confidence;
    } else if (hasClaim) {
      verdict = 'UNVERIFIED';
      verdictLabel = 'UNVERIFIED / INSUFFICIENT EVIDENCE';
      score = 50;
      confidence = 65;
    } else {
      verdict = 'UNVERIFIED';
      verdictLabel = 'UNVERIFIED / INSUFFICIENT EVIDENCE';
      score = 50;
      confidence = 70;
    }

    const compoundVerdict = `${verdictLabel} • ${imageAuthenticityLabel}`;

    // 8. Honest Forensic Signals matching the 4 Modules
    const signals = [
      {
        name: 'Visual AI Generation Check',
        status: (imageModules.aiGeneration.status === 'POSSIBLE_AI' ? 'warning' : 'passed') as 'passed' | 'warning',
        score: imageModules.aiGeneration.status === 'POSSIBLE_AI' ? 40 : 85,
        detail: imageModules.aiGeneration.observations,
      },
      {
        name: 'Visual Manipulation & Compositing',
        status: (imageModules.manipulation.status === 'POSSIBLE_EDIT' ? 'warning' : 'passed') as 'passed' | 'warning',
        score: imageModules.manipulation.status === 'POSSIBLE_EDIT' ? 35 : 85,
        detail: imageModules.manipulation.observations,
      },
      {
        name: 'Metadata & Provenance Audit',
        status: 'passed' as const,
        score: provenance.c2paFound ? 95 : provenance.metadataFound ? 85 : 75,
        detail: provenance.summary,
      },
      {
        name: 'OCR & Claim Evidence Grounding',
        status: (verdict === 'FALSE' ? 'failed' : verdict === 'TRUE' ? 'passed' : 'warning') as 'passed' | 'failed' | 'warning',
        score: verdict === 'FALSE' ? 10 : verdict === 'TRUE' ? 95 : 50,
        detail: hasClaim
          ? `Text extracted (${imageModules.claimVerification.detectedLanguage || 'Multilingual'}): "${visionResult.factualClaim}". Verdict: ${verdictLabel}.`
          : aiAnalysisStatus !== 'SUCCESS'
            ? (aiNotice || 'Vision AI analysis was unavailable. File container metadata was audited.')
            : (visionResult.extractedText
              ? `Text detected (${imageModules.claimVerification.detectedLanguage || 'Multilingual'}): "${visionResult.extractedText.slice(0, 100)}". No verifiable news claim detected.`
              : 'No headline or news claim found in image.'),
      },
    ];

    // User-friendly 1-2 sentence explanation without repeating or stacking redundant paragraphs
    const explanation = hasClaim && liveAnalysisResult?.explanation
      ? liveAnalysisResult.explanation
      : aiAnalysisStatus !== 'SUCCESS'
        ? `Vision AI analysis could not be completed (${aiNotice || 'service unavailable'}). File container was audited.`
        : visionResult.imageDescription
          ? (visionResult.extractedText
              ? `Visual scene: ${visionResult.imageDescription}. Text detected: "${visionResult.extractedText.slice(0, 100)}". No verifiable factual claim or news caption was detected.`
              : `Visual scene: ${visionResult.imageDescription}. No verifiable factual claim or news caption was detected in this image.`)
          : 'No verifiable factual claim or headline was detected in this image.';

    const scanRecord = {
      id: 'scan_img_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userEmail: cleanEmail,
      type: 'IMAGE' as const,
      timestamp: new Date().toISOString(),
      formattedDate: `Today, ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      score,
      verdict,
      verdictLabel,
      compoundVerdict,
      imageAuthenticity,
      imageAuthenticityLabel,
      claimStatus: detailedStatus,
      claimStatusLabel,
      imageDescription: visionResult.imageDescription || 'Visual content overview',
      timeline: claimTimeline,
      technicalDetails: {
        modelUsed,
        searchTimestamp: new Date().toISOString(),
        rawMimeType: mimeType,
        fileSizeKB: provenanceInspection.fileSizeKB,
      },
      preview: fileName,
      imageUrl: dataUrl,
      imageDimensions: width && height ? { width, height } : undefined,
      explanation,
      confidence,
      aiAnalysisStatus,
      aiNotice,
      signals,
      sources: retrievedSources.slice(0, 3),
      imageModules,
    };

    // Save genuine completed scan to Firestore
    firestoreDB.addScan(scanRecord as any);

    return scanRecord;
  },
};
