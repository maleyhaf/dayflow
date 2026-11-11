import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseConfigured } from '../../lib/supabase';
import Logo from '../ui/Logo';
import styles from './LoginPage.module.css';

function GoogleLogo() {
  return (
    <svg className={styles.googleLogo} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// Google/Supabase send failures back in the URL, e.g. ?error_description=...
function readUrlError(): string | null {
  const params = new URLSearchParams(window.location.search + '&' + window.location.hash.replace(/^#/, ''));
  return params.get('error_description') ?? params.get('error');
}

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(readUrlError);

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    const err = await signInWithGoogle();
    if (err) { setError(err); setBusy(false); }
    // on success the page redirects to Google, so there's nothing else to do
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Logo size={44} />
        </div>
        <h1 className={styles.title}>Your days, in one place</h1>
        <p className={styles.sub}>
          Events, notes and daily checklists that follow you to any device. Sign in to pick up where you left off.
        </p>

        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleSignIn}
          disabled={busy || !supabaseConfigured}
        >
          <GoogleLogo />
          {busy ? 'Opening Google…' : 'Continue with Google'}
        </button>

        {error && <div className={styles.error} role="alert">{error}</div>}

        {!supabaseConfigured && (
          <div className={styles.notice}>
            Sign-in isn't set up yet. Add <code>REACT_APP_SUPABASE_URL</code> and{' '}
            <code>REACT_APP_SUPABASE_ANON_KEY</code> to <code>.env.local</code> and restart the dev server
            (see <code>SETUP_SUPABASE.md</code>).
          </div>
        )}

        <p className={styles.fine}>
          New here? Signing in with Google creates your account automatically.
        </p>
        <p className={styles.legal}>
          By continuing you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
