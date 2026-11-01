import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Database, KeyRound, Lock, LogOut, ShieldAlert } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { SupabaseSetupModal } from '../common/SupabaseSetupModal';

interface AdminGateProps {
  businessName: string;
  onBackToSite: () => void;
  children: (props: { userEmail: string | undefined; onSignOut: () => Promise<void> }) => React.ReactNode;
}

export const AdminGate: React.FC<AdminGateProps> = ({
  businessName,
  onBackToSite,
  children,
}) => {
  const [verifying, setVerifying] = useState<boolean>(true);
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  const isAdminRef = useRef<boolean>(false);
  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  /**
   * Verifies admin access strictly by querying admin_users where user_id = user.id with maybeSingle().
   * Never signs out automatically on temporary query errors.
   */
  const verifyAdminByUserId = async (userId: string, preserveOnTransientError = false) => {
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (preserveOnTransientError && isAdminRef.current) {
        return true;
      }
      setAuthError(`Unable to verify admin authorization: ${error.message}`);
      return false;
    }

    return Boolean(data && data.user_id === userId);
  };

  // Initial route load check: getSession() -> getUser() -> admin_users.maybeSingle() -> finally stop loading
  useEffect(() => {
    let mounted = true;

    async function checkInitialSession() {
      if (!isSupabaseConfigured) {
        if (mounted) {
          setHasSession(false);
          setIsAdmin(false);
          setVerifying(false);
        }
        return;
      }

      setVerifying(true);
      try {
        const { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionResult.session) {
          if (mounted) {
            setHasSession(false);
            setIsAdmin(false);
            setUserEmail(undefined);
          }
          return;
        }

        const { data: userResult, error: userError } = await supabase.auth.getUser();
        if (userError || !userResult.user) {
          if (mounted) {
            setHasSession(false);
            setIsAdmin(false);
            setUserEmail(undefined);
          }
          return;
        }

        const currentUser = userResult.user;
        const authorized = await verifyAdminByUserId(currentUser.id, false);

        if (mounted) {
          setHasSession(true);
          setUserEmail(currentUser.email);
          setIsAdmin(authorized);
        }
      } catch {
        if (mounted) {
          setHasSession(false);
          setIsAdmin(false);
        }
      } finally {
        if (mounted) {
          setVerifying(false);
        }
      }
    }

    checkInitialSession();

    // Subscribe to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        setHasSession(false);
        setIsAdmin(false);
        setUserEmail(undefined);
        setVerifying(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        // Keep dashboard available during token refresh and quietly re-verify
        setHasSession(true);
        setUserEmail(session.user.email);
        try {
          const authorized = await verifyAdminByUserId(session.user.id, true);
          if (mounted) {
            setIsAdmin(authorized);
          }
        } catch {
          // Do not sign out or disrupt active admin on transient network error
        }
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setHasSession(true);
        setUserEmail(session.user.email);
        try {
          const authorized = await verifyAdminByUserId(session.user.id, true);
          if (mounted) {
            setIsAdmin(authorized);
          }
        } finally {
          if (mounted) {
            setVerifying(false);
          }
        }
      }
    });

    return () => {
      mounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!isSupabaseConfigured) {
      setAuthError(
        'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local first.'
      );
      return;
    }

    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail || !passwordInput) {
      setAuthError('Please enter both your admin email and password.');
      return;
    }

    setSigningIn(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: passwordInput,
      });

      if (signInError || !signInData.user) {
        setAuthError(signInError?.message || 'Invalid login credentials. Please check your email and password.');
        return;
      }

      // Explicitly verify authenticated user's id against admin_users.user_id before transitioning
      const { data: freshUserResult } = await supabase.auth.getUser();
      const verifiedUser = freshUserResult.user || signInData.user;

      const authorized = await verifyAdminByUserId(verifiedUser.id, false);
      setHasSession(true);
      setUserEmail(verifiedUser.email);
      setIsAdmin(authorized);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in right now.');
    } finally {
      setSigningIn(false);
      setVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setHasSession(false);
    setIsAdmin(false);
    setUserEmail(undefined);
    setPasswordInput('');
  };

  // 1. Loading State while checking session & admin_users
  if (verifying) {
    return (
      <div className="min-h-screen bg-ivory-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-taupe-300 bg-ivory-100 p-8 text-center space-y-4">
          <div className="w-10 h-10 rounded-xl bg-champagne-200 mx-auto animate-pulse flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-rosebronze-600" />
          </div>
          <p className="font-display text-2xl font-semibold text-espresso-900">
            Verifying Management Access
          </p>
          <p className="text-xs text-umber-600">
            Confirming your secure session with {businessName}...
          </p>
        </div>
      </div>
    );
  }

  // 2. Signed in, but user.id NOT found in admin_users.user_id
  if (hasSession && !isAdmin) {
    return (
      <div className="min-h-screen bg-ivory-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-taupe-300 bg-ivory-100 p-8 space-y-6">
          <div className="flex items-center gap-3 text-amber-800">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <h1 className="text-lg font-semibold text-espresso-900">
              Admin Authorization Required
            </h1>
          </div>

          <p className="text-sm text-espresso-900 font-medium leading-relaxed bg-ivory-50 border border-taupe-300 rounded-xl p-4">
            You are signed in, but you are not authorized as an admin.
          </p>

          {userEmail && (
            <p className="text-xs text-umber-600">
              Signed in account: <span className="font-medium text-espresso-800">{userEmail}</span>. Ask the property owner to add your Supabase Auth <code className="font-mono">user_id</code> to the <code className="font-mono">admin_users</code> table.
            </p>
          )}

          {authError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {authError}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onBackToSite}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-taupe-300 text-xs font-semibold text-espresso-900 hover:bg-ivory-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-espresso-900 hover:bg-rosebronze-600 text-ivory-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated & Verified in admin_users -> Render Protected Admin Dashboard
  if (hasSession && isAdmin) {
    return <>{children({ userEmail, onSignOut: handleSignOut })}</>;
  }

  // 4. Unauthenticated -> Render Polished Admin Sign-In Form
  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory-50 to-champagne-100/70 flex flex-col justify-between p-6">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between py-2">
        <button
          type="button"
          onClick={onBackToSite}
          className="inline-flex items-center gap-2 text-xs font-semibold text-umber-600 hover:text-espresso-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to {businessName}</span>
        </button>

        <button
          type="button"
          onClick={() => setSetupModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-taupe-300 bg-ivory-50 text-xs font-medium text-espresso-800 hover:border-rosebronze-500 transition-colors cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-rosebronze-600" />
          <span>Schema &amp; Setup Guide</span>
        </button>
      </div>

      <div className="w-full max-w-md mx-auto my-10 rounded-2xl border border-taupe-300 bg-ivory-50 p-8 sm:p-10 shadow-sm">
        <div className="space-y-2 mb-7">
          <div className="w-10 h-10 rounded-xl bg-champagne-100 border border-taupe-300 flex items-center justify-center text-rosebronze-600 mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-rosebronze-600">
            Hospitality Management Portal
          </p>
          <h1 className="font-display text-3xl font-semibold text-espresso-900">
            {businessName}
          </h1>
          <p className="text-xs sm:text-sm text-umber-600">
            Sign in with your authorized Supabase Admin credentials to manage reservations, services, and operating hours.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 rounded-xl border border-amber-300 bg-amber-50/80 text-xs text-amber-950 space-y-2">
            <p className="font-semibold">Supabase Connection Needed</p>
            <p className="leading-relaxed">
              Paste your <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> into <code className="font-mono">.env.local</code> to enable live admin sign-in.
            </p>
            <button
              type="button"
              onClick={() => setSetupModalOpen(true)}
              className="underline font-semibold cursor-pointer"
            >
              View SQL Schema &amp; Admin Setup Instructions
            </button>
          </div>
        )}

        {authError && (
          <div
            role="alert"
            className="mb-6 p-3.5 rounded-xl border border-red-300 bg-red-50 text-xs text-red-900"
          >
            {authError}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-espresso-900 mb-1.5">
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              placeholder="manager@glodenkeyprime.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-taupe-300 bg-ivory-100/50 text-sm text-espresso-900 focus:outline-none focus:border-rosebronze-500"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-semibold text-espresso-900 mb-1.5">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-taupe-300 bg-ivory-100/50 text-sm text-espresso-900 focus:outline-none focus:border-rosebronze-500"
            />
          </div>

          <button
            type="submit"
            disabled={signingIn}
            className="w-full py-3.5 px-5 rounded-xl bg-espresso-900 hover:bg-rosebronze-600 disabled:opacity-60 text-ivory-50 text-sm font-semibold transition-colors cursor-pointer"
          >
            {signingIn ? 'Signing In...' : 'Sign In to Dashboard'}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-umber-600 pb-2">
        Protected by Supabase Auth &amp; Row-Level Security
      </div>

      <SupabaseSetupModal isOpen={setupModalOpen} onClose={() => setSetupModalOpen(false)} />
    </div>
  );
};
