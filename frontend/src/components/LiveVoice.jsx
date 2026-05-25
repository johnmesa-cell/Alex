import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SESSION_DURATION = 10 * 60;

export default function LiveVoice() {
  const { user } = useAuth();
  // CORRECCIÓN: JWT usa idRol/roleId numérico (2 = admin), no role string
  const isAdmin = Number(user?.idRol ?? user?.roleId) === 2;

  const [status, setStatus]   = useState('idle');
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [errorMsg, setErrorMsg] = useState('');
  const [volume, setVolume]   = useState(0);

  const wsRef        = useRef(null);
  const audioCtxRef  = useRef(null);
  const streamRef    = useRef(null);
  const processorRef = useRef(null);
  const analyserRef  = useRef(null);
  const timerRef     = useRef(null);
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);

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
    cancelAnimationFrame(rafRef.current);
    clearInterval(timerRef.current);
    processorRef.current?.disconnect();
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setStatus('idle');
    setTimeLeft(SESSION_DURATION);
    setVolume(0);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
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

        const source   = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        source.connect(analyser);

        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        source.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          const float32 = e.inputBuffer.getChannelData(0);
          const pcm16   = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            const c = Math.max(-1, Math.min(1, float32[i]));
            pcm16[i] = c < 0 ? c * 32768 : c * 32767;
          }
          const uint8 = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
          wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: btoa(binary) }));
        };

        drawBars();

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

      {/* Encabezado */}
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

      {/* Canvas visualizador */}
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

      {/* Estado idle */}
      {status === 'idle' && (
        <div className="lv-fade-in" style={{ textAlign: 'center' }}>
          <button
            onClick={startSession}
            style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #4299e1, #2b6cb0)',
              border: '3px solid rgba(99,179,237,0.35)',
              cursor: 'pointer', fontSize: '2.2rem',
              animation: 'pulse-ring 2.2s infinite',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem', transition: 'transform 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title="Iniciar sesión de voz"
          >
            🎤
          </button>
          <p style={{ color: '#a0aec0', fontSize: '0.85rem', margin: 0 }}>
            Toca para iniciar la conversación
          </p>
        </div>
      )}

      {/* Estado conectando */}
      {status === 'connecting' && (
        <div className="lv-fade-in" style={{ textAlign: 'center' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            border: '3px solid #4a5568', borderTop: '3px solid #63b3ed',
            animation: 'spin-slow 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#ecc94b', fontSize: '0.92rem', margin: 0 }}>
            Conectando con el servidor…
          </p>
        </div>
      )}

      {/* Estado escuchando */}
      {status === 'listening' && (
        <div className="lv-fade-in" style={{ textAlign: 'center', width: '100%' }}>
          <button
            onClick={stopSession}
            style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #fc8181, #c53030)',
              border: '3px solid rgba(252,129,129,0.35)',
              cursor: 'pointer', fontSize: '2rem',
              animation: 'pulse-ring-active 1.5s infinite',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem', transition: 'transform 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title="Terminar sesión"
          >
            ⏹
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#68d391', display: 'inline-block', boxShadow: '0 0 8px #68d391' }} />
            <span style={{ color: '#68d391', fontWeight: 600, fontSize: '0.9rem' }}>
              Escuchando — Habla con ALEX
            </span>
          </div>

          <div style={{
            fontFamily: 'monospace', fontSize: '2.4rem', fontWeight: 700,
            color: timeWarning ? '#fc8181' : '#e2e8f0',
            letterSpacing: 4, marginBottom: '0.5rem',
            textShadow: timeWarning ? '0 0 12px rgba(252,129,129,0.5)' : 'none',
            transition: 'color 0.5s, text-shadow 0.5s'
          }}>
            ⏱ {formatTime(timeLeft)}
          </div>

          {timeWarning && (
            <p style={{ color: '#fc8181', fontSize: '0.78rem', margin: '0 0 0.75rem', opacity: 0.85 }}>
              La sesión cerrará pronto
            </p>
          )}

          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden', marginTop: '0.5rem' }}>
            <div style={{
              height: '100%', width: `${volume}%`,
              background: 'linear-gradient(90deg, #63b3ed, #68d391)',
              borderRadius: 4, transition: 'width 0.08s ease'
            }} />
          </div>
          <p style={{ color: '#4a5568', fontSize: '0.7rem', marginTop: '0.35rem' }}>
            Nivel de entrada: {volume}%
          </p>
        </div>
      )}

      {/* Estado error */}
      {status === 'error' && (
        <div className="lv-fade-in" style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
          <p style={{
            color: '#fc8181', marginBottom: '1.25rem', fontSize: '0.9rem',
            background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)',
            borderRadius: 10, padding: '0.75rem 1rem'
          }}>
            {errorMsg}
          </p>
          <button
            onClick={() => { setStatus('idle'); setErrorMsg(''); }}
            style={{
              background: 'rgba(66,153,225,0.15)', color: '#90cdf4',
              border: '1px solid rgba(99,179,237,0.3)', borderRadius: 10,
              padding: '0.6rem 1.5rem', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600, transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(66,153,225,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(66,153,225,0.15)'}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '2rem', paddingTop: '1.25rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        width: '100%', textAlign: 'center'
      }}>
        <p style={{ fontSize: '0.72rem', color: '#4a5568', margin: 0 }}>
          🔒 Sesión segura · Límite 10 min · ~$0.04/min · Desconexión automática
        </p>
      </div>
    </div>
  );
}