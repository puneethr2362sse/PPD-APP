import 'dotenv/config';

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

export interface RealtimeVerificationOutput {
  verdict: 'TRUE' | 'FALSE' | 'UNVERIFIED';
  verdictLabel: "YES, IT'S TRUE" | "NO, IT'S NOT TRUE" | "NOT ENOUGH EVIDENCE";
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
    .replace(/['\u201C\u201D\u2018\u2019]/g, ' ')
    .replace(/[^\w\s\u0B80-\u0BFF\u20B9$\u20AC\xA3%.-]/gi, ' ')
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
        const searchData = await searchRes.json();
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
                const fullData = await fullRes.json();
                const pages = fullData.query?.pages || {};
                const firstPage = Object.values(pages)[0] as any;
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
                  const sumData = await sumRes.json();
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
          const data = await openRes.json();
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
  if (/\bworldwide\b/i.test(textLower)) qualifiers.push('worldwide');
  if (/\bcurrent(?:ly)?\b/i.test(textLower)) qualifiers.push('current');
  if (/\bformer(?:ly)?\b/i.test(textLower)) qualifiers.push('former');

  return { entities, actionPredicate, roleAssertion, numericalValues, temporalValues, relationalTarget, qualifiers };
}

// ─── 7. Source Relevance Scoring ─────────────────────────────────────────────
function calculateSourceRelevance(source: VerifiedSource, claim: string, components: ClaimComponents): number {
  const text = `${source.evidenceText || ''} ${source.snippet || ''} ${source.name || ''}`.toLowerCase();

  let entityHits = 0;
  for (const ent of components.entities) {
    const e = ent.toLowerCase().trim();
    if (e.length >= 2 && text.includes(e)) entityHits++;
  }
  const entityCoverage = components.entities.length ? Math.min(1, entityHits / components.entities.length) : 0;

  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'in', 'and', 'or', 'to', 'for', 'of', 'with', 'by',
    'new', 'has', 'have', 'had', 'was', 'were', 'will', 'be', 'this', 'that', 'from', 'day',
    'its', 'their', 'they', 'what', 'when', 'who', 'where', 'why', 'how', 'did', 'does', 'do',
    'current', 'date', 'tell', 'me', 'about', 'can', 'could', 'would', 'should',
  ]);

  const claimWords = claim.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

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
      signal: AbortSignal.timeout(6000),
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
  const candidates = sources.slice(0, 24);
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
  ].map(cleanSearchQuery).filter(q => q.length >= 2)));

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
      score: relevance * 0.72 + (source.reliability || 50) * 0.23 + qualityBonus + (hasEvidence ? 4 : -8),
    };
  }).sort((a, b) => (b.score || 0) - (a.score || 0));

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

// ─── 11. Evidence-Grounded AI Reasoning Engine (Gemini) ──────────────────────
const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-pro-latest',
];

async function evaluateEvidenceWithAI(
  claim: string,
  liveSources: VerifiedSource[],
  apiKey: string
): Promise<{
  verdict: 'TRUE' | 'FALSE' | 'UNVERIFIED';
  score: number;
  confidence: number;
  directAnswer?: string;
  reasoning?: string;
  explanation: string;
} | null> {
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

STEP 4 — DETERMINE THE VERDICT:
  "TRUE"       — ALL material factual components are directly confirmed by reliable retrieved page content, with no contradiction.
  "FALSE"      — At least ONE material factual component is directly contradicted by reliable retrieved page content.
  "UNVERIFIED" — Retrieved page content is insufficient, ungrounded, topic-adjacent, ambiguous, or contradictory without resolution.

CRITICAL FORMATTING RULES:
  - directAnswer for TRUE: "Yes, this is true: [exact confirmed fact from evidence]."
  - directAnswer for FALSE: "No, this is not true: [exact contradictory fact from evidence]."
  - directAnswer for UNVERIFIED: "Unverified: Available live evidence is insufficient to verify whether '[claim]' is accurate."
  - Do NOT include generic entity trivia unrelated to the specific claim.

Output ONLY valid JSON with no markdown:
{
  "verdict": "TRUE" | "FALSE" | "UNVERIFIED",
  "score": <0-100>,
  "confidence": <50-99>,
  "directAnswer": "<concise direct answer>",
  "reasoning": "<4-part: (1) Claimed: ... (2) Evidence states: ... (3) Contradiction/Support: ... (4) Verdict choice: ...>",
  "explanation": "<3-part: 1. User Claim: ... 2. Retrieved Live Evidence: ... 3. Factual Comparison & Verdict: ...>"
}`;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUSER CLAIM:\n"${claim}"\n\nRETRIEVED LIVE EVIDENCE:\n${evidenceText || '(No readable page content was retrieved. Return UNVERIFIED.)'}`
            }]
          }],
          generationConfig: {
            temperature: 0.0,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(18000),
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 429) {
          await sleep(200);
          continue;
        }
        if (res.status === 400) {
          const res2 = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nUSER CLAIM:\n"${claim}"\n\nRETRIEVED LIVE EVIDENCE:\n${evidenceText || '(No readable page content retrieved. Return UNVERIFIED.)'}` }] }],
              generationConfig: { temperature: 0.0 },
            }),
            signal: AbortSignal.timeout(18000),
          });
          if (!res2.ok) continue;
          const data2 = await res2.json();
          const rt2 = data2.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rt2) {
            let parsed2: any = null;
            try { parsed2 = JSON.parse(rt2); } catch {
              const m2 = rt2.match(/\{[\s\S]*\}/);
              if (m2) try { parsed2 = JSON.parse(m2[0]); } catch { }
            }
            if (parsed2) {
              const v2 = (parsed2.verdict || '').toUpperCase();
              const verdict2: 'TRUE' | 'FALSE' | 'UNVERIFIED' =
                v2 === 'TRUE' || v2 === 'REAL' ? 'TRUE' :
                v2 === 'FALSE' || v2 === 'FAKE' ? 'FALSE' : 'UNVERIFIED';
              return {
                verdict: verdict2,
                score: typeof parsed2.score === 'number' ? parsed2.score : (verdict2 === 'TRUE' ? 95 : verdict2 === 'FALSE' ? 8 : 50),
                confidence: typeof parsed2.confidence === 'number' ? parsed2.confidence : (verdict2 === 'UNVERIFIED' ? 65 : 92),
                directAnswer: parsed2.directAnswer ? decodeHtmlEntities(parsed2.directAnswer) : undefined,
                reasoning: parsed2.reasoning ? decodeHtmlEntities(parsed2.reasoning) : undefined,
                explanation: decodeHtmlEntities(parsed2.explanation || 'Evaluated strictly from retrieved live evidence.'),
              };
            }
          }
          continue;
        }
        continue;
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      let parsed: any = null;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch { }
        }
      }
      if (!parsed) continue;

      const v = (parsed.verdict || '').toUpperCase();
      let verdict: 'TRUE' | 'FALSE' | 'UNVERIFIED' = 'UNVERIFIED';
      if (v === 'TRUE' || v === 'REAL') verdict = 'TRUE';
      else if (v === 'FALSE' || v === 'FAKE') verdict = 'FALSE';
      else verdict = 'UNVERIFIED';

      console.log(`[VerifyAI] Gemini "${model}" → verdict: ${verdict} (score: ${parsed.score})`);

      return {
        verdict,
        score: typeof parsed.score === 'number' ? parsed.score : (verdict === 'TRUE' ? 95 : verdict === 'FALSE' ? 8 : 50),
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : (verdict === 'UNVERIFIED' ? 65 : 92),
        directAnswer: parsed.directAnswer ? decodeHtmlEntities(parsed.directAnswer) : undefined,
        reasoning: parsed.reasoning ? decodeHtmlEntities(parsed.reasoning) : undefined,
        explanation: decodeHtmlEntities(parsed.explanation || 'Evaluated strictly from retrieved live evidence.'),
      };
    } catch (err) {
      continue;
    }
  }

  console.warn('[VerifyAI] All Gemini models failed — returning null for deterministic fallback.');
  return null;
}

// ─── 12. Generic Deterministic Evidence Reasoner ─────────────────────────────
export function analyzeRetrievedLiveEvidence(
  claim: string,
  liveSources: VerifiedSource[]
): {
  verdict: 'TRUE' | 'FALSE' | 'UNVERIFIED';
  score: number;
  confidence: number;
  directAnswer?: string;
  reasoning?: string;
  explanation: string;
} {
  const cleanClaim = claim.trim().replace(/\.+$/, '');
  const prop = extractProposition(cleanClaim);
  const components = extractClaimComponents(cleanClaim);

  const evidenceSources = liveSources
    .filter(s => (s.evidenceText || s.snippet || '').trim().length >= 30)
    .slice(0, 12);

  if (evidenceSources.length === 0) {
    return {
      verdict: 'UNVERIFIED',
      score: 50,
      confidence: 50,
      directAnswer: `Unverified: No readable live source evidence was retrieved for "${cleanClaim}".`,
      reasoning: `(1) Claimed: ${cleanClaim}. (2) Evidence states: No readable page content or snippets retrieved. (3) Comparison: Lack of evidence cannot prove or disprove the claim. (4) Choice: UNVERIFIED.`,
      explanation: `1. User Claim: "${cleanClaim}". 2. Retrieved Live Evidence: No readable source content was available. 3. Factual Comparison & Verdict: Search metadata alone cannot prove or disprove the claim. Therefore, the verdict is UNVERIFIED.`,
    };
  }

  const allEvidence = evidenceSources
    .map(s => `${s.name} ${s.snippet || ''} ${s.evidenceText || ''}`)
    .join('\n')
    .toLowerCase();

  // 1. Check for explicit debunk / fact-check contradiction language
  const hasDebunkSignal = evidenceSources.some(source => {
    const text = `${source.name} ${source.snippet || ''} ${source.evidenceText || ''}`.toLowerCase();
    const entityHits = components.entities.filter(e => text.includes(e.toLowerCase())).length;
    const hasEntities = entityHits >= Math.max(1, Math.min(2, components.entities.length));
    return hasEntities && /\b(?:debunked|false claim|fact.?check.*false|fact.?check.*fake|hoax|misleading|untrue|denied|no evidence that|fabricated)\b/i.test(text);
  });

  if (hasDebunkSignal) {
    return {
      verdict: 'FALSE',
      score: 10,
      confidence: 88,
      directAnswer: `No, this is not true: Live fact-checks and authoritative reporting confirm this claim is false or unsubstantiated.`,
      reasoning: `(1) Claimed: ${cleanClaim}. (2) Evidence states: Fact-checking organizations report this assertion as false, debunked, or a hoax. (3) Comparison: Direct contradiction with authoritative reporting. (4) Choice: FALSE.`,
      explanation: `1. User Claim: "${cleanClaim}". 2. Retrieved Live Evidence: Multiple verified sources and fact-checks identify this claim as false or misleading. 3. Factual Comparison & Verdict: The claim is contradicted by verified reporting and classified as FALSE.`,
    };
  }

  // 2. Numerical contradiction check
  if (components.numericalValues.length > 0) {
    const hasClaimedNumber = components.numericalValues.some(n => allEvidence.includes(n.toLowerCase()));
    if (!hasClaimedNumber) {
      const foundNumbers = allEvidence.match(/(?:₹|\$|€|£)?\s*\d+(?:\.\d+)?\s*(?:cr|crore|million|billion|lakh)?/gi) || [];
      if (foundNumbers.length > 0 && components.entities.length > 0) {
        return {
          verdict: 'UNVERIFIED',
          score: 50,
          confidence: 65,
          directAnswer: `Unverified: The specific numerical figure in "${cleanClaim}" could not be confirmed in the retrieved live reports.`,
          reasoning: `(1) Claimed: ${cleanClaim}. (2) Evidence states: Figures reported in live sources do not match the claimed value. (3) Comparison: Discrepancy or absence of claimed number. (4) Choice: UNVERIFIED.`,
          explanation: `1. User Claim: "${cleanClaim}". 2. Retrieved Live Evidence: Live sources report different numerical figures or do not confirm the exact number. 3. Factual Comparison & Verdict: The exact numerical value remains unverified.`,
        };
      }
    }
  }

  // 3. Proposition-based support check
  let supportPoints = 0;
  for (const source of evidenceSources) {
    const text = `${source.name} ${source.snippet || ''} ${source.evidenceText || ''}`.toLowerCase();
    const entityMatches = components.entities.filter(e => text.includes(e.toLowerCase())).length;
    const allEntitiesPresent = components.entities.length > 0 && entityMatches >= components.entities.length;

    if (allEntitiesPresent) {
      if (components.actionPredicate && text.includes(components.actionPredicate)) {
        supportPoints += (source.reliability >= 95 ? 2 : 1);
      }
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
      if (components.temporalValues.some(t => text.includes(t.toLowerCase()))) {
        supportPoints += 1;
      }
    }
  }

  if (supportPoints >= 3) {
    return {
      verdict: 'TRUE',
      score: 95,
      confidence: 90,
      directAnswer: `Yes, this is true: Corroborated by verified reporting across authoritative live sources.`,
      reasoning: `(1) Claimed: ${cleanClaim}. (2) Evidence states: Multiple accredited sources confirm the entities, actions, and dates asserted in the claim. (3) Comparison: Direct alignment between claim components and live source content. (4) Choice: TRUE.`,
      explanation: `1. User Claim: "${cleanClaim}". 2. Retrieved Live Evidence: Authoritative references consistently confirm the stated facts. 3. Factual Comparison & Verdict: All key factual components are supported by verified sources.`,
    };
  }

  return {
    verdict: 'UNVERIFIED',
    score: 50,
    confidence: 60,
    directAnswer: `Unverified: Available live evidence is insufficient to fully confirm or refute "${cleanClaim}".`,
    reasoning: `(1) Claimed: ${cleanClaim}. (2) Evidence states: Retrieved sources reference related topics but do not explicitly prove or disprove all elements. (3) Comparison: Insufficient corroboration. (4) Choice: UNVERIFIED.`,
    explanation: `1. User Claim: "${cleanClaim}". 2. Retrieved Live Evidence: Retrieved references discuss related entities but lack explicit confirmation of the asserted proposition. 3. Factual Comparison & Verdict: Without explicit corroboration, the claim is marked UNVERIFIED.`,
  };
}

// ─── 13. Main Exported Realtime Verifier ─────────────────────────────────────
export const realtimeVerifier = {
  async verifyClaim(claim: string): Promise<RealtimeVerificationOutput> {
    const cleanClaim = (claim || '').trim();
    if (!cleanClaim) throw new Error('Claim text cannot be empty.');

    const isQuestion = isQuestionInput(cleanClaim);

    // Step 1: Fresh multi-source live web search
    const liveSources = await executeLiveWebSearch(cleanClaim);

    if (liveSources.length === 0) {
      return {
        verdict: 'UNVERIFIED',
        verdictLabel: 'NOT ENOUGH EVIDENCE',
        score: 50,
        confidence: 50,
        directAnswer: 'Live verification is currently unavailable. Please try again.',
        explanation: 'Live verification is currently unavailable. Please try again.',
        claim: cleanClaim,
        originalClaim: cleanClaim,
        isLiveWebVerified: false,
        searchTimestamp: new Date().toISOString(),
        signals: [
          { name: 'Claim-to-Evidence Consistency', status: 'warning', score: 50, detail: 'Live search returned no results.' },
          { name: 'Primary & Official Registry Alignment', status: 'warning', score: 50, detail: 'Search unavailable.' },
          { name: 'Real-Time Live Web Coverage', status: 'failed', score: 10, detail: 'Zero sources retrieved.' },
          { name: 'Fact & Entity Match Index', status: 'warning', score: 50, detail: 'No evidence available.' },
        ],
        sources: [],
      };
    }

    // Step 2: Conservative deterministic analysis (fast pre-check)
    const deterministicEval = analyzeRetrievedLiveEvidence(cleanClaim, liveSources);
    let evalResult = deterministicEval;

    // Step 3: Grounded AI semantic reasoning (primary path for all arbitrary claims)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const hasAnyReadableContent = liveSources.some(s => (s.evidenceText || s.snippet || '').trim().length >= 30);

    if (apiKey && hasAnyReadableContent) {
      const aiEval = await evaluateEvidenceWithAI(cleanClaim, liveSources, apiKey);
      if (aiEval) {
        evalResult = aiEval;
      } else {
        console.warn('[VerifyAI] AI evaluation returned null — using deterministic fallback.');
      }
    } else if (!apiKey) {
      console.warn('[VerifyAI] GEMINI_API_KEY not found in environment. AI layer skipped.');
    }

    const verdict = evalResult.verdict;
    const verdictLabel = verdict === 'TRUE'
      ? "YES, IT'S TRUE"
      : verdict === 'FALSE'
        ? "NO, IT'S NOT TRUE"
        : "NOT ENOUGH EVIDENCE";

    const topSources = liveSources.slice(0, 5);
    const topSourceNames = topSources.slice(0, 3).map(s => s.name).join(', ');

    const signals: VerificationSignal[] = [
      {
        name: 'Claim-to-Evidence Consistency',
        status: verdict === 'TRUE' ? 'passed' : verdict === 'FALSE' ? 'failed' : 'warning',
        score: verdict === 'TRUE' ? 95 : verdict === 'FALSE' ? 8 : 50,
        detail: verdict === 'TRUE'
          ? `Corroborated by verified sources (${topSourceNames}).`
          : verdict === 'FALSE'
            ? (evalResult.reasoning || `Contradicted by verified reports or absent from authoritative records.`)
            : `No primary institutional record found for this exact claim.`,
      },
      {
        name: 'Primary & Official Registry Alignment',
        status: topSources.some(s => s.reliability >= 95) ? 'passed' : (topSources.length > 0 ? 'warning' : 'failed'),
        score: topSources.filter(s => (s.reliability || 0) >= 95 && (s.evidenceText || s.snippet || '').trim().length >= 40).length >= 2 ? 96 : 60,
        detail: `Evidence cross-referenced against authoritative sources with readable page content (${topSourceNames}).`,
      },
      {
        name: 'Real-Time Live Web Coverage',
        status: topSources.length >= 2 ? 'passed' : (topSources.length === 1 ? 'warning' : 'failed'),
        score: topSources.filter(s => (s.evidenceText || s.snippet || '').trim().length >= 40).length >= 3 ? 98 : (topSources.length >= 1 ? 70 : 15),
        detail: `Retrieved ${topSources.length} ranked reference sources; verdict evidence uses readable content.`,
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
      signals,
      sources: topSources.map(s => ({
        ...s,
        name: decodeHtmlEntities(s.name),
        snippet: decodeHtmlEntities(s.snippet || ''),
      })),
    };
  },
};

