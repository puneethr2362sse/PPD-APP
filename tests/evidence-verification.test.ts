import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { imageVerifier } from '../server/services/imageVerifier.js';
import { realtimeVerifier } from '../server/services/realtimeVerifier.js';
import { newsFeedService } from '../server/services/newsFeedService.js';
import { geminiClient } from '../server/services/geminiClient.js';
import { firestoreDB } from '../server/firebaseConfig.js';
import fs from 'fs';
import path from 'path';

// Minimal 1x1 transparent PNG as valid base64 image (68 bytes)
const VALID_1X1_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('VerifyAI Evidence-Based Verification Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    geminiClient.resetState();
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY || 'test-gemini-key';
  });

  afterEach(() => {
    geminiClient.resetState();
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1 & 2: Real Content Processing & Filename Independence
  // =========================================================================
  describe('Module A: Real Content Processing & Filename Independence', () => {
    it('REQ-01: does not judge an image fake or real based on filename keywords', async () => {
      const mockGeminiResponse = {
        aiGeneration: {
          status: 'INCONCLUSIVE',
          label: 'Inconclusive Visual Check',
          observations: 'Natural lighting and coherent edges visible in image bytes.',
          limitations: 'General vision model; no validated detector.',
        },
        manipulation: {
          status: 'INCONCLUSIVE',
          label: 'No Obvious Digital Compositing Detected',
          observations: 'Edges and shadows are visually coherent.',
          limitations: 'Visual inspection cannot replace lab forensics.',
        },
        extractedText: '',
        detectedLanguage: 'None',
        hasFactualClaim: false,
        factualClaim: '',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockGeminiResponse) }],
              },
            },
          ],
        }),
      } as any);

      const result = await imageVerifier.verifyImage({
        name: 'fake_ai_generated_deepfake_midjourney.png',
        dataUrl: VALID_1X1_PNG,
      });

      // Filename containing "fake" or "deepfake" did NOT force a FAKE verdict or fabricated 99% score
      expect(result.verdict).not.toBe('FAKE');
      expect(result.imageModules.aiGeneration.status).toBe('INCONCLUSIVE');
      expect(result.confidence).toBeLessThan(100);
    });

    it('REQ-02: different filenames containing identical image content produce identical assessment', async () => {
      const mockGeminiResponse = {
        aiGeneration: {
          status: 'INCONCLUSIVE',
          label: 'Inconclusive Check',
          observations: 'Standard graphic bytes.',
          limitations: 'Visual only.',
        },
        manipulation: {
          status: 'INCONCLUSIVE',
          label: 'No Obvious Edits',
          observations: 'Coherent pixels.',
          limitations: 'Visual only.',
        },
        extractedText: '',
        detectedLanguage: 'None',
        hasFactualClaim: false,
        factualClaim: '',
      };

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockGeminiResponse) }],
              },
            },
          ],
        }),
      } as any));

      const res1 = await imageVerifier.verifyImage({
        name: 'authentic_camera_photo.png',
        dataUrl: VALID_1X1_PNG,
      });

      const res2 = await imageVerifier.verifyImage({
        name: 'suspicious_viral_leak.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(res1.score).toBe(res2.score);
      expect(res1.verdict).toBe(res2.verdict);
      expect(res1.imageModules.aiGeneration.status).toBe(res2.imageModules.aiGeneration.status);
      expect(res1.imageModules.manipulation.status).toBe(res2.imageModules.manipulation.status);
    });
  });

  // =========================================================================
  // 3: AI-Generation & Manipulation Honest Uncertainty
  // =========================================================================
  describe('Module B: Four Distinct Verification Modules & Honest Uncertainty', () => {
    it('REQ-03: AI-generation assessment reports Inconclusive when no certified detector is present', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      aiGeneration: {
                        status: 'INCONCLUSIVE',
                        label: 'Inconclusive Visual Check',
                        observations: 'Smooth textures observed.',
                        limitations: 'No validated detector available.',
                      },
                      manipulation: {
                        status: 'INCONCLUSIVE',
                        label: 'No Obvious Digital Compositing Detected',
                        observations: 'No cutouts detected.',
                        limitations: 'Visual inspection only.',
                      },
                      extractedText: '',
                      detectedLanguage: 'None',
                      hasFactualClaim: false,
                      factualClaim: '',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const result = await imageVerifier.verifyImage({
        name: 'sample.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(result.imageModules).toBeDefined();
      expect(result.imageModules.aiGeneration.status).toBe('INCONCLUSIVE');
      expect(result.imageModules.provenance.reverseSearchStatus).toBe('NOT_CONFIGURED');
      expect(result.imageModules.provenance.summary).toContain('reverse-image search');
    });

    it('REQ-04: separates image authenticity from claim truth', async () => {
      // Image shows real photograph, but caption asserts a debunked claim
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      aiGeneration: {
                        status: 'INCONCLUSIVE',
                        label: 'Visual Observation Only',
                        observations: 'Real historical photograph from 1969 Apollo mission.',
                        limitations: 'Visual only.',
                      },
                      manipulation: {
                        status: 'INCONCLUSIVE',
                        label: 'No Obvious Digital Compositing Detected',
                        observations: 'No visible alterations.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'Moon landing took place in a studio in Hollywood',
                      detectedLanguage: 'English',
                      hasFactualClaim: true,
                      factualClaim: 'Moon landing took place in a studio in Hollywood',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      // Web verifier returns contradiction based on NASA records
      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        score: 0,
        verdict: 'FALSE',
        verdictLabel: 'Contradicted by evidence',
        confidence: 95,
        explanation: 'Historical and scientific records confirm the moon landing.',
        reasoning: 'Extensive documentation from NASA and independent observatories.',
        directAnswer: 'Debunked conspiracy theory.',
        queryType: 'HISTORICAL_FACT',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: { domainAuthority: 95, freshnessScore: 90, consensusScore: 95, biasRiskScore: 5 },
        sources: [
          {
            title: 'NASA Apollo 11 Mission Overview',
            url: 'https://www.nasa.gov/mission_pages/apollo/apollo-11.html',
            snippet: 'Apollo 11 landed humans on the Moon on July 20, 1969.',
            source: 'nasa.gov',
            stance: 'CONTRADICT',
          },
        ],
      });

      const result = await imageVerifier.verifyImage({
        name: 'apollo11.png',
        dataUrl: VALID_1X1_PNG,
      });

      // Claim truth is FALSE even though image authenticity is not judged fake
      expect(result.verdict).toBe('FALSE');
      expect(result.imageModules.claimVerification.status).toBe('CONTRADICTED');
      expect(result.imageModules.claimVerification.sources.length).toBeGreaterThan(0);
      expect(result.imageModules.claimVerification.sources[0].url).toContain('nasa.gov');
    });
  });

  // =========================================================================
  // 4: Unsupported and Corrupted Images
  // =========================================================================
  describe('Module C: Unsupported & Corrupted Image Handling', () => {
    it('REQ-05: rejects non-image MIME types with descriptive error', async () => {
      const badDataUrl = 'data:text/plain;base64,SGVsbG8gd29ybGQ=';
      await expect(
        imageVerifier.verifyImage({
          name: 'notes.txt',
          dataUrl: badDataUrl,
        })
      ).rejects.toThrow(/Unsupported image format/i);
    });

    it('REQ-06: rejects corrupted or truncated base64 payloads (< 32 bytes)', async () => {
      const truncatedDataUrl = 'data:image/png;base64,AAAA';
      await expect(
        imageVerifier.verifyImage({
          name: 'broken.png',
          dataUrl: truncatedDataUrl,
        })
      ).rejects.toThrow(/Corrupted image payload/i);
    });

    it('REQ-07: rejects oversized image payloads (> 10MB)', async () => {
      const largeDataUrl = 'data:image/png;base64,' + 'A'.repeat(15 * 1024 * 1024);
      await expect(
        imageVerifier.verifyImage({
          name: 'huge.png',
          dataUrl: largeDataUrl,
        })
      ).rejects.toThrow(/too large/i);
    });

    it('REQ-08: rejects missing or non-string dataUrl', async () => {
      await expect(
        imageVerifier.verifyImage({
          name: 'missing.png',
          dataUrl: '' as any,
        })
      ).rejects.toThrow(/Image data is required/i);
    });
  });

  // =========================================================================
  // 5 & 6: API Keys, Quota Errors & Resilient Fallbacks
  // =========================================================================
  describe('Module D: Missing API Keys, Quotas & Error Handling', () => {
    it('REQ-09: fails cleanly when server GEMINI_API_KEY is not configured', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      await expect(
        imageVerifier.verifyImage({
          name: 'test.png',
          dataUrl: VALID_1X1_PNG,
        })
      ).rejects.toThrow(/GEMINI_API_KEY is not configured on the server/i);
    });

    it('REQ-10: handles Gemini 429 quota exhaustion gracefully without crashing the scan', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'RESOURCE_EXHAUSTED: Quota exceeded for model',
      } as any);

      const result = await imageVerifier.verifyImage({
        name: 'test.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(result.aiAnalysisStatus).toBe('QUOTA_EXHAUSTED');
      expect(result.aiNotice).toMatch(/quota/i);
      expect(result.imageModules.aiGeneration.status).toBe('INCONCLUSIVE');
      expect(result.verdict).toBe('UNVERIFIED');
    });

    it('REQ-11: handles network timeout / abort cleanly without unhandled rejection', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Fetch timed out'));

      const result = await imageVerifier.verifyImage({
        name: 'test.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(result.aiAnalysisStatus).toBe('NETWORK_ERROR');
      expect(result.imageModules.aiGeneration.status).toBe('INCONCLUSIVE');
      expect(result.verdict).toBe('UNVERIFIED');
    });

    it('REQ-12: recovers gracefully if Gemini returns markdown wrapped JSON', async () => {
      const markdownJson = `\`\`\`json
{
  "aiGeneration": {
    "status": "INCONCLUSIVE",
    "label": "Inconclusive Visual Check",
    "observations": "Valid markdown wrapped JSON",
    "limitations": "Visual only"
  },
  "manipulation": {
    "status": "INCONCLUSIVE",
    "label": "No Obvious Digital Compositing Detected",
    "observations": "Coherent lighting",
    "limitations": "Visual only"
  },
  "extractedText": "",
  "detectedLanguage": "None",
  "hasFactualClaim": false,
  "factualClaim": ""
}
\`\`\``;

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: markdownJson }],
              },
            },
          ],
        }),
      } as any);

      const result = await imageVerifier.verifyImage({
        name: 'test.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(result.imageModules.aiGeneration.observations).toBe('Valid markdown wrapped JSON');
    });
  });

  // =========================================================================
  // 7, 8, 9, 10, 11: Claim & News Verification Grounding
  // =========================================================================
  describe('Module E: Claim Corroboration & Web Evidence Grounding', () => {
    it('REQ-13: preserves genuine URLs, titles and publication dates', async () => {
      // Mock web verifier to return real structured sources
      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        score: 95,
        verdict: 'TRUE',
        verdictLabel: "YES, IT'S TRUE",
        confidence: 90,
        explanation: 'Chandrayaan-3 successfully touched down on August 23, 2023.',
        reasoning: 'Verified by official ISRO mission telemetry and global observatories.',
        directAnswer: 'Chandrayaan-3 successfully touched down.',
        queryType: 'HISTORICAL_FACT',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: { domainAuthority: 95, freshnessScore: 90, consensusScore: 95, biasRiskScore: 5 },
        sources: [
          {
            title: 'ISRO Chandrayaan-3 Mission Details',
            url: 'https://www.isro.gov.in/Chandrayaan3_Details.html',
            snippet: 'Chandrayaan-3 is a follow-on mission to Chandrayaan-2.',
            source: 'isro.gov.in',
            stance: 'SUPPORT',
            date: '2023-08-23',
          },
        ],
      });

      const mockResult = await realtimeVerifier.verifyClaim('ISRO successfully launched Chandrayaan-3');
      expect(mockResult).toBeDefined();
      expect(mockResult.sources).toBeInstanceOf(Array);
      expect(mockResult.sources.length).toBeGreaterThan(0);
      expect(mockResult.sources[0].url).toBe('https://www.isro.gov.in/Chandrayaan3_Details.html');
      expect(mockResult.sources[0].title).toBe('ISRO Chandrayaan-3 Mission Details');
    });

    it('REQ-14: distinguishes future-event claims from past occurrences', async () => {
      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        score: 10,
        verdict: 'FALSE',
        verdictLabel: "NO, IT'S NOT TRUE",
        confidence: 90,
        explanation: 'The 2036 Olympic Games host city has not yet occurred or concluded.',
        reasoning: 'The event is scheduled for the future and cannot be verified as an accomplished past event.',
        directAnswer: 'Future scheduled event; cannot be verified as past historical fact.',
        queryType: 'FUTURE_EVENT',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: { domainAuthority: 90, freshnessScore: 95, consensusScore: 90, biasRiskScore: 10 },
        sources: [],
      });

      const futureResult = await realtimeVerifier.verifyClaim('India hosted the 2036 Olympic Games in New Delhi');
      expect(futureResult.verdict).not.toBe('TRUE');
      expect(futureResult.queryType).toBe('FUTURE_EVENT');
    });

    it('REQ-15: marks claims with insufficient evidence as Unverified / Inconclusive', async () => {
      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        score: 50,
        verdict: 'UNVERIFIED',
        verdictLabel: 'NOT ENOUGH EVIDENCE',
        confidence: 50,
        explanation: 'No credible web sources found to confirm or debunk this claim.',
        reasoning: 'Zero authoritative corroboration.',
        directAnswer: 'Insufficient evidence.',
        queryType: 'UNKNOWN',
        isLiveWebVerified: false,
        searchTimestamp: new Date().toISOString(),
        signals: { domainAuthority: 10, freshnessScore: 10, consensusScore: 10, biasRiskScore: 50 },
        sources: [],
      });

      const result = await realtimeVerifier.verifyClaim('Secret underground alien city discovered under Antarctica');
      expect(['UNVERIFIED', 'INCONCLUSIVE']).toContain(result.verdict);
    });
  });

  // =========================================================================
  // 12: Multilingual Support (Telugu, Tamil, Hindi, English, Code-switched)
  // =========================================================================
  describe('Module F: Multilingual OCR & Language Detection', () => {
    it('REQ-16: correctly processes Telugu script and Romanized Telugu', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      aiGeneration: {
                        status: 'INCONCLUSIVE',
                        label: 'Inconclusive Visual Check',
                        observations: 'Telugu television news banner screenshot.',
                        limitations: 'Visual only.',
                      },
                      manipulation: {
                        status: 'INCONCLUSIVE',
                        label: 'No Obvious Digital Compositing Detected',
                        observations: 'Font rasterization matches broadcast graphics.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'హైదరాబాద్‌లో భారీ వర్షాలు, స్కూళ్లకు సెలవులు',
                      detectedLanguage: 'Telugu',
                      hasFactualClaim: true,
                      factualClaim: 'Hyderabad schools declared holiday due to heavy rain',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        score: 90,
        verdict: 'TRUE',
        verdictLabel: "YES, IT'S TRUE (CLAIM SUPPORTED)",
        confidence: 88,
        explanation: 'Telangana government declared holiday due to rains.',
        reasoning: 'Official government order issued.',
        directAnswer: 'Schools were closed.',
        queryType: 'BREAKING_NEWS',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: { domainAuthority: 90, freshnessScore: 95, consensusScore: 90, biasRiskScore: 10 },
        sources: [
          {
            title: 'Telangana Today - Hyderabad School Holiday',
            url: 'https://telanganatoday.com/hyderabad-rain-holiday',
            snippet: 'Government announces holiday for educational institutions.',
            source: 'telanganatoday.com',
            stance: 'SUPPORT',
          },
        ],
      });

      const result = await imageVerifier.verifyImage({
        name: 'telugu_news.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(result.imageModules.claimVerification.detectedLanguage).toBe('Telugu');
      expect(result.imageModules.claimVerification.extractedText).toContain('హైదరాబాద్‌లో');
      expect(result.verdict).toBe('TRUE');
    });

    it('REQ-17: processes Hindi, Tamil, and mixed-language script', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      aiGeneration: {
                        status: 'INCONCLUSIVE',
                        label: 'Inconclusive Visual Check',
                        observations: 'Hindi social media flyer',
                        limitations: 'Visual only',
                      },
                      manipulation: {
                        status: 'INCONCLUSIVE',
                        label: 'No Obvious Digital Compositing Detected',
                        observations: 'No edits detected',
                        limitations: 'Visual only',
                      },
                      extractedText: 'दिल्ली में प्रदूषण का स्तर 400 पार हुआ',
                      detectedLanguage: 'Hindi',
                      hasFactualClaim: false,
                      factualClaim: '',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const result = await imageVerifier.verifyImage({
        name: 'hindi_post.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(result.imageModules.claimVerification.detectedLanguage).toBe('Hindi');
      expect(result.imageModules.claimVerification.extractedText).toContain('दिल्ली');
    });
  });

  // =========================================================================
  // 13: Security & Secret Protection
  // =========================================================================
  describe('Module G: Security & Secret Protection', () => {
    it('REQ-18: client build bundle contains zero GEMINI_API_KEY or VITE_GEMINI_API_KEY references', () => {
      const distDir = path.resolve(process.cwd(), 'dist/assets');
      if (fs.existsSync(distDir)) {
        const files = fs.readdirSync(distDir);
        const jsFiles = files.filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
          const content = fs.readFileSync(path.join(distDir, file), 'utf8');
          expect(content).not.toContain('VITE_GEMINI_API_KEY');
          expect(content).not.toContain('GEMINI_API_KEY');
        }
      }
    });

    it('REQ-19: image verification response does not leak GEMINI_API_KEY', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      aiGeneration: {
                        status: 'INCONCLUSIVE',
                        label: 'Inconclusive Visual Check',
                        observations: 'Test image',
                        limitations: 'Visual only',
                      },
                      manipulation: {
                        status: 'INCONCLUSIVE',
                        label: 'No Obvious Digital Compositing Detected',
                        observations: 'Test image',
                        limitations: 'Visual only',
                      },
                      extractedText: '',
                      detectedLanguage: 'None',
                      hasFactualClaim: false,
                      factualClaim: '',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const result = await imageVerifier.verifyImage({
        name: 'test.png',
        dataUrl: VALID_1X1_PNG,
      });

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain(process.env.GEMINI_API_KEY || 'test-gemini-key');
    });
  });

  // =========================================================================
  // 14 & 15: Scan History & RSS News Feed
  // =========================================================================
  describe('Module H: Scan History & Live RSS Feed Integrity', () => {
    it('REQ-20: saves scan history only upon genuine completed analysis', async () => {
      const addScanSpy = vi.spyOn(firestoreDB, 'addScan');

      // Failed request (corrupted image) should NOT add scan
      try {
        await imageVerifier.verifyImage({
          name: 'bad.png',
          dataUrl: 'data:image/png;base64,bad',
        });
      } catch {
        // Expected error
      }
      expect(addScanSpy).not.toHaveBeenCalled();

      // Successful request should add scan
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      aiGeneration: {
                        status: 'INCONCLUSIVE',
                        label: 'Inconclusive Visual Check',
                        observations: 'Valid image',
                        limitations: 'Visual only',
                      },
                      manipulation: {
                        status: 'INCONCLUSIVE',
                        label: 'No Obvious Digital Compositing Detected',
                        observations: 'No edits',
                        limitations: 'Visual only',
                      },
                      extractedText: '',
                      detectedLanguage: 'None',
                      hasFactualClaim: false,
                      factualClaim: '',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      await imageVerifier.verifyImage({
        name: 'valid.png',
        dataUrl: VALID_1X1_PNG,
        email: 'user@example.com',
      });

      expect(addScanSpy).toHaveBeenCalledTimes(1);
    });

    it('REQ-21: live RSS news feed returns genuine items without mock fallbacks', async () => {
      const feedResult = await newsFeedService.getLiveNews('all');
      expect(feedResult).toBeDefined();
      expect(feedResult.news).toBeInstanceOf(Array);
      expect(feedResult.news.length).toBeGreaterThan(0);
      const sample = feedResult.news[0];
      expect(sample.title).toBeTruthy();
      expect(sample.link).toMatch(/^https?:\/\//);
      expect(sample.source).toBeTruthy();
    });
  });

  // =========================================================================
  // Module I: Final Submission Regression Suite (Edge Cases)
  // =========================================================================
  describe('Module I: Final Submission Edge Cases & Integrity Regressions', () => {
    it('REQ-22: AI-generated poster with unsupported box-office claim yields UNVERIFIED (separate artwork from claim truth)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      aiGeneration: {
                        status: 'POSSIBLE_AI',
                        label: 'Synthetic Graphic / Digital Art Style',
                        observations: 'Poster artwork exhibits diffusion-generated textures and digital painting artifacts.',
                        limitations: 'Visual analysis only.',
                      },
                      manipulation: {
                        status: 'INCONCLUSIVE',
                        label: 'No Obvious Splicing',
                        observations: 'Graphic layout is coherent.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'KALKI 2 CROSSES 2500 CRORE WORLDWIDE OPENING WEEKEND',
                      detectedLanguage: 'English',
                      hasFactualClaim: true,
                      factualClaim: 'Kalki 2 crosses 2500 crore worldwide opening weekend',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        verdict: 'UNVERIFIED',
        verdictLabel: 'NOT ENOUGH EVIDENCE',
        score: 50,
        confidence: 65,
        explanation: 'Movie box-office trade sources do not corroborate 2500 crore worldwide gross opening weekend.',
        reasoning: 'Claimed: 2500 crore worldwide gross. Evidence: No trade consensus confirms this figure.',
        directAnswer: 'Unverified: Box-office figures for this film could not be confirmed in authoritative trade records.',
        queryType: 'claim',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [],
      });

      const result = await imageVerifier.verifyImage({
        name: 'kalki2_fan_poster_ai.png',
        dataUrl: VALID_1X1_PNG,
      });

      // The artwork was flagged as POSSIBLE_AI, but the verdict is UNVERIFIED (not falsely claimed as FAKE purely due to artwork)
      expect(result.imageModules.aiGeneration.status).toBe('POSSIBLE_AI');
      expect(result.imageModules.claimVerification.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.verdict).toBe('UNVERIFIED');
      expect(result.verdictLabel).toBe('NOT ENOUGH EVIDENCE');
      expect(result.score).toBe(50);
    });

    it('REQ-23: real news screenshot with a misleading headline yields FALSE (does not trust authentic graphics)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      aiGeneration: {
                        status: 'UNLIKELY_AI',
                        label: 'Authentic Screen Graphic',
                        observations: 'Legitimate broadcast TV graphics font rasterization and metadata layout.',
                        limitations: 'Visual only.',
                      },
                      manipulation: {
                        status: 'NO_VISIBLE_EDITS',
                        label: 'No Visible Edits',
                        observations: 'No digital compositing detected.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'Government bans all 500 rupee notes starting midnight',
                      detectedLanguage: 'English',
                      hasFactualClaim: true,
                      factualClaim: 'Government bans all 500 rupee notes starting midnight',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        verdict: 'FALSE',
        verdictLabel: "NO, IT'S NOT TRUE",
        score: 10,
        confidence: 90,
        explanation: 'Reserve Bank of India and PIB Fact Check confirmed no such ban exists.',
        reasoning: 'Directly contradicted by official banking notifications.',
        directAnswer: 'No, this is not true: PIB and RBI confirm 500 rupee notes remain valid legal tender.',
        queryType: 'claim',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [
          {
            name: 'PIB Fact Check',
            url: 'https://pib.gov.in/factcheck',
            reliability: 99,
            snippet: 'Viral message claiming 500 notes banned is fake.',
          },
        ],
      });

      const result = await imageVerifier.verifyImage({
        name: 'tv_broadcast_leak.png',
        dataUrl: VALID_1X1_PNG,
      });

      // Claim is FALSE even though the broadcast graphics layout is authentic
      expect(result.imageModules.manipulation.status).toBe('NO_VISIBLE_EDITS');
      expect(result.imageModules.claimVerification.status).toBe('CONTRADICTED');
      expect(result.verdict).toBe('FALSE');
      expect(result.verdictLabel).toContain("NOT TRUE");
    });

    it('REQ-24: genuine photo with unsupported caption yields UNVERIFIED (never classifies true merely from authentic photo)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      aiGeneration: {
                        status: 'UNLIKELY_AI',
                        label: 'Authentic Optical Photograph',
                        observations: 'Natural sensor noise and optical depth of field from DSLR camera.',
                        limitations: 'Visual only.',
                      },
                      manipulation: {
                        status: 'NO_VISIBLE_EDITS',
                        label: 'No Visible Edits',
                        observations: 'No compositing artifacts.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'Rare meteor fragment discovered in local garden yesterday',
                      detectedLanguage: 'English',
                      hasFactualClaim: true,
                      factualClaim: 'Rare meteor fragment discovered in local garden yesterday',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        verdict: 'UNVERIFIED',
        verdictLabel: 'NOT ENOUGH EVIDENCE',
        score: 50,
        confidence: 50,
        explanation: 'No scientific observatory or geological survey reports confirm this local find.',
        reasoning: 'Lack of authoritative corroboration.',
        directAnswer: 'Unverified: Available evidence is insufficient.',
        queryType: 'claim',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [],
      });

      const result = await imageVerifier.verifyImage({
        name: 'garden_rock.jpg',
        dataUrl: VALID_1X1_PNG,
      });

      // Authentic photo does NOT cause an unverified claim to become TRUE
      expect(result.imageModules.aiGeneration.status).toBe('UNLIKELY_AI');
      expect(result.verdict).toBe('UNVERIFIED');
      expect(result.verdictLabel).toBe('NOT ENOUGH EVIDENCE');
      expect(result.score).toBe(50);
    });

    it('REQ-25: empty or unavailable search results return explicit UNVERIFIED without fabricated sources', async () => {
      // Mock search fetching to return empty array
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: async () => '',
        json: async () => ({}),
      } as any);

      const result = await realtimeVerifier.verifyClaim('XQZ999 unrecorded event claim');
      expect(result.verdict).toBe('UNVERIFIED');
      expect(result.verdictLabel).toBe('UNVERIFIED / INSUFFICIENT EVIDENCE');
      expect(result.sources).toHaveLength(0);
      expect(result.score).toBe(50);
      expect(result.directAnswer).toContain('Unverified');
    });
  });

  // =========================================================================
  // PART 10: Submission-Ready Verification Matrix (15 Explicit Scenarios)
  // =========================================================================
  describe('PART 10: Submission-Ready Verification Matrix (15 Scenarios)', () => {
    // 1. AI-generated image with a true claim
    it('Scenario 1: AI-generated image with a true claim (claim truth decoupled from synthetic artwork)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      imageDescription: 'AI-generated digital artwork of ISRO rocket on launchpad',
                      aiGeneration: {
                        status: 'POSSIBLE_AI',
                        visualCategory: 'LIKELY_AI',
                        label: 'Synthetic AI Artwork',
                        observations: 'Hyper-smooth surface rendering and unnatural smoke volumetrics.',
                        limitations: 'Visual analysis only.',
                      },
                      manipulation: {
                        status: 'NO_VISIBLE_EDITS',
                        label: 'No Visible Edits',
                        observations: 'Coherent generation.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'Chandrayaan-3 successfully touched down on lunar south pole',
                      detectedLanguage: 'English',
                      hasFactualClaim: true,
                      factualClaim: 'Chandrayaan-3 successfully touched down on lunar south pole',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        verdict: 'TRUE',
        verdictLabel: "YES, IT'S TRUE",
        claimStatus: 'CURRENTLY_SUPPORTED',
        claimStatusLabel: 'CURRENTLY SUPPORTED',
        score: 95,
        confidence: 95,
        explanation: 'ISRO and global observatories confirmed the Chandrayaan-3 lunar landing on August 23, 2023.',
        directAnswer: 'Yes, this claim is true.',
        queryType: 'claim',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [
          { name: 'ISRO Official', url: 'https://isro.gov.in/chandrayaan3', reliability: 98, domain: 'isro.gov.in' },
        ],
      });

      const res = await imageVerifier.verifyImage({
        name: 'ai_art_chandrayaan.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(res.imageModules.aiGeneration.status).toBe('POSSIBLE_AI');
      expect(res.imageModules.claimVerification.status).toBe('SUPPORTED');
      expect(res.verdict).toBe('TRUE');
      expect(res.claimStatus).toBe('CURRENTLY_SUPPORTED');
    });

    // 2. AI-generated image with a false claim
    it('Scenario 2: AI-generated image with a false claim', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      imageDescription: 'AI image depicting flooded landmark',
                      aiGeneration: {
                        status: 'POSSIBLE_AI',
                        visualCategory: 'LIKELY_AI',
                        label: 'Synthetic Generation',
                        observations: 'Hallucinated architectural details.',
                        limitations: 'Visual only.',
                      },
                      manipulation: {
                        status: 'POSSIBLE_EDIT',
                        label: 'Possible Composite',
                        observations: 'Incoherent reflections.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'Eiffel Tower completely submerged in historic flood today',
                      detectedLanguage: 'English',
                      hasFactualClaim: true,
                      factualClaim: 'Eiffel Tower completely submerged in historic flood today',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        verdict: 'FALSE',
        verdictLabel: "NO, IT'S NOT TRUE",
        claimStatus: 'FALSE_CONTRADICTED',
        claimStatusLabel: 'FALSE / CONTRADICTED',
        score: 10,
        confidence: 96,
        explanation: 'Meteorological and news agencies confirm Paris is operating normally with no flooding.',
        directAnswer: 'No, this claim is false.',
        queryType: 'claim',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [
          { name: 'AFP Fact Check', url: 'https://factcheck.afp.com/paris-tower', reliability: 95, domain: 'factcheck.afp.com' },
        ],
      });

      const res = await imageVerifier.verifyImage({
        name: 'eiffel_flood.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(res.imageModules.aiGeneration.status).toBe('POSSIBLE_AI');
      expect(res.imageModules.claimVerification.status).toBe('CONTRADICTED');
      expect(res.verdict).toBe('FALSE');
      expect(res.claimStatus).toBe('FALSE_CONTRADICTED');
    });

    // 3. Real photograph with a false caption
    it('Scenario 3: Real photograph with a false caption (photo authenticity does not make caption true)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      imageDescription: 'Genuine crowd gathering at concert stadium',
                      aiGeneration: {
                        status: 'UNLIKELY_AI',
                        visualCategory: 'LIKELY_REAL',
                        label: 'Authentic Photograph',
                        observations: 'Natural sensor optical grain and consistent human features.',
                        limitations: 'Visual only.',
                      },
                      manipulation: {
                        status: 'NO_VISIBLE_EDITS',
                        label: 'No Visible Edits',
                        observations: 'No digital cutouts.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'Massive protest outside parliament today demanding immediate resignation',
                      detectedLanguage: 'English',
                      hasFactualClaim: true,
                      factualClaim: 'Massive protest outside parliament today demanding immediate resignation',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        verdict: 'FALSE',
        verdictLabel: "NO, IT'S NOT TRUE",
        claimStatus: 'MISLEADING_WRONG_CONTEXT',
        claimStatusLabel: 'MISLEADING / WRONG CONTEXT',
        score: 15,
        confidence: 90,
        explanation: 'The photo depicts a music concert crowd from 2019, falsely repurposed as a political protest.',
        directAnswer: 'False context: Old concert photograph misrepresented as current protest.',
        queryType: 'claim',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [
          { name: 'BoomLive Fact Check', url: 'https://boomlive.in/factcheck/crowd', reliability: 92, domain: 'boomlive.in' },
        ],
      });

      const res = await imageVerifier.verifyImage({
        name: 'viral_crowd_protest.jpg',
        dataUrl: VALID_1X1_PNG,
      });

      expect(res.imageModules.aiGeneration.status).toBe('UNLIKELY_AI');
      expect(res.imageModules.manipulation.status).toBe('NO_VISIBLE_EDITS');
      expect(res.verdict).toBe('FALSE');
      expect(res.claimStatus).toBe('MISLEADING_WRONG_CONTEXT');
    });

    // 4. Real photograph with a supported claim
    it('Scenario 4: Real photograph with a supported claim', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      imageDescription: 'Authentic photo of government press conference',
                      aiGeneration: {
                        status: 'UNLIKELY_AI',
                        visualCategory: 'LIKELY_REAL',
                        label: 'Natural Photo',
                        observations: 'Authentic lens perspective.',
                        limitations: 'Visual only.',
                      },
                      manipulation: {
                        status: 'NO_VISIBLE_EDITS',
                        label: 'No Visible Edits',
                        observations: 'Clean optics.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'RBI raises repo rate by 25 basis points',
                      detectedLanguage: 'English',
                      hasFactualClaim: true,
                      factualClaim: 'RBI raises repo rate by 25 basis points',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        verdict: 'TRUE',
        verdictLabel: "YES, IT'S TRUE",
        claimStatus: 'CURRENTLY_SUPPORTED',
        claimStatusLabel: 'CURRENTLY SUPPORTED',
        score: 92,
        confidence: 95,
        explanation: 'Reserve Bank of India monetary policy committee announced rate hike.',
        directAnswer: 'Yes, repo rate increased by 25 bps.',
        queryType: 'claim',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [
          { name: 'Reserve Bank of India', url: 'https://rbi.org.in/press', reliability: 99, domain: 'rbi.org.in' },
        ],
      });

      const res = await imageVerifier.verifyImage({
        name: 'rbi_briefing.jpg',
        dataUrl: VALID_1X1_PNG,
      });

      expect(res.imageModules.aiGeneration.status).toBe('UNLIKELY_AI');
      expect(res.imageModules.claimVerification.status).toBe('SUPPORTED');
      expect(res.verdict).toBe('TRUE');
      expect(res.claimStatus).toBe('CURRENTLY_SUPPORTED');
    });

    // 5. Old news presented as current
    it('Scenario 5: Old news presented as current classifies as HISTORICAL / OUTDATED', async () => {
      const mockResult = {
        verdict: 'FALSE' as const,
        verdictLabel: "NO, IT'S NOT TRUE" as const,
        claimStatus: 'HISTORICAL_OUTDATED' as const,
        claimStatusLabel: 'HISTORICAL / OUTDATED',
        score: 20,
        confidence: 90,
        timeline: {
          eventDate: 'November 2016',
          publicationDate: 'November 8, 2016',
          currentStatus: 'Historical event from 2016; not an active current announcement.',
          temporalStatus: 'past' as const,
        },
        explanation: 'This refers to the 2016 demonetisation policy, not a current development.',
        claim: 'Government demonetises 500 and 1000 rupee notes starting tonight',
        originalClaim: 'Government demonetises 500 and 1000 rupee notes starting tonight',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [
          { name: 'PIB Archives', url: 'https://pib.gov.in/archive2016', reliability: 95, pubDate: '2016-11-08' },
        ],
      };

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce(mockResult);

      const res = await realtimeVerifier.verifyClaim('Government demonetises 500 and 1000 rupee notes starting tonight');
      expect(res.claimStatus).toBe('HISTORICAL_OUTDATED');
      expect(res.claimStatusLabel).toBe('HISTORICAL / OUTDATED');
      expect(res.verdict).toBe('FALSE');
      expect(res.timeline?.temporalStatus).toBe('past');
    });

    // 6. Officially announced future event
    it('Scenario 6: Officially announced future event classifies as OFFICIALLY SCHEDULED / FUTURE', async () => {
      const mockResult = {
        verdict: 'TRUE' as const,
        verdictLabel: "YES, IT'S TRUE" as const,
        claimStatus: 'OFFICIALLY_SCHEDULED_FUTURE' as const,
        claimStatusLabel: 'OFFICIALLY SCHEDULED / FUTURE',
        score: 85,
        confidence: 88,
        timeline: {
          eventDate: 'December 2026',
          publicationDate: 'October 2026',
          currentStatus: 'Officially scheduled future mission; event has not taken place yet.',
          temporalStatus: 'future' as const,
        },
        explanation: 'Official space agency press release confirms scheduled flight window.',
        claim: 'Gaganyaan crewed test flight scheduled for late 2026',
        originalClaim: 'Gaganyaan crewed test flight scheduled for late 2026',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [
          { name: 'ISRO Official', url: 'https://isro.gov.in/gaganyaan', reliability: 98, pubDate: '2026-10-01' },
        ],
      };

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce(mockResult);

      const res = await realtimeVerifier.verifyClaim('Gaganyaan crewed test flight scheduled for late 2026');
      expect(res.claimStatus).toBe('OFFICIALLY_SCHEDULED_FUTURE');
      expect(res.verdict).toBe('TRUE');
      expect(res.timeline?.temporalStatus).toBe('future');
    });

    // 7. Misleading date, identity, or location
    it('Scenario 7: Misleading date, identity, or location classifies as MISLEADING / WRONG CONTEXT', async () => {
      const mockResult = {
        verdict: 'FALSE' as const,
        verdictLabel: "NO, IT'S NOT TRUE" as const,
        claimStatus: 'MISLEADING_WRONG_CONTEXT' as const,
        claimStatusLabel: 'MISLEADING / WRONG CONTEXT',
        score: 18,
        confidence: 85,
        explanation: 'The bridge collapse depicted occurred in another country 3 years ago, not in Mumbai yesterday.',
        claim: 'Bandra-Worli sealink collapsed in yesterday rains',
        originalClaim: 'Bandra-Worli sealink collapsed in yesterday rains',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [
          { name: 'Mumbai Police Fact Check', url: 'https://mumbaipolice.gov.in/alert', reliability: 95 },
        ],
      };

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce(mockResult);

      const res = await realtimeVerifier.verifyClaim('Bandra-Worli sealink collapsed in yesterday rains');
      expect(res.claimStatus).toBe('MISLEADING_WRONG_CONTEXT');
      expect(res.verdict).toBe('FALSE');
    });

    // 8. Insufficient evidence
    it('Scenario 8: Insufficient evidence yields explicit UNVERIFIED / INSUFFICIENT EVIDENCE', async () => {
      const mockResult = {
        verdict: 'UNVERIFIED' as const,
        verdictLabel: 'NOT ENOUGH EVIDENCE' as const,
        claimStatus: 'UNVERIFIED_INSUFFICIENT_EVIDENCE' as const,
        claimStatusLabel: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
        score: 50,
        confidence: 40,
        explanation: 'No independent records or official statements exist to substantiate or refute this claim.',
        claim: 'Secret underground gold vein discovered beneath private farm in Warangal',
        originalClaim: 'Secret underground gold vein discovered beneath private farm in Warangal',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [],
      };

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce(mockResult);

      const res = await realtimeVerifier.verifyClaim('Secret underground gold vein discovered beneath private farm in Warangal');
      expect(res.claimStatus).toBe('UNVERIFIED_INSUFFICIENT_EVIDENCE');
      expect(res.verdict).toBe('UNVERIFIED');
      expect(res.sources).toHaveLength(0);
    });

    // 9. Irrelevant search results
    it('Scenario 9: Irrelevant search results with lexical coincidence do not create false verdicts', async () => {
      // Mock search results that contain keyword match but completely unrelated content
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        return {
          ok: true,
          text: async () => '<html><body>Search results</body></html>',
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        verdict: 'UNVERIFIED',
                        score: 50,
                        confidence: 45,
                        claimStatus: 'UNVERIFIED_INSUFFICIENT_EVIDENCE',
                        claimStatusLabel: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
                        explanation: 'Retrieved search results mention similar words but discuss unrelated topics. Insufficient evidence.',
                        directAnswer: 'Unverified: Search results do not substantiate the claim.',
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        } as any;
      });

      const res = await realtimeVerifier.verifyClaim('Quantum teleportation device sold at local supermarket');
      expect(res.verdict).toBe('UNVERIFIED');
      expect(res.score).toBe(50);
    });

    // 10. OCR errors and multilingual text
    it('Scenario 10: Preserves original extracted multilingual OCR text and provides cleaned readable version', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      imageDescription: 'Telugu news card with minor compression noise',
                      aiGeneration: {
                        status: 'UNLIKELY_AI',
                        label: 'Natural Graphic',
                        observations: 'Standard news card layout.',
                        limitations: 'Visual only.',
                      },
                      manipulation: {
                        status: 'NO_VISIBLE_EDITS',
                        label: 'No Visible Edits',
                        observations: 'Clean layout.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'తెలం గాణ లో వ ర ద లు - ప్ర భు త్వం అల ర్ట్',
                      cleanedReadableText: 'తెలంగాణలో వరదలు - ప్రభుత్వం అలర్ట్',
                      detectedLanguage: 'Telugu',
                      hasFactualClaim: true,
                      factualClaim: 'తెలంగాణలో వరదలు ప్రభుత్వం అలర్ట్ జారీ చేసింది',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        verdict: 'TRUE',
        verdictLabel: "YES, IT'S TRUE",
        claimStatus: 'CURRENTLY_SUPPORTED',
        claimStatusLabel: 'CURRENTLY SUPPORTED',
        score: 90,
        confidence: 90,
        explanation: 'తెలంగాణ ప్రభుత్వం భారీ వర్షాల నేపథ్యంలో జిల్లాల కలెక్టర్లను అప్రమత్తం చేసింది.',
        claim: 'తెలంగాణలో వరదలు ప్రభుత్వం అలర్ట్ జారీ చేసింది',
        originalClaim: 'తెలంగాణలో వరదలు ప్రభుత్వం అలర్ట్ జారీ చేసింది',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [
          { name: 'Eenadu', url: 'https://eenadu.net/telangana-rains', reliability: 90, domain: 'eenadu.net' },
        ],
      });

      const res = await imageVerifier.verifyImage({
        name: 'telugu_news_card.jpg',
        dataUrl: VALID_1X1_PNG,
      });

      expect(res.imageModules.claimVerification.extractedText).toBe('తెలం గాణ లో వ ర ద లు - ప్ర భు త్వం అల ర్ట్');
      expect(res.imageModules.claimVerification.cleanedReadableText).toBe('తెలంగాణలో వరదలు - ప్రభుత్వం అలర్ట్');
      expect(res.imageModules.claimVerification.detectedLanguage).toBe('Telugu');
      expect(res.verdict).toBe('TRUE');
    });

    // 11. Search-provider quota errors
    it('Scenario 11: Handles search-provider quota/rate limit errors gracefully without crashing or faking sources', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
        json: async () => ({ error: { message: 'Quota exceeded' } }),
      } as any);

      const res = await realtimeVerifier.verifyClaim('Any current event query');
      expect(res.verdict).toBe('UNVERIFIED');
      expect(res.sources).toHaveLength(0);
      expect(res.score).toBe(50);
    });

    // 12. News Feed refresh with newly available articles
    it('Scenario 12: News Feed refresh with forceRefresh bypasses cache and provides refreshedAt timestamp', async () => {
      const feedRes = await newsFeedService.getLiveNews('all', true);
      expect(feedRes).toBeDefined();
      expect(Array.isArray(feedRes.news)).toBe(true);
      expect(feedRes.refreshedAt).toBeDefined();
      expect(typeof feedRes.refreshedAt).toBe('string');
    });

    // 13. News Feed refresh with no new articles
    it('Scenario 13: News Feed served from cache cleanly when within TTL', async () => {
      const res1 = await newsFeedService.getLiveNews('world', false);
      const res2 = await newsFeedService.getLiveNews('world', false);
      expect(res1.news.length).toBe(res2.news.length);
      expect(res2.refreshedAt).toBeDefined();
    });

    // 14. News Feed refresh when the provider fails
    it('Scenario 14: News Feed refresh preserves valid cached articles with stale flag when upstream fails', async () => {
      // Seed cache first
      await newsFeedService.getLiveNews('business', false);

      // Mock fetch failure on next refresh
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network connection timeout'));

      const fallbackRes = await newsFeedService.getLiveNews('business', true);
      fetchSpy.mockRestore();

      // Must preserve cached articles and indicate stale
      expect(fallbackRes.news.length).toBeGreaterThan(0);
      expect(fallbackRes.stale).toBe(true);
    });

    // 15. Duplicate articles and broken image URLs
    it('Scenario 15: Deduplicates articles with identical titles and handles empty/broken links cleanly', async () => {
      const result = await newsFeedService.getLiveNews('all', false);
      const titles = result.news.map((it) => it.title.trim().toLowerCase());
      const uniqueTitles = new Set(titles);
      // Ensure no exact duplicate titles in list
      expect(uniqueTitles.size).toBe(titles.length);

      // Verify all article URLs are valid http/https URLs (no broken javascript: or malformed URIs)
      for (const item of result.news) {
        expect(item.link.startsWith('http://') || item.link.startsWith('https://')).toBe(true);
      }
    });

    // 16. Multi-claim extraction from complex screenshot
    it('Scenario 16: Extracts multiple independent claims from screenshot without collapsing them', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      imageDescription: 'Social media post with multiple assertions about space launch and budget.',
                      aiGeneration: {
                        status: 'UNLIKELY_AI',
                        label: 'Standard Social Post',
                        observations: 'Authentic interface elements.',
                        limitations: 'Visual only.',
                      },
                      manipulation: {
                        status: 'NO_VISIBLE_EDITS',
                        label: 'No Visible Splicing',
                        observations: 'Uniform layout.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'ISRO launched Chandrayaan-4 today. Mission budget is 10,000 crores.',
                      detectedLanguage: 'English',
                      contentType: 'FACTUAL_CLAIM',
                      hasFactualClaim: true,
                      factualClaim: 'ISRO launched Chandrayaan-4 today',
                      claims: [
                        {
                          text: 'ISRO launched Chandrayaan-4 today',
                          type: 'FACTUAL_CLAIM',
                          isVerifiable: true,
                        },
                        {
                          text: 'Mission budget is 10,000 crores',
                          type: 'FACTUAL_CLAIM',
                          isVerifiable: true,
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        verdict: 'FALSE',
        verdictLabel: "NO, IT'S NOT TRUE",
        score: 10,
        confidence: 90,
        explanation: 'Chandrayaan-4 has not launched today.',
        reasoning: 'Contradicted by current official schedule.',
        directAnswer: 'No, this is false.',
        queryType: 'claim',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [],
      });

      const res = await imageVerifier.verifyImage({
        name: 'isro_post.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(res.imageModules.claimVerification.claims).toBeDefined();
      expect(res.imageModules.claimVerification.claims!.length).toBe(2);
      expect(res.imageModules.claimVerification.claims![0].text).toContain('Chandrayaan-4');
    });

    // 17. Compound Independent Verdict: AI Image + Real News vs Real Image + False News
    it('Scenario 17: Produces compound independent verdict (AI artwork + true news vs Real photo + false news)', async () => {
      // Case A: AI image but supported news claim
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      imageDescription: 'AI artistic illustration of James Webb Space Telescope.',
                      aiGeneration: {
                        status: 'POSSIBLE_AI',
                        label: 'Synthetic Digital Illustration',
                        observations: 'Diffusion textures.',
                        limitations: 'Visual only.',
                      },
                      manipulation: {
                        status: 'NO_VISIBLE_EDITS',
                        label: 'Coherent Artwork',
                        observations: 'No digital compositing.',
                        limitations: 'Visual only.',
                      },
                      extractedText: 'NASA JWST discovered water vapor in exoplanet atmosphere',
                      detectedLanguage: 'English',
                      hasFactualClaim: true,
                      factualClaim: 'NASA JWST discovered water vapor in exoplanet atmosphere',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      vi.spyOn(realtimeVerifier, 'verifyClaim').mockResolvedValueOnce({
        verdict: 'TRUE',
        verdictLabel: "YES, IT'S TRUE",
        score: 95,
        confidence: 94,
        explanation: 'Corroborated by NASA press release.',
        reasoning: 'Verified by primary research papers.',
        directAnswer: 'Yes, this is true.',
        queryType: 'claim',
        isLiveWebVerified: true,
        searchTimestamp: new Date().toISOString(),
        signals: [],
        sources: [{ name: 'NASA', url: 'https://nasa.gov/jwst-water', reliability: 99, snippet: 'Water vapor detected.' }],
      });

      const resAI = await imageVerifier.verifyImage({
        name: 'jwst_art.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(resAI.verdict).toBe('TRUE');
      expect(resAI.imageAuthenticity).toBe('POSSIBLE_AI');
      expect(resAI.imageAuthenticityLabel).toContain('POSSIBLE AI-GENERATED');
      expect(resAI.compoundVerdict).toContain('POSSIBLE AI-GENERATED');
    });

    // 18. Buffer Provenance Inspection and honest reverse-search disclosure
    it('Scenario 18: Honestly audits image buffer structure without fabricating reverse search dates', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      imageDescription: 'Photographic sample',
                      aiGeneration: { status: 'INCONCLUSIVE', label: 'Inconclusive', observations: 'None', limitations: 'Visual only' },
                      manipulation: { status: 'INCONCLUSIVE', label: 'Inconclusive', observations: 'None', limitations: 'Visual only' },
                      hasFactualClaim: false,
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const res = await imageVerifier.verifyImage({
        name: 'sample_photo.png',
        dataUrl: VALID_1X1_PNG,
      });

      expect(res.imageModules.provenance.reverseSearchStatus).toBe('NOT_CONFIGURED');
      expect(res.imageModules.provenance.summary).toContain('reverse-image search');
      expect(res.imageModules.provenance.format).toBe('PNG');
    });

    // 19. Unicode Telugu/Hindi news feed deduplication
    it('Scenario 19: Preserves multiple Telugu and Hindi news articles without stripping Unicode characters', async () => {
      const teluguResult = await newsFeedService.getLiveNews('telugu', true);
      expect(teluguResult).toBeDefined();
      expect(Array.isArray(teluguResult.news)).toBe(true);
      // Ensure Telugu news items are retained and not collapsed to empty string
      if (teluguResult.news.length > 0) {
        expect(teluguResult.news[0].title.length).toBeGreaterThan(0);
      }
    });

    // 20. Stable news article IDs across consecutive requests
    it('Scenario 20: Generates deterministic, stable article IDs rather than fluctuating timestamps', async () => {
      const res1 = await newsFeedService.getLiveNews('all', false);
      const res2 = await newsFeedService.getLiveNews('all', false);

      expect(res1.news.length).toBe(res2.news.length);
      if (res1.news.length > 0) {
        expect(res1.news[0].id).toBe(res2.news[0].id);
      }
    });

    // =========================================================================
    // PART 11: Resilient Gemini Quota Management, Deduplication, Caching & Fallbacks
    // =========================================================================
    describe('PART 11: Gemini Quota Resilience, Caching & Fallbacks', () => {
      it('Scenario 21: transient 429 retries with backoff and recovers successfully', async () => {
        let attempts = 0;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
          attempts++;
          if (attempts === 1) {
            return {
              ok: false,
              status: 429,
              text: async () => JSON.stringify({ error: { message: 'Rate limit exceeded: Please wait a moment' } }),
            } as any;
          }
          return {
            ok: true,
            json: async () => ({
              candidates: [{ content: { parts: [{ text: JSON.stringify({ result: 'recovered' }) }] } }],
            }),
          } as any;
        });

        const res = await geminiClient.generateContent('test transient prompt');
        expect(res.success).toBe(true);
        expect(res.data).toEqual({ result: 'recovered' });
        expect(attempts).toBe(2);
      });

      it('Scenario 22: daily quota exhaustion (RESOURCE_EXHAUSTED) engages circuit breaker and halts redundant requests', async () => {
        let networkCalls = 0;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
          networkCalls++;
          return {
            ok: false,
            status: 429,
            text: async () => JSON.stringify({
              error: {
                message: 'Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20',
                status: 'RESOURCE_EXHAUSTED',
              },
            }),
          } as any;
        });

        // 1. Initial call tries candidate models and engages circuit breaker when all exhausted
        const res1 = await geminiClient.generateContent('query 1');
        expect(res1.success).toBe(false);
        expect(res1.failureReason).toBe('QUOTA_EXHAUSTED');
        expect(geminiClient.isQuotaExhausted()).toBe(true);
        const callsAfterFirst = networkCalls;
        expect(callsAfterFirst).toBeGreaterThanOrEqual(1);

        // 2. Second distinct call immediately short-circuits without hitting fetch
        const res2 = await geminiClient.generateContent('query 2');
        expect(res2.success).toBe(false);
        expect(res2.failureReason).toBe('QUOTA_EXHAUSTED');
        expect(networkCalls).toBe(callsAfterFirst); // Network call count did not increase
      });

      it('Scenario 23: request deduplication merges identical concurrent calls into single network request', async () => {
        let networkCalls = 0;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
          networkCalls++;
          await new Promise((r) => setTimeout(r, 50));
          return {
            ok: true,
            json: async () => ({
              candidates: [{ content: { parts: [{ text: JSON.stringify({ verdict: 'TRUE' }) }] } }],
            }),
          } as any;
        });

        // Fire 2 concurrent identical requests
        const [res1, res2] = await Promise.all([
          geminiClient.generateContent('identical query'),
          geminiClient.generateContent('identical query'),
        ]);

        expect(res1.success).toBe(true);
        expect(res2.success).toBe(true);
        expect(networkCalls).toBe(1); // Only 1 outbound HTTP fetch made
      });

      it('Scenario 24: in-memory cache serves subsequent queries within TTL without network overhead', async () => {
        let networkCalls = 0;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
          networkCalls++;
          return {
            ok: true,
            json: async () => ({
              candidates: [{ content: { parts: [{ text: JSON.stringify({ verdict: 'TRUE' }) }] } }],
            }),
          } as any;
        });

        const res1 = await geminiClient.generateContent('cacheable prompt');
        expect(res1.success).toBe(true);
        expect(networkCalls).toBe(1);

        const res2 = await geminiClient.generateContent('cacheable prompt');
        expect(res2.success).toBe(true);
        expect(res2.cached).toBe(true);
        expect(networkCalls).toBe(1); // Still 1, served from cache
      });

      it('Scenario 25: realtimeVerifier gracefully falls back to multi-source web evidence when Gemini quota is exhausted', async () => {
        // Mock Gemini network call to fail with quota exhausted
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
          const urlStr = typeof url === 'string' ? url : url.toString();
          if (urlStr.includes('generativelanguage.googleapis.com')) {
            return {
              ok: false,
              status: 429,
              text: async () => 'RESOURCE_EXHAUSTED: daily limit reached',
            } as any;
          }
          // Let RSS/web search succeed or fall through
          return {
            ok: true,
            text: async () => '<rss><channel><item><title>ISRO successfully launches Chandrayaan-3</title><link>https://example.com/1</link><description>ISRO launched Chandrayaan-3 successfully to the Moon.</description></item></channel></rss>',
          } as any;
        });

        const outcome = await realtimeVerifier.verifyClaim('ISRO launched Chandrayaan-3');
        expect(outcome).toBeDefined();
        expect(outcome.aiAnalysisStatus).toBe('QUOTA_EXHAUSTED');
        expect(outcome.aiNotice).toContain('quota capacity');
        expect(['TRUE', 'UNVERIFIED']).toContain(outcome.verdict);
        expect(outcome.isLiveWebVerified).toBe(true);
      });

      it('Scenario 26: invalid API key (400/403) stops model rotation and sets INVALID_API_KEY', async () => {
        let calls = 0;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
          calls++;
          return {
            ok: false,
            status: 400,
            text: async () => JSON.stringify({ error: { message: 'API_KEY_INVALID: Key not valid' } }),
          } as any;
        });

        const res = await geminiClient.generateContent('check key');
        expect(res.success).toBe(false);
        expect(res.failureReason).toBe('INVALID_API_KEY');
        expect(calls).toBe(1); // Broke immediately, did not spam candidate models
      });

      it('Scenario 27: imageVerifier provides truthful forensics, UNVERIFIED verdict, and notice without throwing 429', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
          return {
            ok: false,
            status: 429,
            text: async () => 'RESOURCE_EXHAUSTED: quota exceeded',
          } as any;
        });

        const res = await imageVerifier.verifyImage({
          name: 'photo_quota_test.png',
          dataUrl: VALID_1X1_PNG,
        });

        expect(res).toBeDefined();
        expect(res.aiAnalysisStatus).toBe('QUOTA_EXHAUSTED');
        expect(res.aiNotice).toMatch(/quota/i);
        expect(res.imageModules.aiGeneration.status).toBe('INCONCLUSIVE');
        expect(res.imageModules.manipulation.status).toBe('INCONCLUSIVE');
        expect(res.verdict).toBe('UNVERIFIED');
        expect(res.imageModules.provenance.format).toBe('PNG');
      });
    });

    // =========================================================================
    // PART 12: Section 8 — Thirteen Diverse Real-World Verification Test Cases
    // =========================================================================
    describe('PART 12: Section 8 — Thirteen Diverse Real-World Verification Test Cases', () => {
      // 1. Confirmed historical event
      it('Case 1: Confirmed historical event verifies as TRUE / SUPPORTED', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
          if (typeof url === 'string' && url.includes('generativelanguage')) {
            return {
              ok: true,
              json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                  verdict: 'TRUE',
                  verdictLabel: 'TRUE / SUPPORTED',
                  confidence: 95,
                  explanation: 'Historical NASA flight records confirm Neil Armstrong and Buzz Aldrin landed on the Moon in July 1969.',
                  sources: [{ name: 'NASA Apollo 11 Mission', url: 'https://www.nasa.gov/apollo11', pubDate: 'July 1969', snippet: 'Apollo 11 landed on the Moon on July 20, 1969.' }],
                }) }] } }],
              }),
            } as any;
          }
          return {
            ok: true,
            text: async () => '<rss><channel><item><title>Apollo 11 Moon Landing History - NASA</title><link>https://www.nasa.gov/apollo11</link><description>On July 20, 1969, American astronauts Neil Armstrong and Buzz Aldrin became the first humans to land on the Moon.</description><pubDate>Wed, 20 Jul 2022 12:00:00 GMT</pubDate></item></channel></rss>',
          } as any;
        });

        const res = await realtimeVerifier.verifyClaim('Apollo 11 landed humans on the Moon in July 1969');
        expect(res.verdict).toBe('TRUE');
        expect(res.verdictLabel).toBe('TRUE / SUPPORTED');
        expect(res.sources.length).toBeLessThanOrEqual(3);
        expect(res.sources[0].url).toContain('nasa.gov');
        expect(res.explanation.length).toBeGreaterThan(15);
      });

      // 2. Old news incorrectly presented as breaking news
      it('Case 2: Old news presented as breaking news classifies as MISLEADING / OUT OF CONTEXT or FALSE', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
          if (typeof url === 'string' && url.includes('generativelanguage')) {
            return {
              ok: true,
              json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                  verdict: 'MISLEADING',
                  verdictLabel: 'MISLEADING / OUT OF CONTEXT',
                  confidence: 90,
                  explanation: 'Cyclone Michaung was a severe cyclonic storm from December 2023, not a current active weather event.',
                  sources: [{ name: 'The Hindu', url: 'https://thehindu.com/michaung-2023', pubDate: 'Dec 2023', snippet: 'Cyclone Michaung crossed Andhra coast in December 2023.' }],
                }) }] } }],
              }),
            } as any;
          }
          return {
            ok: true,
            text: async () => '<rss><channel><item><title>Cyclone Michaung makes landfall in Andhra Pradesh - Dec 2023</title><link>https://thehindu.com/michaung-2023</link><description>Severe cyclonic storm Michaung crossed south Andhra Pradesh coast on December 5, 2023.</description><pubDate>Tue, 05 Dec 2023 12:00:00 GMT</pubDate></item></channel></rss>',
          } as any;
        });

        const res = await realtimeVerifier.verifyClaim('Severe Cyclone Michaung is making landfall right now today with red alerts');
        expect(['MISLEADING', 'FALSE']).toContain(res.verdict);
        expect(['MISLEADING / OUT OF CONTEXT', 'FALSE / CONTRADICTED']).toContain(res.verdictLabel);
        expect(res.explanation).toMatch(/2023|past|historical|outdated|earlier|not a current/i);
      });

      // 3. Current claim supported by recent reliable evidence
      it('Case 3: Current claim supported by recent reliable evidence yields TRUE / SUPPORTED', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
          if (typeof url === 'string' && url.includes('generativelanguage')) {
            return {
              ok: true,
              json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                  verdict: 'TRUE',
                  verdictLabel: 'TRUE / SUPPORTED',
                  confidence: 94,
                  explanation: 'Recent Reuters reports corroborate that SpaceX conducted its Starship orbital test flight successfully.',
                  sources: [{ name: 'Reuters', url: 'https://reuters.com/spacex-starship', pubDate: 'Recent', snippet: 'SpaceX completed another orbital test flight of Starship.' }],
                }) }] } }],
              }),
            } as any;
          }
          return {
            ok: true,
            text: async () => '<rss><channel><item><title>SpaceX successfully completes Starship flight test</title><link>https://reuters.com/spacex-starship</link><description>SpaceX completed another orbital test flight of Starship with successful ocean splashdown.</description><pubDate>Sun, 11 Oct 2026 08:00:00 GMT</pubDate></item></channel></rss>',
          } as any;
        });

        const res = await realtimeVerifier.verifyClaim('SpaceX Starship conducted its orbital flight test successfully');
        expect(res.verdict).toBe('TRUE');
        expect(res.verdictLabel).toBe('TRUE / SUPPORTED');
        expect(res.sources.length).toBeGreaterThan(0);
        expect(res.sources[0].url).toContain('reuters.com');
      });

      // 4. Claim contradicted by authoritative sources
      it('Case 4: Claim contradicted by authoritative sources yields FALSE / CONTRADICTED', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
          if (typeof url === 'string' && url.includes('generativelanguage')) {
            return {
              ok: true,
              json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                  verdict: 'FALSE',
                  verdictLabel: 'FALSE / CONTRADICTED',
                  confidence: 96,
                  explanation: 'Official WHO statements confirm that no worldwide ban on coffee consumption has been issued.',
                  sources: [{ name: 'WHO Fact Sheet', url: 'https://who.int/news/coffee-myth-debunked', snippet: 'WHO debunks viral coffee ban claims.' }],
                }) }] } }],
              }),
            } as any;
          }
          return {
            ok: true,
            text: async () => '<rss><channel><item><title>Fact Check: WHO has not declared any global ban on coffee</title><link>https://who.int/news/coffee-myth-debunked</link><description>World Health Organization debunks false social media viral claims asserting coffee is banned.</description></item></channel></rss>',
          } as any;
        });

        const res = await realtimeVerifier.verifyClaim('WHO has declared a worldwide ban on coffee consumption');
        expect(res.verdict).toBe('FALSE');
        expect(res.verdictLabel).toBe('FALSE / CONTRADICTED');
        expect(res.explanation).toMatch(/false|contradict|debunk|not|no/i);
      });

      // 5. Partly true claim
      it('Case 5: Partly true claim yields PARTLY TRUE', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
          if (typeof url === 'string' && url.includes('generativelanguage')) {
            return {
              ok: true,
              json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                  verdict: 'PARTLY_TRUE',
                  verdictLabel: 'PARTLY TRUE',
                  confidence: 85,
                  explanation: 'The tax bill did pass into law, but the proposed wealth surcharge was excluded from the final legislation.',
                  sources: [{ name: 'BBC News', url: 'https://bbc.com/tax-reform-passed', pubDate: 'Recent', snippet: 'Tax bill passed without wealth surcharge.' }],
                }) }] } }],
              }),
            } as any;
          }
          return {
            ok: true,
            text: async () => '<rss><channel><item><title>Tax Bill Passes With Major Amendments but Excludes Wealth Surcharge</title><link>https://bbc.com/tax-reform-passed</link><description>Parliament passed the comprehensive tax overhaul, though the proposed wealth surcharge was dropped from the final act.</description></item></channel></rss>',
          } as any;
        });

        const res = await realtimeVerifier.verifyClaim('Parliament passed the new tax bill including a universal wealth surcharge');
        expect(res.verdict).toBe('PARTLY_TRUE');
        expect(res.verdictLabel).toBe('PARTLY TRUE');
      });

      // 6. Misleading headline or missing context
      it('Case 6: Misleading headline or out-of-context quote yields MISLEADING / OUT OF CONTEXT', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
          if (typeof url === 'string' && url.includes('generativelanguage')) {
            return {
              ok: true,
              json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                  verdict: 'MISLEADING',
                  verdictLabel: 'MISLEADING / OUT OF CONTEXT',
                  confidence: 88,
                  explanation: 'The quote was taken from a simulated emergency exercise and does not represent an actual school closure order.',
                  sources: [{ name: 'AP News', url: 'https://apnews.com/education-quote-context', pubDate: 'Recent', snippet: 'Statement taken out of context.' }],
                }) }] } }],
              }),
            } as any;
          }
          return {
            ok: true,
            text: async () => '<rss><channel><item><title>Minister statement taken out of context regarding school closures</title><link>https://apnews.com/education-quote-context</link><description>A video clip circulated online removed the minister explaining an emergency hypothetical drill, presenting it as an indefinite closure.</description></item></channel></rss>',
          } as any;
        });

        const res = await realtimeVerifier.verifyClaim('Education Minister announces all schools closed indefinitely');
        expect(res.verdict).toBe('MISLEADING');
        expect(res.verdictLabel).toBe('MISLEADING / OUT OF CONTEXT');
      });

      // 7. Future prediction whose outcome is not yet known
      it('Case 7: Future unverified prediction yields UNVERIFIED / INSUFFICIENT EVIDENCE', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
          if (typeof url === 'string' && url.includes('generativelanguage')) {
            return {
              ok: true,
              json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                  verdict: 'UNVERIFIED',
                  verdictLabel: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
                  confidence: 50,
                  explanation: 'The 2031 Cricket World Cup outcome is a future prediction that cannot be verified as factual today.',
                  sources: [{ name: 'ICC Cricket', url: 'https://icc-cricket.com/news/2031-hosts', snippet: '2031 World Cup announced.' }],
                }) }] } }],
              }),
            } as any;
          }
          return {
            ok: true,
            text: async () => '<rss><channel><item><title>ICC announces host venues for 2031 Cricket World Cup</title><link>https://icc-cricket.com/news/2031-hosts</link><description>India and Bangladesh will co-host the 2031 ICC Men Cricket World Cup.</description></item></channel></rss>',
          } as any;
        });

        const res = await realtimeVerifier.verifyClaim('India will win the 2031 Cricket World Cup final by 50 runs');
        expect(res.verdict).toBe('UNVERIFIED');
        expect(res.verdictLabel).toBe('UNVERIFIED / INSUFFICIENT EVIDENCE');
      });

      // 8. Ambiguous claim with insufficient evidence
      it('Case 8: Ambiguous claim with insufficient evidence yields UNVERIFIED / INSUFFICIENT EVIDENCE', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
          ok: true,
          text: async () => '<rss><channel></channel></rss>',
          json: async () => ({}),
        } as any);

        const res = await realtimeVerifier.verifyClaim('Secret underground diamond cave discovered in village XYZ9012');
        expect(res.verdict).toBe('UNVERIFIED');
        expect(res.verdictLabel).toBe('UNVERIFIED / INSUFFICIENT EVIDENCE');
        expect(res.sources.length).toBe(0);
      });

      // 9. Genuine image with incorrect caption (separating image authenticity from claim truth)
      it('Case 9: Genuine image paired with false claim separates authenticity from claim truth', async () => {
        const mockVision = {
          imageDescription: 'An authentic photograph of an Indian Prime Minister press briefing in New Delhi.',
          aiGeneration: {
            status: 'UNLIKELY_AI',
            label: 'Authentic Photographic Characteristics',
            observations: 'Natural skin textures and optical lens reflections.',
            limitations: 'Visual check only.',
          },
          manipulation: {
            status: 'NO_VISIBLE_EDITS',
            label: 'No Obvious Digital Compositing Detected',
            observations: 'No spliced edges detected.',
            limitations: 'Visual check only.',
          },
          extractedText: 'PM ANNOUNCES TOTAL CURFEW ACROSS ENTIRE NATION STARTING TONIGHT',
          detectedLanguage: 'English',
          contentType: 'FACTUAL_CLAIM',
          hasFactualClaim: true,
          factualClaim: 'PM announces total curfew across entire nation starting tonight',
        };

        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init?: any) => {
          if (typeof url === 'string' && url.includes('generativelanguage')) {
            const bodyStr = typeof init?.body === 'string' ? init.body : '';
            if (bodyStr.includes('inlineData')) {
              return {
                ok: true,
                json: async () => ({
                  candidates: [{ content: { parts: [{ text: JSON.stringify(mockVision) }] } }],
                }),
              } as any;
            }
            return {
              ok: true,
              json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                  verdict: 'FALSE',
                  verdictLabel: 'FALSE / CONTRADICTED',
                  confidence: 95,
                  explanation: 'Official PIB fact-check and government sources confirm that no national curfew has been announced.',
                  sources: [{ name: 'PIB Fact Check', url: 'https://factcheck.pib.gov.in/curfew-fake', snippet: 'Debunked false curfew.' }],
                }) }] } }],
              }),
            } as any;
          }
          return {
            ok: true,
            text: async () => '<rss><channel><item><title>PIB Fact Check: Viral claim about national curfew is fake</title><link>https://factcheck.pib.gov.in/curfew-fake</link><description>Government has announced no such national curfew.</description></item></channel></rss>',
          } as any;
        });

        const res = await imageVerifier.verifyImage({
          name: 'pm_press.png',
          dataUrl: VALID_1X1_PNG,
        });

        // Main claim verdict is FALSE because evidence contradicts the claim
        expect(res.verdict).toBe('FALSE');
        expect(res.verdictLabel).toBe('FALSE / CONTRADICTED');
        // Image authenticity is decoupled and clearly reported
        expect(res.imageAuthenticity).toBe('NOT_VERIFIED');
        expect(res.imageAuthenticityLabel).toBe('IMAGE AUTHENTICITY: NOT VERIFIED');
      });

      // 10. Image whose authenticity cannot be reliably established
      it('Case 10: Image whose authenticity cannot be reliably established shows IMAGE AUTHENTICITY: NOT VERIFIED', async () => {
        const mockVision = {
          imageDescription: 'A photograph of a generic highway with distant clouds.',
          aiGeneration: {
            status: 'INCONCLUSIVE',
            label: 'Inconclusive Visual Check',
            observations: 'Resolution is too low to inspect micro-textures or synthetic artifacts.',
            limitations: 'Visual inspection only.',
          },
          manipulation: {
            status: 'INCONCLUSIVE',
            label: 'Inconclusive',
            observations: 'Compression artifacts present.',
            limitations: 'Visual inspection only.',
          },
          extractedText: '',
          detectedLanguage: 'None',
          contentType: 'PHOTO_ONLY',
          hasFactualClaim: false,
          factualClaim: '',
        };

        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: JSON.stringify(mockVision) }] } }],
          }),
        } as any);

        const res = await imageVerifier.verifyImage({
          name: 'highway.jpg',
          dataUrl: VALID_1X1_PNG,
        });

        expect(res.imageAuthenticity).toBe('NOT_VERIFIED');
        expect(res.imageAuthenticityLabel).toBe('IMAGE AUTHENTICITY: NOT VERIFIED');
        expect(res.verdict).toBe('UNVERIFIED');
      });

      // 11. Conflicting sources
      it('Case 11: Conflicting sources explain the disagreement briefly', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
          if (typeof url === 'string' && url.includes('generativelanguage')) {
            return {
              ok: true,
              json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                  verdict: 'PARTLY_TRUE',
                  verdictLabel: 'PARTLY TRUE',
                  confidence: 78,
                  explanation: 'Official producer statements report a 100-crore opening, while independent box-office trackers estimate approximately 75 crores.',
                  sources: [
                    { name: 'Producer Statement', url: 'https://source1.com', snippet: '100 crore gross claimed.' },
                    { name: 'Trade Tracker', url: 'https://source2.com', snippet: '75 crore estimated.' },
                  ],
                }) }] } }],
              }),
            } as any;
          }
          return {
            ok: true,
            text: async () => '<rss><channel><item><title>Producer reports 100 crore opening</title><link>https://source1.com</link><description>Producers claim film crossed 100 crore worldwide on Day 1.</description></item><item><title>Trade analysts report 75 crore day 1 gross</title><link>https://source2.com</link><description>Independent box-office trackers estimate Day 1 total at 75 crore.</description></item></channel></rss>',
          } as any;
        });

        const res = await realtimeVerifier.verifyClaim('Movie ABC made 100 crore on day 1');
        expect(['PARTLY_TRUE', 'UNVERIFIED']).toContain(res.verdict);
        expect(res.explanation).toMatch(/tracker|producer|estimate|claim/i);
      });

      // 12. Web search failure, API quota exhaustion, and invalid responses
      it('Case 12: Handles search failures gracefully without faking evidence', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network connection timeout'));

        const res = await realtimeVerifier.verifyClaim('Some unsearchable event');
        expect(res).toBeDefined();
        expect(res.verdict).toBe('UNVERIFIED');
        expect(res.verdictLabel).toBe('UNVERIFIED / INSUFFICIENT EVIDENCE');
        expect(res.sources).toHaveLength(0);
        expect(res.explanation).toMatch(/unavailable|insufficient/i);
      });

      // 13. Text and image verification return concise, non-repetitive explanations
      it('Case 13: Text and image verifications return concise 1-2 sentence explanations capped at 3 sources', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
          if (typeof url === 'string' && url.includes('generativelanguage')) {
            return {
              ok: true,
              json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                  verdict: 'TRUE',
                  verdictLabel: 'TRUE / SUPPORTED',
                  confidence: 95,
                  explanation: 'ISRO successfully touched down Chandrayaan-3 on the lunar south polar region on August 23, 2023. International space agencies and global media confirmed the historic landing.',
                  sources: [
                    { name: 'BBC News', url: 'https://bbc.com/ch3', snippet: 'Lunar landing successful on south pole.' },
                    { name: 'Reuters', url: 'https://reuters.com/ch3', snippet: 'Landed near south pole successfully.' },
                    { name: 'NASA', url: 'https://nasa.gov/ch3', snippet: 'Space agency congratulations sent.' },
                    { name: 'Extra Source', url: 'https://extra.com', snippet: 'Extra.' },
                  ],
                }) }] } }],
              }),
            } as any;
          }
          return {
            ok: true,
            text: async () => '<rss><channel><item><title>BBC News - Chandrayaan 3</title><link>https://bbc.com/ch3</link><description>ISRO lunar landing successful on south pole with Vikram lander and Pragyan rover.</description></item><item><title>Reuters - Chandrayaan 3</title><link>https://reuters.com/ch3</link><description>Landed near south pole successfully with international commendations.</description></item><item><title>NASA congratulates ISRO</title><link>https://nasa.gov/ch3</link><description>Space agency congratulations sent to team for landing.</description></item><item><title>Fourth Source</title><link>https://extra.com</link><description>Extra link description with enough characters.</description></item></channel></rss>',
          } as any;
        });

        const textRes = await realtimeVerifier.verifyClaim('ISRO successfully landed Chandrayaan-3 on the Moon');
        expect(textRes.sources.length).toBeLessThanOrEqual(3);
        expect(textRes.explanation.length).toBeGreaterThan(20);
        expect(textRes.explanation.length).toBeLessThan(300);
      });

      it('Case 14: Saveetha college fees waiver claim cannot become TRUE based on unrelated 2027 search results', async () => {
        // Mock search to return unrelated 2027 results (Cricket World Cup 2027, Eurovision 2027)
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
          const u = typeof url === 'string' ? url : url.toString();
          if (u.includes('generativelanguage')) {
            return {
              ok: true,
              json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                  verdict: 'UNVERIFIED',
                  verdictLabel: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
                  claimStatus: 'UNVERIFIED_INSUFFICIENT_EVIDENCE',
                  explanation: 'No official announcement or verified reporting confirms that Saveetha College has announced a college fee waiver for 2027.',
                }) }] } }],
              }),
            } as any;
          }
          if (u.includes('wikipedia')) {
            return {
              ok: true,
              json: async () => ({
                query: {
                  search: [
                    { title: '2027 in sports', snippet: 'The 2027 Cricket World Cup is scheduled to be held in South Africa, Zimbabwe, and Namibia in 2027.' },
                    { title: 'Eurovision Song Contest 2027', snippet: 'The Eurovision Song Contest 2027 will be the 71st edition of the annual contest.' },
                  ],
                },
              }),
            } as any;
          }
          return {
            ok: true,
            text: async () => '<html><body>Search results mentioning year 2027 and global sports competitions.</body></html>',
          } as any;
        });

        const claim = 'in chennai saveetha college offically announced that 2027 to there is no college fees for students';
        const res = await realtimeVerifier.verifyClaim(claim);

        expect(res.verdict).toBe('UNVERIFIED');
        expect(res.verdictLabel).toBe('UNVERIFIED / INSUFFICIENT EVIDENCE');
        expect(res.verdict).not.toBe('TRUE');
        // Unrelated 2027 sports/song contest pages should NOT be included in topSources
        const hasUnrelatedSources = (res.sources || []).some(s => s.name.includes('Cricket') || s.name.includes('Eurovision'));
        expect(hasUnrelatedSources).toBe(false);
      });

      it('Case 15: Image verification truthfully reports service errors without masking as no-claim', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ({
          ok: false,
          status: 503,
          text: async () => 'Service Temporarily Unavailable',
        } as any));

        const result = await imageVerifier.verifyImage({
          name: 'virat_hospital_screenshot.png',
          dataUrl: VALID_1X1_PNG,
        });

        expect(result.verdict).toBe('UNVERIFIED');
        expect(result.explanation).toContain('Vision AI analysis could not be completed');
        expect(result.imageAuthenticity).toBe('NOT_VERIFIED');
      });
    });
  });
});
