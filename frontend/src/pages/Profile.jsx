import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function Profile() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || 'Usuario',
    email: user?.email || 'usuario@ejemplo.com',
    bio: 'Ingeniero de software apasionado por la IA',
    ubicacion: 'Colombia',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simular envío a API
    setTimeout(() => {
      setIsEditing(false);
      setLoading(false);
    }, 1500);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="profile-layout">
      {/* SIDEBAR */}
      <aside className="profile-sidebar">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">{getInitials(profileData.nombre)}</div>
          <h3 className="profile-name">{profileData.nombre}</h3>
          <p className="profile-email">{profileData.email}</p>
          <div className="profile-status">Activo</div>
        </div>

        <div className="profile-actions">
          <button
            className="profile-action-btn primary"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancelar' : 'Editar Perfil'}
          </button>
          <button className="profile-action-btn" onClick={() => window.print()}>
            Descargar CV
          </button>
          <button className="profile-action-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="profile-content">
        {/* EDIT SECTION */}
        {isEditing && (
          <section className="profile-section fade-up">
            <h2>Editar Perfil</h2>

            <form onSubmit={handleSave} className="settings-form">
              <div className="profile-grid">
                <div className="profile-field">
                  <label htmlFor="nombre">Nombre Completo</label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={profileData.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="ubicacion">Ubicación</label>
                  <input
                    id="ubicacion"
                    name="ubicacion"
                    type="text"
                    value={profileData.ubicacion}
                    onChange={handleChange}
                    placeholder="Tu ubicación"
                  />
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="bio">Biografía</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  placeholder="Cuéntanos sobre ti"
                />
              </div>

              <div className="profile-actions-bottom">
                <button type="submit" className="btn-profile-save" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  className="btn-profile-cancel"
                  onClick={() => setIsEditing(false)}
                >
                  Descartar
                </button>
              </div>
            </form>
          </section>
        )}

        {/* VIEW SECTION */}
        {!isEditing && (
          <section className="profile-section fade-up">
            <h2>Información del Perfil</h2>

            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Nombre:</span>
                <span className="info-value">{profileData.nombre}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{profileData.email}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Ubicación:</span>
                <span className="info-value">{profileData.ubicacion}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Biografía:</span>
                <span className="info-value">{profileData.bio}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Miembro desde:</span>
                <span className="info-value">12 de Enero, 2025</span>
              </div>

              <div className="info-row">
                <span className="info-label">Estado:</span>
                <span className="info-value">✓ Verificado</span>
              </div>
            </div>
          </section>
        )}

        {/* STATS SECTION */}
        <section className="profile-section fade-up">
          <h2>Estadísticas</h2>

          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Chats Totales:</span>
              <span className="info-value">24</span>
            </div>

            <div className="info-row">
              <span className="info-label">Promedio de Mensajes por Chat:</span>
              <span className="info-value">8.5</span>
            </div>

            <div className="info-row">
              <span className="info-label">Última Actividad:</span>
              <span className="info-value">Hace 2 horas</span>
            </div>

            <div className="info-row">
              <span className="info-label">Almacenamiento Usado:</span>
              <span className="info-value">125 MB / 1 GB</span>
            </div>
          </div>
        </section>

        {/* ACCOUNT SECURITY */}
        <section className="profile-section fade-up">
          <h2>Seguridad de la Cuenta</h2>

          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Contraseña:</span>
              <span className="info-value">
                <button className="profile-action-btn">Cambiar Contraseña</button>
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Autenticación de Dos Factores:</span>
              <span className="info-value">
                <button className="profile-action-btn">Configurar 2FA</button>
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Sesiones Activas:</span>
              <span className="info-value">1</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;
