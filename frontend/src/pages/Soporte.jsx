import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Soporte() {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const FAQs = [
    {
      q: '¿Qué debo hacer si es una emergencia?',
      a: 'Si es emergencia: llama inmediatamente a 911 (EE.UU.), 112 (Europa), 1122 (Colombia) o el número local de tu país.',
    },
    {
      q: '¿Mis datos están seguros?',
      a: 'Sí. Datos cifrados, no compartidos con terceros. Cumplimos regulaciones internacionales de privacidad (GDPR, HIPAA).',
    },
    {
      q: '¿ALEX puede diagnosticar?',
      a: 'No. Proporciona orientación inicial de primeros auxilios. Para diagnósticos, consulta a un profesional.',
    },
    {
      q: '¿Puedo usar ALEX sin cuenta?',
      a: 'Sí, como invitado. Pero para historial y funciones completas, crea una cuenta gratuita.',
    },
    {
      q: '¿Cómo cargo archivos?',
      a: 'En el chat: busca el icono de subida. Adjunta imágenes o documentos para asesoría contextualizada.',
    },
    {
      q: '¿Qué idiomas soporta?',
      a: 'Actualmente español. Estamos trabajando en agregar más idiomas en futuras versiones.',
    },
  ];

  const CHANNELS = [
    {
      label: 'Email',
      value: 'soporte@alex-app.test',
      type: 'mailto',
    },
    {
      label: 'Chat en vivo',
      value: 'Lunes-Viernes, 8am-6pm (CO)',
      type: 'info',
    },
    {
      label: 'Redes sociales',
      value: '@ALEXprimeros_auxilios',
      type: 'social',
    },
    {
      label: 'Reportar bugs',
      value: 'bugs@alex-app.test',
      type: 'mailto',
    },
  ];

  const handleFAQClick = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="ps-shell">
      {/* ===== HERO SECTION ===== */}
      <section className="ps-hero">
        <span className="ps-hero__eyebrow">Centro de Asistencia</span>
        <h1>Centro de Soporte</h1>
        <p className="ps-hero__lead">
          Encuentra respuestas rápidas, contacta con nuestro equipo o reporta problemas. Estamos aquí para ayudarte.
        </p>
        <div className="ps-hero__actions">
          <a href="mailto:soporte@alex-app.test" className="ps-btn-hero-primary">
            Contactar por Email
          </a>
          <Link to="/chat" className="ps-btn-hero-secondary">
            Ir al Chat
          </Link>
        </div>
      </section>

      {/* ===== GRID 2 COLUMNS: CHANNELS + FAQs ===== */}
      <div className="ps-grid">
        {/* COLUMNA IZQUIERDA: Canales de Contacto */}
        <div className="ps-card">
          <h3 className="ps-card__title">Canales de Contacto</h3>
          <div>
            {CHANNELS.map((channel, idx) => (
              <div key={idx} className="ps-channel-item">
                <div>
                  <div className="ps-channel-item__label">
                    {channel.type === 'mailto' && '📧 '}
                    {channel.type === 'social' && '🐦 '}
                    {channel.type === 'info' && '💬 '}
                    {channel.label}
                  </div>
                  <div className="ps-channel-item__value">
                    {channel.type === 'mailto' ? (
                      <a href={`mailto:${channel.value}`}>{channel.value}</a>
                    ) : (
                      channel.value
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: FAQs */}
        <div className="ps-card">
          <h3 className="ps-card__title">Preguntas Frecuentes</h3>
          <div>
            {FAQs.map((faq, idx) => (
              <div key={idx} className="ps-faq-item">
                <button
                  className="ps-faq-toggle"
                  onClick={() => handleFAQClick(idx)}
                  aria-expanded={expandedFAQ === idx}
                >
                  <span>{faq.q}</span>
                  <span className="ps-faq-indicator">
                    {expandedFAQ === idx ? '−' : '+'}
                  </span>
                </button>
                {expandedFAQ === idx && (
                  <div className="ps-faq-answer">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== GRID SEGUNDA FILA: STATUS + VERSION ===== */}
      <div className="ps-grid">
        {/* Estado del Servicio */}
        <div className="ps-card">
          <h3 className="ps-card__title">Estado del Servicio</h3>
          <div className="ps-badge-ok">Operativo</div>
          <p className="ps-card__body">
            Todos nuestros servicios están funcionando correctamente. Disponibilidad 99.9%.
          </p>
        </div>

        {/* Versión */}
        <div className="ps-card">
          <h3 className="ps-card__title">Versión</h3>
          <p className="ps-card__body">
            <strong>Versión actual:</strong> 1.2.0<br />
            <strong>Última actualización:</strong> 10 de mayo de 2026
          </p>
        </div>
      </div>

      {/* ===== DISCLAIMER ===== */}
      <div className="ps-disclaimer">
        ALEX orienta primeros pasos y no reemplaza atención médica profesional. Ante emergencias, busca ayuda inmediata.
      </div>
    </div>
  );
}

export default Soporte;
