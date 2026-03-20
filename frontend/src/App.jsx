import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hola, soy ALEX, tu asistente virtual de salud. ¿En qué puedo ayudarte hoy?", 
      sender: 'alex' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/ai/guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputText }),
      });

      const data = await response.json();

      if (data.success) {
        // La respuesta viene en data.data.respuesta o data.respuesta dependiendo del controller
        // Controller dice: return res.status(200).json({ success: true, data: { respuesta } });
        // Así que data.data.respuesta sería lo correcto, PERO
        // Revisando gemini.service.js, devuelve "respuesta.response.text()" string directo o objeto?
        // Asumamos que el controller devuelve texto plano en data.respuesta por simplicidad,
        // pero ajustaremos a la estructura más segura:
        const botResponseText = data.data?.respuesta || "No pude procesar tu solicitud.";
        
        const botMessage = {
          id: messages.length + 2,
          text: botResponseText,
          sender: 'alex'
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.message || 'Error en la respuesta');
      }

    } catch (error) {
      console.error('Error fetching chat:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: "Lo siento, hubo un error de conexión. Por favor intenta más tarde.",
        sender: 'alex'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="alex-container">
      <header className="alex-header">
        <h1>ALEX</h1>
        <span className="subtitle">Asistente Local de Emergencias X</span>
      </header>

      <div className="chat-history">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message-bubble ${msg.sender}`}
          >
            {msg.text}
          </div>
        ))}
        
        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>ALEX está escribiendo...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <button 
          className="voice-btn" 
          title="Dictado por voz (Próximamente)"
          onClick={() => alert('Función de voz próximamente')}
        >
          🎤
        </button>
        
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe tus síntomas o pregunta..."
          disabled={isLoading}
        />
        
        <button 
          className="send-btn" 
          onClick={handleSendMessage}
          disabled={isLoading || !inputText.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

export default App;
