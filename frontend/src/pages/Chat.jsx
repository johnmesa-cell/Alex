import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getApiError } from '../services/api.js';

const QUICK_REPLIES = [
  { label: 'Control de sangrado', text: '¿Cómo controlo un sangrado externo?' },
  { label: 'Quemaduras leves', text: '¿Qué hago ante una quemadura leve en casa?' },
  { label: 'RCP básica', text: 'Dame los pasos básicos de RCP para adulto.' },
];

const ACCEPTED_TYPES = '.pdf,.png,.jpg,.jpeg';
const MAX_FILE_MB = 5;

const MOCK_HISTORIAL = [
  { id: 1, fecha: 'Hoy, 10:32', resumen: 'Control de sangrado en herida superficial' },
  { id: 2, fecha: 'Ayer, 15:14', resumen: 'Pasos de RCP para adulto' },
  { id: 3, fecha: '08 may', resumen: 'Quemadura leve con agua caliente' },
  { id: 4, fecha: '07 may', resumen: 'Atragantamiento en niños' },
];

// iconos SVG inline simples
const IconHistory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconMetrics = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

function Chat() {
  const { isAuthenticated, user } = useAuth();

  // Chat
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: isAuthenticated
        ? 'Hola, soy ALEX. Describe la situación y te daré orientación inicial de primeros auxilios.'
        : 'Hola, estás en modo invitado. Puedo darte orientación inicial, pero no guardaré historial de esta sesión.',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Sidebar izquierdo colapsable
  // activePanel: null | 'historial' | 'metricas'
  const [activePanel, setActivePanel] = useState(null);
  const togglePanel = (panel) => setActivePanel((prev) => (prev === panel ? null : panel));

  // Voz
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Archivos (panel derecho)
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [fileSuccess, setFileSuccess] = useState('');
  const fileInputRef = useRef(null);

  const speechEnabled = useMemo(
    () => typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
    []
  );

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const sendPrompt = async (inputPrompt) => {
    const clean = inputPrompt.trim();
    if (!clean || loading) return;
    setError('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', text: clean }]);
    setPrompt('');
    try {
      const { data } = await api.post('/api/ai/guidance', { prompt: clean });
      const answer = data?.data?.respuesta || 'No se recibió respuesta válida del servidor.';
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendPrompt(prompt); };

  const startSpeech = () => {
    if (!speechEnabled || isListening) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'es-CO'; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => { setIsListening(true); setError(''); };
    rec.onresult = (e) => setPrompt(e.results?.[0]?.[0]?.transcript || '');
    rec.onerror = () => setError('No fue posible capturar audio. Verifica permisos del micrófono.');
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const stopSpeech = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const handleFileChange = (e) => {
    setFileError(''); setFileSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`El archivo supera el límite de ${MAX_FILE_MB} MB.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setFileError(''); setFileSuccess('');
    const formData = new FormData();
    formData.append('archivo', selectedFile);
    try {
      await api.post('/api/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFileSuccess(`«${selectedFile.name}» subido correctamente.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setFileError(getApiError(err));
    }
  };

  const removeFile = () => {
    setSelectedFile(null); setFileError(''); setFileSuccess('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="chat-page">
      {/* Banner invitado */}
      {!isAuthenticated && (
        <div className="guest-alert" role="alert">
          <strong>Estás en modo invitado.</strong>{' '}
          Historial, archivos y configuración requieren sesión iniciada.{' '}
          <Link to="/login" className="guest-alert__link">Iniciar sesión</Link>{' '}o{' '}
          <Link to="/register" className="guest-alert__link">crear cuenta</Link>.
        </div>
      )}

      <div className={`chat-layout${isAuthenticated ? ' chat-layout--auth' : ''}`}>

        {/* ======== SIDEBAR IZQUIERDO COLAPSABLE (solo autenticado) ======== */}
        {isAuthenticated && (
          <div className="chat-rail">
            {/* Iconos siempre visibles */}
            <div className="rail-icons">
              <button
                type="button"
                className={`rail-btn${activePanel === 'historial' ? ' rail-btn--active' : ''}`}
                onClick={() => togglePanel('historial')}
                title="Historial"
                aria-label="Abrir historial"
              >
                <IconHistory />
              </button>
              <button
                type="button"
                className={`rail-btn${activePanel === 'metricas' ? ' rail-btn--active' : ''}`}
                onClick={() => togglePanel('metricas')}
                title="Métricas"
                aria-label="Abrir métricas"
              >
                <IconMetrics />
              </button>
            </div>

            {/* Drawer que se despliega al lado del rail */}
            {activePanel && (
              <div className="rail-drawer" role="region" aria-label={activePanel}>
                <div className="rail-drawer__head">
                  <span className="rail-drawer__title">
                    {activePanel === 'historial' ? 'Historial' : 'Métricas'}
                  </span>
                  <button
                    type="button"
                    className="rail-drawer__close"
                    onClick={() => setActivePanel(null)}
                    aria-label="Cerrar panel"
                  >×</button>
                </div>

                {activePanel === 'historial' && (
                  <>
                    <button type="button" className="sidebar-new-btn">+ Nueva consulta</button>
                    <ul className="historial-list">
                      {MOCK_HISTORIAL.map((h) => (
                        <li key={h.id} className="historial-item">
                          <span className="historial-fecha">{h.fecha}</span>
                          <span className="historial-resumen">{h.resumen}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {activePanel === 'metricas' && (
                  <ul className="metrics-list">
                    <li className="metric-item">
                      <span className="metric-label">Consultas sesión</span>
                      <span className="metric-value">{messages.filter(m => m.role === 'user').length}</span>
                    </li>
                    <li className="metric-item">
                      <span className="metric-label">Mensajes totales</span>
                      <span className="metric-value">{messages.length}</span>
                    </li>
                    <li className="metric-item">
                      <span className="metric-label">Historial guardado</span>
                      <span className="metric-value">{MOCK_HISTORIAL.length}</span>
                    </li>
                    <li className="metric-item">
                      <span className="metric-label">Usuario</span>
                      <span className="metric-value">{user?.nombre || '—'}</span>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======== PANEL PRINCIPAL ======== */}
        <section className="chat-panel">
          <div className="chat-head">
            <div>
              <h1>Chat IA</h1>
              <p className="chat-head__sub">
                {isAuthenticated
                  ? 'Consulta con historial y funciones completas.'
                  : 'Consulta rápida sin cuenta registrada.'}
              </p>
            </div>
            <span className="chip">{isAuthenticated ? 'Sesión activa' : 'Sesión temporal'}</span>
          </div>

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
                <p>Escribiendo respuesta<span className="typing-dots" aria-hidden="true"><span /><span /><span /></span></p>
              </article>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="quick-replies" aria-label="Respuestas rápidas">
            {QUICK_REPLIES.map((qr) => (
              <button key={qr.label} type="button" className="quick-reply" onClick={() => setPrompt(qr.text)}>
                {qr.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="chat-form">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPrompt(prompt); } }}
              placeholder="Escribe tu consulta de primeros auxilios..."
              rows={3} maxLength={400}
            />
            <div className="char-counter-row"><span className="char-counter">{prompt.length}/400</span></div>
            {error && <p className="error-box">{error}</p>}
            <div className="chat-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : (isAuthenticated ? 'Enviar' : 'Enviar en modo invitado')}
              </button>
              {speechEnabled && !isListening && <button type="button" className="btn-secondary" onClick={startSpeech}>Dictar por voz</button>}
              {speechEnabled && isListening && <button type="button" className="btn-secondary" onClick={stopSpeech}>Detener dictado</button>}
              {!isAuthenticated && <Link to="/login" className="btn-secondary">Desbloquear funciones</Link>}
            </div>
          </form>
        </section>

        {/* ======== PANEL DERECHO: archivos (autenticado) o bloqueados (invitado) ======== */}
        <aside className="chat-side">
          {isAuthenticated ? (
            <div className="side-content">
              <span className="sidebar-section__title">Adjuntar archivo</span>
              <p className="sidebar-hint">PDF, PNG, JPG — máx. {MAX_FILE_MB} MB</p>
              <label className="file-drop" htmlFor="file-input">
                {selectedFile ? (
                  <span className="file-selected">
                    📎 {selectedFile.name}
                    <button type="button" className="file-remove" onClick={(e) => { e.preventDefault(); removeFile(); }}>×</button>
                  </span>
                ) : (
                  <span>Haz clic o arrastra un archivo</span>
                )}
              </label>
              <input id="file-input" ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} onChange={handleFileChange} className="file-input-hidden" />
              {fileError && <p className="error-box">{fileError}</p>}
              {fileSuccess && <p className="success-box">{fileSuccess}</p>}
              <button type="button" className="btn-primary" style={{ width: '100%' }} disabled={!selectedFile} onClick={handleFileUpload}>
                Subir archivo
              </button>
            </div>
          ) : (
            <>
              <div>
                <h3>Disponibles</h3>
                <p>Chat básico, respuestas rápidas y guía inicial.</p>
              </div>
              <div className="locked-card"><h4>Historial</h4><p>Inicia sesión para guardar conversaciones.</p></div>
              <div className="locked-card"><h4>Subida de archivos</h4><p>Inicia sesión para adjuntar documentos.</p></div>
              <div className="locked-card"><h4>Métricas</h4><p>Inicia sesión para ver tu actividad.</p></div>
              <Link to="/register" className="btn-primary" style={{ textAlign: 'center' }}>Crear cuenta gratis</Link>
            </>
          )}
        </aside>

      </div>
    </div>
  );
}

export default Chat;
