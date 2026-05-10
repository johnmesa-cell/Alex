import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getApiError } from '../services/api.js';

const PREF_KEY = 'alex_prefs';

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; }
}
function savePrefs(prefs) {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // auto
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
}

function applyFontSize(size) {
  document.documentElement.style.setProperty('--base-font-size', `${size}px`);
}

function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [apiError, setApiError] = useState('');

  // ── Cuenta ──
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [notifEmail, setNotifEmail] = useState(true);

  // ── Privacidad ──
  const [perfilPublico, setPerfilPublico] = useState(false);
  const [mostrarConexion, setMostrarConexion] = useState(true);
  const [permitirBusqueda, setPermitirBusqueda] = useState(true);

  // ── Notificaciones ──
  const [notifChat, setNotifChat] = useState(true);
  const [notifActualizaciones, setNotifActualizaciones] = useState(false);
  const [notifSeguridad, setNotifSeguridad] = useState(true);

  // ── Apariencia ──
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState(16);
  const [animaciones, setAnimaciones] = useState(true);

  // Cargar preferencias guardadas al montar
  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs.theme) { setTheme(prefs.theme); applyTheme(prefs.theme); }
    if (prefs.fontSize) { setFontSize(prefs.fontSize); applyFontSize(prefs.fontSize); }
    if (prefs.animaciones !== undefined) setAnimaciones(prefs.animaciones);
    if (prefs.notifEmail !== undefined) setNotifEmail(prefs.notifEmail);
    if (prefs.perfilPublico !== undefined) setPerfilPublico(prefs.perfilPublico);
    if (prefs.mostrarConexion !== undefined) setMostrarConexion(prefs.mostrarConexion);
    if (prefs.permitirBusqueda !== undefined) setPermitirBusqueda(prefs.permitirBusqueda);
    if (prefs.notifChat !== undefined) setNotifChat(prefs.notifChat);
    if (prefs.notifActualizaciones !== undefined) setNotifActualizaciones(prefs.notifActualizaciones);
    if (prefs.notifSeguridad !== undefined) setNotifSeguridad(prefs.notifSeguridad);
  }, []);

  const showSuccess = (msg) => {
    setMessage(msg);
    setApiError('');
    setTimeout(() => setMessage(''), 3000);
  };

  // ── Guardar Cuenta ──
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) { setApiError('El nombre no puede estar vacío.'); return; }
    setLoading(true);
    setApiError('');
    try {
      await api.put(`/api/users/${user?.id}`, { nombre: nombre.trim() });
      savePrefs({ ...loadPrefs(), notifEmail });
      showSuccess('Cuenta actualizada correctamente.');
    } catch (err) {
      setApiError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Guardar Privacidad ──
  const handleSavePrivacy = (e) => {
    e.preventDefault();
    savePrefs({ ...loadPrefs(), perfilPublico, mostrarConexion, permitirBusqueda });
    showSuccess('Preferencias de privacidad guardadas.');
  };

  // ── Guardar Notificaciones ──
  const handleSaveNotifications = (e) => {
    e.preventDefault();
    savePrefs({ ...loadPrefs(), notifChat, notifActualizaciones, notifSeguridad });
    showSuccess('Preferencias de notificaciones guardadas.');
  };

  // ── Guardar Apariencia ──
  const handleSaveAppearance = (e) => {
    e.preventDefault();
    applyTheme(theme);
    applyFontSize(fontSize);
    savePrefs({ ...loadPrefs(), theme, fontSize, animaciones });
    showSuccess('Apariencia aplicada y guardada.');
  };

  const tabs = [
    { id: 'account',       label: 'Cuenta' },
    { id: 'privacy',       label: 'Privacidad' },
    { id: 'notifications', label: 'Notificaciones' },
    { id: 'appearance',    label: 'Apariencia' },
  ];

  return (
    <div className="settings-layout">
      <aside className="settings-menu">
        <h3>Configuración</h3>
        <p>Gestiona tus preferencias y cuenta</p>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`settings-menu-link ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setMessage(''); setApiError(''); }}
          >
            {tab.label}
          </button>
        ))}
        <div className="settings-menu-note">
          <p>Versión: 1.0.0</p>
          <p>© 2025 ALEX. Todos los derechos reservados.</p>
        </div>
      </aside>

      <div className="settings-content">

        {/* CUENTA */}
        {activeTab === 'account' && (
          <section className="settings-section active">
            <h2>Configuración de Cuenta</h2>
            <p>Actualiza tu información personal.</p>
            <form onSubmit={handleSaveAccount} className="settings-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={user?.correo || user?.email || ''} readOnly />
                <small style={{ color: 'var(--text-muted)' }}>El email no puede modificarse.</small>
              </div>
              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo</label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" className="toggle-switch" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} />
                  <span>Recibir notificaciones por email</span>
                </label>
              </div>
              {apiError && <p className="error-box">{apiError}</p>}
              {message && <p className="success-box">{message}</p>}
              <div className="settings-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* PRIVACIDAD */}
        {activeTab === 'privacy' && (
          <section className="settings-section active">
            <h2>Privacidad</h2>
            <p>Controla cómo se utiliza tu información.</p>
            <form onSubmit={handleSavePrivacy} className="settings-form">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" className="toggle-switch" checked={perfilPublico} onChange={(e) => setPerfilPublico(e.target.checked)} />
                  <span>Perfil público</span>
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" className="toggle-switch" checked={mostrarConexion} onChange={(e) => setMostrarConexion(e.target.checked)} />
                  <span>Mostrar última conexión</span>
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" className="toggle-switch" checked={permitirBusqueda} onChange={(e) => setPermitirBusqueda(e.target.checked)} />
                  <span>Permitir búsqueda de perfil</span>
                </label>
              </div>
              {message && <p className="success-box">{message}</p>}
              <div className="settings-actions">
                <button type="submit" className="btn-save">Guardar Cambios</button>
              </div>
            </form>
          </section>
        )}

        {/* NOTIFICACIONES */}
        {activeTab === 'notifications' && (
          <section className="settings-section active">
            <h2>Notificaciones</h2>
            <p>Configura cuándo y cómo deseas recibir notificaciones.</p>
            <form onSubmit={handleSaveNotifications} className="settings-form">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" className="toggle-switch" checked={notifChat} onChange={(e) => setNotifChat(e.target.checked)} />
                  <span>Notificaciones de chat</span>
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" className="toggle-switch" checked={notifActualizaciones} onChange={(e) => setNotifActualizaciones(e.target.checked)} />
                  <span>Notificaciones de actualizaciones</span>
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" className="toggle-switch" checked={notifSeguridad} onChange={(e) => setNotifSeguridad(e.target.checked)} />
                  <span>Notificaciones de seguridad</span>
                </label>
              </div>
              {message && <p className="success-box">{message}</p>}
              <div className="settings-actions">
                <button type="submit" className="btn-save">Guardar Cambios</button>
              </div>
            </form>
          </section>
        )}

        {/* APARIENCIA */}
        {activeTab === 'appearance' && (
          <section className="settings-section active">
            <h2>Apariencia</h2>
            <p>Personaliza la apariencia de la aplicación.</p>
            <form onSubmit={handleSaveAppearance} className="settings-form">
              <div className="form-group">
                <label htmlFor="theme">Tema</label>
                <select id="theme" className="settings-items" value={theme} onChange={(e) => setTheme(e.target.value)}>
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                  <option value="auto">Automático (sistema)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="fontSize">
                  Tamaño de fuente: <strong>{fontSize}px</strong>
                </label>
                <input
                  id="fontSize"
                  type="range"
                  min="12" max="20"
                  value={fontSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFontSize(val);
                    applyFontSize(val);
                  }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" className="toggle-switch" checked={animaciones} onChange={(e) => setAnimaciones(e.target.checked)} />
                  <span>Animaciones</span>
                </label>
              </div>
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
