-- CreateTable
CREATE TABLE "roles" (
    "idrol" SERIAL NOT NULL,
    "nombrerol" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("idrol")
);

-- CreateTable
CREATE TABLE "usuario" (
    "idusuario" SERIAL NOT NULL,
    "idrol" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "passwordhash" TEXT NOT NULL,
    "fecharegistro" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "ultimologin" TIMESTAMP(3),
    "estado" VARCHAR(20) DEFAULT 'activo',

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("idusuario")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "idsesion" SERIAL NOT NULL,
    "idusuario" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "fechainicio" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "ultimaactividad" TIMESTAMP(3),
    "fechaexpiracion" TIMESTAMP(3),
    "ip" VARCHAR(45),
    "useragent" TEXT,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("idsesion")
);

-- CreateTable
CREATE TABLE "registros" (
    "idregistro" SERIAL NOT NULL,
    "idcreador" INTEGER NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "categoria" VARCHAR(100),
    "activo" BOOLEAN DEFAULT true,
    "fechacreacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fechaactualizacion" TIMESTAMP(3),
    "fechaeliminacion" TIMESTAMP(3),

    CONSTRAINT "registros_pkey" PRIMARY KEY ("idregistro")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombrerol_key" ON "roles"("nombrerol");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_idrol_fkey" FOREIGN KEY ("idrol") REFERENCES "roles"("idrol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_idusuario_fkey" FOREIGN KEY ("idusuario") REFERENCES "usuario"("idusuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_idcreador_fkey" FOREIGN KEY ("idcreador") REFERENCES "usuario"("idusuario") ON DELETE CASCADE ON UPDATE CASCADE;
