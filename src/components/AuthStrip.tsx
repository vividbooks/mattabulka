import { useCallback, useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

function resolveLoginEmail(value: string) {
  const login = value.trim();
  if (login.includes('@')) return login;
  return `${login}@example.com`;
}

export function AuthStrip() {
  const { supabase, user, loading, signIn, signUp, signOut } = useSupabaseAuth();
  const [email, setEmail] = useState('vitek');
  const [password, setPassword] = useState('123456');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback(
    async (mode: 'in' | 'up') => {
      setMessage(null);
      setBusy(true);
      try {
        const fn = mode === 'in' ? signIn : signUp;
        const { error } = await fn(resolveLoginEmail(email), password);
        if (error) setMessage(error);
        else if (mode === 'up') setMessage('Zkontroluj e-mail (ověření účtu), pak se přihlas.');
      } finally {
        setBusy(false);
      }
    },
    [email, password, signIn, signUp],
  );

  if (!supabase) return null;

  if (loading) {
    return (
      <div className="auth-strip auth-strip--loading" aria-live="polite">
        …
      </div>
    );
  }

  if (user) {
    return (
      <div className="auth-strip auth-strip--signed-in">
        <span className="auth-strip__email" title={user.email ?? ''}>
          {user.email}
        </span>
        <button
          type="button"
          className="auth-strip__btn"
          onClick={() => void signOut()}
          aria-label="Odhlásit"
        >
          <LogOut size={16} strokeWidth={2.2} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="auth-strip">
      <input
        className="auth-strip__input"
        type="text"
        autoComplete="username"
        placeholder="Uživatel"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="auth-strip__input"
        type="password"
        autoComplete="current-password"
        placeholder="Heslo"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="button"
        className="auth-strip__btn auth-strip__btn--primary"
        disabled={busy}
        onClick={() => void run('in')}
        aria-label="Přihlásit"
      >
        <LogIn size={16} strokeWidth={2.2} aria-hidden />
      </button>
      <button
        type="button"
        className="auth-strip__btn"
        disabled={busy}
        onClick={() => void run('up')}
        title="Registrace"
      >
        Reg
      </button>
      {message ? <span className="auth-strip__msg">{message}</span> : null}
    </div>
  );
}
