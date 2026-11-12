import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; name: string; role: 'freelancer' | 'client'; company?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  quickLogin: (role: 'freelancer' | 'client') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'suvault_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on mount
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to sign in. Please check your credentials.' };
      }

      const authData = data as AuthResponse;
      localStorage.setItem(TOKEN_KEY, authData.token);
      setToken(authData.token);
      setUser(authData.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error occurred. Please try again.' };
    }
  };

  const register = async (userData: { email: string; password: string; name: string; role: 'freelancer' | 'client'; company?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to create your account.' };
      }

      const authData = data as AuthResponse;
      localStorage.setItem(TOKEN_KEY, authData.token);
      setToken(authData.token);
      setUser(authData.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error occurred. Please try again.' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const quickLogin = async (role: 'freelancer' | 'client') => {
    const email = role === 'freelancer' ? 'designer@suvault.com' : 'client@acme.com';
    const password = 'password123';
    await login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, quickLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
