# Fase 3 — Pantallas Secundarias y Pulido Visual

## Resumen

La Fase 3 completa la implementación visual del proyecto ALEX abordando las pantallas restantes — Login, Registro, Configuración y Perfil — y aplicando el pulido final de interacciones: micro-animaciones, transiciones, accesibilidad y QA visual completo. Al finalizar esta fase, toda la interfaz debe estar alineada con los mockups aprobados, funcionando correctamente en desktop y mobile.

**Rama de trabajo:** `john-frontendv2`  
**Prerequisito:** Fases 1 y 2 completadas y validadas  
**Stack:** CSS puro

---

## Objetivos de la Fase

- Implementar visualmente la pantalla de **Login / Registro**
- Implementar visualmente las pantallas de **Configuración** y **Perfil de Usuario**
- Agregar **transiciones y micro-animaciones** en hover, focus y estados de carga
- Realizar **QA visual completo** en desktop (1280px+) y mobile (375px)
- Cerrar todos los tickets de frontend pendientes en Jira

---

## Entregables

| Entregable | Archivo | Descripción |
|---|---|---|
| Login / Registro | `src/styles/auth.css` | Pantalla de autenticación |
| Configuración | `src/styles/settings.css` | Panel de ajustes |
| Perfil de Usuario | `src/styles/profile.css` | Vista de perfil |
| Micro-animaciones | `src/styles/animations.css` | Keyframes y transiciones globales |
| QA Report | Ticket Jira | Reporte de validación visual final |

---

## Login / Registro

```css
.auth-page {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--bg);
}

@media (max-width: 768px) {
  .auth-page { grid-template-columns: 1fr; }
  .auth-illustration { display: none; }
}

.auth-illustration {
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-strong) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  color: var(--text-inverse);
}

.auth-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);
}

.auth-form-card {
  width: 100%;
  max-width: 420px;
}

.auth-logo {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--brand);
  margin-bottom: var(--space-8);
  text-align: center;
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text);
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.form-input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
}

.btn-primary {
  width: 100%;
  padding: var(--space-3) var(--space-6);
  background: var(--brand);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-primary:hover {
  background: var(--brand-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

---

## Micro-animaciones

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.message        { animation: fade-in-up 200ms var(--transition) both; }
.content-card   { animation: fade-in-up 250ms var(--transition) both; }
.auth-form-card { animation: fade-in-up 300ms var(--transition) both; }

/* Typing indicator */
@keyframes typing-dot {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
  40%           { transform: scale(1);   opacity: 1; }
}

.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--text-muted);
  animation: typing-dot 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Checklist de Validación — Fase 3

- [ ] Login / Registro alineado al mockup
- [ ] Configuración alineada al mockup
- [ ] Perfil de usuario alineado al mockup
- [ ] Micro-animaciones implementadas
- [ ] Indicador de escritura (typing dots) en chat
- [ ] QA desktop completo: todas las pantallas validadas
- [ ] QA mobile completo: todas las pantallas a 375px
- [ ] Accesibilidad básica verificada (WCAG AA, navegación por teclado)
- [ ] Todos los tickets de frontend en Jira cerrados
- [ ] Sin colores hardcodeados fuera de `design-tokens.css`
