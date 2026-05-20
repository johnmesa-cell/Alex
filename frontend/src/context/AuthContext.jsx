import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setTokenExpiredCallback } from '../services/api.js';

const AuthContext = createContext(null);

const USER_KEY = 'alex_user';

function normalizeUser(payload = {}) {
  return {
    // CORRECCIÓN: se expone id_usuario además de id para que Chat.jsx y otros
    // componentes que usan user.id_usuario funcionen correctamente.
    id:            payload.id || payload.id_usuario || payload.idusuario || null,
    id_usuario:    payload.id || payload.id_usuario || payload.idusuario || null,
    nombre:        payload.nombre || '',
    correo:        payload.correo || payload.email || '',
    idRol:         payload.idRol || payload.id_rol || payload.idrol || null,
    rolNombre:     payload.rolNombre || payload.rol_nombre || payload.nombreRol || null,
    fechaRegistro: payload.fechaRegistro || payload.fecha_registro || null
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      // CORRECCIÓN: re-normalizar al cargar para que sesiones guardadas
      // antes de este fix también tengan id_usuario correctamente.
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

  const saveSession = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const clearSession = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };

  const register = async (formData) => {
    // CORRECCIÓN: ruta corregida de '/auth/register' a '/api/auth/register'
    // para que el proxy de Vite (/api → backend) la alcance correctamente.
    const { data } = await api.post('/api/auth/register', formData);
    return {
      message: data?.message || 'Registro completado',
      user: normalizeUser(data?.data?.user || {})
    };
  };

  const login = async (credentials) => {
    // CORRECCIÓN: ruta corregida de '/auth/login' a '/api/auth/login'
    const { data } = await api.post('/api/auth/login', credentials);
    const nextUser = normalizeUser(data?.data?.user || {});
    saveSession(nextUser);
    return {
      message: data?.message || 'Sesion iniciada',
      user: nextUser
    };
  };

  const logout = async () => {
    try {
      // CORRECCIÓN: ruta corregida de '/auth/logout' a '/api/auth/logout'
      await api.post('/api/auth/logout');
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
