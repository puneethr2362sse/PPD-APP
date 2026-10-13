import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { realtimeVerifier } from '../server/services/realtimeVerifier.js';
import { imageVerifier } from '../server/services/imageVerifier.js';

describe('VerifyAI Text & Image Verification End-to-End Test Suite', () => {
  const rootDir = process.cwd();
  const heroImgPath = path.join(rootDir, 'src', 'assets', 'hero.png');

  it('VER-001: should verify a real scientific text claim end-to-end', async () => {
    const claim = 'James Webb Space Telescope detects carbon dioxide in atmosphere of exoplanet WASP-39b';
    const result = await realtimeVerifier.verifyClaim(claim, 'ci-test@verifyai.org');

    expect(result).toBeDefined();
    expect(result.claim).toBe(claim);
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(typeof result.verdict).toBe('string');
    expect(result.verdict.length).toBeGreaterThan(0);
    expect(typeof result.verdictLabel).toBe('string');
    expect(result.verdictLabel.length).toBeGreaterThan(0);
    expect(typeof result.directAnswer).toBe('string');
    expect(result.directAnswer.length).toBeGreaterThan(0);
    expect(Array.isArray(result.sources)).toBe(true);
  }, 30000);

  it('VER-002: should verify a debunked medical myth text claim end-to-end', async () => {
    const claim = 'Drinking boiled lemon water with baking soda completely eliminates diabetes in 48 hours';
    const result = await realtimeVerifier.verifyClaim(claim, 'ci-test@verifyai.org');

    expect(result).toBeDefined();
    expect(result.claim).toBe(claim);
    expect(typeof result.score).toBe('number');
    expect(typeof result.verdict).toBe('string');
    expect(['FALSE', 'MISLEADING', 'UNVERIFIED', 'INSUFFICIENT_EVIDENCE']).toContain(result.verdict);
    expect(typeof result.directAnswer).toBe('string');
    expect(result.directAnswer.length).toBeGreaterThan(0);
  }, 30000);

  it('VER-003: should verify a valid, non-empty image file (hero.png, 13KB) end-to-end', async () => {
    expect(fs.existsSync(heroImgPath), 'src/assets/hero.png must exist').toBe(true);
    const buffer = fs.readFileSync(heroImgPath);
    expect(buffer.length).toBeGreaterThan(5000); // Verify it is a real image, not a placeholder

    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;

    const result = await imageVerifier.verifyImage({
      name: 'hero.png',
      dataUrl,
      email: 'ci-test@verifyai.org',
    });

    expect(result).toBeDefined();
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(typeof result.verdict).toBe('string');
    expect(typeof result.verdictLabel).toBe('string');
    expect(result.imageModules).toBeDefined();
    expect(result.imageModules?.provenance?.format).toBe('PNG');
    expect(result.imageModules?.provenance?.fileSizeKB).toBeGreaterThan(0);
    expect(typeof result.imageDescription).toBe('string');
    expect(result.imageDescription.length).toBeGreaterThan(0);
  }, 45000);

  it('VER-004: should cleanly reject empty or invalid image data without false success', async () => {
    await expect(imageVerifier.verifyImage({
      name: 'corrupt.png',
      dataUrl: 'data:image/png;base64,invalid-base64-payload',
      email: 'ci-test@verifyai.org',
    })).rejects.toThrow();
  });

  it('VER-005: should cleanly reject empty or whitespace text claims', async () => {
    await expect(realtimeVerifier.verifyClaim('   ', 'ci-test@verifyai.org')).rejects.toThrow();
  });
});
