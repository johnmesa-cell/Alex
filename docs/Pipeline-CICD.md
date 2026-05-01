# 🚀 Pipeline de CI/CD — Proyecto ALEX

## ¿Qué es este pipeline?

Este documento describe el pipeline de Integración y Entrega Continua (CI/CD)
implementado con **GitLab CI/CD** para el proyecto ALEX. Su objetivo es
automatizar la construcción, validación y despliegue de la aplicación cada vez
que se realiza un cambio en el repositorio, eliminando procesos manuales y
reduciendo el riesgo de errores humanos.

---

## Flujo completo del pipeline

Cada `git push` a la rama `main` desencadena automáticamente la siguiente cadena:

```
Desarrollador
     │
     ▼
git push → GitHub (repositorio principal)
     │
     ▼
GitHub Action "Sync to GitLab" (copia el código automáticamente)
     │
     ▼
GitLab detecta cambios y lanza el pipeline
     │
     ├── Stage 1: BUILD
     │     ├── build_backend  (instala dependencias Node.js)
     │     └── build_frontend (instala dependencias y genera dist/ con Vite)
     │
     ├── Stage 2: TEST
     │     ├── test_backend   (ejecuta pruebas del backend)
     │     └── test_frontend  (ejecuta pruebas del frontend)
     │
     └── Stage 3: DEPLOY
           └── deploy (actualiza el servidor Oracle Cloud vía SSH)
```

---

## Descripción de cada stage

### Stage 1 — Build

El stage de build se encarga de instalar todas las dependencias y compilar
el frontend para producción. Corre dos jobs en paralelo:

**`build_backend`**
- Usa la imagen Docker `node:18-alpine`.
- Entra a la carpeta `backend/` y ejecuta `npm install`.
- Guarda `node_modules/` como artifact para el stage de test.

**`build_frontend`**
- Usa la imagen Docker `node:18-alpine`.
- Entra a la carpeta `frontend/` y ejecuta `npm install` y `npm run build`.
- Vite genera los archivos de producción en `frontend/dist/`.
- Guarda `dist/` como artifact para etapas posteriores.

---

### Stage 2 — Test

El stage de test valida que el código funcione correctamente antes de
desplegarlo. También corre dos jobs en paralelo:

**`test_backend`**
- Ejecuta `npm test` dentro de `backend/`.
- Tiene `allow_failure: true`: si falla, reporta el error pero no bloquea el deploy.

**`test_frontend`**
- Ejecuta `npm test` dentro de `frontend/`.
- Igual que el backend, usa `allow_failure: true`.

> **¿Por qué `allow_failure`?** Permite que el pipeline siga funcionando
> mientras las pruebas se desarrollan progresivamente, sin bloquear el
> despliegue en producción.

---

### Stage 3 — Deploy

El stage de deploy actualiza automáticamente el servidor de producción.

**`deploy`**
- Solo se ejecuta en la rama `main` (`only: - main`).
- Usa la imagen `alpine:latest` con el cliente SSH instalado.
- Se conecta al servidor Oracle Cloud mediante SSH usando variables protegidas.
- Ejecuta en el servidor:
  ```bash
  git fetch origin
  git reset --hard origin/main
  ```
  Esto garantiza que el servidor quede idéntico al estado más reciente de `main`.

---

## Cómo se activa el pipeline

El pipeline se dispara **automáticamente** sin ninguna acción manual adicional:

1. El desarrollador hace `git push origin main` desde su máquina local.
2. GitHub recibe el push y ejecuta la **GitHub Action** `Sync to GitLab`.
3. La Action hace push del código a GitLab usando un token de acceso seguro.
4. GitLab detecta el nuevo commit y lanza el pipeline inmediatamente.
5. Los resultados (éxito o fallo) quedan visibles en **CI/CD → Pipelines** en GitLab.

---

## Variables de entorno protegidas

Todas las credenciales están configuradas como **variables protegidas** en
GitLab (*Settings → CI/CD → Variables*), nunca hardcodeadas en el código:

| Variable | Descripción | Protegida |
|---|---|---|
| `$SSH_PRIVATE_KEY` | Clave privada SSH para conectarse al servidor Oracle | ✅ Sí |
| `$SERVER_IP` | Dirección IP pública del servidor de producción | ✅ Sí |
| `$SERVER_USER` | Usuario del servidor (ubuntu) | ✅ Sí |

---

## Tecnologías involucradas

| Componente | Tecnología |
|---|---|
| Repositorio principal | GitHub |
| Repositorio CI/CD | GitLab |
| Sincronización GitHub → GitLab | GitHub Actions |
| Pipeline CI/CD | GitLab CI/CD |
| Contenedores del pipeline | Docker (alpine, node:18) |
| Servidor de producción | Oracle Cloud (Ubuntu) |
| Backend | Node.js + Express |
| Frontend | React + Vite |

---

## Archivos clave del pipeline

| Archivo | Ubicación | Descripción |
|---|---|---|
| `.gitlab-ci.yml` | Raíz del proyecto | Define todos los stages, jobs y variables |
| `sync-to-gitlab.yml` | `.github/workflows/` | GitHub Action que sincroniza con GitLab |
| `package.json` | `backend/` y `frontend/` | Define el script `test` ejecutado en CI |
