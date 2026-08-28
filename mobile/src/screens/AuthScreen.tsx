import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { startRegister, startLogin } = useAuth();

  const handleRegister = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!registerEmail.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const res = await startRegister(name, registerEmail, phone);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed.');
      return;
    }

    navigation.navigate('OtpScreen', { email: registerEmail.trim().toLowerCase(), purpose: 'register' });
  };

  const handleLogin = async () => {
    setError('');
    if (!loginEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    const res = await startLogin(loginEmail);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Login failed.');
      return;
    }

    navigation.navigate('OtpScreen', { email: loginEmail.trim().toLowerCase(), purpose: 'login' });
  };

  const autofillDemo = () => {
    setActiveTab('login');
    setLoginEmail('puneeth@example.com');
    setError('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Top Logo */}
          <View style={styles.header}>
            <Logo size="lg" showTagline={true} />
            <View style={styles.passwordlessPill}>
              <Ionicons name="key" size={14} color="#06b6d4" />
              <Text style={styles.passwordlessText}>100% Passwordless Authentication</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Tab Bar */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'login' && styles.tabButtonActive]}
                onPress={() => {
                  setActiveTab('login');
                  setError('');
                }}
              >
                <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>
                  Login
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'register' && styles.tabButtonActive]}
                onPress={() => {
                  setActiveTab('register');
                  setError('');
                }}
              >
                <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#f43f5e" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Registered Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. puneeth@example.com"
                      placeholderTextColor="#475569"
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Demo Helper Box */}
                <View style={styles.demoHelper}>
                  <Text style={styles.demoText}>
                    Demo account: <Text style={styles.demoEmail}>puneeth@example.com</Text>
                  </Text>
                  <TouchableOpacity onPress={autofillDemo}>
                    <Text style={styles.autofillBtn}>Autofill</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Send OTP & Login</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* REGISTER FORM */}
            {activeTab === 'register' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name <Text style={styles.req}>*</Text></Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Puneeth"
                      placeholderTextColor="#475569"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address <Text style={styles.req}>*</Text></Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. puneeth@example.com"
                      placeholderTextColor="#475569"
                      value={registerEmail}
                      onChangeText={setRegisterEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number (Optional)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="+1 (555) 000-0000"
                      placeholderTextColor="#475569"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Continue to Verification</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer badge */}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={14} color="#10b981" />
            <Text style={styles.footerText}>Encrypted Session • Zero Passwords • Firebase</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  passwordlessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    marginTop: 14,
  },
  passwordlessText: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#0F1626',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#090D16',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#06b6d4',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#090D16',
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
    marginBottom: 16,
  },
  errorText: {
    color: '#fb7185',
    fontSize: 12,
    flex: 1,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  req: {
    color: '#06b6d4',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#FFFFFF',
    fontSize: 14,
  },
  demoHelper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090D16',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  demoText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  demoEmail: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  autofillBtn: {
    color: '#06b6d4',
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06b6d4',
    height: 50,
    borderRadius: 16,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#090D16',
    fontSize: 14,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: '#64748b',
  },
});
