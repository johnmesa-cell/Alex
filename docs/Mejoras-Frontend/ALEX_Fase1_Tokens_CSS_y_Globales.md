# Fase 1 — Tokenización CSS y Ajustes Visuales Globales

## Resumen

La Fase 1 establece los cimientos del sistema de diseño del proyecto ALEX en CSS puro, sin ninguna migración de framework. El objetivo es crear las variables CSS globales que reflejan fielmente el sistema de diseño de los mockups y aplicar los primeros ajustes visuales en los componentes compartidos (topbar, sidebar, fondo global), de modo que todas las pantallas futuras hereden automáticamente el lenguaje visual correcto.

**Rama de trabajo:** `john-frontendv2`  
**Stack:** CSS puro (sin Tailwind, Bootstrap ni otro framework)  
**Referencia visual principal:** `docs/mockup/Mockup-06-Chat-Usuario.html` y demás mockups de la carpeta

---

## Objetivos de la Fase

- Centralizar todos los tokens de diseño (colores, tipografías, espaciados, radios, sombras) en un único archivo CSS
- Integrar las tipografías `Fraunces` y `Space Grotesk` desde Google Fonts
- Actualizar el fondo global al gradiente radial definido en los mockups
- Ajustar visualmente el **Topbar** para que coincida con el mockup
- Ajustar visualmente el **Sidebar** con comportamiento colapsable (72px → 330px)
- No tocar lógica de negocio, APIs ni estructura de componentes funcionales

---

## Entregables

| Entregable | Archivo | Descripción |
|---|---|---|
| Tokens CSS | `src/styles/design-tokens.css` | Variables globales de diseño |
| Tipografías | `index.html` o layout principal | Import de Google Fonts |
| Fondo global | `src/styles/global.css` | Gradiente radial en `body` |
| Topbar actualizado | `src/styles/topbar.css` | Estilos alineados al mockup |
| Sidebar colapsable | `src/styles/sidebar.css` | Estados 72px y 330px |

> Los nombres de archivos se ajustarán según la estructura real del proyecto en `john-frontendv2`.

---

## Sistema de Tokens CSS

El siguiente bloque debe existir en `design-tokens.css` y ser importado como primer stylesheet en el proyecto:

```css
/* =============================================
   ALEX Design Tokens — Fase 1
   Fuente de verdad: docs/mockup/
   ============================================= */

:root {
  /* Colores de marca */
  --brand:          #0f766e;
  --brand-strong:   #115e59;
  --brand-light:    #e6f4f2;
  --accent:         #ff7f50;
  --accent-hover:   #e06540;

  /* Texto */
  --text:           #17332c;
  --text-muted:     #4a6158;
  --text-faint:     #8aafa6;
  --text-inverse:   #ffffff;

  /* Superficies */
  --bg:             #f8fcfa;
  --bg-alt:         #edf5f2;
  --card:           #ffffff;
  --border:         #cee3db;
  --border-strong:  #9dcfc5;
  --divider:        #e2eeeb;

  /* Tipografías */
  --font-display:   'Fraunces', Georgia, serif;
  --font-body:      'Space Grotesk', 'Helvetica Neue', sans-serif;

  /* Escala tipográfica fluida */
  --text-xs:   clamp(0.75rem,  0.7rem  + 0.25vw, 0.875rem);
  --text-sm:   clamp(0.875rem, 0.8rem  + 0.35vw, 1rem);
  --text-base: clamp(1rem,     0.95rem + 0.25vw, 1.125rem);
  --text-lg:   clamp(1.125rem, 1rem    + 0.75vw, 1.5rem);
  --text-xl:   clamp(1.5rem,   1.2rem  + 1.25vw, 2.25rem);

  /* Espaciado (base 4px) */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-5:  1.25rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Border radius */
  --radius-sm:   0.375rem;
  --radius-md:   0.5rem;
  --radius-lg:   0.75rem;
  --radius-xl:   1rem;
  --radius-2xl:  1.5rem;
  --radius-full: 9999px;

  /* Sombras */
  --shadow-sm: 0 1px 3px rgba(15, 118, 110, 0.08);
  --shadow-md: 0 4px 12px rgba(15, 118, 110, 0.10);
  --shadow-lg: 0 12px 32px rgba(15, 118, 110, 0.14);

  /* Transiciones */
  --transition: 180ms cubic-bezier(0.16, 1, 0.3, 1);

  /* Layout */
  --sidebar-collapsed: 72px;
  --sidebar-expanded:  330px;
  --topbar-height:     64px;
  --content-max:       960px;
}
```

---

## Integración de Tipografías

Agregar en el `<head>` del layout principal (antes de cualquier stylesheet):

```html
<!-- Google Fonts: Fraunces (display) + Space Grotesk (body) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">
```

Y en el CSS base:
```css
body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text);
  background: radial-gradient(ellipse at 60% 20%, #d6f5ef 0%, var(--bg) 40%),
              radial-gradient(ellipse at 20% 80%, #ffe5dc 0%, var(--bg-alt) 50%);
  background-attachment: fixed;
  min-height: 100dvh;
}

.brand-name, .logo-text {
  font-family: var(--font-display);
}
```

---

## Topbar

Especificaciones visuales según mockup:

```css
.topbar {
  height: var(--topbar-height);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: var(--space-6);
  position: sticky;
  top: 0;
  z-index: 100;
}

.topbar-nav {
  display: flex;
  gap: var(--space-1);
  background: var(--brand-light);
  padding: var(--space-1);
  border-radius: var(--radius-full);
}

.topbar-nav a {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: all var(--transition);
}

.topbar-nav a.active,
.topbar-nav a:hover {
  background: var(--brand);
  color: var(--text-inverse);
}

.user-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  transition: all var(--transition);
}

.user-pill:hover {
  border-color: var(--brand);
  box-shadow: var(--shadow-sm);
}
```

---

## Sidebar Colapsable

```css
.sidebar {
  width: var(--sidebar-collapsed);
  height: calc(100dvh - var(--topbar-height));
  background: var(--card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-4) 0;
  position: sticky;
  top: var(--topbar-height);
  transition: width var(--transition);
  overflow: hidden;
}

.sidebar.expanded {
  width: var(--sidebar-expanded);
  align-items: flex-start;
  padding: var(--space-4);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  width: 100%;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition);
  white-space: nowrap;
}

.sidebar-item:hover,
.sidebar-item.active {
  background: var(--brand-light);
  color: var(--brand);
}

.sidebar-item .label {
  opacity: 0;
  transition: opacity var(--transition);
}

.sidebar.expanded .sidebar-item .label {
  opacity: 1;
}
```

---

## Checklist de Validación — Fase 1

- [ ] `design-tokens.css` creado e importado globalmente
- [ ] `Fraunces` y `Space Grotesk` cargando correctamente en el navegador
- [ ] Fondo del body con el gradiente radial de los mockups
- [ ] Topbar visualmente igual al mockup (logo, nav pills, user pill)
- [ ] Sidebar colapsa y expande correctamente (72px ↔ 330px)
- [ ] Ningún color hardcodeado fuera de `design-tokens.css`
- [ ] Revisión visual en desktop (1280px) y mobile (375px)
- [ ] Ticket(s) correspondientes en Jira actualizados a "Done"

---

## Tickets Jira Relacionados

Revisar el board [ALEX - Sprint activo](https://megiddo20.atlassian.net/jira/software/c/projects/ALEX/boards/34) y mapear los tickets de tipo frontend al alcance de esta fase. Si no existen tickets para algún entregable, crearlos antes de comenzar la implementación.
