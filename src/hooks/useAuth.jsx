import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '../services/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    auth.getUser().then((u) => {
      setUser(u);
      setChecking(false);
    });
  }, []);

  const signIn = useCallback(async (opts) => setUser(await auth.signIn(opts)), []);
  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
  }, []);
  const setRole = useCallback(async (role) => {
    if (auth.setRole) setUser(await auth.setRole(role));
  }, []);

  return (
    <AuthContext.Provider value={{ user, checking, signIn, signOut, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
