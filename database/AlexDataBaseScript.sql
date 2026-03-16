-- Crear la base de datos si no existe (ejecutar como superuser)
SELECT 'CREATE DATABASE alexdb'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'alexdb')\gexec

-- Conectar a la base de datos (para psql) o usar en cliente: \c alexdb
-- Si usas pgAdmin o driver, conéctate directamente a alexdb

-- Ahora las tablas en alexdb (asumiendo conexión activa)
CREATE TABLE roles (
    idrol SERIAL PRIMARY KEY,
    nombrerol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE usuario (
    idusuario SERIAL PRIMARY KEY,
    idrol INTEGER NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    passwordhash TEXT NOT NULL,
    fecharegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimologin TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'activo',
    CONSTRAINT fk_usuario_rol FOREIGN KEY (idrol) REFERENCES roles(idrol) ON DELETE RESTRICT
);

CREATE TABLE sesiones (
    idsesion SERIAL PRIMARY KEY,
    idusuario INTEGER NOT NULL,
    token TEXT NOT NULL,
    fechainicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimaactividad TIMESTAMP,
    fechaexpiracion TIMESTAMP,
    ip VARCHAR(45),
    useragent TEXT,
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (idusuario) REFERENCES usuario(idusuario) ON DELETE CASCADE
);

CREATE TABLE registros (
    idregistro SERIAL PRIMARY KEY,
    idcreador INTEGER NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechaactualizacion TIMESTAMP,
    fechaeliminacion TIMESTAMP,
    CONSTRAINT fk_registro_usuario FOREIGN KEY (idcreador) REFERENCES usuario(idusuario) ON DELETE CASCADE
);

CREATE TABLE auditoria (
    idevento SERIAL PRIMARY KEY,
    idusuario INTEGER,
    accion VARCHAR(50) NOT NULL,
    tablaafectada VARCHAR(100),
    idregistroafectado INTEGER,
    valoranterior TEXT,
    valornuevo TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(45),
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (idusuario) REFERENCES usuario(idusuario) ON DELETE SET NULL
);

CREATE TABLE notificaciones (
    idnotificacion SERIAL PRIMARY KEY,
    idusuario INTEGER NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50),
    leida BOOLEAN DEFAULT FALSE,
    fechaenvio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (idusuario) REFERENCES usuario(idusuario) ON DELETE CASCADE
);

CREATE TABLE reportes (
    idreporte SERIAL PRIMARY KEY,
    idusuario INTEGER NOT NULL,
    nombre VARCHAR(150),
    descripcion TEXT,
    configuracion TEXT,
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reporte_usuario FOREIGN KEY (idusuario) REFERENCES usuario(idusuario) ON DELETE CASCADE
);

CREATE TABLE reportesprogramados (
    idprogramacion SERIAL PRIMARY KEY,
    idreporte INTEGER NOT NULL,
    frecuencia VARCHAR(50),
    fechaproximaejecucion TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_programacion_reporte FOREIGN KEY (idreporte) REFERENCES reportes(idreporte) ON DELETE CASCADE
);
