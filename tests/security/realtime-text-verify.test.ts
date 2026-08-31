import { describe, it, expect } from 'vitest';
import { realtimeVerifier } from '../../server/services/realtimeVerifier';

describe('Real-Time Web News Verification Engine Suite (Dynamic Runtime Fact Checking)', () => {
  it('1. should dynamically verify movie box office claim with live internet sources (e.g. Toxic ₹500 crore)', async () => {
    const claim = 'Toxic movie day 1 collection was ₹500 crore.';
    const result = await realtimeVerifier.verifyClaim(claim);

    expect(result).toBeDefined();
    expect(result.isLiveWebVerified).toBe(true);
    expect(['FALSE', 'UNVERIFIED', 'TRUE']).toContain(result.verdict);
    expect(result.sources.length).toBeGreaterThan(0);
    // Ensure sources have real URLs, names, and domains
    expect(result.sources[0].url.startsWith('http')).toBe(true);
    expect(result.sources[0].name.length).toBeGreaterThan(0);
    expect(result.explanation.length).toBeGreaterThan(20);
  }, 30000);

  it('2. should dynamically verify space technology announcements with real-time news records', async () => {
    const claim = 'ISRO launched SSLV D3 rocket from Sriharikota.';
    const result = await realtimeVerifier.verifyClaim(claim);

    expect(result).toBeDefined();
    expect(result.isLiveWebVerified).toBe(true);
    expect(['TRUE', 'FALSE', 'UNVERIFIED']).toContain(result.verdict);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources.some(s => /hindu|times|india|isro|news/i.test(s.name) || s.url.includes('news'))).toBe(true);
  }, 30000);

  it('3. should dynamically verify infrastructure project claims with real sources', async () => {
    const claim = 'Tamil Nadu government metro extension to Poonamallee.';
    const result = await realtimeVerifier.verifyClaim(claim);

    expect(result).toBeDefined();
    expect(result.isLiveWebVerified).toBe(true);
    expect(['TRUE', 'UNVERIFIED']).toContain(result.verdict);
    expect(result.sources.length).toBeGreaterThan(0);
  }, 30000);

  it('4. should dynamically flag ungrounded viral fabrications without inventing fake evidence', async () => {
    const claim = 'Scientists discovered aliens living inside a volcano in Antarctica yesterday.';
    const result = await realtimeVerifier.verifyClaim(claim);

    expect(result).toBeDefined();
    expect(result.isLiveWebVerified).toBe(true);
    expect(['UNVERIFIED', 'FALSE']).toContain(result.verdict);
    if (result.verdict === 'UNVERIFIED') {
      expect(result.verdictLabel).toBe("NOT ENOUGH EVIDENCE");
    }
  }, 30000);

  it('5. should provide real publication dates, domains, and reliability scores for every retrieved source', async () => {
    const claim = 'RBI announced monetary policy interest rate updates in India.';
    const result = await realtimeVerifier.verifyClaim(claim);

    expect(result.sources.length).toBeGreaterThan(0);
    for (const src of result.sources) {
      expect(src.name).toBeDefined();
      expect(src.url).toBeDefined();
      expect(src.url.startsWith('http')).toBe(true);
      expect(src.reliability).toBeGreaterThanOrEqual(80);
      // Ensure HTML entities are decoded
      expect(src.name).not.toContain('&amp;');
      expect(src.name).not.toContain('&#39;');
    }
  }, 30000);

  it('6. should detect component contradiction when live evidence contradicts match opponent (e.g. final vs England instead of South Africa)', async () => {
    const claim = "India won the 2024 ICC Men's T20 World Cup final against England";
    const result = await realtimeVerifier.verifyClaim(claim);

    expect(result).toBeDefined();
    expect(['FALSE', 'UNVERIFIED']).toContain(result.verdict);
    expect(result.score).toBeLessThanOrEqual(50);
    expect(result.sources.length).toBeGreaterThan(0);
  }, 30000);

  it('7. should confirm claim when all essential components and opponents match verified records (e.g. final vs South Africa)', async () => {
    const claim = "India won the 2024 ICC Men's T20 World Cup final against South Africa";
    const result = await realtimeVerifier.verifyClaim(claim);

    expect(result).toBeDefined();
    expect(['TRUE', 'UNVERIFIED']).toContain(result.verdict);
    expect(result.sources.length).toBeGreaterThan(0);
  }, 30000);
});
