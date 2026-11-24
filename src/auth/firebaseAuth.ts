import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from 'firebase/auth';

export class AuthConfigError extends Error {
  constructor() {
    super(
      'Firebase Auth is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID.'
    );
    this.name = 'AuthConfigError';
  }
}

export class SignInRequiredError extends Error {
  constructor() {
    super('Sign in required before calling the property backend.');
    this.name = 'SignInRequiredError';
  }
}

interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

let firebaseApp: FirebaseApp | null = null;

export function readFirebaseWebConfig(): FirebaseWebConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim() ?? '';
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? '';
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() ?? '';
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim() ?? '';
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return { apiKey, authDomain, projectId, appId };
}

export function isAuthConfigured(): boolean {
  return readFirebaseWebConfig() !== null;
}

function getFirebaseAuth(): Auth {
  const config = readFirebaseWebConfig();
  if (!config) throw new AuthConfigError();
  if (!firebaseApp) {
    firebaseApp = initializeApp(config);
  }
  return getAuth(firebaseApp);
}

export function subscribeAuth(listener: (user: User | null) => void): () => void {
  if (!isAuthConfigured()) {
    listener(null);
    return () => undefined;
  }
  return onAuthStateChanged(getFirebaseAuth(), listener);
}

export async function signInWithGoogle(): Promise<void> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function signOutCurrentUser(): Promise<void> {
  if (!isAuthConfigured()) return;
  await firebaseSignOut(getFirebaseAuth());
}

export async function getIdToken(): Promise<string> {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new SignInRequiredError();
  return user.getIdToken();
}
