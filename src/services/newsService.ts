import { NewsItem } from '../types';

export const TRENDING_NEWS_FEED: NewsItem[] = [
  {
    id: 'news_1',
    title: 'NASA Confirms Discovery of Water Ice Deposits in Lunar South Pole Craters',
    source: 'NASA Aerospace Wire',
    category: 'Space & Science',
    timeAgo: '18m ago',
    summary: 'Spectral measurements from the Lunar Reconnaissance Orbiter confirm stable deposits of surface water ice in permanently shadowed regions of Shackleton Crater.',
    verifiedVerdict: 'REAL',
    score: 100,
    claimText: 'NASA confirmed substantial water ice deposits in permanently shadowed regions of the Moon\'s south pole via Lunar Reconnaissance Orbiter data.',
    imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80',
    tags: ['NASA', 'Lunar Mission', 'Verified Science', 'Astronomy']
  },
  {
    id: 'news_2',
    title: 'Viral Claim: "Drinking Boiled Lemon Water with Baking Soda Completely Eliminates Diabetes in 48 Hours"',
    source: 'Social Media Viral Chain',
    category: 'Health Myth',
    timeAgo: '42m ago',
    summary: 'A viral video claiming that a mixture of boiled lemon water and baking soda cures type-2 diabetes in two days has accumulated millions of views on TikTok and WhatsApp.',
    verifiedVerdict: 'FAKE',
    score: 0,
    claimText: 'Miracle cure: Drinking boiled lemon water with baking soda completely cures diabetes in 48 hours without insulin or medication.',
    imageUrl: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600&auto=format&fit=crop&q=80',
    tags: ['Health Hoax', 'Fact Check', 'Medical Misinformation', 'Viral Claim']
  },
  {
    id: 'news_3',
    title: 'Breakthrough in Solid-State Lithium Battery Doubles EV Range to 1,000 Kilometers',
    source: 'MIT Technology Review',
    category: 'Energy & Tech',
    timeAgo: '1h ago',
    summary: 'Researchers demonstrate an inorganic solid electrolyte capable of preventing dendrite formation across 1,000 fast-charging cycles at room temperature.',
    verifiedVerdict: 'REAL',
    score: 100,
    claimText: 'MIT researchers developed a solid-state battery architecture that achieves over 1,000 charge cycles without degradation, potentially doubling EV range.',
    imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80',
    tags: ['CleanTech', 'MIT Review', 'Batteries', 'EV Tech']
  },
  {
    id: 'news_4',
    title: 'Fabricated Photo of Flooded Eiffel Tower Spreads Across Social Platforms',
    source: 'AFP Fact Check',
    category: 'Media Forensics',
    timeAgo: '2h ago',
    summary: 'An AI-generated visual depicting floodwaters submerging Paris landmarks was widely re-shared as real breaking weather footage.',
    verifiedVerdict: 'FAKE',
    score: 0,
    claimText: 'Paris under 15 feet of flood water with the base of the Eiffel Tower completely submerged.',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80',
    tags: ['Deepfake Photo', 'AI Media', 'Debunked', 'AFP']
  }
];

export const newsService = {
  getTrendingNews(): NewsItem[] {
    return TRENDING_NEWS_FEED;
  },

  getNewsById(id: string): NewsItem | undefined {
    return TRENDING_NEWS_FEED.find(n => n.id === id);
  }
};
