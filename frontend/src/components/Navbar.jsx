import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logoAlex from '../assets/logo-alex.png';

function getInitials(nombre) {
  if (!nombre) return '?';
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

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

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  const initials = getInitials(user?.nombre);
  const bgColor  = avatarColor(user?.nombre);

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Cierra el menú con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

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
        <NavLink to="/chat"        className={navClass}>Chat</NavLink>
        <NavLink to="/soporte"     className={navClass}>Soporte</NavLink>
        <NavLink to="/informacion" className={navClass}>Información</NavLink>
      </nav>

      {/* Sesión */}
      <div className="navbar-session">
        {isAuthenticated ? (
          <div className="user-menu-wrap" ref={menuRef}>
            {/* Avatar — toggle del dropdown */}
            <button
              type="button"
              className={`user-avatar${menuOpen ? ' user-avatar--open' : ''}`}
              style={{ backgroundColor: bgColor }}
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label={`Menú de ${user?.nombre || 'usuario'}`}
            >
              {initials}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="user-menu" role="menu" aria-label="Opciones de usuario">
                {/* Cabecera del menú */}
                <div className="user-menu__header">
                  <div
                    className="user-menu__avatar"
                    style={{ backgroundColor: bgColor }}
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                  <div className="user-menu__info">
                    <span className="user-menu__name">{user?.nombre || 'Usuario'}</span>
                    <span className="user-menu__email">{user?.correo || user?.email || ''}</span>
                  </div>
                </div>

                <hr className="user-menu__divider" />

                {/* Opciones */}
                <button
                  type="button"
                  className="user-menu__item"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                >
                  <span className="user-menu__icon" aria-hidden="true">👤</span>
                  Ver perfil
                </button>

                <button
                  type="button"
                  className="user-menu__item"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                >
                  <span className="user-menu__icon" aria-hidden="true">⚙️</span>
                  Configuración
                </button>

                <button
                  type="button"
                  className="user-menu__item"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); navigate('/chat'); }}
                >
                  <span className="user-menu__icon" aria-hidden="true">💬</span>
                  Ir al chat
                </button>

                <hr className="user-menu__divider" />

                <button
                  type="button"
                  className="user-menu__item user-menu__item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <span className="user-menu__icon" aria-hidden="true">🚪</span>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <span className="session-pill">Sesión no iniciada</span>
            <Link to="/login"    className="btn-nav btn-primary">Iniciar sesión</Link>
            <Link to="/register" className="btn-nav btn-secondary">Crear cuenta</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
