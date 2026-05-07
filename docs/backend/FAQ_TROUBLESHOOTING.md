# ❓ PREGUNTAS FRECUENTES - Sistema de Autenticación ALEX

## 1️⃣ Instalación y Configuración

### P: ¿Qué versión de Node.js necesito?
**R:** Mínimo Node.js 14, recomendado 18 o superior.
```bash
node --version  # Verificar tu versión
```

---

### P: Recibo error "Cannot find module bcryptjs"
**R:** Necesitas instalar las dependencias:
```bash
cd backend
npm install bcryptjs jsonwebtoken
```
Verifica que el archivo `package.json` tenga estas dependencies.

---

### P: ¿Dónde pongo el JWT_SECRET?
**R:** En el archivo `.env` en la raíz del proyecto backend:
```env
JWT_SECRET="una_clave_super_secreta_y_larga_2026"
```

Para desarrollo está OK usar la que viene, pero en PRODUCCIÓN cámbiala por algo más seguro:
```bash
# Generar secret seguro en terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### P: Mi base de datos está en otro puerto diferente a 5433
**R:** Actualiza `DATABASE_URL` en `.env`:
```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:PUERTO/nombrebd?schema=public"
```

---

## 2️⃣ Uso de la API

### P: ¿Cómo registro un usuario?
**R:** Con una petición POST:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "correo": "juan@example.com",
    "password": "Segura123"
  }'
```

---

### P: ¿La contraseña se guarda en texto plano?
**R:** NO. Se cifra con bcrypt (10 rounds). Se guarda como `passwordhash` en la BD.

---

### P: ¿Cuánto tiempo dura el token JWT?
**R:** 24 horas. Puedes cambiar esto en `auth.controller.js`:
```javascript
const JWT_EXPIRY = '24h';  // Cambiar aquí
// Opciones: '1h', '7d', '30d', etc.
```

---

### P: ¿Cómo uso el token en mis rutas?
**R:** En el header Authorization con formato Bearer:
```bash
curl -X GET http://localhost:3000/api/mi-ruta \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

En código (Fetch API):
```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

fetch('http://localhost:3000/api/mi-ruta', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## 3️⃣ Proteger Rutas

### P: ¿Cómo protejo mis rutas con autenticación?
**R:** Usa el middleware `verifyToken`:
```javascript
import authMiddleware from '../middlewares/auth.middleware.js';

router.get('/datos-privados',
  authMiddleware.verifyToken,  // ← Esto protege la ruta
  (req, res) => {
    console.log(req.usuario);  // Aquí tienes los datos del usuario
    res.json({ message: 'Datos privados' });
  }
);
```

---

### P: ¿Cómo restricciono una ruta solo para admin?
**R:** Usa el middleware `verifyRole`:
```javascript
router.delete('/eliminar-todo',
  authMiddleware.verifyToken,
  authMiddleware.verifyRole(['admin']),  // ← Solo admin
  (req, res) => {
    res.json({ message: 'Eliminado' });
  }
);
```

---

### P: ¿Puedo permitir múltiples roles en una ruta?
**R:** Sí, pasa un array:
```javascript
router.post('/crear-contenido',
  authMiddleware.verifyToken,
  authMiddleware.verifyRole(['admin', 'moderador', 'editor']),
  (req, res) => {
    res.json({ message: 'Contenido creado' });
  }
);
```

---

### P: ¿Cómo accedo a la información del usuario en mi ruta?
**R:** Usa `req.usuario`:
```javascript
router.get('/mi-perfil', authMiddleware.verifyToken, (req, res) => {
  const { idusuario, correo, nombre, idrol, nombrerol } = req.usuario;
  
  res.json({
    message: `Hola ${nombre}, tu ID es ${idusuario}`,
    usuario: req.usuario
  });
});
```

---

## 4️⃣ Errores Comunes

### P: Recibo 401 "Token not provided"
**R:** El header Authorization está faltando o mal formateado.

✅ Correcto:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

❌ Incorrecto:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Bearer token_incorrecto
```

---

### P: Recibo 401 "Token inválido"
**R:** El token no puede ser decodificado. Posibles causas:

1. Token corrompido
2. JWT_SECRET diferente en servidor
3. Token expirado (verifica la fecha)
4. Cambios en el código

**Solución:** Haz login nuevamente para obtener un token válido:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "tu@email.com",
    "password": "tuPassword"
  }'
```

---

### P: Recibo 401 "Token expirado"
**R:** El token tiene más de 24 horas. Necesitas hacer login nuevamente.

Para desarrollo, puedes cambiar la expiración en `auth.controller.js`:
```javascript
const JWT_EXPIRY = '7d';  // Cambiar a 7 días
```

---

### P: Recibo 403 "No tienes permisos"
**R:** Tu rol no está autorizado para esa ruta.

Verifica:</S>
1. Qué regla de rol tiene la ruta
2. Qué rol tienes tú (mira el token)
3. Pide a un admin que te cambie el rol

---

### P: Recibo 409 "El correo ya está registrado"
**R:** Ese email ya existe en la BD. Usa otro:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Otro User",
    "correo": "otro@ejemplo.com",
    "password": "Pass123"
  }'
```

---

### P: Recibo 400 "El formato del correo es inválido"
**R:** El email que enviaste no tiene un formato válido.

❌ Inválidos:
- `usuario@` (falta dominio)
- `usuario.com` (falta @)
- `@dominio.com` (falta usuario)

✅ Válidos:
- `usuario@dominio.com`
- `usuario+tag@dominio.co.uk`
- `usuario123@subdominio.dominio.com`

---

### P: Recibo 500 "Error interno del servidor"
**R:** Hay un error en el servidor. Verifica:

1. ¿PostgreSQL está corriendo?
```bash
docker-compose ps  # Verificar
docker-compose up -d  # Iniciar si no está
```

2. ¿DATABASE_URL es correcta?
```bash
# Prueba la conexión manualmente
psql "postgresql://usuario:contraseña@localhost:5433/nombrebd"
```

3. Mira los logs del servidor:
```
Node console output → busca mensajes de error
```

---

## 5️⃣ Seguridad

### P: ¿Mi JWT_SECRET está seguro?
**R:** NO si usas el por defecto. Para PRODUCCIÓN, cambia a algo difícil:

```bash
# Generar secret seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Resultado:
```env
JWT_SECRET="a3f5c7b9d2e4f6a8b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2"
```

---

### P: ¿El token se puede robar?
**R:** Sí. Por eso:

1. **Usa HTTPS en producción** (no HTTP)
2. **Guarda el token en localStorage** (NO en cookies sin httpOnly)
3. **Implementa expiración corta** (24h está OK)
4. **Usa Refresh Tokens** para renovación segura
5. **Invalida tokens en logout**

---

### P: ¿Cómo protejo contra ataques de fuerza bruta?
**R:** Implementa Rate Limiting:

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,  // Máximo 5 intentos
  message: 'Demasiados intentos, intenta más tarde'
});

router.post('/login', loginLimiter, authController.login);
```

---

## 6️⃣ Testing

### P: ¿Cómo pruebo los endpoints?
**R:** Usa Postman, Thunder Client o cURL. Ver `TESTING_GUIDE.md` para ejemplos completos.

---

### P: ¿Cómo genero datos de prueba?
**R:** Usa los scripts de SQL:
```sql
INSERT INTO usuario (nombre, correo, passwordhash, idrol)
VALUES ('Test', 'test@example.com', '$2a$10$...', 2);
```

O crea usuarios mediante la API:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Prueba",
    "correo": "prueba@test.com",
    "password": "Prueba123"
  }'
```

---

## 7️⃣ Integración

### P: ¿Cómo integro esto con mi frontend?
**R:** Ejemplo con React:

```javascript
// store/authStore.js (Zustand o Context API)
const login = async (correo, password) => {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password })
  });
  
  const data = await res.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    setUser(data.data);
    return true;
  }
  return false;
};

// hook/useAuth.js
const useAuth = () => {
  const token = localStorage.getItem('token');
  
  const fetchProtected = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  };
  
  return { token, fetchProtected };
};
```

---

### P: ¿Necesito CORS?
**R:** Sí, si tu frontend está en otro dominio.

```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
```

---

## 8️⃣ Base de Datos

### P: ¿Dónde se guardan las contraseñas?
**R:** En la tabla `usuario`, columna `passwordhash`.

```sql
SELECT idusuario, correo, passwordhash FROM usuario;
```

**IMPORTANTE:** Nunca hagas SELECT de `passwordhash` en el frontend.

---

### P: ¿Dónde se guardan los tokens?
**R:** En la tabla `sesiones`.

```sql
SELECT * FROM sesiones WHERE idusuario = 1;
```

Columnas:
- `idsesion`: ID único
- `idusuario`: ID del usuario
- `token`: JWT completo
- `fechainicio`: Cuándo se creó
- `ultimaactividad`: Última acción
- `fechaexpiracion`: Cuándo caduca
- `ip`: IP del cliente
- `useragent`: Navegador/dispositivo

---

### P: ¿Cómo elimino sesiones antiguas?
**R:** Una limpieza manual:

```sql
-- Eliminar sesiones expiradas
DELETE FROM sesiones WHERE fechaexpiracion < NOW();
```

Para automatizar, crea un cron:
```javascript
setInterval(async () => {
  await prisma.sesion.deleteMany({
    where: { fechaexpiracion: { lt: new Date() } }
  });
}, 60 * 60 * 1000);  // Cada hora
```

---

## 9️⃣ Problemas Avanzados

### P: ¿Cómo implemento Refresh Tokens?
**R:** Crea un segundo token con más duración:

```javascript
// En auth.controller.js
const refreshToken = jwt.sign(
  { idusuario: usuario.idusuario },
  JWT_SECRET,
  { expiresIn: '7d' }  // Válido por 7 días
);

// Devuelve ambos
return res.json({
  accessToken: token,      // 24h, para peticiones
  refreshToken: refreshToken  // 7d, para renovar
});
```

---

### P: ¿Cómo implemento logout global?
**R:** Invalida todos los tokens del usuario:

```javascript
// En auth.controller.js - nueva función
export const logoutAll = async (req, res) => {
  const { idusuario } = req.usuario;
  
  // Marca TODAS las sesiones como expiradas
  await prisma.sesion.updateMany({
    where: { idusuario },
    data: { fechaexpiracion: new Date() }
  });
  
  return res.json({ success: true, message: 'Logout en todos los dispositivos' });
};
```

---

### P: ¿Cómo implemento 2FA?
**R:** Envía código por email después de login:

```bash
npm install nodemailer
```

```javascript
// Similar a login, pero:
// 1. Valida credenciales
// 2. Genera código (1234)
// 3. Envía por email
// 4. Devuelve token temporal
// 5. Requiere código para acceso final
```

---

### P: ¿Cómo integro con OAuth (Google)?
**R:** Usa Passport.js:

```bash
npm install passport passport-google-oauth20
```

Tema completo → Tutorial separado.

---

## 🔟 Soporte

### P: ¿Dónde encuentro documentación completa?
**R:** 
1. **AUTH_DOCUMENTATION.md** - Documentación técnica
2. **TESTING_GUIDE.md** - Guía de testing
3. **EJEMPLOS_RUTAS_PROTEGIDAS.js** - Ejemplos de código
4. **GUIA_VISUAL_FINAL.txt** - Referencia rápida

---

### P: ¿Si encuentro un error, qué hago?

**Paso 1:** Lee el mensaje de error completo
**Paso 2:** Busca en esta FAQ
**Paso 3:** Revisa AUTH_DOCUMENTATION.md
**Paso 4:** Verifica logs del servidor
**Paso 5:** Prueba con cURL para descartar frontend

---

### P: ¿Puedo modificar los campos del usuario?
**R:** Sí, pero requiere migración de Prisma:

```bash
npx prisma migrate dev --name agregar_nuevo_campo
```

---

### P: ¿Puedo usar esto en producción?
**R:** Sí, pero implementa primero:

✓ HTTPS obligatorio  
✓ Rate limiting  
✓ CORS restrictivo  
✓ Secrets seguros (AWS Secrets Manager)  
✓ Logs y monitoreo  
✓ Backups diarios  
✓ Tests automatizados  

---

╔═════════════════════════════════════════════════════════════════╗
║  ¿Más preguntas?                                               ║
║  1. Lee los documentos incluidos                               ║
║  2. Revisa la consola/logs del servidor                        ║
║  3. Prueba con cURL para confirmar                             ║
║  4. Verifica tu .env está completo                             ║
║                                                                 ║
║  ¡Estás casi listo para tener una API segura! 🔐              ║
╚═════════════════════════════════════════════════════════════════╝

**Última actualización:** 17 de Marzo, 2026
**Proyecto:** ALEX - Sistema de IA Asistente
