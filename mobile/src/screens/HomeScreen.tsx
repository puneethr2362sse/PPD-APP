import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { ScoreBadge } from '../components/ScoreBadge';
import { api } from '../services/api';
import { NewsItem } from '../types';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentUser } = useAuth();
  const { stats } = useHistory();
  const [trendingNews, setTrendingNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    async function loadNews() {
      try {
        const res = await api.get('/news');
        if (res.success && res.news) {
          setTrendingNews(res.news);
        }
      } catch {
        // fallback
      }
    }
    loadNews();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greetingSub}>VerifyAI Core v2.4</Text>
            <Text style={styles.greetingMain}>
              Hello, <Text style={styles.nameHighlight}>{currentUser?.name || 'Puneeth'}</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Text style={styles.avatarText}>
              {(currentUser?.name || 'P').charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Scans</Text>
            <Text style={styles.statValue}>{stats.totalScans}</Text>
          </View>

          <View style={[styles.statCard, styles.statCardReal]}>
            <Text style={[styles.statLabel, { color: '#34d399' }]}>Real</Text>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.realCount}</Text>
          </View>

          <View style={[styles.statCard, styles.statCardFake]}>
            <Text style={[styles.statLabel, { color: '#fb7185' }]}>Fake</Text>
            <Text style={[styles.statValue, { color: '#f43f5e' }]}>{stats.fakeCount}</Text>
          </View>
        </View>

        {/* Workspace Cards */}
        <Text style={styles.sectionTitle}>Verification Workspaces</Text>

        <View style={styles.workspaces}>
          {/* Text Scan Card */}
          <TouchableOpacity
            style={styles.workspaceCard}
            onPress={() => navigation.navigate('TextScan')}
            activeOpacity={0.8}
          >
            <View style={styles.workspaceTop}>
              <View style={[styles.workspaceIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                <Ionicons name="document-text" size={24} color="#06b6d4" />
              </View>
              <Ionicons name="arrow-forward" size={18} color="#64748b" />
            </View>

            <Text style={styles.workspaceTitle}>Text & News Verification</Text>
            <Text style={styles.workspaceDesc}>
              Paste viral messages, headlines, or quotes to check veracity against verified registries.
            </Text>

            <View style={styles.workspaceFooter}>
              <Text style={styles.workspaceBadge}>Supports Paste & Text</Text>
            </View>
          </TouchableOpacity>

          {/* Image Scan Card */}
          <TouchableOpacity
            style={styles.workspaceCard}
            onPress={() => navigation.navigate('ImageScan')}
            activeOpacity={0.8}
          >
            <View style={styles.workspaceTop}>
              <View style={[styles.workspaceIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <Ionicons name="image" size={24} color="#818cf8" />
              </View>
              <Ionicons name="arrow-forward" size={18} color="#64748b" />
            </View>

            <Text style={styles.workspaceTitle}>Image & Deepfake Forensics</Text>
            <Text style={styles.workspaceDesc}>
              Upload photos from camera or gallery to detect AI diffusion and Error Level Analysis (ELA) anomalies.
            </Text>

            <View style={styles.workspaceFooter}>
              <Text style={[styles.workspaceBadge, { color: '#818cf8' }]}>Camera & Photo Gallery</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Trending News Section */}
        <Text style={styles.sectionTitle}>Trending News Fact-Checks</Text>

        <View style={styles.newsList}>
          {trendingNews.map((news) => (
            <View key={news.id} style={styles.newsCard}>
              <View style={styles.newsHeader}>
                <Text style={styles.newsCategory}>{news.category.toUpperCase()}</Text>
                <ScoreBadge score={news.score} verdict={news.verifiedVerdict} size="sm" />
              </View>

              <Text style={styles.newsTitle}>{news.title}</Text>
              <Text style={styles.newsSummary}>{news.summary}</Text>

              <View style={styles.newsFooter}>
                <Text style={styles.newsSource}>{news.source} • {news.timeAgo}</Text>
                <TouchableOpacity
                  style={styles.verifyClaimBtn}
                  onPress={() => navigation.navigate('TextScan', { prefilledText: news.claimText })}
                >
                  <Text style={styles.verifyClaimText}>Verify Claim</Text>
                  <Ionicons name="arrow-forward" size={12} color="#06b6d4" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingSub: {
    fontSize: 11,
    color: '#06b6d4',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  greetingMain: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  nameHighlight: {
    color: '#38bdf8',
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#0F1626',
    borderWidth: 1.5,
    borderColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0F1626',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statCardReal: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  statCardFake: {
    borderColor: 'rgba(244, 63, 94, 0.3)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 4,
  },
  workspaces: {
    gap: 12,
    marginBottom: 24,
  },
  workspaceCard: {
    backgroundColor: '#0F1626',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  workspaceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  workspaceIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  workspaceDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 14,
  },
  workspaceFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  workspaceBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06b6d4',
  },
  newsList: {
    gap: 12,
  },
  newsCard: {
    backgroundColor: '#0F1626',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  newsCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 6,
  },
  newsSummary: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  newsSource: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  verifyClaimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifyClaimText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06b6d4',
  },
});
