import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentUser, logout } = useAuth();
  const { stats } = useHistory();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of VerifyAI?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive', 
        onPress: async () => {
          await logout();
        } 
      },
    ]);
  };

  const name = currentUser?.name || 'Puneeth';
  const email = currentUser?.email || 'puneeth@example.com';
  const phone = currentUser?.phone || 'Not provided';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Account Profile</Text>

        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>

          <Text style={styles.userName}>{name}</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#06b6d4" />
            <Text style={styles.verifiedText}>Verified Investigator</Text>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={14} color="#64748b" />
              <Text style={styles.infoText}>{email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color="#64748b" />
              <Text style={styles.infoText}>{phone}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionHeader}>Verification Metrics</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Scans</Text>
            <Text style={styles.metricVal}>{stats.totalScans}</Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardReal]}>
            <Text style={[styles.metricLabel, { color: '#34d399' }]}>Real 100/100</Text>
            <Text style={[styles.metricVal, { color: '#10b981' }]}>{stats.realCount}</Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardFake]}>
            <Text style={[styles.metricLabel, { color: '#fb7185' }]}>Fake 0/100</Text>
            <Text style={[styles.metricVal, { color: '#f43f5e' }]}>{stats.fakeCount}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Trust Rating</Text>
            <Text style={[styles.metricVal, { color: '#38bdf8' }]}>{stats.trustRating}%</Text>
          </View>
        </View>

        {/* Security Overview */}
        <Text style={styles.sectionHeader}>Security Model</Text>

        <View style={styles.securityCard}>
          <View style={styles.secItem}>
            <Ionicons name="lock-closed" size={18} color="#10b981" />
            <View style={styles.secTextCol}>
              <Text style={styles.secTitle}>Passwordless Security</Text>
              <Text style={styles.secDesc}>
                Zero passwords stored. All sessions authenticate via One-Time Cryptographic Passwords.
              </Text>
            </View>
          </View>

          <View style={styles.secDivider} />

          <View style={styles.secItem}>
            <Ionicons name="server" size={18} color="#06b6d4" />
            <View style={styles.secTextCol}>
              <Text style={styles.secTitle}>Firebase Firestore Storage</Text>
              <Text style={styles.secDesc}>
                Your scan records are privately isolated under your registered email in the cloud.
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#f43f5e" />
          <Text style={styles.logoutText}>Logout of VerifyAI</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: '#0F1626',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#091528',
    borderWidth: 2,
    borderColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    marginBottom: 14,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
  },
  infoList: {
    width: '100%',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0F1626',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricCardReal: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  metricCardFake: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  securityCard: {
    backgroundColor: '#0F1626',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  secItem: {
    flexDirection: 'row',
    gap: 12,
  },
  secTextCol: {
    flex: 1,
  },
  secTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  secDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  secDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    height: 48,
    borderRadius: 16,
  },
  logoutText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '800',
  },
});
