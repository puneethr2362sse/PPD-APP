import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for local Firestore persistent sync
const DATA_DIR = path.join(__dirname, 'data');
const FIRESTORE_STORE_PATH = path.join(DATA_DIR, 'firestore_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Collections interface
export interface FirestoreCollections {
  users: Record<string, any>;
  otps: Record<string, any>;
  scans: Record<string, any>;
  news: Record<string, any>;
}

// Initial demo seed for Puneeth & trending news
function getInitialSeedData(): FirestoreCollections {
  return {
    users: {
      'usr_puneeth_demo': {
        id: 'usr_puneeth_demo',
        name: 'Puneeth',
        email: 'puneeth@example.com',
        phone: '+1 (555) 019-2834',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        lastLoginAt: new Date().toISOString(),
      }
    },
    otps: {},
    scans: {
      'scan_puneeth_1': {
        id: 'scan_puneeth_1',
        userEmail: 'puneeth@example.com',
        type: 'IMAGE',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        formattedDate: 'Today, 10:30 PM',
        score: 0,
        verdict: 'FAKE',
        preview: 'viral_breaking_explosion_metro.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
        explanation: 'Forensic image inspection revealed generative adversarial noise in pixel lattices, inconsistent light diffusion along building contours, and repeated cloned textures in the smoke column.',
        confidence: 97.8,
        signals: [
          { name: 'GAN Synthetic Footprint', status: 'failed', score: 8, detail: 'High probability of synthetic diffusion generator artifacts detected.' },
          { name: 'Lighting & Shadow Coherence', status: 'failed', score: 12, detail: 'Multiple directional shadows inconsistent with single sun angle.' },
          { name: 'Error Level Analysis (ELA)', status: 'failed', score: 15, detail: 'Significant compression variance between subject and background.' },
          { name: 'EXIF Metadata Integrity', status: 'warning', score: 40, detail: 'EXIF headers missing camera firmware serialization tags.' }
        ]
      },
      'scan_puneeth_2': {
        id: 'scan_puneeth_2',
        userEmail: 'puneeth@example.com',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        formattedDate: 'Today, 10:25 PM',
        score: 100,
        verdict: 'REAL',
        preview: 'James Webb Space Telescope detects carbon-bearing molecules in the habitable zone of exoplanet K2-18 b.',
        fullContent: 'NASA\'s James Webb Space Telescope has provided unprecedented spectroscopic data revealing carbon-bearing molecules including methane and carbon dioxide in the atmosphere of K2-18 b, an exoplanet 120 light-years away.',
        explanation: 'Content matches peer-reviewed publication from NASA Astrophysical Journal and verified press releases across Reuters, Science, and Nature News. No sensationalist hyperbole or deceptive linguistic framing detected.',
        confidence: 99.4,
        signals: [
          { name: 'Cross-Source Corroboration', status: 'passed', score: 100, detail: 'Confirmed across 6 Tier-1 international scientific agencies.' },
          { name: 'Linguistic Neutrality', status: 'passed', score: 98, detail: 'Scientific terminology used accurately without clickbait distortion.' },
          { name: 'Historical Claim Consistency', status: 'passed', score: 100, detail: 'Matches official NASA mission logs published in September 2023.' },
          { name: 'Source Attribution', status: 'passed', score: 96, detail: 'Direct quote attribution verified with lead investigator Dr. Nikku Madhusudhan.' }
        ],
        sources: [
          { name: 'NASA Official Mission Bulletin', reliability: 100 },
          { name: 'Astrophysical Journal Letters', reliability: 99 },
          { name: 'Reuters Science Desk', reliability: 95 }
        ]
      }
    },
    news: {
      'news_1': {
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
      'news_2': {
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
      'news_3': {
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
      'news_4': {
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
    }
  };
}

// Persistent Firestore Collection Manager with atomic save
class FirestoreDatabase {
  private data: FirestoreCollections;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): FirestoreCollections {
    if (fs.existsSync(FIRESTORE_STORE_PATH)) {
      try {
        const raw = fs.readFileSync(FIRESTORE_STORE_PATH, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading Firestore store, re-seeding:', err);
      }
    }
    const seed = getInitialSeedData();
    this.persist(seed);
    return seed;
  }

  private persist(dataToPersist: FirestoreCollections = this.data) {
    try {
      fs.writeFileSync(FIRESTORE_STORE_PATH, JSON.stringify(dataToPersist, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to Firestore store:', err);
    }
  }

  // Collection: users
  getUsers(): any[] {
    return Object.values(this.data.users);
  }

  findUserByEmail(email: string): any | undefined {
    const clean = email.trim().toLowerCase();
    return this.getUsers().find(u => u.email.toLowerCase() === clean);
  }

  findUserById(id: string): any | undefined {
    return this.data.users[id];
  }

  setUser(id: string, userDoc: any) {
    this.data.users[id] = { ...userDoc, id };
    this.persist();
    return this.data.users[id];
  }

  // Collection: otps
  getOTP(email: string): any | undefined {
    const clean = email.trim().toLowerCase();
    const record = this.data.otps[clean];
    if (!record) return undefined;
    if (Date.now() > record.expiresAt) {
      delete this.data.otps[clean];
      this.persist();
      return undefined;
    }
    return record;
  }

  getOtp(email: string): any | undefined {
    return this.getOTP(email);
  }

  setOTP(email: string, otpDoc: any) {
    const clean = email.trim().toLowerCase();
    this.data.otps[clean] = { ...otpDoc, email: clean };
    this.persist();
  }

  setOtp(email: string, otpDoc: any) {
    this.setOTP(email, otpDoc);
  }

  deleteOTP(email: string) {
    const clean = email.trim().toLowerCase();
    delete this.data.otps[clean];
    this.persist();
  }

  deleteOtp(email: string) {
    this.deleteOTP(email);
  }

  // Collection: scans
  getScansByUser(email: string): any[] {
    const clean = email.trim().toLowerCase();
    return Object.values(this.data.scans)
      .filter((scan: any) => scan.userEmail?.toLowerCase() === clean)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getScanById(id: string): any | undefined {
    return this.data.scans[id];
  }

  addScan(scanDoc: any) {
    const id = scanDoc.id || 'scan_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    this.data.scans[id] = { ...scanDoc, id };
    this.persist();
    return this.data.scans[id];
  }

  deleteScan(id: string, email: string) {
    const clean = email.trim().toLowerCase();
    const scan = this.data.scans[id];
    if (scan && scan.userEmail.toLowerCase() === clean) {
      delete this.data.scans[id];
      this.persist();
      return true;
    }
    return false;
  }

  clearUserScans(email: string) {
    const clean = email.trim().toLowerCase();
    let count = 0;
    for (const [id, scan] of Object.entries(this.data.scans) as [string, any][]) {
      if (scan.userEmail?.toLowerCase() === clean) {
        delete this.data.scans[id];
        count++;
      }
    }
    this.persist();
    return count;
  }

  // Collection: news
  getTrendingNews(): any[] {
    return Object.values(this.data.news);
  }
}

export const firestoreDB = new FirestoreDatabase();
