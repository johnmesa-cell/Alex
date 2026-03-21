import React, { useMemo, useRef, useState } from 'react';
import api, { getApiError, uploadDocument } from '../services/api.js';

function Chat() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hola, soy ALEX. Describe la situacion y te dare guidance inicial de primeros auxilios.'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  const speechEnabled = useMemo(
    () => typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
    []
  );

  const sendPrompt = async (inputPrompt) => {
    const cleanPrompt = inputPrompt.trim();
    if (!cleanPrompt || loading) {
      return;
    }

    setError('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', text: cleanPrompt }]);

    try {
      const { data } = await api.post('/api/ai/guidance', { prompt: cleanPrompt });
      const answer = data?.data?.respuesta || 'No se recibio respuesta valida del servidor.';

      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
      setPrompt('');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendPrompt(prompt);
  };

  const startSpeech = () => {
    if (!speechEnabled || isListening) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setPrompt(transcript);
    };

    recognition.onerror = () => {
      setError('No fue posible capturar audio. Verifica permisos del microfono.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopSpeech = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setError('');
  };

  const handleDocumentSubmit = async () => {
    if (!selectedFile || loading) return;

    setError('');
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: `📄 Documento adjunto: ${selectedFile.name}${prompt.trim() ? `\n${prompt.trim()}` : ''}` },
    ]);

    try {
      const { data } = await uploadDocument(selectedFile, prompt.trim());
      const answer = data?.data?.respuesta || 'No se recibio respuesta valida del servidor.';
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
      setSelectedFile(null);
      setPrompt('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="chat-layout">
      <div className="chat-header fade-up">
        <h1>Chat IA</h1>
        <p>Endpoint integrado: POST /api/ai/guidance</p>
      </div>

      <div className="chat-panel slide-in">
        <div className="messages">
          {messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={`message message-${message.role}`}
            >
              <p className="message-role">{message.role === 'assistant' ? 'ALEX' : 'Tu'}</p>
              <p>{message.text}</p>
            </article>
          ))}

          {loading && (
            <article className="message message-assistant typing">
              <p className="message-role">ALEX</p>
              <p>Analizando tu solicitud...</p>
            </article>
          )}
        </div>

        <form onSubmit={handleSubmit} className="chat-form">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ejemplo: una persona esta inconsciente, como evaluo respiracion y pulso?"
            rows={3}
            required={!selectedFile}
          />

          <div className="document-upload">
            <label htmlFor="doc-input" className="btn-secondary btn-file-label">
              📎 Adjuntar documento
            </label>
            <input
              id="doc-input"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              onChange={handleFileChange}
              className="file-input-hidden"
            />
            {selectedFile && (
              <span className="file-name-preview">
                {selectedFile.name}
                <button
                  type="button"
                  className="btn-remove-file"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  aria-label="Quitar archivo"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {error && <p className="error-box">{error}</p>}

          <div className="chat-actions">
            {selectedFile ? (
              <button
                type="button"
                className="btn-primary"
                disabled={loading}
                onClick={handleDocumentSubmit}
              >
                {loading ? 'Analizando...' : 'Analizar documento'}
              </button>
            ) : (
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            )}

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

            {!speechEnabled && <span className="muted">Tu navegador no soporta reconocimiento de voz.</span>}
          </div>
        </form>
      </div>
    </section>
  );
}

export default Chat;
