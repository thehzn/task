import { createContext, useContext, useState } from 'react';
import api, { pickOne } from './api';
import { USER_BASE } from './config';
import { closeSocket } from './socket';

const AuthContext = createContext(null);
const norm = (u) => (u ? { ...u, _id: u._id || u.id } : u); 
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => norm(JSON.parse(localStorage.getItem('user') || 'null')));

  const save = async (data) => {
    if (data.token) localStorage.setItem('token', data.token);
    let u = norm(data.user);
    if (!u) u = norm(pickOne((await api.get(`${USER_BASE}/getme`)).data, 'user'));
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const login = async (email, password) => save((await api.post(`${USER_BASE}/login`, { email, password })).data);
  const register = async (form) => save((await api.post(`${USER_BASE}/register`, form)).data);
  const logout = async () => {
    try { await api.post(`${USER_BASE}/logout`); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    closeSocket();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}
