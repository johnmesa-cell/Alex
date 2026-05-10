import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError } from '../services/api.js';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordStrength(pwd) {
  if (pwd.length === 0) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 1, label: 'Débil',    color: '#ef4444' };
  if (score <= 2) return { level: 2, label: 'Regular',  color: '#f59e0b' };
  if (score <= 3) return { level: 3, label: 'Buena',    color: '#3b82f6' };
  return            { level: 4, label: 'Fuerte',   color: '#22c55e' };
}

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData]   = useState({ nombre: '', email: '', password: '' });
  const [confirmPwd, setConfirmPwd] = useState('');
  const [touched, setTouched]     = useState({ nombre: false, email: false, password: false, confirmPwd: false });
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);

  const strength = getPasswordStrength(formData.password);

  const nombreError      = touched.nombre     && !formData.nombre.trim()               ? 'El nombre es requerido.' : '';
  const emailError       = touched.email      && !validateEmail(formData.email)         ? 'Ingresa un email válido.' : '';
  const passwordError    = touched.password   && formData.password.length < 8          ? 'Mínimo 8 caracteres.' : '';
  const confirmPwdError  = touched.confirmPwd && formData.password !== confirmPwd       ? 'Las contraseñas no coinciden.' : '';

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
    setTouched({ nombre: true, email: true, password: true, confirmPwd: true });
    if (nombreError || emailError || passwordError || confirmPwdError) return;
    if (!formData.nombre.trim() || !validateEmail(formData.email) || formData.password.length < 8 || formData.password !== confirmPwd) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await register(formData);
      setSuccess(response.message || 'Registro exitoso. Ahora inicia sesión.');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
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
          <h3>Únete a ALEX</h3>
          <p>Orientación de primeros auxilios con IA, disponible cuando más lo necesitas.</p>
        </div>
        <div className="auth-info-card">
          <h3>Registro Seguro</h3>
          <p>Tu información está protegida con los más altos estándares de seguridad.</p>
        </div>
        <div className="auth-info-card">
          <h3>Gratis para Empezar</h3>
          <p>Comienza gratuitamente y accede a historial, archivos y métricas.</p>
        </div>
      </aside>

      <div className="form-card">
        <h1>Crear cuenta</h1>
        <p className="form-copy">Regístrate para acceder a ALEX y comenzar a conversar con la IA.</p>

        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          <label>
            Nombre Completo
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Tu nombre completo"
              autoComplete="name"
            />
            {nombreError && <span className="field-error">{nombreError}</span>}
          </label>

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
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
            {formData.password.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1,2,3,4].map((i) => (
                    <div key={i} style={{
                      flex: 1, height: '4px', borderRadius: '2px',
                      background: i <= strength.level ? strength.color : 'var(--border-color)'
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: strength.color }}>{strength.label}</span>
              </div>
            )}
            {passwordError && <span className="field-error">{passwordError}</span>}
          </label>

          <label>
            Confirmar Contraseña
            <input
              type="password"
              name="confirmPwd"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              onBlur={handleBlur}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
            />
            {confirmPwdError && <span className="field-error">{confirmPwdError}</span>}
          </label>

          {error   && <p className="error-box">{error}</p>}
          {success && <p className="success-box">{success}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className="helper-row">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
