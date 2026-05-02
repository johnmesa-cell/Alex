import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="hero">
      <div className="hero-content fade-up">
        <p className="eyebrow">Prototipo v1 alineado al backend real</p>
        <h1>Asistente ALEX para orientacion de primeros auxilios en segundos</h1>
        <p className="hero-copy">
          Esta version permite registro, inicio de sesion con JWT y chat por texto o dictado por voz para
          recibir guidance desde el endpoint operativo.
        </p>

        <div className="cta-row">
          {!isAuthenticated && (
            <>
              <Link to="/register" className="btn-primary">
                Crear cuenta
              </Link>
              <Link to="/login" className="btn-secondary">
                Ingresar
              </Link>
            </>
          )}

          {isAuthenticated && (
            <Link to="/chat" className="btn-primary">
              Ir al Chat IA
            </Link>
          )}
        </div>
      </div>

      <aside className="hero-card slide-in">
        <h2>Capacidades</h2>
        <ul>
          <li>Registro con nombre, email y password</li>
          <li>Login con persistencia local de sesion</li>
          <li>Ruta protegida para chat</li>
          <li>Integracion con POST /api/ai/guidance</li>
          <li>Soporte de dictado con Web Speech API</li>
        </ul>
      </aside>
    </section>
  );
}

export default Home;
