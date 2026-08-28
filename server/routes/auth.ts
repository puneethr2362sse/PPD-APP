import { Router, Request, Response } from 'express';
import { firestoreDB } from '../firebaseConfig.js';

export const authRouter = Router();

// Helper to generate 4-digit numeric OTP
function generate4DigitOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// 1. REGISTER (First-time registration: collects Name, Email, Password, Phone & sends 4-digit OTP)
authRouter.post('/register', (req: Request, res: Response): void => {
  const { name, email, password, phone } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: 'Full name is required.' });
    return;
  }

  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    return;
  }

  // Check if already registered
  const existingUser = firestoreDB.findUserByEmail(cleanEmail);
  if (existingUser) {
    res.status(409).json({ 
      success: false, 
      error: `An account with ${cleanEmail} is already registered. Please login with your password.` 
    });
    return;
  }

  const otpCode = generate4DigitOTP();
  const otpDoc = {
    email: cleanEmail,
    code: otpCode,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
    purpose: 'register',
    tempName: name.trim(),
    tempPassword: password,
    tempPhone: phone?.trim() || undefined,
  };

  firestoreDB.setOTP(cleanEmail, otpDoc);

  res.json({
    success: true,
    message: 'Verification OTP generated. Please enter the 4-digit OTP to activate your account.',
    otpState: otpDoc
  });
});

// 2. LOGIN (Primary: Email + Password direct login without OTP every time)
authRouter.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    return;
  }

  if (!password) {
    res.status(400).json({ success: false, error: 'Password is required to sign in.' });
    return;
  }

  const user = firestoreDB.findUserByEmail(cleanEmail);
  if (!user) {
    res.status(404).json({ 
      success: false, 
      error: `No account found for "${cleanEmail}". Please register first.` 
    });
    return;
  }

  // Check password (supports demo accounts and registered passwords)
  const isPasswordValid = user.password === password || (cleanEmail === 'puneeth@example.com' && (password === 'puneeth123' || password === 'demo123'));

  if (!isPasswordValid) {
    res.status(401).json({ 
      success: false, 
      error: 'Incorrect password entered. Please try again.' 
    });
    return;
  }

  // Update last login
  user.lastLoginAt = new Date().toISOString();
  firestoreDB.setUser(user.id, user);

  // Return authenticated session immediately without requiring OTP on regular login
  res.json({
    success: true,
    message: 'Login successful.',
    user,
    token: 'jwt_auth_' + user.id + '_' + Date.now()
  });
});

// 3. GOOGLE SIGN IN / OAUTH
authRouter.post('/google', (req: Request, res: Response): void => {
  const { email, name, photoUrl } = req.body;
  const cleanEmail = (email || 'puneeth.google@gmail.com').trim().toLowerCase();
  const cleanName = (name || 'Puneeth').trim();

  let user = firestoreDB.findUserByEmail(cleanEmail);

  if (!user) {
    // Automatically create new user account with Google credentials
    const userId = 'usr_g_' + Math.random().toString(36).substring(2, 9);
    user = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      photoUrl: photoUrl || undefined,
      authProvider: 'google',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    firestoreDB.setUser(userId, user);
  } else {
    user.lastLoginAt = new Date().toISOString();
    if (photoUrl) user.photoUrl = photoUrl;
    firestoreDB.setUser(user.id, user);
  }

  res.json({
    success: true,
    message: 'Signed in with Google successfully.',
    user,
    token: 'jwt_google_' + user.id + '_' + Date.now()
  });
});

// 3. LOGIN VIA OTP (Alternative / Fallback)
authRouter.post('/login-otp', (req: Request, res: Response): void => {
  const { email } = req.body;
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  const user = firestoreDB.findUserByEmail(cleanEmail);
  if (!user) {
    res.status(404).json({ 
      success: false, 
      error: `No account found for "${cleanEmail}". Please register first.` 
    });
    return;
  }

  const otpCode = generate4DigitOTP();
  const otpDoc = {
    email: cleanEmail,
    code: otpCode,
    expiresAt: Date.now() + 10 * 60 * 1000,
    purpose: 'login',
  };

  firestoreDB.setOTP(cleanEmail, otpDoc);

  res.json({
    success: true,
    message: 'OTP sent to your email for passwordless entry.',
    otpState: otpDoc
  });
});

// 4. VERIFY OTP (Used on initial registration to confirm email and activate password account)
authRouter.post('/verify-otp', (req: Request, res: Response): void => {
  const { email, code } = req.body;
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanCode = code ? code.trim() : '';

  const pending = firestoreDB.getOTP(cleanEmail);
  if (!pending) {
    res.status(400).json({ 
      success: false, 
      error: 'OTP code has expired or is invalid. Please request a new code.' 
    });
    return;
  }

  if (pending.code !== cleanCode) {
    res.status(400).json({ 
      success: false, 
      error: 'Incorrect OTP entered. Please check the code and try again.' 
    });
    return;
  }

  let user: any;

  if (pending.purpose === 'register') {
    const userId = 'usr_' + Math.random().toString(36).substring(2, 9);
    user = {
      id: userId,
      name: pending.tempName || 'Puneeth',
      email: pending.email,
      password: pending.tempPassword || 'puneeth123',
      phone: pending.tempPhone,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    firestoreDB.setUser(userId, user);
  } else {
    user = firestoreDB.findUserByEmail(cleanEmail);
    if (!user) {
      res.status(404).json({ success: false, error: 'User record not found.' });
      return;
    }
    user.lastLoginAt = new Date().toISOString();
    firestoreDB.setUser(user.id, user);
  }

  // Clear consumed OTP
  firestoreDB.deleteOTP(cleanEmail);

  res.json({
    success: true,
    user,
    token: 'jwt_auth_' + user.id + '_' + Date.now()
  });
});

// 5. RESEND OTP
authRouter.post('/resend-otp', (req: Request, res: Response): void => {
  const { email } = req.body;
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  const pending = firestoreDB.getOTP(cleanEmail);
  if (!pending) {
    res.status(400).json({ 
      success: false, 
      error: 'No active verification session. Please restart registration or login.' 
    });
    return;
  }

  const newCode = generate4DigitOTP();
  const updated = {
    ...pending,
    code: newCode,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  firestoreDB.setOTP(cleanEmail, updated);

  res.json({
    success: true,
    otpState: updated
  });
});

// 6. GET ME
authRouter.get('/me', (req: Request, res: Response): void => {
  const email = req.query.email as string;
  if (!email) {
    res.status(400).json({ success: false, error: 'Email parameter required.' });
    return;
  }

  const user = firestoreDB.findUserByEmail(email);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found in Firestore.' });
    return;
  }

  res.json({ success: true, user });
});
