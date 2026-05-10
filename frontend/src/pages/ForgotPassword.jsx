import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getApiError } from '../services/api.js';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const emailError = touched && !validateEmail(email) ? 'Ingresa un email válido.' : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!validateEmail(email)) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('Si el email está registrado, recibirás un enlace para restablecer tu contraseña.');
    } catch (err) {
      // Mostramos mensaje genérico por seguridad
      setSuccess('Si el email está registrado, recibirás un enlace para restablecer tu contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-page">
      <aside className="auth-sidebar">
        <div className="auth-info-card">
          <h3>Recuperar acceso</h3>
          <p>Ingresa tu email y te enviaremos las instrucciones para restablecer tu contraseña.</p>
        </div>
        <div className="auth-info-card">
          <h3>¿No tienes cuenta?</h3>
          <p>Puedes crear una cuenta nueva de forma gratuita y comenzar a usar ALEX de inmediato.</p>
        </div>
      </aside>

      <div className="form-card">
        <h1>Olvidé mi contraseña</h1>
        <p className="form-copy">Ingresa el email asociado a tu cuenta y te enviaremos un enlace de recuperación.</p>

        {success ? (
          <div className="success-box" style={{ marginTop: '16px' }}>
            <p>{success}</p>
            <Link to="/login" style={{ display: 'inline-block', marginTop: '12px', color: 'var(--color-primary)' }}>
              ← Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-grid" noValidate>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
              />
              {emailError && <span className="field-error">{emailError}</span>}
            </label>

            {error && <p className="error-box">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <p className="helper-row">
              <Link to="/login">← Volver al inicio de sesión</Link>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

export default ForgotPassword;
