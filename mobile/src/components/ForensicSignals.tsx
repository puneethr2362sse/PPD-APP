import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ForensicSignal } from '../types';

interface ForensicSignalsProps {
  signals: ForensicSignal[];
}

export const ForensicSignals: React.FC<ForensicSignalsProps> = ({ signals }) => {
  return (
    <View style={styles.container}>
      {signals.map((sig, idx) => {
        const isPassed = sig.status === 'passed';
        const isFailed = sig.status === 'failed';

        return (
          <View key={idx} style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.titleRow}>
                <Ionicons
                  name={isPassed ? 'checkmark-circle' : isFailed ? 'close-circle' : 'warning'}
                  size={16}
                  color={isPassed ? '#10b981' : isFailed ? '#f43f5e' : '#f59e0b'}
                />
                <Text style={styles.signalName}>{sig.name}</Text>
              </View>

              <View style={styles.scoreRow}>
                <View
                  style={[
                    styles.statusPill,
                    isPassed ? styles.pillPassed : isFailed ? styles.pillFailed : styles.pillWarning,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: isPassed ? '#34d399' : isFailed ? '#fb7185' : '#fcd34d' },
                    ]}
                  >
                    {sig.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.scoreText}>{sig.score}/100</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.max(5, sig.score)}%`,
                    backgroundColor: isPassed ? '#10b981' : isFailed ? '#f43f5e' : '#f59e0b',
                  },
                ]}
              />
            </View>

            <Text style={styles.detailText}>{sig.detail}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  card: {
    backgroundColor: '#0F1626',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  signalName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillPassed: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pillFailed: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  pillWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  barBg: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  detailText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
});
