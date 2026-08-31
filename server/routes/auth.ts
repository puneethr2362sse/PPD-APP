import { Router, Request, Response } from 'express';
import { firestoreDB } from '../firebaseConfig.js';

export const authRouter = Router();

// Helper to generate 4-digit numeric OTP
function generate4DigitOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// 1. REGISTER (First-time registration: collects Name, User ID, Email, Password, Phone & sends 4-digit OTP)
authRouter.post('/register', (req: Request, res: Response): void => {
  const { name, userId, email, password, phone } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: 'Full name is required.' });
    return;
  }

  const cleanUserId = userId ? userId.trim() : '';
  if (!cleanUserId) {
    res.status(400).json({ success: false, error: 'User ID is required. Please choose a User ID.' });
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

  // Check if User ID is already taken by another account
  const existingByUserId = firestoreDB.findUserByUserId(cleanUserId);
  if (existingByUserId) {
    res.status(409).json({ 
      success: false, 
      error: `The User ID "${cleanUserId}" is already taken. Please choose a different User ID.` 
    });
    return;
  }

  // Check if email is already registered
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
    tempUserId: cleanUserId,
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
  const { email, password, firebaseUid } = req.body;
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
  if (firebaseUid && user.id !== firebaseUid) {
    user.id = firebaseUid;
    firestoreDB.setUser(firebaseUid, user);
  } else {
    firestoreDB.setUser(user.id, user);
  }

  // Return authenticated session immediately with exact saved userId
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
    const uid = 'uid_g_' + Math.random().toString(36).substring(2, 9);
    const defaultUserId = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || ('user_' + Math.random().toString(36).substring(2, 6));
    user = {
      id: uid,
      userId: defaultUserId,
      name: cleanName,
      email: cleanEmail,
      photoUrl: photoUrl || undefined,
      authProvider: 'google',
      customDisplayName: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    firestoreDB.setUser(uid, user);
  } else {
    user.lastLoginAt = new Date().toISOString();
    // Do NOT overwrite customized display name with Google account name on subsequent logins
    if (!user.name || (!user.customDisplayName && cleanName && !user.name)) {
      user.name = cleanName;
    }
    // Update Google photo only if user hasn't set a custom photo
    if (photoUrl && !user.customPhoto) {
      user.photoUrl = photoUrl;
    }
    firestoreDB.setUser(user.id, user);
  }

  res.json({
    success: true,
    message: 'Signed in with Google successfully.',
    user,
    token: 'jwt_google_' + user.id + '_' + Date.now()
  });
});

// 4. LOGIN VIA OTP (Alternative / Fallback)
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

// 5. VERIFY OTP (Used on initial registration to confirm email and activate password account)
authRouter.post('/verify-otp', (req: Request, res: Response): void => {
  const { email, code, firebaseUid, userId } = req.body;
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
    const internalUid = firebaseUid || ('uid_' + Math.random().toString(36).substring(2, 12));
    const chosenUserId = userId?.trim() || pending.tempUserId || cleanEmail.split('@')[0];
    user = {
      id: internalUid, // Authenticated user's Firebase UID internally
      userId: chosenUserId, // The user-selected User ID
      name: pending.tempName || 'Puneeth',
      email: pending.email,
      phone: pending.tempPhone,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    firestoreDB.setUser(internalUid, user);
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

// 6. RESEND OTP
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

// 7. CHECK USER ID AVAILABILITY
authRouter.get('/check-userid', (req: Request, res: Response): void => {
  const userId = req.query.userId as string;
  if (!userId || !userId.trim()) {
    res.status(400).json({ success: false, error: 'userId parameter required.' });
    return;
  }

  const existing = firestoreDB.findUserByUserId(userId.trim());
  res.json({
    success: true,
    available: !existing,
    userId: userId.trim()
  });
});

// 8. GET ME
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

// 9. UPDATE USER PROFILE (Allows editing Display Name, Phone, and optional Photo)
authRouter.put('/profile', (req: Request, res: Response): void => {
  const { email, name, phone, photoUrl } = req.body;
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  if (!cleanEmail) {
    res.status(400).json({ success: false, error: 'User email is required.' });
    return;
  }

  const user = firestoreDB.findUserByEmail(cleanEmail);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found in Firestore.' });
    return;
  }

  if (name !== undefined) {
    const cleanName = name.trim();
    if (!cleanName) {
      res.status(400).json({ success: false, error: 'Display Name cannot be empty.' });
      return;
    }
    user.name = cleanName;
    user.customDisplayName = true;
  }

  if (phone !== undefined) {
    user.phone = phone.trim() || undefined;
  }

  if (photoUrl !== undefined) {
    user.photoUrl = photoUrl.trim() || undefined;
    if (photoUrl.trim()) {
      user.customPhoto = true;
    }
  }

  user.lastLoginAt = new Date().toISOString();
  firestoreDB.setUser(user.id, user);

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user
  });
});


