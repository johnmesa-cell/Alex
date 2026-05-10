import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logoAlex from '../assets/logo-alex.png';

/** Genera las iniciales del usuario (máx 2 caracteres) */
function getInitials(nombre) {
  if (!nombre) return '?';
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Color de fondo determinista según nombre */
const AVATAR_COLORS = [
  '#0f766e', '#0369a1', '#7c3aed', '#b45309',
  '#be123c', '#15803d', '#0e7490', '#9333ea',
];
function avatarColor(nombre) {
  if (!nombre) return AVATAR_COLORS[0];
  let hash = 0;
  for (const c of nombre) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/'); };
  const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  const initials = getInitials(user?.nombre);
  const bgColor = avatarColor(user?.nombre);

  return (
    <header className="navbar">
      {/* Logo */}
      <Link to="/" className="brand">
        <img src={logoAlex} alt="ALEX logo" className="brand-logo" />
        <span className="brand-name">ALEX</span>
      </Link>

      {/* Nav centrado */}
      <nav className="nav-links" aria-label="Navegación principal">
        <NavLink to="/" end className={navClass}>Inicio</NavLink>
        <NavLink to="/chat" className={navClass}>Chat</NavLink>
        <NavLink to="/soporte" className={navClass}>Soporte</NavLink>
        <NavLink to="/información" className={navClass}>Información</NavLink>
      </nav>

      {/* Sesión — derecha */}
      <div className="navbar-session">
        {isAuthenticated ? (
          <>
            {/* Avatar con iniciales */}
            <div
              className="user-avatar"
              style={{ backgroundColor: bgColor }}
              title={user?.nombre || 'Usuario'}
              aria-label={`Usuario: ${user?.nombre || 'Usuario'}`}
            >
              {initials}
            </div>
            <button type="button" className="btn-nav btn-primary" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <span className="session-pill">Sesión no iniciada</span>
            <Link to="/login" className="btn-nav btn-primary">Iniciar sesión</Link>
            <Link to="/register" className="btn-nav btn-secondary">Crear cuenta</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
