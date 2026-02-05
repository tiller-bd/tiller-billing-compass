// src/contexts/AuthContext.tsx

"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@/types';
import { useRouter } from 'next/navigation';

const IDLE_TIMEOUT = 2 * 60 * 2000;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  lock: () => void;
  unlock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (!stored) {
      setIsHydrated(true);
      return;
    }

    // Verify the httpOnly cookie is still valid with a server call.
    // If the cookie expired, the server returns 401 and we clear stale localStorage.
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            localStorage.removeItem('auth_user');
          }
        } else {
          // Session expired — clear stale data
          localStorage.removeItem('auth_user');
        }
      })
      .catch(() => {
        // Network error — trust localStorage so offline/slow loads still work
        try {
          setUser(JSON.parse(stored));
        } catch {
          localStorage.removeItem('auth_user');
        }
      })
      .finally(() => {
        setIsHydrated(true);
      });
  }, []);

  const handleActivity = useCallback(() => {
    if (!isLocked) setLastActivity(Date.now());
  }, [isLocked]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, handleActivity));

    const checkIdle = setInterval(() => {
      if (Date.now() - lastActivity > IDLE_TIMEOUT) setIsLocked(true);
    }, 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(checkIdle);
    };
  }, [user, handleActivity, lastActivity]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const result = await res.json();
    if (result.success) {
      setUser(result.user);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = async () => {
    try {
      // Clear httpOnly cookie via server API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // Continue with logout even if API fails
    }
    setUser(null);
    localStorage.removeItem('auth_user');
    router.push('/login');
  };
  // Show nothing until hydrated to prevent flicker
  if (!isHydrated) {
    return null;
  }

  const lock = () => setIsLocked(true);
  const unlock = () => setIsLocked(false);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLocked, login, logout, lock, unlock }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};