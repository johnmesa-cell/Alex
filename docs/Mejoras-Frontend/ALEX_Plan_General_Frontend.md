# Plan de Mejoras Frontend — Proyecto ALEX

## Resumen Ejecutivo

Este documento consolida el plan completo de mejoras del frontend del proyecto ALEX, con el objetivo de alinear la interfaz funcional actual con los mockups de diseño ya definidos en HTML. Las mejoras se ejecutarán en la rama `john-frontendv2` del repositorio [https://github.com/johnmesa-cell/Alex.git](https://github.com/johnmesa-cell/Alex.git) y se organizan en fases progresivas, priorizando la fidelidad visual con los mockups sin alterar la lógica funcional existente.

**Corrección clave de alcance:** En la Fase 1 no se realizará ninguna migración de framework. Todo el trabajo de estilos se realizará en **CSS puro**, respetando la arquitectura actual del proyecto.

---

## Sistema de Diseño (Extraído de los Mockups)

### Paleta de Colores

| Variable | Valor Hex | Uso |
|---|---|---|
| `--brand` | `#0f766e` | Color principal (teal) |
| `--brand-strong` | `#115e59` | Hover / énfasis |
| `--accent` | `#ff7f50` | Acento coral/naranja |
| `--text` | `#17332c` | Texto principal |
| `--muted` | `#4a6158` | Texto secundario |
| `--border` | `#cee3db` | Bordes sutiles |
| `--card` | `#ffffff` | Fondos de tarjetas |
| `--bg` | `#f8fcfa → #edf5f2` | Fondo general (gradiente radial) |

### Tipografía

| Rol | Familia | Uso |
|---|---|---|
| Display / Logo | `Fraunces` (serif) | Nombre de marca, títulos principales |
| Body / UI | `Space Grotesk` (sans-serif) | Todo el texto de interfaz |

### Componentes Base Definidos en Mockups

- **Topbar:** Logo + navegación central en pills redondeadas + user pill derecha
- **Sidebar colapsable:** 72px (iconos) → 330px (panel completo con drawer)
- **Área de chat:** Burbuja de mensajes con separación por rol (usuario / asistente)
- **Cards:** Fondo blanco, sombra suave, borde `--border`, radio `12px`
- **Botones:** Primario teal sólido, secundario ghost, acento coral para acciones destacadas
- **Inputs:** Borde `--border`, focus ring teal, sin outline default del navegador

---

## Pantallas a Implementar

Basado en los mockups disponibles en `docs/mockup/`:

| # | Pantalla | Mockup de Referencia |
|---|---|---|
| 1 | Login / Registro | `Mockup-01-Login.html` |
| 2 | Dashboard Principal | `Mockup-02-Dashboard.html` |
| 3 | Vista de Chat con Usuario | `Mockup-06-Chat-Usuario.html` |
| 4 | Panel de Configuración | `Mockup-XX-Config.html` |
| 5 | Perfil de Usuario | `Mockup-XX-Perfil.html` |

> Los números exactos se confirmarán al listar todos los archivos de `docs/mockup/` en el repositorio.

---

## Fases del Proyecto

### Fase 1 — Tokenización CSS y Ajustes Visuales Globales
**Stack:** CSS puro (sin migración)
**Objetivo:** Establecer el sistema de diseño como variables CSS globales y aplicar los primeros ajustes visuales en las pantallas existentes.
**Entregables:**
- Archivo `design-tokens.css` con todas las variables del sistema de diseño
- Tipografías `Fraunces` y `Space Grotesk` integradas vía Google Fonts
- Fondo global actualizado al gradiente de los mockups
- Topbar y navegación alineada visualmente con el mockup
- Sidebar con comportamiento colapsable (72px / 330px)

**Restricción:** No se realizará ninguna migración a Tailwind, Bootstrap ni otro framework CSS.

---

### Fase 2 — Pantallas Principales (Chat + Dashboard)
**Stack:** CSS puro + ajustes JS mínimos si son necesarios
**Objetivo:** Alinear visualmente las pantallas de mayor uso con los mockups aprobados.
**Entregables:**
- Vista de Chat completamente alineada al mockup
- Dashboard con layout de tarjetas y KPIs según mockup
- Estados vacíos y de carga diseñados (skeleton loaders)
- Responsive básico funcional en mobile (375px)

---

### Fase 3 — Pantallas Secundarias y Pulido
**Stack:** CSS puro
**Objetivo:** Completar todas las pantallas restantes y pulir detalles de interacción.
**Entregables:**
- Login / Registro alineados al mockup
- Pantallas de Configuración y Perfil implementadas
- Transiciones y micro-animaciones en hover/focus
- Dark mode si está contemplado en los mockups
- QA visual final: desktop (1280px+) y mobile (375px)

---

### Fase 4 — Integración con Backlog de Jira
**Objetivo:** Verificar que cada tarea del board [ALEX en Jira](https://megiddo20.atlassian.net/jira/software/c/projects/ALEX/boards/34) relacionada con frontend esté reflejada en los cambios implementados y actualizar los estados correspondientes.
**Entregables:**
- Revisión del board ALEX y mapeo de tickets vs. cambios realizados
- Actualización de estados en Jira (In Progress → Done) por cada mejora completada
- Documentación de deuda técnica identificada durante la implementación

---

## Alineación con Jira — Board ALEX

El board del proyecto está disponible en:
[https://megiddo20.atlassian.net/jira/software/c/projects/ALEX/boards/34](https://megiddo20.atlassian.net/jira/software/c/projects/ALEX/boards/34)

Cada mejora de frontend implementada en `john-frontendv2` debe tener un ticket correspondiente en Jira. En caso de no existir, se creará el ticket antes de iniciar la implementación para mantener la trazabilidad completa del trabajo.

---

## Reglas de Trabajo

- Toda implementación se realiza en la rama `john-frontendv2`
- Los mockups HTML en `docs/mockup/` son la **fuente de verdad visual**
- No se modifica lógica de negocio ni endpoints — solo capa de presentación
- Cada pantalla se valida visualmente antes de pasar a la siguiente
- Los tokens CSS deben ser la única fuente de colores, tipografías y espaciados
