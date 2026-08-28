import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../components/Logo';
import { OtpInput } from '../components/OtpInput';
import { useAuth } from '../context/AuthContext';

export const OtpScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { pendingOTP, verifyOTP, resendOTP } = useAuth();

  const targetEmail = route.params?.email || pendingOTP?.email || 'your email';
  const demoCode = pendingOTP?.code || '4837';

  const handleVerify = async (codeToVerify: string = otpValue) => {
    setError('');
    if (codeToVerify.length < 4) {
      setError('Please enter the complete 4-digit OTP code.');
      return;
    }

    setLoading(true);
    const res = await verifyOTP(codeToVerify);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Verification failed.');
      return;
    }

    // React Navigation will automatically switch to MainTabs based on isAuthenticated state!
  };

  const handleAutoFill = () => {
    if (demoCode) {
      setOtpValue(demoCode);
      setError('');
      setTimeout(() => {
        handleVerify(demoCode);
      }, 300);
    }
  };

  const handleResend = async () => {
    setError('');
    setOtpValue('');
    setLoading(true);
    const res = await resendOTP();
    setLoading(false);
    if (res.success) {
      Alert.alert('OTP Sent', 'A new verification code has been dispatched.');
    } else {
      setError(res.error || 'Failed to resend OTP.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={styles.backText}>Change Email</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Logo size="md" />
        </View>

        {/* OTP Card */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="key" size={24} color="#06b6d4" />
          </View>

          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We sent a secure 4-digit code to{' '}
            <Text style={styles.emailHighlight}>{targetEmail}</Text>
          </Text>

          {/* DEMO OTP BANNER */}
          <View style={styles.demoBanner}>
            <View style={styles.demoBannerLeft}>
              <Text style={styles.demoBannerLabel}>DEMO MODE OTP</Text>
              <Text style={styles.demoBannerCode}>{demoCode}</Text>
            </View>

            <TouchableOpacity style={styles.autoFillBtn} onPress={handleAutoFill}>
              <Text style={styles.autoFillText}>Auto-fill</Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#f43f5e" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 4-Box Input */}
          <OtpInput
            value={otpValue}
            onChange={(val) => {
              setOtpValue(val);
              setError('');
            }}
            onComplete={(completedVal) => {
              handleVerify(completedVal);
            }}
            disabled={loading}
            hasError={!!error}
          />

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyBtn,
              (otpValue.length < 4 || loading) && styles.btnDisabled,
            ]}
            onPress={() => handleVerify()}
            disabled={otpValue.length < 4 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#090D16" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#090D16" />
                <Text style={styles.verifyBtnText}>Verify & Enter Dashboard</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Resend Link */}
          <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={loading}>
            <Ionicons name="refresh" size={14} color="#38bdf8" />
            <Text style={styles.resendText}>Didn't receive? Request new OTP</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    minHeight: '100%',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#0F1626',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  emailHighlight: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  demoBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#091528',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    marginBottom: 16,
  },
  demoBannerLeft: {
    flexDirection: 'column',
  },
  demoBannerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#06b6d4',
    letterSpacing: 0.5,
  },
  demoBannerCode: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  autoFillBtn: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  autoFillText: {
    color: '#090D16',
    fontSize: 12,
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    width: '100%',
  },
  errorText: {
    color: '#fb7185',
    fontSize: 12,
    flex: 1,
  },
  verifyBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#06b6d4',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  verifyBtnText: {
    color: '#090D16',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    backgroundColor: '#1e293b',
    opacity: 0.6,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  resendText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
});
