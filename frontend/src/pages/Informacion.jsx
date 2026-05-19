import React from 'react';
import { Link } from 'react-router-dom';

function Informacion() {
  const CARDS = [
    {
      title: 'Qué es ALEX',
      content: 'ALEX es tu asistente de primeros auxilios disponible 24/7. Responde preguntas sobre emergencias médicas con guía basada en protocolos de la Cruz Roja Colombiana y el Ministerio de Salud. No diagnostica, pero orienta y guía con información confiable.',
    },
    {
      title: 'Cómo funciona',
      content: 'Describes tu situación en chat o por voz. ALEX analiza síntomas, propone pasos inmediatos y, cuando es necesario, te sugiere contactar a los servicios de emergencia. Puedes adjuntar documentos para análisis más contextualizado.',
    },
    {
      title: 'Alcance y límites',
      content: 'ALEX no reemplaza diagnóstico médico, ni atiende emergencias críticas. Ante una emergencia en Colombia llama al 123 (Número Único de Emergencias), 125 (Defensa Civil) o 132 (Cruz Roja Colombiana). ALEX es complemento, no sustituto de atención profesional.',
    },
    {
      title: 'Privacidad',
      content: 'Tus datos están protegidos bajo la Ley 1581 de 2012 de Protección de Datos Personales de Colombia. No compartimos información con terceros. Tu privacidad es nuestra prioridad absoluta.',
    },
  ];

  return (
    <div className="ps-shell">
      {/* ===== HERO SECTION ===== */}
      <section className="ps-hero">
        <span className="ps-hero__eyebrow">Asistente de Primeros Auxilios</span>
        <h1>Información sobre ALEX</h1>
        <p className="ps-hero__lead">
          Primeros auxilios digitales, disponibles siempre. Guía rápida, confiable y accesible para orientación médica inicial en Colombia.
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
        ALEX orienta primeros pasos y no reemplaza atención médica profesional. Ante emergencias en Colombia, llama al <strong>123</strong>.
      </div>
    </div>
  );
}

export default Informacion;
