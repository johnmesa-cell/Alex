import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SESSION_DURATION = 10 * 60;

export default function LiveVoice() {
  const { user } = useAuth();
  const isAdmin = Number(user?.idRol ?? user?.roleId) === 2;

  const [status, setStatus]     = useState('idle');
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [errorMsg, setErrorMsg] = useState('');
  const [volume, setVolume]     = useState(0);

  const wsRef           = useRef(null);
  const audioCtxRef     = useRef(null);
  const streamRef       = useRef(null);
  const processorRef    = useRef(null);
  const analyserRef     = useRef(null);
  const timerRef        = useRef(null);
  const canvasRef       = useRef(null);
  const rafRef          = useRef(null);
  const closingRef      = useRef(false);

  useEffect(() => () => stopSession(), []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const drawBars = () => {
    const analyser = analyserRef.current;
    const canvas   = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx  = canvas.getContext('2d');
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bars = 28;
    const barW = 6;
    const gap  = (canvas.width - bars * barW) / (bars + 1);
    const avg  = data.slice(0, bars).reduce((a, b) => a + b, 0) / bars;
    setVolume(Math.round((avg / 255) * 100));

    for (let i = 0; i < bars; i++) {
      const val = data[i] / 255;
      const h   = Math.max(4, val * canvas.height * 0.9);
      const x   = gap + i * (barW + gap);
      const y   = (canvas.height - h) / 2;
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0,   '#90cdf4');
      grad.addColorStop(0.5, '#63b3ed');
      grad.addColorStop(1,   '#3182ce');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, h, 3);
      ctx.fill();
    }
    rafRef.current = requestAnimationFrame(drawBars);
  };

  const stopSession = () => {
    if (closingRef.current) return;
    closingRef.current = true;

    cancelAnimationFrame(rafRef.current);
    clearInterval(timerRef.current);

    // Desconectar ScriptProcessorNode
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    analyserRef.current = null;

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
    audioCtxRef.current = null;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    setStatus('idle');
    setTimeLeft(SESSION_DURATION);
    setVolume(0);

    setTimeout(() => { closingRef.current = false; }, 100);
  };

  const startSession = async () => {
    setStatus('connecting');
    setErrorMsg('');
    closingRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/admin/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('listening');

        // AudioContext a 24kHz — formato que espera OpenAI Realtime API
        const audioCtx = new AudioContext({ sampleRate: 24000 });
        audioCtxRef.current = audioCtx;

        const source   = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        source.connect(analyser);

        drawBars();

        // ScriptProcessorNode: captura PCM float32 → convierte a PCM16 → envía base64
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

          const float32 = e.inputBuffer.getChannelData(0);
          const pcm16   = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
          }

          const bytes = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);

          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: btoa(binary)
          }));
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
        processorRef.current = processor;

        // Temporizador de 10 minutos
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) { stopSession(); return SESSION_DURATION; }
            return prev - 1;
          });
        }, 1000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'response.audio.delta' && msg.delta) {
            const binary  = atob(msg.delta);
            const pcm16   = new Int16Array(binary.length / 2);
            for (let i = 0; i < pcm16.length; i++)
              pcm16[i] = binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8);
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768.0;

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
        if (!closingRef.current) {
          setStatus('error');
          setErrorMsg('Error de conexión WebSocket. Verifica que el servidor esté activo.');
          stopSession();
        }
      };

      ws.onclose = (event) => {
        if (!closingRef.current) {
          if (event.code === 1000 && event.reason === 'Session timeout') {
            setErrorMsg('La sesión expiró después de 10 minutos.');
            setStatus('error');
          }
          stopSession();
        }
      };

    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado. Autoriza el acceso en tu navegador.'
          : err.message || 'No se pudo iniciar la sesión de voz.'
      );
      closingRef.current = false;
    }
  };

  if (!isAdmin) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1.25rem 1.5rem', borderRadius: 12,
        background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.25)'
      }}>
        <span style={{ fontSize: '1.4rem' }}>🔒</span>
        <p style={{ color: '#fc8181', margin: 0, fontSize: '0.92rem' }}>
          Acceso denegado: solo administradores pueden usar esta función.
        </p>
      </div>
    );
  }

  const timeWarning = timeLeft < 60;

  return (
    <div className="lv-fade-in" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '2.5rem 2rem', maxWidth: 480, margin: '0 auto',
      background: 'linear-gradient(145deg, #1a202c 0%, #2d3748 100%)',
      borderRadius: 24,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.07)'
    }}>

      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.25)',
          borderRadius: 999, padding: '0.25rem 0.85rem', marginBottom: '0.75rem'
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#63b3ed', display: 'inline-block' }} />
          <span style={{ color: '#90cdf4', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            OpenAI Realtime API
          </span>
        </div>
        <h3 style={{ margin: 0, color: '#f7fafc', fontSize: '1.25rem', fontWeight: 700 }}>
          Conversación de voz con ALEX
        </h3>
        <p style={{ margin: '0.4rem 0 0', color: '#718096', fontSize: '0.82rem' }}>
          Habla directamente con el asistente. La clave de API nunca sale del servidor.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={320} height={64}
        style={{
          display: status === 'listening' ? 'block' : 'none',
          marginBottom: '1.5rem', borderRadius: 12,
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      />

      {status === 'listening' && (
        <div style={{
          marginBottom: '1.25rem',
          fontSize: '0.82rem',
          color: timeWarning ? '#fc8181' : '#718096',
          fontVariantNumeric: 'tabular-nums',
          display: 'flex', alignItems: 'center', gap: '0.4rem'
        }}>
          {timeWarning && <span style={{ animation: 'dot-pulse 1s infinite' }}>⚠️</span>}
          Tiempo restante: <strong>{formatTime(timeLeft)}</strong>
        </div>
      )}

      {errorMsg && (
        <div style={{
          marginBottom: '1.25rem', padding: '0.75rem 1rem',
          background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)',
          borderRadius: 10, color: '#fc8181', fontSize: '0.83rem', textAlign: 'center'
        }}>
          {errorMsg}
        </div>
      )}

      {status === 'idle' && (
        <button
          onClick={startSession}
          style={{
            width: 80, height: 80, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #3182ce, #2b6cb0)',
            color: '#fff', cursor: 'pointer', fontSize: '1.75rem',
            boxShadow: '0 4px 20px rgba(49,130,206,0.5)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            animation: 'pulse-ring 2s infinite'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          🎤
        </button>
      )}

      {status === 'connecting' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            border: '3px solid rgba(99,179,237,0.3)',
            borderTopColor: '#63b3ed',
            animation: 'spin-slow 0.9s linear infinite'
          }} />
          <span style={{ color: '#718096', fontSize: '0.85rem' }}>Conectando con ALEX…</span>
        </div>
      )}

      {status === 'listening' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={stopSession}
            style={{
              width: 80, height: 80, borderRadius: '50%', border: 'none',
              background: 'linear-gradient(135deg, #e53e3e, #c53030)',
              color: '#fff', cursor: 'pointer', fontSize: '1.5rem',
              boxShadow: '0 4px 20px rgba(229,62,62,0.5)',
              transition: 'transform 0.15s',
              animation: 'pulse-ring-active 1.5s infinite'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            ⏹
          </button>
          <span style={{ color: '#68d391', fontSize: '0.85rem', fontWeight: 600 }}>
            🎙️ Escuchando — Habla con ALEX
          </span>
          {volume > 0 && (
            <span style={{ color: '#718096', fontSize: '0.75rem' }}>
              Nivel de entrada: {volume}%
            </span>
          )}
        </div>
      )}

      {status === 'error' && (
        <button
          onClick={() => { setStatus('idle'); setErrorMsg(''); }}
          style={{
            marginTop: '0.5rem', padding: '0.6rem 1.5rem',
            background: 'rgba(99,179,237,0.15)', border: '1px solid rgba(99,179,237,0.3)',
            borderRadius: 10, color: '#90cdf4', cursor: 'pointer', fontSize: '0.85rem'
          }}
        >
          ↺ Intentar de nuevo
        </button>
      )}

      <p style={{
        marginTop: '1.5rem', color: '#4a5568', fontSize: '0.72rem', textAlign: 'center'
      }}>
        Sesión máxima: 10 min · ~$0.06/min · Solo administradores
      </p>
    </div>
  );
}