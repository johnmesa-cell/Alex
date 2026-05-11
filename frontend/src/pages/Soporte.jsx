import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Soporte() {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const FAQs = [
    {
      q: '¿Qué debo hacer si es una emergencia?',
      a: 'Llama inmediatamente al 123 (Número Único de Emergencias de Colombia). También puedes contactar al 125 (Defensa Civil) o al 132 (Cruz Roja Colombiana). ALEX solo orienta; no reemplaza los servicios de emergencia.',
    },
    {
      q: '¿Mis datos están seguros?',
      a: 'Sí. Tus datos están protegidos bajo la Ley 1581 de 2012 de Protección de Datos Personales de Colombia. No compartimos información con terceros.',
    },
    {
      q: '¿ALEX puede diagnosticar?',
      a: 'No. Proporciona orientación inicial de primeros auxilios basada en protocolos de la Cruz Roja Colombiana y el Ministerio de Salud. Para diagnósticos, consulta a un profesional de salud.',
    },
    {
      q: '¿Puedo usar ALEX sin cuenta?',
      a: 'Sí, como invitado. Pero para historial, subida de archivos y funciones completas, crea una cuenta gratuita.',
    },
    {
      q: '¿Cómo cargo archivos?',
      a: 'En el chat: busca el icono de subida. Adjunta imágenes o documentos para recibir orientación más contextualizada.',
    },
    {
      q: '¿Qué idiomas soporta?',
      a: 'Actualmente español. Estamos trabajando en agregar más idiomas en futuras versiones.',
    },
  ];

  const CHANNELS = [
    {
      label: 'Email de soporte',
      value: 'soporte@alex-app.test',
      type: 'mailto',
      icon: '📧',
    },
    {
      label: 'Chat en vivo',
      value: 'Lunes–Viernes, 8am–6pm (COT)',
      type: 'info',
      icon: '💬',
    },
    {
      label: 'Redes sociales',
      value: '@ALEXprimeros_auxilios',
      type: 'social',
      icon: '📱',
    },
    {
      label: 'Reportar un bug',
      value: 'bugs@alex-app.test',
      type: 'mailto',
      icon: '🐛',
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

      {/* ===== GRID: CANALES + FAQ ===== */}
      <div className="ps-grid">
        {/* Canales de Contacto */}
        <div className="ps-card">
          <h3 className="ps-card__title">Canales de Contacto</h3>
          <div>
            {CHANNELS.map((channel, idx) => (
              <div key={idx} className="ps-channel-item">
                <div className="ps-channel-item__icon">{channel.icon}</div>
                <div className="ps-channel-item__info">
                  <div className="ps-channel-item__label">{channel.label}</div>
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

        {/* Preguntas Frecuentes */}
        <div className="ps-card">
          <h3 className="ps-card__title">Preguntas Frecuentes</h3>
          <div className="ps-faq-list">
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

      {/* ===== GRID: EMERGENCIAS + ESTADO ===== */}
      <div className="ps-grid">
        {/* Números de Emergencia Colombia */}
        <div className="ps-card">
          <h3 className="ps-card__title">Números de Emergencia en Colombia</h3>
          <div>
            <div className="ps-channel-item">
              <div className="ps-channel-item__icon">🚨</div>
              <div className="ps-channel-item__info">
                <div className="ps-channel-item__label">Número Único de Emergencias</div>
                <div className="ps-channel-item__value"><strong>123</strong> — Policía, Bomberos, SAMU</div>
              </div>
            </div>
            <div className="ps-channel-item">
              <div className="ps-channel-item__icon">🏥</div>
              <div className="ps-channel-item__info">
                <div className="ps-channel-item__label">Cruz Roja Colombiana</div>
                <div className="ps-channel-item__value"><strong>132</strong></div>
              </div>
            </div>
            <div className="ps-channel-item">
              <div className="ps-channel-item__icon">🛡️</div>
              <div className="ps-channel-item__info">
                <div className="ps-channel-item__label">Defensa Civil Colombiana</div>
                <div className="ps-channel-item__value"><strong>144</strong></div>
              </div>
            </div>
            <div className="ps-channel-item">
              <div className="ps-channel-item__icon">🚒</div>
              <div className="ps-channel-item__info">
                <div className="ps-channel-item__label">Bomberos</div>
                <div className="ps-channel-item__value"><strong>119</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Estado del servicio */}
        <div className="ps-card">
          <h3 className="ps-card__title">Estado del Servicio</h3>
          <div className="ps-badge-ok">Operativo</div>
          <p className="ps-card__body" style={{ marginTop: '0.75rem' }}>
            Todos nuestros servicios están funcionando correctamente. Disponibilidad 99.9%.
          </p>
          <p className="ps-card__body" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
            <strong>Versión:</strong> 1.0.0 &nbsp;·&nbsp; <strong>Actualizado:</strong> mayo 2026
          </p>
        </div>
      </div>

      {/* ===== DISCLAIMER ===== */}
      <div className="ps-disclaimer">
        ALEX orienta primeros pasos y no reemplaza atención médica profesional. Ante una emergencia en Colombia, llama al <strong>123</strong>.
      </div>
    </div>
  );
}

export default Soporte;
