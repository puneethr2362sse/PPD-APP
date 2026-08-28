import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { api } from '../services/api';

const SAMPLE_CLAIMS = [
  {
    type: 'FAKE',
    label: 'Fake Hoax Claim',
    text: 'BREAKING: Secret cure discovered that completely eliminates all cancer and diabetes in 48 hours without medicine, but government is hiding it from public. Share before it gets deleted!',
  },
  {
    type: 'REAL',
    label: 'Verified Scientific News',
    text: 'NASA announced that spectroscopic observations from the James Webb Space Telescope have detected methane and carbon dioxide in the atmosphere of habitable-zone exoplanet K2-18 b.',
  }
];

export const TextScanScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [text, setText] = useState('');
  const [scanning, setScanning] = useState(false);

  const { currentUser } = useAuth();
  const { addScan } = useHistory();

  useEffect(() => {
    if (route.params?.prefilledText) {
      setText(route.params.prefilledText);
    }
  }, [route.params]);

  const handleScan = async () => {
    const clean = text.trim();
    if (!clean) {
      Alert.alert('Empty Content', 'Please enter or paste text to verify.');
      return;
    }

    setScanning(true);

    try {
      const res = await api.post('/verify/text', {
        text: clean,
        email: currentUser?.email || 'demo@example.com',
      });

      setScanning(false);

      if (res.success && res.result) {
        addScan(res.result);
        navigation.navigate('Result', { result: res.result });
      } else {
        Alert.alert('Scan Failed', res.error || 'Unable to complete verification.');
      }
    } catch (err: any) {
      setScanning(false);
      Alert.alert('Connection Error', 'Could not reach backend verification server.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Text Verification</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Paste or Type News / Claim</Text>
            {text.length > 0 && (
              <TouchableOpacity onPress={() => setText('')}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={styles.textArea}
            placeholder="Type or paste any viral news article, WhatsApp claim, or headline here..."
            placeholderTextColor="#475569"
            multiline={true}
            numberOfLines={6}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />

          <View style={styles.charCount}>
            <Text style={styles.charText}>{text.length} characters</Text>
          </View>

          <TouchableOpacity
            style={[styles.scanBtn, (!text.trim() || scanning) && styles.btnDisabled]}
            onPress={handleScan}
            disabled={!text.trim() || scanning}
          >
            {scanning ? (
              <>
                <ActivityIndicator color="#090D16" size="small" />
                <Text style={styles.scanBtnText}>Analyzing Veracity...</Text>
              </>
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={18} color="#090D16" />
                <Text style={styles.scanBtnText}>Run Fact-Check Scan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Test Samples */}
        <Text style={styles.sampleHeader}>Quick Test Demo Samples (Tap to load):</Text>

        <View style={styles.samplesList}>
          {SAMPLE_CLAIMS.map((sample, idx) => {
            const isReal = sample.type === 'REAL';
            return (
              <TouchableOpacity
                key={idx}
                style={styles.sampleCard}
                onPress={() => setText(sample.text)}
                activeOpacity={0.8}
              >
                <View style={styles.sampleTop}>
                  <View style={[styles.sampleBadge, isReal ? styles.badgeReal : styles.badgeFake]}>
                    <Text style={[styles.sampleBadgeText, { color: isReal ? '#34d399' : '#fb7185' }]}>
                      {sample.label}
                    </Text>
                  </View>
                  <Text style={styles.loadText}>Load ↗</Text>
                </View>
                <Text style={styles.sampleText} numberOfLines={2}>{sample.text}</Text>
              </TouchableOpacity>
            );
          })}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#0F1626',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  clearText: {
    fontSize: 12,
    color: '#f43f5e',
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: '#090D16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    fontSize: 14,
    padding: 14,
    minHeight: 120,
    lineHeight: 20,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 6,
    marginBottom: 12,
  },
  charText: {
    fontSize: 10,
    color: '#64748b',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06b6d4',
    height: 48,
    borderRadius: 16,
  },
  scanBtnText: {
    color: '#090D16',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    backgroundColor: '#1e293b',
    opacity: 0.6,
  },
  sampleHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 10,
  },
  samplesList: {
    gap: 10,
  },
  sampleCard: {
    backgroundColor: '#0F1626',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sampleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sampleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeReal: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeFake: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  sampleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  loadText: {
    fontSize: 11,
    color: '#06b6d4',
    fontWeight: '700',
  },
  sampleText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
  },
});
