import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  Auth
} from 'firebase/auth';

// Your Real Firebase Client Configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBEwP1Y_7Dg7l4MfjQxpWpodGXI8Ak6Ho0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "verifyai-c85c7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "verifyai-c85c7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "verifyai-c85c7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "758840428332",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:758840428332:web:c6e027c615d0fe5d4fce89"
};

// Initialize Firebase App instance safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface GoogleAuthResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
  email?: string;
  name?: string;
  photoUrl?: string;
  idToken?: string;
}

/**
 * Executes genuine Firebase Google Sign-In with Popup
 */
export async function signInWithGooglePopup(): Promise<GoogleAuthResult> {
  try {
    const userCredential = await signInWithPopup(auth, googleAuthProvider);
    const user = userCredential.user;

    if (!user || !user.email) {
      return {
        success: false,
        error: 'No verified email returned from Google authentication.'
      };
    }

    const idToken = await user.getIdToken();

    return {
      success: true,
      email: user.email.toLowerCase(),
      name: user.displayName || 'Google User',
      photoUrl: user.photoURL || undefined,
      idToken: idToken || undefined
    };
  } catch (err: any) {
    if (
      err.code === 'auth/popup-closed-by-user' ||
      err.code === 'auth/cancelled-popup-request' ||
      err.code === 'auth/user-cancelled'
    ) {
      return {
        success: false,
        cancelled: true,
        error: 'Google sign-in was cancelled by the user.'
      };
    }

    if (err.code === 'auth/popup-blocked') {
      return {
        success: false,
        error: 'Google Sign-In popup was blocked by your browser. Please allow popups for this site and try again.'
      };
    }

    if (err.code === 'auth/unauthorized-domain') {
      return {
        success: false,
        error: `Domain "${window.location.hostname}" is not authorized. Please add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized domains.`
      };
    }

    return {
      success: false,
      error: err.message || 'Google authentication failed.'
    };
  }
}

/**
 * Signs in with Real Firebase Email + Password
 */
export async function signInWithFirebaseEmail(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const fbUser = userCredential.user;
    return {
      success: true,
      user: {
        id: fbUser.uid,
        name: fbUser.displayName || 'User',
        email: fbUser.email?.toLowerCase() || email.toLowerCase(),
        createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      }
    };
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      return { success: false, error: 'Incorrect email or password. Please verify and try again.' };
    }
    if (err.code === 'auth/invalid-email') {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    return { success: false, error: err.message || 'Firebase login failed.' };
  }
}

/**
 * Creates Real Firebase User with Email + Password & Display Name
 */
export async function registerWithFirebaseEmail(name: string, email: string, password: string, phone?: string, userId?: string): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

    // Update display name
    await updateProfile(fbUser, { displayName: cleanName });

    return {
      success: true,
      user: {
        id: fbUser.uid,
        userId: userId?.trim() || cleanEmail.split('@')[0],
        name: cleanName,
        email: cleanEmail,
        phone: phone?.trim(),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      }
    };
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      return { success: false, error: `An account with ${email} already exists in Firebase. Please sign in instead.` };
    }
    if (err.code === 'auth/weak-password') {
      return { success: false, error: 'Password should be at least 6 characters.' };
    }
    return { success: false, error: err.message || 'Firebase account creation failed.' };
  }
}

export async function signOutFirebase(): Promise<void> {
  try {
    if (auth) {
      await fbSignOut(auth);
    }
  } catch (e) {
    // Ignore signout cleanup errors
  }
}
