"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createSupabaseAuthClient,
  getAuthUserFromSession,
  getBrowserAuthConfig,
  verifyEmailOtp,
  type AuthConfig,
  type AuthStatus,
  type AuthUser,
} from './auth';

interface AuthContextType {
  config: AuthConfig;
  status: AuthStatus;
  user: AuthUser | null;
  signInWithEmail: (email: string) => Promise<{ ok: boolean; message: string }>;
  verifyEmailCode: (email: string, token: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client] = useState<SupabaseClient | null>(() => createSupabaseAuthClient());
  const [config] = useState<AuthConfig>(() => getBrowserAuthConfig());
  const [status, setStatus] = useState<AuthStatus>(() => (client ? 'loading' : 'signed-out'));
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!client) return;

    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      const nextUser = getAuthUserFromSession(data.session);
      setUser(nextUser);
      setStatus(nextUser ? 'signed-in' : 'signed-out');
    }).catch(() => {
      if (!active) return;
      setUser(null);
      setStatus('signed-out');
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const nextUser = getAuthUserFromSession(session);
      setUser(nextUser);
      setStatus(nextUser ? 'signed-in' : 'signed-out');
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  const signInWithEmail = useCallback(async (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return { ok: false, message: 'Enter an email address.' };
    }

    if (!client) {
      return { ok: false, message: 'Sign-in is not configured yet. You can keep using local-only mode.' };
    }

    const { error } = await client.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/more/settings`,
      },
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true, message: 'Check your email for a sign-in link.' };
  }, [client]);

  const verifyEmailCode = useCallback(async (email: string, token: string) => {
    if (!client) {
      return { ok: false, message: 'Sign-in is not configured yet. You can keep using local-only mode.' };
    }

    const result = await verifyEmailOtp(client, email, token);

    if (result.ok) {
      const { data } = await client.auth.getSession();
      const nextUser = getAuthUserFromSession(data.session);
      setUser(nextUser);
      setStatus(nextUser ? 'signed-in' : 'signed-out');
    }

    return result;
  }, [client]);

  const signOut = useCallback(async () => {
    if (!client) return;
    await client.auth.signOut();
    setUser(null);
    setStatus('signed-out');
  }, [client]);

  const value = useMemo<AuthContextType>(() => ({
    config,
    status,
    user,
    signInWithEmail,
    verifyEmailCode,
    signOut,
  }), [config, signInWithEmail, signOut, status, user, verifyEmailCode]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
