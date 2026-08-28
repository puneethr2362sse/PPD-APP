import { Router, Request, Response } from 'express';
import { firestoreDB } from '../firebaseConfig.js';

export const authRouter = Router();

// Helper to generate 4-digit numeric OTP
function generate4DigitOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// 1. REGISTER
authRouter.post('/register', (req: Request, res: Response): void => {
  const { name, email, phone } = req.body;

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

  // Check if already registered
  const existingUser = firestoreDB.findUserByEmail(cleanEmail);
  if (existingUser) {
    res.status(409).json({ 
      success: false, 
      error: `An account with ${cleanEmail} is already registered. Please login instead.` 
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
    tempPhone: phone?.trim() || undefined,
  };

  firestoreDB.setOTP(cleanEmail, otpDoc);

  res.json({
    success: true,
    message: 'OTP sent to registered email.',
    otpState: otpDoc
  });
});

// 2. LOGIN (Passwordless)
authRouter.post('/login', (req: Request, res: Response): void => {
  const { email } = req.body;
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    return;
  }

  const user = firestoreDB.findUserByEmail(cleanEmail);
  if (!user) {
    res.status(404).json({ 
      success: false, 
      error: `No registered account found for "${cleanEmail}". Please register first.` 
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
    message: 'OTP generated and sent.',
    otpState: otpDoc
  });
});

// 3. VERIFY OTP
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
      name: pending.tempName || 'User',
      email: pending.email,
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
    token: 'jwt_mock_' + user.id + '_' + Date.now()
  });
});

// 4. RESEND OTP
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

// 5. GET ME
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
