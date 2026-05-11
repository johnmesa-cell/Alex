import React from 'react';
import { Link } from 'react-router-dom';

function Informacion() {
  const CARDS = [
    {
      title: 'Qué es ALEX',
      content: 'ALEX es tu asistente de primeros auxilios disponible 24/7. Responde preguntas sobre emergencias médicas con guía basada en protocolos internacionales de OMS y Cruz Roja. No diagnostica, pero orienta y guía con información confiable.',
    },
    {
      title: 'Cómo funciona',
      content: 'Describes tu situación en chat o por voz. ALEX analiza síntomas, propone pasos inmediatos y, cuando es necesario, te sugiere contactar profesionales. Puedes adjuntar documentos para análisis más contextualizado.',
    },
    {
      title: 'Alcance y límites',
      content: 'ALEX no reemplaza diagnóstico médico, ni atiende emergencias críticas. Para casos graves: llama 911 (EE.UU.), 112 (Europa), 1122 (Colombia). ALEX es complemento, no sustituto de atención profesional.',
    },
    {
      title: 'Privacidad',
      content: 'Tus datos están cifrados y protegidos bajo regulaciones internacionales (GDPR, HIPAA). No compartimos información con terceros. Tu privacidad es nuestra prioridad absoluta.',
    },
  ];

  return (
    <div className="ps-shell">
      {/* ===== HERO SECTION ===== */}
      <section className="ps-hero">
        <span className="ps-hero__eyebrow">Asistente de Primeros Auxilios</span>
        <h1>Información sobre ALEX</h1>
        <p className="ps-hero__lead">
          Primeros auxilios digitales, disponibles siempre. Guía rápida, confiable y accesible para orientación médica inicial.
        </p>
        <div className="ps-hero__actions">
          <Link to="/chat" className="ps-btn-hero-primary">
            Empezar a usar ALEX
          </Link>
          <Link to="/" className="ps-btn-hero-secondary">
            Volver al inicio
          </Link>
        </div>
      </section>

      {/* ===== CARDS GRID ===== */}
      <div className="ps-grid">
        {CARDS.map((card, idx) => (
          <div key={idx} className="ps-card">
            <h3 className="ps-card__title">{card.title}</h3>
            <p className="ps-card__body">{card.content}</p>
          </div>
        ))}
      </div>

      {/* ===== DISCLAIMER ===== */}
      <div className="ps-disclaimer">
        ALEX orienta primeros pasos y no reemplaza atención médica profesional. Ante emergencias, busca ayuda inmediata.
      </div>
    </div>
  );
}

export default Informacion;