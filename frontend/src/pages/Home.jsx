import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logoAlex from '../assets/logo-alex.png';

/* Extrae el primer nombre del campo completo */
function getPrimerNombre(nombre) {
  if (!nombre) return '';
  return nombre.trim().split(' ')[0];
}

function Home() {
  const { isAuthenticated, user } = useAuth();
  const primerNombre = getPrimerNombre(user?.nombre);

  return (
    <div className="public-page">

      {/* ── Hero principal ── */}
      <section className="landing-hero">
        <div className="landing-hero__left">
          <div className="landing-info-cards">
            <div className="landing-card fade-up">
              <h3>Objetivo de ALEX</h3>
              <p>
                Brindar orientación inicial de primeros auxilios para apoyar la toma de
                decisiones rápida mientras el usuario contacta servicios de emergencia.
              </p>
            </div>
            <div className="landing-card fade-up" style={{ animationDelay: '60ms' }}>
              <h3>Sobre nosotros</h3>
              <p>
                Somos un proyecto enfocado en salud digital y prevención, combinando
                tecnología y educación para acercar recomendaciones claras a cualquier
                persona.
              </p>
            </div>
            <div className="landing-card fade-up" style={{ animationDelay: '120ms' }}>
              <h3>Soporte</h3>
              <p>
                Si tienes dudas sobre el uso del asistente, puedes escribir a{' '}
                <a href="mailto:soporte@alex-app.test">soporte@alex-app.test</a> o usar
                el canal de ayuda cuando inicies sesión.
              </p>
            </div>
            <div className="landing-card fade-up" style={{ animationDelay: '180ms' }}>
              <h3>Cómo funciona</h3>
              <ol className="landing-steps">
                <li>Inicia sesión o crea tu cuenta.</li>
                <li>Describe la situación en el chat.</li>
                <li>Recibe guidance inicial paso a paso.</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="landing-hero__right slide-in">
          <div className="landing-hero-card">
            <div className="landing-logo-icon">
              <img src={logoAlex} alt="Logo ALEX" />
            </div>

            <p className="landing-eyebrow">Asistente de primeros auxilios con IA</p>

            {isAuthenticated ? (
              /* ── Vista usuario autenticado ── */
              <>
                <h1 className="landing-headline">
                  Bienvenido de nuevo{primerNombre ? `, ${primerNombre}` : ''}.
                </h1>
                <p className="landing-copy">
                  Tu sesión ya está activa. Puedes continuar tus consultas de primeros
                  auxilios y recibir orientación inicial de forma inmediata mientras
                  contactas ayuda profesional.
                </p>
                <div className="landing-badges">
                  <span className="landing-badge">Chat guiado</span>
                  <span className="landing-badge">Dictado por voz</span>
                  <span className="landing-badge landing-badge--active">Sesión activa</span>
                </div>
              </>
            ) : (
              /* ── Vista pública ── */
              <>
                <h1 className="landing-headline">
                  Orientación inicial cuando cada segundo importa
                </h1>
                <p className="landing-copy">
                  ALEX te guía con pasos iniciales de primeros auxilios mientras contactas
                  ayuda profesional. Inicia sesión o crea tu cuenta para abrir el chat.
                </p>
                <div className="landing-badges">
                  <span className="landing-badge">Chat guiado</span>
                  <span className="landing-badge">Dictado por voz</span>
                  <span className="landing-badge">Acceso seguro</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA inferior ── */}
      <section className="landing-cta">
        <div className="landing-cta__text">
          {isAuthenticated ? (
            <>
              <h2>¿Listo para continuar?</h2>
              <p>Tu historial y configuración te esperan en el chat.</p>
            </>
          ) : (
            <>
              <h2>¿Listo para comenzar?</h2>
              <p>Accede al asistente y ten una guía inicial cuando más la necesites.</p>
            </>
          )}
        </div>
        <div className="landing-cta__actions">
          {isAuthenticated ? (
            <Link to="/chat" className="btn-primary">Ir al chat</Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary">Entrar ahora</Link>
              <Link to="/chat" className="btn-secondary">Probar como invitado</Link>
            </>
          )}
        </div>
      </section>

      <footer className="landing-footer">
        ALEX – Asistente de primeros auxilios con IA
      </footer>
    </div>
  );
}

export default Home;
