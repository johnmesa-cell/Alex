import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError } from '../services/api.js';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [touched, setTouched]   = useState({ email: false, password: false });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const fromPath = location.state?.from?.pathname || '/chat';

  const emailError    = touched.email    && !validateEmail(formData.email)    ? 'Ingresa un email válido.' : '';
  const passwordError = touched.password && formData.password.length < 8      ? 'Mínimo 8 caracteres.' : '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (emailError || passwordError || !formData.email || !formData.password) return;
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
          <p>Orientación inicial de primeros auxilios con IA, disponible cuando más lo necesitas.</p>
        </div>
        <div className="auth-info-card">
          <h3>Conversaciones Seguras</h3>
          <p>Tus consultas están protegidas. Tu privacidad es nuestra prioridad.</p>
        </div>
        <div className="auth-info-card">
          <h3>Acceso Completo</h3>
          <p>Historial, subida de archivos y métricas disponibles tras iniciar sesión.</p>
        </div>
      </aside>

      <div className="form-card">
        <h1>Iniciar sesión</h1>
        <p className="form-copy">Accede para abrir el chat protegido y consultar a la IA.</p>

        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="ejemplo@correo.com"
              autoComplete="email"
            />
            {emailError && <span className="field-error">{emailError}</span>}
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {passwordError && <span className="field-error">{passwordError}</span>}
          </label>

          <div style={{ textAlign: 'right', marginTop: '-4px' }}>
            <Link to="/forgot-password" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

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
