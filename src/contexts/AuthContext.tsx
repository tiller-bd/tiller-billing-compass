import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { mockUsers } from '@/data/mockData';
import { User } from '@/types';

const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  unlock: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock passwords for demo (in real app, this would be validated against a backend)
const mockPasswords: Record<string, string> = {
  'ceo@tiller.com.bd': 'admin123',
  'pm@tiller.com.bd': 'user123',
  'finance@tiller.com.bd': 'user123',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const handleActivity = useCallback(() => {
    if (!isLocked) {
      setLastActivity(Date.now());
    }
  }, [isLocked]);

  // Setup activity listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, handleActivity]);

  // Check for idle timeout
  useEffect(() => {
    if (!user || isLocked) return;

    const checkIdle = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > IDLE_TIMEOUT) {
        setIsLocked(true);
      }
    }, 1000);

    return () => clearInterval(checkIdle);
  }, [user, isLocked, lastActivity]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Find user by email
    const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!foundUser) {
      return { success: false, error: 'User not found' };
    }

    if (foundUser.suspended) {
      return { success: false, error: 'Account is suspended. Contact administrator.' };
    }

    // Check password
    const correctPassword = mockPasswords[foundUser.email];
    if (password !== correctPassword) {
      return { success: false, error: 'Invalid password' };
    }

    setUser(foundUser);
    setIsLocked(false);
    setLastActivity(Date.now());
    localStorage.setItem('auth_user', JSON.stringify(foundUser));
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setIsLocked(false);
    localStorage.removeItem('auth_user');
  };

  const unlock = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user session' };
    }

    const correctPassword = mockPasswords[user.email];
    if (password !== correctPassword) {
      return { success: false, error: 'Invalid password' };
    }

    setIsLocked(false);
    setLastActivity(Date.now());
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLocked,
      login, 
      logout,
      unlock
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
