"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { validateLogin } from '@/data/api';
import { User } from '@/types';

const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  unlock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const handleActivity = useCallback(() => {
    if (!isLocked) {
      setLastActivity(Date.now());
    }
  }, [isLocked]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, handleActivity));
    return () => events.forEach(event => window.removeEventListener(event, handleActivity));
  }, [user, handleActivity]);

  useEffect(() => {
    if (!user || isLocked) return;
    const checkIdle = setInterval(() => {
      if (Date.now() - lastActivity > IDLE_TIMEOUT) {
        setIsLocked(true);
      }
    }, 1000);
    return () => clearInterval(checkIdle);
  }, [user, isLocked, lastActivity]);

  const login = async (email: string, password: string) => {
    const result = await validateLogin(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      setIsLocked(false);
      setLastActivity(Date.now());
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    setUser(null);
    setIsLocked(false);
    localStorage.removeItem('auth_user');
  };

  const unlock = () => {
    setIsLocked(false);
    setLastActivity(Date.now());
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLocked, login, logout, unlock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
}