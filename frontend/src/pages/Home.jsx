import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Home() {
  const { isAuthenticated } = useAuth();

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
            {/* Logo / ícono */}
            <div className="landing-logo-icon" aria-hidden="true">
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="36" cy="36" r="34" stroke="#0f766e" strokeWidth="2" fill="none" />
                <circle cx="36" cy="36" r="26" stroke="#0f766e" strokeWidth="1" fill="none" opacity="0.4" />
                <path d="M20 36 Q24 26 28 36 Q30 40 32 34 L36 28 L40 38 Q42 42 44 36 Q48 26 52 36"
                  stroke="#0f766e" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M34 36 h-4 M38 36 h4 M36 34 v-4 M36 38 v4"
                  stroke="#ff7f50" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <p className="landing-eyebrow">Asistente de primeros auxilios con IA</p>
            <h1 className="landing-headline">
              Orientación inicial cuando cada segundo importa
            </h1>
            <p className="landing-copy">
              ALEX te guía con pasos iniciales de primeros auxilios mientras contactas ayuda
              profesional. Inicia sesión o crea tu cuenta para abrir el chat.
            </p>

            <div className="landing-badges">
              <span className="landing-badge">Chat guiado</span>
              <span className="landing-badge">Dictado por voz</span>
              <span className="landing-badge">Acceso seguro</span>
            </div>

            <div className="landing-mockup-banner">
              Mockup visual de portada para usuario sin sesión activa.
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA inferior ── */}
      <section className="landing-cta">
        <div className="landing-cta__text">
          <h2>¿Listo para comenzar?</h2>
          <p>Accede al asistente y ten una guía inicial cuando más la necesites.</p>
        </div>
        <div className="landing-cta__actions">
          {isAuthenticated ? (
            <Link to="/chat" className="btn-primary">Ir al chat</Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary">Entrar ahora</Link>
              <Link to="/login" className="btn-secondary">Probar como invitado</Link>
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
