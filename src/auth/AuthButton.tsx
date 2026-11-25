import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  isAuthConfigured,
  signInWithGoogle,
  signOutCurrentUser,
  subscribeAuth,
} from './firebaseAuth.ts';

const CONFIG_HINT =
  'Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID to enable sign-in.';

export function AuthButton(): React.ReactElement {
  const configured = isAuthConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!configured);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return undefined;
    return subscribeAuth((next) => {
      setUser(next);
      setReady(true);
    });
  }, [configured]);

  const onClick = async () => {
    setError(null);
    setBusy(true);
    try {
      if (user) {
        await signOutCurrentUser();
      } else {
        await signInWithGoogle();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const label = !configured
    ? 'Sign-in unavailable'
    : !ready || busy
      ? 'Sign in'
      : user
        ? 'Sign out'
        : 'Sign in';

  return (
    <button
      type="button"
      onClick={() => {
        void onClick();
      }}
      disabled={!configured || !ready || busy}
      title={error ?? (configured ? (user ? 'Sign out' : 'Sign in with Google') : CONFIG_HINT)}
      className="px-3 py-1.5 border border-slate-200 bg-white text-slate-900 text-xs font-semibold rounded hover:bg-slate-50 transition-colors whitespace-nowrap disabled:opacity-60 disabled:hover:bg-white"
    >
      {label}
    </button>
  );
}
