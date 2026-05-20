import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getApiError } from '../services/api.js';

const QUICK_REPLIES = [
  { label: 'Control de sangrado', text: '¿Cómo controlo un sangrado externo?' },
  { label: 'Quemaduras leves', text: '¿Qué hago ante una quemadura leve en casa?' },
  { label: 'RCP básica', text: 'Dame los pasos básicos de RCP para adulto.' },
];

const ACCEPTED_TYPES = '.pdf,.png,.jpg,.jpeg';
const MAX_FILE_MB = 5;
const SESSION_KEY = 'alex_guest_chat';

function formatFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const ahora = new Date();
  const diffH = (ahora - d) / 3600000;
  if (diffH < 24 && d.getDate() === ahora.getDate())
    return 'Hoy, ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const ayer = new Date(ahora); ayer.setDate(ayer.getDate() - 1);
  if (d.getDate() === ayer.getDate() && diffH < 48)
    return 'Ayer, ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

const IconHistory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconMetrics = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const WELCOME_AUTH  = 'Hola, soy ALEX. Describe la situación y te daré orientación inicial de primeros auxilios.';
const WELCOME_GUEST = 'Hola, estás en modo invitado. Puedo darte orientación inicial, pero no guardaré historial de esta sesión.';

function Chat() {
  const TAB_SESSION_ID = useRef(
    `chat-${Date.now()}-${(crypto.randomUUID?.() ?? Math.random().toString(36).slice(2))}`
  ).current;
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const initialPanel = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('panel');
    return p === 'historial' || p === 'metricas' ? p : null;
  }, [location.search]);

  const [messages, setMessages] = useState(() => {
    if (!isAuthenticated) {
      try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [{ role: 'assistant', text: isAuthenticated ? WELCOME_AUTH : WELCOME_GUEST }];
  });

  useEffect(() => {
    if (!isAuthenticated) {
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages)); } catch {}
    }
  }, [messages, isAuthenticated]);

  const [prompt, setPrompt]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const messagesEndRef                  = useRef(null);

  const [activePanel, setActivePanel]   = useState(initialPanel);
  const togglePanel = (panel) => setActivePanel((prev) => (prev === panel ? null : panel));

  useEffect(() => {
    if (initialPanel && isAuthenticated) setActivePanel(initialPanel);
  }, [initialPanel, isAuthenticated]);

  const [isListening, setIsListening]   = useState(false);
  const recognitionRef                  = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError]       = useState('');
  const [fileSuccess, setFileSuccess]   = useState('');
  const fileInputRef                    = useRef(null);

  const [historial, setHistorial]               = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialError, setHistorialError]     = useState('');

  const [loadingConsulta, setLoadingConsulta]   = useState(false);
  const [deletingId, setDeletingId]             = useState(null);

  const fetchHistorial = async () => {
    if (!isAuthenticated) return;
    setHistorialLoading(true);
    setHistorialError('');
    try {
      const { data } = await api.get('/api/consultas');
      const normalizado = (data?.data ?? []).map(h => ({
        id_consulta:    h.id_consulta ?? h.id ?? null,
        asunto:         h.asunto ?? '(sin asunto)',
        fecha_creacion: h.fecha_creacion ?? h.fechacreacion ?? null
      }));
      setHistorial(normalizado);
    } catch {
      setHistorialError('No se pudo cargar el historial.');
    } finally {
      setHistorialLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchHistorial();
  }, [isAuthenticated]); // eslint-disable-line

  const handleAbrirConsulta = async (id) => {
    if (!id || loadingConsulta) return;
    setLoadingConsulta(true);
    setError('');
    try {
      const { data } = await api.get(`/api/consultas/${id}`);
      const c = data?.data;
      if (!c) { setError('No se pudo cargar la consulta.'); return; }
      setMessages([
        { role: 'assistant', text: WELCOME_AUTH },
        { role: 'user',      text: c.mensaje ?? c.asunto },
        { role: 'assistant', text: c.respuesta_ia ?? '(sin respuesta guardada)' }
      ]);
      setActivePanel(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoadingConsulta(false);
    }
  };

  const handleEliminarConsulta = async (e, id) => {
    e.stopPropagation();
    if (!id || deletingId) return;
    if (!window.confirm('¿Eliminar esta consulta del historial?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/consultas/${id}`);
      await fetchHistorial();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

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
      const sessionId = isAuthenticated && user?.id_usuario
        ? `chat-user-${user.id_usuario}`
        : TAB_SESSION_ID;

      const { data } = await api.post('/api/agent/chat', { message: clean, sessionId });
      const answer = data?.reply ?? data?.data?.reply ?? null;
      if (!answer) console.warn('[Chat] Respuesta inesperada del agente:', JSON.stringify(data));
      setMessages((prev) => [...prev, { role: 'assistant', text: answer ?? 'No se recibió respuesta válida del servidor.' }]);
      if (isAuthenticated) fetchHistorial();
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
    rec.onstart  = () => { setIsListening(true); setError(''); };
    rec.onresult = (e) => setPrompt(e.results?.[0]?.[0]?.transcript || '');
    rec.onerror  = () => setError('No fue posible capturar audio. Verifica permisos del micrófono.');
    rec.onend    = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const stopSpeech = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const handleFileChange = (e) => {
    setFileError(''); setFileSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`El archivo supera el límite de ${MAX_FILE_MB} MB.`);
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

      {isAuthenticated && (
        <>
          <nav className="chat-rail">
            <div className="rail-top">
              <button type="button" className={`rail-btn${activePanel === 'historial' ? ' rail-btn--active' : ''}`} onClick={() => togglePanel('historial')} title="Historial" aria-label="Abrir historial"><IconHistory /></button>
              <button type="button" className={`rail-btn${activePanel === 'metricas'  ? ' rail-btn--active' : ''}`} onClick={() => togglePanel('metricas')}  title="Métricas"  aria-label="Abrir métricas"><IconMetrics /></button>
            </div>
            <div className="rail-bottom">
              <button type="button" className="rail-btn" title="Configuración" aria-label="Ir a configuración" onClick={() => { window.location.href = '/settings'; }}><IconSettings /></button>
            </div>
          </nav>

          {activePanel && (
            <div className="rail-drawer" role="region" aria-label={activePanel}>
              <div className="rail-drawer__head">
                <span className="rail-drawer__title">{activePanel === 'historial' ? 'Historial' : 'Métricas'}</span>
                <button type="button" className="rail-drawer__close" onClick={() => setActivePanel(null)} aria-label="Cerrar panel">×</button>
              </div>

              {activePanel === 'historial' && (
                <>
                  <button
                    type="button"
                    className="sidebar-new-btn"
                    onClick={() => {
                      sessionStorage.removeItem(SESSION_KEY);
                      setMessages([{ role: 'assistant', text: WELCOME_AUTH }]);
                      setActivePanel(null);
                    }}
                  >
                    + Nueva consulta
                  </button>

                  {historialLoading && (
                    <p style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Cargando historial…</p>
                  )}
                  {historialError && (
                    <p style={{ padding: '12px', color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{historialError}</p>
                  )}
                  {!historialLoading && !historialError && historial.length === 0 && (
                    <p style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Aún no tienes consultas guardadas.</p>
                  )}

                  {!historialLoading && historial.length > 0 && (
                    <ul className="historial-list">
                      {historial.map((h, i) => (
                        <li
                          key={h.id_consulta ?? i}
                          className={`historial-item historial-item--clickable${loadingConsulta ? ' historial-item--disabled' : ''}`}
                          onClick={() => handleAbrirConsulta(h.id_consulta)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Abrir consulta: ${h.asunto}`}
                          onKeyDown={(e) => e.key === 'Enter' && handleAbrirConsulta(h.id_consulta)}
                        >
                          <div className="historial-item__body">
                            <span className="historial-fecha">{formatFecha(h.fecha_creacion)}</span>
                            <span className="historial-resumen">
                              {loadingConsulta ? '⏳ Cargando…' : h.asunto}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="historial-item__delete"
                            aria-label="Eliminar consulta"
                            disabled={deletingId === h.id_consulta}
                            onClick={(e) => handleEliminarConsulta(e, h.id_consulta)}
                            title="Eliminar"
                          >
                            {deletingId === h.id_consulta ? '⏳' : '×'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {activePanel === 'metricas' && (
                <ul className="metrics-list">
                  <li className="metric-item"><span className="metric-label">Consultas sesión</span><span className="metric-value">{messages.filter(m => m.role === 'user').length}</span></li>
                  <li className="metric-item"><span className="metric-label">Mensajes totales</span><span className="metric-value">{messages.length}</span></li>
                  <li className="metric-item"><span className="metric-label">Historial guardado</span><span className="metric-value">{historial.length}</span></li>
                  <li className="metric-item"><span className="metric-label">Usuario</span><span className="metric-value">{user?.nombre || '—'}</span></li>
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <div className="chat-content">
        {!isAuthenticated && (
          <div className="guest-alert" role="alert">
            <strong>Estás en modo invitado.</strong>{' '}
            Historial, archivos y configuración requieren sesión iniciada.{' '}
            <Link to="/login" className="guest-alert__link">Iniciar sesión</Link>{' '}o{' '}
            <Link to="/register" className="guest-alert__link">crear cuenta</Link>.
          </div>
        )}

        <section className="chat-panel">
          <div className="chat-head">
            <div>
              <h1>Chat IA</h1>
              <p className="chat-head__sub">{isAuthenticated ? 'Consulta con historial y funciones completas.' : 'Consulta rápida sin cuenta registrada.'}</p>
            </div>
            <span className="chip">{isAuthenticated ? 'Sesión activa' : 'Sesión temporal'}</span>
          </div>

          <div className="messages" id="chat-messages">
            {messages.map((msg, i) => (
              <article key={i} className={`message message-${msg.role}`}>
                <p className="message-role">{msg.role === 'assistant' ? 'ALEX' : 'Tú'}</p>
                {msg.role === 'assistant'
                  ? (
                    // CORRECCIÓN: la IA devuelve Markdown. ReactMarkdown lo convierte
                    // a HTML real: negritas, listas, encabezados, código, etc.
                    // Los mensajes del usuario siguen siendo texto plano (<p>).
                    <ReactMarkdown className="message-body">{msg.text}</ReactMarkdown>
                  )
                  : (
                    <p className="message-body">{msg.text}</p>
                  )
                }
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
              <button key={qr.label} type="button" className="quick-reply" onClick={() => setPrompt(qr.text)}>{qr.label}</button>
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
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Enviando...' : (isAuthenticated ? 'Enviar' : 'Enviar en modo invitado')}</button>
              {speechEnabled && !isListening && <button type="button" className="btn-secondary" onClick={startSpeech}>Dictar por voz</button>}
              {speechEnabled &&  isListening && <button type="button" className="btn-secondary" onClick={stopSpeech}>Detener dictado</button>}
              {!isAuthenticated && <Link to="/login" className="btn-secondary">Desbloquear funciones</Link>}
            </div>
          </form>
        </section>
      </div>

      <aside className="chat-side">
        {isAuthenticated ? (
          <div className="side-content">
            <span className="sidebar-section__title">Adjuntar archivo</span>
            <p className="sidebar-hint">PDF, PNG, JPG — máx. {MAX_FILE_MB} MB</p>
            <label className="file-drop" htmlFor="file-input">
              {selectedFile ? (
                <span className="file-selected">📎 {selectedFile.name}<button type="button" className="file-remove" onClick={(e) => { e.preventDefault(); removeFile(); }}>×</button></span>
              ) : (
                <span>Haz clic o arrastra un archivo</span>
              )}
            </label>
            <input id="file-input" ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} onChange={handleFileChange} className="file-input-hidden" />
            {fileError   && <p className="error-box">{fileError}</p>}
            {fileSuccess && <p className="success-box">{fileSuccess}</p>}
            <button type="button" className="btn-primary" style={{ width: '100%' }} disabled={!selectedFile} onClick={handleFileUpload}>Subir archivo</button>
          </div>
        ) : (
          <>
            <div><h3>Disponibles</h3><p>Chat básico, respuestas rápidas y guía inicial.</p></div>
            <div className="locked-card"><h4>Historial</h4><p>Inicia sesión para guardar conversaciones.</p></div>
            <div className="locked-card"><h4>Subida de archivos</h4><p>Inicia sesión para adjuntar documentos.</p></div>
            <div className="locked-card"><h4>Métricas</h4><p>Inicia sesión para ver tu actividad.</p></div>
            <Link to="/register" className="btn-primary" style={{ textAlign: 'center' }}>Crear cuenta gratis</Link>
          </>
        )}
      </aside>

    </div>
  );
}

export default Chat;
