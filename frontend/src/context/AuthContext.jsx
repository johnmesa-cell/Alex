import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setTokenExpiredCallback } from '../services/api.js';

const AuthContext = createContext(null);

const USER_KEY = 'alex_user';

function normalizeUser(payload = {}) {
  return {
    id: payload.id || payload.id_usuario || payload.idusuario || null,
    nombre: payload.nombre || '',
    correo: payload.correo || payload.email || '',
    idRol: payload.idRol || payload.id_rol || payload.idrol || null,
    fechaRegistro: payload.fechaRegistro || payload.fecha_registro || null
  };
}

export function AuthProvider({ children }) {
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

  useEffect(() => {
    setTokenExpiredCallback(() => {
      clearSession();
    });
  }, []);

  const saveSession = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const clearSession = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    return {
      message: data?.message || 'Registro completado',
      user: normalizeUser(data?.data?.user || {})
    };
  };

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    const nextUser = normalizeUser(data?.data?.user || {});
    saveSession(nextUser);
    return {
      message: data?.message || 'Sesion iniciada',
      user: nextUser
    };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearSession();
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      register,
      login,
      logout
    }),
    [user]
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

  return async () => {
    await logout();
    navigate(path, { replace: true });
  };
}
