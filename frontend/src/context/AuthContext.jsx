import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setTokenExpiredCallback } from '../services/api.js';

const AuthContext = createContext(null);

const USER_KEY = 'alex_user';

function normalizeUser(payload = {}) {
  return {
    // id e id_usuario: cubre todos los alias posibles del backend
    id:            payload.id || payload.id_usuario || payload.idusuario || null,
    id_usuario:    payload.id || payload.id_usuario || payload.idusuario || null,
    nombre:        payload.nombre || '',
    correo:        payload.correo || payload.email || '',
    idRol:         payload.idRol || payload.id_rol || payload.idrol || null,
    rolNombre:     payload.rolNombre || payload.rol_nombre || payload.nombreRol || null,
    fechaRegistro: payload.fechaRegistro || payload.fecha_registro || null,
    // CORRECCIÓN Bug 2: ultimo_login no se mapeaba → Home.jsx siempre mostraba 'Hoy'.
    // Se cubre el nombre snake_case que devuelve Prisma/el backend y el camelCase
    // por si ya hubiese sesiones guardadas en localStorage con ese nombre.
    ultimoLogin:   payload.ultimoLogin || payload.ultimo_login || payload.ultimologin || null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      // Re-normalizar al cargar para que sesiones guardadas antes de este fix
      // también tengan ultimoLogin correctamente.
      return normalizeUser(parsed);
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

  const saveSession = useCallback((nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/api/auth/register', formData);
    return {
      message: data?.message || 'Registro completado',
      user: normalizeUser(data?.data?.user || {})
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/api/auth/login', credentials);
    const nextUser = normalizeUser(data?.data?.user || {});
    saveSession(nextUser);
    return {
      message: data?.message || 'Sesion iniciada',
      user: nextUser
    };
  }, [saveSession]);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Actualiza el nombre en el contexto y localStorage sin requerir re-login
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
