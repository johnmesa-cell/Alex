import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Se produjo un error en la interfaz.'
    };
  }

  componentDidCatch(error) {
    // Surface app crashes in the browser console for easier debugging.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturo un error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ maxWidth: '780px', margin: '2rem auto', padding: '1rem' }}>
          <h1 style={{ marginBottom: '0.8rem' }}>No se pudo renderizar la app</h1>
          <p style={{ marginBottom: '0.8rem' }}>Ocurrio un error de runtime en React.</p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#fff3f1',
              border: '1px solid #f3c3bd',
              borderRadius: '10px',
              padding: '0.8rem'
            }}
          >
            {this.state.message}
          </pre>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
