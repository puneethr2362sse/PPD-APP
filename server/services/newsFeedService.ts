import 'dotenv/config';

export interface LiveNewsArticle {
  id: string;
  title: string;
  source: string;
  category: string;
  link: string;
  pubDate: string;
  timeAgo: string;
  summary: string;
  imageUrl?: string;
  claimText: string;
}

interface FeedConfig {
  source: string;
  url: string;
  category: string;
}

const CATEGORY_FEEDS: Record<string, FeedConfig[]> = {
  all: [
    { source: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss', category: 'India' },
    { source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'World' },
    { source: 'Google News (India)', url: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en', category: 'India' },
    { source: 'BBC Telugu', url: 'https://feeds.bbci.co.uk/telugu/rss.xml', category: 'Telugu News' },
    { source: 'Google News (Tech)', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en', category: 'Science & Technology' },
    { source: 'The Hindu (Business)', url: 'https://www.thehindu.com/business/feeder/default.rss', category: 'Business' },
  ],
  india: [
    { source: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss', category: 'India' },
    { source: 'Google News (India)', url: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en', category: 'India' },
    { source: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', category: 'India' },
    { source: 'NDTV', url: 'https://feeds.feedburner.com/ndtvnews-india-news', category: 'India' },
  ],
  telugu: [
    { source: 'BBC Telugu', url: 'https://feeds.bbci.co.uk/telugu/rss.xml', category: 'Telugu News' },
    { source: 'Google News (Telugu)', url: 'https://news.google.com/rss?hl=te&gl=IN&ceid=IN:te', category: 'Telugu News' },
    { source: 'OneIndia Telugu', url: 'https://telugu.oneindia.com/rss/telugu-news-fb.xml', category: 'Telugu News' },
  ],
  world: [
    { source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'World' },
    { source: 'Google News (World)', url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-IN&gl=IN&ceid=IN:en', category: 'World' },
    { source: 'The Hindu', url: 'https://www.thehindu.com/news/international/feeder/default.rss', category: 'World' },
  ],
  politics: [
    { source: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss', category: 'Politics' },
    { source: 'Google News (India)', url: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en', category: 'Politics' },
    { source: 'NDTV', url: 'https://feeds.feedburner.com/ndtvnews-top-stories', category: 'Politics' },
  ],
  business: [
    { source: 'The Hindu', url: 'https://www.thehindu.com/business/feeder/default.rss', category: 'Business' },
    { source: 'Google News (Business)', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en', category: 'Business' },
    { source: 'NDTV Profit', url: 'https://feeds.feedburner.com/ndtvprofit-latest', category: 'Business' },
  ],
  technology: [
    { source: 'Google News (Tech)', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en', category: 'Science & Technology' },
    { source: 'The Hindu', url: 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss', category: 'Science & Technology' },
    { source: 'NDTV Gadgets 360', url: 'https://feeds.feedburner.com/gadgets360-latest', category: 'Science & Technology' },
  ],
  entertainment: [
    { source: 'Google News (Entertainment)', url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en', category: 'Entertainment' },
    { source: 'The Hindu', url: 'https://www.thehindu.com/entertainment/feeder/default.rss', category: 'Entertainment' },
    { source: 'NDTV Movies', url: 'https://feeds.feedburner.com/ndtvmovies-latest', category: 'Entertainment' },
  ],
  sports: [
    { source: 'Google News (Sports)', url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-IN&gl=IN&ceid=IN:en', category: 'Sports' },
    { source: 'The Hindu', url: 'https://www.thehindu.com/sport/feeder/default.rss', category: 'Sports' },
    { source: 'NDTV Sports', url: 'https://feeds.feedburner.com/ndtvsports-latest', category: 'Sports' },
  ],
  health: [
    { source: 'The Hindu', url: 'https://www.thehindu.com/sci-tech/health/feeder/default.rss', category: 'Health' },
    { source: 'Google News (Health)', url: 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-IN&gl=IN&ceid=IN:en', category: 'Health' },
    { source: 'NDTV Health', url: 'https://feeds.feedburner.com/ndtvcooks-latest', category: 'Health' },
  ],
  hindi: [
    { source: 'BBC Hindi', url: 'https://feeds.bbci.co.uk/hindi/rss.xml', category: 'Hindi News' },
    { source: 'Google News (Hindi)', url: 'https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi', category: 'Hindi News' },
  ],
  tamil: [
    { source: 'BBC Tamil', url: 'https://feeds.bbci.co.uk/tamil/rss.xml', category: 'Tamil News' },
    { source: 'Google News (Tamil)', url: 'https://news.google.com/rss?hl=ta&gl=IN&ceid=IN:ta', category: 'Tamil News' },
  ],
};

function stripHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTagContent(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return stripHtml(cdataMatch[1]);

  const standardRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const standardMatch = xml.match(standardRegex);
  if (standardMatch) return stripHtml(standardMatch[1]);

  return '';
}

function extractImageUrl(xml: string): string | undefined {
  const thumbMatch = xml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (thumbMatch && thumbMatch[1].startsWith('http')) return thumbMatch[1];

  const mediaMatch = xml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch && mediaMatch[1].startsWith('http')) return mediaMatch[1];

  const enclosureMatch = xml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch && enclosureMatch[1].startsWith('http')) return enclosureMatch[1];

  const imgMatch = xml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1].startsWith('http')) return imgMatch[1];

  return undefined;
}

function formatTimeAgo(pubDateStr: string): string {
  try {
    const pub = new Date(pubDateStr);
    const now = new Date();
    const diffMs = now.getTime() - pub.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return 'Recent';
  }
}

function normalizeTitleForDeduplication(title: string): string {
  // Unicode-safe normalization preserving Telugu, Hindi, Tamil, Latin, etc.
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
}

function cleanCanonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    // Strip common tracking query params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid'];
    for (const p of trackingParams) {
      u.searchParams.delete(p);
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

function parseRssFeed(xmlText: string, defaultSource: string, defaultCategory: string): LiveNewsArticle[] {
  const articles: LiveNewsArticle[] = [];
  const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const title = extractTagContent(itemXml, 'title');
    let link = '';
    const linkMatch =
      itemXml.match(/<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) ||
      itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i) ||
      itemXml.match(/<guid[^>]*isPermaLink="true"[^>]*>([\s\S]*?)<\/guid>/i) ||
      itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
    if (linkMatch) {
      link = linkMatch[1].trim();
    }

    const description = extractTagContent(itemXml, 'description');
    const pubDate = extractTagContent(itemXml, 'pubDate') || new Date().toISOString();
    const imageUrl = extractImageUrl(itemXml);

    if (!title || title.length < 5) continue;

    // Stable deterministic ID based on link or title hash (never changes on re-fetch)
    const seed = link || title;
    const hash = Math.abs(seed.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)).toString(36);
    const id = `news_${hash}`;

    // Build claim text for one-click verification
    const claimText = description && description.length > 20
      ? `${title}. ${description.slice(0, 250)}`
      : title;

    articles.push({
      id,
      title,
      source: defaultSource,
      category: defaultCategory,
      link: link || '#',
      pubDate,
      timeAgo: formatTimeAgo(pubDate),
      summary: description || title,
      imageUrl,
      claimText,
    });
  }

  return articles;
}

// In-memory cache: 5 minutes TTL per category unless force-refreshed
interface CacheEntry {
  timestamp: number;
  data: LiveNewsArticle[];
}
const newsCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 5 * 60 * 1000;

export const newsFeedService = {
  async getLiveNews(
    category: string = 'all',
    forceRefresh: boolean = false
  ): Promise<{
    success: boolean;
    news: LiveNewsArticle[];
    category: string;
    cached?: boolean;
    stale?: boolean;
    refreshedAt?: string;
    newArticlesCount?: number;
    isUpToDate?: boolean;
    statusMessage?: string;
    error?: string;
  }> {
    const catKey = category.toLowerCase().trim();
    const feeds = CATEGORY_FEEDS[catKey] || CATEGORY_FEEDS['all'];

    // Check cache if not forcing refresh
    const cached = newsCache[catKey];
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.data.length > 0) {
      return {
        success: true,
        news: cached.data,
        category: catKey,
        cached: true,
        refreshedAt: new Date(cached.timestamp).toISOString(),
        isUpToDate: true,
        statusMessage: 'Loaded from local verified cache.',
      };
    }

    const fetchedArticles: LiveNewsArticle[] = [];
    const errors: string[] = [];

    // Fetch RSS feeds concurrently with timeout
    await Promise.allSettled(
      feeds.map(async (feed) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 7000);

          const res = await fetch(feed.url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VerifyAI/2.0 NewsReader',
              'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            },
          });
          clearTimeout(timeout);

          if (!res.ok) {
            errors.push(`${feed.source}: HTTP ${res.status}`);
            return;
          }

          const xmlText = await res.text();
          const items = parseRssFeed(xmlText, feed.source, feed.category);
          fetchedArticles.push(...items.slice(0, 8)); // Top 8 from each provider
        } catch (err: any) {
          errors.push(`${feed.source}: ${err.message || 'Fetch failed'}`);
        }
      })
    );

    if (fetchedArticles.length > 0) {
      // Robust deduplication: check canonical link first, then Unicode-normalized title
      const seenLinks = new Set<string>();
      const seenTitles = new Set<string>();

      const unique = fetchedArticles.filter((art) => {
        if (!art.link || (!art.link.startsWith('http://') && !art.link.startsWith('https://'))) return false;

        const canonicalLink = cleanCanonicalUrl(art.link);
        if (seenLinks.has(canonicalLink)) return false;

        const normTitle = normalizeTitleForDeduplication(art.title);
        if (normTitle.length >= 6 && seenTitles.has(normTitle)) return false;

        seenLinks.add(canonicalLink);
        if (normTitle.length >= 6) seenTitles.add(normTitle);
        return true;
      });

      // Sort by publication date (most recent first)
      unique.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      // Track how many new articles appeared relative to previous cache
      const previousIds = new Set((cached?.data || []).map((a) => a.id));
      const newlyDiscovered = previousIds.size > 0
        ? unique.filter((a) => !previousIds.has(a.id)).length
        : unique.length;
      const isUpToDate = previousIds.size > 0 && newlyDiscovered === 0;

      const now = Date.now();
      newsCache[catKey] = {
        timestamp: now,
        data: unique,
      };

      const statusMessage = isUpToDate
        ? 'Feed is up to date — all articles verified with live sources.'
        : newlyDiscovered > 0
          ? `${newlyDiscovered} new stor${newlyDiscovered === 1 ? 'y' : 'ies'} updated.`
          : 'Live news updated successfully.';

      return {
        success: true,
        news: unique,
        category: catKey,
        refreshedAt: new Date(now).toISOString(),
        newArticlesCount: newlyDiscovered,
        isUpToDate,
        statusMessage,
      };
    }

    // If fetch failed but we have existing cache, preserve valid articles with stale flag
    if (cached && cached.data.length > 0) {
      return {
        success: true,
        news: cached.data,
        category: catKey,
        cached: true,
        stale: true,
        refreshedAt: new Date(cached.timestamp).toISOString(),
        statusMessage: 'Live update timed out; preserved valid cached articles.',
        error: `Could not fetch fresh stories (${errors.join('; ')}). Displaying previously cached articles.`,
      };
    }

    // Honest error reporting if live fetch failed completely
    return {
      success: false,
      news: [],
      category: catKey,
      error: `Could not reach live news providers. ${errors.join(', ')}`,
    };
  },

  getCategories(): Array<{ id: string; label: string }> {
    return [
      { id: 'all', label: 'All / Trending' },
      { id: 'india', label: 'India' },
      { id: 'telugu', label: 'Telugu News (తెలుగు)' },
      { id: 'hindi', label: 'Hindi News (हिन्दी)' },
      { id: 'tamil', label: 'Tamil News (தமிழ்)' },
      { id: 'world', label: 'World' },
      { id: 'politics', label: 'Politics' },
      { id: 'business', label: 'Business' },
      { id: 'technology', label: 'Science & Tech' },
      { id: 'entertainment', label: 'Entertainment' },
      { id: 'sports', label: 'Sports' },
      { id: 'health', label: 'Health' },
    ];
  },
};
