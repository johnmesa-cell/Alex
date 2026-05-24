import React, { useState, useEffect, useCallback } from 'react';
import api, { getApiError } from '../services/api.js';
import '../styles/admin.css';

const AGENT_PANEL = import.meta.env.VITE_AGENT_PANEL_URL ?? 'https://agent.megiddo20.me/admin';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',        d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { id: 'usuarios',   label: 'Usuarios',          d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'sesiones',   label: 'Sesiones activas',  d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
  { id: 'auditoria',  label: 'Auditoría',         d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
  { id: 'consultas',  label: 'Consultas',         d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'agente',     label: 'Panel del Agente',  d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
];

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function Dashboard() {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data?.data ?? r.data ?? null))
      .catch(e => setError(getApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="adm-loading"><span className="adm-spinner" />Cargando…</div>;
  if (error)   return <div className="adm-error">{error}</div>;
  if (!data)   return <div className="adm-error">No se pudo cargar el resumen.</div>;

  const cards = [
    { label: 'Usuarios totales',   value: data.totalUsuarios    ?? 0, icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', color: 'teal' },
    { label: 'Sesiones activas',   value: data.sesionesActivas  ?? 0, icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', color: 'blue' },
    { label: 'Consultas abiertas', value: data.consultasAbiertas ?? 0, icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', color: 'amber' },
    { label: 'Reportes generados', value: data.totalReportes    ?? 0, icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6', color: 'purple' },
  ];

  return (
    <div className="adm-section fade-up">
      <h2 className="adm-section-title">Resumen del sistema</h2>
      <div className="adm-stat-grid">
        {cards.map(c => (
          <div key={c.label} className={`adm-stat-card adm-stat-card--${c.color}`}>
            <div className="adm-stat-card__icon"><Icon d={c.icon} size={22} /></div>
            <div className="adm-stat-card__body">
              <span className="adm-stat-card__value">{c.value}</span>
              <span className="adm-stat-card__label">{c.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Usuarios() {
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');

  const load = useCallback((p = 1, q = search) => {
    setLoading(true);
    api.get('/admin/usuarios', { params: { page: p, search: q } })
      .then(r => {
        const d = r.data?.data ?? {};
        setRows(d.usuarios ?? []);
        setTotal(d.total   ?? 0);
        setPage(d.page     ?? 1);
        setPages(d.pages   ?? 1);
      })
      .catch(e => setError(getApiError(e)))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(1); }, []);

  const handleSearch = e => { e.preventDefault(); load(1, search); };

  const toggle = async (u) => {
    const nuevoEstado = u.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      await api.patch(`/admin/usuarios/${u.id_usuario}`, { estado: nuevoEstado });
      setRows(prev => prev.map(r => r.id_usuario === u.id_usuario ? { ...r, estado: nuevoEstado } : r));
      setToast(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setError(getApiError(e)); }
  };

  return (
    <div className="adm-section fade-up">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Usuarios <span className="adm-badge">{total}</span></h2>
        <form className="adm-search" onSubmit={handleSearch}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o correo…" />
          <button type="submit" className="btn-primary">Buscar</button>
        </form>
      </div>
      {toast && <div className="adm-toast">{toast}</div>}
      {error && <div className="adm-error">{error}</div>}
      {loading ? <div className="adm-loading"><span className="adm-spinner" />Cargando…</div> : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th><th>Nombre</th><th>Correo</th><th>Rol</th>
                  <th>Estado</th><th>Registro</th><th>Último login</th><th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sin resultados</td></tr>
                )}
                {rows.map(u => (
                  <tr key={u.id_usuario}>
                    <td>{u.id_usuario}</td>
                    <td>{u.nombre}</td>
                    <td>{u.correo}</td>
                    <td><span className="adm-chip">{u.roles?.nombre_rol ?? '—'}</span></td>
                    <td><span className={`adm-status adm-status--${u.estado}`}>{u.estado}</span></td>
                    <td>{fmt(u.fecha_registro)}</td>
                    <td>{fmt(u.ultimo_login)}</td>
                    <td>
                      <button
                        className={u.estado === 'activo' ? 'adm-btn-danger' : 'adm-btn-ok'}
                        onClick={() => toggle(u)}
                      >
                        {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="adm-pagination">
            <button disabled={page <= 1}     onClick={() => load(page - 1)} className="btn-secondary">← Anterior</button>
            <span>Página {page} de {pages}</span>
            <button disabled={page >= pages} onClick={() => load(page + 1)} className="btn-secondary">Siguiente →</button>
          </div>
        </>
      )}
    </div>
  );
}

function Sesiones() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/sesiones')
      .then(r => setRows(r.data?.data ?? []))
      .catch(e => setError(getApiError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const cerrar = async (id) => {
    try {
      await api.delete(`/admin/sesiones/${id}`);
      setRows(prev => prev.filter(s => s.id_sesion !== id));
      setToast('Sesión cerrada exitosamente');
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setError(getApiError(e)); }
  };

  return (
    <div className="adm-section fade-up">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Sesiones activas <span className="adm-badge">{rows.length}</span></h2>
        <button className="btn-secondary" onClick={load}>↻ Actualizar</button>
      </div>
      {toast && <div className="adm-toast">{toast}</div>}
      {error && <div className="adm-error">{error}</div>}
      {loading ? <div className="adm-loading"><span className="adm-spinner" />Cargando…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Usuario</th><th>Correo</th><th>IP</th><th>Inicio</th><th>Última actividad</th><th>Expira</th><th>Acción</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay sesiones activas</td></tr>
              )}
              {rows.map(s => (
                <tr key={s.id_sesion}>
                  <td>{s.usuario?.nombre ?? '—'}</td>
                  <td>{s.usuario?.correo ?? '—'}</td>
                  <td><code>{s.ip ?? '—'}</code></td>
                  <td>{fmt(s.fecha_inicio)}</td>
                  <td>{fmt(s.ultima_actividad)}</td>
                  <td>{fmt(s.fecha_expiracion)}</td>
                  <td><button className="adm-btn-danger" onClick={() => cerrar(s.id_sesion)}>Cerrar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Auditoria() {
  const [rows, setRows]       = useState([]);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = (p = 1) => {
    setLoading(true);
    api.get('/admin/auditoria', { params: { page: p } })
      .then(r => {
        const d = r.data?.data ?? {};
        setRows(d.eventos ?? []);
        setPage(d.page    ?? 1);
        setPages(d.pages  ?? 1);
      })
      .catch(e => setError(getApiError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="adm-section fade-up">
      <h2 className="adm-section-title">Registro de auditoría</h2>
      {error && <div className="adm-error">{error}</div>}
      {loading ? <div className="adm-loading"><span className="adm-spinner" />Cargando…</div> : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Tabla</th><th>Valor anterior</th><th>Valor nuevo</th><th>IP</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sin registros</td></tr>
                )}
                {rows.map(e => (
                  <tr key={e.id_evento}>
                    <td>{fmt(e.timestamp)}</td>
                    <td>{e.usuario?.nombre ?? 'Sistema'}</td>
                    <td><span className="adm-chip adm-chip--action">{e.accion}</span></td>
                    <td>{e.tabla_afectada ?? '—'}</td>
                    <td><code className="adm-code">{e.valor_anterior ?? '—'}</code></td>
                    <td><code className="adm-code">{e.valor_nuevo ?? '—'}</code></td>
                    <td>{e.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="adm-pagination">
            <button disabled={page <= 1}     onClick={() => load(page - 1)} className="btn-secondary">← Anterior</button>
            <span>Página {page} de {pages}</span>
            <button disabled={page >= pages} onClick={() => load(page + 1)} className="btn-secondary">Siguiente →</button>
          </div>
        </>
      )}
    </div>
  );
}

function Consultas() {
  const [rows, setRows]         = useState([]);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [filtro, setFiltro]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState(null);

  const load = (p = 1, est = filtro) => {
    setLoading(true);
    api.get('/admin/consultas', { params: { page: p, estado: est } })
      .then(r => {
        const d = r.data?.data ?? {};
        setRows(d.consultas ?? []);
        setTotal(d.total    ?? 0);
        setPage(d.page      ?? 1);
        setPages(d.pages    ?? 1);
      })
      .catch(e => setError(getApiError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="adm-section fade-up">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Consultas <span className="adm-badge">{total}</span></h2>
        <div className="adm-filter-row">
          <select value={filtro} onChange={e => { setFiltro(e.target.value); load(1, e.target.value); }} className="adm-select">
            <option value="">Todas</option>
            <option value="abierta">Abiertas</option>
            <option value="cerrada">Cerradas</option>
          </select>
        </div>
      </div>
      {error && <div className="adm-error">{error}</div>}
      {loading ? <div className="adm-loading"><span className="adm-spinner" />Cargando…</div> : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>ID</th><th>Usuario</th><th>Asunto</th><th>Estado</th><th>Fecha</th><th>Ver</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sin consultas</td></tr>
                )}
                {rows.map(c => (
                  <tr key={c.id_consulta}>
                    <td>{c.id_consulta}</td>
                    <td>{c.usuario?.nombre ?? '—'}</td>
                    <td className="adm-td-truncate">{c.asunto}</td>
                    <td><span className={`adm-status adm-status--${c.estado === 'abierta' ? 'activo' : 'inactivo'}`}>{c.estado}</span></td>
                    <td>{fmt(c.fecha_creacion)}</td>
                    <td><button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => setSelected(c)}>Ver</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="adm-pagination">
            <button disabled={page <= 1}     onClick={() => load(page - 1)} className="btn-secondary">← Anterior</button>
            <span>Página {page} de {pages}</span>
            <button disabled={page >= pages} onClick={() => load(page + 1)} className="btn-secondary">Siguiente →</button>
          </div>
        </>
      )}

      {selected && (
        <div className="adm-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>{selected.asunto}</h3>
              <button className="adm-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <p className="adm-modal-meta">{selected.usuario?.nombre} · {fmt(selected.fecha_creacion)}</p>
            <div className="adm-modal-block">
              <strong>Mensaje del usuario</strong>
              <p>{selected.mensaje}</p>
            </div>
            {selected.respuesta_ia && (
              <div className="adm-modal-block adm-modal-block--ia">
                <strong>Respuesta de la IA</strong>
                <p>{selected.respuesta_ia}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PanelAgente() {
  const [src, setSrc]     = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchToken = useCallback(() => {
    setLoading(true);
    setError('');
    setSrc(null);

    api.get('/auth/token')
      .then(r => {
        const token = r.data?.token;
        // Solo establecer src si el token es válido y no vacío
        if (token && typeof token === 'string' && token.trim() !== '') {
          setSrc(`${AGENT_PANEL}?token=${token}`);
        } else {
          setError('No se pudo obtener el token de sesión.');
        }
      })
      .catch(() => {
        setError('No se pudo obtener el token de sesión.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return (
    <div className="adm-section adm-section--iframe fade-up">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Panel del Agente ALEX</h2>
        {src && (
          <a href={src} target="_blank" rel="noreferrer" className="btn-secondary">
            Abrir en ventana nueva
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 5 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
      {error && (
        <div>
          <div className="adm-error">{error}</div>
          <button onClick={fetchToken} className="btn-primary" style={{ marginTop: 10 }}>
            Reintentar
          </button>
        </div>
      )}
      {!error && loading && <div className="adm-loading"><span className="adm-spinner" />Conectando con el agente…</div>}
      {src && <iframe src={src} className="adm-agent-iframe" title="ALEX Agent Admin" />}
    </div>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sections = {
    dashboard: <Dashboard />,
    usuarios:  <Usuarios />,
    sesiones:  <Sesiones />,
    auditoria: <Auditoria />,
    consultas: <Consultas />,
    agente:    <PanelAgente />,
  };

  return (
    <div className="adm-root">
      <nav className={`adm-sidebar${sidebarOpen ? ' adm-sidebar--open' : ''}`}>
        <button className="adm-sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Expandir sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="adm-sidebar-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          {sidebarOpen && <span>Administración</span>}
        </div>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`adm-sidebar-item${activeTab === t.id ? ' adm-sidebar-item--active' : ''}`}
            onClick={() => { setActiveTab(t.id); if (window.innerWidth < 640) setSidebarOpen(false); }}
          >
            <Icon d={t.d} size={18} />
            {sidebarOpen && <span className="adm-sidebar-label">{t.label}</span>}
          </button>
        ))}
      </nav>

      <main className="adm-main">
        <div className="adm-topbar">
          <span className="adm-topbar-title">
            {TABS.find(t => t.id === activeTab)?.label}
          </span>
        </div>
        <div className="adm-content">
          {sections[activeTab]}
        </div>
      </main>
    </div>
  );
}
