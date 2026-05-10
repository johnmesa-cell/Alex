import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  '#0f766e','#0369a1','#7c3aed','#b45309',
  '#be123c','#15803d','#0e7490','#9333ea',
];
function avatarColor(nombre) {
  if (!nombre) return AVATAR_COLORS[0];
  let hash = 0;
  for (const c of nombre) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const IcoUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const IcoSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
      a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
      A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
      l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
      A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
      l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
      a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
      l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
      a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IcoChat = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos]   = useState({ top: 0, right: 0 });

  // Referencias para detectar clics fuera
  const avatarRef = useRef(null);
  const menuRef   = useRef(null);

  /* ── Cierra sesión y redirige ── */
  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logout();
    } catch (_) {
      // silenciar error de red al cerrar sesión
    }
    navigate('/', { replace: true });
  };

  /* ── Navega a una ruta y cierra el panel ── */
  const goTo = useCallback((path) => {
    setMenuOpen(false);
    navigate(path);
  }, [navigate]);

  const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;
  const initials  = getInitials(user?.nombre);
  const bgColor   = avatarColor(user?.nombre);

  /* ── Calcula posición bajo el avatar ── */
  const openMenu = useCallback(() => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setMenuPos({
        top:   rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setMenuOpen(true);
  }, []);

  const toggleMenu = useCallback(() => {
    if (menuOpen) setMenuOpen(false);
    else openMenu();
  }, [menuOpen, openMenu]);

  /* ── Cierra al hacer click FUERA del avatar Y del panel ── */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      const clickedAvatar = avatarRef.current?.contains(e.target);
      const clickedMenu   = menuRef.current?.contains(e.target);
      if (!clickedAvatar && !clickedMenu) setMenuOpen(false);
    };
    // 'mousedown' con capture=false se ejecuta ANTES del click del botón hijo
    // Para que el click del ítem gane, usamos 'mousedown' en el documento
    // pero excluimos el propio panel — los ítems ya manejan su propio click.
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  /* ── Cierra con Escape ── */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /* ── Recalcula posición al redimensionar ── */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => openMenu();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [menuOpen, openMenu]);

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <img src={logoAlex} alt="ALEX logo" className="brand-logo" />
        <span className="brand-name">ALEX</span>
      </Link>

      <nav className="nav-links" aria-label="Navegación principal">
        <NavLink to="/"           end className={navClass}>Inicio</NavLink>
        <NavLink to="/chat"           className={navClass}>Chat</NavLink>
        <NavLink to="/soporte"        className={navClass}>Soporte</NavLink>
        <NavLink to="/informacion"    className={navClass}>Información</NavLink>
      </nav>

      <div className="navbar-session">
        {isAuthenticated ? (
          <div className="user-menu-wrap">
            {/* Botón avatar */}
            <button
              ref={avatarRef}
              type="button"
              className={`user-avatar${menuOpen ? ' user-avatar--open' : ''}`}
              style={{ backgroundColor: bgColor }}
              onClick={toggleMenu}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label={`Menú de ${user?.nombre || 'usuario'}`}
            >
              {initials}
            </button>

            {/* Panel desplegable */}
            {menuOpen && (
              <div
                ref={menuRef}
                className="user-menu"
                role="menu"
                style={{
                  position: 'fixed',
                  top:   menuPos.top,
                  right: menuPos.right,
                  left:  'auto',
                }}
              >
                {/* Cabecera */}
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

                <button
                  type="button"
                  className="user-menu__item"
                  role="menuitem"
                  onClick={() => goTo('/profile')}
                >
                  <IcoUser /> Ver perfil
                </button>

                <button
                  type="button"
                  className="user-menu__item"
                  role="menuitem"
                  onClick={() => goTo('/settings')}
                >
                  <IcoSettings /> Configuración
                </button>

                <button
                  type="button"
                  className="user-menu__item"
                  role="menuitem"
                  onClick={() => goTo('/chat')}
                >
                  <IcoChat /> Ir al chat
                </button>

                <hr className="user-menu__divider" />

                <button
                  type="button"
                  className="user-menu__item user-menu__item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <IcoLogout /> Cerrar sesión
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
