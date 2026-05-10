import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError } from '../services/api.js';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await register(formData);
      setSuccess(response.message || 'Registro exitoso. Ahora inicia sesion.');
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
          <p>Únete a miles de usuarios que ya están usando ALEX para mejorar su productividad y aprendizaje.</p>
        </div>
        <div className="auth-info-card">
          <h3>Registro Seguro</h3>
          <p>Tu información está protegida con los más altos estándares de seguridad de la industria.</p>
        </div>
        <div className="auth-info-card">
          <h3>Gratis para Empezar</h3>
          <p>Comienza gratuitamente y explora todas las funcionalidades. Mejora cuando lo necesites.</p>
        </div>
      </aside>

      <div className="form-card">
        <h1>Crear cuenta</h1>
        <p className="form-copy">Registrate para acceder a ALEX y comenzar a conversar con la IA.</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Nombre Completo
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Tu nombre completo"
              required
            />
          </label>

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
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
            />
          </label>

          {error && <p className="error-box">{error}</p>}
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
