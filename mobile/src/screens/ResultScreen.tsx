import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Share 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VerificationResult } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';
import { ForensicSignals } from '../components/ForensicSignals';

export const ResultScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const result: VerificationResult = route.params?.result;

  if (!result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Active Scan Result</Text>
          <TouchableOpacity style={styles.returnBtn} onPress={() => navigation.navigate('HomeTab')}>
            <Text style={styles.returnBtnText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `[VerifyAI Result] Verdict: ${result.verdict} (${result.score}/100)\nClaim: ${result.preview}\nExplanation: ${result.explanation}`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('HomeTab')}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Verification Report</Text>

          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#06b6d4" />
          </TouchableOpacity>
        </View>

        {/* Hero Score Badge */}
        <ScoreBadge score={result.score} verdict={result.verdict} size="lg" />

        {/* Reasoning Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons
              name={result.verdict === 'REAL' ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={result.verdict === 'REAL' ? '#10b981' : '#f43f5e'}
            />
            <Text style={styles.cardHeaderTitle}>Forensic Reasoning</Text>
          </View>

          <Text style={styles.reasonText}>{result.explanation}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaTime}>{result.formattedDate}</Text>
            <Text style={styles.metaConf}>AI Confidence: {result.confidence}%</Text>
          </View>
        </View>

        {/* Payload preview */}
        <View style={styles.card}>
          <Text style={styles.payloadTitle}>Analyzed {result.type} Payload</Text>

          {result.type === 'IMAGE' && result.imageUrl ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: result.imageUrl }} style={styles.payloadImage} resizeMode="contain" />
              <Text style={styles.imageCaption} numberOfLines={1}>{result.preview}</Text>
            </View>
          ) : (
            <View style={styles.textPayloadBox}>
              <Text style={styles.payloadText}>{result.fullContent || result.preview}</Text>
            </View>
          )}
        </View>

        {/* Forensic Signals */}
        <View style={styles.card}>
          <Text style={styles.payloadTitle}>Neural Signal Breakdown</Text>
          <ForensicSignals signals={result.signals} />
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.scanAgainBtn}
            onPress={() => navigation.navigate(result.type === 'IMAGE' ? 'ImageScan' : 'TextScan')}
          >
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.scanAgainText}>Scan Another</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => navigation.navigate('HistoryTab')}
          >
            <Ionicons name="time" size={16} color="#090D16" />
            <Text style={styles.historyBtnText}>View in History</Text>
          </TouchableOpacity>
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
    paddingVertical: 12,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16,
  },
  returnBtn: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  returnBtnText: {
    color: '#090D16',
    fontWeight: '800',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0F1626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#0F1626',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 19,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  metaTime: {
    fontSize: 11,
    color: '#64748b',
  },
  metaConf: {
    fontSize: 11,
    color: '#06b6d4',
    fontWeight: '700',
  },
  payloadTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  imagePreviewWrapper: {
    backgroundColor: '#090D16',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  payloadImage: {
    width: '100%',
    height: 180,
  },
  imageCaption: {
    padding: 8,
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  textPayloadBox: {
    backgroundColor: '#090D16',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  payloadText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  scanAgainBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scanAgainText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  historyBtn: {
    flex: 1.2,
    height: 48,
    backgroundColor: '#06b6d4',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  historyBtnText: {
    color: '#090D16',
    fontSize: 13,
    fontWeight: '800',
  },
});
