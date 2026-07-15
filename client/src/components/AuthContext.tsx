import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken } from '../api';

interface Permission {
  _id: string;
  key: string;
  description: string;
  category: string;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  status: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (accessToken: string, userData: User) => void;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (accessToken: string, userData: User) => {
    setAccessToken(accessToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      // Hit refresh to fetch access token and user info if session exists
      const res = await api.post('/auth/refresh');
      const { accessToken } = res.data;
      setAccessToken(accessToken);

      // Now fetch user details
      const userRes = await api.get('/users/me');
      setUser(userRes.data);
    } catch (error) {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check user permission clearance
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const roleNames = user.roles.map(r => r.name);
    if (roleNames.includes('Super Admin')) return true;

    // Collate all permissions
    const permissions = user.roles.flatMap(r => r.permissions.map(p => p.key));
    return permissions.includes(permission);
  };

  // Transparently re-auth on boot
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Hit refresh endpoint
        const res = await api.post('/auth/refresh');
        const { accessToken } = res.data;
        setAccessToken(accessToken);

        // Fetch user profile
        const userRes = await api.get('/users/me');
        setUser(userRes.data);
      } catch (err) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();

    const handleSessionExpired = () => {
      setAccessToken(null);
      setUser(null);
    };

    window.addEventListener('auth:logout_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:logout_expired', handleSessionExpired);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
