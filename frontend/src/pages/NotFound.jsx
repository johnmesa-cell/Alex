import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', textAlign: 'center',
      padding: 'var(--space-8)'
    }}>
      <p style={{ fontSize: '5rem', margin: 0, lineHeight: 1 }}>🚑</p>
      <h1 style={{ fontSize: 'var(--text-3xl)', margin: 'var(--space-4) 0 var(--space-2)' }}>404</h1>
      <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
        Esta página no existe o fue movida.
      </p>
      <Link to="/" className="btn-primary" style={{ minWidth: '180px', textAlign: 'center' }}>
        Volver al inicio
      </Link>
    </div>
  );
}

export default NotFound;
