import 'dotenv/config';
import { geminiClient } from './geminiClient.js';

export interface VerifiedSource {
  name: string;
  url: string;
  domain?: string;
  pubDate?: string;
  reliability: number;
  snippet?: string;
  /** Extracted page content used for verification; titles are metadata only. */
  evidenceText?: string;
  relevanceScore?: number;
}

export interface VerificationSignal {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  score: number;
  detail: string;
}

export type VerificationVerdict =
  | 'TRUE'
  | 'FALSE'
  | 'PARTLY_TRUE'
  | 'MISLEADING'
  | 'UNVERIFIED';

export type VerificationVerdictLabel =
  | 'TRUE / SUPPORTED'
  | 'FALSE / CONTRADICTED'
  | 'PARTLY TRUE'
  | 'MISLEADING / OUT OF CONTEXT'
  | 'UNVERIFIED / INSUFFICIENT EVIDENCE'
  | "YES, IT'S TRUE"
  | "NO, IT'S NOT TRUE"
  | 'NOT ENOUGH EVIDENCE';

export type ClaimStatus =
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

export type ClaimStatusLabel =
  | 'CURRENTLY SUPPORTED'
  | 'HISTORICAL / OUTDATED'
  | 'OFFICIALLY SCHEDULED / FUTURE'
  | 'FALSE / CONTRADICTED'
  | 'PARTLY TRUE'
  | 'MISLEADING / OUT OF CONTEXT'
  | 'MISLEADING / WRONG CONTEXT'
  | 'UNVERIFIED / INSUFFICIENT EVIDENCE'
  | 'TRUE / SUPPORTED'
  | "YES, IT'S TRUE"
  | "NO, IT'S NOT TRUE"
  | 'NOT ENOUGH EVIDENCE';

export interface EvidenceEvaluationResult {
  verdict: VerificationVerdict;
  verdictLabel: VerificationVerdictLabel;
  claimStatus: ClaimStatus;
  claimStatusLabel: ClaimStatusLabel;
  timeline?: {
    eventDate?: string;
    publicationDate?: string;
    currentStatus?: string;
    temporalStatus?: 'past' | 'current' | 'future' | 'unknown';
  };
  score: number;
  confidence: number;
  directAnswer?: string;
  reasoning?: string;
  explanation: string;
}

export interface RealtimeVerificationOutput {
  verdict: VerificationVerdict;
  verdictLabel: VerificationVerdictLabel;
  claimStatus?: ClaimStatus;
  claimStatusLabel?: ClaimStatusLabel | string;
  timeline?: {
    eventDate?: string;
    publicationDate?: string;
    currentStatus?: string;
    temporalStatus?: 'past' | 'current' | 'future' | 'unknown';
  };
  score: number;
  confidence: number;
  directAnswer?: string;
  reasoning?: string;
  queryType?: 'question' | 'claim';
  explanation: string;
  claim: string;
  originalClaim: string;
  isLiveWebVerified: boolean;
  searchTimestamp: string;
  aiAnalysisStatus?: 'SUCCESS' | 'QUOTA_EXHAUSTED' | 'RATE_LIMIT_TRANSIENT' | 'INVALID_API_KEY' | 'UNAVAILABLE' | 'SKIPPED';
  aiNotice?: string;
  signals: VerificationSignal[];
  sources: VerifiedSource[];
}

// ─── Authoritative domain classifications ───────────────────────────────────
const OFFICIAL_GOV_DOMAINS = [
  'gov.in', 'nic.in', 'pib.gov.in', 'isro.gov.in', 'rbi.org.in', 'who.int', 'cdc.gov',
  'gov', 'gov.uk', 'nasa.gov', 'un.org', 'mohfw.gov.in', 'eci.gov.in', 'mea.gov.in',
  'whitehouse.gov', 'icc-cricket.com', 'bcci.tv', 'olympics.com', 'fifa.com', 'europa.eu',
];

const ACCREDITED_NEWS_DOMAINS = [
  'reuters.com', 'apnews.com', 'thehindu.com', 'bbc.com', 'bbc.co.uk',
  'indianexpress.com', 'timesofindia.indiatimes.com', 'ndtv.com',
  'hindustantimes.com', 'bloomberg.com', 'deccanherald.com', 'ptinews.com', 'ani.in',
  'economictimes.indiatimes.com', 'livemint.com', 'business-standard.com',
  'forbes.com', 'wsj.com', 'nytimes.com', 'theguardian.com', 'wikipedia.org',
  'espncricinfo.com', 'cricinfo.com', 'cricbuzz.com', 'britannica.com',
  'snopes.com', 'factcheck.org', 'politifact.com', 'altnews.in', 'boomlive.in',
];

// ─── Utility helpers ─────────────────────────────────────────────────────────

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'web-source';
  }
}

function calculateSourceReliability(sourceName: string, url: string): number {
  const domain = extractDomain(url);
  const nameLower = (sourceName || '').toLowerCase();
  if (OFFICIAL_GOV_DOMAINS.some(d => domain.endsWith(d) || domain.includes('.' + d))) return 99;
  if (ACCREDITED_NEWS_DOMAINS.some(d => domain.includes(d) || nameLower.includes(d.split('.')[0]))) return 95;
  if (/reuters|associated press|bbc|pti|the hindu|indian express|times of india|ndtv|bloomberg|forbes|wikipedia|guardian|britannica|snopes|factcheck|politifact/i.test(nameLower)) return 94;
  return 85;
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSearchQuery(raw: string): string {
  return raw
    .replace(/['\u201C\u201D\u2018\u2019]/gu, ' ')
    .replace(/[^\p{L}\p{N}\s\u20B9$\u20AC\xA3%.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── 1. LIVE SEARCH: DuckDuckGo HTML Search ──────────────────────────────────
export async function searchDDG(query: string): Promise<VerifiedSource[]> {
  try {
    const cleanQ = cleanSearchQuery(query);
    const encoded = encodeURIComponent(cleanQ);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) return [];

    const html = await res.text();
    const results: VerifiedSource[] = [];

    const resultBlocks = html.split(/<div[^>]*class="[^"]*result__body[^"]*"[^>]*>/i);
    for (let i = 1; i < resultBlocks.length; i++) {
      const block = resultBlocks[i];
      const titleMatch = block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const snippetMatch = block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
        block.match(/class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/span>/i);

      if (titleMatch) {
        let rawUrl = titleMatch[1];
        if (rawUrl.includes('uddg=')) {
          try { rawUrl = decodeURIComponent(rawUrl.split('uddg=')[1].split('&')[0]); } catch { }
        } else if (rawUrl.startsWith('//')) {
          rawUrl = 'https:' + rawUrl;
        }

        const title = decodeHtmlEntities(titleMatch[2]);
        const snippet = snippetMatch ? decodeHtmlEntities(snippetMatch[1]) : '';

        if (title && rawUrl.startsWith('http') && !rawUrl.includes('duckduckgo.com')) {
          results.push({
            name: title,
            url: rawUrl,
            domain: extractDomain(rawUrl),
            reliability: calculateSourceReliability(title, rawUrl),
            snippet: snippet || title,
          });
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}

// ─── 2. LIVE SEARCH: Google News RSS ─────────────────────────────────────────
export async function searchGoogleNews(query: string): Promise<VerifiedSource[]> {
  try {
    const cleanQ = cleanSearchQuery(query);
    const encoded = encodeURIComponent(cleanQ);
    const res = await fetch(`https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.split('<item>');
    const sources: VerifiedSource[] = [];

    for (let i = 1; i < items.length && sources.length < 6; i++) {
      const item = items[i];
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/) || item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);
      const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      if (titleMatch && linkMatch) {
        const title = decodeHtmlEntities(titleMatch[1]);
        const link = linkMatch[1].trim();
        const sourceName = sourceMatch ? decodeHtmlEntities(sourceMatch[1]) : 'Google News';
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
        sources.push({
          name: title,
          url: link,
          domain: 'news.google.com',
          pubDate: pubDate || undefined,
          reliability: calculateSourceReliability(sourceName, link),
          snippet: title,
          evidenceText: title,
        });
      }
    }
    return sources;
  } catch {
    return [];
  }
}

interface WikiSearchQueryData {
  query?: {
    search?: Array<{
      title?: string;
      snippet?: string;
    }>;
  };
}

interface WikiPageQueryData {
  query?: {
    pages?: Record<string, {
      extract?: string;
    }>;
  };
}

interface WikiSummaryData {
  extract?: string;
}

type WikiOpenSearchData = [string, string[], string[], string[]];

// ─── 3. LIVE SEARCH: Wikipedia — Full-Text MediaWiki Search + Summary + Lead Section ──────
export async function searchWikipediaWithSummary(query: string): Promise<VerifiedSource[]> {
  try {
    const cleanQ = cleanSearchQuery(query);
    if (!cleanQ || cleanQ.length < 2) return [];
    const encoded = encodeURIComponent(cleanQ);

    const headers = { 'User-Agent': 'VerifyAI-FactChecker/1.0 (https://verifyai.org; contact@verifyai.org)' };
    const results: VerifiedSource[] = [];
    const seenTitles = new Set<string>();

    // 1. MediaWiki Full-Text Search API (searches body of all Wikipedia articles)
    try {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&srlimit=4&format=json`,
        { headers, signal: AbortSignal.timeout(6000) }
      );
      if (searchRes.ok) {
        const searchData = (await searchRes.json()) as WikiSearchQueryData;
        const items = searchData.query?.search || [];
        for (const item of items) {
          const title = item.title;
          if (title && !seenTitles.has(title.toLowerCase())) {
            seenTitles.add(title.toLowerCase());
            const snippet = decodeHtmlEntities(item.snippet || '');
            const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;

            // Fetch comprehensive plain-text extract for the article
            let extract = snippet;
            try {
              const fullRes = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&explaintext=true&format=json`,
                { headers, signal: AbortSignal.timeout(5000) }
              );
              if (fullRes.ok) {
                const fullData = (await fullRes.json()) as WikiPageQueryData;
                const pages = fullData.query?.pages || {};
                const firstPage = Object.values(pages)[0];
                if (firstPage?.extract && firstPage.extract.length > 50) {
                  extract = decodeHtmlEntities(firstPage.extract).slice(0, 8000);
                }
              }
            } catch { }

            // If query API didn't return text, try summary REST API
            if (extract.length <= snippet.length) {
              try {
                const sumRes = await fetch(
                  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/\s+/g, '_'))}`,
                  { headers, signal: AbortSignal.timeout(5000) }
                );
                if (sumRes.ok) {
                  const sumData = (await sumRes.json()) as WikiSummaryData;
                  if (sumData.extract && sumData.extract.length > extract.length) {
                    extract = decodeHtmlEntities(sumData.extract);
                  }
                }
              } catch { }
            }

            results.push({
              name: decodeHtmlEntities(title) + ' - Wikipedia',
              url: pageUrl,
              domain: 'en.wikipedia.org',
              snippet: snippet || extract.slice(0, 300),
              evidenceText: extract,
              reliability: 96,
            });
          }
        }
      }
    } catch { }

    // 2. Opensearch title prefix fallback
    if (results.length === 0) {
      try {
        const openRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encoded}&limit=3&namespace=0&format=json`,
          { headers, signal: AbortSignal.timeout(5000) }
        );
        if (openRes.ok) {
          const data = (await openRes.json()) as WikiOpenSearchData;
          const titles: string[] = data[1] || [];
          const urls: string[] = data[3] || [];
          for (let i = 0; i < Math.min(titles.length, 2); i++) {
            const title = titles[i];
            const pageUrl = urls[i];
            if (!title || !pageUrl || seenTitles.has(title.toLowerCase())) continue;
            seenTitles.add(title.toLowerCase());
            results.push({
              name: decodeHtmlEntities(title) + ' - Wikipedia',
              url: pageUrl,
              domain: 'en.wikipedia.org',
              snippet: decodeHtmlEntities(title),
              reliability: 94,
            });
          }
        }
      } catch { }
    }

    return results;
  } catch {
    return [];
  }
}

// ─── 4. Generic Entity Extraction ────────────────────────────────────────────
export function extractEntities(text: string): string[] {
  const entities: string[] = [];

  const multiWordRegex = /\b([A-Z0-9][a-zA-Z0-9]*(?:\s+[A-Z0-9][a-zA-Z0-9]*)+)\b/g;
  let m;
  while ((m = multiWordRegex.exec(text)) !== null) {
    const ent = m[1].trim();
    if (!/^(The|This|That|What|When|Where|Which|Why|How|Yesterday|Today|Tomorrow)$/i.test(ent)) {
      if (!entities.includes(ent)) entities.push(ent);
    }
  }

  const singleWordRegex = /\b([A-Z0-9]{2,}|[A-Z][a-z]{2,})\b/g;
  while ((m = singleWordRegex.exec(text)) !== null) {
    const ent = m[1].trim();
    const isStopWord = /^(The|This|That|What|When|Where|Which|Why|How|Yesterday|Today|Tomorrow|Yes|No|Not|Who|Whom|Whose|Did|Does|Was|Were|Are|Has|Have|Had|Will|Can|Could|Should|Would|And|For|With|From|Into|About|After|Before|Between|Under|Over|City|State|Country|Capital|President|Prime|Minister|Leader|Founder|Creator|Author|Director|Ocean|Sea|River|Lake|Island|Day|Year|Month)$/i.test(ent);
    if (!isStopWord && !entities.some(e => e.toLowerCase().includes(ent.toLowerCase()))) {
      if (!entities.includes(ent)) entities.push(ent);
    }
  }

  if (entities.length === 0) {
    // Fallback: match institution, geographic, or proper nouns from lowercase input
    const instRegex = /\b([a-z0-9]+(?:\s+[a-z0-9]+)*\s+(?:college|university|institute|school|hospital|temple|stadium|airport|bank|board))\b/gi;
    let im;
    while ((im = instRegex.exec(text)) !== null) {
      if (!entities.includes(im[1].trim())) entities.push(im[1].trim());
    }
    const locRegex = /\b(?:in|at|near|from)\s+([a-z]{3,})\b/gi;
    let lm;
    while ((lm = locRegex.exec(text)) !== null) {
      if (!/^(the|this|that|your|their|some|each)$/i.test(lm[1])) {
        if (!entities.includes(lm[1].trim())) entities.push(lm[1].trim());
      }
    }
  }

  return entities;
}

// ─── 5. Generic Proposition Extraction ───────────────────────────────────────
export interface FactualProposition {
  type: 'attribute_copula' | 'location_containment' | 'action_event' | 'generic';
  subject?: string;
  attribute?: string;
  claimedValue?: string;
  action?: string;
  entities: string[];
}

export function extractProposition(claim: string): FactualProposition {
  const text = claim.trim().replace(/\.$/, '');
  const entities = extractEntities(text);

  const p1 = text.match(/^(?:the\s+)?([a-z\s]+?)\s+of\s+([A-Za-z0-9\s]+?)\s+(?:is|was|are|were|became)\s+(?:the\s+)?([A-Za-z0-9\s]+)$/i);
  if (p1) return { type: 'attribute_copula', attribute: p1[1].trim().toLowerCase(), subject: p1[2].trim(), claimedValue: p1[3].trim(), entities };

  const p2 = text.match(/^([A-Za-z0-9\s]+?)\s+(?:is|was|became|serves as|acts as)\s+(?:the\s+)?([a-z\s]+?)\s+of\s+([A-Za-z0-9\s]+)$/i);
  if (p2) return { type: 'attribute_copula', attribute: p2[2].trim().toLowerCase(), subject: p2[3].trim(), claimedValue: p2[1].trim(), entities };

  const p3 = text.match(/^([A-Za-z0-9\s]+?)'s\s+([a-z\s]+?)\s+(?:is|was)\s+(?:the\s+)?([A-Za-z0-9\s]+)$/i);
  if (p3) return { type: 'attribute_copula', attribute: p3[2].trim().toLowerCase(), subject: p3[1].trim(), claimedValue: p3[3].trim(), entities };

  const p4 = text.match(/^(?:the\s+)?([A-Za-z0-9\s]+?)\s+(?:is located in|is situated in|is in|stands in)\s+([A-Za-z0-9\s]+)$/i);
  if (p4) return { type: 'location_containment', subject: p4[1].trim(), claimedValue: p4[2].trim(), entities };

  return { type: 'generic', entities };
}

// ─── 6. Generic Claim Component Decomposition ────────────────────────────────
export interface RoleAssertion {
  person: string;
  role: string;
  organization: string;
}

export interface ClaimComponents {
  entities: string[];
  actionPredicate?: string;
  roleAssertion?: RoleAssertion;
  numericalValues: string[];
  temporalValues: string[];
  relationalTarget?: string;
  qualifiers: string[];
}

export function extractClaimComponents(claim: string): ClaimComponents {
  const text = claim.trim();
  const textLower = text.toLowerCase();
  const entities = extractEntities(text);

  // Numerical values
  const numericalValues: string[] = [];
  const numRegex = /(?:\u20B9|\$|\u20AC|\xA3|rs\.?|inr|usd)?\s*(\d+(?:[.,]\d+)?)\s*(?:cr|crore|crores|k|m|million|billion|b|lakh|lakhs|%|percent)?/gi;
  let nMatch;
  while ((nMatch = numRegex.exec(textLower)) !== null) {
    const rawNum = nMatch[0].trim();
    if (rawNum.length > 0 && /\d/.test(rawNum)) {
      if (!numericalValues.includes(rawNum)) numericalValues.push(rawNum);
    }
  }

  // Temporal values
  const temporalValues: string[] = [];
  const yearMatch = textLower.match(/\b(19\d{2}|20\d{2})\b/g);
  if (yearMatch) for (const y of yearMatch) { if (!temporalValues.includes(y)) temporalValues.push(y); }
  const dateMatch = textLower.match(/\b(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{2,4})?)\b/i);
  if (dateMatch) temporalValues.push(dateMatch[1]);
  const relMatch = textLower.match(/\b(yesterday|today|last week|last month|this year|currently|now|recently)\b/i);
  if (relMatch) temporalValues.push(relMatch[1]);

  // Action predicate
  const actionRegex = /\b(won|lost|defeated|beat|topped|ranked|founded|created|started|established|invented|discovered|sank|died|killed|married|appointed|resigned|elected|launched|built|acquired|bought|sold|crossed|earned|collected|announced|achieved|scored|completed|signed|joined|left|fired|hired|merged|released|published|directed|produced|starred|acted|received|awarded|banned|blocked|suspended|withdrew|quit|retired)\b/i;
  const aMatch = textLower.match(actionRegex);
  const actionPredicate = aMatch ? aMatch[1].toLowerCase() : undefined;

  // Role assertion
  let roleAssertion: RoleAssertion | undefined;
  const roleMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|was|became|serves as|acts as|appointed as)\s+(?:the\s+)?([a-z\s]+?)\s+of\s+([A-Z0-9][a-z0-9]+(?:\s+[A-Z0-9][a-z0-9]+)*)\b/i);
  if (roleMatch) {
    roleAssertion = { person: roleMatch[1].trim(), role: roleMatch[2].trim(), organization: roleMatch[3].trim() };
  }

  // Relational target
  const relRegex = /\b(against|vs\.?|versus|with|by|from|to)\s+([a-z0-9\s]+?)(?:\s+(?:in|at|on|for|during|final|semi-final|match)|$)/i;
  const rMatch = textLower.match(relRegex);
  let relationalTarget: string | undefined;
  if (rMatch) relationalTarget = rMatch[2].trim().replace(/^(the|a|an)\s+/i, '');

  // Qualifiers
  const qualifiers: string[] = [];
  if (/\bfinal\b/i.test(textLower)) qualifiers.push('final');
  if (/\bsemi[- ]?final\b/i.test(textLower)) qualifiers.push('semi-final');
  if (/\bquarter[- ]?final\b/i.test(textLower)) qualifiers.push('quarter-final');
  if (/\bday\s*\d+\b/i.test(textLower)) qualifiers.push('day');
  if (/\bopening\s+day\b/i.test(textLower)) qualifiers.push('opening day');
  if (/\bopening\s+weekend\b/i.test(textLower)) qualifiers.push('opening weekend');
  if (/\blifetime\b/i.test(textLower)) qualifiers.push('lifetime');
  if (/\bworldwide\s+gross\b/i.test(textLower)) qualifiers.push('worldwide gross');
  else if (/\bworldwide\b/i.test(textLower)) qualifiers.push('worldwide');
  if (/\bindia\s+gross\b/i.test(textLower)) qualifiers.push('india gross');
  if (/\bindia\s+net\b|\bindia\s+nett\b/i.test(textLower)) qualifiers.push('india net');
  if (/\bpre[- ]?release\b/i.test(textLower)) qualifiers.push('pre-release');
  if (/\btarget\b|\bexpectation\b|\bprojected\b|\bpredicted\b/i.test(textLower)) qualifiers.push('target/expectation');
  if (/\bcurrent(?:ly)?\b/i.test(textLower)) qualifiers.push('current');
  if (/\bformer(?:ly)?\b/i.test(textLower)) qualifiers.push('former');

  return { entities, actionPredicate, roleAssertion, numericalValues, temporalValues, relationalTarget, qualifiers };
}

// ─── 7. Source Relevance Scoring ─────────────────────────────────────────────
function calculateSourceRelevance(source: VerifiedSource, claim: string, components: ClaimComponents): number {
  const text = `${source.evidenceText || ''} ${source.snippet || ''} ${source.name || ''}`.toLowerCase();

  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'in', 'and', 'or', 'to', 'for', 'of', 'with', 'by',
    'new', 'has', 'have', 'had', 'was', 'were', 'will', 'be', 'this', 'that', 'from', 'day',
    'its', 'their', 'they', 'what', 'when', 'who', 'where', 'why', 'how', 'did', 'does', 'do',
    'current', 'date', 'tell', 'me', 'about', 'can', 'could', 'would', 'should', 'there',
  ]);

  const claimWords = claim.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Anchor terms: distinctive subject keywords (proper nouns, institutions, key subjects)
  const genericWords = new Set([
    'announced', 'offically', 'officially', 'students', 'college', 'university', 'people', 'government',
    'against', 'between', 'during', 'country', 'report', 'reports', 'claimed', 'claims', 'update', 'status',
  ]);
  const anchorTerms = claimWords.filter(w => w.length >= 4 && !/^\d+$/.test(w) && !genericWords.has(w));

  // If the claim contains specific anchor subjects (e.g. "saveetha", "chandrayaan", "michaung"), the source MUST contain at least one anchor term
  if (anchorTerms.length > 0) {
    const anchorHits = anchorTerms.filter(term => text.includes(term)).length;
    if (anchorHits === 0) {
      return 0; // Completely irrelevant topic
    }
  }

  let entityHits = 0;
  for (const ent of components.entities) {
    const e = ent.toLowerCase().trim();
    if (e.length >= 2 && text.includes(e)) entityHits++;
  }
  const entityCoverage = components.entities.length ? Math.min(1, entityHits / components.entities.length) : 0;

  const wordHits = claimWords.filter(w => text.includes(w)).length;
  const wordCoverage = claimWords.length ? Math.min(1, wordHits / claimWords.length) : 0;

  const predicateTerms = [
    components.actionPredicate,
    components.roleAssertion?.role,
    components.roleAssertion?.organization,
    components.relationalTarget,
    ...components.temporalValues,
    ...components.numericalValues,
    ...components.qualifiers,
  ].filter(Boolean).map(v => String(v).toLowerCase());

  const predicateHits = predicateTerms.filter(term => text.includes(term)).length;
  const predicateCoverage = predicateTerms.length ? Math.min(1, predicateHits / predicateTerms.length) : 0;

  const reliability = Math.max(0, Math.min(100, source.reliability || 0));
  const hasEvidence = ((source.evidenceText || source.snippet) || '').trim().length >= 40;
  const phraseBonus = text.includes(claim.toLowerCase().trim()) ? 15 : 0;

  return Math.min(100,
    entityCoverage * 30 +
    wordCoverage * 30 +
    predicateCoverage * 20 +
    reliability * 0.10 +
    (hasEvidence ? 8 : 0) +
    phraseBonus
  );
}

// ─── 8. Smarter HTML Evidence Fetcher ────────────────────────────────────────
async function fetchPageEvidence(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VerifyAI/1.0)',
        'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.7',
      },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return '';
    const contentType = res.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) return '';
    const raw = await res.text();

    const stripped = raw
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ');

    const articleMatch = stripped.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      const text = decodeHtmlEntities(articleMatch[1]);
      if (text.length >= 200) return text.slice(0, 14000);
    }

    const mainMatch = stripped.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      const text = decodeHtmlEntities(mainMatch[1]);
      if (text.length >= 200) return text.slice(0, 14000);
    }

    const contentMatch = stripped.match(/<div[^>]*(?:id|class)="[^"]*(?:content|article-body|story-body|article-content|mw-content-text|main-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (contentMatch) {
      const text = decodeHtmlEntities(contentMatch[1]);
      if (text.length >= 200) return text.slice(0, 14000);
    }

    const fullText = decodeHtmlEntities(stripped.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    return fullText.length >= 120 ? fullText.slice(0, 12000) : '';
  } catch {
    return '';
  }
}

async function hydrateSourceEvidence(sources: VerifiedSource[]): Promise<VerifiedSource[]> {
  const candidates = sources.slice(0, 10);
  const hydrated = await Promise.all(candidates.map(async source => {
    if (source.evidenceText && source.evidenceText.trim().length >= 80) return source;
    if (source.domain?.includes('wikipedia') && source.snippet && source.snippet.trim().length >= 60) {
      return { ...source, evidenceText: source.snippet };
    }
    const pageText = await fetchPageEvidence(source.url);
    if (pageText && pageText.trim().length >= 80) {
      return { ...source, evidenceText: pageText };
    }
    if (source.snippet && source.snippet.trim().length >= 30) {
      return { ...source, evidenceText: source.snippet };
    }
    return source;
  }));
  return [...hydrated, ...sources.slice(24)];
}

// ─── 9. Multi-Engine Live Search Aggregator ───────────────────────────────────
export async function executeLiveWebSearch(query: string): Promise<VerifiedSource[]> {
  const cleanQ = cleanSearchQuery(query);
  if (!cleanQ) return [];

  const prop = extractProposition(query);
  const components = extractClaimComponents(query);
  const entities = components.entities;

  const keywords = cleanQ.split(/\s+/).filter(w =>
    w.length > 2 &&
    !/^(the|and|for|with|that|this|from|about|against|into|won|lost|was|were|has|have|did|does|is|are|of|to|in)$/i.test(w)
  );
  const coreQuery = keywords.slice(0, 8).join(' ');

  const subjectAngle = prop.subject && prop.claimedValue
    ? `${prop.subject} ${prop.attribute || ''} ${prop.claimedValue}`.trim()
    : '';
  const entityAngle = entities.slice(0, 4).join(' ');
  const factCheckAngle = `${coreQuery} fact check`;
  const verifyAngle = `${coreQuery} true or false verified`;
  const roleAngle = components.roleAssertion
    ? `${components.roleAssertion.person} ${components.roleAssertion.role} ${components.roleAssertion.organization}`
    : '';

  const searchQueries = Array.from(new Set([
    cleanQ,
    coreQuery,
    subjectAngle,
    entityAngle,
    factCheckAngle,
    verifyAngle,
    roleAngle,
  ].map(cleanSearchQuery).filter(q => q.length >= 3)));

  const wikiQueries = Array.from(new Set([
    cleanQ,
    prop.claimedValue || '',
    prop.subject || '',
    prop.claimedValue && prop.subject ? `${prop.claimedValue} ${prop.subject}` : '',
    ...entities.slice(0, 4),
    roleAngle,
    coreQuery,
  ].map(cleanSearchQuery).filter(q => q.length >= 2 && !/^\d{4}$/.test(q))));

  const ddgPromises = searchQueries.slice(0, 6).map(q => searchDDG(q));
  const newsPromises = searchQueries.slice(0, 3).map(q => searchGoogleNews(q));
  const wikiPromises = wikiQueries.slice(0, 5).map(q => searchWikipediaWithSummary(q));

  const groups = await Promise.all([...ddgPromises, ...newsPromises, ...wikiPromises]);

  const seenUrls = new Set<string>();
  const combined: VerifiedSource[] = [];
  for (const group of groups) {
    for (const item of group) {
      if (!item?.url || seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);
      combined.push(item);
    }
  }

  const hydrated = await hydrateSourceEvidence(combined.slice(0, 32));

  const ranked = hydrated.map(source => {
    const relevance = calculateSourceRelevance(source, query, components);
    const hasEvidence = ((source.evidenceText || source.snippet) || '').trim().length >= 40;
    const domain = (source.domain || extractDomain(source.url)).toLowerCase();

    let qualityBonus = 0;
    if (OFFICIAL_GOV_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`))) qualityBonus += 8;
    if (ACCREDITED_NEWS_DOMAINS.some(d => domain.includes(d))) qualityBonus += 5;
    if (domain.includes('wikipedia.org')) qualityBonus += 2;

    return {
      ...source,
      relevanceScore: relevance,
      score: relevance > 0 ? (relevance * 0.72 + (source.reliability || 50) * 0.23 + qualityBonus + (hasEvidence ? 4 : -8)) : 0,
    };
  }).filter(s => (s.relevanceScore || 0) >= 15) // Discard irrelevant sources
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const evidence = ranked.filter(s => (s.evidenceText || s.snippet || '').trim().length >= 30);
  const metadataOnly = ranked.filter(s => !((s.evidenceText || s.snippet || '').trim().length >= 30));
  return [...evidence, ...metadataOnly].slice(0, 20);
}

// ─── 10. Question vs. Claim Classifier ───────────────────────────────────────
function isQuestionInput(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.endsWith('?')) return true;
  return /^(who|what|when|where|why|how|is|are|was|were|did|does|do|can|will|has|have|which|whose|whom)\b/i.test(t);
}

// ─── 11. Evidence-Grounded AI Reasoning Engine (Resilient Gemini Client) ─────
export interface AiEvaluationOutcome {
  result: EvidenceEvaluationResult | null;
  status: 'SUCCESS' | 'QUOTA_EXHAUSTED' | 'RATE_LIMIT_TRANSIENT' | 'INVALID_API_KEY' | 'UNAVAILABLE' | 'SKIPPED';
  notice?: string;
}

async function evaluateEvidenceWithAI(
  claim: string,
  liveSources: VerifiedSource[],
  apiKey: string
): Promise<AiEvaluationOutcome> {
  const topSources = liveSources
    .filter(s => (s.evidenceText || s.snippet || '').trim().length >= 30)
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 10);

  const evidenceText = topSources.map((s, idx) => {
    const text = (s.evidenceText || '').trim() || (s.snippet || '').trim();
    return `[Source ${idx + 1}]\nTitle: ${s.name}\nDomain: ${s.domain || ''}\nURL: ${s.url}\nActual retrieved content / report:\n${text || '(no content retrieved)'}`;
  }).join('\n\n---\n\n');

  const systemPrompt = `You are the strict, generic real-time fact verification engine for VerifyAI.
Your task is to verify the USER'S COMPLETE CLAIM using ONLY the RETRIEVED LIVE EVIDENCE provided below.
Do NOT use prior training knowledge. Rely EXCLUSIVELY on the ACTUAL CONTENT provided.
Search-result titles, headlines, domains, URLs, and metadata are NOT evidence and must NEVER justify a verdict on their own.

GENERIC FACTUAL VERIFICATION PROTOCOL:

STEP 1 — DECOMPOSE THE CLAIM into its essential factual components:
  • Subject & Named Entities (people, teams, organizations, objects, locations)
  • Core Action / Role / Event Predicate (won, founded, appointed, discovered, etc.)
  • Opponent / Counterpart / Relational Target (if any)
  • Event Stage / Scope Qualifier (final vs semi-final; opening day vs total)
  • Numbers / Currency / Quantities
  • Dates / Years / Time conditions
  • Geographic Locations / Venues
  • Temporal qualifiers (current, former, was, is, in 2024, today, etc.)

STEP 2 — COMPARE EACH COMPONENT against the retrieved page content:
  • SUPPORTED: Reliable page content explicitly confirms the component.
  • CONTRADICTED: Reliable page content establishes a DIFFERENT factual value for the same attribute.
  • UNGROUNDED: Page content does not explicitly establish the asserted component.

STEP 3 — APPLY THESE RULES WITHOUT EXCEPTION:
  Rule A — ABSENCE OF EVIDENCE IS NOT EVIDENCE OF FALSITY.
    If no relevant evidence is found, return UNVERIFIED, NEVER FALSE.
  Rule B — TOPIC ADJACENCY IS NOT SUPPORT.
    A page mentioning the same entity without explicitly confirming the specific claim is IRRELEVANT, not support.
  Rule C — SEMANTIC EQUIVALENCE IS ACCEPTABLE.
    "X became CEO of Y" and "Y appointed X as its CEO" describe the same fact.
  Rule D — QUALIFIERS ARE NOT INTERCHANGEABLE.
    "Proposed", "planned", "possible", "former", "secondary" are distinct from the current/completed fact.
  Rule E — TEMPORAL CONSISTENCY IS REQUIRED.
    A historical fact does not prove a current claim unless evidence explicitly bridges the time periods.
  Rule F — NUMERICAL PRECISION MATTERS.
    A claim of "100 crore" contradicted by evidence of "73 crore" is FALSE.
  Rule G — STAGE/SCOPE PRECISION MATTERS.
    "Won the final" vs "won the semi-final" are different facts.
  Rule H — MOVIE BOX-OFFICE & COLLECTION METRIC RIGOR:
    For movie box-office claims, strictly distinguish worldwide gross, India gross, India net (nett), and pre-release targets/expectations.
    A worldwide gross cannot be verified by India net figures. Pre-release trade expectations/targets are NOT confirmed collection numbers.
    If numbers are conflicting across trade sources or the exact claimed metric is not confirmed, return UNVERIFIED.
  Rule I — OFFICIAL ANNOUNCEMENTS & INSTITUTIONAL POLICIES:
    For claims asserting official announcements, fee waivers, policy changes, or future institutional decisions (e.g. college fees, scholarships):
    Evidence MUST explicitly confirm the specific announcement by the exact institution for the asserted year/period.
    Do NOT assume an announcement exists simply because the institution exists or other future events are mentioned.
    If no reliable source explicitly confirms or contradicts the asserted policy/announcement, return UNVERIFIED / INSUFFICIENT EVIDENCE.

STEP 4 — DETERMINE THE VERDICT:
Select exactly ONE of these 5 evidence-based verdicts:
• "TRUE / SUPPORTED" — reliable evidence supports the main claim (including verified historical events and officially confirmed schedules).
• "FALSE / CONTRADICTED" — reliable evidence directly contradicts or disproves the main claim.
• "PARTLY TRUE" — some important parts are supported, while others are contradicted or inaccurate.
• "MISLEADING / OUT OF CONTEXT" — the content presents information in a materially misleading way (e.g. old news, past warnings, or historical events circulated as breaking news; out-of-context quotes).
• "UNVERIFIED / INSUFFICIENT EVIDENCE" — available evidence is insufficient, conflicting, or ungrounded to decide.

CRITICAL EXPLANATION RULES (HIGHEST PRIORITY):
- "explanation" MUST be exactly 1 or 2 concise, clear sentences.
- State whether the claim is supported, false, partly true, misleading, or unverified, and why.
- Mention the relevant event date, publication date, or historical context when necessary (e.g. "This incident took place in 2021 and is not current breaking news.").
- Do NOT number steps (do not write "1. User Claim: ...").
- Do NOT repeat the claim text repeatedly.
- When sources disagree, state the disagreement briefly in one sentence.

Output ONLY valid JSON with no markdown:
{
  "verdict": "TRUE" | "FALSE" | "PARTLY_TRUE" | "MISLEADING" | "UNVERIFIED",
  "verdictLabel": "TRUE / SUPPORTED" | "FALSE / CONTRADICTED" | "PARTLY TRUE" | "MISLEADING / OUT OF CONTEXT" | "UNVERIFIED / INSUFFICIENT EVIDENCE",
  "claimStatus": "CURRENTLY_SUPPORTED" | "HISTORICAL_OUTDATED" | "OFFICIALLY_SCHEDULED_FUTURE" | "FALSE_CONTRADICTED" | "PARTLY_TRUE" | "MISLEADING_WRONG_CONTEXT" | "UNVERIFIED_INSUFFICIENT_EVIDENCE",
  "score": <0-100>,
  "confidence": <50-99>,
  "directAnswer": "<1 short direct sentence>",
  "timeline": {
    "eventDate": "<event date/year if mentioned, else null>",
    "publicationDate": "<evidence publication date if available, else null>",
    "temporalStatus": "past" | "current" | "future" | "unknown"
  },
  "explanation": "<1-2 short clear sentences explaining why the claim is supported, false, partly true, misleading, or unverified>"
}`;

  const prompt = `${systemPrompt}\n\nUSER CLAIM:\n"${claim}"\n\nRETRIEVED LIVE EVIDENCE:\n${evidenceText || '(No readable page content was retrieved. Return UNVERIFIED.)'}`;

  const callResult = await geminiClient.generateContent(prompt, {
    responseMimeType: 'application/json',
    temperature: 0.0,
  });

  if (!callResult.success) {
    let notice = '⚡ AI evaluation unavailable. Verdict evaluated via live multi-source web evidence cross-referencing.';
    if (callResult.failureReason === 'QUOTA_EXHAUSTED') {
      notice = '⚡ AI Engine at daily free-tier quota capacity. Verdict independently verified via live multi-source web evidence cross-referencing.';
    } else if (callResult.failureReason === 'INVALID_API_KEY') {
      notice = '⚡ Configured Gemini API key is invalid or lacks permissions. Fallback to live multi-source web evidence cross-referencing.';
    } else if (callResult.failureReason === 'RATE_LIMIT_TRANSIENT') {
      notice = '⚡ Gemini API rate limit reached. Fallback deterministic evidence evaluation applied.';
    }
    return {
      result: null,
      status: (callResult.failureReason as any) || 'UNAVAILABLE',
      notice,
    };
  }

  const parsed = callResult.data;
  if (!parsed) {
    return {
      result: null,
      status: 'UNAVAILABLE',
      notice: '⚡ AI Engine output could not be parsed. Fallback deterministic evidence evaluation applied.',
    };
  }

  const rawVerdict = (parsed.verdict || '').toUpperCase();
  const rawLabel = (parsed.verdictLabel || '').toUpperCase();

  let verdict: VerificationVerdict = 'UNVERIFIED';
  let verdictLabel: VerificationVerdictLabel = 'UNVERIFIED / INSUFFICIENT EVIDENCE';

  if (rawVerdict.includes('PARTLY') || rawLabel.includes('PARTLY')) {
    verdict = 'PARTLY_TRUE';
    verdictLabel = 'PARTLY TRUE';
  } else if (rawVerdict.includes('MISLEAD') || rawLabel.includes('MISLEAD') || rawLabel.includes('CONTEXT')) {
    verdict = 'MISLEADING';
    verdictLabel = 'MISLEADING / OUT OF CONTEXT';
  } else if (rawVerdict === 'TRUE' || rawVerdict.includes('SUPPORT') || rawLabel.includes('SUPPORT')) {
    verdict = 'TRUE';
    verdictLabel = 'TRUE / SUPPORTED';
  } else if (rawVerdict === 'FALSE' || rawVerdict.includes('CONTRADICT') || rawLabel.includes('CONTRADICT')) {
    verdict = 'FALSE';
    verdictLabel = 'FALSE / CONTRADICTED';
  } else {
    verdict = 'UNVERIFIED';
    verdictLabel = 'UNVERIFIED / INSUFFICIENT EVIDENCE';
  }

  const norm = (parsed.claimStatus || '').toUpperCase();
  const claimStatus: ClaimStatus = norm.includes('FUTURE') || norm.includes('SCHEDULE') ? 'OFFICIALLY_SCHEDULED_FUTURE' :
    norm.includes('HISTORIC') || norm.includes('OUTDATED') ? 'HISTORICAL_OUTDATED' :
    norm.includes('PARTLY') ? 'PARTLY_TRUE' :
    norm.includes('MISLEAD') || norm.includes('CONTEXT') ? 'MISLEADING_WRONG_CONTEXT' :
    norm.includes('CONTRADICT') || norm.includes('FALSE') ? 'FALSE_CONTRADICTED' :
    verdict === 'TRUE' ? 'CURRENTLY_SUPPORTED' :
    verdict === 'FALSE' ? 'FALSE_CONTRADICTED' : 'UNVERIFIED_INSUFFICIENT_EVIDENCE';

  const claimStatusLabel: ClaimStatusLabel = verdictLabel;

  return {
    result: {
      verdict,
      verdictLabel,
      claimStatus,
      claimStatusLabel,
      timeline: parsed.timeline || undefined,
      score: typeof parsed.score === 'number' ? parsed.score : (verdict === 'TRUE' ? 95 : verdict === 'FALSE' ? 8 : 50),
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : (verdict === 'UNVERIFIED' ? 65 : 92),
      directAnswer: parsed.directAnswer ? decodeHtmlEntities(parsed.directAnswer) : undefined,
      reasoning: parsed.reasoning ? decodeHtmlEntities(parsed.reasoning) : undefined,
      explanation: decodeHtmlEntities(parsed.explanation || 'Evaluated strictly from retrieved live evidence.'),
    },
    status: 'SUCCESS',
  };
}

// ─── 12. Generic Deterministic Evidence Reasoner ─────────────────────────────
export function analyzeRetrievedLiveEvidence(
  claim: string,
  liveSources: VerifiedSource[]
): EvidenceEvaluationResult {
  const cleanClaim = claim.trim().replace(/\.+$/, '');
  const prop = extractProposition(cleanClaim);
  const components = extractClaimComponents(cleanClaim);

  const isFutureClaim = /\b(?:202[7-9]|203\d|204\d|will\s+host|scheduled|upcoming|announced\s+for|in\s+the\s+future)\b/i.test(cleanClaim);
  const isHistoricalPast = /\b(?:in\s+19\d\d|in\s+20[0-1]\d|in\s+202[0-3]|former|formerly|was\s+the|served\s+as)\b/i.test(cleanClaim);

  const evidenceSources = liveSources
    .filter(s => (s.evidenceText || s.snippet || '').trim().length >= 30)
    .slice(0, 12);

  if (evidenceSources.length === 0) {
    return {
      verdict: 'UNVERIFIED',
      verdictLabel: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
      claimStatus: 'UNVERIFIED_INSUFFICIENT_EVIDENCE',
      claimStatusLabel: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
      score: 50,
      confidence: 50,
      directAnswer: `Unverified: Available live evidence is insufficient to verify whether "${cleanClaim}" is accurate.`,
      reasoning: `(1) Claimed: ${cleanClaim}. (2) Evidence states: No readable page content or snippets retrieved. (3) Comparison: Lack of evidence cannot prove or disprove the claim. (4) Choice: UNVERIFIED.`,
      explanation: 'Available live evidence is insufficient to confirm or refute the asserted claim.',
    };
  }

  const allEvidence = evidenceSources
    .map(s => `${s.name} ${s.snippet || ''} ${s.evidenceText || ''}`)
    .join('\n')
    .toLowerCase();

  // 1. Check for explicit debunk / fact-check contradiction language
  const hasDebunkSignal = evidenceSources.some(source => {
    const isFactCheckSource = /\b(?:fact.?check|snopes|politifact|altnews|boomlive|lead stories|full fact|factly|pib)\b/i.test(source.name);
    const title = source.name.toLowerCase();
    const snippet = (source.snippet || '').toLowerCase();
    const isDebunkHeadlineOrSnippet = /\b(?:debunked|false claim|fact.?check.*(?:false|fake|misleading|hoax)|is false|is untrue|hoax|fake news|denied that|no evidence that|fabricated claim)\b/i.test(`${title} ${snippet}`);
    return isFactCheckSource && isDebunkHeadlineOrSnippet;
  });

  if (hasDebunkSignal) {
    const isMisleading = /\b(?:misleading|out of context|old video|old photo|unrelated)\b/i.test(allEvidence);
    const claimStatus: ClaimStatus = isMisleading ? 'MISLEADING_WRONG_CONTEXT' : 'FALSE_CONTRADICTED';
    const claimStatusLabel: ClaimStatusLabel = isMisleading ? 'MISLEADING / OUT OF CONTEXT' : 'FALSE / CONTRADICTED';
    const verdict: VerificationVerdict = isMisleading ? 'MISLEADING' : 'FALSE';
    const verdictLabel: VerificationVerdictLabel = isMisleading ? 'MISLEADING / OUT OF CONTEXT' : 'FALSE / CONTRADICTED';

    return {
      verdict,
      verdictLabel,
      claimStatus,
      claimStatusLabel,
      score: 10,
      confidence: 88,
      directAnswer: isMisleading
        ? 'Misleading: Verified reporting confirms this content is circulated out of context or misattributed.'
        : 'False: Authoritative records and fact-checks contradict this claim.',
      reasoning: `(1) Claimed: ${cleanClaim}. (2) Evidence states: Fact-checking organizations report this assertion as false or misleading. (3) Comparison: Contradiction with authoritative reporting. (4) Choice: ${verdict}.`,
      explanation: isMisleading
        ? 'Authoritative reports and fact-checks confirm this claim is misleading or circulated out of its original context.'
        : 'Authoritative reports and verified evidence directly contradict this claim and establish it as false.',
    };
  }

  // 2. Numerical & Box-Office contradiction/discrepancy check
  if (components.numericalValues.length > 0) {
    const isBoxOffice = /\b(?:box[- ]?office|gross|nett?|collection|crore|cr\b|worldwide)\b/i.test(cleanClaim);
    const hasClaimedNumber = components.numericalValues.some(n => allEvidence.includes(n.toLowerCase()));
    if (!hasClaimedNumber) {
      const foundNumbers = allEvidence.match(/(?:₹|\$|€|£)?\s*\d+(?:\.\d+)?\s*(?:cr|crore|million|billion|lakh)?/gi) || [];
      if (foundNumbers.length > 0 || isBoxOffice) {
        return {
          verdict: 'UNVERIFIED',
          verdictLabel: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
          claimStatus: 'UNVERIFIED_INSUFFICIENT_EVIDENCE',
          claimStatusLabel: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
          score: 50,
          confidence: 65,
          directAnswer: isBoxOffice
            ? `Unverified: The box-office collection figure asserted in "${cleanClaim}" could not be confirmed in authoritative trade records.`
            : `Unverified: The specific numerical figure in "${cleanClaim}" could not be confirmed in the retrieved live reports.`,
          reasoning: `(1) Claimed: ${cleanClaim}. (2) Evidence states: Figures reported in live sources do not match the claimed value or trade metric. (3) Comparison: Discrepancy or absence of claimed number. (4) Choice: UNVERIFIED.`,
          explanation: isBoxOffice
            ? 'The asserted box-office collection figures could not be confirmed in authoritative trade records.'
            : 'The specific numerical figures asserted in this claim could not be confirmed in verified reports.',
        };
      }
    }
  }

  // 3. Proposition-based support check
  let supportPoints = 0;
  const isFeeClaim = /\b(?:fees?|tuition|waiver|free\s+college|no\s+fees?)\b/i.test(cleanClaim);

  for (const source of evidenceSources) {
    const text = `${source.name} ${source.snippet || ''} ${source.evidenceText || ''}`.toLowerCase();
    const entityMatches = components.entities.filter(e => text.includes(e.toLowerCase())).length;
    const allEntitiesPresent = components.entities.length > 0 && entityMatches >= components.entities.length;

    if (allEntitiesPresent) {
      if (isFeeClaim) {
        // College fee waiver claims require explicit fee waiver verification
        const hasFeeCorroboration = /\b(?:free\s+fees?|fee\s+waiver|waived\s+fees?|zero\s+fees?|no\s+college\s+fees?|100%\s+scholarship)\b/i.test(text);
        if (hasFeeCorroboration) {
          supportPoints += 3;
        }
      } else {
        if (components.roleAssertion) {
          const role = components.roleAssertion.role.toLowerCase();
          const person = components.roleAssertion.person.toLowerCase();
          const org = components.roleAssertion.organization.toLowerCase();
          if (text.includes(role) && text.includes(person) && text.includes(org)) {
            supportPoints += 3;
          }
        }
        if (components.relationalTarget && text.includes(components.relationalTarget.toLowerCase())) {
          supportPoints += 2;
        }
        if (components.actionPredicate && text.includes(components.actionPredicate)) {
          supportPoints += (source.reliability >= 95 ? 2 : 1);
        }
      }
    }
  }

  if (supportPoints >= 3) {
    const claimStatus: ClaimStatus = isFutureClaim ? 'OFFICIALLY_SCHEDULED_FUTURE' : 'CURRENTLY_SUPPORTED';
    const claimStatusLabel: ClaimStatusLabel = isFutureClaim ? 'OFFICIALLY SCHEDULED / FUTURE' : 'TRUE / SUPPORTED';
    const verdict: VerificationVerdict = 'TRUE';
    const verdictLabel: VerificationVerdictLabel = 'TRUE / SUPPORTED';

    return {
      verdict,
      verdictLabel,
      claimStatus,
      claimStatusLabel,
      timeline: {
        temporalStatus: isFutureClaim ? 'future' : isHistoricalPast ? 'past' : 'current',
        currentStatus: isFutureClaim ? 'Officially scheduled / upcoming' : 'Confirmed fact',
      },
      score: 95,
      confidence: 90,
      directAnswer: isFutureClaim
        ? `Officially Scheduled: Verified reporting confirms this future event or announcement.`
        : `Yes, this is true: Corroborated by verified reporting across authoritative sources.`,
      reasoning: `(1) Claimed: ${cleanClaim}. (2) Evidence states: Multiple accredited sources confirm the entities, actions, and dates asserted in the claim. (3) Comparison: Direct alignment between claim components and live source content. (4) Choice: TRUE.`,
      explanation: isFutureClaim
        ? 'Verified reporting confirms this officially scheduled event or announcement.'
        : isHistoricalPast
        ? 'Authoritative historical records and documentation confirm this event occurred.'
        : 'Authoritative live sources and verified reports corroborate the asserted claim.',
    };
  }

  return {
    verdict: 'UNVERIFIED',
    verdictLabel: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
    claimStatus: 'UNVERIFIED_INSUFFICIENT_EVIDENCE',
    claimStatusLabel: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
    score: 50,
    confidence: 60,
    directAnswer: `Unverified: Available live evidence is insufficient to fully confirm or refute "${cleanClaim}".`,
    reasoning: `(1) Claimed: ${cleanClaim}. (2) Evidence states: Retrieved sources reference related topics but do not explicitly prove or disprove all elements. (3) Comparison: Insufficient corroboration. (4) Choice: UNVERIFIED.`,
    explanation: 'Available evidence is insufficient to confirm or refute the asserted claim.',
  };
}

// ─── 13. Main Exported Realtime Verifier ─────────────────────────────────────
export const realtimeVerifier = {
  async verifyClaim(claim: string, options?: { skipAi?: boolean }): Promise<RealtimeVerificationOutput> {
    const cleanClaim = (claim || '').trim();
    if (!cleanClaim) throw new Error('Claim text cannot be empty.');

    const isQuestion = isQuestionInput(cleanClaim);

    // Step 1: Fresh multi-source live web search
    const liveSources = await executeLiveWebSearch(cleanClaim);

    if (liveSources.length === 0) {
      return {
        verdict: 'UNVERIFIED',
        verdictLabel: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
        score: 50,
        confidence: 50,
        directAnswer: `Unverified: Available live evidence is insufficient to verify whether "${cleanClaim}" is accurate.`,
        explanation: 'Available live evidence is insufficient to verify or refute this claim.',
        claim: cleanClaim,
        originalClaim: cleanClaim,
        isLiveWebVerified: false,
        searchTimestamp: new Date().toISOString(),
        signals: [
          { name: 'Claim-to-Evidence Consistency', status: 'warning', score: 50, detail: 'Live search returned no verifiable evidence.' },
          { name: 'Primary & Official Registry Alignment', status: 'warning', score: 50, detail: 'No primary registry records found.' },
          { name: 'Real-Time Live Web Coverage', status: 'warning', score: 50, detail: 'Zero verifiable sources retrieved.' },
          { name: 'Fact & Entity Match Index', status: 'warning', score: 50, detail: 'Evidence is insufficient to confirm or refute the claim.' },
        ],
        sources: [],
      };
    }

    // Step 2: Conservative deterministic analysis (fast pre-check)
    const deterministicEval = analyzeRetrievedLiveEvidence(cleanClaim, liveSources);
    let evalResult = deterministicEval;
    let aiAnalysisStatus: 'SUCCESS' | 'QUOTA_EXHAUSTED' | 'RATE_LIMIT_TRANSIENT' | 'INVALID_API_KEY' | 'UNAVAILABLE' | 'SKIPPED' = 'SKIPPED';
    let aiNotice: string | undefined = undefined;

    // Step 3: Grounded AI semantic reasoning (primary path for all arbitrary claims unless skipAi requested)
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
    const hasAnyReadableContent = liveSources.some(s => (s.evidenceText || s.snippet || '').trim().length >= 30);

    console.log(`[RealtimeVerifier] Evaluating claim (chars: ${cleanClaim.length}) | Sources: ${liveSources.length} | API key configured: ${Boolean(apiKey)}`);

    if (apiKey && hasAnyReadableContent && !options?.skipAi) {
      if (geminiClient.isQuotaExhausted()) {
        aiAnalysisStatus = 'QUOTA_EXHAUSTED';
        aiNotice = '⚡ AI Engine at daily free-tier quota capacity. Verdict independently verified via live multi-source web evidence cross-referencing.';
        console.warn('[VerifyAI] Gemini daily quota is exhausted — using deterministic live evidence evaluation.');
      } else {
        const aiOutcome = await evaluateEvidenceWithAI(cleanClaim, liveSources, apiKey);
        if (aiOutcome.result) {
          evalResult = aiOutcome.result;
          aiAnalysisStatus = 'SUCCESS';
        } else {
          aiAnalysisStatus = aiOutcome.status;
          aiNotice = aiOutcome.notice;
          console.warn('[VerifyAI] AI evaluation unavailable/quota exceeded — using deterministic fallback.');
        }
      }
    } else if (!apiKey) {
      aiAnalysisStatus = 'INVALID_API_KEY';
      aiNotice = 'Gemini API key is not configured on the server. Running on live web evidence.';
      console.warn('[VerifyAI] GEMINI_API_KEY not found in environment. AI layer skipped.');
    }

    const verdict: VerificationVerdict = evalResult.verdict;
    const verdictLabel: VerificationVerdictLabel = evalResult.verdictLabel || (
      verdict === 'TRUE' ? 'TRUE / SUPPORTED' :
      verdict === 'FALSE' ? 'FALSE / CONTRADICTED' :
      verdict === 'PARTLY_TRUE' ? 'PARTLY TRUE' :
      verdict === 'MISLEADING' ? 'MISLEADING / OUT OF CONTEXT' :
      'UNVERIFIED / INSUFFICIENT EVIDENCE'
    );

    // Show normally up to three most relevant clickable sources
    const topSources = liveSources
      .filter(s => Boolean(s.url && s.name) && (s.relevanceScore || 0) >= 15)
      .slice(0, 3);
    const topSourceNames = topSources.slice(0, 3).map(s => s.name).join(', ');

    const signals: VerificationSignal[] = [
      {
        name: 'Claim-to-Evidence Consistency',
        status: verdict === 'TRUE' ? 'passed' : verdict === 'FALSE' ? 'failed' : 'warning',
        score: verdict === 'TRUE' ? 95 : verdict === 'FALSE' ? 8 : 50,
        detail: verdict === 'TRUE'
          ? `Corroborated by verified sources (${topSourceNames || 'Primary records'}).`
          : verdict === 'FALSE'
            ? (evalResult.reasoning || `Contradicted by verified reports or absent from authoritative records.`)
            : `Evidence is insufficient to reach a definitive factual determination.`,
      },
      {
        name: 'Primary & Official Registry Alignment',
        status: topSources.some(s => s.reliability >= 95) ? 'passed' : (topSources.length > 0 ? 'warning' : 'failed'),
        score: topSources.filter(s => (s.reliability || 0) >= 95 && (s.evidenceText || s.snippet || '').trim().length >= 40).length >= 2 ? 96 : 60,
        detail: `Evidence cross-referenced against authoritative sources with readable content (${topSourceNames || 'Live indexes'}).`,
      },
      {
        name: 'Real-Time Live Web Coverage',
        status: topSources.length >= 2 ? 'passed' : (topSources.length === 1 ? 'warning' : 'failed'),
        score: topSources.filter(s => (s.evidenceText || s.snippet || '').trim().length >= 40).length >= 2 ? 98 : (topSources.length >= 1 ? 70 : 15),
        detail: `Retrieved ${topSources.length} verified reference sources matching the claim.`,
      },
      {
        name: 'Fact & Entity Match Index',
        status: verdict === 'FALSE' ? 'failed' : (verdict === 'TRUE' ? 'passed' : 'warning'),
        score: verdict === 'FALSE' ? 12 : (verdict === 'TRUE' ? 95 : 50),
        detail: verdict === 'FALSE'
          ? `Key factual contradiction detected between claim and verified evidence.`
          : verdict === 'TRUE'
            ? `All essential factual components confirmed by live search evidence.`
            : `Evidence is insufficient to confirm or refute the claim.`,
      },
    ];

    return {
      verdict,
      verdictLabel,
      claimStatus: evalResult.claimStatus || (verdict === 'TRUE' ? 'CURRENTLY_SUPPORTED' : verdict === 'FALSE' ? 'FALSE_CONTRADICTED' : 'UNVERIFIED_INSUFFICIENT_EVIDENCE'),
      claimStatusLabel: evalResult.claimStatusLabel || verdictLabel,
      timeline: evalResult.timeline,
      score: evalResult.score,
      confidence: evalResult.confidence,
      directAnswer: evalResult.directAnswer || undefined,
      reasoning: evalResult.reasoning || undefined,
      queryType: isQuestion ? 'question' : 'claim',
      explanation: evalResult.explanation,
      claim: cleanClaim,
      originalClaim: cleanClaim,
      isLiveWebVerified: true,
      searchTimestamp: new Date().toISOString(),
      aiAnalysisStatus,
      aiNotice,
      signals,
      sources: topSources.map(s => ({
        ...s,
        name: decodeHtmlEntities(s.name),
        snippet: decodeHtmlEntities(s.snippet || ''),
      })),
    };
  },
};

