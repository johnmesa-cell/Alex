import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import logoAlex from '../assets/logo-alex.png';

const AVATAR_COLORS = [
  '#0f766e','#0369a1','#7c3aed','#b45309','#be185d','#15803d','#c2410c','#1d4ed8'
];

function getPrimerNombre(nombre) {
  if (!nombre) return '';
  return nombre.trim().split(' ')[0];
}

function getInitials(nombre) {
  if (!nombre) return '?';
  const parts = nombre.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getAvatarColor(nombre) {
  if (!nombre) return AVATAR_COLORS[0];
  const code = [...nombre].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function formatFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const ahora = new Date();
  const diffH = (ahora - d) / 3600000;
  if (diffH < 24 && d.getDate() === ahora.getDate()) {
    return 'Hoy, ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  if (d.getDate() === ayer.getDate() && diffH < 48) {
    return 'Ayer, ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function HeroIllustration() {
  return (
    <svg
      className="hero-illustration"
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="320" height="220" rx="20" fill="#f0fdfa"/>
      <rect x="100" y="24" width="120" height="172" rx="16" fill="#fff" stroke="#99f6e4" strokeWidth="2"/>
      <rect x="108" y="40" width="104" height="10" rx="5" fill="#ccfbf1"/>
      <rect x="108" y="58" width="80" height="22" rx="8" fill="#0f766e"/>
      <rect x="111" y="63" width="52" height="6" rx="3" fill="#ccfbf1" opacity="0.8"/>
      <rect x="111" y="72" width="38" height="4" rx="2" fill="#ccfbf1" opacity="0.5"/>
      <rect x="132" y="88" width="76" height="22" rx="8" fill="#e0f2fe"/>
      <rect x="136" y="93" width="48" height="6" rx="3" fill="#0369a1" opacity="0.5"/>
      <rect x="136" y="102" width="32" height="4" rx="2" fill="#0369a1" opacity="0.3"/>
      <rect x="108" y="118" width="88" height="30" rx="8" fill="#0f766e" opacity="0.85"/>
      <rect x="112" y="123" width="60" height="5" rx="2.5" fill="#ccfbf1" opacity="0.8"/>
      <rect x="112" y="131" width="44" height="4" rx="2" fill="#ccfbf1" opacity="0.5"/>
      <rect x="112" y="138" width="52" height="4" rx="2" fill="#ccfbf1" opacity="0.4"/>
      <rect x="108" y="162" width="104" height="18" rx="9" fill="#f0fdfa" stroke="#99f6e4" strokeWidth="1.5"/>
      <rect x="116" y="167" width="60" height="6" rx="3" fill="#99f6e4" opacity="0.7"/>
      <circle cx="200" cy="171" r="7" fill="#0f766e"/>
      <path d="M197 171l3-2.5v5L197 171z" fill="#fff"/>
      <circle cx="56" cy="70" r="26" fill="#fff" stroke="#0f766e" strokeWidth="2"/>
      <rect x="50" y="60" width="12" height="20" rx="3" fill="#0f766e"/>
      <rect x="46" y="64" width="20" height="12" rx="3" fill="#0f766e"/>
      <polyline points="20,150 34,150 40,134 48,166 56,142 62,150 76,150" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="264" cy="80" r="20" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5"/>
      <text x="264" y="86" textAnchor="middle" fontSize="18" fill="#ca8a04">!</text>
      <circle cx="264" cy="150" r="10" fill="#ccfbf1" stroke="#0f766e" strokeWidth="1.5"/>
      <path d="M260 150h8M264 146v8" stroke="#0f766e" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

const ACCIONES = [
  { label: 'Nueva consulta', desc: 'Abre el chat y empieza a describir la situación.', icon: '💬', to: '/chat' },
  // ← apunta a /chat?panel=historial para que el panel se abra automáticamente
  { label: 'Ver historial', desc: 'Revisa tus consultas anteriores guardadas.', icon: '🕐', to: '/chat?panel=historial' },
  { label: 'Configuración', desc: 'Ajusta tu perfil, seguridad y preferencias.', icon: '⚙️', to: '/settings' },
];

function Home() {
  const { isAuthenticated, user } = useAuth();
  const primerNombre = getPrimerNombre(user?.nombre);
  const initials = getInitials(user?.nombre);
  const avatarColor = getAvatarColor(user?.nombre);

  const [resumen, setResumen] = useState(null);
  const [resumenLoading, setResumenLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setResumenLoading(true);
    api.get('/api/consultas/resumen')
      .then(({ data }) => setResumen(data?.data ?? null))
      .catch(() => setResumen(null))
      .finally(() => setResumenLoading(false));
  }, [isAuthenticated]);

  const stats = resumen
    ? [
        { label: 'Consultas realizadas', value: String(resumen.totalConsultas ?? 0) },
        { label: 'Archivos subidos',     value: String(resumen.archivosSubidos ?? 0) },
        { label: 'Último acceso',        value: user?.ultimo_login ? formatFecha(user.ultimo_login) : 'Hoy' },
      ]
    : [
        { label: 'Consultas realizadas', value: resumenLoading ? '…' : '0' },
        { label: 'Archivos subidos',     value: resumenLoading ? '…' : '0' },
        { label: 'Último acceso',        value: 'Hoy' },
      ];

  const ultimaConsulta = resumen?.ultimaConsulta ?? null;

  return (
    <div className="public-page">
      <section className="landing-hero">
        <div className="landing-hero__left">
          {isAuthenticated ? (
            <div className="landing-auth-left">
              <div className="landing-section-label">Acciones rápidas</div>
              <div className="landing-actions">
                {ACCIONES.map((a, idx) => (
                  <Link key={a.label} to={a.to} className="landing-action-card fade-up" style={{ animationDelay: `${idx * 0.04}s` }}>
                    <span className="landing-action-icon">{a.icon}</span>
                    <div>
                      <p className="landing-action-title">{a.label}</p>
                      <p className="landing-action-desc">{a.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="landing-section-label" style={{ marginTop: 'var(--space-4)' }}>Última consulta</div>
              <div className="landing-last-chat fade-up">
                {resumenLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div className="skeleton skeleton-text" style={{ height: '12px', width: '50%' }} />
                    <div className="skeleton skeleton-text" style={{ height: '16px', width: '100%' }} />
                    <div className="skeleton skeleton-text" style={{ height: '16px', width: '80%' }} />
                  </div>
                ) : ultimaConsulta ? (
                  <>
                    <div className="landing-last-chat__meta">
                      <span className="landing-last-chat__date">{formatFecha(ultimaConsulta.fecha_creacion)}</span>
                    </div>
                    <p className="landing-last-chat__resumen">{ultimaConsulta.asunto}</p>
                    <Link to="/chat?panel=historial" className="btn-secondary" style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', alignSelf: 'start' }}>Ver historial →</Link>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center', justifyContent: 'center', minHeight: '80px', textAlign: 'center' }}>
                    <span style={{ fontSize: '2rem' }}>📋</span>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>Sin consultas aún</p>
                    <Link to="/chat" style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', fontWeight: 600 }}>Inicia una ahora →</Link>
                  </div>
                )}
              </div>

              <div className="landing-section-label" style={{ marginTop: 'var(--space-4)' }}>Resumen de actividad</div>
              <div className="landing-stats">
                {resumenLoading ? (
                  <>
                    <div className="landing-stat-card fade-up skeleton skeleton-kpi" />
                    <div className="landing-stat-card fade-up skeleton skeleton-kpi" style={{ animationDelay: '0.04s' }} />
                    <div className="landing-stat-card fade-up skeleton skeleton-kpi" style={{ animationDelay: '0.08s' }} />
                  </>
                ) : (
                  stats.map((s) => (
                    <div key={s.label} className="landing-stat-card fade-up">
                      <span className="landing-stat-value">{s.value}</span>
                      <span className="landing-stat-label">{s.label}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="landing-info-cards">
              <div className="landing-card fade-up">
                <h3>Objetivo de ALEX</h3>
                <p>Brindar orientación inicial de primeros auxilios para apoyar la toma de decisiones rápida mientras el usuario contacta servicios de emergencia.</p>
              </div>
              <div className="landing-card fade-up" style={{ animationDelay: '60ms' }}>
                <h3>Sobre nosotros</h3>
                <p>Somos un proyecto enfocado en salud digital y prevención, combinando tecnología y educación para acercar recomendaciones claras a cualquier persona.</p>
              </div>
              <div className="landing-card fade-up" style={{ animationDelay: '120ms' }}>
                <h3>Soporte</h3>
                <p>Si tienes dudas escríbenos a{' '}<a href="mailto:soporte@alex-app.test">soporte@alex-app.test</a> o usa el canal de ayuda cuando inicies sesión.</p>
              </div>
              <div className="landing-card fade-up" style={{ animationDelay: '180ms' }}>
                <h3>Cómo funciona</h3>
                <div className="landing-steps-visual">
                  {['Inicia sesión o crea tu cuenta.','Describe la situación en el chat.','Recibe orientación paso a paso.'].map((step, i) => (
                    <div key={i} className="landing-step">
                      <span className="landing-step-num">{i + 1}</span>
                      <span className="landing-step-text">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="landing-hero__right slide-in">
          <div className="landing-hero-card">
            {isAuthenticated ? (
              <div className="landing-avatar-lg" style={{ background: avatarColor }}>
                {initials}
              </div>
            ) : (
              <div className="landing-logo-icon">
                <img src={logoAlex} alt="Logo ALEX" />
              </div>
            )}

            <p className="landing-eyebrow">Asistente de primeros auxilios con IA</p>

            {isAuthenticated ? (
              <>
                <h1 className="landing-headline">
                  Bienvenido de nuevo{primerNombre ? `, ${primerNombre}` : ''}.
                </h1>
                <p className="landing-copy">
                  Tu sesión ya está activa. Puedes continuar tus consultas de primeros
                  auxilios y recibir orientación inicial de forma inmediata.
                </p>
                <div className="landing-badges">
                  <span className="landing-badge">Chat guiado</span>
                  <span className="landing-badge">Dictado por voz</span>
                  <span className="landing-badge landing-badge--active">✓ Sesión activa</span>
                </div>
                <Link to="/chat" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>Ir al chat →</Link>
                <div className="landing-disclaimer">
                  <span className="landing-disclaimer-icon">🛡️</span>
                  ALEX orienta primeros pasos y no reemplaza atención médica profesional.
                </div>
              </>
            ) : (
              <>
                <h1 className="landing-headline">
                  Orientación inicial cuando cada segundo importa
                </h1>
                <p className="landing-copy">
                  ALEX te guía con pasos iniciales de primeros auxilios mientras contactas
                  ayuda profesional.
                </p>
                <div className="landing-badges">
                  <span className="landing-badge">Chat guiado</span>
                  <span className="landing-badge">Dictado por voz</span>
                  <span className="landing-badge">Acceso seguro</span>
                </div>
                <div className="landing-hero-cta">
                  <Link to="/register" className="btn-primary">Crear cuenta gratis</Link>
                  <Link to="/chat" className="btn-secondary">Probar como invitado</Link>
                </div>
                <HeroIllustration />
                <div className="landing-disclaimer">
                  <span className="landing-disclaimer-icon">🛡️</span>
                  ALEX orienta primeros pasos y no reemplaza atención médica profesional.
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta__text">
          {isAuthenticated ? (
            <><h2>¿Listo para continuar?</h2><p>Tu historial y configuración te esperan en el chat.</p></>
          ) : (
            <><h2>¿Listo para comenzar?</h2><p>Accede al asistente y ten una guía inicial cuando más la necesites.</p></>
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
