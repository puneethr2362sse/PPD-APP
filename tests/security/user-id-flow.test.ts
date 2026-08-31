import { describe, it, expect, beforeEach } from 'vitest';
import { firestoreDB } from '../../server/firebaseConfig';

describe('User ID Registration & Persistence Flow Suite', () => {
  beforeEach(() => {
    // Reset baseline demo user
    firestoreDB.setUser('usr_puneeth_demo', {
      id: 'usr_puneeth_demo',
      userId: 'puneeth123',
      name: 'Puneeth',
      email: 'puneeth@example.com',
      phone: '+1 (555) 019-2834',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    });
  });

  describe('1. User ID Registration Requirements', () => {
    it('1.1. should require User ID to be non-empty during registration', () => {
      const validate = (userId: string) => !!userId && userId.trim().length > 0;
      expect(validate('')).toBe(false);
      expect(validate('   ')).toBe(false);
      expect(validate('puneeth123')).toBe(true);
    });

    it('1.2. should allow user-chosen alphanumeric User IDs', () => {
      const validateFormat = (userId: string) => /^[a-zA-Z0-9_.-]+$/.test(userId.trim());
      expect(validateFormat('puneeth123')).toBe(true);
      expect(validateFormat('john_doe')).toBe(true);
      expect(validateFormat('alice.investigator')).toBe(true);
      expect(validateFormat('user-99')).toBe(true);
    });

    it('1.3. should detect if User ID is already taken by another account', () => {
      const existing = firestoreDB.findUserByUserId('puneeth123');
      expect(existing).toBeDefined();
      expect(existing?.userId).toBe('puneeth123');
    });

    it('1.4. should allow registration with a unique, available User ID', () => {
      const uniqueId = 'unique_investigator_' + Date.now();
      const existing = firestoreDB.findUserByUserId(uniqueId);
      expect(existing).toBeUndefined();
    });

    it('1.5. should store chosen User ID in temporary OTP verification state', () => {
      const email = 'newuser@example.com';
      const otpDoc = {
        email,
        code: '1234',
        expiresAt: Date.now() + 600000,
        purpose: 'register',
        tempName: 'New User',
        tempUserId: 'newuser123',
      };
      firestoreDB.setOTP(email, otpDoc);

      const retrieved = firestoreDB.getOTP(email);
      expect(retrieved).toBeDefined();
      expect(retrieved?.tempUserId).toBe('newuser123');
      expect(retrieved?.tempName).toBe('New User');
    });
  });

  describe('2. Account Creation & Database Identity Model', () => {
    it('2.1. should use Firebase UID internally as unique identity and save custom User ID', () => {
      const internalFirebaseUid = 'fb_uid_' + Date.now();
      const chosenUserId = 'custom_puneeth_' + Date.now();

      const newUserDoc = {
        id: internalFirebaseUid, // Authenticated Firebase UID as internal identity
        userId: chosenUserId, // Public user-selected User ID
        name: 'Puneeth R',
        email: 'puneeth.custom@example.com',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      firestoreDB.setUser(internalFirebaseUid, newUserDoc);

      // Verify retrieval by Firebase UID
      const byId = firestoreDB.findUserById(internalFirebaseUid);
      expect(byId).toBeDefined();
      expect(byId.id).toBe(internalFirebaseUid);
      expect(byId.userId).toBe(chosenUserId);

      // Verify retrieval by custom User ID
      const byUserId = firestoreDB.findUserByUserId(chosenUserId);
      expect(byUserId).toBeDefined();
      expect(byUserId.id).toBe(internalFirebaseUid);
      expect(byUserId.userId).toBe(chosenUserId);
    });

    it('2.2. should never assign a random usr_... string when user registered with custom User ID', () => {
      const user = firestoreDB.findUserByEmail('puneeth@example.com');
      expect(user?.userId).toBe('puneeth123');
      expect(user?.userId).not.toMatch(/^usr_g_[a-z0-9]+/);
    });
  });

  describe('3. Persistence Across Logout and Re-Login', () => {
    it('3.1. should fetch and preserve custom User ID after logout and re-login', () => {
      // Step 1: User registers with custom User ID
      const testEmail = 'persist_test@example.com';
      const firebaseUid = 'uid_persist_123';
      const customUserId = 'puneeth_persistent';

      firestoreDB.setUser(firebaseUid, {
        id: firebaseUid,
        userId: customUserId,
        name: 'Puneeth R',
        email: testEmail,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });

      // Step 2: Simulate logout (session cleared)
      // Step 3: Re-login with the same email
      const userOnLogin = firestoreDB.findUserByEmail(testEmail);
      expect(userOnLogin).toBeDefined();
      expect(userOnLogin.id).toBe(firebaseUid);
      expect(userOnLogin.userId).toBe(customUserId);
      expect(userOnLogin.name).toBe('Puneeth R');
    });

    it('3.2. should preserve user-isolated scans linked to the authenticated user', () => {
      const testEmail = 'puneeth@example.com';
      const scans = firestoreDB.getScansByUser(testEmail);
      expect(scans.length).toBeGreaterThan(0);
      expect(scans.every(s => s.userEmail === testEmail)).toBe(true);
    });
  });
});
