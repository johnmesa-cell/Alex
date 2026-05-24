import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setTokenExpiredCallback } from '../services/api.js';

const AuthContext = createContext(null);

const USER_KEY = 'alex_user';

function normalizeUser(payload = {}) {
  return {
    id: payload.id || payload.id_usuario || payload.idusuario || null,
    id_usuario: payload.id || payload.id_usuario || payload.idusuario || null,
    nombre: payload.nombre || '',
    correo: payload.correo || payload.email || '',
    idRol: payload.idRol || payload.id_rol || payload.idrol || null,
    rolNombre: payload.rolNombre || payload.rol_nombre || payload.nombreRol || null,
    fechaRegistro: payload.fechaRegistro || payload.fecha_registro || null,
    ultimoLogin: payload.ultimoLogin || payload.ultimo_login || payload.ultimologin || null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return normalizeUser(parsed);
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const clearSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    setTokenExpiredCallback(() => {
      clearSession();
    });
  }, [clearSession]);

  const saveSession = useCallback((nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    return {
      message: data?.message || 'Registro completado',
      user: normalizeUser(data?.data?.user || {})
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    const nextUser = normalizeUser(data?.data?.user || {});
    saveSession(nextUser);
    return {
      message: data?.message || 'Sesion iniciada',
      user: nextUser
    };
  }, [saveSession]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = normalizeUser({ ...prev, ...partial });
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      register,
      login,
      logout,
      updateUser,
    }),
    [user, register, login, logout, updateUser]
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
