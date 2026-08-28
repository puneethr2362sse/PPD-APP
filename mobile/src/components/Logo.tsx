import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Sparkles } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false }) => {
  const iconSize = size === 'sm' ? 24 : size === 'md' ? 32 : 44;
  const fontSize = size === 'sm' ? 18 : size === 'md' ? 24 : 32;

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <View style={styles.iconInner}>
          <Ionicons name="shield-checkmark" size={iconSize} color="#06b6d4" />
        </View>
      </View>

      <View style={styles.textColumn}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandText, { fontSize }]}>Verify</Text>
          <Text style={[styles.aiText, { fontSize }]}>AI</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CORE</Text>
          </View>
        </View>
        {showTagline && (
          <Text style={styles.tagline}>
            Neural Fact-Checking & Deepfake Forensics
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconWrapper: {
    padding: 2,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  iconInner: {
    backgroundColor: '#0F1626',
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flexDirection: 'column',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandText: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  aiText: {
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#a5b4fc',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tagline: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
});
