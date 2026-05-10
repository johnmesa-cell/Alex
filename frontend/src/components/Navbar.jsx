import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      {/* Logo */}
      <div className="brand-wrap">
        <Link to="/" className="brand">
          <span className="brand-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="13" stroke="#0f766e" strokeWidth="1.5" fill="none" />
              <path d="M7 14 Q9 10 11 14 Q12 16 13 13 L14 10 L15 15 Q16 17 17 14 Q19 10 21 14"
                stroke="#0f766e" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          ALEX
        </Link>
        <p className="brand-subtitle">Asistente de primeros auxilios con IA</p>
      </div>

      {/* Nav centrado */}
      <nav className="nav-links" aria-label="Navegación principal">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Inicio
        </NavLink>

        {isAuthenticated ? (
          <>
            <NavLink
              to="/chat"
              className={({ isActive }) => `nav-link nav-link-accent${isActive ? ' active' : ''}`}
            >
              Chat
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Perfil
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Configuración
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Chat
            </NavLink>
            <span className="nav-link nav-link--disabled">Soporte</span>
            <span className="nav-link nav-link--disabled">Información</span>
          </>
        )}
      </nav>

      {/* Sesión — derecha */}
      <div className="navbar-session">
        {isAuthenticated ? (
          <>
            <span className="session-pill">{user?.nombre || 'Usuario'}</span>
            <button type="button" className="btn-primary" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <span className="session-pill">Sesión no iniciada</span>
            <Link to="/login" className="btn-primary">Iniciar sesión</Link>
            <Link to="/register" className="btn-secondary">Crear cuenta</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
