import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getApiError } from '../services/api.js';

const PREF_KEY = 'alex_prefs';
function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; } }
function savePrefs(p) { localStorage.setItem(PREF_KEY, JSON.stringify(p)); }

function applyTheme(t) {
  const r = document.documentElement;
  if (t === 'dark') r.classList.add('dark');
  else if (t === 'light') r.classList.remove('dark');
  else r.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
}
function applyFontSize(s) { document.documentElement.style.setProperty('--base-font-size', `${s}px`); }

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      className="toggle-btn"
      onClick={() => onChange(!checked)}
    />
  );
}

function ToggleRow({ title, desc, checked, onChange, id }) {
  return (
    <div className="toggle-row">
      <label htmlFor={id} className="toggle-row__label" style={{ cursor: 'pointer' }}>
        <span className="toggle-row__title">{title}</span>
        {desc && <span className="toggle-row__desc">{desc}</span>}
      </label>
      <Toggle id={id} checked={checked} onChange={onChange} />
    </div>
  );
}

const TABS = [
  { id: 'account',       label: 'Cuenta',        icon: null },
  { id: 'privacy',       label: 'Privacidad',     icon: null },
  { id: 'notifications', label: 'Notificaciones', icon: null },
  { id: 'appearance',    label: 'Apariencia',     icon: null },
];

function Settings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState('');
  const [apiError, setApiError]   = useState('');

  // Cuenta
  const [nombre, setNombre]         = useState(user?.nombre || '');
  const [notifEmail, setNotifEmail] = useState(true);

  // Privacidad
  const [perfilPublico, setPerfilPublico]       = useState(false);
  const [mostrarConexion, setMostrarConexion]   = useState(true);
  const [permitirBusqueda, setPermitirBusqueda] = useState(true);

  // Notificaciones
  const [notifChat, setNotifChat]                       = useState(true);
  const [notifActualizaciones, setNotifActualizaciones] = useState(false);
  const [notifSeguridad, setNotifSeguridad]             = useState(true);

  // Apariencia
  const [theme, setTheme]         = useState('light');
  const [fontSize, setFontSize]   = useState(16);
  const [animaciones, setAnimaciones] = useState(true);

  useEffect(() => {
    const p = loadPrefs();
    if (p.theme)                            { setTheme(p.theme); applyTheme(p.theme); }
    if (p.fontSize)                         { setFontSize(p.fontSize); applyFontSize(p.fontSize); }
    if (p.animaciones !== undefined)        setAnimaciones(p.animaciones);
    if (p.notifEmail !== undefined)         setNotifEmail(p.notifEmail);
    if (p.perfilPublico !== undefined)      setPerfilPublico(p.perfilPublico);
    if (p.mostrarConexion !== undefined)    setMostrarConexion(p.mostrarConexion);
    if (p.permitirBusqueda !== undefined)   setPermitirBusqueda(p.permitirBusqueda);
    if (p.notifChat !== undefined)          setNotifChat(p.notifChat);
    if (p.notifActualizaciones !== undefined) setNotifActualizaciones(p.notifActualizaciones);
    if (p.notifSeguridad !== undefined)     setNotifSeguridad(p.notifSeguridad);
  }, []);

  const ok  = (msg) => { setMessage(msg); setApiError(''); setTimeout(() => setMessage(''), 3000); };
  const err = (msg) => { setApiError(msg); setMessage(''); };
  const changeTab = (id) => { setActiveTab(id); setMessage(''); setApiError(''); };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) { err('El nombre no puede estar vacío.'); return; }
    setLoading(true); setApiError('');
    try {
      // CORRECCIÓN Bug 1: ruta corregida. Antes apuntaba a /api/users/:id
      // que no existía en el backend → 404 silencioso.
      // Ahora usa user?.id_usuario (nombre normalizado en AuthContext).
      const { data } = await api.put(`/api/users/${user?.id_usuario}`, { nombre: nombre.trim() });
      savePrefs({ ...loadPrefs(), notifEmail });
      // Actualizar el contexto en tiempo real para que Navbar/Home reflejen
      // el nuevo nombre sin necesidad de recargar la página.
      if (data?.data?.user) updateUser(data.data.user);
      ok('Cuenta actualizada correctamente.');
    } catch (e2) { err(getApiError(e2)); }
    finally { setLoading(false); }
  };

  const handleSavePrivacy = (e) => {
    e.preventDefault();
    savePrefs({ ...loadPrefs(), perfilPublico, mostrarConexion, permitirBusqueda });
    ok('Privacidad guardada.');
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    savePrefs({ ...loadPrefs(), notifChat, notifActualizaciones, notifSeguridad });
    ok('Notificaciones guardadas.');
  };

  const handleSaveAppearance = (e) => {
    e.preventDefault();
    applyTheme(theme); applyFontSize(fontSize);
    savePrefs({ ...loadPrefs(), theme, fontSize, animaciones });
    ok('Apariencia aplicada y guardada.');
  };

  return (
    <div className="settings-layout">

      <aside className="settings-menu">
        <h3>Configuración</h3>
        <p>Gestiona tus preferencias y cuenta</p>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`settings-menu-link${activeTab === t.id ? ' active' : ''}`}
            onClick={() => changeTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <div className="settings-menu-note">
          <span>Versión 1.0.0</span>
          <span>© 2025 ALEX</span>
        </div>
      </aside>

      <div className="settings-content">

        {activeTab === 'account' && (
          <section className="settings-section">
            <h2>Configuración de Cuenta</h2>
            <p>Actualiza tu información personal y preferencias de comunicación.</p>
            <form onSubmit={handleSaveAccount} className="settings-form">
              <div className="form-group">
                <label htmlFor="s-email">Email</label>
                <input id="s-email" type="email" value={user?.correo || user?.email || ''} readOnly />
                <small style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>El email no puede modificarse desde aquí.</small>
              </div>
              <div className="form-group">
                <label htmlFor="s-nombre">Nombre Completo</label>
                <input id="s-nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre completo" />
              </div>
              <ToggleRow
                id="s-notifEmail"
                title="Notificaciones por email"
                desc="Recibe alertas y novedades en tu correo"
                checked={notifEmail}
                onChange={setNotifEmail}
              />
              {apiError && <p className="error-box">{apiError}</p>}
              {message  && <p className="success-box">{message}</p>}
              <div className="settings-actions">
                <button type="submit" className="btn-save" disabled={loading}>{loading ? 'Guardando…' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </section>
        )}

        {activeTab === 'privacy' && (
          <section className="settings-section">
            <h2>Privacidad</h2>
            <p>Controla cómo se comparte y utiliza tu información dentro de la plataforma.</p>
            <form onSubmit={handleSavePrivacy} className="settings-form">
              <ToggleRow id="s-pp" title="Perfil público"         desc="Otros usuarios pueden ver tu perfil"          checked={perfilPublico}    onChange={setPerfilPublico} />
              <ToggleRow id="s-mc" title="Mostrar última conexión" desc="Muestra cuándo fue tu última actividad"        checked={mostrarConexion}  onChange={setMostrarConexion} />
              <ToggleRow id="s-pb" title="Permitir búsqueda"       desc="Tu perfil aparece en resultados de búsqueda" checked={permitirBusqueda} onChange={setPermitirBusqueda} />
              {message && <p className="success-box">{message}</p>}
              <div className="settings-actions">
                <button type="submit" className="btn-save">Guardar Cambios</button>
              </div>
            </form>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="settings-section">
            <h2>Notificaciones</h2>
            <p>Configura cuándo y cómo quieres recibir notificaciones dentro de la app.</p>
            <form onSubmit={handleSaveNotifications} className="settings-form">
              <ToggleRow id="s-nc" title="Notificaciones de chat"      desc="Alertas de nuevos mensajes en conversaciones"  checked={notifChat}           onChange={setNotifChat} />
              <ToggleRow id="s-na" title="Actualizaciones del sistema" desc="Novedades y mejoras de la plataforma"           checked={notifActualizaciones} onChange={setNotifActualizaciones} />
              <ToggleRow id="s-ns" title="Alertas de seguridad"        desc="Avisos sobre acceso y actividad sospechosa"    checked={notifSeguridad}      onChange={setNotifSeguridad} />
              {message && <p className="success-box">{message}</p>}
              <div className="settings-actions">
                <button type="submit" className="btn-save">Guardar Cambios</button>
              </div>
            </form>
          </section>
        )}

        {activeTab === 'appearance' && (
          <section className="settings-section">
            <h2>Apariencia</h2>
            <p>Personaliza el aspecto visual de la aplicación según tus preferencias.</p>
            <form onSubmit={handleSaveAppearance} className="settings-form">
              <div className="form-group">
                <label htmlFor="s-theme">Tema de la interfaz</label>
                <select id="s-theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                  <option value="auto">Automático (sistema)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="s-fontSize">
                  Tamaño de fuente &mdash; <strong>{fontSize}px</strong>
                </label>
                <input
                  id="s-fontSize" type="range" min="12" max="20" step="1"
                  value={fontSize}
                  onChange={(e) => { const v = Number(e.target.value); setFontSize(v); applyFontSize(v); }}
                />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'var(--text-xs)', color:'var(--text-faint)', maxWidth:'480px' }}>
                  <span>Pequeño (12px)</span><span>Grande (20px)</span>
                </div>
              </div>
              <ToggleRow
                id="s-anim"
                title="Animaciones"
                desc="Transiciones y efectos visuales en la interfaz"
                checked={animaciones}
                onChange={setAnimaciones}
              />
              {message && <p className="success-box">{message}</p>}
              <div className="settings-actions">
                <button type="submit" className="btn-save">Aplicar y Guardar</button>
              </div>
            </form>
          </section>
        )}

      </div>
    </div>
  );
}

export default Settings;
