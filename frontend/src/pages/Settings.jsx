import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Cambios guardados correctamente.');
    setTimeout(() => {
      setLoading(false);
      setMessage('');
    }, 3000);
  };

  const tabs = [
    { id: 'account', label: 'Cuenta' },
    { id: 'privacy', label: 'Privacidad' },
    { id: 'notifications', label: 'Notificaciones' },
    { id: 'appearance', label: 'Apariencia' },
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
            onClick={() => setActiveTab(tab.id)}
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
        {/* ACCOUNT SETTINGS */}
        <section className={`settings-section ${activeTab === 'account' ? 'active' : ''}`}>
          <h2>Configuración de Cuenta</h2>
          <p>Actualiza tu información personal y preferencias de cuenta.</p>

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                defaultValue={user?.email || 'usuario@ejemplo.com'}
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="nombre">Nombre Completo</label>
              <input
                id="nombre"
                type="text"
                defaultValue={user?.nombre || 'Usuario'}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="form-group">
              <label>
                <span>Recibir notificaciones por email</span>
                <input type="checkbox" className="toggle-switch" defaultChecked />
              </label>
            </div>

            <div className="settings-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button type="button" className="btn-cancel" onClick={() => setActiveTab(activeTab)}>
                Cancelar
              </button>
            </div>

            {message && <div className="success-box">{message}</div>}
          </form>
        </section>

        {/* PRIVACY SETTINGS */}
        <section className={`settings-section ${activeTab === 'privacy' ? 'active' : ''}`}>
          <h2>Privacidad</h2>
          <p>Controla cómo se utiliza tu información y datos.</p>

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label>
                <span>Perfil público</span>
                <input type="checkbox" className="toggle-switch" />
              </label>
            </div>

            <div className="form-group">
              <label>
                <span>Mostrar última conexión</span>
                <input type="checkbox" className="toggle-switch" defaultChecked />
              </label>
            </div>

            <div className="form-group">
              <label>
                <span>Permitir búsqueda de perfil</span>
                <input type="checkbox" className="toggle-switch" defaultChecked />
              </label>
            </div>

            <div className="settings-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button type="button" className="btn-cancel">
                Cancelar
              </button>
            </div>
          </form>
        </section>

        {/* NOTIFICATIONS SETTINGS */}
        <section className={`settings-section ${activeTab === 'notifications' ? 'active' : ''}`}>
          <h2>Notificaciones</h2>
          <p>Configura cuándo y cómo deseas recibir notificaciones.</p>

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label>
                <span>Notificaciones de chat</span>
                <input type="checkbox" className="toggle-switch" defaultChecked />
              </label>
            </div>

            <div className="form-group">
              <label>
                <span>Notificaciones de actualizaciones</span>
                <input type="checkbox" className="toggle-switch" />
              </label>
            </div>

            <div className="form-group">
              <label>
                <span>Notificaciones de seguridad</span>
                <input type="checkbox" className="toggle-switch" defaultChecked />
              </label>
            </div>

            <div className="settings-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button type="button" className="btn-cancel">
                Cancelar
              </button>
            </div>
          </form>
        </section>

        {/* APPEARANCE SETTINGS */}
        <section className={`settings-section ${activeTab === 'appearance' ? 'active' : ''}`}>
          <h2>Apariencia</h2>
          <p>Personaliza la apariencia de la aplicación.</p>

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label htmlFor="theme">Tema</label>
              <select id="theme" className="settings-items">
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <span>Tamaño de fuente</span>
                <input type="range" min="12" max="18" defaultValue="16" />
              </label>
            </div>

            <div className="form-group">
              <label>
                <span>Animaciones</span>
                <input type="checkbox" className="toggle-switch" defaultChecked />
              </label>
            </div>

            <div className="settings-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button type="button" className="btn-cancel">
                Cancelar
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Settings;
