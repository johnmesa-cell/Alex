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

  const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

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

        {isAuthenticated ? (
          <>
            <NavLink to="/chat" className={navClass}>Chat</NavLink>
            <NavLink to="/soporte" className={navClass}>Soporte</NavLink>
            <NavLink to="/informacion" className={navClass}>Información</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/chat" className={navClass}>Chat</NavLink>
            <NavLink to="/soporte" className={navClass}>Soporte</NavLink>
            <NavLink to="/informacion" className={navClass}>Información</NavLink>
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
