import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getApiError } from '../services/api.js';

const QUICK_REPLIES = [
  { label: 'Control de sangrado', text: '¿Cómo controlo un sangrado externo?' },
  { label: 'Quemaduras leves', text: '¿Qué hago ante una quemadura leve en casa?' },
  { label: 'RCP básica', text: 'Dame los pasos básicos de RCP para adulto.' },
];

function Chat() {
  const { isAuthenticated } = useAuth();

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: isAuthenticated
        ? 'Hola, soy ALEX. Describe la situación y te daré orientación inicial de primeros auxilios.'
        : 'Hola, estás en modo invitado. Puedo darte orientación inicial, pero no guardaré historial de esta sesión.'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const speechEnabled = useMemo(
    () => typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
    []
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendPrompt = async (inputPrompt) => {
    const cleanPrompt = inputPrompt.trim();
    if (!cleanPrompt || loading) return;

    setError('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', text: cleanPrompt }]);
    setPrompt('');

    try {
      const { data } = await api.post('/api/ai/guidance', { prompt: cleanPrompt });
      const answer = data?.data?.respuesta || 'No se recibió respuesta válida del servidor.';
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendPrompt(prompt);
  };

  const startSpeech = () => {
    if (!speechEnabled || isListening) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setIsListening(true); setError(''); };
    recognition.onresult = (e) => { setPrompt(e.results?.[0]?.[0]?.transcript || ''); };
    recognition.onerror = () => { setError('No fue posible capturar audio. Verifica permisos del micrófono.'); };
    recognition.onend = () => { setIsListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopSpeech = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <div className="chat-page">
      {/* Banner modo invitado */}
      {!isAuthenticated && (
        <div className="guest-alert" role="alert">
          <strong>Estás en modo invitado.</strong>{' '}
          Puedes consultar orientación básica, pero el historial, carga de archivos y configuración de cuenta
          requieren iniciar sesión.{' '}
          <Link to="/login" className="guest-alert__link">Iniciar sesión</Link>{' '}o{' '}
          <Link to="/register" className="guest-alert__link">crear cuenta</Link>.
        </div>
      )}

      <div className="chat-layout">
        {/* Panel principal de chat */}
        <section className="chat-panel">
          <div className="chat-head">
            <div>
              <h1>Chat IA</h1>
              <p className="chat-head__sub">
                {isAuthenticated ? 'Consulta con historial y funciones completas.' : 'Consulta rápida sin cuenta registrada.'}
              </p>
            </div>
            <span className="chip">{isAuthenticated ? 'Sesión activa' : 'Sesión temporal'}</span>
          </div>

          {/* Mensajes */}
          <div className="messages" id="chat-messages">
            {messages.map((msg, i) => (
              <article key={i} className={`message message-${msg.role}`}>
                <p className="message-role">{msg.role === 'assistant' ? 'ALEX' : 'Tú'}</p>
                <p>{msg.text}</p>
              </article>
            ))}
            {loading && (
              <article className="message message-assistant typing">
                <p className="message-role">ALEX</p>
                <p>
                  Escribiendo respuesta
                  <span className="typing-dots" aria-hidden="true">
                    <span /><span /><span />
                  </span>
                </p>
              </article>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Respuestas rápidas */}
          <div className="quick-replies" aria-label="Respuestas rápidas">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.label}
                type="button"
                className="quick-reply"
                onClick={() => setPrompt(qr.text)}
              >
                {qr.label}
              </button>
            ))}
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="chat-form">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPrompt(prompt); } }}
              placeholder="Escribe tu consulta de primeros auxilios..."
              rows={3}
              maxLength={400}
            />
            <div className="char-counter-row">
              <span className="char-counter">{prompt.length}/400</span>
            </div>

            {error && <p className="error-box">{error}</p>}

            <div className="chat-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : (isAuthenticated ? 'Enviar' : 'Enviar en modo invitado')}
              </button>
              {speechEnabled && !isListening && (
                <button type="button" className="btn-secondary" onClick={startSpeech}>
                  Dictar por voz
                </button>
              )}
              {speechEnabled && isListening && (
                <button type="button" className="btn-secondary" onClick={stopSpeech}>
                  Detener dictado
                </button>
              )}
              {!isAuthenticated && (
                <Link to="/login" className="btn-secondary">Desbloquear funciones</Link>
              )}
            </div>
          </form>
        </section>

        {/* Panel lateral */}
        <aside className="chat-side">
          {isAuthenticated ? (
            <div>
              <h3>Funciones activas</h3>
              <p>Historial guardado, carga de archivos y configuración disponibles.</p>
            </div>
          ) : (
            <>
              <div>
                <h3>Disponibles</h3>
                <p>Chat básico, respuestas rápidas y guía inicial de emergencia.</p>
              </div>
              <div className="locked-card">
                <h4>Historial de chats</h4>
                <p>Bloqueado en invitado. Inicia sesión para guardar y continuar conversaciones.</p>
              </div>
              <div className="locked-card">
                <h4>Subida de archivos</h4>
                <p>Bloqueado en invitado. Inicia sesión para adjuntar imágenes o documentos.</p>
              </div>
              <div className="locked-card">
                <h4>Métricas y seguimiento</h4>
                <p>Bloqueado en invitado. Inicia sesión para personalizar tu seguimiento.</p>
              </div>
              <Link to="/register" className="btn-primary" style={{ textAlign: 'center' }}>Crear cuenta gratis</Link>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export default Chat;
