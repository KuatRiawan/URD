import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setAccessToken, setOnUnauthorized, performRefresh } from '../../lib/api/axios.js';

const AuthContext = createContext(null);
const AUTH_USER_KEY = 'urd_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {}
  }, []);

  useEffect(() => {
    setOnUnauthorized(clearSession);
    let mounted = true;

    async function bootstrap() {
      try {
        const data = await performRefresh();
        if (mounted && data?.user) {
          setUser(data.user);
          try {
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
          } catch {}
        }
      } catch {
        if (mounted) clearSession();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [clearSession]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    } catch {}
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearSession();
    }
  };

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipanggil di dalam AuthProvider');
  return ctx;
}
