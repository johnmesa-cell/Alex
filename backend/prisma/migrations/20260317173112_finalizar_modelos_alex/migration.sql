-- CreateTable
CREATE TABLE "consultas" (
    "idconsulta" SERIAL NOT NULL,
    "idusuario" INTEGER NOT NULL,
    "pregunta" TEXT NOT NULL,
    "respuesta" TEXT,
    "tokens_usados" INTEGER DEFAULT 0,
    "fechaconsulta" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("idconsulta")
);

-- CreateTable
CREATE TABLE "contenidos" (
    "idcontenido" SERIAL NOT NULL,
    "idconsulta" INTEGER NOT NULL,
    "tipo_formato" VARCHAR(50) NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "fechacreacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contenidos_pkey" PRIMARY KEY ("idcontenido")
);

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_idusuario_fkey" FOREIGN KEY ("idusuario") REFERENCES "usuario"("idusuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contenidos" ADD CONSTRAINT "contenidos_idconsulta_fkey" FOREIGN KEY ("idconsulta") REFERENCES "consultas"("idconsulta") ON DELETE CASCADE ON UPDATE CASCADE;
