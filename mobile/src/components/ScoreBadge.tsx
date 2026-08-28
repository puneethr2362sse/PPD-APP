import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerificationVerdict } from '../types';

interface ScoreBadgeProps {
  score: 0 | 100 | number;
  verdict: VerificationVerdict;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  verdict,
  size = 'md',
}) => {
  const isReal = verdict === 'REAL' || score >= 50;

  if (size === 'sm') {
    return (
      <View
        style={[
          styles.badgeSm,
          isReal ? styles.badgeSmReal : styles.badgeSmFake,
        ]}
      >
        <Ionicons
          name={isReal ? 'checkmark-circle' : 'close-circle'}
          size={12}
          color={isReal ? '#10b981' : '#f43f5e'}
        />
        <Text
          style={[
            styles.badgeSmText,
            { color: isReal ? '#34d399' : '#fb7185' },
          ]}
        >
          {isReal ? '100/100 REAL' : '0/100 FAKE'}
        </Text>
      </View>
    );
  }

  if (size === 'md') {
    return (
      <View
        style={[
          styles.badgeMd,
          isReal ? styles.badgeMdReal : styles.badgeMdFake,
        ]}
      >
        <View
          style={[
            styles.iconBoxMd,
            { backgroundColor: isReal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)' },
          ]}
        >
          <Ionicons
            name={isReal ? 'shield-checkmark' : 'shield'}
            size={22}
            color={isReal ? '#10b981' : '#f43f5e'}
          />
        </View>
        <View style={styles.badgeMdContent}>
          <Text style={[styles.scoreTextMd, { color: isReal ? '#10b981' : '#f43f5e' }]}>
            {isReal ? '100/100' : '0/100'}
          </Text>
          <Text style={[styles.verdictTextMd, { color: isReal ? '#34d399' : '#fb7185' }]}>
            {isReal ? 'VERIFIED REAL' : 'DETECTED FAKE'}
          </Text>
        </View>
      </View>
    );
  }

  // Large Hero for Result
  return (
    <View
      style={[
        styles.heroCard,
        isReal ? styles.heroCardReal : styles.heroCardFake,
      ]}
    >
      <View
        style={[
          styles.heroIconBox,
          { backgroundColor: isReal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)' },
        ]}
      >
        <Ionicons
          name={isReal ? 'shield-checkmark' : 'alert-circle'}
          size={42}
          color={isReal ? '#10b981' : '#f43f5e'}
        />
      </View>

      <Text style={[styles.heroScore, { color: isReal ? '#10b981' : '#f43f5e' }]}>
        {isReal ? '100/100' : '0/100'}
      </Text>

      <Text style={[styles.heroVerdict, { color: isReal ? '#34d399' : '#fb7185' }]}>
        {isReal ? 'REAL CONTENT' : 'FAKE CONTENT'}
      </Text>

      <Text style={styles.heroSubtext}>
        {isReal
          ? 'Neural models verified claim veracity across authenticated registries.'
          : 'Forensic classifiers detected critical fabrication and disinformation.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeSm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeSmReal: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeSmFake: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  badgeSmText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badgeMd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  badgeMdReal: {
    backgroundColor: '#0c221c',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeMdFake: {
    backgroundColor: '#260d16',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  iconBoxMd: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMdContent: {
    flexDirection: 'column',
  },
  scoreTextMd: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  verdictTextMd: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginVertical: 12,
  },
  heroCardReal: {
    backgroundColor: '#0a1d18',
    borderColor: 'rgba(16, 185, 129, 0.5)',
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  heroCardFake: {
    backgroundColor: '#240a12',
    borderColor: 'rgba(244, 63, 94, 0.5)',
    shadowColor: '#f43f5e',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  heroIconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroScore: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  heroVerdict: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
  },
  heroSubtext: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});
