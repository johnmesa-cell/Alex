import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError } from '../services/api.js';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fromPath = location.state?.from?.pathname || '/chat';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-page">
      <aside className="auth-sidebar">
        <div className="auth-info-card">
          <h3>¿Por qué ALEX?</h3>
          <p>ALEX es una asistente de IA especializada en resolver dudas educativas y profesionales con precisión.</p>
        </div>
        <div className="auth-info-card">
          <h3>Conversaciones Seguras</h3>
          <p>Tus chats están protegidos con encriptación end-to-end. Tu privacidad es nuestra prioridad.</p>
        </div>
        <div className="auth-info-card">
          <h3>Acceso Ilimitado</h3>
          <p>Una vez dentro, tienes acceso a todas las funcionalidades premium de ALEX sin limitaciones.</p>
        </div>
      </aside>

      <div className="form-card">
        <h1>Iniciar sesión</h1>
        <p className="form-copy">Accede para abrir el chat protegido y consultar a la IA.</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <p className="error-box">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Validando...' : 'Entrar'}
          </button>
        </form>

        <p className="helper-row">
          ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
