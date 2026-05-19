import React from 'react';

const AGENT_PANEL = import.meta.env.VITE_AGENT_PANEL_URL ?? 'https://agent.megiddo20.me/admin';

function AdminPanel() {
  return (
    <div className="admin-panel-root">
      <div className="admin-panel-bar">
        <div className="admin-panel-bar__left">
          <span className="admin-panel-bar__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </span>
          <span className="admin-panel-bar__title">Panel de Administración — ALEX Agent</span>
        </div>
        <a
          href={AGENT_PANEL}
          target="_blank"
          rel="noreferrer"
          className="admin-panel-bar__link"
        >
          Abrir en ventana nueva
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ marginLeft: '5px' }} aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
      <iframe
        src={AGENT_PANEL}
        className="admin-panel-iframe"
        title="ALEX Admin Panel"
      />
    </div>
  );
}

export default AdminPanel;
