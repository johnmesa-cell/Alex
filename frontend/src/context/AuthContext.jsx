import React, { createContext, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'alex_token';
const USER_KEY = 'alex_user';

function normalizeUser(payload = {}) {
  return {
    id: payload.id_usuario || payload.idusuario || payload.id || null,
    nombre: payload.nombre || '',
    correo: payload.correo || payload.email || '',
    idRol: payload.id_rol || payload.idrol || null
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const saveSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    return {
      message: data?.message || 'Registro completado',
      user: normalizeUser(data?.user || {})
    };
  };

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    const nextToken = data?.token;
    const nextUser = normalizeUser(data?.user || {});

    if (!nextToken) {
      throw new Error('El backend no devolvio token en login.');
    }

    saveSession(nextToken, nextUser);
    return {
      message: data?.message || 'Sesion iniciada',
      token: nextToken,
      user: nextUser
    };
  };

  const logout = () => {
    clearSession();
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      register,
      login,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

export function useLogoutAndRedirect(path = '/login') {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return () => {
    logout();
    navigate(path, { replace: true });
  };
}
