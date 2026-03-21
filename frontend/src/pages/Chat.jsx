import React, { useMemo, useRef, useState } from 'react';
import api, { getApiError } from '../services/api.js';

const ACCEPTED_FILE_TYPES = '.pdf,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp';

function Chat() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hola, soy ALEX. Describe la situacion y te dare guidance inicial de primeros auxilios. Tambien puedes adjuntar un documento o imagen para que lo analice.'
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
    if ((!cleanPrompt && !selectedFile) || loading) {
      return;
    }

    setError('');
    setLoading(true);

    const userText = cleanPrompt || `[Documento adjunto: ${selectedFile?.name || 'archivo'}]`;
    setMessages((prev) => [...prev, { role: 'user', text: userText, fileName: selectedFile?.name }]);

    try {
      let answer;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (cleanPrompt) {
          formData.append('prompt', cleanPrompt);
        }
        const { data } = await api.post('/api/ai/document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        answer = data?.data?.respuesta || 'No se recibio respuesta valida del servidor.';
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const { data } = await api.post('/api/ai/guidance', { prompt: cleanPrompt });
        answer = data?.data?.respuesta || 'No se recibio respuesta valida del servidor.';
      }

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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setError('');
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  return (
    <section className="chat-layout">
      <div className="chat-header fade-up">
        <h1>Chat IA</h1>
        <p>Endpoint integrado: POST /api/ai/guidance | POST /api/ai/document</p>
      </div>

      <div className="chat-panel slide-in">
        <div className="messages">
          {messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={`message message-${message.role}`}
            >
              <p className="message-role">{message.role === 'assistant' ? 'ALEX' : 'Tu'}</p>
              {message.fileName && (
                <p className="message-file-tag">📎 {message.fileName}</p>
              )}
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
          {selectedFile && (
            <div className="file-preview">
              <span>📎 {selectedFile.name}</span>
              <button type="button" className="file-remove-btn" onClick={removeFile} aria-label="Quitar archivo">✕</button>
            </div>
          )}

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={selectedFile ? "Pregunta sobre el documento (opcional)..." : "Ejemplo: una persona esta inconsciente, como evaluo respiracion y pulso?"}
            rows={3}
          />

          {error && <p className="error-box">{error}</p>}

          <div className="chat-actions">
            <button type="submit" className="btn-primary" disabled={loading || (!prompt.trim() && !selectedFile)}>
              {loading ? 'Enviando...' : 'Enviar'}
            </button>

            <label className="btn-secondary file-upload-label" title="Adjuntar documento o imagen (PDF, TXT, CSV, imagen)">
              📎 Adjuntar archivo
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileChange}
                className="file-input-hidden"
              />
            </label>

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

