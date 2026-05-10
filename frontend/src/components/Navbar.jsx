import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logoAlex from '../assets/logo-alex.png';

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
      <Link to="/" className="brand">
        <img
          src={logoAlex}
          alt="ALEX logo"
          className="brand-logo"
        />
        <span className="brand-name">ALEX</span>
      </Link>

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
