import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Auth } from '../api/auth';
import { Api, setUnauthorizedHandler } from '../api/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (Auth.getToken() ? Auth.getUser() : null));

  const logout = useCallback(() => { Auth.clear(); setUser(null); }, []);
  useEffect(() => { setUnauthorizedHandler(logout); }, [logout]);

  const login = useCallback(async creds => {
    const res = await Api.login(creds);
    Auth.setSession(res.token, res.user); setUser(res.user); return res.user;
  }, []);
  const adminLogin = useCallback(async creds => {
    const res = await Api.adminLogin(creds);
    Auth.setSession(res.token, res.user); setUser(res.user); return res.user;
  }, []);
  const register = useCallback(async data => {
    const res = await Api.register(data);
    Auth.setSession(res.token, res.user); setUser(res.user); return res.user;
  }, []);
  const updateProfile = useCallback(async data => {
    const u = await Api.updateMe(data);
    Auth.setUser(u); setUser(u); return u;
  }, []);

  const value = useMemo(() => ({ user, login, adminLogin, register, logout, updateProfile }), [user, login, adminLogin, register, logout, updateProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
