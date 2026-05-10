import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getApiError } from '../services/api.js';

const AVATAR_COLORS = [
  '#0f766e','#0369a1','#7c3aed','#b45309','#be185d','#15803d','#c2410c','#1d4ed8'
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getAvatarColor(nombre) {
  if (!nombre) return AVATAR_COLORS[0];
  const code = [...nombre].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function formatFechaLarga(iso) {
  if (!iso) return 'Desconocido';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatFechaCorta(iso) {
  if (!iso) return 'Hoy';
  const d = new Date(iso);
  const ahora = new Date();
  const diffH = (ahora - d) / 3600000;
  if (diffH < 1) return 'Hace unos minutos';
  if (diffH < 24 && d.getDate() === ahora.getDate()) return `Hace ${Math.floor(diffH)}h`;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function Profile() {
  const { user, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [ubicacion, setUbicacion] = useState('');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');

  // Estadísticas reales
  const [resumen, setResumen] = useState(null);
  const [resumenLoading, setResumenLoading] = useState(true);

  useEffect(() => {
    api.get('/api/consultas/resumen')
      .then(({ data }) => setResumen(data?.data ?? null))
      .catch(() => setResumen(null))
      .finally(() => setResumenLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) { setSaveErr('El nombre no puede estar vacío.'); return; }
    setLoading(true);
    setSaveErr('');
    setSaveMsg('');
    try {
      await api.put(`/api/users/${user?.id}`, { nombre: nombre.trim() });
      setSaveMsg('Perfil actualizado correctamente.');
      setTimeout(() => { setSaveMsg(''); setIsEditing(false); }, 1500);
    } catch (err) {
      setSaveErr(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const initials   = getInitials(nombre);
  const bgColor    = getAvatarColor(nombre);
  const miembroDesde = formatFechaLarga(user?.fechaRegistro);
  const ultimaActividad = formatFechaCorta(resumen?.ultimaConsulta?.fecha_creacion);

  return (
    <div className="profile-layout">
      {/* SIDEBAR */}
      <aside className="profile-sidebar">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar" style={{ background: bgColor }}>{initials}</div>
          <h3 className="profile-name">{nombre || 'Usuario'}</h3>
          <p className="profile-email">{user?.correo || user?.email || ''}</p>
          <div className="profile-status">Activo</div>
        </div>
        <div className="profile-actions">
          <button className="profile-action-btn primary" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancelar' : 'Editar Perfil'}
          </button>
          <button className="profile-action-btn" onClick={logout}>Cerrar Sesión</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="profile-content">

        {/* EDICIÓN */}
        {isEditing && (
          <section className="profile-section fade-up">
            <h2>Editar Perfil</h2>
            <form onSubmit={handleSave} className="settings-form">
              <div className="profile-grid">
                <div className="profile-field">
                  <label htmlFor="p-nombre">Nombre Completo</label>
                  <input id="p-nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
                </div>
                <div className="profile-field">
                  <label htmlFor="p-ubicacion">Ubicación</label>
                  <input id="p-ubicacion" type="text" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Tu ubicación" />
                </div>
              </div>
              <div className="profile-field">
                <label htmlFor="p-bio">Biografía</label>
                <textarea id="p-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cuéntanos sobre ti" rows={3} />
              </div>
              {saveErr && <p className="error-box">{saveErr}</p>}
              {saveMsg && <p className="success-box">{saveMsg}</p>}
              <div className="profile-actions-bottom">
                <button type="submit" className="btn-profile-save" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button type="button" className="btn-profile-cancel" onClick={() => setIsEditing(false)}>Descartar</button>
              </div>
            </form>
          </section>
        )}

        {/* INFORMACIÓN */}
        {!isEditing && (
          <section className="profile-section fade-up">
            <h2>Información del Perfil</h2>
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Nombre:</span>
                <span className="info-value">{nombre || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.correo || user?.email || '—'}</span>
              </div>
              {ubicacion && (
                <div className="info-row">
                  <span className="info-label">Ubicación:</span>
                  <span className="info-value">{ubicacion}</span>
                </div>
              )}
              {bio && (
                <div className="info-row">
                  <span className="info-label">Biografía:</span>
                  <span className="info-value">{bio}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Miembro desde:</span>
                <span className="info-value">{miembroDesde}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Estado:</span>
                <span className="info-value">✓ Verificado</span>
              </div>
            </div>
          </section>
        )}

        {/* ESTADÍSTICAS REALES */}
        <section className="profile-section fade-up">
          <h2>Estadísticas</h2>
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Consultas totales:</span>
              <span className="info-value">{resumenLoading ? '…' : (resumen?.totalConsultas ?? 0)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Archivos subidos:</span>
              <span className="info-value">{resumenLoading ? '…' : (resumen?.archivosSubidos ?? 0)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Última actividad:</span>
              <span className="info-value">{resumenLoading ? '…' : ultimaActividad}</span>
            </div>
          </div>
        </section>

        {/* SEGURIDAD */}
        <section className="profile-section fade-up">
          <h2>Seguridad de la Cuenta</h2>
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Sesiones activas:</span>
              <span className="info-value">1</span>
            </div>
            <div className="info-row">
              <span className="info-label">Contraseña:</span>
              <span className="info-value" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                El cambio de contraseña se gestiona desde la opción «Olvidé mi contraseña» en el login.
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Profile;
