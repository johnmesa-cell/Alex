import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SESSION_DURATION = 10 * 60; // 10 minutos en segundos

export default function LiveVoice() {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | connecting | listening | error
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [errorMsg, setErrorMsg] = useState('');

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const timerRef = useRef(null);

  // Validar que el usuario sea admin
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ padding: '1.5rem', color: '#fc8181' }}>
        <p>❌ Acceso denegado: solo administradores pueden usar esta función.</p>
      </div>
    );
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const stopSession = () => {
    clearInterval(timerRef.current);
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
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
      // 1. Solicitar acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Conectar WebSocket al backend de Alex (el backend valida JWT admin)
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/admin/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('listening');

        // 3. Configurar AudioContext con sample rate de 24kHz (requerido por OpenAI Realtime)
        const audioCtx = new AudioContext({ sampleRate: 24000 });
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);

        // ScriptProcessor para convertir float32 → PCM16 little-endian
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

          // Convertir buffer PCM16 a base64 para el protocolo OpenAI Realtime
          const uint8 = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64Audio = btoa(binary);

          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        };

        // 4. Iniciar countdown de 10 minutos
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
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

          // Reproducir audio delta que llega desde OpenAI Realtime API
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
        } catch {
          // Ignorar mensajes que no sean JSON válido
        }
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
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Permiso de micrófono denegado. Autoriza el acceso en tu navegador.');
      } else {
        setErrorMsg(err.message || 'No se pudo iniciar la sesión de voz.');
      }
    }
  };

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => stopSession();
  }, []);

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
        <button
          onClick={startSession}
          style={{
            background: '#2b6cb0', color: '#fff', border: 'none',
            borderRadius: 8, padding: '0.75rem 1.75rem',
            cursor: 'pointer', fontSize: '1rem', fontWeight: 600
          }}
        >
          🎤 Iniciar sesión de voz
        </button>
      )}

      {status === 'connecting' && (
        <p style={{ color: '#ecc94b', fontSize: '0.95rem' }}>
          ⏳ Conectando con el servidor…
        </p>
      )}

      {status === 'listening' && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'
          }}>
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              background: '#68d391', display: 'inline-block',
              boxShadow: '0 0 8px #68d391'
            }} />
            <span style={{ color: '#68d391', fontWeight: 600 }}>
              Escuchando — Habla con ALEX
            </span>
          </div>

          <p style={{
            fontFamily: 'monospace', fontSize: '2rem',
            color: timeLeft < 60 ? '#fc8181' : '#e2e8f0',
            marginBottom: '1rem', letterSpacing: 2
          }}>
            ⏱ {formatTime(timeLeft)}
          </p>

          <button
            onClick={stopSession}
            style={{
              background: '#c53030', color: '#fff', border: 'none',
              borderRadius: 8, padding: '0.65rem 1.5rem',
              cursor: 'pointer', fontSize: '0.95rem'
            }}
          >
            ⏹ Terminar sesión
          </button>
        </div>
      )}

      {status === 'error' && (
        <div>
          <p style={{ color: '#fc8181', marginBottom: '0.75rem', fontSize: '0.92rem' }}>
            ❌ {errorMsg}
          </p>
          <button
            onClick={() => { setStatus('idle'); setErrorMsg(''); }}
            style={{
              background: '#2b6cb0', color: '#fff', border: 'none',
              borderRadius: 8, padding: '0.65rem 1.5rem',
              cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: '#4a5568', marginTop: '2rem' }}>
        Sesión limitada a 10 minutos (~$0.04/min). Se desconecta automáticamente al vencer el tiempo.
      </p>
    </div>
  );
}
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const stopSession = () => {
    clearInterval(timerRef.current);
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
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
      // 1. Solicitar acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Conectar WebSocket al backend de Alex (el backend valida JWT admin)
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/admin/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('listening');

        // 3. Configurar AudioContext con sample rate de 24kHz (requerido por OpenAI Realtime)
        const audioCtx = new AudioContext({ sampleRate: 24000 });
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);

        // ScriptProcessor para convertir float32 → PCM16 little-endian
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

          // Convertir buffer PCM16 a base64 para el protocolo OpenAI Realtime
          const uint8 = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64Audio = btoa(binary);

          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        };

        // 4. Iniciar countdown de 10 minutos
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
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

          // Reproducir audio delta que llega desde OpenAI Realtime API
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
        } catch {
          // Ignorar mensajes que no sean JSON válido
        }
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
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Permiso de micrófono denegado. Autoriza el acceso en tu navegador.');
      } else {
        setErrorMsg(err.message || 'No se pudo iniciar la sesión de voz.');
      }
    }
  };

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => stopSession();
  }, []);

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
        <button
          onClick={startSession}
          style={{
            background: '#2b6cb0', color: '#fff', border: 'none',
            borderRadius: 8, padding: '0.75rem 1.75rem',
            cursor: 'pointer', fontSize: '1rem', fontWeight: 600
          }}
        >
          🎤 Iniciar sesión de voz
        </button>
      )}

      {status === 'connecting' && (
        <p style={{ color: '#ecc94b', fontSize: '0.95rem' }}>
          ⏳ Conectando con el servidor…
        </p>
      )}

      {status === 'listening' && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'
          }}>
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              background: '#68d391', display: 'inline-block',
              boxShadow: '0 0 8px #68d391'
            }} />
            <span style={{ color: '#68d391', fontWeight: 600 }}>
              Escuchando — Habla con ALEX
            </span>
          </div>

          <p style={{
            fontFamily: 'monospace', fontSize: '2rem',
            color: timeLeft < 60 ? '#fc8181' : '#e2e8f0',
            marginBottom: '1rem', letterSpacing: 2
          }}>
            ⏱ {formatTime(timeLeft)}
          </p>

          <button
            onClick={stopSession}
            style={{
              background: '#c53030', color: '#fff', border: 'none',
              borderRadius: 8, padding: '0.65rem 1.5rem',
              cursor: 'pointer', fontSize: '0.95rem'
            }}
          >
            ⏹ Terminar sesión
          </button>
        </div>
      )}

      {status === 'error' && (
        <div>
          <p style={{ color: '#fc8181', marginBottom: '0.75rem', fontSize: '0.92rem' }}>
            ❌ {errorMsg}
          </p>
          <button
            onClick={() => { setStatus('idle'); setErrorMsg(''); }}
            style={{
              background: '#2b6cb0', color: '#fff', border: 'none',
              borderRadius: 8, padding: '0.65rem 1.5rem',
              cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: '#4a5568', marginTop: '2rem' }}>
        Sesión limitada a 10 minutos (~$0.04/min). Se desconecta automáticamente al vencer el tiempo.
      </p>
    </div>
  );
}
