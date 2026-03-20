import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="brand-wrap">
        <Link to="/" className="brand">
          ALEX
        </Link>
        <p className="brand-subtitle">Asistente de primeros auxilios con IA</p>
      </div>

      <nav className="nav-links">
        <NavLink to="/" className="nav-link">
          Home
        </NavLink>

        {!isAuthenticated && (
          <>
            <NavLink to="/login" className="nav-link">
              Login
            </NavLink>
            <NavLink to="/register" className="nav-link nav-link-accent">
              Registro
            </NavLink>
          </>
        )}

        {isAuthenticated && (
          <>
            <NavLink to="/chat" className="nav-link nav-link-accent">
              Chat IA
            </NavLink>
            <button type="button" className="btn-secondary" onClick={handleLogout}>
              Salir
            </button>
          </>
        )}
      </nav>

      <div className="session-pill">
        {isAuthenticated ? `Sesion: ${user?.nombre || 'Usuario'}` : 'Sesion no iniciada'}
      </div>
    </header>
  );
}

export default Navbar;
