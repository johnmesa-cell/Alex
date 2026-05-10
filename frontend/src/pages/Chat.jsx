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

function Chat() {
  const { isAuthenticated, user } = useAuth();

  // Chat state
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

  // Voz
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Archivos (solo autenticado)
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [fileSuccess, setFileSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Panel lateral: tab activo
  const [sideTab, setSideTab] = useState('historial'); // 'historial' | 'archivos' | 'metricas'

  // Historial simulado (se reemplazará cuando exista endpoint)
  const historial = [
    { id: 1, fecha: 'Hoy, 10:32', resumen: 'Control de sangrado en herida superficial' },
    { id: 2, fecha: 'Ayer, 15:14', resumen: 'Pasos de RCP para adulto' },
    { id: 3, fecha: '08 may, 09:05', resumen: 'Quemadura leve con agua caliente' },
  ];

  const messagesEndRef = useRef(null);

  const speechEnabled = useMemo(
    () => typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
    []
  );

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

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

  const handleSubmit = async (e) => { e.preventDefault(); await sendPrompt(prompt); };

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

  // Manejo de archivo
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
      await api.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFileSuccess(`"${selectedFile.name}" subido correctamente.`);
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
        {/* ── Panel principal de chat ── */}
        <section className="chat-panel">
          <div className="chat-head">
            <div>
              <h1>Chat IA</h1>
              <p className="chat-head__sub">
                {isAuthenticated ? `Bienvenido, ${user?.nombre || 'Usuario'}. Sesión con funciones completas.` : 'Consulta rápida sin cuenta registrada.'}
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
                  <span className="typing-dots" aria-hidden="true"><span /><span /><span /></span>
                </p>
              </article>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Respuestas rápidas */}
          <div className="quick-replies" aria-label="Respuestas rápidas">
            {QUICK_REPLIES.map((qr) => (
              <button key={qr.label} type="button" className="quick-reply" onClick={() => setPrompt(qr.text)}>
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
                <button type="button" className="btn-secondary" onClick={startSpeech}>Dictar por voz</button>
              )}
              {speechEnabled && isListening && (
                <button type="button" className="btn-secondary" onClick={stopSpeech}>Detener dictado</button>
              )}
              {!isAuthenticated && (
                <Link to="/login" className="btn-secondary">Desbloquear funciones</Link>
              )}
            </div>
          </form>
        </section>

        {/* ── Panel lateral ── */}
        <aside className="chat-side">
          {isAuthenticated ? (
            <>
              {/* Tabs */}
              <div className="side-tabs">
                <button
                  type="button"
                  className={`side-tab${sideTab === 'historial' ? ' active' : ''}`}
                  onClick={() => setSideTab('historial')}
                >Historial</button>
                <button
                  type="button"
                  className={`side-tab${sideTab === 'archivos' ? ' active' : ''}`}
                  onClick={() => setSideTab('archivos')}
                >Archivos</button>
                <button
                  type="button"
                  className={`side-tab${sideTab === 'metricas' ? ' active' : ''}`}
                  onClick={() => setSideTab('metricas')}
                >Métricas</button>
              </div>

              {/* Tab: Historial */}
              {sideTab === 'historial' && (
                <div className="side-content">
                  {historial.length === 0 ? (
                    <p className="muted">Aún no tienes consultas guardadas.</p>
                  ) : (
                    <ul className="historial-list">
                      {historial.map((h) => (
                        <li key={h.id} className="historial-item">
                          <span className="historial-fecha">{h.fecha}</span>
                          <span className="historial-resumen">{h.resumen}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Tab: Archivos */}
              {sideTab === 'archivos' && (
                <div className="side-content">
                  <p className="muted side-hint">Sube imágenes o PDFs para adjuntarlos a tu consulta (máx. {MAX_FILE_MB} MB).</p>
                  <label className="file-drop" htmlFor="file-input">
                    {selectedFile ? (
                      <span className="file-selected">
                        📎 {selectedFile.name}
                        <button type="button" className="file-remove" onClick={(e) => { e.preventDefault(); removeFile(); }}>×</button>
                      </span>
                    ) : (
                      <span>Haz clic o arrastra un archivo aquí</span>
                    )}
                  </label>
                  <input
                    id="file-input"
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    onChange={handleFileChange}
                    className="file-input-hidden"
                  />
                  {fileError && <p className="error-box">{fileError}</p>}
                  {fileSuccess && <p className="success-box">{fileSuccess}</p>}
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!selectedFile}
                    onClick={handleFileUpload}
                  >
                    Subir archivo
                  </button>
                </div>
              )}

              {/* Tab: Métricas */}
              {sideTab === 'metricas' && (
                <div className="side-content">
                  <ul className="metrics-list">
                    <li className="metric-item">
                      <span className="metric-label">Consultas totales</span>
                      <span className="metric-value">{messages.filter(m => m.role === 'user').length}</span>
                    </li>
                    <li className="metric-item">
                      <span className="metric-label">Sesión actual</span>
                      <span className="metric-value">{messages.length} mensajes</span>
                    </li>
                    <li className="metric-item">
                      <span className="metric-label">Usuario</span>
                      <span className="metric-value">{user?.nombre || '—'}</span>
                    </li>
                    <li className="metric-item">
                      <span className="metric-label">Historial guardado</span>
                      <span className="metric-value">{historial.length} consultas</span>
                    </li>
                  </ul>
                  <p className="muted side-hint">Las métricas detalladas estarán disponibles próximamente.</p>
                </div>
              )}
            </>
          ) : (
            /* Modo invitado — sin cambios */
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
