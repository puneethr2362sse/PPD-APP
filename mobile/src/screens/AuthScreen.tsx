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
  
  // Registration fields
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginWithPassword, loginWithGoogle, startRegister } = useAuth();

  // Direct login with password
  const handleLogin = async () => {
    setError('');
    if (!loginEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    const res = await loginWithPassword(loginEmail, loginPassword);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Login failed.');
      return;
    }
  };

  // Sign in with Google
  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    setGoogleLoading(false);

    if (!res.success) {
      setError(res.error || 'Google sign-in failed.');
      return;
    }
  };

  // Initial registration with OTP confirmation
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
    if (!registerPassword || registerPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const res = await startRegister(name, registerEmail, registerPassword, phone);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed.');
      return;
    }

    navigation.navigate('OtpScreen', { email: registerEmail.trim().toLowerCase(), purpose: 'register' });
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
              <Ionicons name="lock-closed" size={14} color="#06b6d4" />
              <Text style={styles.passwordlessText}>Secure Authentication • Firebase Cloud</Text>
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
                  Sign In
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

            {/* GOOGLE SIGN IN BUTTON */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#090D16" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                  <Text style={styles.googleButtonText}>
                    {activeTab === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 1. LOGIN FORM (Email + Password) */}
            {activeTab === 'login' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. yourname@example.com"
                      placeholderTextColor="#475569"
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#475569"
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry={!showLoginPassword}
                    />
                    <TouchableOpacity onPress={() => setShowLoginPassword(!showLoginPassword)} style={{ padding: 6 }}>
                      <Ionicons name={showLoginPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <ActivityIndicator color="#090D16" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={16} color="#090D16" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 2. REGISTER FORM (First-time OTP confirmation) */}
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
                      placeholder="e.g. yourname@example.com"
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
                  <Text style={styles.label}>Create Password <Text style={styles.req}>*</Text></Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor="#475569"
                      value={registerPassword}
                      onChangeText={setRegisterPassword}
                      secureTextEntry={!showRegisterPassword}
                    />
                    <TouchableOpacity onPress={() => setShowRegisterPassword(!showRegisterPassword)} style={{ padding: 6 }}>
                      <Ionicons name={showRegisterPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
                    </TouchableOpacity>
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

                <View style={styles.otpNoticeBox}>
                  <Ionicons name="checkmark-circle" size={14} color="#06b6d4" />
                  <Text style={styles.otpNoticeText}>
                    First-time registration sends a 4-digit OTP to confirm your email, then your password is saved for direct login.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <ActivityIndicator color="#090D16" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Create Account & Verify OTP</Text>
                      <Ionicons name="arrow-forward" size={16} color="#090D16" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer badge */}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={14} color="#10b981" />
            <Text style={styles.footerText}>Encrypted Google OAuth & Password Security • Firebase</Text>
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
    marginBottom: 16,
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  form: {
    gap: 14,
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
  otpNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  otpNoticeText: {
    fontSize: 10,
    color: '#38bdf8',
    flex: 1,
    lineHeight: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06b6d4',
    height: 50,
    borderRadius: 16,
    marginTop: 4,
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
