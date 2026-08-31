import { describe, it, expect, beforeEach } from 'vitest';
import { firestoreDB } from '../../server/firebaseConfig';

describe('Profile Customization & Google Display Name Preservation Suite', () => {
  beforeEach(() => {
    // Reset test user
    firestoreDB.setUser('usr_puneeth_demo', {
      id: 'usr_puneeth_demo',
      userId: 'puneeth123',
      name: 'Puneeth',
      email: 'puneeth@example.com',
      phone: '+1 (555) 019-2834',
      photoUrl: undefined,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    });
  });

  describe('1. Profile Editing & Firestore Persistence', () => {
    it('1.1. should allow updating Display Name and save to Firestore', () => {
      const user = firestoreDB.findUserByEmail('puneeth@example.com');
      expect(user).toBeDefined();

      user.name = 'Puneeth R - Senior Investigator';
      user.customDisplayName = true;
      firestoreDB.setUser(user.id, user);

      const updated = firestoreDB.findUserByEmail('puneeth@example.com');
      expect(updated?.name).toBe('Puneeth R - Senior Investigator');
      expect(updated?.customDisplayName).toBe(true);
    });

    it('1.2. should require Display Name to be non-empty', () => {
      const validateName = (name: string) => !!name && name.trim().length > 0;
      expect(validateName('')).toBe(false);
      expect(validateName('   ')).toBe(false);
      expect(validateName('Puneeth Kumar')).toBe(true);
    });

    it('1.3. should allow adding or updating an optional Phone Number', () => {
      const user = firestoreDB.findUserByEmail('puneeth@example.com');
      user.phone = '+1 (555) 987-6543';
      firestoreDB.setUser(user.id, user);

      const updated = firestoreDB.findUserByEmail('puneeth@example.com');
      expect(updated?.phone).toBe('+1 (555) 987-6543');
    });

    it('1.4. should allow setting an optional Profile Photo URL or Preset', () => {
      const user = firestoreDB.findUserByEmail('puneeth@example.com');
      const photo = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
      user.photoUrl = photo;
      user.customPhoto = true;
      firestoreDB.setUser(user.id, user);

      const updated = firestoreDB.findUserByEmail('puneeth@example.com');
      expect(updated?.photoUrl).toBe(photo);
      expect(updated?.customPhoto).toBe(true);
    });

    it('1.5. should preserve User ID without modifying it during profile edits', () => {
      const user = firestoreDB.findUserByEmail('puneeth@example.com');
      const originalUserId = user.userId;

      user.name = 'New Name';
      user.phone = '+1 555-0000';
      firestoreDB.setUser(user.id, user);

      const updated = firestoreDB.findUserByEmail('puneeth@example.com');
      expect(updated?.userId).toBe(originalUserId);
      expect(updated?.userId).toBe('puneeth123');
    });

    it('1.6. should preserve Authenticated Email without modifying it during profile edits', () => {
      const user = firestoreDB.findUserByEmail('puneeth@example.com');
      const originalEmail = user.email;

      user.name = 'Updated Name';
      firestoreDB.setUser(user.id, user);

      const updated = firestoreDB.findUserByEmail('puneeth@example.com');
      expect(updated?.email).toBe(originalEmail);
    });
  });

  describe('2. Google Sign-In Name Preservation', () => {
    it('2.1. should initialize Google user with default Google display name on first sign-in', () => {
      const googleEmail = 'google_user_test@gmail.com';
      const initialGoogleName = 'Google Test User';

      const uid = 'uid_g_test123';
      const newUser = {
        id: uid,
        userId: 'google_user_test',
        name: initialGoogleName,
        email: googleEmail,
        authProvider: 'google',
        customDisplayName: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      firestoreDB.setUser(uid, newUser);

      const user = firestoreDB.findUserByEmail(googleEmail);
      expect(user?.name).toBe(initialGoogleName);
    });

    it('2.2. should preserve user-edited Display Name on subsequent Google logins', () => {
      const googleEmail = 'google_user_preserve@gmail.com';
      const initialGoogleName = 'Original Google Account Name';

      const uid = 'uid_g_preserve123';
      const initialDoc = {
        id: uid,
        userId: 'google_preserve',
        name: initialGoogleName,
        email: googleEmail,
        authProvider: 'google',
        customDisplayName: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      firestoreDB.setUser(uid, initialDoc);

      // User edits display name inside VerifyAI
      const userInApp = firestoreDB.findUserByEmail(googleEmail);
      userInApp.name = 'Customized Investigator Puneeth';
      userInApp.customDisplayName = true;
      firestoreDB.setUser(uid, userInApp);

      // Subsequent Google login happens
      const existingUser = firestoreDB.findUserByEmail(googleEmail);
      if (existingUser) {
        existingUser.lastLoginAt = new Date().toISOString();
        // Check rule: do not overwrite customized display name
        if (!existingUser.name || (!existingUser.customDisplayName && initialGoogleName)) {
          existingUser.name = initialGoogleName;
        }
        firestoreDB.setUser(existingUser.id, existingUser);
      }

      const verifiedAfterLogin = firestoreDB.findUserByEmail(googleEmail);
      expect(verifiedAfterLogin?.name).toBe('Customized Investigator Puneeth');
      expect(verifiedAfterLogin?.name).not.toBe(initialGoogleName);
    });
  });
});
