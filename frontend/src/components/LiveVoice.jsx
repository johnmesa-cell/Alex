
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SESSION_DURATION = 10 * 60;

export default function LiveVoice() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [status, setStatus] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [errorMsg, setErrorMsg] = useState('');

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const timerRef = useRef(null);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const stopSession = () => {
    clearInterval(timerRef.current);
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('idle');
    setTimeLeft(SESSION_DURATION);
  };

  const startSession = async () => {
    setStatus('connecting');
    setErrorMsg('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/admin/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('listening');

        const audioCtx = new AudioContext({ sampleRate: 24000 });
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        source.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

          const float32 = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            const clamped = Math.max(-1, Math.min(1, float32[i]));
            pcm16[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
          }

          const uint8 = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);

          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: btoa(binary)
          }));
        };

        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              stopSession();
              return SESSION_DURATION;
            }
            return prev - 1;
          });
        }, 1000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'response.audio.delta' && msg.delta) {
            const binary = atob(msg.delta);
            const pcm16 = new Int16Array(binary.length / 2);
            for (let i = 0; i < pcm16.length; i++) {
              pcm16[i] = binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8);
            }
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) {
              float32[i] = pcm16[i] / 32768.0;
            }

            const audioCtx = audioCtxRef.current;
            if (audioCtx && audioCtx.state !== 'closed') {
              const buffer = audioCtx.createBuffer(1, float32.length, 24000);
              buffer.copyToChannel(float32, 0);
              const src = audioCtx.createBufferSource();
              src.buffer = buffer;
              src.connect(audioCtx.destination);
              src.start();
            }
          }
        } catch {}
      };

      ws.onerror = () => {
        setStatus('error');
        setErrorMsg('Error de conexión WebSocket. Verifica que el servidor esté activo.');
        stopSession();
      };

      ws.onclose = (event) => {
        if (event.code === 1000 && event.reason === 'Session timeout') {
          setErrorMsg('La sesión expiró después de 10 minutos.');
          setStatus('error');
        }
        stopSession();
      };
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado. Autoriza el acceso en tu navegador.'
          : err.message || 'No se pudo iniciar la sesión de voz.'
      );
    }
  };

  useEffect(() => () => stopSession(), []);

  if (!isAdmin) {
    return (
      <div style={{ padding: '1.5rem', color: '#fc8181' }}>
        <p>❌ Acceso denegado: solo administradores pueden usar esta función.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 520 }}>
      <h3 style={{ marginBottom: '0.5rem', color: '#90cdf4', fontSize: '1.1rem' }}>
        🎙️ Conversación de voz en tiempo real
      </h3>
      <p style={{ color: '#718096', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
        Habla directamente con ALEX usando OpenAI Realtime API.
        La clave de API nunca sale del servidor.
      </p>

      {status === 'idle' && (
        <button onClick={startSession}>🎤 Iniciar sesión de voz</button>
      )}

      {status === 'connecting' && <p>⏳ Conectando con el servidor…</p>}

      {status === 'listening' && (
        <div>
          <p>🟢 Escuchando — Habla con ALEX</p>
          <p>⏱ {formatTime(timeLeft)}</p>
          <button onClick={stopSession}>⏹ Terminar sesión</button>
        </div>
      )}

      {status === 'error' && (
        <div>
          <p>❌ {errorMsg}</p>
          <button onClick={() => { setStatus('idle'); setErrorMsg(''); }}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}