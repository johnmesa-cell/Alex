import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getApiError } from '../services/api.js';

const AVATAR_COLORS = [
  { name: 'Teal',    value: '#0f766e' },
  { name: 'Azul',    value: '#0369a1' },
  { name: 'Violeta', value: '#7c3aed' },
  { name: 'Naranja', value: '#b45309' },
  { name: 'Rosa',    value: '#be123c' },
  { name: 'Verde',   value: '#15803d' },
  { name: 'Cyan',    value: '#0e7490' },
  { name: 'Morado',  value: '#9333ea' },
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const PREF_KEY = 'alex_profile_prefs';
function loadProfilePrefs() { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; } }
function saveProfilePrefs(p) { localStorage.setItem(PREF_KEY, JSON.stringify(p)); }

function Profile() {
  const { user } = useAuth();

  // Nombre con el que ALEX le llama
  const [apodo,       setApodo]      = useState('');
  // Color del avatar
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0].value);
  // Idioma preferido de respuesta
  const [idioma,      setIdioma]     = useState('es');
  // Nivel de detalle en respuestas
  const [detalle,     setDetalle]    = useState('normal');
  // Nombre legal (de la cuenta)
  const [nombre,      setNombre]     = useState(user?.nombre || '');

  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');

  useEffect(() => {
    const p = loadProfilePrefs();
    if (p.apodo)       setApodo(p.apodo);
    if (p.avatarColor) setAvatarColor(p.avatarColor);
    if (p.idioma)      setIdioma(p.idioma);
    if (p.detalle)     setDetalle(p.detalle);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setErr(''); setMsg('');
    try {
      // Guarda nombre legal en backend si cambió
      if (nombre.trim() && nombre.trim() !== user?.nombre) {
        await api.put(`/api/users/${user?.id}`, { nombre: nombre.trim() });
      }
      // Guarda preferencias de personalización en localStorage
      saveProfilePrefs({ apodo, avatarColor, idioma, detalle });
      setMsg('Perfil personalizado guardado correctamente.');
      setTimeout(() => setMsg(''), 3000);
    } catch (e2) {
      setErr(getApiError(e2));
    } finally {
      setLoading(false);
    }
  };

  const initials = getInitials(apodo || nombre || user?.nombre);
  const displayName = apodo || nombre || user?.nombre || 'Usuario';

  return (
    <div className="profile-layout">

      {/* ── SIDEBAR con preview del avatar ── */}
      <aside className="profile-sidebar">
        <div className="profile-avatar-wrapper">
          <div
            className="profile-avatar"
            style={{ background: avatarColor }}
            aria-label={`Avatar de ${displayName}`}
          >
            {initials}
          </div>
          <h3 className="profile-name">{displayName}</h3>
          <p className="profile-email">{user?.correo || user?.email || ''}</p>
          <div className="profile-status">Vista previa</div>
        </div>

        {/* Selector de color de avatar */}
        <div className="profile-color-picker">
          <p className="profile-color-label">Color del avatar</p>
          <div className="profile-color-swatches">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                className={`color-swatch${avatarColor === c.value ? ' active' : ''}`}
                style={{ background: c.value }}
                onClick={() => setAvatarColor(c.value)}
                aria-pressed={avatarColor === c.value}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* ── CONTENIDO principal ── */}
      <div className="profile-content">

        <section className="profile-section">
          <h2>Personaliza tu experiencia</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
            Dile a ALEX cómo quieres que te llame y ajusta cómo te responde.
          </p>

          <form onSubmit={handleSave} className="settings-form">

            {/* Nombre legal */}
            <div className="form-group">
              <label htmlFor="p-nombre">Nombre completo (cuenta)</label>
              <input
                id="p-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
              />
              <small style={{ color: 'var(--text-faint)', fontSize: 'var(--text-xs)' }}>Este es el nombre registrado en tu cuenta.</small>
            </div>

            {/* Apodo — con énfasis */}
            <div className="form-group">
              <label htmlFor="p-apodo">
                ¿Cómo quieres que ALEX te llame?
                <span className="profile-badge">Personalizado</span>
              </label>
              <input
                id="p-apodo"
                type="text"
                value={apodo}
                onChange={(e) => setApodo(e.target.value)}
                placeholder={`Por ejemplo: "${(nombre || 'Juan').split(' ')[0]}", "Profe", "Doc"…`}
                maxLength={30}
              />
              <small style={{ color: 'var(--text-faint)', fontSize: 'var(--text-xs)' }}>
                Si lo dejas en blanco, ALEX usará tu nombre completo.
              </small>
            </div>

            {/* Idioma */}
            <div className="form-group">
              <label htmlFor="p-idioma">Idioma de respuesta preferido</label>
              <select id="p-idioma" value={idioma} onChange={(e) => setIdioma(e.target.value)}>
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="pt">Português</option>
              </select>
            </div>

            {/* Nivel de detalle */}
            <div className="form-group">
              <label htmlFor="p-detalle">Nivel de detalle en respuestas</label>
              <select id="p-detalle" value={detalle} onChange={(e) => setDetalle(e.target.value)}>
                <option value="breve">Breve — respuestas concisas y directas</option>
                <option value="normal">Normal — equilibrado (recomendado)</option>
                <option value="detallado">Detallado — explicaciones completas</option>
              </select>
            </div>

            {err && <p className="error-box">{err}</p>}
            {msg && <p className="success-box">{msg}</p>}

            <div className="settings-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Guardando…' : 'Guardar Personalización'}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}

export default Profile;
