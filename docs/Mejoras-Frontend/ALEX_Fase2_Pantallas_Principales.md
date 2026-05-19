# Fase 2 — Pantallas Principales: Chat y Dashboard

## Resumen

Con el sistema de tokens CSS establecido en la Fase 1, la Fase 2 se enfoca en alinear visualmente las pantallas de mayor uso del proyecto ALEX — **Chat** y **Dashboard** — con sus respectivos mockups aprobados. El trabajo es exclusivamente de capa de presentación: se aplican los tokens ya definidos para construir los componentes visuales de cada pantalla sin alterar lógica de negocio ni endpoints.

**Rama de trabajo:** `john-frontendv2`  
**Prerequisito:** Fase 1 completada y validada  
**Stack:** CSS puro

---

## Objetivos de la Fase

- Alinear la vista de **Chat con Usuario** al mockup `Mockup-06-Chat-Usuario.html`
- Alinear el **Dashboard principal** al mockup correspondiente
- Diseñar los **estados vacíos** y **skeleton loaders** de ambas pantallas
- Garantizar que ambas vistas funcionen correctamente en **mobile (375px)**

---

## Entregables

| Entregable | Archivo | Descripción |
|---|---|---|
| Estilos de Chat | `src/styles/chat.css` | Burbujas, área de input, scroll |
| Estilos de Dashboard | `src/styles/dashboard.css` | Cards, KPIs, layout de grilla |
| Skeleton loaders | `src/styles/skeletons.css` | Estados de carga |
| Estados vacíos | `src/styles/empty-states.css` | Pantallas sin contenido |

---

## Vista de Chat

### Layout General

```css
.chat-layout {
  display: grid;
  grid-template-columns: var(--sidebar-collapsed) 1fr;
  grid-template-rows: var(--topbar-height) 1fr;
  height: 100dvh;
  transition: grid-template-columns var(--transition);
}

.chat-layout.sidebar-expanded {
  grid-template-columns: var(--sidebar-expanded) 1fr;
}

.chat-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

### Área de Mensajes

```css
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  scroll-behavior: smooth;
}

.message {
  display: flex;
  gap: var(--space-3);
  max-width: 72ch;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-bubble {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-xl);
  font-size: var(--text-base);
  line-height: 1.6;
  box-shadow: var(--shadow-sm);
}

.message.assistant .message-bubble {
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--text);
  border-top-left-radius: var(--radius-sm);
}

.message.user .message-bubble {
  background: var(--brand);
  color: var(--text-inverse);
  border-top-right-radius: var(--radius-sm);
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  background: var(--brand-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--brand);
}

.message.user .message-avatar {
  background: var(--brand);
  color: var(--text-inverse);
}
```

### Input de Mensaje

```css
.chat-input-area {
  padding: var(--space-4) var(--space-8);
  border-top: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
}

.chat-input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  padding: var(--space-3) var(--space-4);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.chat-input-wrapper:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text);
  resize: none;
  max-height: 160px;
  line-height: 1.5;
}

.chat-input::placeholder {
  color: var(--text-faint);
}

.btn-send {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--brand);
  color: var(--text-inverse);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition);
  flex-shrink: 0;
}

.btn-send:hover {
  background: var(--brand-strong);
  transform: scale(1.05);
}

.btn-send:disabled {
  background: var(--border);
  cursor: not-allowed;
  transform: none;
}
```

---

## Dashboard Principal

### Grid de KPIs

```css
.dashboard-layout {
  padding: var(--space-8);
  max-width: var(--content-max);
  margin-inline: auto;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.kpi-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5) var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition);
}

.kpi-card:hover {
  box-shadow: var(--shadow-md);
}

.kpi-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: var(--space-2);
}

.kpi-value {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.kpi-delta.positive { color: #2d7a3a; }
.kpi-delta.negative { color: #a12c2c; }
```

---

## Skeleton Loaders

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--border) 25%,
    var(--divider) 50%,
    var(--border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton-text      { height: 1em;   margin-bottom: var(--space-2); }
.skeleton-heading   { height: 1.4em; width: 40%; margin-bottom: var(--space-4); }
.skeleton-avatar    { width: 36px; height: 36px; border-radius: var(--radius-full); }
.skeleton-card      { height: 120px; border-radius: var(--radius-xl); }
.skeleton-kpi       { height: 90px;  border-radius: var(--radius-xl); }

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; background: var(--border); }
}
```

---

## Responsive — Mobile (375px)

```css
@media (max-width: 640px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .messages-area {
    padding: var(--space-4);
  }

  .chat-input-area {
    padding: var(--space-3) var(--space-4);
  }

  .message {
    max-width: 90%;
  }

  .dashboard-layout {
    padding: var(--space-4);
  }

  .kpi-grid {
    grid-template-columns: 1fr 1fr;
  }
}
```

---

## Checklist de Validación — Fase 2

- [ ] Vista de Chat visualmente igual al mockup `Mockup-06-Chat-Usuario.html`
- [ ] Burbujas de usuario y asistente con estilos diferenciados correctamente
- [ ] Input de chat con focus ring teal y botón de envío funcional
- [ ] Dashboard con KPI cards alineadas al mockup
- [ ] Skeleton loaders visibles durante estados de carga
- [ ] Estados vacíos implementados en Chat y Dashboard
- [ ] Vista de Chat funcional en mobile (375px) sin overflow
- [ ] Dashboard responsive en mobile (columnas colapsadas)
- [ ] Tickets Jira correspondientes actualizados a "Done"
